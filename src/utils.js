import { TILE_SIZE, GRID_SIZE, TILE_TYPES } from './constants.js';

// 矩形碰撞检测 - 直接使用参数避免临时对象
export function rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 &&
           x1 + w1 > x2 &&
           y1 < y2 + h2 &&
           y1 + h1 > y2;
}

// 随机数生成工具
export function random(min, max) {
    return Math.random() * (max - min) + min;
}

// 随机整数生成工具
export function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}