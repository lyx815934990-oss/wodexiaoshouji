import React from 'react';
import { PhoneInspectShoppingOrdersAll, type OrderFilter } from './PhoneInspectShoppingOrdersAll';
import { PhoneInspectShoppingFollowStores } from './PhoneInspectShoppingFollowStores';
import { PhoneInspectShoppingFootprints } from './PhoneInspectShoppingFootprints';

export type PhoneInspectShoppingMemberTier = 'gold' | 'platinum' | 'diamond' | 'black';

const TIER_META: Record<
  PhoneInspectShoppingMemberTier,
  { label: string; bg: string; color: string }
> = {
  gold: { label: '黄金会员', bg: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)', color: '#78350f' },
  platinum: { label: '铂金会员', bg: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)', color: '#1e293b' },
  diamond: { label: '钻石会员', bg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: '#eef2ff' },
  black: { label: '黑钻会员', bg: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', color: '#fbbf24' }
};

function pickMemberTier(roleId: string): PhoneInspectShoppingMemberTier {
  if (!roleId) return 'gold';
  let h = 0;
  for (let i = 0; i < roleId.length; i++) h = (h * 31 + roleId.charCodeAt(i)) | 0;
  const t = Math.abs(h) % 4;
  return (['gold', 'platinum', 'diamond', 'black'] as const)[t];
}

type Grid2048 = number[][];
type MoveDir2048 = 'left' | 'right' | 'up' | 'down';
type MoveTile2048 = {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
  value: number;
};
type MoveResult2048 = {
  moved: boolean;
  gained: number;
  next: Grid2048;
  moves: MoveTile2048[];
  merges: Array<{ r: number; c: number }>;
  spawned: { r: number; c: number; value: number } | null;
};

function makeEmpty2048Grid(): Grid2048 {
  return Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => 0));
}

function clone2048Grid(grid: Grid2048): Grid2048 {
  return grid.map((row) => row.slice());
}

function spawn2048Tile(grid: Grid2048): Grid2048 {
  const next = clone2048Grid(grid);
  const empties: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      if (!next[r][c]) empties.push({ r, c });
    }
  }
  if (!empties.length) return next;
  const pick = empties[Math.floor(Math.random() * empties.length)];
  next[pick.r][pick.c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function spawn2048TileDetailed(grid: Grid2048): { grid: Grid2048; spawned: { r: number; c: number; value: number } | null } {
  const next = clone2048Grid(grid);
  const empties: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      if (!next[r][c]) empties.push({ r, c });
    }
  }
  if (!empties.length) return { grid: next, spawned: null };
  const pick = empties[Math.floor(Math.random() * empties.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  next[pick.r][pick.c] = value;
  return { grid: next, spawned: { r: pick.r, c: pick.c, value } };
}

function create2048Board(): Grid2048 {
  return spawn2048Tile(spawn2048Tile(makeEmpty2048Grid()));
}

function collapse2048Line(line: number[]): { line: number[]; gained: number; changed: boolean } {
  const compact = line.filter((n) => n > 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < compact.length; i += 1) {
    if (compact[i] && compact[i] === compact[i + 1]) {
      const merged = compact[i] * 2;
      out.push(merged);
      gained += merged;
      i += 1;
    } else {
      out.push(compact[i]);
    }
  }
  while (out.length < 4) out.push(0);
  const changed = out.some((n, i) => n !== line[i]);
  return { line: out, gained, changed };
}

function canMove2048(grid: Grid2048): boolean {
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      const cur = grid[r][c];
      if (!cur) return true;
      if (r < 3 && grid[r + 1][c] === cur) return true;
      if (c < 3 && grid[r][c + 1] === cur) return true;
    }
  }
  return false;
}

function collapse2048LineDetailed(
  line: number[]
): {
  line: number[];
  gained: number;
  changed: boolean;
  moves: Array<{ from: number; to: number; value: number }>;
  merges: Array<{ to: number }>;
} {
  const items = line
    .map((value, idx) => ({ value, idx }))
    .filter((x) => x.value > 0);
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
  outSources.forEach((srcs, to) => {
    srcs.forEach((from) => {
      moves.push({ from, to, value: line[from] });
    });
  });
  const changed = outValues.some((v, idx) => v !== line[idx]);
  return { line: outValues, gained, changed, moves, merges };
}

