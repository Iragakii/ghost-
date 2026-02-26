import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Helper function to create colored material
function createColoredMaterial(color) {
    return new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.5,
        metalness: 0.3
    });
}

// Helper function to load model with custom colors
function loadModelWithColor(colorHex, position, modelName, charIndex, scene, characterModels) {
    gltfLoader.load('/e.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(position.x, position.y, position.z);
        modelGroup.rotation.y = -Math.PI / 2;
        modelGroup.scale.set(12, 12, 12);

        const bodyMaterial = createColoredMaterial(colorHex);
        const eyeTeethMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.3,
            metalness: 0.1
        });

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                const meshName = child.name.toLowerCase();

                if (meshName.includes('eye') || meshName.includes('pupil')) {
                    clonedMesh.material = eyeTeethMaterial;
                } else if (meshName.includes('tooth') || meshName.includes('teeth')) {
                    clonedMesh.material = eyeTeethMaterial;
                } else if (meshName.includes('body') || meshName.includes('head') ||
                    meshName.includes('skin') || meshName.includes('character') ||
                    child.material && child.material.color) {
                    if (child.material && !(meshName.includes('eye') || meshName.includes('tooth'))) {
                        const newMat = child.material.clone();
                        newMat.color.setHex(colorHex);
                        clonedMesh.material = newMat;
                    }
                }

                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        characterModels[charIndex] = {
            group: modelGroup,
            position: position,
            isInteracting: false
        };
    });
}

// Model loading functions
function loadGreenModel(scene, characterModels) {
    loadModelWithColor(0xDDAED3, { x: -20, y: 7, z: -150 }, 'Yellow', 0, scene, characterModels);
}

function loadYellowModel(scene, characterModels) {
    loadModelWithColor(0xDDAED3, { x: 0, y: 7, z: -150 }, 'Yellow', 1, scene, characterModels);
}

function loadPinkModel(scene, characterModels) {
    loadModelWithColor(0xDDAED3, { x: 20, y: 7, z: -150 }, 'Yellow', 2, scene, characterModels);
}

