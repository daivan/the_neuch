// Hitbox and Hurtbox Configuration
// This file contains all the hitbox and hurtbox data for each attack type
// Modify these values to adjust attack ranges and collision detection
// 
// Frame data structure:
// - Each attack can have frame-specific hitboxes (f1, f2, f3, etc.)
// - If a frame doesn't have specific data, it uses the previous frame's data
// - Frames are 1-indexed (f1 = first frame of the attack)

const ATTACK_HITBOXES = {
    // Light attacks - small, fast (10 total frames: 4 startup, 2 active, 4 recovery)
    light_overhead: { 
        totalFrames: 10,
        startupFrames: 4,
        activeFrames: 2,
        recoveryFrames: 4,
        frames: {
            // Startup frames - no hitbox
            f1: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f2: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f3: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f4: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            // Active frames - hitbox appears
            f5: { 
                hitbox: { width: 25, height: 15, offsetX: 15, offsetY: -10 },
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f6: { 
                hitbox: { width: 25, height: 15, offsetX: 15, offsetY: -10 },
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            // Recovery frames - hitbox disappears
            f7: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f8: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f9: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f10: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            }
        },
        description: "Fast overhead attack, small hitbox positioned high"
    },
    
    light_high: { 
        totalFrames: 10,
        startupFrames: 4,
        activeFrames: 2,
        recoveryFrames: 4,
        frames: {
            // Startup frames
            f1: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f2: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f3: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f4: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            // Active frames
            f5: { 
                hitbox: { width: 30, height: 12, offsetX: 15, offsetY: -5 },
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f6: { 
                hitbox: { width: 30, height: 12, offsetX: 15, offsetY: -5 },
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            // Recovery frames
            f7: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f8: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f9: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f10: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            }
        },
        description: "Fast high attack, small horizontal hitbox"
    },
    
    light_low: { 
        totalFrames: 10,
        startupFrames: 4,
        activeFrames: 2,
        recoveryFrames: 4,
        frames: {
            // Startup frames
            f1: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f2: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f3: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f4: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            // Active frames
            f5: { 
                hitbox: { width: 28, height: 10, offsetX: 15, offsetY: 10 },
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f6: { 
                hitbox: { width: 28, height: 10, offsetX: 15, offsetY: 10 },
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            // Recovery frames
            f7: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f8: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f9: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            },
            f10: { 
                hitbox: null,
                hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
            }
        },
        description: "Fast low attack, small hitbox positioned low"
    },
    
    // Medium attacks - medium size (16 total frames: 7 startup, 3 active, 6 recovery)
    medium_overhead: { 
        totalFrames: 16,
        startupFrames: 7,
        activeFrames: 3,
        recoveryFrames: 6,
        frames: {
            // Startup frames - gradual hitbox growth
            f1: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f2: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f3: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f4: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f5: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f6: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f7: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            // Active frames - full hitbox
            f8: { 
                hitbox: { width: 35, height: 20, offsetX: 20, offsetY: -15 },
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f9: { 
                hitbox: { width: 35, height: 20, offsetX: 20, offsetY: -15 },
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f10: { 
                hitbox: { width: 35, height: 20, offsetX: 20, offsetY: -15 },
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            // Recovery frames
            f11: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f12: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f13: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f14: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f15: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f16: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            }
        },
        description: "Medium speed overhead attack, medium hitbox positioned high"
    },
    
    medium_high: { 
        totalFrames: 16,
        startupFrames: 7,
        activeFrames: 3,
        recoveryFrames: 6,
        frames: {
            // Startup frames
            f1: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f2: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f3: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f4: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f5: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f6: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f7: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            // Active frames
            f8: { 
                hitbox: { width: 40, height: 15, offsetX: 20, offsetY: -8 },
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f9: { 
                hitbox: { width: 40, height: 15, offsetX: 20, offsetY: -8 },
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f10: { 
                hitbox: { width: 40, height: 15, offsetX: 20, offsetY: -8 },
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            // Recovery frames
            f11: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f12: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f13: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f14: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f15: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f16: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            }
        },
        description: "Medium speed high attack, medium horizontal hitbox"
    },
    
    medium_low: { 
        totalFrames: 16,
        startupFrames: 7,
        activeFrames: 3,
        recoveryFrames: 6,
        frames: {
            // Startup frames
            f1: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f2: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f3: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f4: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f5: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f6: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f7: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            // Active frames
            f8: { 
                hitbox: { width: 35, height: 12, offsetX: 20, offsetY: 12 },
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f9: { 
                hitbox: { width: 35, height: 12, offsetX: 20, offsetY: 12 },
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f10: { 
                hitbox: { width: 35, height: 12, offsetX: 20, offsetY: 12 },
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            // Recovery frames
            f11: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f12: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f13: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f14: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f15: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            },
            f16: { 
                hitbox: null,
                hurtbox: { width: 32, height: 42, offsetX: 0, offsetY: 0 }
            }
        },
        description: "Medium speed low attack, medium hitbox positioned low"
    },
    
    // Heavy attacks - large, powerful (22 total frames: 10 startup, 4 active, 8 recovery)
    heavy_overhead: { 
        totalFrames: 22,
        startupFrames: 10,
        activeFrames: 4,
        recoveryFrames: 8,
        frames: {
            // Startup frames - long windup
            f1: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f2: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f3: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f4: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f5: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f6: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f7: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f8: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f9: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f10: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            // Active frames - large, powerful hitbox
            f11: { 
                hitbox: { width: 45, height: 25, offsetX: 25, offsetY: -20 },
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f12: { 
                hitbox: { width: 45, height: 25, offsetX: 25, offsetY: -20 },
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f13: { 
                hitbox: { width: 45, height: 25, offsetX: 25, offsetY: -20 },
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f14: { 
                hitbox: { width: 45, height: 25, offsetX: 25, offsetY: -20 },
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            // Recovery frames
            f15: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f16: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f17: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f18: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f19: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f20: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f21: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f22: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            }
        },
        description: "Slow overhead attack, large hitbox positioned very high"
    },
    
    heavy_high: { 
        totalFrames: 22,
        startupFrames: 10,
        activeFrames: 4,
        recoveryFrames: 8,
        frames: {
            // Startup frames
            f1: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f2: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f3: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f4: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f5: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f6: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f7: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f8: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f9: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f10: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            // Active frames
            f11: { 
                hitbox: { width: 50, height: 18, offsetX: 25, offsetY: -10 },
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f12: { 
                hitbox: { width: 50, height: 18, offsetX: 25, offsetY: -10 },
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f13: { 
                hitbox: { width: 50, height: 18, offsetX: 25, offsetY: -10 },
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f14: { 
                hitbox: { width: 50, height: 18, offsetX: 25, offsetY: -10 },
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            // Recovery frames
            f15: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f16: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f17: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f18: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f19: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f20: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f21: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f22: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            }
        },
        description: "Slow high attack, large horizontal hitbox"
    },
    
    heavy_low: { 
        totalFrames: 22,
        startupFrames: 10,
        activeFrames: 4,
        recoveryFrames: 8,
        frames: {
            // Startup frames
            f1: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f2: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f3: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f4: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f5: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f6: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f7: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f8: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f9: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f10: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            // Active frames
            f11: { 
                hitbox: { width: 40, height: 15, offsetX: 25, offsetY: 15 },
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f12: { 
                hitbox: { width: 40, height: 15, offsetX: 25, offsetY: 15 },
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f13: { 
                hitbox: { width: 40, height: 15, offsetX: 25, offsetY: 15 },
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f14: { 
                hitbox: { width: 40, height: 15, offsetX: 25, offsetY: 15 },
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            // Recovery frames
            f15: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f16: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f17: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f18: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f19: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f20: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f21: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            },
            f22: { 
                hitbox: null,
                hurtbox: { width: 35, height: 45, offsetX: 0, offsetY: 0 }
            }
        },
        description: "Slow low attack, large hitbox positioned low"
    }
};

// Helper function to get hitbox configuration for a specific frame
function getHitboxConfig(attackType) {
    return ATTACK_HITBOXES[attackType] || null;
}

// Helper function to get frame-specific hitbox data
function getFrameHitboxData(attackType, frameNumber) {
    const config = getHitboxConfig(attackType);
    if (!config || !config.frames) return null;
    
    // Frames are 1-indexed (f1, f2, etc.)
    const frameKey = `f${frameNumber}`;
    let frameData = config.frames[frameKey];
    
    // If no specific data for this frame, use previous frame's data (fallback)
    if (!frameData) {
        for (let i = frameNumber - 1; i >= 1; i--) {
            const prevFrameKey = `f${i}`;
            if (config.frames[prevFrameKey]) {
                frameData = config.frames[prevFrameKey];
                break;
            }
        }
    }
    
    // If still no data, use default
    if (!frameData) {
        frameData = {
            hitbox: null,
            hurtbox: { width: 30, height: 40, offsetX: 0, offsetY: 0 }
        };
    }
    
    return frameData;
}

// Helper function to get total frames for an attack
function getTotalFrames(attackType) {
    const config = getHitboxConfig(attackType);
    return config ? config.totalFrames : 0;
}

// Helper function to get frame phase (startup, active, recovery)
function getFramePhase(attackType, frameNumber) {
    const config = getHitboxConfig(attackType);
    if (!config) return null;
    
    if (frameNumber <= config.startupFrames) return 'startup';
    if (frameNumber <= config.startupFrames + config.activeFrames) return 'active';
    return 'recovery';
}

// Helper function to validate hitbox configuration
function validateHitboxConfig(config) {
    if (!config) return false;
    
    const required = ['totalFrames', 'startupFrames', 'activeFrames', 'recoveryFrames', 'frames'];
    for (const prop of required) {
        if (config[prop] === undefined) return false;
    }
    
    // Validate frame data structure
    if (!config.frames || typeof config.frames !== 'object') return false;
    
    return true;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        ATTACK_HITBOXES, 
        getHitboxConfig, 
        getFrameHitboxData,
        getTotalFrames,
        getFramePhase,
        validateHitboxConfig 
    };
}

// Make functions globally available for browser usage
window.ATTACK_HITBOXES = ATTACK_HITBOXES;
window.getHitboxConfig = getHitboxConfig;
window.getFrameHitboxData = getFrameHitboxData;
window.getTotalFrames = getTotalFrames;
window.getFramePhase = getFramePhase;
window.validateHitboxConfig = validateHitboxConfig;
