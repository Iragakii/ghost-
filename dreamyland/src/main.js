import './style.css';
import { initGame, moveCameraToWork, restoreCameraFromWork, videoScreen, updateWorkCameraRotation, getWorkCameraRotation } from './game/Game.js';
import * as THREE from 'three';

let currentRoute = '/';
let originalVideoSrc = null;
let workImageTexture = null;

// Preload work videos for instant switching
const preloadedVideos = {
    mojito: null,
    nft: null
};

// Preload videos immediately
function preloadWorkVideos() {
    // Preload mojito.mp4
    const mojitoVideo = document.createElement('video');
    mojitoVideo.crossOrigin = 'anonymous';
    mojitoVideo.src = '/mojito.mp4';
    mojitoVideo.loop = true;
    mojitoVideo.muted = true;
    mojitoVideo.playsInline = true;
    mojitoVideo.preload = 'auto';
    mojitoVideo.style.display = 'none';
    document.body.appendChild(mojitoVideo);
    mojitoVideo.load(); // Start loading immediately
    preloadedVideos.mojito = mojitoVideo;
    
    // Preload NFT.mp4
    const nftVideo = document.createElement('video');
    nftVideo.crossOrigin = 'anonymous';
    nftVideo.src = '/NFT.mp4';
    nftVideo.loop = true;
    nftVideo.muted = true;
    nftVideo.playsInline = true;
    nftVideo.preload = 'auto';
    nftVideo.style.display = 'none';
    document.body.appendChild(nftVideo);
    nftVideo.load(); // Start loading immediately
    preloadedVideos.nft = nftVideo;
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Preload work videos immediately
    preloadWorkVideos();
    
    initGame();
    
    // Handle navigation buttons
    const navButtons = document.querySelectorAll('.nav-button');
    const exploreButton = document.getElementById('nav-explore');
    
    // Set EXPLORE button as active by default
    if (exploreButton) {
        exploreButton.classList.add('active');
        exploreButton.style.background = '#A8DF65';
    }
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            navButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.background = 'transparent';
            });
            
            // Add active class to clicked button
            button.classList.add('active');
            button.style.background = '#A8DF65';
            
            // Handle navigation
            if (button.id === 'nav-works') {
                navigateToWork();
            } else if (button.id === 'nav-explore') {
                navigateToExplore();
            }
        });
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
        const path = window.location.pathname;
        if (path === '/work') {
            showWorkPage();
        } else {
            showExplorePage();
        }
    });
    
    // Check initial route
    if (window.location.pathname === '/work') {
        showWorkPage();
    }
    
    // Setup work page button handlers
    setupWorkPageButtons();
    
    // Setup mouse drag for work mode camera rotation
    setupWorkCameraRotation();
});

// Mouse drag for work mode camera rotation
let isDragging = false;
let lastMouseX = 0;

function setupWorkCameraRotation() {
    // Wait for canvas to be available
    setTimeout(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            // Retry if canvas not ready
            setTimeout(setupWorkCameraRotation, 100);
            return;
        }
        
        canvas.addEventListener('mousedown', (e) => {
            if (currentRoute === '/work') {
                isDragging = true;
                lastMouseX = e.clientX;
                canvas.style.cursor = 'grabbing';
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (isDragging && currentRoute === '/work') {
                const deltaX = e.clientX - lastMouseX;
                updateWorkCameraRotation(deltaX);
                lastMouseX = e.clientX;
                
                // Update visit button rotation
                updateVisitButtonRotation();
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                if (canvas) {
                    canvas.style.cursor = 'grab';
                }
            }
        });
        
        canvas.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                if (canvas) {
                    canvas.style.cursor = 'grab';
                }
            }
        });
    }, 500);
}

function updateVisitButtonRotation() {
    const visitContainer = document.getElementById('work-visit-container');
    if (visitContainer && currentRoute === '/work') {
        const rotation = getWorkCameraRotation();
        // Convert rotation to degrees and apply to container
        const rotationDeg = (rotation * 180 / Math.PI);
        // Apply subtle rotation to match camera movement (30% of camera rotation)
        visitContainer.style.transform = `translateY(-50%) )`;
    }
}

