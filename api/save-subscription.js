// api/save-subscription.js
// Vercel Node 无服务器环境下的 CommonJS 处理函数

const store = require('./subscription-store');

module.exports = function handler(req, res) {
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


