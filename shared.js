const COLS = 7;
const ROWS = 4;
const FLOOR_ROW = ROWS - 1; // last row is the floor
const STEPS_PER_CELL = 5;   // each cell split into 5 steps; 1 frame = 1 step, 5 frames = 1 cell

const state = {
    turn: 1,
    p1: { row: FLOOR_ROW, col: 0, stepX: 0, stepY: 0, health: 100 },
    p2: { row: FLOOR_ROW, col: COLS - 1, stepX: 0, stepY: 0, health: 100 },
    gameOver: null,
    gameMode: 'practice' // 'practice' or 'campaign'
};

const damage = { light: 8, medium: 15, heavy: 25 };

/** Frame data: startup, active, recovery per action. Directions: 1f each; jump = 5 active frames. */
const FRAME_DATA = {
    light: { startup: 6, active: 2, recovery: 8 },
    medium: { startup: 10, active: 5, recovery: 18 },
    heavy: { startup: 15, active: 5, recovery: 28 },
    move: { startup: 0, active: 0, recovery: 8 },
    left: { startup: 1, active: 0, recovery: 0 },
    right: { startup: 1, active: 0, recovery: 0 },
    down: { startup: 1, active: 0, recovery: 0 },
    jump: { startup: 0, active: 5, recovery: 0 },
    block: { startup: 1, active: 0, recovery: 0 }
};

const PLAN_FRAMES = 30;
const FRAME_MS = 50;
const FRAME_BAR_SEGMENTS = 40;

const elements = {};

/** Plan: array of { type, startFrame }. Each action occupies startFrame..startFrame+totalFrames-1. */
let planP1 = [];
let planP2 = [];
/** During execution: current global frame 0..PLAN_FRAMES-1 */
let planCurrentFrame = 0;
let planTimerId = null;
/** Current frame action per player (for execution display) */
let frameActionP1 = null;
let frameActionP2 = null;
let frameTimerId = null;

let baseState = null;
function saveBaseState() {
    baseState = JSON.parse(JSON.stringify(state));
}
function restoreBaseState() {
    if (baseState) {
        Object.assign(state, JSON.parse(JSON.stringify(baseState)));
    }
}
