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
        
        this.init();
    }

    selectDifficulty(difficulty) {
        console.log('selectDifficulty called with:', difficulty);
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
            console.log('Difficulty set to:', difficulty, 'Settings:', this.difficultySettings);
        } else {
            console.error('Could not find button for difficulty:', difficulty);
        }
    }

    init() {
        // Event listeners
        const startBtn = document.getElementById('start-btn');
        console.log('Start button found:', startBtn);
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                console.log('=== START BUTTON CLICKED ===');
                console.log('Current difficulty before start:', this.currentDifficulty);
                console.log('Difficulty settings before start:', this.difficultySettings);
                e.preventDefault();
                this.startGame();
            });
        } else {
            console.error('Start button not found!');
        }
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('main-menu-btn').addEventListener('click', () => this.returnToMainMenu());
        this.typingInput.addEventListener('input', (e) => this.handleTyping(e));
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Initialize upgrades display
        this.updateUpgradesDisplay();
        
        // Difficulty selection event listeners - using event delegation
        document.addEventListener('click', (e) => {
            console.log('Document click detected, target:', e.target);
            console.log('Target classes:', e.target.className);
            
            // Check if clicked element or its parent has difficulty-btn class
            const clickedBtn = e.target.closest('.difficulty-btn');
            if (clickedBtn) {
                console.log('=== DIFFICULTY BUTTON CLICKED ===');
                console.log('Clicked button:', clickedBtn);
                console.log('Button dataset:', clickedBtn.dataset);
                
                e.preventDefault();
                e.stopPropagation();
                
                const difficulty = clickedBtn.dataset.difficulty;
                console.log('Difficulty extracted:', difficulty);
                
                if (difficulty) {
                    console.log('Calling selectDifficulty with:', difficulty);
                    this.selectDifficulty(difficulty);
                } else {
                    console.error('No difficulty found on clicked element');
                }
            }
        });
        
        // Focus input on load
        this.typingInput.focus();
        
        // Set global reference for enemy speed calculations
        window.game = this;
        
        // Debug: Test difficulty buttons manually
        console.log('=== DEBUGGING DIFFICULTY BUTTONS ===');
        console.log('Found difficulty buttons:', document.querySelectorAll('.difficulty-btn'));
        document.querySelectorAll('.difficulty-btn').forEach((btn, index) => {
            console.log(`Button ${index}:`, btn, 'Dataset:', btn.dataset);
        });
        
        // Test manual difficulty setting
        window.testDifficulty = (diff) => {
            console.log('Manual test setting difficulty to:', diff);
            this.selectDifficulty(diff);
        };
    }

    startGame() {
        console.log('=== START GAME CALLED ===');
        console.log('Current difficulty:', this.currentDifficulty);
        console.log('Difficulty settings:', this.difficultySettings);
        console.log('Current enemies:', this.gameState.enemies.length);
        console.log('Game running:', this.gameState.gameRunning);
        
        // Hide all screens
        this.startScreen.classList.add('hidden');
        this.upgradeScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        
        // Clear any existing enemies and power-ups
        this.enemiesContainer.innerHTML = '';
        
        // Reset game state
        this.gameState = new GameState();
        this.gameState.gameRunning = true;
        this.gameState.enemySpeedMultiplier = this.difficultySettings.enemySpeedMultiplier;
        this.gameState.spawnDelayMultiplier = this.difficultySettings.spawnDelayMultiplier;
        
        console.log('After reset - enemies:', this.gameState.enemies.length);
        console.log('After reset - game running:', this.gameState.gameRunning);
        console.log('Applied difficulty settings:', {
            enemySpeedMultiplier: this.gameState.enemySpeedMultiplier,
            spawnDelayMultiplier: this.gameState.spawnDelayMultiplier
        });
        
        // Clear any timeouts
        if (this.slowMoTimeout) clearTimeout(this.slowMoTimeout);
        if (this.slowMoCooldownTimeout) clearTimeout(this.slowMoCooldownTimeout);
        
        // Reset slow-mo bar
        this.slowmoFill.style.width = '100%';
        
        this.updateUI();
        this.startWave();
        this.gameLoop();
    }

    restartGame() {
        this.gameOverScreen.classList.add('hidden');
        this.typingInput.value = '';
        this.startGame();
        this.typingInput.focus();
    }

    returnToMainMenu() {
        this.gameOverScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        this.typingInput.value = '';
        this.typingInput.focus();
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
        
        console.log(`Spawning ${count} enemies for wave ${this.gameState.wave}`);
        
        // Mark that enemies are being spawned (with delay to prevent immediate completion)
        setTimeout(() => {
            this.gameState.waveEnemiesSpawned = true;
            console.log('Wave enemies spawned flag set to true after delay');
        }, 500); // 500ms delay before allowing wave completion
        
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
                    console.log('First enemy spawned, setting firstEnemySpawned to true');
                }
                
                console.log(`Spawned enemy: ${word} (${type}) at position ${x}`);
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
        
        console.log(`Created enemy element: ${enemy.word} at ${enemy.x}, ${enemy.y}`);
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
            
            // Show combo popup
            if (this.gameState.combo > 0 && this.gameState.combo % 5 === 0) {
                this.showComboPopup(enemy.x, enemy.y, this.gameState.combo);
            }
            
            // Chance to drop power-up
            if (Math.random() < 0.1) { // 10% chance
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
        const types = ['freeze', 'nuke', 'heal'];
        const type = types[Math.floor(Math.random() * types.length)];
        const powerUp = new PowerUp(type, x, y + 20); // Spawn 20px below enemy
        this.gameState.powerUps.push(powerUp);
        this.createPowerUpElement(powerUp);
    }

    createPowerUpElement(powerUp) {
        const element = document.createElement('div');
        element.className = `powerup ${powerUp.type}`;
        
        // Use emojis for power-ups
        let emoji = '';
        switch (powerUp.type) {
            case 'freeze':
                emoji = '❄️';
                break;
            case 'nuke':
                emoji = '💣';
                break;
            case 'heal':
                emoji = '❤️';
                break;
        }
        
        element.textContent = emoji;
        element.style.left = `${powerUp.x}px`;
        element.style.top = `${powerUp.y}px`;
        
        powerUp.element = element;
        this.enemiesContainer.appendChild(element);
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
                text = 'FREEZE!';
                break;
            case 'nuke':
                text = 'NUKE!';
                break;
            case 'heal':
                text = 'HEAL!';
                break;
        }
        
        popup.textContent = text;
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        
        this.enemiesContainer.appendChild(popup);
        setTimeout(() => popup.remove(), 1500);
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
        
        // Create white particles (delayed)
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random direction for each particle
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = 50 + Math.random() * 50; // 50-100px
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
            explosion.appendChild(particle);
        }
        
        // Create additional dramatic white particle explosion
        const whiteParticleCount = 20;
        for (let i = 0; i < whiteParticleCount; i++) {
            const whiteParticle = document.createElement('div');
            whiteParticle.className = 'white-particle';
            
            // More explosive and random directions
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 120; // 80-200px for more dramatic effect
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            whiteParticle.style.setProperty('--tx', `${tx}px`);
            whiteParticle.style.setProperty('--ty', `${ty}px`);
            
            // Random size variation for more dynamic effect
            const size = 4 + Math.random() * 8; // 4-12px
            whiteParticle.style.width = `${size}px`;
            whiteParticle.style.height = `${size}px`;
            
            explosion.appendChild(whiteParticle);
        }
        
        this.enemiesContainer.appendChild(explosion);
        
        // Remove explosion after animation
        setTimeout(() => explosion.remove(), 2300);
    }

    handleKeyDown(e) {
        if (e.code === 'Space' && this.gameState.slowMoReady && !this.gameState.slowMoActive) {
            e.preventDefault();
            this.activateSlowMo();
        }
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
        
        // Update power-up positions
        this.gameState.powerUps.forEach(powerUp => {
            powerUp.y += 1;
            powerUp.element.style.top = `${powerUp.y}px`;
            
            // Check if power-up reached player line (collect earlier to prevent falling off)
            if (powerUp.y > this.gameArea.offsetHeight - 80) {
                this.collectPowerUp(powerUp);
            }
        });
        
        // Check wave completion - only if enemies have been spawned and all are destroyed
        if (this.gameState.enemies.length === 0 && this.gameState.gameRunning && this.gameState.waveEnemiesSpawned && this.gameState.firstEnemySpawned) {
            console.log('GAME LOOP: Checking wave completion');
            console.log('Enemies length:', this.gameState.enemies.length);
            console.log('Game running:', this.gameState.gameRunning);
            console.log('Wave completed flag:', this.gameState.waveCompleted);
            console.log('Wave enemies spawned flag:', this.gameState.waveEnemiesSpawned);
            console.log('First enemy spawned flag:', this.gameState.firstEnemySpawned);
            console.log('Current wave:', this.gameState.wave);
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
        this.gameState.powerUps = this.gameState.powerUps.filter(p => p.id !== powerUp.id);
        powerUp.element.remove();
        
        // Show power-up popup
        this.showPowerUpPopup(powerUp.x, powerUp.y, powerUp.type);
        
        switch (powerUp.type) {
            case 'freeze':
                this.freezeEnemies();
                break;
            case 'nuke':
                this.nukeNearestEnemy();
                break;
            case 'heal':
                this.healPlayer();
                break;
        }
    }

    freezeEnemies() {
        this.gameState.enemies.forEach(enemy => {
            enemy.speed = 0;
            setTimeout(() => {
                enemy.speed = enemy.getBaseSpeed();
            }, 1000);
        });
    }

    nukeNearestEnemy() {
        if (this.gameState.enemies.length === 0) return;
        
        const nearestEnemy = this.gameState.enemies.reduce((nearest, enemy) => {
            return enemy.y > nearest.y ? enemy : nearest;
        });
        
        this.destroyEnemy(nearestEnemy);
    }

    healPlayer() {
        this.gameState.lives = Math.min(this.gameState.lives + 1, this.gameState.maxLives);
        this.updateUI();
    }

    completeWave() {
        console.log('=== COMPLETE WAVE CALLED ===');
        console.log('Wave completed flag before check:', this.gameState.waveCompleted);
        
        // Prevent multiple calls to completeWave
        if (this.gameState.waveCompleted) {
            console.log('Wave already completed, returning early');
            return;
        }
        this.gameState.waveCompleted = true;
        
        console.log('Setting game running to false');
        this.gameState.gameRunning = false;
        
        // Increment wave count when wave is completed
        this.gameState.wave++;
        
        // Apply difficulty scaling
        this.gameState.enemySpeedMultiplier *= 1.03;
        this.gameState.spawnDelayMultiplier *= 0.98;
        
        console.log('About to show upgrade screen');
        // Show upgrade screen
        this.showUpgradeScreen();
    }

    showUpgradeScreen() {
        console.log('=== SHOW UPGRADE SCREEN CALLED ===');
        
        // Clear typing input
        this.typingInput.value = '';
        
        // Update upgrade wave counter with color (wave already incremented)
        this.upgradeWaveCounter.textContent = `lasted ${this.gameState.wave - 1} waves`;
        this.upgradeWaveCounter.style.color = this.waveColors[(this.gameState.wave - 1) % this.waveColors.length];
        
        // Reset lootbox UI
        this.resetLootboxUI();
        
        // Add event listener to lootbox
        const lootboxElement = document.getElementById('lootbox');
        lootboxElement.addEventListener('click', () => this.openLootbox(), { once: true });
        
        console.log('Removing hidden class from upgrade screen');
        this.upgradeScreen.classList.remove('hidden');
    }

    resetLootboxUI() {
        // Hide animation container and result
        const animationContainer = document.getElementById('lootbox-animation-container');
        const result = document.getElementById('lootbox-result');
        const lootboxElement = document.getElementById('lootbox');
        
        animationContainer.style.display = 'none';
        result.style.display = 'none';
        lootboxElement.classList.remove('opening');
        
        // Clear animation content
        const animation = document.getElementById('lootbox-animation');
        animation.innerHTML = '';
        
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
            
            // Hide upgrade screen
            this.upgradeScreen.classList.add('hidden');
            
            // Resume game
            this.gameState.gameRunning = true;
            this.updateUI();
            this.startWave();
            this.gameLoop();
            
            // Focus the typing input
            this.typingInput.focus();
            
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
