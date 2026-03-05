// 坦克大战 - 游戏主逻辑
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 音频上下文
let audioCtx = null;

// 初始化音频系统
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext)();
    }
}

// 音频合成器 - 统一处理所有音效生成
function playSound(options) {
    if (!audioCtx || !soundEnabled) return;

    const {
        frequency = 440,
        duration = 0.2,
        type = 'sine',
        gain = 0.3,
        frequencyEnvelope = null,
        gainEnvelope = null
    } = options;

    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // 设置基础频率和波形类型
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        oscillator.type = type;

        // 设置音量包络
        if (gainEnvelope) {
            gainNode.gain.setValueAtTime(gainEnvelope.initial, audioCtx.currentTime);
            gainEnvelope.points.forEach(point => {
                gainNode.gain.exponentialRampToValueAtTime(point.gain, audioCtx.currentTime + point.time);
            });
        } else {
            gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        }

        // 设置频率包络
        if (frequencyEnvelope) {
            frequencyEnvelope.points.forEach(point => {
                oscillator.frequency.setValueAtTime(point.frequency, audioCtx.currentTime + point.time);
            });
        }

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration);

        // 确保资源释放
        setTimeout(() => {
            oscillator.disconnect();
            gainNode.disconnect();
        }, (duration + 0.1) * 1000);
    } catch (error) {
        console.error('播放音效失败:', error);
    }
}

// 播放射击音效
function playShootSound(isPlayer = true) {
    playSound({
        frequency: isPlayer ? 800 : 600,
        duration: 0.1,
        type: 'square',
        gain: 0.3
    });
}

// 播放爆炸音效
function playExplosionSound(size = 'small') {
    playSound({
        frequency: size === 'large' ? 400 : 600,
        duration: 0.2,
        type: 'sawtooth',
        gain: size === 'large' ? 0.5 : 0.3,
        frequencyEnvelope: {
            points: [
                { time: 0.2, frequency: 50 }
            ]
        }
    });
}

// 播放移动音效
let movementOscillator = null;
let movementGain = null;
let movementPlaying = false;

function playMovementSound(isPlayer = true) {
    if (!audioCtx || !soundEnabled || movementPlaying) return;

    movementPlaying = true;

    try {
        movementOscillator = audioCtx.createOscillator();
        movementGain = audioCtx.createGain();

        movementOscillator.connect(movementGain);
        movementGain.connect(audioCtx.destination);

        movementOscillator.frequency.value = isPlayer ? 100 : 80;
        movementOscillator.type = 'square';

        movementGain.gain.setValueAtTime(0.1, audioCtx.currentTime);

        movementOscillator.start();
    } catch (error) {
        console.error('播放移动音效失败:', error);
        movementPlaying = false;
    }
}

function stopMovementSound() {
    if (!audioCtx || !movementPlaying) return;

    movementPlaying = false;

    try {
        movementGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        movementOscillator.stop(audioCtx.currentTime + 0.1);

        // 确保资源完全释放
        setTimeout(() => {
            if (movementOscillator) {
                movementOscillator.disconnect();
                movementOscillator = null;
            }
            if (movementGain) {
                movementGain.disconnect();
                movementGain = null;
            }
        }, 150);
    } catch (error) {
        console.error('停止移动音效失败:', error);
        movementOscillator = null;
        movementGain = null;
    }
}

// 播放关卡完成音效
function playLevelCompleteSound() {
    playSound({
        frequency: 523,
        duration: 0.8,
        type: 'sine',
        gain: 0.3,
        frequencyEnvelope: {
            points: [
                { time: 0.2, frequency: 659 },
                { time: 0.4, frequency: 784 },
                { time: 0.6, frequency: 1047 }
            ]
        }
    });
}

// 播放游戏结束音效
function playGameOverSound() {
    playSound({
        frequency: 300,
        duration: 0.8,
        type: 'sawtooth',
        gain: 0.4,
        frequencyEnvelope: {
            points: [
                { time: 0.8, frequency: 100 }
            ]
        }
    });
}

// 游戏配置 - 可通过界面配置的参数
const GAME_CONFIG = {
    // 玩家配置
    player: {
        speed: 2,
        shootCooldown: 300,
        initialLives: 3
    },
    // 敌人配置
    enemy: {
        baseSpeed: 1,
        speedIncreasePerLevel: 0.2,
        shootCooldown: 1000,
        cooldownVariance: 500,
        initialCount: 4,
        countIncreasePerLevel: 1,
        maxCount: 8,
        spawnDelay: 1500
    },
    // 子弹配置
    bullet: {
        playerSpeed: 5,
        enemySpeed: 4,
        powerupSpeed: 7
    },
    // 道具配置
    powerup: {
        spawnInterval: 5000,
        intervalVariance: 10000,
        lifetime: 5000,
        lifetimeVariance: 2000,
        effectDuration: 10000
    },
    // 地图配置
    map: {
        initialBricks: 80,
        bricksPerLevel: 10,
        initialSteel: 10,
        steelPerLevel: 2,
        waterCount: 5,
        forestCount: 15
    },
    // 音效配置
    sound: {
        enabled: true,
        volume: 0.5
    },
    // 游戏配置
    game: {
        baseScorePerEnemy: 100,
        levelCompleteBonus: 500
    }
};

// 游戏常量
const TILE_SIZE = 32;
const GRID_SIZE = 20;
const CANVAS_SIZE = TILE_SIZE * GRID_SIZE;

// 音效开关
let soundEnabled = GAME_CONFIG.sound.enabled;

// 方向
const DIRECTIONS = {
    UP: { x: 0, y: -1, angle: 0 },
    DOWN: { x: 0, y: 1, angle: Math.PI },
    LEFT: { x: -1, y: 0, angle: -Math.PI / 2 },
    RIGHT: { x: 1, y: 0, angle: Math.PI / 2 }
};

