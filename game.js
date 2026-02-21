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
    light: { startup: 6, active: 2, recovery: 8 },
    medium: { startup: 10, active: 5, recovery: 18 },
    heavy: { startup: 15, active: 5, recovery: 28 },
    move: { startup: 0, active: 0, recovery: 8 },
    left: { startup: 1, active: 0, recovery: 0 },
    right: { startup: 1, active: 0, recovery: 0 },
    down: { startup: 1, active: 0, recovery: 0 },
    jump: { startup: 0, active: 5, recovery: 0 }
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
    framePlanBarP1: document.getElementById('frame-plan-bar-p1'),
    framePlanWrapP1: document.getElementById('frame-plan-wrap-p1'),
    framePlanCursorP1: document.getElementById('frame-plan-cursor-p1'),
    framePlanBarP2: document.getElementById('frame-plan-bar-p2'),
    framePlanWrapP2: document.getElementById('frame-plan-wrap-p2'),
    framePlanCursorP2: document.getElementById('frame-plan-cursor-p2'),
    frameBarP1: document.getElementById('frame-bar-p1'),
    frameBarP2: document.getElementById('frame-bar-p2'),
    frameCursorP1: document.getElementById('frame-cursor-p1'),
    frameCursorP2: document.getElementById('frame-cursor-p2'),
    frameLabelP1: document.getElementById('frame-label-p1'),
    frameLabelP2: document.getElementById('frame-label-p2')
  };

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
  function buildPlanBar(playerNum) {
    const barEl = playerNum === 1 ? elements.framePlanBarP1 : elements.framePlanBarP2;
    const planArray = playerNum === 1 ? planP1 : planP2;
    barEl.innerHTML = '';
    const slotCount = PLAN_FRAMES;
    const filled = getPlanFilledSlots(planArray);
    for (let i = 0; i < slotCount; i++) {
      const slot = document.createElement('div');
      slot.className = 'frame-slot';
      slot.dataset.frameIndex = i;
      const info = filled[i];
      if (info) {
        slot.classList.add('filled', info.type);
        if (info.phase) slot.classList.add(info.phase);
      }
      barEl.appendChild(slot);
    }
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
        result[start + i] = { type: entry.type, phase: phase };
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
    return true;
  }

  function clearPlan() {
    planP1 = [];
    planP2 = [];
    buildPlanBar(1);
    buildPlanBar(2);
  }

  /** Get current action and phase for a plan array at global plan frame (during execution). */
  function getActionAtPlanFrame(planArray, frameIndex) {
    const filled = getPlanFilledSlots(planArray);
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

  function updateHitboxDisplay() {
    if (frameActionP1 && frameActionP1.type === 'light' && frameActionP1.currentFrame >= frameActionP1.startup && frameActionP1.currentFrame < frameActionP1.startup + frameActionP1.active) {
      elements.avatarP1.classList.add('attacking-light-active');
    } else {
      elements.avatarP1.classList.remove('attacking-light-active');
    }
    if (frameActionP2 && frameActionP2.type === 'light' && frameActionP2.currentFrame >= frameActionP2.startup && frameActionP2.currentFrame < frameActionP2.startup + frameActionP2.active) {
      elements.avatarP2.classList.add('attacking-light-active');
    } else {
      elements.avatarP2.classList.remove('attacking-light-active');
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
    updateHitboxDisplay();
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
      frameActionP2 = null;
      clearPlan();
      elements.framePlanCursorP1.classList.remove('visible');
      elements.framePlanCursorP2.classList.remove('visible');
      elements.btnGo.disabled = false;
      elements.optionsHint.textContent = 'Plan finished. Drag actions to the bar again and press Go.';
      updateFrameDataDisplay();
      updateUI();
      return;
    }

    function processPlayerAction(playerNum, planArray) {
      const info = getActionAtPlanFrame(planArray, planCurrentFrame);
      let frameAction = playerNum === 1 ? frameActionP1 : frameActionP2;

      if (info) {
        const fd = FRAME_DATA[info.type];
        const total = getTotalFrames(info.type);
        const actionStart = (function () {
          for (let i = 0; i < planArray.length; i++) {
            const e = planArray[i];
            const t = getTotalFrames(e.type);
            if (planCurrentFrame >= e.startFrame && planCurrentFrame < e.startFrame + t)
              return { start: e.startFrame, total: t, type: e.type };
          }
          return null;
        })();
        if (actionStart) {
          const localFrame = planCurrentFrame - actionStart.start;
          if (!frameAction || frameAction.type !== actionStart.type) {
            frameAction = {
              type: actionStart.type,
              startup: fd.startup,
              active: fd.active,
              recovery: fd.recovery,
              totalFrames: actionStart.total,
              currentFrame: localFrame
            };
          } else {
            frameAction.currentFrame = localFrame;
          }
          if (['light', 'medium', 'heavy'].includes(info.type) && info.phase === 'active' && localFrame === fd.startup) {
            doAttack(info.type, playerNum);
          }
          if (['left', 'right', 'down', 'jump'].includes(info.type)) {
            applyMovement(info.type, localFrame, playerNum);
          }
        }
      } else {
        frameAction = null;
      }

      if (playerNum === 1) frameActionP1 = frameAction;
      else frameActionP2 = frameAction;
    }

    processPlayerAction(1, planP1);
    processPlayerAction(2, planP2);

    updateHitboxDisplay();
    updateUI();
    const pct = (planCurrentFrame / PLAN_FRAMES) * 100;
    elements.framePlanCursorP1.style.left = pct + '%';
    elements.framePlanCursorP1.classList.add('visible');
    elements.framePlanCursorP2.style.left = pct + '%';
    elements.framePlanCursorP2.classList.add('visible');
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

  /** Apply one frame of movement during plan execution. 1 frame = 1/5 cell; 5 frames = 1 cell. */
  function applyMovement(type, localFrame, playerNum) {
    const p = playerNum === 1 ? state.p1 : state.p2;
    if (type === 'left') {
      if (isOnFloor(p)) moveStep(p, -1, 0);
    } else if (type === 'right') {
      if (isOnFloor(p)) moveStep(p, 1, 0);
    } else if (type === 'down') {
      if (p.row < FLOOR_ROW) {
        p.row = FLOOR_ROW;
        p.stepY = 0;
      }
    } else if (type === 'jump') {
      if (localFrame === 0 && isOnFloor(p) && p.row > 0) moveStep(p, 0, -1);
      else if (localFrame >= 1 && localFrame <= 4) moveStep(p, 0, -1);
      if (localFrame === 4) { p.row = FLOOR_ROW; p.stepY = 0; }
    }
  }

  function startPlanExecution() {
    if (planP1.length === 0 && planP2.length === 0) {
      elements.optionsHint.textContent = 'Drag at least one action to a bar, then press Go.';
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
    const filled = 'P1: ' + planP1.length + ' / P2: ' + planP2.length + ' action(s).';
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

  function doAttack(type, playerNum) {
    const attacker = playerNum === 1 ? state.p1 : state.p2;
    const defender = playerNum === 1 ? state.p2 : state.p1;
    const dist = manhattanDist(attacker, defender); // distance in sub-steps

    let mult = 1;
    if (dist === 0) mult = 1;
    else if (dist <= STEPS_PER_CELL) mult = 0.6;  // same cell or 1 step away
    else mult = 0.3;

    const amount = Math.max(1, Math.floor(damage[type] * mult));
    defender.health = Math.max(0, defender.health - amount);

    const avatar = playerNum === 1 ? elements.avatarP1 : elements.avatarP2;
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

  function getPlanBarDropIndex(e, wrap) {
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    return Math.min(PLAN_FRAMES - 1, Math.floor(pct * PLAN_FRAMES));
  }

  function bindPlanBar() {
    buildPlanBar(1);
    buildPlanBar(2);
    elements.btnGo.addEventListener('click', function () {
      if (state.gameOver) return;
      startPlanExecution();
    });

    document.querySelectorAll('.draggable').forEach(function (btn) {
      btn.addEventListener('dragstart', function (e) {
        const action = e.target.dataset.action;
        if (action) {
          e.dataTransfer.setData('text/plain', action);
          // Also set it globally so dragover can access it easily (e.dataTransfer is sometimes restricted in dragover)
          window.__draggedAction = action;
          e.dataTransfer.effectAllowed = 'copy';
          e.target.classList.add('dragging');
        }
      });
      btn.addEventListener('dragend', function (e) {
        e.target.classList.remove('dragging');
        window.__draggedAction = null;
        clearHoverSlots();
      });
    });

    function clearHoverSlots() {
      document.querySelectorAll('.frame-slot').forEach(function (slot) {
        slot.classList.remove('hover-startup', 'hover-active', 'hover-recovery', 'hover-invalid');
      });
    }

    function setupDragDrop(wrap, playerNum) {
      wrap.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        wrap.classList.add('drag-over');

        const actionType = window.__draggedAction;
        if (!actionType || !FRAME_DATA[actionType]) return;

        const index = getPlanBarDropIndex(e, wrap);
        const planArray = playerNum === 1 ? planP1 : planP2;
        const total = getTotalFrames(actionType);

        // Find if it fits
        const start = findEmptyBlock(planArray, total, index);

        clearHoverSlots();

        const slotEls = wrap.querySelectorAll('.frame-slot');
        if (start >= 0) {
          // Fits
          const fd = FRAME_DATA[actionType];
          const s = fd.startup || 0;
          const a = fd.active || 0;
          for (let i = 0; i < total; i++) {
            if (start + i < PLAN_FRAMES && slotEls[start + i]) {
              let phase = 'hover-startup';
              if (i >= s + a) phase = 'hover-recovery';
              else if (i >= s) phase = 'hover-active';
              slotEls[start + i].classList.add(phase);
            }
          }
        } else {
          // Doesn't fit, show invalid if hovering over something
          if (slotEls[index] && !slotEls[index].classList.contains('filled')) {
            slotEls[index].classList.add('hover-invalid');
          }
        }
      });
      wrap.addEventListener('dragleave', function () {
        wrap.classList.remove('drag-over');
        clearHoverSlots();
      });
      wrap.addEventListener('drop', function (e) {
        e.preventDefault();
        wrap.classList.remove('drag-over');
        clearHoverSlots();
        const actionType = e.dataTransfer.getData('text/plain') || window.__draggedAction;
        if (!actionType || !FRAME_DATA[actionType]) return;
        const index = getPlanBarDropIndex(e, wrap);
        if (addToPlan(playerNum, actionType, index)) {
          elements.optionsHint.textContent = 'Added ' + actionType + ' to P' + playerNum + ' plan. Add more or press Go.';
        } else {
          elements.optionsHint.textContent = 'Not enough empty frames for ' + actionType + ' (needs ' + getTotalFrames(actionType) + ' frames).';
        }
      });
    }

    setupDragDrop(elements.framePlanWrapP1, 1);
    setupDragDrop(elements.framePlanWrapP2, 2);
  }

  function init() {
    buildGrid();
    bindPlanBar();
    elements.optionsHint.textContent = 'Drag Light (16 frames) to the bar above. Fill up to 30 frames, then press Go.';
    updateUI();
  }

  init();
})();
