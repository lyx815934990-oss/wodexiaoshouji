import { useState } from "react";
import { useAiSettings } from "../../context/AiSettingsContext";
import { fetchModels, type ModelInfo } from "../../services/aiClient";

interface SettingsScreenProps {
  onBackHome: () => void;
}

export function SettingsScreen({ onBackHome }: SettingsScreenProps) {
  const { aiConfig, updateAiConfig } = useAiSettings();
  const [loadingModels, setLoadingModels] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const openModal = (msg: string) => {
    setModalMessage(msg);
    setModalOpen(true);
  };

  const handleFetchModels = async () => {
    setLoadingModels(true);
    try {
      const list = await fetchModels(aiConfig);
      setModels(list);
      openModal(`API 测试成功，获取到 ${list.length} 个模型，请在下方列表中选择一个～`);
    } catch (e: any) {
      openModal(e.message ?? "拉取模型失败，请检查配置。");
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSaveClick = () => {
    openModal("配置已保存到本地，小手机会用这份配置来和你聊天～");
  };

  return (
    <div className="settings-screen">
      <header className="settings-header">
        <button type="button" className="wechat-back-btn" onClick={onBackHome}>
          ‹ 桌面
        </button>
        <div className="settings-title">
          <div className="settings-title-main">设置 · 软糯糯控制中心</div>
          <div className="settings-title-sub">告诉小手机，要用哪家的小脑袋瓜</div>
        </div>
      </header>

      <main className="settings-body">
        <section className="soft-card settings-section">
          <div className="soft-card-header">
            <div className="soft-card-header-text">
              <div className="soft-card-title">AI 接口配置</div>
              <div className="soft-card-subtitle">兼容 OpenAI 风格的接口都可以接上来</div>
            </div>
          </div>
          <div className="settings-field">
            <label className="settings-label">API Base URL</label>
            <input
              className="settings-input"
              placeholder="例如：https://api.xxx.com/v1"
              value={aiConfig.baseUrl}
              onChange={(e) => updateAiConfig({ baseUrl: e.target.value })}
            />
          </div>
          <div className="settings-field">
            <label className="settings-label">API Key</label>
            <input
              type="password"
              className="settings-input"
              placeholder="在这里粘贴你的密钥，小手机会好好保护它"
              value={aiConfig.apiKey}
              onChange={(e) => updateAiConfig({ apiKey: e.target.value })}
            />
          </div>
          <div className="settings-field">
            <label className="settings-label">模型名称</label>
            <input
              className="settings-input"
              placeholder="例如：gpt-4.x / deepseek-xxx"
              value={aiConfig.model}
              onChange={(e) => updateAiConfig({ model: e.target.value })}
            />
          </div>
          <div className="settings-field settings-model-row">
            <button
              type="button"
              className="primary-pill-btn"
              onClick={handleFetchModels}
              disabled={loadingModels}
            >
              {loadingModels ? "正在测试 API…" : "测试 API 并获取模型列表"}
            </button>
            {models.length > 0 && (
              <select
                className="settings-select"
                value={aiConfig.model}
                onChange={(e) => updateAiConfig({ model: e.target.value })}
              >
                <option value="">选择一个模型</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
              </select>
            )}
          </div>
          {aiConfig.model && (
            <div className="settings-current-model">
              当前模型：<span>{aiConfig.model}</span>
            </div>
          )}
          <div className="settings-field">
            <button type="button" className="primary-pill-btn" onClick={handleSaveClick}>
              保存配置
            </button>
          </div>
        </section>
      </main>

      {modalOpen && (
        <div className="settings-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="settings-modal-card"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="settings-modal-title">API 配置结果</div>
            <div className="settings-modal-message">{modalMessage}</div>
            <button
              type="button"
              className="primary-pill-btn settings-modal-btn"
              onClick={() => setModalOpen(false)}
            >
              好～
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


