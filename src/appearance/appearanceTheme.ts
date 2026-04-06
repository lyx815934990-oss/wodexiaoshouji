import { appStorage } from '../storage/appStorage';

export const APPEARANCE_THEME_KEY = 'mini-ai-phone.appearance-theme-v1';

/** 桌面应用 id，与 App.tsx 中 AppId 一致 */
export const DESKTOP_APP_IDS = [
  'ai',
  'weibo',
  'waimai',
  'taobao',
  'api-settings',
  'appearance',
  'voice-tuning',
  'notifications',
  'account'
] as const;

export type DesktopAppId = (typeof DESKTOP_APP_IDS)[number];

export type PhoneInnerConfig = {
  mode: 'default' | 'solid' | 'image';
  /** 纯色模式下的颜色，如 #1e293b */
  solid?: string;
  /** 图片模式：data URL 或 http(s) */
  imageDataUrl?: string;
};

export type WeChatAppearanceConfig = {
  bubbleOtherBg?: string;
  bubbleOtherFg?: string;
  bubbleSelfBg?: string;
  bubbleSelfFg?: string;
  headerBg?: string;
  headerBorder?: string;
  /** 淘宝/API 等二级页顶栏（与微信顶栏可分开设） */
  launcherHeaderBg?: string;
  tabsBg?: string;
  tabsTopLine?: string;
  tabInactive?: string;
  tabActive?: string;
};

export type AppearanceThemeV1 = {
  v: 1;
  phoneInner?: PhoneInnerConfig;
  /** 各桌面图标：data URL / http(s)，键为 AppId */
  desktopIcons?: Partial<Record<DesktopAppId | string, string>>;
  wechat?: WeChatAppearanceConfig;
  /** （兼容旧版）用户自定义 CSS：历史字段名，已废弃 */
  customCss?: string;

  /** 全局兜底自定义 CSS（最后注入；建议只留极少量“兜底”） */
  customCssGlobal?: string;
  /** 微信全局标题栏 */
  customCssHeader?: string;
  /** 微信全局字体 */
  customCssFont?: string;
  /** 微信全局底部导航栏 */
  customCssTabs?: string;
  /** 微信全局输入栏 */
  customCssInputBar?: string;
  /** 微信全局聊天气泡 */
  customCssBubbles?: string;
  /** 微信钱包页面 */
  customCssWallet?: string;
  /** 微信身份页面 */
  customCssIdentity?: string;
  /** 微信设置页面 */
  customCssSettings?: string;
};

const defaultTheme = (): AppearanceThemeV1 => ({
  v: 1,
  phoneInner: { mode: 'default' },
  desktopIcons: {},
  wechat: {},
  customCss: undefined,
  customCssGlobal: '',
  customCssHeader: '',
  customCssFont: '',
  customCssTabs: '',
  customCssInputBar: '',
  customCssBubbles: '',
  customCssWallet: '',
  customCssIdentity: '',
  customCssSettings: ''
});

export const loadAppearanceTheme = (): AppearanceThemeV1 => {
  try {
    const raw = appStorage.getItem(APPEARANCE_THEME_KEY);
    if (!raw) return defaultTheme();
    const parsed = JSON.parse(raw) as Partial<AppearanceThemeV1>;
    if (!parsed || parsed.v !== 1) return defaultTheme();
    const legacyGlobal =
      typeof parsed.customCss === 'string' && parsed.customCss.trim()
        ? parsed.customCss
        : '';

    return {
      ...defaultTheme(),
      ...parsed,
      phoneInner: parsed.phoneInner?.mode ? parsed.phoneInner : { mode: 'default' },
      desktopIcons: typeof parsed.desktopIcons === 'object' && parsed.desktopIcons ? parsed.desktopIcons : {},
      wechat: typeof parsed.wechat === 'object' && parsed.wechat ? parsed.wechat : {},
      customCssGlobal:
        typeof parsed.customCssGlobal === 'string'
          ? parsed.customCssGlobal
          : legacyGlobal,
      customCssHeader: typeof parsed.customCssHeader === 'string' ? parsed.customCssHeader : '',
      customCssFont: typeof parsed.customCssFont === 'string' ? parsed.customCssFont : '',
      customCssTabs: typeof parsed.customCssTabs === 'string' ? parsed.customCssTabs : '',
      customCssInputBar: typeof parsed.customCssInputBar === 'string' ? parsed.customCssInputBar : '',
      customCssBubbles: typeof parsed.customCssBubbles === 'string' ? parsed.customCssBubbles : '',
      customCssWallet: typeof parsed.customCssWallet === 'string' ? parsed.customCssWallet : '',
      customCssIdentity: typeof parsed.customCssIdentity === 'string' ? parsed.customCssIdentity : '',
      customCssSettings: typeof parsed.customCssSettings === 'string' ? parsed.customCssSettings : '',
      customCss: undefined
    };
  } catch {
    return defaultTheme();
  }
};

export const saveAppearanceTheme = (theme: AppearanceThemeV1) => {
  try {
    appStorage.setItem(APPEARANCE_THEME_KEY, JSON.stringify(theme));
  } catch {
    // ignore
  }
};
