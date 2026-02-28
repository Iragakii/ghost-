/**
 * CORS Error Suppressor
 * Suppresses WebGL CORS errors for video textures
 * These errors occur when videos are loaded from different origins without proper CORS headers
 */

let originalConsoleError = null;
let isSuppressing = false;

/**
 * Suppress CORS-related WebGL errors
 * These errors are harmless - the shader will show a fallback pattern instead
 */
export function suppressCORSErrors() {
    if (isSuppressing) return;
    
    originalConsoleError = console.error;
    isSuppressing = true;
    
    console.error = function(...args) {
        const message = args.join(' ');
        // Suppress CORS errors related to video textures
        if (message.includes('cross-origin') && 
            (message.includes('texImage2D') || message.includes('WebGLState'))) {
            // Silently ignore - video will show fallback pattern
            return;
        }
        // Pass through all other errors
        originalConsoleError.apply(console, args);
    };
}

/**
 * Restore original console.error
 */
export function restoreConsoleError() {
    if (!isSuppressing || !originalConsoleError) return;
    
    console.error = originalConsoleError;
    isSuppressing = false;
}

