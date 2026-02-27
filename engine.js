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
            if (['left', 'right', 'down', 'forward_dash', 'backward_dash'].includes(info.type)) {
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

        // Handle campaign progression
        if (state.gameMode === 'campaign') {
            if (state.gameOver) {
                if (state.gameOver === 1) {
                    // Player won - advance to next level
                    campaignState.currentLevel++;
                    setTimeout(() => {
                        if (campaignState.currentLevel > campaignState.levels.length) {
                            elements.optionsHint.textContent = 'Congratulations! You completed the campaign!';
                        } else {
                            elements.optionsHint.textContent = 'Victory! Loading next level...';
                            setTimeout(() => {
                                loadCampaignLevel();
                            }, 2000);
                        }
                    }, 1000);
                } else {
                    // Player lost - restart current level
                    setTimeout(() => {
                        elements.optionsHint.textContent = 'Defeated! Restarting level...';
                        setTimeout(() => {
                            loadCampaignLevel();
                        }, 2000);
                    }, 1000);
                }
            } else {
                // No winner yet, continue playing
                elements.optionsHint.textContent = 'Round complete. Plan your next move!';
            }
        }

        elements.previewSlider.value = 0;
        elements.previewDisplay.textContent = '0 / 30';
        elements.previewSlider.disabled = false;
        elements.framePlanCursorP1.classList.remove('visible');
        elements.framePlanCursorP2.classList.remove('visible');
        elements.btnGo.disabled = false;
        
        if (state.gameMode !== 'campaign' || !state.gameOver) {
            elements.optionsHint.textContent = 'Plan finished. Drag actions to the bar again and press Go.';
        }
        
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
    console.log('startPlanExecution called, gameMode:', state.gameMode);
    console.log('planP1.length:', planP1.length, 'planP2.length:', planP2.length);
    
    // Clear disadvantage state when starting a new round
    disadvantageState = null;
    
    // Debug: Check if gameMode was somehow reset
    if (state.gameMode === 'practice') {
        console.warn('WARNING: gameMode is practice, but AI generation expected campaign mode!');
        console.trace('Call stack to see what set gameMode to practice');
    }
    
    // In campaign mode, only check P1's plan since P2 will be generated by AI
    if (state.gameMode === 'campaign') {
        if (planP1.length === 0) {
            elements.optionsHint.textContent = 'Drag at least one action to P1 bar, then press Go.';
            return;
        }
    } else {
        // In practice mode, both players need actions
        if (planP1.length === 0 && planP2.length === 0) {
            elements.optionsHint.textContent = 'Drag at least one action to a bar, then press Go.';
            return;
        }
    }
    if (planTimerId) return;

    // Generate AI plan for campaign mode
    console.log('About to generate AI plan, generateAIPlan exists:', typeof generateAIPlan);
    if (state.gameMode === 'campaign' && typeof generateAIPlan === 'function') {
        console.log('Calling generateAIPlan...');
        generateAIPlan();
        console.log('generateAIPlan completed, planP2.length now:', planP2.length);
    }

    restoreBaseState();
    elements.previewSlider.value = 0;
    elements.previewDisplay.textContent = '0 / 30';
    elements.previewSlider.disabled = true;

    planCurrentFrame = 0;
    elements.btnGo.disabled = true;
    elements.optionsHint.textContent = 'Executing plan…';
    planTimerId = setInterval(planExecutionTick, FRAME_MS);
    
    // Update UI to clear disadvantage display
    if (typeof updateDisadvantageUI === 'function') {
        updateDisadvantageUI();
    }
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

    // Get attack info for new combined attack types
    const attackInfo = COMBINED_ATTACKS[type];
    const strength = attackInfo ? attackInfo.strength : type;
    const placement = attackInfo ? attackInfo.placement : null;

    // Get the actual attack type for hitbox configuration
    const attackType = getAttackTypeFromAction({ type });
    if (!attackType) {
      // Fallback to simple attack types
      const fallbackType = type === 'light' ? 'light_high' : type === 'medium' ? 'medium_high' : 'heavy_high';
      return doAttack(fallbackType, playerNum, silent);
    }

    // Check if both players are attacking and handle counter system
    const attackerAction = playerNum === 1 ? frameActionP1 : frameActionP2;
    const defenderAction = playerNum === 1 ? frameActionP2 : frameActionP1;
    
    let isCounterHit = false;
    let counterMessage = '';
    
    if (defenderAction && defenderAction.type && placement) {
        const defenderAttackInfo = COMBINED_ATTACKS[defenderAction.type];
        if (defenderAttackInfo && defenderAttackInfo.placement) {
            // Check for counter relationships
            if (getAttackCounterRelationship(placement, defenderAttackInfo.placement)) {
                isCounterHit = true;
                counterMessage = `Counter hit! ${placement} beats ${defenderAttackInfo.placement}. `;
            }
        }
    }

    // Hit detection with dynamic hitboxes
    const isHit = checkHit(attacker, defender, attackType, silent);

    if (!silent) {
        attackerAvatar.classList.add('attacking');
        setTimeout(function () { attackerAvatar.classList.remove('attacking'); }, 300);
    }

    const isParrying = defenderAction && defenderAction.type === 'parry';

    if (isHit) {
        if (isParrying) {
            if (!silent) elements.optionsHint.textContent = 'Parried! 0 damage.';
        } else {
            // Apply damage immediately
            const amount = attackInfo ? attackInfo.damage : damage[strength];
            defender.health = Math.max(0, defender.health - amount);
            
            // Calculate disadvantage frames based on strength
            const disadvantageData = DISADVANTAGE_FRAMES[strength];
            let disadvantageFrames = disadvantageData.base;
            
            // Check if defender was in recovery frames
            if (defenderAction && defenderAction.type !== 'parry') {
                const fd = FRAME_DATA[defenderAction.type] || FRAME_DATA.move;
                const totalFrames = fd.startup + fd.active + fd.recovery;
                const currentFrame = defenderAction.currentFrame || 0;
                
                if (currentFrame >= fd.startup + fd.active && currentFrame < totalFrames) {
                    // Defender is in recovery frames
                    disadvantageFrames += disadvantageData.recoveryBonus;
                }
            }
            
            // Apply disadvantage to defender
            disadvantageState = {
                player: playerNum === 1 ? 2 : 1, // The defender gets disadvantage
                blockedFrames: disadvantageFrames
            };
            
            if (!silent) {
                const message = counterMessage + `Hit! ${amount} damage. P${disadvantageState.player} has ${disadvantageFrames} frames disadvantage!`;
                elements.optionsHint.textContent = message;
                
                // Stop current execution and reset for disadvantage mode
                if (planTimerId) {
                    clearInterval(planTimerId);
                    planTimerId = null;
                }
                // Clear plans and reset for new round with disadvantage
                clearPlan();
                restoreBaseState();
                updateUI();
                if (typeof updateDisadvantageUI === 'function') {
                    updateDisadvantageUI();
                }
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

if (directionOrAttack === 'down') {
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
        roundWinner: null,
        defenderParried: false // Track if defender successfully parried
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
    
    // Check if defender successfully parried in this round
    const defenderAction = subgameState.defender === 1 ? p1 : p2;
    const attackerAction = subgameState.attacker === 1 ? p1 : p2;
    
    if (defenderAction === 'Parry') {
        subgameState.defenderParried = true;
    }
    
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
    
    // Apply disadvantage if defender successfully parried and won the subgame
    if (subgameState.defenderParried && roundWinner === subgameState.defender) {
        disadvantageState = {
            attacker: subgameState.attacker,
            defender: subgameState.defender
        };
        elements.optionsHint.textContent += ` Defender parried successfully! Attacker has disadvantage!`;
        
        // Stop current execution and reset for disadvantage mode
        if (planTimerId) {
            clearInterval(planTimerId);
            planTimerId = null;
        }
        // Clear plans and reset for new round with disadvantage
        clearPlan();
        restoreBaseState();
        updateUI();
        if (typeof updateDisadvantageUI === 'function') {
            updateDisadvantageUI();
        }
        subgameState = null;
        return;
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
