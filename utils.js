function getTotalFrames(actionType) {
    const fd = FRAME_DATA[actionType];
    return fd ? fd.startup + fd.active + fd.recovery : 0;
}

/** Returns array of length PLAN_FRAMES: each entry is null or { type, phase: 'startup'|'active'|'recovery' }. */
function getPlanFilledSlots(planArray) {
    const result = Array(PLAN_FRAMES).fill(null);
    const fd = FRAME_DATA;
    planArray.forEach(function (entry) {
        const total = getTotalFrames(entry.type);
        const start = entry.startFrame;
        const s = (fd[entry.type] && fd[entry.type].startup) || 0;
        const a = (fd[entry.type] && fd[entry.type].active) || 0;
        const r = (fd[entry.type] && fd[entry.type].recovery) || 0;
        for (let i = 0; i < total && start + i < PLAN_FRAMES; i++) {
            let phase = 'startup';
            if (i >= s + a) phase = 'recovery';
            else if (i >= s) phase = 'active';
            result[start + i] = { type: entry.type, phase: phase, startFrame: start };
        }
    });
    return result;
}

/** Find first contiguous block of `length` empty frames starting at or before startIndex (prefer at startIndex). */
function findEmptyBlock(planArray, length, startIndex) {
    const filled = getPlanFilledSlots(planArray);
    for (let start = Math.max(0, startIndex - length + 1); start <= Math.min(PLAN_FRAMES - length, startIndex); start++) {
        let ok = true;
        for (let i = 0; i < length; i++) {
            if (filled[start + i]) { ok = false; break; }
        }
        if (ok) return start;
    }
    return -1;
}

function addToPlan(playerNum, actionType, atFrameIndex) {
    const planArray = playerNum === 1 ? planP1 : planP2;
    const total = getTotalFrames(actionType);
    if (total <= 0) return false;
    const start = findEmptyBlock(planArray, total, atFrameIndex);
    if (start < 0) return false;
    planArray.push({ type: actionType, startFrame: start });
    buildPlanBar(playerNum);
    onPlanChanged();
    return true;
}

function clearPlan() {
    planP1 = [];
    planP2 = [];
    buildPlanBar(1);
    buildPlanBar(2);
    onPlanChanged();
}

/** Get current action and phase for a plan array at global plan frame (during execution). */
function getActionAtPlanFrame(planArray, frameIndex) {
    const filled = getPlanFilledSlots(planArray);
    return filled[frameIndex] || null;
}

/** Distance in sub-steps (1 step = 1/5 of a cell). */
function manhattanDist(p1, p2) {
    const x1 = (p1.col || 0) * STEPS_PER_CELL + (p1.stepX || 0);
    const y1 = (p1.row || 0) * STEPS_PER_CELL + (p1.stepY || 0);
    const x2 = (p2.col || 0) * STEPS_PER_CELL + (p2.stepX || 0);
    const y2 = (p2.row || 0) * STEPS_PER_CELL + (p2.stepY || 0);
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function isOnFloor(p) {
    return p.row === FLOOR_ROW;
}

function move(current, dRow, dCol) {
    const nr = current.row + dRow;
    const nc = current.col + dCol;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false;
    current.row = nr;
    current.col = nc;
    return true;
}

/** Move by one sub-step (1/5 of a cell). Used for left/right 1 frame and jump (1 step up per frame). */
function moveStep(p, dStepX, dStepY) {
    if (dStepX !== 0) {
        let sx = (p.stepX || 0) + dStepX;
        if (sx >= STEPS_PER_CELL && p.col < COLS - 1) {
            p.col++;
            p.stepX = 0;
        } else if (sx < 0 && p.col > 0) {
            p.col--;
            p.stepX = STEPS_PER_CELL - 1;
        } else {
            p.stepX = Math.max(0, Math.min(STEPS_PER_CELL - 1, sx));
        }
    }
    if (dStepY !== 0) {
        let sy = (p.stepY || 0) + dStepY;
        if (sy >= STEPS_PER_CELL && p.row < ROWS - 1) {
            p.row++;
            p.stepY = 0;
        } else if (sy < 0 && p.row > 0) {
            p.row--;
            p.stepY = STEPS_PER_CELL - 1;
        } else {
            p.stepY = Math.max(0, Math.min(STEPS_PER_CELL - 1, sy));
        }
    }
}
