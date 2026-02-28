import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { incrementLoaded } from '../utils/LoadingScreen.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

export function createIppoac(scene) {
    const ippoacGroup = new THREE.Group();
    ippoacGroup.position.set(10, 1, 210);
    ippoacGroup.rotation.y = -Math.PI / 2 ; // Face forward (same as biar and biab)
    scene.add(ippoacGroup);

    let mixer = null;
    let actions = {};
    let currentAction = null;

    gltfLoader.load('/playground/ippoac.glb', (gltf) => {
        incrementLoaded();
        const model = gltf.scene;
        
        // Set up model properties
        model.traverse((child) => {
            if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Scale and position the model
        model.scale.set(12, 12, 12);
        ippoacGroup.add(model);

        // Set up animation mixer
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            
            // Log available animations for debugging
            console.log('Ippoac available animations:', gltf.animations.map(clip => clip.name));
            
            // Create actions for each animation
            gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                actions[clip.name] = action;
                // Set all actions to loop
                action.setLoop(THREE.LoopRepeat);
            });

            // Set default animation (first animation)
            if (gltf.animations.length > 0) {
                const firstAction = actions[gltf.animations[0].name];
                if (firstAction) {
                    currentAction = firstAction;
                    currentAction.reset().play();
                    currentAction.setEffectiveWeight(1.0);
                    console.log('Playing default animation:', currentAction.getClip().name);
                }
            }
        } else {
            console.warn('No animations found in ippoac.glb');
        }

        // Store animation data in userData
        ippoacGroup.userData = {
            mixer,
            actions,
            currentAction,
            isRunning: false,
            model
        };
    }, undefined, (error) => {
        console.error('Error loading ippoac.glb:', error);
    });

    return ippoacGroup;
}

export function updateIppoacAnimation(ippoacGroup, delta, isRunning, animationKey) {
    const userData = ippoacGroup.userData;
    if (!userData || !userData.mixer) {
        return;
    }

    // Update mixer (must be called every frame for animations to play)
    userData.mixer.update(delta);

    // Get the target animation based on state
    let targetAction = null;
    const actionKeys = Object.keys(userData.actions);
    const actions = userData.actions;
    
    if (animationKey === 'j') {
        // J key animation -> prefer NlaTrack.001
        targetAction = actions['NlaTrack.001']
            || (actionKeys.length >= 2 ? actions[actionKeys[1]] : null)
            || (actionKeys.length >= 1 ? actions[actionKeys[0]] : null);
    } else if (animationKey === 'k') {
        // K key animation -> pin to NlaTrack
        targetAction = actions['NlaTrack']
            || (actionKeys.length >= 1 ? actions[actionKeys[0]] : null);
    } else if (isRunning) {
        // Running animation - use NlaTrack.002 and reverse it
        const runAction = actions['NlaTrack.002']
            || (actionKeys.length >= 3 ? actions[actionKeys[2]] : null)
            || (actionKeys.length >= 1 ? actions[actionKeys[actionKeys.length - 1]] : null);
        if (runAction) {
            targetAction = runAction;
            // Reverse the animation (play backwards)
            runAction.setEffectiveTimeScale(-1.0);
        }
    } else {
        // No key and not running -> no animation (idle pose, stop actions)
        targetAction = null;
        // Reset time scale to normal for run clip
        if (actions['NlaTrack.002']) {
            actions['NlaTrack.002'].setEffectiveTimeScale(1.0);
        }
    }

    // Switch animation if needed
    if (userData.currentAction !== targetAction) {
        // Fade out current action
        if (userData.currentAction) {
            userData.currentAction.fadeOut(0.2);
        }
        // Set and play new action (if any)
        userData.currentAction = targetAction || null;
        if (userData.currentAction) {
            userData.currentAction.reset().fadeIn(0.2).play();
            console.log('Switched to animation:', userData.currentAction.getClip().name, isRunning ? '(reversed)' : '');
        }
        userData.isRunning = isRunning;
    }

    // Ensure current action is playing (in case it stopped)
    if (userData.currentAction && !userData.currentAction.isRunning()) {
        userData.currentAction.play();
    }
    
    // Ensure NlaTrack.002 time scale is set correctly when running
    if (isRunning && userData.actions['NlaTrack.002']) {
        userData.actions['NlaTrack.002'].setEffectiveTimeScale(-1.0);
    } else if (!isRunning && userData.actions['NlaTrack.002']) {
        userData.actions['NlaTrack.002'].setEffectiveTimeScale(1.0);
    }
}

