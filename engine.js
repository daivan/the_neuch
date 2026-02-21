// Core logic for timeline execution

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
    updateHitboxDisplay();
    updateFrameDataDisplay();
    if (!busy && frameTimerId) {
        clearInterval(frameTimerId);
        frameTimerId = null;
    }
}

function processPlayerAction(playerNum, planArray, silent) {
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
                doAttack(info.type, playerNum, silent);
            }
            if (['left', 'right', 'down', 'jump', 'forward_dash', 'backward_dash'].includes(info.type)) {
                applyMovement(info.type, localFrame, playerNum);
            }
        }
    } else {
        frameAction = null;
    }

    if (playerNum === 1) frameActionP1 = frameAction;
    else frameActionP2 = frameAction;
}

function simulatePlan(targetFrame) {
    if (!baseState) saveBaseState();
    restoreBaseState();
    frameActionP1 = null;
    frameActionP2 = null;

    for (let f = 0; f < targetFrame; f++) {
        planCurrentFrame = f;
        processPlayerAction(1, planP1, true);
        processPlayerAction(2, planP2, true);
        updateHitboxDisplay();
        updateUI();
    }

    if (targetFrame === 0) {
        updateHitboxDisplay();
        updateUI();
    }

    const pct = targetFrame > 0 ? (targetFrame / PLAN_FRAMES) * 100 : 0;
    elements.framePlanCursorP1.style.left = pct + '%';
    elements.framePlanCursorP2.style.left = pct + '%';

    if (targetFrame > 0) {
        elements.framePlanCursorP1.classList.add('visible');
        elements.framePlanCursorP2.classList.add('visible');
    } else {
        elements.framePlanCursorP1.classList.remove('visible');
        elements.framePlanCursorP2.classList.remove('visible');
    }

    updateFrameDataDisplay();
}

function onPlanChanged() {
    if (!isExecuting()) {
        simulatePlan(parseInt(elements.previewSlider.value, 10));
    }
}

/** Run one tick of plan execution (one frame). */
function planExecutionTick() {
    if (planCurrentFrame >= PLAN_FRAMES) {
        clearInterval(planTimerId);
        planTimerId = null;
        frameActionP1 = null;
        frameActionP2 = null;
        saveBaseState();
        clearPlan();

        // AI turn for campaign after simulation finishes
        if (state.gameMode === 'campaign' && !state.gameOver) {
            // Simple logic for turn progression could go here
        }

        elements.previewSlider.value = 0;
        elements.previewDisplay.textContent = '0 / 30';
        elements.previewSlider.disabled = false;
        elements.framePlanCursorP1.classList.remove('visible');
        elements.framePlanCursorP2.classList.remove('visible');
        elements.btnGo.disabled = false;
        elements.optionsHint.textContent = 'Plan finished. Drag actions to the bar again and press Go.';
        updateFrameDataDisplay();
        updateUI();
        return;
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
    } else if (type === 'forward_dash') {
        if (isOnFloor(p)) {
            // Move 2 squares per frame (10 steps total over 5 frames)
            moveStep(p, 2, 0);
        }
    } else if (type === 'backward_dash') {
        if (isOnFloor(p)) {
            // Move 2 squares per frame (10 steps total over 5 frames)
            moveStep(p, -2, 0);
        }
    }
}

function startPlanExecution() {
    if (planP1.length === 0 && planP2.length === 0) {
        elements.optionsHint.textContent = 'Drag at least one action to a bar, then press Go.';
        return;
    }
    if (planTimerId) return;

    restoreBaseState();
    elements.previewSlider.value = 0;
    elements.previewDisplay.textContent = '0 / 30';
    elements.previewSlider.disabled = true;

    planCurrentFrame = 0;
    elements.btnGo.disabled = true;
    elements.optionsHint.textContent = 'Executing plan…';
    planTimerId = setInterval(planExecutionTick, FRAME_MS);
}

function isExecuting() {
    return planTimerId != null || subgameState != null;
}

