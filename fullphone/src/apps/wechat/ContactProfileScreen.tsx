import type { FC } from "react";
import { useEffect, useState } from "react";
import { CHAT_STATUSES, type ChatSettings } from "./ChatSettingsScreen";

interface ContactProfileScreenProps {
  contactId: string;
  contactName: string;
  onBack: () => void;
  onSendMessage: () => void;
  onOpenSettings: () => void;
  onViewMoments: () => void;
}

export const ContactProfileScreen: FC<ContactProfileScreenProps> = ({
  contactId,
  contactName,
  onBack,
  onSendMessage,
  onOpenSettings,
  onViewMoments
}) => {
  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [showEditNickname, setShowEditNickname] = useState(false);
  const [editNickname, setEditNickname] = useState("");

  const STORAGE_KEY_PREFIX = "miniOtomePhone_chatSettings_";

  useEffect(() => {
    // 从localStorage读取角色设置
    try {
      const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${contactId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatSettings;
        setSettings(parsed);
        setEditNickname(parsed.nickname || contactName);
      } else {
        setEditNickname(contactName);
      }
    } catch {
      setEditNickname(contactName);
    }
  }, [contactId, contactName]);

  const handleSaveNickname = () => {
    const updatedSettings: ChatSettings = settings ? {
      ...settings,
      nickname: editNickname.trim() || contactName
    } : {
      realName: "",
      nickname: editNickname.trim() || contactName,
      callMe: "",
      myIdentity: "",
      myGender: "",
      myOther: "",
      taIdentity: "",
      taGender: "",
      taOther: "",
      chatStyle: "",
      opening: "",
      status: "",
      customStatus: "",
      avatar: "",
      clothing: "",
      clothingState: "",
      innerThoughts: "",
      genitalState: "",
      desire: 50,
      mood: 50,
      favorability: 50,
      jealousy: 0
    };

    try {
      window.localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${contactId}`,
        JSON.stringify(updatedSettings)
      );
      setSettings(updatedSettings);
      setShowEditNickname(false);
    } catch (error) {
      console.error("保存备注失败:", error);
    }
  };

  const getDisplayName = () => {
    if (settings?.nickname?.trim()) {
      return settings.nickname.trim();
    }
    return contactName;
  };

  const getStatusInfo = () => {
    if (!settings?.status) {
      return { text: "在线", emoji: "🟢" };
    }
    const status = CHAT_STATUSES.find((s) => s.id === settings.status);
    if (status) {
      return { text: settings.customStatus || status.text, emoji: status.emoji };
    }
    return { text: "在线", emoji: "🟢" };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="wechat-profile-screen">
      {/* 顶部导航栏 */}
      <header className="wechat-profile-header wechat-chat-header">
        <button
          type="button"
          className="wechat-back-btn"
          onClick={onBack}
          aria-label="返回"
        >
          ‹ 微信
        </button>
        <div className="wechat-title">
          <div className="wechat-title-main">
            {showEditNickname ? (
              <input
                type="text"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                className="wechat-profile-nickname-input"
                placeholder="请输入备注名"
                autoFocus
                onBlur={handleSaveNickname}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveNickname();
                  }
                  if (e.key === "Escape") {
                    setEditNickname(settings?.nickname || contactName);
                    setShowEditNickname(false);
                  }
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "var(--text-main)",
                  textAlign: "center",
                  width: "100%"
                }}
              />
            ) : (
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}
                onClick={() => setShowEditNickname(true)}
              >
                {getDisplayName()}
                <span style={{ fontSize: "14px", opacity: 0.6 }}>✏️</span>
              </div>
            )}
          </div>
          <div className="wechat-title-sub" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            <span>{statusInfo.emoji}</span>
            <span>{statusInfo.text}</span>
          </div>
        </div>
        <button
          type="button"
          className="wechat-header-right"
          onClick={onOpenSettings}
          style={{
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px"
          }}
        >
          ⚙️
        </button>
      </header>

      {/* 主要内容区域 */}
      <div className="wechat-profile-content">
        {/* 头像区域 */}
        <div className="wechat-profile-top">
          <div className="wechat-profile-avatar-container">
            {settings?.avatar ? (
              <img
                src={settings.avatar}
                alt={getDisplayName()}
                className="wechat-profile-avatar"
              />
            ) : (
              <div className="wechat-profile-avatar-placeholder">
                {contactName.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* 朋友圈栏 */}
        <div className="wechat-profile-moments-card">
          <div
            className="wechat-profile-moments-item"
            onClick={onViewMoments}
          >
            <div className="wechat-profile-moments-icon">📸</div>
            <div className="wechat-profile-moments-text">朋友圈</div>
            <div className="wechat-profile-moments-arrow">›</div>
          </div>
        </div>
      </div>
    </div>
  );
};

