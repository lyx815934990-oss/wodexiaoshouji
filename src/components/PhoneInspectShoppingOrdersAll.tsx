import React from 'react';
import { PhoneInspectShoppingLogistics } from './PhoneInspectShoppingLogistics';
import { PhoneInspectShoppingStoreChat } from './PhoneInspectShoppingStoreChat';
import { PhoneInspectAfterSalesProgress } from './PhoneInspectAfterSalesProgress';

const ACCENT = '#ff5000';
/** 与查手机系统状态栏、购物顶栏一致 */
const CHROME_BG = '#f2f2f7';
/** 订单列表区浅灰，衬托白卡片 */
const LIST_BG = '#f5f5f5';

export type OrderFilter = 'all' | 'pay' | 'ship' | 'recv' | 'refund' | 'review';
export type OrderBadgeKey = 'pay' | 'ship' | 'recv' | 'refund' | 'review';

type MockProduct = {
  title: string;
  spec: string;
  tag?: { text: string; color: 'green' | 'red' };
  price: string;
  qty: number;
};

type MockOrder = {
  id: string;
  shopName: string;
  shopTag: 'tb' | 'tm';
  status: string;
  products: MockProduct[];
  actualPay: string;
  actions: string[];
  primaryAction?: string;
  /** 待收货等：物流单号 */
  trackingNo?: string;
  /** 售后申请类型 */
  afterSalesType?: 'refund_only' | 'return_refund' | 'exchange';
  /** 售后流转 */
  afterSalesFlow?: 'merchant_agree' | 'merchant_reject';
  /** 退货物流（角色寄出） */
  returnTrackingNo?: string;
  /** 换货时商家回寄物流 */
  exchangeTrackingNo?: string;
  /** 店铺客服：地址/电话（来自模型） */
  detailAddress?: string;
  displayPhone?: string;
  /** 店铺客服：完整对话线程（来自模型） */
  storeChatThread?: {
    headerTimeText?: string;
    turns: Array<{ from: 'staff' | 'role'; name?: string; text: string }>;
  };
  /** 物流：运单时间线（来自模型） */
  logisticsTimeline?: Array<{ time: string; title?: string; body: string; current?: boolean }>;
  /** 售后进度：节点列表（来自模型） */
  afterSalesNodes?: Array<{ time: string; title: string; detail: string; done: boolean; current?: boolean }>;
  afterSalesNo?: string;
  refundReason?: string;
  evidenceNote?: string;
};

type ReviewPost = {
  id: string;
  title: string;
  images: Array<{ url: string; desc: string }>;
  viewed: number;
  liked: number;
  commented: number;
  forceNamedExample?: boolean;
  forceAnonymousExample?: boolean;
  /** 评价详情评论树（根节点通常为“作者评论”，其下包含嵌套回复） */
  comments?: Array<any>;
  /** 点赞栏：主评价的点赞用户列表 */
  likeUsers?: Array<any>;
};

const REVIEW_IMAGE_PLACEHOLDER_URL = new URL('../../image/图片预览图（未接api）.png', import.meta.url).toString();

/** 评论/回复行右侧：爱心 + 总点赞数。仅当当前角色点过赞时用橙色；网友点赞只加数字、仍为灰色 */
const CommentRowHeartLikes: React.FC<{ count: number; roleLiked?: boolean }> = ({ count, roleLiked = false }) => {
  const orange = roleLiked;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        flexShrink: 0,
        minWidth: 24
      }}
      title={roleLiked ? `你已赞 · 共 ${count} 赞` : `共 ${count} 赞`}
    >
      <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={orange ? '#f97316' : 'none'}
          stroke={orange ? '#f97316' : '#cbd5e1'}
          strokeWidth="1.35"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          fontSize: 10,
          color: orange ? '#f97316' : '#94a3b8',
          fontWeight: orange ? 600 : 500,
          lineHeight: 1
        }}
      >
        {count}
      </span>
    </div>
  );
};

function mockOrdersForRole(roleId: string): MockOrder[] {
  const seed = roleId || 'guest';
  const shops =
    seed.length % 2 === 0
      ? ['Lumi 周边设计所', '麦乐多宠物专营店']
      : ['星屑杂货铺', '夜航船图书专营店'];
  return [
    {
      id: 'o1',
      shopName: shops[0],
      shopTag: 'tb',
      status: '交易成功',
      products: [
        {
          title: '角色定制亚克力立牌（预售）',
          spec: '【标准款】含底座',
          tag: { text: '不支持7天无理由', color: 'green' },
          price: '¥46.00',
          qty: 1
        }
      ],
      actualPay: '¥43.20',
      actions: ['更多', '评价', '再买一单'],
      primaryAction: '再买一单'
    },
    {
      id: 'o2',
      shopName: shops[1],
      shopTag: 'tm',
      status: '交易成功',
      products: [
        {
          title: '剧情同款马克杯礼盒',
          spec: '1 套入 · 附贺卡',
          tag: { text: '退货宝', color: 'red' },
          price: '¥199.00',
          qty: 1
        }
      ],
      actualPay: '¥199.00',
      actions: ['申请售后', '加入购物车'],
      primaryAction: '再买一单'
    },
    {
      id: 'o3a',
      shopName: '轻语鲜花同城店',
      shopTag: 'tb',
      status: '待收货',
      products: [
        {
          title: '生日花束·角色印象配色',
          spec: '中号 · 含贺卡',
          price: '¥128.00',
          qty: 1
        }
      ],
      actualPay: '¥128.00',
      actions: ['查看物流', '延长收货', '再买一单'],
      primaryAction: '再买一单',
      trackingNo: 'LUMI20388534690'
    },
    {
      id: 'o3',
      shopName: '云端音像工作室',
      shopTag: 'tb',
      status: '待发货',
      products: [
        {
          title: '角色印象曲数字专辑',
          spec: '1天体验 + 完整版兑换',
          price: '¥1.46',
          qty: 1
        }
      ],
      actualPay: '¥1.46',
      actions: ['提醒发货', '修改地址'],
      primaryAction: '再买一单'
    },
    {
      id: 'o4',
      shopName: '朝雾生活馆',
      shopTag: 'tb',
      status: '待付款',
      products: [
        {
          title: '桌面香薰蜡烛礼盒',
          spec: '白桃乌龙 · 2杯装',
          price: '¥89.00',
          qty: 1
        }
      ],
      actualPay: '¥89.00',
      actions: ['取消订单', '找人代付'],
      primaryAction: '去支付'
    },
    {
      id: 'o5',
      shopName: '山岚家居旗舰店',
      shopTag: 'tm',
      status: '退款中',
      products: [
        {
          title: '法兰绒四件套（春季款）',
          spec: '1.8m 床 · 云雾灰',
          tag: { text: '已提交售后', color: 'red' },
          price: '¥269.00',
          qty: 1
        }
      ],
      actualPay: '¥269.00',
      actions: ['查看进度', '联系商家'],
      primaryAction: '补充凭证',
      afterSalesType: 'return_refund',
      afterSalesFlow: 'merchant_agree',
      returnTrackingNo: 'SF309845672112'
    },
    {
      id: 'o6',
      shopName: '青木家纺旗舰店',
      shopTag: 'tm',
      status: '平台介入中',
      products: [
        {
          title: '牛奶绒冬季被套（加厚）',
          spec: '200*230cm · 奶咖色',
          tag: { text: '售后处理中', color: 'red' },
          price: '¥229.00',
          qty: 1
        }
      ],
      actualPay: '¥229.00',
      actions: ['查看进度', '联系商家'],
      primaryAction: '补充凭证',
      afterSalesType: 'refund_only',
      afterSalesFlow: 'merchant_reject'
    },
    {
      id: 'o7',
      shopName: '霜月数码配件店',
      shopTag: 'tb',
      status: '换货处理中',
      products: [
        {
          title: '磁吸手机壳（防摔款）',
          spec: '适配 iPhone 15 Pro',
          tag: { text: '已同意换货', color: 'red' },
          price: '¥79.00',
          qty: 1
        }
      ],
      actualPay: '¥79.00',
      actions: ['查看进度', '联系商家'],
      primaryAction: '查看新物流',
      afterSalesType: 'exchange',
      afterSalesFlow: 'merchant_agree',
      returnTrackingNo: 'YTO784532110998',
      exchangeTrackingNo: 'JDVA2038871201'
    }
  ];
}

