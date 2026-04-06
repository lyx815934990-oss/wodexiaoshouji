import React from 'react';
import { appStorage } from '../storage/appStorage';

const STORAGE_KEY = 'mini-ai-phone.api-config';
const STORAGE_KEY_V2 = 'mini-ai-phone.api-config.v2';
const PRESETS_STORAGE_KEY = 'mini-ai-phone.api-config.presets';
const MAX_PRESETS = 24;

type SingleApiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  models?: string[];
};

type FeatureKey = 'chat' | 'chatlogCard' | 'danmaku' | 'heartLanguage' | 'moments';

type MultiApiConfig = {
  default: SingleApiConfig;
  overrides: Partial<Record<FeatureKey, SingleApiConfig>>;
};

type ApiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  models: string[];
};

type ApiConfigPreset = {
  id: string;
  name: string;
  createdAt: number;
  config: MultiApiConfig;
};

const loadMultiConfig = (): MultiApiConfig => {
  try {
    const v2Raw = appStorage.getItem(STORAGE_KEY_V2);
    if (v2Raw) {
      const parsed = JSON.parse(v2Raw) as Partial<MultiApiConfig>;
      return {
        default: parsed.default || { baseUrl: '', apiKey: '', model: '' },
        overrides: parsed.overrides || {},
      };
    }
  } catch {
    // ignore
  }

  try {
    const oldRaw = appStorage.getItem(STORAGE_KEY);
    if (oldRaw) {
      const oldParsed = JSON.parse(oldRaw) as Partial<ApiConfig>;
      const migrated: MultiApiConfig = {
        default: {
          baseUrl: oldParsed.baseUrl ?? '',
          apiKey: oldParsed.apiKey ?? '',
          model: oldParsed.model ?? '',
          models: oldParsed.models ?? [],
        },
        overrides: {},
      };
      saveMultiConfig(migrated);
      return migrated;
    }
  } catch {
    // ignore
  }

  return {
      default: { baseUrl: '', apiKey: '', model: '' },
      overrides: {},
    };
};

const saveMultiConfig = (cfg: MultiApiConfig) => {
  try {
    appStorage.setItem(STORAGE_KEY_V2, JSON.stringify(cfg));
  } catch {
    // ignore
  }
};

function loadPresets(): ApiConfigPreset[] {
  try {
    const raw = appStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is ApiConfigPreset =>
        p &&
        typeof p.id === 'string' &&
        typeof p.name === 'string' &&
        typeof p.createdAt === 'number' &&
        p.config &&
        typeof p.config === 'object'
    );
  } catch {
    return [];
  }
}

function savePresetsToStorage(list: ApiConfigPreset[]) {
  try {
    appStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(list.slice(0, MAX_PRESETS)));
  } catch {
    // ignore
  }
}

function cloneMulti(cfg: MultiApiConfig): MultiApiConfig {
  return JSON.parse(JSON.stringify(cfg)) as MultiApiConfig;
}