// 地图元素类型
const TILE_TYPES = {
    EMPTY: 0,
    BRICK: 1,
    STEEL: 2,
    WATER: 3,
    FOREST: 4,
    BASE: 5
};

// 道具类型
const POWERUP_TYPES = {
    SPEED: 'speed',        // 速度提升
    FIREPOWER: 'firepower',  // 火力提升
    SHIELD: 'shield',      // 护盾
    LIFE: 'life',          // 生命
    BOMB: 'bomb',          // 炸弹
    FREEZE: 'freeze'       // 冻结敌人
};

// 道具
let powerups = [];

// 游戏状态
let gameState = {
    running: false,
    score: 0,
    level: 1,
    lives: 3,
    enemiesRemaining: 0,
    levelComplete: false // 防止重复触发关卡完成
};

// 玩家状态
let playerState = {
    speedBoost: 0,
    firePowerBoost: 0,
    shield: 0,
    freezeActive: 0
};

// 游戏对象
let player = null;
let enemies = [];
let bullets = [];
let explosions = [];
let map = [];

// 键盘状态
const keys = {};

// 初始化
function init() {
    setupEventListeners();
    showStartScreen();
}

// 设置事件监听
function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (e.code === 'Space') e.preventDefault();
    });

    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    UI_ELEMENTS.startBtn.addEventListener('click', startGame);
    UI_ELEMENTS.restartBtn.addEventListener('click', startGame);

    UI_ELEMENTS.soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        UI_ELEMENTS.soundBtn.textContent = soundEnabled ? '开启' : '关闭';
        UI_ELEMENTS.soundBtn.style.background = soundEnabled ? '#4CAF50' : '#f44336';
    });

    // 配置界面事件
    UI_ELEMENTS.configBtn.addEventListener('click', showConfigScreen);
    UI_ELEMENTS.closeConfigBtn.addEventListener('click', hideConfigScreen);
    UI_ELEMENTS.saveConfigBtn.addEventListener('click', saveConfig);
    UI_ELEMENTS.resetConfigBtn.addEventListener('click', resetConfig);

    // 配置界面输入同步
    setupConfigInputSync();
}

// 显示开始屏幕
function showStartScreen() {
    UI_ELEMENTS.startScreen.classList.remove('hidden');
    UI_ELEMENTS.gameOverScreen.classList.add('hidden');
    UI_ELEMENTS.configScreen.classList.add('hidden');
}

// 显示配置界面
function showConfigScreen() {
    UI_ELEMENTS.configScreen.classList.remove('hidden');
    // 加载当前配置到界面
    loadConfigToUI();
}

// 隐藏配置界面
function hideConfigScreen() {
    UI_ELEMENTS.configScreen.classList.add('hidden');
}

// 加载配置到界面
function loadConfigToUI() {
    // 玩家配置
    UI_ELEMENTS.playerSpeed.value = GAME_CONFIG.player.speed;
    UI_ELEMENTS.playerSpeedNum.value = GAME_CONFIG.player.speed;
    UI_ELEMENTS.playerCooldown.value = GAME_CONFIG.player.shootCooldown;
    UI_ELEMENTS.playerCooldownNum.value = GAME_CONFIG.player.shootCooldown;
    UI_ELEMENTS.initialLives.value = GAME_CONFIG.player.initialLives;
    UI_ELEMENTS.initialLivesNum.value = GAME_CONFIG.player.initialLives;

    // 敌人配置
    UI_ELEMENTS.enemySpeed.value = GAME_CONFIG.enemy.baseSpeed;
    UI_ELEMENTS.enemySpeedNum.value = GAME_CONFIG.enemy.baseSpeed;
    UI_ELEMENTS.enemySpeedIncrease.value = GAME_CONFIG.enemy.speedIncreasePerLevel;
    UI_ELEMENTS.enemySpeedIncreaseNum.value = GAME_CONFIG.enemy.speedIncreasePerLevel;
    UI_ELEMENTS.enemyCount.value = GAME_CONFIG.enemy.initialCount;
    UI_ELEMENTS.enemyCountNum.value = GAME_CONFIG.enemy.initialCount;
    UI_ELEMENTS.enemyCountIncrease.value = GAME_CONFIG.enemy.countIncreasePerLevel;
    UI_ELEMENTS.enemyCountIncreaseNum.value = GAME_CONFIG.enemy.countIncreasePerLevel;
    UI_ELEMENTS.enemyMaxCount.value = GAME_CONFIG.enemy.maxCount;
    UI_ELEMENTS.enemyMaxCountNum.value = GAME_CONFIG.enemy.maxCount;

    // 道具配置
    UI_ELEMENTS.powerupInterval.value = GAME_CONFIG.powerup.spawnInterval;
    UI_ELEMENTS.powerupIntervalNum.value = GAME_CONFIG.powerup.spawnInterval;
    UI_ELEMENTS.powerupDuration.value = GAME_CONFIG.powerup.effectDuration;
    UI_ELEMENTS.powerupDurationNum.value = GAME_CONFIG.powerup.effectDuration;
    UI_ELEMENTS.powerupLifetime.value = GAME_CONFIG.powerup.lifetime;
    UI_ELEMENTS.powerupLifetimeNum.value = GAME_CONFIG.powerup.lifetime;

    // 地图配置
    UI_ELEMENTS.initialBricks.value = GAME_CONFIG.map.initialBricks;
    UI_ELEMENTS.initialBricksNum.value = GAME_CONFIG.map.initialBricks;
    UI_ELEMENTS.bricksPerLevel.value = GAME_CONFIG.map.bricksPerLevel;
    UI_ELEMENTS.bricksPerLevelNum.value = GAME_CONFIG.map.bricksPerLevel;
    UI_ELEMENTS.initialSteel.value = GAME_CONFIG.map.initialSteel;
    UI_ELEMENTS.initialSteelNum.value = GAME_CONFIG.map.initialSteel;
    UI_ELEMENTS.steelPerLevel.value = GAME_CONFIG.map.steelPerLevel;
    UI_ELEMENTS.steelPerLevelNum.value = GAME_CONFIG.map.steelPerLevel;

    // 音效配置
    UI_ELEMENTS.soundEnabled.checked = GAME_CONFIG.sound.enabled;
    UI_ELEMENTS.soundVolume.value = GAME_CONFIG.sound.volume;
    UI_ELEMENTS.soundVolumeNum.value = GAME_CONFIG.sound.volume;
}

