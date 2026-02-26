import * as THREE from 'three';
import { createScene } from '../scenes/Scene.js';
import { createGhost } from '../components/Ghost.js';
import { createDuck } from '../components/Duck.js';
import { createDuckHug, updateDuckHug } from '../components/DuckHug.js';
import { createParticles } from '../particles/Particles.js';
import { createPinwheels } from '../particles/Pinwheels.js';
import { loadAllCharacters } from '../characters/CharacterLoader.js';
import { updateCharacterInteractions } from '../characters/CharacterInteractions.js';
import { initAudio } from '../audio/AudioManager.js';
import { initInput } from '../input/InputHandler.js';
import { createVideoScreen } from '../components/VideoScreen.js';

let scene, camera, renderer;
let ghostGroup, duckGroup;
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
    ghostVel: new THREE.Vector3(),
    duckVel: new THREE.Vector3(),
    ghostCanJump: true,
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
    ghostGroup = createGhost(scene);
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

    // Store characterModels in gameState so AudioManager can access it
    gameState.characterModels = characterModels;
    
    // Initialize audio
    audioData = initAudio(gameState);
    
    // Initialize input
    initInput(gameState, ghostGroup, duckGroup, characterModels, characterTimeouts, newCharacterGroup, audioData);

    // Load characters
    loadAllCharacters(scene, characterModels, characterTimeouts, gameState, audioData).then(group => {
        newCharacterGroup = group;
    });

    // Animation loop
    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.1);
        const time = clock.getElapsedTime();

        // Keep background music playing if it should be (but not while ang.mp3 or custom song is playing)
        // Only try to play if user has interacted (to avoid autoplay errors)
        if (audioData && audioData.bgMusic && gameState.hasUserInteracted) {
            if (gameState.isMusicPlaying && audioData.bgMusic.paused && !gameState.isAngleSoundPlaying && !gameState.isAngleSongPlaying) {
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
        const camAngle = Math.atan2(camera.position.x - ghostGroup.position.x, camera.position.z - ghostGroup.position.z);
        
        // Update duck
        updateDuck(delta, time, camAngle, getTerrainY, gameState, duckGroup, audioData);
        
        // Update ghost (this also updates isHugging state)
        updateGhost(delta, time, camAngle, getTerrainY, gameState, particles, ghostGroup, duckGroup, audioData);
        
        // Update particles
        particles.update(delta, time);
        pinwheels.update(delta, time);

        // Update video screen shader
        if (videoScreen) {
            videoScreen.update(time);
        }

        // Update camera position
        updateCamera(delta, gameState, pinkLight, blueLight);

        // Update character interactions
        updateCharacterInteractions(camera, gameState, ghostGroup, characterModels, characterTimeouts, newCharacterGroup, time);

        // Update duck hug interaction
        updateDuckHug(delta, gameState.isHugging, ghostGroup, duckGroup, duckHugData, scene);

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

function updateGhost(delta, time, camAngle, getTerrainY, state, particles, ghostGroup, duckGroup, audioData) {
    const gDir = new THREE.Vector3();
    if (state.keys['w']) gDir.z -= 1;
    if (state.keys['s']) gDir.z += 1;
    if (state.keys['a']) gDir.x -= 1;
    if (state.keys['d']) gDir.x += 1;
    gDir.normalize();
    const gMoving = gDir.lengthSq() > 0;

    if (gMoving) {
        const moveVel = gDir.clone().multiplyScalar(SPEED);
        particles.spawnFlowerParticles(ghostGroup.position, moveVel);
    }

    const dist = ghostGroup.position.distanceTo(duckGroup.position);
    state.isHugging = dist < 5.0 && !gMoving;

    if (!state.isHugging) {
        if (gMoving) {
            const mx = gDir.x * Math.cos(camAngle) + gDir.z * Math.sin(camAngle);
            const mz = -gDir.x * Math.sin(camAngle) + gDir.z * Math.cos(camAngle);
            state.ghostVel.x = mx * SPEED;
            state.ghostVel.z = mz * SPEED;
            ghostGroup.rotation.y = lerpAngle(ghostGroup.rotation.y, Math.atan2(state.ghostVel.x, state.ghostVel.z), 10 * delta);
            
            particles.spawnWindStreams(ghostGroup.position, state.ghostVel, time);
        } else {
            state.ghostVel.x *= (1 - 10 * delta);
            state.ghostVel.z *= (1 - 10 * delta);
        }
        
        // Jump logic - matches original code exactly
        if (state.keys[' '] && state.ghostCanJump) {
            state.ghostVel.y = JUMP;
            state.ghostCanJump = false;
            // Set scale when jumping (matches original line 1915)
            const userData = ghostGroup.userData;
            if (userData && userData.ghostBody) {
                if (!userData.targetScale) {
                    userData.targetScale = new THREE.Vector3(1, 1, 1);
                }
                userData.targetScale.set(0.6, 1.4, 0.6);
            }
            if (audioData && audioData.playJumpSound) {
                audioData.playJumpSound();
            }
        }
        
        state.ghostVel.y -= GRAVITY * delta;
        ghostGroup.position.addScaledVector(state.ghostVel, delta);
        
        const fy = getTerrainY(ghostGroup.position.x, ghostGroup.position.z, time);
        const bottomOffset = ghostGroup.userData?.bottomOffset || 1.0;
        const wasInAir = !state.ghostCanJump; // Track if we were in air before landing
        if (ghostGroup.position.y <= fy + bottomOffset) {
            ghostGroup.position.y = fy + bottomOffset;
            state.ghostVel.y = 0;
            // Set scale when landing (matches original line 1924) - only if we were in air
            const userData = ghostGroup.userData;
            if (userData && userData.ghostBody && wasInAir) {
                if (!userData.targetScale) {
                    userData.targetScale = new THREE.Vector3(1, 1, 1);
                }
                userData.targetScale.set(1.5, 0.6, 1.5);
            }
            state.ghostCanJump = true;
        }
        
        // Update ghost body scale animation (matches original lines 1927-1928)
        const userData = ghostGroup.userData;
        if (userData && userData.ghostBody) {
            const defScale = new THREE.Vector3(1, 1, 1);
            if (!userData.targetScale) {
                userData.targetScale = new THREE.Vector3(1, 1, 1);
            }
            // Lerp body scale toward target, then lerp target back to default
            userData.ghostBody.scale.lerp(userData.targetScale, 15 * delta);
            userData.targetScale.lerp(defScale, 5 * delta);
        }
        
        // Update ghost body animation
        if (userData && userData.ghostBody) {
            const gMoving = state.keys['w'] || state.keys['s'] || state.keys['a'] || state.keys['d'];
            const targetLean = gMoving ? THREE.MathUtils.degToRad(20) : 0;
            userData.ghostBody.rotation.x = THREE.MathUtils.lerp(userData.ghostBody.rotation.x, targetLean, 8 * delta);
            userData.ghostBody.position.y = bottomOffset + (state.ghostCanJump ? Math.sin(time * 2) * 0.3 : 0);
            
            // Running arm animation
            if (gMoving) {
                const runSpeed = 8;
                const armSwing = Math.sin(time * runSpeed) * 0.6;
                if (userData.leftArm) {
                    userData.leftArm.rotation.x = Math.PI / 4 + armSwing;
                    userData.leftArm.rotation.z = -Math.PI / 6;
                }
                if (userData.rightArm) {
                    userData.rightArm.rotation.x = Math.PI / 4 - armSwing;
                    userData.rightArm.rotation.z = Math.PI / 6;
                }
            } else {
                if (userData.leftArm) {
                    userData.leftArm.rotation.x = Math.PI / 4;
                    userData.leftArm.rotation.z = -Math.PI / 6 + Math.sin(time * 2) * 0.1;
                }
                if (userData.rightArm) {
                    userData.rightArm.rotation.x = Math.PI / 4;
                    userData.rightArm.rotation.z = Math.PI / 6 - Math.sin(time * 2) * 0.1;
                }
            }
        }
        
        // Update tears if crying
        if (state.currentExpression === 'crying' && userData && userData.tears) {
            userData.tears.forEach(t => {
                t.yOffset += delta * 2;
                if (t.yOffset > 1.0) t.yOffset = 0;
                t.mesh.position.set(t.isLeft ? -0.4 : 0.4, 0.1 - t.yOffset, 0.1);
                t.mesh.scale.setScalar(1.0 - t.yOffset);
            });
        }
    } else {
        const bottomOffset = ghostGroup.userData?.bottomOffset || 1.0;
        const gy = getTerrainY(ghostGroup.position.x, ghostGroup.position.z, time) + bottomOffset;
        ghostGroup.position.y = THREE.MathUtils.lerp(ghostGroup.position.y, gy, 10 * delta);
        state.ghostVel.set(0, 0, 0);
        state.ghostCanJump = true;
        
        // Hugging animation - arms out
        const userData = ghostGroup.userData;
        if (userData) {
            if (userData.ghostBody) {
                userData.ghostBody.scale.lerp(new THREE.Vector3(1, 1, 1), 10 * delta);
            }
            if (userData.leftArm) {
                userData.leftArm.rotation.z = -Math.PI / 2;
            }
            if (userData.rightArm) {
                userData.rightArm.rotation.z = Math.PI / 2;
            }
        }
    }
}

function updateCamera(delta, state, pinkLight, blueLight) {
    const rotatedOffset = camOffset.clone();
    rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.cameraRotationY);
    
    const rightVector = new THREE.Vector3(1, 0, 0);
    rightVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.cameraRotationY);
    rotatedOffset.applyAxisAngle(rightVector, state.cameraRotationX);
    rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), ghostGroup.rotation.y * 0.1);

    camera.position.lerp(ghostGroup.position.clone().add(rotatedOffset), 5 * delta);
    camTarget.copy(ghostGroup.position).add(new THREE.Vector3(0, 2, 0));
    camera.lookAt(camTarget);
    
    pinkLight.position.set(ghostGroup.position.x - 3, ghostGroup.position.y + 3, ghostGroup.position.z + 3);
    blueLight.position.set(ghostGroup.position.x + 3, ghostGroup.position.y + 3, ghostGroup.position.z - 3);
}


function lerpAngle(a, b, t) {
    let d = b - a;
    while (d < -Math.PI) d += Math.PI * 2;
    while (d > Math.PI) d -= Math.PI * 2;
    return a + d * t;
}

// Export game state for other modules
export { gameState, characterModels, characterTimeouts, newCharacterGroup };

