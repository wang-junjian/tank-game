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

// 播放射击音效
function playShootSound(isPlayer = true) {
    if (!audioCtx || !soundEnabled) return;

    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.value = isPlayer ? 800 : 600;
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.1);

        // 确保资源释放
        setTimeout(() => {
            oscillator.disconnect();
            gainNode.disconnect();
        }, 150);
    } catch (error) {
        console.error('播放射击音效失败:', error);
    }
}

// 播放爆炸音效
function playExplosionSound(size = 'small') {
    if (!audioCtx || !soundEnabled) return;

    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.setValueAtTime(size === 'large' ? 400 : 600, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
        oscillator.type = 'sawtooth';

        gainNode.gain.setValueAtTime(size === 'large' ? 0.5 : 0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.2);

        // 确保资源释放
        setTimeout(() => {
            oscillator.disconnect();
            gainNode.disconnect();
        }, 250);
    } catch (error) {
        console.error('播放爆炸音效失败:', error);
    }
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
    if (!audioCtx || !soundEnabled) return;

    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(659, audioCtx.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(784, audioCtx.currentTime + 0.4);
        oscillator.frequency.setValueAtTime(1047, audioCtx.currentTime + 0.6);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.8);

        // 确保资源释放
        setTimeout(() => {
            oscillator.disconnect();
            gainNode.disconnect();
        }, 900);
    } catch (error) {
        console.error('播放关卡完成音效失败:', error);
    }
}

// 播放游戏结束音效
function playGameOverSound() {
    if (!audioCtx || !soundEnabled) return;

    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.8);
        oscillator.type = 'sawtooth';

        gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.8);

        // 确保资源释放
        setTimeout(() => {
            oscillator.disconnect();
            gainNode.disconnect();
        }, 900);
    } catch (error) {
        console.error('播放游戏结束音效失败:', error);
    }
}

// 游戏常量
const TILE_SIZE = 32;
const GRID_SIZE = 20;
const CANVAS_SIZE = TILE_SIZE * GRID_SIZE;

// 音效开关
let soundEnabled = true;

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

// 游戏状态
let gameState = {
    running: false,
    score: 0,
    level: 1,
    lives: 3,
    enemiesRemaining: 0
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

    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', startGame);

    document.getElementById('soundBtn').addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        const soundBtn = document.getElementById('soundBtn');
        soundBtn.textContent = soundEnabled ? '开启' : '关闭';
        soundBtn.style.background = soundEnabled ? '#4CAF50' : '#f44336';
    });
}

// 显示开始屏幕
function showStartScreen() {
    document.getElementById('startScreen').classList.remove('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
}

// 开始游戏
function startGame() {
    initAudio();
    gameState = {
        running: true,
        score: 0,
        level: 1,
        lives: 3,
        enemiesRemaining: 4
    };

    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');

    initLevel();
    gameLoop();
}

// 初始化关卡
function initLevel() {
    enemies = [];
    bullets = [];
    explosions = [];

    // 确保移动音效停止
    if (movementPlaying) {
        stopMovementSound();
    }

    generateMap();
    createPlayer();
    spawnEnemies();
    updateUI();
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

    // 随机放置砖墙
    const brickCount = 80 + gameState.level * 10;
    for (let i = 0; i < brickCount; i++) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
        if (map[y][x] === TILE_TYPES.EMPTY) {
            map[y][x] = TILE_TYPES.BRICK;
        }
    }

    // 放置钢墙
    const steelCount = 10 + gameState.level * 2;
    for (let i = 0; i < steelCount; i++) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
        if (map[y][x] === TILE_TYPES.EMPTY) {
            map[y][x] = TILE_TYPES.STEEL;
        }
    }

    // 放置水域
    const waterCount = 5;
    for (let i = 0; i < waterCount; i++) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * (GRID_SIZE - 6)) + 3;
        if (map[y][x] === TILE_TYPES.EMPTY) {
            map[y][x] = TILE_TYPES.WATER;
        }
    }

    // 放置树林
    const forestCount = 15;
    for (let i = 0; i < forestCount; i++) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
        if (map[y][x] === TILE_TYPES.EMPTY) {
            map[y][x] = TILE_TYPES.FOREST;
        }
    }
}

// 创建玩家坦克
function createPlayer() {
    player = {
        x: 9 * TILE_SIZE,
        y: 17 * TILE_SIZE,
        width: TILE_SIZE - 4,
        height: TILE_SIZE - 4,
        speed: 2,
        direction: DIRECTIONS.UP,
        color: '#4CAF50',
        isPlayer: true,
        lastShot: 0,
        shootCooldown: 300
    };
}

