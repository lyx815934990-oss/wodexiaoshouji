import React from 'react';

const STORAGE_KEY = 'mini-ai-phone.api-config';

type ApiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  models: string[];
};

const loadConfig = (): ApiConfig => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { baseUrl: '', apiKey: '', model: '', models: [] };
    }
    const parsed = JSON.parse(raw) as Partial<ApiConfig>;
    return {
      baseUrl: parsed.baseUrl ?? '',
      apiKey: parsed.apiKey ?? '',
      model: parsed.model ?? '',
      models: parsed.models ?? []
    };
  } catch {
    return { baseUrl: '', apiKey: '', model: '', models: [] };
  }
};

const saveConfig = (cfg: ApiConfig) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // ignore
  }
};

export const ApiSettingsApp: React.FC = () => {
  const initial = React.useMemo(loadConfig, []);
  const [baseUrl, setBaseUrl] = React.useState(initial.baseUrl);
  const [apiKey, setApiKey] = React.useState(initial.apiKey);
  const [model, setModel] = React.useState(initial.model);
  const [models, setModels] = React.useState<string[]>(initial.models);
  const [testing, setTesting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleSave = () => {
    const cfg: ApiConfig = {
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
      models
    };
    saveConfig(cfg);
    setMessage('已保存到本地，只在本设备浏览器中生效');
  };

  const handleTestAndFetch = async () => {
    if (!baseUrl.trim()) {
      setMessage('请先填写 API 链接');
      return;
    }
    setTesting(true);
    setMessage(null);
    try {
      const url = baseUrl.replace(/\/+$/, '') + '/models';
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey.trim() ? { Authorization: `Bearer ${apiKey.trim()}` } : {})
        }
      });
      if (!res.ok) {
        throw new Error(`接口返回状态 ${res.status}`);
      }
      const data = (await res.json()) as any;
      let list: string[] = [];
      if (Array.isArray(data)) {
        list = data.map((x) => (typeof x === 'string' ? x : x.id || x.name)).filter(Boolean);
      } else if (Array.isArray((data as any).data)) {
        list = (data as any).data
          .map((x: any) => x.id || x.name)
          .filter((x: unknown): x is string => typeof x === 'string');
      } else if (Array.isArray((data as any).models)) {
        list = (data as any).models
          .map((x: any) => x.id || x.name)
          .filter((x: unknown): x is string => typeof x === 'string');
      }
      if (!list.length) {
        list = ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4.1-chat'];
      }
      setModels(list);
      if (!list.includes(model)) {
        setModel(list[0] ?? '');
      }
      setMessage('连接成功，已获取模型列表（如有返回格式差异则使用默认示例列表）');
    } catch (err) {
      setMessage(`测试失败：${(err as Error).message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="api-settings">
      <div className="api-section">
        <div className="api-row">
          <label className="api-label">API 链接</label>
          <input
            className="api-input"
            placeholder="例如：https://api.xxx.com/v1"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>
        <div className="api-row">
          <label className="api-label">API Key</label>
          <input
            className="api-input"
            type="password"
            placeholder="仅保存在本地浏览器"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="api-actions">
          <button
            type="button"
            className="api-btn primary"
            onClick={handleTestAndFetch}
            disabled={testing}
          >
            {testing ? '测试中…' : '测试连接并获取模型'}
          </button>
          <button type="button" className="api-btn" onClick={handleSave}>
            仅保存配置
          </button>
        </div>

        {message && <div className="api-message">{message}</div>}
      </div>

      <div className="api-section">
        <div className="api-row">
          <label className="api-label">当前使用模型</label>
          {models.length > 0 ? (
            <select
              className="api-input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">请选择模型</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="api-input"
              placeholder="例如：gpt-4.1-mini（点击'测试连接并获取模型'可下拉选择）"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          )}
        </div>
        {models.length > 0 && (
          <p className="api-tip" style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            已获取 {models.length} 个可用模型，可在上方下拉框中选择
          </p>
        )}
        <p className="api-tip">
          以上配置会被后续所有 AI 生文功能共用（例如：聊天、微博总结、外卖推荐、淘宝找货等）。
        </p>
      </div>
    </div>
  );
};


