const campaignState = {
    currentLevel: 1,
    levels: [
        { name: "Training Dummy", enemyHealth: 50, ai: "idle" },
        { name: "Aggressive Bot", enemyHealth: 100, ai: "random" }
    ]
};

function startCampaign() {
    state.gameMode = 'campaign';
    campaignState.currentLevel = 1;
    loadCampaignLevel();
}

function loadCampaignLevel() {
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

    clearPlan();
    saveBaseState();
    updateUI();
    elements.optionsHint.textContent = `Campaign: Level ${campaignState.currentLevel} - ${levelData.name}`;
}
