# 🦖 DINO RUNNER – Endless Arcade Running Game

A modern, high-speed, addictive HTML5 arcade running game inspired by the classic Chrome Dinosaur game, supercharged with responsive physics, dynamic day/night cycles, procedural 8-bit audio, multiple game modes, power-ups, achievements, and persistent local leaderboards.

![HTML5 Canvas](https://img.shields.io/badge/Engine-HTML5_Canvas_API-orange)
![Audio](https://img.shields.io/badge/Audio-Web_Audio_API-blue)
![Storage](https://img.shields.io/badge/Data-LocalStorage-success)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen)

---

## 🎮 Gameplay & Features

### 1. Player Controls
- **Jump / Leap**:
  - `Spacebar` or `↑` (Arrow Up) or `W`
  - Mouse Click / Screen Tap (Desktop or Mobile)
  - Dedicated virtual **JUMP** on-screen button on mobile devices
- **Duck / Crouch**:
  - `↓` (Arrow Down) or `S`
  - Swipe down on touchscreen
  - Dedicated virtual **DUCK** on-screen button on mobile devices
- **Variable Jump & Fast Fall**:
  - Releasing jump early cuts upward velocity for short hops.
  - Pressing duck while airborne activates **Fast-Fall** gravity for quick landings.
- **Pause / Settings**:
  - Press `P` or `ESC`, or click the top bar pause button.

---

### 2. Obstacles & Enemies
- **Small Cactus**: Single or double clusters.
- **Large Cactus**: Giant saguaro single, double, and triple combinations.
- **Pterodactyls (Flying Birds)** with realistic wing flapping:
  - **Low Altitude**: Must **duck** under!
  - **Mid Altitude**: Must **jump** over!
  - **High Altitude**: Walk safely underneath without jumping!
- **Tumbleweeds**: Rolling desert weeds with rotational physics.
- **Fair Generation**: Obstacle spacing dynamically calculates safe landing zones based on current speed.

---

### 3. Power-Up Orbs
- 🛡️ **Shield**: Absorbs 1 obstacle collision safely. Triggers shield break shards and a 1.0s grace period.
- ⚡ **Speed Boost**: Invincible rampage! Zooms forward, instantly shattering all obstacles in your path for **+150 bonus points** each.
- 🟡 **2X Multiplier**: Doubles all points accumulated for 10 seconds.

---

### 4. Combo & Near-Miss Scoring
- **Near-Miss Bonus**: Jump or duck razor-close to an obstacle to earn **+50 points** with golden star particle bursts and sound chime.
- **Combo Multiplier**: Clearing obstacles within 3.5 seconds ramps your multiplier from `1.5x` up to `4.0x`!

---

### 5. Game Modes & Difficulty
1. **Classic Endless**:
   - **Easy Mode**: Relaxed speed, wider gaps, gentle progression.
   - **Medium Mode**: Balanced arcade challenge with mixed cactus and bird waves.
   - **Hard Mode**: Aggressive speed, tight gaps, and fast flyers.
2. **60-Second Challenge Mode**:
   - Dramatic `3, 2, 1, RUN!` countdown.
   - 60-second active timer that freezes when paused.
   - Urgent flashing HUD warning below 10 seconds.
   - Special audio warning ticks on the final 5 seconds.
   - Automatic `TIME'S UP!` buzzer, score tally, and dedicated challenge leaderboard!
3. **Daily Quest**:
   - Date-seeded procedural run with dynamic weather (Rain, Sandstorm, or Starlight).

---

### 6. Local Top-10 Leaderboard
- Categorized leaderboards for **Easy**, **Medium**, **Hard**, and **60s Challenge**.
- Stores player runner tag, score, rank (🥇, 🥈, 🥉), difficulty, and date.
- Real-time ranking indicator showing your placement in the top 10.
- Clear leaderboard button with confirmation protection.
- 100% persistent across browser sessions using `localStorage`.

---

### 7. Audio & Soundtrack
- **100% Procedural Web Audio API**: No external `.mp3` or `.wav` files needed. Works completely offline.
- Synthesized retro SFX: Jump pitch-sweep, duck swoosh, obstacle crunch, shield shatter, near-miss chime, 5s alert ticks, and celebratory fanfare.
- Dynamic Chiptune BGM: Retro bassline and melody that automatically accelerates tempo as your game speed ramps up.

---

## 📁 Project Structure

```text
dino-runner/
│
├── index.html           # Main semantic HTML structure, HUD, and overlays
├── style.css            # Modern arcade styling, glassmorphism, responsive layout
├── game.js              # State machine, physics loop, input listeners, HUD binding
├── README.md            # Documentation and deployment guides
│
└── js/
    ├── audio.js         # Web Audio API synthesizer for all SFX & Chiptune BGM
    ├── storage.js       # LocalStorage manager (High scores, Top 10 leaderboards, Achievements)
    ├── entities.js      # Dinosaur player, Obstacles, Power-ups, and Particle engine
    └── renderer.js      # Canvas pixel-art renderer, day/night cycles, parallax mountains & clouds
```

---

## 🚀 How to Run Locally

### Option 1: Direct Browser Launch (Simplest)
1. Double-click `index.html` in your file explorer.
2. It will open in Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari with zero server setup required.

### Option 2: Python Local Server
If you prefer running through an HTTP server:
```bash
# In the dino-runner directory:
python -m http.server 8000
```
Open `http://localhost:8000` in your web browser.

### Option 3: VS Code Live Server
1. Open the `dino-runner` folder in VS Code.
2. Right-click `index.html` and click **"Open with Live Server"**.

---

## 🌐 Free Online Deployment

### 1. Deploy on GitHub Pages
1. Initialize a Git repository and push the files to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Dino Runner"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/dino-runner.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Select branch `main` and folder `/ (root)`.
   - Click **Save**.
3. Your game is live at `https://YOUR_USERNAME.github.io/dino-runner/`!

---

### 2. Deploy on Netlify (Free)
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop the `dino-runner` folder onto the page.
3. Your game will be published immediately with a free HTTPS URL.

---

## 📜 License
MIT License. Created for arcade enthusiasts and endless runner fans!