// 生成敌人
function spawnEnemies() {
    const spawnPoints = [
        { x: 1 * TILE_SIZE, y: 1 * TILE_SIZE },
        { x: 9 * TILE_SIZE, y: 1 * TILE_SIZE },
        { x: 18 * TILE_SIZE, y: 1 * TILE_SIZE }
    ];

    const enemyCount = Math.min(4 + gameState.level, 8);
    gameState.enemiesRemaining = enemyCount;

    for (let i = 0; i < enemyCount; i++) {
        const spawn = spawnPoints[i % spawnPoints.length];
        setTimeout(() => {
            if (gameState.running) {
                enemies.push({
                    x: spawn.x,
                    y: spawn.y,
                    width: TILE_SIZE - 4,
                    height: TILE_SIZE - 4,
                    speed: 1 + gameState.level * 0.2,
                    direction: DIRECTIONS.DOWN,
                    color: '#f44336',
                    isPlayer: false,
                    lastShot: 0,
                    shootCooldown: 1000 + Math.random() * 500,
                    moveTimer: 0,
                    moveDuration: 60 + Math.random() * 60
                });
            }
        }, i * 1500);
    }
}

// 更新UI
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('enemies').textContent = enemies.length;
}

// 游戏主循环
function gameLoop() {
    if (!gameState.running) return;

    update();
    render();

    requestAnimationFrame(gameLoop);
}

// 更新游戏状态
function update() {
    updatePlayer();
    updateEnemies();
    updateBullets();
    updateExplosions();
    checkGameState();
}

// 更新玩家
function updatePlayer() {
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
        const newX = player.x + player.direction.x * player.speed;
        const newY = player.y + player.direction.y * player.speed;

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
        shoot(player);
    }

    player.x = Math.max(0, Math.min(CANVAS_SIZE - player.width, player.x));
    player.y = Math.max(0, Math.min(CANVAS_SIZE - player.height, player.y));
}

// 更新敌人
function updateEnemies() {
    enemies.forEach((enemy) => {
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

        shoot(enemy);
    });
}

// 检测坦克碰撞
function checkTankCollision(tank, newX, newY) {
    const tempTank = { ...tank, x: newX, y: newY };

    if (tank.isPlayer) {
        for (const enemy of enemies) {
            if (rectCollision(tempTank, enemy)) return true;
        }
    } else {
        if (player && rectCollision(tempTank, player)) return true;
        for (const other of enemies) {
            if (other !== tank && rectCollision(tempTank, other)) return true;
        }
    }

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

// 矩形碰撞检测
function rectCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// 射击
function shoot(tank) {
    const now = Date.now();
    if (now - tank.lastShot < tank.shootCooldown) return;

    tank.lastShot = now;

    const bulletX = tank.x + tank.width / 2 - 3 + tank.direction.x * (tank.width / 2);
    const bulletY = tank.y + tank.height / 2 - 3 + tank.direction.y * (tank.height / 2);

    bullets.push({
        x: bulletX,
        y: bulletY,
        width: 6,
        height: 6,
        speed: tank.isPlayer ? 5 : 4,
        direction: tank.direction,
        isPlayer: tank.isPlayer
    });

    playShootSound(tank.isPlayer);
}

// 更新子弹
function updateBullets() {
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
                createExplosion(bullet.x, bullet.y, 'small');
                return false;
            }

            if (tile === TILE_TYPES.BASE) {
                createExplosion(bullet.x, bullet.y, 'large');
                gameOver(false);
                return false;
            }
        }

        if (bullet.isPlayer) {
            for (let i = enemies.length - 1; i >= 0; i--) {
                if (rectCollision(bullet, enemies[i])) {
                    createExplosion(enemies[i].x + enemies[i].width / 2, enemies[i].y + enemies[i].height / 2, 'large');
                    enemies.splice(i, 1);
                    gameState.score += 100;
                    updateUI();
                    return false;
                }
            }
        } else {
            if (player && rectCollision(bullet, player)) {
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
    if (enemies.length === 0 && gameState.enemiesRemaining <= enemies.length) {
        gameState.level++;
        gameState.score += 500;
        playLevelCompleteSound();
        setTimeout(() => {
            if (gameState.running) {
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

    document.getElementById('gameOverTitle').textContent = victory ? '🎉 胜利！' : '💀 游戏结束';
    document.getElementById('finalScore').textContent = `最终分数: ${gameState.score}`;
    document.getElementById('finalLevel').textContent = `关卡: ${gameState.level}`;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// 渲染
function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    renderMap();
    renderTanks();
    renderBullets();
    renderExplosions();
}

// 渲染地图
function renderMap() {
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
                    const waveOffset = (Date.now() / 200) % (Math.PI * 2);
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
function renderTanks() {
    if (player) {
        renderTank(player);
    }

    enemies.forEach(enemy => renderTank(enemy));
}

// 渲染单个坦克
function renderTank(tank) {
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
