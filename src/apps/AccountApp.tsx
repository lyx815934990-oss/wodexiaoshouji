import React from 'react';
import { getOrCreateDeviceCode } from '../storage/deviceCode';

type AccountAppProps = {
  onExit: () => void;
};

function getActivationBaseUrl(): string {
  const envBase = (import.meta as any).env?.VITE_ACTIVATION_SERVER_BASE_URL;
  if (typeof envBase === 'string' && envBase.trim()) return envBase.trim();
  return '';
}

function formatTs(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export const AccountApp: React.FC<AccountAppProps> = ({ onExit }) => {
  const apiBase = getActivationBaseUrl();
  const apiUrl = (p: string) => (apiBase ? `${apiBase}${p}` : p);
  const [deviceCode] = React.useState(() => getOrCreateDeviceCode());

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [username, setUsername] = React.useState<string | null>(null);
  const [qq, setQq] = React.useState<string | null>(null);
  const [createdAt, setCreatedAt] = React.useState<string | null>(null);
  const [auth, setAuth] = React.useState(false);
  /** 管理员是否已核对 QQ（与服务器 qqReviewed 一致） */
  const [qqReviewed, setQqReviewed] = React.useState<boolean | null>(null);

  const [actCode, setActCode] = React.useState<string | null>(null);
  const [usedAt, setUsedAt] = React.useState<string | null>(null);
  const [requestedAt, setRequestedAt] = React.useState<string | null>(null);
  const [usedQQ, setUsedQQ] = React.useState<string | null>(null);
  const [requestQQ, setRequestQQ] = React.useState<string | null>(null);
  const [activated, setActivated] = React.useState(false);

  const [copyHint, setCopyHint] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const meResp = await fetch(apiUrl('/api/user/me'), { credentials: 'include' });
      const me = await meResp.json().catch(() => ({}));

      if (meResp.ok && me?.authenticated) {
        setAuth(true);
        setUsername(typeof me.username === 'string' ? me.username : null);
        setQq(typeof me.qq === 'string' ? me.qq : null);
        setCreatedAt(typeof me.createdAt === 'string' ? me.createdAt : null);
        setQqReviewed(typeof me.qqReviewed === 'boolean' ? me.qqReviewed : false);
      } else {
        setAuth(false);
        setUsername(null);
        setQq(null);
        setCreatedAt(null);
        setQqReviewed(null);
      }

      const stResp = await fetch(
        apiUrl(`/api/activation/status?deviceCode=${encodeURIComponent(deviceCode)}`)
      );
      const st = await stResp.json().catch(() => ({}));

      if (stResp.ok && st?.activated) {
        setActivated(true);
        setActCode(typeof st.code === 'string' ? st.code : null);
        setUsedAt(typeof st.usedAt === 'string' ? st.usedAt : null);
        setRequestedAt(typeof st.requestedAt === 'string' ? st.requestedAt : null);
        setUsedQQ(typeof st.usedQQ === 'string' ? st.usedQQ : null);
        setRequestQQ(typeof st.requestQQ === 'string' ? st.requestQQ : null);
      } else {
        setActivated(false);
        setActCode(null);
        setUsedAt(null);
        setRequestedAt(null);
        setUsedQQ(null);
        setRequestQQ(null);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [apiBase, deviceCode]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const copyCode = React.useCallback(async () => {
    if (!actCode) return;
    try {
      await navigator.clipboard.writeText(actCode);
      setCopyHint('已复制');
      window.setTimeout(() => setCopyHint(null), 1800);
    } catch {
      setCopyHint('复制失败');
      window.setTimeout(() => setCopyHint(null), 1800);
    }
  }, [actCode]);

  const kvRow = (label: string, value: React.ReactNode) => (
    <div className="account-app-kv">
      <span className="account-app-kv-label">{label}</span>
      <span className="account-app-kv-value">{value}</span>
    </div>
  );

  return (
    <div className="account-app">
      <div className="wechat-header account-app-header" style={{ position: 'relative', background: '#ffffff' }}>
        <button type="button" className="wechat-header-back" onClick={onExit} aria-label="返回桌面" />
        <span className="wechat-header-label">个人账户</span>
        <div className="wechat-header-right">
          <button type="button" className="wechat-header-plus" onClick={() => void load()}>
            刷新
          </button>
        </div>
      </div>

      <div className="account-app-body">
        <p className="account-app-lead">账号与激活信息由激活服务器同步，刷新可更新状态。</p>

        {loading && (
          <div className="account-app-loading" aria-busy>
            <span className="account-app-spinner" />
            <span>正在拉取资料…</span>
          </div>
        )}

        {!loading && err && (
          <div className="account-app-banner account-app-banner--error" role="alert">
            {err}
          </div>
        )}

        {!loading && (
          <div className="account-app-stack">
            <section className="account-app-card">
              <div className="account-app-card-head account-app-card-head--title-row">
                <div className="account-app-card-head-row">
                  <span className="account-app-card-icon" aria-hidden>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <h2 className="account-app-card-title">账号</h2>
                </div>
                <div className="account-app-card-tags" role="status" aria-label="激活与审核状态">
                  <span className={`account-app-chip ${activated ? 'account-app-chip--ok' : 'account-app-chip--warn'}`}>
                    {activated ? '已激活' : '未激活'}
                  </span>
                  <span
                    className={`account-app-chip ${
                      !auth
                        ? 'account-app-chip--muted'
                        : qqReviewed
                          ? 'account-app-chip--ok'
                          : 'account-app-chip--warn'
                    }`}
                  >
                    {!auth ? '待登录' : qqReviewed ? '已审核' : '待审核'}
                  </span>
                </div>
              </div>
              {!auth && (
                <div className="account-app-tip">
                  未检测到登录 Cookie。若曾在激活页登录，请使用同一域名打开本页；或完成激活流程登录后再查看注册时间。
                </div>
              )}
              {auth && (
                <div className="account-app-kv-list">
                  {kvRow('账号', username || '—')}
                  {kvRow('QQ', qq || '—')}
                  {kvRow('注册时间', formatTs(createdAt))}
                </div>
              )}
            </section>

            <section className="account-app-card">
              <div className="account-app-card-head">
                <span className="account-app-card-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <h2 className="account-app-card-title">激活码</h2>
              </div>
              {!activated && <div className="account-app-tip">本设备尚未在服务器侧标记为已激活。</div>}
              {activated && (
                <>
                  <div className="account-app-code-block">
                    <div className="account-app-code-label">当前激活码</div>
                    <div className="account-app-code-row">
                      <code className="account-app-code">{actCode || '—'}</code>
                      {actCode ? (
                        <button type="button" className="account-app-copy" onClick={() => void copyCode()}>
                          复制
                        </button>
                      ) : null}
                    </div>
                    {copyHint ? <div className="account-app-copy-hint">{copyHint}</div> : null}
                  </div>
                  <div className="account-app-kv-list">
                    {kvRow('QQ（激活 / 领取）', usedQQ || requestQQ || '—')}
                    {kvRow('领取时间', formatTs(requestedAt))}
                    {kvRow('激活（使用）时间', formatTs(usedAt))}
                  </div>
                </>
              )}
            </section>

            <div className="account-app-device">
              <span className="account-app-device-label">设备码（本机）</span>
              <code className="account-app-device-code">{deviceCode ?? '—'}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

