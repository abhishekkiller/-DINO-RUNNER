/**
 * Dino Runner - Web Audio API Synthesizer
 * 100% Procedural 8-bit sound effects & retro dynamic BGM.
 * Zero external audio files required - works offline and across all browsers.
 */

class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.bgmGain = null;

        this.sfxEnabled = true;
        this.bgmEnabled = true;
        this.masterVolume = 0.8;
        this.sfxVolume = 0.8;
        this.bgmVolume = 0.35;

        // BGM state
        this.bgmInterval = null;
        this.bgmStep = 0;
        this.bgmBpm = 130;
        this.isPlayingBgm = false;

        this.loadSettings();
    }

    init() {
        if (this.ctx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            console.warn('Web Audio API not supported in this browser.');
            return;
        }

        try {
            this.ctx = new AudioCtx();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? this.sfxVolume : 0, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);

            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.setValueAtTime(this.bgmEnabled ? this.bgmVolume : 0, this.ctx.currentTime);
            this.bgmGain.connect(this.masterGain);
        } catch (e) {
            console.error('Failed to initialize AudioContext:', e);
        }
    }

    resume() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('dino_audio_settings');
            if (saved) {
                const s = JSON.parse(saved);
                if (typeof s.sfxEnabled === 'boolean') this.sfxEnabled = s.sfxEnabled;
                if (typeof s.bgmEnabled === 'boolean') this.bgmEnabled = s.bgmEnabled;
                if (typeof s.masterVolume === 'number') this.masterVolume = s.masterVolume;
                if (typeof s.sfxVolume === 'number') this.sfxVolume = s.sfxVolume;
                if (typeof s.bgmVolume === 'number') this.bgmVolume = s.bgmVolume;
            }
        } catch (e) {
            // fallback to defaults
        }
    }

    saveSettings() {
        try {
            const s = {
                sfxEnabled: this.sfxEnabled,
                bgmEnabled: this.bgmEnabled,
                masterVolume: this.masterVolume,
                sfxVolume: this.sfxVolume,
                bgmVolume: this.bgmVolume
            };
            localStorage.setItem('dino_audio_settings', JSON.stringify(s));
        } catch (e) {}
    }

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
        }
        this.saveSettings();
    }

    setSfxVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, val));
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setTargetAtTime(this.sfxEnabled ? this.sfxVolume : 0, this.ctx.currentTime, 0.05);
        }
        this.saveSettings();
    }

    setBgmVolume(val) {
        this.bgmVolume = Math.max(0, Math.min(1, val));
        if (this.bgmGain && this.ctx) {
            this.bgmGain.gain.setTargetAtTime(this.bgmEnabled ? this.bgmVolume : 0, this.ctx.currentTime, 0.05);
        }
        this.saveSettings();
    }

    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setTargetAtTime(this.sfxEnabled ? this.sfxVolume : 0, this.ctx.currentTime, 0.05);
        }
        this.saveSettings();
        return this.sfxEnabled;
    }

    toggleBgm() {
        this.bgmEnabled = !this.bgmEnabled;
        if (this.bgmGain && this.ctx) {
            this.bgmGain.gain.setTargetAtTime(this.bgmEnabled ? this.bgmVolume : 0, this.ctx.currentTime, 0.05);
        }
        this.saveSettings();
        if (this.bgmEnabled) {
            if (this.isPlayingBgm) {
                // Already playing loop, gain restored
            } else {
                this.startBgm();
            }
        } else {
            this.stopBgm();
        }
        return this.bgmEnabled;
    }

    /* =========================================================
       Procedural Sound Effects (SFX)
       ========================================================= */

    playJump() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.12);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    playDuck() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    playHit() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Low crunch oscillator
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

        oscGain.gain.setValueAtTime(0.35, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);

        // White noise burst
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.25);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        osc.start(now);
        whiteNoise.start(now);
        osc.stop(now + 0.36);
        whiteNoise.stop(now + 0.26);
    }

    playNearMiss() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [659.25, 987.77, 1318.51]; // E5, B5, E6
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.04);

            gain.gain.setValueAtTime(0.15, now + i * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.15);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + i * 0.04);
            osc.stop(now + i * 0.04 + 0.16);
        });
    }

    playPowerup() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        chord.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(0.22, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.2);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.22);
        });
    }

    playShieldBreak() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.23);
    }

    playScoreMilestone() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);

            gain.gain.setValueAtTime(0.14, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.12);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.13);
        });
    }

    playCountdownBeep() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now); // A4

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    playCountdownGo() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        [880, 1108.73].forEach((f) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(f, now);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.42);
        });
    }

    playWarningTick() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(820, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    playTimeUp() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.66);
    }

    playButtonClick() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    playAchievement() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.2, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.25);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.26);
        });
    }

    /* =========================================================
       Dynamic Procedural Background Music (Chiptune BGM)
       ========================================================= */

    startBgm() {
        if (!this.bgmEnabled) return;
        if (this.isPlayingBgm) return;
        this.resume();
        if (!this.ctx) return;

        this.isPlayingBgm = true;
        this.bgmStep = 0;
        this.scheduleNextBgmBeat();
    }

    stopBgm() {
        this.isPlayingBgm = false;
        if (this.bgmTimeout) {
            clearTimeout(this.bgmTimeout);
            this.bgmTimeout = null;
        }
    }

    setBgmTempo(speedFactor) {
        // Normal speed: 130 BPM. Max speed factor ~ 2.0 -> 175 BPM
        const clamped = Math.max(1, Math.min(2.2, speedFactor));
        this.bgmBpm = Math.floor(130 + (clamped - 1) * 35);
    }

    scheduleNextBgmBeat() {
        if (!this.isPlayingBgm || !this.bgmEnabled || !this.ctx) return;

        const stepTime = (60 / this.bgmBpm) / 2; // 8th notes
        this.playBgmStep(this.bgmStep);
        this.bgmStep = (this.bgmStep + 1) % 16;

        this.bgmTimeout = setTimeout(() => {
            this.scheduleNextBgmBeat();
        }, stepTime * 1000);
    }

    playBgmStep(step) {
        if (!this.ctx || this.ctx.state === 'suspended') return;
        const now = this.ctx.currentTime;

        // Catchy 16-step retro bassline & melody pattern (A minor / Pentatonic)
        const bassNotes = [
            110.00, null, 110.00, 130.81, 146.83, null, 146.83, 164.81,
            110.00, null, 110.00, 130.81, 98.00, 110.00, 123.47, null
        ]; // A2, C3, D3, E3, G2, A2, B2

        const melodyNotes = [
            440.00, null, 523.25, null, 587.33, 659.25, null, 587.33,
            523.25, null, 440.00, null, 392.00, 440.00, null, null
        ];

        // Bass synth
        const bassFreq = bassNotes[step];
        if (bassFreq) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(bassFreq, now);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

            osc.connect(gain);
            gain.connect(this.bgmGain);

            osc.start(now);
            osc.stop(now + 0.19);
        }

        // Melody synth
        const melodyFreq = melodyNotes[step];
        if (melodyFreq) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(melodyFreq, now);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);

            osc.connect(gain);
            gain.connect(this.bgmGain);

            osc.start(now);
            osc.stop(now + 0.15);
        }

        // Percussion: Hi-hat tick on even steps, soft snare on 4 and 12
        if (step === 4 || step === 12) {
            // Snare noise
            const bufSize = Math.floor(this.ctx.sampleRate * 0.06);
            const noiseBuf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            const data = noiseBuf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = this.ctx.createBufferSource();
            noise.buffer = noiseBuf;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1200, now);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.bgmGain);

            noise.start(now);
            noise.stop(now + 0.06);
        } else if (step % 2 === 0) {
            // Subtle hi-hat
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'highpass' ? 'square' : 'triangle';
            osc.frequency.setValueAtTime(3500, now);

            gain.gain.setValueAtTime(0.02, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

            osc.connect(gain);
            gain.connect(this.bgmGain);

            osc.start(now);
            osc.stop(now + 0.03);
        }
    }
}

// Global sound manager instance
window.audioManager = new SoundManager();
