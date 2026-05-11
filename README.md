# TypeSlop - A Fast-Paced Typing Rogue-like

TypeSlop is an intense, fast-paced typing game that combines the mechanics of a rogue-like with word-typing gameplay. Type words to destroy enemies before they reach you, survive increasingly difficult waves, and collect powerful upgrades to enhance your abilities.

## 🎮 Game Overview

TypeSlop challenges players to type words displayed on enemies to destroy them before they reach the bottom of the screen. The game features progressive difficulty, multiple enemy types, power-ups, and a comprehensive upgrade system with rarity-based loot boxes.

## 🚀 Features

### Core Gameplay
- **Progressive Wave System**: Survive increasingly difficult waves with more enemies each round
- **Real-time Typing Combat**: Type words quickly and accurately to destroy enemies
- **Combo System**: Build combos for bonus damage and score multipliers
- **Lives System**: Start with 3 lives, lose one when enemies reach the bottom
- **Dynamic Difficulty**: Game gets progressively harder with each wave

### Enemy Types
- **Normal Enemies** (Blue): Standard speed, medium-length words (4-7 letters)
- **Fast Enemies** (Red): 50% faster movement, short words (3-5 letters)
- **Double HP Enemies** (Purple): 20% slower movement, 2 health points, changes word when first hit

### Power-ups (20% drop chance)
- **Freeze** ❄️: Stops all enemies for 3 seconds
- **Nuke** 💣: Instantly destroys the nearest enemy
- **Heal** ❤️: Restores 1 life point

### Special Abilities
- **Slow-Motion**: Press `CTRL+SPACE` to activate slow-mo for 2 seconds (8-second cooldown)
- **Clear Input**: Press `ESC` to clear your typing input instantly

### Upgrade System
After completing each wave, players receive a loot box containing one upgrade with rarity tiers:

#### Rarity Tiers
- **Common** (60% chance): Gray - Small stat bonuses
- **Rare** (25% chance): Blue - Moderate improvements
- **Epic** (12% chance): Purple - Significant enhancements
- **Legendary** (3% chance): Gold - Game-changing abilities

#### Upgrade Categories

##### Accuracy & Precision Upgrades
- **Focus Fire** (Common-Legendary): Consecutive correct letters grant damage bonuses (1-5% per letter, max 5-25%)
- **Auto-Correct** (Legendary): First typo in each word is automatically corrected

##### Area of Effect / Utility Upgrades
- **Chain Lightning** (Common-Legendary): Chance to damage nearby enemies on word completion (10-30% chance, 1-3 targets)

##### Economic / Strategic Upgrades
- **Reroll Luck** (Common-Legendary): Increased chance for higher rarity upgrades (+5% to +25%)
- **Wave Skip Bonus** (Legendary): Perfect waves (no typos) grant bonus upgrades

##### Balancing Solutions
- **Armor Shred** (Epic): Double enemies change to ultra-short 3-letter words after first hit

##### Classic Upgrades
- **Typing Damage**: Increases damage against multi-HP enemies
- **Slow-Mo Enhancements**: Longer duration and shorter cooldowns
- **Enemy Control**: Slower enemy spawning and movement
- **Combo Bonuses**: Increased combo damage multipliers
- **Life Extensions**: Maximum life increases and instant healing

### Difficulty Levels
- **Easy**: 30% slower enemies, 30% slower spawning
- **Medium**: Normal speed and spawning rates
- **Hard**: 30% faster enemies, 20% faster spawning

## 🎯 How to Play

### Starting the Game
1. Open `index.html` in your web browser
2. Select your difficulty level (Easy, Medium, or Hard)
3. Click "Start Game" to begin

### Controls
- **Type words** to destroy enemies (case-insensitive)
- **CTRL+SPACE**: Activate slow-mo ability
- **ESC**: Clear typing input
- **Mouse**: Navigate menus and click loot boxes

### Gameplay Loop
1. **Type the complete word** displayed on an enemy to destroy it
2. **Build combos** by destroying multiple enemies quickly
3. **Collect power-ups** that drop from defeated enemies
4. **Survive the wave** by defeating all enemies
5. **Open loot boxes** between waves to get upgrades
6. **Progress through waves** until you run out of lives

