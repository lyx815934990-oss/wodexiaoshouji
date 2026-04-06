/** 匿问我答：发帖时间相对展示（随当前时间变化） */

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * 由毫秒时间戳生成中文相对时间；无 postedAt 时回退 legacyTime（旧数据兼容）。
 */
export function formatAnonymousQaTimeLabel(postedAt: number | undefined, legacyTime?: string): string {
  if (postedAt == null || !Number.isFinite(postedAt)) {
    const t = String(legacyTime || '').trim();
    return t || '刚刚';
  }
  const now = Date.now();
  const diffMs = Math.max(0, now - postedAt);
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  if (sec < 45) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  if (hr < 24) return `${hr}小时前`;

  const d = new Date(postedAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  const d0 = new Date(d);
  d0.setHours(0, 0, 0, 0);

  if (d0.getTime() === yest.getTime()) {
    return `昨天 ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  if (d.getFullYear() === today.getFullYear()) {
    return `${d.getMonth() + 1}月${d.getDate()}日 ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${pad2(d.getHours())}:${pad2(
    d.getMinutes()
  )}`;
}

/** 在一条时间链上往后错开几秒～几分钟，且不晚于 now - floorMs */
export function bumpPostedAtChain(
  chainMs: number,
  now: number,
  minAddMs: number,
  maxAddMs: number,
  floorMs = 5000
): number {
  const lo = Math.min(minAddMs, maxAddMs);
  const hi = Math.max(minAddMs, maxAddMs);
  const add = lo + Math.random() * (hi - lo);
  return Math.min(chainMs + add, now - floorMs);
}
