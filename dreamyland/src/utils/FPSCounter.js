/**
 * FPS Counter and Frame Time Display
 * Displays engine info, frame time, and FPS in top right corner
 */

let fpsElement = null;
let frameCount = 0;
let lastTime = performance.now();
let frameTime = 0;
let fps = 0;
let rendererType = 'WebGL'; // Default, will be updated if WebGPU is detected

/**
 * Initialize FPS counter display
 * @param {Object} renderer - Three.js renderer object (optional, to detect type)
 */
export function initFPSCounter(renderer = null) {
    // Create FPS display element
    fpsElement = document.createElement('div');
    fpsElement.id = 'fps-counter';
    fpsElement.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        color: #A8DF65;
        font-family: 'Courier New', monospace;
        font-size: 10px;
        font-weight: bold;
       
        padding: 8px 12px;
        border-radius: 4px;
        z-index: 1000;
        pointer-events: none;
        user-select: none;
    `;
    
    // Detect renderer type
    if (renderer && renderer.isWebGPU) {
        rendererType = 'WebGPU';
    } else if (navigator.gpu) {
        // WebGPU is available but might not be used
        rendererType = 'WebGL ';
    } else {
        rendererType = 'WebGL';
    }
    
    fpsElement.textContent = `Engine: ${rendererType}, Frame: 0.0 ms, 0 FPS`;
    document.body.appendChild(fpsElement);
    
    lastTime = performance.now();
    frameCount = 0;
}

/**
 * Update FPS counter
 * Call this every frame in the animation loop
 */
export function updateFPSCounter() {
    if (!fpsElement) return;
    
    frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    
    // Update every second
    if (deltaTime >= 1000) {
        fps = Math.round((frameCount * 1000) / deltaTime);
        frameTime = deltaTime / frameCount;
        
        // Update display
        fpsElement.textContent = `Engine: ${rendererType}, Frame: ${frameTime.toFixed(1)} ms, ${fps} FPS`;
        
        // Reset counters
        frameCount = 0;
        lastTime = currentTime;
    }
}

/**
 * Get current FPS
 */
export function getFPS() {
    return fps;
}

/**
 * Get current frame time in milliseconds
 */
export function getFrameTime() {
    return frameTime;
}