// 保存配置
function saveConfig() {
    // 玩家配置
    GAME_CONFIG.player.speed = parseFloat(UI_ELEMENTS.playerSpeed.value);
    GAME_CONFIG.player.shootCooldown = parseInt(UI_ELEMENTS.playerCooldown.value);
    GAME_CONFIG.player.initialLives = parseInt(UI_ELEMENTS.initialLives.value);

    // 敌人配置
    GAME_CONFIG.enemy.baseSpeed = parseFloat(UI_ELEMENTS.enemySpeed.value);
    GAME_CONFIG.enemy.speedIncreasePerLevel = parseFloat(UI_ELEMENTS.enemySpeedIncrease.value);
    GAME_CONFIG.enemy.initialCount = parseInt(UI_ELEMENTS.enemyCount.value);
    GAME_CONFIG.enemy.countIncreasePerLevel = parseInt(UI_ELEMENTS.enemyCountIncrease.value);
    GAME_CONFIG.enemy.maxCount = parseInt(UI_ELEMENTS.enemyMaxCount.value);

    // 道具配置
    GAME_CONFIG.powerup.spawnInterval = parseInt(UI_ELEMENTS.powerupInterval.value);
    GAME_CONFIG.powerup.effectDuration = parseInt(UI_ELEMENTS.powerupDuration.value);
    GAME_CONFIG.powerup.lifetime = parseInt(UI_ELEMENTS.powerupLifetime.value);

    // 地图配置
    GAME_CONFIG.map.initialBricks = parseInt(UI_ELEMENTS.initialBricks.value);
    GAME_CONFIG.map.bricksPerLevel = parseInt(UI_ELEMENTS.bricksPerLevel.value);
    GAME_CONFIG.map.initialSteel = parseInt(UI_ELEMENTS.initialSteel.value);
    GAME_CONFIG.map.steelPerLevel = parseInt(UI_ELEMENTS.steelPerLevel.value);

    // 音效配置
    GAME_CONFIG.sound.enabled = UI_ELEMENTS.soundEnabled.checked;
    GAME_CONFIG.sound.volume = parseFloat(UI_ELEMENTS.soundVolume.value);
    soundEnabled = GAME_CONFIG.sound.enabled;

    // 更新音效按钮显示
    UI_ELEMENTS.soundBtn.textContent = soundEnabled ? '开启' : '关闭';
    UI_ELEMENTS.soundBtn.style.background = soundEnabled ? '#4CAF50' : '#f44336';

    hideConfigScreen();
}

// 重置配置为默认值
function resetConfig() {
    // 重置为默认值
    const DEFAULT_CONFIG = {
        player: {
            speed: 2,
            shootCooldown: 300,
            initialLives: 3
        },
        enemy: {
            baseSpeed: 1,
            speedIncreasePerLevel: 0.2,
            shootCooldown: 1000,
            cooldownVariance: 500,
            initialCount: 4,
            countIncreasePerLevel: 1,
            maxCount: 8,
            spawnDelay: 1500
        },
        bullet: {
            playerSpeed: 5,
            enemySpeed: 4,
            powerupSpeed: 7
        },
        powerup: {
            spawnInterval: 5000,
            intervalVariance: 10000,
            lifetime: 5000,
            lifetimeVariance: 2000,
            effectDuration: 10000
        },
        map: {
            initialBricks: 80,
            bricksPerLevel: 10,
            initialSteel: 10,
            steelPerLevel: 2,
            waterCount: 5,
            forestCount: 15
        },
        sound: {
            enabled: true,
            volume: 0.5
        },
        game: {
            baseScorePerEnemy: 100,
            levelCompleteBonus: 500
        }
    };

    // 复制默认配置到 GAME_CONFIG
    Object.assign(GAME_CONFIG, JSON.parse(JSON.stringify(DEFAULT_CONFIG)));

    // 加载到界面
    loadConfigToUI();
}

// 设置配置界面输入同步
function setupConfigInputSync() {
    // 玩家配置
    syncInput('playerSpeed');
    syncInput('playerCooldown');
    syncInput('initialLives');
    // 敌人配置
    syncInput('enemySpeed');
    syncInput('enemySpeedIncrease');
    syncInput('enemyCount');
    syncInput('enemyCountIncrease');
    syncInput('enemyMaxCount');
    // 道具配置
    syncInput('powerupInterval');
    syncInput('powerupDuration');
    syncInput('powerupLifetime');
    // 地图配置
    syncInput('initialBricks');
    syncInput('bricksPerLevel');
    syncInput('initialSteel');
    syncInput('steelPerLevel');
    // 音效配置
    syncInput('soundVolume');
}

// 同步输入框
function syncInput(field) {
    const slider = UI_ELEMENTS[field];
    const numberInput = UI_ELEMENTS[`${field}Num`];

    if (slider && numberInput) {
        slider.addEventListener('input', () => {
            numberInput.value = slider.value;
        });

        numberInput.addEventListener('input', () => {
            const value = parseFloat(numberInput.value);
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            const step = parseFloat(slider.step);

            let validValue = value;
            if (validValue < min) validValue = min;
            if (validValue > max) validValue = max;
            // 确保值是 step 的倍数
            validValue = Math.round(validValue / step) * step;

            numberInput.value = validValue;
            slider.value = validValue;
        });
    }
}

