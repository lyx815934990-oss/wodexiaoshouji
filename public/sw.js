/* Web Push：接收服务端推送并显示系统通知（PWA / 支持 Push 的浏览器） */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      try {
        const t = event.data.text();
        payload = t ? { body: t } : {};
      } catch {
        payload = {};
      }
    }
  }

  // 强制双行规则：
  // title = 备注名(remark) 优先，否则昵称(nickname)
  // body  = 纯消息正文(messageContent)
  const remark = typeof payload.remark === 'string' ? payload.remark.trim() : '';
  const nickname = typeof payload.nickname === 'string' ? payload.nickname.trim() : '';
  const title = remark || nickname || '联系人';
  const messageContent = typeof payload.messageContent === 'string' ? payload.messageContent.trim() : '';
  const body = messageContent || '你有一条新消息';
  const icon =
    typeof payload.icon === 'string'
      ? payload.icon
      : // GitHub Pages 常见是子路径部署（例如 /wodexiaoshouji/）：绝对路径 /image/... 可能 404
        new URL('image/主屏幕图标.png', self.location.href).href;

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const hasVisibleClient = clients.some((client) => client.visibilityState === 'visible');
      if (hasVisibleClient) {
        for (const client of clients) {
          client.postMessage({
            type: 'lumi:push-received-foreground',
            data: payload.data && typeof payload.data === 'object' ? payload.data : {},
          });
        }
        return;
      }
      await self.registration.showNotification(title, {
        body,
        icon,
        badge: icon,
        tag: typeof payload.tag === 'string' ? payload.tag : 'lumi-default',
        data: payload.data && typeof payload.data === 'object' ? payload.data : {},
      });
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification?.data && typeof event.notification.data === 'object' ? event.notification.data : {};
  const chatId = typeof data.chatId === 'string' ? data.chatId : '';
  const targetUrl = new URL('./', self.location.href);
  targetUrl.searchParams.set('openApp', 'ai');
  if (chatId) targetUrl.searchParams.set('pushChatId', chatId);
  const url = targetUrl.href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'lumi:open-chat-from-push', chatId: chatId || null });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
