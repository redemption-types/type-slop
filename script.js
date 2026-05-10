// Word Lists categorized by length
const WORD_LISTS = {
    short: [ // 3-5 letters for fast enemies
        'tooth', 'gum', 'bite', 'ache', 'mint', 'floss', 'cusp', 'root', 'crown', 'drill',
        'prep', 'etch', 'seal', 'pain', 'numb', 'snap', 'chip', 'pull', 'oral', 'jaw',
        'molar', 'ridge', 'paste', 'brush', 'rinse', 'probe', 'scrub', 'clean', 'fresh'
    ],
    medium: [ // 4-7 letters for normal enemies
        'enamel', 'dentin', 'canine', 'molar', 'occlus', 'gingiva',
        'plaque', 'tartar', 'scaler', 'polish', 'cement', 'matrix', 'rubber',
        'damper', 'suture', 'abscess', 'lesion', 'filling', 'caries', 'decay',
        'bonding', 'etchant', 'bursize', 'impress', 'digital', 'scanner', 'xray', 'sensor',
        'saliva', 'tongue', 'buccal', 'lingual', 'mesial', 'distal', 'apical', 'coronal'
    ],
    long: [ // 8-12 letters for tank enemies
        'periodontal', 'endodontics', 'orthodontic', 'prosthodont', 'hygienist',
        'malocclusion', 'radiograph', 'anesthesia', 'temporomand', 'implantology',
        'debridement', 'fluoridation', 'osseointegr', 'pathologist', 'maxillofac',
        'biocompat', 'articulation', 'sterilizer', 'amalgamation', 'odontogenic',
        'periapical', 'gingivectomy', 'odontoplasty', 'occlusogram'
    ]
};


// Game State
class GameState {
    constructor() {
        this.wave = 1;
        this.lives = 3;
        this.score = 0;
        this.combo = 0;
        this.slowMoReady = true;
        this.slowMoCooldown = 8000; // 8 seconds
        this.slowMoDuration = 2000; // 2 seconds
        this.slowMoActive = false;
        this.enemies = [];
        this.powerUps = [];
        this.gameRunning = false;
        this.upgrades = [];
        this.typingDamage = 1; // For tank enemies
        this.comboDamageBonus = 0;
        this.enemySpeedMultiplier = 1;
        this.spawnDelayMultiplier = 1;
        this.maxLives = 3;
        this.waveCompleted = false;
        this.waveEnemiesSpawned = false;
        this.firstEnemySpawned = false;
        this.enemiesDefeated = 0;
        this.totalEnemiesInWave = 0;
        this.powerUpCheatActive = false; // Easter egg: 100% power-up drops
        this.freezeActive = false;
        this.freezeEndTime = 0;
    }
}

// Enemy Class
class Enemy {
    constructor(word, type, x, y) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.word = word;
        this.type = type;
        this.hp = type === 'tank' || type === 'double' ? 2 : 1;
        this.maxHp = this.hp;
        this.x = x;
        this.y = y;
        this.speed = this.getBaseSpeed();
        this.element = null;
        this.originalWord = word;
    }

    getBaseSpeed() {
        const baseSpeed = 1; // pixels per frame
        const game = window.game; // Reference to game instance for difficulty
        
        switch (this.type) {
            case 'fast': return baseSpeed * 1.5 * (game ? game.difficultySettings.fastSpeedBonus : 1);
            case 'tank': return baseSpeed * 0.8 * (game ? game.difficultySettings.tankSpeedBonus : 1);
            case 'double': return baseSpeed * 1.2 * (game ? game.difficultySettings.doubleSpeedBonus : 1);
            default: return baseSpeed * (game ? game.difficultySettings.enemySpeedBonus : 1);
        }
    }

    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            return true; // Enemy destroyed
        }
        
        // For double enemies, swap to a new shorter word after first hit
        if (this.type === 'double' && this.hp === 1) {
            const shortWords = WORD_LISTS.short;
            const newWord = shortWords[Math.floor(Math.random() * shortWords.length)];
            this.word = newWord;
            this.originalWord = newWord;
            return false; // Enemy still alive but word changed
        }
        
        return false; // Enemy still alive
    }
}

// PowerUp Class
class PowerUp {
    constructor(type, x, y) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = type; // 'freeze', 'nuke', 'heal'
        this.x = x;
        this.y = y;
        this.element = null;
    }
}

// Lootbox rarity system
const RARITY_COLORS = {
    common: '#808080',      // Gray
    rare: '#4169E1',        // Royal Blue
    epic: '#9932CC',        // Dark Orchid
    legendary: '#FFD700'    // Gold
};

const RARITY_PROBABILITIES = {
    common: 0.60,    // 60%
    rare: 0.25,      // 25%
    epic: 0.12,      // 12%
    legendary: 0.03  // 3%
};

