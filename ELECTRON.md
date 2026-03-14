# 桌面版使用说明

本项目已经支持使用 Electron 打包为桌面应用，支持 macOS、Windows 和 Linux 平台。

## 开发模式运行

```bash
npm run electron:dev
```

这会启动 Electron 开发模式，直接运行游戏。

## 打包桌面应用

### 打包当前平台的应用
```bash
npm run electron:build
```

### 打包特定平台的应用

#### macOS
```bash
npm run electron:build:mac
```

#### Windows
```bash
npm run electron:build:win
```

#### Linux
```bash
npm run electron:build:linux
```

### 打包所有平台的应用
```bash
npm run electron:build:all
```

## 功能特性

- 🎮 完整的坦克游戏体验
- ⌨️ 支持键盘快捷键
- 🖼️ 支持窗口缩放和全屏模式
- 📱 跨平台支持（macOS/Windows/Linux）
- 🔄 内置HTTP服务器，无需外部依赖

## 键盘快捷键

- `Cmd/Ctrl + R`: 重新开始游戏
- `Cmd/Ctrl + Q`: 退出游戏
- `Cmd/Ctrl + 0`: 重置缩放
- `Cmd/Ctrl + =`: 放大窗口
- `Cmd/Ctrl + -`: 缩小窗口
- `F11`: 切换全屏模式
- `Cmd/Ctrl + Shift + I`: 打开开发者工具

## 应用图标

请参考 `public/ICONS.md` 文件来添加自定义应用图标。

## 输出目录

打包后的应用会生成在 `dist` 目录下。
