// api/save-subscription.js
// Vercel Node 无服务器环境下的 CommonJS 处理函数

const store = require('./subscription-store');

module.exports = function handler(req, res) {
  // 基本 CORS 处理：允许前端（GitHub Pages / PWA）跨域调用
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 预检请求直接返回 200
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const sub = req.body;
  store.setLatest(sub);

  console.log('[api/save-subscription] 收到新的 subscription:');
  try {
    console.log(JSON.stringify(sub, null, 2));
  } catch {
    console.log(sub);
  }

  res.status(200).json({ ok: true });
};


