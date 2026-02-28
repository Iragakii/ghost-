import * as THREE from 'three';
import { createScene } from '../scenes/Scene.js';
import { createLuvu } from '../components/Luvu.js';
import { updateExpressionAnimation } from '../components/LuvuExpressions.js';
import { createCactus, updateCactusAnimation } from '../components/Cactus.js';
import { createIppoac, updateIppoacAnimation } from '../components/Ippoac.js';
import { createParticles } from '../particles/Particles.js';
import { createPinwheels } from '../particles/Pinwheels.js';
import { loadAllCharacters} from '../characters/CharacterLoader.js';
import { updateCharacterInteractions } from '../characters/CharacterInteractions.js';
import { initAudio } from '../audio/AudioManager.js';
import { initInput } from '../input/InputHandler.js';
import { createVideoScreen } from '../components/VideoScreen.js';
import { optimizeAllCharacters, optimizeObjectByDistance, DISTANCE_THRESHOLDS } from '../utils/PerformanceOptimizer.js';
import { initLoadingScreen, setTotalAssets, incrementLoaded, forceCompleteLoading, onLoadingComplete } from '../utils/LoadingScreen.js';
import { initFPSCounter, updateFPSCounter } from '../utils/FPSCounter.js';
import { initPerformanceOptimizations, reusableObjects } from '../utils/PerformanceStabilizer.js';
import { cullObjectsOutsideView } from '../utils/FrustumCuller.js';

let scene, camera, renderer;
let luvuGroup, cactusGroup, ippoacGroup;
let particles, pinwheels;
let characterModels = [];
let characterTimeouts = [];
let newCharacterGroup = null;
let audioData = null;
let videoScreen = null;

// Game state
const gameState = {
    keys: {},
    isMouseDown: false,
    mouseX: 0,
    mouseY: 0,
    cameraRotationY: 0,
    cameraRotationX: 0,
    luvuVel: new THREE.Vector3(),
    cactusVel: new THREE.Vector3(),
    luvuCanJump: true,
    isHugging: false,
    neckStretch: 1.0,
    closestCharIndex: -1,
    isNewCharClose: false,
    currentExpression: 'neutral',
    isAngleSoundPlaying: false,
    isAngleSongPlaying: false,
    isMusicPlaying: true,
    musicWasPlayingBeforeAngle: false, // Track if music was playing before angle.mp3
    hasUserInteracted: false,
    terrainUpdateFrame: 0,
    isFollowingCactus: false,
    isFollowingIppoac: false,
    ippoacIsInteracting: false,
    ippoacChatTimeout: null,
    ippoacAnimationKey: null,
    ippoacVel: new THREE.Vector3(),
    minescarIsInteracting: false,
    minescarChatTimeout: null,
    minescarVideoScreen: null,
    handeyeIsInteracting: false,
    handeyeChatTimeout: null,
    eyeballpModelsDown: false, // Track if eyeballp models are down
    cactusIsInteracting: false,
    cactusChatTimeout: null
};

// Constants
const SPEED =39;
const SPEED2 = 30;
const GRAVITY = 30;
const JUMP = 15;
const INTERACTION_DISTANCE = 8;
const MOUSE_SENSITIVITY = 0.004;
const MIN_PITCH = -Math.PI / 3;
const MAX_PITCH = Math.PI / 3;

const camOffset = new THREE.Vector3(0, 6, 16);
const camTarget = new THREE.Vector3();
// Reusable camera offsets (never allocate in loop)
const ippoacCamOffset = new THREE.Vector3(0, 30, 25);
const cactusCamOffset = new THREE.Vector3(0, 15, 20);

