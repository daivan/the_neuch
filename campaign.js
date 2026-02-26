const campaignState = {
    currentLevel: 1,
    levels: [
        { name: "Training Dummy", enemyHealth: 50, ai: "random" },
        { name: "Random Bot", enemyHealth: 75, ai: "random" },
        { name: "Reactive Fighter", enemyHealth: 100, ai: "reactive" },
        { name: "Aggressive Brawler", enemyHealth: 125, ai: "aggressive" },
        { name: "Master Fighter", enemyHealth: 150, ai: "aggressive" }
    ]
};

function startCampaign() {
    console.log('startCampaign called');
    state.gameMode = 'campaign';
    campaignState.currentLevel = 1;
    console.log('gameMode set to:', state.gameMode);
    loadCampaignLevel();
}

function loadCampaignLevel() {
    console.log('loadCampaignLevel called, current gameMode:', state.gameMode);
    const levelData = campaignState.levels[campaignState.currentLevel - 1];
    if (!levelData) {
        alert("You beat the campaign!");
        return;
    }

    // Reset states
    state.gameOver = null;
    state.turn = 1;
    state.p1 = { row: FLOOR_ROW, col: 0, stepX: 0, stepY: 0, health: 100 };
    state.p2 = { row: FLOOR_ROW, col: COLS - 1, stepX: 0, stepY: 0, health: levelData.enemyHealth };
    
    // Make sure gameMode stays as campaign
    state.gameMode = 'campaign';
    console.log('Ensured gameMode is campaign after reset:', state.gameMode);

    clearPlan();
    saveBaseState();
    updateUI();
    
    // Update UI text for campaign mode
    const frameDataTitle = document.querySelector('.frame-data-title');
    if (frameDataTitle) {
        frameDataTitle.textContent = 'Your plan — 30 frames (P2 editable for testing, AI will override on Go)';
    }
    
    elements.optionsHint.textContent = `Campaign: Level ${campaignState.currentLevel} - ${levelData.name}`;
}

