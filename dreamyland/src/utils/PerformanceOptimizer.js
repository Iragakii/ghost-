import * as THREE from 'three';

// Distance thresholds for optimizations
export const DISTANCE_THRESHOLDS = {
    FREEZE_ANIMATION: 80,     // Freeze animations beyond this distance (more aggressive)
    DISABLE_SHADOWS: 60,     // Disable shadows beyond this distance (more aggressive for better performance)
    REDUCE_QUALITY_LOW: 25,  // Start reducing quality (low tier)
    REDUCE_QUALITY_MED: 50,  // Medium quality reduction
    REDUCE_QUALITY_HIGH: 80, // High quality reduction (very low quality) - more aggressive
    FOG_START: 30,           // Fog starts becoming noticeable
    FOG_END: 100             // Fog fully obscures objects
};

// Store original states for restoration
const objectStates = new WeakMap();

// Quality levels
const QUALITY_LEVELS = {
    HIGH: 'high',      // Full quality (close)
    MEDIUM: 'medium',  // Reduced quality (medium distance)
    LOW: 'low',        // Low quality (far)
    VERY_LOW: 'very_low' // Very low quality (very far)
};

/**
 * Optimize object based on distance from camera/target
 */
export function optimizeObjectByDistance(object, distance, cameraPosition) {
    if (!object) return;

    // Calculate distance if not provided (use reusable vector)
    if (distance === undefined) {
        object.getWorldPosition(optObjectPos);
        distance = cameraPosition.distanceTo(optObjectPos);
    }

    // Get or create state storage
    if (!objectStates.has(object)) {
        objectStates.set(object, {
            originalCastShadow: null,
            originalReceiveShadow: null,
            originalVisible: null,
            mixer: null,
            actions: null,
            originalMaterials: new Map(), // Store original materials for quality restoration
            currentQuality: QUALITY_LEVELS.HIGH
        });
    }
    const state = objectStates.get(object);

    // Determine quality level based on distance
    let targetQuality = QUALITY_LEVELS.HIGH;
    if (distance > DISTANCE_THRESHOLDS.REDUCE_QUALITY_HIGH) {
        targetQuality = QUALITY_LEVELS.VERY_LOW;
    } else if (distance > DISTANCE_THRESHOLDS.REDUCE_QUALITY_MED) {
        targetQuality = QUALITY_LEVELS.LOW;
    } else if (distance > DISTANCE_THRESHOLDS.REDUCE_QUALITY_LOW) {
        targetQuality = QUALITY_LEVELS.MEDIUM;
    }

    // Traverse all meshes in the object
    object.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
            // Store original shadow settings on first pass
            if (state.originalCastShadow === null) {
                state.originalCastShadow = child.castShadow;
                state.originalReceiveShadow = child.receiveShadow;
            }

            // Store original material on first pass
            if (!state.originalMaterials.has(child)) {
                state.originalMaterials.set(child, child.material);
            }
            const originalMaterial = state.originalMaterials.get(child);

            // Apply quality reduction based on distance
            // Check if mesh already has the target quality level
            const currentMeshQuality = child.material?.userData?.qualityLevel || QUALITY_LEVELS.HIGH;
            if (targetQuality !== currentMeshQuality && originalMaterial) {
                applyQualityLevel(child, originalMaterial, targetQuality, state);
            }

            // Disable shadows when far (big performance boost)
            if (distance > DISTANCE_THRESHOLDS.DISABLE_SHADOWS) {
                child.castShadow = false;
                child.receiveShadow = false;
            } else {
                // Restore original shadow settings
                if (state.originalCastShadow !== null) {
                    child.castShadow = state.originalCastShadow;
                    child.receiveShadow = state.originalReceiveShadow;
                }
            }

            // Ensure frustum culling is enabled (default, but make sure)
            child.frustumCulled = true;
        }
    });

    // Update current quality level
    state.currentQuality = targetQuality;

    // Freeze animations when far
    if (object.userData && object.userData.mixer) {
        if (!state.mixer) {
            state.mixer = object.userData.mixer;
            state.actions = object.userData.actions;
        }

        if (distance > DISTANCE_THRESHOLDS.FREEZE_ANIMATION) {
            // Freeze animation by setting timeScale to 0 (don't update mixer)
            if (state.mixer && state.mixer.timeScale !== 0) {
                state.mixer.timeScale = 0;
            }
        } else {
            // Restore animation
            if (state.mixer && state.mixer.timeScale === 0) {
                state.mixer.timeScale = 1;
            }
        }
    }
}

/**
 * Apply quality level to mesh material
 */
