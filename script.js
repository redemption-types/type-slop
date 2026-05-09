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

// Upgrade definitions
const UPGRADES = [
    {
        name: '+10% Typing Damage',
        description: 'Deal more damage to tank enemies',
        apply: (gameState) => {
            gameState.typingDamage *= 1.1;
        }
    },
    {
        name: '+5% Slow-Mo Duration',
        description: 'Slow-mo lasts longer',
        apply: (gameState) => {
            gameState.slowMoDuration *= 1.05;
        }
    },
    {
        name: '-5% Slow-Mo Cooldown',
        description: 'Use slow-mo more often',
        apply: (gameState) => {
            gameState.slowMoCooldown *= 0.95;
        }
    },
    {
        name: '+1 Max Life',
        description: 'Increase maximum lives',
        apply: (gameState) => {
            gameState.maxLives += 1;
            gameState.lives += 1;
        }
    },
    {
        name: '+10% Combo Damage Bonus',
        description: 'Combos deal more damage',
        apply: (gameState) => {
            gameState.comboDamageBonus += 0.1;
        }
    },
    {
        name: '+5% Enemy Spawn Delay',
        description: 'Enemies spawn slower',
        apply: (gameState) => {
            gameState.spawnDelayMultiplier *= 1.05;
        }
    },
    {
        name: '+1 Random Power-Up',
        description: 'Get an extra power-up per wave',
        apply: (gameState) => {
            // This would be handled in the wave system
        }
    }
];

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
        this.startScreen = document.getElementById('start-screen');
        this.upgradeScreen = document.getElementById('upgrade-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        
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
        
        this.init();
    }

    selectDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        this.difficultySettings = DIFFICULTY_SETTINGS[difficulty];
        
        // Update button states
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-difficulty="${difficulty}"]`).classList.add('active');
    }

    init() {
        // Event listeners
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        this.typingInput.addEventListener('input', (e) => this.handleTyping(e));
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Difficulty selection event listeners
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectDifficulty(e.target.dataset.difficulty));
        });
        
        // Focus input on load
        this.typingInput.focus();
        
        // Set global reference for enemy speed calculations
        window.game = this;
    }

    startGame() {
        console.log('=== START GAME CALLED ===');
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

    startWave() {
        // Reset wave flags
        this.gameState.waveCompleted = false;
        this.gameState.waveEnemiesSpawned = false;
        this.gameState.firstEnemySpawned = false;
        
        const enemyCount = 5 + this.gameState.wave;
        this.spawnWaveEnemies(enemyCount);
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
        
        // Create text content with HP for multi-HP enemies
        if ((enemy.type === 'tank' || enemy.type === 'double') && enemy.hp > 1) {
            element.textContent = `${enemy.word} HP:${enemy.hp}`;
        } else {
            element.textContent = enemy.word;
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
            // Remove enemy
            this.gameState.enemies = this.gameState.enemies.filter(e => e.id !== enemy.id);
            enemy.element.remove();
            
            // Update score and combo
            this.gameState.score += 10 * (this.gameState.combo + 1);
            this.gameState.combo++;
            
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
                if (enemy.hp > 1) {
                    enemy.element.textContent = `${enemy.word} HP:${enemy.hp}`;
                } else {
                    enemy.element.textContent = enemy.word;
                }
            } else if (enemy.type === 'double') {
                if (enemy.hp > 1) {
                    enemy.element.textContent = `${enemy.word} HP:${enemy.hp}`;
                } else {
                    enemy.element.textContent = enemy.word; // Show new word after swap
                }
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
        
        const upgradeOptions = document.getElementById('upgrade-options');
        upgradeOptions.innerHTML = '';
        
        // Select 3 random upgrades
        const selectedUpgrades = [];
        const availableUpgrades = [...UPGRADES];
        
        for (let i = 0; i < 3; i++) {
            const index = Math.floor(Math.random() * availableUpgrades.length);
            selectedUpgrades.push(availableUpgrades[index]);
            availableUpgrades.splice(index, 1);
        }
        
        // Create upgrade option elements
        selectedUpgrades.forEach(upgrade => {
            const option = document.createElement('div');
            option.className = 'upgrade-option';
            option.innerHTML = `
                <h3>${upgrade.name}</h3>
                <p>${upgrade.description}</p>
            `;
            option.addEventListener('click', () => {
                console.log('Upgrade clicked:', upgrade.name);
                console.log('Wave before increment:', this.gameState.wave);
                
                // Apply upgrade effect
                upgrade.apply(this.gameState);
                
                // Increment wave
                this.gameState.wave++;
                console.log('Wave after increment:', this.gameState.wave);
                
                // Hide upgrade screen
                this.upgradeScreen.classList.add('hidden');
                
                // Resume game
                this.gameState.gameRunning = true;
                this.updateUI();
                this.startWave();
                this.gameLoop();
                
                // Focus the typing input
                this.typingInput.focus();
            });
            upgradeOptions.appendChild(option);
        });
        
        console.log('Removing hidden class from upgrade screen');
        this.upgradeScreen.classList.remove('hidden');
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
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TypeSlopGame();
});