function loadFModel(scene, characterModels) {
    gltfLoader.load('/f.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-130, 7, -40);
        modelGroup.rotation.y = -Math.PI / 2;
        modelGroup.scale.set(12, 12, 12);

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        characterModels[3] = {
            group: modelGroup,
            position: { x: -90, y: 7, z: -40 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading f.glb:', error);
    });
}

function loadAngleModel(scene, characterModels) {
    gltfLoader.load('/angle.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-67, 7, 10);
        modelGroup.rotation.y = Math.PI;
        modelGroup.scale.set(12, 12, 12);

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        characterModels[5] = {
            group: modelGroup,
            position: { x: -67, y: 7, z: 10 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading angle.glb:', error);
    });
}

function loadLotusModel(scene, characterModels) {
    gltfLoader.load('/lotusns.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-60, 7, 50);
        modelGroup.rotation.y = Math.PI;
        modelGroup.scale.set(35, 35, 35);

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        characterModels[10] = {
            group: modelGroup,
            position: { x: -60, y: 7, z: 10 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading lotusns.glb:', error);
    });
}

function loadLotusModel2(scene, characterModels) {
    gltfLoader.load('/lotusns.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-60, 7, -35);
        modelGroup.rotation.y = Math.PI;
        modelGroup.scale.set(40, 40, 40);

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        characterModels[15] = {
            group: modelGroup,
            position: { x: -60, y: 7, z: 20 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading lotusns.glb (second instance):', error);
    });
}

function loadDaisyModel(scene, characterModels) {
    gltfLoader.load('/daisy.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-270, 7, 10);
        modelGroup.rotation.y = Math.PI / 20;
        modelGroup.scale.set(40, 40, 40);

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        characterModels[11] = {
            group: modelGroup,
            position: { x: -53, y: 7, z: 10 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading daisy.glb:', error);
    });
}

function loadLotus2Model(scene, characterModels) {
    gltfLoader.load('/lotus.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-55, 7, 10);
        modelGroup.rotation.y = Math.PI + 0.4;
        modelGroup.scale.set(45, 45, 45);

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        characterModels[12] = {
            group: modelGroup,
            position: { x: -46, y: 7, z: 10 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading lotus.glb:', error);
    });
}

function loadThrelefModel(scene, characterModels) {
    gltfLoader.load('/threlef.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-115, 7, 150);
        modelGroup.rotation.y = Math.PI + 5;
        modelGroup.scale.set(30, 30, 30);

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        characterModels[13] = {
            group: modelGroup,
            position: { x: -39, y: 7, z: 10 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading threlef.glb:', error);
    });
}

function loadThrelefModel2(scene, characterModels) {
    gltfLoader.load('/threlef.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-200, 7, 120);
        modelGroup.rotation.y = Math.PI + 39;
        modelGroup.scale.set(30, 30, 30);

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        characterModels[13] = {
            group: modelGroup,
            position: { x: -39, y: 7, z: 10 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading threlef.glb:', error);
    });
}

function loadPinkfModel(scene, characterModels) {
    gltfLoader.load('/pinkf.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-232, 7, 70);
        modelGroup.rotation.y = Math.PI + 10;
        modelGroup.scale.set(32, 32, 32);

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        characterModels[14] = {
            group: modelGroup,
            position: { x: -32, y: 7, z: 10 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading pinkf.glb:', error);
    });
}

function loadPinkfModel2(scene, characterModels) {
    gltfLoader.load('/pinkf.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-170, 7, -30);
        modelGroup.rotation.y = Math.PI + 15;
        modelGroup.scale.set(32, 32, 32);

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        characterModels[14] = {
            group: modelGroup,
            position: { x: -32, y: 7, z: 10 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading pinkf.glb:', error);
    });
}

function loadVEModel(scene, characterModels) {
    gltfLoader.load('/ve.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-140, 7, -40);
        modelGroup.rotation.y = -Math.PI / 2;
        modelGroup.scale.set(12, 12, 12);

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        characterModels[6] = {
            group: modelGroup,
            position: { x: -100, y: 7, z: -40 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading ve.glb:', error);
    });
}

function loadPPModel(scene, characterModels) {
    gltfLoader.load('/pp.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-150, 7, -40);
        modelGroup.rotation.y = -Math.PI / 2;
        modelGroup.scale.set(12, 12, 12);

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        characterModels[7] = {
            group: modelGroup,
            position: { x: -110, y: 7, z: -40 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading pp.glb:', error);
    });
}

function loadLMModel(scene, characterModels) {
    gltfLoader.load('/lm.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-160, 4, -10);
        modelGroup.rotation.y = Math.PI / 4;
        modelGroup.scale.set(6, 6, 6);

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        characterModels[8] = {
            group: modelGroup,
            position: { x: -120, y: 4, z: -10 },
            isInteracting: false
        };

        const chatEl = document.getElementById('lm-chat');
        if (chatEl) {
            chatEl.textContent = "Do u want join some party with ....";
        }
    }, undefined, (error) => {
        console.error('Error loading lm.glb:', error);
    });
}

function loadFATModel(scene, characterModels) {
    gltfLoader.load('/fat.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-140, 7, -13);
        modelGroup.rotation.y = Math.PI / 4;
        modelGroup.scale.set(18, 18, 18);

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        characterModels[9] = {
            group: modelGroup,
            position: { x: -100, y: 7, z: -13 },
            isInteracting: false
        };

        const chatEl = document.getElementById('fat-chat');
        if (chatEl) {
            chatEl.textContent = "You shuold sing well like her";
        }
    }, undefined, (error) => {
        console.error('Error loading fat.glb:', error);
    });
}

function loadNewCharacter(scene) {
    return new Promise((resolve) => {
        gltfLoader.load('/ld.glb', (gltf) => {
            const modelGroup = new THREE.Group();
            modelGroup.position.set(0, 3, -130);
            modelGroup.rotation.y = Math.PI / 2;
            modelGroup.scale.set(7, 7, 7);

            gltf.scene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    const clonedMesh = child.clone();
                    clonedMesh.castShadow = true;
                    clonedMesh.receiveShadow = true;
                    modelGroup.add(clonedMesh);
                }
            });

            scene.add(modelGroup);

            const chatEl = document.getElementById('newchar-chat');
            if (chatEl) {
                chatEl.style.display = 'block';
                chatEl.textContent = "You should Do my prompt better .........";
            }

            resolve(modelGroup);
        }, undefined, (error) => {
            console.error('Error loading ld.glb:', error);
            resolve(null);
        });
    });
}

export function loadAllCharacters(scene, characterModels, characterTimeouts, gameState, audioData) {
    // Load all models
    loadGreenModel(scene, characterModels);
    loadYellowModel(scene, characterModels);
    loadPinkModel(scene, characterModels);
    loadFModel(scene, characterModels);
    loadAngleModel(scene, characterModels);
    loadLotusModel(scene, characterModels);
    loadLotusModel2(scene, characterModels);
    loadDaisyModel(scene, characterModels);
    loadLotus2Model(scene, characterModels);
    loadThrelefModel2(scene, characterModels);
    loadThrelefModel(scene, characterModels);
    loadPinkfModel(scene, characterModels);
    loadPinkfModel2(scene, characterModels);
    loadVEModel(scene, characterModels);
    loadPPModel(scene, characterModels);
    loadLMModel(scene, characterModels);
    loadFATModel(scene, characterModels);

    // Load new character and return it
    return loadNewCharacter(scene);
}
