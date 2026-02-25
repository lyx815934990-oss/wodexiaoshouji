import type { VercelRequest, VercelResponse } from '@vercel/node';
// 注意：Vercel 的 Node 运行时默认按 CommonJS 加载 .js 文件
// 这里使用 require 而不是 ES Module 的 import，避免 “Cannot use import statement outside a module”
// eslint-disable-next-line @typescript-eslint/no-var-requires
const webPush = require('web-push') as typeof import('web-push');

// 和 save-subscription 一样，这里只是 demo 级别的内存变量。
// 真正上线请改成数据库存储，并按用户维度区分。
let latestSubscription: any = null;

// 复用与 push-server.js 相同的环境变量名，便于迁移：
const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BJOFT35nXTBG6xil5t5kPLOnyZvlGomKDST5TVTtP2WqQOE3xqj8vSmsUdOqNXq4czdKsJcAINr6mL12C5VyVIc';
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'woGBoyu0X0EDx1nFyWMhR6HcImIyFqtVJbpCWlX8H68';

webPush.setVapidDetails('mailto:test@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST' && req.body && (req.body as any).subscription) {
    // 允许在同一个接口里同时更新 latestSubscription
    latestSubscription = (req.body as any).subscription;
  }

  if (!latestSubscription) {
    res
      .status(400)
      .json({ error: '还没有任何订阅，请先在前端点击“通知”按钮开启，或在 body 里携带 subscription。' });
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
}


