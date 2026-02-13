import type { FC } from "react";
import { useEffect, useState, useRef } from "react";
import type { WorldbookEntry, WorldbookEntryItem } from "../../context/WorldbookContext";
import { useAiSettings } from "../../context/AiSettingsContext";
import { sendChatRequest } from "../../services/aiClient";

type SettingsTab = "chatSettings" | "localWorldbook" | "chatBackground" | "replyPresets" | "memories";

export interface ChatStatus {
  id: string;
  text: string;
  emoji: string;
  description: string;
}

export const CHAT_STATUSES: ChatStatus[] = [
  // —— 在线 / 基础状态（参考微信/QQ）——
  { id: "quiet", text: "正在和你说悄悄话", emoji: "💭", description: "安静地陪伴着你" },
  { id: "online", text: "在线", emoji: "🟢", description: "现在就可以陪你聊天" },
  { id: "busy", text: "忙碌中", emoji: "⛔", description: "有点忙，可能会晚点回你" },
  { id: "dnd", text: "请勿打扰", emoji: "🌙", description: "暂时不想被打扰" },
  { id: "away", text: "暂时离开", emoji: "🕒", description: "离开一小会儿，很快回来" },
  { id: "sleeping", text: "睡觉中", emoji: "💤", description: "已经躺平睡着啦" },

  // —— 日常活动状态（更像 QQ 个性状态）——
  { id: "listening_music", text: "听歌中", emoji: "🎧", description: "边听歌边想你" },
  { id: "gaming", text: "游戏中", emoji: "🎮", description: "打完这一把就回你" },
  { id: "working", text: "工作中", emoji: "💼", description: "在努力搬砖赚钱" },
  { id: "studying", text: "学习中", emoji: "📚", description: "假装在认真学习" },
  { id: "commuting", text: "通勤中", emoji: "🚌", description: "在路上刷手机" },
  { id: "fishing", text: "摸鱼中", emoji: "🐟", description: "表面在忙，其实在想你" },

  // —— 氛围 / 心情状态（用于 AI 动态切换）——
  { id: "happy", text: "心情很好", emoji: "😊", description: "今天心情超好" },
  { id: "shy", text: "有点害羞", emoji: "😳", description: "被你撩得有点脸红" },
  { id: "confession", text: "正在和你说情话", emoji: "💘", description: "小心被甜到" },
  { id: "angry", text: "有点生气不理你", emoji: "😠", description: "需要你哄一哄" },
  { id: "story", text: "正在推进剧情", emoji: "📖", description: "故事正在慢慢展开" },
  { id: "missing", text: "想你了", emoji: "💕", description: "一不小心又想到你了" }
];

export interface ChatSettings {
  realName: string; // ta的真实姓名
  nickname: string; // 给ta的备注
  callMe: string; // ta称呼我为
  myIdentity: string; // 我的身份
  myGender: string; // 我的性别
  myOther: string; // 其他补充
  taIdentity: string; // ta的身份
  taGender: string; // ta的性别
  taOther: string; // ta的其他补充
  chatStyle: string; // 聊天风格
  opening: string; // 开场白
  status: string; // 当前状态ID
  customStatus: string; // 自定义状态文本
  avatar: string; // 角色头像（base64或URL）
  clothing: string; // 角色衣着
  clothingState: string; // 衣着状态（如：衣领被扯破、衣领被弄乱等）
  innerThoughts: string; // 内心想法（第一人称视角）
  genitalState: string; // 性器状态
  action: string; // 角色动作描述（描述角色此刻正保持着什么样的动作）
  desire: number; // 性欲值（0-100）
  mood: number; // 心情值（0-100）
  favorability: number; // 好感度（0-100）
  jealousy: number; // 醋意值（0-100）
  /** 聊天背景设置 */
  backgroundType?: "default" | "preset" | "customUrl" | "customUpload";
  backgroundValue?: string; // 预设或自定义 URL、本地上传的 dataURL
  signature?: string; // 个性签名
}

interface ChatSettingsScreenProps {
  chatId: string;
  chatName: string;
  onBack: () => void;
  initialTab?: SettingsTab;
}

interface HeartMemory {
  id: string;
  title: string;
  description: string;
  timestamp: number;
}

const STORAGE_KEY_PREFIX = "miniOtomePhone_chatSettings_";
const LOCAL_WORLDBOOK_KEY_PREFIX = "miniOtomePhone_localWorldbook_";
const CHAT_MEMORIES_KEY_PREFIX = "miniOtomePhone_chatMemories_";
const HEART_MEMORY_LAST_TURN_KEY_PREFIX = "miniOtomePhone_heartMemoryLastTurn_";
const MESSAGES_KEY_PREFIX = "miniOtomePhone_messages_";

