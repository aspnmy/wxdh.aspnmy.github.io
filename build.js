/**
 * build.js
 * builder.lock 记录上次成功构建的 release_id，与最新 release 一致时跳过
 * 流程：查询 latest → 对比 lock → 需要则拉取源码 → webpack 打包 → 清理 → 写入 lock
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { execSync } = require('child_process');

const RELEASES_URL = 'https://api.github.com/repos/aspnmy/wxdh.aspnmy.github.io/releases';
const SRC_DIR = path.resolve(__dirname, 'src');
const VERSION_FILE = path.resolve(SRC_DIR, '.source-version');
const LOCK_FILE = path.resolve(__dirname, 'builder.lock');

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

function download(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const chunks = [];
    const options = {
      headers: { 'User-Agent': 'wxdh-build' },
      rejectUnauthorized: process.env.WXDH_INSECURE_TLS === '1' ? false : true,
    };
    const req = proto.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return resolve(download(res.headers.location));
      if (res.statusCode !== 200)
        return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Download timeout')); });
  });
}

function removeDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

// 读取 builder.lock：上次构建的 release_id + force 指令
function readLockState() {
  if (!fs.existsSync(LOCK_FILE)) return { id: null, force: false };
  const content = fs.readFileSync(LOCK_FILE, 'utf8').trim();
  if (!content) return { id: null, force: false };
  const idMatch = content.match(/^release_id=(\d+)/m);
  const forceMatch = content.match(/^force=true/m);
  return {
    id: idMatch ? parseInt(idMatch[1], 10) : null,
    force: !!forceMatch,
  };
}

// 写入 builder.lock
function writeLock(release) {
  fs.writeFileSync(LOCK_FILE, [
    `release_id=${release.id}`,
    `tag=${release.tag_name}`,
    `built=${new Date().toISOString()}`,
  ].join('\n'));
}

// 查询最新 release，与 builder.lock 对比决定是否需要构建
async function getTargetRelease() {
  console.log('[build] 查询 GitHub 最新 release...');
  const latestJson = await download(`${RELEASES_URL}/latest`);
  const latest = JSON.parse(latestJson.toString());
  console.log(`[build] 最新 Release: ${latest.tag_name}  release_id=${latest.id}`);

  const lock = readLockState();
  const force = lock.force || process.argv.includes('--force');

  if (lock.id === null) {
    // builder.lock 不存在 → 必须构建
    console.log('[build] builder.lock 不存在，开始构建');
    return { skipped: false, release: latest };
  }

  if (lock.id === latest.id && !force) {
    // 已构建版本与最新一致 → 跳过
    console.log(`[build] builder.lock (release_id=${lock.id}) 与最新一致，跳过构建`);
    return { skipped: true, release: latest };
  }

  if (force) {
    console.log('[build] 强制重新构建 (builder.lock force=true 或 --force)');
  } else {
    console.log(`[build] builder.lock (release_id=${lock.id}) ≠ 最新 (${latest.id})，开始构建`);
  }

  return { skipped: false, release: latest };
}

// ---------------------------------------------------------------------------
// 构建步骤
// ---------------------------------------------------------------------------

async function fetchSource(release) {
  console.log(`[build] 下载源码包: ${release.zipball_url}`);
  const zipBuffer = await download(release.zipball_url);
  console.log('[build] 下载完成，解压到 src/ ...');

  removeDir(SRC_DIR);
  fs.mkdirSync(SRC_DIR, { recursive: true });

  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const rootDir = entries[0].entryName.split('/')[0];

  entries.forEach((entry) => {
    const relativePath = entry.entryName.slice(rootDir.length + 1);
    if (!relativePath) return;
    const outPath = path.join(SRC_DIR, relativePath);
    if (entry.isDirectory) {
      fs.mkdirSync(outPath, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, entry.getData());
    }
  });

  // 写入 src 内的版本信息
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  fs.writeFileSync(VERSION_FILE, [
    `tag=${release.tag_name}`,
    `commitish=${release.target_commitish}`,
    `id=${release.id}`,
    `fetched=${dateStr}`,
    `html_url=${release.html_url}`,
    `zipball_url=${release.zipball_url}`,
  ].join('\n'));
  console.log('[build] 源码拉取完成');
}

function cleanSource() {
  if (!fs.existsSync(SRC_DIR)) return;
  const keepFile = '.source-version';
  for (const entry of fs.readdirSync(SRC_DIR)) {
    if (entry === keepFile) continue;
    fs.rmSync(path.join(SRC_DIR, entry), { recursive: true, force: true });
  }
  console.log('[build] src/ 目录已清理（保留 .source-version）');
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

async function main() {
  const command = process.argv[2] || 'build';

  if (command === 'clean') {
    cleanSource();
    return;
  }

  // === 完整构建流程 ===
  const skipFetch = process.argv.includes('--skip-fetch');
  let release = null;

  if (!skipFetch) {
    const result = await getTargetRelease();
    if (result.skipped) return; // builder.lock 匹配，跳过
    release = result.release;
    await fetchSource(release);
  }

  console.log('[build] 执行 webpack 构建...');
  try {
    execSync('npx webpack --config webpack.config.js', { stdio: 'inherit', cwd: __dirname });
    console.log('[build] webpack 构建成功');
  } catch (e) {
    console.error('[build] webpack 构建失败');
    process.exit(1);
  }

  console.log('[build] 清理源代码...');
  cleanSource();

  // 成功构建后写入 builder.lock
  if (release) {
    writeLock(release);
    console.log(`[build] builder.lock 已更新: release_id=${release.id}  tag=${release.tag_name}`);
  }

  console.log('[build] 构建流程完成！');
}

main().catch((err) => {
  console.error('[build] 错误:', err.message);
  process.exit(1);
});