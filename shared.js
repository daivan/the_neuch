const COLS = 7;
const ROWS = 2;
const FLOOR_ROW = ROWS - 1; // last row is the floor
const STEPS_PER_CELL = 5;   // each cell split into 5 steps; 1 frame = 1 step, 5 frames = 1 cell

const state = {
    turn: 1,
    p1: { row: FLOOR_ROW, col: 2, stepX: 0, stepY: 0, health: 100 },
    p2: { row: FLOOR_ROW, col: 4, stepX: 0, stepY: 0, health: 100 },
    gameOver: null,
    gameMode: 'practice' // 'practice' or 'campaign'
};

const damage = { 
    light: 8, 
    medium: 15, 
    heavy: 25 
};

// Attack placement counter system
const ATTACK_PLACEMENTS = ['overhead', 'high', 'low'];
const ATTACK_STRENGTHS = ['light', 'medium', 'heavy'];

// Counter relationships: placement beats [beaten placements]
const PLACEMENT_COUNTERS = {
    'overhead': ['low'],    // Overhead beats low (short hop)
    'high': ['overhead'],   // High beats overhead (kick high)
    'low': ['high']        // Low beats high (duck while hitting)
};

// Combined attack types for frame data
const COMBINED_ATTACKS = {};
ATTACK_STRENGTHS.forEach(strength => {
    ATTACK_PLACEMENTS.forEach(placement => {
        const attackType = `${strength}_${placement}`;
        COMBINED_ATTACKS[attackType] = {
            strength,
            placement,
            damage: damage[strength]
        };
    });
});

// Disadvantage frames based on attack strength and recovery state
const DISADVANTAGE_FRAMES = {
    light: { base: 2, recoveryBonus: 5 },
    medium: { base: 4, recoveryBonus: 8 },
    heavy: { base: 6, recoveryBonus: 12 }
};