// 开始游戏
function startGame() {
    initAudio();
    gameState = {
        running: true,
        score: 0,
        level: 1,
        lives: GAME_CONFIG.player.initialLives,
        enemiesRemaining: GAME_CONFIG.enemy.initialCount
    };

    UI_ELEMENTS.startScreen.classList.add('hidden');
    UI_ELEMENTS.gameOverScreen.classList.add('hidden');

    initLevel();
    gameLoop();
}

// 初始化关卡
function initLevel() {
    enemies = [];
    bullets = [];
    explosions = [];
    powerups = [];

    // 清除敌人生成计时器
    clearEnemySpawnTimeouts();

    // 重置玩家状态
    playerState = {
        speedBoost: 0,
        firePowerBoost: 0,
        shield: 0,
        freezeActive: 0
    };

    // 确保移动音效停止
    if (movementPlaying) {
        stopMovementSound();
    }

    generateMap();
    createPlayer();
    spawnEnemies();
    updateUI();

    // 启动道具生成计时器
    startPowerupSpawnTimer();
}

// 道具生成计时器
let powerupSpawnTimer = null;

// 启动道具生成计时器
function startPowerupSpawnTimer() {
    // 清除现有计时器（如果有）
    if (powerupSpawnTimer) {
        clearTimeout(powerupSpawnTimer);
    }

    // 随机时间后生成下一个道具
    const spawnDelay = GAME_CONFIG.powerup.spawnInterval + Math.random() * GAME_CONFIG.powerup.intervalVariance;
    powerupSpawnTimer = setTimeout(() => {
        spawnRandomPowerup();
        startPowerupSpawnTimer(); // 递归调用，继续生成道具
    }, spawnDelay);
}

// 停止道具生成计时器
function stopPowerupSpawnTimer() {
    if (powerupSpawnTimer) {
        clearTimeout(powerupSpawnTimer);
        powerupSpawnTimer = null;
    }
}

// 创建单个道具
function createPowerup(type, x, y) {
    return {
        x: x * TILE_SIZE + TILE_SIZE / 2 - 8,
        y: y * TILE_SIZE + TILE_SIZE / 2 - 8,
        width: 16,
        height: 16,
        type: type,
        life: GAME_CONFIG.powerup.lifetime + Math.random() * GAME_CONFIG.powerup.lifetimeVariance,
        spawnTime: Date.now()
    };
}

// 随机生成一个道具
function spawnRandomPowerup() {
    if (!gameState.running) return;

    const powerupTypes = Object.values(POWERUP_TYPES);
    const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];

    let x, y;
    do {
        x = Math.floor(Math.random() * GRID_SIZE);
        y = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
    } while (map[y][x] !== TILE_TYPES.EMPTY);

    powerups.push(createPowerup(type, x, y));
}

// 批量生成道具（内部使用的辅助函数）
function spawnPowerups(count) {
    const powerupTypes = Object.values(POWERUP_TYPES);
    const powerupCount = Math.min(count, 5); // 限制最大数量

    for (let i = 0; i < powerupCount; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * GRID_SIZE);
            y = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
        } while (map[y][x] !== TILE_TYPES.EMPTY);

        const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        powerups.push(createPowerup(type, x, y));
    }
}

// 在地图上随机放置指定类型的瓦片
function placeRandomTiles(tileType, count, yRange = [2, GRID_SIZE - 2]) {
    let placed = 0;
    while (placed < count) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * (yRange[1] - yRange[0])) + yRange[0];
        if (map[y][x] === TILE_TYPES.EMPTY) {
            map[y][x] = tileType;
            placed++;
        }
    }
}

// 生成地图
function generateMap() {
    map = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        map[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            map[y][x] = TILE_TYPES.EMPTY;
        }
    }

    // 放置基地
    const baseX = 9;
    const baseY = 18;
    map[baseY][baseX] = TILE_TYPES.BASE;

    // 基地周围的砖墙
    const baseBricks = [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0], [1, 0],
        [-1, 1], [1, 1]
    ];
    baseBricks.forEach(([dx, dy]) => {
        const nx = baseX + dx;
        const ny = baseY + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            map[ny][nx] = TILE_TYPES.BRICK;
        }
    });

    // 随机放置地图元素
    placeRandomTiles(TILE_TYPES.BRICK, GAME_CONFIG.map.initialBricks + gameState.level * GAME_CONFIG.map.bricksPerLevel, [2, GRID_SIZE - 2]);
    placeRandomTiles(TILE_TYPES.STEEL, GAME_CONFIG.map.initialSteel + gameState.level * GAME_CONFIG.map.steelPerLevel, [2, GRID_SIZE - 2]);
    placeRandomTiles(TILE_TYPES.WATER, GAME_CONFIG.map.waterCount, [3, GRID_SIZE - 3]);
    placeRandomTiles(TILE_TYPES.FOREST, GAME_CONFIG.map.forestCount, [2, GRID_SIZE - 2]);
}

// 生成道具
// 更新道具
function updatePowerups(now) {
    powerups = powerups.filter(powerup => {
        if (now - powerup.spawnTime > powerup.life) {
            return false;
        }

        // 检测玩家碰撞
        if (player && rectCollision(player.x, player.y, player.width, player.height, powerup.x, powerup.y, powerup.width, powerup.height)) {
            applyPowerup(powerup.type, now);
            return false;
        }

        return true;
    });
}

// 应用道具效果
function applyPowerup(type, now) {
    switch (type) {
        case POWERUP_TYPES.SPEED:
            playerState.speedBoost = now + GAME_CONFIG.powerup.effectDuration;
            break;
        case POWERUP_TYPES.FIREPOWER:
            playerState.firePowerBoost = now + GAME_CONFIG.powerup.effectDuration;
            break;
        case POWERUP_TYPES.SHIELD:
            playerState.shield = now + GAME_CONFIG.powerup.effectDuration;
            break;
        case POWERUP_TYPES.LIFE:
            gameState.lives++;
            updateUI();
            break;
        case POWERUP_TYPES.BOMB:
            // 炸弹：消灭所有敌人
            enemies.forEach(enemy => {
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'large');
                gameState.score += GAME_CONFIG.game.baseScorePerEnemy;
            });
            gameState.enemiesRemaining = 0; // 所有敌人都被消灭
            enemies = [];
            updateUI();
            break;
        case POWERUP_TYPES.FREEZE:
            // 冻结敌人
            playerState.freezeActive = now + GAME_CONFIG.powerup.effectDuration / 2;
            enemies.forEach(enemy => {
                enemy.frozen = true;
                enemy.freezeTime = now + GAME_CONFIG.powerup.effectDuration / 2;
            });
            break;
    }
}

