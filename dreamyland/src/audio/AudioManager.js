export function initAudio(gameState) {
    const bgMusic = document.getElementById('bgMusic');
    bgMusic.volume = 0.3;
    
    bgMusic.addEventListener('play', (e) => {
        if (gameState.isAngleSoundPlaying || gameState.isAngleSongPlaying) {
            bgMusic.pause();
            e.preventDefault();
        }
    });
    
    bgMusic.play().catch(e => console.log('Autoplay blocked, will play on interaction'));

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Resume audio context on first user interaction (for jump/duck walk sounds)
    const resumeAudio = () => {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    };
    
    // Add listeners for first interaction
    document.addEventListener('click', resumeAudio, { once: true });
    document.addEventListener('keydown', resumeAudio, { once: true });
    document.addEventListener('touchstart', resumeAudio, { once: true });

    const bwButton = document.getElementById('bw');
    gameState.isMusicPlaying = true;
    bwButton.textContent = '||'; // Start with pause icon since music should be playing
    bwButton.addEventListener('click', () => {
        if (gameState.isMusicPlaying) {
            bgMusic.pause();
            bwButton.textContent = '▶';
            gameState.isMusicPlaying = false;
        } else {
            bgMusic.play();
            bwButton.textContent = '||';
            gameState.isMusicPlaying = true;
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
        playDuckWalkSound
    };
}

