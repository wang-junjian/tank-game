# 桌面版使用说明

本项目已经支持使用 Electron 打包为桌面应用，支持 macOS、Windows 和 Linux 平台。

## 环境要求
- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器

## 安装依赖
首次运行需要安装所有依赖：
```bash
npm install
```

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

打包后的应用会生成在 `dist` 目录下：
- macOS平台：`dist/mac/` 目录下的 `.app` 文件
- Windows平台：`dist/win-unpacked/` 目录下的 `.exe` 文件
- Linux平台：`dist/linux-unpacked/` 目录下的可执行文件

## 常见问题

### Q: 开发模式启动白屏怎么办？
A: 确保项目根目录下的index.html文件存在，并且Electron能够正确读取。可以尝试按`Cmd/Ctrl + Shift + I`打开开发者工具查看错误信息。

### Q: 打包速度很慢怎么办？
A: electron-builder首次打包需要下载对应平台的Electron二进制文件，可以设置国内镜像加速：
```bash
# 设置Electron镜像
npm config set ELECTRON_MIRROR https://npmmirror.com/mirrors/electron/
# 设置electron-builder镜像
npm config set ELECTRON_BUILDER_BINARIES_MIRROR https://npmmirror.com/mirrors/electron-builder-binaries/
```

### Q: macOS打包后提示"无法打开，因为无法验证开发者"怎么办？
A: 右键点击应用，选择"打开"，或者在系统设置→隐私与安全性中允许打开该应用。

### Q: 应用图标显示不正确怎么办？
A: 请参考 `public/ICONS.md` 准备正确格式和尺寸的图标文件，放在public目录下重新打包。

## 开发注意事项
- 桌面版游戏会自动最大化窗口，按F11可以切换全屏/窗口模式
- 所有浏览器版本的功能和快捷键在桌面版完全兼容
- 游戏数据保存在系统的应用数据目录中，卸载应用时会保留