export function initGame() {
    // Initialize loading screen first
    initLoadingScreen();
    
    // Count total assets to load
    // Main characters: 3 (Luvu, Cactus, Ippoac)
    // Character models: ~20 (from loadAllCharacters)
    // Video screens: 4 (they load async, but we'll use LoadingManager)
    // Biar/Biab: 2
    // Note: LoadingManager will track all GLB files automatically
    // We'll use a timeout fallback to ensure loading completes
    setTotalAssets(1); // Will be managed by LoadingManager
    
    // Initialize scene IMMEDIATELY (don't wait for models)
    // This improves LCP by showing the scene right away
    const sceneData = createScene();
    scene = sceneData.scene;
    camera = sceneData.camera;
    renderer = sceneData.renderer;
    
    // Initialize FPS counter with renderer info
    initFPSCounter(renderer);
    
    // Start rendering immediately with basic scene (terrain, sky, lights)
    // This ensures LCP happens as soon as possible
    renderer.render(scene, camera);
    
    const container = sceneData.container;
    const floorGeo = sceneData.floorGeo;
    const getTerrainY = sceneData.getTerrainY;
    const pinkLight = sceneData.pinkLight;
    const blueLight = sceneData.blueLight;

    // Create characters
    luvuGroup = createLuvu(scene);
    cactusGroup = createCactus(scene);
    ippoacGroup = createIppoac(scene);

    // Create particles
    particles = createParticles(scene);
    
    // Create pinwheels
    pinwheels = createPinwheels(scene);

    // Create video screen at spawn location
    // Place your video file in /public/video.mp4
    // If video file doesn't exist, it will show a colored screen with glitch effects
    try {
        videoScreen = createVideoScreen(scene, '/video.mp4', {
            width: 100,
            height: 50,
            position: new THREE.Vector3(290, 27, 0), // In front of spawn, facing camera
            rotation: new THREE.Euler(0, Math.PI / 2, 0), // Rotate 90 degrees to the left
            distortionIntensity: 0.02,  // Distortion amount (0-1)
            glitchIntensity: 0.1,       // Glitch effect intensity (0-1)
            emissiveIntensity: 1.5,     // Screen brightness/glow
            borderRadius: 0.08           // Border radius (0-0.5, higher = more rounded)
        });
    } catch (error) {
        console.log('Video screen creation error (video file may not exist):', error);
    }
 try {
        videoScreen = createVideoScreen(scene, '/video.mp4', {
            width: 100,
            height: 50,
            position: new THREE.Vector3(196.3, 80, 195), // In front of spawn, facing camera
            rotation: new THREE.Euler(0, Math.PI , 0), // Rotate 90 degrees to the left
            distortionIntensity: 0.02,  // Distortion amount (0-1)
            glitchIntensity: 0.1,       // Glitch effect intensity (0-1)
            emissiveIntensity: 1.5,     // Screen brightness/glow
            borderRadius: 1          // Border radius (0-0.5, higher = more rounded)
        });
    } catch (error) {
        console.log('Video screen creation error (video file may not exist):', error);
    }

    // Create video screen behind f.glb model (screen 3)
    let fVideoScreen = null;
    try {
        fVideoScreen = createVideoScreen(scene, '/videoo.mp4', {
            width: 35,
            height: 20,
            position: new THREE.Vector3(-180, 25, -85), // Behind f.glb (f.glb is at z: -40)
            rotation: new THREE.Euler(0, -Math.PI , 0), // Same rotation as f.glb
            distortionIntensity: 0.02,
            glitchIntensity: 0.1,
            emissiveIntensity: 1.5,
            borderRadius: 0.08
        });
    } catch (error) {
        console.log('F video screen creation error (videoo.mp4 may not exist):', error);
    }

    // Create video screen above biar.glb model (videoippo)
    let biarVideoScreen = null;
    try {
        biarVideoScreen = createVideoScreen(scene, '/playground/videoippo.mp4', {
            width: 25,
            height: 17,
            position: new THREE.Vector3(10, 25, 150), // Above biar.glb (biar is at x: 10, y: 10, z: 150)
            rotation: new THREE.Euler(0, -Math.PI , 0), // Face forward
            distortionIntensity: 0.02,
            glitchIntensity: 0.1,
            emissiveIntensity: 1.5,
            borderRadius: 0.08
        });
    } catch (error) {
        console.log('Biar video screen creation error (videoippo.mp4 may not exist):', error);
    }

    // Create video screen above biab.glb model (videoape)
    let biabVideoScreen = null;
    try {
        biabVideoScreen = createVideoScreen(scene, '/playground/videoape.mp4', {
            width: 25,
            height: 17,
            position: new THREE.Vector3(10, 25, 200), // Above biab.glb (biab is at x: 10, y: 10, z: 200)
            rotation: new THREE.Euler(0, -Math.PI, 0), // Face forward (same as biab)
            distortionIntensity: 0.02,
            glitchIntensity: 0.1,
            emissiveIntensity: 1.5,
            borderRadius: 0.08
        });
    } catch (error) {
        console.log('Biab video screen creation error (videoape.mp4 may not exist):', error);
    }

    // Create video screen above biagr.glb model (green)
    let biagrVideoScreen = null;
    try {
        biagrVideoScreen = createVideoScreen(scene, '/pinklocation/green.mp4', {
            width: 25,
            height: 17,
            position: new THREE.Vector3(30, 25, 175), // Above biagr.glb (biagr is at x: 20, y: 10, z: 175)
            rotation: new THREE.Euler(0, -Math.PI / 2, 0), // Face forward (same as biar/biab)
            distortionIntensity: 0.02,
            glitchIntensity: 0.1,
            emissiveIntensity: 1.5,
            borderRadius: 0.08
        });
    } catch (error) {
        console.log('Biagr video screen creation error (green.mp4 may not exist):', error);
    }

    // Create video screen next to tomato.glb model (leaf1)
    let leaf1VideoScreen = null;
    try {
        leaf1VideoScreen = createVideoScreen(scene, '/pinklocation/leaf1.mp4', {
            width: 15,
            height: 8,
            position: new THREE.Vector3(196.3, 25, 127), // To the left of tomato (tomato is at x: 200, y: 25, z: 130)
            rotation: new THREE.Euler(0, -Math.PI , 0), // Same rotation as tomato
            distortionIntensity: 0.02,
            glitchIntensity: 0.1,
            emissiveIntensity: 1.5,
            borderRadius: 1
        });
    } catch (error) {
        console.log('Leaf1 video screen creation error (leaf1.mp4 may not exist):', error);
    }

    // Create video screen next to tomato.glb model (leaf2)
    let leaf2VideoScreen = null;
    try {
        leaf2VideoScreen = createVideoScreen(scene, '/pinklocation/leaf2.mp4', {
            width: 15,
            height: 10,
            position: new THREE.Vector3(208.1, 20, 127), // To the right of tomato (tomato is at x: 200, y: 25, z: 130)
            rotation: new THREE.Euler(0, Math.PI, 0), // Same rotation as tomato
            distortionIntensity: 0.02,
            glitchIntensity: 0.1,
            emissiveIntensity: 1.5,
            borderRadius: 1
        });
    } catch (error) {
        console.log('Leaf2 video screen creation error (leaf2.mp4 may not exist):', error);
    }

    // Create video screen next to blueto.glb model (bg)
    let bgVideoScreen = null;
    try {
        bgVideoScreen = createVideoScreen(scene, '/pinklocation/bga.mp4', {
            width: 20,
            height: 8,
            position: new THREE.Vector3(190, 19, 300), // To the left of blueto (blueto is at x: 190, y: 23, z: 290)
            rotation: new THREE.Euler(0, Math.PI / 2, 0), // Same rotation as blueto
            distortionIntensity: 0.02,
            glitchIntensity: 0.1,
            emissiveIntensity: 1.5,
            borderRadius: 1
        });
    } catch (error) {
        console.log('Bg video screen creation error (bg.mp4 may not exist):', error);
    }

    // Create video screen next to blueto.glb model (pga)
    let pgaVideoScreen = null;
    try {
        pgaVideoScreen = createVideoScreen(scene, '/pinklocation/pga.mp4', {
            width: 23,
            height: 10,
            position: new THREE.Vector3(190, 23, 284), // To the right of blueto (blueto is at x: 190, y: 23, z: 290)
            rotation: new THREE.Euler(0, Math.PI / 2, 0), // Same rotation as blueto
            distortionIntensity: 0.02,
            glitchIntensity: 0.1,
            emissiveIntensity: 1.5,
            borderRadius: 1
        });
    } catch (error) {
        console.log('Pga video screen creation error (pga.mp4 may not exist):', error);
    }

    // Store characterModels in gameState so AudioManager can access it
    gameState.characterModels = characterModels;
    
    // Initialize audio
    audioData = initAudio(gameState);
    
    // Initialize input
    initInput(gameState, luvuGroup, cactusGroup, ippoacGroup, characterModels, characterTimeouts, newCharacterGroup, audioData, scene);

    // Load characters
    loadAllCharacters(scene, characterModels, characterTimeouts, gameState, audioData).then(group => {
        newCharacterGroup = group;
    });

    // Load biar.glb and biab.glb models at spawn location next to cactus
 
    // Fallback: Force complete loading after 10 seconds if LoadingManager doesn't fire
    // This ensures the game starts even if some assets fail to load
    // The loading screen will ensure minimum 4s + actual loading time before hiding
    setTimeout(() => {
        forceCompleteLoading();
    }, 10000);

    // Initialize performance optimizations (adaptive DPR disabled to prevent input lag)
    const perfOpts = initPerformanceOptimizations(renderer, {
        minDPR: 0.5,
        maxDPR: 1.5,
        targetFPS: 60
    });
    // Disable adaptive DPR - it causes input lag and INP issues
    perfOpts.adaptiveDPR.isEnabled = false;
    
    // Start animation loop IMMEDIATELY (don't wait for models)
    // This ensures the scene is visible right away for better LCP
    const clock = new THREE.Clock();
    
    // Start animation loop immediately - scene is already visible
    animate();
    
    function animate() {
        requestAnimationFrame(animate);
        const rawDelta = clock.getDelta();
        const delta = Math.min(rawDelta, 0.1);
        const time = clock.getElapsedTime();
        
        // Update adaptive DPR (but don't skip frames - causes input lag)
        perfOpts.adaptiveDPR.update(delta);

        // Keep background music playing if it should be (but not while ang.mp3, custom song, or f video is playing)
        // Only try to play if user has interacted (to avoid autoplay errors)
        if (audioData && audioData.bgMusic && gameState.hasUserInteracted) {
            if (gameState.isMusicPlaying && audioData.bgMusic.paused && !gameState.isAngleSoundPlaying && !gameState.isAngleSongPlaying && !gameState.isFVideoPlaying) {
                audioData.bgMusic.volume = 0.3; // Restore volume
                audioData.bgMusic.play().catch(() => {
                    // Silently handle play errors (user might not have interacted yet)
                });
            }
        }
        
        // Update button text to match current state
        if (audioData && audioData.updateMusicButton) {
            audioData.updateMusicButton(gameState);
        }

        // Update terrain
        gameState.terrainUpdateFrame++;
        if (gameState.terrainUpdateFrame % 2 === 0) {
            const posAttr = floorGeo.attributes.position;
            for (let i = 0; i < posAttr.count; i++) {
                posAttr.setZ(i, getTerrainY(posAttr.getX(i), posAttr.getY(i), time));
            }
            floorGeo.computeVertexNormals();
            posAttr.needsUpdate = true;
        }

        // Update camera
        // Calculate camera angle based on which character we're following
        let targetGroup = luvuGroup;
        if (gameState.isFollowingIppoac) {
            targetGroup = ippoacGroup;
        } else if (gameState.isFollowingCactus) {
            targetGroup = cactusGroup;
        }
        const camAngle = Math.atan2(camera.position.x - targetGroup.position.x, camera.position.z - targetGroup.position.z);
        
        // Update cactus
        updateCactus(delta, time, camAngle, getTerrainY, gameState, cactusGroup);
        
        // Update ippoac only when following ippoac (user is controlling it)
        if (gameState.isFollowingIppoac) {
            updateIppoac(delta, time, camAngle, getTerrainY, gameState, ippoacGroup);
        } else {
            // When not following ippoac, stop all movement and only update Y position for terrain
            if (ippoacGroup) {
                // Reset velocity to prevent any movement
                gameState.ippoacVel.x = 0;
                gameState.ippoacVel.z = 0;
                // Only update Y position for terrain (keep it on ground)
                ippoacGroup.position.y = getTerrainY(ippoacGroup.position.x, ippoacGroup.position.z, time) + 1.2;
            }
        }
        
        // Update luvu
        updateLuvu(delta, time, camAngle, getTerrainY, gameState, particles, luvuGroup, cactusGroup, audioData);
        
        // Update particles (every 2 frames for better performance)
        if (gameState.terrainUpdateFrame % 2 === 0) {
            particles.update(delta, time);
            pinwheels.update(delta, time);
        }

        // Update eyeballp rotation animation (smooth left-right oscillation)
        for (let i = 0; i < characterModels.length; i++) {
            const char = characterModels[i];
            if (char && char.isEyeballp && char.group && char.baseRotationY !== undefined) {
                // Oscillate between baseRotationY - 10 and baseRotationY + 10
                // 20 second cycle (10 seconds each direction)
                const oscillationRange = 1; // ±10 degrees/units
                const cycleDuration = 20; // 20 seconds for full cycle
                const oscillation = Math.sin((time * 2 * Math.PI) / cycleDuration) * oscillationRange;
                char.group.rotation.y = char.baseRotationY + oscillation;
                
                // Smooth Y position animation (down/up)
                if (char.originalY !== undefined && char.targetY !== undefined) {
                    // Smoothly interpolate to target Y position
                    const lerpSpeed = 3.0; // Speed of interpolation
                    const currentY = char.group.position.y;
                    const newY = currentY + (char.targetY - currentY) * lerpSpeed * delta;
                    char.group.position.y = newY;
                }
            }
        }

        // Update video screen shader (only if not skipped for performance, and every 2 frames)
        if (gameState.terrainUpdateFrame % 2 === 0) {
            if (videoScreen && !videoScreen.skipUpdate) {
                videoScreen.update(time);
            }
            // Update f video screen shader (screen 3)
            if (fVideoScreen && !fVideoScreen.skipUpdate) {
                fVideoScreen.update(time);
            }
            // Update biar video screen shader
            if (biarVideoScreen && !biarVideoScreen.skipUpdate) {
                biarVideoScreen.update(time);
            }
            // Update biab video screen shader
            if (biabVideoScreen && !biabVideoScreen.skipUpdate) {
                biabVideoScreen.update(time);
            }
            // Update biagr video screen shader
            if (biagrVideoScreen && !biagrVideoScreen.skipUpdate) {
                biagrVideoScreen.update(time);
            }
            // Update leaf1 video screen shader
            if (leaf1VideoScreen && !leaf1VideoScreen.skipUpdate) {
                leaf1VideoScreen.update(time);
            }
            // Update leaf2 video screen shader
            if (leaf2VideoScreen && !leaf2VideoScreen.skipUpdate) {
                leaf2VideoScreen.update(time);
            }
            // Update bg video screen shader
            if (bgVideoScreen && !bgVideoScreen.skipUpdate) {
                bgVideoScreen.update(time);
            }
            // Update pga video screen shader
            if (pgaVideoScreen && !pgaVideoScreen.skipUpdate) {
                pgaVideoScreen.update(time);
            }
            // Update minescar video screen shader
            if (gameState.minescarVideoScreen && !gameState.minescarVideoScreen.skipUpdate) {
                gameState.minescarVideoScreen.update(time);
            }
        }

        // Update camera position
        updateCamera(delta, gameState, pinkLight, blueLight);

        // Optimize all objects based on distance (freeze animations, disable shadows when far)
        let targetPosition = luvuGroup.position;
        if (gameState.isFollowingIppoac) {
            targetPosition = ippoacGroup.position;
        } else if (gameState.isFollowingCactus) {
            targetPosition = cactusGroup.position;
        }
        
        // Optimize all character models (only every 2 frames to reduce CPU load)
        if (gameState.terrainUpdateFrame % 2 === 0) {
            optimizeAllCharacters(characterModels, targetPosition, scene);
            
            // Optimize main characters (cactus, ippoac) if they exist
            // Use reusable objects instead of creating new Vector3 every frame
            if (cactusGroup) {
                cactusGroup.getWorldPosition(reusableObjects.vector3_1);
                const cactusDistance = targetPosition.distanceTo(reusableObjects.vector3_1);
                optimizeObjectByDistance(cactusGroup, cactusDistance, targetPosition);
            }
            if (ippoacGroup) {
                ippoacGroup.getWorldPosition(reusableObjects.vector3_2);
                const ippoacDistance = targetPosition.distanceTo(reusableObjects.vector3_2);
                optimizeObjectByDistance(ippoacGroup, ippoacDistance, targetPosition);
            }
        }
        
        // Optimize video screens (disable updates when far)
        const optimizeVideoScreen = (videoScreenObj) => {
            if (videoScreenObj && videoScreenObj.mesh) {
                videoScreenObj.mesh.getWorldPosition(reusableObjects.vector3_3);
                const screenDistance = targetPosition.distanceTo(reusableObjects.vector3_3);
                if (screenDistance > DISTANCE_THRESHOLDS.FREEZE_ANIMATION) {
                    // Don't update video shader when far (saves GPU)
                    videoScreenObj.skipUpdate = true;
                } else {
                    videoScreenObj.skipUpdate = false;
                }
                // Disable shadows when far
                optimizeObjectByDistance(videoScreenObj.mesh, screenDistance, targetPosition);
            }
        };
        
        if (videoScreen) optimizeVideoScreen(videoScreen);
        if (fVideoScreen) optimizeVideoScreen(fVideoScreen);
        if (biarVideoScreen) optimizeVideoScreen(biarVideoScreen);
        if (biabVideoScreen) optimizeVideoScreen(biabVideoScreen);
        if (biagrVideoScreen) optimizeVideoScreen(biagrVideoScreen);
        if (leaf1VideoScreen) optimizeVideoScreen(leaf1VideoScreen);
        if (leaf2VideoScreen) optimizeVideoScreen(leaf2VideoScreen);
        if (bgVideoScreen) optimizeVideoScreen(bgVideoScreen);
        if (pgaVideoScreen) optimizeVideoScreen(pgaVideoScreen);

        // Frustum culling - hide objects outside camera view (every 2 frames)
        // This prevents FPS drops when rotating camera and many objects come into view
        cullObjectsOutsideView(scene, camera, characterModels);

        // Update character interactions (only every 2 frames to reduce CPU load)
        if (gameState.terrainUpdateFrame % 2 === 0) {
            updateCharacterInteractions(camera, gameState, luvuGroup, characterModels, characterTimeouts, newCharacterGroup, cactusGroup, ippoacGroup, time);
        }

        // Update FPS counter
        updateFPSCounter();
        
        // Update performance stats (only in development)
        if (process.env.NODE_ENV === 'development') {
            perfOpts.stats.update();
        }

        renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    let resizeTimeout = null;
    window.addEventListener('resize', () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(innerWidth, innerHeight);
        }, 100);
    }, { passive: true });
}

