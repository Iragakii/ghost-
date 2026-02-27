/**
 * Loading Screen Manager
 * Tracks asset loading and displays full-screen loading screen
 */

let loadingScreenElement = null;
let isLoading = true;
let loadedCount = 0;
let totalAssets = 0;
let onLoadingCompleteCallback = null;
let loadingStartTime = null;
let minimumDisplayTime = 4000; // Minimum 4 seconds display time
let actualLoadingTime = 0;

/**
 * Initialize loading screen
 */
export function initLoadingScreen() {
    // Record when loading starts
    loadingStartTime = performance.now();
    actualLoadingTime = 0;
    
    // Create loading screen element
    loadingScreenElement = document.createElement('div');
    loadingScreenElement.id = 'loading-screen';
    loadingScreenElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url('/loading-screen.gif');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.3s ease-out;
        pointer-events: none; /* Allow interaction with scene behind */
    `;
    
    document.body.appendChild(loadingScreenElement);
    isLoading = true;
    loadedCount = 0;
    totalAssets = 0;
}

/**
 * Set total number of assets to load
 */
export function setTotalAssets(count) {
    totalAssets = count;
}

/**
 * Increment loaded assets count
 */
export function incrementLoaded() {
    loadedCount++;
    checkIfComplete();
}

/**
 * Mark a specific number of assets as loaded
 */
export function setLoaded(count) {
    loadedCount = count;
    checkIfComplete();
}

/**
 * Check if all assets are loaded
 */
function checkIfComplete() {
    if (isLoading && loadedCount >= totalAssets && totalAssets > 0) {
        completeLoading();
    }
}

/**
 * Force complete loading (for cases where we can't track all assets)
 * This will trigger completeLoading which handles the 4s + loading time logic
 */
export function forceCompleteLoading() {
    completeLoading();
}

/**
 * Complete loading and fade out
 * Ensures minimum 4s + actual loading time before hiding
 */
function completeLoading() {
    if (!isLoading || !loadingScreenElement) return;
    
    // Calculate actual loading time
    if (loadingStartTime) {
        actualLoadingTime = performance.now() - loadingStartTime;
    }
    
    // Calculate total required time: 4s minimum + actual loading time
    const totalRequiredTime = minimumDisplayTime + actualLoadingTime;
    const elapsedTime = actualLoadingTime;
    const remainingTime = Math.max(0, totalRequiredTime - elapsedTime);
    
    // Wait for remaining time if needed, then fade out
    setTimeout(() => {
        if (!loadingScreenElement) return;
        
        isLoading = false;
        
        // Fade out loading screen
        loadingScreenElement.style.opacity = '0';
        
        // Remove from DOM after fade completes
        setTimeout(() => {
            if (loadingScreenElement && loadingScreenElement.parentNode) {
                loadingScreenElement.parentNode.removeChild(loadingScreenElement);
                loadingScreenElement = null;
            }
            
            // Call callback if provided
            if (onLoadingCompleteCallback) {
                onLoadingCompleteCallback();
                onLoadingCompleteCallback = null;
            }
        }, 300); // Fade transition duration
    }, remainingTime);
}

/**
 * Set callback for when loading completes
 */
export function onLoadingComplete(callback) {
    onLoadingCompleteCallback = callback;
}

/**
 * Check if currently loading
 */
export function isCurrentlyLoading() {
    return isLoading;
}

/**
 * Get loading progress (0-1)
 */
export function getLoadingProgress() {
    if (totalAssets === 0) return 0;
    return Math.min(loadedCount / totalAssets, 1);
}

