import React from 'react';
import {
  APPEARANCE_THEME_KEY,
  DESKTOP_APP_IDS,
  type AppearanceThemeV1,
  type DesktopAppId,
  loadAppearanceTheme,
  saveAppearanceTheme
} from '../appearance/appearanceTheme';
import { applyAppearanceTheme } from '../appearance/applyAppearanceTheme';
import { buildCustomCss } from '../appearance/applyAppearanceTheme';
import { appStorage } from '../storage/appStorage';

const DESKTOP_LABELS: Record<DesktopAppId, string> = {
  ai: '微信',
  weibo: '微博',
  waimai: '外卖',
  taobao: '淘宝',
  'api-settings': 'API 设置',
  appearance: '外观',
  'voice-tuning': '音色调整',
  notifications: '通知',
  account: '账户'
};

const MAX_ICON_BYTES = 900 * 1024;
const MAX_WALL_BYTES = 2 * 1024 * 1024;

const fileToDataUrl = (file: File, maxBytes: number): Promise<string> =>
  new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error(`文件过大（上限约 ${Math.round(maxBytes / 1024)}KB）`));
      return;
    }
    const fr = new FileReader();
    fr.onload = () => {
      const r = fr.result;
      if (typeof r === 'string') resolve(r);
      else reject(new Error('读取失败'));
    };
    fr.onerror = () => reject(new Error('读取失败'));
    fr.readAsDataURL(file);
  });

const ColorRow: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <label
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 12,
      fontSize: 13,
      color: '#374151'
    }}
  >
    <span style={{ flexShrink: 0 }}>{label}</span>
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        flex: 1,
        maxWidth: 200,
        padding: '8px 10px',
        borderRadius: 10,
        border: '1px solid #e5e7eb',
        fontSize: 13,
        fontFamily: 'ui-monospace, monospace'
      }}
    />
    <input
      type="color"
      value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#111827'}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: 40, height: 36, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 8 }}
      aria-label={`${label} 取色`}
    />
  </label>
);

