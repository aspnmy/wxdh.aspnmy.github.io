# 对话生成器

在线微信聊天对话制作工具，可模拟微信聊天界面，支持文字、图片、语音、红包、转账等多种消息类型，适合娱乐搞笑、微商素材制作等场景。



## 修复了原始版本的各种BUG。在线演示

- GitHub Pages: http://wxdh.earth-online.org/

## 功能特性

- **外观设置**：手机信号、WiFi/3G/4G/5G、电量、充电状态、听筒模式、聊天标题、聊天背景等
- **对话类型**：文字消息、图片消息、语音消息（支持已读/未读）、红包、转账
- **多用户管理**：支持添加/删除用户，自定义头像和昵称
- **截图导出**：一键生成高清聊天截图（基于 html2canvas）
- **GIF 录制**：录制聊天记录滚动过程，导出为 GIF 动图
- **视频录制**：录制聊天记录滚动过程，导出为视频
- **离线存储**：聊天数据本地持久化（基于 localforage）
- **使用教程**：内置视频演示教程

## 技术栈

- 前端框架：Vue.js
- UI 组件：ZUI
- 截图：html2canvas
- GIF 生成：gif.js
- 离线存储：localforage
- 纯静态页面，无需后端

## 项目结构

```
wxdh/
├── index.html                    # 主页面
├── static/app/
│   ├── css/
│   │   ├── app.css               # 应用样式
│   │   └── zui.min.css           # ZUI UI 框架
│   ├── js/
│   │   ├── common.bundle.js      # 公共依赖（Vue 等）
│   │   ├── chat.bundle.js        # 聊天核心逻辑
│   │   ├── html2canvas.min.js    # 截图库
│   │   ├── localforage.min.js    # 离线存储库
│   │   ├── gif.js                # GIF 生成库
│   │   └── gif.worker.js         # GIF Worker
│   ├── images/
│   │   ├── bar/                  # 状态栏图标
│   │   ├── chat_face/            # 默认头像
│   │   ├── tech/tech.mp4         # 使用教程视频
│   │   └── ...                   # 其他 UI 图片
│   └── fonts/                    # 字体文件
```

## 部署方式

本项目为纯静态页面，部署方式灵活：

1. **GitHub Pages**：Fork 本仓库，在 Settings → Pages 中启用
2. **Web 服务器**：将整个项目目录上传到 Nginx/Apache 等静态服务器
3. **虚拟主机**：直接上传到虚拟主机根目录

> 注意：源码未适配二级目录，建议部署在网站根目录。

## 本地开发

直接使用浏览器打开 `index.html` 即可。部分功能（如截图）需要 HTTP 服务，建议使用 Live Server 或 `python -m http.server`。

## 资源缓存管理

所有 CSS/JS 资源引用使用 `?v=日期` 时间戳进行版本管理，更新资源后修改 `index.html` 中的版本号即可强制刷新浏览器缓存。

## 开源协议

MIT License

## 源码来源

来自 [码云](https://gitee.com/lifeixue/weixin-chat)，原作者：追风少年。

## 免责声明

本工具仅用于娱乐用途，请勿用于非法途径。由此产生任何纠纷由使用者自行承担。