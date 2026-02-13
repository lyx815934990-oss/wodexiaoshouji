import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export type WorldbookAppId = "wechat" | "xiaohongshu" | "weibo" | "coupleSpace" | "food";

export interface WorldbookEntryItem {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
}

export interface WorldbookEntry {
  id: string;
  title: string;
  entries: WorldbookEntryItem[];
}

export interface WorldbookConfig {
  /** 全局默认世界书（所有应用共用的背景设定，折叠成多本世界书） */
  global: WorldbookEntry[];
  /** 各应用单独的世界书，会在需要时和 global 合并使用 */
  perApp: Record<WorldbookAppId, WorldbookEntry[]>;
}

interface WorldbookContextValue {
  config: WorldbookConfig;
  addGlobalWorldbook: (title: string, content: string) => void;
  updateGlobalWorldbook: (id: string, patch: Partial<WorldbookEntry>) => void;
  addAppWorldbook: (
    appId: WorldbookAppId,
    title: string,
    items: { title: string; content: string }[]
  ) => void;
  updateAppWorldbook: (
    appId: WorldbookAppId,
    id: string,
    patch: Partial<WorldbookEntry>
  ) => void;
  addAppWorldbookItem: (
    appId: WorldbookAppId,
    worldbookId: string,
    title: string,
    content: string
  ) => void;
  updateAppWorldbookItem: (
    appId: WorldbookAppId,
    worldbookId: string,
    itemId: string,
    patch: Partial<WorldbookEntryItem>
  ) => void;
  toggleAppWorldbookItemEnabled: (
    appId: WorldbookAppId,
    worldbookId: string,
    itemId: string
  ) => void;
  deleteAppWorldbook: (appId: WorldbookAppId, worldbookId: string) => void;
  deleteAppWorldbookItem: (
    appId: WorldbookAppId,
    worldbookId: string,
    itemId: string
  ) => void;
}

const STORAGE_KEY = "miniOtomePhone_full_Worldbook_v1";