function buildReviewPosts(roleId: string): ReviewPost[] {
  const even = roleId.length % 2 === 0;
  return [
    {
      id: 'r1',
      title: even ? '非常满意，做工细节超出预期。' : '颜色很正，包装和质感都很在线。',
      images: [
        {
          url: REVIEW_IMAGE_PLACEHOLDER_URL,
          desc: even ? '角色商城道具兑换页面截图，价格与金币数量清晰可见。' : '商城人物道具预览截图，展示了当前可购买条目与折扣标签。'
        },
        {
          url: REVIEW_IMAGE_PLACEHOLDER_URL,
          desc: '评价上传图2：商品细节近景，展示贴图与按钮样式。'
        },
        {
          url: REVIEW_IMAGE_PLACEHOLDER_URL,
          desc: '评价上传图3：商城列表全景，包含顶部货币与商品卡片。'
        }
      ],
      viewed: even ? 117 : 126,
      // 与详情页评论树一致：3 条评论、总点赞 6
      liked: 6,
      commented: 3
    },
    {
      id: 'r2',
      title: even ? '发货快，收到后马上就用上了。' : '实物比图里还好看，推荐购买。',
      images: [
        {
          url: REVIEW_IMAGE_PLACEHOLDER_URL,
          desc: even ? '商城列表第二张截图，包含角色立绘与不同档位价格。' : '商城页面细节截图，可见顶部金币栏和商品卡片信息。'
        },
        {
          url: REVIEW_IMAGE_PLACEHOLDER_URL,
          desc: '评价上传图2：商品兑换弹窗与确认按钮。'
        }
      ],
      viewed: even ? 89 : 96,
      // 与详情页评论树一致：3 条评论、总点赞 6
      liked: 6,
      commented: 3
    },
    {
      id: 'r3-example-named',
      title: '【不匿名示例】这条评价用于展示角色实名评价时的样式效果。',
      images: [
        {
          url: REVIEW_IMAGE_PLACEHOLDER_URL,
          desc: '示例图片描述：角色选择不匿名评价时，作者名称将展示为昵称(我)。'
        },
        {
          url: REVIEW_IMAGE_PLACEHOLDER_URL,
          desc: '示例图片描述：实名评价支持多图上传与左右滑动查看。'
        }
      ],
      viewed: 42,
      liked: 6,
      commented: 3,
      forceNamedExample: true
    },
    {
      id: 'r4-example-anon',
      title: '【匿名示例】这条评价用于展示匿名评价时的样式效果（不受角色匿名状态影响）。',
      images: [
        {
          url: REVIEW_IMAGE_PLACEHOLDER_URL,
          desc: '匿名评价示例图：展示图片翻转和描述展示的效果。'
        },
        {
          url: REVIEW_IMAGE_PLACEHOLDER_URL,
          desc: '匿名评价示例图2：展示多图左右滑动查看的效果。'
        }
      ],
      viewed: even ? 66 : 58,
      // 与详情页评论树一致：评论 3、总点赞 6
      liked: 6,
      commented: 3,
      forceAnonymousExample: true
    }
  ];
}

function shouldAnonymousReview(roleId: string): boolean {
  let h = 0;
  for (let i = 0; i < roleId.length; i++) h = (h * 33 + roleId.charCodeAt(i)) | 0;
  return (Math.abs(h) & 1) === 0;
}

function filterOrders(list: any[], f: OrderFilter): any[] {
  if (f === 'all') return list;
  if (f === 'pay') return list.filter((o) => o.status === '待付款');
  if (f === 'ship') return list.filter((o) => o.status === '待发货');
  if (f === 'recv') return list.filter((o) => o.status === '待收货');
  if (f === 'refund') return list.filter((o) => /退款|售后|介入|换货/.test(o.status));
  if (f === 'review') return list.filter((o) => (o.actions || []).includes('评价'));
  return list;
}

