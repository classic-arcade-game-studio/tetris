// --- KEYBOARD CONTROLS ---

document.addEventListener('keydown', event => {
    // Only allow controls if the game screen is currently visible
    const gameScreen = document.getElementById('screen-game');
    if (!gameScreen.classList.contains('active')) return;

    // Prevent default browser scrolling for game keys
    if ([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
        event.preventDefault();
    }

    // Check if the engine is running (piece exists)
    if (typeof currentPiece === 'undefined' || !currentPiece) return;

    switch (event.keyCode) {
        case 37: // Left Arrow
            move(-1);
            break;
        case 39: // Right Arrow
            move(1);
            break;
        case 40: // Down Arrow (Soft Drop)
            playerSoftDrop();
            break;
        case 38: // Up Arrow (Rotate)
            rotate();
            // Play Rotate Sound
            if (typeof window.playRotate === 'function') window.playRotate();
            break;
        case 32: // Spacebar (Hard Drop)
            playerHardDrop();
            break;
        case 67: // 'C' key (Hold)
            hold();
            break;
    }
});