// Upgrade definitions with rarity system
const UPGRADES = [
    // Common upgrades (60% chance)
    {
        name: '+5% Typing Damage',
        description: 'Deal more damage to tank enemies',
        rarity: 'common',
        apply: (gameState) => {
            gameState.typingDamage *= 1.05;
        }
    },
    {
        name: '+3% Slow-Mo Duration',
        description: 'Slow-mo lasts longer',
        rarity: 'common',
        apply: (gameState) => {
            gameState.slowMoDuration *= 1.03;
        }
    },
    {
        name: '-3% Slow-Mo Cooldown',
        description: 'Use slow-mo more often',
        rarity: 'common',
        apply: (gameState) => {
            gameState.slowMoCooldown *= 0.97;
        }
    },
    {
        name: '+3% Enemy Spawn Delay',
        description: 'Enemies spawn slower',
        rarity: 'common',
        apply: (gameState) => {
            gameState.spawnDelayMultiplier *= 1.03;
        }
    },
    
    // Rare upgrades (25% chance)
    {
        name: '+10% Typing Damage',
        description: 'Deal significantly more damage to tank enemies',
        rarity: 'rare',
        apply: (gameState) => {
            gameState.typingDamage *= 1.1;
        }
    },
    {
        name: '+5% Slow-Mo Duration',
        description: 'Slow-mo lasts noticeably longer',
        rarity: 'rare',
        apply: (gameState) => {
            gameState.slowMoDuration *= 1.05;
        }
    },
    {
        name: '-5% Slow-Mo Cooldown',
        description: 'Use slow-mo more frequently',
        rarity: 'rare',
        apply: (gameState) => {
            gameState.slowMoCooldown *= 0.95;
        }
    },
    {
        name: '+5% Combo Damage Bonus',
        description: 'Combos deal more damage',
        rarity: 'rare',
        apply: (gameState) => {
            gameState.comboDamageBonus += 0.05;
        }
    },
    
    // Epic upgrades (12% chance)
    {
        name: '+15% Typing Damage',
        description: 'Deal massive damage to tank enemies',
        rarity: 'epic',
        apply: (gameState) => {
            gameState.typingDamage *= 1.15;
        }
    },
    {
        name: '+1 Max Life',
        description: 'Increase maximum lives',
        rarity: 'epic',
        apply: (gameState) => {
            gameState.maxLives += 1;
            gameState.lives += 1;
        }
    },
    {
        name: '+10% Combo Damage Bonus',
        description: 'Combos deal significantly more damage',
        rarity: 'epic',
        apply: (gameState) => {
            gameState.comboDamageBonus += 0.1;
        }
    },
    {
        name: 'Instant Slow-Mo Reset',
        description: 'Slow-mo cooldown is instantly reset',
        rarity: 'epic',
        apply: (gameState) => {
            gameState.slowMoReady = true;
        }
    },
    
    // Legendary upgrades (3% chance)
    {
        name: '+25% Typing Damage',
        description: 'Deal devastating damage to tank enemies',
        rarity: 'legendary',
        apply: (gameState) => {
            gameState.typingDamage *= 1.25;
        }
    },
    {
        name: '+2 Max Lives',
        description: 'Increase maximum lives by 2',
        rarity: 'legendary',
        apply: (gameState) => {
            gameState.maxLives += 2;
            gameState.lives += 2;
        }
    },
    {
        name: 'Permanent Slow-Mo',
        description: 'Slow-mo lasts 50% longer and has 50% shorter cooldown',
        rarity: 'legendary',
        apply: (gameState) => {
            gameState.slowMoDuration *= 1.5;
            gameState.slowMoCooldown *= 0.5;
        }
    },
    {
        name: 'Combo Master',
        description: 'Combo damage bonus doubled',
        rarity: 'legendary',
        apply: (gameState) => {
            gameState.comboDamageBonus *= 2;
        }
    }
];

// Lootbox class for managing the opening animation and selection
class Lootbox {
    constructor() {
        this.isOpening = false;
        this.selectedUpgrade = null;
        this.spinningUpgrades = [];
    }

    getRandomRarity() {
        const roll = Math.random();
        let cumulative = 0;
        
        for (const [rarity, probability] of Object.entries(RARITY_PROBABILITIES)) {
            cumulative += probability;
            if (roll <= cumulative) {
                return rarity;
            }
        }
        return 'common';
    }

    getRandomUpgrade(rarity) {
        const upgradesOfRarity = UPGRADES.filter(upgrade => upgrade.rarity === rarity);
        return upgradesOfRarity[Math.floor(Math.random() * upgradesOfRarity.length)];
    }

    async openLootbox() {
        if (this.isOpening) return;
        
        this.isOpening = true;
        
        // Determine the rarity and upgrade
        const rarity = this.getRandomRarity();
        this.selectedUpgrade = this.getRandomUpgrade(rarity);
        
        // Create spinning animation
        this.createSpinningAnimation();
        
        // Wait for animation to complete
        await this.waitForAnimation();
        
        // Reveal the final upgrade
        this.revealUpgrade();
        
        this.isOpening = false;
        
        return this.selectedUpgrade;
    }

    createSpinningAnimation() {
        const container = document.getElementById('lootbox-animation');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Create horizontal scrolling track
        const track = document.createElement('div');
        track.className = 'csgo-track';
        
        // Create many cards for horizontal scrolling
        const cardCount = 50;
        const targetIndex = Math.floor(cardCount * 0.75); // Target position for final result
        
        for (let i = 0; i < cardCount; i++) {
            const card = document.createElement('div');
            card.className = 'csgo-card';
            
            // Determine if this is the winning card
            const isWinningCard = i === targetIndex;
            const rarity = isWinningCard ? this.selectedUpgrade.rarity : this.getRandomRarity();
            const upgrade = isWinningCard ? this.selectedUpgrade : this.getRandomUpgrade(rarity);
            
            card.innerHTML = `
                <div class="csgo-card-rarity" style="color: ${RARITY_COLORS[rarity]}">
                    ${rarity.toUpperCase()}
                </div>
                <div class="csgo-card-name">${upgrade.name}</div>
                <div class="csgo-card-desc">${upgrade.description}</div>
            `;
            
            track.appendChild(card);
        }
        
        container.appendChild(track);
        
        // Start horizontal scrolling animation
        setTimeout(() => {
            this.startCSGOSpinning(track, targetIndex);
        }, 100);
    }