export function buildOrderBadgeCounts(roleId: string): Record<OrderBadgeKey, number> {
  const list = mockOrdersForRole(roleId);
  return {
    pay: list.filter((o) => o.status === '待付款').length,
    ship: list.filter((o) => o.status === '待发货').length,
    recv: list.filter((o) => o.status === '待收货').length,
    refund: list.filter((o) => /退款|售后|介入|换货/.test(o.status)).length,
    // 评价入口：已交易成功但仍存在“评价”操作按钮，才计入待评价
    review: list.filter((o) => o.actions.includes('评价')).length
  };
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function fakeDisplayPhone(seed: string): string {
  const h = hashSeed(seed);
  const tail = String(h % 100000000).padStart(8, '0');
  return `133${tail}`;
}

function fakeDetailAddress(seed: string): string {
  const areas = [
    '重庆市渝中区解放碑街道·剧情里巷 12 栋 1 单元 602',
    '浙江省杭州市西湖区·星桥南路 8 号院 3 幢 902',
    '上海市静安区·剧情路 66 弄 5 号 101 室'
  ];
  return areas[hashSeed(seed) % areas.length];
}

/** 占位或未写入模型数据时的地址/电话（与订单 id 绑定，避免写死「示例地址」） */
function resolveOrderDetailAddress(order: any, roleId: string): string {
  const raw = String(order?.detailAddress || '').trim();
  if (raw && !/请生成|示例地址|（示例）|剧情小区/.test(raw)) return raw;
  return fakeDetailAddress(`${roleId}|${order?.id || 'order'}`);
}

function resolveOrderDisplayPhone(order: any, roleId: string): string {
  const raw = String(order?.displayPhone || '').trim();
  if (raw && !/请生成|号码已保护/.test(raw)) return raw;
  const seed = `${roleId}|${order?.id || 'order'}`;
  const h = hashSeed(seed);
  const tail = String(h % 100000000).padStart(8, '0');
  return `133${tail}`;
}

type StoreChatRow = {
  id?: string;
  shopName: string;
  time?: string;
  productTitle?: string;
  thread?: Array<{ from: 'staff' | 'role'; name?: string; text: string; time?: string }>;
};

function resolveStoreChatForOrder(order: any, storeChats: StoreChatRow[] | undefined) {
  const embedded = order?.storeChatThread?.turns;
  if (Array.isArray(embedded) && embedded.length > 0) {
    return {
      threadTurns: embedded.map((t: any) => ({
        from: t.from,
        name: t.name,
        text: t.text
      })),
      headerTimeText: order.storeChatThread?.headerTimeText as string | undefined
    };
  }
  const shop = String(order?.shopName || '').trim();
  const p0 = String(order?.products?.[0]?.title || '').trim();
  const list = storeChats || [];
  let sc: StoreChatRow | undefined = list.find((s) => String(s.shopName || '').trim() === shop);
  if (!sc && p0) sc = list.find((s) => String(s.productTitle || '').trim() === p0);
  if (!sc && list.length === 1) sc = list[0];
  return {
    threadTurns: sc?.thread?.map((t) => ({ from: t.from, name: t.name, text: t.text })),
    headerTimeText: sc?.time
  };
}

const AFTER_SALES_ACTION_LABELS = new Set([
  '查看进度',
  '退款详情',
  '售后详情',
  '查看售后详情',
  '查看退款详情',
  '退款进度',
  '售后进度'
]);

function isAfterSalesActionLabel(a: string): boolean {
  const t = (a || '').trim();
  if (AFTER_SALES_ACTION_LABELS.has(t)) return true;
  return /退款详情|售后详情|查看.*进度/.test(t);
}

function countReviewCommentTree(nodes: any[]): number {
  if (!Array.isArray(nodes)) return 0;
  let c = 0;
  for (const n of nodes) {
    c += 1;
    if (Array.isArray(n?.replies) && n.replies.length) c += countReviewCommentTree(n.replies);
  }
  return c;
}

function countPostComments(post: any): number {
  const comments = (post as any)?.comments || (post as any)?.commentTree || [];
  return countReviewCommentTree(comments);
}

function countPostLikes(post: any): number {
  const likeUsers = Array.isArray((post as any)?.likeUsers) ? (post as any).likeUsers.length : 0;
  const liked = Number((post as any)?.liked ?? 0) || 0;
  // 口径统一：有点赞用户列表时按列表人数；否则按计数字段。
  return likeUsers > 0 ? likeUsers : liked;
}

function pickOrderPlatformLabel(seed: string): { text: 'Lumi购' | 'LULU GO'; bg: string } {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const useLulu = Math.abs(h) % 2 === 1;
  return useLulu
    ? { text: 'LULU GO', bg: '#ef4444' }
    : { text: 'Lumi购', bg: '#f97316' };
}

function normalizeReviewKeyText(v: any): string {
  return String(v ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeReviewStem(v: any): string {
  return normalizeReviewKeyText(v)
    .replace(/（补充\d+）/g, '')
    .replace(/\(补充\d+\)/g, '')
    .replace(/补充\d+/g, '')
    .trim();
}

function textJaccard(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const sa = new Set(Array.from(a));
  const sb = new Set(Array.from(b));
  let inter = 0;
  sa.forEach((ch) => {
    if (sb.has(ch)) inter += 1;
  });
  const union = sa.size + sb.size - inter;
  return union > 0 ? inter / union : 0;
}

function getResolvedCommentCount(post: any): number {
  const tree = countPostComments(post);
  const commented = Number((post as any)?.commented ?? 0) || 0;
  return tree > 0 ? tree : commented;
}

function getResolvedLikeCount(post: any): number {
  return countPostLikes(post);
}

function reviewThemeKey(v: any): string {
  const t = normalizeReviewStem(v)
    .replace(/[^\u4e00-\u9fa5a-z0-9]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return 'other';
  const K: Array<{ k: string; words: string[] }> = [
    { k: 'sound', words: ['音质', '低音', '高音', '解析', '声场', '降噪', '耳机', '音箱'] },
    { k: 'comfort', words: ['舒适', '脚感', '尺码', '贴合', '穿着', '手感', '轻便'] },
    { k: 'look', words: ['颜值', '外观', '设计', '配色', '做工', '质感', '风格'] },
    { k: 'logistics', words: ['物流', '发货', '到货', '包装', '签收', '配送', '快递'] },
    { k: 'price', words: ['价格', '性价比', '优惠', '券后', '活动', '折扣'] },
    { k: 'service', words: ['客服', '售后', '退款', '退货', '换货', '响应'] }
  ];
  for (const g of K) {
    if (g.words.some((w) => t.includes(w))) return g.k;
  }
  const tokens = t.split(' ').filter(Boolean).slice(0, 2);
  return tokens.join('_') || 'other';
}

function isRoleLikeReviewAuthor(name: string): boolean {
  const t = String(name || '').trim();
  if (!t) return false;
  return /(\(我\)|匿名买家|买家\(我\)|作者)/.test(t);
}

const PILL_FILTERS: { key: OrderFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pay', label: '待付款' },
  { key: 'ship', label: '待发货' },
  { key: 'recv', label: '待收货' },
  { key: 'refund', label: '退款/售后' },
  { key: 'review', label: '评价' }
];

type Props = {
  roleId: string;
  nickname: string;
  recipientAvatarUrl?: string;
  initialFilter?: OrderFilter;
  initialStoreChatShopName?: string;
  /** 一次性模型生成的订单（扁平数组） */
  orders?: any[];
  /** 一次性模型生成的评价列表 */
  reviews?: ReviewPost[];
  /** 一次性模型生成的店铺消息（用于店铺客服对话） */
  storeChats?: Array<{
    id?: string;
    shopName: string;
    time?: string;
    /** 与订单首行商品标题一致时可用来匹配店铺会话（店名不一致时的兜底） */
    productTitle?: string;
    thread?: Array<{ from: 'staff' | 'role'; name?: string; text: string; time?: string }>;
  }>;
  onBack: () => void;
  onShoppingStatusBarLightChange?: (light: boolean) => void;
};

export const PhoneInspectShoppingOrdersAll: React.FC<Props> = ({
  roleId,
  nickname,
  recipientAvatarUrl,
  initialFilter = 'all',
  initialStoreChatShopName,
  orders: ordersProp,
  reviews: reviewsProp,
  storeChats,
  onBack,
  onShoppingStatusBarLightChange
}) => {
  const normalizeOrder = React.useCallback((o: any): any => {
    const src = o && typeof o === 'object' ? o : {};
    const products = Array.isArray(src.products) ? src.products.filter(Boolean) : [];
    const actions = Array.isArray(src.actions) ? src.actions.filter((a: any) => typeof a === 'string' && a.trim()) : [];
    return {
      ...src,
      id: String(src.id || `order-${Math.random().toString(36).slice(2, 8)}`),
      shopName: String(src.shopName || '官方旗舰店').trim() || '官方旗舰店',
      shopTag: src.shopTag === 'tm' ? 'tm' : 'tb',
      status: String(src.status || '').trim() || '待付款',
      products: products.length
        ? products
        : [
            {
              title: '商品',
              spec: '',
              price: '¥0.00',
              qty: 1
            }
          ],
      actualPay: String(src.actualPay || '¥0.00'),
      actions
    };
  }, []);
  const [pill, setPill] = React.useState<OrderFilter>(initialFilter);
  const [logisticsOrderId, setLogisticsOrderId] = React.useState<string | null>(null);
  const [storeChatOrderId, setStoreChatOrderId] = React.useState<string | null>(null);
  const [afterSalesOrderId, setAfterSalesOrderId] = React.useState<string | null>(null);
  const [reviewDetailId, setReviewDetailId] = React.useState<string | null>(null);
  const [reviewDetailTab, setReviewDetailTab] = React.useState<'comment' | 'like'>('comment');
  const [reviewDetailImageIndex, setReviewDetailImageIndex] = React.useState(0);
  const [standaloneStoreChat, setStandaloneStoreChat] = React.useState<StoreChatRow | null>(null);
  const cameFromMessageList = String(initialStoreChatShopName || '').trim().length > 0;
  const orders = React.useMemo(() => (ordersProp || []).map((o) => normalizeOrder(o)), [ordersProp, normalizeOrder]);
  const visible = React.useMemo(() => filterOrders(orders, pill), [orders, pill]);
  const reviewPosts = React.useMemo(() => {
    const src = Array.isArray(reviewsProp) ? reviewsProp : [];
    const kept: any[] = [];
    const signatures: string[] = [];
    const productThemeSeen = new Set<string>();
    src.forEach((p) => {
      const titleStem = normalizeReviewStem((p as any)?.title);
      const productStem = normalizeReviewStem(
        (p as any)?.productTitle || (p as any)?.productName || (p as any)?.goodsTitle
      );
      const firstDesc = normalizeReviewStem(String((p as any)?.images?.[0]?.desc || '').trim());
      const theme = reviewThemeKey(`${titleStem} ${firstDesc}`);
      const ptKey = `${productStem || 'unknown'}|${theme}`;
      if (productThemeSeen.has(ptKey)) return;
      const sig = `${titleStem}|${productStem}|${firstDesc}`;
      const semText = `${titleStem}${productStem}${firstDesc}`;
      const duplicated = signatures.some((prev) => {
        if (prev === sig) return true;
        const prevSem = prev.replace(/\|/g, '');
        return textJaccard(prevSem, semText) >= 0.92;
      });
      if (!duplicated) {
        kept.push(p);
        signatures.push(sig);
        productThemeSeen.add(ptKey);
      }
    });
    return kept;
  }, [reviewsProp]);
  const [reviewImageFlipped, setReviewImageFlipped] = React.useState<Record<string, boolean>>({});
  const isAnonymousReview = React.useMemo(() => shouldAnonymousReview(roleId), [roleId]);
  const reviewAuthor = isAnonymousReview ? '匿名买家(我)' : `${nickname || '买家'}(我)`;
  const reviewStats = React.useMemo(
    () => ({
      viewed: reviewPosts.reduce((s, p) => s + p.viewed, 0),
      liked: reviewPosts.reduce((s, p) => s + getResolvedLikeCount(p), 0),
      commented: reviewPosts.reduce((s, p) => s + getResolvedCommentCount(p), 0)
    }),
    [reviewPosts]
  );

  React.useEffect(() => {
    setPill(initialFilter);
  }, [initialFilter]);

  React.useEffect(() => {
    setReviewImageFlipped({});
  }, [roleId]);

  React.useEffect(() => {
    setReviewDetailId(null);
    setReviewDetailTab('comment');
    setReviewDetailImageIndex(0);
  }, [roleId, pill]);

  React.useEffect(() => {
    const targetShop = String(initialStoreChatShopName || '').trim();
    if (!targetShop) return;
    const hit =
      orders.find((o) => String(o?.shopName || '').trim() === targetShop) ||
      orders.find((o) => String(o?.products?.[0]?.title || '').trim() === targetShop);
    if (hit?.id) {
      setStandaloneStoreChat(null);
      setStoreChatOrderId(hit.id);
      return;
    }
    const sc = (storeChats as StoreChatRow[] | undefined)?.find((s) => String(s.shopName || '').trim() === targetShop);
    if (sc) {
      setStoreChatOrderId(null);
      setStandaloneStoreChat(sc);
    }
  }, [initialStoreChatShopName, orders, storeChats]);

  React.useEffect(() => {
    // 订单页内进入「店铺聊天 / 售后进度」时，同步把查手机系统状态栏改为纯白。
    onShoppingStatusBarLightChange?.(!!storeChatOrderId || !!standaloneStoreChat || !!afterSalesOrderId || !!reviewDetailId);
    return () => onShoppingStatusBarLightChange?.(false);
  }, [storeChatOrderId, standaloneStoreChat, afterSalesOrderId, reviewDetailId, onShoppingStatusBarLightChange]);

  if (standaloneStoreChat) {
    const turns = standaloneStoreChat.thread?.map((t) => ({ from: t.from, name: t.name, text: t.text }));
    return (
      <PhoneInspectShoppingStoreChat
        onBack={() => {
          if (cameFromMessageList) {
            onBack();
            return;
          }
          setStandaloneStoreChat(null);
        }}
        shopName={standaloneStoreChat.shopName}
        recipientNickname={nickname}
        recipientAvatarUrl={recipientAvatarUrl}
        productTitle={standaloneStoreChat.productTitle || '咨询商品'}
        productSpec=""
        productPrice="待确认"
        detailAddress="收货地址将在下单时填写"
        displayPhone="下单后展示"
        roleId={roleId}
        threadTurns={turns}
        headerTimeText={standaloneStoreChat.time}
        showOrderConfirmCard={false}
      />
    );
  }

  const runShoppingOrderAction = (order: any, a: string) => {
    const label = (a || '').trim();
    if (label === '查看物流' && order.trackingNo) {
      setLogisticsOrderId(order.id);
      return;
    }
    if (isAfterSalesActionLabel(label)) {
      setAfterSalesOrderId(order.id);
      return;
    }
    if (label === '联系商家' || label === '联系客服' || label === '联系卖家') {
      setStoreChatOrderId(order.id);
    }
  };

  const orderActionCursor = (order: any, a: string) => {
    const label = (a || '').trim();
    if (label === '查看物流') return order.trackingNo ? 'pointer' : 'default';
    if (isAfterSalesActionLabel(label)) return 'pointer';
    if (label === '联系商家' || label === '联系客服' || label === '联系卖家') return 'pointer';
    return 'default';
  };

  const storeChatOrder = storeChatOrderId ? orders.find((o) => o.id === storeChatOrderId) : null;
  if (storeChatOrderId && storeChatOrder) {
    const p0 = (storeChatOrder.products || [])[0];
    const { threadTurns, headerTimeText } = resolveStoreChatForOrder(storeChatOrder, storeChats as StoreChatRow[] | undefined);
    return (
      <PhoneInspectShoppingStoreChat
        onBack={() => {
          if (cameFromMessageList) {
            onBack();
            return;
          }
          setStoreChatOrderId(null);
        }}
        shopName={storeChatOrder.shopName}
        recipientNickname={nickname}
        recipientAvatarUrl={recipientAvatarUrl}
        productTitle={p0?.title || '商品'}
        productSpec={p0?.spec || ''}
        productPrice={p0?.price || '¥0'}
        detailAddress={resolveOrderDetailAddress(storeChatOrder, roleId)}
        displayPhone={resolveOrderDisplayPhone(storeChatOrder, roleId)}
        roleId={roleId}
        threadTurns={threadTurns}
        headerTimeText={headerTimeText}
        showOrderConfirmCard={String(storeChatOrder.status || '').trim() !== '待付款'}
      />
    );
  }

  const afterSalesOrder = afterSalesOrderId ? orders.find((o) => o.id === afterSalesOrderId) : null;
  if (afterSalesOrderId && afterSalesOrder) {
    const p0 = (afterSalesOrder.products || [])[0];
    return (
      <PhoneInspectAfterSalesProgress
        onBack={() => setAfterSalesOrderId(null)}
        onContactMerchant={() => setStoreChatOrderId(afterSalesOrder.id)}
        shopName={afterSalesOrder.shopName}
        productTitle={p0?.title || '商品'}
        productSpec={p0?.spec || ''}
        refundAmount={afterSalesOrder.actualPay}
        afterSalesType={afterSalesOrder.afterSalesType || 'refund_only'}
        flow={afterSalesOrder.afterSalesFlow || 'merchant_agree'}
        returnTrackingNo={afterSalesOrder.returnTrackingNo}
        exchangeTrackingNo={afterSalesOrder.exchangeTrackingNo}
        nodes={afterSalesOrder.afterSalesNodes}
        refundReasonText={afterSalesOrder.refundReason}
        evidenceNoteText={afterSalesOrder.evidenceNote}
        afterSalesNoText={afterSalesOrder.afterSalesNo}
      />
    );
  }

  const logisticsOrder = logisticsOrderId ? orders.find((o) => o.id === logisticsOrderId) : null;
  if (logisticsOrderId && logisticsOrder?.trackingNo) {
    const p0 = (logisticsOrder.products || [])[0];
    const { threadTurns: logisticsStoreThread, headerTimeText: logisticsStoreTime } = resolveStoreChatForOrder(
      logisticsOrder,
      storeChats as StoreChatRow[] | undefined
    );
    return (
      <PhoneInspectShoppingLogistics
        onBack={() => setLogisticsOrderId(null)}
        recipientNickname={nickname}
        recipientAvatarUrl={recipientAvatarUrl}
        trackingNo={logisticsOrder.trackingNo}
        shopName={logisticsOrder.shopName}
        productTitle={p0?.title || '商品'}
        productSpec={p0?.spec || ''}
        productPrice={p0?.price || '¥0'}
        detailAddress={resolveOrderDetailAddress(logisticsOrder, roleId)}
        displayPhone={resolveOrderDisplayPhone(logisticsOrder, roleId)}
        roleId={roleId}
        timeline={logisticsOrder.logisticsTimeline}
        storeChatThreadTurns={logisticsStoreThread}
        storeChatHeaderTimeText={logisticsStoreTime}
        onShoppingStatusBarLightChange={onShoppingStatusBarLightChange}
      />
    );
  }

  const reviewDetail = reviewDetailId ? reviewPosts.find((p) => p.id === reviewDetailId) : null;
  if (reviewDetail) {
    const detailAuthor = reviewDetail.forceNamedExample
      ? `${nickname || '买家'}(我)`
      : reviewDetail.forceAnonymousExample
        ? '匿名买家(我)'
        : reviewAuthor;
    const detailNamed = reviewDetail.forceNamedExample ? true : reviewDetail.forceAnonymousExample ? false : !isAnonymousReview;
    const detailDate = (reviewDetail as any).dateText || (reviewDetail as any).timeText || '请生成评论日期';
    const totalImages = Math.max(1, reviewDetail.images.length);
    const safeIndex = Math.min(reviewDetailImageIndex, totalImages - 1);
    const detailCommentsRaw = (reviewDetail as any).comments || (reviewDetail as any).commentTree || [];
    // 评论区兜底清洗：
    // 1) 仅保留一个“作者（我）”根评论；其余同类强制转网友，避免“作者自导自演”
    // 2) 删除自己回复自己（replyToName 与 author.displayName 相同）
    const detailComments = (() => {
      let usedRoleRoot = false;
      const walk = (nodes: any[], depth: number): any[] => {
        if (!Array.isArray(nodes)) return [];
        const out: any[] = [];
        for (let i = 0; i < nodes.length; i += 1) {
          const n = nodes[i];
          if (!n || typeof n !== 'object') continue;
          const a = n.author && typeof n.author === 'object' ? { ...n.author } : {};
          const baseName = String(a.displayName || a.name || n.displayName || n.name || '').trim();
          const roleLike = !!a.isRole || !!a.role || isRoleLikeReviewAuthor(baseName);
          const isRoot = depth === 0;
          const allowRole = isRoot && roleLike && !usedRoleRoot;
          if (allowRole) usedRoleRoot = true;
          const safeName =
            String(baseName || '').trim() ||
            (allowRole ? detailAuthor : `网友${i + 1}`);
          const replyToRaw = String(n.replyToName || n.replyTo?.name || n.replyTo || '').trim();
          const replyToName = replyToRaw && replyToRaw === safeName ? undefined : replyToRaw || undefined;
          out.push({
            ...n,
            author: {
              ...a,
              displayName: safeName,
              isRole: !!allowRole,
              role: !!allowRole
            },
            replyToName,
            replies: walk(n.replies || [], depth + 1)
          });
        }
        return out;
      };
      return walk(detailCommentsRaw, 0);
    })();
    const detailLikeUsers = (reviewDetail as any).likeUsers || [];
    const hasDetailComments = Array.isArray(detailComments) && detailComments.length > 0;
    const hasDetailLikeUsers = Array.isArray(detailLikeUsers) && detailLikeUsers.length > 0;
    const treeCommentCount = countReviewCommentTree(detailComments);
    const likeListCount = Array.isArray(detailLikeUsers) ? detailLikeUsers.length : 0;
    /** 详情页与列表计数：以模型数和结构数取最大，避免总览与详情不一致 */
    const detailCommentStat = hasDetailComments ? treeCommentCount : reviewDetail.commented;
    // 点赞区口径统一：有点赞用户列表时，以列表人数为准；否则退回点赞计数。
    const detailLikeStat = likeListCount > 0 ? likeListCount : Math.max(Number(reviewDetail.liked || 0), likeListCount);
    const detailLikeUsersRender = Array.isArray(detailLikeUsers)
      ? detailLikeUsers
          .filter((u: any) => u && typeof u === 'object')
          .map((u: any, idx: number) => ({
            id: u?.id || `like-${idx + 1}`,
            displayName: String(u?.displayName || u?.name || u?.nickname || '').trim(),
            avatarUrl: u?.avatarUrl,
            anonymous: !!u?.anonymous || !!u?.isAnonymous
          }))
          .filter((u: any) => !!u.displayName)
      : [];

    const renderCommentNode = (node: any, depth: number) => {
      if (!node) return null;
      const author = node.author || node;
      const displayName = author.displayName || author.name || author.nickname || (depth === 0 ? detailAuthor : '匿名用户');
      const avatarUrl = author.avatarUrl || node.avatarUrl;
      const anonymous = !!author.anonymous;
      const isRole = !!author.isRole || !!author.role;
      const showAuthorBadgeOnReply = depth > 0 && (!!author.isRole || !!author.role);

      const timeText = node.timeText || node.time || '刚刚';
      const locationText = node.locationText || node.location || node.area || '';

      const positionTextRaw = depth === 0 ? node.positionText || '' : node.positionText || '回复';
      const positionText = depth === 0 && /沙发|首评/.test(String(positionTextRaw || '')) ? '' : positionTextRaw;
      const subLabelTextRaw = depth === 0 ? node.subLabelText || node.firstLabel || '' : node.subLabelText;
      const subLabelText = depth === 0 && /首评/.test(String(subLabelTextRaw || '')) ? '' : subLabelTextRaw;

      const contentText = node.contentText || node.text || node.commentText || '';
      const replyToName = node.replyToName || node.replyTo?.name || node.replyTo;
      const replyToText = node.replyToText || node.replyTo?.text;

      const likeCount = Number(node.likeCount ?? node.heartLikes ?? node.likes ?? 0) || 0;
      const roleLiked = !!node.roleLiked;

      const marginLeft = depth <= 0 ? 0 : 42;
      const marginTop = depth <= 0 ? 0 : 10;

      const showPosition = depth === 0;
      const showReplyAtFormat = depth >= 2;

      return (
        <div style={{ marginLeft, marginTop }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            {depth === 0 && isRole ? (
              detailNamed ? (
                recipientAvatarUrl ? (
                  <img
                    src={recipientAvatarUrl}
                    alt=""
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: '#e5e7eb',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                      flexShrink: 0
                    }}
                  >
                    {String(detailAuthor || nickname || '我').replace(/\(我\)/g, '').trim().slice(0, 1) || '我'}
                  </div>
                )
              ) : (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#e5e7eb',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0
                  }}
                >
                  匿
                </div>
              )
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                  overflow: 'hidden'
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : anonymous ? (
                  '匿'
                ) : (
                  String(displayName).slice(0, 1)
                )}
              </div>
            )}

            <div style={{ minWidth: 0, flex: 1 }}>
              {depth === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 15, color: '#6b7280' }}>{displayName}</span>
                  {isRole ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: '#f97316',
                        borderRadius: 4,
                        padding: '1px 6px',
                        lineHeight: 1.4
                      }}
                    >
                      作者
                    </span>
                  ) : null}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, color: '#6b7280' }}>{displayName}</span>
                  {showAuthorBadgeOnReply ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: '#f97316',
                        borderRadius: 4,
                        padding: '1px 6px',
                        lineHeight: 1.4
                      }}
                    >
                      作者
                    </span>
                  ) : null}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {showPosition && String(positionText || '').trim() ? (
                    <div style={{ fontSize: 15, color: '#111827', lineHeight: 1.45, marginBottom: 6 }}>{positionText}</div>
                  ) : null}

                  <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.4 }}>
                    {timeText}
                    {locationText ? ` · ${locationText}` : ''}
                  </div>

                  {showPosition && String(subLabelText || '').trim() ? (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontSize: 12, color: '#f97316' }}>{subLabelText}</span>
                    </div>
                  ) : null}

                  {replyToName && showReplyAtFormat ? (
                    <div style={{ fontSize: 15, color: '#111827', lineHeight: 1.5, marginTop: showPosition ? 8 : 4 }}>
                      回复<span style={{ color: '#9ca3af' }}> @{replyToName}</span>：{replyToText ?? contentText}
                    </div>
                  ) : replyToName ? (
                    <div style={{ fontSize: 15, color: '#111827', lineHeight: 1.5, marginTop: showPosition ? 8 : 4 }}>
                      {replyToText ?? contentText}
                    </div>
                  ) : contentText ? (
                    <div style={{ fontSize: 15, color: '#111827', lineHeight: 1.5, marginTop: showPosition ? 8 : 4 }}>{contentText}</div>
                  ) : null}
                </div>

                <CommentRowHeartLikes count={likeCount} roleLiked={roleLiked} />
              </div>

              {Array.isArray(node.replies) && node.replies.length > 0 ? (
                <div style={{ marginTop: depth === 0 ? 12 : 10 }}>
                  {node.replies.map((r: any, rIdx: number) => (
                    <React.Fragment key={String(r?.id || `reply-${depth + 1}-${rIdx}`)}>
                      {renderCommentNode(r, depth + 1)}
                    </React.Fragment>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f2f2f7'
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            backgroundColor: '#fff'
          }}
        >
          <button
            type="button"
            onClick={() => setReviewDetailId(null)}
            style={{ border: 'none', background: 'transparent', fontSize: 22, lineHeight: 1, cursor: 'pointer', color: '#111827' }}
          >
            ‹
          </button>
          {detailNamed && recipientAvatarUrl ? (
            <img
              src={recipientAvatarUrl}
              alt=""
              style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                backgroundColor: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: '#6b7280',
                fontWeight: 600
              }}
            >
              匿
            </div>
          )}
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{detailAuthor}</div>
          <div style={{ marginLeft: 'auto', color: '#111827', fontSize: 18 }}>···</div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', backgroundColor: '#f2f2f7', paddingBottom: 88 }}>
          <>
            <div style={{ backgroundColor: '#fff' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', backgroundColor: '#111827' }}>
                <div
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const idx = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
                    if (idx !== reviewDetailImageIndex) setReviewDetailImageIndex(Math.max(0, Math.min(totalImages - 1, idx)));
                  }}
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    overflowX: 'auto',
                    display: 'flex',
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  {reviewDetail.images.map((img: any, idx: number) => {
                    const key = `${reviewDetail.id}-${idx}`;
                    const flipped = !!reviewImageFlipped[key];
                    return (
                      <div
                        key={key}
                        style={{
                          flex: '0 0 100%',
                          width: '100%',
                          aspectRatio: '1 / 1',
                          scrollSnapAlign: 'start',
                          perspective: 900,
                          WebkitPerspective: 900,
                          cursor: 'pointer'
                        }}
                        role="button"
                        tabIndex={0}
                        onClick={() => setReviewImageFlipped((prev) => ({ ...prev, [key]: !prev[key] }))}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter' || ev.key === ' ') {
                            ev.preventDefault();
                            setReviewImageFlipped((prev) => ({ ...prev, [key]: !prev[key] }));
                          }
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            transition: 'transform 0.42s ease',
                            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                            WebkitTransform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                            transformStyle: 'preserve-3d',
                            WebkitTransformStyle: 'preserve-3d',
                            overflow: 'hidden',
                            willChange: 'transform'
                          }}
                        >
                          {!flipped ? (
                            <div style={{ position: 'absolute', inset: 0, backgroundColor: '#111827' }}>
                              <img
                                src={img.url && String(img.url).trim() ? img.url : REVIEW_IMAGE_PLACEHOLDER_URL}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                transform: 'rotateY(180deg)',
                                WebkitTransform: 'rotateY(180deg)',
                                background: 'linear-gradient(135deg, #111827, #1f2937)',
                                color: '#ffffff',
                                padding: 12,
                                boxSizing: 'border-box',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                fontSize: 14,
                                lineHeight: 1.5,
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              <div style={{ width: '100%' }}>
                                <div style={{ opacity: 0.9 }}>{String(img.desc || '').trim() || '（无描述）'}</div>
                                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>点击翻回预览</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: 10,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    color: '#fff',
                    borderRadius: 4,
                    fontSize: 12,
                    padding: '3px 6px'
                  }}
                >
                  {safeIndex + 1}/{totalImages}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '8px 0' }}>
                {reviewDetail.images.map((_: any, idx: number) => (
                  <span
                    key={`${reviewDetail.id}-dot-${idx}`}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: idx === safeIndex ? '#f97316' : '#d1d5db'
                    }}
                  />
                ))}
              </div>
              <div style={{ padding: '0 14px 12px' }}>
                <div style={{ fontSize: 16, lineHeight: 1.5, color: '#111827', fontWeight: 600 }}>{reviewDetail.title}</div>
                <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 12 }}>{detailDate}</div>
                <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 12 }}>
                  被浏览 {reviewDetail.viewed} · 被点赞 {detailLikeStat} · 被评论 {detailCommentStat}
                </div>
              </div>
              <div
                style={{
                  margin: '0 14px 12px',
                  borderTop: '1px solid #f1f5f9',
                  borderBottom: '1px solid #f1f5f9',
                  padding: '10px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <img src={reviewDetail.images[0]?.url || REVIEW_IMAGE_PLACEHOLDER_URL} alt="" style={{ width: 42, height: 42, borderRadius: 6, objectFit: 'cover' }} />
                <div style={{ minWidth: 0, flex: 1, fontSize: 14, color: '#1f2937', lineHeight: 1.35, whiteSpace: 'normal', wordBreak: 'break-all' }}>
                  {String((reviewDetail as any).productTitle || (reviewDetail as any).productName || (reviewDetail as any).goodsTitle || '请生成商品名称')}
                </div>
                <span style={{ color: '#f97316', fontSize: 12, flexShrink: 0 }}>作者买过</span>
              </div>
            </div>
            <div style={{ marginTop: 10, backgroundColor: '#fff', padding: '12px 14px 16px' }}>
              <div style={{ display: 'flex', gap: 18, fontSize: 17, marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setReviewDetailTab('comment')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: reviewDetailTab === 'comment' ? '#111827' : '#6b7280',
                    fontWeight: reviewDetailTab === 'comment' ? 700 : 500,
                    padding: 0,
                    cursor: 'pointer'
                  }}
                >
                  评论 {detailCommentStat}
                </button>
                <button
                  type="button"
                  onClick={() => setReviewDetailTab('like')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: reviewDetailTab === 'like' ? '#111827' : '#6b7280',
                    fontWeight: reviewDetailTab === 'like' ? 700 : 500,
                    padding: 0,
                    cursor: 'pointer'
                  }}
                >
                  点赞 {detailLikeStat}
                </button>
              </div>

              {reviewDetailTab === 'comment' ? (
                <div>
                  {hasDetailComments ? (
                    <div>
                      {Array.isArray(detailComments) && detailComments.length > 0
                        ? detailComments.map((n: any) => renderCommentNode(n, 0))
                        : null}
                    </div>
                  ) : (
                    <div style={{ paddingTop: 6 }}>
                      <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
                        暂无评论详情数据
                      </div>
                      <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
                        请先在查手机面板勾选“购物”并点击“一键生成”。
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ paddingTop: 6 }}>
                  {detailLikeUsersRender.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 15, color: '#111827', lineHeight: 1.35 }}>认为你的评价有用</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {detailLikeUsersRender.map((u: any, idx: number) => {
                          const displayName = u?.displayName || u?.nickname || u?.name || '匿名用户';
                          const avatarUrl = u?.avatarUrl;
                          const anonymous = !!u?.anonymous || !!u?.isAnonymous;
                          return (
                            <div key={u?.id || `${displayName}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  backgroundColor: '#f1f5f9',
                                  border: '1px solid #e5e7eb',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#6b7280',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  flexShrink: 0,
                                  overflow: 'hidden'
                                }}
                              >
                                {avatarUrl ? (
                                  <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                ) : anonymous ? (
                                  '匿'
                                ) : (
                                  String(displayName).slice(0, 1)
                                )}
                              </div>
                              <div style={{ fontSize: 15, color: '#6b7280', fontWeight: 700 }}>{displayName}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '14px 0', color: '#64748b', fontSize: 13, lineHeight: 1.7 }}>
                      暂无点赞数据
                      <div style={{ marginTop: 6, opacity: 0.85 }}>请先在查手机面板勾选“购物”并点击“一键生成”。</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: 13, marginTop: 42 }}>到底了</div>
          </>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: CHROME_BG
      }}
    >
      {/* 顶栏：返回 + 搜索 */}
      <div
        style={{
          flexShrink: 0,
          backgroundColor: CHROME_BG,
          padding: '8px 10px 10px',
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#111827',
              fontSize: 22,
              lineHeight: 1,
              padding: '4px 2px',
              cursor: 'pointer',
              flexShrink: 0
            }}
            aria-label="返回"
          >
            ‹
          </button>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#f3f4f6',
              borderRadius: 999,
              padding: '7px 12px',
              minWidth: 0
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, opacity: 0.45 }}>
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>搜索订单</span>
          </div>
        </div>
      </div>

      {/* 订单状态胶囊 */}
      <div
        style={{
          flexShrink: 0,
          backgroundColor: CHROME_BG,
          padding: '10px 10px 12px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          overflowX: 'auto'
        }}
      >
        <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
          {PILL_FILTERS.map((p) => {
            const active = pill === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPill(p.key)}
                style={{
                  border: 'none',
                  borderRadius: 999,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  backgroundColor: active ? 'rgba(255,80,0,0.12)' : '#f3f4f6',
                  color: active ? ACCENT : '#475569',
                  flexShrink: 0
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 订单列表 */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '10px 10px 24px',
          backgroundColor: LIST_BG
        }}
      >
        {pill === 'review' ? (
          <div>
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: 10,
                marginBottom: 10,
                padding: '14px 8px',
                boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))'
              }}
            >
              <div style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{reviewStats.viewed}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>被浏览</div>
              </div>
              <div style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{reviewStats.liked}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>被点赞</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{reviewStats.commented}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>被评论</div>
              </div>
            </div>

            {reviewPosts.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '48px 16px' }}>
                暂无评价数据
                <div style={{ fontSize: 12, marginTop: 8, opacity: 0.85 }}>请先在查手机面板勾选“购物”并点击“一键生成”</div>
              </div>
            ) : null}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 10
              }}
            >
              {reviewPosts.map((post, idx) => (
                <div
                  key={`${post.id || 'rev'}-${idx}`}
                  onClick={() => {
                    setReviewDetailId(post.id);
                  }}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 10,
                    padding: '10px',
                    boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
                    cursor: 'pointer'
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      borderRadius: 8,
                      marginBottom: 8,
                      perspective: 800,
                      WebkitPerspective: 800,
                      cursor: 'pointer'
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setReviewImageFlipped((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        setReviewImageFlipped((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
                      }
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        transition: 'transform 0.42s ease',
                        transform: reviewImageFlipped[post.id] ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        WebkitTransform: reviewImageFlipped[post.id] ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        transformStyle: 'preserve-3d',
                        WebkitTransformStyle: 'preserve-3d',
                        borderRadius: 8,
                        overflow: 'hidden',
                        willChange: 'transform'
                      }}
                    >
                      {!reviewImageFlipped[post.id] ? (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: '#111827' }}>
                          <img
                            src={post.images[0]?.url || REVIEW_IMAGE_PLACEHOLDER_URL}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            transform: 'rotateY(180deg)',
                            WebkitTransform: 'rotateY(180deg)',
                            background: 'linear-gradient(135deg, #111827, #1f2937)',
                            color: '#ffffff',
                            padding: 10,
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            fontSize: 12,
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          <div style={{ width: '100%' }}>
                            <div style={{ opacity: 0.9 }}>{String(post.images[0]?.desc || '').trim() || '（无描述）'}</div>
                            <div style={{ marginTop: 8, fontSize: 11, opacity: 0.7 }}>点击翻回预览</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.4,
                      fontWeight: 600,
                      color: '#111827',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: 36
                    }}
                  >
                    {post.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                    {post.forceNamedExample
                      ? `${nickname || '买家'}(我)`
                      : post.forceAnonymousExample
                        ? '匿名买家(我)'
                        : reviewAuthor}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                    浏览 {post.viewed} · 点赞 {getResolvedLikeCount(post)} · 评论 {getResolvedCommentCount(post)}
                  </div>
                </div>
              ))}
            </div>
            {reviewPosts.length > 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '10px 0 2px' }}>
                —— 没有更多内容了 ——
              </div>
            ) : null}
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '48px 16px' }}>
            暂无该类订单数据
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.85 }}>请先在查手机面板勾选“购物”并点击“一键生成”</div>
          </div>
        ) : (
          visible.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: '#fff',
                borderRadius: 10,
                marginBottom: 10,
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(15,23,42,0.06)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderBottom: '1px solid #f3f4f6'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  {(() => {
                    const badge = pickOrderPlatformLabel(`${String(order.id || '')}|${String(order.shopName || '')}`);
                    return (
                  <span
                    style={{
                      minWidth: 22,
                      height: 22,
                      borderRadius: 4,
                      backgroundColor: badge.bg,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {badge.text}
                  </span>
                    );
                  })()}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {order.shopName}
                  </span>
                  <span style={{ color: '#cbd5e1', fontSize: 14 }}>›</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: ACCENT, flexShrink: 0, marginLeft: 8 }}>{order.status}</span>
              </div>

              {order.products.map((pr: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '12px',
                    borderBottom: idx < order.products.length - 1 ? '1px solid #f3f4f6' : 'none'
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 8,
                      backgroundColor: '#f1f5f9',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      opacity: 0.35
                    }}
                  >
                    📦
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#111827',
                        lineHeight: 1.35,
                        marginBottom: 4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {pr.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, lineHeight: 1.35 }}>{pr.spec}</div>
                    {pr.tag ? (
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: 11,
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: `1px solid ${pr.tag.color === 'green' ? '#86efac' : '#fecaca'}`,
                          color: pr.tag.color === 'green' ? '#15803d' : '#dc2626',
                          marginBottom: 6
                        }}
                      >
                        {pr.tag.text}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{pr.price}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>x{pr.qty}</div>
                  </div>
                </div>
              ))}

              <div style={{ padding: '10px 12px 12px' }}>
                <div style={{ textAlign: 'right', fontSize: 13, color: '#64748b', marginBottom: 10 }}>
                  实付款{' '}
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{order.actualPay}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 }}>
                {(() => {
                  const secondaryActionsRaw = (order.actions || []).filter((a: string) => a !== order.primaryAction);
                  const isPendingPay = String(order.status || '').trim() === '待付款';
                  const isPendingRecv = String(order.status || '').trim() === '待收货';
                  let secondaryActions = isPendingPay
                    ? ['联系商家', ...secondaryActionsRaw.filter((a: string) => !['联系卖家', '联系商家', '联系客服'].includes(String(a || '').trim()))]
                    : secondaryActionsRaw;
                  if (isPendingRecv) {
                    const first = secondaryActions[0];
                    const rest = secondaryActions
                      .slice(1)
                      .filter((a: string) => !['延长收货', '联系卖家', '联系商家', '联系客服'].includes(String(a || '').trim()));
                    secondaryActions = [first, '联系商家', ...rest].filter(Boolean);
                  }
                  return secondaryActions.map((a: string, idx: number) => (
                      <button
                        key={`${a}-${idx}`}
                        type="button"
                        onClick={() => runShoppingOrderAction(order, a)}
                        style={{
                          border: '1px solid #e5e7eb',
                          background: '#fff',
                          borderRadius: 999,
                          padding: '6px 14px',
                          fontSize: 12,
                          color: '#374151',
                          cursor: orderActionCursor(order, a)
                        }}
                      >
                        {a}
                      </button>
                    ));
                })()}
                  {order.primaryAction ? (
                    <button
                      type="button"
                      onClick={() => runShoppingOrderAction(order, order.primaryAction)}
                      style={{
                        border: 'none',
                        background: 'rgba(255,80,0,0.12)',
                        borderRadius: 999,
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: ACCENT,
                        cursor: orderActionCursor(order, order.primaryAction)
                      }}
                    >
                      {order.primaryAction}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