export const ChatSettingsScreen: FC<ChatSettingsScreenProps> = ({
  chatId,
  chatName,
  onBack,
  initialTab
}) => {
  const { aiConfig } = useAiSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab ?? "chatSettings");
  const [settings, setSettings] = useState<ChatSettings>(() => {
    // 从localStorage读取保存的设置
    try {
      const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${chatId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    // 返回默认值
    return {
      realName: "",
      nickname: "",
      callMe: "",
      myIdentity: "",
      myGender: "",
      myOther: "",
      taIdentity: "",
      taGender: "",
      taOther: "",
      chatStyle: "",
      opening: "",
      status: "quiet",
      customStatus: "",
      avatar: "",
      clothing: "",
      clothingState: "",
      innerThoughts: "",
      genitalState: "",
      action: "",
      desire: 0,
      mood: 50,
      favorability: 50,
      jealousy: 0,
      backgroundType: "default",
      backgroundValue: ""
    };
  });

  // 保存设置到localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${chatId}`, JSON.stringify(settings));
      // 同标签页内通知微信主页刷新聊天列表（头像/备注等）
      window.dispatchEvent(new CustomEvent("miniOtomePhone:chatSettingsUpdated", { detail: { chatId } }));
    } catch {
      // ignore
    }
  }, [settings, chatId]);

  const updateField = (field: keyof ChatSettings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  // 局部世界书状态管理
  const [localWorldbooks, setLocalWorldbooks] = useState<WorldbookEntry[]>(() => {
    try {
      const stored = window.localStorage.getItem(`${LOCAL_WORLDBOOK_KEY_PREFIX}${chatId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [];
  });

  // 心动回忆（从 localStorage 读取，只读展示）
  const [heartMemories, setHeartMemories] = useState<HeartMemory[]>(() => {
    try {
      const stored = window.localStorage.getItem(`${CHAT_MEMORIES_KEY_PREFIX}${chatId}`);
      if (stored) {
        return JSON.parse(stored) as HeartMemory[];
      }
    } catch {
      // ignore
    }
    return [];
  });

  // 当组件挂载或 storage 更新时，刷新心动回忆
  useEffect(() => {
    const loadMemories = () => {
      try {
        const stored = window.localStorage.getItem(`${CHAT_MEMORIES_KEY_PREFIX}${chatId}`);
        if (stored) {
          setHeartMemories(JSON.parse(stored) as HeartMemory[]);
        } else {
          setHeartMemories([]);
        }
      } catch {
        setHeartMemories([]);
      }
    };

    loadMemories();

    const handler = () => loadMemories();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [chatId]);

  // 保存局部世界书到localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(
        `${LOCAL_WORLDBOOK_KEY_PREFIX}${chatId}`,
        JSON.stringify(localWorldbooks)
      );
    } catch {
      // ignore
    }
  }, [localWorldbooks, chatId]);

  const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const [creatingWorldbook, setCreatingWorldbook] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [newItems, setNewItems] = useState<{ id: string; title: string; content: string }[]>([
    { id: "item-0", title: "", content: "" }
  ]);
  const [editingWorldbookId, setEditingWorldbookId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{
    worldbookId: string;
    itemId: string;
  } | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState("");
  const [editingItemContent, setEditingItemContent] = useState("");
  const [addingItemToWorldbook, setAddingItemToWorldbook] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemContent, setNewItemContent] = useState("");
  
  // 自动生成相关状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingKeyword, setGeneratingKeyword] = useState("");
  const [generatingTarget, setGeneratingTarget] = useState<{
    type: "editing" | "adding" | "creating";
    worldbookId?: string;
    itemId?: string;
    itemIndex?: number;
  } | null>(null);
  
  // 用于自动聚焦输入框
  const editingItemTitleInputRef = useRef<HTMLInputElement>(null);
  
  // 当进入编辑模式时，自动聚焦输入框
  useEffect(() => {
    if (editingItem && editingItemTitleInputRef.current) {
      // 使用 setTimeout 确保 DOM 已更新
      setTimeout(() => {
        editingItemTitleInputRef.current?.focus();
      }, 100);
    }
  }, [editingItem]);

  const addWorldbook = () => {
    if (!draftTitle.trim()) return;
    const items = newItems.filter((item) => item.title.trim() || item.content.trim());
    if (items.length === 0) return;

    const newWorldbook: WorldbookEntry = {
      id: genId(),
      title: draftTitle.trim(),
      entries: items.map((item) => ({
        id: genId(),
        title: item.title.trim() || "条目",
        content: item.content.trim(),
        enabled: true
      }))
    };

    setLocalWorldbooks((prev) => [...prev, newWorldbook]);
    setDraftTitle("");
    setNewItems([{ id: "item-0", title: "", content: "" }]);
    setCreatingWorldbook(false);
  };

  const updateWorldbook = (id: string, patch: Partial<WorldbookEntry>) => {
    setLocalWorldbooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w))
    );
  };

  const deleteWorldbook = (id: string) => {
    setLocalWorldbooks((prev) => prev.filter((w) => w.id !== id));
  };

  const addWorldbookItem = (worldbookId: string, title: string, content: string) => {
    setLocalWorldbooks((prev) =>
      prev.map((w) =>
        w.id === worldbookId
          ? {
            ...w,
            entries: [
              ...w.entries,
              { id: genId(), title: title.trim() || "条目", content: content.trim(), enabled: true }
            ]
          }
          : w
      )
    );
  };

  const updateWorldbookItem = (
    worldbookId: string,
    itemId: string,
    patch: Partial<WorldbookEntryItem>
  ) => {
    setLocalWorldbooks((prev) =>
      prev.map((w) =>
        w.id === worldbookId
          ? {
            ...w,
            entries: w.entries.map((it) => (it.id === itemId ? { ...it, ...patch } : it))
          }
          : w
      )
    );
  };

  const deleteWorldbookItem = (worldbookId: string, itemId: string) => {
    setLocalWorldbooks((prev) =>
      prev.map((w) =>
        w.id === worldbookId
          ? { ...w, entries: w.entries.filter((it) => it.id !== itemId) }
          : w
      )
    );
  };

  const toggleItemEnabled = (worldbookId: string, itemId: string) => {
    setLocalWorldbooks((prev) =>
      prev.map((w) =>
        w.id === worldbookId
          ? {
              ...w,
              entries: w.entries.map((it) =>
                it.id === itemId ? { ...it, enabled: !it.enabled } : it
              )
            }
          : w
      )
    );
  };

  // 自动生成世界书条目内容
  const handleGenerateWorldbookContent = async (
    keyword: string,
    worldbookId?: string,
    itemId?: string,
    itemIndex?: number
  ) => {
    if (!keyword.trim() || isGenerating) return;

    setIsGenerating(true);
    const targetType = itemId ? "editing" : itemIndex !== undefined ? "creating" : "adding";
    setGeneratingTarget({ type: targetType, worldbookId, itemId, itemIndex });

    try {
      // 获取当前世界书和角色信息，用于生成更准确的内容
      let worldbookTitle = "";
      if (worldbookId) {
        const worldbook = localWorldbooks.find((w) => w.id === worldbookId);
        worldbookTitle = worldbook?.title || "";
      } else if (draftTitle) {
        worldbookTitle = draftTitle;
      }
      
      // 构建生成提示词
      const systemPrompt = `你是一个专业的角色设定助手。根据用户提供的关键词，生成完善的世界书条目内容。

要求：
1. 内容要详细、具体，符合角色设定的风格
2. 语言自然流畅，适合作为AI聊天的背景知识
3. 如果关键词涉及角色关系、场景、事件等，要展开描述细节
4. 内容长度控制在100-300字之间
5. 直接输出生成的内容，不要添加额外说明或格式标记

世界书名称：${worldbookTitle || "未命名"}
关键词：${keyword}`;

      const userPrompt = `请根据关键词"${keyword}"生成一个完善的世界书条目内容。`;

      const generatedContent = await sendChatRequest(aiConfig, [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]);

      // 清理生成的内容（移除可能的引号、格式标记等）
      let cleanedContent = generatedContent.trim();
      // 移除可能的引号包裹
      if (
        (cleanedContent.startsWith('"') && cleanedContent.endsWith('"')) ||
        (cleanedContent.startsWith("'") && cleanedContent.endsWith("'"))
      ) {
        cleanedContent = cleanedContent.slice(1, -1).trim();
      }
      // 移除可能的markdown代码块标记
      cleanedContent = cleanedContent.replace(/^```[\w]*\n?/g, "").replace(/\n?```$/g, "").trim();

      // 根据目标类型填充内容
      if (itemId) {
        // 编辑现有条目
        setEditingItemContent(cleanedContent);
      } else if (itemIndex !== undefined) {
        // 创建新世界书时的条目
        const updated = [...newItems];
        updated[itemIndex].content = cleanedContent;
        setNewItems(updated);
      } else {
        // 添加新条目
        setNewItemContent(cleanedContent);
      }
    } catch (error) {
      console.error("生成世界书内容失败:", error);
      alert(`生成失败：${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsGenerating(false);
      setGeneratingTarget(null);
      setGeneratingKeyword("");
    }
  };

  // 导出设定功能
  const handleExportSettings = () => {
    try {
      // 仅导出「聊天设定」和「局部世界书」本身，不包含运行时状态/数值
      // 从设定中剥离：在线状态、临时状态文本，以及好感度/心情等会在对话过程中动态变化的数据
      const {
        status,
        customStatus,
        clothing, // 衣着信息不随导出走，保持导入方使用自己的默认/当前衣着
        clothingState,
        innerThoughts,
        genitalState,
        desire,
        mood,
        favorability,
        jealousy,
        ...staticSettings
      } = settings;

      const exportData = {
        settings: staticSettings,
        localWorldbooks: localWorldbooks,
        exportTime: new Date().toISOString(),
        version: "1.0"
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `聊天设定_${chatName || chatId}_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("导出失败:", error);
      alert("导出失败，请重试");
    }
  };

  // 导出聊天记录和数据功能
  const handleExportChatData = () => {
    try {
      // 读取聊天记录
      let messages: any[] = [];
      try {
        const messagesStored = window.localStorage.getItem(`${MESSAGES_KEY_PREFIX}${chatId}`);
        if (messagesStored) {
          messages = JSON.parse(messagesStored);
        }
      } catch {
        // ignore
      }

      // 导出所有数据：聊天记录、聊天设置、局部世界书、心动回忆
      const exportData = {
        chatId: chatId,
        chatName: chatName,
        messages: messages,
        settings: settings,
        localWorldbooks: localWorldbooks,
        heartMemories: heartMemories,
        exportTime: new Date().toISOString(),
        version: "1.0"
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `聊天记录和数据_${chatName || chatId}_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert("导出成功！已导出聊天记录、角色设定、局部世界书和心动回忆。");
    } catch (error) {
      console.error("导出失败:", error);
      alert("导出失败，请重试");
    }
  };

  // 导入设定功能
  const handleImportSettings = () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,application/json";
      input.style.display = "none";
      input.style.position = "absolute";
      input.style.left = "-9999px";
      
      // 清理函数
      const cleanup = () => {
        try {
          if (input.parentNode) {
            document.body.removeChild(input);
          }
        } catch (e) {
          // 忽略清理错误
        }
      };
      
      // 在 iOS PWA 模式下，需要将 input 添加到 DOM 中
      document.body.appendChild(input);
      
      // 处理文件选择
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        
        if (!file) {
          cleanup();
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            cleanup();
            const content = event.target?.result as string;
            const importData = JSON.parse(content);

            // 验证导入数据格式（支持两种格式：仅设定，或完整数据）
            if (!importData.settings) {
              alert("导入文件格式不正确，请确保是有效的聊天设定文件");
              return;
            }

            // 确认导入
            if (confirm("导入设定将覆盖当前的聊天设定，是否继续？")) {
              // 更新设定
              setSettings(importData.settings);
              // 如果有局部世界书，也导入
              if (importData.localWorldbooks) {
                setLocalWorldbooks(importData.localWorldbooks || []);
              }
              alert("导入成功！");
            }
          } catch (error) {
            console.error("导入失败:", error);
            alert("导入失败，文件格式可能不正确");
          }
        };
        
        reader.onerror = () => {
          cleanup();
          alert("读取文件失败，请重试");
        };
        
        reader.readAsText(file);
      };
      
      // 在 iOS PWA 模式下，需要触发点击事件
      // 使用 requestAnimationFrame 确保 DOM 已更新
      requestAnimationFrame(() => {
        try {
          // 确保 input 在 DOM 中
          if (!input.parentNode) {
            document.body.appendChild(input);
          }
          input.click();
        } catch (error) {
          console.error("无法触发文件选择器:", error);
          cleanup();
          alert("无法打开文件选择器。在 iOS PWA 模式下，请确保从按钮点击触发导入功能。");
        }
      });
    } catch (error) {
      console.error("导入功能初始化失败:", error);
      alert("导入功能初始化失败，请重试");
    }
  };

  return (
    <div className="settings-screen wechat-screen">
      <header className="wechat-header wechat-chat-header">
        <button type="button" className="wechat-back-btn" onClick={onBack}>
          ‹ 返回
        </button>
        <div className="wechat-title">
          <div className="wechat-title-main">聊天设置</div>
          <div className="wechat-title-sub">{chatName}</div>
        </div>
        <div className="wechat-header-right">
          <button
            type="button"
            className="soft-icon-btn"
            onClick={() => {
              if (
                !window.confirm(
                  "确定要清除这位角色的聊天记录、心动回忆，并重置角色状态栏数值吗？此操作不可恢复。"
                )
              ) {
                return;
              }
              try {
                window.localStorage.removeItem(`${MESSAGES_KEY_PREFIX}${chatId}`);
                window.localStorage.removeItem(`${CHAT_MEMORIES_KEY_PREFIX}${chatId}`);
                window.localStorage.removeItem(
                  `${HEART_MEMORY_LAST_TURN_KEY_PREFIX}${chatId}`
                );
                // 立刻清空当前页面展示的心动回忆列表
                setHeartMemories([]);
                // 重置角色状态栏相关数据（进度条 / 状态文案 / 衣着）
                setSettings((prev) => ({
                  ...prev,
                  clothing: "",
                  clothingState: "",
                  innerThoughts: "",
                  genitalState: "",
                  desire: 0,
                  mood: 50,
                  favorability: 50,
                  jealousy: 0
                }));
                window.dispatchEvent(
                  new CustomEvent("miniOtomePhone:chatHistoryCleared", { detail: { chatId } })
                );
                alert("已清除该角色的聊天记录，并重置了状态栏数据。");
              } catch {
                // ignore
              }
            }}
            style={{
              whiteSpace: "nowrap",
              padding: "6px 14px",
              fontSize: "11px"
            }}
          >
            清除记录
          </button>
        </div>
      </header>

      <nav className="chat-settings-nav">
        <button
          type="button"
          className={`chat-settings-nav-item ${activeTab === "chatSettings" ? "chat-settings-nav-item-active" : ""}`}
          onClick={() => setActiveTab("chatSettings")}
        >
          聊天设定
        </button>
        <button
          type="button"
          className={`chat-settings-nav-item ${activeTab === "localWorldbook" ? "chat-settings-nav-item-active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("点击局部世界书按钮");
            setActiveTab("localWorldbook");
          }}
          style={{ position: "relative", zIndex: 10 }}
        >
          局部世界书
        </button>
        <button
          type="button"
          className={`chat-settings-nav-item ${activeTab === "chatBackground" ? "chat-settings-nav-item-active" : ""}`}
          onClick={() => setActiveTab("chatBackground")}
        >
          聊天背景
        </button>
        <button
          type="button"
          className={`chat-settings-nav-item ${activeTab === "replyPresets" ? "chat-settings-nav-item-active" : ""}`}
          onClick={() => setActiveTab("replyPresets")}
        >
          回复预设
        </button>
        <button
          type="button"
          className={`chat-settings-nav-item ${activeTab === "memories" ? "chat-settings-nav-item-active" : ""}`}
          onClick={() => setActiveTab("memories")}
        >
          心动回忆
        </button>
      </nav>

      <main className="settings-body">
        {activeTab === "chatSettings" && (
          <>
            <section className="soft-card settings-section">
              <div className="soft-card-header">
                <div className="soft-card-header-text">
                  <div className="soft-card-title">角色信息</div>
                  <div className="soft-card-subtitle">完善角色设定，让对话更真实</div>
                </div>
              </div>

              {/* 导出导入按钮栏 */}
              <div className="export-import-buttons" style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "16px",
                marginTop: "12px",
                padding: "10px",
                background: "rgba(255, 240, 252, 0.4)",
                borderRadius: "12px",
                border: "1px solid rgba(255, 195, 224, 0.5)",
                width: "100%",
                boxSizing: "border-box"
              }}>
                <div style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "nowrap",
                  gap: "6px"
                }}>
                  <button
                    type="button"
                    onClick={handleExportSettings}
                    title="导出设定（仅角色设定和局部世界书）"
                    style={{
                      flex: "1 1 0%",
                      padding: "8px 10px",
                      fontSize: "11px",
                      whiteSpace: "nowrap",
                      background: "#fff0fc",
                      border: "2px solid #ffc3e0",
                      borderRadius: "20px",
                      color: "#8b5a6b",
                      cursor: "pointer",
                      fontWeight: 600,
                      minWidth: 0,
                      maxWidth: "50%"
                    }}
                  >
                    📤 导出设定
                  </button>
                  <button
                    type="button"
                    onClick={handleImportSettings}
                    title="导入设定"
                    style={{
                      flex: "1 1 0%",
                      padding: "8px 10px",
                      fontSize: "11px",
                      whiteSpace: "nowrap",
                      background: "#fff0fc",
                      border: "2px solid #ffc3e0",
                      borderRadius: "20px",
                      color: "#8b5a6b",
                      cursor: "pointer",
                      fontWeight: 600,
                      minWidth: 0,
                      maxWidth: "50%"
                    }}
                  >
                    📥 导入设定
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleExportChatData}
                  title="导出聊天记录和数据（包含聊天记录、角色设定、局部世界书、心动回忆）"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                    background: "linear-gradient(135deg, #ffc3e0 0%, #ff9ec7 100%)",
                    border: "2px solid #ff9ec7",
                    borderRadius: "20px",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                    boxShadow: "0 2px 8px rgba(255, 158, 199, 0.3)"
                  }}
                >
                  💾 导出聊天记录和数据
                </button>
              </div>

              <div className="settings-field">
                <label className="settings-label">ta的真实姓名</label>
                <input
                  className="settings-input"
                  placeholder="请输入ta的真实姓名"
                  value={settings.realName}
                  onChange={(e) => updateField("realName", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">给ta的备注</label>
                <input
                  className="settings-input"
                  placeholder="请输入给ta的备注"
                  value={settings.nickname}
                  onChange={(e) => updateField("nickname", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">ta称呼我为</label>
                <input
                  className="settings-input"
                  placeholder="例如：宝贝、亲爱的、小可爱等"
                  value={settings.callMe}
                  onChange={(e) => updateField("callMe", e.target.value)}
                />
              </div>
            </section>

            <section className="soft-card settings-section">
              <div className="soft-card-header">
                <div className="soft-card-header-text">
                  <div className="soft-card-title">我的信息</div>
                  <div className="soft-card-subtitle">告诉ta关于你的信息</div>
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-label">我的身份</label>
                <input
                  className="settings-input"
                  placeholder="例如：学生、上班族、自由职业者等"
                  value={settings.myIdentity}
                  onChange={(e) => updateField("myIdentity", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">我的性别</label>
                <input
                  className="settings-input"
                  placeholder="例如：女、男、其他"
                  value={settings.myGender}
                  onChange={(e) => updateField("myGender", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">其他补充</label>
                <textarea
                  className="settings-textarea"
                  placeholder="关于你的其他补充信息..."
                  value={settings.myOther}
                  onChange={(e) => updateField("myOther", e.target.value)}
                />
              </div>
            </section>

            <section className="soft-card settings-section">
              <div className="soft-card-header">
                <div className="soft-card-header-text">
                  <div className="soft-card-title">ta的信息</div>
                  <div className="soft-card-subtitle">完善ta的角色设定</div>
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-label">角色头像</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
                  {/* 头像预览 */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      className="wechat-chat-avatar"
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "14px",
                        background: settings.avatar
                          ? "transparent"
                          : "radial-gradient(circle at 30% 30%, #fff7fb, #f9a8d4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0
                      }}
                    >
                      {settings.avatar ? (
                        <img
                          src={settings.avatar}
                          alt="角色头像"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                          onError={(e) => {
                            // 如果图片加载失败，清空头像
                            updateField("avatar", "");
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "24px" }}>🩷</span>
                      )}
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label
                        htmlFor="avatar-upload"
                        className="primary-pill-btn"
                        style={{
                          display: "inline-block",
                          cursor: "pointer",
                          textAlign: "center",
                          padding: "6px 12px",
                          fontSize: "12px"
                        }}
                      >
                        选择本地图片
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // 检查文件大小（限制5MB）
                            if (file.size > 5 * 1024 * 1024) {
                              alert("图片大小不能超过5MB");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const result = event.target?.result;
                              if (typeof result === "string") {
                                updateField("avatar", result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                  {/* URL输入 */}
                  <div>
                    <input
                      className="settings-input"
                      placeholder="或输入图片URL地址"
                      value={settings.avatar && !settings.avatar.startsWith("data:") ? settings.avatar : ""}
                      onChange={(e) => {
                        const url = e.target.value.trim();
                        if (url) {
                          updateField("avatar", url);
                        } else {
                          updateField("avatar", "");
                        }
                      }}
                    />
                  </div>
                  {/* 清除按钮 */}
                  {settings.avatar && (
                    <button
                      type="button"
                      className="soft-icon-btn"
                      onClick={() => updateField("avatar", "")}
                      style={{ alignSelf: "flex-start" }}
                    >
                      清除头像
                    </button>
                  )}
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-label">ta的身份</label>
                <input
                  className="settings-input"
                  placeholder="例如：学长、同事、邻居等"
                  value={settings.taIdentity}
                  onChange={(e) => updateField("taIdentity", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">ta的性别</label>
                <input
                  className="settings-input"
                  placeholder="例如：男、女、其他"
                  value={settings.taGender}
                  onChange={(e) => updateField("taGender", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">ta的其他补充</label>
                <textarea
                  className="settings-textarea"
                  placeholder="关于ta的其他补充信息..."
                  value={settings.taOther}
                  onChange={(e) => updateField("taOther", e.target.value)}
                />
              </div>
            </section>

            <section className="soft-card settings-section">
              <div className="soft-card-header">
                <div className="soft-card-header-text">
                  <div className="soft-card-title">聊天风格</div>
                  <div className="soft-card-subtitle">设定对话的基调</div>
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-label">聊天风格</label>
                <textarea
                  className="settings-textarea"
                  placeholder="例如：温柔体贴、活泼开朗、成熟稳重等"
                  value={settings.chatStyle}
                  onChange={(e) => updateField("chatStyle", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">开场白</label>
                <textarea
                  className="settings-textarea"
                  placeholder="设定对话的开场白..."
                  value={settings.opening}
                  onChange={(e) => updateField("opening", e.target.value)}
                />
              </div>
            </section>
          </>
        )}

        {activeTab === "localWorldbook" && (
          <section className="soft-card settings-section">
            <div className="soft-card-header">
              <div className="soft-card-header-text">
                <div className="soft-card-title">局部世界书</div>
                <div className="soft-card-subtitle">仅针对当前聊天的专属设定，不会影响其他聊天</div>
              </div>
            </div>

            {localWorldbooks.length > 0 ? (
              localWorldbooks.map((worldbook) => {
                const isEditingWorld = editingWorldbookId === worldbook.id;
                // 如果正在编辑该世界书的某个条目，确保 details 是打开的
                const hasEditingItem = editingItem?.worldbookId === worldbook.id;
                return (
                  <details key={worldbook.id} className="worldbook-entry" open={hasEditingItem || undefined}>
                    <summary className="worldbook-entry-summary">
                      <span className="worldbook-entry-title">{worldbook.title}</span>
                      <span className="worldbook-entry-count">
                        共 {worldbook.entries.length} 条设定
                      </span>
                    </summary>
                    <div className="worldbook-entry-body">
                      {isEditingWorld ? (
                        <div className="worldbook-editor">
                          <label className="settings-label">世界书名称</label>
                          <input
                            className="settings-input"
                            value={editingWorldbookId === worldbook.id ? worldbook.title : ""}
                            onChange={(e) => updateWorldbook(worldbook.id, { title: e.target.value })}
                            placeholder="世界书名称"
                          />
                          <button
                            type="button"
                            className="soft-icon-btn"
                            onClick={() => {
                              setEditingWorldbookId(null);
                            }}
                            style={{ marginTop: "8px" }}
                          >
                            完成编辑
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="worldbook-entry-item-header">
                            <span className="worldbook-entry-item-title">{worldbook.title}</span>
                            <div>
                              <button
                                type="button"
                                className="soft-icon-btn"
                                onClick={() => {
                                  // 导出单个世界书
                                  try {
                                    const exportData = {
                                      worldbook: worldbook,
                                      exportTime: new Date().toISOString(),
                                      version: "1.0",
                                      source: "localWorldbook"
                                    };
                                    const dataStr = JSON.stringify(exportData, null, 2);
                                    const dataBlob = new Blob([dataStr], { type: "application/json" });
                                    const url = URL.createObjectURL(dataBlob);
                                    const link = document.createElement("a");
                                    link.href = url;
                                    link.download = `世界书_${worldbook.title}_${new Date().toISOString().split("T")[0]}.json`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                    alert(`✅ 已导出世界书"${worldbook.title}"！\n\n你可以在桌面的"世界书"应用中导入此文件。`);
                                  } catch (error) {
                                    console.error("导出世界书失败:", error);
                                    alert("导出失败，请重试");
                                  }
                                }}
                                title="导出此世界书到全局世界书应用"
                                style={{ marginRight: "6px" }}
                              >
                                📤 导出
                              </button>
                              <button
                                type="button"
                                className="soft-icon-btn"
                                onClick={() => setEditingWorldbookId(worldbook.id)}
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                className="soft-icon-btn"
                                onClick={() => deleteWorldbook(worldbook.id)}
                                style={{ marginLeft: "6px" }}
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {worldbook.entries.map((item) => {
                        const isEditing = editingItem?.worldbookId === worldbook.id && editingItem?.itemId === item.id;
                        return (
                          <div key={item.id} className="worldbook-entry">
                            {isEditing ? (
                              <div className="worldbook-editor">
                                <label className="settings-label">条目标题</label>
                                <input
                                  ref={editingItemTitleInputRef}
                                  className="settings-input"
                                  value={editingItemTitle}
                                  onChange={(e) => setEditingItemTitle(e.target.value)}
                                  onTouchStart={(e) => {
                                    // 确保在触摸时能够获得焦点
                                    e.currentTarget.focus();
                                  }}
                                  onClick={(e) => {
                                    // 确保在点击时能够获得焦点
                                    e.currentTarget.focus();
                                  }}
                                  placeholder="条目标题"
                                  autoFocus
                                />
                                <label className="settings-label" style={{ marginTop: "6px" }}>
                                  条目内容
                                </label>
                                {/* 自动生成功能 */}
                                <div style={{
                                  display: "flex",
                                  gap: "6px",
                                  marginBottom: "6px",
                                  alignItems: "center"
                                }}>
                                  <input
                                    className="settings-input"
                                    value={
                                      generatingTarget?.type === "editing" &&
                                      generatingTarget?.worldbookId === worldbook.id &&
                                      generatingTarget?.itemId === item.id
                                        ? generatingKeyword
                                        : ""
                                    }
                                    onChange={(e) => {
                                      if (
                                        generatingTarget?.type === "editing" &&
                                        generatingTarget?.worldbookId === worldbook.id &&
                                        generatingTarget?.itemId === item.id
                                      ) {
                                        setGeneratingKeyword(e.target.value);
                                      } else {
                                        setGeneratingKeyword(e.target.value);
                                        setGeneratingTarget({
                                          type: "editing",
                                          worldbookId: worldbook.id,
                                          itemId: item.id
                                        });
                                      }
                                    }}
                                    placeholder="输入关键词，AI自动生成内容"
                                    style={{ flex: 1, fontSize: "12px" }}
                                    disabled={isGenerating}
                                  />
                                  <button
                                    type="button"
                                    className="soft-icon-btn"
                                    onClick={() => {
                                      const keyword = generatingTarget?.type === "editing" &&
                                        generatingTarget?.worldbookId === worldbook.id &&
                                        generatingTarget?.itemId === item.id
                                          ? generatingKeyword
                                          : "";
                                      if (keyword.trim()) {
                                        handleGenerateWorldbookContent(keyword, worldbook.id, item.id);
                                      }
                                    }}
                                    disabled={
                                      isGenerating ||
                                      !generatingKeyword.trim() ||
                                      (generatingTarget?.type === "editing" &&
                                        generatingTarget?.worldbookId === worldbook.id &&
                                        generatingTarget?.itemId === item.id
                                        ? !generatingKeyword.trim()
                                        : true)
                                    }
                                    style={{
                                      whiteSpace: "nowrap",
                                      fontSize: "11px",
                                      padding: "6px 10px"
                                    }}
                                  >
                                    {isGenerating &&
                                      generatingTarget?.type === "editing" &&
                                      generatingTarget?.worldbookId === worldbook.id &&
                                      generatingTarget?.itemId === item.id
                                        ? "生成中..."
                                        : "✨ 自动生成"}
                                  </button>
                                </div>
                                <textarea
                                  className="settings-textarea worldbook-textarea"
                                  value={editingItemContent}
                                  onChange={(e) => setEditingItemContent(e.target.value)}
                                  // 不再在点击/触摸时强制重置焦点，避免光标总是跳到末尾，导致无法在中间选中编辑
                                  placeholder="条目内容..."
                                />
                                <button
                                  type="button"
                                  className="soft-icon-btn"
                                  onClick={() => {
                                    updateWorldbookItem(worldbook.id, item.id, {
                                      title: editingItemTitle,
                                      content: editingItemContent
                                    });
                                    setEditingItem(null);
                                    setEditingItemTitle("");
                                    setEditingItemContent("");
                                  }}
                                  style={{ marginTop: "8px" }}
                                >
                                  保存
                                </button>
                                <button
                                  type="button"
                                  className="soft-icon-btn"
                                  onClick={() => {
                                    setEditingItem(null);
                                    setEditingItemTitle("");
                                    setEditingItemContent("");
                                  }}
                                  style={{ marginTop: "4px" }}
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <details className="worldbook-entry">
                                <summary className="worldbook-entry-summary" style={{ cursor: "pointer" }}>
                                  <div className="worldbook-entry-item-header" style={{ margin: 0, border: "none", padding: 0 }}>
                                    <div className="worldbook-entry-item-left">
                                      <span className="worldbook-entry-item-title">{item.title}</span>
                                      <label className="worldbook-toggle">
                                        <input
                                          type="checkbox"
                                          checked={item.enabled}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            toggleItemEnabled(worldbook.id, item.id);
                                          }}
                                        />
                                        <span className="worldbook-toggle-slider"></span>
                                      </label>
                                    </div>
                                    <div className="worldbook-entry-item-actions">
                                      <button
                                        type="button"
                                        className="soft-icon-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          setEditingItem({ worldbookId: worldbook.id, itemId: item.id });
                                          setEditingItemTitle(item.title);
                                          setEditingItemContent(item.content);
                                          // 设置生成目标，以便关键词输入框正常工作
                                          setGeneratingTarget({
                                            type: "editing",
                                            worldbookId: worldbook.id,
                                            itemId: item.id
                                          });
                                          setGeneratingKeyword("");
                                          // 确保外层的 worldbook details 是打开的
                                          // 通过向上查找找到外层的 worldbook details
                                          let element: HTMLElement | null = e.currentTarget as HTMLElement;
                                          while (element && element !== document.body) {
                                            if (element.tagName === 'DETAILS' && element.classList.contains('worldbook-entry')) {
                                              (element as HTMLDetailsElement).open = true;
                                              break;
                                            }
                                            element = element.parentElement;
                                          }
                                        }}
                                      >
                                        编辑
                                      </button>
                                      <button
                                        type="button"
                                        className="soft-icon-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteWorldbookItem(worldbook.id, item.id);
                                        }}
                                        style={{ marginLeft: "6px" }}
                                      >
                                        删除
                                      </button>
                                    </div>
                                  </div>
                                </summary>
                                <div className="worldbook-entry-body" style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed rgba(255, 195, 224, 0.5)" }}>
                                  <div className="worldbook-entry-item-content">{item.content}</div>
                                </div>
                              </details>
                            )}
                          </div>
                        );
                      })}

                      {!isEditingWorld && (
                        <>
                          {addingItemToWorldbook !== worldbook.id ? (
                            <button
                              type="button"
                              className="primary-pill-btn"
                              onClick={() => {
                                setAddingItemToWorldbook(worldbook.id);
                                setNewItemTitle("");
                                setNewItemContent("");
                                // 设置生成目标，以便关键词输入框正常工作
                                setGeneratingTarget({
                                  type: "adding",
                                  worldbookId: worldbook.id
                                });
                                setGeneratingKeyword("");
                              }}
                              style={{ marginTop: "10px" }}
                            >
                              + 添加条目
                            </button>
                          ) : (
                            <div className="worldbook-editor" style={{ marginTop: "10px" }}>
                              <div className="settings-field">
                                <label className="settings-label">条目标题（可选）</label>
                                <input
                                  className="settings-input"
                                  value={newItemTitle}
                                  onChange={(e) => setNewItemTitle(e.target.value)}
                                  placeholder="条目标题（可选）"
                                />
                                <label className="settings-label" style={{ marginTop: "6px" }}>
                                  条目内容
                                </label>
                                {/* 自动生成功能 */}
                                <div style={{
                                  display: "flex",
                                  gap: "6px",
                                  marginBottom: "6px",
                                  alignItems: "center"
                                }}>
                                  <input
                                    className="settings-input"
                                    value={
                                      generatingTarget?.type === "adding" &&
                                      generatingTarget?.worldbookId === worldbook.id
                                        ? generatingKeyword
                                        : ""
                                    }
                                    onChange={(e) => {
                                      if (
                                        generatingTarget?.type === "adding" &&
                                        generatingTarget?.worldbookId === worldbook.id
                                      ) {
                                        setGeneratingKeyword(e.target.value);
                                      } else {
                                        setGeneratingKeyword(e.target.value);
                                        setGeneratingTarget({
                                          type: "adding",
                                          worldbookId: worldbook.id
                                        });
                                      }
                                    }}
                                    placeholder="输入关键词，AI自动生成内容"
                                    style={{ flex: 1, fontSize: "12px" }}
                                    disabled={isGenerating}
                                  />
                                  <button
                                    type="button"
                                    className="soft-icon-btn"
                                    onClick={() => {
                                      const keyword = generatingTarget?.type === "adding" &&
                                        generatingTarget?.worldbookId === worldbook.id
                                          ? generatingKeyword
                                          : "";
                                      if (keyword.trim()) {
                                        handleGenerateWorldbookContent(keyword, worldbook.id);
                                      }
                                    }}
                                    disabled={
                                      isGenerating ||
                                      !generatingKeyword.trim() ||
                                      (generatingTarget?.type === "adding" &&
                                        generatingTarget?.worldbookId === worldbook.id
                                        ? !generatingKeyword.trim()
                                        : true)
                                    }
                                    style={{
                                      whiteSpace: "nowrap",
                                      fontSize: "11px",
                                      padding: "6px 10px"
                                    }}
                                  >
                                    {isGenerating &&
                                      generatingTarget?.type === "adding" &&
                                      generatingTarget?.worldbookId === worldbook.id
                                        ? "生成中..."
                                        : "✨ 自动生成"}
                                  </button>
                                </div>
                                <textarea
                                  className="settings-textarea"
                                  value={newItemContent}
                                  onChange={(e) => setNewItemContent(e.target.value)}
                                  placeholder="条目内容..."
                                  style={{ minHeight: "80px" }}
                                />
                              </div>
                              <button
                                type="button"
                                className="primary-pill-btn"
                                onClick={() => {
                                  if (newItemTitle.trim() || newItemContent.trim()) {
                                    addWorldbookItem(worldbook.id, newItemTitle, newItemContent);
                                    setNewItemTitle("");
                                    setNewItemContent("");
                                    setAddingItemToWorldbook(null);
                                  }
                                }}
                                style={{ marginTop: "12px" }}
                              >
                                添加条目
                              </button>
                              <button
                                type="button"
                                className="soft-icon-btn"
                                onClick={() => {
                                  setAddingItemToWorldbook(null);
                                  setNewItemTitle("");
                                  setNewItemContent("");
                                }}
                                style={{ marginTop: "6px" }}
                              >
                                取消
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </details>
                );
              })
            ) : (
              <div className="settings-field">
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-sub)",
                    textAlign: "center",
                    padding: "20px 0"
                  }}
                >
                  还没有局部世界书，点击下方按钮创建
                </p>
              </div>
            )}

            {!creatingWorldbook ? (
              <button
                type="button"
                className="primary-pill-btn"
                onClick={() => setCreatingWorldbook(true)}
                style={{ marginTop: "10px" }}
              >
                + 创建新的局部世界书
              </button>
            ) : (
              <div className="worldbook-editor" style={{ marginTop: "10px" }}>
                <label className="settings-label">世界书名称</label>
                <input
                  className="settings-input"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="例如：专属回忆、特殊约定等"
                />
                <div className="settings-field" style={{ marginTop: "10px" }}>
                  <label className="settings-label">条目列表</label>
                  {newItems.map((item, idx) => (
                    <div key={item.id} style={{ marginTop: idx > 0 ? "8px" : "4px" }}>
                      <input
                        className="settings-input"
                        value={item.title}
                        onChange={(e) => {
                          const updated = [...newItems];
                          updated[idx].title = e.target.value;
                          setNewItems(updated);
                        }}
                        placeholder="条目标题（可选）"
                        style={{ marginBottom: "4px" }}
                      />
                      {/* 自动生成功能 */}
                      <div style={{
                        display: "flex",
                        gap: "6px",
                        marginBottom: "6px",
                        alignItems: "center"
                      }}>
                        <input
                          className="settings-input"
                          value={
                            generatingTarget?.type === "creating" &&
                            generatingTarget?.itemIndex === idx
                              ? generatingKeyword
                              : ""
                          }
                          onChange={(e) => {
                            if (
                              generatingTarget?.type === "creating" &&
                              generatingTarget?.itemIndex === idx
                            ) {
                              setGeneratingKeyword(e.target.value);
                            } else {
                              setGeneratingKeyword(e.target.value);
                              setGeneratingTarget({
                                type: "creating",
                                itemIndex: idx
                              });
                            }
                          }}
                          placeholder="输入关键词，AI自动生成内容"
                          style={{ flex: 1, fontSize: "12px" }}
                          disabled={isGenerating}
                        />
                        <button
                          type="button"
                          className="soft-icon-btn"
                          onClick={() => {
                            const keyword = generatingTarget?.type === "creating" &&
                              generatingTarget?.itemIndex === idx
                                ? generatingKeyword
                                : "";
                            if (keyword.trim()) {
                              handleGenerateWorldbookContent(keyword, undefined, undefined, idx);
                            }
                          }}
                          disabled={
                            isGenerating ||
                            !generatingKeyword.trim() ||
                            (generatingTarget?.type === "creating" &&
                              generatingTarget?.itemIndex === idx
                              ? !generatingKeyword.trim()
                              : true)
                          }
                          style={{
                            whiteSpace: "nowrap",
                            fontSize: "11px",
                            padding: "6px 10px"
                          }}
                        >
                          {isGenerating &&
                            generatingTarget?.type === "creating" &&
                            generatingTarget?.itemIndex === idx
                              ? "生成中..."
                              : "✨ 自动生成"}
                        </button>
                      </div>
                      <textarea
                        className="settings-textarea"
                        value={item.content}
                        onChange={(e) => {
                          const updated = [...newItems];
                          updated[idx].content = e.target.value;
                          setNewItems(updated);
                        }}
                        placeholder="条目内容..."
                        style={{ minHeight: "80px" }}
                      />
                      {newItems.length > 1 && (
                        <button
                          type="button"
                          className="soft-icon-btn"
                          onClick={() => {
                            setNewItems(newItems.filter((_, i) => i !== idx));
                          }}
                          style={{ marginTop: "4px" }}
                        >
                          删除此项
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="soft-icon-btn"
                    onClick={() => {
                      setNewItems([...newItems, { id: genId(), title: "", content: "" }]);
                    }}
                    style={{ marginTop: "8px" }}
                  >
                    + 添加更多条目
                  </button>
                </div>
                <button
                  type="button"
                  className="primary-pill-btn"
                  onClick={addWorldbook}
                  style={{ marginTop: "12px" }}
                >
                  创建世界书
                </button>
                <button
                  type="button"
                  className="soft-icon-btn"
                  onClick={() => {
                    setCreatingWorldbook(false);
                    setDraftTitle("");
                    setNewItems([{ id: "item-0", title: "", content: "" }]);
                  }}
                  style={{ marginTop: "6px" }}
                >
                  取消
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === "chatBackground" && (
          <section className="soft-card settings-section">
            <div className="soft-card-header">
              <div className="soft-card-header-text">
                <div className="soft-card-title">聊天背景</div>
                <div className="soft-card-subtitle">为这位角色单独设置聊天背景</div>
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label">预设背景</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                {[
                  "https://c-ssl.duitang.com/uploads/blog/202302/24/20230224210227_875bf.png",
                  "https://ts4.tc.mm.bing.net/th/id/OIP-C.n_f7vIw6QF9MT118r9Xg6AHaPh?pid=ImgDet&w=474&h=993&rs=1&o=7&rm=3",
                  "https://pic1.zhimg.com/v2-a8f301a2fec7aca4dcb4ee5b9154ccc8_1440w.jpg",
                  "https://pica.zhimg.com/v2-ba9d8b6ecb1dcc6afd1f41fe9f3ead9c_r.jpg",
                  "https://picx.zhimg.com/v2-1845a2a947c086d6c85a97805da9c6e3_r.jpg",
                  "https://pic3.zhimg.com/v2-d58744fe1c214b9a80f1d16739bdfda8_r.jpg",
                  "https://picx.zhimg.com/v2-ddf5065b5c9cf13591eb1a33defda5f7_r.jpg",
                  "https://pic2.zhimg.com/v2-e718a4dffabaf6f361a04afcb01c087d_r.jpg",
                  "https://pica.zhimg.com/v2-42ad97f554f3d6e61b1050878af2d6a6_r.jpg"
                ].map((url) => {
                  const isActive =
                    settings.backgroundType === "preset" && settings.backgroundValue === url;
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => {
                        setSettings((prev) => ({
                          ...prev,
                          backgroundType: "preset",
                          backgroundValue: url
                        }));
                      }}
                      style={{
                        borderRadius: "10px",
                        padding: 0,
                        border: isActive
                          ? "2px solid var(--accent-pink)"
                          : "1px solid rgba(148, 163, 184, 0.5)",
                        overflow: "hidden",
                        width: "72px",
                        height: "120px",
                        cursor: "pointer",
                        background: "#f9fafb"
                      }}
                    >
                      <img
                        src={url}
                        alt="预设背景"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="settings-field" style={{ marginTop: "14px" }}>
              <label className="settings-label">自定义图片 URL</label>
              <input
                className="settings-input"
                placeholder="粘贴一张图片的链接"
                value={
                  settings.backgroundType === "customUrl" ? settings.backgroundValue || "" : ""
                }
                onChange={(e) => {
                  const value = e.target.value.trim();
                  setSettings((prev) => ({
                    ...prev,
                    backgroundType: value ? "customUrl" : "default",
                    backgroundValue: value
                  }));
                }}
              />
              <div style={{ fontSize: "11px", color: "var(--text-sub)", marginTop: "4px" }}>
                建议使用 https 前缀的稳定图片链接。
              </div>
            </div>

            <div className="settings-field" style={{ marginTop: "14px" }}>
              <label className="settings-label">从本地上传壁纸</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = typeof reader.result === "string" ? reader.result : "";
                    if (!dataUrl) return;
                    setSettings((prev) => ({
                      ...prev,
                      backgroundType: "customUpload",
                      backgroundValue: dataUrl
                    }));
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <div style={{ fontSize: "11px", color: "var(--text-sub)", marginTop: "4px" }}>
                图片会保存在本地浏览器，不会上传到服务器。
              </div>
            </div>

            <div className="settings-field" style={{ marginTop: "16px" }}>
              <button
                type="button"
                className="soft-icon-btn"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    backgroundType: "default",
                    backgroundValue: ""
                  }))
                }
              >
                恢复默认背景
              </button>
            </div>
          </section>
        )}

        {activeTab === "replyPresets" && (
          <section className="soft-card settings-section">
            <div className="soft-card-header">
              <div className="soft-card-header-text">
                <div className="soft-card-title">回复预设</div>
                <div className="soft-card-subtitle">预设常用回复，让对话更流畅</div>
              </div>
            </div>
            <div className="settings-field">
              <p style={{ fontSize: "12px", color: "var(--text-sub)", textAlign: "center", padding: "20px 0" }}>
                回复预设功能开发中...
              </p>
            </div>
          </section>
        )}

        {activeTab === "memories" && (
          <section className="soft-card settings-section">
            <div className="soft-card-header">
              <div className="soft-card-header-text">
                <div className="soft-card-title">心动回忆</div>
                <div className="soft-card-subtitle">像时间线一样，记录你们每一次关系推进的小节点</div>
              </div>
            </div>
            <div className="settings-field">
              {heartMemories.length === 0 ? (
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-sub)",
                    textAlign: "center",
                    padding: "20px 0"
                  }}
                >
                  目前还没有心动回忆。继续和 ta 聊天，AI 会在合适的时机为你记录小进展～
                </p>
              ) : (
                <ul className="memories-timeline">
                  {heartMemories
                    .slice()
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map((mem) => {
                      const date = new Date(mem.timestamp);
                      const timeLabel = date.toLocaleString("zh-CN", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                      return (
                        <li key={mem.id} className="memories-item">
                          <div className="memories-dot" />
                          <div className="memories-content">
                            <div className="memories-title">{mem.title}</div>
                            <div className="memories-time">{timeLabel}</div>
                            <div className="memories-desc">{mem.description}</div>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

