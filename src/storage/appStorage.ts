import { idbKvDel, idbKvGetAll, idbKvSet } from './appDb';

type StorageSubscriber = (key: string) => void;

const MIGRATED_FLAG_KEY = 'mini-ai-phone.__idb_kv_migrated_from_localstorage_v1';
const DEFAULT_MIGRATE_PREFIX = 'mini-ai-phone.';

let initialized = false;
const cache = new Map<string, string>();
const subs = new Set<StorageSubscriber>();

let writeQueue: Promise<void> = Promise.resolve();

const bc =
  typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('mini-ai-phone.storage-v1')
    : null;

if (bc) {
  bc.onmessage = (ev) => {
    const msg = (ev as MessageEvent<any>)?.data;
    if (!msg || typeof msg !== 'object') return;
    const { type, key, value } = msg as any;
    if (typeof key !== 'string') return;

    if (type === 'set' && typeof value === 'string') {
      cache.set(key, value);
      subs.forEach((fn) => fn(key));
    } else if (type === 'del') {
      cache.delete(key);
      subs.forEach((fn) => fn(key));
    }
  };
}

const enqueueWrite = (fn: () => Promise<void>) => {
  writeQueue = writeQueue.then(fn).catch(() => {});
};

export const initAppStorage = async (opts?: { migrateFromLocalStorage?: boolean; migratePrefix?: string }) => {
  if (initialized) return;

  // 1) 先把 IDB KV 全量加载进内存，保证后续 getItem 同步可用
  const rows = await idbKvGetAll();
  rows.forEach((r) => {
    if (r && typeof r.key === 'string' && typeof r.value === 'string') {
      cache.set(r.key, r.value);
    }
  });

  // 2) 一次性迁移：localStorage -> IDB KV（只迁移指定前缀，避免误伤同源其它数据）
  const migrate = opts?.migrateFromLocalStorage !== false;
  const prefix = (opts?.migratePrefix ?? DEFAULT_MIGRATE_PREFIX).toString();

  const alreadyMigrated = cache.get(MIGRATED_FLAG_KEY) === '1';
  if (migrate && !alreadyMigrated) {
    try {
      const ls = window.localStorage;
      const keys: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k && k.startsWith(prefix)) keys.push(k);
      }

      for (const k of keys) {
        const v = ls.getItem(k);
        if (typeof v === 'string') {
          cache.set(k, v);
          // 迁移时直接 await，保证迁完再清理 localStorage
          // eslint-disable-next-line no-await-in-loop
          await idbKvSet(k, v);
        }
      }

      // 标记迁移完成（避免每次启动都扫 localStorage）
      cache.set(MIGRATED_FLAG_KEY, '1');
      await idbKvSet(MIGRATED_FLAG_KEY, '1');

      // 清理 localStorage 中属于本项目的键，彻底不再走 localStorage 配额
      keys.forEach((k) => {
        try {
          ls.removeItem(k);
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
  }

  initialized = true;
};

export const appStorage = {
  // 同步 API：替代 localStorage.getItem
  getItem(key: string): string | null {
    return cache.has(key) ? (cache.get(key) ?? null) : null;
  },

  // 同步 API：替代 localStorage.setItem（底层异步落盘到 IDB KV）
  setItem(key: string, value: string) {
    const k = String(key);
    const v = String(value);
    cache.set(k, v);
    subs.forEach((fn) => fn(k));
    try {
      bc?.postMessage({ type: 'set', key: k, value: v });
    } catch {
      // ignore
    }
    enqueueWrite(() => idbKvSet(k, v));
  },

  // 同步 API：替代 localStorage.removeItem
  removeItem(key: string) {
    const k = String(key);
    cache.delete(k);
    subs.forEach((fn) => fn(k));
    try {
      bc?.postMessage({ type: 'del', key: k });
    } catch {
      // ignore
    }
    enqueueWrite(() => idbKvDel(k));
  },

  // 获取当前缓存里的所有 key（用于“按前缀清理/统计”等场景）
  // 注意：这是同步返回内存态；初始化后它与 IndexedDB KV 保持一致（跨 tab 通过 BroadcastChannel 同步）。
  keys(): string[] {
    return Array.from(cache.keys());
  },

  // 订阅：用于替代 storage 事件（同 tab & 跨 tab）
  subscribe(fn: StorageSubscriber) {
    subs.add(fn);
    return () => subs.delete(fn);
  },

  // 调试/兜底：等待落盘队列完成
  async flush() {
    try {
      await writeQueue;
    } catch {
      // ignore
    }
  }
};


