// api/push.js - Vercel Serverless 函数，用于发送 Web Push 通知

const webPush = require('web-push');

// 从环境变量读取 VAPID 密钥（推荐在 Vercel 后台配置）
const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BJOFT35nXTBG6xil5t5kPLOnyZvlGomKDST5TVTtP2WqQOE3xqj8vSmsUdOqNXq4czdKsJcAINr6mL12C5VyVIc';
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'woGBoyu0X0EDx1nFyWMhR6HcImIyFqtVJbpCWlX8H68';

webPush.setVapidDetails('mailto:test@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { subscription, title, body, url } = req.body || {};

    if (!subscription) {
      res.status(400).json({ error: 'Missing subscription' });
      return;
    }

    const payload = JSON.stringify({
      title: title || '小手机系统通知',
      body: body || '这是来自小手机的系统级消息~',
      url: url || '/'
    });

    await webPush.sendNotification(subscription, payload);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/push] 发送推送失败:', err);
    res.status(500).json({ error: 'Failed to send push', detail: String(err) });
  }
};


