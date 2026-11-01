// --- CONSTANTS ---
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const SHAPES = [
    [], 
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
    [[2,0,0], [2,2,2], [0,0,0]],                 // J
    [[0,0,3], [3,3,3], [0,0,0]],                 // L
    [[4,4], [4,4]],                              // O
    [[0,5,5], [5,5,0], [0,0,0]],                 // S
    [[0,6,0], [6,6,6], [0,0,0]],                 // T
    [[7,7,0], [0,7,7], [0,0,0]]                  // Z
];

const COLORS = [
    null, '#00f0f0', '#0000f0', '#f0a000', '#f0f000', '#00f000', '#a000f0', '#f00000'
];

const LINE_SCORES = [0, 100, 300, 500, 800];

// --- GAME STATE ---
let board = [];
let currentPiece = null;
let nextQueue = [];
let holdPiece = null;
let canHold = true;
let bag = [];
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isGameRunning = false;
let score = 0;
let linesCleared = 0;
let level = 1;
let animationState = {
    active: false,
    lines: [],
    points: 0,
    timer: 0
};

// --- POWER METER STATE ---
let powerMeter = 0; // 0 to 100
let isPowerMode = false;

// --- CANVAS SETUP ---
const canvas = document.getElementById('canvas-board');
const ctx = canvas.getContext('2d');
ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

const canvasHold = document.getElementById('canvas-hold');
const ctxHold = canvasHold.getContext('2d');
ctxHold.scale(20, 20);

const canvasNext = document.getElementById('canvas-next');
const ctxNext = canvasNext.getContext('2d');
ctxNext.scale(20, 20);

// --- FUNCTIONS ---

function createBoard() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function fillBag() {
    bag = [1, 2, 3, 4, 5, 6, 7];
    for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
    }
}

function getNextPieceId() {
    if (bag.length === 0) fillBag();
    return bag.pop();
}

function spawnPiece() {
    const nextId = nextQueue.shift();
    nextQueue.push(getNextPieceId());

    const shape = SHAPES[nextId];
    const color = COLORS[nextId];
    
    currentPiece = {
        shape: shape,
        color: color,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };

    if (collide(board, currentPiece)) {
        triggerGameOver();
        return;
    }
    
    canHold = true;
    drawSidePanels();
}

function collide(board, piece) {
    const m = piece.shape;
    const o = piece;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(board, piece) {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + piece.y][x + piece.x] = piece.color;
            }
        });
    });
}

function clearLines() {
    let lines = 0;
    let clearedRows = [];

    outer: for (let y = ROWS - 1; y >= 0; --y) {
        for (let x = 0; x < COLS; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        clearedRows.push(y);
        lines++;
    }

    if (lines > 0) {
        triggerLineClearAnimation(lines, clearedRows);
        
        const newBoard = board.filter((row, index) => !clearedRows.includes(index));
        while (newBoard.length < ROWS) {
            newBoard.unshift(Array(COLS).fill(0));
        }
        board = newBoard;
    }
}

function triggerLineClearAnimation(lines, clearedRows) {
    const points = LINE_SCORES[lines] * level;
    score += points;
    linesCleared += lines;
    
    // --- POWER METER FILL LOGIC ---
    let fillAmount = [0, 10, 20, 30, 50][lines];
    powerMeter += fillAmount;
    
    if (powerMeter >= 100) {
        powerMeter = 100;
        isPowerMode = true;
        level = 1; // Reset to Zero Speed-Up
    } else {
        level = Math.floor(linesCleared / 10) + 1;
    }
    dropInterval = Math.max(100, 1000 - (level - 1) * 100);

    animationState = {
        active: true,
        lines: clearedRows,
        points: points,
        timer: 0,
        intensity: lines
    };

    if (typeof window.updateScoreUI === 'function') {
        window.updateScoreUI(score, level, lines);
    }
}

// --- MOVEMENT & ACTIONS ---

function move(dir) {
    if (animationState.active || !isGameRunning) return;
    currentPiece.x += dir;
    if (collide(board, currentPiece)) {
        currentPiece.x -= dir;
    }
}

function rotate() {
    if (animationState.active || !isGameRunning) return;
    const pos = currentPiece.x;
    let offset = 1;
    const originalShape = currentPiece.shape;
    
    currentPiece.shape = currentPiece.shape[0].map((val, index) =>
        currentPiece.shape.map(row => row[index]).reverse()
    );

    while (collide(board, currentPiece)) {
        currentPiece.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > currentPiece.shape[0].length) {
            currentPiece.shape = originalShape;
            currentPiece.x = pos;
            return;
        }
    }
}

function playerSoftDrop() {
    if (animationState.active || !isGameRunning) return;
    currentPiece.y++;
    if (collide(board, currentPiece)) {
        currentPiece.y--;
        merge(board, currentPiece);
        clearLines();
        spawnPiece();
    }
    dropCounter = 0;
}

function playerHardDrop() {
    if (animationState.active || !isGameRunning) return;
    while (!collide(board, currentPiece)) {
        currentPiece.y++;
    }
    currentPiece.y--;
    merge(board, currentPiece);
    
    // Play Hard Drop Sound
    if (typeof window.playHardDrop === 'function') window.playHardDrop();
    
    clearLines();
    spawnPiece();
    dropCounter = 0;
}

