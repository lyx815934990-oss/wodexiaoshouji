/** 匿问我答头像：固定匿名图 + 「随机网友头像」文件夹内图片（不重复取用，用尽后重新洗牌） */

export const ANONYMOUS_QA_ANON_AVATAR_URL = new URL('../image/匿名头像.jpg', import.meta.url).href;

const netizenGlob = import.meta.glob('../image/随机网友头像/*.{jpg,jpeg,png,gif,webp,JPG,JPEG,PNG,GIF,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>;

export const ANONYMOUS_QA_NETIZEN_AVATAR_POOL: string[] = Object.values(netizenGlob);

let shuffledNetizenPool: string[] = [];

function reshuffleNetizenPool() {
  const base = [...ANONYMOUS_QA_NETIZEN_AVATAR_POOL];
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = base[i]!;
    base[i] = base[j]!;
    base[j] = t;
  }
  shuffledNetizenPool = base;
}

/** 取下一个不重复的网友公开头像；文件夹为空时返回空字符串 */
export function takeNextNetizenAvatarUrl(): string {
  if (ANONYMOUS_QA_NETIZEN_AVATAR_POOL.length === 0) return '';
  if (shuffledNetizenPool.length === 0) reshuffleNetizenPool();
  const next = shuffledNetizenPool.pop();
  return next ?? '';
}

/** 旧数据或未写入 displayAvatarUrl 时的稳定回退（同 seed 同图） */
export function deterministicNetizenAvatarUrl(seed: string): string {
  const pool = ANONYMOUS_QA_NETIZEN_AVATAR_POOL;
  if (pool.length === 0 || !seed) return '';
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return pool[Math.abs(h) % pool.length] ?? '';
}
