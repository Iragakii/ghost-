import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { incrementLoaded, forceCompleteLoading } from '../utils/LoadingScreen.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.183.0/examples/jsm/libs/basis/');

// Create loading manager
const loadingManager = new THREE.LoadingManager(
    // onLoad - called when all assets are loaded
    () => {
        // All assets loaded via LoadingManager
        // Complete loading immediately (scene is already visible)
        forceCompleteLoading();
    },
    // onProgress - can be used for progress tracking
    undefined,
    // onError
    (url) => {
        console.error('Error loading asset:', url);
        // Don't block on errors - continue loading
    }
);

const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setDRACOLoader(dracoLoader);


// Suppress blob URL texture errors from GLTFLoader
// These errors occur when textures are embedded in GLB files but fail to load
// The models will still render, just without textures
const originalError = console.error;
const originalWarn = console.warn;

console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes("THREE.GLTFLoader: Couldn't load texture blob:")) {
        // Suppress blob texture loading errors - textures may be optional
        return;
    }
    originalError.apply(console, args);
};

console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes("THREE.GLTFLoader: Couldn't load texture blob:")) {
        // Suppress blob texture loading warnings
        return;
    }
    originalWarn.apply(console, args);
};

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
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        characterModels[charIndex] = {
            group: modelGroup,
            position: position,
            isInteracting: false
        };
    });
}

// Model loading functions
function loadGreenModel(scene, characterModels) {
    loadModelWithColor(0xDDAED3, { x: -20, y: 7, z: -250 }, 'Yellow', 0, scene, characterModels);
}

function loadYellowModel(scene, characterModels) {
    loadModelWithColor(0xDDAED3, { x: 0, y: 7, z: -250 }, 'Yellow', 1, scene, characterModels);
}

function loadPinkModel(scene, characterModels) {
    loadModelWithColor(0xDDAED3, { x: 20, y: 7, z: -250 }, 'Yellow', 2, scene, characterModels);
}

