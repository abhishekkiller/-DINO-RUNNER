/**
 * Dino Runner - Game Entities & Physics
 * Dinosaur, Obstacles, Power-Ups, and High-Performance Particle Engine.
 */

// Global Game Configuration & Difficulty Tunings
const DIFFICULTY_CONFIG = {
    easy: {
        name: 'Easy',
        initialSpeed: 6.0,
        speedIncrement: 0.0006,
        maxSpeed: 11.5,
        minSpawnInterval: 1400,
        maxSpawnInterval: 2600,
        birdChance: 0.18,
        powerupChance: 0.15,
        description: 'Gentle speed, wider gaps, perfect for beginners.'
    },
    medium: {
        name: 'Medium',
        initialSpeed: 8.0,
        speedIncrement: 0.0012,
        maxSpeed: 15.0,
        minSpawnInterval: 1100,
        maxSpawnInterval: 2100,
        birdChance: 0.35,
        powerupChance: 0.12,
        description: 'Balanced challenge with varied cactus packs and birds.'
    },
    hard: {
        name: 'Hard',
        initialSpeed: 10.5,
        speedIncrement: 0.0018,
        maxSpeed: 19.0,
        minSpawnInterval: 850,
        maxSpawnInterval: 1600,
        birdChance: 0.50,
        powerupChance: 0.10,
        description: 'Rapid pace, tight gaps, aggressive low & mid flyers!'
    },
    challenge: {
        name: '60s Challenge',
        initialSpeed: 8.5,
        speedIncrement: 0.0035, // Ramps up fast over 60s
        maxSpeed: 18.5,
        minSpawnInterval: 900,
        maxSpawnInterval: 1800,
        birdChance: 0.40,
        powerupChance: 0.14,
        description: '60 seconds on the clock! Maximum points sprint.'
    }
};

/* =========================================================
   Dinosaur Player Class
   ========================================================= */
class Dinosaur {
    constructor(groundY) {
        this.groundY = groundY;
        this.reset();
    }

    reset() {
        this.baseWidth = 46;
        this.baseHeight = 52;
        this.duckWidth = 60;
        this.duckHeight = 30;

        this.width = this.baseWidth;
        this.height = this.baseHeight;

        this.x = 75;
        this.y = this.groundY - this.height;

        this.vy = 0;
        this.gravity = 0.68;
        this.jumpForce = -13.2;
        this.minJumpReleaseVelocity = -4.5;
        this.fastFallGravity = 1.4;

        this.isGrounded = true;
        this.isJumping = false;
        this.isDucking = false;
        this.isDead = false;

        // Animations
        this.stepTimer = 0;
        this.stepFrame = 0; // 0 or 1
        this.blinkTimer = Math.random() * 200 + 100;
        this.isBlinking = false;
        this.dustTimer = 0;

        // Power-ups
        this.shieldActive = false;
        this.boostTimer = 0; // in seconds
        this.doubleScoreTimer = 0; // in seconds

        // Stats
        this.jumpsCount = 0;
        this.ducksCount = 0;
        this.nearMissCount = 0;
    }

    jump(soundManager) {
        if (this.isGrounded && !this.isDead) {
            this.vy = this.jumpForce;
            this.isGrounded = false;
            this.isJumping = true;
            this.isDucking = false;
            this.jumpsCount++;
            if (soundManager) soundManager.playJump();
            return true;
        }
        return false;
    }

    endJumpEarly() {
        // Variable jump height: releasing key cuts upwards momentum
        if (!this.isGrounded && this.vy < this.minJumpReleaseVelocity) {
            this.vy = this.minJumpReleaseVelocity;
        }
    }

    duck(isDucking, soundManager) {
        if (this.isDead) return;

        if (isDucking) {
            if (!this.isDucking && this.isGrounded && soundManager) {
                soundManager.playDuck();
                this.ducksCount++;
            }
            this.isDucking = true;
            this.width = this.duckWidth;
            this.height = this.duckHeight;
            if (this.isGrounded) {
                this.y = this.groundY - this.height;
            }
        } else {
            this.isDucking = false;
            this.width = this.baseWidth;
            this.height = this.baseHeight;
            if (this.isGrounded) {
                this.y = this.groundY - this.height;
            }
        }
    }

