import React from 'react';
import { appStorage } from '../storage/appStorage';

// 微信钱包相关类型和函数
type WeChatWallet = {
  walletId: string;
  balance: number; // 余额（单位：元）
  paymentPassword: string; // 支付密码
  createdAt: number; // 创建时间戳
};

type WeChatSelfProfile = {
  nickname: string;
  gender: 'male' | 'female' | 'other' | '';
  region: string;
  wechatId?: string;
  pokeText?: string;
  intro?: string;
  avatarUrl?: string;
  avatarDesc?: string;
};

const WECHAT_WALLET_KEY = 'mini-ai-phone.wechat-wallet';
const WECHAT_SELF_PROFILE_KEY = 'mini-ai-phone.wechat-self-profile';

// 加载微信钱包
const loadWeChatWallet = (): WeChatWallet | null => {
  try {
    const raw = appStorage.getItem(WECHAT_WALLET_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WeChatWallet;
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
};

// 保存微信钱包
const saveWeChatWallet = (wallet: WeChatWallet) => {
  try {
    appStorage.setItem(WECHAT_WALLET_KEY, JSON.stringify(wallet));
  } catch {
    // ignore
  }
};

// 加载微信自己资料
const loadWeChatSelfProfile = (): WeChatSelfProfile => {
  try {
    const raw = appStorage.getItem(WECHAT_SELF_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WeChatSelfProfile>;
      return {
        nickname: parsed.nickname ?? '微信昵称',
        gender: parsed.gender ?? '',
        region: parsed.region ?? '',
        wechatId: parsed.wechatId,
        pokeText: parsed.pokeText,
        intro: parsed.intro ?? '',
        avatarUrl: parsed.avatarUrl,
        avatarDesc: parsed.avatarDesc ?? ''
      };
    }
  } catch {
    // ignore
  }
  return {
    nickname: '微信昵称',
    gender: '',
    region: '',
    wechatId: undefined,
    pokeText: '',
    intro: '',
    avatarUrl: undefined,
    avatarDesc: ''
  };
};
import zhouLogo from '../../店铺菜品图/粥铺/粥铺logo.webp';
import zhouPidan from '../../店铺菜品图/粥铺/皮蛋瘦肉粥~1.webp';
import zhouXiaolongbao from '../../店铺菜品图/粥铺/鲜肉小笼包~1.webp';
import zhouNangua from '../../店铺菜品图/粥铺/南瓜小米粥~1.webp';
import zhouBg from '../../店铺菜品图/粥铺/店铺背景图·.webp';
import zhouHongtang from '../../店铺菜品图/粥铺/红糖发糕~1.webp';
import zhouJianbing from '../../店铺菜品图/粥铺/蔬菜鸡蛋煎饼~1.webp';
import zhouZaliang from '../../店铺菜品图/粥铺/养生杂粮粥~1.webp';
import zhouHaixian from '../../店铺菜品图/粥铺/海鲜鲜虾粥~1.webp';
import zhouNanguaPaigu from '../../店铺菜品图/粥铺/南瓜排骨粥~1.webp';
import zhouShanyaoPaigu from '../../店铺菜品图/粥铺/山药排骨粥~1.webp';
import zhouYumiHuluobo from '../../店铺菜品图/粥铺/玉米胡萝卜瘦肉粥~1.webp';
import zhouHongzaoHeimi from '../../店铺菜品图/粥铺/红枣桂圆黑米粥~1.webp';
import zhouZishuYanmai from '../../店铺菜品图/粥铺/紫薯燕麦粥~1.webp';
import zhouLianziQianshi from '../../店铺菜品图/粥铺/莲子芡实养生粥~1.webp';
import zhouYiner from '../../店铺菜品图/粥铺/银耳莲子百合粥~1.webp';
import zhouXiangguQingcai from '../../店铺菜品图/粥铺/香菇青菜粥~1.webp';
import zhouConghuajuan from '../../店铺菜品图/粥铺/葱花卷~2.webp';
import zhouDoushabao from '../../店铺菜品图/粥铺/豆沙包~1.webp';
import zhouJiangrouDabao from '../../店铺菜品图/粥铺/酱肉大包~1.webp';
import zhouJiucaiJidanbao from '../../店铺菜品图/粥铺/韭菜鸡蛋包~1.webp';
import zhouLiangbanHuanggua from '../../店铺菜品图/粥铺/凉拌黄瓜~1.webp';
import zhouChayeDan from '../../店铺菜品图/粥铺/茶叶蛋~1.webp';

// 甜品铺：晚风冰品社
import wanfengLogo from '../../店铺菜品图/甜品铺/晚风冰品社logo.webp';
import wanfengBg from '../../店铺菜品图/甜品铺/店铺背景图.webp';
import wanfengCaomeiZhishi from '../../店铺菜品图/甜品铺/草莓芝士冰沙杯.webp';
import wanfengBoheNingmeng from '../../店铺菜品图/甜品铺/薄荷柠檬冰爽茶.webp';
import wanfengXuemuniang from '../../店铺菜品图/甜品铺/奶油草莓雪媚娘.webp';
import wanfengMangguoQianceng from '../../店铺菜品图/甜品铺/芒果千层.webp';
import wanfengYangzhi from '../../店铺菜品图/甜品铺/杨枝甘露冰酪.webp';
import wanfengYuanniMasha from '../../店铺菜品图/甜品铺/原味麻薯小包.webp';
import wanfengAoliao from '../../店铺菜品图/甜品铺/奥利奥芝士绵绵冰.webp';
import wanfengMochiHongdou from '../../店铺菜品图/甜品铺/抹茶红豆雪山冰.webp';
import wanfengTaotaoDong from '../../店铺菜品图/甜品铺/桃桃气泡冻冻冰.webp';
import wanfengYenaiDonggao from '../../店铺菜品图/甜品铺/椰奶冻糕.webp';
import wanfengLiulianBanjv from '../../店铺菜品图/甜品铺/榴莲班戟.webp';
import wanfengBaixiangSanxiang from '../../店铺菜品图/甜品铺/百香果三响炮.webp';
import wanfengZimiNailao from '../../店铺菜品图/甜品铺/紫米奶酪三明治.webp';
import wanfengYuniBobo from '../../店铺菜品图/甜品铺/芋泥波波冰沙碗.webp';
import wanfengYuniRousong from '../../店铺菜品图/甜品铺/芋泥肉松盒子.webp';
import wanfengMangguoXimi from '../../店铺菜品图/甜品铺/芒果西米露冰碗.webp';
import wanfengMangYeDong from '../../店铺菜品图/甜品铺/芒椰奶西冻冻杯.webp';
import wanfengMitaoWulong from '../../店铺菜品图/甜品铺/蜜桃乌龙气泡水.webp';
import wanfengQingtiNingmeng from '../../店铺菜品图/甜品铺/青提柠檬茶.webp';
import wanfengXianzhaChengzhi from '../../店铺菜品图/甜品铺/鲜榨橙汁.webp';
import wanfengHeitangZhenzhu from '../../店铺菜品图/甜品铺/黑糖珍珠鲜奶冰.webp';
import wanfengJiuniangYuanzhi from '../../店铺菜品图/甜品铺/酒酿小圆子冰沙.webp';

type Props = {
  onExit: () => void;
};

type BottomTabId = '首页' | '购物车' | '我的';

const BOTTOM_TABS: { id: BottomTabId; label: string }[] = [
  { id: '首页', label: '首页' },
  { id: '购物车', label: '购物车' },
  { id: '我的', label: '我的' }
];

const LineIcon: React.FC<{ name: BottomTabId; active: boolean }> = ({ name, active }) => {
  const stroke = active ? '#f97316' : '#9ca3af';
  const strokeWidth = 2;
  const common = { fill: 'none', stroke, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  if (name === '首页') {
    return (
      <svg className="waimai-lineIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M3.5 10.5L12 3.5l8.5 7" />
        <path {...common} d="M6.5 10.5V20.5h11V10.5" />
        <path {...common} d="M10 20.5v-6h4v6" />
      </svg>
    );
  }

  if (name === '购物车') {
    return (
      <svg className="waimai-lineIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M3.5 5.5h2l2 11h10.5l2-8H7" />
        <path {...common} d="M10 20.5a1 1 0 1 0 0-2a1 1 0 0 0 0 2Z" />
        <path {...common} d="M17 20.5a1 1 0 1 0 0-2a1 1 0 0 0 0 2Z" />
      </svg>
    );
  }

  return (
    <svg className="waimai-lineIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path {...common} d="M12 12.5a4 4 0 1 0 0-8a4 4 0 0 0 0 8Z" />
      <path {...common} d="M4.5 20.5c1.6-4 5.1-6 7.5-6s5.9 2 7.5 6" />
    </svg>
  );
};

const CATEGORIES: { label: string; icon: string }[] = [
  { label: '美食外卖', icon: '🍜' },
  { label: '超市便利', icon: '🧃' },
  { label: '看病买药', icon: '💊' },
  { label: '水果买菜', icon: '🍓' },
  { label: '下午茶', icon: '🧁' },
  { label: '甜品饮品', icon: '🧋' }
];

const DEALS_LEFT: { title: string; desc: string; price: string }[] = [
  { title: '馋兜兜·新疆炒米粉', desc: '鸡肉炒米粉+宽粉', price: '¥13.6' },
  { title: '牛腩炖了', desc: '【套餐】酱香牛腩', price: '¥16.1' }
];

const DEALS_RIGHT: { title: string; desc: string; price: string }[] = [
  { title: '晚风冰品社', desc: '【专享】冰爽甜品一口价', price: '¥19.9' },
  { title: '遵义羊肉粉', desc: '羊肉粉', price: '¥14.7' }
];

type ShopPreviewItem = {
  title: string;
  price: string;
  tag?: string;
  img?: string;
};

type Dish = {
  id: string;
  name: string;
  monthSalesText: string;
  tags: string[];
  price: number;
  originPrice?: number;
  action: 'add' | 'spec';
  badge?: string;
};

type CartEntry = {
  dishId: string;
  name: string;
  qty: number;
  unitPrice: number;
  pocketId: number;
  specText?: string;
};

type ShopReview = {
  id: string;
  userName: string;
  rating: number; // 1-5
  tasteRating: number; // 味道
  packRating: number; // 包装
  date: string;
  text: string;
  images?: string[]; // urls
  tags?: string[];
};

const ZHOU_DISH_IMG_MAP: Record<string, string> = {
  皮蛋瘦肉粥: zhouPidan,
  鲜肉小笼包: zhouXiaolongbao,
  南瓜小米粥: zhouNangua,
  养生杂粮粥: zhouZaliang,
  海鲜鲜虾粥: zhouHaixian,
  南瓜排骨粥: zhouNanguaPaigu,
  山药排骨粥: zhouShanyaoPaigu,
  玉米胡萝卜瘦肉粥: zhouYumiHuluobo,
  红枣桂圆黑米粥: zhouHongzaoHeimi,
  紫薯燕麦粥: zhouZishuYanmai,
  莲子芡实养生粥: zhouLianziQianshi,
  银耳莲子百合粥: zhouYiner,
  香菇青菜粥: zhouXiangguQingcai,
  红糖发糕: zhouHongtang,
  葱花卷: zhouConghuajuan,
  蔬菜鸡蛋煎饼: zhouJianbing,
  豆沙包: zhouDoushabao,
  酱肉大包: zhouJiangrouDabao,
  韭菜鸡蛋包: zhouJiucaiJidanbao,
  凉拌黄瓜: zhouLiangbanHuanggua,
  茶叶蛋: zhouChayeDan
};

// 晚风冰品社：菜品图片映射
const WANFENG_DISH_IMG_MAP: Record<string, string> = {
  草莓芝士冰沙杯: wanfengCaomeiZhishi,
  薄荷柠檬冰爽茶: wanfengBoheNingmeng,
  奶油草莓雪媚娘: wanfengXuemuniang,
  芒果千层: wanfengMangguoQianceng,
  杨枝甘露冰酪: wanfengYangzhi,
  原味麻薯小包: wanfengYuanniMasha,
  奥利奥芝士绵绵冰: wanfengAoliao,
  抹茶红豆雪山冰: wanfengMochiHongdou,
  桃桃气泡冻冻冰: wanfengTaotaoDong,
  椰奶冻糕: wanfengYenaiDonggao,
  榴莲班戟: wanfengLiulianBanjv,
  百香果三响炮: wanfengBaixiangSanxiang,
  紫米奶酪三明治: wanfengZimiNailao,
  芋泥波波冰沙碗: wanfengYuniBobo,
  芋泥肉松盒子: wanfengYuniRousong,
  芒果西米露冰碗: wanfengMangguoXimi,
  芒椰奶西冻冻杯: wanfengMangYeDong,
  蜜桃乌龙气泡水: wanfengMitaoWulong,
  青提柠檬茶: wanfengQingtiNingmeng,
  鲜榨橙汁: wanfengXianzhaChengzhi,
  黑糖珍珠鲜奶冰: wanfengHeitangZhenzhu,
  酒酿小圆子冰沙: wanfengJiuniangYuanzhi
};

const ZHOU_DISH_INGREDIENT_TAGS: Record<string, string[]> = {
  皮蛋瘦肉粥: ['皮蛋', '瘦肉', '绵滑'],
  鲜肉小笼包: ['鲜肉', '面粉', '多汁'],
  南瓜小米粥: ['小米', '南瓜', '清甜'],
  养生杂粮粥: ['杂粮', '低脂', '饱腹'],
  海鲜鲜虾粥: ['鲜虾', '海鲜', '鲜香'],
  南瓜排骨粥: ['排骨', '南瓜', '浓香'],
  山药排骨粥: ['山药', '排骨', '清润'],
  玉米胡萝卜瘦肉粥: ['玉米', '胡萝卜', '瘦肉'],
  红枣桂圆黑米粥: ['红枣', '桂圆', '黑米'],
  紫薯燕麦粥: ['紫薯', '燕麦', '低糖'],
  莲子芡实养生粥: ['莲子', '芡实', '养生'],
  银耳莲子百合粥: ['银耳', '莲子', '百合'],
  香菇青菜粥: ['香菇', '青菜', '清淡'],
  红糖发糕: ['红糖', '米面', '松软'],
  葱花卷: ['葱花', '面粉', '咸香'],
  蔬菜鸡蛋煎饼: ['蔬菜', '鸡蛋', '酥香'],
  豆沙包: ['豆沙', '面粉', '香甜'],
  酱肉大包: ['酱肉', '面粉', '咸香'],
  韭菜鸡蛋包: ['韭菜', '鸡蛋', '鲜香'],
  凉拌黄瓜: ['黄瓜', '凉拌', '爽口'],
  茶叶蛋: ['鸡蛋', '蛋白质', '入味']
};

type DishCategory = {
  id: string;
  name: string;
  dishes: Dish[];
};

type ShopPreview = {
  name: string;
  monthlySales: string;
  startPrice: string;
  deliveryFee: string;
  rating: string;
  recommendText: string;
  eta: string;
  distance: string;
  coupons: string[];
  goods: ShopPreviewItem[];
};

type DiscountTier = { threshold: number; discount: number };
const calcTierDiscount = (amount: number, tiers: DiscountTier[]) => {
  // 取“满足的最高档位”
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
  let best = 0;
  for (const t of sorted) {
    if (amount >= t.threshold) best = Math.max(best, t.discount);
  }
  return best;
};

const SHOP_PROMOS: Record<
  string,
  { startPrice: number; deliveryFee: number; shopDiscountTiers: DiscountTier[]; eatCardDiscountTiers: DiscountTier[] }
> = {
  一碗热乎粥: {
    startPrice: 15,
    deliveryFee: 3,
    shopDiscountTiers: [
      { threshold: 18, discount: 3 },
      { threshold: 25, discount: 5 }
    ],
    eatCardDiscountTiers: [
      { threshold: 18, discount: 5 },
      { threshold: 25, discount: 8 }
    ]
  },
  晚风冰品社: {
    startPrice: 15,
    deliveryFee: 3,
    shopDiscountTiers: [
      { threshold: 20, discount: 3 },
      { threshold: 28, discount: 5 }
    ],
    eatCardDiscountTiers: [
      { threshold: 20, discount: 5 },
      { threshold: 25, discount: 7 }
    ]
  }
};

const formatDishMonthSalesText = (raw: string) => {
  // 规则：<=100 不显示“+”；>100 显示为整百 + “+”
  const n = Number.parseInt(String(raw).replace(/[^\d]/g, ''), 10);
  if (!Number.isFinite(n) || n <= 0) return raw;
  if (n > 100) {
    const rounded = Math.floor(n / 100) * 100;
    return `月售 ${rounded}+`;
  }
  return `月售 ${n}`;
};

const isWanfengSoftDessert = (shopName: string, dish: Dish) => {
  return shopName === '晚风冰品社' && (dish.tags ?? []).includes('软萌甜品');
};

const getWanfengSoftSpecOptions = (dishName: string) => {
  // 软萌甜品：默认 1/2 个；麻薯特例 2/4 个
  return dishName === '原味麻薯小包' ? [2, 4] : [1, 2];
};

const getWanfengSoftBaseCount = (dishName: string) => {
  // “当前价格”代表最大规格的价格：1/2 -> 2个价；2/4 -> 4个价
  return dishName === '原味麻薯小包' ? 4 : 2;
};

const getWanfengSoftMinDisplayPrice = (dish: Dish) => {
  const base = getWanfengSoftBaseCount(dish.name);
  const minCount = Math.min(...getWanfengSoftSpecOptions(dish.name));
  return dish.price * (minCount / base);
};

const SHOP_PREVIEWS: ShopPreview[] = [
  {
    name: '一碗热乎粥',
    monthlySales: '月售1000+',
    startPrice: '起送¥15',
    deliveryFee: '配送 约¥3',
    rating: '4.7分',
    recommendText: '一碗热乎粥，下肚整个人都暖起来～',
    eta: '25分钟',
    distance: '828m',
    coupons: ['18减3', '25减5'],
    goods: [
      { title: '皮蛋瘦肉粥', price: '¥9.9', img: zhouPidan, tag: '招牌' },
      { title: '鲜肉小笼包', price: '¥4.5', img: zhouXiaolongbao, tag: '热销' },
      { title: '南瓜小米粥', price: '¥6', img: zhouNangua },
      { title: '红糖发糕', price: '¥3', img: zhouHongtang },
      { title: '蔬菜鸡蛋煎饼', price: '¥4', img: zhouJianbing }
    ]
  },
  {
    name: '晚风冰品社',
    monthlySales: '月售2000+',
    startPrice: '起送¥15',
    deliveryFee: '配送 约¥3',
    rating: '4.8分',
    recommendText: '清爽甜而不腻，来一杯就降温～',
    eta: '28分钟',
    distance: '1.2km',
    coupons: ['20减3', '28减5'],
    goods: [
      { title: '草莓芝士冰沙杯', price: '¥22.9', img: wanfengCaomeiZhishi, tag: '热销' },
      { title: '薄荷柠檬冰爽茶', price: '¥14.9', img: wanfengBoheNingmeng, tag: '清爽' },
      { title: '奶油草莓雪媚娘', price: '¥16.9', img: wanfengXuemuniang, tag: '新品' },
      { title: '芒果千层', price: '¥19.9', img: wanfengMangguoQianceng, tag: '招牌' },
      { title: '杨枝甘露冰酪', price: '¥18.9', img: wanfengYangzhi }
    ]
  }
];

// 粥铺菜单（默认门店）
const SHOP_MENU_PORRIDGE: DishCategory[] = [
  {
    id: 'like',
    name: '热销',
    dishes: [
      {
        id: 'zhou-hot-1',
        name: '皮蛋瘦肉粥',
        monthSalesText: '月售 500+',
        tags: ['米粥', '招牌'],
        price: 9.9,
        action: 'spec'
      },
      {
        id: 'zhou-hot-2',
        name: '鲜肉小笼包',
        monthSalesText: '月售 300+',
        tags: ['面点', '热销'],
        price: 4.5,
        action: 'spec',
        badge: '热销'
      }
    ]
  },
  {
    id: 'hot',
    name: '米粥',
    dishes: [
      {
        id: 'zhou-porridge-1',
        name: '南瓜小米粥',
        monthSalesText: '月售 153',
        tags: ['南瓜', '小米'],
        price: 6.0,
        action: 'spec'
      },
      {
        id: 'zhou-porridge-2',
        name: '养生杂粮粥',
        monthSalesText: '月售 121',
        tags: ['杂粮', '养生'],
        price: 7.5,
        action: 'spec'
      },
      {
        id: 'zhou-porridge-3',
        name: '海鲜鲜虾粥',
        monthSalesText: '月售 92',
        tags: ['海鲜', '鲜虾'],
        price: 12.9,
        action: 'spec'
      },
      {
        id: 'zhou-porridge-4',
        name: '南瓜排骨粥',
        monthSalesText: '月售 83',
        tags: ['南瓜', '排骨'],
        price: 11.9,
        action: 'spec'
      },
      {
        id: 'zhou-porridge-5',
        name: '山药排骨粥',
        monthSalesText: '月售 66',
        tags: ['山药', '排骨'],
        price: 11.9,
        action: 'spec'
      },
      {
        id: 'zhou-porridge-6',
        name: '玉米胡萝卜瘦肉粥',
        monthSalesText: '月售 79',
        tags: ['玉米', '胡萝卜', '瘦肉'],
        price: 9.9,
        action: 'spec'
      },
      {
        id: 'zhou-porridge-7',
        name: '红枣桂圆黑米粥',
        monthSalesText: '月售 55',
        tags: ['红枣', '桂圆', '黑米'],
        price: 9.9,
        action: 'spec'
      },
      {
        id: 'zhou-porridge-8',
        name: '紫薯燕麦粥',
        monthSalesText: '月售 50',
        tags: ['紫薯', '燕麦'],
        price: 8.9,
        action: 'spec'
      },
      {
        id: 'zhou-porridge-9',
        name: '莲子芡实养生粥',
        monthSalesText: '月售 42',
        tags: ['莲子', '芡实', '养生'],
        price: 10.9,
        action: 'spec'
      },
      {
        id: 'zhou-porridge-10',
        name: '银耳莲子百合粥',
        monthSalesText: '月售 38',
        tags: ['银耳', '莲子', '百合'],
        price: 10.9,
        action: 'spec'
      },
      {
        id: 'zhou-porridge-11',
        name: '香菇青菜粥',
        monthSalesText: '月售 42',
        tags: ['香菇', '青菜'],
        price: 7.9,
        action: 'spec'
      }
    ]
  },
  {
    id: 'cake',
    name: '糕点面食',
    dishes: [
      {
        id: 'zhou-cake-1',
        name: '红糖发糕',
        monthSalesText: '月售 92',
        tags: ['糕点', '甜品'],
        price: 5.5,
        action: 'add'
      },
      {
        id: 'zhou-cake-2',
        name: '葱花卷',
        monthSalesText: '月售 83',
        tags: ['面食', '葱香'],
        price: 4.5,
        action: 'add'
      },
      {
        id: 'zhou-cake-3',
        name: '蔬菜鸡蛋煎饼',
        monthSalesText: '月售 73',
        tags: ['煎饼', '蔬菜', '鸡蛋'],
        price: 6.5,
        action: 'add'
      },
      {
        id: 'zhou-cake-4',
        name: '豆沙包',
        monthSalesText: '月售 62',
        tags: ['包子', '豆沙'],
        price: 3.5,
        action: 'add'
      },
      {
        id: 'zhou-cake-5',
        name: '酱肉大包',
        monthSalesText: '月售 55',
        tags: ['包子', '酱肉'],
        price: 4.5,
        action: 'add'
      },
      {
        id: 'zhou-cake-6',
        name: '韭菜鸡蛋包',
        monthSalesText: '月售 48',
        tags: ['包子', '韭菜', '鸡蛋'],
        price: 4.0,
        action: 'add'
      }
    ]
  },
  {
    id: 'snack',
    name: '小食',
    dishes: [
      {
        id: 'zhou-snack-1',
        name: '凉拌黄瓜',
        monthSalesText: '月售 40',
        tags: ['凉菜', '爽口'],
        price: 4.9,
        action: 'add'
      },
      {
        id: 'zhou-snack-2',
        name: '茶叶蛋',
        monthSalesText: '月售 35',
        tags: ['小食', '蛋白质'],
        price: 2.5,
        action: 'add'
      }
    ]
  }
];

// 晚风冰品社菜单
const SHOP_MENU_DESSERT: DishCategory[] = [
  {
    id: 'cool',
    name: '🍧 冰爽甜冰',
    dishes: [
      {
        id: 'wanfeng-cool-1',
        name: '草莓芝士冰沙杯',
        monthSalesText: '月售 800+',
        tags: ['冰沙', '草莓', '芝士', '热销'],
        price: 22.9,
        originPrice: 24.9,
        action: 'add',
        badge: '热销'
      },
      {
        id: 'wanfeng-cool-2',
        name: '杨枝甘露冰酪',
        monthSalesText: '月售 620+',
        tags: ['杨枝甘露', '西柚', '清爽'],
        price: 18.9,
        originPrice: 20.9,
        action: 'add',
        badge: '招牌'
      },
      {
        id: 'wanfeng-cool-3',
        name: '芒椰奶西冻冻杯',
        monthSalesText: '月售 350+',
        tags: ['芒果', '椰奶', '冻冻'],
        price: 19.9,
        action: 'add'
      },
      {
        id: 'wanfeng-cool-4',
        name: '桃桃气泡冻冻冰',
        monthSalesText: '月售 260+',
        tags: ['水蜜桃', '气泡', '冰爽'],
        price: 17.9,
        action: 'add'
      },
      {
        id: 'wanfeng-cool-5',
        name: '芒果西米露冰碗',
        monthSalesText: '月售 240+',
        tags: ['芒果', '西米', '冰碗'],
        price: 18.9,
        action: 'add'
      },
      {
        id: 'wanfeng-cool-6',
        name: '黑糖珍珠鲜奶冰',
        monthSalesText: '月售 210+',
        tags: ['黑糖', '珍珠', '鲜奶'],
        price: 19.9,
        action: 'add'
      },
      {
        id: 'wanfeng-cool-7',
        name: '酒酿小圆子冰沙',
        monthSalesText: '月售 180+',
        tags: ['酒酿', '糯米', '冰沙'],
        price: 16.9,
        action: 'add'
      },
      {
        id: 'wanfeng-cool-8',
        name: '奥利奥芝士绵绵冰',
        monthSalesText: '月售 160+',
        tags: ['奥利奥', '芝士', '绵绵冰'],
        price: 21.9,
        action: 'add'
      },
      {
        id: 'wanfeng-cool-9',
        name: '抹茶红豆雪山冰',
        monthSalesText: '月售 150+',
        tags: ['抹茶', '红豆', '雪山冰'],
        price: 19.9,
        action: 'add'
      },
      {
        id: 'wanfeng-cool-10',
        name: '芋泥波波冰沙碗',
        monthSalesText: '月售 140+',
        tags: ['芋泥', '波波', '厚料'],
        price: 20.9,
        action: 'add'
      }
    ]
  },
  {
    id: 'soft',
    name: '🧁 软萌甜品',
    dishes: [
      {
        id: 'wanfeng-soft-1',
        name: '奶油草莓雪媚娘',
        monthSalesText: '月售 700+',
        tags: ['软萌甜品', '雪媚娘', '草莓', '奶油'],
        price: 16.9,
        originPrice: 18.9,
        action: 'spec',
        badge: '热销'
      },
      {
        id: 'wanfeng-soft-2',
        name: '芒果千层',
        monthSalesText: '月售 520+',
        tags: ['软萌甜品', '千层', '芒果', '招牌'],
        price: 19.9,
        originPrice: 21.9,
        action: 'spec',
        badge: '招牌'
      },
      {
        id: 'wanfeng-soft-3',
        name: '榴莲班戟',
        monthSalesText: '月售 260+',
        tags: ['软萌甜品', '榴莲', '班戟', '爆浆'],
        price: 23.9,
        action: 'spec'
      },
      {
        id: 'wanfeng-soft-4',
        name: '紫米奶酪三明治',
        monthSalesText: '月售 220+',
        tags: ['软萌甜品', '紫米', '奶酪', '软糯'],
        price: 15.9,
        action: 'spec'
      },
      {
        id: 'wanfeng-soft-5',
        name: '椰奶冻糕',
        monthSalesText: '月售 200+',
        tags: ['软萌甜品', '椰奶', '果冻', 'Q 弹'],
        price: 13.9,
        action: 'spec'
      },
      {
        id: 'wanfeng-soft-6',
        name: '芋泥肉松盒子',
        monthSalesText: '月售 190+',
        tags: ['软萌甜品', '芋泥', '肉松', '盒子'],
        price: 18.9,
        action: 'spec'
      },
      {
        id: 'wanfeng-soft-7',
        name: '原味麻薯小包',
        monthSalesText: '月售 160+',
        tags: ['软萌甜品', '麻薯', '糯米', '小份'],
        price: 12.9,
        action: 'spec'
      }
    ]
  },
  {
    id: 'drink',
    name: '🥤 少女特调饮品',
    dishes: [
      {
        id: 'wanfeng-drink-1',
        name: '薄荷柠檬冰爽茶',
        monthSalesText: '月售 650+',
        tags: ['柠檬茶', '薄荷', '冰爽'],
        price: 14.9,
        originPrice: 16.9,
        action: 'add',
        badge: '热销'
      },
      {
        id: 'wanfeng-drink-2',
        name: '蜜桃乌龙气泡水',
        monthSalesText: '月售 320+',
        tags: ['蜜桃', '乌龙', '气泡'],
        price: 15.9,
        action: 'add'
      },
      {
        id: 'wanfeng-drink-3',
        name: '青提柠檬茶',
        monthSalesText: '月售 280+',
        tags: ['青提', '柠檬', '清爽'],
        price: 14.9,
        action: 'add'
      },
      {
        id: 'wanfeng-drink-4',
        name: '百香果三响炮',
        monthSalesText: '月售 240+',
        tags: ['百香果', '多重果粒'],
        price: 16.9,
        action: 'add'
      },
      {
        id: 'wanfeng-drink-5',
        name: '鲜榨橙汁',
        monthSalesText: '月售 210+',
        tags: ['鲜榨', '橙汁', '维C'],
        price: 13.9,
        action: 'add'
      }
    ]
  }
];

const SHOP_RECOMMENDS: { id: string; title: string; price: number; img?: string; tag?: string }[] = [
  { id: 'r1', title: '皮蛋瘦肉粥', price: 9.9, img: zhouPidan },
  { id: 'r2', title: '鲜肉小笼包', price: 4.5, img: zhouXiaolongbao },
  { id: 'r3', title: '南瓜小米粥', price: 6, img: zhouNangua }
];

const getShopMenu = (shopName: string): DishCategory[] => {
  if (shopName === '晚风冰品社') {
    return SHOP_MENU_DESSERT;
  }
  return SHOP_MENU_PORRIDGE;
};

// 姓名池（用于生成随机骑手名字）
const SURNAMES = ['张', '王', '李', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕'];
const MALE_NAMES = ['伟', '强', '磊', '军', '洋', '勇', '杰', '涛', '明', '超', '刚', '建华', '文', '华', '建国', '建', '志', '勇', '辉', '鹏', '飞', '龙', '斌', '峰', '浩', '宇', '博', '鑫', '亮', '凯'];
const FEMALE_NAMES = ['芳', '娜', '敏', '静', '丽', '艳', '红', '玲', '雪', '梅', '秀英', '秀兰', '霞', '平', '桂英', '秀', '英', '华', '玉', '兰', '萍', '燕', '莉', '娟', '艳', '玲', '霞', '敏', '静'];

// 生成随机骑手名字
const generateRiderName = () => {
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  const nameList = gender === 'male' ? MALE_NAMES : FEMALE_NAMES;
  const givenName = nameList[Math.floor(Math.random() * nameList.length)];
  return `${surname}${givenName}`;
};

const ShopOrderPage: React.FC<{
  shop: ShopPreview;
  onBack: () => void;
}> = ({ shop, onBack }) => {
  const [tab, setTab] = React.useState<'点餐' | '评价' | '商家'>('点餐');
  const shopMenu = React.useMemo(() => getShopMenu(shop.name), [shop.name]);
  const [catId, setCatId] = React.useState<string>(shopMenu[0]?.id ?? 'like');
  const [cartMap, setCartMap] = React.useState<Record<string, CartEntry>>({});
  const [flyBalls, setFlyBalls] = React.useState<
    { id: string; fromX: number; fromY: number; toX: number; toY: number; ctrlX: number; ctrlY: number }[]
  >([]);
  const [specVisible, setSpecVisible] = React.useState(false);
  const [specOpen, setSpecOpen] = React.useState(false);
  const [specDish, setSpecDish] = React.useState<Dish | null>(null);
  const [specSweetness, setSpecSweetness] = React.useState<'加糖' | '不加糖'>('不加糖');
  const [specPortion, setSpecPortion] = React.useState<'3' | '6'>('3');
  const [specSoftCount, setSpecSoftCount] = React.useState<'1' | '2' | '4'>('1');
  const [specQty, setSpecQty] = React.useState(1);
  const [cartVisible, setCartVisible] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [activePocketId, setActivePocketId] = React.useState<number>(1);
  const [unlockedPocketCount, setUnlockedPocketCount] = React.useState<number>(2);
  const [minOrderDialogOpen, setMinOrderDialogOpen] = React.useState(false);
  const [hasEatCard, setHasEatCard] = React.useState(false);
  const [receiverPickerOpen, setReceiverPickerOpen] = React.useState(false);
  const [receiverPickerVisible, setReceiverPickerVisible] = React.useState(false);
  const [receiver, setReceiver] = React.useState<{ id: string; name: string; avatarUrl?: string } | null>(null);
  const [roles, setRoles] = React.useState<{ id: string; name: string; avatarUrl?: string }[]>([]);
  const [deliveryTimePickerOpen, setDeliveryTimePickerOpen] = React.useState(false);
  const [deliveryTimePickerVisible, setDeliveryTimePickerVisible] = React.useState(false);
  const [selectedDeliveryType, setSelectedDeliveryType] = React.useState<'immediate' | 'scheduled'>('immediate');
  const [selectedScheduledTime, setSelectedScheduledTime] = React.useState<{ date: Date; timeSlot: string } | null>(null);
  const [selectedDateIndex, setSelectedDateIndex] = React.useState(0);
  const [receiverRequiredDialogOpen, setReceiverRequiredDialogOpen] = React.useState(false);
  // 支付相关状态
  const [showPaymentPasswordDialog, setShowPaymentPasswordDialog] = React.useState(false);
  const [paymentPassword, setPaymentPassword] = React.useState('');
  const [paymentPasswordError, setPaymentPasswordError] = React.useState('');
  const [wechatWallet, setWechatWallet] = React.useState<WeChatWallet | null>(() => loadWeChatWallet());
  const [currentPayTotal, setCurrentPayTotal] = React.useState(0);
  const [wechatSelfProfile, setWechatSelfProfile] = React.useState<WeChatSelfProfile>(() => loadWeChatSelfProfile());
  const [showPaymentSuccess, setShowPaymentSuccess] = React.useState(false);
  const [showSuccessToast, setShowSuccessToast] = React.useState(false);
  // 订单详情相关状态
  type OrderStatus = '商家接单' | '商家已出餐' | '骑手正在送货' | '已送达';
  const [orderDetailVisible, setOrderDetailVisible] = React.useState(false);
  const [orderStatus, setOrderStatus] = React.useState<OrderStatus>('商家接单');
  const [orderId, setOrderId] = React.useState<string>('');
  const [orderStartTime, setOrderStartTime] = React.useState<Date | null>(null);
  const [orderProgress, setOrderProgress] = React.useState(0); // 0-100
  const progressIntervalRef = React.useRef<number | null>(null);
  const [riderName, setRiderName] = React.useState<string>('');

  // 订单进度更新逻辑
  React.useEffect(() => {
    if (!orderDetailVisible || !orderStartTime) return;
    
    // 基于真实配送时间（25分钟）来推进进度条和状态
    const totalDeliveryTime = 25 * 60 * 1000; // 25分钟，单位：毫秒
    
    // 状态切换时间点（基于25分钟分配，4个关键点）
    const statusTimings = {
      '商家接单': 0,                        // 0分钟（初始状态）
      '商家已出餐': 8 * 60 * 1000,          // 8分钟
      '骑手正在送货': 18 * 60 * 1000,       // 18分钟
      '已送达': totalDeliveryTime            // 25分钟
    };
    
    // 初始状态：商家接单
    setOrderStatus('商家接单');
    
    // 更新进度条（每秒更新一次）
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - orderStartTime.getTime();
      const progress = Math.min((elapsed / totalDeliveryTime) * 100, 100);
      setOrderProgress(progress);
      
      // 根据进度更新状态
      if (elapsed >= statusTimings['已送达']) {
        setOrderStatus('已送达');
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      } else if (elapsed >= statusTimings['骑手正在送货']) {
        setOrderStatus('骑手正在送货');
      } else if (elapsed >= statusTimings['商家已出餐']) {
        setOrderStatus('商家已出餐');
      }
    }, 1000); // 每秒更新一次
    
    // 清理定时器
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [orderDetailVisible, orderStartTime]);

  // 时间格式化函数
  const formatTime = React.useCallback((d: Date) => {
    const h = `${d.getHours()}`.padStart(2, '0');
    const m = `${d.getMinutes()}`.padStart(2, '0');
    return `${h}:${m}`;
  }, []);

  const formatDate = React.useCallback((d: Date) => {
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${month}-${day}`;
  }, []);

  const getWeekday = React.useCallback((d: Date) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[d.getDay()];
  }, []);

  // 配送时间选择相关的回调函数
  const openDeliveryTimePicker = React.useCallback(() => {
    setSelectedDateIndex(0); // 打开时重置到第一个日期（今日）
    setDeliveryTimePickerVisible(true);
    requestAnimationFrame(() => setDeliveryTimePickerOpen(true));
  }, []);

  const closeDeliveryTimePicker = React.useCallback(() => {
    setDeliveryTimePickerOpen(false);
    window.setTimeout(() => {
      setDeliveryTimePickerVisible(false);
    }, 180);
  }, []);

  const handleSelectImmediate = React.useCallback(() => {
    setSelectedDeliveryType('immediate');
    setSelectedScheduledTime(null);
  }, []);

  // 打开收货人选择弹窗
  const openReceiverPicker = React.useCallback(() => {
    setReceiverPickerVisible(true);
    requestAnimationFrame(() => setReceiverPickerOpen(true));
  }, []);

  // 关闭收货人选择弹窗
  const closeReceiverPicker = React.useCallback(() => {
    setReceiverPickerOpen(false);
    window.setTimeout(() => {
      setReceiverPickerVisible(false);
    }, 180);
  }, []);

  // 选择时间段的处理函数
  const handleSelectTimeSlot = React.useCallback((slot: { start: Date; end: Date; label: string; isAsap: boolean }, date: Date) => {
    setSelectedScheduledTime({ date, timeSlot: slot.label });
    setSelectedDeliveryType('scheduled');
    closeDeliveryTimePicker();
  }, [closeDeliveryTimePicker]);

  // 处理支付按钮点击
  const handlePayClick = React.useCallback(() => {
    if (!receiver) {
      setReceiverRequiredDialogOpen(true);
      return;
    }
    // 检查钱包是否存在
    const wallet = loadWeChatWallet();
    if (!wallet) {
      alert('请先在微信中创建钱包');
      return;
    }
    
    // 计算支付金额
    const entries = Object.values(cartMap);
    const packFee = entries.length > 0 ? 2 : 0;
    const deliveryOriginFee = SHOP_PROMOS[shop.name]?.deliveryFee ?? 3;
    const eatCardPrice = 9.9;
    const calcShopDiscount = (amount: number) => {
      const tiers = SHOP_PROMOS[shop.name]?.shopDiscountTiers ?? [];
      return calcTierDiscount(amount, tiers);
    };
    const calcEatCardDiscount = (amount: number) => {
      const tiers = SHOP_PROMOS[shop.name]?.eatCardDiscountTiers ?? [];
      return calcTierDiscount(amount, tiers);
    };
    const cartTotal = entries.reduce((sum, e) => sum + (e?.unitPrice ?? 0) * (e?.qty ?? 0), 0);
    const shopDiscount = entries.length > 0 ? calcShopDiscount(cartTotal) : 0;
    let cardDiscount = 0;
    if (entries.length > 0) {
      const amountAfterShop = cartTotal + packFee + deliveryOriginFee - shopDiscount;
      if (hasEatCard) {
        cardDiscount = calcEatCardDiscount(amountAfterShop);
      }
    }
    const baseAmount = cartTotal + packFee + deliveryOriginFee + (hasEatCard ? eatCardPrice : 0);
    const discountTotal = entries.length > 0 ? shopDiscount + cardDiscount : 0;
    const payTotal = Math.max(0, baseAmount - discountTotal);
    
    // 加载最新的微信资料
    const profile = loadWeChatSelfProfile();
    setWechatSelfProfile(profile);
    
    setCurrentPayTotal(payTotal);
    setWechatWallet(wallet);
    // 直接显示密码输入面板
    setShowPaymentPasswordDialog(true);
    setPaymentPassword('');
    setPaymentPasswordError('');
  }, [receiver, cartMap, shop.name, hasEatCard]);

  // 处理选择支付方式（Lumi钱包）- 现在在密码面板中显示，这个函数可以保留用于未来扩展
  const handleSelectPaymentMethod = React.useCallback(() => {
    // 支付方式选择现在在密码面板中，不需要单独弹窗
  }, []);

  // 处理支付密码输入
  const handlePaymentPasswordInput = React.useCallback((digit: string) => {
    if (paymentPassword.length >= 6) return;
    const newPassword = paymentPassword + digit;
    setPaymentPassword(newPassword);
    setPaymentPasswordError('');
    
    // 如果输入了6位密码，自动验证
    if (newPassword.length === 6) {
      setTimeout(() => {
        handleConfirmPayment(newPassword);
      }, 200);
    }
  }, [paymentPassword]);

  // 处理支付密码删除
  const handlePaymentPasswordDelete = React.useCallback(() => {
    setPaymentPassword(prev => prev.slice(0, -1));
    setPaymentPasswordError('');
  }, []);

  // 确认支付
  const handleConfirmPayment = React.useCallback((password: string) => {
    if (!wechatWallet) return;
    
    // 验证支付密码
    if (password !== wechatWallet.paymentPassword) {
      setPaymentPasswordError('支付密码错误');
      setPaymentPassword('');
      return;
    }

    // 检查余额
    if (wechatWallet.balance < currentPayTotal) {
      setPaymentPasswordError('余额不足');
      setPaymentPassword('');
      return;
    }

    // 扣款
    const updatedWallet: WeChatWallet = {
      ...wechatWallet,
      balance: wechatWallet.balance - currentPayTotal
    };
    saveWeChatWallet(updatedWallet);
    setWechatWallet(updatedWallet);

    // 显示支付成功动画
    setShowPaymentSuccess(true);
    
    // 生成订单ID
    const newOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setOrderId(newOrderId);
    
    // 延迟关闭密码输入弹窗并跳转到订单详情
    setTimeout(() => {
      setShowPaymentPasswordDialog(false);
      setPaymentPassword('');
      setShowPaymentSuccess(false);
      
      // 清空购物车
      setCartMap({});
      
      // 跳转到订单详情页面
      const startTime = new Date();
      setOrderStartTime(startTime);
      setOrderStatus('商家接单');
      setOrderProgress(0);
      // 生成随机骑手名字
      setRiderName(generateRiderName());
      setOrderDetailVisible(true);
    }, 1500);
  }, [wechatWallet, currentPayTotal]);

  // 加载已创建角色列表，用于结算页选择收货人
  React.useEffect(() => {
    try {
      const STORAGE_KEY = 'mini-ai-phone.story-roles';
      const raw = appStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      // 再从微信通讯录里加载当前仍存在的联系人，只允许这些角色作为收货人
      const WECHAT_CONTACTS_KEY = 'mini-ai-phone.wechat-contacts';
      const rawContacts = appStorage.getItem(WECHAT_CONTACTS_KEY);
      const contactList: { roleId: string }[] = rawContacts ? JSON.parse(rawContacts) : [];
      const aliveRoleIdSet = new Set(
        Array.isArray(contactList) ? contactList.map((c: any) => String(c.roleId)) : []
      );

      const simpleRoles = parsed
        // 过滤掉已删除/禁用的角色（不同版本可能用不同字段，全部兜底判断一次）
        .filter(
          (r: any) =>
            r &&
            aliveRoleIdSet.has(String(r.id ?? r.roleId)) &&
            r.deleted !== true &&
            r.isDeleted !== true &&
            r.status !== 'deleted' &&
            r.enabled !== false
        )
        .map((r: any) => ({
          id: String(r.id ?? r.roleId ?? Math.random().toString(16).slice(2)),
          name: String(r.name ?? r.realName ?? r.wechatNickname ?? '未命名角色'),
          avatarUrl: typeof r.avatarUrl === 'string' ? r.avatarUrl : undefined
        }));

      setRoles(simpleRoles);
    } catch {
      // ignore parse errors
    }
  }, []);
  const [checkoutMode, setCheckoutMode] = React.useState<'menu' | 'checkout'>('menu');
  const [reviewFilter, setReviewFilter] = React.useState<'全部' | '有图/视频' | '近期差评'>('全部');
  const [reviewSort, setReviewSort] = React.useState<'最新' | '好评'>('最新');
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const menuLeftRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const navModeRef = React.useRef<'scroll' | 'click'>('scroll');
  const clickUnlockTimerRef = React.useRef<number | null>(null);
  const clickStartedAtRef = React.useRef<number>(0);
  const specCloseTimerRef = React.useRef<number | null>(null);
  const cartCloseTimerRef = React.useRef<number | null>(null);
  const cartIconRef = React.useRef<HTMLDivElement | null>(null);

  const currentCat = React.useMemo(
    () => shopMenu.find((c) => c.id === catId) ?? shopMenu[0],
    [catId, shopMenu]
  );
  const minOrderPrice = SHOP_PROMOS[shop.name]?.startPrice ?? 0;
  const deliveryFee = SHOP_PROMOS[shop.name]?.deliveryFee ?? 3;

  const cartCount = React.useMemo(() => {
    return Object.values(cartMap).reduce((sum, x) => sum + (x?.qty ?? 0), 0);
  }, [cartMap]);

  const cartTotal = React.useMemo(() => {
    let total = 0;
    for (const x of Object.values(cartMap)) {
      total += (x?.unitPrice ?? 0) * (x?.qty ?? 0);
    }
    return total;
  }, [cartMap]);

  const addToCart = React.useCallback((dishKey: string, entry: Omit<CartEntry, 'qty'>, unitPrice: number) => {
    setCartMap((prev) => {
      const prevEntry = prev[dishKey];
      return {
        ...prev,
        [dishKey]: {
          ...(prevEntry ?? entry),
          qty: (prevEntry?.qty ?? 0) + 1,
          unitPrice: Number.isFinite(unitPrice) ? unitPrice : prevEntry?.unitPrice ?? entry.unitPrice
        }
      };
    });
  }, []);

  const removeOneByKey = React.useCallback((dishKey: string) => {
    setCartMap((prev) => {
      const entry = prev[dishKey];
      if (!entry) return prev;
      const nextQty = (entry.qty ?? 0) - 1;
      const next = { ...prev };
      if (nextQty <= 0) delete next[dishKey];
      else next[dishKey] = { ...entry, qty: nextQty };
      return next;
    });
  }, []);

  const clearCartAll = React.useCallback(() => {
    setCartMap({});
    setActivePocketId(1);
    setUnlockedPocketCount(2);
  }, []);

  const deletePocket = React.useCallback(
    (pocketId: number) => {
      // 至少保留一个口袋
      if (pocketId <= 1) return;

      setCartMap((prev) => {
        const next: Record<string, CartEntry> = {};
        for (const [k, v] of Object.entries(prev)) {
          // 删除口袋不影响总数：被删除口袋的商品默认并入口袋1
          const targetPocketId = v.pocketId === pocketId ? 1 : v.pocketId > pocketId ? v.pocketId - 1 : v.pocketId;

          // key: p{pocketId}::{dishId}::{variant}[::{specText}]
          const parts = k.split('::');
          if (parts.length < 3) {
            // 异常 key，直接按目标口袋写入（不尝试重写 key）
            next[k] = { ...v, pocketId: targetPocketId };
            continue;
          }
          const dishId = parts[1];
          const rest = parts.slice(2).join('::');
          const newKey = `p${targetPocketId}::${dishId}::${rest}`;

          const prevNext = next[newKey];
          if (prevNext) {
            next[newKey] = { ...prevNext, qty: (prevNext.qty ?? 0) + (v.qty ?? 0) };
          } else {
            next[newKey] = { ...v, pocketId: targetPocketId };
          }
        }
        return next;
      });

      setUnlockedPocketCount((prev) => Math.max(2, prev - 1));
      setActivePocketId((prev) => {
        if (prev === pocketId) return 1;
        if (prev > pocketId) return prev - 1;
        return prev;
      });
    },
    [setCartMap]
  );

  const openCart = React.useCallback(() => {
    if (cartCloseTimerRef.current) {
      window.clearTimeout(cartCloseTimerRef.current);
      cartCloseTimerRef.current = null;
    }
    setCartVisible(true);
    requestAnimationFrame(() => setCartOpen(true));
  }, []);

  const closeCart = React.useCallback(() => {
    setCartOpen(false);
    if (cartCloseTimerRef.current) window.clearTimeout(cartCloseTimerRef.current);
    cartCloseTimerRef.current = window.setTimeout(() => {
      setCartVisible(false);
    }, 180);
  }, []);

  const flyToCart = React.useCallback((fromEl: HTMLElement | null) => {
    const toEl = cartIconRef.current;
    if (!fromEl || !toEl) return;
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    const fromX = fromRect.left + fromRect.width / 2;
    const fromY = fromRect.top + fromRect.height / 2;
    const toX = toRect.left + toRect.width / 2;
    const toY = toRect.top + toRect.height / 2;

    // 控制点：取中点并向上抬，形成抛物线
    const ctrlX = (fromX + toX) / 2;
    const ctrlY = Math.min(fromY, toY) - 140;

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setFlyBalls((prev) => [...prev, { id, fromX, fromY, toX, toY, ctrlX, ctrlY }]);
    window.setTimeout(() => {
      setFlyBalls((prev) => prev.filter((b) => b.id !== id));
    }, 720);
  }, []);

  const addToCartWithFly = React.useCallback(
    (dishKey: string, entry: Omit<CartEntry, 'qty'>, unitPrice: number, fromEl: HTMLElement | null) => {
      addToCart(dishKey, entry, unitPrice);
      flyToCart(fromEl);
    },
    [addToCart, flyToCart]
  );

  const getDishQty = React.useCallback(
    (dishId: string) => {
      let sum = 0;
      for (const [k, v] of Object.entries(cartMap)) {
        // key: p{pocketId}::{dishId}::{variant}[::{specText}]
        if (k.includes(`::${dishId}::`)) sum += v?.qty ?? 0;
      }
      return sum;
    },
    [cartMap]
  );

  const removeOneFromDish = React.useCallback(
    (dishId: string) => {
      const activePrefix = `p${activePocketId}::${dishId}::`;
      setCartMap((prev) => {
        // 优先减 active pocket 的 default；否则减 active pocket 的任意 variant；再否则减任意 pocket 的任意 variant
        const allKeys = Object.keys(prev).filter((k) => k.includes(`::${dishId}::`) && (prev[k]?.qty ?? 0) > 0);
        const activeKeys = allKeys.filter((k) => k.startsWith(`p${activePocketId}::`));
        const keys = activeKeys.length > 0 ? activeKeys : allKeys;
        if (keys.length === 0) return prev;
        const preferred = `${activePrefix}default`;
        const pickKey = keys.includes(preferred) ? preferred : keys[0];
        const entry = prev[pickKey];
        const nextQty = (entry?.qty ?? 0) - 1;
        const next = { ...prev };
        if (nextQty <= 0) {
          delete next[pickKey];
        } else {
          next[pickKey] = { ...(entry as CartEntry), qty: nextQty };
        }
        return next;
      });
    },
    [setCartMap]
  );

  const SWEET_PORRIDGE_SET = React.useMemo(
    () =>
      new Set([
        '南瓜小米粥',
        '红枣桂圆黑米粥',
        '紫薯燕麦粥',
        '莲子芡实养生粥',
        '银耳莲子百合粥',
        '养生杂粮粥'
      ]),
    []
  );

  const isBaozi = React.useCallback((dish: Dish) => {
    // 晚风冰品社的“软萌甜品”里会出现“麻薯小包”等命名，不能按包子处理
    if ((dish.tags ?? []).includes('软萌甜品')) return false;
    // 包子类：包含“小笼包”或以“包”结尾/包含“包”
    return dish.name.includes('小笼包') || dish.name.includes('包');
  }, []);

  const isSweetPorridge = React.useCallback(
    (dish: Dish) => {
      return dish.name.includes('粥') && SWEET_PORRIDGE_SET.has(dish.name);
    },
    [SWEET_PORRIDGE_SET]
  );

  const wantsSpecSheet = React.useCallback(
    (dish: Dish) => {
      if (shop.name !== '一碗热乎粥') {
        // 晚风冰品社：软萌甜品强制选规格
        if (isWanfengSoftDessert(shop.name, dish)) return true;
        return dish.action === 'spec';
      }
      // 粥铺规则：
      // - 仅部分粥类需要甜度规格
      // - 包子类需要份量规格
      return isSweetPorridge(dish) || isBaozi(dish);
    },
    [shop.name, isSweetPorridge, isBaozi]
  );

  const openSpec = React.useCallback((dish: Dish) => {
    if (specCloseTimerRef.current) {
      window.clearTimeout(specCloseTimerRef.current);
      specCloseTimerRef.current = null;
    }
    setSpecDish(dish);
    setSpecQty(1);
    setSpecSweetness('不加糖');
    setSpecPortion('3');
    setSpecSoftCount(dish.name === '原味麻薯小包' ? '2' : '1');
    setSpecVisible(true);
    // 下一帧再打开，触发 CSS transition
    requestAnimationFrame(() => setSpecOpen(true));
  }, []);

  const closeSpec = React.useCallback(() => {
    setSpecOpen(false);
    if (specCloseTimerRef.current) window.clearTimeout(specCloseTimerRef.current);
    specCloseTimerRef.current = window.setTimeout(() => {
      setSpecVisible(false);
      setSpecDish(null);
    }, 180);
  }, []);

  // 弹窗打开时锁定点单页滚动（容器滚动，而不是 window）
  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (specVisible) {
      const prev = el.style.overflowY;
      el.style.overflowY = 'hidden';
      return () => {
        el.style.overflowY = prev;
      };
    }
    return;
  }, [specVisible]);

  // ESC 关闭
  React.useEffect(() => {
    if (!specVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSpec();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [specVisible, closeSpec]);

  const getDishTagTexts = React.useCallback(
    (dish: Dish) => {
      if (shop.name === '一碗热乎粥') {
        return (ZHOU_DISH_INGREDIENT_TAGS[dish.name] ?? dish.tags ?? []).slice(0, 3);
      }
      // 晚风冰品社：`软萌甜品` 是分类标识，用于规格逻辑，不作为菜品标签展示
      const tags = (dish.tags ?? []).filter((t) => t !== '软萌甜品');
      return tags.slice(0, 3);
    },
    [shop.name]
  );

  const reviews: ShopReview[] = React.useMemo(() => {
    if (shop.name === '晚风冰品社') {
      // 晚风冰品社：更生活化、更像真人的评价（含少量差评/建议）
      return [
        {
          id: 'wf-r1',
          userName: '橘子海',
          rating: 5,
          tasteRating: 5,
          packRating: 5,
          date: '2026-03-16',
          text: '#草莓芝士冰沙杯# 真的有芝士味，不是香精那种，草莓酸甜刚好，喝到最后也不齁。冰沙颗粒细，喉咙很舒服😋',
          images: []
        },
        {
          id: 'wf-r2',
          userName: '今晚不熬夜(努力版)',
          rating: 5,
          tasteRating: 5,
          packRating: 4,
          date: '2026-03-15',
          text: '#薄荷柠檬冰爽茶# 一口下去直接醒神，薄荷是清凉不是“牙膏味”。柠檬片给得挺实在，少糖也有味道。',
          images: []
        },
        {
          id: 'wf-r3',
          userName: '小熊软糖过敏',
          rating: 4,
          tasteRating: 4,
          packRating: 5,
          date: '2026-03-15',
          text: '#奶油草莓雪媚娘# 皮很软，奶油不腻，草莓挺新鲜的。就是我这单有点小融了，可能路上太久了，但整体还是好吃。',
          images: []
        },
        {
          id: 'wf-r4',
          userName: '糯叽叽爱好者',
          rating: 5,
          tasteRating: 5,
          packRating: 5,
          date: '2026-03-14',
          text: '#原味麻薯小包# 选了4个，Q弹到想拍桌，外皮不粘牙，里面是淡淡奶香。这个当下午茶太合适了🤍',
          images: []
        },
        {
          id: 'wf-r5',
          userName: '桃子气泡',
          rating: 4,
          tasteRating: 4,
          packRating: 4,
          date: '2026-03-14',
          text: '#桃桃气泡冻冻冰# 冻冻口感蛮上头的，桃味不假。就是气泡到手没那么足了（能理解外卖），建议现场喝会更爽。',
          images: []
        },
        {
          id: 'wf-r6',
          userName: '白桃乌龙少糖',
          rating: 5,
          tasteRating: 5,
          packRating: 4,
          date: '2026-03-13',
          text: '#芒果千层# 千层皮薄，奶油轻，芒果味很正。甜度刚刚好，吃完不想狂喝水的那种。',
          images: []
        },
        {
          id: 'wf-r7',
          userName: '砂糖橘选手',
          rating: 5,
          tasteRating: 5,
          packRating: 5,
          date: '2026-03-13',
          text: '#杨枝甘露冰酪# 不是那种稀稀的，芒果味浓，西柚粒也给到了。冰酪口感像轻冰淇淋，夏天就靠它续命🧊',
          images: []
        },
        {
          id: 'wf-r8',
          userName: '只喝清爽的',
          rating: 4,
          tasteRating: 4,
          packRating: 5,
          date: '2026-03-12',
          text: '#青提柠檬茶# 清爽型，青提香气很明显，柠檬不苦。唯一建议：我个人希望酸一点点。',
          images: []
        },
        {
          id: 'wf-r9',
          userName: '焦糖布丁不焦虑',
          rating: 3,
          tasteRating: 3,
          packRating: 4,
          date: '2026-03-12',
          text: '#椰奶冻糕# 口感很Q，椰香也有，但我觉得偏甜（我本来就很少吃甜）。嗜甜党应该会喜欢。',
          images: []
        },
        {
          id: 'wf-r10',
          userName: '碎冰冰',
          rating: 4,
          tasteRating: 4,
          packRating: 3,
          date: '2026-03-11',
          text: '#奥利奥芝士绵绵冰# 料挺多的，奥利奥碎很香。包装稍微有点渗水，不过没洒出来，整体能接受🙂',
          images: []
        },
        {
          id: 'wf-r11',
          userName: '芋泥脑袋',
          rating: 5,
          tasteRating: 5,
          packRating: 4,
          date: '2026-03-11',
          text: '#芋泥波波冰沙碗# 芋泥很细，波波有嚼劲，属于越吃越上瘾的那种。建议配勺子更方便。',
          images: []
        },
        {
          id: 'wf-r12',
          userName: '榴莲星人',
          rating: 4,
          tasteRating: 5,
          packRating: 4,
          date: '2026-03-10',
          text: '#榴莲班戟# 榴莲味很真，不是淡淡的。唯一就是我这单到手有点压扁了，可能骑手路上颠簸。',
          images: []
        },
        {
          id: 'wf-r13',
          userName: '气泡水当水喝',
          rating: 4,
          tasteRating: 4,
          packRating: 5,
          date: '2026-03-10',
          text: '#蜜桃乌龙气泡水# 乌龙香挺舒服，蜜桃不冲。冰块多一点的话更完美（到手已经化了一些）。',
          images: []
        },
        {
          id: 'wf-r14',
          userName: '酸甜口入门',
          rating: 5,
          tasteRating: 5,
          packRating: 5,
          date: '2026-03-09',
          text: '#百香果三响炮# 这个太适合饭后了，酸酸甜甜很解腻，果粒口感也好，喝完想再来一杯👍',
          images: []
        },
        {
          id: 'wf-r15',
          userName: '橙子不是橘子',
          rating: 4,
          tasteRating: 4,
          packRating: 5,
          date: '2026-03-09',
          text: '#鲜榨橙汁# 不是那种稀薄的，橙味很浓，有点果肉纤维。就是我更喜欢冰一点点。',
          images: []
        },
        {
          id: 'wf-r16',
          userName: '不想上班的土豆',
          rating: 2,
          tasteRating: 2,
          packRating: 3,
          date: '2026-03-08',
          text: '#黑糖珍珠鲜奶冰# 我这杯珍珠偏硬，可能放久了？黑糖味不错但口感没跟上，希望下次能更Q。',
          images: []
        },
        {
          id: 'wf-r17',
          userName: '晚风有点甜',
          rating: 5,
          tasteRating: 5,
          packRating: 4,
          date: '2026-03-08',
          text: '已经回购第三次了，整体甜度很克制，吃完不会难受。朋友来我家基本都会点一单✨',
          images: []
        },
        {
          id: 'wf-r18',
          userName: '想吃两口就饱',
          rating: 3,
          tasteRating: 3,
          packRating: 4,
          date: '2026-03-07',
          text: '#紫米奶酪三明治# 紫米挺香，奶酪也不腻，但我觉得份量有点小（可能我太饿了）。味道是OK的。',
          images: []
        },
        {
          id: 'wf-r19',
          userName: '拧巴小柠檬',
          rating: 2,
          tasteRating: 2,
          packRating: 3,
          date: '2026-03-06',
          text: '#薄荷柠檬冰爽茶# 我点的少糖还是偏甜，而且到手基本不太冰了，喝起来有点寡。可能我这边距离远吧。',
          images: []
        },
        {
          id: 'wf-r20',
          userName: '碎碎念收纳盒',
          rating: 1,
          tasteRating: 1,
          packRating: 2,
          date: '2026-03-06',
          text: '#草莓芝士冰沙杯# 这单翻车了…到手已经化成半杯水，封口也有点松，桌上滴得到处都是。味道我没法评价，体验很差😓',
          images: []
        },
        {
          id: 'wf-r21',
          userName: '今天也想躺平',
          rating: 2,
          tasteRating: 3,
          packRating: 1,
          date: '2026-03-05',
          text: '#杨枝甘露冰酪# 味道其实OK，但包装没给我配勺子，冰酪在那儿我只能拿吸管戳…而且外袋湿了。',
          images: []
        },
        {
          id: 'wf-r22',
          userName: '芝士是底线',
          rating: 2,
          tasteRating: 2,
          packRating: 4,
          date: '2026-03-04',
          text: '#奥利奥芝士绵绵冰# 这一份奥利奥碎给得比较少，吃到后面就是白冰+奶味，感觉不太值。希望能稳定一点。',
          images: []
        },
        {
          id: 'wf-r23',
          userName: '对甜很敏感',
          rating: 1,
          tasteRating: 1,
          packRating: 3,
          date: '2026-03-04',
          text: '#椰奶冻糕# 甜到发苦那种（我真没夸张），吃两口就放下了。能不能出个“低糖版”啊🥲',
          images: []
        },
        {
          id: 'wf-r24',
          userName: '糯米团子观察员',
          rating: 2,
          tasteRating: 2,
          packRating: 4,
          date: '2026-03-03',
          text: '#原味麻薯小包# 我这单麻薯有点硬，像放久了的口感，嚼得累。可能当天批次问题？',
          images: []
        },
        {
          id: 'wf-r25',
          userName: '芒果过敏但嘴馋',
          rating: 2,
          tasteRating: 2,
          packRating: 3,
          date: '2026-03-02',
          text: '#芒果千层# 奶油还行，但我这块芒果偏生偏酸，吃起来有点涩。千层皮也稍微厚了点。',
          images: []
        },
        {
          id: 'wf-r26',
          userName: '今天不想讲话',
          rating: 1,
          tasteRating: 2,
          packRating: 2,
          date: '2026-03-02',
          text: '#百香果三响炮# 本来想解腻，结果酸得牙疼，还带一点点苦味。可能是百香果不太熟？我个人不太能接受。',
          images: []
        }
      ];
    }

    // 先做静态 mock；后续可按 shop.name 切换不同数据
    return [
      {
        id: 'r1',
        userName: '小鹿不迷路',
        rating: 5,
        tasteRating: 5,
        packRating: 5,
        date: '2026-03-10',
        text: '#皮蛋瘦肉粥# 入口很绵，咸淡刚好，热乎到手很舒服，和一笼#鲜肉小笼包#一起点最香。',
        images: []
      },
      {
        id: 'r2',
        userName: '今天也要早睡',
        rating: 4,
        tasteRating: 4,
        packRating: 4,
        date: '2026-03-09',
        text: '#南瓜小米粥# 清甜不腻，早上再配一个#红糖发糕#，一顿刚刚好。',
        images: []
      },
      {
        id: 'r3',
        userName: '饭团团长',
        rating: 5,
        tasteRating: 5,
        packRating: 4,
        date: '2026-03-08',
        text: '#鲜肉小笼包# 汁水足，皮不厚，蘸点醋更香，顺手点了#茶叶蛋# 也不错。',
        images: []
      },
      {
        id: 'r4',
        userName: '橘子汽水不加冰',
        rating: 4,
        tasteRating: 4,
        packRating: 3,
        date: '2026-03-07',
        text: '#养生杂粮粥# 颗粒感挺明显，饱腹感强，适合减脂期。',
        images: []
      },
      {
        id: 'r5',
        userName: '阿布在路上',
        rating: 2,
        tasteRating: 2,
        packRating: 3,
        date: '2026-03-06',
        text: '#海鲜鲜虾粥# 虾不算多，鲜味一般，汤底有点淡，希望多给点料。',
        images: []
      },
      {
        id: 'r6',
        userName: '鸽子但不咕咕',
        rating: 3,
        tasteRating: 3,
        packRating: 4,
        date: '2026-03-05',
        text: '#南瓜排骨粥# 排骨给得实在，汤底浓，就是送到手稍微有点凉。',
        images: []
      },
      {
        id: 'r7',
        userName: '野生薄荷糖',
        rating: 4,
        tasteRating: 4,
        packRating: 4,
        date: '2026-03-04',
        text: '#山药排骨粥# 清润型的，喝完不口渴，挺耐喝。',
        images: []
      },
      {
        id: 'r8',
        userName: '秋刀鱼不下雨',
        rating: 3,
        tasteRating: 4,
        packRating: 2,
        date: '2026-03-03',
        text: '#玉米胡萝卜瘦肉粥# 味道可以，就是外卖路上洒出来一点，盒子有点油。',
        images: []
      },
      {
        id: 'r9',
        userName: '月亮邮差',
        rating: 5,
        tasteRating: 5,
        packRating: 5,
        date: '2026-03-02',
        text: '#红枣桂圆黑米粥# 香甜度刚好，黑米煮得软糯，暖胃。',
        images: []
      },
      {
        id: 'r10',
        userName: '白桃乌龙少糖',
        rating: 5,
        tasteRating: 5,
        packRating: 4,
        date: '2026-03-01',
        text: '#紫薯燕麦粥# 紫薯味很正，燕麦不硬，口感细。',
        images: []
      },
      {
        id: 'r11',
        userName: '风吹过八千里',
        rating: 4,
        tasteRating: 4,
        packRating: 4,
        date: '2026-02-28',
        text: '#莲子芡实养生粥# 料多，喝完很踏实，适合熬夜后的早晨。',
        images: []
      },
      {
        id: 'r12',
        userName: '奶茶研究员',
        rating: 2,
        tasteRating: 2,
        packRating: 3,
        date: '2026-02-27',
        text: '#银耳莲子百合粥# 太甜了，有点像糖水，喝几口就腻了。',
        images: []
      },
      {
        id: 'r13',
        userName: '快乐小电风扇',
        rating: 4,
        tasteRating: 4,
        packRating: 5,
        date: '2026-02-26',
        text: '#香菇青菜粥# 清淡款，晚饭不想吃太油就点它，偶尔会换成#养生杂粮粥#。',
        images: []
      },
      {
        id: 'r14',
        userName: '猫猫不熬夜',
        rating: 5,
        tasteRating: 5,
        packRating: 4,
        date: '2026-02-25',
        text: '#红糖发糕# 松软不噎，红糖香很足，配粥绝配。',
        images: []
      },
      {
        id: 'r15',
        userName: '柠檬海盐',
        rating: 4,
        tasteRating: 4,
        packRating: 4,
        date: '2026-02-24',
        text: '#葱花卷# 葱香挺浓，面发得好，口感不干，和#酱肉大包#一套吃很满足。',
        images: []
      },
      {
        id: 'r16',
        userName: '一颗会发光的豆',
        rating: 5,
        tasteRating: 5,
        packRating: 5,
        date: '2026-02-23',
        text: '#蔬菜鸡蛋煎饼# 外脆里软，蛋香明显，分量也足，边追剧边吃很快乐。',
        images: []
      },
      {
        id: 'r17',
        userName: '想吃两碗饭',
        rating: 4,
        tasteRating: 4,
        packRating: 3,
        date: '2026-02-22',
        text: '#豆沙包# 豆沙细腻不甜齁，包子皮软，小孩很爱吃。',
        images: []
      },
      {
        id: 'r18',
        userName: '沉迷碳水无法自拔',
        rating: 5,
        tasteRating: 5,
        packRating: 4,
        date: '2026-02-21',
        text: '#酱肉大包# 肉香浓，咸香下饭，一个就很顶。',
        images: []
      },
      {
        id: 'r19',
        userName: '不想起床星人',
        rating: 3,
        tasteRating: 3,
        packRating: 3,
        date: '2026-02-20',
        text: '#韭菜鸡蛋包# 韭菜味有点重，怕味道的小伙伴谨慎下单。',
        images: []
      },
      {
        id: 'r20',
        userName: '路过一只小企鹅',
        rating: 2,
        tasteRating: 2,
        packRating: 2,
        date: '2026-02-19',
        text: '#茶叶蛋# 味道一般，个头偏小，感觉不太值这个价。',
        images: []
      },
      {
        id: 'r21',
        userName: '楼下便利店店长',
        rating: 4,
        tasteRating: 4,
        packRating: 4,
        date: '2026-02-18',
        text: '整体还不错，夜班下班点一份热粥当宵夜，很顶，一直在回购这家。',
        images: []
      },
      {
        id: 'r22',
        userName: '迟到五分钟',
        rating: 3,
        tasteRating: 3,
        packRating: 3,
        date: '2026-02-17',
        text: '味道中规中矩吧，没有特别惊艳，但也不踩雷，胜在稳定。',
        images: []
      }
    ];
  }, [shop.name]);

  const filteredReviews = React.useMemo(() => {
    let list = reviews;
    if (reviewFilter === '有图/视频') {
      list = list.filter((r) => (r.images ?? []).length > 0);
    } else if (reviewFilter === '近期差评') {
      list = list.filter((r) => r.rating <= 2);
    }
    if (reviewSort === '好评') {
      list = [...list].sort((a, b) => b.rating - a.rating);
    } else {
      // 最新：按日期倒序（字符串 YYYY-MM-DD 可直接比较）
      list = [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
    }
    return list;
  }, [reviews, reviewFilter, reviewSort]);

  const shopRatingValue = React.useMemo(() => {
    const raw = shop.rating ?? '';
    const n = Number.parseFloat(String(raw).replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }, [shop.rating]);

  const renderReviewText = React.useCallback((text: string) => {
    // 将 #商品名# 片段按“商品名”高亮（黄色）
    const nodes: React.ReactNode[] = [];
    const re = /#([^#]+)#/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = re.lastIndex;
      if (start > last) nodes.push(text.slice(last, start));
      const label = m[1] ?? '';
      nodes.push(
        <span key={`${start}-${end}`} className="waimai-reviewHashtag">
          #{label}#
        </span>
      );
      last = end;
    }
    if (last < text.length) nodes.push(text.slice(last));
    return nodes;
  }, []);

  // 监听滚动，动态调整导航栏位置，使其跟随评价栏
  React.useEffect(() => {
    const tabsElement = tabsRef.current;
    const menuLeftElement = menuLeftRef.current;
    const menuWrapElement = menuLeftElement?.parentElement?.parentElement; // waimai-menuWrap

    if (!tabsElement || !menuLeftElement || !menuWrapElement) return;

    // 更新导航栏位置，使其始终紧贴在评价栏下方
    const updateMenuPosition = () => {
      const tabsHeight = tabsElement.offsetHeight;
      // 导航栏的 sticky top 值应该等于评价栏的高度
      // 这样当评价栏吸顶时（top: 0），导航栏会在评价栏下方吸顶（top: 评价栏高度）
      // 只设置 top 值，不覆盖 position（保持 CSS 中的 sticky !important）
      menuLeftElement.style.top = `${tabsHeight}px`;
    };

    // 初始计算
    updateMenuPosition();

    // 延迟再次计算，确保 DOM 完全渲染
    setTimeout(updateMenuPosition, 100);
    setTimeout(updateMenuPosition, 300);

    // 监听窗口大小变化
    const handleResize = () => {
      requestAnimationFrame(updateMenuPosition);
    };

    window.addEventListener('resize', handleResize);

    // 使用 ResizeObserver 监听评价栏和菜单区域高度变化
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateMenuPosition);
    });
    resizeObserver.observe(tabsElement);
    resizeObserver.observe(menuWrapElement);

    // 监听滚动，确保实时更新
    const handleScroll = () => {
      requestAnimationFrame(updateMenuPosition);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [tab]);

  const findDishByTitle = React.useCallback(
    (title: string): Dish | null => {
      const menu = getShopMenu(shop.name);
      for (const cat of menu) {
        for (const d of cat.dishes ?? []) {
          if (d.name === title) return d;
        }
      }
      return null;
    },
    [shop.name]
  );

  // 点单页：滚动到对应分类时，左侧导航自动高亮（scroll-spy）。
  // 与点击高亮互斥：点击后短暂锁定，待滚动停止后再切回 scroll 模式。
  React.useEffect(() => {
    if (tab !== '点餐') return;

    const getTabsHeight = () => tabsRef.current?.offsetHeight ?? 58;
    const getScrollContainer = () => scrollContainerRef.current;

    const getActiveCatIdByScroll = () => {
      const container = getScrollContainer();
      const tabsHeight = getTabsHeight();

      // 以滚动容器的可视区域为基准计算（不要用 window）
      const containerTop = container?.getBoundingClientRect().top ?? 0;
      const threshold = containerTop + tabsHeight + 12; // sticky tabs 下方一点点

      let active: string | null = null;
      let bestTop = -Infinity;

      const menu = getShopMenu(shop.name);
      for (const c of menu) {
        const el = document.getElementById(`menu-section-${c.id}`);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= threshold && top > bestTop) {
          bestTop = top;
          active = c.id;
        }
      }

      return active ?? menu[0]?.id ?? 'like';
    };

    let rafId = 0;
    const onScroll = () => {
      // 点击锁定期间不让滚动选中覆盖
      if (navModeRef.current !== 'scroll') {
        // 但要监听“滚动停止”，以便解锁
        if (clickUnlockTimerRef.current) {
          window.clearTimeout(clickUnlockTimerRef.current);
        }
        clickUnlockTimerRef.current = window.setTimeout(() => {
          // 避免刚点击就立刻解锁（某些环境 scroll 事件较少）
          if (Date.now() - clickStartedAtRef.current < 250) return;
          navModeRef.current = 'scroll';
          // 解锁瞬间立刻同步一次，避免停在新分类但高亮还停留旧值
          const active = getActiveCatIdByScroll();
          setCatId(active);
        }, 140);
        return;
      }

      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const active = getActiveCatIdByScroll();
        setCatId((prev) => (prev === active ? prev : active));
      });
    };

    // 首次进入点餐时同步一次
    onScroll();

    const container = getScrollContainer();
    if (container) {
      container.addEventListener('scroll', onScroll, { passive: true });
    } else {
      // 兜底：如果未来结构调整导致容器缺失，则回退到 window
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    window.addEventListener('resize', onScroll);
    return () => {
      if (container) {
        container.removeEventListener('scroll', onScroll);
      } else {
        window.removeEventListener('scroll', onScroll);
      }
      window.removeEventListener('resize', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
      if (clickUnlockTimerRef.current) {
        window.clearTimeout(clickUnlockTimerRef.current);
        clickUnlockTimerRef.current = null;
      }
    };
  }, [tab, shop.name]);

  // 订单详情页面（优先级最高）
  if (orderDetailVisible) {
    const orderStatusList: OrderStatus[] = ['商家接单', '商家已出餐', '骑手正在送货', '已送达'];
    const currentStatusIndex = orderStatusList.indexOf(orderStatus);
    
    // 计算预计送达时间（当前时间 + 25分钟）
    const now = new Date();
    const deliveryTime = new Date(now.getTime() + 25 * 60 * 1000);
    const formatTime = (d: Date) => {
      const h = `${d.getHours()}`.padStart(2, '0');
      const m = `${d.getMinutes()}`.padStart(2, '0');
      return `${h}:${m}`;
    };
    const deliveryTimeStr = formatTime(deliveryTime);
    
    return (
      <div className={`waimai-order-detail-page ${orderDetailVisible ? 'is-visible' : ''}`}>
        <div className="waimai-order-detail-header">
          <button
            type="button"
            className="waimai-order-detail-back"
            onClick={() => {
              setOrderDetailVisible(false);
              setCheckoutMode('menu');
            }}
          >
            ←
          </button>
          <div className="waimai-order-detail-header-title">订单详情</div>
          <div className="waimai-order-detail-header-right">
            <button type="button" className="waimai-order-detail-refresh">↻</button>
            <button type="button" className="waimai-order-detail-more">⋯</button>
          </div>
        </div>
        
        <div className="waimai-order-detail-content">
          <div className="waimai-order-detail-time">
            <div className="waimai-order-detail-time-main">{deliveryTimeStr} 最新送达时间</div>
            <div className="waimai-order-detail-time-status">{orderStatus}</div>
          </div>
          
          <div className="waimai-order-detail-progress">
            <div className="waimai-order-detail-progress-bar-container">
              <div className="waimai-order-detail-progress-bar-track">
                <div
                  className="waimai-order-detail-progress-bar-fill"
                  style={{ width: `${orderProgress}%` }}
                />
                {orderStatusList.map((status, index) => {
                  const position = (index / (orderStatusList.length - 1)) * 100;
                  return (
                    <div
                      key={status}
                      className={`waimai-order-detail-progress-icon-item ${index <= currentStatusIndex ? 'is-active' : ''}`}
                      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="waimai-order-detail-progress-icon">
                        {index === 0 && '🧾'}
                        {index === 1 && '📦'}
                        {index === 2 && '🛵'}
                        {index === 3 && '✅'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="waimai-order-detail-map">
            <div className="waimai-order-detail-map-placeholder">
              <div className="waimai-order-detail-map-icon">📍</div>
              <div className="waimai-order-detail-map-text">地图显示</div>
            </div>
          </div>
          
          <div className="waimai-order-detail-actions">
            <button type="button" className="waimai-order-detail-action-btn">更多</button>
            <button type="button" className="waimai-order-detail-action-btn">修改地址</button>
            <button type="button" className="waimai-order-detail-action-btn">申请售后</button>
            <button type="button" className="waimai-order-detail-action-btn waimai-order-detail-action-primary">在线联系</button>
          </div>
          
          <div className="waimai-order-detail-info">
            <div className="waimai-order-detail-info-title">订单信息</div>
            <div className="waimai-order-detail-info-item">
              <span className="waimai-order-detail-info-label">期望时间</span>
              <span className="waimai-order-detail-info-value">今天{formatTime(now)}-{deliveryTimeStr}</span>
            </div>
            <div className="waimai-order-detail-info-item">
              <span className="waimai-order-detail-info-label">收货人</span>
              <span className="waimai-order-detail-info-value">
                {receiver ? receiver.name : '未选择收货人'}
              </span>
            </div>
            <div className="waimai-order-detail-info-item">
              <span className="waimai-order-detail-info-label">备注信息</span>
              <span className="waimai-order-detail-info-value">汤粉分开装</span>
            </div>
            <div className="waimai-order-detail-info-item">
              <span className="waimai-order-detail-info-label">餐具数量</span>
              <span className="waimai-order-detail-info-value">商家按餐量提供</span>
            </div>
            <div className="waimai-order-detail-info-item">
              <span className="waimai-order-detail-info-label">配送服务</span>
              <span className="waimai-order-detail-info-value">Lumi快送</span>
            </div>
            <div className="waimai-order-detail-info-item">
              <span className="waimai-order-detail-info-label">配送骑手</span>
              <span className="waimai-order-detail-info-value">{riderName || '生成中...'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 结算页：当 checkoutMode === 'checkout' 时，渲染确认订单页面
  if (checkoutMode === 'checkout') {
    const entries = Object.values(cartMap);
    const itemCount = entries.reduce((sum, e) => sum + (e?.qty ?? 0), 0);
    const packFee = entries.length > 0 ? 2 : 0;
    // 各店铺独立配送费（默认 3 元）
    const deliveryOriginFee = SHOP_PROMOS[shop.name]?.deliveryFee ?? 3;
    const eatCardPrice = 9.9; // 超级吃货卡价格：9.9 元 / 6 张

    // 店铺满减（只针对菜品金额，不含配送费；不同店铺独立配置）
    const calcShopDiscount = (amount: number) => {
      const tiers = SHOP_PROMOS[shop.name]?.shopDiscountTiers ?? [];
      return calcTierDiscount(amount, tiers);
    };
    // 超级吃货卡：不同店铺独立配置；优先使用满足的最高档位
    const calcEatCardDiscount = (amount: number) => {
      const tiers = SHOP_PROMOS[shop.name]?.eatCardDiscountTiers ?? [];
      return calcTierDiscount(amount, tiers);
    };

    // 店铺优惠：始终基于菜品总价，可与吃货卡叠加
    const shopDiscount = entries.length > 0 ? calcShopDiscount(cartTotal) : 0;
    // 吃货卡优惠 & 预览：
    // 按“去掉店铺优惠后、但不包含吃货卡价格的应付金额”来判断吃货卡满减门槛
    // 也就是玩家本来要付的金额（菜品 + 打包 + 配送 - 店铺优惠），9.9 只是额外购买卡的价格
    let cardDiscount = 0;
    let eatCardPreviewDiscount = 0;
    if (entries.length > 0) {
      const amountAfterShop = cartTotal + packFee + deliveryOriginFee - shopDiscount;
      eatCardPreviewDiscount = calcEatCardDiscount(amountAfterShop);
      if (hasEatCard) {
        cardDiscount = eatCardPreviewDiscount;
      }
    }

    const baseAmount = cartTotal + packFee + deliveryOriginFee + (hasEatCard ? eatCardPrice : 0);
    const discountTotal = entries.length > 0 ? shopDiscount + cardDiscount : 0;
    // 外卖单菜品原价（不含配送费）满 15 返 80 金币，此后每增加 5 元追加 10 金币
    const coinBaseTotal = cartTotal; // 这里 cartTotal 只统计菜品金额
    const coinReturn =
      coinBaseTotal >= 15
        ? 80 + Math.floor((coinBaseTotal - 15) / 5) * 10
        : 0;
    const payTotal = Math.max(0, baseAmount - discountTotal);

    // 根据当前时间 + 配送时间（粥铺 25 分钟）动态计算"预计 XX:XX-XX:XX 送达"
    const formatTime = (d: Date) => {
      const h = `${d.getHours()}`.padStart(2, '0');
      const m = `${d.getMinutes()}`.padStart(2, '0');
      return `${h}:${m}`;
    };
    const formatDate = (d: Date) => {
      const month = `${d.getMonth() + 1}`.padStart(2, '0');
      const day = `${d.getDate()}`.padStart(2, '0');
      return `${month}-${day}`;
    };
    const getWeekday = (d: Date) => {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekdays[d.getDay()];
    };
    const ETA_MINUTES = 25;
    const ETA_RANGE_MINUTES = 15;
    const now = new Date();
    const etaStart = new Date(now.getTime() + ETA_MINUTES * 60 * 1000);
    const etaEnd = new Date(etaStart.getTime() + ETA_RANGE_MINUTES * 60 * 1000);
    const etaRangeText = `${formatTime(etaStart)}-${formatTime(etaEnd)}`;

    // 生成可选的日期列表（今日、明日、后日）
    const generateDateOptions = () => {
      const dates: { date: Date; label: string; isToday: boolean }[] = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        const isToday = i === 0;
        const label = isToday
          ? `今日(${getWeekday(d)})`
          : i === 1
            ? `明日(${getWeekday(d)})`
            : `${formatDate(d)}(${getWeekday(d)})`;
        dates.push({ date: d, label, isToday });
      }
      return dates;
    };

    // 生成时间段选项（从当前时间往后推1小时开始，每20分钟一个时间段）
    const generateTimeSlots = (targetDate: Date) => {
      const slots: { start: Date; end: Date; label: string; isAsap: boolean }[] = [];
      const targetTime = new Date(targetDate);
      
      // 如果是今天，从当前时间+1小时开始；如果是未来日期，从早上9点开始
      if (targetDate.toDateString() === now.toDateString()) {
        // 今天：从当前时间+1小时开始，向上取整到最近的20分钟
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        const minutes = oneHourLater.getMinutes();
        const roundedMinutes = Math.ceil(minutes / 20) * 20;
        let hours = oneHourLater.getHours();
        let finalMinutes = roundedMinutes;
        if (roundedMinutes >= 60) {
          hours += 1;
          finalMinutes = 0;
        }
        targetTime.setHours(hours, finalMinutes, 0, 0);
      } else {
        // 未来日期：从早上9点开始
        targetTime.setHours(9, 0, 0, 0);
      }

      // 生成到晚上22:00的时间段
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(22, 0, 0, 0);

      // 添加"尽快送达"选项（仅今天显示）
      if (targetDate.toDateString() === now.toDateString()) {
        const asapStart = new Date(now.getTime() + ETA_MINUTES * 60 * 1000);
        const asapEnd = new Date(asapStart.getTime() + ETA_RANGE_MINUTES * 60 * 1000);
        slots.push({
          start: asapStart,
          end: asapEnd,
          label: '尽快送达',
          isAsap: true
        });
      }

      // 生成时间段：每20分钟一个
      let currentTime = new Date(targetTime);
      while (currentTime < endOfDay) {
        const slotEnd = new Date(currentTime.getTime() + 20 * 60 * 1000);
        if (slotEnd > endOfDay) break;
        
        slots.push({
          start: new Date(currentTime),
          end: slotEnd,
          label: `${formatTime(currentTime)}-${formatTime(slotEnd)}`,
          isAsap: false
        });
        
        currentTime = new Date(slotEnd);
      }

      return slots;
    };

    // 生成日期选项和时间段（在条件块内，因为依赖 now）
    const dateOptions = generateDateOptions();
    const selectedDate = dateOptions[selectedDateIndex]?.date ?? now;
    const timeSlots = generateTimeSlots(selectedDate);

    return (
      <div className="waimai-shopPage">
        <div className="waimai-checkoutPage">
          <div className="waimai-checkoutHeader">
            <button
              type="button"
              className="waimai-checkoutBack"
              onClick={() => setCheckoutMode('menu')}
              aria-label="返回点单"
            />
            <div className="waimai-checkoutTitle">结算</div>
          </div>

          <div className="waimai-checkoutScroll">
            {/* 地址卡片区域 */}
            <div className="waimai-checkoutAddrCard">
              <div className="waimai-checkoutAddrMain">
                <button
                  type="button"
                  className="waimai-checkoutAddrTitleBtn"
                  onClick={openReceiverPicker}
                >
                  <div className="waimai-checkoutAddrTitle">
                    {receiver ? `收货人：${receiver.name}` : '请选择收货人'}
                  </div>
                </button>
                <div className="waimai-checkoutDeliverRow">
                  <button
                    type="button"
                    className={`waimai-checkoutDeliverBtn ${selectedDeliveryType === 'immediate' ? 'is-primary' : ''}`}
                    onClick={handleSelectImmediate}
                  >
                    <span className="waimai-checkoutDeliverTextMain">立即送出</span>
                    <span className="waimai-checkoutDeliverTime">
                      {selectedDeliveryType === 'immediate' ? `预计${etaRangeText}送达` : ''}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`waimai-checkoutDeliverBtn ${selectedDeliveryType === 'scheduled' ? 'is-primary' : ''}`}
                    onClick={openDeliveryTimePicker}
                  >
                    <span className="waimai-checkoutDeliverTextMain">预约配送</span>
                    <span className="waimai-checkoutDeliverSub">
                      {selectedDeliveryType === 'scheduled' && selectedScheduledTime
                        ? selectedScheduledTime.timeSlot
                        : '选择时间'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 店铺与商品列表区域 */}
            <div className="waimai-checkoutShopCard">
              <div className="waimai-checkoutShopHeader">
                <div className="waimai-checkoutFlashTag">闪购</div>
                <div className="waimai-checkoutShopTitle">{shop.name}</div>
                <div className="waimai-checkoutShopEta">LU宝准时达</div>
              </div>

              <div className="waimai-checkoutItems">
                {entries.length === 0 ? (
                  <div className="waimai-checkoutEmpty">还没有商品，请返回继续加购~</div>
                ) : (
                  entries.map((e, idx) => (
                    <div key={`${e.dishId}-${idx}`} className="waimai-checkoutItem">
                      <div className="waimai-checkoutItemPic" aria-hidden="true">
                        {/* 粥铺 / 晚风冰品社：尝试用同名图片做一个缩略图 */}
                        {shop.name === '一碗热乎粥' && ZHOU_DISH_IMG_MAP[e.name] && (
                          <span
                            className="waimai-checkoutItemPicInner"
                            style={{
                              backgroundImage: `url(${ZHOU_DISH_IMG_MAP[e.name]})`
                            }}
                          />
                        )}
                        {shop.name === '晚风冰品社' && WANFENG_DISH_IMG_MAP[e.name] && (
                          <span
                            className="waimai-checkoutItemPicInner"
                            style={{
                              backgroundImage: `url(${WANFENG_DISH_IMG_MAP[e.name]})`
                            }}
                          />
                        )}
                      </div>
                      <div className="waimai-checkoutItemMain">
                        <div className="waimai-checkoutItemName">
                          {e.name}
                          {e.specText ? `（${e.specText}）` : ''}
                        </div>
                        <div className="waimai-checkoutItemQtyMeta">x{e.qty}</div>
                      </div>
                      <div className="waimai-checkoutItemPrice">
                        ¥{(e.unitPrice * (e.qty ?? 1)).toFixed(1).replace(/\.0$/, '')}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 各类费用行 */}
              <div className="waimai-checkoutFeeRow">
                <span>打包费</span>
                <span>¥{packFee.toFixed(1).replace(/\.0$/, '')}</span>
              </div>
              <div className="waimai-checkoutFeeRow">
                <span>配送费</span>
                <span>¥{deliveryOriginFee.toFixed(1).replace(/\.0$/, '')}</span>
              </div>
              <div className="waimai-checkoutFeeRow">
                <span>店铺活动/券</span>
                <span className="waimai-checkoutFeeDiscount">
                  {shopDiscount > 0 ? `-¥${shopDiscount}` : '-¥0'}
                </span>
              </div>
              <div className="waimai-checkoutFeeRow">
                <span>平台红包</span>
                <span className="waimai-checkoutFeeDiscount">
                  {hasEatCard
                    ? cardDiscount > 0
                      ? `超级吃货卡 -¥${cardDiscount}`
                      : '超级吃货卡 本单暂无可用优惠'
                    : '未开通吃货卡'}
                </span>
              </div>
              <div className="waimai-checkoutFeeRow">
                <span>下单返金币</span>
                <span className="waimai-checkoutFeeGold">
                  {coinReturn > 0 ? `返${coinReturn}淘金币` : '暂不返金币'}
                </span>
              </div>
            </div>

            {/* 超级吃货卡选购区，仿截图样式；右上角为空心圆可勾选/取消 */}
            <div className="waimai-eatCardSection">
              <div className="waimai-eatCardTop">
                <span className="waimai-eatCardTag">超级吃货卡</span>
                <span className="waimai-eatCardTopText">
                  价值30元起，本单立减
                  <span className="waimai-eatCardTopHighlight">
                    ¥{eatCardPreviewDiscount.toFixed(1).replace(/\.0$/, '')}
                  </span>
                </span>
                <div className="waimai-eatCardTopPrice">
                  <span className="waimai-eatCardTopOrigin">¥30</span>
                  <span className="waimai-eatCardTopNow">
                    ¥{eatCardPrice.toFixed(1).replace(/\.0$/, '')}
                  </span>
                </div>
                <button
                  type="button"
                  className={`waimai-eatCardToggle ${hasEatCard ? 'is-on' : ''}`}
                  aria-label="本单使用超级吃货卡"
                  onClick={() => setHasEatCard((v) => !v)}
                />
              </div>

              <div className="waimai-eatCardCards">
                <div className="waimai-eatCardCard is-active">
                  <div className="waimai-eatCardCardTop">全平台商家通用</div>
                  <div className="waimai-eatCardCardValue">¥5</div>
                  <div className="waimai-eatCardCardDesc">本单可用</div>
                </div>
                <div className="waimai-eatCardCard">
                  <div className="waimai-eatCardCardTop">全平台商家通用</div>
                  <div className="waimai-eatCardCardValue">¥5</div>
                  <div className="waimai-eatCardCardDesc">无门槛</div>
                </div>
                <div className="waimai-eatCardCard">
                  <div className="waimai-eatCardCardTop">全平台商家通用</div>
                  <div className="waimai-eatCardCardValue">¥5</div>
                  <div className="waimai-eatCardCardDesc">无门槛</div>
                </div>
              </div>

              <div className="waimai-eatCardBottom">
                <div className="waimai-eatCardBottomText">31天有效期，共6张优惠券</div>
              </div>
            </div>

            {/* 收货人选择弹窗：从剧情角色中选择一个作为收货人 */}
            {receiverPickerVisible && (
              <div
                className={`waimai-receiverMask ${receiverPickerOpen ? 'is-open' : ''}`}
                role="dialog"
                aria-modal="true"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) closeReceiverPicker();
                }}
              >
                <div
                  className={`waimai-receiverSheet ${receiverPickerOpen ? 'is-open' : ''}`}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="waimai-receiverHeader">
                    <div className="waimai-receiverTitle">选择收货人</div>
                    <button
                      type="button"
                      className="waimai-receiverClose"
                      onClick={closeReceiverPicker}
                      aria-label="关闭"
                    >
                      ×
                    </button>
                  </div>
                  <div className="waimai-receiverList">
                    {(roles ?? []).length === 0 ? (
                      <div className="waimai-receiverEmpty">
                        暂无已创建角色，请先在剧情模式中创建角色。
                      </div>
                    ) : (
                      roles.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className="waimai-receiverItem"
                          onClick={() => {
                            setReceiver(r);
                            closeReceiverPicker();
                          }}
                        >
                          <div className="waimai-receiverAvatar">
                            {r.avatarUrl ? (
                              <span
                                className="waimai-receiverAvatarImg"
                                style={{ backgroundImage: `url(${r.avatarUrl})` }}
                                aria-hidden="true"
                              />
                            ) : (
                              <span className="waimai-receiverAvatarFallback" aria-hidden="true">
                                {r.name?.slice(0, 1) ?? '人'}
                              </span>
                            )}
                          </div>
                          <div className="waimai-receiverName">{r.name || '未命名角色'}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 配送时间选择弹窗 */}
            {deliveryTimePickerVisible && (
              <div
                className={`waimai-receiverMask ${deliveryTimePickerOpen ? 'is-open' : ''}`}
                role="dialog"
                aria-modal="true"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) closeDeliveryTimePicker();
                }}
              >
                <div
                  className={`waimai-receiverSheet ${deliveryTimePickerOpen ? 'is-open' : ''}`}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="waimai-receiverHeader">
                    <div className="waimai-receiverTitle">选择送达时间</div>
                    <button
                      type="button"
                      className="waimai-receiverClose"
                      onClick={closeDeliveryTimePicker}
                      aria-label="关闭"
                    >
                      ×
                    </button>
                  </div>
                  <div className="waimai-deliveryTimeContent">
                    <div className="waimai-deliveryTimeLeft">
                      {dateOptions.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`waimai-deliveryDateItem ${selectedDateIndex === idx ? 'is-active' : ''}`}
                          onClick={() => setSelectedDateIndex(idx)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="waimai-deliveryTimeRight">
                      {timeSlots.map((slot, idx) => {
                        const isSelected =
                          selectedDeliveryType === 'scheduled' &&
                          selectedScheduledTime?.timeSlot === slot.label &&
                          selectedScheduledTime?.date.toDateString() === selectedDate.toDateString();
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`waimai-deliveryTimeSlot ${isSelected ? 'is-active' : ''}`}
                            onClick={() => handleSelectTimeSlot(slot, selectedDate)}
                          >
                            <span className="waimai-deliveryTimeSlotText">{slot.label}</span>
                            <span className="waimai-deliveryTimeSlotFee">0元配送费</span>
                            {isSelected && (
                              <span className="waimai-deliveryTimeSlotCheck" aria-hidden="true">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 收货人未选择提醒弹窗 */}
            {receiverRequiredDialogOpen && (
              <div
                className="waimai-minOrderMask"
                role="dialog"
                aria-modal="true"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) setReceiverRequiredDialogOpen(false);
                }}
              >
                <div className="waimai-minOrderDialog" onMouseDown={(e) => e.stopPropagation()}>
                  <div className="waimai-minOrderTitle">请选择收货人</div>
                  <div className="waimai-minOrderText">
                    结算前需要先选择收货人，请点击上方"收货人"按钮进行选择。
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button
                      type="button"
                      className="waimai-minOrderBtn"
                      style={{ flex: 1, background: '#f3f4f6', color: '#111827' }}
                      onClick={() => setReceiverRequiredDialogOpen(false)}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      className="waimai-minOrderBtn"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setReceiverRequiredDialogOpen(false);
                        // 延迟打开收货人选择弹窗，确保提醒弹窗的遮罩层完全消失
                        // 使用较长的延迟确保 DOM 更新完成
                        setTimeout(() => {
                          openReceiverPicker();
                        }, 300);
                      }}
                    >
                      去选择
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="waimai-checkoutPayBar">
            <div className="waimai-checkoutPaySummary">
              <span>
                共{itemCount}件
              </span>
              {discountTotal > 0 && (
                <span className="waimai-checkoutPayDiscount">已优惠¥{discountTotal}</span>
              )}
            </div>
            <button type="button" className="waimai-checkoutPayBtn" onClick={handlePayClick}>
              立即支付 ¥{payTotal.toFixed(1).replace(/\.0$/, '')}
            </button>
          </div>

          {/* 支付密码输入弹窗 */}
          {showPaymentPasswordDialog && (
            <div
              className="waimai-payment-password-mask"
              onClick={() => {
                setShowPaymentPasswordDialog(false);
                setPaymentPassword('');
                setPaymentPasswordError('');
              }}
            >
              <div
                className="waimai-payment-password-dialog"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="waimai-payment-password-header">
                  <button
                    type="button"
                    className="waimai-payment-password-close"
                    onClick={() => {
                      setShowPaymentPasswordDialog(false);
                      setPaymentPassword('');
                      setPaymentPasswordError('');
                    }}
                  >
                    ×
                  </button>
                  <div className="waimai-payment-password-title">请输入支付密码</div>
                </div>
                <div className="waimai-payment-password-amount">
                  ¥{currentPayTotal.toFixed(2)}
                </div>
                <div className="waimai-payment-password-account">
                  <span>账号</span>
                  <span>{wechatSelfProfile.nickname || '微信昵称'}</span>
                </div>
                <div className="waimai-payment-password-method-list">
                  <div className="waimai-payment-password-method-item">
                    <div className="waimai-payment-password-method-item-left">
                      <div className="waimai-payment-password-method-item-icon">💳</div>
                      <div className="waimai-payment-password-method-item-info">
                        <div className="waimai-payment-password-method-item-name">Lumi钱包</div>
                        <div className="waimai-payment-password-method-item-balance">
                          余额：¥{wechatWallet?.balance.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>
                    <div className="waimai-payment-password-method-item-check">✓</div>
                  </div>
                </div>
                {showPaymentSuccess ? (
                  <div className="waimai-payment-success-animation">
                    <svg className="waimai-payment-success-checkmark" viewBox="0 0 52 52">
                      <circle
                        className="waimai-payment-success-circle"
                        cx="26"
                        cy="26"
                        r="25"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                      />
                      <path
                        className="waimai-payment-success-check"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M 14 26 L 22 34 L 38 18"
                      />
                    </svg>
                  </div>
                ) : (
                  <>
                    <div className="waimai-payment-password-input">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`waimai-payment-password-dot ${i < paymentPassword.length ? 'filled' : ''}`}
                        />
                      ))}
                    </div>
                    {paymentPasswordError && (
                      <div className="waimai-payment-password-error">{paymentPasswordError}</div>
                    )}
                    <div className="waimai-payment-password-keypad">
                      <div className="waimai-payment-password-keypad-row">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className="waimai-payment-password-key"
                        onClick={() => handlePaymentPasswordInput(String(num))}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="waimai-payment-password-keypad-row">
                    {[4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className="waimai-payment-password-key"
                        onClick={() => handlePaymentPasswordInput(String(num))}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="waimai-payment-password-keypad-row">
                    {[7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className="waimai-payment-password-key"
                        onClick={() => handlePaymentPasswordInput(String(num))}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="waimai-payment-password-keypad-row">
                    <div className="waimai-payment-password-key-empty" />
                    <button
                      type="button"
                      className="waimai-payment-password-key"
                      onClick={() => handlePaymentPasswordInput('0')}
                    >
                      0
                    </button>
                    <button
                      type="button"
                      className="waimai-payment-password-key waimai-payment-password-key-delete"
                      onClick={handlePaymentPasswordDelete}
                    >
                      ×
                    </button>
                  </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 支付成功底部提示 */}
          {showSuccessToast && (
            <div className="waimai-payment-success-toast">
              <div className="waimai-payment-success-toast-content">
                <div className="waimai-payment-success-toast-icon">✓</div>
                <div className="waimai-payment-success-toast-text">支付成功</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="waimai-shopPage">
      <div className="waimai-shopHeader">
        <button type="button" className="waimai-shopBack" onClick={onBack} aria-label="返回" />
        <div className="waimai-shopSearch">
          <span className="waimai-shopSearchIcon" aria-hidden="true">
            <svg className="waimai-searchSvg" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="waimai-shopSearchText">搜一搜</span>
        </div>
        <div className="waimai-shopHeaderActions" aria-hidden="true">
          <span className="waimai-shopHeaderDot" />
          <span className="waimai-shopHeaderDot" />
          <span className="waimai-shopHeaderDot" />
        </div>
      </div>

        <div ref={scrollContainerRef} className="waimai-shopScroll">
        <div
          className="waimai-shopHero"
          aria-hidden="true"
          style={
            shop.name === '一碗热乎粥'
              ? { backgroundImage: `url(${zhouBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : shop.name === '晚风冰品社'
                ? { backgroundImage: `url(${wanfengBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : undefined
          }
        />

        <div className="waimai-shopInfoCard">
              <div className="waimai-shopInfoTop">
            <div className="waimai-shopLogoBigWrap">
              <div
                className="waimai-shopLogoBig"
                aria-hidden="true"
                style={
                  shop.name === '一碗热乎粥'
                    ? { backgroundImage: `url(${zhouLogo})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : shop.name === '晚风冰品社'
                      ? { backgroundImage: `url(${wanfengLogo})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : undefined
                }
              />
              <div className="waimai-shopBrand">品牌</div>
            </div>
            <div className="waimai-shopInfoText">
              <div className="waimai-shopInfoName">{shop.name}</div>
              <div className="waimai-shopInfoMeta">
                <span>评分</span>
                <span className="waimai-shopInfoStrong">{shop.rating.replace('分', '')}</span>
                <span className="waimai-shopInfoSep">|</span>
                <span>月售</span>
                <span className="waimai-shopInfoStrong">{shop.monthlySales.replace('月售', '').trim()}</span>
                <span className="waimai-shopInfoSep">|</span>
                <span className="waimai-shopOnTime">
                  LU宝准时达
                  <span className="waimai-shopInfoStrong">&nbsp;约{shop.eta}</span>
                </span>
              </div>
              <div className="waimai-shopInfoNotice">
                {shop.name === '晚风冰品社' ? '冰品现制，甜度可选，清爽不腻～' : '每天现做，不放隔夜食材！'}
              </div>
            </div>
          </div>

          {/* 满减/优惠：只保留“小标签”样式，并放到第一排 */}
          <div className="waimai-shopInfoTags">
            {shop.coupons.map((c) => (
              <span key={c} className="waimai-couponChip">{c}</span>
            ))}
            <span className="waimai-shopInfoRightText">3个优惠</span>
            <span className="waimai-shopInfoRightCaret" aria-hidden="true">▾</span>
          </div>
        </div>

        <div ref={tabsRef} className="waimai-shopTabs">
          {(['点餐', '评价', '商家'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`waimai-shopTab ${tab === t ? 'is-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
          <div className="waimai-shopTabsRight">
            <button type="button" className="waimai-shopTabsBtn">好友拼单</button>
          </div>
        </div>

        {tab === '点餐' ? (
          <>
            {/* 商家推荐：独立插在“分类 + 单品菜单”上方，单独一行展示 */}
            <div className="waimai-reco">
              <div className="waimai-recoTitle">商家推荐</div>
              <div className="waimai-recoRow">
                {(shop.name === '晚风冰品社'
                  ? shop.goods.slice(0, 3).map((g, i) => ({
                      id: `wanfeng-reco-${i}`,
                      title: g.title,
                      price: Number.parseFloat(String(g.price).replace(/[^\d.]/g, '')) || 0,
                      img: g.img
                    }))
                  : SHOP_RECOMMENDS.slice(0, 3)
                ).map((x) => (
                  <div key={x.id} className="waimai-recoCard">
                    <div
                      className="waimai-recoPic"
                      aria-hidden="true"
                      style={
                        x.img
                          ? { backgroundImage: `url(${x.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                          : undefined
                      }
                    />
                    <div className="waimai-recoName">{x.title}</div>
                    <div className="waimai-recoBottom">
                      <div className="waimai-recoPrice">¥{x.price.toFixed(1).replace(/\.0$/, '')}</div>
                      <button
                        type="button"
                        className="waimai-recoAdd"
                        aria-label="加入购物车"
                        onClick={(e) => {
                          const dish = findDishByTitle(x.title);
                          if (!dish) return;
                          if (wantsSpecSheet(dish)) {
                            openSpec(dish);
                            return;
                          }
                          addToCartWithFly(
                            `p${activePocketId}::${dish.id}::default`,
                            { dishId: dish.id, name: dish.name, unitPrice: dish.price, pocketId: activePocketId },
                            dish.price,
                            e.currentTarget as unknown as HTMLElement
                          );
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="waimai-menuWrap">
              <div className="waimai-menu">
                <div ref={menuLeftRef} className="waimai-menuLeft">
                  {shopMenu.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`waimai-menuCat ${catId === c.id ? 'is-active' : ''}`}
                      onClick={() => {
                        navModeRef.current = 'click';
                        clickStartedAtRef.current = Date.now();
                        setCatId(c.id);
                        
                        // 延迟执行，确保状态更新完成
                        setTimeout(() => {
                          const el = document.getElementById(`menu-section-${c.id}`);
                          if (!el) {
                            return;
                          }
                          
                          // 获取评价栏的高度
                          const tabsElement = tabsRef.current;
                          const tabsHeight = tabsElement ? tabsElement.offsetHeight : 58;
                          const scrollContainer = scrollContainerRef.current;
                          const containerTop = scrollContainer?.getBoundingClientRect().top ?? 0;
                          
                          // 使用 scrollIntoView，scroll-margin-top 会自动处理偏移
                          el.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start',
                            inline: 'nearest'
                          });
                          
                          // 双重保险：检查并调整位置
                          setTimeout(() => {
                            const rect = el.getBoundingClientRect();
                            const desiredTop = containerTop + tabsHeight + 8;
                            const delta = rect.top - desiredTop; // >0 说明标题还在下方，需要继续向下滚动
                            
                            if (Math.abs(delta) > 2) { // 允许2px误差
                              if (scrollContainer) {
                                scrollContainer.scrollBy({ top: delta, behavior: 'smooth' });
                              } else {
                                window.scrollBy({ top: delta, behavior: 'smooth' });
                              }
                            }
                          }, 200);
                        }, 50);
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                <div className="waimai-menuRight">
                  {shopMenu.map((section) => (
                    <div key={section.id} id={`menu-section-${section.id}`}>
                      <div className="waimai-menuSectionTitle">{section.name}</div>
                      <div className="waimai-dishList">
                        {(section.dishes ?? []).map((d) => (
                          <div key={d.id} className="waimai-dish">
                            <div
                              className="waimai-dishPic"
                              aria-hidden="true"
                              style={
                              shop.name === '一碗热乎粥' && ZHOU_DISH_IMG_MAP[d.name]
                                  ? {
                                      backgroundImage: `url(${ZHOU_DISH_IMG_MAP[d.name]})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center'
                                    }
                                  : shop.name === '晚风冰品社' && WANFENG_DISH_IMG_MAP[d.name]
                                      ? {
                                          backgroundImage: `url(${WANFENG_DISH_IMG_MAP[d.name]})`,
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center'
                                        }
                                      : undefined
                              }
                            >
                              {d.badge && <span className="waimai-dishBadge">{d.badge}</span>}
                            </div>
                            <div className="waimai-dishMain">
                              <div className="waimai-dishName">{d.name}</div>
                              <div className="waimai-dishMeta">{formatDishMonthSalesText(d.monthSalesText)}</div>
                              <div className="waimai-dishTags">
                                {getDishTagTexts(d).map((t) => (
                                  <span key={t} className="waimai-dishTag">{t}</span>
                                ))}
                              </div>
                              <div className="waimai-dishBottom">
                                <div className="waimai-dishPrice">
                                  ¥{(
                                    isWanfengSoftDessert(shop.name, d)
                                      ? getWanfengSoftMinDisplayPrice(d)
                                      : d.price
                                  )
                                    .toFixed(1)
                                    .replace(/\.0$/, '')}
                                </div>
                                {wantsSpecSheet(d) ? (
                                  <button type="button" className="waimai-dishSpecBtn" onClick={() => openSpec(d)}>
                                    选规格
                                  </button>
                                ) : (
                                  (() => {
                                    const qty = getDishQty(d.id);
                                    return qty > 0 ? (
                                      <div className="waimai-dishQtyControls" aria-label="数量控制">
                                        <button
                                          type="button"
                                          className="waimai-dishMinusBtn"
                                          onClick={() => removeOneFromDish(d.id)}
                                          aria-label="减少"
                                        >
                                          −
                                        </button>
                                        <div className="waimai-dishQtyNum" aria-hidden="true">
                                          {qty}
                                        </div>
                                  <button
                                    type="button"
                                    className="waimai-dishAddBtn"
                                          onClick={(e) =>
                                            addToCartWithFly(
                                              `p${activePocketId}::${d.id}::default`,
                                              { dishId: d.id, name: d.name, unitPrice: d.price, pocketId: activePocketId },
                                              d.price,
                                              e.currentTarget as unknown as HTMLElement
                                            )
                                          }
                                          aria-label="增加"
                                  >
                                    +
                                  </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        className="waimai-dishAddBtn"
                                        onClick={(e) =>
                                          addToCartWithFly(
                                            `p${activePocketId}::${d.id}::default`,
                                            { dishId: d.id, name: d.name, unitPrice: d.price, pocketId: activePocketId },
                                            d.price,
                                            e.currentTarget as unknown as HTMLElement
                                          )
                                        }
                                        aria-label="加入购物车"
                                      >
                                        +
                                      </button>
                                    );
                                  })()
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : tab === '评价' ? (
          <div className="waimai-reviewWrap">
            <div className="waimai-reviewSummary">
              <div className="waimai-reviewScore">{shopRatingValue.toFixed(1).replace(/\.0$/, '')}</div>
              <div className="waimai-reviewSummaryRight">
                <div className="waimai-reviewStars" aria-label={`评分 ${shopRatingValue.toFixed(1)}`}>
                  {Array.from({ length: 5 }, (_, i) => {
                    const filled = shopRatingValue >= i + 1 - 0.2;
                    return (
                      <span key={i} className={`waimai-reviewStar ${filled ? 'is-on' : ''}`} aria-hidden="true">
                        ★
                      </span>
                    );
                  })}
                </div>
                <div className="waimai-reviewMeta">
                  <span>全部 {Math.max(0, reviews.length * 940)}+</span>
                  <span className="waimai-reviewMetaSep">|</span>
                  <span>有图/视频 {Math.max(0, Math.floor(reviews.length * 80))}+</span>
                  <span className="waimai-reviewMetaSep">|</span>
                  <span>近期差评 {Math.max(0, Math.floor(reviews.length * 6))}</span>
                </div>
              </div>
            </div>

            <div className="waimai-reviewFilters">
              {(['全部', '有图/视频', '近期差评'] as const).map((x) => (
                <button
                  key={x}
                  type="button"
                  className={`waimai-reviewFilter ${reviewFilter === x ? 'is-active' : ''}`}
                  onClick={() => setReviewFilter(x)}
                >
                  {x}
                </button>
              ))}
            </div>

            <div className="waimai-reviewChips">
              {(['最新', '回头客评价', '好吃', '派送快', '实惠'] as const).map((x) => (
                <button
                  key={x}
                  type="button"
                  className={`waimai-reviewChip ${reviewSort === '最新' && x === '最新' ? 'is-active' : ''}`}
                  onClick={() => {
                    if (x === '最新') setReviewSort('最新');
                    if (x === '好吃') setReviewSort('好评');
                  }}
                >
                  {x}
                </button>
              ))}
            </div>

            <div className="waimai-reviewList">
              {filteredReviews.map((r) => (
                <div key={r.id} className="waimai-reviewItem">
                  <div className="waimai-reviewHead">
                    <div className="waimai-reviewAvatar" aria-hidden="true">
                      {r.userName.slice(0, 1)}
                    </div>
                    <div className="waimai-reviewHeadMain">
                      <div className="waimai-reviewUserRow">
                        <div className="waimai-reviewUser">{r.userName}</div>
                        <div className="waimai-reviewDate">{r.date}</div>
                      </div>
                      <div className="waimai-reviewSatisRow">
                        <div className="waimai-reviewSatisLabel">满意度</div>
                        <div className="waimai-reviewStars small" aria-hidden="true">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} className={`waimai-reviewStar ${r.rating >= i + 1 ? 'is-on' : ''}`}>
                              ★
                            </span>
                          ))}
                        </div>
                        <div className="waimai-reviewTastePack">
                          味道{r.tasteRating}星 · 包装{r.packRating}星
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="waimai-reviewText">{renderReviewText(r.text)}</div>

                  {(r.images ?? []).length > 0 && (
                    <div className="waimai-reviewPics">
                      {(r.images ?? []).slice(0, 3).map((src, idx) => (
                        <div
                          key={`${r.id}-${idx}`}
                          className="waimai-reviewPic"
                          aria-hidden="true"
                          style={{ backgroundImage: `url(${src})` }}
                        />
                      ))}
          </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="waimai-shopPlaceholder">这里将展示商家信息</div>
        )}
      </div>

      <div className="waimai-cartBar">
        <div className="waimai-cartLeft" role="button" tabIndex={0} onClick={openCart}>
          <div ref={cartIconRef} className="waimai-cartIcon" aria-hidden="true">
            <svg className="waimai-cartSvg" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3.5 5.5h2l2 11h10.5l2-8H7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 20.5a1 1 0 1 0 0-2a1 1 0 0 0 0 2Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 20.5a1 1 0 1 0 0-2a1 1 0 0 0 0 2Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="waimai-cartSummary">
            <div className="waimai-cartPrice">¥{cartTotal.toFixed(1).replace(/\.0$/, '')}</div>
            <div className="waimai-cartFee">另需配送费约¥{deliveryFee.toFixed(1).replace(/\.0$/, '')}</div>
          </div>
          {cartCount > 0 && <div className="waimai-cartBadge">{cartCount}</div>}
        </div>
        <button
          type="button"
          className="waimai-cartBtn"
          onClick={() => {
            if (cartTotal < minOrderPrice) {
              setMinOrderDialogOpen(true);
            } else {
              setCheckoutMode('checkout');
            }
          }}
        >
          {cartTotal >= minOrderPrice ? '去结算' : `还差¥${Math.max(0, minOrderPrice - cartTotal).toFixed(1).replace(/\.0$/, '')}起送`}
          <div className="waimai-cartBtnSub">
            {minOrderPrice > 0 ? `满¥${minOrderPrice}起送` : ''}
          </div>
        </button>
      </div>

      {/* 选规格：底部弹窗（先实现粥类：甜度 + 数量） */}
      {specVisible && specDish && (
        <div
          className={`waimai-specMask ${specOpen ? 'is-open' : ''}`}
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            // 点遮罩关闭；点面板不关闭
            if (e.target === e.currentTarget) closeSpec();
          }}
        >
          <div className={`waimai-specSheet ${specOpen ? 'is-open' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="waimai-specClose" onClick={closeSpec} aria-label="关闭">
              ×
            </button>

            <div className="waimai-specTop">
              <div
                className="waimai-specPic"
                aria-hidden="true"
                style={
                  shop.name === '一碗热乎粥' && ZHOU_DISH_IMG_MAP[specDish.name]
                    ? {
                        backgroundImage: `url(${ZHOU_DISH_IMG_MAP[specDish.name]})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }
                    : shop.name === '晚风冰品社' && WANFENG_DISH_IMG_MAP[specDish.name]
                        ? {
                            backgroundImage: `url(${WANFENG_DISH_IMG_MAP[specDish.name]})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }
                        : undefined
                }
              />
              <div className="waimai-specInfo">
                <div className="waimai-specTitle">{specDish.name}</div>
                <div className="waimai-specMeta">
                  默认：
                  {isSweetPorridge(specDish)
                    ? specSweetness
                    : isBaozi(specDish)
                      ? `${specPortion}个`
                      : isWanfengSoftDessert(shop.name, specDish)
                        ? `${specSoftCount}个`
                      : '默认'}
                </div>
                <div className="waimai-specPrice">
                  ¥
                  {(isBaozi(specDish) && specPortion === '6'
                    ? specDish.price + 3
                    : isWanfengSoftDessert(shop.name, specDish)
                      ? (specDish.price * (Number(specSoftCount) / getWanfengSoftBaseCount(specDish.name)))
                      : specDish.price
                  )
                    .toFixed(1)
                    .replace(/\.0$/, '')}
                </div>
              </div>
            </div>

            <div className="waimai-specBody">
              {isSweetPorridge(specDish) && (
                <div className="waimai-specGroup">
                  <div className="waimai-specLabel">甜度</div>
                  <div className="waimai-specOptions">
                    {(['加糖', '不加糖'] as const).map((x) => (
                      <button
                        key={x}
                        type="button"
                        className={`waimai-specOption ${specSweetness === x ? 'is-active' : ''}`}
                        onClick={() => setSpecSweetness(x)}
                      >
                        {x}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isBaozi(specDish) && (
                <div className="waimai-specGroup">
                  <div className="waimai-specLabel">份量</div>
                  <div className="waimai-specOptions">
                    {([
                      { key: '3', label: '3个' },
                      { key: '6', label: '6个' }
                    ] as const).map((x) => (
                      <button
                        key={x.key}
                        type="button"
                        className={`waimai-specOption ${specPortion === x.key ? 'is-active' : ''}`}
                        onClick={() => setSpecPortion(x.key)}
                      >
                        {x.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isWanfengSoftDessert(shop.name, specDish) && (
                <div className="waimai-specGroup">
                  <div className="waimai-specLabel">规格</div>
                  <div className="waimai-specOptions">
                    {getWanfengSoftSpecOptions(specDish.name).map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`waimai-specOption ${specSoftCount === String(n) ? 'is-active' : ''}`}
                        onClick={() => setSpecSoftCount(String(n) as any)}
                      >
                        {n}个
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="waimai-specGroup">
                <div className="waimai-specLabel">数量</div>
                <div className="waimai-specQtyRow">
                  <button
                    type="button"
                    className="waimai-specQtyBtn"
                    disabled={specQty <= 1}
                    onClick={() => setSpecQty((v) => Math.max(1, v - 1))}
                    aria-label="减少"
                  >
                    −
                  </button>
                  <div className="waimai-specQtyNum">{specQty}</div>
                  <button
                    type="button"
                    className="waimai-specQtyBtn"
                    onClick={() => setSpecQty((v) => Math.min(99, v + 1))}
                    aria-label="增加"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="waimai-specConfirm"
              onClick={(e) => {
                const fromEl = e.currentTarget as unknown as HTMLElement;
                const unitPrice = isBaozi(specDish) && specPortion === '6'
                  ? specDish.price + 3
                  : isWanfengSoftDessert(shop.name, specDish)
                    ? (specDish.price * (Number(specSoftCount) / getWanfengSoftBaseCount(specDish.name)))
                    : specDish.price;
                const variantKey = isBaozi(specDish)
                  ? `portion${specPortion}`
                  : isWanfengSoftDessert(shop.name, specDish)
                    ? `count${specSoftCount}`
                    : 'default';
                const specText = isSweetPorridge(specDish)
                  ? specSweetness
                  : isBaozi(specDish)
                    ? `${specPortion}个`
                    : isWanfengSoftDessert(shop.name, specDish)
                      ? `${specSoftCount}个`
                      : '';
                for (let i = 0; i < specQty; i += 1) {
                  addToCart(
                    `p${activePocketId}::${specDish.id}::${variantKey}${specText ? `::${specText}` : ''}`,
                    { dishId: specDish.id, name: specDish.name, unitPrice, pocketId: activePocketId, specText },
                    unitPrice
                  );
                }
                flyToCart(fromEl);
                closeSpec();
              }}
            >
              选好了
            </button>
          </div>
        </div>
      )}

      {/* 购物车：底部弹窗（口袋分组） */}
      {cartVisible && (
        <div
          className={`waimai-cartMask ${cartOpen ? 'is-open' : ''}`}
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeCart();
          }}
        >
          <div className={`waimai-cartSheet ${cartOpen ? 'is-open' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="waimai-cartClose" onClick={closeCart} aria-label="关闭">
              ×
            </button>
            <div className="waimai-cartSheetHeader">
              <div className="waimai-cartSheetTitle">已选商品</div>
              <button
                type="button"
                className="waimai-cartClearBtn"
                onClick={clearCartAll}
                disabled={Object.keys(cartMap).length === 0}
              >
                <svg className="waimai-cartClearSvg" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v9h-2v-9Zm4 0h2v9h-2v-9ZM7 10h2v9H7v-9Zm-1-2h12l-1 13H7L6 8Z"
                    fill="currentColor"
                  />
                </svg>
                清空
              </button>
            </div>

            <div className="waimai-cartItems">
              {Array.from({ length: unlockedPocketCount }, (_, i) => i + 1).map((pid) => {
                const items = Object.entries(cartMap).filter(([, v]) => v.pocketId === pid);
                return (
                  <div key={pid} className="waimai-cartPocketBlock">
                    <div
                      className="waimai-cartPocketRow"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setActivePocketId(pid);
                        // 只有当玩家勾选当前“最后一个已显示口袋”时，才解锁下一个口袋按钮（无限追加）
                        setUnlockedPocketCount((prev) => (pid === prev ? prev + 1 : prev));
                      }}
                    >
                      <div className={`waimai-cartPocketRadio ${activePocketId === pid ? 'is-active' : ''}`} aria-hidden="true" />
                      <div className="waimai-cartPocketTitle">口袋{pid}</div>
                      <button
                        type="button"
                        className="waimai-cartPocketDel"
                        aria-label={`删除口袋${pid}`}
                        disabled={pid === 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePocket(pid);
                        }}
                      >
                        <svg className="waimai-cartPocketDelSvg" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v9h-2v-9Zm4 0h2v9h-2v-9ZM7 10h2v9H7v-9Zm-1-2h12l-1 13H7L6 8Z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                    </div>

                    {items.length > 0 ? (
                      items.map(([k, v]) => (
                        <div key={k} className="waimai-cartItem">
                          <div
                            className="waimai-cartItemPic"
                            aria-hidden="true"
                            style={
                              shop.name === '一碗热乎粥' && ZHOU_DISH_IMG_MAP[v.name]
                                ? {
                                    backgroundImage: `url(${ZHOU_DISH_IMG_MAP[v.name]})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                  }
                                : shop.name === '晚风冰品社' && WANFENG_DISH_IMG_MAP[v.name]
                                  ? {
                                      backgroundImage: `url(${WANFENG_DISH_IMG_MAP[v.name]})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center'
                                    }
                                  : undefined
                            }
                          />
                          <div className="waimai-cartItemMain">
                            <div className="waimai-cartItemName">{v.name}</div>
                            {v.specText ? <div className="waimai-cartItemSpec">{v.specText}</div> : null}
                            <div className="waimai-cartItemPrice">¥{v.unitPrice.toFixed(1).replace(/\.0$/, '')}</div>
                          </div>
                          <div className="waimai-cartItemOps">
                            <button type="button" className="waimai-cartOpBtn is-minus" onClick={() => removeOneByKey(k)}>
                              −
                            </button>
                            <div className="waimai-cartOpNum">{v.qty}</div>
                            <button
                              type="button"
                              className="waimai-cartOpBtn is-plus"
                              onClick={() =>
                                addToCart(
                                  k,
                                  {
                                    dishId: v.dishId,
                                    name: v.name,
                                    unitPrice: v.unitPrice,
                                    pocketId: v.pocketId,
                                    specText: v.specText
                                  },
                                  v.unitPrice
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="waimai-cartEmpty">勾选后，后续加购商品将装入该口袋</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 加购飞球动效层 */}
      {flyBalls.length > 0 && (
        <div className="waimai-flyLayer" aria-hidden="true">
          {flyBalls.map((b) => (
            <FlyBall key={b.id} {...b} />
          ))}
        </div>
      )}

      {/* 起送价提示弹窗 */}
      {minOrderDialogOpen && (
        <div
          className="waimai-minOrderMask"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMinOrderDialogOpen(false);
          }}
        >
          <div className="waimai-minOrderDialog" onMouseDown={(e) => e.stopPropagation()}>
            <div className="waimai-minOrderTitle">还未达到起送价</div>
            <div className="waimai-minOrderText">
              当前已选商品金额为 ¥{cartTotal.toFixed(1).replace(/\.0$/, '')}，本店起送价为 ¥
              {minOrderPrice.toFixed(1).replace(/\.0$/, '')}。
            </div>
            <button
              type="button"
              className="waimai-minOrderBtn"
              onClick={() => setMinOrderDialogOpen(false)}
            >
              知道了，继续加购
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FlyBall: React.FC<{
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  ctrlX: number;
  ctrlY: number;
}> = ({ fromX, fromY, toX, toY, ctrlX, ctrlY }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const duration = 620;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const inv = 1 - t;
      // 二次贝塞尔
      const x = inv * inv * fromX + 2 * inv * t * ctrlX + t * t * toX;
      const y = inv * inv * fromY + 2 * inv * t * ctrlY + t * t * toY;
      const scale = 1 - 0.35 * t;
      const opacity = t > 0.9 ? (1 - t) / 0.1 : 1;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
      el.style.opacity = `${opacity}`;
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fromX, fromY, toX, toY, ctrlX, ctrlY]);

  return <div ref={ref} className="waimai-flyBall" />;
};

export const WaimaiApp: React.FC<Props> = ({ onExit }) => {
  const [bottomTab, setBottomTab] = React.useState<BottomTabId>('首页');
  const [searchKeyword, setSearchKeyword] = React.useState('奶茶');
  const [view, setView] = React.useState<'home' | 'shop'>('home');
  const [activeShop, setActiveShop] = React.useState<ShopPreview | null>(null);

  // 触摸拖动状态（手机端横向滑动）
  const goodTouchState = React.useRef<{
    startX: number;
    startY: number;
    startScrollLeft: number;
    isDragging: boolean;
  }>({
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    isDragging: false
  });

  // 主页店铺预览菜品：支持鼠标拖动进行横向滚动（兼容 PC 端）
  const handleGoodScrollerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el) return;

    const startX = e.pageX;
    const startScrollLeft = el.scrollLeft;
    let isDragging = false;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.pageX - startX;
      if (Math.abs(deltaX) > 3) {
        isDragging = true;
      }
      el.scrollLeft = startScrollLeft - deltaX;
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      // 阻止轻微拖动被当成点击
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // 主页店铺预览菜品：支持手机端手指左右滑动（iOS Safari PWA）
  const handleGoodScrollerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    goodTouchState.current = {
      startX: touch.pageX,
      startY: touch.pageY,
      startScrollLeft: el.scrollLeft,
      isDragging: false
    };
  };

  const handleGoodScrollerTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const state = goodTouchState.current;
    const deltaX = touch.pageX - state.startX;
    const deltaY = touch.pageY - state.startY;

    // 还未确定滑动方向时，根据水平/垂直位移判断
    if (!state.isDragging) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      // 小范围抖动，不处理
      if (absX < 4 && absY < 4) {
        return;
      }
      // 水平位移大于垂直位移 → 判定为横向滑动，接管滚动
      if (absX > absY) {
        state.isDragging = true;
      } else {
        // 垂直滑动，交给页面本身，直接返回
        return;
      }
    }

    // 已经判定为横向滑动 → 控制横向 scrollLeft
    if (state.isDragging) {
      el.scrollLeft = state.startScrollLeft - deltaX;
    }
  };

  const handleGoodScrollerTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    goodTouchState.current.isDragging = false;
  };

  if (view === 'shop' && activeShop) {
    return <ShopOrderPage shop={activeShop} onBack={() => setView('home')} />;
  }

  return (
    <div className="waimai-app">
      {/* 顶部：tab + 搜索 */}
      <div className="waimai-top">
        <div className="waimai-topbar">
          <button type="button" className="waimai-back" onClick={onExit} aria-label="返回桌面" />
          <div className="waimai-titlebar" aria-label="标题栏">
            外卖
          </div>
        </div>

        <div className="waimai-searchRow">
          <div className="waimai-searchLeft">
            <div className="waimai-drop" aria-label="当前频道">
              外卖
              <span className="waimai-dropCaret" aria-hidden="true">▾</span>
            </div>
            <div className="waimai-searchBox">
              <span className="waimai-searchIcon" aria-hidden="true">🔍</span>
              <input
                className="waimai-searchInput"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索商家 / 商品"
                aria-label="搜索"
              />
            </div>
          </div>
          <button type="button" className="waimai-searchBtn">
            搜索
          </button>
        </div>

        <div className="waimai-locRow">
          <div className="waimai-locActions">
            <button type="button" className="waimai-locBtn">订单</button>
            <button type="button" className="waimai-locBtn is-red">红包</button>
          </div>
        </div>
      </div>

      {/* 主体滚动内容 */}
      <div className="waimai-scroll">
        {/* 顶部品类：改为一行横向滑动 */}
        <div className="waimai-grid">
          {CATEGORIES.map((c) => (
            <button key={c.label} type="button" className="waimai-gridItem">
              <div className="waimai-gridIcon" aria-hidden="true">{c.icon}</div>
              <div className="waimai-gridLabel">{c.label}</div>
            </button>
          ))}
        </div>

        {/* 下方重复的小品类标签栏已移除 */}

        <div className="waimai-shopList">
          {SHOP_PREVIEWS.map((s) => (
            <div
              key={s.name}
              className="waimai-shopCard"
              role="button"
              tabIndex={0}
              onClick={() => {
                setActiveShop(s);
                setView('shop');
              }}
            >
              <div className="waimai-shopHead">
                <div className="waimai-shopAvatarWrap">
                  <div
                    className="waimai-shopAvatar"
                    aria-hidden="true"
                    style={
                      s.name === '一碗热乎粥'
                        ? { backgroundImage: `url(${zhouLogo})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : s.name === '晚风冰品社'
                          ? { backgroundImage: `url(${wanfengLogo})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                          : undefined
                    }
                  />
                  <div className="waimai-shopBrand">品牌</div>
                </div>

                <div className="waimai-shopInfo">
                  <div className="waimai-shopRow1">
                    <div className="waimai-shopTitle">{s.name}</div>
                    <div className="waimai-shopRight">
                      <span className="waimai-shopEta">
                        <span className="waimai-bolt" aria-hidden="true">⚡</span>
                        {s.eta}
                      </span>
                    </div>
                  </div>

                  <div className="waimai-shopRow2">
                    <span>{s.monthlySales}</span>
                    <span className="waimai-dot">·</span>
                    <span>{s.startPrice}</span>
                    <span className="waimai-dot">·</span>
                    <span>{s.deliveryFee}</span>
                  </div>

                  <div className="waimai-shopRow3">
                    <span className="waimai-shopRating">{s.rating}</span>
                    <span className="waimai-shopRec">{s.recommendText}</span>
                    <span className="waimai-shopFire" aria-hidden="true">🔥</span>
                  </div>

                  <div className="waimai-shopCoupons">
                    {s.coupons.map((c) => (
                      <span key={c} className="waimai-couponChip">{c}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="waimai-goodRow">
                <div className="waimai-promoCard">
                  <div className="waimai-promoTop">
                    <span className="waimai-promoBadge">超级吃货卡</span>
                  </div>
                  <div className="waimai-promoMain">
                    {(() => {
                      const tiers = SHOP_PROMOS[s.name]?.eatCardDiscountTiers ?? [];
                      const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
                      const big = sorted[0] ? `${sorted[0].threshold}减${sorted[0].discount}` : '本店暂无';
                      const sub = sorted[1] ? `${sorted[1].threshold}减${sorted[1].discount}` : '';
                      return (
                        <>
                          <div className="waimai-promoBig">{big}</div>
                          <div className="waimai-promoSub">{sub}</div>
                        </>
                      );
                    })()}
                  </div>
                  <button type="button" className="waimai-promoBtn">
                    去使用 <span aria-hidden="true">›</span>
                  </button>
                </div>

                <div
                  className="waimai-goodScroller"
                  onMouseDown={handleGoodScrollerMouseDown}
                  onTouchStart={handleGoodScrollerTouchStart}
                  onTouchMove={handleGoodScrollerTouchMove}
                  onTouchEnd={handleGoodScrollerTouchEnd}
                >
                  {/* 菜品预览：最多预览前 5 个，可左右滑动，不再显示左下角小标签 */}
                  {s.goods.slice(0, 5).map((g) => (
                    <div key={g.title} className="waimai-goodCard">
                      <div
                        className="waimai-goodPic"
                        aria-hidden="true"
                        style={
                          g.img
                            ? { backgroundImage: `url(${g.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : undefined
                        }
                      >
                        {g.tag && <span className="waimai-goodTag">{g.tag}</span>}
                      </div>
                      <div className="waimai-goodTitle">{g.title}</div>
                      <div className="waimai-goodBottom">
                        <div className="waimai-goodPrice">{g.price}</div>
                        <button type="button" className="waimai-goodAdd" aria-label="加入购物车">
                          +
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 滑动到最右侧时的“进店查看更多”占位卡片 */}
                  <div className="waimai-goodCard waimai-goodMore">
                    <div className="waimai-goodMoreInner">进店查看更多</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部导航 */}
      <div className="waimai-bottom">
        {BOTTOM_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`waimai-bottomItem ${bottomTab === t.id ? 'is-active' : ''}`}
            onClick={() => setBottomTab(t.id)}
          >
            <div className="waimai-bottomIcon" aria-hidden="true">
              <LineIcon name={t.id} active={bottomTab === t.id} />
            </div>
            <div className="waimai-bottomLabel">{t.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};


