// push-server.js
// 简易 Web Push 后端：保存订阅 & 发送测试通知

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const webPush = require('web-push');

const app = express();
// Render / Railway 等平台会注入 PORT 环境变量，本地开发时默认 4000
const PORT = process.env.PORT || 4000;

// 你生成的 VAPID 密钥（优先从环境变量读取，便于线上配置）
const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BJOFT35nXTBG6xil5t5kPLOnyZvlGomKDST5TVTtP2WqQOE3xqj8vSmsUdOqNXq4czdKsJcAINr6mL12C5VyVIc';
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'woGBoyu0X0EDx1nFyWMhR6HcImIyFqtVJbpCWlX8H68';

// 配置 web-push
webPush.setVapidDetails('mailto:test@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

app.use(cors());
app.use(bodyParser.json());

// 简单用内存保存最新的订阅（重启会丢，但够测试用）
let latestSubscription = null;

// 保存前端传来的 subscription
app.post('/api/save-subscription', (req, res) => {
  latestSubscription = req.body;
  console.log('[push-server] 收到新的 subscription:');
  console.log(JSON.stringify(latestSubscription, null, 2));
  res.json({ ok: true });
});

// 发送一条测试推送
app.post('/api/send-test', async (req, res) => {
  if (!latestSubscription) {
    return res.status(400).json({ error: '还没有任何订阅，请先在前端点击“通知”按钮开启。' });
  }

  const payload = JSON.stringify({
    title: '小手机测试推送',
    body: '这是一条来自本地 Node 服务的系统消息~',
    url: '/'
  });

  try {
    await webPush.sendNotification(latestSubscription, payload);
    console.log('[push-server] 测试推送已发送');
    res.json({ ok: true });
  } catch (err) {
    console.error('[push-server] 发送推送失败:', err);
    res.status(500).json({ error: '发送推送失败', detail: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`[push-server] 服务器已启动: http://localhost:${PORT}`);
});


