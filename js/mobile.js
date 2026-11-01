// --- MOBILE SWIPE CONTROLS ---
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let longPressTimer = null;
let isLongPress = false;

const LONG_PRESS_DURATION = 500; // ms
const TAP_DURATION = 200; // ms
const SWIPE_THRESHOLD = 30; // px

document.addEventListener('touchstart', (e) => {
    // Only run if swipe controls are enabled in settings
    const controlType = document.getElementById('toggle-mobile-controls')?.value;
    if (controlType !== 'swipe') return;

    // Only run if the game screen is active
    if (!document.getElementById('screen-game').classList.contains('active')) return;

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    isLongPress = false;

    // Start the long press timer
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

    // Prevent the browser from scrolling while playing
    e.preventDefault();

    // If the finger moves too much, cancel the long press
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

    // If it was a long press, we already handled it in touchstart
    if (isLongPress) return; 

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const timeElapsed = Date.now() - touchStartTime;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Quick Tap = Hard Drop
    if (timeElapsed < TAP_DURATION && absDeltaX < SWIPE_THRESHOLD && absDeltaY < SWIPE_THRESHOLD) {
        if (typeof window.mobileHardDrop === 'function') window.mobileHardDrop();
        return;
    }

    // Swipe logic
    if (absDeltaX > absDeltaY) {
        // Horizontal Swipe
        if (deltaX > SWIPE_THRESHOLD) {
            if (typeof window.mobileMove === 'function') window.mobileMove(1); // Right
        } else if (deltaX < -SWIPE_THRESHOLD) {
            if (typeof window.mobileMove === 'function') window.mobileMove(-1); // Left
        }
    } else {
        // Vertical Swipe
        if (deltaY > SWIPE_THRESHOLD) {
            if (typeof window.mobileSoftDrop === 'function') window.mobileSoftDrop(); // Down
        } else if (deltaY < -SWIPE_THRESHOLD) {
            if (typeof window.mobileRotate === 'function') window.mobileRotate(); // Up
        }
    }
});

// Visual cue for Hold
function showHoldCue() {
    const cue = document.createElement('div');
    cue.className = 'mobile-hold-cue';
    cue.textContent = 'HOLD';
    document.body.appendChild(cue);
    setTimeout(() => cue.remove(), 600);
}