export const ApiSettingsApp: React.FC<{ onConfigSaved?: () => void }> = ({ onConfigSaved }) => {
  const initialMulti = React.useMemo(loadMultiConfig, []);
  const [presets, setPresets] = React.useState<ApiConfigPreset[]>(() => loadPresets());
  const [presetNameInput, setPresetNameInput] = React.useState('');
  const [selectedPresetId, setSelectedPresetId] = React.useState<string>('');

  const [defaultBaseUrl, setDefaultBaseUrl] = React.useState(initialMulti.default.baseUrl);
  const [defaultApiKey, setDefaultApiKey] = React.useState(initialMulti.default.apiKey);
  const [defaultModel, setDefaultModel] = React.useState(initialMulti.default.model);
  const [defaultModels, setDefaultModels] = React.useState<string[]>(initialMulti.default.models || []);

  const [chatlogCardEnabled, setChatlogCardEnabled] = React.useState(!!initialMulti.overrides.chatlogCard);
  const [chatlogCardBaseUrl, setChatlogCardBaseUrl] = React.useState(initialMulti.overrides.chatlogCard?.baseUrl || '');
  const [chatlogCardApiKey, setChatlogCardApiKey] = React.useState(initialMulti.overrides.chatlogCard?.apiKey || '');
  const [chatlogCardModel, setChatlogCardModel] = React.useState(initialMulti.overrides.chatlogCard?.model || '');

  const [danmakuEnabled, setDanmakuEnabled] = React.useState(!!initialMulti.overrides.danmaku);
  const [danmakuBaseUrl, setDanmakuBaseUrl] = React.useState(initialMulti.overrides.danmaku?.baseUrl || '');
  const [danmakuApiKey, setDanmakuApiKey] = React.useState(initialMulti.overrides.danmaku?.apiKey || '');
  const [danmakuModel, setDanmakuModel] = React.useState(initialMulti.overrides.danmaku?.model || '');

  const [heartLanguageEnabled, setHeartLanguageEnabled] = React.useState(!!initialMulti.overrides.heartLanguage);
  const [heartLanguageBaseUrl, setHeartLanguageBaseUrl] = React.useState(initialMulti.overrides.heartLanguage?.baseUrl || '');
  const [heartLanguageApiKey, setHeartLanguageApiKey] = React.useState(initialMulti.overrides.heartLanguage?.apiKey || '');
  const [heartLanguageModel, setHeartLanguageModel] = React.useState(initialMulti.overrides.heartLanguage?.model || '');

  const [momentsEnabled, setMomentsEnabled] = React.useState(!!initialMulti.overrides.moments);
  const [momentsBaseUrl, setMomentsBaseUrl] = React.useState(initialMulti.overrides.moments?.baseUrl || '');
  const [momentsApiKey, setMomentsApiKey] = React.useState(initialMulti.overrides.moments?.apiKey || '');
  const [momentsModel, setMomentsModel] = React.useState(initialMulti.overrides.moments?.model || '');

  const [testing, setTesting] = React.useState(false);
  const [testingFeature, setTestingFeature] = React.useState<FeatureKey | 'default' | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const buildMultiFromState = React.useCallback((): MultiApiConfig => {
    const multi: MultiApiConfig = {
      default: {
        baseUrl: defaultBaseUrl.trim(),
        apiKey: defaultApiKey.trim(),
        model: defaultModel.trim(),
        models: defaultModels,
      },
      overrides: {},
    };

    if (chatlogCardEnabled && chatlogCardBaseUrl.trim() && chatlogCardModel.trim()) {
      multi.overrides.chatlogCard = {
        baseUrl: chatlogCardBaseUrl.trim(),
        apiKey: chatlogCardApiKey.trim(),
        model: chatlogCardModel.trim(),
      };
    }
    if (danmakuEnabled && danmakuBaseUrl.trim() && danmakuModel.trim()) {
      multi.overrides.danmaku = {
        baseUrl: danmakuBaseUrl.trim(),
        apiKey: danmakuApiKey.trim(),
        model: danmakuModel.trim(),
      };
    }
    if (heartLanguageEnabled && heartLanguageBaseUrl.trim() && heartLanguageModel.trim()) {
      multi.overrides.heartLanguage = {
        baseUrl: heartLanguageBaseUrl.trim(),
        apiKey: heartLanguageApiKey.trim(),
        model: heartLanguageModel.trim(),
      };
    }
    return multi;
  }, [
    defaultBaseUrl,
    defaultApiKey,
    defaultModel,
    defaultModels,
    chatlogCardEnabled,
    chatlogCardBaseUrl,
    chatlogCardApiKey,
    chatlogCardModel,
    danmakuEnabled,
    danmakuBaseUrl,
    danmakuApiKey,
    danmakuModel,
    heartLanguageEnabled,
    heartLanguageBaseUrl,
    heartLanguageApiKey,
    heartLanguageModel,
    momentsEnabled,
    momentsBaseUrl,
    momentsApiKey,
    momentsModel,
  ]);

  const applyMultiToState = React.useCallback((m: MultiApiConfig) => {
    const d = m.default || { baseUrl: '', apiKey: '', model: '' };
    setDefaultBaseUrl(d.baseUrl || '');
    setDefaultApiKey(d.apiKey || '');
    setDefaultModel(d.model || '');
    setDefaultModels(Array.isArray(d.models) ? d.models : []);

    const o = m.overrides || {};
    setChatlogCardEnabled(!!o.chatlogCard);
    setChatlogCardBaseUrl(o.chatlogCard?.baseUrl || '');
    setChatlogCardApiKey(o.chatlogCard?.apiKey || '');
    setChatlogCardModel(o.chatlogCard?.model || '');

    setDanmakuEnabled(!!o.danmaku);
    setDanmakuBaseUrl(o.danmaku?.baseUrl || '');
    setDanmakuApiKey(o.danmaku?.apiKey || '');
    setDanmakuModel(o.danmaku?.model || '');

    setHeartLanguageEnabled(!!o.heartLanguage);
    setHeartLanguageBaseUrl(o.heartLanguage?.baseUrl || '');
    setHeartLanguageApiKey(o.heartLanguage?.apiKey || '');
    setHeartLanguageModel(o.heartLanguage?.model || '');

    setMomentsEnabled(!!o.moments);
    setMomentsBaseUrl(o.moments?.baseUrl || '');
    setMomentsApiKey(o.moments?.apiKey || '');
    setMomentsModel(o.moments?.model || '');
  }, []);

  const handleSave = React.useCallback(() => {
    const multi = buildMultiFromState();
    saveMultiConfig(multi);
    setMessage('已保存到本地，只在本设备浏览器中生效');
    if (multi.default.baseUrl && multi.default.model && onConfigSaved) {
      window.setTimeout(() => onConfigSaved(), 100);
    }
  }, [buildMultiFromState, onConfigSaved]);

  const handleSavePreset = React.useCallback(() => {
    const name = presetNameInput.trim();
    if (!name) {
      setMessage('请先填写预设名称');
      return;
    }
    const multi = cloneMulti(buildMultiFromState());
    const preset: ApiConfigPreset = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      createdAt: Date.now(),
      config: multi,
    };
    const next = [preset, ...presets.filter((p) => p.name !== name)].slice(0, MAX_PRESETS);
    setPresets(next);
    savePresetsToStorage(next);
    setPresetNameInput('');
    setSelectedPresetId(preset.id);
    setMessage(`已保存预设「${name}」`);
  }, [presetNameInput, buildMultiFromState, presets]);

  const handleSelectPreset = React.useCallback(
    (id: string) => {
      setSelectedPresetId(id);
      if (!id) return;
      const p = presets.find((x) => x.id === id);
      if (!p) return;
      applyMultiToState(cloneMulti(p.config));
      setMessage(`已载入预设「${p.name}」（记得点底部「保存所有配置」写入当前生效配置）`);
    },
    [presets, applyMultiToState]
  );

  const handleDeletePreset = React.useCallback(() => {
    if (!selectedPresetId) return;
    const p = presets.find((x) => x.id === selectedPresetId);
    if (!p) return;
    if (!window.confirm(`确定删除预设「${p.name}」？`)) return;
    const next = presets.filter((x) => x.id !== selectedPresetId);
    setPresets(next);
    savePresetsToStorage(next);
    setSelectedPresetId('');
    setMessage('已删除该预设');
  }, [selectedPresetId, presets]);

  const handleTestAndFetch = async (feature: FeatureKey | 'default' = 'default') => {
    let testBaseUrl = '';
    let testApiKey = '';
    let testModel = '';

    if (feature === 'default') {
      testBaseUrl = defaultBaseUrl;
      testApiKey = defaultApiKey;
      testModel = defaultModel;
    } else if (feature === 'chatlogCard') {
      testBaseUrl = chatlogCardBaseUrl;
      testApiKey = chatlogCardApiKey;
      testModel = chatlogCardModel;
    } else if (feature === 'danmaku') {
      testBaseUrl = danmakuBaseUrl;
      testApiKey = danmakuApiKey;
      testModel = danmakuModel;
    } else if (feature === 'heartLanguage') {
      testBaseUrl = heartLanguageBaseUrl;
      testApiKey = heartLanguageApiKey;
      testModel = heartLanguageModel;
    }

    if (!testBaseUrl.trim()) {
      setMessage('请先填写 API 链接');
      return;
    }

    let normalizedUrl = testBaseUrl.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      setMessage('API 链接格式不正确，请输入完整的 URL（例如：https://api.xxx.com/v1）');
      return;
    }

    setTesting(true);
    setTestingFeature(feature);
    setMessage(null);
    try {
      const url = normalizedUrl.replace(/\/+$/, '') + '/models';
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(testApiKey.trim() ? { Authorization: `Bearer ${testApiKey.trim()}` } : {}),
        },
      });
      if (!res.ok) {
        const errorText = res.statusText || `状态码 ${res.status}`;
        throw new Error(`接口返回 ${res.status}: ${errorText}`);
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

      const finalBaseUrl = normalizedUrl.replace(/\/+$/, '');
      const selectedModel = list.includes(testModel) ? testModel : (list[0] ?? '');

      if (feature === 'default') {
        setDefaultModels(list);
        if (selectedModel !== testModel) {
          setDefaultModel(selectedModel);
        }
        setDefaultBaseUrl(finalBaseUrl);
      } else if (feature === 'chatlogCard') {
        setChatlogCardModel(selectedModel);
        setChatlogCardBaseUrl(finalBaseUrl);
      } else if (feature === 'danmaku') {
        setDanmakuModel(selectedModel);
        setDanmakuBaseUrl(finalBaseUrl);
      } else if (feature === 'heartLanguage') {
        setHeartLanguageModel(selectedModel);
        setHeartLanguageBaseUrl(finalBaseUrl);
      } else if (feature === 'moments') {
        setMomentsModel(selectedModel);
        setMomentsBaseUrl(finalBaseUrl);
      }

      setMessage(
        `连接成功，已获取模型列表（${
          feature === 'default'
            ? '通用默认'
            : feature === 'chatlogCard'
              ? '聊天记录卡片'
              : feature === 'danmaku'
                ? '弹幕'
                : feature === 'heartLanguage'
                  ? '心语'
                  : '朋友圈'
        }接口）`
      );

      if (finalBaseUrl && selectedModel) {
        const multi = cloneMulti(buildMultiFromState());
        if (feature === 'default') {
          multi.default.baseUrl = finalBaseUrl;
          multi.default.model = selectedModel;
          multi.default.models = list;
        } else if (feature === 'chatlogCard') {
          multi.overrides.chatlogCard = {
            baseUrl: finalBaseUrl,
            apiKey: chatlogCardApiKey.trim(),
            model: selectedModel,
          };
        } else if (feature === 'danmaku') {
          multi.overrides.danmaku = {
            baseUrl: finalBaseUrl,
            apiKey: danmakuApiKey.trim(),
            model: selectedModel,
          };
        } else if (feature === 'heartLanguage') {
          multi.overrides.heartLanguage = {
            baseUrl: finalBaseUrl,
            apiKey: heartLanguageApiKey.trim(),
            model: selectedModel,
          };
        }
        saveMultiConfig(multi);
        if (multi.default.baseUrl && multi.default.model && onConfigSaved) {
          window.setTimeout(() => onConfigSaved(), 100);
        }
      }
    } catch (err) {
      const errMsg = (err as Error).message || String(err);
      if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
        setMessage('测试失败：网络连接失败，请检查 API 链接是否正确或网络是否正常');
      } else if (errMsg.includes('expected pattern') || errMsg.includes('Invalid URL')) {
        setMessage('测试失败：API 链接格式不正确，请输入完整的 URL（例如：https://api.xxx.com/v1）');
      } else {
        setMessage(`测试失败：${errMsg}`);
      }
    } finally {
      setTesting(false);
      setTestingFeature(null);
    }
  };

  const renderFeatureSection = (
    title: string,
    feature: FeatureKey | 'default',
    enabled: boolean,
    setEnabled: (v: boolean) => void,
    baseUrl: string,
    setBaseUrl: (v: string) => void,
    apiKey: string,
    setApiKey: (v: string) => void,
    model: string,
    setModel: (v: string) => void,
    models: string[]
  ) => {
    const isDefault = feature === 'default';
    const canEdit = isDefault || enabled;
    const disabledBlock = !isDefault && !enabled;

    return (
      <div className={`api-settings-card${disabledBlock ? ' api-settings-card--collapsed' : ''}`}>
        <div className="api-settings-card__head">
          {!isDefault && (
            <label className="api-settings-toggle">
              <input type="checkbox" checked={!!enabled} onChange={(e) => setEnabled(e.target.checked)} />
              <span className="api-settings-toggle__ui" aria-hidden />
              <span className="api-settings-toggle__text">独立接口</span>
            </label>
          )}
          <h3 className="api-settings-card__title">{title}</h3>
          {isDefault && <span className="api-settings-card__badge">主配置</span>}
        </div>

        {disabledBlock ? (
          <p className="api-settings-muted">关闭时使用上方通用默认接口，无需填写。</p>
        ) : (
          <>
            <div className="api-row">
              <label className="api-label">API 链接</label>
              <input
                className="api-input"
                placeholder="例如：https://api.xxx.com/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                disabled={!canEdit}
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
                disabled={!canEdit}
              />
            </div>
            <div className="api-row">
              <label className="api-label">模型</label>
              {models.length > 0 ? (
                <select
                  className="api-input api-input--select"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={!canEdit}
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
                  placeholder="先「测试连接并获取模型」或手动填写"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={!canEdit}
                />
              )}
            </div>
            <div className="api-actions">
              <button
                type="button"
                className="api-btn primary"
                onClick={() => void handleTestAndFetch(feature)}
                disabled={testing || (!isDefault && !enabled)}
              >
                {testing && testingFeature === feature ? '测试中…' : '测试连接并获取模型'}
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="api-settings api-settings--v2">
      <div className="api-settings-inner">
        <section className="api-presets-panel">
          <div className="api-presets-panel__title">
            <span className="api-presets-panel__icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <path d="M17 21v-8H7v8" />
                <path d="M7 3v5h8" />
              </svg>
            </span>
            配置预设
          </div>
          <p className="api-presets-panel__desc">保存整套 API（含各功能独立接口），下次一键载入后继续改或点「保存所有配置」生效。</p>
          <div className="api-presets-panel__row">
            <label className="api-presets-panel__field-label" htmlFor="api-preset-select">
              选择预设
            </label>
            <select
              id="api-preset-select"
              className="api-input api-input--select api-presets-select"
              value={selectedPresetId}
              onChange={(e) => handleSelectPreset(e.target.value)}
            >
              <option value="">— 请选择已保存的预设 —</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="api-presets-panel__row api-presets-panel__row--split">
            <div className="api-presets-panel__grow">
              <label className="api-presets-panel__field-label" htmlFor="api-preset-name">
                新预设名称
              </label>
              <input
                id="api-preset-name"
                className="api-input"
                placeholder="例如：Gemini 正式 / OpenAI 备用"
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
              />
            </div>
            <div className="api-presets-panel__actions">
              <button type="button" className="api-btn primary api-btn--wide" onClick={handleSavePreset}>
                保存为预设
              </button>
              <button
                type="button"
                className="api-btn api-btn--danger"
                onClick={handleDeletePreset}
                disabled={!selectedPresetId}
              >
                删除所选
              </button>
            </div>
          </div>
        </section>

        {renderFeatureSection(
          '通用默认接口',
          'default',
          true,
          () => {},
          defaultBaseUrl,
          setDefaultBaseUrl,
          defaultApiKey,
          setDefaultApiKey,
          defaultModel,
          setDefaultModel,
          defaultModels
        )}

        {renderFeatureSection(
          '聊天记录卡片接口',
          'chatlogCard',
          chatlogCardEnabled,
          setChatlogCardEnabled,
          chatlogCardBaseUrl,
          setChatlogCardBaseUrl,
          chatlogCardApiKey,
          setChatlogCardApiKey,
          chatlogCardModel,
          setChatlogCardModel,
          []
        )}

        {renderFeatureSection(
          '弹幕接口',
          'danmaku',
          danmakuEnabled,
          setDanmakuEnabled,
          danmakuBaseUrl,
          setDanmakuBaseUrl,
          danmakuApiKey,
          setDanmakuApiKey,
          danmakuModel,
          setDanmakuModel,
          []
        )}

        {renderFeatureSection(
          '心语接口',
          'heartLanguage',
          heartLanguageEnabled,
          setHeartLanguageEnabled,
          heartLanguageBaseUrl,
          setHeartLanguageBaseUrl,
          heartLanguageApiKey,
          setHeartLanguageApiKey,
          heartLanguageModel,
          setHeartLanguageModel,
          []
        )}

        {renderFeatureSection(
          '朋友圈接口（合并进线上回复）',
          'moments',
          momentsEnabled,
          setMomentsEnabled,
          momentsBaseUrl,
          setMomentsBaseUrl,
          momentsApiKey,
          setMomentsApiKey,
          momentsModel,
          setMomentsModel,
          []
        )}

        <section className="api-settings-card api-settings-card--footer">
          <div className="api-actions api-actions--footer">
            <button type="button" className="api-btn primary api-btn--lg" onClick={handleSave}>
              保存所有配置
            </button>
          </div>
          {message && (
            <div
              className={
                /失败|错误|不正确|网络连接失败|请先填写/.test(message)
                  ? 'api-message api-message--toast api-message--error-toast'
                  : 'api-message api-message--toast'
              }
            >
              {message}
            </div>
          )}
          <p className="api-tip api-tip--footer">
            未启用独立接口的功能会使用通用默认。保存后仅本机生效；从预设载入后请再点「保存所有配置」写入全局。
          </p>
        </section>
      </div>
    </div>
  );
};