// AI System for generating P2 frame data
const aiStrategies = {
    idle: {
        generatePlan: function(p1Plan) {
            // Training dummy - does nothing
            return [];
        }
    },
    random: {
        generatePlan: function(p1Plan) {
            console.log('Random AI generating plan, P1 plan:', p1Plan);
            // Random AI - generates random actions including new combined attacks
            const actions = ['left', 'right', 'parry', 
                           'light_overhead', 'light_high', 'light_low',
                           'medium_overhead', 'medium_high', 'medium_low', 
                           'heavy_overhead', 'heavy_high', 'heavy_low'];
            const plan = [];
            
            // Determine starting frame based on disadvantage state
            let currentFrame = 0;
            if (disadvantageState && disadvantageState.player === 2) {
                // P2 has disadvantage - start after blocked frames
                currentFrame = disadvantageState.blockedFrames;
            }
            
            while (currentFrame < PLAN_FRAMES - 5) {
                const action = actions[Math.floor(Math.random() * actions.length)];
                const totalFrames = getTotalFrames(action);
                
                console.log(`Trying action: ${action}, totalFrames: ${totalFrames}, currentFrame: ${currentFrame}`);
                
                if (canAddActionAt(plan, currentFrame, action)) {
                    plan.push({ type: action, startFrame: currentFrame });
                    console.log(`Added ${action} at frame ${currentFrame}`);
                    currentFrame += totalFrames + Math.floor(Math.random() * 3); // Small random gap
                } else {
                    console.log(`Could not add ${action} - frame not available`);
                    currentFrame += 1; // Try next frame
                }
            }
            
            console.log('Random AI generated plan:', plan);
            return plan;
        }
    },
    reactive: {
        generatePlan: function(p1Plan) {
            // Reactive AI - analyzes P1's plan and creates counters
            const plan = [];
            const p1Filled = getPlanFilledSlots(p1Plan);
            
            // Determine available frame range based on disadvantage
            let minFrame = 0;
            if (disadvantageState && disadvantageState.player === 2) {
                // P2 has disadvantage - start after blocked frames
                minFrame = disadvantageState.blockedFrames;
            }
            
            // Analyze P1's attacks and create counters
            for (let frame = minFrame; frame < PLAN_FRAMES - 10; frame++) {
                const p1Action = p1Filled[frame];
                
                if (p1Action && p1Action.type && p1Action.type.includes('_')) {
                    // P1 is using a combined attack - try to counter it
                    const p1AttackInfo = COMBINED_ATTACKS[p1Action.type];
                    if (p1AttackInfo) {
                        // Find a placement that counters P1's placement
                        const counterPlacements = Object.keys(PLACEMENT_COUNTERS).filter(
                            placement => PLACEMENT_COUNTERS[placement].includes(p1AttackInfo.placement)
                        );
                        
                        if (counterPlacements.length > 0) {
                            const counterPlacement = counterPlacements[0];
                            const strengths = ['light', 'medium', 'heavy'];
                            const strength = strengths[Math.floor(Math.random() * strengths.length)];
                            const counterAction = `${strength}_${counterPlacement}`;
                            

                            if (canAddActionAt(plan, frame, counterAction)) {
                                plan.push({ type: counterAction, startFrame: frame });
                                frame += getTotalFrames(counterAction);
                                continue;
                            }
                        }
                    }
                }
                
                // Default behavior - use random attacks or movement
                if (Math.random() < 0.4) {
                    const actions = ['light_high', 'medium_high', 'heavy_high', 'parry'];
                    const action = actions[Math.floor(Math.random() * actions.length)];
                    if (canAddActionAt(plan, frame, action)) {
                        plan.push({ type: action, startFrame: frame });
                        frame += getTotalFrames(action);
                    }
                } else if (Math.random() < 0.3) {
                    // Movement
                    const movements = ['left', 'right'];
                    const movement = movements[Math.floor(Math.random() * movements.length)];
                    if (canAddActionAt(plan, frame, movement)) {
                        plan.push({ type: movement, startFrame: frame });
                        frame += getTotalFrames(movement);
                    }
                } else {
                    frame++;
                }
            }
            
            return plan;
        }
    },
    aggressive: {
        generatePlan: function(p1Plan) {
            // Aggressive AI - tries to pressure P1
            const plan = [];
            const p1Filled = getPlanFilledSlots(p1Plan);
            
            // Determine available frame range based on disadvantage
            let minFrame = 0;
            if (disadvantageState && disadvantageState.player === 2) {
                // P2 has disadvantage - start after blocked frames
                minFrame = disadvantageState.blockedFrames;
            }
            
            // Start with an approach if we have frames available
            if (state.p2.col > state.p1.col + 2 && minFrame < PLAN_FRAMES) {
                const approachStart = minFrame;
                if (canAddActionAt(plan, approachStart, 'left')) {
                    plan.push({ type: 'left', startFrame: approachStart });
                    if (canAddActionAt(plan, approachStart + 2, 'left')) {
                        plan.push({ type: 'left', startFrame: approachStart + 2 });
                        if (canAddActionAt(plan, approachStart + 4, 'left')) {
                            plan.push({ type: 'left', startFrame: approachStart + 4 });
                        }
                    }
                }
            }
            
            // Look for openings to attack
            for (let frame = minFrame; frame < PLAN_FRAMES - 10; frame++) {
                const p1Action = p1Filled[frame];
                const distance = manhattanDist(state.p1, state.p2);
                
                // Attack when P1 is recovering or idle
                if (!p1Action || p1Action.phase === 'recovery') {
                    if (distance <= 10 && Math.random() < 0.6) {
                        // Use aggressive attacks - favor heavy and overhead
                        const attackChoices = ['heavy_overhead', 'heavy_high', 'medium_overhead', 'light_low'];
                        const attackType = attackChoices[Math.floor(Math.random() * attackChoices.length)];
                        
                        if (canAddActionAt(plan, frame, attackType)) {
                            plan.push({ type: attackType, startFrame: frame });
                            frame += getTotalFrames(attackType); // Skip ahead
                        }
                    }
                }
                
                // Mix in movement and parries
                if (Math.random() < 0.3) {
                    const moveAction = Math.random() < 0.5 ? 'left' : 'right';
                    if (canAddActionAt(plan, frame, moveAction)) {
                        plan.push({ type: moveAction, startFrame: frame });
                    }
                }
            }
            
            return plan;
        }
    }
};

function canAddActionAt(plan, startFrame, actionType) {
    const totalFrames = getTotalFrames(actionType);
    if (startFrame + totalFrames > PLAN_FRAMES) return false;
    
    // Check disadvantage restrictions for P2 (AI)
    if (disadvantageState && disadvantageState.player === 2) {
        const blockedFrameCount = disadvantageState.blockedFrames;
        
        if (startFrame < blockedFrameCount) {
            // P2 cannot use blocked frames
            return false;
        }
        
        // Check if action spans into blocked frames
        if (startFrame < blockedFrameCount && startFrame + totalFrames > blockedFrameCount) {
            return false;
        }
    }
    
    const filled = getPlanFilledSlots(plan);
    for (let i = 0; i < totalFrames; i++) {
        if (filled[startFrame + i]) return false;
    }
    
    return true;
}

function generateAIPlan() {
    console.log('generateAIPlan called, gameMode:', state.gameMode);
    if (state.gameMode !== 'campaign') return;
    
    const levelData = campaignState.levels[campaignState.currentLevel - 1];
    const aiType = levelData.ai || 'random';
    const strategy = aiStrategies[aiType];
    
    console.log('Level data:', levelData, 'AI type:', aiType);
    
    if (!strategy) {
        console.error('Unknown AI strategy:', aiType);
        return;
    }
    
    // Clear any existing P2 plan (manual or AI) and replace with AI-generated plan
    console.log('Clearing existing P2 plan, was:', planP2);
    planP2 = [];
    
    // Generate new plan based on P1's plan
    const aiPlan = strategy.generatePlan(planP1);
    planP2 = aiPlan;
    
    console.log(`AI (${aiType}) generated plan:`, planP2);
    
    // Update the UI to show P2's new AI plan
    buildPlanBar(2);
    
    elements.optionsHint.textContent = `AI (${aiType}) overrode P2 plan with ${planP2.length} action(s). Press Go to execute!`;
}
