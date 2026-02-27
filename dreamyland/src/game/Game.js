import * as THREE from 'three';
import { createScene } from '../scenes/Scene.js';
import { createLuvu } from '../components/Luvu.js';
import { updateExpressionAnimation } from '../components/LuvuExpressions.js';
import { createDuck } from '../components/Duck.js';
import { createDuckHug, updateDuckHug } from '../components/DuckHug.js';
import { createParticles } from '../particles/Particles.js';
import { createPinwheels } from '../particles/Pinwheels.js';
import { loadAllCharacters, loadBiarModel, loadBiabModel } from '../characters/CharacterLoader.js';
import { updateCharacterInteractions } from '../characters/CharacterInteractions.js';
import { initAudio } from '../audio/AudioManager.js';
import { initInput } from '../input/InputHandler.js';
import { createVideoScreen } from '../components/VideoScreen.js';

let scene, camera, renderer;
let luvuGroup, duckGroup;
let particles, pinwheels;
let characterModels = [];
let characterTimeouts = [];
let newCharacterGroup = null;
let duckHugData = null;
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
    duckVel: new THREE.Vector3(),
    luvuCanJump: true,
    isHugging: false,
    neckStretch: 1.0,
    lastDuckWalkTime: 0,
    closestCharIndex: -1,
    isNewCharClose: false,
    currentExpression: 'neutral',
    isAngleSoundPlaying: false,
    isAngleSongPlaying: false,
    isMusicPlaying: true,
    musicWasPlayingBeforeAngle: false, // Track if music was playing before angle.mp3
    hasUserInteracted: false,
    terrainUpdateFrame: 0
};

// Constants
const SPEED = 40;
const SPEED2 = 15;
const GRAVITY = 30;
const JUMP = 15;
const INTERACTION_DISTANCE = 8;
const MOUSE_SENSITIVITY = 0.004;
const MIN_PITCH = -Math.PI / 3;
const MAX_PITCH = Math.PI / 3;

const camOffset = new THREE.Vector3(0, 6, 16);
const camTarget = new THREE.Vector3();

