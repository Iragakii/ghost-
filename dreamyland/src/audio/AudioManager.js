// Helper function to update button text based on current state
export function updateMusicButton(gameState) {
    const bwButton = document.getElementById('bw');
    if (!bwButton) return;
    
    // If angle.mp3 or custom song is playing, show play arrow (to resume bg music)
    if (gameState.isAngleSoundPlaying || gameState.isAngleSongPlaying) {
        bwButton.textContent = '▶';
    } else {
        // Otherwise, show based on bg music state
        bwButton.textContent = gameState.isMusicPlaying ? '||' : '▶';
    }
}

export function initAudio(gameState) {
    const bgMusic = document.getElementById('bgMusic');
    bgMusic.volume = 0.3;
    
    bgMusic.addEventListener('play', (e) => {
        if (gameState.isAngleSoundPlaying || gameState.isAngleSongPlaying) {
            bgMusic.pause();
            e.preventDefault();
        }
    });
    
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Try to autoplay, but don't worry if it fails (browser will block it)
    let autoplaySucceeded = false;
    bgMusic.play().then(() => {
        autoplaySucceeded = true;
        gameState.isMusicPlaying = true;
    }).catch(() => {
        // Autoplay blocked - this is expected, will start on user interaction
        autoplaySucceeded = false;
        gameState.isMusicPlaying = false;
    });

    // Function to start music on first user interaction
    const startMusicOnInteraction = () => {
        // Mark that user has interacted (may already be set by InputHandler)
        gameState.hasUserInteracted = true;
        
        // Resume audio context
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        // Start music automatically on first interaction (if not already playing and not blocked by angle sound/song)
        if (!autoplaySucceeded && bgMusic.paused && !gameState.isAngleSoundPlaying && !gameState.isAngleSongPlaying && !gameState.isMusicPlaying) {
            bgMusic.play().then(() => {
                gameState.isMusicPlaying = true;
                updateMusicButton(gameState);
            }).catch(e => {
                console.log('BG music play error:', e);
            });
        }
    };
    
    // Resume audio context and start music on first user interaction
    // Use capture phase to ensure we run before InputHandler
    document.addEventListener('click', startMusicOnInteraction, { once: true, capture: true });
    document.addEventListener('keydown', startMusicOnInteraction, { once: true, capture: true });
    document.addEventListener('touchstart', startMusicOnInteraction, { once: true, capture: true });
    
    // Also check periodically if user has interacted and music should start
    // This handles the case where InputHandler sets hasUserInteracted before audio handler runs
    const checkMusicStart = setInterval(() => {
        if (gameState.hasUserInteracted && !autoplaySucceeded && bgMusic.paused && 
            !gameState.isAngleSoundPlaying && !gameState.isAngleSongPlaying && !gameState.isMusicPlaying) {
            startMusicOnInteraction();
            clearInterval(checkMusicStart);
        }
    }, 100);
    
    // Clean up interval after 10 seconds (user should have interacted by then)
    setTimeout(() => clearInterval(checkMusicStart), 10000);

    const bwButton = document.getElementById('bw');
    // Check if music is actually playing to set initial button state
    gameState.isMusicPlaying = !bgMusic.paused;
    updateMusicButton(gameState);
    
    bwButton.addEventListener('click', () => {
        gameState.hasUserInteracted = true; // Mark interaction when button is clicked
        
        // If angle.mp3 is playing, stop it and resume bg music
        if (gameState.isAngleSoundPlaying && gameState.angleSound) {
            // Stop angle.mp3
            gameState.angleSound.pause();
            gameState.angleSound.currentTime = 0;
            gameState.isAngleSoundPlaying = false;
            gameState.angleSound = null;
            
            // Hide chat bubble
            const chatEl = document.getElementById(`char${gameState.closestCharIndex + 1}-chat`);
            if (chatEl) {
                chatEl.style.display = 'none';
            }
            // Reset character interaction state
            if (gameState.closestCharIndex >= 0 && gameState.characterModels) {
                const char = gameState.characterModels[gameState.closestCharIndex];
                if (char) {
                    char.isInteracting = false;
                }
            }
            
            // Resume bg music if it was playing before
            if (bgMusic && gameState.musicWasPlayingBeforeAngle) {
                bgMusic.volume = 0.3; // Restore volume
                gameState.isMusicPlaying = true;
                bgMusic.play().catch(e => console.log('BG music resume error:', e));
            } else {
                // Music wasn't playing before, so keep it paused
                gameState.isMusicPlaying = false;
            }
            updateMusicButton(gameState);
        }
        // If custom song is playing, stop it and resume bg music
        else if (gameState.isAngleSongPlaying && (gameState.angleSongPlayer || document.getElementById('angle-song-embed-container'))) {
            // Stop custom song
            if (gameState.angleSongPlayer) {
                gameState.angleSongPlayer.pause();
                gameState.angleSongPlayer = null;
            }
            // Also handle embed iframe if present
            const embedIframe = document.getElementById('angle-song-embed');
            const embedContainer = document.getElementById('angle-song-embed-container');
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
            
            // Hide chat bubble
            const chatEl = document.getElementById('angle-chat');
            if (chatEl) {
                chatEl.style.display = 'none';
            }
            // Reset character interaction state
            if (gameState.closestCharIndex >= 0 && gameState.characterModels) {
                const char = gameState.characterModels[gameState.closestCharIndex];
                if (char) {
                    char.isInteracting = false;
                }
            }
            
            // Resume bg music if it was playing before
            if (bgMusic && gameState.musicWasPlayingBeforeAngle) {
                bgMusic.volume = 0.3; // Restore volume
                gameState.isMusicPlaying = true;
                bgMusic.play().catch(e => console.log('BG music resume error:', e));
            } else {
                // Music wasn't playing before, so keep it paused
                gameState.isMusicPlaying = false;
            }
            updateMusicButton(gameState);
        } else {
            // Normal play/pause when angle.mp3 is not playing
            if (gameState.isMusicPlaying) {
                bgMusic.pause();
                gameState.isMusicPlaying = false;
            } else {
                bgMusic.play().catch(e => console.log('BG music play error:', e));
                gameState.isMusicPlaying = true;
            }
            updateMusicButton(gameState);
        }
        bwButton.blur();
    });

    function playJumpSound() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.15);
    }

    function playDuckWalkSound() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.15);
    }

    return {
        bgMusic,
        audioCtx,
        playJumpSound,
        playDuckWalkSound,
        updateMusicButton
    };
}