export const AppearanceApp: React.FC = () => {
  const [theme, setTheme] = React.useState<AppearanceThemeV1>(() => loadAppearanceTheme());
  const [hint, setHint] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<'wallpaper' | 'wechat' | 'icons' | 'css'>('css');

  const persist = React.useCallback((next: AppearanceThemeV1) => {
    setTheme(next);
    saveAppearanceTheme(next);
    applyAppearanceTheme(next);
  }, []);

  React.useEffect(() => {
    return appStorage.subscribe((key) => {
      if (key === APPEARANCE_THEME_KEY) {
        setTheme(loadAppearanceTheme());
      }
    });
  }, []);

  const setWechat = (patch: Partial<NonNullable<AppearanceThemeV1['wechat']>>) => {
    persist({
      ...theme,
      wechat: { ...theme.wechat, ...patch }
    });
  };

  const resetAll = () => {
    const empty: AppearanceThemeV1 = {
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
    };
    persist(empty);
    setHint('已恢复默认外观');
    window.setTimeout(() => setHint(null), 2000);
  };

  const previewCss = React.useMemo(() => buildCustomCss(theme), [theme]);

  return (
    <div
      className="app-content"
      style={{
        padding: '16px 14px 24px',
        overflowY: 'auto',
        background: '#ffffff',
        boxSizing: 'border-box',
        flex: 1,
        minHeight: 0
      }}
    >
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.55, margin: '0 0 14px' }}>
          通过主题色与自定义 CSS 调整手机内视觉。图标与壁纸仅保存在本机；自定义 CSS
          请勿粘贴不信任来源。
        </p>

        {hint ? (
          <div style={{ marginBottom: 12, fontSize: 13, color: '#047857', fontWeight: 600 }}>{hint}</div>
        ) : null}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {(
            [
              ['wallpaper', '桌面壁纸'],
              ['css', '聊天气泡']
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: tab === id ? '1px solid #111827' : '1px solid #e5e7eb',
                background: tab === id ? '#111827' : '#fff',
                color: tab === id ? '#fff' : '#374151',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'wallpaper' && (
          <section
            style={{
              background: '#f9fafb',
              borderRadius: 14,
              padding: 14,
              border: '1px solid #eef2f6',
              marginBottom: 14
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#111827' }}>桌面壁纸</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {(['default', 'solid', 'image'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() =>
                    persist({
                      ...theme,
                      phoneInner: {
                        mode: m,
                        solid: theme.phoneInner?.solid,
                        imageDataUrl: theme.phoneInner?.imageDataUrl
                      }
                    })
                  }
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border:
                      (theme.phoneInner?.mode || 'default') === m ? '1px solid #111827' : '1px solid #e5e7eb',
                    background: (theme.phoneInner?.mode || 'default') === m ? '#e5e7eb' : '#fff',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  {m === 'default' ? '默认图' : m === 'solid' ? '纯色' : '自定义图'}
                </button>
              ))}
            </div>
            {(theme.phoneInner?.mode || 'default') === 'solid' && (
              <ColorRow
                label="背景色"
                value={theme.phoneInner?.solid || '#0f172a'}
                onChange={(solid) =>
                  persist({
                    ...theme,
                    phoneInner: { mode: 'solid', solid, imageDataUrl: theme.phoneInner?.imageDataUrl }
                  })
                }
              />
            )}
            {(theme.phoneInner?.mode || 'default') === 'image' && (
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: '#374151' }}>
                  上传图片（约 2MB 内）
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (!f) return;
                    try {
                      const imageDataUrl = await fileToDataUrl(f, MAX_WALL_BYTES);
                      persist({
                        ...theme,
                        phoneInner: { mode: 'image', solid: theme.phoneInner?.solid, imageDataUrl }
                      });
                      setHint('壁纸已更新');
                      window.setTimeout(() => setHint(null), 1800);
                    } catch (err) {
                      setHint(err instanceof Error ? err.message : '上传失败');
                      window.setTimeout(() => setHint(null), 2500);
                    }
                  }}
                />
                {theme.phoneInner?.imageDataUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      persist({
                        ...theme,
                        phoneInner: { mode: 'image', solid: theme.phoneInner?.solid, imageDataUrl: undefined }
                      })
                    }
                    style={{ marginTop: 8, fontSize: 12, color: '#b45309', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    清除自定义图
                  </button>
                ) : null}
              </div>
            )}
          </section>
        )}

        {tab === 'wechat' && (
          <section
            style={{
              background: '#f9fafb',
              borderRadius: 14,
              padding: 14,
              border: '1px solid #eef2f6',
              marginBottom: 14
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#111827' }}>聊天气泡</div>
            <ColorRow
              label="对方背景"
              value={theme.wechat?.bubbleOtherBg || '#ffffff'}
              onChange={(bubbleOtherBg) => setWechat({ bubbleOtherBg })}
            />
            <ColorRow
              label="对方文字"
              value={theme.wechat?.bubbleOtherFg || '#111827'}
              onChange={(bubbleOtherFg) => setWechat({ bubbleOtherFg })}
            />
            <ColorRow
              label="自己背景"
              value={theme.wechat?.bubbleSelfBg || '#111827'}
              onChange={(bubbleSelfBg) => setWechat({ bubbleSelfBg })}
            />
            <ColorRow
              label="自己文字"
              value={theme.wechat?.bubbleSelfFg || '#f9fafb'}
              onChange={(bubbleSelfFg) => setWechat({ bubbleSelfFg })}
            />

            <div style={{ fontWeight: 700, fontSize: 14, margin: '18px 0 8px', color: '#111827' }}>顶栏与导航</div>
            <ColorRow
              label="微信顶栏"
              value={theme.wechat?.headerBg || '#f9f9f9'}
              onChange={(headerBg) => setWechat({ headerBg })}
            />
            <ColorRow
              label="顶栏底边"
              value={theme.wechat?.headerBorder || '#e5e5e5'}
              onChange={(headerBorder) => setWechat({ headerBorder })}
            />
            <ColorRow
              label="二级页顶栏"
              value={theme.wechat?.launcherHeaderBg || '#ffffff'}
              placeholder="淘宝/API 等"
              onChange={(launcherHeaderBg) => setWechat({ launcherHeaderBg })}
            />
            <ColorRow
              label="底部导航背景"
              value={theme.wechat?.tabsBg || '#ffffff'}
              onChange={(tabsBg) => setWechat({ tabsBg })}
            />
            <ColorRow
              label="导航顶部分割线"
              value={theme.wechat?.tabsTopLine || '#e5e5e5'}
              onChange={(tabsTopLine) => setWechat({ tabsTopLine })}
            />
            <ColorRow
              label="导航未选中"
              value={theme.wechat?.tabInactive || '#6b7280'}
              onChange={(tabInactive) => setWechat({ tabInactive })}
            />
            <ColorRow
              label="导航选中"
              value={theme.wechat?.tabActive || '#111827'}
              onChange={(tabActive) => setWechat({ tabActive })}
            />
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '12px 0 0', lineHeight: 1.45 }}>
              底部四个按钮的「图标」为内置矢量图，若需替换可在「自定义 CSS」里用 background /
              mask 覆盖 <code style={{ fontSize: 10 }}>.wechat-tab-icon</code>。
            </p>
          </section>
        )}

        {tab === 'icons' && (
          <section
            style={{
              background: '#f9fafb',
              borderRadius: 14,
              padding: 14,
              border: '1px solid #eef2f6',
              marginBottom: 14
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#111827' }}>桌面应用图标</div>
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 12 }}>
              上传方形 PNG/WebP 为宜；留空则使用默认图标。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DESKTOP_APP_IDS.map((id) => (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 0',
                    borderBottom: '1px solid #eef2f6'
                  }}
                >
                  <span style={{ width: 72, fontSize: 13, color: '#374151', flexShrink: 0 }}>{DESKTOP_LABELS[id]}</span>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: '#e5e7eb',
                      flexShrink: 0
                    }}
                  >
                    {theme.desktopIcons?.[id] ? (
                      <img src={theme.desktopIcons[id]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ fontSize: 10, color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>默认</div>
                    )}
                  </div>
                  <label style={{ fontSize: 12, color: '#2563eb', cursor: 'pointer' }}>
                    上传
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (!f) return;
                        try {
                          const url = await fileToDataUrl(f, MAX_ICON_BYTES);
                          persist({
                            ...theme,
                            desktopIcons: { ...theme.desktopIcons, [id]: url }
                          });
                        } catch (err) {
                          setHint(err instanceof Error ? err.message : '上传失败');
                          window.setTimeout(() => setHint(null), 2500);
                        }
                      }}
                    />
                  </label>
                  {theme.desktopIcons?.[id] ? (
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...theme.desktopIcons };
                        delete next[id];
                        persist({ ...theme, desktopIcons: next });
                      }}
                      style={{ fontSize: 12, color: '#b45309', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      清除
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'css' && (
          <section
            style={{
              background: '#f9fafb',
              borderRadius: 14,
              padding: 14,
              border: '1px solid #eef2f6',
              marginBottom: 14
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#111827' }}>聊天气泡样式</div>
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 12, lineHeight: 1.5 }}>
              只允许改聊天页气泡：颜色、圆角、毛玻璃效果、透明度、边框等。建议写法以 <code style={{ fontSize: 10 }}>.wechat-app</code> 开头，并成对修改
              <code style={{ fontSize: 10 }}>::before</code>/<code style={{ fontSize: 10 }}>::after</code>（气泡三角）。
            </p>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <ColorRow
                label="对方背景"
                value={theme.wechat?.bubbleOtherBg || '#ffffff'}
                onChange={(bubbleOtherBg) => {
                  persist({ ...theme, wechat: { ...(theme.wechat || {}), bubbleOtherBg } });
                }}
              />
              <ColorRow
                label="对方文字"
                value={theme.wechat?.bubbleOtherFg || '#111827'}
                onChange={(bubbleOtherFg) => {
                  persist({ ...theme, wechat: { ...(theme.wechat || {}), bubbleOtherFg } });
                }}
              />
              <ColorRow
                label="自己背景"
                value={theme.wechat?.bubbleSelfBg || '#111827'}
                onChange={(bubbleSelfBg) => {
                  persist({ ...theme, wechat: { ...(theme.wechat || {}), bubbleSelfBg } });
                }}
              />
              <ColorRow
                label="自己文字"
                value={theme.wechat?.bubbleSelfFg || '#f9fafb'}
                onChange={(bubbleSelfFg) => {
                  persist({ ...theme, wechat: { ...(theme.wechat || {}), bubbleSelfFg } });
                }}
              />
            </div>

            <textarea
              value={theme.customCssBubbles || ''}
              onChange={(e) => setTheme({ ...theme, customCssBubbles: e.target.value })}
              onBlur={() => persist(theme)}
              placeholder={`/* 例：毛玻璃风 */\n.wechat-app .wechat-bubble-other{\n  background: rgba(255,255,255,0.7) !important;\n  color: #111827 !important;\n  backdrop-filter: blur(10px) saturate(150%) !important;\n}\n.wechat-app .wechat-bubble-other::before{\n  border-right-color: rgba(255,255,255,0.7) !important;\n}\n.wechat-app .wechat-bubble-self{\n  background: rgba(17,24,39,0.55) !important;\n  color: #f9fafb !important;\n  backdrop-filter: blur(10px) saturate(150%) !important;\n}\n.wechat-app .wechat-bubble-self::after{\n  border-left-color: rgba(17,24,39,0.55) !important;\n}\n`}
              spellCheck={false}
              style={{
                width: '100%',
                minHeight: 240,
                padding: 12,
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                fontSize: 12,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                lineHeight: 1.45,
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 10, marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => persist(theme)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 999,
                  border: 'none',
                  background: '#111827',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                应用气泡样式
              </button>
              <button
                type="button"
                onClick={() =>
                  persist({
                    ...theme,
                    wechat: {
                      ...(theme.wechat || {}),
                      bubbleOtherBg: undefined,
                      bubbleOtherFg: undefined,
                      bubbleSelfBg: undefined,
                      bubbleSelfFg: undefined
                    },
                    customCssBubbles: ''
                  })
                }
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 999,
                  border: '1px solid #fecaca',
                  background: '#fff',
                  color: '#b91c1c',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                恢复默认气泡
              </button>
            </div>

            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#111827' }}>
              实时预览（只看彼此气泡）
            </div>
            <div
              style={{
                background: '#f5f5f5',
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                padding: 12,
                overflow: 'hidden',
                marginBottom: 10
              }}
            >
              <style>{previewCss}</style>
              <div
                className="wechat-app"
                style={{
                  height: 210,
                  paddingTop: 0,
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#f5f5f5'
                }}
              >
                <div style={{ padding: '62px 10px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div className="wechat-bubble wechat-bubble-other">对方：你好呀～</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div className="wechat-bubble wechat-bubble-self">我：在的，在聊天呢！</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={resetAll}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid #fecaca',
            background: '#fff',
            color: '#b91c1c',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          恢复全部默认
        </button>
      </div>
    </div>
  );
};