/** Frame data: startup, active, recovery per action. Directions: 1f each. */
const FRAME_DATA = {
    // Movement
    move: { startup: 0, active: 1, recovery: 0, hitboxRange: 0 },
    left: { startup: 0, active: 1, recovery: 0, hitboxRange: 0 },
    right: { startup: 0, active: 1, recovery: 0, hitboxRange: 0 },
    forward_dash: { startup: 0, active: 5, recovery: 0, hitboxRange: 0 },
    backward_dash: { startup: 0, active: 5, recovery: 0, hitboxRange: 0 },
    parry: { startup: 0, active: 15, recovery: 0, hitboxRange: 0 },
    
    // Light Attacks (10 total frames: 4/2/4)
    light_overhead: { startup: 4, active: 2, recovery: 4, hitboxRange: 1 },
    light_high: { startup: 4, active: 2, recovery: 4, hitboxRange: 1 },
    light_low: { startup: 4, active: 2, recovery: 4, hitboxRange: 1 },
    
    // Medium Attacks (16 total frames: 7/3/6)
    medium_overhead: { startup: 7, active: 3, recovery: 6, hitboxRange: 2 },
    medium_high: { startup: 7, active: 3, recovery: 6, hitboxRange: 2 },
    medium_low: { startup: 7, active: 3, recovery: 6, hitboxRange: 2 },
    
    // Heavy Attacks (22 total frames: 10/4/8)
    heavy_overhead: { startup: 10, active: 4, recovery: 8, hitboxRange: 3 },
    heavy_high: { startup: 10, active: 4, recovery: 8, hitboxRange: 3 },
    heavy_low: { startup: 10, active: 4, recovery: 8, hitboxRange: 3 }
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
let subgameState = null;

// Three-stage hit subgame damage progression
const SUBGAME_DAMAGE = [5, 7, 10];

// Counter system: what beats what (mapped to original button names)
const COUNTER_MATRIX = {
    'Continue combo': 'Break',    // Continue combo beats Break
    'Parry': 'Reversal',        // Parry beats Reversal  
    'Reset': 'Challenge',       // Reset beats Challenge
    'Grab': 'Parry',           // Grab beats Parry
    
    'Reversal': 'Reset',       // Reversal beats Reset
    'Challenge': 'Grab',        // Challenge beats Grab
    'Parry': 'Continue combo',   // Parry beats Continue combo
    'Break': 'Challenge'       // Break beats Challenge
};

let baseState = null;
let disadvantageState = null; // { player: playerNum, blockedFrames: number }

function saveBaseState() {
    baseState = JSON.parse(JSON.stringify(state));
}
function restoreBaseState() {
    if (baseState) {
        const currentGameMode = state.gameMode; // Preserve current game mode
        Object.assign(state, JSON.parse(JSON.stringify(baseState)));
        state.gameMode = currentGameMode; // Restore game mode
    }
}

// Dynamic hitbox styling functions
function applyHitboxStyling(avatar, attackType, frameNumber) {
    console.log('applyHitboxStyling called with attackType:', attackType, 'frameNumber:', frameNumber);
    
    // Get frame-specific hitbox data
    const frameData = getFrameHitboxData(attackType, frameNumber);
    console.log('getFrameHitboxData result:', frameData);
    
    if (!frameData) {
        console.log('No frame data found for attackType:', attackType, 'frame:', frameNumber);
        return;
    }
    
    const hitbox = avatar.querySelector('.hitbox');
    const hurtbox = avatar.querySelector('.hurtbox');
    console.log('hitbox element:', hitbox, 'hurtbox element:', hurtbox);
    
    if (!hitbox || !hurtbox) {
        console.log('Missing hitbox or hurtbox elements');
        return;
    }
    
    // Apply hitbox dimensions and position (if exists)
    if (frameData.hitbox) {
        hitbox.style.width = frameData.hitbox.width + 'px';
        hitbox.style.height = frameData.hitbox.height + 'px';
        hitbox.style.left = `calc(50% + ${frameData.hitbox.offsetX}px)`;
        hitbox.style.top = `calc(50% + ${frameData.hitbox.offsetY}px)`;
        hitbox.style.display = 'block';
        console.log('Applied hitbox styling');
    } else {
        hitbox.style.display = 'none';
        console.log('No hitbox for this frame - hiding hitbox');
    }
    
    // Apply hurtbox dimensions and position
    if (frameData.hurtbox) {
        hurtbox.style.width = frameData.hurtbox.width + 'px';
        hurtbox.style.height = frameData.hurtbox.height + 'px';
        hurtbox.style.left = `calc(50% + ${frameData.hurtbox.offsetX}px)`;
        hurtbox.style.top = `calc(50% + ${frameData.hurtbox.offsetY}px)`;
        hurtbox.style.display = 'block';
        console.log('Applied hurtbox styling');
    } else {
        hurtbox.style.display = 'none';
        console.log('No hurtbox for this frame - hiding hurtbox');
    }
    
    console.log('Final styling - hitbox:', hitbox.style.cssText, 'hurtbox:', hurtbox.style.cssText);
}

function clearHitboxStyling(avatar) {
    // Remove all attack-specific classes
    avatar.className = avatar.className.replace(/attacking-\w+-active/g, '');
    
    // Hide hitboxes and hurtboxes
    const hitbox = avatar.querySelector('.hitbox');
    const hurtbox = avatar.querySelector('.hurtbox');
    
    if (hitbox) {
        hitbox.style.display = 'none';
        hitbox.style.width = '';
        hitbox.style.height = '';
        hitbox.style.left = '';
        hitbox.style.top = '';
    }
    
    if (hurtbox) {
        hurtbox.style.display = 'none';
        hurtbox.style.width = '';
        hurtbox.style.height = '';
        hurtbox.style.left = '';
        hurtbox.style.top = '';
    }
}

function getAttackTypeFromAction(frameAction) {
    if (!frameAction || !frameAction.type) return null;
    
    // Handle combined attack types (e.g., "light_overhead")
    if (getHitboxConfig(frameAction.type)) {
        return frameAction.type;
    }
    
    // Handle simple attack types (fallback)
    if (frameAction.type === 'light') return 'light_high';
    if (frameAction.type === 'medium') return 'medium_high';
    if (frameAction.type === 'heavy') return 'heavy_high';
    
    return null;
}

function checkHit(attacker, defender, attackType, silent) {
    const attackerAvatar = attacker === state.p1 ? elements.avatarP1 : elements.avatarP2;
    const defenderAvatar = attacker === state.p1 ? elements.avatarP2 : elements.avatarP1;
    
    // Get hitbox configuration for this attack type
    const config = getHitboxConfig(attackType);
    if (!config) return false;
    
    // Temporarily apply attack-specific styling to show hitbox and get client rects
    const wasActive = attackerAvatar.classList.contains(`attacking-${attackType}-active`);
    attackerAvatar.classList.add(`attacking-${attackType}-active`);
    applyHitboxStyling(attackerAvatar, attackType);
    
    const hitboxRect = attackerAvatar.querySelector('.hitbox').getBoundingClientRect();
    const hurtboxRect = defenderAvatar.querySelector('.hurtbox').getBoundingClientRect();
    
    if (!wasActive) {
        attackerAvatar.classList.remove(`attacking-${attackType}-active`);
    }
    
    // Check collision
    const isHit = !(
        hitboxRect.right <= hurtboxRect.left ||
        hitboxRect.left >= hurtboxRect.right ||
        hitboxRect.bottom <= hurtboxRect.top ||
        hitboxRect.top >= hurtboxRect.bottom
    );
    
    return isHit;
}
