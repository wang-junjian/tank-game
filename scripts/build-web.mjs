// 把 index.html + game.js 内联成单文件产物 site/index.html。
//
// 为什么内联：仓库里是「index.html 引用 game.js」的可维护源码结构，
// 而线上/离线要的是「双击即玩」的单文件。两者各守其位：
//   - 源码保持分文件，方便阅读与 diff；
//   - 产物单文件，发布到 Pages 后只需一次请求，也不怕相对路径写错。
//
// 零依赖：只用 node 标准库，CI 里不需要 npm ci。
import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'site');
const OUT_HTML = join(OUT_DIR, 'index.html');

const SCRIPT_TAG = '<script src="game.js"></script>';
// 产物里必须出现的关键标记：任何一个消失都说明内联没做对。
const REQUIRED_MARKERS = [
  '<canvas id="gameCanvas"',
  'id="startScreen"',
  'id="startBtn"',
  'function init()',
  'function startGame(',
];

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

async function main() {
  const htmlPath = join(ROOT, 'index.html');
  const jsPath = join(ROOT, 'game.js');

  for (const p of [htmlPath, jsPath]) {
    if (!existsSync(p)) fail(`缺少源文件：${p}`);
  }

  const [html, js] = await Promise.all([
    readFile(htmlPath, 'utf8'),
    readFile(jsPath, 'utf8'),
  ]);

  // 内联的前提：JS 里不能有会提前闭合 <script> 的片段。
  if (/<\/script/i.test(js)) fail('game.js 含有 "</script"，无法安全内联');
  // 也拒绝 HTML 注释开始符，它在 script 里会被当成注释开头（历史遗留陷阱）。
  if (js.includes('<!--')) fail('game.js 含有 "<!--"，无法安全内联');
  if (!html.includes(SCRIPT_TAG)) {
    fail(`index.html 里找不到 ${SCRIPT_TAG}，源码结构可能已改动`);
  }

  let out = html.replace(
    SCRIPT_TAG,
    `<script>\n${js.replace(/\n?$/, '\n')}</script>`
  );

  // favicon：浏览器默认会去请求 /favicon.ico，没有就报 404。
  // 把仓库里现成的图标放进站点并在产物 head 里挂上，消掉这条噪音。
  const iconSrc = join(ROOT, 'public', 'icon.png');
  let hasIcon = false;
  if (existsSync(iconSrc)) {
    if (!out.includes('rel="icon"')) {
      out = out.replace(
        '</head>',
        `    <link rel="icon" type="image/png" href="icon.png">\n</head>`
      );
    }
    hasIcon = true;
  } else {
    console.warn('⚠ 未找到 public/icon.png，产物将没有 favicon');
  }

  for (const marker of REQUIRED_MARKERS) {
    if (!out.includes(marker)) fail(`产物缺少关键标记：${marker}`);
  }
  if (out.includes('src="game.js"')) fail('产物仍然引用外部 game.js');

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_HTML, out, 'utf8');
  if (hasIcon) await copyFile(iconSrc, join(OUT_DIR, 'icon.png'));

  // Pages 走 Jekyll 会吞掉下划线开头的文件；.nojekyll 直接关掉这一层。
  await writeFile(join(OUT_DIR, '.nojekyll'), '', 'utf8');
  await writeFile(
    join(OUT_DIR, 'build.txt'),
    `tank-game single-file build\ncommit=${process.env.GITHUB_SHA || 'local'}\n`,
    'utf8'
  );

  const bytes = Buffer.byteLength(out, 'utf8');
  if (bytes < 80_000) fail(`产物过小（${bytes} 字节），内联可能失败`);
  const sha = createHash('sha256').update(out).digest('hex').slice(0, 12);
  console.log(`✓ site/index.html  ${(bytes / 1024).toFixed(1)} KB  sha256:${sha}`);
  console.log(`  favicon: ${hasIcon ? 'public/icon.png → site/icon.png' : '无'}`);
}

main().catch((e) => fail(e.stack || String(e)));
