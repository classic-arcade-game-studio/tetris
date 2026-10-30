// --- STATE MANAGEMENT ---
const gameState = {
    currentScreen: 'menu', // 'menu', 'settings', 'game'
    theme: 'cyberpunk',    // 'cyberpunk', 'vibrant', 'zen'
    settings: {
        ghost: true,
        hold: true,
        next: true,
        mobileControls: 'swipe'
    }
};

// --- DOM ELEMENTS ---
const screens = {
    menu: document.getElementById('screen-menu'),
    settings: document.getElementById('screen-settings'),
    game: document.getElementById('screen-game')
};

const themeButtons = document.querySelectorAll('.theme-btn');
const btnStart = document.getElementById('btn-start');
const btnSettings = document.getElementById('btn-settings');
const btnBackSettings = document.getElementById('btn-back-settings');

// --- UI FUNCTIONS ---
function switchScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    // Show target screen
    screens[screenName].classList.add('active');
    gameState.currentScreen = screenName;
}

function applyTheme(themeName) {
    // Remove all theme classes from body
    document.body.classList.remove('theme-cyberpunk', 'theme-vibrant', 'theme-zen');
    // Add new theme class
    document.body.classList.add(`theme-${themeName}`);
    gameState.theme = themeName;
    
    // Update button active states
    themeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === themeName);
    });
}

// --- EVENT LISTENERS ---
// Theme Selection
themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        applyTheme(btn.dataset.theme);
    });
});

// Menu Navigation
btnStart.addEventListener('click', () => {
    switchScreen('game');
    // Start the engine
    if (typeof window.startGameEngine === 'function') {
        window.startGameEngine();
    } else {
        console.log("Engine not found! Check index.html script tags.");
    }
});

btnSettings.addEventListener('click', () => {
    switchScreen('settings');
});

btnBackSettings.addEventListener('click', () => {
    switchScreen('menu');
});

// Settings Toggles (Placeholder logic for Step 1)
document.getElementById('toggle-ghost').addEventListener('change', (e) => {
    gameState.settings.ghost = e.target.checked;
});
document.getElementById('toggle-hold').addEventListener('change', (e) => {
    gameState.settings.hold = e.target.checked;
});
document.getElementById('toggle-next').addEventListener('change', (e) => {
    gameState.settings.next = e.target.checked;
});
document.getElementById('toggle-mobile-controls').addEventListener('change', (e) => {
    gameState.settings.mobileControls = e.target.value;
});

// --- INITIALIZATION ---
function init() {
    // Check if user is on mobile (Pointer coarse = touch screen)
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    if (isMobile) {
        console.log("Mobile device detected.");
        // We will adjust default mobile controls here in Step 3
    }

    // Load saved settings from localStorage (if any)
    const savedSettings = localStorage.getItem('modernTetrisSettings');
    if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        Object.assign(gameState.settings, parsed);
        
        // Sync UI with loaded settings
        document.getElementById('toggle-ghost').checked = gameState.settings.ghost;
        document.getElementById('toggle-hold').checked = gameState.settings.hold;
        document.getElementById('toggle-next').checked = gameState.settings.next;
        document.getElementById('toggle-mobile-controls').value = gameState.settings.mobileControls;
    }

    const savedTheme = localStorage.getItem('modernTetrisTheme');
    if (savedTheme) {
        applyTheme(savedTheme);
    }

    console.log("Modern Tetris initialized. Welcome!");
}

// Save settings whenever they change (Simple implementation)
function saveToStorage() {
    localStorage.setItem('modernTetrisSettings', JSON.stringify(gameState.settings));
    localStorage.setItem('modernTetrisTheme', gameState.theme);
}

// Attach save function to setting changes
document.querySelectorAll('#screen-settings input, #screen-settings select').forEach(el => {
    el.addEventListener('change', saveToStorage);
});
// Also save when theme changes
themeButtons.forEach(btn => btn.addEventListener('click', saveToStorage));

// Run initialization
init();