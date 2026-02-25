import type { VercelRequest, VercelResponse } from '@vercel/node';

// 在 Serverless 环境里无法长期持久化，只做简单演示：
// 实际使用建议把 subscription 存到数据库（KV / Redis / Supabase 等）
let latestSubscription: any = null;

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  latestSubscription = req.body;
  console.log('[api/save-subscription] 收到新的 subscription:');
  console.log(JSON.stringify(latestSubscription, null, 2));

  res.status(200).json({ ok: true });
}


