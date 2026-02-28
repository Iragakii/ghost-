import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { incrementLoaded } from '../utils/LoadingScreen.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

export function createBaby(scene) {
    const babyGroup = new THREE.Group();
    // Position next to kuba (kuba is at x: 11, y: 1, z: 143)
    babyGroup.position.set(-30, -1, 175); // Next to kuba
    babyGroup.rotation.y = Math.PI ; // Same rotation as kuba
    scene.add(babyGroup);

    let mixer = null;
    let actions = {};
    let currentAction = null;

    gltfLoader.load('/pinklocation/baby.glb', (gltf) => {
        incrementLoaded();
        const model = gltf.scene;
        
        // Set up model properties
        model.traverse((child) => {
            if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Explicitly clone material to preserve colors
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(mat => mat.clone());
                    } else {
                        child.material = child.material.clone();
                    }
                }
            }
        });

        // Scale and position the model
        model.scale.set(7, 7, 7);
        babyGroup.add(model);

        // Set up animation mixer
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            
            // Log available animations for debugging
            console.log('Baby available animations:', gltf.animations.map(clip => clip.name));
            
            // Create actions for each animation
            gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                actions[clip.name] = action;
                // Set all actions to loop
                action.setLoop(THREE.LoopRepeat);
            });

            // Set default animation (NlaTrack.002 = idle)
            if (actions['NlaTrack']) {
                currentAction = actions['NlaTrack'];
                currentAction.reset().play();
                currentAction.setEffectiveWeight(1.0);
                console.log('Playing default animation: NlaTrack.002 (idle)');
            } else if (gltf.animations.length > 0) {
                // Fallback to first animation if NlaTrack.001 doesn't exist
                const firstAction = actions[gltf.animations[0].name];
                if (firstAction) {
                    currentAction = firstAction;
                    currentAction.reset().play();
                    currentAction.setEffectiveWeight(1.0);
                    console.log('Playing default animation:', currentAction.getClip().name);
                }
            }
        } else {
            console.warn('No animations found in baby.glb');
        }

        // Store animation data in userData
        babyGroup.userData = {
            mixer,
            actions,
            currentAction,
            isRunning: false,
            model: model
        };
        
        console.log('Baby model loaded successfully at position:', babyGroup.position);
    }, undefined, (error) => {
        console.error('Error loading baby.glb:', error);
    });

    return babyGroup;
}

export function updateBabyAnimation(babyGroup, delta, isRunning, animationKey) {
    const userData = babyGroup.userData;
    if (!userData || !userData.mixer) {
        return;
    }

    userData.mixer.update(delta);

    let targetAction = null;
    const actions = userData.actions;

    if (animationKey === 'j') {
        targetAction = actions['NlaTrack'];
    } else if (animationKey === 'k') {
        targetAction = actions['NlaTrack.003'];
    } else if (animationKey === 'l') {
        targetAction = actions['NlaTrack.004'];
    } else if (isRunning) {
        // When moving (W/A/D/S), play walk animation (NlaTrack.001)
        targetAction = actions['NlaTrack.001'];
    } else {
        // Default idle when not moving (NlaTrack.002)
        targetAction = actions['NlaTrack'];
    }

    if (targetAction) {
        const needsSwitch = userData.currentAction !== targetAction || userData.isRunning !== isRunning;
        
        if (needsSwitch) {
            if (userData.currentAction && userData.currentAction !== targetAction) {
                userData.currentAction.fadeOut(0.2);
            }
            userData.currentAction = targetAction;
            userData.isRunning = isRunning;
            targetAction.reset().fadeIn(0.2).play();
            console.log('Baby switched to animation:', targetAction.getClip().name);
        }
    } else {
        console.warn('No target animation found for Baby');
    }
}

