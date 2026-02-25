import type { FC } from "react";
import { useState } from "react";
import {
  useWorldbook,
  type WorldbookAppId,
  type WorldbookEntry
} from "../../context/WorldbookContext";
import { useAiSettings } from "../../context/AiSettingsContext";
import { sendChatRequest } from "../../services/aiClient";

interface WorldbookScreenProps {
  onBackHome: () => void;
}

const APP_TABS: { id: WorldbookAppId; label: string; desc: string }[] = [
  { id: "wechat", label: "微信", desc: "用于聊天气泡里的 AI 回复" },
  { id: "xiaohongshu", label: "小红书", desc: "用于小红书风格的文案与分享" },
  { id: "weibo", label: "微博", desc: "用于碎碎念、公开动态相关的内容" },
  { id: "coupleSpace", label: "情侣空间", desc: "用于纪念日和双人小世界" },
  { id: "food", label: "外卖", desc: "用于点餐推荐、讨论吃什么" }
];

export const WorldbookScreen: FC<WorldbookScreenProps> = ({ onBackHome }) => {
  const {
    config,
    addAppWorldbook,
    updateAppWorldbook,
    addAppWorldbookItem,
    updateAppWorldbookItem,
    toggleAppWorldbookItemEnabled,
    deleteAppWorldbook,
    deleteAppWorldbookItem
  } = useWorldbook();
  const [activeTab, setActiveTab] = useState<WorldbookAppId>("wechat");
  const [creatingApp, setCreatingApp] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [newItems, setNewItems] = useState<{ id: string; title: string; content: string }[]>([
    { id: "item-0", title: "", content: "" }
  ]);
  const [editingWorldbookId, setEditingWorldbookId] = useState<string | null>(null);
  const [editingWorldbookTitle, setEditingWorldbookTitle] = useState("");
  const [editingItem, setEditingItem] = useState<{
    worldbookId: string;
    itemId: string;
  } | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState("");
  const [editingItemContent, setEditingItemContent] = useState("");
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatingKeyword, setGeneratingKeyword] = useState("");
  const [generatingTarget, setGeneratingTarget] = useState<{
    type: "editing" | "adding" | "creating";
    worldbookId?: string;
    itemId?: string;
    itemIndex?: number;
  } | null>(null);
  const { aiConfig } = useAiSettings();

  // 导入世界书功能
  const handleImportWorldbook = () => {
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

            // 验证导入数据格式
            if (!importData.worldbook || !importData.worldbook.title || !Array.isArray(importData.worldbook.entries)) {
              alert("导入文件格式不正确，请确保是从局部世界书导出的有效文件");
              return;
            }

            // 确认导入
            if (confirm(`确定要导入世界书"${importData.worldbook.title}"吗？\n\n这将把该世界书添加到当前"${APP_TABS.find((t) => t.id === activeTab)?.label}"应用的世界书中。`)) {
              // 转换导入的世界书格式，确保条目格式正确
              const items = importData.worldbook.entries.map((item: any) => ({
                title: item.title || "条目",
                content: item.content || ""
              }));

              // 添加到当前应用的世界书中
              addAppWorldbook(activeTab, importData.worldbook.title, items);
              alert(`✅ 导入成功！世界书"${importData.worldbook.title}"已添加到${APP_TABS.find((t) => t.id === activeTab)?.label}应用中。`);
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

  // AI生成世界书条目内容
  const handleGenerateWorldbookContent = async (
    appId: WorldbookAppId,
    worldbookTitle?: string,
    itemTitle?: string,
    keyword?: string,
    targetItemIndex?: number
  ) => {
    if (!aiConfig.baseUrl || !aiConfig.apiKey || !aiConfig.model) {
      alert("请先在设置应用中配置AI设置（Base URL、API Key和模型名称）！");
      return;
    }

    // 如果没有提供关键词，使用空字符串（AI会根据其他信息生成）
    const finalKeyword = keyword || itemTitle || "";

    setGeneratingContent(true);
    try {
      // 构建prompt，根据应用类型生成相应的世界书内容
      const appDescriptions: Record<WorldbookAppId, string> = {
        wechat: "微信聊天对话",
        xiaohongshu: "小红书风格的文案与分享",
        weibo: "微博碎碎念、公开动态",
        coupleSpace: "情侣空间的纪念日和双人小世界",
        food: "外卖点餐推荐、讨论吃什么"
      };

      const appDesc = appDescriptions[appId] || "应用";

      let prompt = `请为${appDesc}生成一条世界书条目内容。要求：

1. **条目标题**（如果提供了关键词"${finalKeyword}"或标题提示"${itemTitle || ""}"，请参考这些信息生成相关标题，控制在20字以内）
2. **条目内容**（详细的世界观设定、规则、角色描述等，控制在500字以内，要具体、清晰、实用）
3. 内容要符合${appDesc}的使用场景
4. 如果是角色描述，要包含角色的性格、说话风格、行为习惯等
5. 如果是世界观设定，要包含背景、规则、特殊设定等
6. 如果是规则说明，要包含具体的使用方法和注意事项
${finalKeyword ? `7. **重要**：生成的内容必须围绕关键词"${finalKeyword}"展开，确保内容与关键词高度相关\n` : ""}

${worldbookTitle ? `世界书名称：${worldbookTitle}\n` : ""}${itemTitle ? `标题提示：${itemTitle}\n` : ""}${finalKeyword ? `关键词：${finalKeyword}\n` : ""}

返回JSON格式：
{
  "title": "条目标题",
  "content": "条目内容（详细的世界观设定、规则、角色描述等）"
}

请返回JSON格式的内容：`;

      console.log("[handleGenerateWorldbookContent] 开始生成世界书内容...");
      const response = await sendChatRequest(aiConfig, [
        { role: "user", content: prompt }
      ]);

      console.log("[handleGenerateWorldbookContent] AI返回的原始内容:", response);

      // 尝试解析JSON
      let parsed: any = null;
      try {
        // 尝试直接解析
        parsed = JSON.parse(response);
      } catch (parseError) {
        // 如果直接解析失败，尝试提取JSON部分
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (extractError) {
            console.error("[handleGenerateWorldbookContent] 提取的JSON也无法解析:", extractError);
            throw new Error("AI返回的内容格式不正确，无法解析JSON");
          }
        } else {
          throw new Error("AI返回的内容不包含有效的JSON格式");
        }
      }

      if (parsed && (parsed.title || parsed.content)) {
        // 如果当前正在编辑条目，直接填充内容
        if (editingItem) {
          if (parsed.title) {
            setEditingItemTitle(parsed.title);
          }
          if (parsed.content) {
            setEditingItemContent(parsed.content);
          }
          alert("✅ AI生成成功！内容已填充到编辑框中，请检查并保存。");
        } else if (creatingApp && newItems.length > 0 && targetItemIndex !== undefined) {
          // 如果正在创建新世界书，填充到指定条目
          const updated = [...newItems];
          if (targetItemIndex >= 0 && targetItemIndex < updated.length) {
            if (parsed.title) {
              updated[targetItemIndex].title = parsed.title;
            }
            if (parsed.content) {
              updated[targetItemIndex].content = parsed.content;
            }
            setNewItems(updated);
            alert("✅ AI生成成功！内容已填充到当前条目中，请检查并保存。");
          }
        } else {
          // 如果没有正在编辑，提示用户
          alert(`✅ AI生成成功！\n标题：${parsed.title || "（无标题）"}\n内容：${parsed.content ? parsed.content.substring(0, 100) + "..." : "（无内容）"}\n\n请点击"编辑"按钮后使用"AI生成"功能来填充内容。`);
        }
      } else {
        throw new Error("AI返回的JSON格式不正确：缺少title或content字段");
      }
    } catch (error) {
      console.error("[handleGenerateWorldbookContent] 生成失败:", error);
      alert(`生成失败：${error instanceof Error ? error.message : error}\n请检查AI配置或稍后重试。`);
    } finally {
      setGeneratingContent(false);
      setGeneratingTarget(null);
      setGeneratingKeyword("");
    }
  };

  return (
    <div className="settings-screen wechat-screen">
      <header className="wechat-header wechat-chat-header">
        <button type="button" className="wechat-back-btn" onClick={onBackHome}>
          ‹ 桌面
        </button>
        <div className="wechat-title">
          <div className="wechat-title-main">世界书</div>
          <div className="wechat-title-sub">你的专属设定集</div>
        </div>
        <div className="wechat-header-right"></div>
      </header>

      <nav className="chat-settings-nav">
        {APP_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`chat-settings-nav-item ${activeTab === tab.id ? "chat-settings-nav-item-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="settings-body">
        <section className="soft-card settings-section">
          <div className="soft-card-header">
            <div className="soft-card-header-text">
              <div className="soft-card-title">{APP_TABS.find((t) => t.id === activeTab)?.label}世界书</div>
              <div className="soft-card-subtitle">
                {APP_TABS.find((t) => t.id === activeTab)?.desc}
              </div>
            </div>
            <div style={{ marginTop: "8px" }}>
              <button
                type="button"
                className="soft-icon-btn"
                onClick={handleImportWorldbook}
                title="从局部世界书导入"
                style={{
                  fontSize: "11px",
                  padding: "6px 12px",
                  whiteSpace: "nowrap"
                }}
              >
                📥 导入世界书
              </button>
            </div>
          </div>

            {config.perApp[activeTab]?.length ? (
              config.perApp[activeTab].map((entry: WorldbookEntry) => {
                const isEditingWorld = editingWorldbookId === entry.id;
                return (
                  <details key={entry.id} className="worldbook-entry">
                    <summary className="worldbook-entry-summary">
                      <span className="worldbook-entry-title">{entry.title}</span>
                      <span className="worldbook-entry-count">
                        共 {entry.entries.length} 条设定
                      </span>
                    </summary>
                    <div className="worldbook-entry-body">
                      {isEditingWorld ? (
                        <div className="worldbook-editor">
                          <label className="settings-label">世界书名称</label>
                          <input
                            className="settings-input"
                            value={editingWorldbookTitle}
                            onChange={(e) => setEditingWorldbookTitle(e.target.value)}
                            placeholder="世界书名称"
                          />
                          <button
                            type="button"
                            className="soft-icon-btn"
                            onClick={() => {
                              updateAppWorldbook(activeTab, entry.id, {
                                title: editingWorldbookTitle.trim() || "未命名世界"
                              });
                              setEditingWorldbookId(null);
                              setEditingWorldbookTitle("");
                            }}
                            style={{ marginTop: "8px" }}
                          >
                            完成编辑
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="worldbook-entry-item-header" style={{ margin: 0, border: "none", padding: 0 }}>
                            <span className="worldbook-entry-item-title">{entry.title}</span>
                            <div>
                              <button
                                type="button"
                                className="soft-icon-btn"
                                onClick={() => {
                                  setEditingWorldbookId(entry.id);
                                  setEditingWorldbookTitle(entry.title);
                                }}
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                className="soft-icon-btn"
                                onClick={() => deleteAppWorldbook(activeTab, entry.id)}
                                style={{ marginLeft: "6px" }}
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {entry.entries.map((item) => {
                        const isEditingItem =
                          editingItem && editingItem.worldbookId === entry.id && editingItem.itemId === item.id;
                        return (
                          <div key={item.id} className="worldbook-entry">
                            {isEditingItem ? (
                              <div className="worldbook-editor">
                                <label className="settings-label">条目标题</label>
                                <input
                                  className="settings-input"
                                  value={editingItemTitle}
                                  onChange={(e) => setEditingItemTitle(e.target.value)}
                                  placeholder="条目标题"
                                />
                                <label className="settings-label" style={{ marginTop: "6px" }}>
                                  条目内容
                                </label>
                                {/* 关键词输入和AI生成 */}
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
                                      generatingTarget?.worldbookId === entry.id &&
                                      generatingTarget?.itemId === item.id
                                        ? generatingKeyword
                                        : ""
                                    }
                                    onChange={(e) => {
                                      if (
                                        generatingTarget?.type === "editing" &&
                                        generatingTarget?.worldbookId === entry.id &&
                                        generatingTarget?.itemId === item.id
                                      ) {
                                        setGeneratingKeyword(e.target.value);
                                      } else {
                                        setGeneratingKeyword(e.target.value);
                                        setGeneratingTarget({
                                          type: "editing",
                                          worldbookId: entry.id,
                                          itemId: item.id
                                        });
                                      }
                                    }}
                                    placeholder="输入关键词，AI自动生成内容"
                                    style={{ flex: 1, fontSize: "12px" }}
                                    disabled={generatingContent}
                                  />
                                  <button
                                    type="button"
                                    className="soft-icon-btn"
                                    onClick={() => {
                                      const keyword = generatingTarget?.type === "editing" &&
                                        generatingTarget?.worldbookId === entry.id &&
                                        generatingTarget?.itemId === item.id
                                          ? generatingKeyword
                                          : "";
                                      handleGenerateWorldbookContent(activeTab, entry.title, editingItemTitle, keyword);
                                    }}
                                    disabled={
                                      generatingContent ||
                                      (generatingTarget?.type === "editing" &&
                                        generatingTarget?.worldbookId === entry.id &&
                                        generatingTarget?.itemId === item.id
                                        ? !generatingKeyword.trim()
                                        : false)
                                    }
                                    style={{
                                      whiteSpace: "nowrap",
                                      fontSize: "11px",
                                      padding: "6px 10px"
                                    }}
                                    title="使用AI生成条目内容"
                                  >
                                    {generatingContent &&
                                      generatingTarget?.type === "editing" &&
                                      generatingTarget?.worldbookId === entry.id &&
                                      generatingTarget?.itemId === item.id
                                        ? "生成中..."
                                        : "✨ 自动生成"}
                                  </button>
                                </div>
                                <textarea
                                  className="settings-textarea worldbook-textarea"
                                  value={editingItemContent}
                                  onChange={(e) => setEditingItemContent(e.target.value)}
                                  placeholder="条目内容..."
                                />
                                <button
                                  type="button"
                                  className="soft-icon-btn"
                                  onClick={() => {
                                    updateAppWorldbookItem(activeTab, entry.id, item.id, {
                                      title: editingItemTitle.trim() || "条目",
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
                                            toggleAppWorldbookItemEnabled(activeTab, entry.id, item.id);
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
                                          setEditingItem({ worldbookId: entry.id, itemId: item.id });
                                          setEditingItemTitle(item.title);
                                          setEditingItemContent(item.content);
                                          // 设置生成目标，以便关键词输入框正常工作
                                          setGeneratingTarget({
                                            type: "editing",
                                            worldbookId: entry.id,
                                            itemId: item.id
                                          });
                                          setGeneratingKeyword("");
                                        }}
                                      >
                                        编辑
                                      </button>
                                      <button
                                        type="button"
                                        className="soft-icon-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteAppWorldbookItem(activeTab, entry.id, item.id);
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
                          {editingItem?.worldbookId === entry.id && editingItem?.itemId === "new" ? (
                            <div className="worldbook-editor" style={{ marginTop: "10px" }}>
                              <div className="settings-field">
                                <label className="settings-label">条目标题（可选）</label>
                                <input
                                  className="settings-input"
                                  value={editingItemTitle}
                                  onChange={(e) => setEditingItemTitle(e.target.value)}
                                  placeholder="条目标题（可选）"
                                />
                                <label className="settings-label" style={{ marginTop: "6px" }}>
                                  条目内容
                                </label>
                                {/* 关键词输入和AI生成 */}
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
                                      generatingTarget?.worldbookId === entry.id
                                        ? generatingKeyword
                                        : ""
                                    }
                                    onChange={(e) => {
                                      if (
                                        generatingTarget?.type === "adding" &&
                                        generatingTarget?.worldbookId === entry.id
                                      ) {
                                        setGeneratingKeyword(e.target.value);
                                      } else {
                                        setGeneratingKeyword(e.target.value);
                                        setGeneratingTarget({
                                          type: "adding",
                                          worldbookId: entry.id
                                        });
                                      }
                                    }}
                                    placeholder="输入关键词，AI自动生成内容"
                                    style={{ flex: 1, fontSize: "12px" }}
                                    disabled={generatingContent}
                                  />
                                  <button
                                    type="button"
                                    className="soft-icon-btn"
                                    onClick={() => {
                                      const keyword = generatingTarget?.type === "adding" &&
                                        generatingTarget?.worldbookId === entry.id
                                          ? generatingKeyword
                                          : "";
                                      handleGenerateWorldbookContent(activeTab, entry.title, editingItemTitle, keyword);
                                    }}
                                    disabled={
                                      generatingContent ||
                                      (generatingTarget?.type === "adding" &&
                                        generatingTarget?.worldbookId === entry.id
                                        ? !generatingKeyword.trim()
                                        : false)
                                    }
                                    style={{
                                      whiteSpace: "nowrap",
                                      fontSize: "11px",
                                      padding: "6px 10px"
                                    }}
                                    title="使用AI生成条目内容"
                                  >
                                    {generatingContent &&
                                      generatingTarget?.type === "adding" &&
                                      generatingTarget?.worldbookId === entry.id
                                        ? "生成中..."
                                        : "✨ 自动生成"}
                                  </button>
                                </div>
                                <textarea
                                  className="settings-textarea"
                                  value={editingItemContent}
                                  onChange={(e) => setEditingItemContent(e.target.value)}
                                  placeholder="条目内容..."
                                  style={{ minHeight: "80px" }}
                                />
                              </div>
                              <button
                                type="button"
                                className="primary-pill-btn"
                                onClick={() => {
                                  if (editingItemTitle.trim() || editingItemContent.trim()) {
                                    addAppWorldbookItem(
                                      activeTab,
                                      entry.id,
                                      editingItemTitle.trim() || "条目",
                                      editingItemContent.trim()
                                    );
                                    setEditingItem(null);
                                    setEditingItemTitle("");
                                    setEditingItemContent("");
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
                                  setEditingItem(null);
                                  setEditingItemTitle("");
                                  setEditingItemContent("");
                                }}
                                style={{ marginTop: "6px" }}
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="primary-pill-btn"
                              onClick={() => {
                                setEditingItem({ worldbookId: entry.id, itemId: "new" });
                                setEditingItemTitle("");
                                setEditingItemContent("");
                                // 设置生成目标，以便关键词输入框正常工作
                                setGeneratingTarget({
                                  type: "adding",
                                  worldbookId: entry.id
                                });
                                setGeneratingKeyword("");
                              }}
                              style={{ marginTop: "10px" }}
                            >
                              + 添加条目
                            </button>
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
                  还没有世界书，点击下方按钮创建
                </p>
              </div>
            )}

            {!creatingApp ? (
              <button
                type="button"
                className="primary-pill-btn"
                onClick={() => {
                  setCreatingApp(true);
                  setDraftTitle("");
                  setNewItems([{ id: "item-0", title: "", content: "" }]);
                  // 重置生成目标
                  setGeneratingTarget(null);
                  setGeneratingKeyword("");
                }}
                style={{ marginTop: "10px" }}
              >
                + 创建新的世界书
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
                      {/* 关键词输入和AI生成 */}
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
                          disabled={generatingContent}
                        />
                        <button
                          type="button"
                          className="soft-icon-btn"
                          onClick={() => {
                            const keyword = generatingTarget?.type === "creating" &&
                              generatingTarget?.itemIndex === idx
                                ? generatingKeyword
                                : "";
                            handleGenerateWorldbookContent(activeTab, draftTitle, item.title, keyword, idx);
                          }}
                          disabled={
                            generatingContent ||
                            (generatingTarget?.type === "creating" &&
                              generatingTarget?.itemIndex === idx
                              ? !generatingKeyword.trim()
                              : false)
                          }
                          style={{
                            whiteSpace: "nowrap",
                            fontSize: "11px",
                            padding: "6px 10px"
                          }}
                          title="使用AI生成条目内容"
                        >
                          {generatingContent &&
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
                      setNewItems([...newItems, { id: `item-${newItems.length}`, title: "", content: "" }]);
                    }}
                    style={{ marginTop: "8px" }}
                  >
                    + 添加更多条目
                  </button>
                </div>
                <button
                  type="button"
                  className="primary-pill-btn"
                  onClick={() => {
                    const items = newItems
                      .map((it) => ({
                        title: it.title.trim(),
                        content: it.content.trim()
                      }))
                      .filter((it) => it.content);
                    if (!items.length) return;
                    addAppWorldbook(activeTab, draftTitle.trim() || "未命名世界", items);
                    setCreatingApp(false);
                    setDraftTitle("");
                    setNewItems([{ id: "item-0", title: "", content: "" }]);
                  }}
                  style={{ marginTop: "12px" }}
                >
                  创建世界书
                </button>
                <button
                  type="button"
                  className="soft-icon-btn"
                  onClick={() => {
                    setCreatingApp(false);
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
      </main>
    </div>
  );
};


