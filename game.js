(function () {
  'use strict';

  const COLS = 7;
  const ROWS = 4;
  const FLOOR_ROW = ROWS - 1; // last row is the floor
  const STEPS_PER_CELL = 5;   // each cell split into 5 steps; 1 frame = 1 step, 5 frames = 1 cell

  const state = {
    turn: 1,
    p1: { row: FLOOR_ROW, col: 0, stepX: 0, stepY: 0, health: 100 },
    p2: { row: FLOOR_ROW, col: COLS - 1, stepX: 0, stepY: 0, health: 100 },
    gameOver: null
  };

  const damage = { light: 8, medium: 15, heavy: 25 };

  /** Frame data: startup, active, recovery per action. Directions: 1f each; jump = 5 active frames. */
  const FRAME_DATA = {
    light:   { startup: 6,  active: 2,  recovery: 8 },
    medium:  { startup: 10, active: 5,  recovery: 18 },
    heavy:   { startup: 15, active: 5,  recovery: 28 },
    move:    { startup: 0,  active: 0,  recovery: 8 },
    left:    { startup: 1,  active: 0,  recovery: 0 },
    right:   { startup: 1,  active: 0,  recovery: 0 },
    down:    { startup: 1,  active: 0,  recovery: 0 },
    jump:    { startup: 0,  active: 5,  recovery: 0 }
  };

  const PLAN_FRAMES = 30;
  const FRAME_MS = 50;
  const FRAME_BAR_SEGMENTS = 40;

  const elements = {
    grid: document.getElementById('grid'),
    avatarP1: document.getElementById('avatar-p1'),
    avatarP2: document.getElementById('avatar-p2'),
    p1Health: document.getElementById('p1-health'),
    p2Health: document.getElementById('p2-health'),
    p1HealthText: document.getElementById('p1-health-text'),
    p2HealthText: document.getElementById('p2-health-text'),
    turnIndicator: document.getElementById('turn-indicator'),
    optionsHint: document.getElementById('options-hint'),
    btnLight: document.getElementById('btn-light'),
    btnMedium: document.getElementById('btn-medium'),
    btnHeavy: document.getElementById('btn-heavy'),
    btnGo: document.getElementById('btn-go'),
    framePlanBar: document.getElementById('frame-plan-bar'),
    framePlanWrap: document.getElementById('frame-plan-wrap'),
    framePlanCursor: document.getElementById('frame-plan-cursor'),
    frameBarP1: document.getElementById('frame-bar-p1'),
    frameBarP2: document.getElementById('frame-bar-p2'),
    frameCursorP1: document.getElementById('frame-cursor-p1'),
    frameCursorP2: document.getElementById('frame-cursor-p2'),
    frameLabelP1: document.getElementById('frame-label-p1'),
    frameLabelP2: document.getElementById('frame-label-p2')
  };

  /** Plan: array of { type, startFrame }. Each action occupies startFrame..startFrame+totalFrames-1. */
  let plan = [];
  /** During execution: current global frame 0..PLAN_FRAMES-1 */
  let planCurrentFrame = 0;
  let planTimerId = null;
  /** Current frame action per player (for execution display) */
  let frameActionP1 = null;
  let frameActionP2 = null;
  let frameTimerId = null;

  function buildGrid() {
    elements.grid.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell' + (r === FLOOR_ROW ? ' floor' : '');
        cell.dataset.row = r;
        cell.dataset.col = c;
        elements.grid.appendChild(cell);
      }
    }
  }

  function getTotalFrames(actionType) {
    const fd = FRAME_DATA[actionType];
    return fd ? fd.startup + fd.active + fd.recovery : 0;
  }

  /** Build the 30-frame plan bar (slots) and render current plan. */
  function buildPlanBar() {
    elements.framePlanBar.innerHTML = '';
    const slotCount = PLAN_FRAMES;
    const filled = getPlanFilledSlots();
    for (let i = 0; i < slotCount; i++) {
      const slot = document.createElement('div');
      slot.className = 'frame-slot';
      slot.dataset.frameIndex = i;
      const info = filled[i];
      if (info) {
        slot.classList.add('filled', info.type);
        if (info.phase) slot.classList.add(info.phase);
      }
      elements.framePlanBar.appendChild(slot);
    }
  }

  /** Returns array of length PLAN_FRAMES: each entry is null or { type, phase: 'startup'|'active'|'recovery' }. */
  function getPlanFilledSlots() {
    const result = Array(PLAN_FRAMES).fill(null);
    const fd = FRAME_DATA;
    plan.forEach(function (entry) {
      const total = getTotalFrames(entry.type);
      const start = entry.startFrame;
      const s = (fd[entry.type] && fd[entry.type].startup) || 0;
      const a = (fd[entry.type] && fd[entry.type].active) || 0;
      const r = (fd[entry.type] && fd[entry.type].recovery) || 0;
      for (let i = 0; i < total && start + i < PLAN_FRAMES; i++) {
        let phase = 'startup';
        if (i >= s + a) phase = 'recovery';
        else if (i >= s) phase = 'active';
        result[start + i] = { type: entry.type, phase: phase };
      }
    });
    return result;
  }

  /** Find first contiguous block of `length` empty frames starting at or before startIndex (prefer at startIndex). */
  function findEmptyBlock(length, startIndex) {
    const filled = getPlanFilledSlots();
    for (let start = Math.max(0, startIndex - length + 1); start <= Math.min(PLAN_FRAMES - length, startIndex); start++) {
      let ok = true;
      for (let i = 0; i < length; i++) {
        if (filled[start + i]) { ok = false; break; }
      }
      if (ok) return start;
    }
    return -1;
  }

  function addToPlan(actionType, atFrameIndex) {
    const total = getTotalFrames(actionType);
    if (total <= 0) return false;
    const start = findEmptyBlock(total, atFrameIndex);
    if (start < 0) return false;
    plan.push({ type: actionType, startFrame: start });
    buildPlanBar();
    return true;
  }

  function clearPlan() {
    plan = [];
    buildPlanBar();
  }

  /** Get current action and phase for P1 at global plan frame (during execution). */
  function getActionAtPlanFrame(frameIndex) {
    const filled = getPlanFilledSlots();
    return filled[frameIndex] || null;
  }

  function getCellEl(row, col) {
    return elements.grid.querySelector('.cell[data-row="' + row + '"][data-col="' + col + '"]');
  }

  function getAllCells() {
    return Array.from(elements.grid.querySelectorAll('.cell'));
  }

  function startFrameAction(playerNum, actionType) {
    const fd = FRAME_DATA[actionType] || FRAME_DATA.move;
    const total = fd.startup + fd.active + fd.recovery;
    const action = {
      type: actionType,
      startup: fd.startup,
      active: fd.active,
      recovery: fd.recovery,
      totalFrames: total,
      currentFrame: 0
    };
    if (playerNum === 1) frameActionP1 = action;
    else frameActionP2 = action;
    updateFrameDataDisplay();
    if (!frameTimerId) {
      frameTimerId = setInterval(frameTick, FRAME_MS);
    }
  }

  function frameTick() {
    let busy = false;
    if (frameActionP1) {
      frameActionP1.currentFrame++;
      if (frameActionP1.currentFrame >= frameActionP1.totalFrames) frameActionP1 = null;
      else busy = true;
    }
    if (frameActionP2) {
      frameActionP2.currentFrame++;
      if (frameActionP2.currentFrame >= frameActionP2.totalFrames) frameActionP2 = null;
      else busy = true;
    }
    updateFrameDataDisplay();
    if (!busy && frameTimerId) {
      clearInterval(frameTimerId);
      frameTimerId = null;
    }
  }

  function updateFrameDataDisplay() {
    renderFrameRow(1, frameActionP1, elements.frameBarP1, elements.frameCursorP1, elements.frameLabelP1);
    renderFrameRow(2, frameActionP2, elements.frameBarP2, elements.frameCursorP2, elements.frameLabelP2);
  }

  function isExecuting() {
    return planTimerId != null;
  }

  /** Run one tick of plan execution (one frame). */
  function planExecutionTick() {
    if (planCurrentFrame >= PLAN_FRAMES) {
      clearInterval(planTimerId);
      planTimerId = null;
      frameActionP1 = null;
      clearPlan();
      elements.framePlanCursor.classList.remove('visible');
      elements.btnGo.disabled = false;
      elements.optionsHint.textContent = 'Plan finished. Drag actions to the bar again and press Go.';
      updateFrameDataDisplay();
      updateUI();
      return;
    }
    const info = getActionAtPlanFrame(planCurrentFrame);
    if (info) {
      const fd = FRAME_DATA[info.type];
      const total = getTotalFrames(info.type);
      const actionStart = (function () {
        for (let i = 0; i < plan.length; i++) {
          const e = plan[i];
          const t = getTotalFrames(e.type);
          if (planCurrentFrame >= e.startFrame && planCurrentFrame < e.startFrame + t)
            return { start: e.startFrame, total: t, type: e.type };
        }
        return null;
      })();
      if (actionStart) {
        const localFrame = planCurrentFrame - actionStart.start;
        if (!frameActionP1 || frameActionP1.type !== actionStart.type) {
          frameActionP1 = {
            type: actionStart.type,
            startup: fd.startup,
            active: fd.active,
            recovery: fd.recovery,
            totalFrames: actionStart.total,
            currentFrame: localFrame
          };
        } else {
          frameActionP1.currentFrame = localFrame;
        }
        if (['light', 'medium', 'heavy'].includes(info.type) && info.phase === 'active' && localFrame === fd.startup) {
          doAttack(info.type);
        }
        if (['left', 'right', 'down', 'jump'].includes(info.type)) {
          applyMovement(info.type, localFrame);
        }
      }
    } else {
      frameActionP1 = null;
    }
    updateUI();
    const pct = (planCurrentFrame / PLAN_FRAMES) * 100;
    elements.framePlanCursor.style.left = pct + '%';
    elements.framePlanCursor.classList.add('visible');
    updateFrameDataDisplay();
    planCurrentFrame++;
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

  /** Apply one frame of movement for P1 during plan execution. 1 frame = 1/5 cell; 5 frames = 1 cell. */
  function applyMovement(type, localFrame) {
    const p1 = state.p1;
    if (type === 'left') {
      if (isOnFloor(p1)) moveStep(p1, -1, 0);
    } else if (type === 'right') {
      if (isOnFloor(p1)) moveStep(p1, 1, 0);
    } else if (type === 'down') {
      if (p1.row < FLOOR_ROW) {
        p1.row = FLOOR_ROW;
        p1.stepY = 0;
      }
    } else if (type === 'jump') {
      if (localFrame === 0 && isOnFloor(p1) && p1.row > 0) moveStep(p1, 0, -1);
      else if (localFrame >= 1 && localFrame <= 4) moveStep(p1, 0, -1);
      if (localFrame === 4) { p1.row = FLOOR_ROW; p1.stepY = 0; }
    }
  }

  function startPlanExecution() {
    if (plan.length === 0) {
      elements.optionsHint.textContent = 'Drag at least one action (e.g. Light) to the bar, then press Go.';
      return;
    }
    if (planTimerId) return;
    planCurrentFrame = 0;
    elements.btnGo.disabled = true;
    elements.optionsHint.textContent = 'Executing plan…';
    planTimerId = setInterval(planExecutionTick, FRAME_MS);
  }

  function renderFrameRow(playerNum, action, barEl, cursorEl, labelEl) {
    if (!action) {
      labelEl.textContent = '—';
      barEl.innerHTML = '';
      barEl.style.background = '';
      cursorEl.classList.remove('visible');
      cursorEl.style.left = '0%';
      return;
    }
    const total = action.totalFrames;
    const s = action.startup;
    const a = action.active;
    const r = action.recovery;
    labelEl.textContent = action.type.toUpperCase();
    barEl.innerHTML = '';
    barEl.style.background = '';

    const segCount = Math.min(FRAME_BAR_SEGMENTS, total);
    const segStartup = Math.max(0, Math.round((s / total) * segCount));
    const segActive = Math.max(0, Math.round((a / total) * segCount));
    const segRecovery = segCount - segStartup - segActive;

    function addSegments(n, phase) {
      for (let i = 0; i < n; i++) {
        const seg = document.createElement('div');
        seg.className = 'frame-segment ' + phase;
        barEl.appendChild(seg);
      }
    }
    addSegments(segStartup, 'startup');
    addSegments(segActive, 'active');
    addSegments(segRecovery, 'recovery');

    const pct = total > 0 ? (action.currentFrame / total) * 100 : 0;
    cursorEl.style.left = pct + '%';
    cursorEl.classList.add('visible');
  }

  /** Distance in sub-steps (1 step = 1/5 of a cell). */
  function manhattanDist(p1, p2) {
    const x1 = (p1.col || 0) * STEPS_PER_CELL + (p1.stepX || 0);
    const y1 = (p1.row || 0) * STEPS_PER_CELL + (p1.stepY || 0);
    const x2 = (p2.col || 0) * STEPS_PER_CELL + (p2.stepX || 0);
    const y2 = (p2.row || 0) * STEPS_PER_CELL + (p2.stepY || 0);
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  function updateUI() {
    const p1 = state.p1;
    const p2 = state.p2;

    elements.p1Health.style.width = Math.max(0, p1.health) + '%';
    elements.p2Health.style.width = Math.max(0, p2.health) + '%';
    elements.p1HealthText.textContent = Math.max(0, p1.health);
    elements.p2HealthText.textContent = Math.max(0, p2.health);

    positionAvatar(elements.avatarP1, p1.row, p1.col, p1.stepX || 0, p1.stepY || 0);
    positionAvatar(elements.avatarP2, p2.row, p2.col, p2.stepX || 0, p2.stepY || 0);

    getAllCells().forEach(function (el) {
      el.classList.remove('highlight-p1', 'highlight-p2');
      var r = parseInt(el.dataset.row, 10);
      var c = parseInt(el.dataset.col, 10);
      if (r === p1.row && c === p1.col) el.classList.add('highlight-p1');
      if (r === p2.row && c === p2.col) el.classList.add('highlight-p2');
    });

    if (state.gameOver) {
      elements.turnIndicator.textContent = state.gameOver === 1 ? 'P1 Wins!' : 'P2 Wins!';
      setControllerEnabled(false);
      elements.optionsHint.textContent = 'Game over. Refresh to play again.';
      return;
    }

    elements.turnIndicator.textContent = "P" + state.turn + "'s Turn";
    landIfInAir();
    setControllerEnabled(true);
    updateOptionsHint();
  }

  function positionAvatar(el, row, col, stepX, stepY) {
    const cell = getCellEl(row, col);
    if (!cell) return;
    const arena = elements.grid.parentElement;
    const arenaRect = arena.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    const stepXNorm = (stepX || 0) / STEPS_PER_CELL;
    const stepYNorm = (stepY || 0) / STEPS_PER_CELL;
    const centerX = cellRect.left - arenaRect.left + (stepXNorm + 0.5 / STEPS_PER_CELL) * cellRect.width;
    const centerY = cellRect.top - arenaRect.top + (stepYNorm + 0.5 / STEPS_PER_CELL) * cellRect.height;
    el.style.left = centerX + 'px';
    el.style.top = centerY + 'px';
    el.style.right = 'auto';
  }

  function updateOptionsHint() {
    if (state.gameOver) return;
    if (planTimerId) return;
    const p1 = state.p1;
    const p2 = state.p2;
    const dist = manhattanDist(p1, p2);
    const filled = plan.length ? plan.length + ' action(s) in plan.' : 'No actions in plan.';
    elements.optionsHint.textContent = 'Distance: ' + dist + ' steps (1 frame = 1/5 cell). ' + filled + ' Drag to bar, then Go.';
  }

  function setControllerEnabled(enabled) {
    if (elements.btnLight) elements.btnLight.disabled = !enabled;
    if (elements.btnMedium) elements.btnMedium.disabled = !enabled;
    if (elements.btnHeavy) elements.btnHeavy.disabled = !enabled;
    if (elements.btnGo && !planTimerId) elements.btnGo.disabled = !enabled;
  }

  function endTurn() {
    if (state.gameOver) return;
    state.turn = state.turn === 1 ? 2 : 1;
    landIfInAir();
    updateUI();
  }

  function isOnFloor(p) {
    return p.row === FLOOR_ROW;
  }

  function landIfInAir() {
    const current = state.turn === 1 ? state.p1 : state.p2;
    if (current.row < FLOOR_ROW) {
      current.row = FLOOR_ROW;
      current.stepY = 0;
    }
  }

  function move(current, dRow, dCol) {
    const nr = current.row + dRow;
    const nc = current.col + dCol;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false;
    current.row = nr;
    current.col = nc;
    return true;
  }

  function doAttack(type) {
    const attacker = state.turn === 1 ? state.p1 : state.p2;
    const defender = state.turn === 1 ? state.p2 : state.p1;
    const dist = manhattanDist(attacker, defender); // distance in sub-steps

    let mult = 1;
    if (dist === 0) mult = 1;
    else if (dist <= STEPS_PER_CELL) mult = 0.6;  // same cell or 1 step away
    else mult = 0.3;

    const amount = Math.max(1, Math.floor(damage[type] * mult));
    defender.health = Math.max(0, defender.health - amount);

    const avatar = state.turn === 1 ? elements.avatarP1 : elements.avatarP2;
    avatar.classList.add('attacking');
    setTimeout(function () { avatar.classList.remove('attacking'); }, 300);

    elements.optionsHint.textContent = (dist === 0 ? 'Direct hit! ' : 'Distance hit. ') + amount + ' damage.';

    if (defender.health <= 0) state.gameOver = state.turn;
    else if (!isExecuting()) endTurn();
    updateUI();
  }

  function handleInput(directionOrAttack) {
    if (state.gameOver) return;

    const current = state.turn === 1 ? state.p1 : state.p2;
    const onFloor = isOnFloor(current);

    if (directionOrAttack === 'up') {
      if (onFloor && current.row > 0) {
        move(current, -1, 0);
        startFrameAction(state.turn, 'move');
        elements.optionsHint.textContent = 'Jumped!';
        endTurn();
      } else if (!onFloor) {
        elements.optionsHint.textContent = "Already in the air.";
      } else {
        elements.optionsHint.textContent = "Can't jump higher.";
      }
    } else if (directionOrAttack === 'down') {
      if (!onFloor) {
        current.row = FLOOR_ROW;
        startFrameAction(state.turn, 'move');
        elements.optionsHint.textContent = 'Landed.';
        endTurn();
      } else {
        elements.optionsHint.textContent = "Already on the floor.";
      }
    } else if (directionOrAttack === 'left') {
      if (!onFloor) {
        elements.optionsHint.textContent = "Move left/right only on the floor.";
        return;
      }
      if (move(current, 0, -1)) {
        startFrameAction(state.turn, 'move');
        elements.optionsHint.textContent = 'Moved left.';
        endTurn();
      } else {
        elements.optionsHint.textContent = "Can't move further left.";
      }
    } else if (directionOrAttack === 'right') {
      if (!onFloor) {
        elements.optionsHint.textContent = "Move left/right only on the floor.";
        return;
      }
      if (move(current, 0, 1)) {
        startFrameAction(state.turn, 'move');
        elements.optionsHint.textContent = 'Moved right.';
        endTurn();
      } else {
        elements.optionsHint.textContent = "Can't move further right.";
      }
    } else if (['light', 'medium', 'heavy'].includes(directionOrAttack)) {
      startFrameAction(state.turn, directionOrAttack);
      doAttack(directionOrAttack);
    }

    updateUI();
  }

  function getPlanBarDropIndex(e) {
    const wrap = elements.framePlanWrap;
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    return Math.min(PLAN_FRAMES - 1, Math.floor(pct * PLAN_FRAMES));
  }

  function bindPlanBar() {
    buildPlanBar();
    elements.btnGo.addEventListener('click', function () {
      if (state.gameOver) return;
      state.turn = 1;
      startPlanExecution();
    });

    document.querySelectorAll('.draggable').forEach(function (btn) {
      btn.addEventListener('dragstart', function (e) {
        const action = e.target.dataset.action;
        if (action) {
          e.dataTransfer.setData('text/plain', action);
          e.dataTransfer.effectAllowed = 'copy';
          e.target.classList.add('dragging');
        }
      });
      btn.addEventListener('dragend', function (e) {
        e.target.classList.remove('dragging');
      });
    });

    elements.framePlanWrap.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      elements.framePlanWrap.classList.add('drag-over');
    });
    elements.framePlanWrap.addEventListener('dragleave', function () {
      elements.framePlanWrap.classList.remove('drag-over');
    });
    elements.framePlanWrap.addEventListener('drop', function (e) {
      e.preventDefault();
      elements.framePlanWrap.classList.remove('drag-over');
      const actionType = e.dataTransfer.getData('text/plain');
      if (!actionType || !FRAME_DATA[actionType]) return;
      const index = getPlanBarDropIndex(e);
      if (addToPlan(actionType, index)) {
        elements.optionsHint.textContent = 'Added ' + actionType + ' to plan. Add more or press Go.';
      } else {
        elements.optionsHint.textContent = 'Not enough empty frames for ' + actionType + ' (needs ' + getTotalFrames(actionType) + ' frames).';
      }
    });
  }

  function init() {
    buildGrid();
    bindPlanBar();
    elements.optionsHint.textContent = 'Drag Light (16 frames) to the bar above. Fill up to 30 frames, then press Go.';
    updateUI();
  }

  init();
})();