// Reusable vectors for movement (never allocate in loop)
const cactusMoveDir = new THREE.Vector3();
const ippoacMoveDir = new THREE.Vector3();
const luvuMoveDir = new THREE.Vector3();

function updateCactus(delta, time, camAngle, getTerrainY, state, cactusGroup) {
    cactusMoveDir.set(0, 0, 0);
    if (state.keys['arrowup']) cactusMoveDir.z -= 1;
    if (state.keys['arrowdown']) cactusMoveDir.z += 1;
    if (state.keys['arrowleft']) cactusMoveDir.x -= 1;
    if (state.keys['arrowright']) cactusMoveDir.x += 1;
    cactusMoveDir.normalize();

    const isRunning = cactusMoveDir.lengthSq() > 0;
    
    // Update animation based on movement
    updateCactusAnimation(cactusGroup, delta, isRunning);
    
    if (isRunning) {
        const mx = cactusMoveDir.x * Math.cos(camAngle) + cactusMoveDir.z * Math.sin(camAngle);
        const mz = -cactusMoveDir.x * Math.sin(camAngle) + cactusMoveDir.z * Math.cos(camAngle);
        state.cactusVel.x = mx * SPEED2;
        state.cactusVel.z = mz * SPEED2;
        // Calculate target rotation - face the direction of movement, rotated 90 degrees to the left
        const targetRot = Math.atan2(state.cactusVel.x, state.cactusVel.z) - Math.PI / 2;
        cactusGroup.rotation.y = lerpAngle(cactusGroup.rotation.y, targetRot, 10 * delta);
    } else {
        state.cactusVel.x *= (1 - 10 * delta);
        state.cactusVel.z *= (1 - 10 * delta);
    }
    
    cactusGroup.position.x += state.cactusVel.x * delta;
    cactusGroup.position.z += state.cactusVel.z * delta;
    cactusGroup.position.y = getTerrainY(cactusGroup.position.x, cactusGroup.position.z, time) + 1.2;
}

