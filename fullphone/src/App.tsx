import { useEffect, useState } from "react";
import { AppearanceScreen } from "./apps/appearance/AppearanceScreen";
import { SettingsScreen } from "./apps/settings/SettingsScreen";
import { WeChatHome } from "./apps/wechat/WeChatHome";
import { WorldbookScreen } from "./apps/worldbook/WorldbookScreen";
import { PetHome } from "./apps/pet/PetHome";
import { WeiboHome } from "./apps/weibo/WeiboHome";
import { useWallpaper } from "./context/WallpaperContext";
import { useIconStyle } from "./context/IconStyleContext";

type AppShortcutId =
  | "wechat"
  | "food"
  | "weibo"
  | "xiaohongshu"
  | "pet"
  | "settings"
  | "appearance"
  | "coupleSpace"
  | "worldbook";

interface AppShortcut {
  id: AppShortcutId;
  label: string;
  icon: string;
  hint: string;
}

const APP_SHORTCUTS: AppShortcut[] = [
  { id: "wechat", label: "微信", icon: "💬", hint: "和他/她的日常对话都在这里" },
  { id: "food", label: "外卖", icon: "🍰", hint: "一起决定今天要吃点什么" },
  { id: "weibo", label: "微博", icon: "✿", hint: "看看世界，也顺便看看彼此的小情绪" },
  { id: "xiaohongshu", label: "小红书", icon: "♡", hint: "收藏心动灵感与约会想法" },
  { id: "pet", label: "口袋宠物", icon: "🐾", hint: "一起把一只小小的心宠慢慢养大" },
  { id: "worldbook", label: "世界书", icon: "📖", hint: "为 AI 配置整个小世界的设定" },
  { id: "settings", label: "设置", icon: "⚙", hint: "调整小手机的 AI 与功能偏好" },
  { id: "appearance", label: "外观", icon: "🎀", hint: "切换壁纸与乙女主题，让界面更合你心" },
  { id: "coupleSpace", label: "情侣空间", icon: "💌", hint: "你们两个人的小世界与纪念日" }
];