function doAttack(type, playerNum, silent) {
    playerNum = playerNum || state.turn;
    const attacker = playerNum === 1 ? state.p1 : state.p2;
    const defender = playerNum === 1 ? state.p2 : state.p1;

    const attackerAvatar = playerNum === 1 ? elements.avatarP1 : elements.avatarP2;
    const defenderAvatar = playerNum === 1 ? elements.avatarP2 : elements.avatarP1;

    const wasActive = attackerAvatar.classList.contains('attacking-light-active');
    attackerAvatar.classList.add('attacking-light-active');

    const hitboxRect = attackerAvatar.querySelector('.hitbox').getBoundingClientRect();
    const hurtboxRect = defenderAvatar.querySelector('.hurtbox').getBoundingClientRect();

    if (!wasActive) {
        attackerAvatar.classList.remove('attacking-light-active');
    }

    const isHit = !(
        hitboxRect.right <= hurtboxRect.left ||
        hitboxRect.left >= hurtboxRect.right ||
        hitboxRect.bottom <= hurtboxRect.top ||
        hitboxRect.top >= hurtboxRect.bottom
    );

    if (!silent) {
        attackerAvatar.classList.add('attacking');
        setTimeout(function () { attackerAvatar.classList.remove('attacking'); }, 300);
    }

    const defenderAction = playerNum === 1 ? frameActionP2 : frameActionP1;
    const isParrying = defenderAction && defenderAction.type === 'parry';

    if (isHit) {
        if (isParrying) {
            if (!silent) elements.optionsHint.textContent = 'Parried! 0 damage.';
        } else {
            const amount = damage[type];
            defender.health = Math.max(0, defender.health - amount);
            if (!silent) {
                elements.optionsHint.textContent = 'Hit! ' + amount + ' damage.';
                startSubGame(playerNum, defender === state.p1 ? 1 : 2);
            }
        }
    } else {
        if (!silent) elements.optionsHint.textContent = 'Missed!';
    }

    if (defender.health <= 0) state.gameOver = state.turn;
    else if (!isExecuting() && !silent && !subgameState) endTurn();
    if (!silent) updateUI();
}

function endTurn() {
    if (state.gameOver) return;
    state.turn = state.turn === 1 ? 2 : 1;
    landIfInAir();
    updateUI();
}

function landIfInAir() {
    const current = state.turn === 1 ? state.p1 : state.p2;
    if (current.row < FLOOR_ROW) {
        current.row = FLOOR_ROW;
        current.stepY = 0;
    }
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

function startSubGame(attackerNum, defenderNum) {
    if (planTimerId) {
        clearInterval(planTimerId);
        planTimerId = null;
    }
    subgameState = {
        attacker: attackerNum,
        defender: defenderNum,
        stage: 1, // 1 = first hit, 2 = second hit, 3 = final hit
        p1Action: null,
        p2Action: null,
        roundWinner: null
    };
    if (typeof showSubGameUI === 'function') {
        showSubGameUI(attackerNum, defenderNum);
    }
}

function resolveSubGame() {
    if (!subgameState || !subgameState.p1Action || !subgameState.p2Action) return;

    const p1 = subgameState.p1Action;
    const p2 = subgameState.p2Action;
    const stage = subgameState.stage;
    const damage = SUBGAME_DAMAGE[stage - 1];

    // Determine winner using counter system
    let roundWinner = null;
    let message = '';
    
    if (p1 === p2) {
        // Same action - attacker wins this round
        roundWinner = subgameState.attacker;
        message = `Both chose ${p1}! Attacker wins round ${stage}.`;
    } else if (COUNTER_MATRIX[p1] === p2) {
        // P2 counters P1
        roundWinner = 2;
        message = `P2's ${p2} counters P1's ${p1}!`;
    } else if (COUNTER_MATRIX[p2] === p1) {
        // P1 counters P2
        roundWinner = 1;
        message = `P1's ${p1} counters P2's ${p2}!`;
    } else {
        // No counter - attacker wins
        roundWinner = subgameState.attacker;
        message = `No counter! Attacker wins round ${stage}.`;
    }

    subgameState.roundWinner = roundWinner;
    elements.optionsHint.textContent = message;

    // Apply damage if attacker won the round
    if (roundWinner === subgameState.attacker) {
        const defender = roundWinner === 1 ? state.p2 : state.p1;
        defender.health = Math.max(0, defender.health - damage);
        elements.optionsHint.textContent += ` ${damage} damage dealt!`;
    }

    // Check if subgame should continue or end
    if (stage < 3 && roundWinner === subgameState.attacker) {
        // Continue to next stage
        subgameState.stage++;
        subgameState.p1Action = null;
        subgameState.p2Action = null;
        subgameState.roundWinner = null;
        
        if (typeof updateSubGameUI === 'function') {
            updateSubGameUI();
        }
        return; // Don't hide UI, continue subgame
    }

    // Subgame ends - either defender won a round or attacker completed all 3 stages
    if (typeof hideSubGameUI === 'function') {
        hideSubGameUI();
    }
    subgameState = null;

    if (state.p1.health <= 0 || state.p2.health <= 0) {
        state.gameOver = state.p1.health <= 0 ? 2 : 1;
    } else if (!state.gameOver && planCurrentFrame < PLAN_FRAMES) {
        elements.optionsHint.textContent += ' Resuming plan...';
        planTimerId = setInterval(planExecutionTick, FRAME_MS);
    } else if (!state.gameOver) {
        endTurn();
        updateUI();
    }
}
