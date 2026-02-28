import * as THREE from 'three';
import { setExpression } from '../components/LuvuExpressions.js';
import { updateMusicButton } from '../audio/AudioManager.js';
import { createVideoScreen } from '../components/VideoScreen.js';

// Audio elements for character interactions
let newCharSound = null;
let angleSound = null;
let angleSongPlayer = null;
let fatSound = null;
let lmSound = null;
let fVideoSound = null;

export function initInput(gameState, luvuGroup, cactusGroup, ippoacGroup, characterModels, characterTimeouts, newCharacterGroup, audioData, scene) {
    const { bgMusic } = audioData || {};

    // Keyboard input
    window.addEventListener('keydown', e => {
        gameState.hasUserInteracted = true; // Mark user interaction
        gameState.keys[e.key.toLowerCase()] = true;
        
            // Expression keys: J = cry (with tears), K = angry, L = neutral/sad (-.-)
            // Only apply to Luvu if not following ippoac (J and K control ippoac animations when following ippoac)
            if (!gameState.isFollowingIppoac) {
                if (e.key === 'j') setExpression(luvuGroup, 'cry', gameState);
                if (e.key === 'k') setExpression(luvuGroup, 'angry', gameState);
                if (e.key === 'l') setExpression(luvuGroup, 'neutral', gameState);
            }

        // Handle F key for character interaction
        if (e.key.toLowerCase() === 'f') {
            // Handle F key for Cactus (check distance first)
            if (cactusGroup && !gameState.isFollowingCactus) {
                const cactusPos = new THREE.Vector3();
                cactusGroup.getWorldPosition(cactusPos);
                const distanceToCactus = luvuGroup.position.distanceTo(cactusPos);
                
                if (distanceToCactus < 8) { // INTERACTION_DISTANCE
                    // Show chat bubble
                    gameState.cactusIsInteracting = true;
                    const cactusChatEl = document.getElementById('cactus-chat');
                    if (cactusChatEl) {
                        cactusChatEl.style.display = 'block';
                    }
                    
                    // Hide F notification
                    const cactusNotifEl = document.getElementById('cactus-notif');
                    if (cactusNotifEl) {
                        cactusNotifEl.style.display = 'none';
                    }
                    
                    // Auto-hide chat after 3 seconds
                    if (gameState.cactusChatTimeout) {
                        clearTimeout(gameState.cactusChatTimeout);
                    }
                    gameState.cactusChatTimeout = setTimeout(() => {
                        if (cactusChatEl) {
                            cactusChatEl.style.display = 'none';
                        }
                        gameState.cactusIsInteracting = false;
                        gameState.cactusChatTimeout = null;
                    }, 3000);
                    
                    return; // Exit early to prevent other handlers
                }
            }
            
            // Handle F key for Handeye (check distance first)
            let handeyeModel = null;
            for (let i = 0; i < characterModels.length; i++) {
                if (characterModels[i] && characterModels[i].isHandeye && characterModels[i].group) {
                    handeyeModel = characterModels[i];
                    break;
                }
            }
            
            if (handeyeModel && handeyeModel.group) {
                const handeyePos = new THREE.Vector3();
                handeyeModel.group.getWorldPosition(handeyePos);
                const distanceToHandeye = luvuGroup.position.distanceTo(handeyePos);
                
                if (distanceToHandeye < 8) { // INTERACTION_DISTANCE
                    // Show chat bubble
                    handeyeModel.isInteracting = true;
                    gameState.handeyeIsInteracting = true;
                    const handeyeChatEl = document.getElementById('handeye-chat');
                    if (handeyeChatEl) {
                        handeyeChatEl.style.display = 'block';
                    }
                    
                    // Hide F notification
                    const handeyeNotifEl = document.getElementById('handeye-notif');
                    if (handeyeNotifEl) {
                        handeyeNotifEl.style.display = 'none';
                    }
                    
                    // Auto-hide chat after 3 seconds
                    if (gameState.handeyeChatTimeout) {
                        clearTimeout(gameState.handeyeChatTimeout);
                    }
                    gameState.handeyeChatTimeout = setTimeout(() => {
                        if (handeyeChatEl) {
                            handeyeChatEl.style.display = 'none';
                        }
                        handeyeModel.isInteracting = false;
                        gameState.handeyeIsInteracting = false;
                        gameState.handeyeChatTimeout = null;
                    }, 3000);
                    
                    return; // Exit early to prevent other handlers
                }
            }
            
            // Handle F key for Ippoac (check distance first)
            if (ippoacGroup && !gameState.isFollowingIppoac) {
                const ippoacPos = new THREE.Vector3();
                ippoacGroup.getWorldPosition(ippoacPos);
                const distanceToIppoac = luvuGroup.position.distanceTo(ippoacPos);
                
                if (distanceToIppoac < 8) { // INTERACTION_DISTANCE
                    // Show chat bubble
                    gameState.ippoacIsInteracting = true;
                    const ippoacChatEl = document.getElementById('ippoac-chat');
                    if (ippoacChatEl) {
                        ippoacChatEl.style.display = 'block';
                    }
                    
                    // Hide F notification
                    const ippoacNotifEl = document.getElementById('ippoac-notif');
                    if (ippoacNotifEl) {
                        ippoacNotifEl.style.display = 'none';
                    }
                    
                    // Auto-hide chat after 3 seconds
                    if (gameState.ippoacChatTimeout) {
                        clearTimeout(gameState.ippoacChatTimeout);
                    }
                    gameState.ippoacChatTimeout = setTimeout(() => {
                        if (ippoacChatEl) {
                            ippoacChatEl.style.display = 'none';
                        }
                        gameState.ippoacIsInteracting = false;
                        gameState.ippoacChatTimeout = null;
                    }, 3000);
                    
                    return; // Exit early to prevent other handlers
                }
            }
            
            if (gameState.closestCharIndex >= 0) {
                const char = characterModels[gameState.closestCharIndex];
                if (char) {
                    // Special handling for angle.glb (index 5)
                    if (gameState.closestCharIndex === 5) {
                        char.isInteracting = true;
                        const chatEl = document.getElementById(`char${gameState.closestCharIndex + 1}-chat`);
                        if (chatEl) {
                            chatEl.style.display = 'block';
                        }

                        if (!angleSound) {
                            angleSound = new Audio('/ang.mp3');
                            angleSound.volume = 0.7;
                        }

                        // Preserve music playing state before pausing (store in gameState so it's accessible)
                        gameState.musicWasPlayingBeforeAngle = gameState.isMusicPlaying || (bgMusic && !bgMusic.paused);
                        
                        if (!angleSound.hasEndedListener) {
                            angleSound.addEventListener('ended', () => {
                                gameState.isAngleSoundPlaying = false;
                                gameState.angleSound = null; // Clear reference
                                // Always restore volume and resume bg music if it was playing
                                if (bgMusic) {
                                    bgMusic.volume = 0.3; // Restore volume
                                    // Resume music if it was playing before angle.mp3 started
                                    // Check gameState which is updated each time angle.mp3 starts
                                    if (gameState.musicWasPlayingBeforeAngle) {
                                        gameState.isMusicPlaying = true; // Ensure state is correct
                                        bgMusic.play().catch(e => console.log('BG music resume error:', e));
                                    }
                                }
                                // Update button text based on music state
                                updateMusicButton(gameState);
                                const chatElEnd = document.getElementById(`char${gameState.closestCharIndex + 1}-chat`);
                                if (chatElEnd) {
                                    chatElEnd.style.display = 'none';
                                }
                                if (char) {
                                    char.isInteracting = false;
                                }
                            });
                            angleSound.hasEndedListener = true;
                        }

                        // Stop bg music when angle.mp3 starts (but preserve playing state)
                        // Update music state each time (so ended handler uses current state)
                        gameState.musicWasPlayingBeforeAngle = gameState.isMusicPlaying || (bgMusic && !bgMusic.paused);
                        if (bgMusic) {
                            // Don't change isMusicPlaying - we want it to resume after
                            bgMusic.pause();
                            bgMusic.currentTime = 0;
                            bgMusic.volume = 0; // Mute it while angle.mp3 plays
                        }

                        gameState.isAngleSoundPlaying = true;
                        gameState.angleSound = angleSound; // Store in gameState so button can access it
                        angleSound.currentTime = 0;
                        
                        // Update button immediately to show pause (||) when angle.mp3 is playing
                        updateMusicButton(gameState);
                        
                        angleSound.play().catch(e => console.log('Angle sound play error:', e));

                        const notifEl = document.getElementById('angle-notif');
                        if (notifEl) {
                            notifEl.style.display = 'none';
                        }
                    } else if (gameState.closestCharIndex === 8) {
                        // LM character
                        if (!lmSound) {
                            lmSound = new Audio('/evil.mp3');
                            lmSound.volume = 0.7;
                        }
                        lmSound.currentTime = 0;
                        lmSound.play().catch(e => console.log('LM sound play error:', e));

                        const notifEl = document.getElementById('lm-notif');
                        if (notifEl) {
                            notifEl.style.display = 'none';
                        }
                    } else if (gameState.closestCharIndex === 9) {
                        // FAT character
                        if (!fatSound) {
                            fatSound = new Audio('/angry.mp3');
                            fatSound.volume = 0.7;
                        }
                        fatSound.currentTime = 0;
                        fatSound.play().catch(e => console.log('Fat sound play error:', e));

                        const notifEl = document.getElementById('fat-notif');
                        if (notifEl) {
                            notifEl.style.display = 'none';
                        }
                    } else if (!char.isInteracting) {
                        // Normal interaction
                        char.isInteracting = true;
                        const chatEl = document.getElementById(`char${gameState.closestCharIndex + 1}-chat`);
                        if (chatEl) {
                            chatEl.style.display = 'block';
                        }
                        if (characterTimeouts[gameState.closestCharIndex]) {
                            clearTimeout(characterTimeouts[gameState.closestCharIndex]);
                        }
                        characterTimeouts[gameState.closestCharIndex] = setTimeout(() => {
                            if (chatEl) chatEl.style.display = 'none';
                            char.isInteracting = false;
                            characterTimeouts[gameState.closestCharIndex] = null;
                        }, 3000);

                        const notifEl = document.getElementById(`char${gameState.closestCharIndex + 1}-notif`);
                        if (notifEl) {
                            notifEl.style.display = 'none';
                        }
                    }
                }
            } else if (gameState.isNewCharClose && newCharacterGroup) {
                // New character interaction
                if (!newCharSound) {
                    newCharSound = new Audio('/soundmeme.mp3');
                    newCharSound.volume = 0.7;
                }
                newCharSound.currentTime = 0;
                newCharSound.play().catch(e => console.log('Sound play error:', e));

                const notifEl = document.getElementById('newchar-notif');
                if (notifEl) {
                    notifEl.style.display = 'none';
                }
            }
        }

        // Handle Q key
        if (e.key.toLowerCase() === 'q') {
            // Handle Q key for Handeye - toggle eyeballp models down/up
            let handeyeModel = null;
            for (let i = 0; i < characterModels.length; i++) {
                if (characterModels[i] && characterModels[i].isHandeye && characterModels[i].group) {
                    handeyeModel = characterModels[i];
                    break;
                }
            }
            
            if (handeyeModel && handeyeModel.group) {
                const handeyePos = new THREE.Vector3();
                handeyeModel.group.getWorldPosition(handeyePos);
                const distanceToHandeye = luvuGroup.position.distanceTo(handeyePos);
                
                if (distanceToHandeye < 8) { // INTERACTION_DISTANCE
                    // Toggle eyeballp models down/up
                    gameState.eyeballpModelsDown = !gameState.eyeballpModelsDown;
                    
                    // Update all eyeballp models
                    for (let i = 0; i < characterModels.length; i++) {
                        const char = characterModels[i];
                        if (char && char.isEyeballp && char.originalY !== undefined) {
                            if (gameState.eyeballpModelsDown) {
                                // Move down to y = 5
                                char.targetY = 5;
                            } else {
                                // Move back to original Y position
                                char.targetY = char.originalY;
                            }
                        }
                    }
                    
                    console.log('Eyeballp models', gameState.eyeballpModelsDown ? 'down' : 'up');
                    return; // Exit early to prevent other handlers
                }
            }
            
            // Handle Q key for Minescar - create video screen above retrotv
            let minescarModel = null;
            let retrotvModel = null;
            for (let i = 0; i < characterModels.length; i++) {
                if (characterModels[i] && characterModels[i].isMinescar && characterModels[i].group) {
                    minescarModel = characterModels[i];
                }
                if (characterModels[i] && characterModels[i].isRetrotv && characterModels[i].group) {
                    retrotvModel = characterModels[i];
                }
            }
            
            if (minescarModel && minescarModel.group && retrotvModel && retrotvModel.group) {
                const minescarPos = new THREE.Vector3();
                minescarModel.group.getWorldPosition(minescarPos);
                const distanceToMinescar = luvuGroup.position.distanceTo(minescarPos);
                
                if (distanceToMinescar < 8) { // INTERACTION_DISTANCE
                    // Get retrotv position
                    const retrotvPos = new THREE.Vector3();
                    retrotvModel.group.getWorldPosition(retrotvPos);
                    
                    // Toggle video screen: if it exists, remove it; otherwise, create it
                    if (gameState.minescarVideoScreen && gameState.minescarVideoScreen.screenMesh) {
                        // Remove existing video screen
                        scene.remove(gameState.minescarVideoScreen.screenMesh);
                        if (gameState.minescarVideoScreen.video) {
                            gameState.minescarVideoScreen.video.pause();
                            if (gameState.minescarVideoScreen.video.parentNode) {
                                gameState.minescarVideoScreen.video.parentNode.removeChild(gameState.minescarVideoScreen.video);
                            }
                        }
                        gameState.minescarVideoScreen = null;
                        console.log('Piano video screen hidden');
                    } else {
                        // Create video screen above retrotv
                        try {
                            gameState.minescarVideoScreen = createVideoScreen(scene, '/pinklocation/piano.mp4', {
                                width:20,
                                height: 12,
                                position: new THREE.Vector3(retrotvPos.x, retrotvPos.y + 13, retrotvPos.z), // Above retrotv
                                rotation: new THREE.Euler(0, retrotvModel.group.rotation.y + Math.PI/2, 0), // Match retrotv rotation
                                distortionIntensity: 0.02,
                                glitchIntensity: 0.1,
                                emissiveIntensity: 1.5,
                                borderRadius: 0.08
                            });
                            console.log('Piano video screen shown');
                        } catch (error) {
                            console.log('Video screen creation error (video file may not exist):', error);
                        }
                    }
                    
                    return; // Exit early to prevent other handlers
                }
            }
            
            // Handle Q key for Ippoac - switch back to following Luvu (when currently following ippoac)
            if (gameState.isFollowingIppoac && ippoacGroup) {
                const luvuPos = luvuGroup.position.clone();
                const distanceToLuvu = ippoacGroup.position.distanceTo(luvuPos);
                
                if (distanceToLuvu < 16) { // INTERACTION_DISTANCE * 2 (larger range to switch back)
                    // Switch back to following Luvu
                    gameState.isFollowingIppoac = false;
                    console.log('Switched camera back to Luvu from Ippoac');
                    
                    // Hide Q notification
                    const luvuQNotifEl = document.getElementById('luvu-q-notif');
                    if (luvuQNotifEl) {
                        luvuQNotifEl.style.display = 'none';
                    }
                    
                    return; // Exit early to prevent other handlers from running
                }
            }

            // Handle Q key for cactus -> ippoac (when currently following cactus and close to ippoac)
            if (gameState.isFollowingCactus && cactusGroup && ippoacGroup) {
                const cactusPos = new THREE.Vector3();
                cactusGroup.getWorldPosition(cactusPos);
                const ippoacPos = new THREE.Vector3();
                ippoacGroup.getWorldPosition(ippoacPos);
                const distanceCactusToIppoac = cactusPos.distanceTo(ippoacPos);
                
                if (distanceCactusToIppoac < 8) { // INTERACTION_DISTANCE
                    // Switch camera follow from cactus to ippoac
                    gameState.isFollowingCactus = false;
                    gameState.isFollowingIppoac = true;
                    console.log('Switched camera from cactus to Ippoac');
                    
                    // Hide Q notifications for cactus and ippoac
                    const cactusQNotifEl = document.getElementById('cactus-q-notif');
                    if (cactusQNotifEl) {
                        cactusQNotifEl.style.display = 'none';
                    }
                    const ippoacQNotifEl = document.getElementById('ippoac-q-notif');
                    if (ippoacQNotifEl) {
                        ippoacQNotifEl.style.display = 'none';
                    }
                    
                    return; // Exit early to prevent other handlers from running
                }
            }
            
            // Handle Q key for Ippoac - toggle camera follow (when NOT following ippoac)
            if (!gameState.isFollowingIppoac && !gameState.isFollowingCactus && ippoacGroup) {
                const ippoacPos = new THREE.Vector3();
                ippoacGroup.getWorldPosition(ippoacPos);
                const distanceToIppoac = luvuGroup.position.distanceTo(ippoacPos);
                
                if (distanceToIppoac < 8) { // INTERACTION_DISTANCE
                    // Toggle camera follow to ippoac
                    gameState.isFollowingIppoac = true;
                    console.log('Toggled camera follow to ippoac:', gameState.isFollowingIppoac);
                    
                    // Hide Q notification
                    const ippoacQNotifEl = document.getElementById('ippoac-q-notif');
                    if (ippoacQNotifEl) {
                        ippoacQNotifEl.style.display = 'none';
                    }
                    
                    return; // Exit early to prevent other handlers from running
                }
            }
            
            // Handle Q key for Luvu - switch back to following Luvu (when currently following cactus)
            if (gameState.isFollowingCactus && cactusGroup) {
                const luvuPos = luvuGroup.position.clone();
                const distanceToLuvu = cactusGroup.position.distanceTo(luvuPos);
                
                if (distanceToLuvu < 16) { // INTERACTION_DISTANCE * 2 (larger range to switch back)
                    // Switch back to following Luvu
                    gameState.isFollowingCactus = false;
                    console.log('Switched camera back to Luvu');
                    
                    // Hide Q notification
                    const luvuQNotifEl = document.getElementById('luvu-q-notif');
                    if (luvuQNotifEl) {
                        luvuQNotifEl.style.display = 'none';
                    }
                    
                    return; // Exit early to prevent other handlers from running
                }
            }
            
            // Handle Q key for cactus - toggle camera follow (when NOT following cactus)
            if (!gameState.isFollowingCactus && cactusGroup) {
                const cactusPos = new THREE.Vector3();
                cactusGroup.getWorldPosition(cactusPos);
                const distanceToCactus = luvuGroup.position.distanceTo(cactusPos);
                
                if (distanceToCactus < 8) { // INTERACTION_DISTANCE
                    // Toggle camera follow to cactus
                    gameState.isFollowingCactus = true;
                    console.log('Toggled camera follow to cactus:', gameState.isFollowingCactus);
                    
                    // Hide Q notification
                    const cactusQNotifEl = document.getElementById('cactus-q-notif');
                    if (cactusQNotifEl) {
                        cactusQNotifEl.style.display = 'none';
                    }
                    
                    return; // Exit early to prevent other handlers from running
                }
            }
            
            // Handle Q key for f.glb (index 3) - play video sound
            if (gameState.closestCharIndex === 3) {
                const char = characterModels[3];
                if (char) {
                    // Stop background music
                    if (bgMusic) {
                        gameState.musicWasPlayingBeforeFVideo = gameState.isMusicPlaying || !bgMusic.paused;
                        gameState.isMusicPlaying = false; // Update state to prevent auto-resume
                        bgMusic.pause();
                        bgMusic.currentTime = 0;
                        bgMusic.volume = 0;
                    }

                    // Play video sound
                    if (!fVideoSound) {
                        fVideoSound = new Audio('/videoo.mp4');
                        fVideoSound.volume = 0.7;
                        
                        // When video sound ends, resume bg music if it was playing
                        fVideoSound.addEventListener('ended', () => {
                            gameState.isFVideoPlaying = false;
                            if (bgMusic && gameState.musicWasPlayingBeforeFVideo) {
                                bgMusic.volume = 0.3;
                                bgMusic.play().catch(e => console.log('BG music resume error:', e));
                                gameState.isMusicPlaying = true;
                            }
                            updateMusicButton(gameState);
                        });
                    }

                    gameState.isFVideoPlaying = true;
                    fVideoSound.currentTime = 0;
                    fVideoSound.play().catch(e => console.log('F video sound play error:', e));
                    updateMusicButton(gameState);

                    // Hide Q notification
                    const qNotifEl = document.getElementById('f-q-notif');
                    if (qNotifEl) {
                        qNotifEl.style.display = 'none';
                    }
                }
                return; // Exit early to prevent other handlers from running
            }
        }

        // Handle Q key for angle.glb song input
        if (e.key.toLowerCase() === 'q') {
            if (gameState.closestCharIndex === 5) {
                const char = characterModels[5];
                if (char) {
                    const embedIframe = document.getElementById('angle-song-embed');
                    const embedContainer = document.getElementById('angle-song-embed-container');
                    
                    // If song is playing, stop it
                    if (gameState.isAngleSongPlaying && (angleSongPlayer || (embedIframe && embedIframe.src))) {
                        if (angleSongPlayer) {
                            angleSongPlayer.pause();
                            angleSongPlayer = null;
                        }
                        if (embedIframe) {
                            embedIframe.src = '';
                        }
                        if (embedContainer) {
                            embedContainer.style.display = 'none';
                        }
                        if (window.angleEmbedCheckInterval) {
                            clearInterval(window.angleEmbedCheckInterval);
                            window.angleEmbedCheckInterval = null;
                        }
                        if (window.angleEmbedMessageHandler) {
                            window.removeEventListener('message', window.angleEmbedMessageHandler);
                            window.angleEmbedMessageHandler = null;
                        }
                        gameState.isAngleSongPlaying = false;
                        if (bgMusic && gameState.isMusicPlaying) {
                            bgMusic.volume = 0.3;
                            bgMusic.play().catch(err => console.log('BG music resume error:', err));
                        }
                        const chatEl = document.getElementById('angle-chat');
                        if (chatEl) {
                            chatEl.style.display = 'none';
                        }
                        char.isInteracting = false;
                        return;
                    }

                    // Show message
                    const chatEl = document.getElementById('angle-chat');
                    if (chatEl) {
                        chatEl.textContent = "Give me song and i will sing for u";
                        chatEl.style.display = 'block';
                        char.isInteracting = true;
                    }

                    const qNotifEl = document.getElementById('angle-q-notif');
                    if (qNotifEl) {
                        qNotifEl.style.display = 'none';
                    }

                    // Show URL input modal
                    showUrlInput().then(songUrl => {
                        if (songUrl && songUrl.trim() !== '') {
                            handleSongUrl(songUrl.trim(), char, gameState, bgMusic);
                        } else {
                            setTimeout(() => {
                                if (chatEl) {
                                    chatEl.style.display = 'none';
                                }
                                char.isInteracting = false;
                            }, 3000);
                        }
                    });
                }
            }
        }
    });

    window.addEventListener('keyup', e => {
        gameState.keys[e.key.toLowerCase()] = false;
        // Only reset Luvu expressions if not following ippoac (J and K control ippoac animations when following ippoac)
        if (!gameState.isFollowingIppoac && ['j', 'k', 'l'].includes(e.key.toLowerCase())) {
            setExpression(luvuGroup, 'neutral', gameState);
        }
    });

    // Mouse camera control
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
        canvasContainer.classList.add('grab-cursor');
    }

    let rafId = null;
    let pendingMouseMove = null;

    window.addEventListener('mousedown', (e) => {
        gameState.hasUserInteracted = true; // Mark user interaction
        gameState.isMouseDown = true;
        gameState.mouseX = e.clientX;
        gameState.mouseY = e.clientY;
        if (canvasContainer) {
            canvasContainer.classList.remove('grab-cursor');
            canvasContainer.classList.add('grabbing-cursor');
        }
        e.preventDefault();
    }, { passive: false });

    window.addEventListener('mousemove', (e) => {
        if (gameState.isMouseDown) {
            pendingMouseMove = { clientX: e.clientX, clientY: e.clientY };
            if (rafId === null) {
                rafId = requestAnimationFrame(() => {
                    if (pendingMouseMove && gameState.isMouseDown) {
                        const deltaX = pendingMouseMove.clientX - gameState.mouseX;
                        const deltaY = pendingMouseMove.clientY - gameState.mouseY;
                        gameState.cameraRotationY -= deltaX * 0.004;
                        gameState.cameraRotationX -= deltaY * 0.004;
                        gameState.cameraRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, gameState.cameraRotationX));
                        gameState.mouseX = pendingMouseMove.clientX;
                        gameState.mouseY = pendingMouseMove.clientY;
                    }
                    rafId = null;
                    pendingMouseMove = null;
                });
            }
        }
    }, { passive: true });

    window.addEventListener('mouseup', () => {
        gameState.isMouseDown = false;
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        pendingMouseMove = null;
        if (canvasContainer) {
            canvasContainer.classList.remove('grabbing-cursor');
            canvasContainer.classList.add('grab-cursor');
        }
    });

    window.addEventListener('mouseleave', () => {
        gameState.isMouseDown = false;
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        pendingMouseMove = null;
        if (canvasContainer) {
            canvasContainer.classList.remove('grabbing-cursor');
            canvasContainer.classList.add('grab-cursor');
        }
    });
}

