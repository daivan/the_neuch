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

function getCellEl(row, col) {
    return elements.grid.querySelector('.cell[data-row="' + row + '"][data-col="' + col + '"]');
}

function getAllCells() {
    return Array.from(elements.grid.querySelectorAll('.cell'));
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

    elements.turnIndicator.textContent = state.gameMode === 'campaign' ? 'Campaign Battle' : "P" + state.turn + "'s Turn";
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

function updateFrameDataDisplay() {
    renderFrameRow(1, frameActionP1, elements.frameBarP1, elements.frameCursorP1, elements.frameLabelP1);
    renderFrameRow(2, frameActionP2, elements.frameBarP2, elements.frameCursorP2, elements.frameLabelP2);
}

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

            slot.draggable = true;
            slot.dataset.action = info.type;
            slot.dataset.startFrame = info.startFrame;
            slot.dataset.player = playerNum;

            slot.addEventListener('dragstart', function (e) {
                e.dataTransfer.setData('text/plain', info.type);
                window.__draggedAction = info.type;

                const originalIndex = planArray.findIndex(item => item.startFrame === info.startFrame && item.type === info.type);
                if (originalIndex !== -1) {
                    window.__draggedOriginal = planArray[originalIndex];
                    window.__draggedPlayer = playerNum;
                    planArray.splice(originalIndex, 1);
                    const siblingSlots = barEl.querySelectorAll(`[data-start-frame="${info.startFrame}"]`);
                    siblingSlots.forEach(s => {
                        s.style.opacity = '0.1';
                    });
                }

                e.dataTransfer.effectAllowed = 'move';
            });

            slot.addEventListener('dragend', function (e) {
                window.__draggedAction = null;
                clearHoverSlots();
                if (window.__draggedOriginal) {
                    if (e.dataTransfer.dropEffect !== 'none') {
                        const pArray = window.__draggedPlayer === 1 ? planP1 : planP2;
                        pArray.push(window.__draggedOriginal);
                    } else {
                        elements.optionsHint.textContent = 'Action removed from timeline.';
                    }
                    buildPlanBar(window.__draggedPlayer);
                    onPlanChanged();
                    window.__draggedOriginal = null;
                    window.__draggedPlayer = null;
                }
            });
        }
        barEl.appendChild(slot);
    }
}

function getPlanBarDropIndex(e, wrap) {
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    return Math.min(PLAN_FRAMES - 1, Math.floor(pct * PLAN_FRAMES));
}

function clearHoverSlots() {
    document.querySelectorAll('.frame-slot').forEach(function (slot) {
        slot.classList.remove('hover-startup', 'hover-active', 'hover-recovery', 'hover-invalid');
    });
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

    function setupDragDrop(wrap, playerNum) {
        wrap.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = window.__draggedOriginal ? 'move' : 'copy';
            wrap.classList.add('drag-over');

            const actionType = window.__draggedAction;
            if (!actionType || !FRAME_DATA[actionType]) return;

            const index = getPlanBarDropIndex(e, wrap);
            const planArray = playerNum === 1 ? planP1 : planP2;
            const total = getTotalFrames(actionType);

            const start = findEmptyBlock(planArray, total, index);

            clearHoverSlots();

            const slotEls = wrap.querySelectorAll('.frame-slot');
            if (start >= 0) {
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

            if (window.__draggedOriginal && window.__draggedPlayer !== playerNum) {
                elements.optionsHint.textContent = 'Cannot drop action across different player timelines.';
                return;
            }

            const index = getPlanBarDropIndex(e, wrap);
            if (addToPlan(playerNum, actionType, index)) {
                elements.optionsHint.textContent = 'Added ' + actionType + ' to P' + playerNum + ' plan. Add more or press Go.';

                if (window.__draggedOriginal) {
                    window.__draggedOriginal = null;
                    window.__draggedPlayer = null;
                    buildPlanBar(playerNum);
                }
            } else {
                elements.optionsHint.textContent = 'Not enough empty frames for ' + actionType + ' (needs ' + getTotalFrames(actionType) + ' frames).';
            }
        });
    }

    setupDragDrop(elements.framePlanWrapP1, 1);
    setupDragDrop(elements.framePlanWrapP2, 2);
}

const SUBGAME_ACTIONS = {
    attacker: ['Continue combo', 'Block', 'Reset', 'Grab'],
    defender: ['Reversal', 'Challenge', 'Block', 'Break']
};

