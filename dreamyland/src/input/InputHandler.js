import { setExpression } from '../components/GhostExpressions.js';

// Audio elements for character interactions
let newCharSound = null;
let angleSound = null;
let angleSongPlayer = null;
let fatSound = null;
let lmSound = null;

export function initInput(gameState, ghostGroup, duckGroup, characterModels, characterTimeouts, newCharacterGroup, audioData) {
    const { bgMusic } = audioData;

    // Keyboard input
    window.addEventListener('keydown', e => {
        gameState.keys[e.key.toLowerCase()] = true;
        
        // Expression keys
        if (e.key === 'j') setExpression(ghostGroup, 'sad');
        if (e.key === 'k') setExpression(ghostGroup, 'smile');
        if (e.key === 'l') setExpression(ghostGroup, 'crying');

        // Handle F key for character interaction
        if (e.key.toLowerCase() === 'f') {
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

                        if (!angleSound.hasEndedListener) {
                            angleSound.addEventListener('ended', () => {
                                gameState.isAngleSoundPlaying = false;
                                if (bgMusic && gameState.isMusicPlaying) {
                                    bgMusic.volume = 0.3;
                                    bgMusic.play().catch(e => console.log('BG music resume error:', e));
                                }
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

                        if (bgMusic) {
                            bgMusic.pause();
                            bgMusic.currentTime = 0;
                            bgMusic.volume = 0;
                        }

                        gameState.isAngleSoundPlaying = true;
                        angleSound.currentTime = 0;
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
        if (['j', 'k', 'l'].includes(e.key.toLowerCase())) {
            setExpression(ghostGroup, 'neutral');
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

        if (chatEl) {
            chatEl.textContent = "Playing song...";
        }

        angleSongPlayer.addEventListener('error', (e) => {
            console.log('Song load error:', e, angleSongPlayer.error);
            alert('Error loading song. Please check the URL is a valid direct audio file link (.mp3, .wav, .ogg)');
            gameState.isAngleSongPlaying = false;
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
            if (bgMusic && gameState.isMusicPlaying) {
                bgMusic.volume = 0.3;
                bgMusic.play().catch(e => console.log('BG music resume error:', e));
            }
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
    if (bgMusic && gameState.isMusicPlaying) {
        bgMusic.volume = 0.3;
        bgMusic.play().catch(err => console.log('BG music resume error:', err));
    }
    if (chatEl) {
        chatEl.style.display = 'none';
    }
    char.isInteracting = false;
}