    startCSGOSpinning(track, targetIndex) {
        const cardWidth = 180;
        const cardMargin = 20;
        const totalCardWidth = cardWidth + cardMargin;
        const containerWidth = track.parentElement.offsetWidth;
        
        // Calculate exact position to center target card under the marker
        // The marker is positioned at left: 50% of the container
        // So we need the target card's center to be at the container's 50% mark
        const targetCardStart = targetIndex * totalCardWidth;
        const targetCardCenter = targetCardStart + (cardWidth / 2);
        const containerHalfWidth = containerWidth / 2;
        
        // Final position should place the target card's center at the container's center
        const finalPosition = containerHalfWidth - targetCardCenter;
        
        // Start from far right (outside container)
        track.style.transform = `translateX(${containerWidth}px)`;
        track.style.transition = 'none';
        
        // Force reflow
        track.offsetHeight;
        
        // Animate to final centered position
        setTimeout(() => {
            track.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.83, 0.67)';
            track.style.transform = `translateX(${finalPosition}px)`;
        }, 50);
    }

    async waitForAnimation() {
        return new Promise(resolve => {
            setTimeout(resolve, 4000); // 4 seconds for CSGO-style animation
        });
    }

    revealUpgrade() {
        const container = document.getElementById('lootbox-animation');
        if (!container) return;
        
        // Wait a moment for the spinning animation to fully settle
        setTimeout(() => {
            container.classList.remove('spinning');
            
            // Just clear the container without any fade animation
            container.innerHTML = '';
            
            // Create particle explosion effect
            this.createParticleExplosion(container);
            
            // Create the final revealed card
            const card = document.createElement('div');
            card.className = 'lootbox-card revealed';
            
            card.innerHTML = `
                <div class="card-rarity" style="color: ${RARITY_COLORS[this.selectedUpgrade.rarity]}">
                    ${this.selectedUpgrade.rarity.toUpperCase()}
                </div>
                <div class="card-name">${this.selectedUpgrade.name}</div>
                <div class="card-description">${this.selectedUpgrade.description}</div>
            `;
            
            container.appendChild(card);
            
            // Add reveal animation
            setTimeout(() => {
                card.classList.add('reveal-animation');
            }, 100);
        }, 200); // Small delay to ensure animation settles
    }

    createParticleExplosion(container) {
        const particleCount = this.selectedUpgrade.rarity === 'legendary' ? 50 : 
                            this.selectedUpgrade.rarity === 'epic' ? 30 : 
                            this.selectedUpgrade.rarity === 'rare' ? 20 : 10;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'lootbox-particle';
            
            // Set particle color based on rarity
            const color = RARITY_COLORS[this.selectedUpgrade.rarity];
            particle.style.backgroundColor = color;
            particle.style.boxShadow = `0 0 6px ${color}`;
            
            // Random size
            const size = Math.random() * 8 + 4;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Random position and direction
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const velocity = Math.random() * 200 + 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
            container.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => particle.remove(), 1500);
        }
    }
}

// Difficulty Settings
const DIFFICULTY_SETTINGS = {
    easy: {
        enemySpeedMultiplier: 0.7,  // 30% slower
        spawnDelayMultiplier: 1.3,   // 30% slower spawning
        enemySpeedBonus: 0.7,
        fastSpeedBonus: 0.7,
        tankSpeedBonus: 0.7,
        doubleSpeedBonus: 0.7
    },
    medium: {
        enemySpeedMultiplier: 1.0,  // Normal speed
        spawnDelayMultiplier: 1.0,   // Normal spawning
        enemySpeedBonus: 1.0,
        fastSpeedBonus: 1.0,
        tankSpeedBonus: 1.0,
        doubleSpeedBonus: 1.0
    },
    hard: {
        enemySpeedMultiplier: 1.3,  // 30% faster
        spawnDelayMultiplier: 0.8,   // 20% faster spawning
        enemySpeedBonus: 1.3,
        fastSpeedBonus: 1.3,
        tankSpeedBonus: 1.3,
        doubleSpeedBonus: 1.3
    }
};

