/**
 * 查手机桌面「一键生成」弹层（解决：仅 setPhoneInspectBatchOpen(true) 但未渲染 UI 的问题）。
 *
 * 在 `WeChatApp.tsx` 中接入：
 * 1. `import { PhoneInspectBatchModal } from '../components/PhoneInspectBatchModal';`
 * 2. 查手机主页把 `<>` 换成外层 `<div style={{ position: 'relative', width: '100%', minHeight: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>`
 * 3. 网格 `</div>` 之后、`</>` 之前插入：
 *    `<PhoneInspectBatchModal open={phoneInspectBatchOpen} busy={phoneInspectBatchBusy} step={phoneInspectBatchStep} pick={phoneInspectBatchPick} setPick={setPhoneInspectBatchPick} onBackdropClose={() => setPhoneInspectBatchOpen(false)} onStart={runPhoneInspectBatchGenerate} />`
 * 4. 最后的 `</>` 改为 `</div>`
 * 5. 一键按钮建议：`onClick={(e) => { e.stopPropagation(); if (!phoneInspectBatchBusy) setPhoneInspectBatchOpen(true); }}`
 */
import React from 'react';

export type PhoneInspectBatchPickState = {
  wechat: boolean;
  memo: boolean;
  sleep: boolean;
};

type Props = {
  open: boolean;
  busy: boolean;
  step: string | null;
  pick: PhoneInspectBatchPickState;
  setPick: React.Dispatch<React.SetStateAction<PhoneInspectBatchPickState>>;
  onBackdropClose: () => void;
  onStart: () => void;
};

type Grid2048 = number[][];
type Dir2048 = 'left' | 'right' | 'up' | 'down';

function createBoard2048(): Grid2048 {
  const grid = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => 0));
  const spawn = (g: Grid2048): Grid2048 => {
    const next = g.map((r) => r.slice());
    const empties: Array<{ r: number; c: number }> = [];
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 4; c += 1) if (!next[r][c]) empties.push({ r, c });
    }
    if (!empties.length) return next;
    const p = empties[Math.floor(Math.random() * empties.length)];
    next[p.r][p.c] = Math.random() < 0.9 ? 2 : 4;
    return next;
  };
  return spawn(spawn(grid));
}

function collapseLine2048(line: number[]): { line: number[]; gained: number; changed: boolean } {
  const compact = line.filter((n) => n > 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < compact.length; i += 1) {
    if (compact[i] && compact[i] === compact[i + 1]) {
      const v = compact[i] * 2;
      out.push(v);
      gained += v;
      i += 1;
    } else {
      out.push(compact[i]);
    }
  }
  while (out.length < 4) out.push(0);
  return { line: out, gained, changed: out.some((n, i) => n !== line[i]) };
}

function moveBoard2048(grid: Grid2048, dir: Dir2048): { moved: boolean; next: Grid2048; gained: number } {
  const next = grid.map((r) => r.slice());
  let moved = false;
  let gained = 0;
  const apply = (read: number[], write: (vals: number[]) => void) => {
    const r = collapseLine2048(read);
    if (r.changed) moved = true;
    gained += r.gained;
    write(r.line);
  };
  for (let i = 0; i < 4; i += 1) {
    if (dir === 'left') apply(next[i].slice(), (vals) => (next[i] = vals));
    else if (dir === 'right') apply(next[i].slice().reverse(), (vals) => (next[i] = vals.reverse()));
    else if (dir === 'up') {
      const col = [next[0][i], next[1][i], next[2][i], next[3][i]];
      apply(col, (vals) => {
        for (let r = 0; r < 4; r += 1) next[r][i] = vals[r];
      });
    } else {
      const col = [next[0][i], next[1][i], next[2][i], next[3][i]].reverse();
      apply(col, (vals) => {
        const rev = vals.reverse();
        for (let r = 0; r < 4; r += 1) next[r][i] = rev[r];
      });
    }
  }
  if (!moved) return { moved: false, next: grid, gained: 0 };
  return { moved: true, next: createBoard2048From(next), gained };
}

