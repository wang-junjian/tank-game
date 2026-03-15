// 游戏默认配置
export const GAME_CONFIG = {
    // 玩家配置
    player: {
        speed: 2.5, // 移动速度
        shootCooldown: 300, // 射击冷却时间（毫秒）
        initialLives: 3 // 初始生命值
    },
    // 敌人配置
    enemy: {
        baseSpeed: 1.5, // 基础移动速度
        speedIncreasePerLevel: 0.2, // 每关速度增加
        shootCooldown: 1000, // 基础射击冷却
        cooldownVariance: 500, // 射击冷却随机波动
        initialCount: 5, // 初始敌人数量
        countIncreasePerLevel: 2, // 每关增加的敌人数量
        maxCount: 20, // 最大敌人数量
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

// 音效开关默认值
export let soundEnabled = GAME_CONFIG.sound.enabled;