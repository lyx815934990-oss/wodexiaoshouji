const CACHE_NAME = 'mini-ai-phone-cache-v1';
// 注意：这里的路径会在构建后自动带上 base(/wodexiaoshouji/)，
// 因为 sw.js 会被放在该子路径下的根目录。
const CORE_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// 简单缓存优先策略，让 PWA 离线时还能打开壳子
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 只处理 GET
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        return response;
      }).catch(() => cached);
    })
  );
});

// 后台推送（需要你自己的服务器配合 Web Push 才能真正收到）
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data && event.data.text() };
  }

  const title = data.title || 'Mini AI Phone';
  const body = data.body || '你有一条新的系统消息';

  const options = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url || '/'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});


