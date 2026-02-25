// 简易 Web Push Service Worker
// 负责在收到推送时展示系统通知，并在点击时打开页面

/* eslint-disable no-restricted-globals */

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    // 如果不是 JSON，就当成纯文本
    payload = { title: '小手机通知', body: event.data.text() };
  }

  const { title, body, url, icon } = /** @type {{title?: string; body?: string; url?: string; icon?: string}} */ (
    payload
  );

  const notificationTitle = title || '小手机通知';
  const notificationOptions = {
    body: body || '',
    icon: icon || '/favicon.ico',
    data: {
      url: url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 如果已经有一个标签页打开了，就复用它
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && client.url && !client.url.endsWith(url)) {
            client.navigate(url);
          }
          return;
        }
      }
      // 否则新开一个
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
      return undefined;
    })
  );
});


