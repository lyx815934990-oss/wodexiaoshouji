import React from 'react';
import { ensureSilentKeepAlive, stopSilentKeepAlive } from '../silentKeepAlive';
import { appStorage } from '../storage/appStorage';
import {
  getPushSubscription,
  getVapidPublicKey,
  isIosDevice,
  isPushEnvironmentOk,
  isSecureContextForWebPush,
  isStandalonePwa,
  isWebPushSupported,
  registerPushServiceWorker,
  registerPushServiceWorkerDetailed,
  subscribeWebPush,
} from '../webPushClient';
import { getOrCreateDeviceCode } from '../storage/deviceCode';

const STORAGE_KEY_KEEPALIVE = 'mini-ai-phone.notification-silent-keepalive';

function loadKeepAliveEnabled(): boolean {
  try {
    const raw = appStorage.getItem(STORAGE_KEY_KEEPALIVE);
    if (raw === '0') return false;
    return true;
  } catch {
    return true;
  }
}

function saveKeepAliveEnabled(on: boolean) {
  try {
    appStorage.setItem(STORAGE_KEY_KEEPALIVE, on ? '1' : '0');
  } catch {
    // ignore
  }
}

export const NotificationApp: React.FC = () => {
  const [keepAliveOn, setKeepAliveOn] = React.useState(() => loadKeepAliveEnabled());
  const [notifHint, setNotifHint] = React.useState<string | null>(null);
  const [envPanelOpen, setEnvPanelOpen] = React.useState(false);

  const [swReg, setSwReg] = React.useState<ServiceWorkerRegistration | null>(null);
  const [subscriptionJson, setSubscriptionJson] = React.useState<string | null>(null);
  const [pushBusy, setPushBusy] = React.useState(false);
  const [pushHint, setPushHint] = React.useState<string | null>(null);
  const [serverBusy, setServerBusy] = React.useState(false);
  const [swRegisterError, setSwRegisterError] = React.useState<string | null>(null);

  const vapidConfigured = Boolean(getVapidPublicKey());
  const pushSupported = isWebPushSupported();
  const envOk = isPushEnvironmentOk();
  const browserSecureForPush = isSecureContextForWebPush();
  /** 之前按钮在任一不满足时 disabled，用户会看到「根本点不了」；改为可点并在下方说明原因 */
  const subscribeEnvHints = React.useMemo(() => {
    const lines: string[] = [];
    if (!vapidConfigured) {
      lines.push('未读取到 VITE_VAPID_PUBLIC_KEY：在项目根目录 .env 配置后必须重启开发服务器。');
    }
    if (!browserSecureForPush) {
      lines.push(
        '【关键】Web Push 需要浏览器「安全上下文」：页面必须是 HTTPS，或 localhost / 127.0.0.1。你现在是 http://192.168.x.x，在 iOS Safari 上通常 isSecureContext=false，系统不会提供 PushManager（即使已是 PWA）。请改用 HTTPS 访问前端（例如 mkcert、Vite https、ngrok/Cloudflare Tunnel 的 https 域名），或先在电脑用 localhost 调试。'
      );
    }
    if (!pushSupported) {
      if (typeof window !== 'undefined' && isIosDevice() && !isStandalonePwa()) {
        lines.push(
          '【iOS】在 Safari 地址栏里打开时通常没有 Web Push。请：分享 →「添加到主屏幕」→ 从桌面图标打开。'
        );
        lines.push('系统需 iOS 16.4 及以上；若已 PWA 仍无 Push，请确认上面「HTTPS」一条。');
      } else if (browserSecureForPush) {
        lines.push(
          '当前环境无 Web Push（缺少 PushManager）。iPhone：需 iOS 16.4+，Safari 添加到主屏幕后从图标进入；不要用微信/QQ 内置浏览器。'
        );
      }
    }
    if (!envOk) {
      lines.push('当前页面访问方式不符合本页「本地调试」检测：请用 HTTPS，或 localhost / 电脑局域网 IP 访问。');
    }
    return lines;
  }, [vapidConfigured, pushSupported, envOk, browserSecureForPush]);
  /** 默认与页面同域（Vite dev 下 /api/push 会代理到 push-server，避免 HTTPS 页面请求 http:8787 被拦截） */
  const pushServerBase = React.useMemo(() => {
    const fromEnv = (import.meta.env.VITE_PUSH_SERVER_URL || '').trim();
    if (fromEnv) return fromEnv.replace(/\/+$/, '');
    if (typeof window === 'undefined') return '';
    return window.location.origin;
  }, []);

  const postPushServer = React.useCallback(
    async (path: string, payload: unknown) => {
      if (!pushServerBase) throw new Error('推送服务地址为空，请配置 VITE_PUSH_SERVER_URL。');
      const res = await fetch(`${pushServerBase}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload ?? {}),
      });
      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        const msg =
          data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
            ? data.error
            : `请求失败（${res.status}）`;
        throw new Error(msg);
      }
      return data as { ok?: boolean; [k: string]: unknown };
    },
    [pushServerBase]
  );

  const refreshPushState = React.useCallback(async () => {
    const { registration, error } = await registerPushServiceWorkerDetailed();
    setSwReg(registration);
    setSwRegisterError(error);
    if (!registration) {
      setSubscriptionJson(null);
      return;
    }
    const sub = await getPushSubscription(registration);
    setSubscriptionJson(sub ? JSON.stringify(sub.toJSON(), null, 2) : null);
  }, []);

  React.useEffect(() => {
    if (keepAliveOn) ensureSilentKeepAlive();
    else stopSilentKeepAlive();
  }, [keepAliveOn]);

  React.useEffect(() => {
    void refreshPushState();
  }, [refreshPushState]);

  const toggleKeepAlive = () => {
    const next = !keepAliveOn;
    setKeepAliveOn(next);
    saveKeepAliveEnabled(next);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setNotifHint('当前环境不支持系统通知 API。');
      return;
    }
    try {
      const p = await Notification.requestPermission();
      if (p === 'granted') setNotifHint('已允许浏览器通知权限。');
      else setNotifHint('未授予通知权限。');
    } catch {
      setNotifHint('申请通知权限失败。');
    }
  };

  const handleSubscribeWebPush = async () => {
    setPushHint(null);
    const pub = getVapidPublicKey();
    if (!pub) {
      setPushHint('未读取到 VITE_VAPID_PUBLIC_KEY：请确认项目根目录 .env 已配置并重启开发服务器或重新构建。');
      return;
    }
    if (!pushSupported) {
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        setPushHint(
          '当前不是浏览器安全上下文（页面为 http://局域网 IP）。iOS 不会提供 Web Push。请用 HTTPS 或 localhost 打开前端后再订阅。'
        );
        return;
      }
      setPushHint('当前浏览器不支持 Web Push（需 Service Worker + PushManager）。');
      return;
    }
    if (!envOk) {
      setPushHint('当前页面非安全上下文，请使用 HTTPS 或 localhost 访问。');
      return;
    }
    setPushBusy(true);
    try {
      if (!('Notification' in window) || Notification.permission === 'denied') {
        setPushHint('通知权限被拒绝，请在系统设置中允许本站通知后重试。');
        return;
      }
      if (Notification.permission === 'default') {
        const p = await Notification.requestPermission();
        if (p !== 'granted') {
          setPushHint('需要通知权限才能完成 Web Push 订阅。');
          return;
        }
      }

      const reg = swReg ?? (await registerPushServiceWorker());
      if (!reg) {
        setPushHint('Service Worker 注册失败，请检查是否已部署 /sw.js 或使用 HTTPS。');
        return;
      }
      setSwReg(reg);
      const sub = await subscribeWebPush(reg, pub);
      await refreshPushState();
      try {
        const deviceCode = getOrCreateDeviceCode();
        await postPushServer('/api/push/subscribe', {
          userId: deviceCode,
          platform: navigator.userAgent,
          subscription: sub.toJSON(),
        });
        setPushHint('订阅成功并已上报到推送服务。');
      } catch (uploadErr) {
        const msg = uploadErr instanceof Error ? uploadErr.message : '未知错误';
        setPushHint(`订阅成功，但上报推送服务失败：${msg}`);
      }
    } catch (e) {
      setPushHint(e instanceof Error ? e.message : '订阅失败。');
    } finally {
      setPushBusy(false);
    }
  };

  const handleSendTestPush = async () => {
    setPushHint(null);
    const reg = swReg ?? (await registerPushServiceWorker());
    if (!reg) {
      setPushHint('Service Worker 未就绪。');
      return;
    }
    const sub = await getPushSubscription(reg);
    if (!sub?.endpoint) {
      setPushHint('未找到当前设备订阅 endpoint，请先完成订阅。');
      return;
    }
    setServerBusy(true);
    try {
      const resp = await postPushServer('/api/push/send-test', {
        endpoint: sub.endpoint,
        remark: '测试备注',
        nickname: '测试昵称',
        messageContent: '这是一条测试消息',
        tag: 'lumi-local-test',
      });
      const success = typeof resp.success === 'number' ? resp.success : '未知';
      setPushHint(`测试推送请求已发送，成功数：${success}。`);
    } catch (e) {
      setPushHint(e instanceof Error ? e.message : '测试推送失败。');
    } finally {
      setServerBusy(false);
    }
  };

  return (
    <div
      className="api-settings"
      style={{
        maxWidth: 560,
        margin: '0 auto',
      }}
    >
      <div
        className="api-section"
        style={{
          borderRadius: 24,
          padding: 18,
          background: 'linear-gradient(180deg, #ffffff 0%, #f7f7f9 100%)',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>
          桌面通知
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.65 }}>
          仅保留核心操作：通知权限、后台保活。附加提供订阅推送和环境检测面板。
        </div>
        <div
          style={{
            marginTop: 16,
            borderRadius: 18,
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.08)',
            background: '#fff',
          }}
        >
          <div
            style={{
              padding: '14px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>获取通知权限</div>
            <button
              type="button"
              className="api-btn primary"
              onClick={requestNotificationPermission}
              style={{ borderRadius: 999, padding: '8px 14px' }}
            >
              一键获取
            </button>
          </div>
          <div
            style={{
              padding: '14px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>后台保活</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                尽量维持后台活跃（受系统限制）
              </div>
            </div>
            <button
              type="button"
              onClick={toggleKeepAlive}
              aria-label="后台保活开关"
              style={{
                position: 'relative',
                width: 58,
                height: 34,
                border: 'none',
                outline: 'none',
                borderRadius: 999,
                cursor: 'pointer',
                background: keepAliveOn ? '#111111' : '#f1f1f1',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)',
                transition: 'all .2s ease',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  left: keepAliveOn ? 27 : 3,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: keepAliveOn ? '#ffffff' : '#111111',
                  transition: 'all .2s ease',
                }}
              />
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
          <button
            type="button"
            className="api-btn"
            disabled={pushBusy}
            onClick={() => void handleSubscribeWebPush()}
            style={{ borderRadius: 14, padding: '10px 12px' }}
          >
            {pushBusy ? '订阅中…' : '订阅推送'}
          </button>
          <button
            type="button"
            className="api-btn"
            onClick={() => setEnvPanelOpen(true)}
            style={{ borderRadius: 14, padding: '10px 12px' }}
          >
            环境检测
          </button>
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 10, lineHeight: 1.6 }}>
          推送服务地址：<code>{pushServerBase || '未配置'}</code>
        </div>
      </div>

      {(notifHint || pushHint) && (
        <div className="api-section" style={{ marginTop: 12 }}>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid rgba(229, 231, 235, 0.9)',
              color: '#111827',
              fontSize: '13px',
              lineHeight: 1.6,
            }}
          >
            {notifHint || pushHint}
          </div>
        </div>
      )}

      {envPanelOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setEnvPanelOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 560,
              maxHeight: '85vh',
              overflow: 'auto',
              borderRadius: 22,
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 16px 30px rgba(0,0,0,0.2)',
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>环境检测</div>
              <button
                type="button"
                className="api-btn"
                onClick={() => setEnvPanelOpen(false)}
                style={{ borderRadius: 999, padding: '6px 12px' }}
              >
                关闭
              </button>
            </div>

            <div
              style={{
                marginTop: 12,
                borderRadius: 12,
                background: '#f8fafc',
                border: '1px solid rgba(148,163,184,.25)',
                padding: '10px 12px',
                fontSize: 12,
                lineHeight: 1.7,
                color: '#334155',
              }}
            >
              VAPID 公钥：{vapidConfigured ? '已配置' : '未配置'} · API：{pushSupported ? '支持' : '不支持'} ·
              推送安全上下文：{browserSecureForPush ? '是' : '否'} · 本地调试：{envOk ? '是' : '否'} · SW：
              {swReg ? '已注册' : '未就绪'}
              {isIosDevice() ? ` · 主屏幕：${isStandalonePwa() ? '已从图标打开' : '未从图标打开'}` : ''}
            </div>

            {swRegisterError && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: 'rgba(254, 226, 226, 0.7)',
                  border: '1px solid rgba(248, 113, 113, 0.7)',
                  fontSize: '11px',
                  color: '#991b1b',
                  lineHeight: 1.5,
                }}
              >
                Service Worker 注册失败：{swRegisterError}
              </div>
            )}

            {subscribeEnvHints.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: 'rgba(254, 243, 199, 0.6)',
                  border: '1px solid rgba(252, 211, 77, 0.8)',
                  fontSize: '11px',
                  color: '#92400e',
                  lineHeight: 1.55,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>请先处理：</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {subscribeEnvHints.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="api-btn" disabled={pushBusy} onClick={() => void refreshPushState()}>
                刷新状态
              </button>
              <button
                type="button"
                className="api-btn primary"
                disabled={serverBusy || pushBusy || !subscriptionJson}
                onClick={() => void handleSendTestPush()}
              >
                {serverBusy ? '处理中…' : '发送测试推送'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
