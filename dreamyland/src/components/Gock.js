import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { incrementLoaded } from '../utils/LoadingScreen.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

export function createGock(scene) {
    const gockGroup = new THREE.Group();
    // Position next to buck (buck is at x: -120, y: 19, z: -200)
    gockGroup.position.set(-131, 1, -220); // To the right of buck
    gockGroup.rotation.y = -Math.PI / 2; // Same rotation as cha
    scene.add(gockGroup);

    let mixer = null;
    let actions = {};
    let currentAction = null;

    gltfLoader.load('/pinklocation/gock.glb', (gltf) => {
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
        model.scale.set(15, 15, 15);
        gockGroup.add(model);

        // Set up animation mixer
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            
            // Log available animations for debugging
            console.log('Gock available animations:', gltf.animations.map(clip => clip.name));
            
            // Create actions for each animation
            gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                actions[clip.name] = action;
                // Set all actions to loop
                action.setLoop(THREE.LoopRepeat);
            });

            // Set default animation (NlaTrack.004 = idle)
            if (actions['NlaTrack.004']) {
                currentAction = actions['NlaTrack.004'];
                currentAction.reset().play();
                currentAction.setEffectiveWeight(1.0);
                console.log('Playing default animation: NlaTrack.004 (idle)');
            } else if (gltf.animations.length > 0) {
                // Fallback to first animation if NlaTrack.004 doesn't exist
                const firstAction = actions[gltf.animations[0].name];
                if (firstAction) {
                    currentAction = firstAction;
                    currentAction.reset().play();
                    currentAction.setEffectiveWeight(1.0);
                    console.log('Playing default animation:', currentAction.getClip().name);
                }
            }
        } else {
            console.warn('No animations found in gock.glb');
        }

        // Store animation data in userData
        gockGroup.userData = {
            mixer,
            actions,
            currentAction,
            isRunning: false,
            model
        };
    }, undefined, (error) => {
        console.error('Error loading gock.glb:', error);
    });

    return gockGroup;
}

