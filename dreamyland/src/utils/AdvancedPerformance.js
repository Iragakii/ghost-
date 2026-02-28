/**
 * Advanced Performance Optimizations
 * Additional optimizations for stable FPS
 */

import * as THREE from 'three';

/**
 * Optimize renderer settings for maximum performance
 */
export function optimizeRenderer(renderer) {
    if (!renderer) return;
    
    // Use BasicShadowMap instead of PCFSoftShadowMap (much faster, slightly lower quality)
    renderer.shadowMap.type = THREE.BasicShadowMap;
    
    // Disable tone mapping (saves GPU cycles)
    renderer.toneMapping = THREE.NoToneMapping;
    
    // Reduce pixel ratio further for better performance (1.5 max instead of 2.0)
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    
    // Disable antialiasing if performance is critical (can be re-enabled if needed)
    // Note: This is already set in Scene.js, but we ensure it's optimized
    
    // Reduce shadow map auto-update frequency (update shadows less often)
    // Shadows will update every frame by default, but we can optimize this in Game.js
}

/**
 * Optimize terrain geometry (reduce complexity)
 */
export function optimizeTerrain(floorGeo) {
    if (!floorGeo) return;
    
    // Reduce terrain segments if too high (200x200 is very high)
    // We'll keep it as is for now since it's already created, but we can reduce update frequency
    // The terrain update is already optimized to run every 2 frames
}

/**
 * Reduce shadow map resolution further
 */
export function optimizeShadows(dirLight) {
    if (!dirLight || !dirLight.shadow) return;
    
    // Reduce shadow map resolution to 512x512 (from 1024x1024)
    // This is a significant performance boost with minimal visual impact
    dirLight.shadow.mapSize.width = 512;
    dirLight.shadow.mapSize.height = 512;
    
    // Reduce shadow camera frustum size (smaller shadow area = better performance)
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 50;
}

/**
 * Optimize particle system updates
 */
export function shouldUpdateParticles(frameCounter) {
    // Update particles every 2 frames (reduces CPU load)
    return frameCounter % 2 === 0;
}

/**
 * Optimize video screen shader updates
 */
export function shouldUpdateVideoScreen(distance, frameCounter) {
    // Skip video updates if far away
    if (distance > 80) return false;
    
    // Update video shaders every 2 frames when close (reduces GPU load)
    return frameCounter % 2 === 0;
}

/**
 * Reduce material switches by batching objects with same material
 * This reduces draw calls significantly
 */
export function optimizeMaterialBatching(scene) {
    // This is a complex optimization that would require restructuring the scene
    // For now, we'll rely on Three.js's automatic batching
    // But we can ensure materials are shared where possible
}

/**
 * Cache expensive calculations
 */
const calculationCache = new Map();
let cacheFrame = 0;

export function getCachedCalculation(key, calculateFn, frameCounter) {
    // Clear cache every 60 frames to prevent memory leaks
    if (frameCounter - cacheFrame > 60) {
        calculationCache.clear();
        cacheFrame = frameCounter;
    }
    
    if (calculationCache.has(key)) {
        return calculationCache.get(key);
    }
    
    const result = calculateFn();
    calculationCache.set(key, result);
    return result;
}

/**
 * Reduce update frequency for non-critical systems
 */
export function shouldUpdateSystem(systemName, frameCounter) {
    const updateFrequencies = {
        'terrain': 2,        // Every 2 frames
        'particles': 2,      // Every 2 frames
        'optimization': 2,   // Every 2 frames
        'interactions': 2,   // Every 2 frames
        'culling': 2,        // Every 2 frames
        'fpsCounter': 60,    // Every 60 frames (once per second at 60fps)
        'videoScreen': 2     // Every 2 frames
    };
    
    const frequency = updateFrequencies[systemName] || 1;
    return frameCounter % frequency === 0;
}

/**
 * Disable shadows for objects beyond a certain distance
 * This is already done in PerformanceOptimizer, but we can make it more aggressive
 */
export const SHADOW_DISTANCE = 60; // Disable shadows beyond 60 units (reduced from 80)

/**
 * Reduce animation update frequency for distant objects
 */
export function shouldUpdateAnimation(distance, frameCounter) {
    // Very far objects: update every 4 frames
    if (distance > 80) {
        return frameCounter % 4 === 0;
    }
    // Far objects: update every 2 frames
    if (distance > 50) {
        return frameCounter % 2 === 0;
    }
    // Close objects: update every frame
    return true;
}

