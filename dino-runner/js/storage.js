/**
 * Dino Runner - Local Storage & Data Management
 * Handles persistent high scores, top-10 leaderboards per mode,
 * player profiles, achievements, and user preferences.
 */

const ACHIEVEMENTS_LIST = [
    { id: 'first_jump', name: 'First Leap', desc: 'Perform your very first jump.', icon: '🦘' },
    { id: 'score_500', name: 'Desert Runner', desc: 'Reach a score of 500 points.', icon: '🏜️' },
    { id: 'score_1000', name: 'Speed Demon', desc: 'Reach a score of 1,000 points.', icon: '⚡' },
    { id: 'score_2500', name: 'Apex Dinosaur', desc: 'Reach a score of 2,500 points.', icon: '👑' },
    { id: 'near_miss_master', name: 'Close Shave', desc: 'Perform 3 near-miss dodges in one game.', icon: '🎯' },
    { id: 'combo_streak', name: 'On Fire!', desc: 'Reach a combo multiplier of 4x.', icon: '🔥' },
    { id: 'shield_saver', name: 'Second Chance', desc: 'Survive an obstacle hit using a shield.', icon: '🛡️' },
    { id: 'boost_rampage', name: 'Rampage', desc: 'Smash through an obstacle while speed-boosted.', icon: '💥' },
    { id: 'challenge_survivor', name: 'Clock Beater', desc: 'Survive the full 60 seconds in Challenge Mode.', icon: '⏱️' },
    { id: 'night_owl', name: 'Night Walker', desc: 'Survive until night falls over the desert.', icon: '🌙' },
    { id: 'bird_dodger', name: 'Duck Master', desc: 'Duck under 5 low-flying pterodactyls.', icon: '🦅' },
    { id: 'power_collector', name: 'Power Surge', desc: 'Collect 3 power-ups in a single run.', icon: '💎' }
];

class StorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            PLAYER_NAME: 'dino_player_name',
            HIGH_SCORES: 'dino_high_scores',
            LEADERBOARDS: 'dino_leaderboards',
            ACHIEVEMENTS: 'dino_achievements',
            SETTINGS: 'dino_general_settings'
        };

        this.initDefaults();
    }

    initDefaults() {
        if (!localStorage.getItem(this.STORAGE_KEYS.HIGH_SCORES)) {
            const defaultScores = { easy: 0, medium: 0, hard: 0, challenge: 0 };
            localStorage.setItem(this.STORAGE_KEYS.HIGH_SCORES, JSON.stringify(defaultScores));
        }

        if (!localStorage.getItem(this.STORAGE_KEYS.LEADERBOARDS)) {
            const initialLeaderboards = {
                easy: [
                    { name: 'VelociRex', score: 1250, date: '2026-10-25', difficulty: 'easy', mode: 'endless' },
                    { name: 'Trike', score: 820, date: '2026-10-24', difficulty: 'easy', mode: 'endless' },
                    { name: 'FossilFan', score: 540, date: '2026-10-22', difficulty: 'easy', mode: 'endless' }
                ],
                medium: [
                    { name: 'PteroPro', score: 2150, date: '2026-10-28', difficulty: 'medium', mode: 'endless' },
                    { name: 'SpinoSpeed', score: 1640, date: '2026-10-27', difficulty: 'medium', mode: 'endless' },
                    { name: 'CactusKing', score: 980, date: '2026-10-23', difficulty: 'medium', mode: 'endless' }
                ],
                hard: [
                    { name: 'MeteorDodger', score: 3200, date: '2026-10-29', difficulty: 'hard', mode: 'endless' },
                    { name: 'ApexRaptor', score: 2490, date: '2026-10-26', difficulty: 'hard', mode: 'endless' },
                    { name: 'ChompChomp', score: 1810, date: '2026-10-21', difficulty: 'hard', mode: 'endless' }
                ],
                challenge: [
                    { name: 'BlitzSaur', score: 1950, date: '2026-10-29', difficulty: 'challenge', mode: 'challenge' },
                    { name: 'MinuteMan', score: 1420, date: '2026-10-28', difficulty: 'challenge', mode: 'challenge' },
                    { name: 'RushHour', score: 1100, date: '2026-10-25', difficulty: 'challenge', mode: 'challenge' }
                ]
            };
            localStorage.setItem(this.STORAGE_KEYS.LEADERBOARDS, JSON.stringify(initialLeaderboards));
        }

        if (!localStorage.getItem(this.STORAGE_KEYS.ACHIEVEMENTS)) {
            localStorage.setItem(this.STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify([]));
        }
    }

    /* Player Name */
    getPlayerName() {
        const name = localStorage.getItem(this.STORAGE_KEYS.PLAYER_NAME);
        return name && name.trim().length > 0 ? name.trim() : 'Player 1';
    }

    setPlayerName(name) {
        if (!name) return;
        const cleanName = name.replace(/<[^>]*>?/gm, '').trim().substring(0, 15);
        if (cleanName.length > 0) {
            localStorage.setItem(this.STORAGE_KEYS.PLAYER_NAME, cleanName);
        }
    }

    /* High Scores */
    getHighScore(category) {
        try {
            const scores = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.HIGH_SCORES)) || {};
            return scores[category] || 0;
        } catch (e) {
            return 0;
        }
    }

    saveHighScore(category, score) {
        try {
            const scores = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.HIGH_SCORES)) || {};
            const current = scores[category] || 0;
            if (score > current) {
                scores[category] = Math.floor(score);
                localStorage.setItem(this.STORAGE_KEYS.HIGH_SCORES, JSON.stringify(scores));
                return true; // New record
            }
        } catch (e) {}
        return false;
    }

    /* Leaderboards (Top 10) */
    getLeaderboard(category) {
        try {
            const boards = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.LEADERBOARDS)) || {};
            return (boards[category] || []).sort((a, b) => b.score - a.score).slice(0, 10);
        } catch (e) {
            return [];
        }
    }

    addLeaderboardScore(category, name, score, difficulty, mode) {
        if (!score || score <= 0) return { rank: -1, isTop10: false };
        try {
            const boards = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.LEADERBOARDS)) || {};
            if (!boards[category]) boards[category] = [];

            const today = new Date().toISOString().split('T')[0];
            const cleanName = (name || 'Anonymous').replace(/<[^>]*>?/gm, '').trim().substring(0, 15);

            const newEntry = {
                id: Date.now() + Math.random(),
                name: cleanName || 'Player',
                score: Math.floor(score),
                date: today,
                difficulty: difficulty || category,
                mode: mode || 'endless'
            };

            boards[category].push(newEntry);
            boards[category].sort((a, b) => b.score - a.score);
            boards[category] = boards[category].slice(0, 10); // keep top 10

            localStorage.setItem(this.STORAGE_KEYS.LEADERBOARDS, JSON.stringify(boards));

            const rank = boards[category].findIndex(e => e.id === newEntry.id) + 1;
            const isTop10 = rank > 0 && rank <= 10;

            // Also check high score update
            this.saveHighScore(category, score);

            return { rank, isTop10, entryId: newEntry.id };
        } catch (e) {
            console.error('Failed to save to leaderboard', e);
            return { rank: -1, isTop10: false };
        }
    }

    clearLeaderboard(category) {
        try {
            const boards = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.LEADERBOARDS)) || {};
            if (category === 'all') {
                boards.easy = [];
                boards.medium = [];
                boards.hard = [];
                boards.challenge = [];
            } else if (boards[category]) {
                boards[category] = [];
            }
            localStorage.setItem(this.STORAGE_KEYS.LEADERBOARDS, JSON.stringify(boards));
            return true;
        } catch (e) {
            return false;
        }
    }

    /* Achievements */
    getAchievements() {
        try {
            const unlocked = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ACHIEVEMENTS)) || [];
            return ACHIEVEMENTS_LIST.map(a => {
                const isUnlocked = unlocked.some(u => (typeof u === 'string' ? u === a.id : u.id === a.id));
                const entry = unlocked.find(u => (typeof u === 'string' ? u === a.id : u.id === a.id));
                return {
                    ...a,
                    unlocked: isUnlocked,
                    date: entry && entry.date ? entry.date : null
                };
            });
        } catch (e) {
            return ACHIEVEMENTS_LIST.map(a => ({ ...a, unlocked: false }));
        }
    }

    unlockAchievement(id) {
        try {
            const unlocked = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ACHIEVEMENTS)) || [];
            const alreadyUnlocked = unlocked.some(u => (typeof u === 'string' ? u === id : u.id === id));
            if (!alreadyUnlocked) {
                const achievement = ACHIEVEMENTS_LIST.find(a => a.id === id);
                if (achievement) {
                    unlocked.push({
                        id: id,
                        date: new Date().toISOString().split('T')[0]
                    });
                    localStorage.setItem(this.STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(unlocked));
                    return achievement; // Returns details of newly unlocked achievement
                }
            }
        } catch (e) {}
        return null;
    }

    /* General Settings */
    getSettings() {
        try {
            const s = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            if (s) return JSON.parse(s);
        } catch (e) {}
        return {
            screenShake: true,
            particles: true,
            timeOfDay: 'dynamic', // 'dynamic', 'day', 'night'
            difficulty: 'medium'
        };
    }

    saveSettings(settings) {
        try {
            const current = this.getSettings();
            const merged = { ...current, ...settings };
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
        } catch (e) {}
    }
}

// Global storage instance
window.storageManager = new StorageManager();
