// 浏览器端自检：把 site/index.html 真的打开、真的点「开始游戏」、真的看画面变没变。
//
// 只做「能否玩」这一件事的验证，不做视觉回归。断言失败时退出码非 0，并留下截图。
//
// 依赖 puppeteer-core（不含浏览器本体）。本地可用 PUPPETEER_CORE 指向已有的安装，
// CI 里由 workflow 临时安装 + 由 setup-chrome 提供 CHROME_PATH。
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const SHOTS = join(ROOT, 'shots');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter(Boolean);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const failures = [];
const passes = [];
function check(name, cond, detail) {
  if (cond) {
    passes.push(name);
    console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function loadPuppeteer() {
  const override = process.env.PUPPETEER_CORE;
  if (override) {
    const p = existsSync(join(override, 'package.json'))
      ? join(override, 'lib', 'esm', 'puppeteer', 'puppeteer-core.js')
      : override;
    return (await import(pathToFileURL(p).href)).default;
  }
  return (await import('puppeteer-core')).default;
}

function startServer() {
  const server = createServer(async (req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const rel = urlPath === '/' ? '/index.html' : urlPath;
    const file = join(SITE, rel);
    if (!file.startsWith(SITE)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found');
    }
  });
  return new Promise((ok) => {
    server.listen(0, '127.0.0.1', () => ok({ server, port: server.address().port }));
  });
}

// 画布指纹：采样非黑点数量 + 颜色种类 + 像素和，用来判断「有没有画东西 / 画面有没有变」。
const SAMPLE_FN = () => {
  const c = document.getElementById('gameCanvas');
  if (!c) return null;
  const d = c.getContext('2d', { willReadFrequently: true })
    .getImageData(0, 0, c.width, c.height).data;
  let nonBlack = 0;
  let sum = 0;
  const colors = new Set();
  for (let i = 0; i < d.length; i += 4 * 53) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    if (r + g + b > 24) nonBlack++;
    sum += r + g + b;
    colors.add(`${r >> 5},${g >> 5},${b >> 5}`);
  }
  return {
    w: c.width,
    h: c.height,
    nonBlack,
    colors: colors.size,
    sum,
    startHidden: !!document.getElementById('startScreen')?.classList.contains('hidden'),
    score: document.getElementById('score')?.textContent,
    enemies: document.getElementById('enemies')?.textContent,
  };
};

async function main() {
  if (!existsSync(join(SITE, 'index.html'))) {
    console.error('✗ 找不到 site/index.html，先跑 npm run build:web');
    process.exit(1);
  }

  const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!chrome) {
    console.error('✗ 找不到 Chrome，可用 CHROME_PATH 指定');
    process.exit(1);
  }

  const puppeteer = await loadPuppeteer();
  const { server, port } = await startServer();
  const url = `http://127.0.0.1:${port}/`;
  const errors = [];

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1100 });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
    });
    page.on('requestfailed', (r) => {
      errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText || ''}`);
    });
    const badResponses = [];
    page.on('response', (r) => {
      if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`);
    });

    console.log(`\n打开 ${url}（Chrome: ${chrome}）`);
    const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    check('页面返回 200', resp?.status() === 200, `status=${resp?.status()}`);
    await new Promise((r) => setTimeout(r, 800));

    // 1) 资源零 404：单文件产物必须做到「打开即完整」。
    check('无 4xx/5xx 资源请求', badResponses.length === 0, badResponses.join(', ') || undefined);

    // 2) 结构：画布与开始界面都在。
    const boot = await page.evaluate(SAMPLE_FN);
    check('画布存在且为 800×800', boot && boot.w === 800 && boot.h === 800,
      boot ? `${boot.w}×${boot.h}` : '未取到 canvas');
    check('开始界面初始可见', boot && boot.startHidden === false);

    // 3) 开局：点开始按钮后遮罩消失。
    await page.click('#startBtn');
    await new Promise((r) => setTimeout(r, 1500));
    const playing = await page.evaluate(SAMPLE_FN);
    check('点击开始后遮罩隐藏', playing && playing.startHidden === true);

    // 4) 真的画出来了：全黑说明渲染循环没跑。
    check('画布已渲染内容', playing && playing.nonBlack > 500,
      playing ? `非黑采样点 ${playing.nonBlack}，颜色 ${playing.colors} 种` : undefined);
    check('画面颜色足够丰富', playing && playing.colors > 5,
      playing ? `${playing.colors} 种` : undefined);

    // 5) 主循环在跑：按住方向键后画面必须变化（不是一张静态图）。
    const before = await page.evaluate(SAMPLE_FN);
    await page.keyboard.down('ArrowUp');
    await new Promise((r) => setTimeout(r, 450));
    await page.keyboard.up('ArrowUp');
    await page.keyboard.press('Space');
    await new Promise((r) => setTimeout(r, 700));
    const after = await page.evaluate(SAMPLE_FN);
    check('主循环在推进（按键后画面变化）',
      before && after && before.sum !== after.sum,
      before && after ? `${before.sum} → ${after.sum}` : undefined);
    check('HUD 数值可读', !!after && after.score !== undefined && after.enemies !== undefined,
      after ? `分数=${after.score} 剩余敌人=${after.enemies}` : undefined);

    // 6) 全程零 JS 异常。
    check('无 JS 运行时错误', errors.length === 0, errors.slice(0, 4).join(' | ') || undefined);

    await mkdir(SHOTS, { recursive: true });
    await page.screenshot({ path: join(SHOTS, 'playing.png') });
    await page.screenshot({ path: join(SHOTS, 'playing-full.png'), fullPage: true });
    console.log(`\n截图：shots/playing.png`);
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n通过 ${passes.length} 项，失败 ${failures.length} 项`);
  if (failures.length) {
    console.error('\n失败项：');
    for (const f of failures) console.error(` - ${f}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('✗ 自检异常：', e.stack || e);
  process.exit(1);
});