function updateIppoac(delta, time, camAngle, getTerrainY, state, ippoacGroup) {
    ippoacMoveDir.set(0, 0, 0);
    if (state.keys['w']) ippoacMoveDir.z -= 1;
    if (state.keys['s']) ippoacMoveDir.z += 1;
    if (state.keys['a']) ippoacMoveDir.x -= 1;
    if (state.keys['d']) ippoacMoveDir.x += 1;
    ippoacMoveDir.normalize();

    const isRunning = ippoacMoveDir.lengthSq() > 0;
    
    // Get animation key (j or k)
    let animationKey = null;
    if (state.keys['j']) animationKey = 'j';
    else if (state.keys['k']) animationKey = 'k';
    
    // Update animation based on movement and keys
    updateIppoacAnimation(ippoacGroup, delta, isRunning, animationKey);
    
    if (isRunning) {
        const mx = ippoacMoveDir.x * Math.cos(camAngle) + ippoacMoveDir.z * Math.sin(camAngle);
        const mz = -ippoacMoveDir.x * Math.sin(camAngle) + ippoacMoveDir.z * Math.cos(camAngle);
        state.ippoacVel.x = mx * SPEED2;
        state.ippoacVel.z = mz * SPEED2;
        // Calculate target rotation - face the direction of movement, rotated 90 degrees to the left
        const targetRot = Math.atan2(state.ippoacVel.x, state.ippoacVel.z) - Math.PI / 2;
        ippoacGroup.rotation.y = lerpAngle(ippoacGroup.rotation.y, targetRot, 10 * delta);
    } else {
        state.ippoacVel.x *= (1 - 10 * delta);
        state.ippoacVel.z *= (1 - 10 * delta);
    }
    
    ippoacGroup.position.x += state.ippoacVel.x * delta;
    ippoacGroup.position.z += state.ippoacVel.z * delta;
    ippoacGroup.position.y = getTerrainY(ippoacGroup.position.x, ippoacGroup.position.z, time) + 1.2;
}

