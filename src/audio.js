// 音频系统模块
let audioCtx = null;
let soundEnabled = true;

// 移动音效状态
let movementOscillator = null;
let movementGain = null;
let movementPlaying = false;

// 设置音效开关状态
export function setSoundEnabled(enabled) {
    soundEnabled = enabled;
}

// 获取音效开关状态
export function getSoundEnabled() {
    return soundEnabled;
}

// 初始化音频系统
export function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext)();
    }
}

// 音频合成器 - 统一处理所有音效生成
export function playSound(options) {
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
export function playShootSound(isPlayer = true) {
    playSound({
        frequency: isPlayer ? 800 : 600,
        duration: 0.1,
        type: 'square',
        gain: 0.3
    });
}

// 播放爆炸音效
export function playExplosionSound(size = 'small') {
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
export function playMovementSound(isPlayer = true) {
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

// 停止移动音效
export function stopMovementSound() {
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
export function playLevelCompleteSound() {
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
export function playGameOverSound() {
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