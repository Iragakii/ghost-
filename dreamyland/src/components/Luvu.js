import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { incrementLoaded } from '../utils/LoadingScreen.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.setMeshoptDecoder(MeshoptDecoder);

export function createLuvu(scene) {
    const luvuGroup = new THREE.Group();
    // Make the model bigger
    luvuGroup.scale.set(5, 5, 5);
    luvuGroup.position.set(0, 20, 0);
    scene.add(luvuGroup);

    // Calculate bottom offset (will be set after model loads)
    let bottomOffset = 1.0;
    let bodyMesh = null;
    let leftEye = null;
    let rightEye = null;
    let leftHand = null;
    let rightHand = null;
    let silkBody = null;
    let scarSilk = null;

    gltfLoader.load('/luvu.glb', (gltf) => {
        incrementLoaded();
        // Clone the scene to add to our group
        const model = gltf.scene.clone();
        
        // Find all the parts by name
        const allMeshes = [];
        model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                allMeshes.push(child);
                
                // Find parts by name (exact match first, then partial)
                const name = child.name.toLowerCase();
                if (name === 'left_eye') {
                    leftEye = child;
                } else if (name === 'right_eye') {
                    rightEye = child;
                } else if (name === 'left_hand') {
                    leftHand = child;
                } else if (name === 'right_hand') {
                    rightHand = child;
                } else if (name === 'silk_body') {
                    silkBody = child;
                    bodyMesh = child; // Use silk_body as the main body for jump scale
                    // Initialize rotation to ensure no side lean
                    silkBody.rotation.z = 0;
                    silkBody.rotation.x = 0;
                } else if (name === 'scar_silk') {
                    scarSilk = child;
                } else {
                    // Try partial matches
                    if (name.includes('left_eye') && !leftEye) leftEye = child;
                    if (name.includes('right_eye') && !rightEye) rightEye = child;
                    if (name.includes('left_hand') && !leftHand) leftHand = child;
                    if (name.includes('right_hand') && !rightHand) rightHand = child;
                    if (name.includes('silk_body') && !silkBody) {
                        silkBody = child;
                        bodyMesh = child;
                        // Initialize rotation to ensure no side lean
                        silkBody.rotation.z = 0;
                        silkBody.rotation.x = 0;
                    }
                    if (name.includes('scar_silk') && !scarSilk) scarSilk = child;
                }
            }
        });

        // If we couldn't find by name, try to find by geometry/material
        if (!leftEye || !rightEye || !leftHand || !rightHand || !silkBody) {
            const meshes = [];
            model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    meshes.push(child);
                }
            });
            
            // Try to identify parts by index (based on the React code structure)
            if (meshes.length >= 6) {
                if (!leftEye) leftEye = meshes[0]; // left_eye
                if (!leftHand) leftHand = meshes[1]; // left_hand
                if (!rightEye) rightEye = meshes[2]; // right_eye
                if (!rightHand) rightHand = meshes[3]; // right_hand
                if (!scarSilk) scarSilk = meshes[4]; // scar_silk
                if (!silkBody) {
                    silkBody = meshes[5]; // silk_body
                    bodyMesh = meshes[5];
                    // Initialize rotation to ensure no side lean
                    silkBody.rotation.z = 0;
                    silkBody.rotation.x = 0;
                }
            }
        }

        // Change color of hands, body silk, and scar silk (not eyes)
        // Create a new material with the desired color
        const newColor = new THREE.Color(0xFFB2B2); // Light purple/lavender color (adjust as needed)
        const newMaterial = new THREE.MeshStandardMaterial({ 
            color: newColor,
            metalness: 0.1,
            roughness: 0.8
        });
        const newColor2 = new THREE.Color(0xFF6666); // Light purple/lavender color (adjust as needed)
        const newMaterial2 = new THREE.MeshStandardMaterial({ 
            color: newColor2,
            metalness: 0.1,
            roughness: 0.8
        });
        
        // Apply new material to hands, body silk, and scar silk
       
        if (silkBody && silkBody.material) {
            silkBody.material = newMaterial.clone();
        }
        if (scarSilk && scarSilk.material) {
            scarSilk.material = newMaterial.clone();
        }
        
        // Calculate bottom offset from bounding box (same as original ghost)
        // Calculate in local space first, then account for scale
        let localBottomOffset = 0;
        if (bodyMesh) {
            bodyMesh.geometry.computeBoundingBox();
            localBottomOffset = -bodyMesh.geometry.boundingBox.min.y;
            // Since the group is scaled 6x, multiply the local offset by scale
            // This gives us the world-space distance from group origin to model bottom
            // Add a small safety margin to ensure model sits on terrain
            bottomOffset = (localBottomOffset * 6) + 2.0;
        } else {
            // Fallback: use a reasonable default for scaled model
            localBottomOffset = 1.0;
            bottomOffset = 8.0;
        }
        
        // Add model to group after calculating offset
        luvuGroup.add(model);

        // Apply initial rotation to face forward (GLB models might be exported facing different directions)
        // Rotate -90 degrees to match ghost's default facing direction (+Z axis)
        model.rotation.y = -Math.PI / 2;
        // Ensure no side lean - rotation.z and rotation.x must be 0 for entire model
        model.rotation.z = 0;
        model.rotation.x = 0;
        
        // Also ensure the entire model group has no side rotation
        luvuGroup.rotation.z = 0;
        luvuGroup.rotation.x = 0;
        
        // Traverse and reset all child rotations to ensure no side lean
        model.traverse((child) => {
            if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
                // Only reset if it's not the silkBody (we'll control that separately)
                if (child !== silkBody) {
                    child.rotation.z = 0;
                }
            }
        });

        // Store original positions, scales, and rotations for ALL parts
        // This ensures all parts stay at their default imported positions when moving
        const originalPositions = {};
        const originalScales = {};
        const originalRotations = {};
        
        // Store original values for all found parts
        if (leftEye) {
            originalPositions.leftEye = leftEye.position.clone();
            originalScales.leftEye = leftEye.scale.clone();
            originalRotations.leftEye = leftEye.rotation.clone();
        }
        if (rightEye) {
            originalPositions.rightEye = rightEye.position.clone();
            originalScales.rightEye = rightEye.scale.clone();
            originalRotations.rightEye = rightEye.rotation.clone();
        }
        if (leftHand) {
            originalPositions.leftHand = leftHand.position.clone();
            originalScales.leftHand = leftHand.scale.clone();
            originalRotations.leftHand = leftHand.rotation.clone();
        }
        if (rightHand) {
            originalPositions.rightHand = rightHand.position.clone();
            originalScales.rightHand = rightHand.scale.clone();
            originalRotations.rightHand = rightHand.rotation.clone();
        }
        if (silkBody) {
            originalPositions.silkBody = silkBody.position.clone();
            originalScales.silkBody = silkBody.scale.clone();
            originalRotations.silkBody = silkBody.rotation.clone();
        }
        if (scarSilk) {
            originalPositions.scarSilk = scarSilk.position.clone();
            originalScales.scarSilk = scarSilk.scale.clone();
            originalRotations.scarSilk = scarSilk.rotation.clone();
        }
        
        // Create tear meshes (similar to old ghost code)
        // Create a face group to attach tears to (like old ghost code)
        const faceGroup = new THREE.Group();
        // Position face group relative to where eyes are (we'll adjust this based on actual eye positions)
        faceGroup.position.set(0, 0, 0); // Will be updated based on eye positions
        model.add(faceGroup);
        
        const tearGeo = new THREE.SphereGeometry(0.03, 5 ,5);
        const tearMat = new THREE.MeshStandardMaterial({ 
            color: 0x66ccff, 
            transparent: true, 
            opacity: 0.5 
        });
        const tears = [];
        
        // Create 4 tears (2 for left eye, 2 for right eye)
        // Add them to faceGroup (like old ghost code)
        for (let i = 0; i < 4; i++) {
            const tear = new THREE.Mesh(tearGeo, tearMat);
            tear.visible = false;
            faceGroup.add(tear); // Add to face group instead of model
            tears.push({ 
                mesh: tear, 
                yOffset: 0, 
                isLeft: i % 2 === 0 // Alternate between left and right
            });
        }
        
        // Create mouth (positioned under eyes, like the image)
        // Make it thinner like a line by reducing tube radius
        const mouthGeo = new THREE.TorusGeometry(0.05, 0.01, 4, 10, Math.PI);
        const blackMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const mouth = new THREE.Mesh(mouthGeo, blackMat);
        // Position mouth under the eyes (below center of face)
        mouth.position.set(0.35, -0.01, -0.001); // Under eyes, slightly forward
        mouth.rotation.y = -Math.PI / 19; // Default rotation (smile up)
        mouth.visible = false; // Hidden by default, only show when crying
        faceGroup.add(mouth);
        
        // Create "O" mouth for angry emotion (circular shape)
        const mouthOGeo = new THREE.TorusGeometry(0.03, 0.007, 4, 16, Math.PI * 2); // Full circle for "O"
        const mouthO = new THREE.Mesh(mouthOGeo, blackMat);
        // Position "O" mouth at same location as regular mouth
        mouthO.position.set(0.5, -0.01, -0.001); // Under eyes, slightly forward
        mouthO.rotation.y = -Math.PI / 19; // Default rotation
        mouthO.visible = false; // Hidden by default, only show when angry
        faceGroup.add(mouthO);
        
        // Store original mouth position and rotation
        const mouthOriginalPos = mouth.position.clone();
        const mouthOriginalRot = mouth.rotation.clone();
        const mouthOOriginalPos = mouthO.position.clone();
        const mouthOOriginalRot = mouthO.rotation.clone();
        
        // Store original model group position
        const modelGroupOriginalY = model.position.y;
        const modelGroupOriginalPos = model.position.clone();
        const modelGroupOriginalScale = model.scale.clone();
        const modelGroupOriginalRot = model.rotation.clone();
        
        // Store original eye positions for tear positioning
        const leftEyeOriginalPos = leftEye ? leftEye.position.clone() : new THREE.Vector3(-0.4, 0.2, 0);
        const rightEyeOriginalPos = rightEye ? rightEye.position.clone() : new THREE.Vector3(0.4, 0.2, 0);
        
        // Store references for animation control
        luvuGroup.userData = {
            leftEye,
            rightEye,
            leftHand,
            rightHand,
            silkBody,
            scarSilk,
            bodyMesh: bodyMesh || silkBody, // Main body for jump scale animation
            bottomOffset,
            modelGroup: model,
            faceGroup, // Store face group for tear positioning
            mouth, // Store mouth mesh (for crying)
            mouthO, // Store "O" mouth mesh (for angry)
            modelGroupOriginalY, // Store original Y position for bobbing
            modelGroupOriginalPos, // Store full original position
            modelGroupOriginalScale, // Store original scale
            modelGroupOriginalRot, // Store original rotation
            originalPositions, // Store all original positions
            originalScales, // Store all original scales
            originalRotations, // Store all original rotations
            tears, // Store tear meshes
            leftEyeOriginalPos, // Store original left eye position for tear placement
            rightEyeOriginalPos, // Store original right eye position for tear placement
            mouthOriginalPos, // Store original mouth position
            mouthOriginalRot, // Store original mouth rotation
            mouthOOriginalPos, // Store original "O" mouth position
            mouthOOriginalRot, // Store original "O" mouth rotation
            initialYSet: false // Flag to set initial Y position on terrain
        };
        
        // Set initial Y position on terrain (will be set in Game.js animate loop)
        // The position will be updated in updateLuvu function based on terrain
    }, undefined, (error) => {
        console.error('Error loading luvu.glb:', error);
    });

    return luvuGroup;
}

