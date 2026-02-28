/**
 * Frustum Culling System
 * Hides objects that are outside camera view to improve FPS when rotating camera
 */

import * as THREE from 'three';

// Reusable objects for frustum calculations
const frustum = new THREE.Frustum();
const matrix = new THREE.Matrix4();

/**
 * Update frustum from camera
 */
export function updateFrustum(camera) {
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);
    return frustum;
}

/**
 * Check if object is visible in camera frustum
 */
export function isObjectVisible(object, camera) {
    if (!object || !object.visible) return false;
    
    // Update frustum
    updateFrustum(camera);
    
    // Get object bounding box
    const box = new THREE.Box3();
    box.setFromObject(object);
    
    // Check if bounding box intersects frustum
    return frustum.intersectsBox(box);
}

// Reusable bounding box (never allocate in loop)
const cullBox = new THREE.Box3();
const cullObjectPos = new THREE.Vector3();

// Frame counter for culling (only cull every 2 frames to reduce CPU cost)
let cullFrameCounter = 0;

/**
 * Cull objects outside camera view
 * Sets visible = false for objects outside frustum
 * Optimized to only check character models (not main characters, terrain, sky, lights)
 */
export function cullObjectsOutsideView(scene, camera, characterModels) {
    if (!scene || !camera) return;
    
    // Only cull every 2 frames to reduce CPU cost
    cullFrameCounter++;
    if (cullFrameCounter % 2 !== 0) return;
    
    // Update frustum once
    updateFrustum(camera);
    
    // Cull character models from the array (more efficient than scene.traverse)
    if (characterModels && characterModels.length > 0) {
        characterModels.forEach((char) => {
            if (!char || !char.group) return;
            
            // Never hide models marked with neverHide flag
            if (char.group.userData.neverHide) {
                // Always keep visible
                if (char.group.userData.wasCulled) {
                    char.group.visible = true;
                    char.group.userData.wasCulled = false;
                }
                return;
            }
            
            // Skip distance culling for models marked to skip it (e.g., models far from spawn)
            if (char.group.userData.skipDistanceCull) {
                // Still do frustum culling, but not distance-based hiding
                cullBox.setFromObject(char.group);
                const isVisible = frustum.intersectsBox(cullBox);
                if (!isVisible) {
                    char.group.visible = false;
                    char.group.userData.wasCulled = true;
                } else {
                    if (char.group.userData.wasCulled) {
                        char.group.visible = true;
                        char.group.userData.wasCulled = false;
                    }
                }
                return;
            }
            
            // Quick distance check first (cheaper than frustum)
            char.group.getWorldPosition(cullObjectPos);
            const distance = camera.position.distanceTo(cullObjectPos);
            
            // If very far, hide it (fog will hide it anyway)
            if (distance > 150) {
                char.group.visible = false;
                char.group.userData.wasCulled = true;
                return;
            }
            
            // Get bounding box (reuse box object)
            cullBox.setFromObject(char.group);
            
            // Check if in frustum
            const isVisible = frustum.intersectsBox(cullBox);
            
            if (!isVisible) {
                // Object is outside view, hide it
                char.group.visible = false;
                char.group.userData.wasCulled = true;
            } else {
                // Object is in view, ensure it's visible
                if (char.group.userData.wasCulled) {
                    char.group.visible = true;
                    char.group.userData.wasCulled = false;
                }
            }
        });
    }
    
    // Also cull animated objects in scene (but less frequently)
    if (cullFrameCounter % 4 === 0) {
        scene.traverse((object) => {
            // Only check groups with mixers (animated objects)
            if (!(object instanceof THREE.Group) || !object.userData || !object.userData.mixer) {
                return;
            }
            
            // Skip main characters (always visible)
            if (object.userData.isMainCharacter || object.userData.isLuvu || object.userData.isCactus || object.userData.isIppoac) {
                return;
            }
            
            // Quick distance check first
            object.getWorldPosition(cullObjectPos);
            const distance = camera.position.distanceTo(cullObjectPos);
            
            if (distance > 150) {
                object.visible = false;
                object.userData.wasCulled = true;
                return;
            }
            
            // Get bounding box
            cullBox.setFromObject(object);
            
            // Check if in frustum
            const isVisible = frustum.intersectsBox(cullBox);
            
            if (!isVisible) {
                object.visible = false;
                object.userData.wasCulled = true;
            } else {
                if (object.userData.wasCulled) {
                    object.visible = true;
                    object.userData.wasCulled = false;
                }
            }
        });
    }
}

/**
 * Quick visibility check for a single object (lighter weight)
 */
export function quickVisibilityCheck(object, camera) {
    if (!object || !object.visible) return false;
    
    // Simple distance check first (cheaper than frustum)
    const cameraPos = camera.position;
    const objectPos = new THREE.Vector3();
    object.getWorldPosition(objectPos);
    const distance = cameraPos.distanceTo(objectPos);
    
    // If very far, assume not visible (fog will hide it anyway)
    if (distance > 200) return false;
    
    // For closer objects, do frustum check
    updateFrustum(camera);
    const box = new THREE.Box3();
    box.setFromObject(object);
    return frustum.intersectsBox(box);
}