// Continuously update visit button rotation
function startVisitButtonRotationUpdate() {
    function updateLoop() {
        if (currentRoute === '/work') {
            updateVisitButtonRotation();
        }
        requestAnimationFrame(updateLoop);
    }
    updateLoop();
}

// Start the update loop
startVisitButtonRotationUpdate();

function setupWorkPageButtons() {
    const mojitoBtn = document.getElementById('work-btn-mojito');
    const asciiBtn = document.getElementById('work-btn-ascii');
    const nftBtn = document.getElementById('work-btn-nft');
    
    // Handle button clicks
    if (mojitoBtn) {
        mojitoBtn.addEventListener('click', () => {
            setActiveWorkButton(mojitoBtn);
            showWorkContent('mojito');
        });
    }
    
    if (asciiBtn) {
        asciiBtn.addEventListener('click', () => {
            setActiveWorkButton(asciiBtn);
            showWorkContent('ascii');
        });
    }
    
    if (nftBtn) {
        nftBtn.addEventListener('click', () => {
            setActiveWorkButton(nftBtn);
            showWorkContent('nft');
        });
    }
}

function setActiveWorkButton(activeBtn) {
    const allButtons = document.querySelectorAll('.work-nav-btn');
    allButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
}

function navigateToWork() {
    window.history.pushState({}, '', '/work');
    showWorkPage();
}

function navigateToExplore() {
    window.history.pushState({}, '', '/');
    showExplorePage();
}

function showWorkPage() {
    currentRoute = '/work';
    const workNav = document.getElementById('work-nav');
    if (workNav) {
        workNav.style.display = 'flex';
    }
    
    // Show visit container
    const visitContainer = document.getElementById('work-visit-container');
    if (visitContainer) {
        visitContainer.style.display = 'flex';
    }
    
    // Move camera to work position (200, 30, 0) looking at video screen (290, 27, 0)
    moveCameraToWork();
    
    // Keep video screen at original position (290, 27, 0) - don't move it
    if (videoScreen && videoScreen.video) {
        // Store original video source if not already stored
        if (!originalVideoSrc) {
            originalVideoSrc = videoScreen.video.src;
        }
        
        // Stop current video
        videoScreen.video.pause();
        videoScreen.video.currentTime = 0;
    }
    
    // Auto focus on 1. Mojito - this will change the video source
    const mojitoBtn = document.getElementById('work-btn-mojito');
    if (mojitoBtn) {
        mojitoBtn.classList.add('active');
        mojitoBtn.style.opacity = '1';
        showWorkContent('mojito');
    }
}

function showExplorePage() {
    currentRoute = '/';
    const workNav = document.getElementById('work-nav');
    if (workNav) {
        workNav.style.display = 'none';
    }
    
    // Hide visit container
    const visitContainer = document.getElementById('work-visit-container');
    if (visitContainer) {
        visitContainer.style.display = 'none';
    }
    
    // Restore original video.mp4 (screen stays at original position)
    if (videoScreen && videoScreen.video && originalVideoSrc && videoScreen.material) {
        // Remove image texture if it exists
        if (workImageTexture) {
            workImageTexture.dispose();
            workImageTexture = null;
        }
        
        // Restore video texture
        if (videoScreen.restoreVideoTexture) {
            videoScreen.restoreVideoTexture();
        } else {
            // Fallback: restore video source
            videoScreen.video.src = originalVideoSrc;
            videoScreen.video.load();
            videoScreen.video.play().catch(() => {});
        }
        
        originalVideoSrc = null;
    }
    
    // Restore camera
    restoreCameraFromWork();
}