export default function App() {
  const [now, setNow] = useState(() => new Date());
  const [activeApp, setActiveApp] = useState<AppShortcutId | null>(null);
  const { wallpaperUrl } = useWallpaper();
  const { iconBgColor, glowEnabled, glowColor, borderRadius } = useIconStyle();

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // 确保输入框在 iOS PWA 全屏模式下可以正常工作
  useEffect(() => {
    const handleInputTouch = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        ((target.tagName === "INPUT" && 
          (target as HTMLInputElement).type !== "checkbox" && 
          (target as HTMLInputElement).type !== "radio" &&
          (target as HTMLInputElement).type !== "file" &&
          (target as HTMLInputElement).type !== "submit" &&
          (target as HTMLInputElement).type !== "button" &&
          (target as HTMLInputElement).type !== "reset" &&
          !(target as HTMLInputElement).disabled &&
          !(target as HTMLInputElement).readOnly) ||
        (target.tagName === "TEXTAREA" && 
          !(target as HTMLTextAreaElement).disabled &&
          !(target as HTMLTextAreaElement).readOnly))
      ) {
        // 在 iOS PWA 模式下，需要立即聚焦并触发输入
        requestAnimationFrame(() => {
          if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            // 确保输入框可以获得焦点
            target.focus();
            // 在 iOS PWA 模式下，有时需要设置 selectionStart 才能弹出键盘
            if (target.setSelectionRange) {
              const len = target.value.length;
              target.setSelectionRange(len, len);
            }
            // 触发一个合成事件来确保键盘弹出
            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
            target.dispatchEvent(inputEvent);
          }
        });
      }
    };

    // 监听触摸开始事件
    document.addEventListener("touchstart", handleInputTouch, { passive: true, capture: true });
    
    // 也监听点击事件作为备选
    const handleInputClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        ((target.tagName === "INPUT" && 
          (target as HTMLInputElement).type !== "checkbox" && 
          (target as HTMLInputElement).type !== "radio" &&
          (target as HTMLInputElement).type !== "file" &&
          (target as HTMLInputElement).type !== "submit" &&
          (target as HTMLInputElement).type !== "button" &&
          (target as HTMLInputElement).type !== "reset" &&
          !(target as HTMLInputElement).disabled &&
          !(target as HTMLInputElement).readOnly) ||
        (target.tagName === "TEXTAREA" && 
          !(target as HTMLTextAreaElement).disabled &&
          !(target as HTMLTextAreaElement).readOnly))
      ) {
        requestAnimationFrame(() => {
          if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            target.focus();
            if (target.setSelectionRange) {
              const len = target.value.length;
              target.setSelectionRange(len, len);
            }
          }
        });
      }
    };

    document.addEventListener("click", handleInputClick, { passive: true, capture: true });

    return () => {
      document.removeEventListener("touchstart", handleInputTouch, { capture: true } as any);
      document.removeEventListener("click", handleInputClick, { capture: true } as any);
    };
  }, []);

  const time = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  });
  const date = now.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short"
  });

  const activeShortcut = activeApp ? APP_SHORTCUTS.find((s) => s.id === activeApp) ?? null : null;

  const isOnHome = !activeApp;
  const lockPhoneScroll = isOnHome || activeApp === "wechat" || activeApp === "weibo";

  // 桌面：完全固定不滚动
  // 微信/微博：外框固定，但内容容器可滚动；到顶/到底时阻止“回弹把整页带着滑”
  useEffect(() => {
    if (!lockPhoneScroll) return;

    // 桌面页：不允许任何滚动
    if (isOnHome) {
      const preventAll = (e: TouchEvent | WheelEvent) => {
        if ("touches" in e && e.touches && e.touches.length > 1) return;
        e.preventDefault();
      };
      document.addEventListener("touchmove", preventAll as any, { passive: false });
      document.addEventListener("wheel", preventAll as any, { passive: false });
      return () => {
        document.removeEventListener("touchmove", preventAll as any);
        document.removeEventListener("wheel", preventAll as any);
      };
    }

    const isWechatOrWeibo = activeApp === "wechat" || activeApp === "weibo";
    if (!isWechatOrWeibo) return;

    let startY = 0;

    const isScrollable = (el: HTMLElement) => {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      if (overflowY !== "auto" && overflowY !== "scroll") return false;
      return el.scrollHeight > el.clientHeight + 1;
    };

    const getScrollableParent = (from: HTMLElement | null) => {
      let cur: HTMLElement | null = from;
      while (cur && cur !== document.body) {
        if (isScrollable(cur)) return cur;
        cur = cur.parentElement;
      }
      return null;
    };

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
    };

    const shouldBlockOverscroll = (scrollEl: HTMLElement, deltaY: number) => {
      // deltaY > 0: 手指向下（页面想往上回弹/向下滚）
      // deltaY < 0: 手指向上（页面想往下回弹/向上滚）
      const top = scrollEl.scrollTop;
      const bottom = top + scrollEl.clientHeight >= scrollEl.scrollHeight - 1;
      const atTop = top <= 0;
      if (deltaY > 0 && atTop) return true;
      if (deltaY < 0 && bottom) return true;
      return false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) return;
      const target = e.target as HTMLElement | null;
      const scrollEl = getScrollableParent(target);
      const currentY = e.touches[0]?.clientY ?? 0;
      const deltaY = currentY - startY;

      // 触摸不在可滚动容器内：阻止整页被带着滑
      if (!scrollEl) {
        e.preventDefault();
        return;
      }

      // 在可滚动容器内：到顶/到底才阻止，避免 iOS 橡皮筋回弹传递到外层
      if (shouldBlockOverscroll(scrollEl, deltaY)) {
        e.preventDefault();
      }
    };

    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      const scrollEl = getScrollableParent(target);
      if (!scrollEl) {
        e.preventDefault();
        return;
      }
      const deltaY = -e.deltaY; // wheel 与 touch delta 方向相反，这里统一一下
      if (shouldBlockOverscroll(scrollEl, deltaY)) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchstart", onTouchStart as any, { passive: true });
    document.addEventListener("touchmove", onTouchMove as any, { passive: false });
    document.addEventListener("wheel", onWheel as any, { passive: false });

    return () => {
      document.removeEventListener("touchstart", onTouchStart as any);
      document.removeEventListener("touchmove", onTouchMove as any);
      document.removeEventListener("wheel", onWheel as any);
    };
  }, [lockPhoneScroll, isOnHome, activeApp]);

  return (
    <div className="fullscreen-root">
      <div className="fullscreen-bg" />
      <main className={`phone-fullscreen ${lockPhoneScroll ? "phone-fullscreen-no-scroll" : ""}`}>
        {wallpaperUrl && (
          <div
            className="phone-wallpaper"
            style={{
              backgroundImage: `url(${wallpaperUrl})`
            }}
          />
        )}
        {isOnHome ? (
          <>
            <header className="phone-header">
              <div className="phone-header-time">{time}</div>
              <div className="phone-header-date">{date}</div>
              <p className="phone-header-tagline">「 让小手机，悄悄陪着你 · 乙女但很安静 」</p>
            </header>

            <section className="phone-main">
              <section className="phone-grid">
                {APP_SHORTCUTS.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    className={`phone-icon ${activeShortcut?.id === app.id ? "phone-icon-active" : ""}`}
                    onClick={() => setActiveApp(app.id)}
                  >
                    <div
                      className="phone-icon-emoji"
                      aria-hidden="true"
                      style={{
                        borderRadius: borderRadius ?? 18,
                        background: iconBgColor || undefined,
                        boxShadow: glowEnabled
                          ? `0 6px 14px ${glowColor || "color-mix(in srgb, var(--accent-pink) 55%, transparent)"}`
                          : "none"
                      }}
                    >
                      {app.icon}
                    </div>
                    <div className="phone-icon-label">{app.label}</div>
                  </button>
                ))}
              </section>
            </section>

          </>
        ) : (
          <>
            {activeApp === "wechat" && <WeChatHome onBackHome={() => setActiveApp(null)} />}
            {activeApp === "settings" && <SettingsScreen onBackHome={() => setActiveApp(null)} />}
            {activeApp === "appearance" && (
              <AppearanceScreen onBackHome={() => setActiveApp(null)} />
            )}
            {activeApp === "worldbook" && (
              <WorldbookScreen onBackHome={() => setActiveApp(null)} />
            )}
            {activeApp === "pet" && <PetHome onBackHome={() => setActiveApp(null)} />}
            {activeApp === "weibo" && <WeiboHome onBackHome={() => setActiveApp(null)} />}
          </>
        )}
      </main>
    </div>
  );
}