function showUrlInput() {
    return new Promise((resolve) => {
        const modal = document.getElementById('url-input-modal');
        const inputField = document.getElementById('url-input-field');
        const okBtn = document.getElementById('url-input-ok');
        const cancelBtn = document.getElementById('url-input-cancel');
        
        modal.style.display = 'flex';
        inputField.value = '';
        inputField.focus();
        
        const handleOk = () => {
            const url = inputField.value.trim();
            modal.style.display = 'none';
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            inputField.removeEventListener('keypress', handleEnter);
            resolve(url);
        };
        
        const handleCancel = () => {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            inputField.removeEventListener('keypress', handleEnter);
            resolve(null);
        };
        
        const handleEnter = (e) => {
            if (e.key === 'Enter') {
                handleOk();
            }
        };
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        inputField.addEventListener('keypress', handleEnter);
    });
}

function handleSongUrl(url, char, gameState, bgMusic) {
    const embedIframe = document.getElementById('angle-song-embed');
    const embedContainer = document.getElementById('angle-song-embed-container');
    const chatEl = document.getElementById('angle-chat');

    if (angleSongPlayer) {
        angleSongPlayer.pause();
        angleSongPlayer = null;
    }
    if (embedIframe) {
        embedIframe.src = '';
    }
    if (embedContainer) {
        embedContainer.style.display = 'none';
    }
    if (window.angleEmbedCheckInterval) {
        clearInterval(window.angleEmbedCheckInterval);
        window.angleEmbedCheckInterval = null;
    }

    if (bgMusic) {
        bgMusic.pause();
        bgMusic.volume = 0;
    }

    let embedUrl = null;
    let isEmbed = false;

    // YouTube URL detection
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('<iframe')) {
        isEmbed = true;
        let videoId = '';
        
        if (url.includes('<iframe')) {
            const iframeMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
            if (iframeMatch && iframeMatch[1]) {
                videoId = iframeMatch[1];
            } else {
                const altMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
                if (altMatch && altMatch[1]) {
                    videoId = altMatch[1];
                }
            }
        } else if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1]?.split('&')[0]?.split('#')[0]?.trim();
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0]?.split('#')[0]?.trim();
        } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('embed/')[1]?.split('?')[0]?.split('&')[0]?.split('#')[0]?.trim();
        }
        
        if (videoId) {
            videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
            if (videoId.length >= 11) {
                videoId = videoId.substring(0, 11);
            }
        }
        
        if (videoId && videoId.length === 11) {
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0&modestbranding=1`;
        } else if (videoId) {
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0&modestbranding=1`;
        }
    }
    // Spotify URL detection
    else if (url.includes('spotify.com') || (url.includes('<iframe') && url.includes('spotify'))) {
        isEmbed = true;
        let spotifyId = '';
        let spotifyType = '';
        
        if (url.includes('<iframe')) {
            const trackMatch = url.match(/spotify\.com\/embed\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
            if (trackMatch && trackMatch[1] && trackMatch[2]) {
                spotifyType = trackMatch[1];
                spotifyId = trackMatch[2];
            }
        }
        
        if (!spotifyId) {
            if (url.includes('track/')) {
                spotifyType = 'track';
                spotifyId = url.split('track/')[1]?.split('?')[0]?.split('/')[0];
            } else if (url.includes('album/')) {
                spotifyType = 'album';
                spotifyId = url.split('album/')[1]?.split('?')[0]?.split('/')[0];
            } else if (url.includes('playlist/')) {
                spotifyType = 'playlist';
                spotifyId = url.split('playlist/')[1]?.split('?')[0]?.split('/')[0];
            }
        }
        
        if (spotifyId && spotifyType) {
            embedUrl = `https://open.spotify.com/embed/${spotifyType}/${spotifyId}?utm_source=generator&autoplay=true`;
        }
    }
    // SoundCloud URL detection
    else if (url.includes('soundcloud.com') || (url.includes('<iframe') && url.includes('soundcloud'))) {
        isEmbed = true;
        let soundcloudUrl = url;
        
        if (url.includes('<iframe')) {
            const urlMatch = url.match(/url=([^&"']+)/);
            if (urlMatch && urlMatch[1]) {
                soundcloudUrl = decodeURIComponent(urlMatch[1]);
            } else {
                const scMatch = url.match(/soundcloud\.com\/[^"'\s]+/);
                if (scMatch && scMatch[0]) {
                    soundcloudUrl = 'https://' + scMatch[0];
                }
            }
        }
        
        embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloudUrl)}&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`;
    }

    if (isEmbed && embedUrl && embedIframe) {
        gameState.isAngleSongPlaying = true;
        embedIframe.src = embedUrl;
        
        // Update button to show pause (||) when custom song (embed) is playing
        updateMusicButton(gameState);

        if (embedContainer) {
            embedContainer.style.display = 'block';
            embedContainer.onclick = (e) => {
                e.stopPropagation();
            };
        }
        if (chatEl) {
            chatEl.textContent = "Playing song...";
        }

        const closeBtn = document.getElementById('angle-song-close');
        if (closeBtn) {
            closeBtn.onclick = null;
            closeBtn.addEventListener('click', () => closeEmbed(char, gameState, bgMusic));
        }

        function handleEmbedMessage(event) {
            if (event.data && typeof event.data === 'string') {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === 'onStateChange') {
                        if (data.info === 0 || data.info === 2) {
                            setTimeout(() => {
                                if (gameState.isAngleSongPlaying) {
                                    closeEmbed(char, gameState, bgMusic);
                                }
                            }, 2000);
                        }
                    }
                } catch (e) {
                    // Not JSON
                }
            }
        }

        window.addEventListener('message', handleEmbedMessage);
        window.angleEmbedMessageHandler = handleEmbedMessage;

        let embedCheckInterval = setInterval(() => {
            try {
                if (embedContainer && embedContainer.style.display === 'none') {
                    clearInterval(embedCheckInterval);
                    window.angleEmbedCheckInterval = null;
                    return;
                }
            } catch (e) {
                // CORS restriction
            }
        }, 1000);

        window.angleEmbedCheckInterval = embedCheckInterval;
    } else {
        // Direct audio file
        angleSongPlayer = new Audio();
        angleSongPlayer.volume = 0.7;
        gameState.isAngleSongPlaying = true;
        gameState.angleSongPlayer = angleSongPlayer; // Store in gameState so button can access it
        
        // Update button to show pause (||) when custom song is playing
        updateMusicButton(gameState);

        if (chatEl) {
            chatEl.textContent = "Playing song...";
        }

        angleSongPlayer.addEventListener('error', (e) => {
            console.log('Song load error:', e, angleSongPlayer.error);
            alert('Error loading song. Please check the URL is a valid direct audio file link (.mp3, .wav, .ogg)');
            gameState.isAngleSongPlaying = false;
            gameState.angleSongPlayer = null; // Clear reference
            // Update button text
            updateMusicButton(gameState);
            if (chatEl) {
                chatEl.style.display = 'none';
            }
            char.isInteracting = false;
            if (bgMusic && gameState.isMusicPlaying) {
                bgMusic.volume = 0.3;
                bgMusic.play().catch(err => console.log('BG music resume error:', err));
            }
        });

        angleSongPlayer.addEventListener('ended', () => {
            gameState.isAngleSongPlaying = false;
            gameState.angleSongPlayer = null; // Clear reference
            if (bgMusic && gameState.isMusicPlaying) {
                bgMusic.volume = 0.3;
                bgMusic.play().catch(e => console.log('BG music resume error:', e));
            }
            // Update button text based on music state
            updateMusicButton(gameState);
            if (chatEl) {
                chatEl.style.display = 'none';
            }
            char.isInteracting = false;
        });

        angleSongPlayer.src = url;
        angleSongPlayer.crossOrigin = 'anonymous';
        angleSongPlayer.load();

        angleSongPlayer.addEventListener('canplaythrough', () => {
            angleSongPlayer.play().catch(e => {
                console.log('Song play error:', e);
                alert('Error playing song. Please check the URL is valid and accessible.');
                gameState.isAngleSongPlaying = false;
                gameState.angleSongPlayer = null; // Clear reference
                // Update button text
                const bwButton = document.getElementById('bw');
                if (bwButton) {
                    bwButton.textContent = gameState.isMusicPlaying ? '||' : '▶';
                }
                if (chatEl) {
                    chatEl.style.display = 'none';
                }
                char.isInteracting = false;
                if (bgMusic && gameState.isMusicPlaying) {
                    bgMusic.volume = 0.3;
                    bgMusic.play().catch(err => console.log('BG music resume error:', err));
                }
            });
        }, { once: true });

        angleSongPlayer.play().catch(e => {
            console.log('Waiting for audio to load...');
        });
    }
}

function closeEmbed(char, gameState, bgMusic) {
    const embedIframe = document.getElementById('angle-song-embed');
    const embedContainer = document.getElementById('angle-song-embed-container');
    const chatEl = document.getElementById('angle-chat');
    
    if (angleSongPlayer) {
        angleSongPlayer.pause();
        angleSongPlayer = null;
    }
    if (embedIframe) {
        embedIframe.src = '';
    }
    if (embedContainer) {
        embedContainer.style.display = 'none';
    }
    if (window.angleEmbedCheckInterval) {
        clearInterval(window.angleEmbedCheckInterval);
        window.angleEmbedCheckInterval = null;
    }
    if (window.angleEmbedMessageHandler) {
        window.removeEventListener('message', window.angleEmbedMessageHandler);
        window.angleEmbedMessageHandler = null;
    }
    gameState.isAngleSongPlaying = false;
    gameState.angleSongPlayer = null; // Clear reference
    // Update button text
    updateMusicButton(gameState);
    if (bgMusic && gameState.isMusicPlaying) {
        bgMusic.volume = 0.3;
        bgMusic.play().catch(err => console.log('BG music resume error:', err));
    }
    if (chatEl) {
        chatEl.style.display = 'none';
    }
    char.isInteracting = false;
}
