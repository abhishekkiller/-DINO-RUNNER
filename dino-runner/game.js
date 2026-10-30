/**
 * Dino Runner - Core Game Engine
 * State machine, physics loop, input handlers, collision detection,
 * challenge mode, combo system, and UI event binding.
 */

class DinoGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new GameRenderer(this.canvas);
        this.sound = window.audioManager;
        this.storage = window.storageManager;
        this.particles = new ParticleSystem();

        // High DPI canvas configuration
        this.setupCanvasDPI();
        window.addEventListener('resize', () => this.setupCanvasDPI());

        // Game State
        this.STATE = {
            MENU: 'MENU',
            COUNTDOWN: 'COUNTDOWN',
            PLAYING: 'PLAYING',
            PAUSED: 'PAUSED',
            GAMEOVER: 'GAMEOVER'
        };
        this.state = this.STATE.MENU;

        // Game Configuration & Modes
        this.difficulty = 'medium'; // 'easy', 'medium', 'hard'
        this.gameMode = 'endless';  // 'endless', 'challenge', 'daily'

        // Dinosaur Player
        this.dino = new Dinosaur(this.renderer.groundY);

        // Obstacles & Power-Ups
        this.obstacles = [];
        this.powerups = [];
        this.nextSpawnDistance = 800;
        this.distanceSinceLastSpawn = 0;
        this.powerupCooldown = 0;

        // Dynamics & Score
        this.speed = 8.0;
        this.score = 0;
        this.highScore = 0;
        this.distance = 0;
        this.combo = 1.0;
        this.comboTimer = 0;
        this.obstaclesClearedInCombo = 0;
        this.powerupsCollectedRun = 0;
        this.nearMissesThisRun = 0;
        this.lowBirdsDuckedRun = 0;

        // 60-Second Challenge Mode variables
        this.challengeTimer = 60.0;
        this.lastWarningSecond = 6;
        this.countdownValue = 3;
        this.countdownTimer = 0;

        // Loop timing
        this.lastFrameTime = performance.now();
        this.animationFrameId = null;

        // Input Tracking
        this.keys = {};
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Initialize UI & Event Listeners
        this.initDOMReferences();
        this.bindEvents();
        this.applySavedSettings();
        this.loadPlayerProfile();
        this.updateMenuHighScoreDisplay();

        // Start animation frame loop
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    setupCanvasDPI() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Maintain 1000x400 virtual coordinates
        this.canvas.width = 1000 * dpr;
        this.canvas.height = 400 * dpr;

        const ctx = this.canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = false; // Crisp retro pixel graphics
    }

    /* =========================================================
       DOM Elements & UI Bindings
       ========================================================= */
    initDOMReferences() {
        // Screens & Overlays
        this.ui = {
            mainMenu: document.getElementById('mainMenuOverlay'),
            countdownOverlay: document.getElementById('countdownOverlay'),
            countdownText: document.getElementById('countdownText'),
            hud: document.getElementById('gameHud'),
            pauseOverlay: document.getElementById('pauseOverlay'),
            gameOverModal: document.getElementById('gameOverModal'),
            leaderboardModal: document.getElementById('leaderboardModal'),
            howToPlayModal: document.getElementById('howToPlayModal'),
            achievementsModal: document.getElementById('achievementsModal'),
            settingsModal: document.getElementById('settingsModal'),
            confirmClearModal: document.getElementById('confirmClearModal'),
            toastContainer: document.getElementById('toastContainer'),

            // HUD Elements
            hudScore: document.getElementById('hudScore'),
            hudHighScore: document.getElementById('hudHighScore'),
            hudDifficultyBadge: document.getElementById('hudDifficultyBadge'),
            hudModeBadge: document.getElementById('hudModeBadge'),
            hudComboBadge: document.getElementById('hudComboBadge'),
            hudComboMultiplier: document.getElementById('hudComboMultiplier'),
            hudChallengeTimer: document.getElementById('hudChallengeTimer'),
            hudTimerSeconds: document.getElementById('hudTimerSeconds'),
            hudPowerupShield: document.getElementById('hudPowerupShield'),
            hudPowerupBoost: document.getElementById('hudPowerupBoost'),
            hudPowerupDouble: document.getElementById('hudPowerupDouble'),
            boostProgress: document.getElementById('boostProgress'),
            doubleProgress: document.getElementById('doubleProgress'),
            btnPause: document.getElementById('btnPause'),
            btnSoundToggle: document.getElementById('btnSoundToggle'),

            // Main Menu Elements
            playerNameInput: document.getElementById('playerNameInput'),
            menuHighScore: document.getElementById('menuHighScore'),
            btnPlayEndless: document.getElementById('btnPlayEndless'),
            btnPlayChallenge: document.getElementById('btnPlayChallenge'),
            btnPlayDaily: document.getElementById('btnPlayDaily'),
            btnLeaderboard: document.getElementById('btnLeaderboard'),
            btnHowToPlay: document.getElementById('btnHowToPlay'),
            btnAchievements: document.getElementById('btnAchievements'),
            btnSettings: document.getElementById('btnSettings'),
            diffButtons: document.querySelectorAll('.diff-btn'),

            // Mobile Virtual Controls
            touchControls: document.getElementById('touchControls'),
            btnTouchJump: document.getElementById('btnTouchJump'),
            btnTouchDuck: document.getElementById('btnTouchDuck'),

            // Game Over Elements
            gameOverTitle: document.getElementById('gameOverTitle'),
            finalScoreValue: document.getElementById('finalScoreValue'),
            bestScoreValue: document.getElementById('bestScoreValue'),
            goDifficultyValue: document.getElementById('goDifficultyValue'),
            goModeValue: document.getElementById('goModeValue'),
            goRankValue: document.getElementById('goRankValue'),
            newHighScoreBanner: document.getElementById('newHighScoreBanner'),
            btnPlayAgain: document.getElementById('btnPlayAgain'),
            btnGoHome: document.getElementById('btnGoHome'),
            btnShareScore: document.getElementById('btnShareScore'),
            btnGoLeaderboard: document.getElementById('btnGoLeaderboard'),

            // Pause Menu Elements
            btnResume: document.getElementById('btnResume'),
            btnRestart: document.getElementById('btnRestart'),
            btnPauseHome: document.getElementById('btnPauseHome'),
            btnPauseSoundToggle: document.getElementById('btnPauseSoundToggle'),

            // Leaderboard Elements
            leaderboardTabs: document.querySelectorAll('.lb-tab-btn'),
            leaderboardBody: document.getElementById('leaderboardBody'),
            btnClearLeaderboard: document.getElementById('btnClearLeaderboard'),
            btnCloseLeaderboard: document.getElementById('btnCloseLeaderboard'),
            btnConfirmClearYes: document.getElementById('btnConfirmClearYes'),
            btnConfirmClearNo: document.getElementById('btnConfirmClearNo'),

            // Settings Elements
            settingMasterVol: document.getElementById('settingMasterVol'),
            settingSfxVol: document.getElementById('settingSfxVol'),
            settingBgmVol: document.getElementById('settingBgmVol'),
            settingShake: document.getElementById('settingShake'),
            settingParticles: document.getElementById('settingParticles'),
            settingTimeOfDay: document.getElementById('settingTimeOfDay'),
            btnCloseSettings: document.getElementById('btnCloseSettings'),
            btnCloseHowToPlay: document.getElementById('btnCloseHowToPlay'),
            btnCloseAchievements: document.getElementById('btnCloseAchievements'),
            achievementsListContainer: document.getElementById('achievementsListContainer')
        };
    }

    bindEvents() {
        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if (this.keys[e.code]) return; // prevent key repeat
            this.keys[e.code] = true;

            // Unlock Web Audio on first gesture
            this.sound.resume();

            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                if (this.state === 'PLAYING') {
                    e.preventDefault();
                    if (this.dino.jump(this.sound)) {
                        this.triggerAchievement('first_jump');
                    }
                } else if (this.state === 'MENU') {
                    e.preventDefault();
                    this.startCountdown();
                } else if (this.state === 'GAMEOVER') {
                    e.preventDefault();
                    this.startCountdown();
                }
            } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                if (this.state === 'PLAYING') {
                    e.preventDefault();
                    this.dino.duck(true, this.sound);
                }
            } else if (e.code === 'KeyP' || e.code === 'Escape') {
                e.preventDefault();
                this.togglePause();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;

            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                if (this.state === 'PLAYING') {
                    this.dino.endJumpEarly();
                }
            } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                if (this.state === 'PLAYING') {
                    this.dino.duck(false, this.sound);
                }
            }
        });

        // Mouse & Touch Controls on Canvas
        this.canvas.addEventListener('mousedown', (e) => {
            this.sound.resume();
            if (this.state === 'PLAYING') {
                if (this.dino.jump(this.sound)) {
                    this.triggerAchievement('first_jump');
                }
            }
        });

        // Touch gestures on mobile
        let touchStartY = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            this.sound.resume();
            if (e.touches.length > 0) {
                touchStartY = e.touches[0].clientY;
            }
            if (this.state === 'PLAYING') {
                if (this.dino.jump(this.sound)) {
                    this.triggerAchievement('first_jump');
                }
            }
        }, { passive: true });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0 && this.state === 'PLAYING') {
                const currentY = e.touches[0].clientY;
                if (currentY - touchStartY > 35) {
                    // Swipe down detected -> duck!
                    this.dino.duck(true, this.sound);
                }
            }
        }, { passive: true });

        this.canvas.addEventListener('touchend', () => {
            if (this.state === 'PLAYING') {
                this.dino.endJumpEarly();
                this.dino.duck(false, this.sound);
            }
        }, { passive: true });

        // Virtual Touch Buttons
        if (this.ui.btnTouchJump) {
            this.ui.btnTouchJump.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.sound.resume();
                if (this.state === 'PLAYING') {
                    this.dino.jump(this.sound);
                    this.triggerAchievement('first_jump');
                }
            });
            this.ui.btnTouchJump.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (this.state === 'PLAYING') this.dino.endJumpEarly();
            });
        }

        if (this.ui.btnTouchDuck) {
            this.ui.btnTouchDuck.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.sound.resume();
                if (this.state === 'PLAYING') this.dino.duck(true, this.sound);
            });
            this.ui.btnTouchDuck.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (this.state === 'PLAYING') this.dino.duck(false, this.sound);
            });
        }

        // Main Menu Buttons
        this.ui.btnPlayEndless.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.gameMode = 'endless';
            this.savePlayerName();
            this.startCountdown();
        });

        this.ui.btnPlayChallenge.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.gameMode = 'challenge';
            this.savePlayerName();
            this.startCountdown();
        });

        this.ui.btnPlayDaily.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.gameMode = 'daily';
            this.savePlayerName();
            this.startCountdown();
        });

        // Difficulty Buttons
        this.ui.diffButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.sound.playButtonClick();
                const diff = btn.getAttribute('data-diff');
                this.setDifficulty(diff);
            });
        });

        // HUD Buttons
        this.ui.btnPause.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.togglePause();
        });

        this.ui.btnSoundToggle.addEventListener('click', () => {
            const enabled = this.sound.toggleSfx();
            this.sound.toggleBgm();
            this.updateSoundIcons(enabled);
        });

        // Pause Menu Buttons
        this.ui.btnResume.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.togglePause();
        });

        this.ui.btnRestart.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.ui.pauseOverlay.classList.add('hidden');
            this.startCountdown();
        });

        this.ui.btnPauseHome.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.returnToMenu();
        });

        this.ui.btnPauseSoundToggle.addEventListener('click', () => {
            const enabled = this.sound.toggleSfx();
            this.sound.toggleBgm();
            this.updateSoundIcons(enabled);
        });

        // Game Over Buttons
        this.ui.btnPlayAgain.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.ui.gameOverModal.classList.add('hidden');
            this.startCountdown();
        });

        this.ui.btnGoHome.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.returnToMenu();
        });

        this.ui.btnShareScore.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.shareScore();
        });

        this.ui.btnGoLeaderboard.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.openLeaderboard(this.gameMode === 'challenge' ? 'challenge' : this.difficulty);
        });

        // Modal Open Buttons
        this.ui.btnLeaderboard.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.openLeaderboard(this.difficulty);
        });

        this.ui.btnHowToPlay.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.ui.howToPlayModal.classList.remove('hidden');
        });

        this.ui.btnAchievements.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.openAchievements();
        });

        this.ui.btnSettings.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.openSettings();
        });

        // Modal Close Buttons
        this.ui.btnCloseLeaderboard.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.ui.leaderboardModal.classList.add('hidden');
        });

        this.ui.btnCloseHowToPlay.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.ui.howToPlayModal.classList.add('hidden');
        });

        this.ui.btnCloseAchievements.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.ui.achievementsModal.classList.add('hidden');
        });

        this.ui.btnCloseSettings.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.ui.settingsModal.classList.add('hidden');
        });

        // Leaderboard Tabs
        this.ui.leaderboardTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.sound.playButtonClick();
                this.ui.leaderboardTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const cat = tab.getAttribute('data-cat');
                this.renderLeaderboardTable(cat);
            });
        });

        // Leaderboard Clear & Confirm
        this.ui.btnClearLeaderboard.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.ui.confirmClearModal.classList.remove('hidden');
        });

        this.ui.btnConfirmClearYes.addEventListener('click', () => {
            this.sound.playButtonClick();
            const activeTab = document.querySelector('.lb-tab-btn.active');
            const cat = activeTab ? activeTab.getAttribute('data-cat') : 'all';
            this.storage.clearLeaderboard(cat);
            this.ui.confirmClearModal.classList.add('hidden');
            this.renderLeaderboardTable(cat);
            this.updateMenuHighScoreDisplay();
            this.showToast('Leaderboard Cleared', 'Scores for this category have been reset.', '🗑️');
        });

        this.ui.btnConfirmClearNo.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.ui.confirmClearModal.classList.add('hidden');
        });

        // Settings Sliders & Inputs
        this.ui.settingMasterVol.addEventListener('input', (e) => {
            this.sound.setMasterVolume(parseFloat(e.target.value));
        });
        this.ui.settingSfxVol.addEventListener('input', (e) => {
            this.sound.setSfxVolume(parseFloat(e.target.value));
        });
        this.ui.settingBgmVol.addEventListener('input', (e) => {
            this.sound.setBgmVolume(parseFloat(e.target.value));
        });
        this.ui.settingShake.addEventListener('change', (e) => {
            this.storage.saveSettings({ screenShake: e.target.checked });
        });
        this.ui.settingParticles.addEventListener('change', (e) => {
            this.storage.saveSettings({ particles: e.target.checked });
        });
        this.ui.settingTimeOfDay.addEventListener('change', (e) => {
            const val = e.target.value;
            this.renderer.forcedTimeOfDay = val;
            this.storage.saveSettings({ timeOfDay: val });
        });

        // Player Name Save on Blur
        this.ui.playerNameInput.addEventListener('change', () => {
            this.savePlayerName();
        });
    }

    loadPlayerProfile() {
        const savedName = this.storage.getPlayerName();
        if (this.ui.playerNameInput) {
            this.ui.playerNameInput.value = savedName;
        }
    }

    savePlayerName() {
        if (this.ui.playerNameInput) {
            this.storage.setPlayerName(this.ui.playerNameInput.value);
        }
    }

    applySavedSettings() {
        const s = this.storage.getSettings();
        if (this.ui.settingMasterVol) this.ui.settingMasterVol.value = this.sound.masterVolume;
        if (this.ui.settingSfxVol) this.ui.settingSfxVol.value = this.sound.sfxVolume;
        if (this.ui.settingBgmVol) this.ui.settingBgmVol.value = this.sound.bgmVolume;
        if (this.ui.settingShake) this.ui.settingShake.checked = s.screenShake !== false;
        if (this.ui.settingParticles) this.ui.settingParticles.checked = s.particles !== false;
        if (this.ui.settingTimeOfDay) {
            this.ui.settingTimeOfDay.value = s.timeOfDay || 'dynamic';
            this.renderer.forcedTimeOfDay = s.timeOfDay || 'dynamic';
        }
        if (s.difficulty) {
            this.setDifficulty(s.difficulty);
        }
    }

    setDifficulty(diff) {
        if (!DIFFICULTY_CONFIG[diff]) return;
        this.difficulty = diff;
        this.storage.saveSettings({ difficulty: diff });

        this.ui.diffButtons.forEach(btn => {
            if (btn.getAttribute('data-diff') === diff) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.updateMenuHighScoreDisplay();
    }

    updateMenuHighScoreDisplay() {
        const currentCategory = this.gameMode === 'challenge' ? 'challenge' : this.difficulty;
        const hs = this.storage.getHighScore(currentCategory);
        if (this.ui.menuHighScore) {
            this.ui.menuHighScore.textContent = hs.toLocaleString();
        }
    }

    updateSoundIcons(enabled) {
        const icon = enabled ? '🔊' : '🔇';
        if (this.ui.btnSoundToggle) this.ui.btnSoundToggle.textContent = icon;
        if (this.ui.btnPauseSoundToggle) this.ui.btnPauseSoundToggle.textContent = enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
    }

    /* =========================================================
       Game Flow & State Machine
       ========================================================= */
    startCountdown() {
        this.savePlayerName();
        this.state = this.STATE.COUNTDOWN;
        this.countdownValue = 3;
        this.countdownTimer = 1.0;

        // Hide overlays
        this.ui.mainMenu.classList.add('hidden');
        this.ui.gameOverModal.classList.add('hidden');
        this.ui.pauseOverlay.classList.add('hidden');
        this.ui.countdownOverlay.classList.remove('hidden');
        this.ui.countdownText.textContent = '3';
        this.ui.countdownText.className = 'countdown-anim';

        // Prepare Game State
        this.resetGameData();

        // Sound cue
        this.sound.playCountdownBeep();
    }

    resetGameData() {
        const activeConfig = (this.gameMode === 'challenge')
            ? DIFFICULTY_CONFIG.challenge
            : DIFFICULTY_CONFIG[this.difficulty];

        this.speed = activeConfig.initialSpeed;
        this.score = 0;
        this.distance = 0;
        this.combo = 1.0;
        this.comboTimer = 0;
        this.obstaclesClearedInCombo = 0;
        this.powerupsCollectedRun = 0;
        this.nearMissesThisRun = 0;
        this.lowBirdsDuckedRun = 0;

        this.challengeTimer = 60.0;
        this.lastWarningSecond = 6;

        this.obstacles = [];
        this.powerups = [];
        this.nextSpawnDistance = 600;
        this.distanceSinceLastSpawn = 0;
        this.powerupCooldown = 400;

        this.dino.reset();
        this.particles.clear();

        // High score for this mode/difficulty
        const cat = this.gameMode === 'challenge' ? 'challenge' : this.difficulty;
        this.highScore = this.storage.getHighScore(cat);

        // Daily Challenge weather / seed
        if (this.gameMode === 'daily') {
            const todayStr = new Date().toISOString().split('T')[0];
            const hash = todayStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const weathers = ['clear', 'rain', 'sandstorm'];
            this.renderer.weather = weathers[hash % weathers.length];
        } else {
            this.renderer.weather = 'clear';
        }

        this.updateHUD();
    }

    beginPlaying() {
        this.state = this.STATE.PLAYING;
        this.ui.countdownOverlay.classList.add('hidden');
        this.ui.hud.classList.remove('hidden');

        if (this.isTouchDevice) {
            this.ui.touchControls.classList.remove('hidden');
        }

        // Start dynamic background music
        this.sound.setBgmTempo(this.speed / 8.0);
        this.sound.startBgm();
    }

    togglePause() {
        if (this.state === this.STATE.PLAYING) {
            this.state = this.STATE.PAUSED;
            this.ui.pauseOverlay.classList.remove('hidden');
            this.sound.stopBgm();
        } else if (this.state === this.STATE.PAUSED) {
            this.state = this.STATE.PLAYING;
            this.ui.pauseOverlay.classList.add('hidden');
            this.lastFrameTime = performance.now();
            this.sound.startBgm();
        }
    }

    returnToMenu() {
        this.state = this.STATE.MENU;
        this.sound.stopBgm();
        this.ui.pauseOverlay.classList.add('hidden');
        this.ui.gameOverModal.classList.add('hidden');
        this.ui.hud.classList.add('hidden');
        this.ui.touchControls.classList.add('hidden');
        this.ui.mainMenu.classList.remove('hidden');
        this.updateMenuHighScoreDisplay();
    }

    gameOver(reason = 'collision') {
        if (this.state === this.STATE.GAMEOVER) return;
        this.state = this.STATE.GAMEOVER;

        this.dino.isDead = true;
        this.sound.stopBgm();

        // Screen Shake & Hit FX
        const settings = this.storage.getSettings();
        if (settings.screenShake !== false) {
            this.renderer.triggerShake(12, 0.4);
        }

        if (reason === 'timeout') {
            this.sound.playTimeUp();
            this.ui.gameOverTitle.textContent = "⏱️ TIME'S UP!";
            this.triggerAchievement('challenge_survivor');
        } else {
            this.sound.playHit();
            this.ui.gameOverTitle.textContent = "GAME OVER";
        }

        // Save score and add to leaderboard
        const category = this.gameMode === 'challenge' ? 'challenge' : this.difficulty;
        const playerName = this.storage.getPlayerName();
        const lbResult = this.storage.addLeaderboardScore(category, playerName, this.score, this.difficulty, this.gameMode);

        const isNewRecord = this.score > this.highScore;
        if (isNewRecord) {
            this.particles.addConfettiBurst(this.renderer.virtualWidth, this.renderer.virtualHeight);
            this.sound.playAchievement();
        }

        // Check score milestones
        if (this.score >= 500) this.triggerAchievement('score_500');
        if (this.score >= 1000) this.triggerAchievement('score_1000');
        if (this.score >= 2500) this.triggerAchievement('score_2500');

        // Populate Game Over Screen
        setTimeout(() => {
            this.ui.hud.classList.add('hidden');
            this.ui.touchControls.classList.add('hidden');
            this.ui.gameOverModal.classList.remove('hidden');

            this.ui.finalScoreValue.textContent = Math.floor(this.score).toLocaleString();
            this.ui.bestScoreValue.textContent = Math.floor(Math.max(this.score, this.highScore)).toLocaleString();
            this.ui.goDifficultyValue.textContent = this.difficulty.toUpperCase();
            this.ui.goModeValue.textContent = this.gameMode === 'challenge' ? '60s Challenge' : (this.gameMode === 'daily' ? 'Daily Quest' : 'Classic Endless');
            this.ui.goRankValue.textContent = lbResult.rank > 0 ? `#${lbResult.rank} in Top 10` : 'Unranked';

            if (isNewRecord && this.score > 0) {
                this.ui.newHighScoreBanner.classList.remove('hidden');
            } else {
                this.ui.newHighScoreBanner.classList.add('hidden');
            }
        }, 600);
    }

    /* =========================================================
       Main Game Loop (60 FPS Normalized)
       ========================================================= */
    loop(currentTime) {
        const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = currentTime;

        if (this.state === this.STATE.COUNTDOWN) {
            this.updateCountdown(dt);
        } else if (this.state === this.STATE.PLAYING) {
            this.updatePlaying(dt);
        }

        // Render Frame
        const isPlaying = this.state === this.STATE.PLAYING;
        this.renderer.update(dt, isPlaying ? this.speed : 2.0, this.score);
        this.particles.update(dt);
        this.renderer.render(this.dino, this.obstacles, this.powerups, this.particles, this.score, isPlaying);

        requestAnimationFrame(this.loop);
    }

    updateCountdown(dt) {
        this.countdownTimer -= dt;
        if (this.countdownTimer <= 0) {
            this.countdownValue--;
            if (this.countdownValue > 0) {
                this.countdownTimer = 1.0;
                this.ui.countdownText.textContent = this.countdownValue.toString();
                this.ui.countdownText.classList.remove('countdown-anim');
                void this.ui.countdownText.offsetWidth; // trigger reflow
                this.ui.countdownText.classList.add('countdown-anim');
                this.sound.playCountdownBeep();
            } else if (this.countdownValue === 0) {
                this.countdownTimer = 0.6;
                this.ui.countdownText.textContent = 'RUN!';
                this.ui.countdownText.classList.remove('countdown-anim');
                void this.ui.countdownText.offsetWidth;
                this.ui.countdownText.classList.add('countdown-anim');
                this.sound.playCountdownGo();
            } else {
                this.beginPlaying();
            }
        }
    }

    updatePlaying(dt) {
        const activeConfig = (this.gameMode === 'challenge')
            ? DIFFICULTY_CONFIG.challenge
            : DIFFICULTY_CONFIG[this.difficulty];

        // 1. Advance Speed gradually
        this.speed = Math.min(activeConfig.maxSpeed, this.speed + activeConfig.speedIncrement * dt * 60);
        this.sound.setBgmTempo(this.speed / activeConfig.initialSpeed);

        // 2. 60-Second Challenge Mode Countdown
        if (this.gameMode === 'challenge') {
            this.challengeTimer -= dt;

            // Audio warning countdown at 5s, 4s, 3s, 2s, 1s
            const currentSec = Math.ceil(this.challengeTimer);
            if (currentSec <= 5 && currentSec > 0 && currentSec !== this.lastWarningSecond) {
                this.lastWarningSecond = currentSec;
                this.sound.playWarningTick();
            }

            if (this.challengeTimer <= 0) {
                this.challengeTimer = 0;
                this.updateHUD();
                this.gameOver('timeout');
                return;
            }
        }

        // 3. Score & Distance calculation
        const scoreMultiplier = (this.dino.doubleScoreTimer > 0 ? 2 : 1) * this.combo;
        const scoreGain = dt * 10 * (this.speed / 7) * scoreMultiplier;
        this.score += scoreGain;
        this.distance += this.speed * dt * 5;

        // Score milestone chime every 500 points
        if (Math.floor(this.score / 500) > Math.floor((this.score - scoreGain) / 500)) {
            this.sound.playScoreMilestone();
        }

        // Check Nightfall achievement
        if (this.renderer.dayNightCycle >= 0.6 && this.renderer.dayNightCycle <= 0.8) {
            this.triggerAchievement('night_owl');
        }

        // 4. Combo decay
        if (this.combo > 1.0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 1.0;
                this.obstaclesClearedInCombo = 0;
            }
        }

        // 5. Update Dinosaur Physics & Animations
        this.dino.update(dt, this.speed, this.particles, this.sound);

        // 6. Obstacle Spawning & Fairness Logic
        this.distanceSinceLastSpawn += this.speed;
        if (this.distanceSinceLastSpawn >= this.nextSpawnDistance) {
            this.spawnObstacle(activeConfig);
            this.distanceSinceLastSpawn = 0;

            // Compute physically possible fair gap
            const baseMinGap = this.speed * 42;
            const extraGap = Math.random() * (this.speed * 28);
            this.nextSpawnDistance = baseMinGap + extraGap;
        }

        // 7. Power-Up Spawning Logic
        this.powerupCooldown -= dt * 60;
        if (this.powerupCooldown <= 0) {
            if (Math.random() < activeConfig.powerupChance) {
                this.spawnPowerUp();
                this.powerupCooldown = Math.random() * 800 + 900;
            } else {
                this.powerupCooldown = 300;
            }
        }

        // 8. Update Obstacles & Collision Checks
        this.updateObstacles(dt);

        // 9. Update Power-Ups & Collect Checks
        this.updatePowerUps(dt);

        // 10. Update HUD elements
        this.updateHUD();
    }

    spawnObstacle(config) {
        const allowBirds = this.score > 200 || this.difficulty === 'hard' || this.gameMode === 'challenge';
        const isBird = allowBirds && Math.random() < config.birdChance;

        let typeKey;
        if (isBird) {
            // Select bird altitude: low (duckable), mid (jump or duck), high (pass under)
            const r = Math.random();
            if (r < 0.40) typeKey = 'BIRD_LOW';
            else if (r < 0.75) typeKey = 'BIRD_MID';
            else typeKey = 'BIRD_HIGH';
        } else {
            // Cactus or Tumbleweed
            if (Math.random() < 0.15 && this.score > 350) {
                typeKey = 'TUMBLEWEED';
            } else {
                const cactusTypes = ['CACTUS_SMALL_1', 'CACTUS_SMALL_2', 'CACTUS_LARGE_1', 'CACTUS_LARGE_2'];
                if (this.score > 600 || this.difficulty === 'hard') {
                    cactusTypes.push('CACTUS_LARGE_3');
                }
                typeKey = cactusTypes[Math.floor(Math.random() * cactusTypes.length)];
            }
        }

        const obs = new Obstacle(typeKey, this.renderer.groundY, this.renderer.virtualWidth);
        this.obstacles.push(obs);
    }

    spawnPowerUp() {
        const types = ['shield', 'boost', 'double'];
        const type = types[Math.floor(Math.random() * types.length)];
        const spawnInAir = Math.random() > 0.45; // some on ground, some require jumping!
        const pw = new PowerUp(type, this.renderer.groundY, this.renderer.virtualWidth, spawnInAir);
        this.powerups.push(pw);
    }

    updateObstacles(dt) {
        const dinoBoxes = this.dino.getHitboxes();

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.update(dt, this.speed);

            // A. Check Collision with Dino
            if (!obs.destroyed) {
                const obsBoxes = obs.getHitboxes();
                let hasCollided = false;

                for (let db of dinoBoxes) {
                    for (let ob of obsBoxes) {
                        if (this.checkAABB(db, ob)) {
                            hasCollided = true;
                            break;
                        }
                    }
                    if (hasCollided) break;
                }

                if (hasCollided) {
                    if (this.dino.boostTimer > 0) {
                        // Boost destroys obstacle!
                        obs.destroyed = true;
                        this.particles.addDestructionBurst(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.kind);
                        this.sound.playHit();
                        this.score += 150;
                        this.renderer.addFloatingText('+150 SMASH!', obs.x, obs.y, '#f97316');
                        this.triggerAchievement('boost_rampage');
                    } else if (this.dino.shieldActive) {
                        // Shield absorbs hit!
                        obs.destroyed = true;
                        this.dino.breakShield(this.particles, this.sound);
                        this.renderer.triggerShake(6, 0.2);
                        this.renderer.addFloatingText('SHIELD BROKEN!', obs.x, obs.y, '#38bdf8');
                        this.triggerAchievement('shield_saver');
                    } else {
                        // Player dies
                        this.gameOver('collision');
                        return;
                    }
                }

                // B. Near-Miss Detection
                if (!hasCollided && !obs.nearMissAwarded && obs.x < this.dino.x) {
                    const nearBox = obs.getNearMissBox();
                    for (let db of dinoBoxes) {
                        if (this.checkAABB(db, nearBox)) {
                            obs.nearMissAwarded = true;
                            this.handleNearMiss(obs);
                            break;
                        }
                    }
                }

                // C. Obstacle Cleared (Combo increment)
                if (!obs.passed && obs.x + obs.width < this.dino.x) {
                    obs.passed = true;
                    this.handleObstacleCleared(obs);
                }
            }

            // Remove off-screen obstacles
            if (obs.x + obs.width < -50) {
                this.obstacles.splice(i, 1);
            }
        }
    }

    handleNearMiss(obs) {
        this.sound.playNearMiss();
        this.particles.addNearMissSparkles(obs.x + obs.width / 2, obs.y);
        const nearBonus = Math.floor(50 * this.combo);
        this.score += nearBonus;
        this.renderer.addFloatingText(`+${nearBonus} NEAR MISS!`, obs.x, obs.y - 15, '#fde047', 16);

        this.nearMissesThisRun++;
        if (this.nearMissesThisRun >= 3) {
            this.triggerAchievement('near_miss_master');
        }
    }

    handleObstacleCleared(obs) {
        this.obstaclesClearedInCombo++;
        this.comboTimer = 3.5; // refresh combo window

        if (this.obstaclesClearedInCombo >= 6) {
            this.combo = 4.0;
            this.triggerAchievement('combo_streak');
        } else if (this.obstaclesClearedInCombo >= 4) {
            this.combo = 3.0;
        } else if (this.obstaclesClearedInCombo >= 2) {
            this.combo = 2.0;
        } else {
            this.combo = 1.5;
        }

        if (obs.kind === 'bird' && obs.typeKey === 'BIRD_LOW' && this.dino.isDucking) {
            this.lowBirdsDuckedRun++;
            if (this.lowBirdsDuckedRun >= 5) {
                this.triggerAchievement('bird_dodger');
            }
        }
    }

    updatePowerUps(dt) {
        const dinoBox = { x: this.dino.x, y: this.dino.y, w: this.dino.width, h: this.dino.height };

        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const pw = this.powerups[i];
            pw.update(dt, this.speed, this.particles);

            if (!pw.collected) {
                if (this.checkAABB(dinoBox, pw.getHitbox())) {
                    pw.collected = true;
                    this.collectPowerUp(pw);
                }
            }

            if (pw.x + pw.width < -30) {
                this.powerups.splice(i, 1);
            }
        }
    }

    collectPowerUp(pw) {
        this.sound.playPowerup();
        this.powerupsCollectedRun++;

        if (pw.type === 'shield') {
            this.dino.shieldActive = true;
            this.renderer.addFloatingText('SHIELD READY!', pw.x, pw.y, '#38bdf8', 18);
        } else if (pw.type === 'boost') {
            this.dino.boostTimer = 5.0; // 5 seconds of boost rampage
            this.renderer.addFloatingText('SPEED BOOST!', pw.x, pw.y, '#f97316', 18);
        } else if (pw.type === 'double') {
            this.dino.doubleScoreTimer = 10.0; // 10 seconds of 2x score
            this.renderer.addFloatingText('2X SCORE ACTIVE!', pw.x, pw.y, '#facc15', 18);
        }

        if (this.powerupsCollectedRun >= 3) {
            this.triggerAchievement('power_collector');
        }
    }

    /* AABB Collision Helper */
    checkAABB(boxA, boxB) {
        return (
            boxA.x < boxB.x + boxB.w &&
            boxA.x + boxA.w > boxB.x &&
            boxA.y < boxB.y + boxB.h &&
            boxA.y + boxA.h > boxB.y
        );
    }

    /* =========================================================
       HUD Updates
       ========================================================= */
    updateHUD() {
        // Score & High Score
        this.ui.hudScore.textContent = Math.floor(this.score).toString().padStart(5, '0');
        this.ui.hudHighScore.textContent = Math.floor(Math.max(this.score, this.highScore)).toString().padStart(5, '0');

        // Difficulty & Mode Badges
        this.ui.hudDifficultyBadge.textContent = this.difficulty.toUpperCase();
        this.ui.hudModeBadge.textContent = this.gameMode === 'challenge' ? '60s' : (this.gameMode === 'daily' ? 'DAILY' : 'ENDLESS');

        // Combo Multiplier
        if (this.combo > 1.0) {
            this.ui.hudComboBadge.classList.remove('hidden');
            this.ui.hudComboMultiplier.textContent = this.combo.toFixed(1) + 'x';
        } else {
            this.ui.hudComboBadge.classList.add('hidden');
        }

        // 60-Second Challenge Timer
        if (this.gameMode === 'challenge') {
            this.ui.hudChallengeTimer.classList.remove('hidden');
            const secondsLeft = Math.ceil(this.challengeTimer);
            this.ui.hudTimerSeconds.textContent = secondsLeft.toString();

            if (secondsLeft <= 10) {
                this.ui.hudChallengeTimer.classList.add('warning-pulse');
            } else {
                this.ui.hudChallengeTimer.classList.remove('warning-pulse');
            }
        } else {
            this.ui.hudChallengeTimer.classList.add('hidden');
        }

        // Power-Up Badges & Progress Bars
        if (this.dino.shieldActive) {
            this.ui.hudPowerupShield.classList.remove('hidden');
        } else {
            this.ui.hudPowerupShield.classList.add('hidden');
        }

        if (this.dino.boostTimer > 0) {
            this.ui.hudPowerupBoost.classList.remove('hidden');
            this.ui.boostProgress.style.width = ((this.dino.boostTimer / 5.0) * 100) + '%';
        } else {
            this.ui.hudPowerupBoost.classList.add('hidden');
        }

        if (this.dino.doubleScoreTimer > 0) {
            this.ui.hudPowerupDouble.classList.remove('hidden');
            this.ui.doubleProgress.style.width = ((this.dino.doubleScoreTimer / 10.0) * 100) + '%';
        } else {
            this.ui.hudPowerupDouble.classList.add('hidden');
        }
    }

    /* =========================================================
       Leaderboard System (Top 10)
       ========================================================= */
    openLeaderboard(defaultCategory = 'medium') {
        this.ui.leaderboardModal.classList.remove('hidden');
        this.ui.leaderboardTabs.forEach(t => {
            if (t.getAttribute('data-cat') === defaultCategory) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });
        this.renderLeaderboardTable(defaultCategory);
    }

    renderLeaderboardTable(category) {
        const list = this.storage.getLeaderboard(category);
        const currentPlayer = this.storage.getPlayerName();
        this.ui.leaderboardBody.innerHTML = '';

        if (!list || list.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" class="empty-table-msg">No scores yet. Play to set a record!</td>`;
            this.ui.leaderboardBody.appendChild(row);
            return;
        }

        list.forEach((entry, idx) => {
            const row = document.createElement('tr');
            const isMe = entry.name.toLowerCase() === currentPlayer.toLowerCase();
            if (isMe) row.classList.add('current-player-row');

            const rankBadge = idx === 0 ? '🥇 1' : (idx === 1 ? '🥈 2' : (idx === 2 ? '🥉 3' : `#${idx + 1}`));
            row.innerHTML = `
                <td class="lb-rank">${rankBadge}</td>
                <td class="lb-name">${this.escapeHTML(entry.name)} ${isMe ? '<span class="you-pill">YOU</span>' : ''}</td>
                <td class="lb-score">${entry.score.toLocaleString()}</td>
                <td class="lb-diff">${(entry.difficulty || category).toUpperCase()}</td>
                <td class="lb-date">${entry.date || '-'}</td>
            `;
            this.ui.leaderboardBody.appendChild(row);
        });
    }

    /* =========================================================
       Achievements System
       ========================================================= */
    openAchievements() {
        this.ui.achievementsModal.classList.remove('hidden');
        const list = this.storage.getAchievements();
        this.ui.achievementsListContainer.innerHTML = '';

        list.forEach(a => {
            const card = document.createElement('div');
            card.className = `achievement-card ${a.unlocked ? 'unlocked' : 'locked'}`;
            card.innerHTML = `
                <div class="ach-icon">${a.icon}</div>
                <div class="ach-info">
                    <div class="ach-title">${a.name} ${a.unlocked ? '<span class="ach-check">✓</span>' : ''}</div>
                    <div class="ach-desc">${a.desc}</div>
                    ${a.unlocked && a.date ? `<div class="ach-date">Unlocked: ${a.date}</div>` : ''}
                </div>
            `;
            this.ui.achievementsListContainer.appendChild(card);
        });
    }

    openSettings() {
        this.applySavedSettings();
        this.ui.settingsModal.classList.remove('hidden');
    }

    triggerAchievement(id) {
        const ach = this.storage.unlockAchievement(id);
        if (ach) {
            this.showToast(`Achievement Unlocked!`, `${ach.name}: ${ach.desc}`, ach.icon);
        }
    }

    showToast(title, message, icon = '🏆') {
        const toast = document.createElement('div');
        toast.className = 'toast-alert';
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-msg">${message}</div>
            </div>
        `;
        this.ui.toastContainer.appendChild(toast);
        this.sound.playAchievement();

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }

    /* =========================================================
       Viral Share Feature
       ========================================================= */
    shareScore() {
        const score = Math.floor(this.score).toLocaleString();
        const modeText = this.gameMode === 'challenge' ? '60-Second Challenge' : `${this.difficulty.toUpperCase()} mode`;
        const text = `🦖 I just scored ${score} points in Dino Runner (${modeText})! Can you beat my personal best? Play now!`;

        if (navigator.share) {
            navigator.share({
                title: 'Dino Runner High Score',
                text: text,
                url: window.location.href
            }).catch(() => {});
        } else {
            // Fallback clipboard copy
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showToast('Copied to Clipboard!', 'Share message copied. Paste it to your friends!', '📋');
                }).catch(() => {
                    this.promptShareFallback(text);
                });
            } else {
                this.promptShareFallback(text);
            }
        }
    }

    promptShareFallback(text) {
        window.prompt('Copy and share your score:', text);
    }

    escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    }
}

// Instantiate game on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    window.dinoGame = new DinoGame();
});
