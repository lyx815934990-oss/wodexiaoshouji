import React from 'react';
import { getOrCreateDeviceCode } from '../storage/deviceCode';

type ActivationAppProps = {
  // 激活成功后回调：code 为服务器返回的激活码
  onActivated: (code: string | null) => void;
};

function getActivationBaseUrl(): string {
  // 建议你在 Lumi机 的运行环境里配置：VITE_ACTIVATION_SERVER_BASE_URL
  // 例如：https://你的域名:8788（而不是 127.0.0.1）
  // 如果你用 Vite dev server 的反向代理，这里默认不需要拼接 baseUrl
  const envBase = (import.meta as any).env?.VITE_ACTIVATION_SERVER_BASE_URL;
  if (typeof envBase === 'string' && envBase.trim()) return envBase.trim();
  return '';
}

const GROUP_QQ = '1084498477';

export const ActivationApp: React.FC<ActivationAppProps> = ({ onActivated }) => {
  const [deviceCode] = React.useState(() => getOrCreateDeviceCode());
  const [checking, setChecking] = React.useState(true);
  const [status, setStatus] = React.useState<'unactivated' | 'activated' | 'error'>('unactivated');
  const [statusMsg, setStatusMsg] = React.useState<string>('正在检测激活状态...');

  const [step, setStep] = React.useState<'welcome' | 'login' | 'activate'>('welcome');
  const [welcomeChecked, setWelcomeChecked] = React.useState(false);

  const [deviceSlotsUsed, setDeviceSlotsUsed] = React.useState(0);
  const [maxDeviceSlots, setMaxDeviceSlots] = React.useState(2);

  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [hint, setHint] = React.useState<string | null>(null);
  const [needLogin, setNeedLogin] = React.useState(false);
  const [loginBusy, setLoginBusy] = React.useState(false);
  const [loginHint, setLoginHint] = React.useState<string | null>(null);
  const [loginUsername, setLoginUsername] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');

  const apiBase = getActivationBaseUrl();
  const apiUrl = (p: string) => (apiBase ? `${apiBase}${p}` : p);

  /** 与激活接口同源的网页用户中心（领取激活码、查看账号） */
  const playerPortalHomeUrl = React.useMemo(() => {
    if (!apiBase) return '';
    return `${apiBase.replace(/\/$/, '')}/player-home.html`;
  }, [apiBase]);

  const refreshUserMe = React.useCallback(async () => {
    try {
      const resp = await fetch(apiUrl('/api/user/me'), { credentials: 'include' });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data?.authenticated) {
        setNeedLogin(false);
        setLoginHint(`已登录账号：${data.username}（QQ：${data.qq}）`);
        const dc = Array.isArray(data.deviceCodes) ? data.deviceCodes : [];
        setDeviceSlotsUsed(dc.length);
        if (typeof data.maxDeviceCodeSlots === 'number') setMaxDeviceSlots(data.maxDeviceCodeSlots);
        return true;
      }
      setNeedLogin(true);
      setDeviceSlotsUsed(0);
      return false;
    } catch {
      setNeedLogin(true);
      return false;
    }
  }, [apiBase]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setChecking(true);
        setHint(null);
        const url = apiUrl(`/api/activation/status?deviceCode=${encodeURIComponent(deviceCode)}`);
        const resp = await fetch(url);
        const data = await resp.json().catch(() => ({}));
        if (cancelled) return;
        if (!resp.ok) throw new Error(data?.error || '检测激活状态失败');
        if (data?.activated) {
          setStatus('activated');
          setStatusMsg('激活成功，正在进入应用...');
          onActivated(typeof data.code === 'string' ? data.code : null);
          return;
        }
        setStatus('unactivated');
        setStatusMsg(
          `请先添加 QQ 群领取激活码：${GROUP_QQ}，登录后输入激活码。同一激活码最多绑定 2 个不同浏览器环境；需要更多设备请联系群主或管理员。`
        );

        const loggedIn = await refreshUserMe();
        if (cancelled) return;
        // 未登录时每次进入（含刷新）都从欢迎/防骗页开始；已登录则直接去激活码页
        if (loggedIn) {
          setStep('activate');
        } else {
          setStep('welcome');
        }
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        const msg = e instanceof Error ? e.message : '检测失败';
        if (String(msg).toLowerCase().includes('load failed') || String(msg).toLowerCase().includes('failed')) {
          setStatusMsg('激活服务器加载失败。请确保 activation-server.js 在 8788 端口可被手机访问，并配置 VITE_ACTIVATION_SERVER_BASE_URL（不要用 127.0.0.1）。');
          return;
        }
        setStatusMsg(msg);
        if (!cancelled) setStep('welcome');
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
    // onActivated 由父组件传入，避免依赖变化导致反复检测
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceCode, apiBase, refreshUserMe]);

  const goWelcomeNext = async () => {
    if (!welcomeChecked) return;
    setHint(null);
    const ok = await refreshUserMe();
    setStep(ok ? 'activate' : 'login');
  };

  const handleLogin = async () => {
    const u = loginUsername.trim();
    const p = loginPassword;
    if (!u || !p) {
      setLoginHint('请填写账号和密码。');
      return;
    }
    setLoginBusy(true);
    setLoginHint('正在登录...');
    try {
      const resp = await fetch(apiUrl('/api/user/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data?.error || '登录失败');
      setLoginHint('登录成功。');
      await refreshUserMe();
      setStep('activate');
    } catch (e) {
      setLoginHint(e instanceof Error ? e.message : '登录失败');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleActivate = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setHint('请输入激活码。');
      return;
    }
    if (needLogin) {
      setHint('请先登录账号再激活。');
      return;
    }
    setBusy(true);
    setHint(null);
    try {
      const url = apiUrl('/api/activation/use');
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: trimmed, deviceCode }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data?.error || '激活失败');
      }
      if (data?.activated) {
        setHint(
          data.firstBind
            ? '激活成功！已绑定到本设备环境。'
            : '激活成功：当前浏览器/设备环境已与您的激活码关联（同一激活码最多 2 个不同环境）。'
        );
        onActivated(typeof data.code === 'string' ? data.code : trimmed);
        return;
      }
      setHint('激活失败：服务器未返回激活成功状态。');
    } catch (e) {
      setHint(e instanceof Error ? e.message : '激活失败');
    } finally {
      setBusy(false);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      await fetch(apiUrl('/api/user/logout'), { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setNeedLogin(true);
    setLoginHint(null);
    setLoginUsername('');
    setLoginPassword('');
    setDeviceSlotsUsed(0);
    setStep('login');
    setHint('已退出当前账号，请使用其他账号登录。');
  };

  const showWelcome =
    step === 'welcome' && status !== 'activated' && status !== 'error' && !checking;
  const showLoginBlock = step === 'login' && status !== 'activated';
  const showActivateBlock = step === 'activate' && status !== 'activated';

  const headerLoading = checking && status !== 'activated';
  const titleMain = headerLoading
    ? '欢迎使用 Lumi Phone'
    : status === 'error'
      ? '无法连接激活服务'
      : showWelcome
        ? '欢迎使用 Lumi Phone'
        : showLoginBlock
          ? '登录'
          : '输入激活码';
  const titleSub = headerLoading
    ? '正在检测激活状态…'
    : status === 'error'
      ? '请查看下方说明或检查网络'
      : showWelcome
        ? '请阅读以下说明'
        : showLoginBlock
          ? '使用账号登录后继续'
          : '加群领码后在此输入';

  React.useEffect(() => {
    if (step === 'activate' && !needLogin) {
      void refreshUserMe();
    }
  }, [step, needLogin, refreshUserMe]);

  return (
    <div
      style={{
        maxWidth: 520,
        width: '100%',
        padding: 18,
      }}
    >
      <div
        style={{
          borderRadius: 18,
          padding: 18,
          background: '#ffffff',
          color: '#111827',
          border: '1px solid rgba(2,6,23,0.08)',
          boxShadow: '0 18px 40px rgba(2,6,23,0.06)',
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          {titleMain}
        </div>
        <div
          style={{
            fontSize: 14,
            color: '#6b7280',
            lineHeight: 1.6,
            marginBottom: 14,
            textAlign: 'center',
            fontWeight: 800,
          }}
        >
          {titleSub}
        </div>

        {checking && status !== 'activated' && (
          <div
            style={{
              fontSize: 12,
              color: '#6b7280',
              lineHeight: 1.6,
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            {statusMsg}
          </div>
        )}

        {status === 'error' && !checking && (
          <div
            style={{
              fontSize: 12,
              color: '#b91c1c',
              lineHeight: 1.6,
              marginBottom: 10,
              textAlign: 'center',
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(254,226,226,0.6)',
              border: '1px solid rgba(248,113,113,0.35)',
            }}
          >
            {statusMsg}
          </div>
        )}

        {!checking && status !== 'activated' && status !== 'error' && !showWelcome && (
          <div
            style={{
              fontSize: 12,
              color: '#6b7280',
              lineHeight: 1.6,
              marginTop: -8,
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            {statusMsg}
          </div>
        )}

        {showWelcome && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 14,
                background: 'rgba(254,243,199,0.55)',
                border: '1px solid rgba(245,158,11,0.35)',
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e', marginBottom: 8 }}>
                防骗提醒
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#b45309',
                  marginBottom: 10,
                  lineHeight: 1.5,
                }}
              >
                本项目不收取任何费用。
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: 12,
                  color: '#78350f',
                  lineHeight: 1.65,
                }}
              >
                <li>请勿向陌生人转账或购买来路不明的激活码。</li>
                <li>官方交流与领码请加 QQ 群：{GROUP_QQ}，请认准群主与管理身份。</li>
                <li>请勿将账号、密码、激活码告诉他人，谨防仿冒链接与钓鱼页面。</li>
                <li>本应用不会以任何理由私信索要密码或验证码。</li>
              </ul>
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 13,
                color: '#374151',
                cursor: 'pointer',
                lineHeight: 1.5,
                marginBottom: 14,
              }}
            >
              <input
                type="checkbox"
                checked={welcomeChecked}
                onChange={(e) => setWelcomeChecked(e.target.checked)}
                style={{ marginTop: 3, flexShrink: 0 }}
              />
              <span>我已阅读并知晓上述提示，自愿承担因轻信他人造成的损失。</span>
            </label>
            <button
              type="button"
              onClick={goWelcomeNext}
              disabled={!welcomeChecked}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid rgba(17,24,39,0.12)',
                cursor: welcomeChecked ? 'pointer' : 'not-allowed',
                background: welcomeChecked ? '#111827' : '#e5e7eb',
                color: welcomeChecked ? '#ffffff' : '#9ca3af',
                fontWeight: 800,
                width: '100%',
              }}
            >
              下一步：前往登录
            </button>
          </div>
        )}

        {showLoginBlock && (
          <div
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 14,
              border: '1px solid rgba(2,6,23,0.08)',
              background: 'rgba(2,6,23,0.02)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="账号"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.8)',
                  outline: 'none',
                }}
                disabled={loginBusy}
              />
              <input
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="密码"
                type="password"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.8)',
                  outline: 'none',
                }}
                disabled={loginBusy}
              />
              <button
                type="button"
                onClick={handleLogin}
                disabled={loginBusy}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(17,24,39,0.12)',
                  cursor: 'pointer',
                  background: '#111827',
                  color: '#ffffff',
                  fontWeight: 800,
                  width: '100%',
                }}
              >
                {loginBusy ? '处理中...' : '登录账号'}
              </button>
            </div>

            {loginHint && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>{loginHint}</div>
            )}
          </div>
        )}

        {showActivateBlock && (
          <>
            {needLogin ? (
              <div
                style={{
                  marginBottom: 14,
                  padding: 14,
                  borderRadius: 14,
                  background: 'rgba(254,243,199,0.5)',
                  border: '1px solid rgba(245,158,11,0.35)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 13, color: '#92400e', marginBottom: 10 }}>
                  登录状态已失效，请重新登录后再输入激活码。
                </div>
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(17,24,39,0.12)',
                    background: '#111827',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  返回登录
                </button>
              </div>
            ) : (
              <>
                <div
                  style={{
                    marginBottom: 12,
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: 'rgba(239,246,255,0.85)',
                    border: '1px solid rgba(59,130,246,0.25)',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1e40af', marginBottom: 6 }}>
                    本账号设备绑定情况
                  </div>
                  <div style={{ fontSize: 13, color: '#1e3a8a', lineHeight: 1.6 }}>
                    当前已为该账号登记 <strong>{deviceSlotsUsed}</strong> 个设备环境（设备 ID），上限为{' '}
                    <strong>{maxDeviceSlots}</strong> 个。
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 8, lineHeight: 1.55 }}>
                    如需增加可绑定设备数量，请联系群主（QQ 群：{GROUP_QQ}）。
                  </div>
                </div>

                <div
                  style={{
                    marginBottom: 12,
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: 'rgba(2,6,23,0.03)',
                    border: '1px solid rgba(2,6,23,0.08)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#4b5563',
                      marginBottom: 8,
                    }}
                  >
                    本机当前设备码
                  </div>
                  <div
                    style={{
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: '#111827',
                      wordBreak: 'break-all',
                    }}
                  >
                    {deviceCode}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#9ca3af',
                      marginTop: 8,
                      lineHeight: 1.45,
                    }}
                  >
                    由本浏览器自动生成并保存在本地；激活成功后，服务器会将此设备码登记到您的账号（与后台「已登记设备码」一致）。
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: '#9ca3af',
                    lineHeight: 1.5,
                    marginBottom: 10,
                    textAlign: 'center',
                  }}
                >
                  激活成功后会自动记入上方「本账号设备绑定情况」中的数量，一般无需手动复制。
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="请输入激活码"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid rgba(148,163,184,0.8)',
                      outline: 'none',
                    }}
                    disabled={busy || checking}
                  />
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={busy || checking}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid rgba(17,24,39,0.12)',
                      cursor: 'pointer',
                      background: busy || checking ? '#e5e7eb' : '#111827',
                      color: busy || checking ? '#111827' : '#ffffff',
                      fontWeight: 800,
                      width: '100%',
                    }}
                  >
                    {busy ? '激活中...' : '立即激活'}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {hint && (
          <div
            style={{
              marginTop: 10,
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(59,130,246,0.08)',
              color: '#1d4ed8',
              fontSize: 13,
              border: '1px solid rgba(59,130,246,0.25)',
            }}
          >
            {hint}
          </div>
        )}

        {!checking && status !== 'activated' && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid rgba(2,6,23,0.08)',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: '#9ca3af',
                marginBottom: 10,
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              在浏览器打开用户中心可查看账号、密码、激活码与领取新码
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {step === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setStep('welcome');
                    setHint(null);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: '1px solid rgba(17,24,39,0.15)',
                    background: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  上一步
                </button>
              )}
              {step === 'activate' && !needLogin && (
                <button
                  type="button"
                  onClick={() => void handleSwitchAccount()}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: '1px solid rgba(17,24,39,0.15)',
                    background: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  切换登录账号
                </button>
              )}
              {playerPortalHomeUrl ? (
                <a
                  href={playerPortalHomeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: '1px solid rgba(37,99,235,0.35)',
                    background: 'rgba(37,99,235,0.06)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#1d4ed8',
                    textDecoration: 'none',
                  }}
                >
                  打开用户中心
                </a>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

