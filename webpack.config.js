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
          const rootDir = path.resolve(__dirname);
          const placeholder = path.resolve(buildDir, '__placeholder__.js');
          if (fs.existsSync(placeholder)) fs.unlinkSync(placeholder);

          // 1. 归档到 dist/{版本号}/ 目录
          copyDir(buildDir, archiveDir);

          // 2. 修复 HTML 中的绝对路径
          const builtIndex = path.resolve(buildDir, 'index.html');
          if (fs.existsSync(builtIndex)) {
            let html = fs.readFileSync(builtIndex, 'utf8');
            html = html.replace(/(src|href)="\/(static\/)/g, '$1="$2');
            html = html.replace(/url\(\/(static\/)/g, 'url($1');
            // 更新 title 为带版本号的格式
            html = html.replace(/<title>.*?<\/title>/, `<title>微信对话生成器 — ${dirName}</title>`);
            fs.writeFileSync(builtIndex, html);
          }

          // 3. 将 dist/latest/ 内容移动到根目录
          for (const entry of fs.readdirSync(buildDir, { withFileTypes: true })) {
            const srcPath = path.join(buildDir, entry.name);
            const destPath = path.join(rootDir, entry.name);
            if (entry.isDirectory()) {
              if (fs.existsSync(destPath)) fs.rmSync(destPath, { recursive: true, force: true });
              copyDir(srcPath, destPath);
            } else {
              fs.copyFileSync(srcPath, destPath);
            }
          }

          // 4. 删除 dist/latest/ 目录
          fs.rmSync(buildDir, { recursive: true, force: true });

          // 5. 写入 latest.txt
          const latestFile = path.resolve(rootDir, 'dist', 'latest.txt');
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