function showSubGameUI(attackerNum, defenderNum) {
    if (!elements.hitSubgame) return;
    elements.hitSubgame.style.display = 'block';

    elements.subgameButtonsP1.innerHTML = '';
    elements.subgameButtonsP2.innerHTML = '';
    elements.subgameStatusP1.textContent = 'Waiting for action...';
    elements.subgameStatusP2.textContent = 'Waiting for action...';

    elements.subgameRoleP1.textContent = attackerNum === 1 ? 'Attacker' : 'Defender';
    elements.subgameRoleP2.textContent = attackerNum === 2 ? 'Attacker' : 'Defender';

    // Show current stage and damage
    const stage = subgameState ? subgameState.stage : 1;
    const damage = SUBGAME_DAMAGE[stage - 1];
    elements.subgameStatusP1.textContent = `Stage ${stage}/3 - ${damage} damage at stake`;
    elements.subgameStatusP2.textContent = `Stage ${stage}/3 - ${damage} damage at stake`;

    const p1Actions = attackerNum === 1 ? SUBGAME_ACTIONS.attacker : SUBGAME_ACTIONS.defender;
    const p2Actions = attackerNum === 2 ? SUBGAME_ACTIONS.attacker : SUBGAME_ACTIONS.defender;

    p1Actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'subgame-btn';
        btn.textContent = action;
        btn.onclick = () => selectSubGameAction(1, action, btn);
        elements.subgameButtonsP1.appendChild(btn);
    });

    p2Actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'subgame-btn';
        btn.textContent = action;
        btn.onclick = () => selectSubGameAction(2, action, btn);
        elements.subgameButtonsP2.appendChild(btn);
    });

    if (state.gameMode === 'campaign') {
        const aiAction = p2Actions[Math.floor(Math.random() * p2Actions.length)];
        setTimeout(() => {
            if (subgameState) selectSubGameAction(2, aiAction, null);
        }, 800);
    }
}

function selectSubGameAction(playerNum, action, btnElement) {
    if (!subgameState) return;

    if (playerNum === 1) subgameState.p1Action = action;
    else subgameState.p2Action = action;

    if (btnElement) {
        const container = playerNum === 1 ? elements.subgameButtonsP1 : elements.subgameButtonsP2;
        Array.from(container.children).forEach(b => b.classList.remove('selected'));
        btnElement.classList.add('selected');

        Array.from(container.children).forEach(b => b.disabled = true);
        btnElement.disabled = false;
    }

    const statusEl = playerNum === 1 ? elements.subgameStatusP1 : elements.subgameStatusP2;
    statusEl.textContent = 'Ready';

    if (subgameState.p1Action && subgameState.p2Action) {
        setTimeout(resolveSubGame, 500);
    }
}

function hideSubGameUI() {
    if (elements.hitSubgame) elements.hitSubgame.style.display = 'none';
}

function updateSubGameUI() {
    if (!subgameState || !elements.hitSubgame) return;
    
    // Reset buttons for next stage
    elements.subgameButtonsP1.innerHTML = '';
    elements.subgameButtonsP2.innerHTML = '';
    elements.subgameStatusP1.textContent = 'Waiting for action...';
    elements.subgameStatusP2.textContent = 'Waiting for action...';

    // Show updated stage and damage
    const stage = subgameState.stage;
    const damage = SUBGAME_DAMAGE[stage - 1];
    elements.subgameStatusP1.textContent = `Stage ${stage}/3 - ${damage} damage at stake`;
    elements.subgameStatusP2.textContent = `Stage ${stage}/3 - ${damage} damage at stake`;

    const attackerNum = subgameState.attacker;
    const p1Actions = attackerNum === 1 ? SUBGAME_ACTIONS.attacker : SUBGAME_ACTIONS.defender;
    const p2Actions = attackerNum === 2 ? SUBGAME_ACTIONS.attacker : SUBGAME_ACTIONS.defender;

    p1Actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'subgame-btn';
        btn.textContent = action;
        btn.onclick = () => selectSubGameAction(1, action, btn);
        elements.subgameButtonsP1.appendChild(btn);
    });

    p2Actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'subgame-btn';
        btn.textContent = action;
        btn.onclick = () => selectSubGameAction(2, action, btn);
        elements.subgameButtonsP2.appendChild(btn);
    });

    if (state.gameMode === 'campaign') {
        const aiAction = p2Actions[Math.floor(Math.random() * p2Actions.length)];
        setTimeout(() => {
            if (subgameState) selectSubGameAction(2, aiAction, null);
        }, 800);
    }
}