    update(dt, speed, particleSystem, soundManager) {
        if (this.isDead) return;

        // Update active powerups
        if (this.boostTimer > 0) {
            this.boostTimer = Math.max(0, this.boostTimer - dt);
            if (particleSystem && Math.random() < 0.6) {
                particleSystem.addBoostGhost(this.x, this.y, this.width, this.height, this.isDucking);
            }
        }
        if (this.doubleScoreTimer > 0) {
            this.doubleScoreTimer = Math.max(0, this.doubleScoreTimer - dt);
        }

        // Apply fast-fall gravity when ducking in midair
        const currentGravity = (this.isDucking && !this.isGrounded) ? this.fastFallGravity : this.gravity;
        this.vy += currentGravity;
        this.y += this.vy;

        // Floor collision
        const currentTargetHeight = this.isDucking ? this.duckHeight : this.baseHeight;
        const targetFloor = this.groundY - currentTargetHeight;

        if (this.y >= targetFloor) {
            this.y = targetFloor;
            this.vy = 0;
            if (!this.isGrounded) {
                // Just landed
                this.isGrounded = true;
                this.isJumping = false;
                if (particleSystem) {
                    particleSystem.addLandingPuff(this.x + this.width / 2, this.groundY);
                }
            }
        } else {
            this.isGrounded = false;
        }

        // Running animation step
        if (this.isGrounded) {
            this.stepTimer += dt * speed * 2.8;
            if (this.stepTimer >= 1) {
                this.stepFrame = (this.stepFrame + 1) % 2;
                this.stepTimer = 0;
            }

            // Running foot dust
            this.dustTimer += dt * speed;
            if (this.dustTimer > 4.5 && particleSystem) {
                this.dustTimer = 0;
                particleSystem.addRunDust(this.x + 8, this.groundY - 3);
            }
        }

        // Blinking eye animation
        this.blinkTimer -= dt * 60;
        if (this.blinkTimer <= 0) {
            this.isBlinking = !this.isBlinking;
            this.blinkTimer = this.isBlinking ? 8 : (Math.random() * 220 + 80);
        }
    }

    getHitboxes() {
        // Multi-box collision detection for pixel-fair gameplay
        if (this.isDucking) {
            return [
                // Low horizontal body box
                { x: this.x + 4, y: this.y + 6, w: this.width - 8, h: this.height - 8 },
                // Low head box sticking forward
                { x: this.x + this.width - 16, y: this.y + 2, w: 14, h: 18 }
            ];
        } else {
            return [
                // Torso & Hips
                { x: this.x + 10, y: this.y + 16, w: 24, h: 26 },
                // Head and Snout
                { x: this.x + 22, y: this.y + 2, w: 22, h: 20 },
                // Feet / Legs
                { x: this.x + 14, y: this.y + 36, w: 16, h: 14 }
            ];
        }
    }

    breakShield(particleSystem, soundManager) {
        this.shieldActive = false;
        if (soundManager) soundManager.playShieldBreak();
        if (particleSystem) particleSystem.addShieldBreakBurst(this.x + this.width / 2, this.y + this.height / 2);
    }
}

/* =========================================================
   Obstacle System (Cacti, Birds, Tumbleweeds)
   ========================================================= */