function applyQualityLevel(mesh, originalMaterial, qualityLevel, state) {
    if (!originalMaterial) return;

    // If restoring to high quality, use original material
    if (qualityLevel === QUALITY_LEVELS.HIGH) {
        // Dispose of any simplified material if it exists
        if (mesh.material !== originalMaterial && mesh.material && mesh.material !== state.originalMaterials.get(mesh)) {
            mesh.material.dispose();
        }
        mesh.material = originalMaterial;
        return;
    }

    // Don't recreate material if we're already at the target quality
    if (mesh.material && mesh.material.userData && mesh.material.userData.qualityLevel === qualityLevel) {
        return;
    }

    // Dispose of previous simplified material if it exists
    if (mesh.material !== originalMaterial && mesh.material && mesh.material.userData && mesh.material.userData.isSimplified) {
        mesh.material.dispose();
    }

    // For reduced quality, create simplified materials
    let simplifiedMaterial = null;

    if (originalMaterial instanceof THREE.MeshStandardMaterial) {
        // Create simplified material based on quality level
        if (qualityLevel === QUALITY_LEVELS.VERY_LOW) {
            // Very low quality: Use basic material with flat color (cheapest)
            simplifiedMaterial = new THREE.MeshBasicMaterial({
                color: originalMaterial.color,
                transparent: originalMaterial.transparent,
                opacity: originalMaterial.opacity || 1.0
            });
        } else if (qualityLevel === QUALITY_LEVELS.LOW) {
            // Low quality: Use Lambert material (simpler lighting, no specular)
            simplifiedMaterial = new THREE.MeshLambertMaterial({
                color: originalMaterial.color,
                transparent: originalMaterial.transparent,
                opacity: originalMaterial.opacity || 1.0,
                map: originalMaterial.map // Keep texture but simpler lighting
            });
        } else if (qualityLevel === QUALITY_LEVELS.MEDIUM) {
            // Medium quality: Use StandardMaterial but with reduced features
            simplifiedMaterial = originalMaterial.clone();
            simplifiedMaterial.roughness = 1.0; // Make it less shiny (cheaper to render)
            simplifiedMaterial.metalness = 0.0; // Disable metalness calculations
            // Reduce texture quality
            if (simplifiedMaterial.map) {
                simplifiedMaterial.map.generateMipmaps = false;
                simplifiedMaterial.map.minFilter = THREE.LinearFilter;
                simplifiedMaterial.map.magFilter = THREE.LinearFilter;
            }
        }
    } else if (originalMaterial instanceof THREE.MeshBasicMaterial) {
        // Already basic, just use it
        simplifiedMaterial = originalMaterial;
    } else {
        // For other material types, create basic material
        const color = originalMaterial.color || (originalMaterial.uniforms && originalMaterial.uniforms.color?.value) || 0xffffff;
        simplifiedMaterial = new THREE.MeshBasicMaterial({
            color: color instanceof THREE.Color ? color : new THREE.Color(color),
            transparent: originalMaterial.transparent,
            opacity: originalMaterial.opacity || 1.0
        });
    }

    if (simplifiedMaterial) {
        // Mark as simplified material for tracking
        simplifiedMaterial.userData = {
            isSimplified: true,
            qualityLevel: qualityLevel
        };
        mesh.material = simplifiedMaterial;
    }
}

// Reusable vectors for optimization (never allocate in loop)
const optCharPos = new THREE.Vector3();
const optObjectPos = new THREE.Vector3();

// Frame counter for expensive operations
let optimizationFrameCounter = 0;

/**
 * Optimize all character models based on distance from target
 */
export function optimizeAllCharacters(characterModels, targetPosition, scene) {
    if (!targetPosition || !characterModels) return;

    // Use reusable vector instead of creating new one every frame
    characterModels.forEach((char, index) => {
        if (char && char.group) {
            char.group.getWorldPosition(optCharPos);
            const distance = targetPosition.distanceTo(optCharPos);
            optimizeObjectByDistance(char.group, distance, targetPosition);
        }
    });
    
    // Only traverse scene every 3 frames (expensive operation)
    optimizationFrameCounter++;
    if (optimizationFrameCounter % 3 === 0) {
        // Also optimize all objects in scene that have userData.mixer (animated objects)
        scene.traverse((object) => {
            if (object.userData && object.userData.mixer && object.parent) {
                object.getWorldPosition(optObjectPos);
                const distance = targetPosition.distanceTo(optObjectPos);
                optimizeObjectByDistance(object, distance, targetPosition);
            }
        });
    }
}

/**
 * Update fog density based on distance (optional enhancement)
 */
export function updateFogForDistance(scene, targetPosition) {
    if (!scene.fog || !targetPosition) return;
    
    // Fog is already set up, but we can adjust it dynamically if needed
    // For now, the static fog in Scene.js should be sufficient
}

