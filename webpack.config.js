const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

// 从源码中读取版本号
let version = '0.0.3';
try {
  const htmlContent = fs.readFileSync('./src/index.html', 'utf8');
  const verMatch = htmlContent.match(/var version\s*=\s*'([^']+)'/);
  if (verMatch) version = verMatch[1];
} catch (e) { /* src/ 可能已被清理，使用默认值 */ }

// 生成时间戳：YYYYMMDDHHmmss
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

// 获取 git 短哈希
const { execSync } = require('child_process');
let gitHash = '';
try {
  gitHash = execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' }).trim();
} catch (e) {
  gitHash = '0000000';
}

const dirName = `${version}-${dateStr}-${gitHash}`;
const buildDir = path.resolve(__dirname, 'dist', 'latest');
const archiveDir = path.resolve(__dirname, 'dist', dirName);

fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(archiveDir, { recursive: true });

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = {
  mode: 'production',
  target: 'web',
  entry: path.resolve(__dirname, 'src/dummy.js'),
  output: {
    path: buildDir,
    filename: '__placeholder__.js',
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: false,
      minify: {
        removeComments: false,
        collapseWhitespace: true,
        removeAttributeQuotes: false,
        removeRedundantAttributes: false,
      },
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/static',
          to: 'static',
          noErrorOnMissing: true,
          transform(content, filePath) {
            if (filePath.endsWith('.js') && !filePath.includes('.min.')) {
              return require('terser').minify(content.toString(), {
                compress: { drop_console: false },
                format: { comments: false },
              }).then(result => result.code || content.toString());
            }
            return content;
          },
        },
        { from: 'src/favicon.ico', to: 'favicon.ico', noErrorOnMissing: true },
        { from: 'src/CNAME', to: 'CNAME', noErrorOnMissing: true },
      ],
    }),
    {
      apply(compiler) {
        compiler.hooks.done.tap('PostBuildCleanup', () => {
          const placeholder = path.resolve(buildDir, '__placeholder__.js');
          if (fs.existsSync(placeholder)) fs.unlinkSync(placeholder);
          copyDir(buildDir, archiveDir);

          // 修复 dist/latest/index.html 中的绝对路径为相对路径
          const builtIndex = path.resolve(buildDir, 'index.html');
          if (fs.existsSync(builtIndex)) {
            let html = fs.readFileSync(builtIndex, 'utf8');
            // 修复 src="/xxx" → src="xxx"
            html = html.replace(/(src|href)="\/(static\/)/g, '$1="$2');
            // 修复 url(/xxx) → url(xxx)
            html = html.replace(/url\(\/(static\/)/g, 'url($1');
            fs.writeFileSync(builtIndex, html);
          }

          // 更新根目录 index.html 的 title 标签，追加版本号
          const rootIndex = path.resolve(__dirname, 'index.html');
          if (fs.existsSync(rootIndex)) {
            const rootHtml = fs.readFileSync(rootIndex, 'utf8');
            const updatedHtml = rootHtml.replace(
              /<title>.*?<\/title>/,
              `<title>微信对话生成器 — v${dirName}</title>`
            );
            fs.writeFileSync(rootIndex, updatedHtml);
          }

          // 写入 latest.txt 记录最新版本
          const latestFile = path.resolve(__dirname, 'dist', 'latest.txt');
          fs.writeFileSync(latestFile, dirName);
        });
      },
    },
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({ test: /\.js(\?.*)?$/i, extractComments: false }),
      new CssMinimizerPlugin(),
    ],
  },
  devtool: false,
};