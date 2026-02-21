function init() {
    // Populate elements object defined in shared.js
    elements.grid = document.getElementById('grid');
    elements.avatarP1 = document.getElementById('avatar-p1');
    elements.avatarP2 = document.getElementById('avatar-p2');
    elements.p1Health = document.getElementById('p1-health');
    elements.p2Health = document.getElementById('p2-health');
    elements.p1HealthText = document.getElementById('p1-health-text');
    elements.p2HealthText = document.getElementById('p2-health-text');
    elements.turnIndicator = document.getElementById('turn-indicator');
    elements.optionsHint = document.getElementById('options-hint');
    elements.btnLight = document.getElementById('btn-light');
    elements.btnBlock = document.getElementById('btn-block');
    elements.btnMedium = document.getElementById('btn-medium');
    elements.btnHeavy = document.getElementById('btn-heavy');
    elements.btnGo = document.getElementById('btn-go');
    elements.btnPractice = document.getElementById('btn-practice');
    elements.btnCampaign = document.getElementById('btn-campaign');
    elements.startScreen = document.getElementById('start-screen');
    elements.gameContainer = document.getElementById('game-container');
    elements.framePlanBarP1 = document.getElementById('frame-plan-bar-p1');
    elements.framePlanWrapP1 = document.getElementById('frame-plan-wrap-p1');
    elements.framePlanCursorP1 = document.getElementById('frame-plan-cursor-p1');
    elements.framePlanBarP2 = document.getElementById('frame-plan-bar-p2');
    elements.framePlanWrapP2 = document.getElementById('frame-plan-wrap-p2');
    elements.framePlanCursorP2 = document.getElementById('frame-plan-cursor-p2');
    elements.frameBarP1 = document.getElementById('frame-bar-p1');
    elements.frameBarP2 = document.getElementById('frame-bar-p2');
    elements.frameCursorP1 = document.getElementById('frame-cursor-p1');
    elements.frameCursorP2 = document.getElementById('frame-cursor-p2');
    elements.frameLabelP1 = document.getElementById('frame-label-p1');
    elements.frameLabelP2 = document.getElementById('frame-label-p2');
    elements.previewSlider = document.getElementById('preview-slider');
    elements.previewDisplay = document.getElementById('preview-frame-display');

    saveBaseState();
    buildGrid();
    bindPlanBar();
    elements.optionsHint.textContent = 'Drag Light (16 frames) to the bar above. Fill up to 30 frames, then press Go.';
    updateUI();

    elements.btnPractice.addEventListener('click', function () {
        state.gameMode = 'practice';
        elements.startScreen.style.display = 'none';
        elements.gameContainer.style.display = 'flex';
    });

    if (elements.btnCampaign) {
        elements.btnCampaign.addEventListener('click', function () {
            elements.startScreen.style.display = 'none';
            elements.gameContainer.style.display = 'flex';
            startCampaign();
        });
    }

    // Bind slider events
    elements.previewSlider.addEventListener('input', function (e) {
        const targetFrame = parseInt(e.target.value, 10);
        elements.previewDisplay.textContent = targetFrame + ' / ' + PLAN_FRAMES;
        simulatePlan(targetFrame);
    });
}

init();
