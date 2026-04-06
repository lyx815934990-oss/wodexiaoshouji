export const APP_DB_NAME = 'mini-ai-phone-db';

// 注意：WeChatApp/StoryApp 里原先用 version=1 打开同名 DB。
// 我们要新增 KV store，所以必须升级版本；同时所有打开 DB 的地方都要用同一个 version，
// 否则会触发 VersionError（试图以更低版本打开更高版本的 DB）。
export const APP_DB_VERSION = 3;

export const CHAT_MESSAGES_STORE = 'wechat_chat_messages_v1';
export const KV_STORE = 'app_kv_v1';
export const TTS_AUDIO_STORE = 'tts_audio_v1';

export type KvRow = { key: string; value: string };

export type TtsAudioRow = {
  key: string;
  voiceId: string;
  text: string;
  mime: string;
  createdAt: number;
  blob: Blob;
};

export const openAppDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      const req = window.indexedDB.open(APP_DB_NAME, APP_DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;

        // 兼容旧版本：聊天消息 store 可能已存在
        if (!db.objectStoreNames.contains(CHAT_MESSAGES_STORE)) {
          db.createObjectStore(CHAT_MESSAGES_STORE);
        }

        // 新增：KV store，用于替代 localStorage
        if (!db.objectStoreNames.contains(KV_STORE)) {
          db.createObjectStore(KV_STORE, { keyPath: 'key' });
        }

        // 新增：TTS 音频缓存（Blob），用于“随时点击试听”
        if (!db.objectStoreNames.contains(TTS_AUDIO_STORE)) {
          db.createObjectStore(TTS_AUDIO_STORE, { keyPath: 'key' });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('OPEN_IDB_FAILED'));
    } catch (err) {
      reject(err);
    }
  });
};

export const idbKvGet = async (key: string): Promise<string | null> => {
  const db = await openAppDb();
  return await new Promise((resolve) => {
    try {
      const tx = db.transaction(KV_STORE, 'readonly');
      const store = tx.objectStore(KV_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        const row = req.result as KvRow | undefined;
        resolve(row && typeof row.value === 'string' ? row.value : null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

export const idbKvSet = async (key: string, value: string): Promise<void> => {
  const db = await openAppDb();
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(KV_STORE, 'readwrite');
      const store = tx.objectStore(KV_STORE);
      store.put({ key, value } satisfies KvRow);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
};

export const idbKvDel = async (key: string): Promise<void> => {
  const db = await openAppDb();
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(KV_STORE, 'readwrite');
      const store = tx.objectStore(KV_STORE);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
};

export const idbKvGetAll = async (): Promise<KvRow[]> => {
  const db = await openAppDb();
  return await new Promise((resolve) => {
    try {
      const tx = db.transaction(KV_STORE, 'readonly');
      const store = tx.objectStore(KV_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(Array.isArray(req.result) ? (req.result as KvRow[]) : []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
};

const ttsKey = (voiceId: string) => `tts_audio:last:${voiceId}`;

export const idbTtsAudioGet = async (voiceId: string): Promise<TtsAudioRow | null> => {
  const db = await openAppDb();
  const key = ttsKey(voiceId);
  return await new Promise((resolve) => {
    try {
      const tx = db.transaction(TTS_AUDIO_STORE, 'readonly');
      const store = tx.objectStore(TTS_AUDIO_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        const row = req.result as TtsAudioRow | undefined;
        if (!row || typeof row.key !== 'string') return resolve(null);
        resolve(row);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

export const idbTtsAudioSet = async (voiceId: string, text: string, blob: Blob): Promise<void> => {
  const db = await openAppDb();
  const key = ttsKey(voiceId);
  const row: TtsAudioRow = {
    key,
    voiceId,
    text: String(text || ''),
    mime: blob.type || 'audio/mpeg',
    createdAt: Date.now(),
    blob
  };
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(TTS_AUDIO_STORE, 'readwrite');
      const store = tx.objectStore(TTS_AUDIO_STORE);
      store.put(row);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
};

export const idbTtsAudioDel = async (voiceId: string): Promise<void> => {
  const db = await openAppDb();
  const key = ttsKey(voiceId);
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(TTS_AUDIO_STORE, 'readwrite');
      const store = tx.objectStore(TTS_AUDIO_STORE);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
};


