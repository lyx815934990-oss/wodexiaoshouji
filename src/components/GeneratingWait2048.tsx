import React from 'react';

type Grid2048 = number[][];
type Dir2048 = 'left' | 'right' | 'up' | 'down';
type MoveTile2048 = { fromR: number; fromC: number; toR: number; toC: number; value: number };
type MoveResult2048 = {
  moved: boolean;
  gained: number;
  next: Grid2048;
  moves: MoveTile2048[];
  merges: Array<{ r: number; c: number }>;
  spawned: { r: number; c: number; value: number } | null;
};

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

function spawnOneDetailed(grid: Grid2048): { grid: Grid2048; spawned: { r: number; c: number; value: number } | null } {
  const next = grid.map((r) => r.slice());
  const empties: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) if (!next[r][c]) empties.push({ r, c });
  }
  if (!empties.length) return { grid: next, spawned: null };
  const p = empties[Math.floor(Math.random() * empties.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  next[p.r][p.c] = value;
  return { grid: next, spawned: { r: p.r, c: p.c, value } };
}

function collapseLineDetailed(line: number[]): {
  line: number[];
  gained: number;
  changed: boolean;
  moves: Array<{ from: number; to: number; value: number }>;
  merges: Array<{ to: number }>;
} {
  const items = line.map((value, idx) => ({ value, idx })).filter((x) => x.value > 0);
  const outValues: number[] = [];
  const outSources: number[][] = [];
  const merges: Array<{ to: number }> = [];
  let gained = 0;
  let i = 0;
  while (i < items.length) {
    const cur = items[i];
    const nxt = items[i + 1];
    if (nxt && nxt.value === cur.value) {
      const merged = cur.value * 2;
      outValues.push(merged);
      outSources.push([cur.idx, nxt.idx]);
      merges.push({ to: outValues.length - 1 });
      gained += merged;
      i += 2;
    } else {
      outValues.push(cur.value);
      outSources.push([cur.idx]);
      i += 1;
    }
  }
  while (outValues.length < 4) {
    outValues.push(0);
    outSources.push([]);
  }
  const moves: Array<{ from: number; to: number; value: number }> = [];
  outSources.forEach((srcs, to) => srcs.forEach((from) => moves.push({ from, to, value: line[from] })));
  return { line: outValues, gained, changed: outValues.some((n, idx) => n !== line[idx]), moves, merges };
}

function moveBoard2048(grid: Grid2048, dir: Dir2048): MoveResult2048 {
  const next = grid.map((r) => r.slice());
  let moved = false;
  let gained = 0;
  const moveTiles: MoveTile2048[] = [];
  const mergeCells: Array<{ r: number; c: number }> = [];
  const apply = (
    read: number[],
    write: (vals: number[]) => void,
    mapMove: (from: number, to: number, value: number) => MoveTile2048,
    mapMerge: (to: number) => { r: number; c: number }
  ) => {
    const r = collapseLineDetailed(read);
    if (r.changed) moved = true;
    gained += r.gained;
    r.moves.forEach((m) => moveTiles.push(mapMove(m.from, m.to, m.value)));
    r.merges.forEach((m) => mergeCells.push(mapMerge(m.to)));
    write(r.line);
  };
  for (let i = 0; i < 4; i += 1) {
    if (dir === 'left') {
      apply(next[i].slice(), (vals) => (next[i] = vals), (from, to, value) => ({ fromR: i, fromC: from, toR: i, toC: to, value }), (to) => ({ r: i, c: to }));
    } else if (dir === 'right') {
      apply(
        next[i].slice().reverse(),
        (vals) => (next[i] = vals.reverse()),
        (from, to, value) => ({ fromR: i, fromC: 3 - from, toR: i, toC: 3 - to, value }),
        (to) => ({ r: i, c: 3 - to })
      );
    }
    else if (dir === 'up') {
      const col = [next[0][i], next[1][i], next[2][i], next[3][i]];
      apply(
        col,
        (vals) => {
          for (let r = 0; r < 4; r += 1) next[r][i] = vals[r];
        },
        (from, to, value) => ({ fromR: from, fromC: i, toR: to, toC: i, value }),
        (to) => ({ r: to, c: i })
      );
    } else {
      const col = [next[0][i], next[1][i], next[2][i], next[3][i]].reverse();
      apply(
        col,
        (vals) => {
          const rev = vals.reverse();
          for (let r = 0; r < 4; r += 1) next[r][i] = rev[r];
        },
        (from, to, value) => ({ fromR: 3 - from, fromC: i, toR: 3 - to, toC: i, value }),
        (to) => ({ r: 3 - to, c: i })
      );
    }
  }
  if (!moved) return { moved: false, next: grid, gained: 0, moves: [], merges: [], spawned: null };
  const spawned = spawnOneDetailed(next);
  return { moved: true, next: spawned.grid, gained, moves: moveTiles, merges: mergeCells, spawned: spawned.spawned };
}

function calcProgressHint(step?: string | null): number {
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

export const GeneratingWait2048: React.FC<{
  title?: string;
  step?: string | null;
  onClose?: () => void;
  closeText?: string;
}> = ({ title = '正在生成内容中，请稍等', step, onClose, closeText = '后台生成并关闭' }) => {
  const [gameBoard, setGameBoard] = React.useState<Grid2048>(() => createBoard2048());
  const [score, setScore] = React.useState(0);
  const [best, setBest] = React.useState(0);
  const [gameMovingTiles, setGameMovingTiles] = React.useState<MoveTile2048[]>([]);
  const [gameMovePhase, setGameMovePhase] = React.useState<'start' | 'run'>('start');
  const [gameMergePulseKeys, setGameMergePulseKeys] = React.useState<string[]>([]);
  const [gameSpawnPopKey, setGameSpawnPopKey] = React.useState<string | null>(null);
  const [gameSpawnPopPhase, setGameSpawnPopPhase] = React.useState<'start' | 'run'>('run');
  const gameAnimRunningRef = React.useRef(false);
  const gameAnimTimerRef = React.useRef<number | null>(null);
  const gamePulseTimerRef = React.useRef<number | null>(null);
  const [displayProgress, setDisplayProgress] = React.useState(0);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const move = React.useCallback((dir: Dir2048) => {
    if (gameAnimRunningRef.current) return;
    const r = moveBoard2048(gameBoard, dir);
    if (!r.moved) return;
    gameAnimRunningRef.current = true;
    const ns = score + r.gained;
    setScore(ns);
    if (ns > best) setBest(ns);
    setGameMovingTiles(r.moves.filter((m) => m.fromR !== m.toR || m.fromC !== m.toC));
    setGameMovePhase('start');
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setGameMovePhase('run'));
    });
    if (gameAnimTimerRef.current) window.clearTimeout(gameAnimTimerRef.current);
    gameAnimTimerRef.current = window.setTimeout(() => {
      setGameBoard(r.next);
      setGameMovingTiles([]);
      setGameMovePhase('start');
      setGameMergePulseKeys(r.merges.map((m) => `${m.r}-${m.c}`));
      setGameSpawnPopKey(r.spawned ? `${r.spawned.r}-${r.spawned.c}` : null);
      setGameSpawnPopPhase('start');
      window.requestAnimationFrame(() => setGameSpawnPopPhase('run'));
      if (gamePulseTimerRef.current) window.clearTimeout(gamePulseTimerRef.current);
      gamePulseTimerRef.current = window.setTimeout(() => {
        setGameMergePulseKeys([]);
        setGameSpawnPopKey(null);
        setGameSpawnPopPhase('run');
        gamePulseTimerRef.current = null;
      }, 170);
      gameAnimRunningRef.current = false;
      gameAnimTimerRef.current = null;
    }, 148);
  }, [best, gameBoard, score]);

  React.useEffect(() => {
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
  }, [move]);

  React.useEffect(
    () => () => {
      if (gameAnimTimerRef.current) window.clearTimeout(gameAnimTimerRef.current);
      if (gamePulseTimerRef.current) window.clearTimeout(gamePulseTimerRef.current);
    },
    []
  );

  React.useEffect(() => {
    const target = Math.max(8, calcProgressHint(step));
    setDisplayProgress((p) => Math.max(p, target));
    const timer = window.setInterval(() => {
      const dynamicTarget = Math.max(target, Math.min(94, calcProgressHint(step)));
      setDisplayProgress((p) => {
        if (p < dynamicTarget) return Math.min(dynamicTarget, p + 2);
        if (p < 95) return p + 0.3;
        return p;
      });
    }, 650);
    return () => window.clearInterval(timer);
  }, [step]);

  const progress = Math.max(0, Math.min(99, Math.round(displayProgress)));
  const movingFromSet = new Set(gameMovingTiles.map((m) => `${m.fromR}-${m.fromC}`));
  const CELL_SIZE = 64;
  const CELL_GAP = 8;
  const tileOffset = CELL_SIZE + CELL_GAP;
  const boardPixelSize = CELL_SIZE * 4 + CELL_GAP * 3;
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', textAlign: 'center' }}>{title}</div>
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
        <div style={{ width: boardPixelSize, height: boardPixelSize, margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(4, ${CELL_SIZE}px)`, gap: CELL_GAP }}>
            {gameBoard.flatMap((row, r) =>
              row.map((n, c) => {
                const cellKey = `${r}-${c}`;
                const hideSource = movingFromSet.has(cellKey);
                const pulse = gameMergePulseKeys.includes(cellKey);
                const spawnPop = gameSpawnPopKey === cellKey;
                const spawnStart = spawnPop && gameSpawnPopPhase === 'start';
                return (
                  <div
                    key={cellKey}
                    style={{
                      height: CELL_SIZE,
                      borderRadius: 8,
                      background:
                        !n || hideSource
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
                      color: n <= 4 ? '#776e65' : '#fff',
                      transform: pulse ? 'scale(1.08)' : spawnStart ? 'scale(0.72)' : 'scale(1)',
                      opacity: spawnStart ? 0.72 : 1,
                      transition: spawnPop
                        ? 'transform 130ms cubic-bezier(0.22, 1, 0.36, 1), opacity 130ms ease-out'
                        : 'transform 120ms ease-out'
                    }}
                  >
                    {!hideSource ? (n || '') : ''}
                  </div>
                );
              })
            )}
          </div>
          {gameMovingTiles.map((m, idx) => {
            const dx = (m.toC - m.fromC) * tileOffset;
            const dy = (m.toR - m.fromR) * tileOffset;
            return (
              <div
                key={`${m.fromR}-${m.fromC}-${m.toR}-${m.toC}-${idx}`}
                style={{
                  position: 'absolute',
                  left: m.fromC * tileOffset,
                  top: m.fromR * tileOffset,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  borderRadius: 8,
                  background:
                    m.value <= 4
                      ? '#eee4da'
                      : m.value <= 16
                        ? '#f2b179'
                        : m.value <= 64
                          ? '#f59563'
                          : m.value <= 256
                            ? '#f67c5f'
                            : '#edcf72',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: m.value >= 1024 ? 20 : 24,
                  fontWeight: 800,
                  color: m.value <= 4 ? '#776e65' : '#fff',
                  transform: gameMovePhase === 'run' ? `translate3d(${dx}px, ${dy}px, 0)` : 'translate3d(0, 0, 0)',
                  transition: 'transform 140ms cubic-bezier(0.18, 0.9, 0.3, 1)',
                  willChange: 'transform',
                  pointerEvents: 'none'
                }}
              >
                {m.value}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#475569' }}>
          分数 {score}
        </div>
        <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#475569' }}>
          最高 {Math.max(best, score)}
        </div>
        <button
          type="button"
          onClick={() => {
            if (gameAnimTimerRef.current) {
              window.clearTimeout(gameAnimTimerRef.current);
              gameAnimTimerRef.current = null;
            }
            if (gamePulseTimerRef.current) {
              window.clearTimeout(gamePulseTimerRef.current);
              gamePulseTimerRef.current = null;
            }
            gameAnimRunningRef.current = false;
            setGameMovingTiles([]);
            setGameMovePhase('start');
            setGameMergePulseKeys([]);
            setGameSpawnPopKey(null);
            setGameSpawnPopPhase('run');
            setGameBoard(createBoard2048());
            setScore(0);
          }}
          style={{ border: '1px solid #e5e7eb', background: '#fff', color: '#374151', borderRadius: 8, padding: '7px 10px', fontSize: 12, cursor: 'pointer' }}
        >
          重开
        </button>
      </div>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: 12,
            border: '1px solid #e5e7eb',
            background: '#fff',
            color: '#374151',
            borderRadius: 999,
            padding: '8px 12px',
            fontSize: 12,
            cursor: 'pointer'
          }}
        >
          {closeText}
        </button>
      ) : null}
    </div>
  );
};