export function initGame() {
    // Initialize scene
    const sceneData = createScene();
    scene = sceneData.scene;
    camera = sceneData.camera;
    renderer = sceneData.renderer;
    
    const container = sceneData.container;
    const floorGeo = sceneData.floorGeo;
    const getTerrainY = sceneData.getTerrainY;
    const pinkLight = sceneData.pinkLight;
    const blueLight = sceneData.blueLight;

    // Create characters
    luvuGroup = createLuvu(scene);
    duckGroup = createDuck(scene);
    
    // Create duck hug system
    duckHugData = createDuckHug(scene, duckGroup);

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

    // Create video screen behind f.glb model (screen 3)
    let fVideoScreen = null;
    try {
        fVideoScreen = createVideoScreen(scene, '/videoo.mp4', {
            width: 35,
            height: 20,
            position: new THREE.Vector3(-143, 25, -45), // Behind f.glb (f.glb is at z: -40)
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
        biarVideoScreen = createVideoScreen(scene, '/public/playground/videoippo.mp4', {
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
        biabVideoScreen = createVideoScreen(scene, '/public/playground/videoape.mp4', {
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

    // Store characterModels in gameState so AudioManager can access it
    gameState.characterModels = characterModels;
    
    // Initialize audio
    audioData = initAudio(gameState);
    
    // Initialize input
    initInput(gameState, luvuGroup, duckGroup, characterModels, characterTimeouts, newCharacterGroup, audioData);

    // Load characters
    loadAllCharacters(scene, characterModels, characterTimeouts, gameState, audioData).then(group => {
        newCharacterGroup = group;
    });

    // Load biar.glb and biab.glb models at spawn location next to duck
    loadBiarModel(scene);
    loadBiabModel(scene);

    // Animation loop
    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.1);
        const time = clock.getElapsedTime();

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
        const camAngle = Math.atan2(camera.position.x - luvuGroup.position.x, camera.position.z - luvuGroup.position.z);
        
        // Update duck
        updateDuck(delta, time, camAngle, getTerrainY, gameState, duckGroup, audioData);
        
        // Update luvu (this also updates isHugging state)
        updateLuvu(delta, time, camAngle, getTerrainY, gameState, particles, luvuGroup, duckGroup, audioData);
        
        // Update particles
        particles.update(delta, time);
        pinwheels.update(delta, time);

        // Update video screen shader
        if (videoScreen) {
            videoScreen.update(time);
        }
        // Update f video screen shader (screen 3)
        if (fVideoScreen) {
            fVideoScreen.update(time);
        }
        // Update biar video screen shader
        if (biarVideoScreen) {
            biarVideoScreen.update(time);
        }
        // Update biab video screen shader
        if (biabVideoScreen) {
            biabVideoScreen.update(time);
        }

        // Update camera position
        updateCamera(delta, gameState, pinkLight, blueLight);

        // Update character interactions
        updateCharacterInteractions(camera, gameState, luvuGroup, characterModels, characterTimeouts, newCharacterGroup, time);

        // Update duck hug interaction
        updateDuckHug(delta, gameState.isHugging, luvuGroup, duckGroup, duckHugData, scene);

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

function updateDuck(delta, time, camAngle, getTerrainY, state, duckGroup, audioData) {
    const dDir = new THREE.Vector3();
    if (state.keys['arrowup']) dDir.z -= 1;
    if (state.keys['arrowdown']) dDir.z += 1;
    if (state.keys['arrowleft']) dDir.x -= 1;
    if (state.keys['arrowright']) dDir.x += 1;
    dDir.normalize();

    const userData = duckGroup.userData;
    
    let lastDuckWalkTime = state.lastDuckWalkTime || 0;
    
    if (dDir.lengthSq() > 0) {
        const mx = dDir.x * Math.cos(camAngle) + dDir.z * Math.sin(camAngle);
        const mz = -dDir.x * Math.sin(camAngle) + dDir.z * Math.cos(camAngle);
        state.duckVel.x = mx * SPEED2;
        state.duckVel.z = mz * SPEED2;
        duckGroup.rotation.y = lerpAngle(duckGroup.rotation.y, Math.atan2(state.duckVel.x, state.duckVel.z), 10 * delta);
        
        // Duck walking animation
        if (userData && userData.bodyGroup) {
            userData.bodyGroup.rotation.z = Math.sin(time * 15) * 0.1;
        }
        if (userData && userData.leftLeg) {
            userData.leftLeg.rotation.x = Math.max(0, Math.sin(time * 15)) * 0.3;
        }
        if (userData && userData.rightLeg) {
            userData.rightLeg.rotation.x = Math.max(0, Math.sin(time * 15 + Math.PI)) * 0.3;
        }
        
        // Play duck walk sound
        if (time - lastDuckWalkTime > 0.35) {
            if (audioData && audioData.playDuckWalkSound) {
                audioData.playDuckWalkSound();
            }
            lastDuckWalkTime = time;
            state.lastDuckWalkTime = time;
        }
    } else {
        state.duckVel.x *= (1 - 10 * delta);
        state.duckVel.z *= (1 - 10 * delta);
        
        if (userData && userData.bodyGroup) {
            userData.bodyGroup.rotation.z = 0;
        }
        if (userData && userData.leftLeg) {
            userData.leftLeg.rotation.x = 0;
        }
        if (userData && userData.rightLeg) {
            userData.rightLeg.rotation.x = 0;
        }
    }
    
    duckGroup.position.x += state.duckVel.x * delta;
    duckGroup.position.z += state.duckVel.z * delta;
    duckGroup.position.y = getTerrainY(duckGroup.position.x, duckGroup.position.z, time) + 1.2;
    
    // Neck stretch for Enter key
    if (userData && userData.neckGroup) {
        state.neckStretch = THREE.MathUtils.lerp(state.neckStretch, state.keys['enter'] ? 4.5 : 1.0, 8 * delta);
        userData.neckGroup.scale.y = state.neckStretch;
    }
}

function updateLuvu(delta, time, camAngle, getTerrainY, state, particles, luvuGroup, duckGroup, audioData) {
    const gDir = new THREE.Vector3();
    if (state.keys['w']) gDir.z -= 1;
    if (state.keys['s']) gDir.z += 1;
    if (state.keys['a']) gDir.x -= 1;
    if (state.keys['d']) gDir.x += 1;
    gDir.normalize();
    const gMoving = gDir.lengthSq() > 0;

    if (gMoving) {
        const moveVel = gDir.clone().multiplyScalar(SPEED);
        particles.spawnFlowerParticles(luvuGroup.position, moveVel);
    }

    const dist = luvuGroup.position.distanceTo(duckGroup.position);
    state.isHugging = dist < 5.0 && !gMoving;

    const userData = luvuGroup.userData;
    if (!userData || !userData.bodyMesh) {
        // Model not loaded yet, just update position
        if (gMoving) {
            const mx = gDir.x * Math.cos(camAngle) + gDir.z * Math.sin(camAngle);
            const mz = -gDir.x * Math.sin(camAngle) + gDir.z * Math.cos(camAngle);
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
            const mx = gDir.x * Math.cos(camAngle) + gDir.z * Math.sin(camAngle);
            const mz = -gDir.x * Math.sin(camAngle) + gDir.z * Math.cos(camAngle);
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
            userData.bodyMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 10 * delta);
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
    const rotatedOffset = camOffset.clone();
    rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.cameraRotationY);
    
    const rightVector = new THREE.Vector3(1, 0, 0);
    rightVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.cameraRotationY);
    rotatedOffset.applyAxisAngle(rightVector, state.cameraRotationX);
    rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), luvuGroup.rotation.y * 0.1);

    camera.position.lerp(luvuGroup.position.clone().add(rotatedOffset), 5 * delta);
    camTarget.copy(luvuGroup.position).add(new THREE.Vector3(0, 2, 0));
    camera.lookAt(camTarget);
    
    pinkLight.position.set(luvuGroup.position.x - 3, luvuGroup.position.y + 3, luvuGroup.position.z + 3);
    blueLight.position.set(luvuGroup.position.x + 3, luvuGroup.position.y + 3, luvuGroup.position.z - 3);
}


function lerpAngle(a, b, t) {
    let d = b - a;
    while (d < -Math.PI) d += Math.PI * 2;
    while (d > Math.PI) d -= Math.PI * 2;
    return a + d * t;
}

// Export game state for other modules
export { gameState, characterModels, characterTimeouts, newCharacterGroup, luvuGroup };