function runMove2048(grid: Grid2048, dir: MoveDir2048): MoveResult2048 {
  const next = clone2048Grid(grid);
  let moved = false;
  let gained = 0;
  const moveTiles: MoveTile2048[] = [];
  const mergeCells: Array<{ r: number; c: number }> = [];
  const applyLine = (
    read: number[],
    write: (vals: number[]) => void,
    mapMove: (from: number, to: number, value: number) => MoveTile2048,
    mapMerge: (to: number) => { r: number; c: number }
  ) => {
    const { line, gained: add, changed, moves, merges } = collapse2048LineDetailed(read);
    if (changed) moved = true;
    gained += add;
    moves.forEach((m) => moveTiles.push(mapMove(m.from, m.to, m.value)));
    merges.forEach((m) => mergeCells.push(mapMerge(m.to)));
    write(line);
  };
  for (let i = 0; i < 4; i += 1) {
    if (dir === 'left') {
      applyLine(
        next[i].slice(),
        (vals) => {
          next[i] = vals;
        },
        (from, to, value) => ({ fromR: i, fromC: from, toR: i, toC: to, value }),
        (to) => ({ r: i, c: to })
      );
    } else if (dir === 'right') {
      applyLine(
        next[i].slice().reverse(),
        (vals) => {
          next[i] = vals.reverse();
        },
        (from, to, value) => ({ fromR: i, fromC: 3 - from, toR: i, toC: 3 - to, value }),
        (to) => ({ r: i, c: 3 - to })
      );
    } else if (dir === 'up') {
      const col = [next[0][i], next[1][i], next[2][i], next[3][i]];
      applyLine(
        col,
        (vals) => {
          for (let r = 0; r < 4; r += 1) next[r][i] = vals[r];
        },
        (from, to, value) => ({ fromR: from, fromC: i, toR: to, toC: i, value }),
        (to) => ({ r: to, c: i })
      );
    } else {
      const col = [next[0][i], next[1][i], next[2][i], next[3][i]].reverse();
      applyLine(col, (vals) => {
        const rev = vals.reverse();
        for (let r = 0; r < 4; r += 1) next[r][i] = rev[r];
      },
      (from, to, value) => ({ fromR: 3 - from, fromC: i, toR: 3 - to, toC: i, value }),
      (to) => ({ r: 3 - to, c: i }));
    }
  }
  if (!moved) return { moved: false, gained: 0, next: grid, moves: [], merges: [], spawned: null };
  const spawned = spawn2048TileDetailed(next);
  return { moved: true, gained, next: spawned.grid, moves: moveTiles, merges: mergeCells, spawned: spawned.spawned };
}

function calcGeneratingProgress(step?: string | null): number {
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

type OrderItemKey = 'pay' | 'ship' | 'recv' | 'refund' | 'review';

const ORDER_ITEMS: { key: OrderItemKey; label: string }[] = [
  { key: 'pay', label: '待付款' },
  { key: 'ship', label: '待发货' },
  { key: 'recv', label: '待收货' },
  { key: 'refund', label: '退款/售后' },
  { key: 'review', label: '评价' }
];

type ShoppingMessageItem = {
  id: string;
  shopName: string;
  preview: string;
  time: string;
  unread?: number;
  ordered: boolean;
};

type CartItem = {
  id: string;
  title: string;
  spec: string;
  priceNow: number;
  priceOld?: number;
  discount?: string;
  qty: number;
  tags?: string[];
  imageEmoji?: string;
};

type CartShopGroup = {
  id: string;
  shopName: string;
  platform: 'tb' | 'tm';
  selected?: boolean;
  items: CartItem[];
};

function pickCartPlatformLabel(seed: string): { text: 'Lumi购' | 'LULU GO'; color: string } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const useLulu = Math.abs(h) % 2 === 1;
  return useLulu
    ? { text: 'LULU GO', color: '#ef4444' }
    : { text: 'Lumi购', color: '#f97316' };
}

function buildShoppingMessages(roleId: string): ShoppingMessageItem[] {
  const even = roleId.length % 2 === 0;
  return [
    {
      id: 'm-1',
      shopName: even ? '白山仙女旗舰店' : '玄喵 AI',
      preview: '欢迎您临本店',
      time: '09:36',
      ordered: true
    },
    {
      id: 'm-2',
      shopName: '活动优惠',
      preview: '偷偷给您塞红包啦',
      time: '昨天',
      unread: 4,
      ordered: false
    },
    {
      id: 'm-3',
      shopName: '淘宝闪购消息通知',
      preview: '你的老佛爷哇哇（宁德万达金街店）订单已送达',
      time: '昨天',
      unread: 7,
      ordered: true
    },
    {
      id: 'm-4',
      shopName: '麦富迪旗舰店',
      preview: '悄悄告诉您，专属降价已到位，速速来探秘。',
      time: '星期六',
      ordered: false
    },
    {
      id: 'm-5',
      shopName: '互动娱乐',
      preview: '周末狂补 吃喝玩乐 低至1折起',
      time: '星期六',
      unread: 1,
      ordered: false
    },
    {
      id: 'm-6',
      shopName: '服务提醒',
      preview: '包裹签收通知',
      time: '星期五',
      ordered: true
    },
    {
      id: 'm-7',
      shopName: 'AI海天派工作室',
      preview: '8b7ea4ac369144aa8b26cb74663de67a',
      time: '26/03/14',
      ordered: false
    },
    {
      id: 'm-8',
      shopName: '玄喵 AI',
      preview: '卡号：1ATD57UCNJZEZJTZ',
      time: '26/03/11',
      ordered: false
    }
  ];
}

