/**
 * Dino Runner - Canvas Rendering Engine
 * Crisp, modern pixel-art graphics, parallax environments,
 * dynamic day/night cycle, weather systems, and power-up FX.
 */

class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Internal virtual resolution
        this.virtualWidth = 1000;
        this.virtualHeight = 400;
        this.groundY = 340;

        // Parallax environment elements
        this.clouds = [
            { x: 150, y: 55, scale: 1.1, speedMultiplier: 0.25 },
            { x: 420, y: 75, scale: 0.8, speedMultiplier: 0.20 },
            { x: 780, y: 45, scale: 1.3, speedMultiplier: 0.30 },
            { x: 1050, y: 65, scale: 0.9, speedMultiplier: 0.22 }
        ];

        this.mountains = [
            { x: 0, height: 90, color: 'rgba(180, 150, 120, 0.35)', speedMultiplier: 0.08 },
            { x: 450, height: 120, color: 'rgba(160, 130, 100, 0.45)', speedMultiplier: 0.08 },
            { x: 850, height: 80, color: 'rgba(180, 150, 120, 0.35)', speedMultiplier: 0.08 }
        ];

        this.groundPebbles = [];
        this.initGroundPebbles();

        this.stars = [];
        this.initStars();

        this.weather = 'clear'; // 'clear', 'rain', 'sandstorm'
        this.weatherParticles = [];
        this.initWeatherParticles();

        // Day/Night Cycle
        // 0.0 to 1.0 (0.0 = Noon, 0.4 = Sunset, 0.6 = Midnight, 0.9 = Dawn)
        this.dayNightCycle = 0.0;
        this.dayNightSpeed = 0.00008; // slow progression
        this.forcedTimeOfDay = 'dynamic'; // 'dynamic', 'day', 'night'

        // Floating popup notifications (+50 NEAR MISS!)
        this.floatingTexts = [];

        // Screen shake
        this.shakeTime = 0;
        this.shakeMagnitude = 0;
    }

    initGroundPebbles() {
        this.groundPebbles = [];
        for (let i = 0; i < 40; i++) {
            this.groundPebbles.push({
                x: Math.random() * this.virtualWidth,
                y: this.groundY + Math.random() * 50 + 4,
                w: Math.random() * 5 + 2,
                h: Math.random() * 2 + 1,
                color: Math.random() > 0.5 ? '#8d7965' : '#a8947f'
            });
        }
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < 65; i++) {
            this.stars.push({
                x: Math.random() * this.virtualWidth,
                y: Math.random() * (this.groundY - 120),
                radius: Math.random() * 1.5 + 0.5,
                twinkleSpeed: Math.random() * 2 + 1,
                twinkleOffset: Math.random() * Math.PI * 2
            });
        }
    }

    initWeatherParticles() {
        this.weatherParticles = [];
        for (let i = 0; i < 70; i++) {
            this.weatherParticles.push({
                x: Math.random() * this.virtualWidth,
                y: Math.random() * this.virtualHeight,
                vx: -4 - Math.random() * 3,
                vy: 9 + Math.random() * 5,
                length: Math.random() * 12 + 8,
                alpha: Math.random() * 0.4 + 0.3
            });
        }
    }

    triggerShake(magnitude = 6, duration = 0.25) {
        this.shakeMagnitude = magnitude;
        this.shakeTime = duration;
    }

    addFloatingText(text, x, y, color = '#facc15', size = 18) {
        this.floatingTexts.push({
            text,
            x,
            y,
            color,
            size,
            alpha: 1.0,
            vy: -1.2,
            life: 1.2
        });
    }

    update(dt, speed, score) {
        // Screen shake decay
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
        }

        // Day/night progression based on survival/score
        if (this.forcedTimeOfDay === 'dynamic') {
            this.dayNightCycle = (score * 0.00035) % 1.0;
        } else if (this.forcedTimeOfDay === 'day') {
            this.dayNightCycle = 0.0;
        } else if (this.forcedTimeOfDay === 'night') {
            this.dayNightCycle = 0.6;
        }

        // Parallax Clouds
        this.clouds.forEach(cloud => {
            cloud.x -= speed * cloud.speedMultiplier;
            if (cloud.x + 90 * cloud.scale < 0) {
                cloud.x = this.virtualWidth + 50 + Math.random() * 100;
                cloud.y = 35 + Math.random() * 60;
            }
        });

        // Parallax Mountains
        this.mountains.forEach(m => {
            m.x -= speed * m.speedMultiplier;
            if (m.x + 400 < 0) {
                m.x = this.virtualWidth + 100;
            }
        });

        // Scrolling Ground Pebbles
        this.groundPebbles.forEach(pebble => {
            pebble.x -= speed;
            if (pebble.x < -10) {
                pebble.x = this.virtualWidth + Math.random() * 20;
                pebble.y = this.groundY + Math.random() * 50 + 4;
            }
        });

        // Weather particles
        if (this.weather === 'rain') {
            this.weatherParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.y > this.groundY) {
                    p.y = -10;
                    p.x = Math.random() * (this.virtualWidth + 200);
                }
            });
        } else if (this.weather === 'sandstorm') {
            this.weatherParticles.forEach(p => {
                p.x -= (speed * 1.5 + 4);
                p.y += (Math.random() - 0.5) * 2;
                if (p.x < -20) {
                    p.x = this.virtualWidth + Math.random() * 40;
                    p.y = Math.random() * this.virtualHeight;
                }
            });
        }

        // Floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.alpha -= (1 / ft.life) * dt;
            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    render(dino, obstacles, powerups, particles, score, isPlaying) {
        const ctx = this.ctx;
        ctx.save();

        // Apply screen shake
        if (this.shakeTime > 0) {
            const rx = (Math.random() - 0.5) * this.shakeMagnitude;
            const ry = (Math.random() - 0.5) * this.shakeMagnitude;
            ctx.translate(rx, ry);
        }

        // 1. Draw Sky Gradient & Celestial Bodies (Sun / Moon)
        this.drawSky(ctx);

        // 2. Draw Distant Mountains
        this.drawMountains(ctx);

        // 3. Draw Parallax Clouds
        this.drawClouds(ctx);

        // 4. Draw Ground
        this.drawGround(ctx);

        // 5. Draw Obstacles
        obstacles.forEach(obs => {
            if (!obs.destroyed) this.drawObstacle(ctx, obs);
        });

        // 6. Draw Collectible Power-Ups
        powerups.forEach(pw => {
            if (!pw.collected) this.drawPowerUp(ctx, pw);
        });

        // 7. Draw Dinosaur
        this.drawDino(ctx, dino);

        // 8. Draw Particles (Dust, Sparks, Confetti, Ghost Trails)
        this.drawParticles(ctx, particles);

        // 9. Draw Weather Overlay
        this.drawWeather(ctx);

        // 10. Draw Floating Text Popups (+50 NEAR MISS!)
        this.drawFloatingTexts(ctx);

        ctx.restore();
    }

    /* =========================================================
       Sky & Parallax Rendering
       ========================================================= */
    drawSky(ctx) {
        const cycle = this.dayNightCycle;
        let topColor, bottomColor;
        let nightFactor = 0;

        if (cycle < 0.35) {
            // Full Day
            topColor = '#87ceeb';
            bottomColor = '#f5e6ca';
            nightFactor = 0;
        } else if (cycle < 0.5) {
            // Sunset / Dusk
            const t = (cycle - 0.35) / 0.15;
            topColor = this.lerpColor('#87ceeb', '#2c1e4a', t);
            bottomColor = this.lerpColor('#f5e6ca', '#f97316', t);
            nightFactor = t * 0.7;
        } else if (cycle < 0.85) {
            // Night
            topColor = '#0b0f19';
            bottomColor = '#1e1b4b';
            nightFactor = 1;
        } else {
            // Dawn / Sunrise
            const t = (cycle - 0.85) / 0.15;
            topColor = this.lerpColor('#0b0f19', '#87ceeb', t);
            bottomColor = this.lerpColor('#fb7185', '#f5e6ca', t);
            nightFactor = 1 - t;
        }

        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
        skyGrad.addColorStop(0, topColor);
        skyGrad.addColorStop(1, bottomColor);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

        // Twinkling Stars at night
        if (nightFactor > 0.1) {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            const time = performance.now() * 0.002;
            this.stars.forEach(s => {
                const alpha = nightFactor * (0.4 + 0.6 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset));
                ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        // Sun or Moon
        if (nightFactor < 0.7) {
            // Draw Sun
            const sunY = 70 + (cycle > 0.35 ? (cycle - 0.35) * 350 : 0);
            ctx.save();
            ctx.fillStyle = '#fef08a';
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 24;
            ctx.beginPath();
            ctx.arc(880, sunY, 26, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            // Draw Moon
            ctx.save();
            ctx.fillStyle = '#f8fafc';
            ctx.shadowColor = '#93c5fd';
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(860, 65, 22, 0, Math.PI * 2);
            ctx.fill();

            // Moon shadow crescent bite
            ctx.fillStyle = topColor;
            ctx.beginPath();
            ctx.arc(870, 61, 19, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawMountains(ctx) {
        ctx.save();
        this.mountains.forEach(m => {
            ctx.fillStyle = m.color;
            ctx.beginPath();
            ctx.moveTo(m.x - 150, this.groundY);
            ctx.lineTo(m.x + 100, this.groundY - m.height);
            ctx.lineTo(m.x + 350, this.groundY);
            ctx.closePath();
            ctx.fill();
        });
        ctx.restore();
    }

    drawClouds(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        this.clouds.forEach(c => {
            const w = 70 * c.scale;
            const h = 24 * c.scale;
            ctx.beginPath();
            ctx.arc(c.x, c.y, h * 0.7, 0, Math.PI * 2);
            ctx.arc(c.x + w * 0.35, c.y - h * 0.3, h * 0.85, 0, Math.PI * 2);
            ctx.arc(c.x + w * 0.65, c.y, h * 0.7, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    drawGround(ctx) {
        ctx.save();
        // Ground line
        ctx.strokeStyle = '#524536';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.lineTo(this.virtualWidth, this.groundY);
        ctx.stroke();

        // Subsurface dirt band
        const dirtGrad = ctx.createLinearGradient(0, this.groundY, 0, this.virtualHeight);
        dirtGrad.addColorStop(0, '#e5d5be');
        dirtGrad.addColorStop(1, '#c5b49d');
        ctx.fillStyle = dirtGrad;
        ctx.fillRect(0, this.groundY, this.virtualWidth, this.virtualHeight - this.groundY);

        // Ground track dash details
        ctx.fillStyle = '#6e5d4a';
        for (let x = 0; x < this.virtualWidth; x += 18) {
            if (x % 36 === 0) {
                ctx.fillRect(x, this.groundY + 3, 8, 2);
            }
        }

        // Textured pebbles
        this.groundPebbles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.w, p.h);
        });
        ctx.restore();
    }

    /* =========================================================
       Dinosaur Pixel-Art Rendering
       ========================================================= */
    drawDino(ctx, dino) {
        ctx.save();

        const x = Math.round(dino.x);
        const y = Math.round(dino.y);

        // Power-Up Glowing Aura / Boost Trail
        if (dino.boostTimer > 0) {
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 18;
            ctx.strokeStyle = '#fdba74';
            ctx.lineWidth = 2;
        }

        // Shield Energy Bubble
        if (dino.shieldActive) {
            const time = performance.now() * 0.005;
            const bubbleRadius = dino.isDucking ? 36 : 38;
            const centerX = x + dino.width / 2;
            const centerY = y + dino.height / 2;

            ctx.save();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(centerX, centerY, bubbleRadius + Math.sin(time) * 2, 0, Math.PI * 2);
            ctx.stroke();

            // Inner translucent aura
            ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
            ctx.fill();

            // Rotating hexagon shield nodes
            for (let i = 0; i < 4; i++) {
                const angle = time * 1.5 + (i * Math.PI / 2);
                const nx = centerX + Math.cos(angle) * bubbleRadius;
                const ny = centerY + Math.sin(angle) * bubbleRadius;
                ctx.fillStyle = '#bae6fd';
                ctx.beginPath();
                ctx.arc(nx, ny, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        const dinoColor = dino.boostTimer > 0 ? '#ea580c' : '#292524'; // fiery orange if boosted, charcoal otherwise
        const bellyColor = dino.boostTimer > 0 ? '#fed7aa' : '#57534e';
        ctx.fillStyle = dinoColor;

        if (dino.isDucking) {
            // Ducking pose: stretched horizontal low profile
            // Tail
            ctx.fillRect(x, y + 14, 10, 8);
            // Body
            ctx.fillRect(x + 10, y + 8, 32, 16);
            // Lower head
            ctx.fillRect(x + 38, y + 6, 20, 16);
            // Snout top
            ctx.fillRect(x + 46, y + 2, 12, 6);

            // Eye
            ctx.fillStyle = dino.isDead ? '#ef4444' : '#fafaf9';
            if (dino.isDead) {
                // 'X' dead eye
                ctx.fillRect(x + 46, y + 6, 3, 3);
            } else if (!dino.isBlinking) {
                ctx.fillRect(x + 47, y + 6, 3, 3);
            }

            // Ducking Legs (scuttling)
            ctx.fillStyle = dinoColor;
            if (dino.stepFrame === 0) {
                ctx.fillRect(x + 16, y + 24, 6, 6);
                ctx.fillRect(x + 30, y + 22, 6, 8);
            } else {
                ctx.fillRect(x + 16, y + 22, 6, 8);
                ctx.fillRect(x + 30, y + 24, 6, 6);
            }
        } else {
            // Standing / Running / Jumping pose
            // Tail
            ctx.fillRect(x, y + 24, 6, 6);
            ctx.fillRect(x + 6, y + 20, 6, 8);
            ctx.fillRect(x + 12, y + 16, 8, 14);

            // Main Torso
            ctx.fillRect(x + 14, y + 16, 20, 24);

            // Neck & Head
            ctx.fillRect(x + 24, y + 6, 12, 14);
            ctx.fillRect(x + 28, y + 0, 16, 16);
            // Snout
            ctx.fillRect(x + 34, y + 2, 12, 10);
            // Tiny Arm
            ctx.fillRect(x + 32, y + 24, 6, 4);
            ctx.fillRect(x + 36, y + 26, 4, 3);

            // Eye
            ctx.fillStyle = dino.isDead ? '#ef4444' : '#fafaf9';
            if (dino.isDead) {
                // 'X' dead eye
                ctx.fillRect(x + 36, y + 4, 4, 4);
                ctx.fillStyle = '#000000';
                ctx.fillRect(x + 37, y + 5, 2, 2);
            } else if (!dino.isBlinking) {
                ctx.fillRect(x + 36, y + 4, 4, 4);
                ctx.fillStyle = '#000000';
                ctx.fillRect(x + 38, y + 5, 2, 2);
            }

            // Legs
            ctx.fillStyle = dinoColor;
            if (dino.isGrounded) {
                // Alternating running legs
                if (dino.stepFrame === 0) {
                    // Left leg down, right leg lifted
                    ctx.fillRect(x + 18, y + 40, 5, 12);
                    ctx.fillRect(x + 18, y + 50, 8, 2);
                    // lifted
                    ctx.fillRect(x + 28, y + 40, 5, 6);
                    ctx.fillRect(x + 32, y + 44, 4, 4);
                } else {
                    // Right leg down, left leg lifted
                    ctx.fillRect(x + 28, y + 40, 5, 12);
                    ctx.fillRect(x + 28, y + 50, 8, 2);
                    // lifted
                    ctx.fillRect(x + 18, y + 40, 5, 6);
                    ctx.fillRect(x + 22, y + 44, 4, 4);
                }
            } else {
                // Jumping: both legs tucked back
                ctx.fillRect(x + 18, y + 40, 5, 7);
                ctx.fillRect(x + 23, y + 44, 4, 4);
                ctx.fillRect(x + 28, y + 40, 5, 6);
            }
        }

        ctx.restore();
    }

    /* =========================================================
       Obstacles Pixel-Art Rendering
       ========================================================= */
    drawObstacle(ctx, obs) {
        ctx.save();
        const x = Math.round(obs.x);
        const y = Math.round(obs.y);

        if (obs.kind === 'bird') {
            // Animated Flying Pterodactyl
            ctx.fillStyle = '#1e293b';

            // Body & Beak
            ctx.fillRect(x + 14, y + 14, 20, 10);
            ctx.fillRect(x + 4, y + 16, 12, 6); // Beak
            ctx.fillRect(x + 0, y + 18, 5, 3); // Beak tip

            // Eye
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(x + 12, y + 16, 2, 2);

            // Flapping Wings
            ctx.fillStyle = '#334155';
            if (obs.wingFrame === 0) {
                // Wings Up
                ctx.fillRect(x + 20, y + 2, 8, 14);
                ctx.fillRect(x + 24, y - 4, 6, 8);
                ctx.fillRect(x + 28, y - 8, 4, 6);
            } else {
                // Wings Down
                ctx.fillRect(x + 20, y + 18, 8, 12);
                ctx.fillRect(x + 24, y + 26, 6, 6);
                ctx.fillRect(x + 28, y + 30, 4, 4);
            }
        } else if (obs.kind === 'tumbleweed') {
            // Rolling Tumbleweed
            ctx.translate(x + obs.width / 2, y + obs.height / 2);
            ctx.rotate(obs.rotation);
            ctx.fillStyle = '#b45309';

            // Spiky thorny circle
            for (let i = 0; i < 8; i++) {
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-12, -2, 24, 4);
                ctx.fillRect(-2, -12, 4, 24);
            }
        } else {
            // Cactus (Crisp green with ridges & spines)
            ctx.fillStyle = '#15803d'; // Rich cactus green

            if (obs.typeKey === 'CACTUS_SMALL_1') {
                this.drawSingleCactus(ctx, x, y, obs.width, obs.height);
            } else if (obs.typeKey === 'CACTUS_SMALL_2') {
                this.drawSingleCactus(ctx, x, y, 18, obs.height);
                this.drawSingleCactus(ctx, x + 20, y + 6, 18, obs.height - 6);
            } else if (obs.typeKey === 'CACTUS_LARGE_1') {
                this.drawLargeCactus(ctx, x, y, obs.width, obs.height);
            } else if (obs.typeKey === 'CACTUS_LARGE_2') {
                this.drawLargeCactus(ctx, x, y, 24, obs.height);
                this.drawLargeCactus(ctx, x + 26, y + 8, 22, obs.height - 8);
            } else if (obs.typeKey === 'CACTUS_LARGE_3') {
                this.drawLargeCactus(ctx, x, y + 6, 22, obs.height - 6);
                this.drawLargeCactus(ctx, x + 25, y, 24, obs.height);
                this.drawLargeCactus(ctx, x + 51, y + 10, 22, obs.height - 10);
            }
        }

        ctx.restore();
    }

    drawSingleCactus(ctx, x, y, w, h) {
        // Main stalk
        ctx.fillRect(x + 6, y, w - 12, h);
        // Left arm
        ctx.fillRect(x, y + 10, 6, 12);
        ctx.fillRect(x, y + 10, 8, 4);
        // Right arm
        ctx.fillRect(x + w - 6, y + 16, 6, 12);
        ctx.fillRect(x + w - 8, y + 16, 8, 4);

        // Highlight stripe
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(x + 8, y + 2, 2, h - 4);
        ctx.fillStyle = '#15803d';
    }

    drawLargeCactus(ctx, x, y, w, h) {
        // Main stalk
        ctx.fillRect(x + 8, y, w - 16, h);
        // Left arm
        ctx.fillRect(x, y + 14, 8, 16);
        ctx.fillRect(x, y + 26, 10, 6);
        // Right arm
        ctx.fillRect(x + w - 8, y + 20, 8, 18);
        ctx.fillRect(x + w - 12, y + 32, 10, 6);

        // Ridge highlights
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(x + 10, y + 3, 2, h - 6);
        ctx.fillStyle = '#15803d';
    }

    /* =========================================================
       Power-Ups Rendering
       ========================================================= */
    drawPowerUp(ctx, pw) {
        ctx.save();
        const x = Math.round(pw.x);
        const y = Math.round(pw.y);
        const cx = x + pw.width / 2;
        const cy = y + pw.height / 2;

        let orbColor = '#38bdf8';
        let glowColor = '#38bdf8';
        let icon = '🛡️';

        if (pw.type === 'boost') {
            orbColor = '#f97316';
            glowColor = '#f97316';
            icon = '⚡';
        } else if (pw.type === 'double') {
            orbColor = '#eab308';
            glowColor = '#facc15';
            icon = '2X';
        }

        // Pulsing outer glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 14;

        // Outer ring
        ctx.strokeStyle = orbColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fill();

        // Badge / Icon
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(icon, cx, cy);

        ctx.restore();
    }

    /* =========================================================
       Particles Rendering
       ========================================================= */
    drawParticles(ctx, particleSystem) {
        ctx.save();
        particleSystem.particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.alpha);

            if (p.type === 'circle') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'shard') {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            } else if (p.type === 'star') {
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 6;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            } else if (p.type === 'confetti') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            } else if (p.type === 'dino_ghost') {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.w, p.h);
            } else if (p.type === 'sparkle') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.restore();
    }

    /* =========================================================
       Weather Overlay Rendering
       ========================================================= */
    drawWeather(ctx) {
        if (this.weather === 'rain') {
            ctx.save();
            ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            this.weatherParticles.forEach(p => {
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.vx * 1.5, p.y + p.vy * 1.5);
            });
            ctx.stroke();
            ctx.restore();
        } else if (this.weather === 'sandstorm') {
            ctx.save();
            ctx.fillStyle = 'rgba(217, 119, 6, 0.12)';
            ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
            this.weatherParticles.forEach(p => {
                ctx.fillRect(p.x, p.y, 3, 2);
            });
            ctx.restore();
        }
    }

    /* =========================================================
       Floating Text Overlay (+50 NEAR MISS!)
       ========================================================= */
    drawFloatingTexts(ctx) {
        ctx.save();
        this.floatingTexts.forEach(ft => {
            ctx.globalAlpha = Math.max(0, ft.alpha);
            ctx.font = `900 ${ft.size}px "Outfit", sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = ft.color;
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 8;
            ctx.fillText(ft.text, ft.x, ft.y);
        });
        ctx.restore();
    }

    /* Color utility */
    lerpColor(a, b, amount) {
        const ah = parseInt(a.replace(/#/g, ''), 16);
        const ar = ah >> 16, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
        const bh = parseInt(b.replace(/#/g, ''), 16);
        const br = bh >> 16, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
        const rr = ar + amount * (br - ar);
        const rg = ag + amount * (bg - ag);
        const rb = ab + amount * (bb - ab);
        return `rgb(${Math.round(rr)}, ${Math.round(rg)}, ${Math.round(rb)})`;
    }
}