// Main Game Class
class TypeSlopGame {
    constructor() {
        this.gameState = new GameState();
        this.gameArea = document.getElementById('game-area');
        this.enemiesContainer = document.getElementById('enemies-container');
        this.typingInput = document.getElementById('typing-input');
        this.waveDisplay = document.getElementById('wave');
        this.livesDisplay = document.getElementById('lives');
        this.scoreDisplay = document.getElementById('score');
        this.comboDisplay = document.getElementById('combo');
        this.slowmoFill = document.getElementById('slowmo-fill');
        this.waveCounter = document.getElementById('wave-counter');
        this.upgradeWaveCounter = document.getElementById('upgrade-wave-counter');
        this.startScreen = document.getElementById('start-screen');
        this.upgradeScreen = document.getElementById('upgrade-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.screenBackdrop = document.getElementById('screen-backdrop');
        this.enemiesDefeatedDisplay = document.getElementById('enemies-defeated');
        this.enemiesToDefeatDisplay = document.getElementById('enemies-to-defeat');
        
        this.lastSpawnTime = 0;
        this.spawnInterval = 2000; // Base spawn interval
        this.animationId = null;
        this.slowMoTimeout = null;
        this.slowMoCooldownTimeout = null;
        
        // Colors for wave counter
        this.waveColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#48dbfb'];
        
        // Current difficulty
        this.currentDifficulty = 'medium';
        this.difficultySettings = DIFFICULTY_SETTINGS.medium;
        
        // Initialize lootbox system
        this.lootbox = new Lootbox();
        this.currentUpgrade = null;
        
        // Cheat code tracking
        this.cheatCodeBuffer = '';
        this.targetCheatCode = 'black sheep wall';
        
        this.init();
    }

    selectDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        this.difficultySettings = DIFFICULTY_SETTINGS[difficulty];
        
        // Update button states
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-checked', 'false');
        });
        
        const selectedBtn = document.querySelector(`[data-difficulty="${difficulty}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
            selectedBtn.setAttribute('aria-checked', 'true');
        }
    }

    init() {
        // Event listeners
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.startGame();
            });
        }
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('main-menu-btn').addEventListener('click', () => this.returnToMainMenu());
        this.typingInput.addEventListener('input', (e) => this.handleTyping(e));
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Initialize upgrades display
        this.updateUpgradesDisplay();
        
        // Difficulty selection event listeners - using event delegation
        document.addEventListener('click', (e) => {
            const clickedBtn = e.target.closest('.difficulty-btn');
            if (clickedBtn) {
                e.preventDefault();
                e.stopPropagation();
                
                const difficulty = clickedBtn.dataset.difficulty;
                if (difficulty) {
                    this.selectDifficulty(difficulty);
                }
            }
        });
        
        // Focus input only when game starts, not on load
        // this.typingInput.focus();
        
        // Set global reference for enemy speed calculations
        window.game = this;
    }

    startGame() {
        // Hide all screens
        this.startScreen.classList.add('hidden');
        this.upgradeScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.screenBackdrop.classList.add('hidden');
        
        // Clear any existing enemies and power-ups
        this.enemiesContainer.innerHTML = '';
        
        // Reset game state but preserve cheat status
        const previousCheatState = this.gameState.powerUpCheatActive;
        this.gameState = new GameState();
        this.gameState.powerUpCheatActive = previousCheatState;
        this.gameState.gameRunning = true;
        this.gameState.enemySpeedMultiplier = this.difficultySettings.enemySpeedMultiplier;
        this.gameState.spawnDelayMultiplier = this.difficultySettings.spawnDelayMultiplier;
        
        // Clear any timeouts
        if (this.slowMoTimeout) clearTimeout(this.slowMoTimeout);
        if (this.slowMoCooldownTimeout) clearTimeout(this.slowMoCooldownTimeout);
        
        // Reset slow-mo bar
        this.slowmoFill.style.width = '100%';
        
        this.updateUI();
        this.startWave();
        this.gameLoop();
        
        // Focus input immediately when game starts
        this.typingInput.focus();
    }

    restartGame() {
        this.gameOverScreen.classList.add('hidden');
        this.screenBackdrop.classList.add('hidden');
        this.typingInput.value = '';
        this.startGame();
        // Focus input only after game starts
        setTimeout(() => this.typingInput.focus(), 100);
    }

    returnToMainMenu() {
        this.gameOverScreen.classList.add('hidden');
        this.screenBackdrop.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        this.typingInput.value = '';
        // Don't focus input on main menu - remove auto-focus
    }

    startWave() {
        // Reset wave flags
        this.gameState.waveCompleted = false;
        this.gameState.waveEnemiesSpawned = false;
        this.gameState.firstEnemySpawned = false;
        this.gameState.enemiesDefeated = 0;
        
        const enemyCount = 5 + this.gameState.wave;
        this.gameState.totalEnemiesInWave = enemyCount;
        this.spawnWaveEnemies(enemyCount);
        this.updateEnemyDefeatedDisplay();
    }

    spawnWaveEnemies(count) {
        const types = ['normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', // 70% normal
                      'fast', 'fast', // 20% fast
                      'double']; // 10% double HP enemies (replaced tank)
        
        // Mark that enemies are being spawned (with delay to prevent immediate completion)
        setTimeout(() => {
            this.gameState.waveEnemiesSpawned = true;
        }, 500);
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (!this.gameState.gameRunning) return;
                
                const type = types[Math.floor(Math.random() * types.length)];
                const wordList = this.getWordListForType(type);
                const word = wordList[Math.floor(Math.random() * wordList.length)];
                const x = Math.random() * (this.gameArea.offsetWidth - 100);
                
                const enemy = new Enemy(word, type, x, -50);
                this.gameState.enemies.push(enemy);
                this.createEnemyElement(enemy);
                
                // Mark that enemies have started spawning (only on first enemy)
                if (i === 0) {
                    this.gameState.firstEnemySpawned = true;
                }
            }, 1000 + i * 1000 * this.difficultySettings.spawnDelayMultiplier); // 1 second base delay + difficulty-adjusted intervals
        }
    }

    getWordListForType(type) {
        switch (type) {
            case 'fast': return WORD_LISTS.short;
            case 'tank': return WORD_LISTS.medium; // Use normal length words for tank
            case 'double': return WORD_LISTS.short; // Use short words for double HP enemies
            default: return WORD_LISTS.medium;
        }
    }

    createEnemyElement(enemy) {
        const element = document.createElement('div');
        element.className = `enemy ${enemy.type}`;
        
        // Create HP display for multi-HP enemies
        if ((enemy.type === 'tank' || enemy.type === 'double') && enemy.hp > 1) {
            const hpDisplay = document.createElement('div');
            hpDisplay.className = 'enemy-hp';
            hpDisplay.textContent = `HP:${enemy.hp}`;
            
            const wordDisplay = document.createElement('div');
            wordDisplay.className = 'enemy-word';
            wordDisplay.textContent = enemy.word;
            
            element.appendChild(hpDisplay);
            element.appendChild(wordDisplay);
        } else {
            const wordDisplay = document.createElement('div');
            wordDisplay.className = 'enemy-word';
            wordDisplay.textContent = enemy.word;
            element.appendChild(wordDisplay);
        }
        
        element.style.position = 'absolute';
        element.style.left = `${enemy.x}px`;
        element.style.top = `${enemy.y}px`;
        element.style.zIndex = '10';
        
        enemy.element = element;
        this.enemiesContainer.appendChild(element);
        
        // Apply freeze effect if freeze is currently active
        if (this.gameState.freezeActive) {
            console.log('[FREEZE] Applying freeze to newly spawned enemy:', enemy.word);
            enemy.speed = 0;
            enemy.element.style.filter = 'hue-rotate(200deg) brightness(1.5)';
        }
    }

    handleTyping(e) {
        const typedText = e.target.value.toLowerCase().trim();
        
        if (!typedText) {
            this.clearEnemyHighlights();
            return;
        }

        let matchedEnemy = null;
        for (const enemy of this.gameState.enemies) {
            if (enemy.word.toLowerCase().startsWith(typedText)) {
                matchedEnemy = enemy;
                break;
            }
        }

        this.clearEnemyHighlights();
        
        if (matchedEnemy) {
            matchedEnemy.element.classList.add('matched');
            
            if (matchedEnemy.word.toLowerCase() === typedText) {
                this.destroyEnemy(matchedEnemy);
                this.typingInput.value = '';
                e.target.value = '';
            }
        }
    }

    clearEnemyHighlights() {
        document.querySelectorAll('.enemy.matched').forEach(el => {
            el.classList.remove('matched');
        });
    }

    destroyEnemy(enemy) {
        const damage = this.gameState.typingDamage + Math.floor(this.gameState.combo / 5) * this.gameState.comboDamageBonus;
        const destroyed = enemy.takeDamage(damage);
        
        if (destroyed) {
            // Show word explosion effect
            this.showWordExplosion(enemy);
            
            // Remove enemy
            this.gameState.enemies = this.gameState.enemies.filter(e => e.id !== enemy.id);
            enemy.element.remove();
            
            // Update score and combo
            this.gameState.score += 10 * (this.gameState.combo + 1);
            this.gameState.combo++;
            
            // Increment enemies defeated counter
            this.gameState.enemiesDefeated++;
            this.updateEnemyDefeatedDisplay();
            console.log('[DESTROY] Enemy destroyed. Enemies defeated:', this.gameState.enemiesDefeated);
            
            // Show combo popup
            if (this.gameState.combo > 0 && this.gameState.combo % 5 === 0) {
                this.showComboPopup(enemy.x, enemy.y, this.gameState.combo);
            }
            
            // Chance to drop power-up
            const dropChance = this.gameState.powerUpCheatActive ? 1.0 : 0.1;
            if (Math.random() < dropChance) {
                console.log('[POWERUP] Dropping power-up from enemy:', enemy.word);
                this.dropPowerUp(enemy.x, enemy.y);
            }
        } else {
            // Enemy damaged but not destroyed
            enemy.element.classList.add('damaged');
            setTimeout(() => enemy.element.classList.remove('damaged'), 300);
            
            // Update enemy text to show new HP or word change
            if (enemy.type === 'tank') {
                const hpDisplay = enemy.element.querySelector('.enemy-hp');
                const wordDisplay = enemy.element.querySelector('.enemy-word');
                
                if (enemy.hp > 1) {
                    if (!hpDisplay) {
                        // Add HP display if it doesn't exist
                        const hpDiv = document.createElement('div');
                        hpDiv.className = 'enemy-hp';
                        hpDiv.textContent = `HP:${enemy.hp}`;
                        enemy.element.insertBefore(hpDiv, wordDisplay);
                    } else {
                        hpDisplay.textContent = `HP:${enemy.hp}`;
                    }
                } else {
                    // Remove HP display if HP is 1
                    if (hpDisplay) {
                        hpDisplay.remove();
                    }
                }
                wordDisplay.textContent = enemy.word;
            } else if (enemy.type === 'double') {
                const hpDisplay = enemy.element.querySelector('.enemy-hp');
                const wordDisplay = enemy.element.querySelector('.enemy-word');
                
                if (enemy.hp > 1) {
                    if (!hpDisplay) {
                        // Add HP display if it doesn't exist
                        const hpDiv = document.createElement('div');
                        hpDiv.className = 'enemy-hp';
                        hpDiv.textContent = `HP:${enemy.hp}`;
                        enemy.element.insertBefore(hpDiv, wordDisplay);
                    } else {
                        hpDisplay.textContent = `HP:${enemy.hp}`;
                    }
                } else {
                    // Remove HP display if HP is 1
                    if (hpDisplay) {
                        hpDisplay.remove();
                    }
                }
                wordDisplay.textContent = enemy.word; // Show new word after swap
            }
        }
        
        this.updateUI();
    }

    dropPowerUp(x, y) {
        console.log('[POWERUP] Dropping power-up at position:', x, y);
        const types = ['freeze', 'nuke', 'heal'];
        const type = types[Math.floor(Math.random() * types.length)];
        console.log('[POWERUP] Type selected:', type);
        const powerUp = new PowerUp(type, x, y + 20);
        this.gameState.powerUps.push(powerUp);
        this.createPowerUpElement(powerUp);
    }

    createPowerUpElement(powerUp) {
        console.log('[POWERUP] Creating element for type:', powerUp.type, 'at position:', powerUp.x, powerUp.y);
        // Create div element with CSS styling instead of image
        const div = document.createElement('div');
        div.className = `powerup ${powerUp.type}`;
        div.style.position = 'absolute';
        div.style.left = `${powerUp.x}px`;
        div.style.top = `${powerUp.y}px`;
        div.style.pointerEvents = 'none';
        div.style.zIndex = '1000';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        
        powerUp.element = div;
        this.enemiesContainer.appendChild(div);
        
        console.log('[POWERUP] Element appended to container. Container children:', this.enemiesContainer.children.length);
        
        // Auto-apply power-up immediately after a short delay (for visual feedback)
        setTimeout(() => {
            if (this.gameState.gameRunning) {
                console.log('[POWERUP] Auto-applying power-up:', powerUp.type);
                this.collectPowerUp(powerUp);
            }
        }, 500);
        
        // Make powerup disappear after 3 seconds if not collected (backup)
        setTimeout(() => {
            if (powerUp.element && powerUp.element.parentNode) {
                powerUp.element.style.opacity = '0';
                powerUp.element.style.transition = 'opacity 0.3s ease-out';
                setTimeout(() => {
                    if (powerUp.element && powerUp.element.parentNode) {
                        powerUp.element.remove();
                        this.gameState.powerUps = this.gameState.powerUps.filter(p => p.id !== powerUp.id);
                    }
                }, 300);
            }
        }, 3000);
    }

    showLoseLifeImage(x, y) {
        const loseLifeImage = document.createElement('div');
        loseLifeImage.className = 'lose-life-image';
        loseLifeImage.style.left = `${x}px`;
        loseLifeImage.style.top = `${y}px`;
        
        this.enemiesContainer.appendChild(loseLifeImage);
        
        // Remove after animation
        setTimeout(() => loseLifeImage.remove(), 2000);
    }

    showComboPopup(x, y, combo) {
        const popup = document.createElement('div');
        popup.className = 'combo-popup';
        popup.textContent = `${combo} COMBO!`;
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        
        this.enemiesContainer.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    }

    showPowerUpPopup(x, y, type) {
        const popup = document.createElement('div');
        popup.className = 'powerup-popup';
        
        let text = '';
        switch (type) {
            case 'freeze':
                text = '❄️ FREEZE!';
                break;
            case 'nuke':
                text = '💣 NUKE!';
                break;
            case 'heal':
                text = '❤️ HEAL!';
                break;
        }
        
        popup.textContent = text;
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        
        this.enemiesContainer.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    }

    showPowerUpEffect(type, text, x = null, y = null) {
        const effect = document.createElement('div');
        effect.className = `powerup-effect ${type}`;
        
        // Position at center of game area if no specific position given
        if (x === null || y === null) {
            x = this.gameArea.offsetWidth / 2;
            y = this.gameArea.offsetHeight / 2;
        }
        
        effect.textContent = text;
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        effect.style.transform = 'translate(-50%, -50%)';
        
        this.enemiesContainer.appendChild(effect);
        
        // Fade out and remove
        setTimeout(() => {
            effect.style.opacity = '0';
            effect.style.transition = 'opacity 0.5s ease-out';
        }, 100);
        
        setTimeout(() => {
            effect.remove();
        }, 600);
    }

    showWordExplosion(enemy) {
        // Create explosion container
        const explosion = document.createElement('div');
        explosion.className = 'word-explosion';
        explosion.style.left = `${enemy.x + enemy.element.offsetWidth / 2}px`;
        explosion.style.top = `${enemy.y + enemy.element.offsetHeight / 2}px`;
        
        // Create alien image that appears first
        const alienImage = document.createElement('div');
        alienImage.className = 'alien-image';
        explosion.appendChild(alienImage);
        
        // Create the word text that explodes (delayed)
        const wordText = document.createElement('div');
        wordText.className = 'word-explosion-text';
        wordText.textContent = enemy.word;
        explosion.appendChild(wordText);
        
                
        this.enemiesContainer.appendChild(explosion);
        
        // Remove explosion after animation
        setTimeout(() => explosion.remove(), 2300);
    }

    handleKeyDown(e) {
        if (e.code === 'Space' && this.gameState.slowMoReady && !this.gameState.slowMoActive && this.gameState.gameRunning) {
            e.preventDefault();
            this.activateSlowMo();
        }
        
        // Clear input with Escape key
        if (e.code === 'Escape' && this.gameState.gameRunning) {
            e.preventDefault();
            this.typingInput.value = '';
            this.clearEnemyHighlights();
        }
        
        // Cheat code detection (when input is not focused)
        if (document.activeElement !== this.typingInput) {
            if (e.key.length === 1) {
                this.cheatCodeBuffer += e.key.toLowerCase();
                
                // Check if the buffer contains the cheat code
                if (this.cheatCodeBuffer.includes(this.targetCheatCode)) {
                    this.activatePowerUpCheat();
                    this.cheatCodeBuffer = '';
                }
                
                // Keep buffer manageable (last 50 characters)
                if (this.cheatCodeBuffer.length > 50) {
                    this.cheatCodeBuffer = this.cheatCodeBuffer.slice(-50);
                }
            }
        }
    }

    activatePowerUpCheat() {
        console.log('[CHEAT] Power-up cheat activated');
        this.gameState.powerUpCheatActive = true;
        
        // Show cheat activation message
        const cheatMessage = document.createElement('div');
        cheatMessage.className = 'cheat-message';
        cheatMessage.textContent = '100% upgrades enabled';
        cheatMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #000;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 10000;
            animation: cheatPulse 2s ease-in-out;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
        `;
        
        // Add animation keyframes if not exists
        if (!document.querySelector('#cheat-animation')) {
            const style = document.createElement('style');
            style.id = 'cheat-animation';
            style.textContent = `
                @keyframes cheatPulse {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(cheatMessage);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            cheatMessage.style.opacity = '0';
            cheatMessage.style.transition = 'opacity 0.5s ease-out';
            setTimeout(() => cheatMessage.remove(), 500);
        }, 3000);
    }

    activateSlowMo() {
        this.gameState.slowMoActive = true;
        this.gameState.slowMoReady = false;
        this.gameArea.classList.add('slowmo-active');
        
        // Update slow-mo bar
        this.slowmoFill.style.width = '0%';
        
        // Deactivate after duration
        this.slowMoTimeout = setTimeout(() => {
            this.gameState.slowMoActive = false;
            this.gameArea.classList.remove('slowmo-active');
        }, this.gameState.slowMoDuration);
        
        // Start cooldown
        this.startSlowMoCooldown();
    }

    startSlowMoCooldown() {
        let cooldownProgress = 0;
        const cooldownInterval = setInterval(() => {
            cooldownProgress += 100;
            const progress = Math.min(cooldownProgress / this.gameState.slowMoCooldown * 100, 100);
            this.slowmoFill.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(cooldownInterval);
                this.gameState.slowMoReady = true;
            }
        }, 100);
    }

    gameLoop() {
        if (!this.gameState.gameRunning) return;
        
        // Update enemy positions
        this.gameState.enemies.forEach(enemy => {
            const speedMultiplier = this.gameState.slowMoActive ? 0.3 : 1;
            const speed = enemy.speed * this.gameState.enemySpeedMultiplier * speedMultiplier;
            enemy.y += speed;
            enemy.element.style.top = `${enemy.y}px`;
            
            // Check if enemy reached bottom
            if (enemy.y > this.gameArea.offsetHeight - 60) {
                this.enemyReachedBottom(enemy);
            }
        });
        
        // Update power-up positions - remove falling behavior
        // Powerups now stay in place and disappear after timeout
        
        // Check wave completion - only if enemies have been spawned and all are destroyed
        if (this.gameState.enemies.length === 0 && this.gameState.gameRunning && this.gameState.waveEnemiesSpawned && this.gameState.firstEnemySpawned) {
            this.completeWave();
        }
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    enemyReachedBottom(enemy) {
        this.gameState.enemies = this.gameState.enemies.filter(e => e.id !== enemy.id);
        enemy.element.remove();
        this.gameState.lives--;
        this.gameState.combo = 0;
        
        // Show lose life image
        this.showLoseLifeImage(enemy.x, enemy.y);
        
        this.updateUI();
        
        if (this.gameState.lives <= 0) {
            this.gameOver();
        }
    }

    collectPowerUp(powerUp) {
        console.log('[POWERUP] Collecting power-up:', powerUp.type, 'at position:', powerUp.x, powerUp.y);
        this.gameState.powerUps = this.gameState.powerUps.filter(p => p.id !== powerUp.id);
        powerUp.element.remove();
        
        // Show power-up popup
        this.showPowerUpPopup(powerUp.x, powerUp.y, powerUp.type);
        
        switch (powerUp.type) {
            case 'freeze':
                console.log('[POWERUP] Activating FREEZE effect');
                this.freezeEnemies();
                break;
            case 'nuke':
                console.log('[POWERUP] Activating NUKE effect');
                this.nukeNearestEnemy();
                break;
            case 'heal':
                console.log('[POWERUP] Activating HEAL effect');
                this.healPlayer();
                break;
        }
    }

    freezeEnemies() {
        console.log('[FREEZE] Freezing', this.gameState.enemies.length, 'enemies for 3 seconds');
        
        // Set freeze state
        this.gameState.freezeActive = true;
        this.gameState.freezeEndTime = Date.now() + 3000;
        
        // Store current speeds before freezing
        const enemySpeeds = new Map();
        this.gameState.enemies.forEach(enemy => {
            enemySpeeds.set(enemy.id, enemy.speed);
        });
        
        // Freeze immediately
        console.log('[FREEZE] Applying freeze effect to enemies');
        // this.showPowerUpEffect('freeze', 'FREEZE!');
        this.gameState.enemies.forEach(enemy => {
            console.log('[FREEZE] Setting enemy speed to 0:', enemy.word);
            enemy.speed = 0;
            enemy.element.style.filter = 'hue-rotate(200deg) brightness(1.5)';
        });
        
        // Set timeout to end freeze
        setTimeout(() => {
            this.endFreeze(enemySpeeds);
        }, 3000);
    }

    endFreeze(enemySpeeds) {
        console.log('[FREEZE] Ending freeze for all enemies');
        this.gameState.freezeActive = false;
        this.gameState.freezeEndTime = 0;
        
        // Restore speeds for all current enemies
        this.gameState.enemies.forEach(enemy => {
            console.log('[FREEZE] Restoring enemy speed:', enemy.word);
            enemy.speed = enemySpeeds.get(enemy.id) || enemy.getBaseSpeed();
            enemy.element.style.filter = '';
        });
    }

    nukeNearestEnemy() {
        console.log('[NUKE] Enemies on screen:', this.gameState.enemies.length);
        if (this.gameState.enemies.length === 0) {
            console.log('[NUKE] No enemies to nuke');
            return;
        }
        
        const nearestEnemy = this.gameState.enemies.reduce((nearest, enemy) => {
            return enemy.y > nearest.y ? enemy : nearest;
        });
        
        console.log('[NUKE] Targeting enemy:', nearestEnemy.word, 'at Y:', nearestEnemy.y);
        // Show nuke effect at enemy position
        // this.showPowerUpEffect('nuke', '💥', nearestEnemy.x, nearestEnemy.y);
        
        setTimeout(() => {
            console.log('[NUKE] Destroying enemy:', nearestEnemy.word);
            
            // Check if enemy still exists in the array
            const enemyExists = this.gameState.enemies.includes(nearestEnemy);
            console.log('[NUKE] Enemy still exists in array:', enemyExists);
            
            if (enemyExists) {
                // Create nuke explosion at enemy position before destroying
                const explosionX = nearestEnemy.x + nearestEnemy.element.offsetWidth / 2;
                const explosionY = nearestEnemy.y + nearestEnemy.element.offsetHeight / 2;
                this.createNukeExplosion(explosionX, explosionY);
                
                this.destroyEnemy(nearestEnemy);
                console.log('[NUKE] Enemies defeated after nuke:', this.gameState.enemiesDefeated);
            } else {
                console.log('[NUKE] Enemy was already destroyed, skipping');
            }
        }, 300);
    }

    healPlayer() {
        console.log('[HEAL] Current lives:', this.gameState.lives, 'Max lives:', this.gameState.maxLives);
        // this.showPowerUpEffect('heal', '+1❤️');
        
        setTimeout(() => {
            const oldLives = this.gameState.lives;
            this.gameState.lives = Math.min(this.gameState.lives + 1, this.gameState.maxLives);
            console.log('[HEAL] Lives changed from', oldLives, 'to', this.gameState.lives);
            this.updateUI();
            
            // Also update the lives display directly to ensure it updates
            if (this.livesDisplay) {
                this.livesDisplay.textContent = this.gameState.lives;
                console.log('[HEAL] Directly updated lives display to:', this.gameState.lives);
            }
        }, 500);
    }

    completeWave() {
        // Prevent multiple calls to completeWave
        if (this.gameState.waveCompleted) {
            return;
        }
        this.gameState.waveCompleted = true;
        this.gameState.gameRunning = false;
        
        // Increment wave count when wave is completed
        this.gameState.wave++;
        
        // Apply difficulty scaling
        this.gameState.enemySpeedMultiplier *= 1.03;
        this.gameState.spawnDelayMultiplier *= 0.98;
        
        // Show upgrade screen
        this.showUpgradeScreen();
    }

    showUpgradeScreen() {
        // Pause game
        this.gameState.gameRunning = false;
        
        // Clear typing input
        this.typingInput.value = '';
        
        // Update wave counter
        document.getElementById('upgrade-wave-counter').textContent = `Completed Wave ${this.gameState.wave}`;
        
        // Reset lootbox UI
        this.resetLootboxUI();
        
        // Get lootbox element
        const lootboxElement = document.getElementById('lootbox');
        const lootboxImage = document.getElementById('lootbox-image');
        
        // Reset lootbox image
        if (lootboxImage) {
            lootboxImage.src = 'lootbox-close-state.png';
        }
        
        // Remove opening classes
        lootboxElement.classList.remove('opening', 'opened');
        
        // Add click listener for opening
        lootboxElement.addEventListener('click', () => this.openLootbox(), { once: true });
        
        // Wait for animations to complete before showing upgrade screen
        // Word explosion animations last 2300ms, add extra buffer for safety
        setTimeout(() => {
            this.upgradeScreen.classList.remove('hidden');
            this.screenBackdrop.classList.remove('hidden');
        }, 2500); // 2.5 second delay to ensure all animations complete
    }

    resetLootboxUI() {
        const result = document.getElementById('lootbox-result');
        const lootboxElement = document.getElementById('lootbox');
        const animationContainer = document.getElementById('lootbox-animation-container');
        
        if (animationContainer) {
            animationContainer.style.display = 'none';
        }
        if (result) {
            result.style.display = 'none';
        }
        if (lootboxElement) {
            lootboxElement.classList.remove('opening');
        }
        
        // Clear animation content
        const animation = document.getElementById('lootbox-animation');
        if (animation) {
            animation.innerHTML = '';
        }
        
        // Reset lootbox image to closed state
        const lootboxImage = document.getElementById('lootbox-image');
        if (lootboxImage) {
            lootboxImage.src = 'lootbox-close-state.png';
        }
    }

    async openLootbox() {
        const lootboxElement = document.getElementById('lootbox');
        const animationContainer = document.getElementById('lootbox-animation-container');
        const result = document.getElementById('lootbox-result');
        const lootboxImage = document.getElementById('lootbox-image');
        
        // Add opening animation to lootbox
        lootboxElement.classList.add('opening');
        
        // Change lootbox image to open state
        if (lootboxImage) {
            lootboxImage.src = 'lootbox-open-state.png';
        }
        
        // Create explosion sparkle effect
        this.createExplosionEffect(lootboxElement);
        
        // Show animation container
        animationContainer.style.display = 'block';
        
        // Open the lootbox and get the upgrade
        this.currentUpgrade = await this.lootbox.openLootbox();
        
        // Hide animation container and show result
        setTimeout(() => {
            animationContainer.style.display = 'none';
            this.showLootboxResult();
        }, 1000); // Reduced timing since we removed fade-out animation
    }

    createExplosionEffect(lootboxElement) {
        const rect = lootboxElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create sparkle particles
        const particleCount = 30;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-sparkle';
            
            // Random color for sparkles
            const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#667eea', '#764ba2', '#f093fb'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.backgroundColor = color;
            particle.style.boxShadow = `0 0 10px ${color}`;
            
            // Random size
            const size = Math.random() * 8 + 4;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Calculate random direction
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const velocity = Math.random() * 300 + 200;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
            // Position at center of lootbox
            particle.style.position = 'fixed';
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            particle.style.transform = 'translate(-50%, -50%)';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            
            document.body.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => particle.remove(), 2000);
        }
    }

    createNukeExplosion(x, y) {
        // Create explosion particles at enemy position
        const particleCount = 25;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'nuke-particle';
            
            // Orange/red explosion colors
            const colors = ['#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FFFF00', '#FF0000'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.backgroundColor = color;
            particle.style.boxShadow = `0 0 8px ${color}`;
            
            // Random size for variety
            const size = Math.random() * 10 + 6;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Calculate random explosion direction
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
            const velocity = Math.random() * 250 + 150;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
            // Position at enemy center
            particle.style.position = 'absolute';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.transform = 'translate(-50%, -50%)';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            
            this.enemiesContainer.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => particle.remove(), 1500);
        }
    }

    showLootboxResult() {
        const result = document.getElementById('lootbox-result');
        const resultCard = document.getElementById('result-card');
        
        // Create result card with the upgrade
        resultCard.innerHTML = `
            <div class="card-rarity" style="color: ${RARITY_COLORS[this.currentUpgrade.rarity]}">
                ${this.currentUpgrade.rarity.toUpperCase()}
            </div>
            <div class="card-name">${this.currentUpgrade.name}</div>
            <div class="card-description">${this.currentUpgrade.description}</div>
        `;
        
        // Set border color based on rarity
        resultCard.style.borderColor = RARITY_COLORS[this.currentUpgrade.rarity];
        resultCard.style.boxShadow = `0 0 40px ${RARITY_COLORS[this.currentUpgrade.rarity]}40`;
        
        // Show result
        result.style.display = 'block';
        
        // Add continue button event listener
        const continueBtn = document.getElementById('continue-btn');
        continueBtn.addEventListener('click', () => this.applyUpgradeAndContinue(), { once: true });
    }

    applyUpgradeAndContinue() {
        if (this.currentUpgrade) {
            console.log('Applying upgrade:', this.currentUpgrade.name);
            
            // Apply upgrade effect
            this.currentUpgrade.apply(this.gameState);
            
            // Store the upgrade in gameState
            this.gameState.upgrades.push({
                name: this.currentUpgrade.name,
                description: this.currentUpgrade.description,
                rarity: this.currentUpgrade.rarity
            });
            
            // Update upgrades display
            this.updateUpgradesDisplay();
            
            // Hide upgrade screen and backdrop
            this.upgradeScreen.classList.add('hidden');
            this.screenBackdrop.classList.add('hidden');
            
            // Resume game
            this.gameState.gameRunning = true;
            this.updateUI();
            this.startWave();
            this.gameLoop();
            
            // Focus the typing input only when game resumes
            setTimeout(() => this.typingInput.focus(), 100);
            
            // Clear current upgrade
            this.currentUpgrade = null;
        }
    }

    gameOver() {
        this.gameState.gameRunning = false;
        cancelAnimationFrame(this.animationId);
        
        document.getElementById('final-score').textContent = this.gameState.score;
        document.getElementById('final-wave').textContent = this.gameState.wave;
        this.gameOverScreen.classList.remove('hidden');
        this.screenBackdrop.classList.remove('hidden');
    }

    updateUI() {
        this.waveDisplay.textContent = this.gameState.wave;
        this.livesDisplay.textContent = this.gameState.lives;
        this.scoreDisplay.textContent = this.gameState.score;
        this.comboDisplay.textContent = this.gameState.combo;
        
        // Update wave counter with color
        this.waveCounter.textContent = `lasted ${this.gameState.wave - 1} waves`;
        this.waveCounter.style.color = this.waveColors[(this.gameState.wave - 1) % this.waveColors.length];
    }

    updateEnemyDefeatedDisplay() {
        this.enemiesDefeatedDisplay.textContent = this.gameState.enemiesDefeated;
        this.enemiesToDefeatDisplay.textContent = this.gameState.totalEnemiesInWave;
    }

    updateUpgradesDisplay() {
        const upgradesList = document.getElementById('upgrades-list');
        
        if (!upgradesList) return;
        
        // Clear existing content
        upgradesList.innerHTML = '';
        
        if (this.gameState.upgrades.length === 0) {
            // Show no upgrades message
            upgradesList.innerHTML = '<p class="no-upgrades">No upgrades yet. Complete waves to earn upgrades!</p>';
        } else {
            // Display each upgrade
            this.gameState.upgrades.forEach((upgrade, index) => {
                const upgradeItem = document.createElement('div');
                upgradeItem.className = `upgrade-item ${upgrade.rarity}`;
                
                upgradeItem.innerHTML = `
                    <div class="upgrade-rarity">${upgrade.rarity.toUpperCase()}</div>
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-description">${upgrade.description}</div>
                `;
                
                upgradesList.appendChild(upgradeItem);
            });
            
            // Auto-scroll to the newest upgrade
            setTimeout(() => {
                if (upgradesList.lastElementChild) {
                    upgradesList.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }, 100);
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new TypeSlopGame();
    // Make game instance globally accessible for debugging
    window.gameInstance = game;
    console.log('Game initialized:', game);
    console.log('testDifficulty function available:', typeof window.testDifficulty);
});