function buildCartGroups(roleId: string): CartShopGroup[] {
  const even = roleId.length % 2 === 0;
  return [
    {
      id: 'cg-1',
      shopName: even ? '娜丽莎裙装' : '白山仙女旗舰店',
      platform: 'tb',
      selected: false,
      items: [
        {
          id: 'ci-1',
          title: '新势力周 现货！挂脖连衣裙流光蓝',
          spec: '颜色: 流光蓝｜尺码: XS｜套装: 两件套｜面料: 醋酸混纺｜发货: 24小时内',
          priceNow: 128.02,
          priceOld: 149,
          discount: '优惠合计20.98',
          qty: 1,
          tags: ['官方立减18元', '大促价保'],
          imageEmoji: '👗'
        },
        {
          id: 'ci-2',
          title: '新势力周 现货！挂脖连衣裙流光蓝',
          spec: '颜色: 流光蓝｜尺码: S｜套装: 两件套｜面料: 醋酸混纺｜保障: 大促价保',
          priceNow: 131,
          priceOld: 149,
          discount: '优惠合计18',
          qty: 1,
          tags: ['官方立减18元', '大促价保', '先用后付'],
          imageEmoji: '👗'
        }
      ]
    },
    {
      id: 'cg-2',
      shopName: '麦富迪麦乐多专卖店',
      platform: 'tm',
      selected: false,
      items: [
        {
          id: 'ci-3',
          title: '新会员领冻干猫粮+主食冻干',
          spec: '口味: 鸡肉+三文鱼｜规格: 冻干组合装｜净含量: 500g｜适用: 全阶段猫咪',
          priceNow: 15,
          qty: 1,
          tags: ['满25减4', '不支持7天无理由退换'],
          imageEmoji: '🐱'
        }
      ]
    },
    {
      id: 'cg-3',
      shopName: 'March Fragrance 三月香氛',
      platform: 'tb',
      selected: false,
      items: [
        {
          id: 'ci-4',
          title: '冰淇淋香薰蜡烛冲杯氛围感礼物甜焦糖波波',
          spec: '香型: 甜焦糖波波｜容量: 220g｜燃烧时长: 40h±｜杯型: 琥珀玻璃杯',
          priceNow: 0,
          qty: 1,
          tags: ['退货宝', '先用后付', '7天无理由退货'],
          imageEmoji: '🕯'
        }
      ]
    }
  ];
}

type Props = {
  avatarUrl?: string;
  nickname: string;
  roleId: string;
  onBack: () => void;
  /** 一次性模型生成的购物快照（购物车/订单/消息/评价/足迹/关注店铺） */
  shoppingSnapshot?: any | null;
  /** 单独生成购物快照 */
  onGenerateShopping?: () => void;
  isGeneratingShopping?: boolean;
  generatingStep?: string | null;
  /** 嵌套页（店铺客服）需将查手机系统状态栏改为纯白时回调 */
  onShoppingStatusBarLightChange?: (light: boolean) => void;
};

