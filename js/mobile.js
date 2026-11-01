// --- MOBILE CONTROLS MANAGER ---

// 1. D-PAD VISIBILITY TOGGLE
function updateDpadVisibility() {
    const dpad = document.getElementById('mobile-dpad');
    const controlType = document.getElementById('toggle-mobile-controls')?.value;
    
    console.log("Updating D-Pad. Control Type:", controlType); // Debug log
    
    if (!dpad) return;

    if (controlType === 'dpad') {
        dpad.classList.remove('hidden');
        console.log("D-Pad should be visible now.");
    } else {
        dpad.classList.add('hidden');
        console.log("D-Pad hidden.");
    }
}

// Call this when the page loads and whenever settings change
document.addEventListener('DOMContentLoaded', () => {
    updateDpadVisibility();
    
    // Listen for setting changes to toggle D-Pad
    const mobileControlSelect = document.getElementById('toggle-mobile-controls');
    if (mobileControlSelect) {
        mobileControlSelect.addEventListener('change', updateDpadVisibility);
    }
});


// 2. D-PAD BUTTON EVENT LISTENERS
// We use both touch and mouse events so it can be tested on desktop
const dpadButtons = [
    { id: 'btn-dpad-up', action: 'mobileRotate' },
    { id: 'btn-dpad-left', action: 'mobileMove', param: -1 },
    { id: 'btn-dpad-right', action: 'mobileMove', param: 1 },
    { id: 'btn-dpad-down', action: 'mobileSoftDrop' },
    { id: 'btn-dpad-hold', action: 'mobileHold' },
    { id: 'btn-dpad-harddrop', action: 'mobileHardDrop' }
];

dpadButtons.forEach(btnConfig => {
    const btn = document.getElementById(btnConfig.id);
    if (!btn) return;

    const triggerAction = (e) => {
        e.preventDefault(); // Prevent zoom/scroll
        if (typeof window[btnConfig.action] === 'function') {
            if (btnConfig.param !== undefined) {
                window[btnConfig.action](btnConfig.param);
            } else {
                window[btnConfig.action]();
            }
        }
    };

    btn.addEventListener('touchstart', triggerAction, { passive: false });
    btn.addEventListener('mousedown', triggerAction);
});


// 3. SWIPE & LONG PRESS GESTURES (Existing Logic)
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let longPressTimer = null;
let isLongPress = false;

const LONG_PRESS_DURATION = 500; // ms
const TAP_DURATION = 200; // ms
const SWIPE_THRESHOLD = 30; // px

document.addEventListener('touchstart', (e) => {
    const controlType = document.getElementById('toggle-mobile-controls')?.value;
    if (controlType !== 'swipe') return;
    if (!document.getElementById('screen-game').classList.contains('active')) return;

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    isLongPress = false;

    longPressTimer = setTimeout(() => {
        isLongPress = true;
        if (typeof window.mobileHold === 'function') window.mobileHold();
        showHoldCue();
    }, LONG_PRESS_DURATION);
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    const controlType = document.getElementById('toggle-mobile-controls')?.value;
    if (controlType !== 'swipe') return;
    if (!document.getElementById('screen-game').classList.contains('active')) return;

    e.preventDefault();

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = Math.abs(currentX - touchStartX);
    const deltaY = Math.abs(currentY - touchStartY);

    if (deltaX > 10 || deltaY > 10) {
        clearTimeout(longPressTimer);
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    const controlType = document.getElementById('toggle-mobile-controls')?.value;
    if (controlType !== 'swipe') return;
    if (!document.getElementById('screen-game').classList.contains('active')) return;

    clearTimeout(longPressTimer);
    if (isLongPress) return; 

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const timeElapsed = Date.now() - touchStartTime;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (timeElapsed < TAP_DURATION && absDeltaX < SWIPE_THRESHOLD && absDeltaY < SWIPE_THRESHOLD) {
        if (typeof window.mobileHardDrop === 'function') window.mobileHardDrop();
        return;
    }

    if (absDeltaX > absDeltaY) {
        if (deltaX > SWIPE_THRESHOLD) {
            if (typeof window.mobileMove === 'function') window.mobileMove(1);
        } else if (deltaX < -SWIPE_THRESHOLD) {
            if (typeof window.mobileMove === 'function') window.mobileMove(-1);
        }
    } else {
        if (deltaY > SWIPE_THRESHOLD) {
            if (typeof window.mobileSoftDrop === 'function') window.mobileSoftDrop();
        } else if (deltaY < -SWIPE_THRESHOLD) {
            if (typeof window.mobileRotate === 'function') window.mobileRotate();
        }
    }
});

function showHoldCue() {
    const cue = document.createElement('div');
    cue.className = 'mobile-hold-cue';
    cue.textContent = 'HOLD';
    document.body.appendChild(cue);
    setTimeout(() => cue.remove(), 600);
}