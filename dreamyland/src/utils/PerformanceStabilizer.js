/**
 * Performance Stabilizer - Complete FPS Stability System
 * Implements all professional optimizations for stable frame times
 */

import * as THREE from 'three';

// Reusable objects (never allocate in animation loop)
export const reusableObjects = {
    vector3_1: new THREE.Vector3(),
    vector3_2: new THREE.Vector3(),
    vector3_3: new THREE.Vector3(),
    vector3_4: new THREE.Vector3(),
    vector3_5: new THREE.Vector3(),
    vector3_6: new THREE.Vector3(),
    euler_1: new THREE.Euler(),
    quaternion_1: new THREE.Quaternion(),
    matrix4_1: new THREE.Matrix4(),
    color_1: new THREE.Color()
};

/**
 * Adaptive DPR (Dynamic Pixel Ratio)
 * Automatically reduces resolution during performance spikes
 * DISABLED by default to prevent input lag - enable only if needed
 */
export class AdaptiveDPR {
    constructor(renderer, options = {}) {
        this.renderer = renderer;
        this.minDPR = options.minDPR || 0.5;
        this.maxDPR = options.maxDPR || 1.5;
        this.adaptiveRate = options.adaptiveRate || 0.05;
        this.targetFPS = options.targetFPS || 60;
        
        this.currentDPR = this.maxDPR;
        this.frameTimeHistory = [];
        this.historySize = 30; // Increased for smoother transitions
        this.isEnabled = false; // DISABLED by default - causes input lag
    }
    
    update(delta) {
        if (!this.isEnabled) return;
        
        const frameTime = delta * 1000; // Convert to ms
        const targetFrameTime = 1000 / this.targetFPS;
        
        // Add to history
        this.frameTimeHistory.push(frameTime);
        if (this.frameTimeHistory.length > this.historySize) {
            this.frameTimeHistory.shift();
        }
        
        // Calculate average frame time
        const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
        
        // Adjust DPR based on performance (only if consistently bad/good)
        if (avgFrameTime > targetFrameTime * 1.5) {
            // Performance is consistently dropping, reduce DPR slowly
            this.currentDPR = Math.max(this.minDPR, this.currentDPR - this.adaptiveRate * 0.5);
        } else if (avgFrameTime < targetFrameTime * 0.9 && this.currentDPR < this.maxDPR) {
            // Performance is consistently good, increase DPR slowly
            this.currentDPR = Math.min(this.maxDPR, this.currentDPR + this.adaptiveRate * 0.5);
        }
        
        // Apply DPR (only update if changed significantly to avoid constant updates)
        const currentPixelRatio = this.renderer.getPixelRatio();
        if (Math.abs(currentPixelRatio - this.currentDPR) > 0.1) {
            this.renderer.setPixelRatio(this.currentDPR);
        }
    }
    
    getCurrentDPR() {
        return this.currentDPR;
    }
}

/**
 * FPS Cap System
 * Ensures consistent frame pacing
 */
export class FPSCap {
    constructor(targetFPS = 60) {
        this.targetFPS = targetFPS;
        this.targetFrameTime = 1 / targetFPS;
        this.accumulator = 0;
        this.lastTime = performance.now();
    }
    
    shouldUpdate(delta) {
        this.accumulator += delta;
        if (this.accumulator >= this.targetFrameTime) {
            this.accumulator = 0;
            return true;
        }
        return false;
    }
    
    reset() {
        this.accumulator = 0;
        this.lastTime = performance.now();
    }
}

/**
 * Performance Stats Monitor
 * Tracks renderer statistics for debugging
 */
export class PerformanceStats {
    constructor(renderer) {
        this.renderer = renderer;
        this.stats = {
            calls: 0,
            triangles: 0,
            points: 0,
            lines: 0,
            geometries: 0,
            textures: 0,
            programs: 0
        };
    }
    
    update() {
        const info = this.renderer.info;
        this.stats = {
            calls: info.render.calls,
            triangles: info.render.triangles,
            points: info.render.points,
            lines: info.render.lines,
            geometries: info.memory.geometries,
            textures: info.memory.textures,
            programs: info.programs.length
        };
    }
    
    getStats() {
        return { ...this.stats };
    }
    
    log() {
        console.log('Performance Stats:', this.stats);
    }
}

/**
 * Initialize all performance optimizations
 */
export function initPerformanceOptimizations(renderer, options = {}) {
    const adaptiveDPR = new AdaptiveDPR(renderer, {
        minDPR: options.minDPR || 0.5,
        maxDPR: options.maxDPR || 1.5,
        targetFPS: options.targetFPS || 60
    });
    
    const fpsCap = new FPSCap(options.targetFPS || 60);
    const stats = new PerformanceStats(renderer);
    
    return {
        adaptiveDPR,
        fpsCap,
        stats,
        reusableObjects
    };
}

