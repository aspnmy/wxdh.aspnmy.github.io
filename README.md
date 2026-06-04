# wxdh — dist 分支（自动构建 & 部署）

本项目采用 **双分支部署模型**：`main` 分支保存源代码 & 修改历史，`dist` 分支由 **CI 自动构建**并部署到 **GitHub Pages**。

## 部署架构

```
main 分支（源码）                    dist 分支（构建产物）
    │                                    │
    ├── index.html                        ├── index.html          ← iframe 入口，加载 dist/latest
    ├── static/                           ├── dist/
    │   ├── css/                          │   ├── latest/         ← 公共路径，始终指向最新构建
    │   ├── js/                           │   │   ├── index.html
    │   └── images/                       │   │   └── static/
    │                                    │   ├── latest.txt      ← 记录当前最新版本目录名
    └── ...                              │   └── 0.0.3-20260605-abc1234/  ← 归档历史版本
                                         ├── builder.lock        ← 本次构建的目标版本（指定 tag 或 release_id）
                                         ├── webpack.config.js   ← webpack 打包配置
                                         ├── build.js            ← 自动构建脚本
                                         └── package.json        ← 构建依赖
```

## 自动构建流程（GitHub Actions）

当 `main` 分支创建新 Release 或 `dist` 分支收到 push 时：

1. **读取目标版本** — 从 `builder.lock` 读取本次需要构建的版本（`tag=v0.0.3` 或 `release_id=...`）
2. **拉取源码** — 从 [GitHub Releases](https://github.com/aspnmy/wxdh.aspnmy.github.io/releases) 下载指定版本的源码到 `src/`
3. **webpack 打包** — 压缩 JS/CSS，输出到 `dist/latest/`
4. **版本归档** — 同步拷贝到 `dist/{version}-{timestamp}-{githash}/`
5. **清理源码** — 删除 `src/` 中的源代码（仅保留 `.source-version` 记录）
6. **提交 & 推送** — 将 `dist/` 等构建产物提交回 `dist` 分支
7. **GitHub Pages 自动部署** — Pages 设置为从 `dist` 分支根目录部署

## builder.lock 机制

```
release_id=334458445
tag=v0.0.3
built=2026-06-05T00:30:00.000Z
```

**每次构建成功后自动写入**，记录已构建的 `release_id` 和 `tag`。

- **builder.lock 不存在** → 必须构建，构建后写入 lock
- **builder.lock 的 `release_id` = 最新 Release** → 跳过构建（已是最新）
- **builder.lock 的 `release_id` ≠ 最新 Release** → 重新构建，更新 lock
- **`--force`** → 忽略 lock，强制重新构建

## 本地构建

```bash
# 安装依赖
npm install

# 完整构建（拉取最新 Release 源码 + webpack 打包）
npm run build

# 跳过拉取，仅用已有 src/ 构建
npm run build:skipfetch

# 仅在 GitHub Release 更新后重新构建（需要先手动更新 main 分支）
# CI 自动处理，本地无需操作
```

## 目录说明

| 文件/目录 | 作用 | 是否提交 |
|-----------|------|----------|
| `index.html` | 根入口，iframe 加载 `dist/latest/index.html` | 是 |
| `dist/latest/` | 最新构建产物（公共路径） | 是 |
| `dist/0.0.3-.../` | 归档的历史版本 | 是 |
| `dist/latest.txt` | 记录最新归档目录名 | 是 |
| `builder.lock` | 本次构建的目标版本 | 是 |
| `webpack.config.js` | webpack 打包配置 | 是 |
| `build.js` | 自动构建脚本 | 是 |
| `package.json` | 构建依赖声明 | 是 |
| `src/` | 源码（构建时从 Release 拉取） | **否**（gitignore） |
| `node_modules/` | npm 依赖 | **否**（gitignore） |

## 关联仓库

- GitHub Pages: [https://wxdh.earth-online.org/](https://wxdh.earth-online.org/)
- 源码与 Release: [aspnmy/wxdh.aspnmy.github.io](https://github.com/aspnmy/wxdh.aspnmy.github.io)
- 原始项目: [码云 — lifeixue/weixin-chat](https://gitee.com/lifeixue/weixin-chat)