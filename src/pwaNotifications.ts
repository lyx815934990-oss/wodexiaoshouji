// Safari PWA / Chrome 等浏览器中初始化 Web Push 订阅的帮助函数
// 注意：真正发送推送需要你在服务端实现 Web Push（使用 VAPID 私钥）

// 使用你生成的 VAPID 公钥（只放公钥，私钥务必只保存在服务器端）
const VAPID_PUBLIC_KEY =
  'BJOFT35nXTBG6xil5t5kPLOnyZvlGomKDST5TVTtP2WqQOE3xqj8vSmsUdOqNXq4czdKsJcAINr6mL12C5VyVIc';

// 推送服务端地址：开发环境默认 http://localhost:4000，生产环境从 Vite 环境变量读取
const PUSH_SERVER_BASE_URL =
  import.meta.env.VITE_PUSH_SERVER_BASE_URL || 'http://localhost:4000';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  // 仅在 https / localhost 环境下注册，其他环境（如 natapp http、老浏览器）直接跳过
  const isSecureContext =
    window.isSecureContext ||
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (!isSecureContext) {
    console.log('当前环境不是安全上下文（https 或 localhost），跳过 service worker 注册');
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    console.log('当前浏览器不支持 service worker');
    return null;
  }

  try {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    const registration = await navigator.serviceWorker.register(swUrl);
    return registration;
  } catch (error) {
    console.error('注册 Service Worker 失败:', error);
    return null;
  }
}

export async function enablePushNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('当前浏览器暂不支持系统消息推送（Web Push）');
    return;
  }

  // 1. 先注册 Service Worker
  const registration = await registerServiceWorker();
  if (!registration) return;

  // 2. 申请通知权限（必须由用户点击触发这个函数）
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    alert('你没有授予通知权限，无法接收系统消息提醒');
    return;
  }

  // 3. 订阅 Web Push
  try {
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      return existingSub;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // 4. 把 subscription 发送给推送服务器，让服务器立即发一条测试通知
    await fetch(`${PUSH_SERVER_BASE_URL}/api/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription,
        title: '小手机系统通知已开启',
        body: '以后角色给你发消息时，我会通过系统通知提醒你~',
        url: '/'
      })
    });

    alert('系统消息提醒已开启');
    return subscription;
  } catch (error) {
    console.error('订阅 Web Push 失败:', error);
    alert('订阅系统消息提醒失败，请稍后重试');
    return null;
  }
}


