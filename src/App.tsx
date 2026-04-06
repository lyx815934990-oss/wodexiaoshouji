import React from 'react';
import { ApiSettingsApp } from './apps/ApiSettingsApp';
import { WaimaiApp } from './apps/WaimaiApp';
import WeChatApp from './apps/WeChatApp';
import { WeiboApp } from './apps/WeiboApp';
import { VoiceTuningApp } from './apps/VoiceTuningApp';
import { NotificationApp } from './apps/NotificationApp';
import { ActivationApp } from './apps/ActivationApp';
import { AccountApp } from './apps/AccountApp';
import { AiPhoneIcon } from './icons/AiPhoneIcon';
import { ApiSettingsIcon } from './icons/ApiSettingsIcon';
import { AppearanceIcon } from './icons/AppearanceIcon';
import { TaobaoIcon } from './icons/TaobaoIcon';
import { WaimaiIcon } from './icons/WaimaiIcon';
import { WeiboIcon } from './icons/WeiboIcon';
import { VoiceTuningIcon } from './icons/VoiceTuningIcon';
import { NotificationIcon } from './icons/NotificationIcon';
import { UserAccountIcon } from './icons/UserAccountIcon';
import { appStorage } from './storage/appStorage';
import { getOrCreateDeviceCode } from './storage/deviceCode';
import { OpeningSplash } from './components/OpeningSplash';
import { AppearanceApp } from './apps/AppearanceApp';
import { APPEARANCE_THEME_KEY, loadAppearanceTheme } from './appearance/appearanceTheme';
import { applyAppearanceTheme } from './appearance/applyAppearanceTheme';

type AppId =
  | 'ai'
  | 'weibo'
  | 'waimai'
  | 'taobao'
  | 'api-settings'
  | 'appearance'
  | 'voice-tuning'
  | 'notifications'
  | 'account'
  | null;

const STORAGE_KEY = 'mini-ai-phone.api-config';
const STORAGE_KEY_V2 = 'mini-ai-phone.api-config.v2';

// 检查 API 配置是否存在
const hasApiConfig = (): boolean => {
  try {
    // 优先检查 v2（多接口配置）
    const rawV2 = appStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsedV2 = JSON.parse(rawV2) as { default?: { baseUrl?: string; model?: string } };
      const baseUrl = parsedV2?.default?.baseUrl || '';
      const model = parsedV2?.default?.model || '';
      return !!(String(baseUrl).trim() && String(model).trim());
    }

    // 回退检查旧版 v1
    const raw = appStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { baseUrl?: string; apiKey?: string; model?: string };
    return !!(parsed.baseUrl?.trim() && parsed.model?.trim());
  } catch {
    return false;
  }
};

// 应用配置类型
type AppConfig = {
  id: AppId;
  label: string;
  icon: React.ReactNode;
};

// 应用配置列表
const APP_CONFIGS: AppConfig[] = [
  { id: 'ai', label: '微信', icon: <AiPhoneIcon /> },
  { id: 'weibo', label: '微博', icon: <WeiboIcon /> },
  { id: 'waimai', label: '外卖', icon: <TaobaoIcon /> },
  { id: 'taobao', label: '淘宝', icon: <WaimaiIcon /> },
  { id: 'api-settings', label: 'API设置', icon: <ApiSettingsIcon /> },
  { id: 'appearance', label: '外观', icon: <AppearanceIcon /> },
  { id: 'voice-tuning', label: '音色调整', icon: <VoiceTuningIcon /> },
  { id: 'notifications', label: '通知', icon: <NotificationIcon /> },
  { id: 'account', label: '账户', icon: <UserAccountIcon /> },
];

const DESKTOP_ICON_ORDER_KEY = 'mini-ai-phone.desktop-icon-order';

// 加载图标顺序
const loadIconOrder = (): AppId[] => {
  try {
    const saved = appStorage.getItem(DESKTOP_ICON_ORDER_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // 验证所有ID都是有效的
        const validIds = parsed.filter(id => APP_CONFIGS.some(app => app.id === id));
        // 添加缺失的应用
        const missingIds = APP_CONFIGS.filter(app => !validIds.includes(app.id)).map(app => app.id);
        return [...validIds, ...missingIds];
      }
    }
  } catch {
    // ignore
  }
  return APP_CONFIGS.map(app => app.id);
};