function loadGLModel(scene, characterModels) {
    gltfLoader.load('/pinklocation/gl.glb', (gltf) => {
        incrementLoaded();
        const modelGroup = new THREE.Group();
        // Position next to pink characters (to the right of the last pink character at x: 20)
        modelGroup.position.set(40, 19, -250);
        modelGroup.rotation.y = -Math.PI / 2; // Same rotation as pink characters
        modelGroup.scale.set(40, 40, 40); // Same scale as pink characters

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        // Store reference to character model (using index 16, or find an unused index)
        characterModels[16] = {
            group: modelGroup,
            position: { x: 40, y: 7, z: -150 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading gl.glb:', error);
    });
}

function loadIceBModel(scene, characterModels) {
    gltfLoader.load('/pinklocation/iceb.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        // Position next to gl.glb (which is at x: 40)
        modelGroup.position.set(-160, 19, -200);
        modelGroup.rotation.y = -Math.PI / 2; // Same rotation as gl.glb
        modelGroup.scale.set(40, 40, 40); // Same scale as gl.glb

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        // Store reference to character model (using index 17)
        characterModels[17] = {
            group: modelGroup,
            position: { x: 60, y: 7, z: -150 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading iceb.glb:', error);
    });
}

function loadIceEModel(scene, characterModels) {
    gltfLoader.load('/pinklocation/icee.glb', (gltf) => {
        incrementLoaded();
        const modelGroup = new THREE.Group();
        // Position next to iceb.glb (which is at x: 60)
        modelGroup.position.set(180, 19, -180);
        modelGroup.rotation.y = -Math.PI / 2; // Same rotation as gl.glb
        modelGroup.scale.set(40, 40, 40); // Same scale as gl.glb

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        // Store reference to character model (using index 18)
        characterModels[18] = {
            group: modelGroup,
            position: { x: 80, y: 7, z: -150 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading icee.glb:', error);
    });
}

function loadMinescarModel(scene, characterModels) {
    gltfLoader.load('/pinklocation/minescar.glb', (gltf) => {
        incrementLoaded();
        const modelGroup = new THREE.Group();
        // Position next to icee.glb (which is at x: 180, y: 19, z: -180)
        modelGroup.position.set(180,5, -200); // Positioned to the right of icee.glb
        modelGroup.rotation.y = Math.PI / 2; // Same rotation as icee.glb
        modelGroup.scale.set(12,12, 12); // Same scale as icee.glb

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        modelGroup.userData.isMinescar = true; // Mark as minescar for easy identification
        // Store reference to character model (using next available index)
        const nextIndex = characterModels.length;
        characterModels[nextIndex] = {
            group: modelGroup,
            position: { x: 240, y: 19, z: -180 },
            isInteracting: false,
            isMinescar: true // Mark for easy identification
        };
    }, undefined, (error) => {
        console.error('Error loading minescar.glb:', error);
    });
}

function loadRetrotvModel(scene, characterModels) {
    gltfLoader.load('/pinklocation/retrotv.glb', (gltf) => {
        incrementLoaded();
        const modelGroup = new THREE.Group();
        // Position next to minescar.glb (which is at x: 240, y: 19, z: -180)
        modelGroup.position.set(180, 5, -235); // Positioned to the right of minescar.glb
        modelGroup.rotation.y = -Math.PI / 2; // Same rotation as minescar.glb
        modelGroup.scale.set(12, 12, 12); // Same scale as minescar.glb

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        modelGroup.userData.isRetrotv = true; // Mark as retrotv for easy identification
        // Store reference to character model (using next available index)
        const nextIndex = characterModels.length;
        characterModels[nextIndex] = {
            group: modelGroup,
            position: { x: 300, y: 19, z: -180 },
            isInteracting: false,
            isRetrotv: true // Mark for easy identification
        };
    }, undefined, (error) => {
        console.error('Error loading retrotv.glb:', error);
    });
}

function loadHandeyeModel(scene, characterModels) {
    gltfLoader.load('/pinklocation/handeye.glb', (gltf) => {
        incrementLoaded();
        const modelGroup = new THREE.Group();
        // Position next to retrotv.glb (which is at x: 180, y: 5, z: -235)
        modelGroup.position.set(180,5, -160); // Positioned to the right of retrotv.glb
        modelGroup.rotation.y = -Math.PI / 2; // Same rotation as retrotv.glb
        modelGroup.scale.set(12, 12, 12); // Same scale as retrotv.glb

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        modelGroup.userData.isCharacterModel = true;
        // Mark to exclude from aggressive distance culling (model is far from spawn)
        modelGroup.userData.skipDistanceCull = true;
        // Mark to never hide this model
        modelGroup.userData.neverHide = true;
        const nextIndex = characterModels.length;
        characterModels[nextIndex] = {
            group: modelGroup,
            position: { x: 180, y: 5, z: -150 },
            isInteracting: false,
            isHandeye: true // Mark for easy identification
        };
    }, undefined, (error) => {
        console.error('Error loading handeye.glb:', error);
    });
}


function loadTomatoModel(scene, characterModels) {
    gltfLoader.load('/pinklocation/tomato.glb', (gltf) => {
        incrementLoaded();
        const modelGroup = new THREE.Group();
        // Position next to video.mp4 screen (which is at x: 290, y: 27, z: 0)
        modelGroup.position.set(200, 25, 130); // Positioned to the right of video screen
        modelGroup.rotation.y = Math.PI / 2; // Same rotation as video screen
        modelGroup.scale.set(50, 50, 50); // Adjust scale as needed

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                // Explicitly clone material to preserve colors
                if (clonedMesh.material) {
                    if (Array.isArray(clonedMesh.material)) {
                        clonedMesh.material = clonedMesh.material.map(mat => mat.clone());
                    } else {
                        clonedMesh.material = clonedMesh.material.clone();
                    }
                }
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        // Mark to exclude from aggressive distance culling (model is far from spawn)
        modelGroup.userData.skipDistanceCull = true;
        // Mark to never hide this model
        modelGroup.userData.neverHide = true;
        // Store reference to character model (using next available index)
        const nextIndex = characterModels.length;
        characterModels[nextIndex] = {
            group: modelGroup,
            position: { x: 200, y: 25, z: 80 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading tomato.glb:', error);
    });
}

function loadBluetoModel(scene, characterModels) {
    gltfLoader.load('/pinklocation/blueto.glb', (gltf) => {
        incrementLoaded();
        const modelGroup = new THREE.Group();
        // Position next to tomato.glb (which is at x: 200, y: 25, z: 130)
        modelGroup.position.set(190, 23, 290); // Positioned to the left of tomato
        modelGroup.rotation.y = Math.PI / 2; // Same rotation as tomato
        modelGroup.scale.set(50, 50, 50); // Adjust scale as needed

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                // Explicitly clone material to preserve colors
                if (clonedMesh.material) {
                    if (Array.isArray(clonedMesh.material)) {
                        clonedMesh.material = clonedMesh.material.map(mat => mat.clone());
                    } else {
                        clonedMesh.material = clonedMesh.material.clone();
                    }
                }
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        // Mark to exclude from aggressive distance culling (model is far from spawn)
        modelGroup.userData.skipDistanceCull = false;
        // Mark to never hide this model
        modelGroup.userData.neverHide = false;
        // Store reference to character model (using next available index)
        const nextIndex = characterModels.length;
        characterModels[nextIndex] = {
            group: modelGroup,
            position: { x: 190, y: 25, z: 130 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading blueto.glb:', error);
    });
}

function loadEyeballpModel(scene, characterModels) {
    gltfLoader.load('/pinklocation/eyeballp.glb', (gltf) => {
        incrementLoaded();
        const modelGroup = new THREE.Group();
        // Position next to video.mp4 screen (which is at x: 290, y: 27, z: 0)
        modelGroup.position.set(220, 27, 0); // Positioned to the right of video screen
        modelGroup.rotation.y = Math.PI + 110; // Same rotation as video screen
        modelGroup.scale.set(12, 12, 12); // Adjust scale as needed

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        modelGroup.userData.isEyeballp = true; // Mark as eyeballp for animation
        // Mark to exclude from aggressive distance culling (model is far from spawn)
        modelGroup.userData.skipDistanceCull = true;
        // Store reference to character model (using next available index)
        const nextIndex = characterModels.length;
        characterModels[nextIndex] = {
            group: modelGroup,
            position: { x: 220, y: 27, z: 0 },
            isInteracting: false,
            isEyeballp: true, // Mark for animation
            baseRotationY: Math.PI + 110, // Store base rotation
            originalY: 27, // Store original Y position
            targetY: 27 // Target Y position for smooth animation
        };
    }, undefined, (error) => {
        console.error('Error loading eyeballp.glb:', error);
    });
}
function loadEyeballpModel2(scene, characterModels) {
    gltfLoader.load('/pinklocation/eyeballp.glb', (gltf) => {
        incrementLoaded();
        const modelGroup = new THREE.Group();
        // Position next to video.mp4 screen (which is at x: 290, y: 27, z: 0)
        modelGroup.position.set(170, 35, -30); // Positioned to the right of video screen
        modelGroup.rotation.y = Math.PI + 116; // Same rotation as video screen
        modelGroup.scale.set(12, 12, 12); // Adjust scale as needed

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        modelGroup.userData.isEyeballp = true; // Mark as eyeballp for animation
        // Mark to exclude from aggressive distance culling (model is far from spawn)
        modelGroup.userData.skipDistanceCull = true;
        // Store reference to character model (using next available index)
        const nextIndex = characterModels.length;
        characterModels[nextIndex] = {
            group: modelGroup,
            position: { x: 220, y: 27, z: 0 },
            isInteracting: false,
            isEyeballp: true, // Mark for animation
            baseRotationY: Math.PI + 116, // Store base rotation
            originalY: 35, // Store original Y position
            targetY: 35 // Target Y position for smooth animation
        };
    }, undefined, (error) => {
        console.error('Error loading eyeballp.glb:', error);
    });
}

function loadEyeballpModel3(scene, characterModels) {
    gltfLoader.load('/pinklocation/eyeballp.glb', (gltf) => {
        incrementLoaded();
        const modelGroup = new THREE.Group();
        // Position next to video.mp4 screen (which is at x: 290, y: 27, z: 0)
        modelGroup.position.set(140, 35, 30); // Positioned to the right of video screen
        modelGroup.rotation.y = Math.PI + 97; // Same rotation as video screen
        modelGroup.scale.set(12, 12, 12); // Adjust scale as needed

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        modelGroup.userData.isEyeballp = true; // Mark as eyeballp for animation
        // Mark to exclude from aggressive distance culling (model is far from spawn)
        modelGroup.userData.skipDistanceCull = true;
        // Store reference to character model (using next available index)
        const nextIndex = characterModels.length;
        characterModels[nextIndex] = {
            group: modelGroup,
            position: { x: 220, y: 27, z: 0 },
            isInteracting: false,
            isEyeballp: true, // Mark for animation
            baseRotationY: Math.PI + 97, // Store base rotation
            originalY: 35, // Store original Y position
            targetY: 35 // Target Y position for smooth animation
        };
    }, undefined, (error) => {
        console.error('Error loading eyeballp.glb:', error);
    });
}

function loadIceOModel(scene, characterModels) {
    gltfLoader.load('/pinklocation/iceo.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        // Position next to icee.glb (which is at x: 80)
        modelGroup.position.set(-1, 19, -100);
        modelGroup.rotation.y = -Math.PI / 2; // Same rotation as gl.glb
        modelGroup.scale.set(40, 40, 40); // Same scale as gl.glb

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        // Mark to exclude from aggressive distance culling (model is far from spawn)
        modelGroup.userData.skipDistanceCull = true;
        // Mark to never hide this model
        modelGroup.userData.neverHide = true;
        // Store reference to character model (using index 19)
        characterModels[19] = {
            group: modelGroup,
            position: { x: 100, y: 7, z: -150 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading iceo.glb:', error);
    });
}

function loadIceRModel(scene, characterModels) {
    gltfLoader.load('/pinklocation/icer.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        // Position next to iceo.glb (which interaction position is at x: 100)
        modelGroup.position.set(-110, 19, -200);
        modelGroup.rotation.y = -Math.PI / 2; // Same rotation as gl.glb
        modelGroup.scale.set(40, 40, 40); // Same scale as gl.glb

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        // Store reference to character model (using index 21)
        characterModels[21] = {
            group: modelGroup,
            position: { x: 110, y: 7, z: -150 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading icer.glb:', error);
    });
}

function loadIceVModel(scene, characterModels) {
    gltfLoader.load('/pinklocation/icek.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        // Position next to icer.glb (which is at x: 110)
        modelGroup.position.set(-280, 19, -250);
        modelGroup.rotation.y = -Math.PI / 2; // Same rotation as gl.glb
        modelGroup.scale.set(40, 40, 40); // Same scale as gl.glb

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Store reference to character model (using index 20)
        characterModels[20] = {
            group: modelGroup,
            position: { x: 120, y: 7, z: -150 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading icev.glb:', error);
    });
}

function loadFModel(scene, characterModels) {
    gltfLoader.load('/f.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-170, 7, -80);
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
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        // Mark to exclude from aggressive distance culling (model is far from spawn)
        modelGroup.userData.skipDistanceCull = false;
        // Mark to never hide this model
        modelGroup.userData.neverHide = false;
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
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        // Mark to exclude from aggressive distance culling (model is far from spawn)
        modelGroup.userData.skipDistanceCull = false;
        // Mark to never hide this model
        modelGroup.userData.neverHide = false;
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
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        // Mark to exclude from aggressive distance culling (model is far from spawn)
        modelGroup.userData.skipDistanceCull = true;
        // Mark to never hide this model
        modelGroup.userData.neverHide = true;
        characterModels[12] = {
            group: modelGroup,
            position: { x: -46, y: 7, z: 10 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading lotus.glb:', error);
    });
}



function loadPinkfModel(scene, characterModels) {
    gltfLoader.load('/pinkf.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        modelGroup.position.set(-230, 7, -85);
        modelGroup.rotation.y = Math.PI + 40;
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
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
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
        modelGroup.position.set(-180, 7, -80);
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
        modelGroup.position.set(-190, 7, -80);
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
        modelGroup.position.set(-199, 4, -43);
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
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
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
        modelGroup.position.set(-180, 7, -33);
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

function loadBiarModel(scene , characterModels) {
    gltfLoader.load('/playground/biar.glb', (gltf) => {
        incrementLoaded();
        const modelGroup = new THREE.Group();
        // Position next to cactus at spawn location (cactus is at x: 5, z: 5)
        modelGroup.position.set(10, 10, 150); // Next to cactus, slightly to the right
        modelGroup.rotation.y = -Math.PI / 2; // Face forward
        modelGroup.scale.set(12, 12, 12); // Similar scale to other characters

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        // Store reference to character model (using next available index)
        const nextIndex = characterModels.length;
        characterModels[nextIndex] = {
            group: modelGroup,
            position: { x: 10, y: 10, z: 150 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading biar.glb:', error);
    });
}

function loadBiagrModel(scene, characterModels) {
    gltfLoader.load('/pinklocation/biagr.glb', (gltf) => {
        incrementLoaded();
        const modelGroup = new THREE.Group();
        // Position next to biar.glb (which is at x: 10, y: 10, z: 150)
        modelGroup.position.set(30, 10, 175); // To the right of biar
        modelGroup.rotation.y = Math.PI * 2 ; // Same rotation as biar
        modelGroup.scale.set(12, 12, 12); // Same scale as biar

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                // Explicitly clone material to preserve colors
                if (clonedMesh.material) {
                    if (Array.isArray(clonedMesh.material)) {
                        clonedMesh.material = clonedMesh.material.map(mat => mat.clone());
                    } else {
                        clonedMesh.material = clonedMesh.material.clone();
                    }
                }
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        // Store reference to character model (using next available index)
        const nextIndex = characterModels.length;
        characterModels[nextIndex] = {
            group: modelGroup,
            position: { x: 20, y: 10, z: 150 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading biagr.glb:', error);
    });
}

function loadBiabModel(scene , characterModels) {
    gltfLoader.load('/playground/biab.glb', (gltf) => {
        incrementLoaded();
        const modelGroup = new THREE.Group();
        // Position next to biar.glb (biar is at x: 10, y: 10, z: 250)
        modelGroup.position.set(10, 10, 200); // Next to biar.glb, slightly to the right
        modelGroup.rotation.y = -Math.PI / 2; // Face forward (same as biar)
        modelGroup.scale.set(12, 12, 12); // Same scale as biar

        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const clonedMesh = child.clone();
                clonedMesh.castShadow = true;
                clonedMesh.receiveShadow = true;
                modelGroup.add(clonedMesh);
            }
        });

        scene.add(modelGroup);
        // Mark as character model for frustum culling
        modelGroup.userData.isCharacterModel = true;
        // Store reference to character model (using next available index)
        const nextIndex = characterModels.length;
        characterModels[nextIndex] = {
            group: modelGroup,
            position: { x: 10, y: 10, z: 200 },
            isInteracting: false
        };
    }, undefined, (error) => {
        console.error('Error loading biab.glb:', error);
    });
}

export function loadIppoacModel(scene) {
    gltfLoader.load('/playground/ippoac.glb', (gltf) => {
        const modelGroup = new THREE.Group();
        // Position next to biar.glb (biar is at x: 10, y: 10, z: 150)
        modelGroup.position.set(10, 1, 140); // Next to biar.glb, to the right
        modelGroup.rotation.y = Math.PI / 2; // Face forward (same as biar)
        
        // Apply scale to the scene itself, then add to modelGroup
        gltf.scene.scale.set(12, 12, 12);
        gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        modelGroup.add(gltf.scene);

        scene.add(modelGroup);
    }, undefined, (error) => {
        console.error('Error loading ippoac.glb:', error);
    });
}

function loadNewCharacter(scene) {
    return new Promise((resolve) => {
        gltfLoader.load('/ld.glb', (gltf) => {
            const modelGroup = new THREE.Group();
            modelGroup.position.set(0, 3, -230);
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
    loadGLModel(scene, characterModels); // Load gl.glb next to pink characters
    loadIceBModel(scene, characterModels); // Load iceb.glb
    loadIceEModel(scene, characterModels); // Load icee.glb
    loadMinescarModel(scene, characterModels); // Load minescar.glb next to icee.glb
    loadRetrotvModel(scene, characterModels); // Load retrotv.glb next to minescar.glb
    loadHandeyeModel(scene, characterModels); // Load handeye.glb next to retrotv.glb
    loadTomatoModel(scene, characterModels); // Load tomato.glb next to video.mp4 screen
    loadBluetoModel(scene, characterModels); // Load blueto.glb next to tomato model
    loadEyeballpModel(scene, characterModels); // Load eyeballp.glb next to video.mp4 screen
    loadIceOModel(scene, characterModels); // Load iceo.glb
    loadIceRModel(scene, characterModels); // Load icer.glb
    loadIceVModel(scene, characterModels); // Load icev.glb
    loadFModel(scene, characterModels);
    loadEyeballpModel2(scene, characterModels);
    loadEyeballpModel3(scene, characterModels)
    loadAngleModel(scene, characterModels);
    loadLotusModel(scene, characterModels);
    loadLotusModel2(scene, characterModels);
    loadDaisyModel(scene, characterModels);
    loadLotus2Model(scene, characterModels);
    loadBiabModel(scene , characterModels)
    loadBiarModel(scene , characterModels)
    loadBiagrModel(scene, characterModels); // Load biagr.glb next to biar.glb
    loadPinkfModel(scene, characterModels);
  
    loadVEModel(scene, characterModels);
    loadPPModel(scene, characterModels);
    loadLMModel(scene, characterModels);
    loadFATModel(scene, characterModels);

    // Load new character and return it
    return loadNewCharacter(scene);
}