function createBoard2048From(grid: Grid2048): Grid2048 {
  const next = grid.map((r) => r.slice());
  const empties: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) if (!next[r][c]) empties.push({ r, c });
  }
  if (!empties.length) return next;
  const p = empties[Math.floor(Math.random() * empties.length)];
  next[p.r][p.c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function calcProgress(step: string | null | undefined): number {
  const s = String(step || '').trim();
  if (!s) return 12;
  if (s.includes('单次请求')) return 28;
  const m = s.match(/第\s*(\d+)\s*\/\s*(\d+)\s*轮/);
  if (m) {
    const cur = Math.max(1, Number(m[1]) || 1);
    const total = Math.max(cur, Number(m[2]) || cur);
    const ratio = Math.min(1, cur / total);
    if (s.includes('去重')) return Math.round(35 + ratio * 45);
    if (s.includes('缺失')) return Math.round(45 + ratio * 45);
  }
  if (s.includes('补全')) return 72;
  return 35;
}

const ROWS = [
  { key: 'wechat' as const, label: '微信（联系人、聊天、钱包等）' },
  { key: 'memo' as const, label: '备忘录' },
  { key: 'sleep' as const, label: '健康 · 睡眠记录' }
];

/**
 * 查手机桌面「一键生成」弹层。在 WeChatApp 查手机主页用 position:relative 的容器包裹后置于其内。
 */
export const PhoneInspectBatchModal: React.FC<Props> = ({
  open,
  busy,
  step,
  pick,
  setPick,
  onBackdropClose,
  onStart
}) => {
  if (!open) return null;
  const [gameBoard, setGameBoard] = React.useState<Grid2048>(() => createBoard2048());
  const [score, setScore] = React.useState(0);
  const [best, setBest] = React.useState(0);
  const [displayProgress, setDisplayProgress] = React.useState(0);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const move = React.useCallback((dir: Dir2048) => {
    setGameBoard((prev) => {
      const r = moveBoard2048(prev, dir);
      if (!r.moved) return prev;
      setScore((s) => {
        const ns = s + r.gained;
        setBest((b) => Math.max(b, ns));
        return ns;
      });
      return r.next;
    });
  }, []);

  React.useEffect(() => {
    if (!busy) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') move('left');
      else if (e.key === 'ArrowRight') move('right');
      else if (e.key === 'ArrowUp') move('up');
      else if (e.key === 'ArrowDown') move('down');
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [busy, move]);

  React.useEffect(() => {
    if (!busy) {
      setDisplayProgress(0);
      return;
    }
    const target = Math.max(8, calcProgress(step));
    setDisplayProgress((p) => Math.max(p, target));
    const timer = window.setInterval(() => {
      const dynamicTarget = Math.max(target, Math.min(94, calcProgress(step)));
      setDisplayProgress((p) => {
        if (p < dynamicTarget) return Math.min(dynamicTarget, p + 2);
        if (p < 95) return p + 0.3;
        return p;
      });
    }, 650);
    return () => window.clearInterval(timer);
  }, [busy, step]);

  const nonePicked = !pick.wechat && !pick.memo && !pick.sleep;
  const progress = Math.max(0, Math.min(99, Math.round(displayProgress)));
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 80,
        backgroundColor: 'rgba(15,23,42,0.52)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12
      }}
      onClick={() => {
        if (!busy) onBackdropClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-inspect-batch-title"
        onClick={(ev) => ev.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 308,
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: '16px 16px 14px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.28)'
        }}
      >
        {!busy ? (
          <>
            <div id="phone-inspect-batch-title" style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
              一键生成查手机内容
            </div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.45, marginBottom: 12 }}>
              勾选需要生成的模块，将按顺序调用 AI。备忘录与健康·睡眠依赖当前聊天会话。
            </div>
            {ROWS.map((row, idx) => (
              <label
                key={row.key}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 0',
                  borderTop: idx === 0 ? 'none' : '1px solid #f3f4f6',
                  cursor: busy ? 'default' : 'pointer',
                  fontSize: 14,
                  color: '#334155'
                }}
              >
                <input
                  type="checkbox"
                  checked={pick[row.key]}
                  disabled={busy}
                  onChange={() => setPick((p) => ({ ...p, [row.key]: !p[row.key] }))}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <span>{row.label}</span>
              </label>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                type="button"
                disabled={busy}
                onClick={onBackdropClose}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontSize: 14,
                  cursor: busy ? 'not-allowed' : 'pointer'
                }}
              >
                取消
              </button>
              <button
                type="button"
                disabled={busy || nonePicked}
                onClick={() => void onStart()}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: busy ? '#c4b5fd' : '#6366f1',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: busy || nonePicked ? 'not-allowed' : 'pointer'
                }}
              >
                开始生成
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', textAlign: 'center' }}>正在生成内容中，请稍等</div>
            <div style={{ marginTop: 10, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden', height: 10 }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f97316 0%, #ef4444 100%)',
                  transition: 'width 260ms ease'
                }}
              />
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
              {step || '正在准备生成任务…'}（约 {progress}%）
            </div>
            <div
              style={{ marginTop: 12, background: '#bbada0', borderRadius: 10, padding: 8, touchAction: 'none' }}
              onTouchStart={(e) => {
                const t = e.touches?.[0];
                if (!t) return;
                touchStartRef.current = { x: t.clientX, y: t.clientY };
              }}
              onTouchEnd={(e) => {
                const start = touchStartRef.current;
                touchStartRef.current = null;
                const t = e.changedTouches?.[0];
                if (!start || !t) return;
                const dx = t.clientX - start.x;
                const dy = t.clientY - start.y;
                if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
                if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
                else move(dy > 0 ? 'down' : 'up');
              }}
            >
              <div style={{ width: 280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 64px)', gap: 8 }}>
                {gameBoard.flatMap((row, r) =>
                  row.map((n, c) => (
                    <div
                      key={`${r}-${c}`}
                      style={{
                        height: 64,
                        borderRadius: 8,
                        background:
                          n === 0
                            ? 'rgba(238,228,218,0.35)'
                            : n <= 4
                              ? '#eee4da'
                              : n <= 16
                                ? '#f2b179'
                                : n <= 64
                                  ? '#f59563'
                                  : n <= 256
                                    ? '#f67c5f'
                                    : '#edcf72',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: n >= 1024 ? 20 : 24,
                        fontWeight: 800,
                        color: n <= 4 ? '#776e65' : '#fff'
                      }}
                    >
                      {n || ''}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#475569' }}>分数 {score}</div>
              <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#475569' }}>最高 {Math.max(best, score)}</div>
              <button
                type="button"
                onClick={() => {
                  setGameBoard(createBoard2048());
                  setScore(0);
                }}
                style={{ border: '1px solid #e5e7eb', background: '#fff', color: '#374151', borderRadius: 8, padding: '7px 10px', fontSize: 12, cursor: 'pointer' }}
              >
                重开
              </button>
            </div>
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 44px)', justifyContent: 'center', gap: 8 }}>
              <span />
              <button type="button" onClick={() => move('up')} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>↑</button>
              <span />
              <button type="button" onClick={() => move('left')} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>←</button>
              <button type="button" onClick={() => move('down')} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>↓</button>
              <button type="button" onClick={() => move('right')} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>→</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
