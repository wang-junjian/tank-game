// 游戏状态管理模块

// 游戏状态
export let gameState = {
    running: false,
    paused: false,
    score: 0,
    level: 1,
    lives: 3,
    enemiesRemaining: 0,
    levelComplete: false, // 防止重复触发关卡完成
    gameStartTime: 0, // 游戏开始时间
    gamePausedTime: 0, // 暂停时的时间点
    totalPausedDuration: 0, // 总共暂停的时间
    enemiesKilled: 0 // 已消灭敌人数量
};

// 玩家状态 - 同时记录结束时间和持续时间
export let playerState = {
    speedBoost: { endTime: 0, duration: 0 },
    firePowerBoost: { endTime: 0, duration: 0 },
    shield: { endTime: 0, duration: 0 },
    freezeActive: { endTime: 0, duration: 0 }
};

// 游戏对象
export let player = null;
export let enemies = [];
export let bullets = [];
export let explosions = [];
export let map = [];
export let powerups = [];

// 键盘状态
export const keys = {};

// 重置游戏状态的辅助函数
export function resetGameState() {
    gameState.running = false;
    gameState.paused = false;
    gameState.score = 0;
    gameState.level = 1;
    gameState.lives = 3;
    gameState.enemiesRemaining = 0;
    gameState.levelComplete = false;
    gameState.gameStartTime = 0;
    gameState.gamePausedTime = 0;
    gameState.totalPausedDuration = 0;
    gameState.enemiesKilled = 0;

    // 重置玩家状态
    playerState.speedBoost = { endTime: 0, duration: 0 };
    playerState.firePowerBoost = { endTime: 0, duration: 0 };
    playerState.shield = { endTime: 0, duration: 0 };
    playerState.freezeActive = { endTime: 0, duration: 0 };

    // 清空游戏对象
    player = null;
    enemies = [];
    bullets = [];
    explosions = [];
    map = [];
    powerups = [];
}