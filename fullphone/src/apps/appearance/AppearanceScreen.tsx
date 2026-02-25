import type { ChangeEvent, FC, FormEvent } from "react";
import { useState } from "react";
import { useTheme, type ThemeId } from "../../context/ThemeContext";
import { useWallpaper } from "../../context/WallpaperContext";
import { useIconStyle } from "../../context/IconStyleContext";

interface AppearanceScreenProps {
  onBackHome: () => void;
}

const THEME_OPTIONS: { id: ThemeId; name: string; desc: string }[] = [
  {
    id: "pink",
    name: "软糯糯粉白",
    desc: "默认的小手机配色，适合一切乙女心情"
  },
  {
    id: "blue",
    name: "冷淡蓝白",
    desc: "更克制一点的小宇宙，夜晚刷刷也很舒服"
  },
  {
    id: "mint",
    name: "薄荷森系",
    desc: "像森林和薄荷糖，适合需要一点点清醒的时候"
  },
  {
    id: "sunset",
    name: "暖橘日落",
    desc: "像落日和蜜桃汽水，整块屏幕都软绵绵的"
  },
  {
    id: "lavender",
    name: "薰衣草星河",
    desc: "一点紫一点蓝，适合睡前安静刷刷消息"
  }
];

export const AppearanceScreen: FC<AppearanceScreenProps> = ({ onBackHome }) => {
  const { theme, setTheme } = useTheme();
  const { wallpaperUrl, setWallpaperUrl, clearWallpaper } = useWallpaper();
  const [wallpaperInput, setWallpaperInput] = useState<string>(wallpaperUrl ?? "");
  const [wallpaperError, setWallpaperError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const {
    iconBgColor,
    glowEnabled,
    glowColor,
    borderRadius,
    setIconBgColor,
    setGlowEnabled,
    setGlowColor,
    setBorderRadius,
    resetIconStyle
  } = useIconStyle();
  const [iconBgInput, setIconBgInput] = useState<string>(iconBgColor ?? "#ffc9e3");
  const [iconGlowInput, setIconGlowInput] = useState<string>(glowColor ?? "#f9a8d4");
  const [iconRadiusInput, setIconRadiusInput] = useState<number>(borderRadius ?? 18);

  const handleUrlSubmit = (e: FormEvent) => {
    e.preventDefault();
    const value = wallpaperInput.trim();

    if (!value) {
      setWallpaperUrl(null);
      setWallpaperError(null);
      return;
    }

    // 简单校验一下 URL / dataURL 格式，避免明显输错
    const isDataUrl = value.startsWith("data:image/");
    const looksLikeUrl = /^https?:\/\/.+/i.test(value);

    if (!isDataUrl && !looksLikeUrl) {
      setWallpaperError("请输入以 http(s) 开头的图片地址，或使用上方上传本地图片");
      return;
    }

    setWallpaperError(null);
    setIsApplying(true);
    try {
      setWallpaperUrl(value);
    } finally {
      setIsApplying(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setWallpaperError("请选择图片文件（jpg / png / webp 等）");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setWallpaperUrl(result);
        setWallpaperInput(result);
        setWallpaperError(null);
      } else {
        setWallpaperError("读取图片失败，可以尝试换一张或改用 URL 方式");
      }
    };
    reader.onerror = () => {
      setWallpaperError("读取图片失败，可以尝试换一张或改用 URL 方式");
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    clearWallpaper();
    setWallpaperInput("");
    setWallpaperError(null);
  };

  return (
    <div className="appearance-screen">
      <header className="settings-header">
        <button type="button" className="wechat-back-btn" onClick={onBackHome}>
          ‹ 桌面
        </button>
        <div className="settings-title">
          <div className="settings-title-main">外观 · 换一套小宇宙</div>
          <div className="settings-title-sub">选择一个主题色，所有应用都会跟着一起变</div>
        </div>
      </header>

      <main className="settings-body">
        <section className="soft-card settings-section">
          <div className="soft-card-header">
            <div className="soft-card-header-text">
              <div className="soft-card-title">全局主题配色</div>
              <div className="soft-card-subtitle">更换后，桌面图标、微信、设置等都会同步变色</div>
            </div>
          </div>

          {THEME_OPTIONS.map((opt) => {
            const active = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`soft-card appearance-card ${active ? "appearance-card-active" : ""}`}
                onClick={() => setTheme(opt.id)}
              >
                <div
                  className={`appearance-preview appearance-preview-${opt.id}`}
                  aria-hidden="true"
                />
                <div className="appearance-main">
                  <div className="appearance-name">{opt.name}</div>
                  <div className="appearance-desc">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </section>

        <section className="soft-card settings-section">
          <div className="soft-card-header">
            <div className="soft-card-header-text">
              <div className="soft-card-title">手机桌面壁纸</div>
              <div className="soft-card-subtitle">
                上传本地图片或填写图片链接，替换桌面背景（仅在手机中间这块屏幕生效）
              </div>
            </div>
          </div>

          <div className="settings-field">
            <label className="settings-label">当前预览</label>
            <div className="appearance-wallpaper-preview-wrapper">
              <div
                className={`appearance-wallpaper-preview${
                  wallpaperUrl ? " appearance-wallpaper-preview-has-image" : ""
                }`}
                style={
                  wallpaperUrl
                    ? {
                        backgroundImage: `url(${wallpaperUrl})`
                      }
                    : undefined
                }
              >
                {!wallpaperUrl && (
                  <span className="appearance-wallpaper-preview-placeholder">
                    暂无自定义壁纸，使用系统默认背景
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="settings-field">
            <label className="settings-label">上传本地图片</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="settings-input appearance-wallpaper-file-input"
            />
          </div>

          <form className="settings-field" onSubmit={handleUrlSubmit}>
            <label className="settings-label">或使用图片 URL</label>
            <input
              className="settings-input"
              placeholder="例如：https://example.com/wallpaper.png"
              value={wallpaperInput}
              onChange={(e) => setWallpaperInput(e.target.value)}
            />
            {wallpaperError && <div className="wechat-chat-error">{wallpaperError}</div>}
            <div className="appearance-wallpaper-actions">
              <button
                type="submit"
                className="primary-pill-btn appearance-wallpaper-apply-btn"
                disabled={isApplying}
              >
                {isApplying ? "应用中…" : "应用到桌面"}
              </button>
              <button
                type="button"
                className="soft-icon-btn appearance-wallpaper-clear-btn"
                onClick={handleClear}
                disabled={!wallpaperUrl && !wallpaperInput}
              >
                恢复默认壁纸
              </button>
            </div>
          </form>
        </section>

        <section className="soft-card settings-section">
          <div className="soft-card-header">
            <div className="soft-card-header-text">
              <div className="soft-card-title">桌面应用图标样式</div>
              <div className="soft-card-subtitle">
                调整图标背景颜色、发光效果和圆角，让手机桌面更合你心意
              </div>
            </div>
          </div>

          <div className="settings-field">
            <label className="settings-label">图标预览</label>
            <div className="appearance-icon-preview-wrapper">
              <div className="appearance-icon-preview-row">
                <div
                  className="appearance-icon-preview"
                  style={{
                    borderRadius: iconRadiusInput,
                    background: iconBgColor || "linear-gradient(135deg, var(--accent-pink-soft), var(--accent-lilac))",
                    boxShadow: glowEnabled
                      ? `0 6px 14px ${glowColor || "rgba(244, 114, 182, 0.6)"}`
                      : "none"
                  }}
                >
                  <span className="appearance-icon-preview-emoji" aria-hidden="true">
                    💬
                  </span>
                </div>
                <div className="appearance-icon-preview-caption">
                  <div>这只是预览，实际桌面上的所有应用图标都会跟着一起变化</div>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-field">
            <label className="settings-label">图标背景色</label>
            <div className="appearance-icon-row">
              <input
                type="color"
                value={iconBgInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setIconBgInput(value);
                  setIconBgColor(value);
                }}
                className="appearance-icon-color-input"
              />
              <input
                className="settings-input appearance-icon-color-text"
                value={iconBgInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setIconBgInput(value);
                  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())) {
                    setIconBgColor(value.trim());
                  }
                }}
                placeholder="#ffc9e3 或留空使用主题默认渐变"
              />
            </div>
          </div>

          <div className="settings-field">
            <label className="settings-label">发光效果</label>
            <div className="appearance-icon-row appearance-icon-row-space-between">
              <label className="appearance-toggle-label">
                <input
                  type="checkbox"
                  checked={glowEnabled}
                  onChange={(e) => setGlowEnabled(e.target.checked)}
                />
                <span>开启图标发光阴影</span>
              </label>
            </div>
          </div>

          <div className="settings-field">
            <label className="settings-label">发光颜色</label>
            <div className="appearance-icon-row">
              <input
                type="color"
                value={iconGlowInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setIconGlowInput(value);
                  setGlowColor(value);
                }}
                className="appearance-icon-color-input"
                disabled={!glowEnabled}
              />
              <input
                className="settings-input appearance-icon-color-text"
                value={iconGlowInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setIconGlowInput(value);
                  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())) {
                    setGlowColor(value.trim());
                  }
                }}
                placeholder="#f9a8d4 或留空使用主题默认粉色"
                disabled={!glowEnabled}
              />
            </div>
          </div>

          <div className="settings-field">
            <label className="settings-label">
              图标圆角（{iconRadiusInput}
              px）
            </label>
            <input
              type="range"
              min={8}
              max={28}
              value={iconRadiusInput}
              onChange={(e) => {
                const value = Number(e.target.value) || 18;
                setIconRadiusInput(value);
                setBorderRadius(value);
              }}
            />
          </div>

          <div className="settings-field">
            <button
              type="button"
              className="soft-icon-btn"
              onClick={() => {
                resetIconStyle();
                setIconBgInput("#ffc9e3");
                setIconGlowInput("#f9a8d4");
                setIconRadiusInput(18);
              }}
            >
              恢复默认图标样式
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};