export const PhoneInspectShoppingHome: React.FC<Props> = ({
  avatarUrl,
  nickname,
  roleId,
  onBack,
  shoppingSnapshot,
  onGenerateShopping,
  isGeneratingShopping,
  generatingStep,
  onShoppingStatusBarLightChange
}) => {
  type BadgeOrderLike = { status?: string; actions?: string[] };
  const hasSnapshot = !!shoppingSnapshot;

  const [tab, setTab] = React.useState<'mine' | 'cart' | 'message'>('mine');
  const [shopView, setShopView] = React.useState<'home' | 'allOrders' | 'followStores' | 'footprints'>('home');
  const [hideGeneratingMask, setHideGeneratingMask] = React.useState(false);
  const [gameBoard, setGameBoard] = React.useState<Grid2048>(() => create2048Board());
  const [gameScore, setGameScore] = React.useState(0);
  const [gameBest, setGameBest] = React.useState(0);
  const [gameOver, setGameOver] = React.useState(false);
  const [gameMovingTiles, setGameMovingTiles] = React.useState<MoveTile2048[]>([]);
  const [gameMovePhase, setGameMovePhase] = React.useState<'start' | 'run'>('start');
  const [gameMergePulseKeys, setGameMergePulseKeys] = React.useState<string[]>([]);
  const [gameSpawnPopKey, setGameSpawnPopKey] = React.useState<string | null>(null);
  const [gameSpawnPopPhase, setGameSpawnPopPhase] = React.useState<'start' | 'run'>('run');
  const gameAnimRunningRef = React.useRef(false);
  const gameAnimTimerRef = React.useRef<number | null>(null);
  const gamePulseTimerRef = React.useRef<number | null>(null);
  const gameTouchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const [displayProgress, setDisplayProgress] = React.useState(0);
  const [initialOrderFilter, setInitialOrderFilter] = React.useState<OrderFilter>('all');
  const [initialStoreChatShopName, setInitialStoreChatShopName] = React.useState('');
  const tier =
    (shoppingSnapshot?.member?.tier as PhoneInspectShoppingMemberTier | undefined) || pickMemberTier(roleId);
  const tierStyle = TIER_META[tier];
  const messages = React.useMemo<ShoppingMessageItem[]>(
    () => (shoppingSnapshot?.messages?.storeChats as ShoppingMessageItem[]) || [],
    [shoppingSnapshot]
  );
  const totalUnread = messages.reduce((s, m) => s + (m.unread || 0), 0);
  const ordersAll = React.useMemo<BadgeOrderLike[]>(() => {
    const orders = (shoppingSnapshot?.orders as any) || {};
    return ([] as BadgeOrderLike[])
      .concat(orders.pay || [], orders.ship || [], orders.recv || [], orders.refund || [], orders.review || [])
      .filter(Boolean) as BadgeOrderLike[];
  }, [shoppingSnapshot]);

  const orderBadgeCounts = React.useMemo(() => {
    const list = ordersAll;
    return {
      pay: list.filter((o) => o.status === '待付款').length,
      ship: list.filter((o) => o.status === '待发货').length,
      recv: list.filter((o) => o.status === '待收货').length,
      refund: list.filter((o) => /退款|售后|介入|换货/.test(String(o.status || ''))).length,
      // 评价入口不展示红点：这里保留字段是为了与 UI 结构一致
      review: list.filter((o) => (o.actions || []).includes('评价')).length
    };
  }, [ordersAll]);

  const cartGroups = React.useMemo<CartShopGroup[]>(
    () =>
      (((shoppingSnapshot?.cartGroups as CartShopGroup[]) || []).map((g: any) => ({
        ...g,
        items: Array.isArray(g?.items) ? g.items : []
      })) as CartShopGroup[]),
    [shoppingSnapshot]
  );
  const cartItemIds = React.useMemo(() => cartGroups.flatMap((g) => g.items.map((it) => it.id)), [cartGroups]);
  const [cartChecked, setCartChecked] = React.useState<Record<string, boolean>>({});
  React.useEffect(() => {
    setCartChecked((prev) => {
      const next: Record<string, boolean> = {};
      for (const id of cartItemIds) next[id] = !!prev[id];
      return next;
    });
  }, [cartItemIds]);
  // 购物车角标按“条目数”展示，避免和列表可见条目数量不一致（例如 1 条 x2 被误算成 2）。
  const cartCount = cartGroups.reduce((sum, g) => sum + g.items.length, 0);
  const cartAllTotal = cartGroups
    .flatMap((g) => g.items)
    .reduce((s, it) => s + it.priceNow * Math.max(1, it.qty), 0);
  const checkedCount = cartGroups
    .flatMap((g) => g.items)
    .reduce((s, it) => s + (cartChecked[it.id] ? Math.max(1, it.qty) : 0), 0);
  const checkedTotal = cartGroups
    .flatMap((g) => g.items)
    .reduce((s, it) => s + (cartChecked[it.id] ? it.priceNow * Math.max(1, it.qty) : 0), 0);
  const allChecked = cartItemIds.length > 0 && cartItemIds.every((id) => !!cartChecked[id]);

  const toggleItemChecked = React.useCallback((itemId: string) => {
    setCartChecked((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  }, []);
  const toggleGroupChecked = React.useCallback((group: CartShopGroup) => {
    setCartChecked((prev) => {
      const groupAllChecked = group.items.length > 0 && group.items.every((it) => !!prev[it.id]);
      const next = { ...prev };
      for (const it of group.items) next[it.id] = !groupAllChecked;
      return next;
    });
  }, []);
  const toggleAllChecked = React.useCallback(() => {
    setCartChecked((prev) => {
      const nextState = !(cartItemIds.length > 0 && cartItemIds.every((id) => !!prev[id]));
      const next: Record<string, boolean> = { ...prev };
      for (const id of cartItemIds) next[id] = nextState;
      return next;
    });
  }, [cartItemIds]);

  React.useEffect(() => {
    if (!isGeneratingShopping) setHideGeneratingMask(false);
  }, [isGeneratingShopping]);

  const move2048 = React.useCallback((dir: MoveDir2048) => {
    if (gameAnimRunningRef.current) return;
    const prevBoard = clone2048Grid(gameBoard);
    const result = runMove2048(prevBoard, dir);
    if (!result.moved) return;
    gameAnimRunningRef.current = true;
    const nextBoard = result.next;
    const newScore = gameScore + result.gained;
    setGameScore(newScore);
    if (newScore > gameBest) setGameBest(newScore);
    setGameOver(!canMove2048(nextBoard));
    setGameMovingTiles(result.moves.filter((m) => m.fromR !== m.toR || m.fromC !== m.toC));
    setGameMovePhase('start');
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setGameMovePhase('run'));
    });
    if (gameAnimTimerRef.current) window.clearTimeout(gameAnimTimerRef.current);
    gameAnimTimerRef.current = window.setTimeout(() => {
      setGameBoard(nextBoard);
      setGameMovingTiles([]);
      setGameMovePhase('start');
      setGameMergePulseKeys(result.merges.map((m) => `${m.r}-${m.c}`));
      setGameSpawnPopKey(result.spawned ? `${result.spawned.r}-${result.spawned.c}` : null);
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
  }, [gameBoard, gameBest, gameScore]);

  const reset2048 = React.useCallback(() => {
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
    setGameBoard(create2048Board());
    setGameScore(0);
    setGameOver(false);
  }, []);

  React.useEffect(
    () => () => {
      if (gameAnimTimerRef.current) window.clearTimeout(gameAnimTimerRef.current);
      if (gamePulseTimerRef.current) window.clearTimeout(gamePulseTimerRef.current);
    },
    []
  );

  React.useEffect(() => {
    if (!isGeneratingShopping || hideGeneratingMask) {
      setDisplayProgress(0);
      return;
    }
    const target = Math.max(8, calcGeneratingProgress(generatingStep));
    setDisplayProgress((p) => Math.max(p, target));
    const timer = window.setInterval(() => {
      const dynamicTarget = Math.max(target, Math.min(94, calcGeneratingProgress(generatingStep)));
      setDisplayProgress((p) => {
        if (p < dynamicTarget) return Math.min(dynamicTarget, p + 2);
        if (p < 95) return p + 0.3;
        return p;
      });
    }, 650);
    return () => window.clearInterval(timer);
  }, [generatingStep, hideGeneratingMask, isGeneratingShopping]);

  React.useEffect(() => {
    if (!isGeneratingShopping || hideGeneratingMask) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        move2048('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        move2048('right');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        move2048('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        move2048('down');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hideGeneratingMask, isGeneratingShopping, move2048]);

  if (isGeneratingShopping && !hideGeneratingMask) {
    const progress = Math.max(0, Math.min(99, Math.round(displayProgress)));
    const movingFromSet = new Set(gameMovingTiles.map((m) => `${m.fromR}-${m.fromC}`));
    const CELL_SIZE = 64;
    const CELL_GAP = 8;
    const tileOffset = CELL_SIZE + CELL_GAP;
    const boardPixelSize = CELL_SIZE * 4 + CELL_GAP * 3;
    return (
      <div
        style={{
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f2f2f7'
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: '8px 12px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            backgroundColor: '#f2f2f7',
            borderBottom: '1px solid rgba(0,0,0,0.06)'
          }}
        >
          <button
            type="button"
            onClick={onBack}
            style={{
              border: 'none',
              background: 'rgba(255,255,255,0.9)',
              color: '#111827',
              borderRadius: 10,
              padding: '6px 10px',
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(15,23,42,0.08)'
            }}
          >
            ‹ 返回
          </button>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>购物</span>
          <span style={{ width: 72 }} />
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 14px 20px' }}>
          <div style={{ maxWidth: 360, margin: '0 auto' }}>
            <div style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>正在生成内容中，请稍等</div>
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
              {generatingStep || '正在准备生成任务…'}（约 {progress}%）
            </div>

            <div
              style={{
                marginTop: 14,
                background: '#bbada0',
                borderRadius: 10,
                padding: 8,
                position: 'relative',
                overflow: 'hidden',
                touchAction: 'none'
              }}
              onTouchStart={(e) => {
                const t = e.touches?.[0];
                if (!t) return;
                gameTouchStartRef.current = { x: t.clientX, y: t.clientY };
              }}
              onTouchEnd={(e) => {
                const start = gameTouchStartRef.current;
                gameTouchStartRef.current = null;
                const t = e.changedTouches?.[0];
                if (!start || !t) return;
                const dx = t.clientX - start.x;
                const dy = t.clientY - start.y;
                if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
                if (Math.abs(dx) > Math.abs(dy)) {
                  move2048(dx > 0 ? 'right' : 'left');
                } else {
                  move2048(dy > 0 ? 'down' : 'up');
                }
              }}
            >
              <div style={{ width: boardPixelSize, height: boardPixelSize, margin: '0 auto', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    gridTemplateColumns: `repeat(4, ${CELL_SIZE}px)`,
                    gap: CELL_GAP
                  }}
                >
                  {gameBoard.flatMap((row, rIdx) =>
                    row.map((n, cIdx) => {
                      const cellKey = `${rIdx}-${cIdx}`;
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

            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#475569' }}>
                分数 {gameScore}
              </div>
              <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#475569' }}>
                最高 {Math.max(gameBest, gameScore)}
              </div>
              <button
                type="button"
                onClick={reset2048}
                style={{
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  color: '#374151',
                  borderRadius: 8,
                  padding: '7px 10px',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                重开
              </button>
            </div>
            {gameOver ? (
              <div style={{ marginTop: 8, fontSize: 12, color: '#b45309', textAlign: 'center' }}>游戏结束，可点“重开”继续</div>
            ) : null}
            <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>支持手指滑动合成（上下左右）</div>
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 44px)', justifyContent: 'center', gap: 8 }}>
              <span />
              <button type="button" onClick={() => move2048('up')} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>↑</button>
              <span />
              <button type="button" onClick={() => move2048('left')} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>←</button>
              <button type="button" onClick={() => move2048('down')} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>↓</button>
              <button type="button" onClick={() => move2048('right')} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>→</button>
            </div>
            <button
              type="button"
              onClick={() => {
                setHideGeneratingMask(true);
                onBack();
              }}
              style={{
                marginTop: 14,
                border: '1px solid #e5e7eb',
                background: '#fff',
                color: '#374151',
                borderRadius: 999,
                padding: '7px 14px',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              后台生成并返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasSnapshot) {
    return (
      <div
        style={{
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f2f2f7'
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: '8px 12px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            backgroundColor: '#f2f2f7',
            borderBottom: '1px solid rgba(0,0,0,0.06)'
          }}
        >
          <button
            type="button"
            onClick={onBack}
            style={{
              border: 'none',
              background: 'rgba(255,255,255,0.9)',
              color: '#111827',
              borderRadius: 10,
              padding: '6px 10px',
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(15,23,42,0.08)'
            }}
          >
            ‹ 返回
          </button>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>购物</span>
          <button
            type="button"
            onClick={() => onGenerateShopping?.()}
            disabled={!!isGeneratingShopping}
            style={{
              border: 'none',
              background: !!isGeneratingShopping ? '#cbd5e1' : 'linear-gradient(145deg, #f97316 0%, #ef4444 100%)',
              color: '#fff',
              borderRadius: 999,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 800,
              cursor: !!isGeneratingShopping ? 'not-allowed' : 'pointer',
              boxShadow: !!isGeneratingShopping ? 'none' : '0 2px 10px rgba(249,115,22,0.25)'
            }}
          >
            {isGeneratingShopping ? '生成中…' : '生成购物'}
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '24px 16px' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 10 }}>暂无购物数据</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
            请回到查手机面板，勾选“购物”，然后点击“一键生成”。生成完成后，这里会一次性展示购物页的全部内容。
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f2f2f7',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {shopView === 'allOrders' ? (
        <PhoneInspectShoppingOrdersAll
          roleId={roleId}
          nickname={nickname}
          recipientAvatarUrl={avatarUrl}
          initialFilter={initialOrderFilter}
          initialStoreChatShopName={initialStoreChatShopName}
          orders={ordersAll}
          reviews={shoppingSnapshot?.reviews || []}
          storeChats={messages}
          onBack={() => setShopView('home')}
          onShoppingStatusBarLightChange={onShoppingStatusBarLightChange}
        />
      ) : shopView === 'followStores' ? (
        <PhoneInspectShoppingFollowStores
          roleId={roleId}
          nickname={nickname}
          stores={shoppingSnapshot?.followStores || []}
          onBack={() => setShopView('home')}
          onShoppingStatusBarLightChange={onShoppingStatusBarLightChange}
        />
      ) : shopView === 'footprints' ? (
        <PhoneInspectShoppingFootprints
          roleId={roleId}
          nickname={nickname}
          items={shoppingSnapshot?.footprints || []}
          onBack={() => setShopView('home')}
          onShoppingStatusBarLightChange={onShoppingStatusBarLightChange}
        />
      ) : (
        <>
      <div
        style={{
          flexShrink: 0,
          padding: '8px 12px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          backgroundColor: '#f2f2f7',
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            border: 'none',
            background: 'rgba(255,255,255,0.9)',
            color: '#111827',
            borderRadius: 10,
            padding: '6px 10px',
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(15,23,42,0.08)'
          }}
        >
          ‹ 返回
        </button>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>购物</span>
        <button
          type="button"
          onClick={() => onGenerateShopping?.()}
          disabled={!!isGeneratingShopping}
          style={{
            border: 'none',
            background: !!isGeneratingShopping ? '#cbd5e1' : 'linear-gradient(145deg, #f97316 0%, #ef4444 100%)',
            color: '#fff',
            borderRadius: 999,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 800,
            cursor: !!isGeneratingShopping ? 'not-allowed' : 'pointer',
            boxShadow: !!isGeneratingShopping ? 'none' : '0 2px 10px rgba(249,115,22,0.25)'
          }}
        >
          {isGeneratingShopping ? '生成中…' : '生成购物'}
        </button>
      </div>

      {tab === 'cart' ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            backgroundColor: '#f5f5f5',
            position: 'relative'
          }}
        >
          <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #f1f5f9', padding: '10px 12px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 34 / 2, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>购物车</span>
                <span style={{ fontSize: 16 / 2, color: '#64748b', fontWeight: 600 }}>({cartCount})</span>
              </div>
              <span />
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 150 }}>
            {cartGroups.length ? (
              cartGroups.map((g) => (
              <div key={g.id} style={{ backgroundColor: '#fff', marginTop: 8, padding: '10px 10px 2px' }}>
                {(() => {
                  const platformLabel = pickCartPlatformLabel(`${roleId}|${g.id}|${g.shopName}`);
                  const groupChecked = g.items.length > 0 && g.items.every((it) => !!cartChecked[it.id]);
                  return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => toggleGroupChecked(g)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: groupChecked ? 'none' : '1.6px solid #d1d5db',
                      backgroundColor: groupChecked ? '#f97316' : '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: 'pointer',
                      padding: 0
                    }}
                    aria-label={groupChecked ? '取消勾选店铺' : '勾选店铺'}
                  >
                    {groupChecked ? <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span> : null}
                  </button>
                  <span style={{ fontSize: 27 / 2, fontWeight: 700, color: platformLabel.color }}>
                    {platformLabel.text}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {g.shopName}
                  </span>
                  <span style={{ color: '#cbd5e1' }}>›</span>
                </div>
                  );
                })()}

                {g.items.map((it) => (
                  <div key={it.id} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <button
                      type="button"
                      onClick={() => toggleItemChecked(it.id)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: cartChecked[it.id] ? 'none' : '1.6px solid #d1d5db',
                        backgroundColor: cartChecked[it.id] ? '#f97316' : '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 18,
                        cursor: 'pointer',
                        padding: 0
                      }}
                      aria-label={cartChecked[it.id] ? '取消勾选商品' : '勾选商品'}
                    >
                      {cartChecked[it.id] ? <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span> : null}
                    </button>
                    <div style={{ width: 78, flexShrink: 0 }}>
                      <div style={{ width: 78, height: 78, borderRadius: 8, backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                        {it.imageEmoji || '📦'}
                      </div>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 15, color: '#111827', fontWeight: 400, lineHeight: 1.25 }}>{it.title}</div>
                          {it.spec ? (
                            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                              {it.spec} <span style={{ color: '#cbd5e1' }}>›</span>
                            </div>
                          ) : null}
                        </div>
                        <div style={{ fontSize: 22 / 2, color: '#64748b' }}>×{it.qty}</div>
                      </div>
                      {it.tags?.length ? (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {it.tags.map((tag) => (
                            <span key={tag} style={{ fontSize: 11, color: '#9ca3af', backgroundColor: '#f8fafc', borderRadius: 4, padding: '1px 4px' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 29 / 2, color: '#f97316', fontWeight: 800 }}>¥{it.priceNow.toFixed(2)}</span>
                        {typeof it.priceOld === 'number' ? (
                          <span style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'line-through' }}>¥{it.priceOld.toFixed(0)}</span>
                        ) : null}
                      </div>
                      {it.discount ? (
                        <div style={{ marginTop: 2, fontSize: 13, color: '#f59e0b' }}>{it.discount}</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              ))
            ) : (
              <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 8 }}>暂无购物车数据</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>请回到查手机面板勾选“购物”并点击“一键生成”。</div>
              </div>
            )}
          </div>

          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 68,
              backgroundColor: '#fff',
              borderTop: '1px solid #e5e7eb',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
              <button
                type="button"
                onClick={toggleAllChecked}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: allChecked ? 'none' : '1.6px solid #d1d5db',
                  backgroundColor: allChecked ? '#f97316' : '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
                aria-label={allChecked ? '取消全选' : '全选'}
              >
                {allChecked ? <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span> : null}
              </button>
              <span style={{ fontSize: 10 }}>全选</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 16, color: '#111827' }}>
                合计: <span style={{ color: '#f97316', fontWeight: 800 }}>¥{checkedTotal.toFixed(2)}</span>
              </div>
              <button
                type="button"
                style={{
                  border: 'none',
                  backgroundColor: checkedCount > 0 ? '#f97316' : '#cbd5e1',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '10px 26px',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: checkedCount > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                结算{checkedCount > 0 ? `(${checkedCount})` : ''}
              </button>
            </div>
          </div>
        </div>
      ) : tab === 'message' ? (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', backgroundColor: '#fff', paddingBottom: 88 }}>
          <div
            style={{
              padding: '12px 14px 10px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start'
            }}
          >
            <div style={{ fontSize: 34 / 2, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>消息</span>
              <span style={{ fontSize: 16 / 2, color: '#64748b', fontWeight: 600 }}>({messages.length})</span>
            </div>
          </div>
          {messages.length ? (
            messages.map((m, idx) => {
              const iconBg = m.ordered ? 'linear-gradient(145deg,#111827 0%,#374151 100%)' : 'linear-gradient(145deg,#fb923c 0%,#f97316 100%)';
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setInitialOrderFilter('all');
                    setInitialStoreChatShopName(String(m.shopName || '').trim());
                    setShopView('allOrders');
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: '#fff',
                    borderBottom: idx === messages.length - 1 ? 'none' : '1px solid #f1f5f9',
                    padding: '10px 12px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer'
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 10,
                      background: iconBg,
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {(m.shopName || '店').slice(0, 2)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>
                        {m.shopName}
                      </div>
                      <div style={{ fontSize: 14, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.preview}</div>
                    </div>
                    <div
                      style={{
                        width: 38,
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-start',
                        gap: 6
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#cbd5e1', whiteSpace: 'nowrap', lineHeight: 1 }}>{m.time}</div>
                      {m.unread ? (
                        <span
                          style={{
                            minWidth: 18,
                            height: 18,
                            padding: '0 6px',
                            borderRadius: 999,
                            backgroundColor: '#f97316',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {m.unread}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div style={{ padding: '36px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 8 }}>暂无消息数据</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>请先在查手机面板勾选“购物”并点击“一键生成”。</div>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '0 12px 88px'
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 14,
              padding: '14px 14px 16px',
              marginBottom: 12,
              boxShadow: '0 2px 10px rgba(15,23,42,0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: '#e5e7eb',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#6b7280', fontWeight: 700, fontSize: 18 }}>{nickname.slice(0, 1)}</span>
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: 6,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {nickname || '微信昵称'}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: tierStyle.bg,
                    color: tierStyle.color
                  }}
                >
                  {tierStyle.label}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 14,
              padding: '12px 12px 14px',
              marginBottom: 12,
              boxShadow: '0 2px 10px rgba(15,23,42,0.06)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
                padding: '0 2px'
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>我的订单</span>
              <button
                type="button"
                onClick={() => {
                  setInitialOrderFilter('all');
                  setInitialStoreChatShopName('');
                  setShopView('allOrders');
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '4px 2px',
                  fontSize: 12,
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                全部 ›
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                gap: 4,
                textAlign: 'center'
              }}
            >
              {ORDER_ITEMS.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => {
                    setInitialOrderFilter(row.key);
                    setInitialStoreChatShopName('');
                    setShopView('allOrders');
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: '6px 2px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <OrderGlyph kind={row.key} />
                    {row.key !== 'review' && orderBadgeCounts[row.key] > 0 ? (
                      <span
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -8,
                          minWidth: 16,
                          height: 16,
                          borderRadius: 999,
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 4px',
                          lineHeight: 1
                        }}
                      >
                        {orderBadgeCounts[row.key] > 99 ? '99+' : orderBadgeCounts[row.key]}
                      </span>
                    ) : null}
                  </span>
                  <span style={{ fontSize: 11, color: '#475569', lineHeight: 1.2 }}>{row.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                padding: '14px 12px',
                minHeight: 88,
                boxShadow: '0 2px 10px rgba(15,23,42,0.06)'
              }}
              role="button"
              tabIndex={0}
              onClick={() => setShopView('followStores')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setShopView('followStores');
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 6 }}>关注店铺</div>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>常逛的好店与上新提醒</div>
            </div>
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                padding: '14px 12px',
                minHeight: 88,
                boxShadow: '0 2px 10px rgba(15,23,42,0.06)'
              }}
              role="button"
              tabIndex={0}
              onClick={() => setShopView('footprints')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setShopView('footprints');
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 6 }}>足迹</div>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>最近浏览过的商品</div>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '0px 12px 3px',
          paddingBottom: 'max(0px, env(safe-area-inset-bottom, 0px))',
          backgroundColor: '#fff',
          borderTop: '1px solid #e7e7e7',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          boxShadow: '0 -4px 16px rgba(15,23,42,0.06)'
        }}
      >
        <button
          type="button"
          onClick={() => setTab('mine')}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            padding: '1px 8px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            color: tab === 'mine' ? '#ea580c' : '#94a3b8',
            fontSize: 10,
            fontWeight: tab === 'mine' ? 700 : 500
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          我的购物
        </button>
        <button
          type="button"
          onClick={() => setTab('cart')}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            padding: '1px 8px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            color: tab === 'cart' ? '#ea580c' : '#94a3b8',
            fontSize: 10,
            fontWeight: tab === 'cart' ? 700 : 500
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M7 9h10l-1.2 8H8.2L7 9Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M9.2 9V7.8A2.8 2.8 0 0 1 12 5a2.8 2.8 0 0 1 2.8 2.8V9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          购物车
        </button>
        <button
          type="button"
          onClick={() => setTab('message')}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            padding: '1px 8px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            color: tab === 'message' ? '#ea580c' : '#94a3b8',
            fontSize: 10,
            fontWeight: tab === 'message' ? 700 : 500
          }}
        >
          <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5.5 8.5A2.5 2.5 0 0 1 8 6h8a2.5 2.5 0 0 1 2.5 2.5v5A2.5 2.5 0 0 1 16 16h-4.2l-2.8 2v-2H8a2.5 2.5 0 0 1-2.5-2.5v-5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <circle cx="9.8" cy="11" r="0.9" fill="currentColor" />
              <circle cx="13.9" cy="11" r="0.9" fill="currentColor" />
            </svg>
            {totalUnread > 0 ? (
              <span
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -8,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 999,
                  backgroundColor: '#f97316',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px'
                }}
              >
                {Math.min(99, totalUnread)}
              </span>
            ) : null}
          </div>
          消息
        </button>
      </div>
        </>
      )}
    </div>
  );
};

const OrderGlyph: React.FC<{ kind: string }> = ({ kind }) => {
  const c = '#64748b';
  const w = 26;
  const h = 26;
  const vb = '0 0 24 24';
  switch (kind) {
    case 'pay':
      return (
        <svg width={w} height={h} viewBox={vb} fill="none" aria-hidden>
          <rect x="4" y="6" width="16" height="12" rx="2" stroke={c} strokeWidth="1.5" />
          <path d="M4 10h16" stroke={c} strokeWidth="1.5" />
          <path d="M8 14h3" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'ship':
      return (
        <svg width={w} height={h} viewBox={vb} fill="none" aria-hidden>
          {/* 待发货：立体纸箱（略压低整体高度） */}
          <path
            d="M12 3.5 4.5 7v9.5l7.5 3.5 7.5-3.5V7l-7.5-3.5Z"
            stroke={c}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M4.5 7 12 10.75 19.5 7M12 10.75v9.25"
            stroke={c}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'recv':
      return (
        <svg width={w} height={h} viewBox={vb} fill="none" aria-hidden>
          {/* 待收货：厢式卡车侧视（加高车身） */}
          <path
            d="M3 7.5h10v8.5H3V7.5Z"
            stroke={c}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M13 7.5h3.4l3.1 3.6V16H13V7.5Z"
            stroke={c}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M15.2 9.2 17.6 14.2" stroke={c} strokeWidth="1.25" strokeLinecap="round" />
          <path d="M6 10.2h4.5M6 13.2h4.5M6 16h4.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity={0.45} />
          <circle cx="7" cy="18.35" r="1.65" stroke={c} strokeWidth="1.5" fill="none" />
          <circle cx="17.2" cy="18.35" r="1.65" stroke={c} strokeWidth="1.5" fill="none" />
          <path d="M1.5 19.35h21" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity={0.35} />
        </svg>
      );
    case 'refund':
      return (
        <svg width={w} height={h} viewBox={vb} fill="none" aria-hidden>
          {/* 退款/售后：双向回流箭头 */}
          <path d="M4 9h10" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6 7l-2 2 2 2" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 15H10" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M18 17l2-2-2-2" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'review':
      return (
        <svg width={w} height={h} viewBox={vb} fill="none" aria-hidden>
          <path
            d="M6 5h12v12H6V5Z"
            stroke={c}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M8 9h8M8 12h5" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 16h6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width={w} height={h} viewBox={vb} fill="none" aria-hidden>
          <circle cx="12" cy="12" r="7" stroke={c} strokeWidth="1.5" />
        </svg>
      );
  }
};
