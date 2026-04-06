const fs = require('node:fs');
const fsp = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const webpush = require('web-push');

const HOST = process.env.PUSH_SERVER_HOST || '0.0.0.0';
/** Render / Railway / Heroku 等会注入 PORT；本地仍可用 PUSH_SERVER_PORT 或默认 8787 */
const PORT = Number(process.env.PORT || process.env.PUSH_SERVER_PORT || 8787);
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'push-subscriptions.json');

function parseDotEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const eq = trimmed.indexOf('=');
  if (eq <= 0) return null;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return [key, value];
}

function loadEnvFromFile(fileName) {
  const filePath = path.resolve(__dirname, fileName);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const pair = parseDotEnvLine(line);
    if (!pair) continue;
    const [k, v] = pair;
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvFromFile('.env');
loadEnvFromFile('.env.local');

const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('[push-server] Missing VAPID keys. Set VITE_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.');
  process.exit(1);
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function toJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(body);
}

function isValidSubscription(sub) {
  if (!sub || typeof sub !== 'object') return false;
  if (typeof sub.endpoint !== 'string' || !sub.endpoint.startsWith('https://')) return false;
  const keys = sub.keys;
  if (!keys || typeof keys !== 'object') return false;
  return typeof keys.p256dh === 'string' && typeof keys.auth === 'string';
}

async function readSubscriptions() {
  try {
    const raw = await fsp.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => v && typeof v.endpoint === 'string');
  } catch {
    return [];
  }
}

async function writeSubscriptions(rows) {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.writeFile(DATA_FILE, JSON.stringify(rows, null, 2), 'utf8');
}

async function readBodyJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function createPayload(remark, nickname, messageContent, tag, data) {
  const toSingleLine = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
  const safeRemark = toSingleLine(remark);
  const safeNickname = toSingleLine(nickname);
  const safeMessage = toSingleLine(messageContent);
  return JSON.stringify({
    remark: safeRemark || undefined,
    nickname: safeNickname || '联系人',
    messageContent: safeMessage || '你有一条新消息',
    tag: tag || 'lumi-test',
    data: {
      ts: Date.now(),
      ...(data && typeof data === 'object' ? data : {}),
    },
  });
}

async function sendToSubscription(subscription, payload) {
  await webpush.sendNotification(subscription, payload, { TTL: 60 });
}


const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    toJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    const list = await readSubscriptions();
    toJson(res, 200, { ok: true, subscriptions: list.length });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/push/subscribe') {
    try {
      const body = await readBodyJson(req);
      const subscription = body.subscription;
      if (!isValidSubscription(subscription)) {
        toJson(res, 400, { ok: false, error: 'Invalid subscription payload' });
        return;
      }
      const rows = await readSubscriptions();
      const now = new Date().toISOString();
      const next = rows.filter((r) => r.endpoint !== subscription.endpoint);
      next.push({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userId: typeof body.userId === 'string' ? body.userId : 'anonymous',
        platform: typeof body.platform === 'string' ? body.platform : 'unknown',
        createdAt: now,
        updatedAt: now,
      });
      await writeSubscriptions(next);
      toJson(res, 200, { ok: true, saved: true, total: next.length });
    } catch (error) {
      toJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'subscribe failed' });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/push/unsubscribe') {
    try {
      const body = await readBodyJson(req);
      const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';
      if (!endpoint) {
        toJson(res, 400, { ok: false, error: 'endpoint is required' });
        return;
      }
      const rows = await readSubscriptions();
      const next = rows.filter((r) => r.endpoint !== endpoint);
      await writeSubscriptions(next);
      toJson(res, 200, { ok: true, removed: rows.length - next.length, total: next.length });
    } catch (error) {
      toJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'unsubscribe failed' });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/push/send-test') {
    try {
      const body = await readBodyJson(req);
      const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';
      const rows = await readSubscriptions();
      const targets = endpoint ? rows.filter((r) => r.endpoint === endpoint) : rows;
      if (!targets.length) {
        toJson(res, 404, { ok: false, error: 'No subscription target found' });
        return;
      }

      const payload = createPayload(body.remark, body.nickname, body.messageContent, body.tag, undefined);
      let success = 0;
      const invalidEndpoints = [];
      for (const sub of targets) {
        try {
          await sendToSubscription(sub, payload);
          success += 1;
        } catch (err) {
          const statusCode = err && typeof err === 'object' ? err.statusCode : 0;
          if (statusCode === 404 || statusCode === 410) {
            invalidEndpoints.push(sub.endpoint);
          }
        }
      }

      if (invalidEndpoints.length > 0) {
        const kept = rows.filter((r) => !invalidEndpoints.includes(r.endpoint));
        await writeSubscriptions(kept);
      }

      toJson(res, 200, {
        ok: true,
        targeted: targets.length,
        success,
        invalidRemoved: invalidEndpoints.length,
      });
    } catch (error) {
      toJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'send failed' });
    }
    return;
  }

  // 业务触发推送：根据 userId（你这里就是设备码 deviceCode）把消息发给对应订阅
  if (req.method === 'POST' && req.url === '/api/push/notify') {
    try {
      const body = await readBodyJson(req);
      const userId = typeof body.userId === 'string' ? body.userId : '';
      const foreground = body.foreground === true;
      const chatId = typeof body.chatId === 'string' ? body.chatId : '';

      if (!userId) {
        toJson(res, 400, { ok: false, error: 'userId is required (deviceCode)' });
        return;
      }
      // 服务端兜底：只要前端声明当前在前台，就拒绝发系统推送
      if (foreground) {
        toJson(res, 200, { ok: true, skipped: 'foreground' });
        return;
      }
      const rows = await readSubscriptions();
      const targets = rows.filter((r) => r.userId === userId);
      if (!targets.length) {
        toJson(res, 404, { ok: false, error: 'No subscription target found for userId' });
        return;
      }

      const payload = createPayload(body.remark, body.nickname, body.messageContent, body.tag, body.data);
      let success = 0;
      const invalidEndpoints = [];
      for (const sub of targets) {
        try {
          await sendToSubscription(sub, payload);
          success += 1;
        } catch (err) {
          const statusCode = err && typeof err === 'object' ? err.statusCode : 0;
          if (statusCode === 404 || statusCode === 410) {
            invalidEndpoints.push(sub.endpoint);
          }
        }
      }

      if (invalidEndpoints.length > 0) {
        const kept = rows.filter((r) => !invalidEndpoints.includes(r.endpoint));
        await writeSubscriptions(kept);
      }

      toJson(res, 200, {
        ok: true,
        targeted: targets.length,
        success,
        invalidRemoved: invalidEndpoints.length,
      });
    } catch (error) {
      toJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'notify failed' });
    }
    return;
  }

  toJson(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`[push-server] listening on http://${HOST}:${PORT}`);
  console.log('[push-server] endpoints:');
  console.log('  GET  /health');
  console.log('  POST /api/push/subscribe');
  console.log('  POST /api/push/unsubscribe');
  console.log('  POST /api/push/send-test');
  console.log('  POST /api/push/notify');
});