// 保存图标顺序
const saveIconOrder = (order: AppId[]) => {
  try {
    appStorage.setItem(DESKTOP_ICON_ORDER_KEY, JSON.stringify(order));
  } catch {
    // ignore
  }
};

export const App: React.FC = () => {
  const [activeApp, setActiveApp] = React.useState<AppId>(null);
  const [pendingPushChatId, setPendingPushChatId] = React.useState<string | null>(null);
  const [showApiConfigModal, setShowApiConfigModal] = React.useState(false);
  const [iconOrder, setIconOrder] = React.useState<AppId[]>(() => loadIconOrder());
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartPos = React.useRef<{ x: number; y: number } | null>(null);
  const longPressTimer = React.useRef<number | null>(null);

  const [showOpeningSplash, setShowOpeningSplash] = React.useState(true);
  const [appearanceRev, setAppearanceRev] = React.useState(0);

  React.useEffect(() => {
    applyAppearanceTheme(loadAppearanceTheme());
    return appStorage.subscribe((key) => {
      if (key === APPEARANCE_THEME_KEY) setAppearanceRev((n) => n + 1);
    });
  }, []);

  const desktopIconMap = React.useMemo(() => loadAppearanceTheme().desktopIcons ?? {}, [appearanceRev]);

  // 激活码绑定：未激活则遮罩显示激活页
  const [activationChecked, setActivationChecked] = React.useState(false);
  const [isActivated, setIsActivated] = React.useState(false);
  const [deviceCode] = React.useState(() => getOrCreateDeviceCode());
  const activationBaseUrl =
    (import.meta as any).env?.VITE_ACTIVATION_SERVER_BASE_URL || 'http://127.0.0.1:8788';

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setActivationChecked(false);
        const resp = await fetch(
          `${activationBaseUrl}/api/activation/status?deviceCode=${encodeURIComponent(deviceCode)}`
        );
        const data = await resp.json().catch(() => ({}));
        if (cancelled) return;
        if (resp.ok && data?.activated) {
          setIsActivated(true);
        } else {
          setIsActivated(false);
        }
      } catch {
        if (!cancelled) {
          setIsActivated(false);
        }
      } finally {
        if (!cancelled) setActivationChecked(true);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [activationBaseUrl, deviceCode]);

  // 桌面唱片：本地播放器（轻量版）
  type LocalTrack = { name: string; url: string };
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [playlist, setPlaylist] = React.useState<LocalTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [musicPanelOpen, setMusicPanelOpen] = React.useState(false);
  const [musicLibraryOpen, setMusicLibraryOpen] = React.useState(false);
  const musicTileRef = React.useRef<HTMLDivElement | null>(null);
  const [musicSheetPos, setMusicSheetPos] = React.useState<{ top: number; left: number } | null>(null);
  
  // 检查 API 配置，如果未配置则显示弹窗
  React.useEffect(() => {
    if (!hasApiConfig()) {
      setShowApiConfigModal(true);
    }
  }, []);

  React.useEffect(() => {
    const openFromParams = () => {
      try {
        const url = new URL(window.location.href);
        const openApp = (url.searchParams.get('openApp') || '').trim();
        const pushChatId = (url.searchParams.get('pushChatId') || '').trim();
        if (openApp === 'ai') {
          setActiveApp('ai');
          if (pushChatId) setPendingPushChatId(pushChatId);
        }
      } catch {
        // ignore
      }
    };
    openFromParams();
  }, []);

  React.useEffect(() => {
    const clearSystemNotificationsAndBadge = async () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const notifications = reg ? await reg.getNotifications() : [];
        notifications.forEach((n) => n.close());
      } catch {
        // ignore
      }
      try {
        const navAny = navigator as Navigator & {
          clearAppBadge?: () => Promise<void>;
        };
        if (typeof navAny.clearAppBadge === 'function') {
          await navAny.clearAppBadge();
        }
      } catch {
        // ignore
      }
    };

    const onSwMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; chatId?: string } | undefined;
      if (!data || data.type !== 'lumi:open-chat-from-push') return;
      setActiveApp('ai');
      setPendingPushChatId(typeof data.chatId === 'string' ? data.chatId : null);
      void clearSystemNotificationsAndBadge();
    };

    const onVisibilityOrFocus = () => {
      void clearSystemNotificationsAndBadge();
    };

    navigator.serviceWorker?.addEventListener('message', onSwMessage as EventListener);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);
    void clearSystemNotificationsAndBadge();
    return () => {
      navigator.serviceWorker?.removeEventListener('message', onSwMessage as EventListener);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
    };
  }, []);

  // 监听 localStorage 变化，当配置保存后检查是否可以关闭弹窗
  React.useEffect(() => {
    const handleStorageChange = () => {
      if (hasApiConfig() && showApiConfigModal) {
        setShowApiConfigModal(false);
      }
    };

    // 监听 storage 事件（跨标签页）
    window.addEventListener('storage', handleStorageChange);
    
    // 定期检查配置（因为同标签页的 localStorage 变化不会触发 storage 事件）
    const interval = setInterval(() => {
      if (hasApiConfig() && showApiConfigModal) {
        setShowApiConfigModal(false);
      }
    }, 300);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [showApiConfigModal]);

  // 当弹窗显示时，如果用户点击了保存，检查配置并关闭弹窗
  const checkAndCloseModal = React.useCallback(() => {
    if (hasApiConfig() && showApiConfigModal) {
      setShowApiConfigModal(false);
    }
  }, [showApiConfigModal]);

  const now = React.useMemo(() => {
    const d = new Date();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const date = d.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
    return { time, date };
  }, []);

  // 加载角色数据用于留言板
  const roleMessage = React.useMemo(() => {
    try {
      const STORAGE_KEY = 'mini-ai-phone.story-roles';
      const raw = appStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const roles = JSON.parse(raw);
      if (!Array.isArray(roles) || roles.length === 0) return null;
      
      // 随机选择一个角色
      const randomRole = roles[Math.floor(Math.random() * roles.length)];
      
      // 生成一个简单的留言（可以根据需要自定义）
      const messages = [
        '今天天气真好呢～',
        '想和你聊聊天',
        '有空一起出去玩吧',
        '记得照顾好自己',
        '今天过得怎么样？',
        '想你了',
        '有什么有趣的事吗？',
        '一起做点什么吧'
      ];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      return {
        roleName: randomRole.name || '朋友',
        message: randomMessage,
        avatarUrl: randomRole.avatarUrl || null
      };
    } catch {
      return null;
    }
  }, []);

  const handleOpen = (id: AppId) => {
    if (id) {
      // 打开应用前重置拖动状态
      if (isDragging) {
        setIsDragging(false);
        setDraggedIndex(null);
        setDragOverIndex(null);
        handleLongPressCancel();
      }
      setActiveApp(id);
    }
  };

  const handleBackToDesktop = () => {
    setActiveApp(null);
  };

  const currentTrack = playlist[currentTrackIndex] ?? null;

  const ensureAudio = () => {
    if (!audioRef.current) audioRef.current = new Audio();
    return audioRef.current;
  };

  const openExternalMusic = (platform: 'qq' | 'netease' | 'kugou' | 'kuwo') => {
    const map: Record<typeof platform, string> = {
      qq: 'https://y.qq.com/',
      netease: 'https://music.163.com/',
      kugou: 'https://www.kugou.com/',
      kuwo: 'https://www.kuwo.cn/'
    };
    window.open(map[platform], '_blank', 'noopener,noreferrer');
  };

  const handlePickLocalMusic = () => fileInputRef.current?.click();

  const handleLocalFilesSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const supportedExt = new Set(['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac']);
    const isSupported = (f: File) => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      // 某些浏览器/环境可能拿不到正确的 MIME（例如空字符串），因此用扩展名兜底
      const mimeOk = typeof f.type === 'string' && (f.type === '' || f.type.startsWith('audio/'));
      const extOk = supportedExt.has(ext);
      return mimeOk && extOk;
    };
    const supportedFiles = files.filter(isSupported);
    if (!supportedFiles.length) {
      window.alert('未检测到可导入的音频文件（支持 mp3 / wav / m4a / aac / ogg / flac）');
      e.target.value = '';
      return;
    }
    const newTracks: LocalTrack[] = supportedFiles.map((f) => ({
      name: f.name.replace(/\.[^/.]+$/, ''),
      url: URL.createObjectURL(f)
    }));
    setPlaylist((prev) => {
      const next = [...prev, ...newTracks];
      if (prev.length === 0) setCurrentTrackIndex(0);
      return next;
    });
    e.target.value = '';
  };

  const playCurrent = React.useCallback(() => {
    const track = currentTrack;
    if (!track) return;
    const audio = ensureAudio();
    if (audio.src !== track.url) audio.src = track.url;
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [currentTrack]);

  const pause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
  };

  const togglePlay = () => (isPlaying ? pause() : playCurrent());

  const prevTrack = () => {
    if (!playlist.length) return;
    setCurrentTrackIndex((i) => (i - 1 + playlist.length) % playlist.length);
  };

  const nextTrack = React.useCallback(() => {
    if (!playlist.length) return;
    setCurrentTrackIndex((i) => (i + 1) % playlist.length);
  }, [playlist.length]);

  // 切歌时：若在播放则续播，否则预加载
  React.useEffect(() => {
    if (!playlist.length) return;
    if (isPlaying) {
      playCurrent();
    } else if (currentTrack) {
      const audio = ensureAudio();
      if (audio.src !== currentTrack.url) audio.src = currentTrack.url;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackIndex]);

  // audio 事件
  React.useEffect(() => {
    const audio = ensureAudio();
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnded = () => nextTrack();
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnded);
    };
  }, [nextTrack]);

  const seekToPct = (pct: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = Math.max(0, Math.min(duration, duration * pct));
  };

  const computeMusicSheetPos = React.useCallback(() => {
    const el = musicTileRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const sheetW = 230; // 与 CSS 宽度一致
    const gap = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 优先放在唱片卡片左侧；如果不够则放右侧
    let left = rect.left - sheetW - gap;
    if (left < 8) left = rect.right + gap;

    // 垂直对齐到卡片顶部，做边界夹取
    let top = rect.top;
    top = Math.max(8, Math.min(top, vh - 8 - 220)); // 220 约等于面板高度，避免出界

    // 水平边界夹取
    left = Math.max(8, Math.min(left, vw - 8 - sheetW));

    return { top, left };
  }, []);

  React.useEffect(() => {
    if (!musicPanelOpen) return;
    const next = computeMusicSheetPos();
    if (next) setMusicSheetPos(next);
    const onResize = () => {
      const p = computeMusicSheetPos();
      if (p) setMusicSheetPos(p);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [musicPanelOpen, computeMusicSheetPos]);

  // 根据顺序获取应用配置
  const orderedApps = React.useMemo(() => {
    return iconOrder.map(id => APP_CONFIGS.find(app => app.id === id)!).filter(Boolean);
  }, [iconOrder]);

  // 处理长按开始拖动
  const handleLongPressStart = (index: number, e: React.MouseEvent | React.TouchEvent) => {
    // 如果应用已打开，不允许拖动
    if (activeApp) {
      return;
    }
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    longPressTimer.current = window.setTimeout(() => {
      setIsDragging(true);
      setDraggedIndex(index);
      dragStartPos.current = { x: clientX, y: clientY };
      // 添加触觉反馈（如果支持）
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }, 500); // 500ms长按
  };

  // 取消长按
  const handleLongPressCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // 处理拖动结束
  const handleDragEnd = React.useCallback(() => {
    handleLongPressCancel();
    
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newOrder = [...iconOrder];
      const [removed] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(dragOverIndex, 0, removed);
      setIconOrder(newOrder);
      saveIconOrder(newOrder);
    }
    
    // 延迟重置状态，让动画完成
    setTimeout(() => {
      setIsDragging(false);
      setDraggedIndex(null);
      setDragOverIndex(null);
      dragStartPos.current = null;
    }, 100);
  }, [draggedIndex, dragOverIndex, iconOrder]);

  // 全局鼠标/触摸事件监听（用于拖动时跟随）
  React.useEffect(() => {
    if (!isDragging || activeApp) return; // 如果应用已打开，停止拖动

    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDragging || draggedIndex === null || activeApp) {
        // 如果应用打开了，立即结束拖动
        if (activeApp) {
          handleDragEnd();
        }
        return;
      }
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      // 用“指针下方的图标元素”来判断落点，避免 2x2 占位导致的网格计算误差
      const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      const iconEl = el?.closest?.('.app-icon-wrapper') as HTMLElement | null;
      if (!iconEl) return;
      const idxStr = iconEl.getAttribute('data-icon-index');
      const idx = idxStr ? Number(idxStr) : NaN;
      if (!Number.isFinite(idx)) return;
      if (idx !== draggedIndex) {
        setDragOverIndex(idx);
      }
    };

    const handleGlobalEnd = () => {
      handleDragEnd();
    };

    window.addEventListener('mousemove', handleGlobalMove, { passive: false });
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchend', handleGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDragging, draggedIndex, orderedApps.length, handleDragEnd, activeApp]);

  // 处理点击（如果不在拖动状态）
  const handleIconClick = (id: AppId, e: React.MouseEvent) => {
    if (!isDragging) {
      handleOpen(id);
    } else {
      e.preventDefault();
      handleDragEnd();
    }
  };

  return (
    <>
      {showOpeningSplash && <OpeningSplash onFinish={() => setShowOpeningSplash(false)} />}
      <div className="phone-shell">
        <div className="phone-inner">
        {activationChecked && !isActivated && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.28)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              zIndex: 5000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <ActivationApp
              onActivated={() => {
                setIsActivated(true);
              }}
            />
          </div>
        )}
        {/* API 配置弹窗 */}
        {showApiConfigModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '20px'
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '360px',
                maxHeight: '80vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '20px 18px 16px',
                  borderBottom: '1px solid #e5e7eb',
                  flexShrink: 0
                }}
              >
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '6px',
                    textAlign: 'center'
                  }}
                >
                  欢迎使用 Lumi Phone
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#4b5563',
                    lineHeight: 1.6,
                    textAlign: 'center'
                  }}
                >
                  请先配置 API 接口，以便使用 AI 功能
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 18px'
                }}
              >
                <ApiSettingsApp onConfigSaved={checkAndCloseModal} />
              </div>
            </div>
          </div>
        )}

        <div className="desktop">
          <div className="desktop-top">
            <div className="desktop-time-container">
              <div className="desktop-time">{now.time}</div>
              <div className="desktop-date">{now.date}</div>
            </div>
            
            {roleMessage && (
              <div className="desktop-message-board">
                <div className="desktop-message-avatar">
                  {roleMessage.avatarUrl ? (
                    <img src={roleMessage.avatarUrl} alt={roleMessage.roleName} />
                  ) : (
                    <span>{roleMessage.roleName.charAt(0)}</span>
                  )}
                </div>
                <div className="desktop-message-content">
                  <div className="desktop-message-name">{roleMessage.roleName}</div>
                  <div className="desktop-message-text">{roleMessage.message}</div>
                </div>
              </div>
            )}
          </div>

          <div className="desktop-grid">
            {/* 右上角：2×2 圆形唱片播放器（占位让图标绕开） */}
            <div className="desktop-music-tile" ref={musicTileRef}>
              <div
                className="desktop-music-disc"
                role="button"
                tabIndex={0}
                onClick={() => {
                  setMusicPanelOpen((v) => {
                    const nextOpen = !v;
                    if (nextOpen) {
                      const p = computeMusicSheetPos();
                      if (p) setMusicSheetPos(p);
                    }
                    return nextOpen;
                  });
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                aria-label="打开音乐面板"
              />
              <div className="desktop-music-gloss" />
              <div className="desktop-music-needle" />

              {/* 桌面卡片进度条：位于 ⏮ ▶ ⏭ 三按钮正上方 */}
              <div
                className="desktop-music-progress"
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  seekToPct(pct);
                }}
                role="button"
                tabIndex={0}
              >
                <div
                  className="desktop-music-progress-fill"
                  style={{ width: duration > 0 ? `${Math.min(100, Math.max(0, (currentTime / duration) * 100))}%` : '0%' }}
                />
              </div>

              <div className="desktop-music-controls">
                <button type="button" className="desktop-music-btn" onClick={prevTrack} aria-label="上一首">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 5v14" />
                    <path d="M18 6l-8 6 8 6" />
                  </svg>
                </button>
                <button type="button" className="desktop-music-btn desktop-music-btn-play" onClick={togglePlay} aria-label="播放/暂停">
                  {isPlaying ? '❚❚' : '▶'}
                </button>
                <button type="button" className="desktop-music-btn" onClick={nextTrack} aria-label="下一首">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 5v14" />
                    <path d="M6 6l8 6-8 6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 左下角：2×2 图片装饰（占位让图标绕开） */}
            <div className="desktop-decoration-tile" aria-hidden="true" />

            {orderedApps.map((app, index) => {
              // 计算实际显示位置（考虑拖动时的位置交换）
              let displayIndex = index;
              if (isDragging && draggedIndex !== null && dragOverIndex !== null) {
                if (index === draggedIndex) {
                  displayIndex = dragOverIndex;
                } else if (draggedIndex < index && index <= dragOverIndex) {
                  displayIndex = index - 1;
                } else if (dragOverIndex <= index && index < draggedIndex) {
                  displayIndex = index + 1;
                }
              }

              return (
                <button
                  key={app.id}
                  type="button"
                  data-icon-index={index}
                  className={`app-icon-wrapper ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                  onClick={(e) => handleIconClick(app.id, e)}
                  onMouseDown={(e) => handleLongPressStart(index, e)}
                  onMouseUp={handleLongPressCancel}
                  onMouseLeave={handleLongPressCancel}
                  onTouchStart={(e) => handleLongPressStart(index, e)}
                  onTouchEnd={handleLongPressCancel}
                  onTouchCancel={handleLongPressCancel}
                  style={{
                    opacity: draggedIndex === index && isDragging ? 0.3 : 1,
                    transform: draggedIndex === index && isDragging ? 'scale(1.15)' : 'scale(1)',
                    transition: draggedIndex === index && isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
                    zIndex: draggedIndex === index && isDragging ? 1000 : 1,
                    gridArea: `auto / auto / auto / auto`,
                    order: displayIndex,
                    pointerEvents: draggedIndex === index && isDragging ? 'none' : 'auto',
                  }}
                >
                  <div className="app-icon">
                    {desktopIconMap[app.id as string] ? (
                      <img className="app-icon-custom" src={desktopIconMap[app.id as string]} alt="" />
                    ) : (
                      app.icon
                    )}
                  </div>
                  <span className="app-label">{app.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 本地音乐文件选择器（隐藏） */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
          multiple
          style={{ display: 'none' }}
          onChange={handleLocalFilesSelected}
        />

        {/* 已导入歌曲列表 */}
        {musicLibraryOpen && (
          <div className="desktop-music-library-mask" onClick={() => setMusicLibraryOpen(false)}>
            <div className="desktop-music-library" onClick={(e) => e.stopPropagation()}>
              <div className="desktop-music-library-header">
                <div className="desktop-music-library-title">已导入歌曲</div>
                <button type="button" className="desktop-music-library-close" onClick={() => setMusicLibraryOpen(false)}>
                  ×
                </button>
              </div>
              <div className="desktop-music-library-list">
                {playlist.length === 0 ? (
                  <div className="desktop-music-library-empty">还没有导入音乐文件</div>
                ) : (
                  playlist.map((t, idx) => (
                    <button
                      key={`${t.url}-${idx}`}
                      type="button"
                      className={`desktop-music-library-item ${idx === currentTrackIndex ? 'is-active' : ''}`}
                      onClick={() => {
                        setCurrentTrackIndex(idx);
                        setMusicLibraryOpen(false);
                        setMusicPanelOpen(true);
                        if (isPlaying) playCurrent();
                      }}
                    >
                      <span className="desktop-music-library-item-name">{t.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 点击唱片后展开的悬浮“拉取面板” */}
        {musicPanelOpen && (
          <div className="desktop-music-sheet-mask" onClick={() => setMusicPanelOpen(false)}>
            <div
              className="desktop-music-sheet"
              style={musicSheetPos ? { top: musicSheetPos.top, left: musicSheetPos.left } : undefined}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="desktop-music-sheet-title">音乐</div>
              <div className="desktop-music-sheet-subtitle">
                {currentTrack ? currentTrack.name : '未选择本地歌曲'}
              </div>

              <div className="desktop-music-sheet-actions">
                <button type="button" className="desktop-music-action-btn" onClick={handlePickLocalMusic}>
                  选择本地
                </button>
                <button
                  type="button"
                  className="desktop-music-action-btn desktop-music-action-secondary"
                  onClick={() => setMusicLibraryOpen(true)}
                >
                  已导入（{playlist.length}）
                </button>
              </div>

              <div className="desktop-music-sheet-external">
                <button type="button" className="desktop-music-ext-btn desktop-music-ext-wide" onClick={() => openExternalMusic('qq')}>QQ音乐</button>
                <button type="button" className="desktop-music-ext-btn desktop-music-ext-wide" onClick={() => openExternalMusic('netease')}>网易云</button>
                <button type="button" className="desktop-music-ext-btn desktop-music-ext-wide" onClick={() => openExternalMusic('kugou')}>酷狗</button>
                <button type="button" className="desktop-music-ext-btn desktop-music-ext-wide" onClick={() => openExternalMusic('kuwo')}>酷我</button>
              </div>
            </div>
          </div>
        )}

        {activeApp &&
          (activeApp === 'ai' ? (
            <div className="app-window app-window-full">
              <WeChatApp
                onExit={handleBackToDesktop}
                onOpenApiSettings={() => handleOpen('api-settings')}
                pendingPushChatId={pendingPushChatId}
                onConsumedPushChatId={() => setPendingPushChatId(null)}
              />
            </div>
          ) : activeApp === 'weibo' ? (
            <div className="app-window app-window-full">
              <WeiboApp onExit={handleBackToDesktop} />
            </div>
          ) : activeApp === 'waimai' ? (
            <div className="app-window app-window-full">
              <WaimaiApp onExit={handleBackToDesktop} />
            </div>
          ) : activeApp === 'account' ? (
            <div className="app-window app-window-full app-window-solid app-window-wechat-home-top">
              <AccountApp onExit={handleBackToDesktop} />
            </div>
          ) : (
            <div
              className={`app-window app-window-wechat-home-top ${
                activeApp === 'voice-tuning' ||
                activeApp === 'notifications' ||
                activeApp === 'api-settings' ||
                activeApp === 'appearance'
                  ? 'app-window-solid'
                  : ''
              }`}
            >
              <div
                className="wechat-header"
                style={{
                  position: 'relative',
                  background: 'var(--appearance-launcher-header-bg, #ffffff)'
                }}
              >
                <button
                  type="button"
                  className="wechat-header-back"
                  onClick={handleBackToDesktop}
                  aria-label="返回桌面"
                />
                <span className="wechat-header-label">
                  {activeApp === 'taobao' && '淘宝'}
                  {activeApp === 'api-settings' && 'API 设置'}
                  {activeApp === 'appearance' && '外观设置'}
                  {activeApp === 'voice-tuning' && '音色调整'}
                  {activeApp === 'notifications' && '通知中心'}
                </span>
                <div className="wechat-header-right">
                  {activeApp !== 'api-settings' && activeApp !== 'voice-tuning' && (
                    <button type="button" className="wechat-header-plus" onClick={handleBackToDesktop}>
                      返回桌面
                    </button>
                  )}
                </div>
              </div>
              <div className="app-launcher-subtitle-wrap">
                <div className="app-subtitle">
                  {activeApp === 'api-settings'
                    ? '管理 AI 接口地址、Key 与模型，用于全局生文功能'
                    : activeApp === 'voice-tuning'
                      ? '为角色设计和管理自定义 AI 音色，仅保存在本设备'
                      : activeApp === 'notifications'
                        ? '配置 PWA + Web Push，把角色消息变成系统通知'
                        : activeApp === 'appearance'
                          ? '主题色、壁纸、桌面图标与自定义 CSS，仅保存在本设备'
                          : '即将接入的功能区域'}
                </div>
              </div>

              {activeApp === 'api-settings' ? (
                <ApiSettingsApp />
              ) : activeApp === 'voice-tuning' ? (
                <VoiceTuningApp />
              ) : activeApp === 'notifications' ? (
                <NotificationApp />
              ) : activeApp === 'appearance' ? (
                <AppearanceApp />
              ) : (
                <div className="app-content-placeholder">
                  {activeApp === 'taobao' && '这里将是 商品搜索和详情'}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
    </>
  );
};


