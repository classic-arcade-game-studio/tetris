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
let animationState = { active: false, lines: [], points: 0, timer: 0 };

// --- POWER METER STATE ---
let powerMeter = 0;
let isPowerMode = false;

// --- DESKTOP CANVAS SETUP ---
const canvas = document.getElementById('canvas-board');
const ctx = canvas ? canvas.getContext('2d') : null;
if (ctx) ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

const canvasHold = document.getElementById('canvas-hold');
const ctxHold = canvasHold ? canvasHold.getContext('2d') : null;
if (ctxHold) ctxHold.scale(20, 20);

const canvasNext = document.getElementById('canvas-next');
const ctxNext = canvasNext ? canvasNext.getContext('2d') : null;
if (ctxNext) ctxNext.scale(20, 20);

// --- MOBILE CANVAS SETUP ---
const canvasMobile = document.getElementById('canvas-board-mobile');
const ctxMobile = canvasMobile ? canvasMobile.getContext('2d') : null;
if (ctxMobile) ctxMobile.scale(24, 24); // 240px / 10 cols = 24

const canvasNextMobile = document.getElementById('canvas-next-mobile');
const ctxNextMobile = canvasNextMobile ? canvasNextMobile.getContext('2d') : null;
if (ctxNextMobile) ctxNextMobile.scale(10, 10);

const canvasHoldMobile = document.getElementById('canvas-hold-mobile');
const ctxHoldMobile = canvasHoldMobile ? canvasHoldMobile.getContext('2d') : null;
if (ctxHoldMobile) ctxHoldMobile.scale(15, 15);

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
            if (m[y][x] !== 0 && (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
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
            if (board[y][x] === 0) continue outer;
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
    
    let fillAmount = [0, 10, 20, 30, 50][lines];
    powerMeter += fillAmount;
    
    if (powerMeter >= 100) {
        powerMeter = 100;
        isPowerMode = true;
        level = 1;
    } else {
        level = Math.floor(linesCleared / 10) + 1;
    }
    dropInterval = Math.max(100, 1000 - (level - 1) * 100);

    animationState = { active: true, lines: clearedRows, points: points, timer: 0, intensity: lines };

    if (typeof window.updateScoreUI === 'function') {
        window.updateScoreUI(score, level, lines);
    }
}

// --- MOVEMENT & ACTIONS ---

function move(dir) {
    if (animationState.active || !isGameRunning) return;
    currentPiece.x += dir;
    if (collide(board, currentPiece)) currentPiece.x -= dir;
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
    while (!collide(board, currentPiece)) currentPiece.y++;
    currentPiece.y--;
    merge(board, currentPiece);
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
                context.strokeStyle = '#ffffff'; 
                context.lineWidth = 0.04; 
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
    context.globalAlpha = 1.0;
}

function drawGhost(context = ctx) {
    if (!currentPiece || animationState.active || !context) return;
    
    let ghostY = currentPiece.y;
    while (!collideAt(board, currentPiece.shape, currentPiece.x, ghostY + 1)) {
        ghostY++;
    }

    context.save();
    context.strokeStyle = '#ffffff';
    context.lineWidth = 0.06; 
    context.globalAlpha = 0.8;

    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.strokeRect(x + currentPiece.x, y + ghostY, 1, 1);
            }
        });
    });
    context.restore();
}

function collideAt(board, shape, x, y) {
    for (let r = 0; r < shape.length; ++r) {
        for (let c = 0; c < shape[r].length; ++c) {
            if (shape[r][c] !== 0 && (board[y + r] && board[y + r][x + c]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function drawSidePanels() {
    // Desktop
    if (ctxHold) {
        ctxHold.setTransform(1, 0, 0, 1, 0, 0);
        ctxHold.clearRect(0, 0, canvasHold.width, canvasHold.height);
        ctxHold.scale(20, 20);
        if (holdPiece) drawMatrix(holdPiece.shape, { x: 1, y: 1 }, ctxHold, holdPiece.color);
    }
    if (ctxNext) {
        ctxNext.setTransform(1, 0, 0, 1, 0, 0);
        ctxNext.clearRect(0, 0, canvasNext.width, canvasNext.height);
        ctxNext.scale(20, 20);
        nextQueue.forEach((id, index) => {
            drawMatrix(SHAPES[id], { x: 1, y: 1 + (index * 4) }, ctxNext, COLORS[id]);
        });
    }

    // Mobile
    if (ctxHoldMobile) {
        ctxHoldMobile.setTransform(1, 0, 0, 1, 0, 0);
        ctxHoldMobile.clearRect(0, 0, canvasHoldMobile.width, canvasHoldMobile.height);
        ctxHoldMobile.scale(15, 15);
        if (holdPiece) drawMatrix(holdPiece.shape, { x: 1, y: 1 }, ctxHoldMobile, holdPiece.color);
    }
    if (ctxNextMobile) {
        ctxNextMobile.setTransform(1, 0, 0, 1, 0, 0);
        ctxNextMobile.clearRect(0, 0, canvasNextMobile.width, canvasNextMobile.height);
        ctxNextMobile.scale(10, 10);
        nextQueue.forEach((id, index) => {
            drawMatrix(SHAPES[id], { x: 1 + (index * 4), y: 1 }, ctxNextMobile, COLORS[id]);
        });
    }
}

function draw() {
    const isMobile = window.innerWidth <= 650;
    
    // DEBUG LOG: This will tell us exactly what the code is doing
    if (isMobile) {
        console.log("MOBILE DETECTED. canvasMobile exists:", !!canvasMobile);
    }

    const activeCanvas = (isMobile && canvasMobile) ? canvasMobile : canvas;
    const activeCtx = (isMobile && ctxMobile) ? ctxMobile : ctx;

    if (!activeCtx || !activeCanvas) {
        console.error("CRITICAL: Failed to find active canvas!");
        return;
    }

    activeCtx.save();
    activeCtx.setTransform(1, 0, 0, 1, 0, 0);
    activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
    activeCtx.restore();

    drawMatrix(board, { x: 0, y: 0 }, activeCtx);
    drawGhost(activeCtx);
    
    if (currentPiece) {
        drawMatrix(currentPiece.shape, { x: currentPiece.x, y: currentPiece.y }, activeCtx, currentPiece.color);
    }

    if (animationState.active) {
        animationState.lines.forEach(y => {
            activeCtx.globalAlpha = 0.8;
            activeCtx.fillStyle = '#ffffff';
            activeCtx.fillRect(0, y, COLS, 1);
            activeCtx.globalAlpha = 1.0;
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
        if (isPowerMode) {
            powerMeter -= deltaTime / 1000;
            if (powerMeter <= 0) {
                powerMeter = 0;
                isPowerMode = false;
            }
            dropInterval = 1000;
        } else {
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }

        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerSoftDrop();
        }
    }

    if (typeof window.updatePowerMeterUI === 'function') {
        window.updatePowerMeterUI(powerMeter, isPowerMode);
    }

    draw();
    requestAnimationFrame(update);
}

function triggerGameOver() {
    isGameRunning = false;
    if (typeof window.showGameOverScreen === 'function') {
        window.showGameOverScreen(score);
    }
}

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

window.mobileMove = move;
window.mobileRotate = rotate;
window.mobileSoftDrop = playerSoftDrop;
window.mobileHardDrop = playerHardDrop;
window.mobileHold = hold;