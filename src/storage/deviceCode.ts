import { appStorage } from './appStorage';

const STORAGE_KEY_DEVICE_CODE = 'mini-ai-phone.device-code';

/** 同页内设备码写入后通知（storage 事件不跨同源同页触发） */
export const DEVICE_CODE_CHANGED_EVENT = 'mini-ai-phone-device-code-changed';

function notifyDeviceCodeChanged(): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(DEVICE_CODE_CHANGED_EVENT));
    }
  } catch {
    // ignore
  }
}

function generateDeviceCode(): string {
  try {
    const c = (globalThis as any)?.crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  } catch {
    // ignore
  }
  return `d-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** 仅读取本浏览器已保存的设备码；不自动生成（激活页需先在服务端「生成」或「导入」） */
export function getStoredDeviceCode(): string | null {
  try {
    const ls = globalThis?.localStorage?.getItem(STORAGE_KEY_DEVICE_CODE);
    if (ls && ls.trim()) return ls.trim();
  } catch {
    // ignore
  }
  try {
    const v = appStorage.getItem(STORAGE_KEY_DEVICE_CODE);
    if (v && v.trim()) return v.trim();
  } catch {
    // ignore
  }
  return null;
}

export function clearStoredDeviceCode(): void {
  try {
    appStorage.removeItem(STORAGE_KEY_DEVICE_CODE);
  } catch {
    // ignore
  }
  try {
    globalThis?.localStorage?.removeItem(STORAGE_KEY_DEVICE_CODE);
  } catch {
    // ignore
  }
  notifyDeviceCodeChanged();
}

/** 写入本地存储（在服务端登记成功后调用） */
export function setPersistedDeviceCode(value: string): void {
  const v = String(value || '').trim();
  if (!v) return;
  try {
    appStorage.setItem(STORAGE_KEY_DEVICE_CODE, v);
  } catch {
    // ignore
  }
  try {
    globalThis?.localStorage?.setItem(STORAGE_KEY_DEVICE_CODE, v);
  } catch {
    // ignore
  }
  notifyDeviceCodeChanged();
}

const DEVICE_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{6,199}$/;

/** 校验格式（与 activation-server 一致） */
export function validateDeviceCodeInput(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const trim = String(raw || '').trim();
  if (!trim) return { ok: false, error: '设备码不能为空' };
  if (trim.length > 200) return { ok: false, error: '设备码过长' };
  if (!DEVICE_CODE_PATTERN.test(trim)) {
    return { ok: false, error: '格式无效：请粘贴完整设备码（仅字母、数字、点、下划线、连字符）' };
  }
  return { ok: true, value: trim };
}

/**
 * 非激活模块（如推送）在无已登记设备码时的兜底 ID，避免阻塞页面。
 * 激活流程请使用服务端登记后的设备码。
 */
export function getOrCreateDeviceCode(): string {
  const x = getStoredDeviceCode();
  if (x) return x;
  const next = generateDeviceCode();
  setPersistedDeviceCode(next);
  return next;
}
