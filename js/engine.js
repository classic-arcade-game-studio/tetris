// --- CONSTANTS ---
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // Size of each block in pixels

// --- TETROMINO SHAPES & COLORS ---
const SHAPES = [
    [], // Empty
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
    [[2,0,0], [2,2,2], [0,0,0]],                 // J
    [[0,0,3], [3,3,3], [0,0,0]],                 // L
    [[4,4], [4,4]],                              // O
    [[0,5,5], [5,5,0], [0,0,0]],                 // S
    [[0,6,0], [6,6,6], [0,0,0]],                 // T
    [[7,7,0], [0,7,7], [0,0,0]]                  // Z
];

const COLORS = [
    null,
    '#00f0f0', // I - Cyan
    '#0000f0', // J - Blue
    '#f0a000', // L - Orange
    '#f0f000', // O - Yellow
    '#00f000', // S - Green
    '#a000f0', // T - Purple
    '#f00000'  // Z - Red
];

// --- GAME STATE ---
let board = [];
let currentPiece = null;
let dropCounter = 0;
let dropInterval = 1000; // Drops every 1 second
let lastTime = 0;
let isGameRunning = false;

// --- CANVAS SETUP ---
const canvas = document.getElementById('canvas-board');
const ctx = canvas.getContext('2d');
// Scale the canvas context so we can draw using grid coordinates (0-9, 0-19)
ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

// --- FUNCTIONS ---

function createBoard() {
    // Creates a 20x10 grid filled with 0s
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function spawnPiece() {
    const typeId = Math.floor(Math.random() * 7) + 1;
    const shape = SHAPES[typeId];
    const color = COLORS[typeId];
    
    currentPiece = {
        shape: shape,
        color: color,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };

    // If it spawns and immediately collides, game over (reset for now)
    if (collide(board, currentPiece)) {
        createBoard();
    }
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

function pieceDrop() {
    currentPiece.y++;
    if (collide(board, currentPiece)) {
        currentPiece.y--; // Move back up
        merge(board, currentPiece); // Lock it into the board
        spawnPiece(); // Get a new piece
    }
    dropCounter = 0; // Reset timer
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // This line fixes the invisible block bug!
                // It checks if the value is a color string, otherwise it looks up the color by number.
                ctx.fillStyle = typeof value === 'string' ? value : COLORS[value];
                
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                
                // Draw a slight border to make blocks look distinct
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = 0.05;
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    // 1. Clear the screen
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 2. SANITY CHECK: Draw a giant red square
    console.log("Drawing frame! If you see this, the game loop is running.");
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 5, 5); // This should draw a 150x150 pixel red block in the top-left

    // 3. Draw the game
    drawMatrix(board, { x: 0, y: 0 });
    if (currentPiece) {
        drawMatrix(currentPiece.shape, { x: currentPiece.x, y: currentPiece.y });
    }
}

function update(time = 0) {
    if (!isGameRunning) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        pieceDrop();
    }

    draw();
    requestAnimationFrame(update);
}

// --- PUBLIC START FUNCTION ---
// This allows main.js to start the game when the user clicks "Start Game"
window.startGameEngine = function() {
    createBoard();
    spawnPiece();
    isGameRunning = true;
    lastTime = 0;
    update();
};