// 创建玩家坦克
function createPlayer() {
    player = {
        x: 9 * TILE_SIZE,
        y: 17 * TILE_SIZE,
        width: TILE_SIZE - 4,
        height: TILE_SIZE - 4,
        speed: GAME_CONFIG.player.speed,
        direction: DIRECTIONS.UP,
        color: '#4CAF50',
        isPlayer: true,
        lastShot: 0,
        shootCooldown: GAME_CONFIG.player.shootCooldown
    };
}

// 敌人生成计时器数组
let enemySpawnTimeouts = [];

// 生成敌人
function spawnEnemies() {
    const spawnPoints = [
        { x: 1 * TILE_SIZE, y: 1 * TILE_SIZE },
        { x: 9 * TILE_SIZE, y: 1 * TILE_SIZE },
        { x: 18 * TILE_SIZE, y: 1 * TILE_SIZE }
    ];

    const enemyCount = Math.min(GAME_CONFIG.enemy.initialCount + gameState.level * GAME_CONFIG.enemy.countIncreasePerLevel, GAME_CONFIG.enemy.maxCount);
    gameState.enemiesRemaining = enemyCount;

    // 清除之前的计时器
    clearEnemySpawnTimeouts();

    for (let i = 0; i < enemyCount; i++) {
        const spawn = spawnPoints[i % spawnPoints.length];
        const timeoutId = setTimeout(() => {
            if (gameState.running) {
                enemies.push({
                    x: spawn.x,
                    y: spawn.y,
                    width: TILE_SIZE - 4,
                    height: TILE_SIZE - 4,
                    speed: GAME_CONFIG.enemy.baseSpeed + gameState.level * GAME_CONFIG.enemy.speedIncreasePerLevel,
                    direction: DIRECTIONS.DOWN,
                    color: '#f44336',
                    isPlayer: false,
                    lastShot: 0,
                    shootCooldown: GAME_CONFIG.enemy.shootCooldown + Math.random() * GAME_CONFIG.enemy.cooldownVariance,
                    moveTimer: 0,
                    moveDuration: 60 + Math.random() * 60
                });
            }
        }, i * GAME_CONFIG.enemy.spawnDelay);

        enemySpawnTimeouts.push(timeoutId);
    }
}

// 清除敌人生成计时器
function clearEnemySpawnTimeouts() {
    enemySpawnTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    enemySpawnTimeouts = [];
}