function updateLuvu(delta, time, camAngle, getTerrainY, state, particles, luvuGroup, cactusGroup, audioData) {
    // Only allow Luvu movement when NOT following ippoac
    luvuMoveDir.set(0, 0, 0);
    if (!state.isFollowingIppoac) {
        if (state.keys['w']) luvuMoveDir.z -= 1;
        if (state.keys['s']) luvuMoveDir.z += 1;
        if (state.keys['a']) luvuMoveDir.x -= 1;
        if (state.keys['d']) luvuMoveDir.x += 1;
    }
    luvuMoveDir.normalize();
    const gMoving = luvuMoveDir.lengthSq() > 0;

    if (gMoving) {
        reusableObjects.vector3_1.copy(luvuMoveDir).multiplyScalar(SPEED);
        particles.spawnFlowerParticles(luvuGroup.position, reusableObjects.vector3_1);
    }

    const dist = luvuGroup.position.distanceTo(cactusGroup.position);
    state.isHugging = false; // Disable hugging for cactus

    const userData = luvuGroup.userData;
    if (!userData || !userData.bodyMesh) {
        // Model not loaded yet, just update position
        if (gMoving) {
            const mx = luvuMoveDir.x * Math.cos(camAngle) + luvuMoveDir.z * Math.sin(camAngle);
            const mz = -luvuMoveDir.x * Math.sin(camAngle) + luvuMoveDir.z * Math.cos(camAngle);
            state.luvuVel.x = mx * SPEED;
            state.luvuVel.z = mz * SPEED;
            // Calculate target rotation - match original ghost code exactly
            // Character faces the direction it's moving (same as original ghost)
            const targetRot = Math.atan2(state.luvuVel.x, state.luvuVel.z);
            luvuGroup.rotation.y = lerpAngle(luvuGroup.rotation.y, targetRot, 10 * delta);
        } else {
            state.luvuVel.x *= (1 - 10 * delta);
            state.luvuVel.z *= (1 - 10 * delta);
        }
        luvuGroup.position.x += state.luvuVel.x * delta;
        luvuGroup.position.z += state.luvuVel.z * delta;
        return;
    }
    
    // Set initial Y position on terrain when model first loads
    if (!userData.initialYSet) {
        const bottomOffset = userData.bottomOffset || 6.0; // Default to 6.0 for scaled model
        const initialTerrainY = getTerrainY(luvuGroup.position.x, luvuGroup.position.z, time);
        luvuGroup.position.y = initialTerrainY + bottomOffset;
        userData.initialYSet = true;
    }

    if (!state.isHugging) {
        if (gMoving) {
            const mx = luvuMoveDir.x * Math.cos(camAngle) + luvuMoveDir.z * Math.sin(camAngle);
            const mz = -luvuMoveDir.x * Math.sin(camAngle) + luvuMoveDir.z * Math.cos(camAngle);
            state.luvuVel.x = mx * SPEED;
            state.luvuVel.z = mz * SPEED;
            // Calculate target rotation - match original ghost code exactly
            // Character faces the direction it's moving (same as original ghost)
            const targetRot = Math.atan2(state.luvuVel.x, state.luvuVel.z);
            luvuGroup.rotation.y = lerpAngle(luvuGroup.rotation.y, targetRot, 10 * delta);
            
            particles.spawnWindStreams(luvuGroup.position, state.luvuVel, time);
        } else {
            state.luvuVel.x *= (1 - 10 * delta);
            state.luvuVel.z *= (1 - 10 * delta);
        }
        
        // Jump logic - matches original code exactly (KEEP JUMP SCALE ANIMATION)
        if (state.keys[' '] && state.luvuCanJump) {
            state.luvuVel.y = JUMP;
            state.luvuCanJump = false;
            // Set scale when jumping (matches original line 1915)
            if (!userData.targetScale) {
                userData.targetScale = new THREE.Vector3(1, 1, 1);
            }
            userData.targetScale.set(0.6, 1.4, 0.6);
            if (audioData && audioData.playJumpSound) {
                audioData.playJumpSound();
            }
        }
        
        state.luvuVel.y -= GRAVITY * delta;
        luvuGroup.position.addScaledVector(state.luvuVel, delta);
        
        const fy = getTerrainY(luvuGroup.position.x, luvuGroup.position.z, time);
        const bottomOffset = userData.bottomOffset || 6.0; // Default to 6.0 for scaled model
        const wasInAir = !state.luvuCanJump; // Track if we were in air before landing
        if (luvuGroup.position.y <= fy + bottomOffset) {
            luvuGroup.position.y = fy + bottomOffset;
            state.luvuVel.y = 0;
            // Set scale when landing (matches original line 1924) - only if we were in air
            if (wasInAir) {
                if (!userData.targetScale) {
                    userData.targetScale = new THREE.Vector3(1, 1, 1);
                }
                userData.targetScale.set(1.5, 0.6, 1.5);
            }
            state.luvuCanJump = true;
        }
        
        // Update body scale animation (KEEP JUMP SCALE - matches original lines 1927-1928)
        // Only apply scale animation during jump/land, not during normal movement
        // This prevents eyes from moving up when body scales
        const defScale = new THREE.Vector3(1, 1, 1);
        if (!userData.targetScale) {
            userData.targetScale = new THREE.Vector3(1, 1, 1);
        }
        
        // Check if we're currently jumping or just landed (scale animation active)
        const isJumpingOrLanding = !state.luvuCanJump || 
            (userData.targetScale && (
                Math.abs(userData.targetScale.x - 1) > 0.01 ||
                Math.abs(userData.targetScale.y - 1) > 0.01 ||
                Math.abs(userData.targetScale.z - 1) > 0.01
            ));
        
        if (isJumpingOrLanding) {
            // Only lerp body scale when jumping/landing
            userData.bodyMesh.scale.lerp(userData.targetScale, 15 * delta);
            userData.targetScale.lerp(defScale, 5 * delta);
        } else {
            // When not jumping/landing, ensure body is at default scale
            userData.bodyMesh.scale.lerp(defScale, 15 * delta);
            userData.targetScale.copy(defScale);
        }
        
        // Keep model group at original position - no bobbing animation
        // All parts should stay at their default imported positions when moving
        if (userData.modelGroup && userData.modelGroupOriginalPos) {
            userData.modelGroup.position.copy(userData.modelGroupOriginalPos);
            userData.modelGroup.scale.copy(userData.modelGroupOriginalScale || new THREE.Vector3(1, 1, 1));
        }
        
        // Also ensure the entire luvuGroup has no side rotation
        luvuGroup.rotation.z = 0;
        luvuGroup.rotation.x = 0;
        
        // Ensure modelGroup has no side rotation
        if (userData.modelGroup) {
            userData.modelGroup.rotation.z = 0;
            userData.modelGroup.rotation.x = 0;
            userData.modelGroup.quaternion.setFromEuler(new THREE.Euler(0, userData.modelGroup.rotation.y, 0));
        }
        
        // Keep ALL parts at their original imported POSITIONS always (prevents parts from moving)
        // But allow rotations/scales to be animated
        if (userData.originalPositions) {
            // Keep eyes at original position always
            if (userData.leftEye && userData.originalPositions.leftEye) {
                userData.leftEye.position.copy(userData.originalPositions.leftEye);
            }
            if (userData.rightEye && userData.originalPositions.rightEye) {
                userData.rightEye.position.copy(userData.originalPositions.rightEye);
            }
            // Keep hands at original position
            if (userData.leftHand && userData.originalPositions.leftHand) {
                userData.leftHand.position.copy(userData.originalPositions.leftHand);
            }
            if (userData.rightHand && userData.originalPositions.rightHand) {
                userData.rightHand.position.copy(userData.originalPositions.rightHand);
            }
            // Keep silkBody at original position
            if (userData.silkBody && userData.originalPositions.silkBody) {
                userData.silkBody.position.copy(userData.originalPositions.silkBody);
            }
            // Keep scarSilk at original position
            if (userData.scarSilk && userData.originalPositions.scarSilk) {
                userData.scarSilk.position.copy(userData.originalPositions.scarSilk);
            }
        }
        
        // Update body animation - lean forward when moving (25 degrees)
        // This happens AFTER position reset, so positions stay correct
        const targetLean = gMoving ? THREE.MathUtils.degToRad(25) : 0;
        if (userData.silkBody && userData.originalRotations && userData.originalRotations.silkBody) {
            // Apply forward lean on Z axis
            userData.silkBody.rotation.z = THREE.MathUtils.lerp(userData.silkBody.rotation.z, -targetLean, 8 * delta);
            // Keep X and Y at original when not moving, or at 0 when moving (no side lean)
            if (gMoving) {
                userData.silkBody.rotation.x = 0;
                userData.silkBody.rotation.y = 0;
            } else {
                userData.silkBody.rotation.x = userData.originalRotations.silkBody.x;
                userData.silkBody.rotation.y = userData.originalRotations.silkBody.y;
            }
        }
        
        // Reset rotations/scales to original ONLY when NOT moving (to prevent animation conflicts)
        if (!gMoving && userData.originalScales && userData.originalRotations) {
            // Reset eyes scale and rotation when idle
            if (userData.leftEye && userData.originalScales.leftEye) {
                userData.leftEye.scale.copy(userData.originalScales.leftEye);
                userData.leftEye.rotation.copy(userData.originalRotations.leftEye);
            }
            if (userData.rightEye && userData.originalScales.rightEye) {
                userData.rightEye.scale.copy(userData.originalScales.rightEye);
                userData.rightEye.rotation.copy(userData.originalRotations.rightEye);
            }
            
            // Reset hands scale when idle (rotation.z handled by expressions)
            if (userData.leftHand && userData.originalScales.leftHand) {
                userData.leftHand.scale.copy(userData.originalScales.leftHand);
            }
            if (userData.rightHand && userData.originalScales.rightHand) {
                userData.rightHand.scale.copy(userData.originalScales.rightHand);
            }
            
            // Reset scarSilk scale and rotation when idle
            if (userData.scarSilk && userData.originalScales.scarSilk) {
                userData.scarSilk.scale.copy(userData.originalScales.scarSilk);
                userData.scarSilk.rotation.copy(userData.originalRotations.scarSilk);
            }
        }
        // Hand animation removed when moving - keep hands in default position
        // Hands will only animate through expressions (handled in LuvuExpressions.js)
        if (userData.leftHand && userData.rightHand && !gMoving) {
            // Only reset to default when not moving (expressions may override this)
            if (!state.isHugging) {
                // Default/neutral hand position when idle (expressions will override if needed)
                userData.leftHand.rotation.x = 0;
                userData.leftHand.rotation.y = 0;
                userData.leftHand.rotation.z = 0;
                
                userData.rightHand.rotation.x = 0;
                userData.rightHand.rotation.y = 0;
                userData.rightHand.rotation.z = 0;
            }
        }
        
        // Update expression animations smoothly
        // Don't animate eyes during movement or jumping
        const isMoving = gMoving;
        const isJumping = !state.luvuCanJump;
        updateExpressionAnimation(luvuGroup, delta, isMoving, isJumping);
        
        // Animate tears when crying (similar to old ghost code)
        if (state.currentExpression === 'cry' || state.currentExpression === 'crying') {
            const userData = luvuGroup.userData;
            if (userData.tears && userData.faceGroup && userData.leftEye && userData.rightEye) {
                // Position face group at the center between eyes (in model local space)
                if (userData.leftEyeOriginalPos && userData.rightEyeOriginalPos) {
                    // Average the eye positions to center the face group
                    const avgX = (userData.leftEyeOriginalPos.x + userData.rightEyeOriginalPos.x) * 0.5;
                    const avgY = (userData.leftEyeOriginalPos.y + userData.rightEyeOriginalPos.y) * 0.5;
                    const avgZ = (userData.leftEyeOriginalPos.z + userData.rightEyeOriginalPos.z) * 0.5;
                    
                    // Position face group at eye level
                    userData.faceGroup.position.set(avgX, avgY, avgZ);
                }
                
                // Get current eye positions (in model local space, accounting for any position changes)
                const leftEyePos = userData.leftEye ? userData.leftEye.position.clone() : userData.leftEyeOriginalPos;
                const rightEyePos = userData.rightEye ? userData.rightEye.position.clone() : userData.rightEyeOriginalPos;
                
                // Animate tears (positioned in faceGroup local space, directly under eyes)
                // 4 tears total: 2 for left eye, 2 for right eye
                userData.tears.forEach((t, index) => {
                    if (t.mesh.visible) {
                        t.yOffset += delta * 2;
                        if (t.yOffset > 1.0) t.yOffset = 0; // Reset when tear falls off
                        
                        // Calculate eye position relative to face group center
                        const eyePos = t.isLeft ? leftEyePos : rightEyePos;
                        const eyeX = eyePos.x - userData.faceGroup.position.x;
                        const eyeY = eyePos.y - userData.faceGroup.position.y;
                        const eyeZ = eyePos.z - userData.faceGroup.position.z;
                        
                        // Position tears directly below eyes, falling down
                        // Use a configurable offset (works with any value, even very small ones)
                        const tearOffsetY = 0.1; // Offset to move tears higher (positive = up, negative = down)
                        
                        // Rotate tears horizontally around the eye (fixed circular pattern, no animation)
                        const tearIndex = index % 2; // 0 or 1 for each eye
                        const baseAngle = tearIndex * Math.PI + 4.8; // 0 or π radians (180 degrees apart)
                        const radius = 0.15; // Distance from eye center
                        
                        // Fixed angle (no time-based rotation) - change this value to adjust fixed angle
                        const fixedAngle = baseAngle; // Fixed angle for each tear (0 or π)
                        
                        // Calculate horizontal position using fixed rotation
                        const horizontalOffset = Math.cos(fixedAngle) * radius;
                        const forwardOffset = Math.sin(fixedAngle) * radius;
                        
                        const tearX = eyeX + horizontalOffset + 0.35;
                        const tearY = eyeY + tearOffsetY - t.yOffset; // Start at eye level + offset, fall down
                        const tearZ = eyeZ + forwardOffset; // Fixed rotated forward/back position
                        
                        // Ensure tear position is valid (not NaN or Infinity) before setting
                        if (isFinite(tearX) && isFinite(tearY) && isFinite(tearZ)) {
                            t.mesh.position.set(tearX, tearY, tearZ);
                            t.mesh.scale.setScalar(Math.max(0.01, 1.0 - t.yOffset)); // Shrink as it falls, min scale 0.01
                        }
                    }
                });
            }
        }
        
        // Expression-based animations - no side lean/shake allowed
        // Only forward lean is allowed, expressions don't affect body rotation.z
    } else {
        const bottomOffset = userData.bottomOffset || 6.0; // Default to 6.0 for scaled model
        const gy = getTerrainY(luvuGroup.position.x, luvuGroup.position.z, time) + bottomOffset;
        luvuGroup.position.y = THREE.MathUtils.lerp(luvuGroup.position.y, gy, 10 * delta);
        state.luvuVel.set(0, 0, 0);
        state.luvuCanJump = true;
        
        // Hugging animation - hands out
        if (userData.bodyMesh) {
            reusableObjects.vector3_1.set(1, 1, 1);
            userData.bodyMesh.scale.lerp(reusableObjects.vector3_1, 10 * delta);
        }
        if (userData.leftHand) {
            userData.leftHand.rotation.z = -Math.PI / 2;
        }
        if (userData.rightHand) {
            userData.rightHand.rotation.z = Math.PI / 2;
        }
    }
}