const defaultWorldbook: WorldbookConfig = {
  global: [],
  perApp: {
    wechat: [
      {
        id: "wechat-default-world",
        title: "微信对话模式规则",
        entries: [
          {
            id: "wechat-online-chat",
            title: "纯线上聊天模式（默认）",
            enabled: true,
            content:
              "【用途】用于微信里大部分日常对话、碎碎念与陪伴场景。\n" +
              "1. 始终以角色的第一人称视角发消息给玩家，只用\"我\"来表达自己，玩家必须用\"你\"称呼，不要写\"他/她觉得……\"或\"他/她\"。\n" +
              "2. 严禁使用第三人称叙事或上帝视角的旁白描写，不要写\"他揉了揉头发\"\"他在心里想\"等说明性句子，只能像真实微信聊天那样发消息。\n" +
              "3. 尽量避免直接罗列心理活动的说明句（例如\"我心里很难过\"），优先通过聊天内容本身、语气和用词侧面表现情绪。\n" +
              "4. 可以发送\"语音消息气泡\"。**语音要有活人感，像真人说话一样自然**：可以有语气变化、停顿、情绪波动，不要机械化、不要像AI朗读。可以有一些口语化的表达，比如\"嗯...\"、\"那个...\"、\"就是...\"等。语音气泡里的文字只能是【声音的描写】，例如呼吸、停顿、笑声、语气高低、说话快慢等；禁止在语音内容中出现角色的心理活动、肢体动作、环境描写或上帝视角说明。\n" +
              "5. 语音气泡内部允许出现\"说出的内容本身\"和\"对声音的额外描写\"：说出的内容直接写为普通文本，不要加任何引号；对声音的额外描写用中文括号括起来，要生动自然，不要机械化，例如：你在干嘛呢（声音有点闷闷的，像是刚睡醒，还带着点鼻音）、嗯...我想想啊（声音轻快，尾音上扬，带着笑意）。\n" +
              "6. 括号里的文字只能描写声音听起来的感觉，要生动自然，不要机械化，例如可以写\"（声音有点沙哑，像是刚哭过）\"\"（声音轻快，尾音上扬）\"\"（声音低沉，带着点疲惫）\"，但不要在括号中写心理活动、肢体动作或环境描写，例如不要写\"（我在心里紧张地想……）\"\"（他在电话那头活动身体）\"。\n" +
              "7. 允许使用的消息类型：文字消息、语音消息、语音通话、红包、转账、图片、位置、表情包。不同类型可以用合适的标记（如括号提示）表现，但不要跳出角色视角去说“系统提示”。\n" +
              "8. 回复时可以把一段话自然拆成多条连续气泡发送，模拟真实微信聊天节奏，不需要把所有内容都塞进同一个长气泡，但也不要为了拆而刻意制造很多很碎的气泡。\n" +
              "9. 若后续增加新的消息类型，也必须默认遵守上述第一人称聊天原则与人设不 OOC 的要求。"
          },
          {
            id: "wechat-story-mode",
            title: "剧情模式",
            enabled: true,
            content:
              "【用途】适用于需要更强叙事性的桥段，例如关键剧情推进、回忆杀、线下事件描写等。输出格式要像网文小说一样，让玩家像在阅读小说。\n" +
              "1. **必须使用第三人称叙事**，像网文小说一样描写场景、动作、氛围和人物状态，例如「他垂下视线，手指在屏幕上停顿了一下」、「她看着手机屏幕，嘴角不自觉地扬起一抹笑意」。\n" +
              "2. **禁止使用任何线上聊天格式**：不要发送微信消息气泡、语音消息、表情包、红包等任何线上聊天元素。所有内容都要用第三人称叙事来呈现，就像在写小说一样。\n" +
              "3. **允许细腻的心理描写和情绪描写**：可以直接描写角色的内心想法、感受和情绪，例如「他心里其实有点紧张，只是不太敢说出来」、「她忍不住在心里想，这个人怎么这么可爱」。这些描写要生动自然，符合角色人设。\n" +
              "4. **对话必须用双引号包裹（重要）**：所有角色说话的内容（无论是直接引语还是间接引语中的对话部分）都必须用双引号包裹。**严禁使用书名号「」、方括号[]或其他符号来包裹对话**，只能使用双引号。可以使用中文双引号（\"和\"）或英文双引号（\"），但必须成对使用。示例格式：他轻声说道：\"你在干嘛呢？\"声音里带着一丝慵懒。或者：她看着你，忍不住笑了：\"你真可爱\"。场景描写和叙述性文字不要用引号，只有说话的内容才用引号。\n" +
              "5. **可以描写线下场景**：允许描述见面、约会、拥抱、日常互动等线下行为，用叙事和对话来呈现过程，营造小说般的画面感。\n" +
              "6. **严格遵守角色设定**：不论是心理描写、对话还是行为描写，都必须符合角色既定人设，说话方式、行为习惯、情绪反应要统一，避免出现与人物性格不符的举动或台词（禁止 OOC）。\n" +
              "7. **输出格式要求**：纯文本叙事，不要使用任何特殊格式标记、气泡样式或聊天界面元素。就像在阅读一本网文小说一样，流畅自然地推进剧情。\n" +
              "8. **重要：一轮生成一长段内容**：每次回复时，必须生成一段完整的长文本内容，不要分成多个短段落或内容框。整段内容应该连贯流畅，像小说的一章或一个场景，让玩家能够连续阅读。\n" +
              "9. 若当前故事切回单纯日常聊天场景，可以从剧情模式自然收束，重新回到更轻量的一人称聊天输出。"
          }
        ]
      }
    ],
    xiaohongshu: [],
    weibo: [],
    coupleSpace: [],
    food: []
  }
};

const WorldbookContext = createContext<WorldbookContextValue | null>(null);

