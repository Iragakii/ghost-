import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { incrementLoaded } from '../utils/LoadingScreen.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

export function createCactus(scene) {
    const cactusGroup = new THREE.Group();
    cactusGroup.position.set(37, 5, 175);
    scene.add(cactusGroup);

    let mixer = null;
    let actions = {};
    let currentAction = null;
    let isRunning = false;

    gltfLoader.load('/playground/cactusac.glb', (gltf) => {
        incrementLoaded();
        const model = gltf.scene;
        
        // Set up model properties
        model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Scale and position the model
        model.scale.set(8, 8, 8);
        cactusGroup.add(model);

        // Set up animation mixer
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            
            // Log available animations for debugging
            console.log('Available animations:', gltf.animations.map(clip => clip.name));
            
            // Create actions for each animation
            gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                actions[clip.name] = action;
                // Set all actions to loop
                action.setLoop(THREE.LoopRepeat);
            });

            // Set default animation - use second animation (NlaTrack.001 = idle/look_around)
            // Animation names are: 'NlaTrack' (run) and 'NlaTrack.001' (idle)
            if (gltf.animations.length >= 2) {
                // Second animation is idle (NlaTrack.001)
                const idleAction = actions[gltf.animations[1].name];
                if (idleAction) {
                    currentAction = idleAction;
                    // Start playing immediately (no fade for initial load)
                    currentAction.reset().play();
                    currentAction.setEffectiveWeight(1.0);
                    console.log('Playing default animation:', currentAction.getClip().name);
                }
            } else if (gltf.animations.length > 0) {
                // Fallback to first if only one animation
                const idleAction = actions[gltf.animations[0].name];
                if (idleAction) {
                    currentAction = idleAction;
                    currentAction.reset().play();
                    currentAction.setEffectiveWeight(1.0);
                    console.log('Playing default animation:', currentAction.getClip().name);
                }
            } else {
                console.warn('No animations found');
            }
        } else {
            console.warn('No animations found in cactusac.glb');
        }

        // Store animation data in userData
        cactusGroup.userData = {
            mixer,
            actions,
            currentAction,
            isRunning: false,
            lastIsRunning: false,
            model
        };
    }, undefined, (error) => {
        console.error('Error loading cactusac.glb:', error);
    });

    return cactusGroup;
}

export function updateCactusAnimation(cactusGroup, delta, isRunning) {
    const userData = cactusGroup.userData;
    
    // Debug: log isRunning state (only once per state change)
    if (userData && userData.lastIsRunning !== isRunning) {
        console.log('Cactus isRunning changed:', isRunning);
        if (userData) userData.lastIsRunning = isRunning;
    }
    
    if (!userData || !userData.mixer) {
        // Model might still be loading, try to initialize default animation if available
        if (userData && userData.actions && Object.keys(userData.actions).length > 0 && !userData.currentAction) {
            // Initialize with second animation (NlaTrack.001 = idle)
            const actionKeys = Object.keys(userData.actions);
            if (actionKeys.length >= 2) {
                const idleAction = userData.actions[actionKeys[1]];
                if (idleAction) {
                    userData.currentAction = idleAction;
                    idleAction.reset().fadeIn(0.2).play();
                }
            } else if (actionKeys.length > 0) {
                const firstAction = userData.actions[actionKeys[0]];
                if (firstAction) {
                    userData.currentAction = firstAction;
                    firstAction.reset().fadeIn(0.2).play();
                }
            }
        }
        return;
    }

    // Update mixer (must be called every frame for animations to play)
    userData.mixer.update(delta);

    // Helper function to find animation by name variations
    const findAnimation = (names) => {
        for (const name of names) {
            if (userData.actions[name]) {
                return userData.actions[name];
            }
        }
        return null;
    };

    // Get the target animation based on state
    // Animation names: 'NlaTrack' (run) and 'NlaTrack.001' (idle)
    let targetAction = null;
    const actionKeys = Object.keys(userData.actions);
    
    if (isRunning) {
        // When moving, use first animation (NlaTrack = run)
        if (actionKeys.length >= 1) {
            // First animation is run
            targetAction = userData.actions[actionKeys[0]];
        }
    } else {
        // When idle, use second animation (NlaTrack.001 = idle/look_around)
        if (actionKeys.length >= 2) {
            // Second animation is idle
            targetAction = userData.actions[actionKeys[1]];
        } else if (actionKeys.length === 1) {
            // Only one animation, use it
            targetAction = userData.actions[actionKeys[0]];
        }
    }

    // Only switch if we have a target action and it's different from current
    if (targetAction) {
        // Check if we need to switch (different action OR state changed)
        const needsSwitch = userData.currentAction !== targetAction || userData.isRunning !== isRunning;
        
        if (needsSwitch) {
            // Fade out current action
            if (userData.currentAction && userData.currentAction !== targetAction) {
                userData.currentAction.fadeOut(0.2);
            }
            // Set and play new action
            userData.currentAction = targetAction;
            userData.currentAction.reset().fadeIn(0.2).play();
            userData.isRunning = isRunning;
            console.log('Switched to:', isRunning ? 'run' : 'look_around', 'animation:', targetAction.getClip().name);
        }
    } else {
        console.warn('No target animation found for state:', isRunning ? 'running' : 'idle');
    }

    // Ensure current action is playing (in case it stopped)
    if (userData.currentAction && !userData.currentAction.isRunning()) {
        userData.currentAction.play();
    }
}