function updateCamera(delta, state, pinkLight, blueLight) {
    // Choose target group based on follow state
    let targetGroup = luvuGroup;
    if (state.isFollowingIppoac) {
        targetGroup = ippoacGroup;
    } else if (state.isFollowingCactus) {
        targetGroup = cactusGroup;
    }
    
    // Use different camera offset for cactus and ippoac
    // Use reusable offsets instead of creating new Vector3 every frame
    let currentOffset = camOffset;  // Default: Luvu offset
    if (state.isFollowingIppoac) {
        currentOffset = ippoacCamOffset;
    } else if (state.isFollowingCactus) {
        currentOffset = cactusCamOffset;
    }
    
    // Use reusable object instead of clone
    reusableObjects.vector3_2.copy(currentOffset);
    const rotatedOffset = reusableObjects.vector3_2;
    // Use reusable objects instead of creating new Vector3 every frame
    reusableObjects.vector3_4.set(0, 1, 0);
    rotatedOffset.applyAxisAngle(reusableObjects.vector3_4, state.cameraRotationY);
    
    reusableObjects.vector3_5.set(1, 0, 0);
    reusableObjects.vector3_5.applyAxisAngle(reusableObjects.vector3_4, state.cameraRotationY);
    rotatedOffset.applyAxisAngle(reusableObjects.vector3_5, state.cameraRotationX);
    rotatedOffset.applyAxisAngle(reusableObjects.vector3_4, targetGroup.rotation.y * 0.1);

    reusableObjects.vector3_1.copy(targetGroup.position).add(rotatedOffset);
    camera.position.lerp(reusableObjects.vector3_1, 5 * delta);
    reusableObjects.vector3_1.set(0, 2, 0);
    camTarget.copy(targetGroup.position).add(reusableObjects.vector3_1);
    camera.lookAt(camTarget);
    
    pinkLight.position.set(targetGroup.position.x - 3, targetGroup.position.y + 3, targetGroup.position.z + 3);
    blueLight.position.set(targetGroup.position.x + 3, targetGroup.position.y + 3, targetGroup.position.z - 3);
}


function lerpAngle(a, b, t) {
    let d = b - a;
    while (d < -Math.PI) d += Math.PI * 2;
    while (d > Math.PI) d -= Math.PI * 2;
    return a + d * t;
}

// Export game state for other modules
export { gameState, characterModels, characterTimeouts, newCharacterGroup, luvuGroup };

