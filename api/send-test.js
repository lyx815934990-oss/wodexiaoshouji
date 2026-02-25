// api/send-test.js
// Vercel Node 无服务器环境下的 CommonJS 处理函数

const store = require('./subscription-store');
const webPush = require('web-push');

// VAPID 密钥：未在环境变量中配置时使用默认值（仅用于测试）
const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BJOFT35nXTBG6xil5t5kPLOnyZvlGomKDST5TVTtP2WqQOE3xqj8vSmsUdOqNXq4czdKsJcAINr6mL12C5VyVIc';
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'woGBoyu0X0EDx1nFyWMhR6HcImIyFqtVJbpCWlX8H68';

webPush.setVapidDetails('mailto:test@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

module.exports = async function handler(req, res) {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 允许通过 POST /api/send-test 时在 body.subscription 里直接传 subscription
  if (req.method === 'POST' && req.body && req.body.subscription) {
    store.setLatest(req.body.subscription);
  }

  const latestSubscription = store.getLatest();

  if (!latestSubscription) {
    res.status(400).json({
      error: '还没有任何订阅，请先在前端点击“通知”按钮开启，或在 body 里携带 subscription。'
    });
    return;
  }

  const payload = JSON.stringify({
    title: '小手机测试推送',
    body: '这是一条来自 Vercel 后端的系统消息~',
    url: '/'
  });

  try {
    await webPush.sendNotification(latestSubscription, payload);
    console.log('[api/send-test] 测试推送已发送');
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/send-test] 发送推送失败:', err);
    res.status(500).json({ error: '发送推送失败', detail: String(err) });
  }
};