// UI元素缓存
const UI_ELEMENTS = {
    score: document.getElementById('score'),
    level: document.getElementById('level'),
    lives: document.getElementById('lives'),
    enemies: document.getElementById('enemies'),
    startScreen: document.getElementById('startScreen'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    configScreen: document.getElementById('configScreen'),
    startBtn: document.getElementById('startBtn'),
    restartBtn: document.getElementById('restartBtn'),
    soundBtn: document.getElementById('soundBtn'),
    configBtn: document.getElementById('configBtn'),
    saveConfigBtn: document.getElementById('saveConfigBtn'),
    resetConfigBtn: document.getElementById('resetConfigBtn'),
    closeConfigBtn: document.getElementById('closeConfigBtn'),
    gameOverTitle: document.getElementById('gameOverTitle'),
    finalScore: document.getElementById('finalScore'),
    finalLevel: document.getElementById('finalLevel'),
    // 配置界面元素
    playerSpeed: document.getElementById('playerSpeed'),
    playerSpeedNum: document.getElementById('playerSpeedNum'),
    playerCooldown: document.getElementById('playerCooldown'),
    playerCooldownNum: document.getElementById('playerCooldownNum'),
    initialLives: document.getElementById('initialLives'),
    initialLivesNum: document.getElementById('initialLivesNum'),
    enemySpeed: document.getElementById('enemySpeed'),
    enemySpeedNum: document.getElementById('enemySpeedNum'),
    enemySpeedIncrease: document.getElementById('enemySpeedIncrease'),
    enemySpeedIncreaseNum: document.getElementById('enemySpeedIncreaseNum'),
    enemyCount: document.getElementById('enemyCount'),
    enemyCountNum: document.getElementById('enemyCountNum'),
    enemyCountIncrease: document.getElementById('enemyCountIncrease'),
    enemyCountIncreaseNum: document.getElementById('enemyCountIncreaseNum'),
    enemyMaxCount: document.getElementById('enemyMaxCount'),
    enemyMaxCountNum: document.getElementById('enemyMaxCountNum'),
    powerupInterval: document.getElementById('powerupInterval'),
    powerupIntervalNum: document.getElementById('powerupIntervalNum'),
    powerupDuration: document.getElementById('powerupDuration'),
    powerupDurationNum: document.getElementById('powerupDurationNum'),
    powerupLifetime: document.getElementById('powerupLifetime'),
    powerupLifetimeNum: document.getElementById('powerupLifetimeNum'),
    initialBricks: document.getElementById('initialBricks'),
    initialBricksNum: document.getElementById('initialBricksNum'),
    bricksPerLevel: document.getElementById('bricksPerLevel'),
    bricksPerLevelNum: document.getElementById('bricksPerLevelNum'),
    initialSteel: document.getElementById('initialSteel'),
    initialSteelNum: document.getElementById('initialSteelNum'),
    steelPerLevel: document.getElementById('steelPerLevel'),
    steelPerLevelNum: document.getElementById('steelPerLevelNum'),
    soundEnabled: document.getElementById('soundEnabled'),
    soundVolume: document.getElementById('soundVolume'),
    soundVolumeNum: document.getElementById('soundVolumeNum')
};

// 更新UI
function updateUI() {
    UI_ELEMENTS.score.textContent = gameState.score;
    UI_ELEMENTS.level.textContent = gameState.level;
    UI_ELEMENTS.lives.textContent = gameState.lives;
    UI_ELEMENTS.enemies.textContent = enemies.length;
}

// 游戏主循环
function gameLoop() {
    if (!gameState.running) return;

    const now = Date.now();
    update(now);
    render(now);

    requestAnimationFrame(gameLoop);
}

// 更新游戏状态
function update(now = Date.now()) {
    updatePlayer(now);
    updateEnemies(now);
    updateBullets(now);
    updateExplosions();
    updatePowerups(now);
    checkGameState();
}

// 更新玩家
function updatePlayer(now) {
    if (!player) return;

    let moving = false;
    let newDirection = player.direction;

    if (keys['KeyW'] || keys['ArrowUp']) {
        newDirection = DIRECTIONS.UP;
        moving = true;
    } else if (keys['KeyS'] || keys['ArrowDown']) {
        newDirection = DIRECTIONS.DOWN;
        moving = true;
    } else if (keys['KeyA'] || keys['ArrowLeft']) {
        newDirection = DIRECTIONS.LEFT;
        moving = true;
    } else if (keys['KeyD'] || keys['ArrowRight']) {
        newDirection = DIRECTIONS.RIGHT;
        moving = true;
    }

    player.direction = newDirection;

    if (moving) {
        const speed = playerState.speedBoost > now ? player.speed * 1.5 : player.speed; // 速度提升50%
        const newX = player.x + player.direction.x * speed;
        const newY = player.y + player.direction.y * speed;

        if (!checkTankCollision(player, newX, newY)) {
            player.x = newX;
            player.y = newY;
        }
    }

    // 优化移动音效控制：只在状态变化时调用
    if (moving && !movementPlaying) {
        playMovementSound(true);
    } else if (!moving && movementPlaying) {
        stopMovementSound();
    }

    if (keys['Space']) {
        shoot(player, now);
    }

    player.x = Math.max(0, Math.min(CANVAS_SIZE - player.width, player.x));
    player.y = Math.max(0, Math.min(CANVAS_SIZE - player.height, player.y));
}

// 更新敌人
function updateEnemies(now) {
    enemies.forEach((enemy) => {
        // 检查是否被冻结
        if (enemy.frozen && now - enemy.freezeTime > 0) {
            enemy.frozen = false;
        }

        if (enemy.frozen) {
            return;
        }

        enemy.moveTimer++;

        if (enemy.moveTimer >= enemy.moveDuration) {
            enemy.moveTimer = 0;
            enemy.moveDuration = 60 + Math.random() * 60;
            const dirs = Object.values(DIRECTIONS);
            enemy.direction = dirs[Math.floor(Math.random() * dirs.length)];
        }

        const newX = enemy.x + enemy.direction.x * enemy.speed;
        const newY = enemy.y + enemy.direction.y * enemy.speed;

        if (!checkTankCollision(enemy, newX, newY)) {
            enemy.x = newX;
            enemy.y = newY;
        } else {
            const dirs = Object.values(DIRECTIONS);
            enemy.direction = dirs[Math.floor(Math.random() * dirs.length)];
        }

        enemy.x = Math.max(0, Math.min(CANVAS_SIZE - enemy.width, enemy.x));
        enemy.y = Math.max(0, Math.min(CANVAS_SIZE - enemy.height, enemy.y));

        shoot(enemy, now);
    });
}

// 矩形碰撞检测 - 直接使用参数避免临时对象
function rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 &&
           x1 + w1 > x2 &&
           y1 < y2 + h2 &&
           y1 + h1 > y2;
}

// 检测坦克碰撞 - 避免创建临时对象
function checkTankCollision(tank, newX, newY) {
    // 检查与其他坦克的碰撞
    if (tank.isPlayer) {
        for (const enemy of enemies) {
            if (rectCollision(newX, newY, tank.width, tank.height, enemy.x, enemy.y, enemy.width, enemy.height)) {
                return true;
            }
        }
    } else {
        if (player && rectCollision(newX, newY, tank.width, tank.height, player.x, player.y, player.width, player.height)) {
            return true;
        }
        for (const other of enemies) {
            if (other !== tank && rectCollision(newX, newY, tank.width, tank.height, other.x, other.y, other.width, other.height)) {
                return true;
            }
        }
    }

    // 检查与地图元素的碰撞
    const corners = [
        { x: newX + 2, y: newY + 2 },
        { x: newX + tank.width - 2, y: newY + 2 },
        { x: newX + 2, y: newY + tank.height - 2 },
        { x: newX + tank.width - 2, y: newY + tank.height - 2 }
    ];

    for (const corner of corners) {
        const tileX = Math.floor(corner.x / TILE_SIZE);
        const tileY = Math.floor(corner.y / TILE_SIZE);

        if (tileX < 0 || tileX >= GRID_SIZE || tileY < 0 || tileY >= GRID_SIZE) {
            return true;
        }

        const tile = map[tileY][tileX];
        if (tile === TILE_TYPES.BRICK || tile === TILE_TYPES.STEEL || tile === TILE_TYPES.WATER) {
            return true;
        }
    }

    return false;
}

