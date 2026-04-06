"# wodexiaoshouji" 

## 本地 Web Push 测试（同 WiFi 手机预览）

1. 在项目根目录 `.env` 中配置：
   - `VITE_VAPID_PUBLIC_KEY=你的公钥`
   - `VAPID_PRIVATE_KEY=你的私钥`
   - `VAPID_SUBJECT=mailto:you@example.com`（可选）
2. 安装依赖（含 HTTPS 插件）：`npm install`
3. 启动前端：`npm run dev -- --host`（开发服务器为 **HTTPS**，地址形如 `https://电脑局域网IP:5173`）
4. 启动推送服务（另开终端）：`npm run push:server`（监听 `8787`，由 Vite **代理** `/api/push`，无需手机直连 8787）
5. 手机与电脑同一 WiFi，用 Safari 打开 **`https://电脑局域网IP:5173`**（注意是 **https**）
   - 首次会提示证书不受信任：点「显示详细信息」→「访问此网站」之类选项继续（开发自签证书属正常）
   - 再按 iOS 要求：**分享 → 添加到主屏幕** → 从桌面图标进入，再测 Web Push
6. 在“通知中心”中点击：
   - 订阅 Web Push
   - 上报到推送服务
   - 发送测试推送

说明：iOS Web Push 需要 iOS 16.4+、从「添加到主屏幕」启动的 PWA，且页面须为浏览器**安全上下文**（**HTTPS** 或 **localhost**）。本项目已用 `@vitejs/plugin-basic-ssl` 在开发环境启用 HTTPS；不要用 `http://192.168.x.x` 访问前端。正式上线请使用正规 HTTPS 域名与证书。
