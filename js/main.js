console.log("!!! MAIN.JS HAS LOADED SUCCESSFULLY !!!");

// --- GLOBAL FUNCTIONS ---
window.goToMainMenu = function() {
    console.log("SUCCESS: Main Menu function triggered!");
    const overlay = document.getElementById('game-over-overlay');
    if (overlay) overlay.classList.add('hidden');
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-menu').classList.add('active');
};

window.showGameOverScreen = function(finalScore) {
    const overlay = document.getElementById('game-over-overlay');
    const scoreDisplay = document.getElementById('final-score-display');
    scoreDisplay.textContent = finalScore;
    overlay.classList.remove('hidden');
    if (typeof window.playGameOver === 'function') window.playGameOver();
};

window.updateScoreUI = function(score, level, lines) {
    console.log(`Score: ${score} | Level: ${level} | Lines: ${lines}`);
    showFloatingPoints(lines);
    if (typeof window.playLineClear === 'function') {
        if (lines === 4) window.playTetris();
        else window.playLineClear();
    }
};

// --- STATE MANAGEMENT ---
const gameState = {
    currentScreen: 'menu',
    theme: 'cyberpunk',
    settings: { ghost: true, hold: true, next: true, mobileControls: 'swipe', mute: false, soundStyle: 'modern' }
};

// --- UI FUNCTIONS ---
function switchScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screenName).classList.add('active');
    gameState.currentScreen = screenName;
}

function applyTheme(themeName) {
    document.body.className = 'theme-' + themeName;
    gameState.theme = themeName;
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === themeName);
    });
}

function showFloatingPoints(lines) {
    const points = [0, 100, 300, 500, 800][lines];
    const floating = document.createElement('div');
    floating.className = 'floating-points';
    floating.textContent = '+' + points;
    document.body.appendChild(floating);
    setTimeout(() => floating.remove(), 1000);
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Modern Tetris initialized. Welcome!");

    // Load saved settings
    const savedSettings = localStorage.getItem('modernTetrisSettings');
    if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        Object.assign(gameState.settings, parsed);
    }

    // Apply UI settings
    document.getElementById('toggle-ghost').checked = gameState.settings.ghost;
    document.getElementById('toggle-hold').checked = gameState.settings.hold;
    document.getElementById('toggle-next').checked = gameState.settings.next;
    document.getElementById('toggle-mobile-controls').value = gameState.settings.mobileControls;
    document.getElementById('toggle-mute').checked = gameState.settings.mute;
    
    // Apply sound settings
    if (typeof window.setMute === 'function') window.setMute(gameState.settings.mute);
    if (typeof window.setSoundStyle === 'function') window.setSoundStyle(gameState.settings.soundStyle);
    document.querySelector(`input[name="sound-style"][value="${gameState.settings.soundStyle}"]`).checked = true;

    const savedTheme = localStorage.getItem('modernTetrisTheme');
    if (savedTheme) applyTheme(savedTheme);

    // Button Listeners
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            if (typeof window.initAudio === 'function') window.initAudio(); // Wake up audio
            switchScreen('game');
            if (typeof window.startGameEngine === 'function') window.startGameEngine();
        });
    }

    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) btnSettings.addEventListener('click', () => switchScreen('settings'));

    const btnBackSettings = document.getElementById('btn-back-settings');
    if (btnBackSettings) btnBackSettings.addEventListener('click', () => switchScreen('menu'));

    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            document.getElementById('game-over-overlay').classList.add('hidden');
            window.startGameEngine();
        });
    }

    const btnMainMenu = document.getElementById('btn-main-menu');
    if (btnMainMenu) {
        btnMainMenu.addEventListener('click', () => window.goToMainMenu());
    }

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });

    // Settings Change Listeners
    function saveSettings() {
        gameState.settings.ghost = document.getElementById('toggle-ghost').checked;
        gameState.settings.hold = document.getElementById('toggle-hold').checked;
        gameState.settings.next = document.getElementById('toggle-next').checked;
        gameState.settings.mobileControls = document.getElementById('toggle-mobile-controls').value;
        gameState.settings.mute = document.getElementById('toggle-mute').checked;
        gameState.settings.soundStyle = document.querySelector('input[name="sound-style"]:checked').value;
        
        localStorage.setItem('modernTetrisSettings', JSON.stringify(gameState.settings));
        localStorage.setItem('modernTetrisTheme', gameState.theme);

        if (typeof window.setMute === 'function') window.setMute(gameState.settings.mute);
        if (typeof window.setSoundStyle === 'function') window.setSoundStyle(gameState.settings.soundStyle);
    }

    document.querySelectorAll('#screen-settings input, #screen-settings select').forEach(el => {
        el.addEventListener('change', saveSettings);
    });
});