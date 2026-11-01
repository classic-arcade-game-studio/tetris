// --- SOUND ENGINE (Web Audio API) ---
let audioCtx = null;
let isMuted = false;
let soundStyle = 'modern'; // 'modern' or 'retro'

// Initialize audio context (must be done on user interaction)
window.initAudio = function() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};

// Helper to play a basic tone
function playTone(freq, type, duration, volume = 0.1, delay = 0) {
    if (isMuted || !audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
    
    gain.gain.setValueAtTime(volume, audioCtx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + duration);
}

// --- SOUND EFFECTS ---

window.playRotate = function() {
    if (soundStyle === 'retro') {
        playTone(400, 'square', 0.05, 0.05);
        playTone(600, 'square', 0.05, 0.05, 0.05);
    } else {
        playTone(500, 'sine', 0.1, 0.1);
    }
};

window.playHardDrop = function() {
    if (soundStyle === 'retro') {
        playTone(150, 'sawtooth', 0.1, 0.1);
        playTone(80, 'sawtooth', 0.15, 0.1, 0.05);
    } else {
        playTone(100, 'sine', 0.2, 0.15);
    }
};

window.playHold = function() {
    if (soundStyle === 'retro') {
        playTone(300, 'square', 0.05, 0.05);
        playTone(600, 'square', 0.05, 0.05, 0.05);
        playTone(900, 'square', 0.05, 0.05, 0.1);
    } else {
        playTone(400, 'triangle', 0.15, 0.1);
        playTone(800, 'triangle', 0.15, 0.1, 0.1);
    }
};

window.playLineClear = function() {
    if (soundStyle === 'retro') {
        playTone(500, 'square', 0.1, 0.08);
        playTone(700, 'square', 0.1, 0.08, 0.1);
        playTone(900, 'square', 0.15, 0.08, 0.2);
    } else {
        playTone(523, 'sine', 0.15, 0.1); // C5
        playTone(659, 'sine', 0.15, 0.1, 0.1); // E5
        playTone(783, 'sine', 0.2, 0.1, 0.2); // G5
    }
};

window.playTetris = function() {
    // Fanfare for 4 lines
    if (soundStyle === 'retro') {
        playTone(523, 'square', 0.1, 0.1);
        playTone(659, 'square', 0.1, 0.1, 0.1);
        playTone(783, 'square', 0.1, 0.1, 0.2);
        playTone(1046, 'square', 0.3, 0.1, 0.3);
    } else {
        playTone(523, 'sine', 0.2, 0.15);
        playTone(659, 'sine', 0.2, 0.15, 0.15);
        playTone(783, 'sine', 0.2, 0.15, 0.3);
        playTone(1046, 'sine', 0.4, 0.15, 0.45);
    }
};

window.playGameOver = function() {
    if (soundStyle === 'retro') {
        playTone(400, 'sawtooth', 0.2, 0.1);
        playTone(300, 'sawtooth', 0.2, 0.1, 0.2);
        playTone(200, 'sawtooth', 0.2, 0.1, 0.4);
        playTone(100, 'sawtooth', 0.5, 0.1, 0.6);
    } else {
        playTone(300, 'sine', 0.3, 0.15);
        playTone(200, 'sine', 0.3, 0.15, 0.25);
        playTone(100, 'sine', 0.6, 0.15, 0.5);
    }
};

// --- SETTINGS CONTROL ---

window.setMute = function(muted) {
    isMuted = muted;
};

window.setSoundStyle = function(style) {
    soundStyle = style;
};