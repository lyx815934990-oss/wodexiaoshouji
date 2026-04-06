/**
 * PWA Web Push 客户端：注册 SW、订阅 Push（VAPID 公钥来自环境变量）。
 * 私钥仅用于后端发推送，切勿写入前端。
 */

// GitHub Pages 部署通常是子路径：/wodexiaoshouji/
// 如果用绝对路径 /sw.js 会指向站点根目录，导致 Service Worker 注册失败收不到推送。
const BASE_URL = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
const SW_SCRIPT = `${BASE_URL}sw.js`;

export function isPushEnvironmentOk(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  const local =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    /^192\.168\.\d+\.\d+$/.test(host) ||
    /^10\.\d+\.\d+\.\d+$/.test(host);
  return window.isSecureContext || local;
}

export function isWebPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** Web Push（尤其 iOS Safari）要求浏览器安全上下文：HTTPS 或 localhost；http://192.168.x.x 一般为 false */
export function isSecureContextForWebPush(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext;
}

/** iOS 上 Web Push 仅在「添加到主屏幕」后以独立 App 打开时可用，Safari 地址栏模式通常无 PushManager */
export function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  const nav = navigator as Navigator & { maxTouchPoints?: number; platform?: string };
  return nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1;
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  try {
    return window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}

export async function registerPushServiceWorkerDetailed(): Promise<{
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}> {
  if (!('serviceWorker' in navigator)) {
    return { registration: null, error: '当前浏览器不支持 Service Worker' };
  }
  try {
    // scope 也必须跟随 BASE_URL，确保在子路径下同样工作
    const registration = await navigator.serviceWorker.register(SW_SCRIPT, {
      scope: BASE_URL,
      updateViaCache: 'none',
    });
    return { registration, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { registration: null, error: msg };
  }
}

export function getVapidPublicKey(): string {
  const k = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  return (k && k.trim()) || '';
}

/** Web Push 标准：applicationServerKey 需为 Uint8Array */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  const { registration } = await registerPushServiceWorkerDetailed();
  return registration;
}

export async function getPushSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeWebPush(
  registration: ServiceWorkerRegistration,
  vapidPublicKeyBase64: string
): Promise<PushSubscription> {
  const key = urlBase64ToUint8Array(vapidPublicKeyBase64.trim());
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key,
  });
}

export async function unsubscribeWebPush(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return true;
  try {
    return await sub.unsubscribe();
  } catch {
    return false;
  }
}

export function subscriptionToJson(sub: PushSubscription): string {
  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  return JSON.stringify(json, null, 2);
}
