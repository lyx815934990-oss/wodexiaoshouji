// 浏览器 Web Push 客户端工具
// - 负责注册 Service Worker
// - 订阅 / 取消订阅推送
// - 把 subscription 发给后端（push-server 或部署在 Vercel 的 API）

const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BJOFT35nXTBG6xil5t5kPLOnyZvlGomKDST5TVTtP2WqQOE3xqj8vSmsUdOqNXq4czdKsJcAINr6mL12C5VyVIc';

// 后端推送服务地址：
// - 本地开发：默认 http://localhost:4000（使用 push-server.js）
// - 线上：默认直接使用 Vercel 后端域名（你现在的项目：wodexiaoshouji.vercel.app）
//   如需改成自己的域名，可以在 .env 中设置 VITE_PUSH_SERVER_BASE_URL
const PUSH_SERVER_BASE_URL =
  import.meta.env.VITE_PUSH_SERVER_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:4000' : 'https://wodexiaoshouji.vercel.app');

const STORAGE_KEY_ENABLED = 'mini-ai-phone.push-enabled';

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const isPushSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPushSupported()) return null;

  try {
    const swPath = `${import.meta.env.BASE_URL || '/'}sw.js`;
    const registration = await navigator.serviceWorker.register(swPath);
    return registration;
  } catch (err) {
    console.error('[pushClient] 注册 Service Worker 失败:', err);
    return null;
  }
};

export const getCurrentSubscription = async (): Promise<PushSubscription | null> => {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
};

export const checkPushEnabled = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription) return false;
    if (Notification.permission !== 'granted') return false;
    return true;
  } catch {
    return false;
  }
};

type ToggleResult = {
  ok: boolean;
  message: string;
};

export const enablePush = async (): Promise<ToggleResult> => {
  if (!isPushSupported()) {
    return { ok: false, message: '当前浏览器不支持系统级通知或 Web Push。请用最新版 Chrome / Edge / Safari 测试。' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, message: '你没有允许通知权限，无法开启后台推送。' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // 某些 TypeScript DOM 类型定义比较老，这里做一次兼容性断言
        applicationServerKey: appServerKey as unknown as ArrayBuffer
      });
    }

    await fetch(`${PUSH_SERVER_BASE_URL}/api/save-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    });

    window.localStorage.setItem(STORAGE_KEY_ENABLED, '1');

    return { ok: true, message: '已开启后台推送。记得在浏览器和系统里都允许通知。' };
  } catch (err) {
    console.error('[pushClient] 开启推送失败:', err);
    return { ok: false, message: '开启推送失败，请稍后重试或检查控制台错误。' };
  }
};

export const disablePush = async (): Promise<ToggleResult> => {
  if (!isPushSupported()) {
    return { ok: false, message: '当前浏览器不支持 Web Push。' };
  }

  try {
    const subscription = await getCurrentSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    window.localStorage.setItem(STORAGE_KEY_ENABLED, '0');
    return { ok: true, message: '已关闭后台推送。' };
  } catch (err) {
    console.error('[pushClient] 关闭推送失败:', err);
    return { ok: false, message: '关闭推送失败，请稍后重试。' };
  }
};

export const loadPushEnabledFromStorage = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY_ENABLED) === '1';
};

// 从当前设备直接触发一条测试推送（主要用于手机端自测）
export const testPushFromThisDevice = async (): Promise<ToggleResult> => {
  if (!isPushSupported()) {
    return { ok: false, message: '当前浏览器不支持 Web Push，无法测试推送。' };
  }

  // 确保已经有订阅，没有则先尝试开启
  const alreadyEnabled = await checkPushEnabled();
  if (!alreadyEnabled) {
    const r = await enablePush();
    if (!r.ok) return r;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return { ok: false, message: '未获取到订阅，请确认已开启「后台推送消息」。' };
    }

    await fetch(`${PUSH_SERVER_BASE_URL}/api/send-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subscription })
    });

    return { ok: true, message: '已向本设备发送一条测试通知，请查看系统通知栏。' };
  } catch (err) {
    console.error('[pushClient] 本设备测试推送失败:', err);
    return { ok: false, message: '测试推送失败，请稍后重试。' };
  }
};


