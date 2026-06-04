# wxdh — dist 分支（自动构建 & 部署）

本项目采用 **双分支部署模型**：`main` 分支保存源代码 & 修改历史，`dist` 分支由 **CI 自动构建**并部署到 **GitHub Pages**。

## 部署架构

```
main 分支（源码）                    dist 分支（构建产物）
    │                                    │
    ├── index.html                        ├── index.html          ← 首页（构建后直接位于根目录）
    ├── static/                           ├── static/             ← 构建产物（CSS/JS/Images）
    │   ├── css/                          │   ├── css/
    │   ├── js/                           │   ├── js/
    │   └── images/                       │   └── images/
    │                                    ├── favicon.ico
    └── ...                              ├── dist/
                                         │   ├── latest.txt      ← 记录最新归档目录名
                                         │   └── 0.0.3-20260605-abc1234/  ← 归档历史版本
                                         ├── builder.lock        ← 已部署版本记录
                                         ├── webpack.config.js   ← webpack 打包配置
                                         ├── build.js            ← 自动构建脚本
                                         └── package.json        ← 构建依赖
```

## 构建后目录结构

每次 `webpack` 构建完成后，`dist/latest/` 的内容会**移动到根目录**，`dist/latest/` 目录被删除：

```
构建前：dist/latest/index.html, dist/latest/static/...
构建后：index.html（覆盖）, static/（覆盖）, favicon.ico（覆盖）
```

## 自动构建流程（GitHub Actions）

当 `main` 分支创建新 Release 或 `builder.lock` 更新时：

1. **读取目标版本** — 从 `builder.lock` 对比已构建版本与最新 Release
2. **拉取源码** — 从 [GitHub Releases](https://github.com/aspnmy/wxdh.aspnmy.github.io/releases) 下载源码到 `src/`
3. **webpack 打包** — 压缩 JS/CSS，输出到 `dist/latest/`
4. **移动到根目录** — 将 `dist/latest/` 内容移动到仓库根目录，删除 `dist/latest/`
5. **版本归档** — 同步拷贝到 `dist/{version}-{timestamp}-{githash}/`
6. **清理源码** — 删除 `src/` 中的源代码（仅保留 `.source-version`）
7. **提交 & 推送** — 将根目录产物 + `dist/` 归档提交回 `dist` 分支
8. **GitHub Pages 自动部署** — 从根目录直接部署

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
npm install
npm run build           # 完整构建
npm run build:skipfetch  # 跳过拉取源码，仅用已有 src/ 构建
```

## 目录说明

| 文件/目录 | 作用 | 是否提交 |
|-----------|------|----------|
| `index.html` | 首页（构建后自动更新，title 含版本号） | 是 |
| `static/` | 构建产物（CSS/JS/Images） | 是 |
| `favicon.ico` | 网站图标 | 是 |
| `dist/0.0.3-.../` | 归档的历史版本 | 是 |
| `dist/latest.txt` | 记录最新归档目录名 | 是 |
| `builder.lock` | 已构建版本记录 | 是 |
| `webpack.config.js` | webpack 打包配置 | 是 |
| `build.js` | 自动构建脚本 | 是 |
| `package.json` | 构建依赖声明 | 是 |
| `src/` | 源码（构建时从 Release 拉取） | **否**（gitignore） |
| `node_modules/` | npm 依赖 | **否**（gitignore） |

## 关联仓库

- GitHub Pages: [https://wxdh.earth-online.org/](https://wxdh.earth-online.org/)
- 源码与 Release: [aspnmy/wxdh.aspnmy.github.io](https://github.com/aspnmy/wxdh.aspnmy.github.io)
- 原始项目: [码云 — lifeixue/weixin-chat](https://gitee.com/lifeixue/weixin-chat)