// 射击
function shoot(tank, now) {
    const cooldown = tank.isPlayer ?
        (playerState.firePowerBoost > now ? GAME_CONFIG.player.shootCooldown / 2 : GAME_CONFIG.player.shootCooldown) :
        (GAME_CONFIG.enemy.shootCooldown + Math.random() * GAME_CONFIG.enemy.cooldownVariance);

    if (now - tank.lastShot < cooldown) return;

    tank.lastShot = now;

    const bulletX = tank.x + tank.width / 2 - 3 + tank.direction.x * (tank.width / 2);
    const bulletY = tank.y + tank.height / 2 - 3 + tank.direction.y * (tank.height / 2);

    // 火力增强：多发子弹
    if (tank.isPlayer && playerState.firePowerBoost > now) {
        // 主子弹
        bullets.push({
            x: bulletX,
            y: bulletY,
            width: 6,
            height: 6,
            speed: GAME_CONFIG.bullet.powerupSpeed,
            direction: tank.direction,
            isPlayer: tank.isPlayer,
            power: 2
        });

        // 副子弹
        const angleOffset = Math.PI / 6;
        for (let i = -1; i <= 1; i += 2) {
            const angle = tank.direction.angle + angleOffset * i;
            const direction = {
                x: Math.cos(angle),
                y: Math.sin(angle),
                angle: angle
            };
            bullets.push({
                x: bulletX,
                y: bulletY,
                width: 6,
                height: 6,
                speed: 6,
                direction: direction,
                isPlayer: tank.isPlayer,
                power: 1
            });
        }
    } else {
        // 普通子弹
        bullets.push({
            x: bulletX,
            y: bulletY,
            width: 6,
            height: 6,
            speed: tank.isPlayer ? GAME_CONFIG.bullet.playerSpeed : GAME_CONFIG.bullet.enemySpeed,
            direction: tank.direction,
            isPlayer: tank.isPlayer,
            power: 1
        });
    }

    playShootSound(tank.isPlayer);
}

// 更新子弹
function updateBullets(now) {
    bullets = bullets.filter(bullet => {
        bullet.x += bullet.direction.x * bullet.speed;
        bullet.y += bullet.direction.y * bullet.speed;

        if (bullet.x < 0 || bullet.x > CANVAS_SIZE || bullet.y < 0 || bullet.y > CANVAS_SIZE) {
            createExplosion(bullet.x, bullet.y, 'small');
            return false;
        }

        const tileX = Math.floor(bullet.x / TILE_SIZE);
        const tileY = Math.floor(bullet.y / TILE_SIZE);

        if (tileX >= 0 && tileX < GRID_SIZE && tileY >= 0 && tileY < GRID_SIZE) {
            const tile = map[tileY][tileX];

            if (tile === TILE_TYPES.BRICK) {
                map[tileY][tileX] = TILE_TYPES.EMPTY;
                createExplosion(tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2, 'small');
                return false;
            }

            if (tile === TILE_TYPES.STEEL) {
                // 增强子弹可以破坏钢墙
                if (bullet.isPlayer && bullet.power >= 2) {
                    map[tileY][tileX] = TILE_TYPES.EMPTY;
                    createExplosion(tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2, 'large');
                    return false;
                } else {
                    createExplosion(bullet.x, bullet.y, 'small');
                    return false;
                }
            }

            if (tile === TILE_TYPES.BASE) {
                createExplosion(bullet.x, bullet.y, 'large');
                gameOver(false);
                return false;
            }
        }

        if (bullet.isPlayer) {
            for (let i = enemies.length - 1; i >= 0; i--) {
                if (rectCollision(bullet.x, bullet.y, bullet.width, bullet.height, enemies[i].x, enemies[i].y, enemies[i].width, enemies[i].height)) {
                    createExplosion(enemies[i].x + enemies[i].width / 2, enemies[i].y + enemies[i].height / 2, 'large');
                    enemies.splice(i, 1);
                    gameState.score += GAME_CONFIG.game.baseScorePerEnemy;
                    gameState.enemiesRemaining--; // 减少剩余敌人数量
                    updateUI();
                    return false;
                }
            }
        } else {
            if (player && rectCollision(bullet.x, bullet.y, bullet.width, bullet.height, player.x, player.y, player.width, player.height)) {
                // 护盾可以吸收伤害
                if (playerState.shield > now) {
                    return false;
                }
                createExplosion(player.x + player.width / 2, player.y + player.height / 2, 'large');
                gameState.lives--;
                updateUI();

                if (gameState.lives <= 0) {
                    gameOver(false);
                } else {
                    createPlayer();
                }
                return false;
            }
        }

        return true;
    });
}

// 创建爆炸效果
function createExplosion(x, y, size) {
    explosions.push({
        x, y,
        size: size === 'large' ? 40 : 20,
        maxSize: size === 'large' ? 40 : 20,
        life: 20,
        maxLife: 20
    });

    playExplosionSound(size);
}

// 更新爆炸效果
function updateExplosions() {
    explosions = explosions.filter(exp => {
        exp.life--;
        exp.size = exp.maxSize * (exp.life / exp.maxLife);
        return exp.life > 0;
    });
}

// 检查游戏状态
function checkGameState() {
    if (enemies.length === 0 && gameState.enemiesRemaining <= 0 && !gameState.levelComplete) {
        gameState.levelComplete = true; // 设置标志防止重复触发
        gameState.level++;
        gameState.score += GAME_CONFIG.game.levelCompleteBonus;
        playLevelCompleteSound();
        setTimeout(() => {
            if (gameState.running) {
                gameState.levelComplete = false; // 重置标志
                initLevel();
            }
        }, 1000);
    }
}

// 游戏结束
function gameOver(victory) {
    gameState.running = false;
    playGameOverSound();

    // 确保移动音效停止
    if (movementPlaying) {
        stopMovementSound();
    }

    // 停止道具生成计时器
    stopPowerupSpawnTimer();

    // 清除敌人生成计时器
    clearEnemySpawnTimeouts();

    UI_ELEMENTS.gameOverTitle.textContent = victory ? '🎉 胜利！' : '💀 游戏结束';
    UI_ELEMENTS.finalScore.textContent = `最终分数: ${gameState.score}`;
    UI_ELEMENTS.finalLevel.textContent = `关卡: ${gameState.level}`;
    UI_ELEMENTS.gameOverScreen.classList.remove('hidden');
}