function showWorkContent(type) {
    // Wait a bit for videoScreen to be initialized if needed
    if (!videoScreen) {
        console.error('videoScreen is null, waiting...');
        setTimeout(() => showWorkContent(type), 100);
        return;
    }
    if (!videoScreen.material) {
        console.error('videoScreen.material is null');
        return;
    }
    if (!videoScreen.video) {
        console.error('videoScreen.video is null');
        return;
    }
    
    const material = videoScreen.material;
    const video = videoScreen.video;
    
    // Stop video completely
    video.pause();
    video.currentTime = 0;
    
    if (type === 'mojito') {
        // Update visit button link and text
        const visitBtn = document.getElementById('work-visit-btn');
        const visitText = document.getElementById('work-visit-text');
        if (visitBtn) {
            visitBtn.href = 'https://mojito-qorr.onrender.com/';
        }
        if (visitText) {
            visitText.textContent = 'Drink w Me';
        }
        
        // Remove image texture if it exists (switching from image to video)
        if (workImageTexture) {
            workImageTexture.dispose();
            workImageTexture = null;
        }
        
        // Restore video texture
        if (videoScreen.restoreVideoTexture) {
            videoScreen.restoreVideoTexture();
        }
        
        // Check if video is already mojito.mp4 (no need to reload)
        const currentSrc = video.src;
        if (currentSrc.endsWith('/mojito.mp4') || currentSrc.includes('mojito.mp4')) {
            // Already the right video, just play it
            video.currentTime = 0;
            video.play().catch(() => {});
            return;
        }
        
        // Change video source to mojito.mp4 using preloaded video if available
        const preloadedVideo = preloadedVideos.mojito;
        if (preloadedVideo && preloadedVideo.readyState >= 3) {
            // Preloaded video is ready, switch immediately
            video.src = preloadedVideo.src;
            video.currentTime = 0;
            video.load();
            // Since it's preloaded, it should be ready immediately
            const tryPlay = () => {
                if (video.readyState >= 3) {
                    video.play().catch(() => {});
                } else {
                    setTimeout(tryPlay, 50);
                }
            };
            tryPlay();
        } else if (videoScreen.changeVideoSource) {
            videoScreen.changeVideoSource('/mojito.mp4');
        } else {
            // Fallback: direct manipulation
            video.src = '/mojito.mp4';
            video.load();
            video.play().catch(() => {});
        }
    } else if (type === 'ascii') {
        // Update visit button link and text
        const visitBtn = document.getElementById('work-visit-btn');
        const visitText = document.getElementById('work-visit-text');
        if (visitBtn) {
            visitBtn.href = 'https://acsii-iragaki.onrender.com/';
        }
        if (visitText) {
            visitText.textContent = 'Got Hack';
        }
        
        // Replace with image texture from public folder
        if (videoScreen.setImageTexture) {
            videoScreen.setImageTexture('/f2.png');
        } else {
            // Fallback: direct manipulation
            const loader = new THREE.TextureLoader();
            loader.load('/f2.png', (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = false;
                workImageTexture = texture;
                if (material.uniforms && material.uniforms.uTexture) {
                    material.uniforms.uTexture.value = texture;
                }
            }, undefined, (error) => {
                console.error('Error loading f2.png:', error);
            });
        }
    } else if (type === 'nft') {
        // Update visit button link and text
        const visitBtn = document.getElementById('work-visit-btn');
        const visitText = document.getElementById('work-visit-text');
        if (visitBtn) {
            visitBtn.href = 'https://badrabbit-iragaki-nft.onrender.com/';
        }
        if (visitText) {
            visitText.textContent = 'Coin Base';
        }
        
        // Remove image texture if it exists (switching from image to video)
        if (workImageTexture) {
            workImageTexture.dispose();
            workImageTexture = null;
        }
        
        // Restore video texture
        if (videoScreen.restoreVideoTexture) {
            videoScreen.restoreVideoTexture();
        }
        
        // Check if video is already NFT.mp4 (no need to reload)
        const currentSrc = video.src;
        if (currentSrc.endsWith('/NFT.mp4') || currentSrc.includes('NFT.mp4')) {
            // Already the right video, just play it
            video.currentTime = 0;
            video.play().catch(() => {});
            return;
        }
        
        // Change video source to NFT.mp4 using preloaded video if available
        const preloadedVideo = preloadedVideos.nft;
        if (preloadedVideo && preloadedVideo.readyState >= 3) {
            // Preloaded video is ready, switch immediately
            video.src = preloadedVideo.src;
            video.currentTime = 0;
            video.load();
            // Since it's preloaded, it should be ready immediately
            const tryPlay = () => {
                if (video.readyState >= 3) {
                    video.play().catch(() => {});
                } else {
                    setTimeout(tryPlay, 50);
                }
            };
            tryPlay();
        } else if (videoScreen.changeVideoSource) {
            videoScreen.changeVideoSource('/NFT.mp4');
        } else {
            // Fallback: direct manipulation
            video.src = '/NFT.mp4';
            video.load();
            video.play().catch(() => {});
        }
    }
}