### Tips for Success
- Focus on enemies closest to the bottom first
- Build and maintain combos for higher scores
- Save slow-mo for emergency situations
- Prioritize fast enemies when they appear
- Use power-ups strategically - don't let them expire
- With Focus Fire upgrades, type longer words consecutively for damage bonuses
- Target bomb word enemies for area damage when overwhelmed
- Perfect waves (no typos) grant bonus upgrades with Wave Skip Bonus
- Use Armor Shred to counter double enemy bottlenecks in high waves

## 🏗️ Technical Details

### Architecture
- **Frontend-only**: Pure HTML5, CSS3, and JavaScript
- **No dependencies**: Runs entirely in the browser
- **Responsive design**: Adapts to different screen sizes
- **Modern CSS**: Glassmorphism effects, animations, and gradients

### File Structure
```
type-slop/
├── index.html          # Main game interface
├── script.js           # Game logic and mechanics
├── style.css           # Styling and animations
├── README.md           # This file
└── Assets/             # Game images and icons
    ├── larger-logo.png
    ├── alien-dmd-transp.png
    ├── lootbox-close-state.png
    ├── lootbox-open-state.png
    ├── freeze.png
    ├── nuke.png
    ├── 1up.png
    └── game-over-final.png
```

### Key Components
- **GameState Class**: Manages all game state variables
- **Enemy Class**: Handles enemy behavior and properties
- **PowerUp Class**: Manages power-up effects
- **Lootbox Class**: Controls upgrade selection and animations
- **TypeSlopGame Class**: Main game controller

## 🎨 Visual Features

### UI Elements
- **Glassmorphic Design**: Modern frosted glass effects
- **Animated Backgrounds**: Dynamic gradient animations
- **Particle Effects**: Explosions and power-up effects
- **CSGO-style Loot Boxes**: Animated upgrade reveals
- **Color-coded Elements**: Visual distinction for enemy types and rarities

### Animations
- **Enemy Movement**: Smooth descent animations
- **Word Explosions**: Particle effects when enemies are destroyed
- **Loot Box Opening**: Spinning card reveal animation
- **Power-up Effects**: Visual feedback for abilities
- **Combo Popups**: Celebratory combo milestone indicators
- **Chain Lightning**: Cyan lightning arcs between enemies
- **Bomb Explosions**: Radial orange explosion effects
- **Bonus Upgrade Notifications**: Glowing perfect wave rewards

## 🔧 Customization

### Word Lists
The game uses categorized word lists based on dental terminology:
- **Short words** (3-5 letters): Basic dental terms
- **Medium words** (4-7 letters): Common dental procedures
- **Long words** (8+ letters): Advanced dental terminology

### Balance Settings
Key game balance variables can be adjusted in `script.js`:
- Enemy spawn rates and speeds
- Power-up drop chances
- Upgrade rarity probabilities
- Damage values and combo multipliers
- Slow-mo duration and cooldown

## 🐛 Easter Eggs

### Cheat Code
Type "black sheep wall" when the typing input is not focused to activate 100% power-up drop chance. A golden notification will appear when activated.

## 🌐 Browser Compatibility

TypeSlop is designed to work on all modern web browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📱 Performance

The game is optimized for smooth performance:
- 60 FPS target framerate
- Efficient DOM manipulation
- Minimal memory usage
- Responsive controls with no input lag

## 🎯 Game Statistics

Track your progress with real-time statistics:
- **Wave Number**: Current wave progression
- **Lives Remaining**: Current and maximum lives
- **Score**: Points earned from destroying enemies
- **Combo Count**: Current combo multiplier
- **Enemies Defeated**: Wave progress tracking

## 🔄 Game States

The game manages multiple states seamlessly:
- **Start Screen**: Difficulty selection and instructions
- **Active Gameplay**: Main game loop with enemy spawning
- **Upgrade Screen**: Loot box opening and upgrade selection
- **Game Over Screen**: Final score and restart options

---

**TypeSlop** - Test your typing skills in this addictive rogue-like adventure! Build powerful upgrade combinations, master new mechanics, and discover how many waves you can survive!