// 渲染
function render(now) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    renderMap(now);
    renderTanks(now);
    renderBullets();
    renderExplosions();
    renderPowerups(now);
}

// 道具配置 - 统一管理道具的视觉属性
const POWERUP_CONFIG = {
    [POWERUP_TYPES.SPEED]: {
        color: 'rgba(255, 215, 0, {pulse})',
        icon: '⚡'
    },
    [POWERUP_TYPES.FIREPOWER]: {
        color: 'rgba(255, 140, 0, {pulse})',
        icon: '🔥'
    },
    [POWERUP_TYPES.SHIELD]: {
        color: 'rgba(0, 191, 255, {pulse})',
        icon: '🛡️'
    },
    [POWERUP_TYPES.LIFE]: {
        color: 'rgba(255, 0, 139, {pulse})',
        icon: '❤️'
    },
    [POWERUP_TYPES.BOMB]: {
        color: 'rgba(255, 0, 0, {pulse})',
        icon: '💣'
    },
    [POWERUP_TYPES.FREEZE]: {
        color: 'rgba(135, 206, 250, {pulse})',
        icon: '❄️'
    }
};

// 渲染道具
function renderPowerups(now) {
    powerups.forEach(powerup => {
        ctx.save();

        // 闪烁效果
        const pulse = Math.sin(now / 300) * 0.3 + 0.7;

        const config = POWERUP_CONFIG[powerup.type];
        if (config) {
            // 绘制道具背景
            ctx.fillStyle = config.color.replace('{pulse}', pulse);
            ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);

            // 绘制道具图标
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(config.icon, powerup.x + powerup.width / 2, powerup.y + powerup.height / 2);
        }

        ctx.restore();
    });
}

// 渲染地图
function renderMap(now) {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const tile = map[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            switch (tile) {
                case TILE_TYPES.BRICK:
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = '#5D3A1A';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px + 1, py + 1, TILE_SIZE / 2 - 2, TILE_SIZE / 2 - 2);
                    ctx.strokeRect(px + TILE_SIZE / 2 + 1, py + 1, TILE_SIZE / 2 - 2, TILE_SIZE / 2 - 2);
                    ctx.strokeRect(px + 1, py + TILE_SIZE / 2 + 1, TILE_SIZE / 2 - 2, TILE_SIZE / 2 - 2);
                    ctx.strokeRect(px + TILE_SIZE / 2 + 1, py + TILE_SIZE / 2 + 1, TILE_SIZE / 2 - 2, TILE_SIZE / 2 - 2);
                    break;

                case TILE_TYPES.STEEL:
                    ctx.fillStyle = '#808080';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#A0A0A0';
                    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    ctx.fillStyle = '#606060';
                    ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                    break;

                case TILE_TYPES.WATER:
                    ctx.fillStyle = '#1E90FF';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = '#00BFFF';
                    ctx.lineWidth = 2;
                    const waveOffset = (now / 200) % (Math.PI * 2);
                    ctx.beginPath();
                    ctx.moveTo(px, py + TILE_SIZE / 2);
                    for (let i = 0; i <= TILE_SIZE; i += 4) {
                        ctx.lineTo(px + i, py + TILE_SIZE / 2 + Math.sin(waveOffset + i * 0.2) * 3);
                    }
                    ctx.stroke();
                    break;

                case TILE_TYPES.FOREST:
                    ctx.fillStyle = '#228B22';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#32CD32';
                    ctx.beginPath();
                    ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 3, TILE_SIZE / 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(px + TILE_SIZE / 2 - 3, py + TILE_SIZE / 2, 6, TILE_SIZE / 2);
                    break;

                case TILE_TYPES.BASE:
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#FFA500';
                    ctx.beginPath();
                    ctx.moveTo(px + TILE_SIZE / 2, py + 4);
                    ctx.lineTo(px + TILE_SIZE - 4, py + TILE_SIZE / 2);
                    ctx.lineTo(px + TILE_SIZE / 2, py + TILE_SIZE - 4);
                    ctx.lineTo(px + 4, py + TILE_SIZE / 2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(px + TILE_SIZE / 2 - 4, py + TILE_SIZE / 2 - 4, 8, 8);
                    break;
            }
        }
    }
}

// 渲染坦克
function renderTanks(now) {
    if (player) {
        renderTank(player, now);
    }

    enemies.forEach(enemy => renderTank(enemy, now));
}

// 渲染单个坦克
function renderTank(tank, now) {
    ctx.save();
    ctx.translate(tank.x + tank.width / 2, tank.y + tank.height / 2);
    ctx.rotate(tank.direction.angle);

    ctx.fillStyle = tank.color;
    ctx.fillRect(-tank.width / 2, -tank.height / 2, tank.width, tank.height);

    ctx.fillStyle = tank.isPlayer ? '#2E7D32' : '#D32F2F';
    ctx.beginPath();
    ctx.arc(0, 0, tank.width / 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.fillRect(-3, -tank.height / 2, 6, tank.height / 2 + 5);

    ctx.fillStyle = '#555';
    ctx.fillRect(-tank.width / 2 - 2, -tank.height / 2, 4, tank.height);
    ctx.fillRect(tank.width / 2 - 2, -tank.height / 2, 4, tank.height);

    // 渲染护盾
    if (tank.isPlayer && playerState.shield > now) {
        ctx.strokeStyle = 'rgba(0, 191, 255, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, tank.width / 2 + 8, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

// 渲染子弹
function renderBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.isPlayer ? '#FFD700' : '#FF4500';
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowColor = bullet.isPlayer ? '#FFD700' : '#FF4500';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

// 渲染爆炸效果
function renderExplosions() {
    explosions.forEach(exp => {
        const alpha = exp.life / exp.maxLife;
        
        ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.size * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 启动游戏
init();
