import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { incrementLoaded } from '../utils/LoadingScreen.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

export function createKuba(scene) {
    const kubaGroup = new THREE.Group();
    // Position next to biab (biab is at x: 10, y: 10, z: 150)
    kubaGroup.position.set(11, 1, 143); // Next to biab
    kubaGroup.rotation.y = Math.PI / 2; // Same rotation as biab
    scene.add(kubaGroup);

    let mixer = null;
    let actions = {};
    let currentAction = null;

    gltfLoader.load('/playground/kuba.glb', (gltf) => {
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
        model.scale.set(12, 12, 12);
        kubaGroup.add(model);

        // Set up animation mixer
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            
            // Log available animations for debugging
            console.log('Kuba available animations:', gltf.animations.map(clip => clip.name));
            
            // Create actions for each animation
            gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                actions[clip.name] = action;
                // Set all actions to loop
                action.setLoop(THREE.LoopRepeat);
            });

            // Set default animation (NlaTrack.001 = idle)
            if (actions['NlaTrack.001']) {
                currentAction = actions['NlaTrack.001'];
                currentAction.reset().play();
                currentAction.setEffectiveWeight(1.0);
                console.log('Playing default animation: NlaTrack.001 (idle)');
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
            console.warn('No animations found in kuba.glb');
        }

        // Store animation data in userData
        kubaGroup.userData = {
            mixer,
            actions,
            currentAction,
            isRunning: false,
            model
        };
    }, undefined, (error) => {
        console.error('Error loading kuba.glb:', error);
    });

    return kubaGroup;
}