const OBSTACLE_TYPES = {
    CACTUS_SMALL_1: { kind: 'cactus', width: 22, height: 40, yOffset: 0 },
    CACTUS_SMALL_2: { kind: 'cactus', width: 38, height: 40, yOffset: 0 },
    CACTUS_LARGE_1: { kind: 'cactus', width: 28, height: 55, yOffset: 0 },
    CACTUS_LARGE_2: { kind: 'cactus', width: 50, height: 55, yOffset: 0 },
    CACTUS_LARGE_3: { kind: 'cactus', width: 74, height: 55, yOffset: 0 },
    BIRD_LOW: { kind: 'bird', width: 44, height: 32, yOffset: 34 }, // duck under! (bottom at 274-306, dino ducks at 310)
    BIRD_MID: { kind: 'bird', width: 44, height: 32, yOffset: 8 },  // jump over! (bottom at 300-332, must leap)
    BIRD_HIGH: { kind: 'bird', width: 44, height: 32, yOffset: 58 }, // run under freely! (bottom at 250-282, standing dino top is 288)
    TUMBLEWEED: { kind: 'tumbleweed', width: 30, height: 30, yOffset: 0 }
};

class Obstacle {
    constructor(typeKey, groundY, canvasWidth, customSpeed = null) {
        this.typeKey = typeKey;
        const config = OBSTACLE_TYPES[typeKey];
        this.kind = config.kind;
        this.width = config.width;
        this.height = config.height;
        this.groundY = groundY;

        this.x = canvasWidth + 10;
        this.y = groundY - config.height - (config.yOffset || 0);

        // Birds fly slightly faster and flap wings
        this.flySpeedBonus = this.kind === 'bird' ? (customSpeed ? customSpeed * 0.15 : 1.2) : 0;
        this.wingTimer = 0;
        this.wingFrame = 0;

        // Tumbleweed rolling angle
        this.rotation = 0;

        // Near-miss & scoring flags
        this.passed = false;
        this.nearMissAwarded = false;
        this.destroyed = false;
    }

    update(dt, baseSpeed) {
        const speed = baseSpeed + this.flySpeedBonus;
        this.x -= speed;

        if (this.kind === 'bird') {
            this.wingTimer += dt * 9;
            if (this.wingTimer >= 1) {
                this.wingFrame = (this.wingFrame + 1) % 2;
                this.wingTimer = 0;
            }
        } else if (this.kind === 'tumbleweed') {
            this.rotation += 0.08 * (baseSpeed / 8);
        }
    }

    getHitboxes() {
        if (this.kind === 'bird') {
            return [
                { x: this.x + 8, y: this.y + 8, w: this.width - 16, h: this.height - 14 },
                { x: this.x + 2, y: this.y + (this.wingFrame === 0 ? 4 : 14), w: 14, h: 12 }
            ];
        } else if (this.kind === 'tumbleweed') {
            return [
                { x: this.x + 4, y: this.y + 4, w: this.width - 8, h: this.height - 8 }
            ];
        } else {
            // Cactus stalk & branches
            return [
                { x: this.x + 3, y: this.y + 2, w: this.width - 6, h: this.height - 2 }
            ];
        }
    }

    getNearMissBox() {
        // Generous near-miss trigger perimeter
        const margin = 18;
        return {
            x: this.x - margin,
            y: this.y - margin,
            w: this.width + margin * 2,
            h: this.height + margin * 2
        };
    }
}

/* =========================================================
   Power-Up System (Shield, Speed Boost, Double Score)
   ========================================================= */
class PowerUp {
    constructor(type, groundY, canvasWidth, spawnInAir = false) {
        this.type = type; // 'shield', 'boost', 'double'
        this.width = 28;
        this.height = 28;
        this.x = canvasWidth + 20;

        const baseElevation = spawnInAir ? 65 : 12;
        this.baseY = groundY - this.height - baseElevation;
        this.y = this.baseY;

        this.bobTime = Math.random() * Math.PI * 2;
        this.collected = false;
        this.sparkleTimer = 0;
    }

    update(dt, speed, particleSystem) {
        this.x -= speed;
        this.bobTime += dt * 4;
        this.y = this.baseY + Math.sin(this.bobTime) * 6;

        this.sparkleTimer += dt;
        if (this.sparkleTimer > 0.12 && particleSystem) {
            this.sparkleTimer = 0;
            particleSystem.addPowerUpSparkle(this.x + this.width / 2, this.y + this.height / 2, this.type);
        }
    }

    getHitbox() {
        return { x: this.x, y: this.y, w: this.width, h: this.height };
    }
}

