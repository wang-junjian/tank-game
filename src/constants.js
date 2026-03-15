// 游戏尺寸常量
export const TILE_SIZE = 40;
export const GRID_SIZE = 20;
export const CANVAS_SIZE = TILE_SIZE * GRID_SIZE;

// 方向
export const DIRECTIONS = {
    UP: { x: 0, y: -1, angle: 0 },
    DOWN: { x: 0, y: 1, angle: Math.PI },
    LEFT: { x: -1, y: 0, angle: -Math.PI / 2 },
    RIGHT: { x: 1, y: 0, angle: Math.PI / 2 }
};

// 地图元素类型
export const TILE_TYPES = {
    EMPTY: 0,
    BRICK: 1,
    STEEL: 2,
    WATER: 3,
    FOREST: 4,
    BASE: 5
};

// 道具类型
export const POWERUP_TYPES = {
    SPEED: 'speed',        // 速度提升
    FIREPOWER: 'firepower',  // 火力提升
    SHIELD: 'shield',      // 护盾
    LIFE: 'life',          // 生命
    BOMB: 'bomb',          // 炸弹
    FREEZE: 'freeze'       // 冻结敌人
};