export function WorldbookProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<WorldbookConfig>(() => {
    if (typeof window === "undefined") return defaultWorldbook;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultWorldbook;
      const parsed = JSON.parse(raw) as any;

      // 兼容旧版本：如果之前存的是字符串而不是数组，直接丢弃旧值避免报错
      const normalizeEntries = (entries: any[] | undefined): WorldbookEntryItem[] =>
        (entries ?? []).map((it: any, idx: number) => ({
          id: typeof it?.id === "string" ? it.id : `item-${idx}`,
          title: typeof it?.title === "string" ? it.title : "条目",
          content: typeof it?.content === "string" ? it.content : "",
          enabled: typeof it?.enabled === "boolean" ? it.enabled : true
        }));

      const normalizeWorldbooks = (ws: any[] | undefined): WorldbookEntry[] =>
        (ws ?? []).map((w: any, idx: number) => ({
          id: typeof w?.id === "string" ? w.id : `wb-${idx}`,
          title: typeof w?.title === "string" ? w.title : "未命名世界",
          entries: normalizeEntries(w?.entries)
        }));

      let safeGlobal: WorldbookEntry[] = Array.isArray(parsed.global)
        ? normalizeWorldbooks(parsed.global)
        : defaultWorldbook.global;

      const safePerApp: Record<WorldbookAppId, WorldbookEntry[]> = {
        ...defaultWorldbook.perApp
      };
      if (parsed.perApp && typeof parsed.perApp === "object") {
        (Object.keys(defaultWorldbook.perApp) as WorldbookAppId[]).forEach((key) => {
          const v = parsed.perApp[key];
          safePerApp[key] = Array.isArray(v) ? normalizeWorldbooks(v) : defaultWorldbook.perApp[key];
        });
      }

      // 确保微信默认世界书始终追加存在：如果用户已有自建世界书，就在后面再补一份默认规则，不覆盖原有内容
      const hasWechatDefault =
        safePerApp.wechat &&
        safePerApp.wechat.some(
          (w) => w.id === "wechat-default-world" || w.title === "微信对话模式规则"
        );
      if (!hasWechatDefault) {
        safePerApp.wechat = [...(safePerApp.wechat ?? []), ...defaultWorldbook.perApp.wechat];
      }

      // 同步微信「纯线上聊天模式（默认）」条目的最新默认文案
      // 只在条目内容还明显是旧版时才覆盖，避免误伤用户手动修改过的设定
      try {
        const defaultWechatWorld = defaultWorldbook.perApp.wechat.find(
          (w) => w.id === "wechat-default-world" || w.title === "微信对话模式规则"
        );
        const defaultOnlineChat =
          defaultWechatWorld?.entries.find(
            (it) => it.id === "wechat-online-chat" || it.title === "纯线上聊天模式（默认）"
          ) ?? null;

        if (defaultOnlineChat && safePerApp.wechat) {
          safePerApp.wechat = safePerApp.wechat.map((world) => {
            if (world.id === "wechat-default-world" || world.title === "微信对话模式规则") {
              return {
                ...world,
                entries: world.entries.map((item) => {
                  if (item.id === "wechat-online-chat" || item.title === "纯线上聊天模式（默认）") {
                    const isOldVersion =
                      !item.content.includes("语音气泡里的文字只能是【声音相关的内容】") &&
                      !item.content.includes("语音气泡里的文字只能是【声音的描写】");
                    if (isOldVersion) {
                      return {
                        ...item,
                        title: defaultOnlineChat.title,
                        content: defaultOnlineChat.content
                      };
                    }
                  }
                  return item;
                })
              };
            }
            return world;
          });
        }
      } catch {
        // 如果同步失败，不影响世界书的基础加载
      }

      // 同步微信「剧情模式」条目的最新默认文案
      // 只在条目内容还明显是旧版时才覆盖，避免误伤用户手动修改过的设定
      try {
        const defaultWechatWorld = defaultWorldbook.perApp.wechat.find(
          (w) => w.id === "wechat-default-world" || w.title === "微信对话模式规则"
        );
        const defaultStoryMode =
          defaultWechatWorld?.entries.find(
            (it) => it.id === "wechat-story-mode" || it.title === "剧情模式"
          ) ?? null;

        if (defaultStoryMode && safePerApp.wechat) {
          safePerApp.wechat = safePerApp.wechat.map((world) => {
            if (world.id === "wechat-default-world" || world.title === "微信对话模式规则") {
              return {
                ...world,
                entries: world.entries.map((item) => {
                  if (item.id === "wechat-story-mode" || item.title === "剧情模式") {
                    // 检查是否是旧版本（不包含"一轮生成一长段内容"、"对话必须用双引号包裹"或"严禁使用书名号"的要求）
                    const isOldVersion = 
                      !item.content.includes("一轮生成一长段内容") ||
                      !item.content.includes("对话必须用双引号包裹") ||
                      !item.content.includes("严禁使用书名号");
                    if (isOldVersion) {
                      return {
                        ...item,
                        title: defaultStoryMode.title,
                        content: defaultStoryMode.content
                      };
                    }
                  }
                  return item;
                })
              };
            }
            return world;
          });
        }
      } catch {
        // 如果同步失败，不影响世界书的基础加载
      }

      return {
        global: safeGlobal,
        perApp: safePerApp
      };
    } catch {
      return defaultWorldbook;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  const value = useMemo<WorldbookContextValue>(() => {
    const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    return {
      config,
      addGlobalWorldbook: (title, content) =>
        setConfig((prev) => ({
          ...prev,
          global: [
            ...prev.global,
            {
              id: genId(),
              title: title || "未命名世界",
              entries: [
                {
                  id: genId(),
                  title: title || "条目",
                  content,
                  enabled: true
                }
              ]
            }
          ]
        })),
      updateGlobalWorldbook: (id, patch) =>
        setConfig((prev) => ({
          ...prev,
          global: prev.global.map((w) => (w.id === id ? { ...w, ...patch } : w))
        })),
      addAppWorldbook: (appId, title, items) =>
        setConfig((prev) => ({
          ...prev,
          perApp: {
            ...prev.perApp,
            [appId]: [
              ...(prev.perApp[appId] ?? []),
              {
                id: genId(),
                title: title || "未命名世界",
                entries: items.map((it) => ({
                  id: genId(),
                  title: it.title || "条目",
                  content: it.content,
                  enabled: true
                }))
              }
            ]
          }
        })),
      updateAppWorldbook: (appId, id, patch) =>
        setConfig((prev) => ({
          ...prev,
          perApp: {
            ...prev.perApp,
            [appId]: (prev.perApp[appId] ?? []).map((w) =>
              w.id === id ? { ...w, ...patch } : w
            )
          }
        })),
      addAppWorldbookItem: (appId, worldbookId, title, content) =>
        setConfig((prev) => ({
          ...prev,
          perApp: {
            ...prev.perApp,
            [appId]: (prev.perApp[appId] ?? []).map((w) =>
              w.id === worldbookId
                ? {
                  ...w,
                  entries: [
                    ...w.entries,
                    {
                      id: genId(),
                      title: title || "条目",
                      content,
                      enabled: true
                    }
                  ]
                }
                : w
            )
          }
        })),
      updateAppWorldbookItem: (appId, worldbookId, itemId, patch) =>
        setConfig((prev) => ({
          ...prev,
          perApp: {
            ...prev.perApp,
            [appId]: (prev.perApp[appId] ?? []).map((w) =>
              w.id === worldbookId
                ? {
                  ...w,
                  entries: w.entries.map((it) =>
                    it.id === itemId ? { ...it, ...patch } : it
                  )
                }
                : w
            )
          }
        })),
      toggleAppWorldbookItemEnabled: (appId, worldbookId, itemId) =>
        setConfig((prev) => ({
          ...prev,
          perApp: {
            ...prev.perApp,
            [appId]: (prev.perApp[appId] ?? []).map((w) =>
              w.id === worldbookId
                ? {
                  ...w,
                  entries: w.entries.map((it) =>
                    it.id === itemId ? { ...it, enabled: !it.enabled } : it
                  )
                }
                : w
            )
          }
        })),
      deleteAppWorldbook: (appId, worldbookId) =>
        setConfig((prev) => ({
          ...prev,
          perApp: {
            ...prev.perApp,
            [appId]: (prev.perApp[appId] ?? []).filter((w) => w.id !== worldbookId)
          }
        })),
      deleteAppWorldbookItem: (appId, worldbookId, itemId) =>
        setConfig((prev) => ({
          ...prev,
          perApp: {
            ...prev.perApp,
            [appId]: (prev.perApp[appId] ?? []).map((w) =>
              w.id === worldbookId
                ? {
                  ...w,
                  entries: w.entries.filter((it) => it.id !== itemId)
                }
                : w
            )
          }
        }))
    };
  }, [config]);

  return <WorldbookContext.Provider value={value}>{children}</WorldbookContext.Provider>;
}

export function useWorldbook() {
  const ctx = useContext(WorldbookContext);
  if (!ctx) {
    throw new Error("useWorldbook must be used within WorldbookProvider");
  }
  return ctx;
}