/* =========================================================
   High-Performance Particle Engine
   ========================================================= */
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 300;
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity || 0;
            p.alpha -= p.fadeRate * dt;
            p.life -= dt;

            if (p.alpha <= 0 || p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    clear() {
        this.particles = [];
    }

    addRunDust(x, y) {
        if (this.particles.length >= this.maxParticles) return;
        this.particles.push({
            x: x + (Math.random() * 6 - 3),
            y: y + (Math.random() * 2 - 1),
            vx: -(Math.random() * 1.8 + 1.2),
            vy: -(Math.random() * 0.8 + 0.2),
            size: Math.random() * 3 + 2,
            color: '#a38f78',
            alpha: 0.7,
            fadeRate: 1.6,
            life: 0.5,
            type: 'circle'
        });
    }

    addLandingPuff(x, y) {
        for (let i = 0; i < 8; i++) {
            const dir = i % 2 === 0 ? -1 : 1;
            this.particles.push({
                x: x + dir * 6,
                y: y - 2,
                vx: dir * (Math.random() * 2.5 + 1.2),
                vy: -(Math.random() * 1.2 + 0.3),
                size: Math.random() * 4 + 2,
                color: '#bfae9b',
                alpha: 0.8,
                fadeRate: 1.5,
                life: 0.6,
                type: 'circle'
            });
        }
    }

    addBoostGhost(x, y, w, h, isDucking) {
        const colors = ['#00f0ff', '#ff0077', '#ffe600', '#00ff88'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        this.particles.push({
            x: x,
            y: y,
            w: w,
            h: h,
            vx: -3.5,
            vy: 0,
            isDucking: isDucking,
            color: color,
            alpha: 0.5,
            fadeRate: 2.2,
            life: 0.3,
            type: 'dino_ghost'
        });
    }

    addPowerUpSparkle(x, y, type) {
        const color = type === 'shield' ? '#38bdf8' : (type === 'boost' ? '#f97316' : '#facc15');
        this.particles.push({
            x: x + (Math.random() * 16 - 8),
            y: y + (Math.random() * 16 - 8),
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            size: Math.random() * 3 + 1.5,
            color: color,
            alpha: 0.9,
            fadeRate: 2.0,
            life: 0.45,
            type: 'sparkle'
        });
    }

    addNearMissSparkles(x, y) {
        for (let i = 0; i < 14; i++) {
            const angle = (Math.PI * 2 * i) / 14 + (Math.random() * 0.3);
            const speed = Math.random() * 3.5 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0.08,
                size: Math.random() * 3 + 2,
                color: '#fef08a',
                alpha: 1.0,
                fadeRate: 1.4,
                life: 0.7,
                type: 'star'
            });
        }
    }

    addShieldBreakBurst(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0.12,
                size: Math.random() * 4 + 2,
                color: '#38bdf8',
                alpha: 1.0,
                fadeRate: 1.2,
                life: 0.8,
                type: 'shard'
            });
        }
    }

    addDestructionBurst(x, y, kind) {
        const count = 16;
        const color = kind === 'cactus' ? '#22c55e' : (kind === 'bird' ? '#ef4444' : '#d97706');
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5.5 + 1.5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5,
                gravity: 0.2,
                size: Math.random() * 4 + 2,
                color: color,
                alpha: 1.0,
                fadeRate: 1.0,
                life: 0.9,
                type: 'shard'
            });
        }
    }

    addConfettiBurst(canvasWidth, canvasHeight) {
        const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        for (let i = 0; i < 70; i++) {
            this.particles.push({
                x: canvasWidth / 2 + (Math.random() * 300 - 150),
                y: canvasHeight / 3 + (Math.random() * 100 - 50),
                vx: (Math.random() - 0.5) * 8,
                vy: -(Math.random() * 6 + 3),
                gravity: 0.18,
                w: Math.random() * 6 + 4,
                h: Math.random() * 8 + 4,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1.0,
                fadeRate: 0.35,
                life: 2.5,
                type: 'confetti'
            });
        }
    }
}
