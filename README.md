# 🎮 坦克大战 - Tank Battle

一个基于 HTML5 Canvas 和原生 JavaScript 开发的经典坦克游戏克隆，致敬任天堂的《坦克大战》（Battle City）。

## ✨ 功能特性

### 核心玩法
- **玩家坦克** - 使用 WASD 或方向键控制移动，空格键射击
- **AI 敌方坦克** - 自动移动和射击，难度随关卡递增
- **基地保护** - 保护你的金色基地不被敌人摧毁
- **关卡系统** - 通关后自动进入下一关，敌人越来越强

### 地图元素
- **🧱 砖墙** - 可被子弹破坏，提供战术掩护
- **🔩 钢墙** - 不可破坏的坚固障碍物
- **💧 水域** - 坦克无法通过的水域
- **🌲 树林** - 可以隐藏坦克的树林
- **🏠 基地** - 需要保护的核心目标

### 游戏系统
- **分数系统** - 消灭敌人获得分数，通关获得奖励
- **生命系统** - 玩家有 3 条生命
- **爆炸效果** - 炫酷的爆炸动画
- **游戏状态** - 开始界面、游戏界面、结束界面
- **音频系统** - 完整的音效系统，支持开关控制

## 🎯 操作说明

| 按键 | 功能 |
|------|------|
| W / ↑ | 向上移动 |
| S / ↓ | 向下移动 |
| A / ← | 向左移动 |
| D / → | 向右移动 |
| 空格键 | 发射子弹 |
| 音效按钮 | 开关游戏音效（开启/关闭） |

## 🚀 快速开始

### 方法一：直接打开
1. 下载或克隆这个项目
2. 用浏览器打开 `index.html` 文件
3. 点击"开始游戏"按钮

### 方法二：本地服务器（推荐）
使用 npm 启动服务器（需要先安装 serve）：

```bash
# 安装 serve（只需安装一次）
npm install -g serve

# 启动服务器
npm run start
```

或者使用 Python 启动服务器：

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

然后在浏览器访问 `http://localhost:8000`

## 📁 项目结构

```
tank-game/
├── index.html        # 游戏入口页面
├── game.js          # 游戏逻辑代码
├── package.json     # 项目配置文件
├── test-audio.html  # 音频系统测试页面
└── README.md        # 说明文档
```

## 🎨 技术栈

- **HTML5 Canvas** - 游戏渲染
- **原生 JavaScript** - 游戏逻辑（ES6+）
- **CSS3** - 界面样式
- **Web Audio API** - 音频系统，实时生成音效

## 🕹️ 游戏机制

### 碰撞检测
- 坦克 vs 墙壁
- 子弹 vs 坦克
- 子弹 vs 墙壁
- 坦克 vs 坦克

### 音频系统

#### 音效类型
- **射击音效** - 玩家和敌人有不同的频率（800Hz/600Hz）
- **爆炸音效** - 支持小爆炸（600Hz）和大爆炸（400Hz）
- **移动音效** - 循环播放的方形波（100Hz/80Hz）
- **关卡完成音效** - 上升的正弦波音阶（523→659→784→1047Hz）
- **游戏结束音效** - 下降的锯齿波（300Hz→100Hz）

#### 音频特性
- **实时生成** - 使用 Web Audio API 实时合成音效，无需外部文件
- **错误处理** - 所有音频函数都有 try-catch 错误处理
- **资源管理** - 音频资源在播放结束后正确清理
- **音量控制** - 所有音效都有合适的音量设置
- **淡出效果** - 停止时使用淡出效果，避免突然中断

#### 控制方法
- 点击界面上的"音效"按钮可以开关所有音效
- 音效开关状态会实时更新按钮显示和颜色

### AI 行为
- 敌人随机改变移动方向
- 敌人自动射击
- 敌人数量和速度随关卡增加

### 关卡设计
- 每关地图随机生成
- 关卡越高，敌人越强
- 砖墙、钢墙等元素数量递增

## 🔧 自定义修改

### 修改游戏速度
在 `game.js` 中找到：
```javascript
speed: 2,  // 玩家速度
speed: 1 + gameState.level * 0.2,  // 敌人速度
```

### 修改子弹速度
```javascript
speed: tank.isPlayer ? 5 : 4,  // 子弹速度
```

### 修改地图大小
```javascript
const TILE_SIZE = 32;  // 瓦片大小
const GRID_SIZE = 20;  // 网格大小
```

### 修改音频系统

#### 修改音效音量
在 `game.js` 中找到音频函数并修改 `gain` 相关设置：
```javascript
// 射击音效
gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);

// 爆炸音效（大/小）
gainNode.gain.setValueAtTime(size === 'large' ? 0.5 : 0.3, audioCtx.currentTime);

// 移动音效
movementGain.gain.setValueAtTime(0.1, audioCtx.currentTime);

// 关卡完成/游戏结束
gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
```

#### 修改音效频率
在 `game.js` 中找到音频函数并修改 `frequency` 相关设置：
```javascript
// 射击音效（玩家/敌人）
oscillator.frequency.value = isPlayer ? 800 : 600;

// 爆炸音效（大/小）
oscillator.frequency.setValueAtTime(size === 'large' ? 400 : 600, audioCtx.currentTime);

// 移动音效（玩家/敌人）
movementOscillator.frequency.value = isPlayer ? 100 : 80;
```

#### 修改音效持续时间
在 `game.js` 中找到音频函数并修改 `stop` 和 `rampToValueAtTime` 时间：
```javascript
// 射击音效持续时间
oscillator.stop(audioCtx.currentTime + 0.1);
gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

// 爆炸音效持续时间
oscillator.stop(audioCtx.currentTime + 0.2);
gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
```

## 📜 游戏规则

1. **胜利条件** - 消灭所有敌方坦克
2. **失败条件** - 基地被摧毁 或 玩家生命耗尽
3. **得分规则** - 消灭一个敌人 +100 分，通关 +500 分

## 🎉 致谢

- 致敬任天堂经典游戏《坦克大战》
- 感谢所有开源游戏开发社区的贡献

## 📄 许可证

MIT License - 自由使用和修改

---

祝你游戏愉快！🎮✨