function hold() {
    if (!canHold || animationState.active || !isGameRunning) return;

    if (holdPiece) {
        const temp = holdPiece;
        holdPiece = { shape: currentPiece.shape, color: currentPiece.color };
        currentPiece = { shape: temp.shape, color: temp.color, x: 3, y: 0 };
    } else {
        holdPiece = { shape: currentPiece.shape, color: currentPiece.color };
        spawnPiece();
    }

    // Play Hold Sound
    if (typeof window.playHold === 'function') window.playHold();

    canHold = false;
    drawSidePanels();
}

// --- DRAWING ---

function drawMatrix(matrix, offset, context, colorOverride = null, alpha = 1.0) {
    context.globalAlpha = alpha;
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colorOverride || (typeof value === 'string' ? value : COLORS[value]);
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                
                // White Borders (Thin)
                context.strokeStyle = '#ffffff'; 
                context.lineWidth = 0.04; 
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
    context.globalAlpha = 1.0;
}

function drawGhost() {
    if (!currentPiece || animationState.active) return;
    
    let ghostY = currentPiece.y;
    while (!collideAt(board, currentPiece.shape, currentPiece.x, ghostY + 1)) {
        ghostY++;
    }

    // Draw only the chunky white outlines
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.06; // This creates a 2px thick line on our scaled canvas
    ctx.globalAlpha = 0.8;

    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.strokeRect(x + currentPiece.x, y + ghostY, 1, 1);
            }
        });
    });

    ctx.restore();
}

function collideAt(board, shape, x, y) {
    for (let r = 0; r < shape.length; ++r) {
        for (let c = 0; c < shape[r].length; ++c) {
            if (shape[r][c] !== 0 &&
               (board[y + r] && board[y + r][x + c]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function drawSidePanels() {
    ctxHold.clearRect(0, 0, canvasHold.width, canvasHold.height);
    ctxNext.clearRect(0, 0, canvasNext.width, canvasNext.height);

    if (holdPiece) {
        drawMatrix(holdPiece.shape, { x: 1, y: 1 }, ctxHold, holdPiece.color);
    }

    // Reset transform before drawing Next queue
    ctxNext.setTransform(1, 0, 0, 1, 0, 0);
    ctxNext.clearRect(0, 0, canvasNext.width, canvasNext.height);

    // Check if mobile (650px or less)
    const isMobile = window.innerWidth <= 650;
    
    if (isMobile) {
        // Draw Horizontally for mobile
        ctxNext.scale(8, 8); 
        nextQueue.forEach((id, index) => {
            drawMatrix(SHAPES[id], { x: 1 + (index * 4), y: 1 }, ctxNext, COLORS[id]);
        });
    } else {
        // Draw Vertically (Standard Desktop)
        ctxNext.scale(20, 20);
        nextQueue.forEach((id, index) => {
            drawMatrix(SHAPES[id], { x: 1, y: 1 + (index * 4) }, ctxNext, COLORS[id]);
        });
    }
}

function draw() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    drawMatrix(board, { x: 0, y: 0 }, ctx);
    drawGhost();
    
    if (currentPiece) {
        drawMatrix(currentPiece.shape, { x: currentPiece.x, y: currentPiece.y }, ctx, currentPiece.color);
    }

    // Flash effect for cleared lines (0.25 seconds)
    if (animationState.active) {
        animationState.lines.forEach(y => {
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, y, COLS, 1);
            ctx.globalAlpha = 1.0;
        });
    }
}

function update(time = 0) {
    if (!isGameRunning) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    if (animationState.active) {
        animationState.timer += deltaTime;
        if (animationState.timer > 250) { 
            animationState.active = false;
        }
    } else {
        // --- POWER METER DRAIN & SPEED LOGIC ---
        if (isPowerMode) {
            powerMeter -= deltaTime / 1000; // Drain 1% per second
            if (powerMeter <= 0) {
                powerMeter = 0;
                isPowerMode = false;
            }
            dropInterval = 1000; // Force Zero Speed-Up (Level 1)
        } else {
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }

        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerSoftDrop();
        }
    }

    // Update Power Meter UI
    if (typeof window.updatePowerMeterUI === 'function') {
        window.updatePowerMeterUI(powerMeter, isPowerMode);
    }

    draw();
    requestAnimationFrame(update);
}

// --- GAME OVER ---

function triggerGameOver() {
    isGameRunning = false;
    if (typeof window.showGameOverScreen === 'function') {
        window.showGameOverScreen(score);
    }
}

// --- PUBLIC START FUNCTION ---
window.startGameEngine = function() {
    createBoard();
    for(let i=0; i<4; i++) nextQueue.push(getNextPieceId());
    
    score = 0;
    linesCleared = 0;
    level = 1;
    dropInterval = 1000;
    holdPiece = null;
    animationState = { active: false, lines: [], points: 0, timer: 0 };
    
    spawnPiece();
    isGameRunning = true;
    lastTime = 0;
    update();
};

// Expose functions for mobile controls
window.mobileMove = move;
window.mobileRotate = rotate;
window.mobileSoftDrop = playerSoftDrop;
window.mobileHardDrop = playerHardDrop;
window.mobileHold = hold;