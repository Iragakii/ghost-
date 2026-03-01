import * as THREE from 'three';
import { suppressCORSErrors } from '../utils/CORSErrorSuppressor.js';

/**
 * Creates a video screen with glitch/distortion shader effects
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {string} videoPath - Path to video file (e.g., '/video.mp4')
 * @param {Object} options - Configuration options
 * @returns {Object} - Returns { screenMesh, video, update } for animation loop
 */
export function createVideoScreen(scene, videoPath = '/mojito.mp4', options = {}) {
    const {
        width = 20,
        height = 12,
        position = new THREE.Vector3(0, 8, -15), // Default spawn location
        rotation = new THREE.Euler(0, 0, 0),
        distortionIntensity = 0.02,
        glitchIntensity = 0.1,
        emissiveIntensity = 1.5,
        borderRadius = 1.0 // Border radius in normalized coordinates (0-1)
    } = options;

    // Create video element
    // IMPORTANT: Set crossOrigin BEFORE setting src to avoid CORS errors
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous'; // Must be set before src
    video.src = videoPath;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.style.display = 'none';
    document.body.appendChild(video);
    
    // Suppress CORS errors for this video (they're harmless - shader shows fallback)
    suppressCORSErrors();

    // Handle video load errors gracefully (suppress CORS warnings)
    video.addEventListener('error', (e) => {
        const error = video.error;
        if (error) {
            if (error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                // CORS or format issue - video will show fallback pattern
                // Don't spam console with warnings
            } else if (error.code === MediaError.MEDIA_ERR_ABORTED) {
                // Video loading was aborted - normal, don't warn
            } else {
                // Only log actual errors (not CORS issues)
                console.warn('Video file not found or failed to load:', videoPath, 'Error code:', error.code);
            }
        }
        // Screen will display with glitch effects but no video content (handled by shader)
    });

    // Create video texture with error handling for CORS issues
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.generateMipmaps = false;
    videoTexture.flipY = true; // Flip Y to correct video orientation
    
    // Suppress CORS errors in WebGL (they're logged but don't break rendering)
    // The shader will show fallback pattern if video fails to load
    const originalError = console.error;
    const suppressCORS = (message) => {
        if (typeof message === 'string' && message.includes('cross-origin') && message.includes('texImage2D')) {
            // Suppress CORS errors - video will show fallback pattern instead
            return;
        }
        originalError.apply(console, arguments);
    };

    // Glitch/Distortion Shader Material
    const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { value: videoTexture },
            uTime: { value: 0 },
            uDistortionIntensity: { value: distortionIntensity },
            uGlitchIntensity: { value: glitchIntensity },
            uEmissiveIntensity: { value: emissiveIntensity },
            uBorderRadius: { value: borderRadius }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D uTexture;
            uniform float uTime;
            uniform float uDistortionIntensity;
            uniform float uGlitchIntensity;
            uniform float uEmissiveIntensity;
            uniform float uBorderRadius;
            varying vec2 vUv;

            // Random function for glitch
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            // Noise function
            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }

            void main() {
                vec2 uv = vUv;
                
                // Time-based glitch effect
                float glitchTime = floor(uTime * 10.0);
                float glitchRandom = random(vec2(glitchTime));
                
                // Horizontal glitch lines
                float glitchLine = step(0.98, random(vec2(glitchTime, floor(uv.y * 20.0))));
                float glitchOffset = (glitchRandom - 0.5) * uGlitchIntensity * glitchLine;
                
                // Sample texture with distortion (no RGB separation)
                float distortion = noise(uv * 10.0 + uTime) * uDistortionIntensity;
                vec2 distortedUv = uv + vec2(distortion, distortion * 0.5);
                
                // Apply glitch offset
                vec2 finalUv = uv + vec2(glitchOffset, 0.0) + (distortedUv - uv);
                
                // Get texture color (all channels together, no separation)
                // Use texture2D for compatibility (works in both WebGL 1 and 2)
                vec4 texColor = texture2D(uTexture, clamp(finalUv, 0.0, 1.0));
                vec3 color = texColor.rgb;
                
                // Only use fallback if texture is completely black (video not loaded)
                // Use a lower threshold to avoid interfering with dark video content
                float brightness = (color.r + color.g + color.b) / 3.0;
                if (brightness < 0.001 && texColor.a < 0.1) {
                    // Video not loaded, show fallback pattern
                    color = vec3(
                        0.5 + 0.5 * sin(uTime + uv.x * 10.0),
                        0.5 + 0.5 * sin(uTime * 1.1 + uv.y * 10.0),
                        0.5 + 0.5 * sin(uTime * 1.2 + (uv.x + uv.y) * 10.0)
                    );
                }
                
                // Add scanline effect (subtle)
                float scanline = sin(uv.y * 800.0) * 0.01 + 1.0;
                color *= scanline;
                
                // Add brightness/emissive glow (only if needed)
                // Don't multiply if emissiveIntensity is 1.0 to preserve original colors
                if (uEmissiveIntensity != 1.0) {
                    color *= uEmissiveIntensity;
                }
                
                // Add occasional full-screen glitch flash
                float flash = step(0.995, random(vec2(glitchTime * 0.1)));
                color += flash * 0.3;
                
                // Apply border radius (rounded corners)
                // Calculate distance from center
                vec2 center = vec2(0.5, 0.5);
                vec2 dist = abs(uv - center);
                
                // Calculate corner distance
                vec2 cornerDist = dist - (vec2(0.5) - vec2(uBorderRadius));
                float cornerRadius = length(max(cornerDist, vec2(0.0)));
                
                // Discard pixels outside rounded rectangle
                if (cornerRadius > uBorderRadius) {
                    discard;
                }
                
                gl_FragColor = vec4(color, 1.0);
            }
        `,
        side: THREE.DoubleSide,
        toneMapped: false // Keep colors bright like LED screen
    });

    // Create screen geometry
    const geometry = new THREE.PlaneGeometry(width, height);
    const screenMesh = new THREE.Mesh(geometry, shaderMaterial);
    
    // Position and rotate
    screenMesh.position.copy(position);
    screenMesh.rotation.copy(rotation);
    
    // Add to scene
    scene.add(screenMesh);

    // Try to play video (requires user interaction in most browsers)
    const playVideo = () => {
        video.play().catch(err => {
            console.log('Video autoplay blocked, will play after user interaction:', err);
        });
    };

    // Try to play immediately
    playVideo();

    // Also try to play on user interaction
    const handleInteraction = () => {
        playVideo();
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
    };
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });

    // Update function for animation loop
    const update = (time) => {
        if (shaderMaterial.uniforms) {
            shaderMaterial.uniforms.uTime.value = time;
        }
        // Update video texture each frame (required for video playback)
        // Only update if video is ready and not in error state
        if (videoTexture && video.readyState >= 2 && !video.error) {
            try {
                videoTexture.needsUpdate = true;
            } catch (e) {
                // Silently handle CORS errors - shader will show fallback pattern
                if (!e.message || !e.message.includes('cross-origin')) {
                    // Only log non-CORS errors
                    console.warn('Video texture update error:', e);
                }
            }
        }
    };

    // Function to change video source (with optional preloaded video)
    const changeVideoSource = (newVideoPath, preloadedVideoElement = null) => {
        video.pause();
        
        // If we have a preloaded video element, use it instead
        if (preloadedVideoElement && preloadedVideoElement.readyState >= 3) {
            // Preloaded video is ready, swap the src
            video.src = preloadedVideoElement.src;
            video.currentTime = preloadedVideoElement.currentTime || 0;
            video.load();
            // Try to play immediately since it's preloaded
            video.play().catch(err => {
                console.log('Video autoplay blocked:', err);
            });
        } else {
            // Fallback: load normally
            video.src = newVideoPath;
            video.load();
            video.play().catch(err => {
                console.log('Video autoplay blocked:', err);
            });
        }
    };

    // Function to set image texture
    const setImageTexture = (imagePath) => {
        const loader = new THREE.TextureLoader();
        loader.load(imagePath, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
            if (shaderMaterial.uniforms && shaderMaterial.uniforms.uTexture) {
                // Dispose old texture if it's not the video texture
                const oldTexture = shaderMaterial.uniforms.uTexture.value;
                if (oldTexture !== videoTexture && oldTexture.dispose) {
                    oldTexture.dispose();
                }
                shaderMaterial.uniforms.uTexture.value = texture;
            }
        }, undefined, (error) => {
            console.error('Error loading image:', error);
        });
    };

    // Function to restore video texture
    const restoreVideoTexture = () => {
        if (shaderMaterial.uniforms && shaderMaterial.uniforms.uTexture) {
            const oldTexture = shaderMaterial.uniforms.uTexture.value;
            if (oldTexture !== videoTexture && oldTexture.dispose) {
                oldTexture.dispose();
            }
            shaderMaterial.uniforms.uTexture.value = videoTexture;
            video.play().catch(err => {
                console.log('Video autoplay blocked:', err);
            });
        }
    };

    return {
        screenMesh,
        video,
        update,
        play: playVideo,
        pause: () => video.pause(),
        setVolume: (volume) => { video.volume = volume; },
        setDistortionIntensity: (intensity) => {
            if (shaderMaterial.uniforms) {
                shaderMaterial.uniforms.uDistortionIntensity.value = intensity;
            }
        },
        setGlitchIntensity: (intensity) => {
            if (shaderMaterial.uniforms) {
                shaderMaterial.uniforms.uGlitchIntensity.value = intensity;
            }
        },
        changeVideoSource,
        setImageTexture,
        restoreVideoTexture,
        material: shaderMaterial,
        videoTexture
    };
}

