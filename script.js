// Word Lists categorized by length
const WORD_LISTS = {
    short: [ // 3-5 letters for fast enemies
        'cat', 'dog', 'run', 'jump', 'quick', 'brown', 'fox', 'lazy', 'red', 'blue',
        'green', 'fast', 'slow', 'big', 'small', 'hot', 'cold', 'new', 'old', 'young',
        'happy', 'sad', 'mad', 'glad', 'bad', 'good', 'nice', 'mean', 'kind', 'wild',
        'tame', 'free', 'bind', 'lose', 'find', 'seek', 'hide', 'show', 'tell', 'ask',
        'give', 'take', 'make', 'break', 'build', 'burn', 'turn', 'learn', 'teach', 'reach'
    ],
    medium: [ // 4-7 letters for normal enemies
        'house', 'mouse', 'computer', 'keyboard', 'monitor', 'screen', 'window', 'door',
        'table', 'chair', 'desk', 'phone', 'tablet', 'laptop', 'coffee', 'water', 'juice',
        'pizza', 'burger', 'salad', 'pasta', 'bread', 'cheese', 'butter', 'sugar', 'salt',
        'pepper', 'onion', 'garlic', 'potato', 'tomato', 'carrot', 'banana', 'apple',
        'orange', 'grape', 'melon', 'berry', 'peach', 'lemon', 'lime', 'mango', 'cherry',
        'garden', 'flower', 'tree', 'grass', 'plant', 'seed', 'soil', 'water', 'sun', 'moon',
        'star', 'cloud', 'rain', 'snow', 'wind', 'storm', 'thunder', 'lightning', 'rainbow',
        'mountain', 'valley', 'river', 'ocean', 'beach', 'sand', 'rock', 'stone', 'metal',
        'wood', 'plastic', 'glass', 'paper', 'book', 'pen', 'pencil', 'eraser', 'ruler'
    ],
    long: [ // 8-12 letters for tank enemies
        'adventure', 'beautiful', 'challenge', 'dangerous', 'elephant', 'fantastic',
        'gigantic', 'happiness', 'important', 'incredible', 'knowledge', 'language',
        'magnificent', 'necessary', 'opportunity', 'phenomenon', 'qualitative', 'remarkable',
        'spectacular', 'technology', 'understand', 'vegetable', 'wonderful', 'xylophone',
        'yesterday', 'zoological', 'atmosphere', 'butterfly', 'chocolate', 'discovery',
        'encyclopedia', 'fascinating', 'gymnasium', 'helicopter', 'imagination', 'jellyfish',
        'kaleidoscope', 'laboratory', 'mathematics', 'navigation', 'observation', 'parliament',
        'quarantine', 'restaurant', 'submarine', 'television', 'university', 'vegetarian',
        'watermelon', 'xylophonist', 'youthfulness', 'zoologist', 'achievement', 'basketball',
        'celebration', 'determination', 'environment', 'friendship', 'government', 'helicopter'
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
    }
}

// Enemy Class
class Enemy {
    constructor(word, type, x, y) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.word = word;
        this.type = type;
        this.hp = type === 'tank' ? 2 : 1;
        this.maxHp = this.hp;
        this.x = x;
        this.y = y;
        this.speed = this.getBaseSpeed();
        this.element = null;
    }

    getBaseSpeed() {
        const baseSpeed = 1; // pixels per frame
        switch (this.type) {
            case 'fast': return baseSpeed * 1.5;
            case 'tank': return baseSpeed * 0.8;
            default: return baseSpeed;
        }
    }

    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            return true; // Enemy destroyed
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
        this.startScreen = document.getElementById('start-screen');
        this.upgradeScreen = document.getElementById('upgrade-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        
        this.lastSpawnTime = 0;
        this.spawnInterval = 2000; // Base spawn interval
        this.animationId = null;
        this.slowMoTimeout = null;
        this.slowMoCooldownTimeout = null;
        
        this.init();
    }

    init() {
        // Event listeners
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        this.typingInput.addEventListener('input', (e) => this.handleTyping(e));
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Focus input on load
        this.typingInput.focus();
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
        this.startGame();
    }

    startWave() {
        // Reset wave flags
        this.gameState.waveCompleted = false;
        this.gameState.waveEnemiesSpawned = false;
        
        const enemyCount = 5 + this.gameState.wave;
        this.spawnWaveEnemies(enemyCount);
    }

    spawnWaveEnemies(count) {
        const types = ['normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', // 70% normal
                      'fast', 'fast', // 20% fast
                      'tank']; // 10% tank
        
        console.log(`Spawning ${count} enemies for wave ${this.gameState.wave}`);
        
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
                    this.gameState.waveEnemiesSpawned = true;
                    console.log('First enemy spawned, setting waveEnemiesSpawned to true');
                }
                
                console.log(`Spawned enemy: ${word} (${type}) at position ${x}`);
            }, 1000 + i * 1000); // 1 second base delay + 1 second intervals
        }
    }

    getWordListForType(type) {
        switch (type) {
            case 'fast': return WORD_LISTS.short;
            case 'tank': return WORD_LISTS.long;
            default: return WORD_LISTS.medium;
        }
    }

    createEnemyElement(enemy) {
        const element = document.createElement('div');
        element.className = `enemy ${enemy.type}`;
        element.textContent = enemy.word;
        element.style.position = 'absolute';
        element.style.left = `${enemy.x}px`;
        element.style.top = `${enemy.y}px`;
        element.style.zIndex = '10';
        
        if (enemy.type === 'tank' && enemy.hp === 2) {
            element.classList.add('hp-2');
        }
        
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
            
            if (enemy.type === 'tank') {
                enemy.element.classList.remove('hp-2');
            }
        }
        
        this.updateUI();
    }

    dropPowerUp(x, y) {
        const types = ['freeze', 'nuke', 'heal'];
        const type = types[Math.floor(Math.random() * types.length)];
        const powerUp = new PowerUp(type, x, y);
        this.gameState.powerUps.push(powerUp);
        this.createPowerUpElement(powerUp);
    }

    createPowerUpElement(powerUp) {
        const element = document.createElement('div');
        element.className = `powerup ${powerUp.type}`;
        element.textContent = powerUp.type[0].toUpperCase();
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
            
            // Check if power-up reached player line
            if (powerUp.y > this.gameArea.offsetHeight - 60) {
                this.collectPowerUp(powerUp);
            }
        });
        
        // Check wave completion - only if enemies have been spawned and all are destroyed
        if (this.gameState.enemies.length === 0 && this.gameState.gameRunning && this.gameState.waveEnemiesSpawned) {
            console.log('GAME LOOP: Checking wave completion');
            console.log('Enemies length:', this.gameState.enemies.length);
            console.log('Game running:', this.gameState.gameRunning);
            console.log('Wave completed flag:', this.gameState.waveCompleted);
            console.log('Wave enemies spawned flag:', this.gameState.waveEnemiesSpawned);
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
                // Apply upgrade effect
                upgrade.apply(this.gameState);
                
                // Increment wave
                this.gameState.wave++;
                
                // Hide upgrade screen
                this.upgradeScreen.classList.add('hidden');
                
                // Resume game
                this.gameState.gameRunning = true;
                this.updateUI();
                this.startWave();
                this.gameLoop();
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
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TypeSlopGame();
});
