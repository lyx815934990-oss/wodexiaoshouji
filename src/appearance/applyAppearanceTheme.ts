import type { AppearanceThemeV1 } from './appearanceTheme';

const USER_STYLE_ID = 'mini-ai-appearance-user-css';

function clearAppearanceCssVars(root: HTMLElement) {
  const keys = [
    '--appearance-phone-inner-bg',
    '--appearance-wechat-bubble-other-bg',
    '--appearance-wechat-bubble-other-fg',
    '--appearance-wechat-bubble-self-bg',
    '--appearance-wechat-bubble-self-fg',
    '--appearance-wechat-header-bg',
    '--appearance-wechat-header-border',
    '--appearance-wechat-tabs-bg',
    '--appearance-wechat-tabs-top-line',
    '--appearance-wechat-tab-color',
    '--appearance-wechat-tab-active-color',
    '--appearance-wechat-tab-dot-border',
    '--appearance-wechat-tab-active-dot-bg',
    '--appearance-launcher-header-bg'
  ];
  keys.forEach((k) => root.style.removeProperty(k));
}

function setUserCustomCss(css: string) {
  let el = document.getElementById(USER_STYLE_ID) as HTMLStyleElement | null;
  const trimmed = (css || '').trim();
  if (!trimmed) {
    if (el?.parentNode) el.parentNode.removeChild(el);
    return;
  }
  if (!el) {
    el = document.createElement('style');
    el.id = USER_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = trimmed;
}

export function buildCustomCss(theme: AppearanceThemeV1): string {
  const parts: string[] = [];
  const add = (title: string, css: string | undefined) => {
    const t = (css || '').trim();
    if (!t) return;
    parts.push(`/* ===== ${title} ===== */\n${t}`);
  };

  add('微信-聊天气泡', theme.customCssBubbles);

  return parts.join('\n\n');
}

/**
 * 根据主题配置设置 document 上的 CSS 变量，并注入自定义样式。
 * 应在 initAppStorage 完成后调用。
 */
export const applyAppearanceTheme = (theme: AppearanceThemeV1) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  clearAppearanceCssVars(root);

  const pi = theme.phoneInner;
  if (pi?.mode === 'solid' && pi.solid && pi.solid.trim()) {
    root.style.setProperty('--appearance-phone-inner-bg', pi.solid.trim());
  } else if (pi?.mode === 'image' && pi.imageDataUrl && pi.imageDataUrl.trim()) {
    const u = pi.imageDataUrl.trim();
    root.style.setProperty(
      '--appearance-phone-inner-bg',
      `url("${u.replace(/"/g, '\\"')}") center center / cover no-repeat`
    );
  }

  const w = theme.wechat;
  if (w) {
    if (w.bubbleOtherBg) root.style.setProperty('--appearance-wechat-bubble-other-bg', w.bubbleOtherBg);
    if (w.bubbleOtherFg) root.style.setProperty('--appearance-wechat-bubble-other-fg', w.bubbleOtherFg);
    if (w.bubbleSelfBg) root.style.setProperty('--appearance-wechat-bubble-self-bg', w.bubbleSelfBg);
    if (w.bubbleSelfFg) root.style.setProperty('--appearance-wechat-bubble-self-fg', w.bubbleSelfFg);
    if (w.headerBg) root.style.setProperty('--appearance-wechat-header-bg', w.headerBg);
    if (w.headerBorder) root.style.setProperty('--appearance-wechat-header-border', w.headerBorder);
    if (w.tabsBg) root.style.setProperty('--appearance-wechat-tabs-bg', w.tabsBg);
    if (w.tabsTopLine) root.style.setProperty('--appearance-wechat-tabs-top-line', w.tabsTopLine);
    if (w.tabInactive) root.style.setProperty('--appearance-wechat-tab-color', w.tabInactive);
    if (w.tabInactive) {
      root.style.setProperty('--appearance-wechat-tab-dot-border', w.tabInactive);
    }
    if (w.tabActive) {
      root.style.setProperty('--appearance-wechat-tab-active-color', w.tabActive);
      root.style.setProperty('--appearance-wechat-tab-active-dot-bg', w.tabActive);
    }
    if (w.launcherHeaderBg) {
      root.style.setProperty('--appearance-launcher-header-bg', w.launcherHeaderBg);
    }
  }

  setUserCustomCss(buildCustomCss(theme));
};
