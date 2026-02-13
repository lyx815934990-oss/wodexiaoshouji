import React from 'react';

type StoryWorldbookEntry = {
  id: string;
  title: string;
  content: string;
  keyword?: string;
};

type StoryWorldbook = {
  id: string;
  name: string;
  entries: StoryWorldbookEntry[];
};

type StoryRole = {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other' | '';
  avatarUrl: string;
  age?: number | null;
  opening?: string;
  worldbooks: StoryWorldbook[];
  // 联系方式
  phoneNumber?: string; // 10位手机号
  wechatId?: string; // 微信号
  // 玩家联系方式（角色知道的）
  playerPhoneNumber?: string; // 玩家给角色的手机号
  playerWechatId?: string; // 玩家给角色的微信号
  // 微信资料（AI生成）
  wechatNickname?: string; // 微信昵称
  wechatSignature?: string; // 个性签名
};

const STORAGE_KEY = 'mini-ai-phone.story-roles';
const API_STORAGE_KEY = 'mini-ai-phone.api-config';
const APPEARANCE_KEY = 'mini-ai-phone.story-appearance';
const FRIEND_REQUESTS_KEY = 'mini-ai-phone.friend-requests';
const WECHAT_CONTACTS_KEY = 'mini-ai-phone.wechat-contacts';

type StoryAppearance = {
  backgroundImage?: string;
  fontFamily?: string;
  fontSize?: number;
};

type PlayerIdentity = {
  name: string;
  gender: 'male' | 'female' | 'other' | '';
  intro: string;
  tags: string;
  worldbooks?: StoryWorldbook[];
  // 联系方式
  phoneNumber?: string; // 10位手机号
  wechatId?: string; // 微信号
};

type StoryTurn = {
  from: 'player' | 'narrator';
  text: string;
  kind?: 'speech' | 'narration';
};

type CharacterStatus = {
  name: string;
  clothing: string;
  mood: string;
  action: string;
  innerVoice: string;
  time?: string;
  schedule: string[];
};

type ApiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

const loadRoles = (): StoryRole[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoryRole[]) : [];
  } catch {
    return [];
  }
};

const saveRoles = (roles: StoryRole[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  } catch {
    // ignore
  }
};

const loadApiConfig = (): ApiConfig => {
  try {
    const raw = window.localStorage.getItem(API_STORAGE_KEY);
    if (!raw) {
      return { baseUrl: '', apiKey: '', model: '' };
    }
    const parsed = JSON.parse(raw) as Partial<ApiConfig>;
    return {
      baseUrl: parsed.baseUrl ?? '',
      apiKey: parsed.apiKey ?? '',
      model: parsed.model ?? ''
    };
  } catch {
    return { baseUrl: '', apiKey: '', model: '' };
  }
};

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const IDENTITY_KEY = 'mini-ai-phone.story-identity';

const loadIdentity = (): PlayerIdentity => {
  try {
    const raw = window.localStorage.getItem(IDENTITY_KEY);
    if (!raw) {
      return {
        name: '',
        gender: '',
        intro: '',
        tags: '',
        worldbooks: []
      };
    }
    const parsed = JSON.parse(raw) as Partial<PlayerIdentity>;
    return {
      // 兼容旧版本字段 nickname
      name: (parsed as any).name ?? (parsed as any).nickname ?? '',
      gender: parsed.gender ?? '',
      intro: parsed.intro ?? '',
      tags: parsed.tags ?? '',
      worldbooks: parsed.worldbooks ?? []
    };
  } catch {
    return {
      name: '',
      gender: '',
      intro: '',
      tags: '',
      worldbooks: []
    };
  }
};

const saveIdentity = (id: PlayerIdentity) => {
  try {
    window.localStorage.setItem(IDENTITY_KEY, JSON.stringify(id));
  } catch {
    // ignore
  }
};

const loadAppearance = (): StoryAppearance => {
  try {
    const raw = window.localStorage.getItem(APPEARANCE_KEY);
    if (!raw) {
      return {
        backgroundImage: '',
        fontFamily: '',
        fontSize: 14
      };
    }
    const parsed = JSON.parse(raw) as Partial<StoryAppearance>;
    return {
      backgroundImage: parsed.backgroundImage ?? '',
      fontFamily: parsed.fontFamily ?? '',
      fontSize: parsed.fontSize ?? 14
    };
  } catch {
    return {
      backgroundImage: '',
      fontFamily: '',
      fontSize: 14
    };
  }
};

const saveAppearance = (appearance: StoryAppearance) => {
  try {
    window.localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance));
  } catch {
    // ignore
  }
};

// 好友申请相关类型和函数
type FriendRequest = {
  id: string;
  roleId: string;
  greeting: string;
  remark?: string;
  tags?: string;
  permission: 'all' | 'chat-only';
  hideMyMoments?: boolean;
  hideTheirMoments?: boolean;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
};

const loadFriendRequests = (): FriendRequest[] => {
  try {
    const raw = window.localStorage.getItem(FRIEND_REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FriendRequest[]) : [];
  } catch {
    return [];
  }
};

const saveFriendRequest = (request: FriendRequest) => {
  try {
    const requests = loadFriendRequests();
    const existingIndex = requests.findIndex(r => r.id === request.id);
    if (existingIndex >= 0) {
      requests[existingIndex] = request;
    } else {
      requests.push(request);
    }
    window.localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(requests));
  } catch (err) {
    console.error('保存好友申请失败:', err);
  }
};

// 微信联系人相关类型和函数
type WeChatContact = {
  roleId: string;
  remark?: string;
  tags?: string;
  permission: 'all' | 'chat-only';
  hideMyMoments?: boolean;
  hideTheirMoments?: boolean;
  addedAt: number;
};

const loadWeChatContacts = (): WeChatContact[] => {
  try {
    const raw = window.localStorage.getItem(WECHAT_CONTACTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WeChatContact[]) : [];
  } catch {
    return [];
  }
};

const saveWeChatContact = (contact: WeChatContact) => {
  try {
    const contacts = loadWeChatContacts();
    const existingIndex = contacts.findIndex(c => c.roleId === contact.roleId);
    if (existingIndex >= 0) {
      contacts[existingIndex] = contact;
    } else {
      contacts.push(contact);
    }
    window.localStorage.setItem(WECHAT_CONTACTS_KEY, JSON.stringify(contacts));
  } catch (err) {
    console.error('保存微信联系人失败:', err);
  }
};

const clearRoleRuntime = (roleId: string) => {
  try {
    const keys = [
      `mini-ai-phone.chat-${roleId}`,
      `mini-ai-phone.memory-${roleId}`,
      `mini-ai-phone.favor-${roleId}`, // 同时清除好感度数据
      `mini-ai-phone.chat-messages-chat-${roleId}` // 清除对应的微信聊天记录
    ];
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
};

const loadRoleChat = (roleId: string): StoryTurn[] => {
  try {
    const raw = window.localStorage.getItem(`mini-ai-phone.chat-${roleId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoryTurn[]) : [];
  } catch {
    return [];
  }
};

const saveRoleChat = (roleId: string, turns: StoryTurn[]) => {
  try {
    window.localStorage.setItem(`mini-ai-phone.chat-${roleId}`, JSON.stringify(turns));
  } catch {
    // ignore
  }
};

/**
 * 从剧情文本中提取角色发送的微信消息，并同步到微信聊天页面
 */
const extractAndSyncWeChatMessages = (roleId: string, text: string) => {
  try {
    // 检查该角色是否在微信联系人中
    const WECHAT_CONTACTS_KEY = 'mini-ai-phone.wechat-contacts';
    const rawContacts = window.localStorage.getItem(WECHAT_CONTACTS_KEY);
    if (!rawContacts) return;
    
    const contacts = JSON.parse(rawContacts);
    const contact = contacts.find((c: any) => c.roleId === roleId);
    if (!contact) return; // 如果角色不在微信联系人中，不处理

    // 加载现有的微信聊天消息
    const CHAT_MESSAGES_KEY_PREFIX = 'mini-ai-phone.chat-messages-';
    const chatId = `chat-${roleId}`;
    const messagesKey = `${CHAT_MESSAGES_KEY_PREFIX}${chatId}`;
    const rawMessages = window.localStorage.getItem(messagesKey);
    const existingMessages: Array<{ id: string; from: 'other' | 'self' | 'system'; text: string; time: string }> = rawMessages ? JSON.parse(rawMessages) : [];

    // 提取微信消息的模式
    // 匹配类似："发送了微信消息"、"在微信上说"、"发微信说"、"通过微信发送"等
    const wechatPatterns = [
      // 模式1: "发送了微信消息："xxx" 或 "在微信上发送："xxx""
      /(?:发送|发|通过微信发送|在微信上(?:说|发|发送|回复|发消息))[^，。！？]*?[：:]["'"'"]([^"'"]+)["'"'"]/g,
      // 模式2: "微信消息："xxx" 或 "微信说："xxx""
      /(?:微信消息|微信说|微信回复)[：:]["'"'"]([^"'"]+)["'"'"]/g,
      // 模式3: "给玩家发送微信："xxx" 或 "向玩家发微信："xxx""
      /(?:给.*?发送|向.*?发送|给.*?发).*?微信[^，。！？]*?[：:]?["'"'"]([^"'"]+)["'"'"]/g,
      // 模式4: "用微信发送："xxx" 或 "通过微信："xxx""
      /(?:用微信|通过微信)[^，。！？]*?[：:]?["'"'"]([^"'"]+)["'"'"]/g,
      // 模式5: "发来微信："xxx" 或 "发来消息："xxx""
      /(?:发来微信|发来消息)[：:]["'"'"]([^"'"]+)["'"'"]/g,
      // 模式6: 直接引号内的内容，前面有"微信"关键词
      /微信[^，。！？]*?["'"'"]([^"'"]{3,})["'"'"]/g,
    ];

    const extractedMessages: string[] = [];
    
    // 尝试从文本中提取微信消息
    for (const pattern of wechatPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const messageText = match[1]?.trim();
        if (messageText && messageText.length > 0) {
          extractedMessages.push(messageText);
        }
      }
    }

    // 如果没有通过模式匹配到，尝试更宽松的匹配：查找包含"微信"和引号的内容
    if (extractedMessages.length === 0) {
      const loosePattern = /微信[^，。！？]*?["""]([^"""]{5,})["""]/g;
      let match;
      while ((match = loosePattern.exec(text)) !== null) {
        const messageText = match[1]?.trim();
        if (messageText && messageText.length > 0 && messageText.length < 200) {
          extractedMessages.push(messageText);
        }
      }
    }

    // 将提取的消息添加到微信聊天消息列表
    if (extractedMessages.length > 0) {
      const newMessages: Array<{ id: string; from: 'other' | 'self' | 'system'; text: string; time: string }> = [];
      
      for (const messageText of extractedMessages) {
        // 检查是否已经存在相同的消息（避免重复）
        const isDuplicate = existingMessages.some(msg => 
          msg.from === 'other' && msg.text === messageText
        );
        
        if (!isDuplicate) {
          const now = new Date();
          newMessages.push({
            id: `story-${Date.now()}-${Math.random()}`,
            from: 'other',
            text: messageText,
            time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          });
        }
      }

      if (newMessages.length > 0) {
        const allMessages = [...existingMessages, ...newMessages];
        window.localStorage.setItem(messagesKey, JSON.stringify(allMessages));
        
        // 触发事件，通知WeChatApp更新消息显示
        window.dispatchEvent(new CustomEvent('wechat-messages-updated', {
          detail: { roleId, chatId, messages: allMessages }
        }));
        
        console.log(`[StoryApp] 已从剧情中提取并同步 ${newMessages.length} 条微信消息到聊天页面`);
      }
    }
  } catch (err) {
    console.error('[StoryApp] 提取微信消息失败:', err);
  }
};

type StatusCache = {
  key: string;
  list: CharacterStatus[];
};

const loadRoleStatusCache = (roleId: string): StatusCache | null => {
  try {
    const raw = window.localStorage.getItem(`mini-ai-phone.status-${roleId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.list)) {
      return parsed as StatusCache;
    }
    return null;
  } catch {
    return null;
  }
};

const saveRoleStatusCache = (roleId: string, key: string, list: CharacterStatus[]) => {
  try {
    const payload: StatusCache = { key, list };
    window.localStorage.setItem(`mini-ai-phone.status-${roleId}`, JSON.stringify(payload));
  } catch {
    // ignore
  }
};

/**
 * 计算两个行程安排字符串的相似度（0-1之间）
 */
const calculateScheduleSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  // 简单的相似度计算：基于共同词汇的比例
  const words1 = str1.split(/[|\s]+/).filter(w => w.length > 0);
  const words2 = str2.split(/[|\s]+/).filter(w => w.length > 0);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  let common = 0;
  
  for (const word of set1) {
    if (set2.has(word)) {
      common++;
    }
  }
  
  const total = Math.max(set1.size, set2.size);
  return total > 0 ? common / total : 0;
};

/**
 * 好感度数据结构
 */
type FavorData = {
  value: number; // 0-100
  lastUpdate: number; // 最后更新时间戳
  history?: Array<{ value: number; timestamp: number; reason?: string }>; // 历史记录(可选)
};

/**
 * 好感度阶段定义
 */
type FavorStage = 'stranger' | 'acquaintance' | 'familiar' | 'friend' | 'close';

/**
 * 根据好感度值获取阶段
 */
const getFavorStage = (value: number): FavorStage => {
  if (value <= 20) return 'stranger';
  if (value <= 40) return 'acquaintance';
  if (value <= 60) return 'familiar';
  if (value <= 80) return 'friend';
  return 'close';
};

/**
 * 获取好感度阶段的中文描述
 */
const getFavorStageLabel = (stage: FavorStage): string => {
  const labels: Record<FavorStage, string> = {
    stranger: '陌生',
    acquaintance: '认识',
    familiar: '熟悉',
    friend: '朋友',
    close: '亲密'
  };
  return labels[stage];
};

/**
 * 根据角色和玩家的世界书计算初始好感度
 */
const calculateInitialFavor = async (role: StoryRole): Promise<number> => {
  const cfg = loadApiConfig();
  if (!cfg.baseUrl || !cfg.model) {
    // 如果没有API配置,返回默认值0
    return 0;
  }

  try {
    const playerIdentity = loadIdentity();
    
    // 构造角色世界书摘要
    const roleWorldbookContent = role.worldbooks
      .map((wb) => {
        const wbName = wb.name || '未命名世界书';
        const entriesText = wb.entries
          .filter((e) => e.title || e.content)
          .map((e) => {
            const title = e.title || '（未命名条目）';
            const content = e.content || '';
            return content ? `「${title}」：${content}` : `「${title}」`;
          })
          .join('\n');
        return entriesText ? `【${wbName}】\n${entriesText}` : '';
      })
      .filter((text) => text.length > 0)
      .join('\n\n');

    // 构造玩家世界书摘要
    const playerWorldbookContent = (playerIdentity.worldbooks ?? [])
      .map((wb) => {
        const wbName = wb.name || '未命名世界书';
        const entriesText = wb.entries
          .filter((e) => e.title || e.content)
          .map((e) => {
            const title = e.title || '（未命名条目）';
            const content = e.content || '';
            return content ? `「${title}」：${content}` : `「${title}」`;
          })
          .join('\n');
        return entriesText ? `【${wbName}】\n${entriesText}` : '';
      })
      .filter((text) => text.length > 0)
      .join('\n\n');

    const endpointBase = cfg.baseUrl.replace(/\/+$/, '');
    const url =
      endpointBase.endsWith('/chat/completions') ||
        endpointBase.endsWith('/completions')
        ? endpointBase
        : endpointBase + '/chat/completions';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              '你是一个评估角色与玩家初始关系的助手。根据角色和玩家的世界书设定,判断角色对玩家的初始好感度。\n' +
              '评估规则：\n' +
              '1）根据世界书内容判断角色和玩家的初始关系：\n' +
              '   - 如果世界书中明确提到角色和玩家是朋友、同学、同事等已有关系,初始好感度应该在21-60之间\n' +
              '   - 如果世界书中提到角色和玩家是陌生人或初次见面,初始好感度应该在0-20之间\n' +
              '   - 如果世界书中提到角色和玩家是敌人、有矛盾等负面关系,初始好感度应该在0-10之间\n' +
              '   - 如果世界书中提到角色和玩家是恋人、家人等亲密关系,初始好感度应该在61-80之间\n' +
              '2）如果没有明确的关系设定,默认初始好感度为0(陌生)\n' +
              '3）初始好感度必须符合逻辑和现实,不会出现不合理的数值\n' +
              '4）输出格式：直接输出JSON,格式为 {"initialFavor": 0-100, "reason": "原因说明"}。'
          },
          {
            role: 'user',
            content: `角色姓名：${role.name}, 性别：${role.gender === 'male' ? '男' : role.gender === 'female' ? '女' : '其他'}, 年龄：${role.age || '未指定'}。\n` +
              `玩家姓名：${playerIdentity.name || '未设置'}\n` +
              `${roleWorldbookContent ? `【角色设定（世界书）】\n${roleWorldbookContent}\n\n` : ''}` +
              `${playerWorldbookContent ? `【玩家设定（世界书）】\n${playerWorldbookContent}\n\n` : ''}` +
              `请根据以上信息,评估角色对玩家的初始好感度(0-100)。如果没有明确的关系设定,默认返回0。`
          }
        ]
      })
    });

    if (!res.ok) {
      return 0;
    }

    const data = (await res.json()) as any;
    let text: string =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      '';

    if (!text) {
      return 0;
    }

    // 尝试解析JSON
    let parsed: { initialFavor?: number; reason?: string } = {};
    try {
      text = text.replace(/^```json\n?/g, '').replace(/^```\n?/g, '').replace(/\n?```$/g, '').trim();
      parsed = JSON.parse(text);
    } catch {
      // 如果解析失败,尝试提取数字
      const favorMatch = text.match(/initialFavor["']?\s*[:：]\s*(\d+)/);
      if (favorMatch) {
        parsed.initialFavor = parseInt(favorMatch[1], 10);
      }
    }

    if (parsed.initialFavor !== undefined) {
      return Math.max(0, Math.min(100, parsed.initialFavor));
    }

    return 0;
  } catch (err) {
    console.error('计算初始好感度失败:', err);
    return 0;
  }
};

/**
 * 加载角色的好感度数据
 * 如果是首次加载且没有存储的数据,会根据世界书计算初始好感度
 */
const loadRoleFavor = async (roleId: string, role?: StoryRole): Promise<FavorData> => {
  try {
    const raw = window.localStorage.getItem(`mini-ai-phone.favor-${roleId}`);
    if (!raw) {
      // 首次加载,根据世界书计算初始好感度
      if (role) {
        const initialFavor = await calculateInitialFavor(role);
        const initialData: FavorData = { value: initialFavor, lastUpdate: Date.now() };
        saveRoleFavor(roleId, initialData);
        return initialData;
      }
      // 如果没有角色信息,返回默认值0
      return { value: 0, lastUpdate: Date.now() };
    }
    const parsed = JSON.parse(raw) as Partial<FavorData>;
    return {
      value: Math.max(0, Math.min(100, parsed.value ?? 0)),
      lastUpdate: parsed.lastUpdate ?? Date.now(),
      history: parsed.history
    };
  } catch {
    return { value: 0, lastUpdate: Date.now() };
  }
};

/**
 * 同步加载角色的好感度数据(不计算初始值,用于已存在的角色)
 */
const loadRoleFavorSync = (roleId: string): FavorData => {
  try {
    const raw = window.localStorage.getItem(`mini-ai-phone.favor-${roleId}`);
    if (!raw) {
      return { value: 0, lastUpdate: Date.now() };
    }
    const parsed = JSON.parse(raw) as Partial<FavorData>;
    return {
      value: Math.max(0, Math.min(100, parsed.value ?? 0)),
      lastUpdate: parsed.lastUpdate ?? Date.now(),
      history: parsed.history
    };
  } catch {
    return { value: 0, lastUpdate: Date.now() };
  }
};

/**
 * 保存角色的好感度数据
 */
const saveRoleFavor = (roleId: string, favor: FavorData) => {
  try {
    window.localStorage.setItem(`mini-ai-phone.favor-${roleId}`, JSON.stringify(favor));
  } catch {
    // ignore
  }
};

/**
 * 更新好感度(增加或减少)
 * @param roleId 角色ID
 * @param delta 变化量(正数为增加,负数为减少)
 * @param reason 变化原因(可选)
 */
const updateRoleFavor = (roleId: string, delta: number, reason?: string): FavorData => {
  const current = loadRoleFavorSync(roleId);
  const newValue = Math.max(0, Math.min(100, current.value + delta));
  const updated: FavorData = {
    value: newValue,
    lastUpdate: Date.now(),
    history: current.history ? [...current.history, { value: newValue, timestamp: Date.now(), reason }] : undefined
  };
  saveRoleFavor(roleId, updated);
  return updated;
};

const surnamePool = [
  '顾',
  '沈',
  '江',
  '陆',
  '言',
  '时',
  '程',
  '许',
  '林',
  '周',
  '傅',
  '岑',
  '苏',
  '席',
  '霍',
  '简',
  '黎',
  '祁',
  '唐',
  '薄',
  '闻',
  '池',
  '季',
  '柏',
  '洛',
  '湛',
  '慕',
  '沈',
  '喻',
  '阮',
  '陆',
  '纪',
  '孟'
];

const givenNamePool = [
  '行',
  '舟',
  '迟',
  '曜',
  '辞',
  '野',
  '星',
  '阑',
  '知',
  '砚',
  '叙',
  '寒',
  '沉',
  '洲',
  '庭',
  '深',
  '景',
  '安',
  '砾',
  '川',
  '隽',
  '之',
  '远',
  '屿',
  '予',
  '闻',
  '骁',
  '砺',
  '笙',
  '晏',
  '锦',
  '斐',
  '翊',
  '琛',
  '澜',
  '霁',
  '清',
  '栩',
  '珩',
  '临',
  '桓',
  '意',
  '澈',
  '野',
  '行',
  '砚',
  '屿'
];

type StoryAppProps = {
  onTitleChange?: (title: string) => void;
  onHeaderActionsChange?: (actions: {
    showBack?: boolean;
    showMore?: boolean;
    onBack?: () => void;
    onMore?: () => void;
  }) => void;
};

// 全局事件处理器：处理微信消息触发的剧情生成（不依赖React组件状态）
const handleWeChatMessageStoryGlobally = async (event: CustomEvent<{ roleId: string; playerMessages: string[]; existingTurns: any[]; wechatReplies?: string }>) => {
  const { roleId, playerMessages, existingTurns, wechatReplies } = event.detail;
  console.log('[StoryApp] [全局监听器] 收到微信消息剧情生成事件:', { roleId, messageCount: playerMessages.length });

  try {
    const allRoles = loadRoles();
    const role = allRoles.find(r => r.id === roleId);
    if (!role) {
      console.warn('[StoryApp] [全局监听器] 未找到角色，无法生成剧情:', roleId);
      return;
    }

    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      console.warn('[StoryApp] [全局监听器] API未配置，无法生成剧情');
      return;
    }

    // 构造玩家消息的上下文描述（将所有消息合并，描述玩家通过微信发送了这些消息）
    const playerMessagesText = `玩家通过微信向${role.name}发送了以下消息：${playerMessages.join('；')}${wechatReplies ? `\n\n**重要：角色在微信上已经回复了以下内容：${wechatReplies}**\n请确保线下剧情中角色的反应和微信回复内容保持一致。如果角色在微信上说了某些话，线下剧情应该体现角色发送这些消息时的状态、心理活动或场景。` : ''}`;

    // 需要调用generateAIResponse，但它在组件内部
    // 我们需要在这里重新实现生成逻辑，或者提取generateAIResponse到模块级别
    // 临时方案：直接在这里实现生成逻辑
    
    const endpointBase = cfg.baseUrl.replace(/\/+$/, '');
    const url =
      endpointBase.endsWith('/chat/completions') ||
        endpointBase.endsWith('/completions')
        ? endpointBase
        : endpointBase + '/chat/completions';

    // 构造最近几轮上下文
    const recent = existingTurns
      .slice(-6)
      .map((t: any) => {
        if (t.from === 'player') {
          return t.kind === 'speech'
            ? `【玩家对白】${t.text}`
            : `【玩家场景】${t.text}`;
        }
        return `【叙述】${t.text}`;
      })
      .join('\n');

    // 构造角色世界书内容
    const worldbookContent = role.worldbooks
      .map((wb: any) => {
        const wbName = wb.name || '未命名世界书';
        const entriesText = wb.entries
          .filter((e: any) => e.title || e.content)
          .map((e: any) => {
            const title = e.title || '（未命名条目）';
            const content = e.content || '';
            return content ? `「${title}」：${content}` : `「${title}」`;
          })
          .join('\n');
        return entriesText ? `【${wbName}】\n${entriesText}` : '';
      })
      .filter((text: string) => text.length > 0)
      .join('\n\n');

    // 获取玩家身份信息
    const playerIdentity = loadIdentity();
    const playerWorldbookContent = (playerIdentity.worldbooks ?? [])
      .map((wb: any) => {
        const wbName = wb.name || '未命名世界书';
        const entriesText = wb.entries
          .filter((e: any) => e.title || e.content)
          .map((e: any) => {
            const title = e.title || '（未命名条目）';
            const content = e.content || '';
            return content ? `「${title}」：${content}` : `「${title}」`;
          })
          .join('\n');
        return entriesText ? `【${wbName}】\n${entriesText}` : '';
      })
      .filter((text: string) => text.length > 0)
      .join('\n\n');
    
    const playerInfo = playerIdentity.name
      ? `玩家姓名：${playerIdentity.name}${playerIdentity.intro ? `\n玩家介绍：${playerIdentity.intro}` : ''}${playerIdentity.tags ? `\n玩家标签：${playerIdentity.tags}` : ''}${playerWorldbookContent ? `\n\n【玩家设定（世界书）】\n${playerWorldbookContent}` : ''}`
      : '（玩家尚未设置身份信息）';

    // 加载当前好感度
    const favorData = loadRoleFavorSync(roleId);
    const favorStage = getFavorStage(favorData.value);
    const favorStageLabel = getFavorStageLabel(favorStage);

    // 生成好感度描述（简化版）
    const favorDescription = `当前好感度为${favorData.value}/100，处于${favorStageLabel}阶段`;

    const roleName = role.name;
    const genderLabel =
      role.gender === 'male'
        ? '男'
        : role.gender === 'female'
          ? '女'
          : role.gender === 'other'
            ? '其他'
            : '未指定';
    const ageLabel =
      typeof role.age === 'number' && role.age > 0 ? `${role.age} 岁` : '年龄未填写';

    const targetLength = 200;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              '你是一个线下剧情文字游戏的"剧情接力写手"。写作总规则：\n' +
              '1）每次只推进一小段完整剧情，长度由后续给出的目标字数决定，不再限制句子数量，但整体要紧凑、不要水字数。\n' +
              '2）坚决避免八股文、爽文、超雄、狗血、极端和病态情节，一切发展都建立在正常、合乎逻辑的前提下。\n' +
              '3）所有角色（包含 NPC）都是独立的人，不是功能模板：行为要符合他们在上下文中的信息和处境，不能出现集体同一种性格或口吻。\n' +
              '4）需要群像时，要适当描写场景中不同人物各自合理的反应，让他们互相"搭话"，而不是只围着单一主角转。\n' +
              '5）语言尽量口语化但不过度花哨，少用比喻与华丽辞藻，多用具体动作、细节和对话让人物"活"起来。\n' +
              '6）你的输出**永远不要替玩家做决定或安排具体行动**，不要写"你决定……""你选择……"之类的句式，只写当前时刻已经发生的角色和 NPC 的反应、对话与场景变化。\n' +
              '7）可以用第三人称，也可以在玩家输入是第一人称时保持第一人称视角，但仍然只描述当下和既成事实，不预设玩家未来的选择。\n' +
              '8）如果上一轮玩家输入是对白（被引号包住），你的续写要让这一句对白在当前场景中自然落地并引出新的反应；如果是场景描述，就顺势延展画面或人物状态。\n' +
              '9）**重要**：必须严格遵守角色设定（世界书内容），角色的行为、习惯、性格特征必须符合世界书中的设定。如果世界书中提到角色的某些习惯或特征（如"偶尔会抽烟"），在合适的场景中要自然地体现出来。\n' +
              '10）**重要**：叙述视角使用第三人称上帝视角，但在指代玩家时使用"你"来称呼，这样更有代入感。例如："角色A看见你这个样子"、"角色B想着你可能没吃饭"。角色在对话中可以使用玩家的真实姓名或其他称号来称呼玩家，例如："角色A看见你过来了，立马叫住你：\"XX！你在这里干嘛呢？\""。\n' +
              `11）**好感度系统**：当前角色对玩家的好感度为 ${favorData.value}/100，处于"${favorStageLabel}"阶段。角色对玩家的态度：${favorDescription}。**严禁玛丽苏式感情升温**：好感度的提升必须符合逻辑和现实，需要时间和合适的契机。即使玩家做了好事，角色的反应也要符合当前好感度阶段和角色人设，不会突然变得过于热情或做出不符合关系的亲密行为。好感度的提升是"慢火熬粥"式的渐进过程，不会因为一次互动就大幅提升。\n` +
              '12）**微信消息格式**：如果剧情中角色需要通过微信向玩家发送消息，请使用明确的格式，例如："角色名在微信上发送："消息内容"" 或 "角色名发来微信："消息内容""。消息内容要用引号（""）明确标注，这样系统才能正确识别并同步到微信聊天页面。'
          },
          {
            role: 'user',
            content: `当前角色：${roleName}，性别：${genderLabel}，年龄：${ageLabel}。\n\n${playerInfo}\n\n${worldbookContent ? `【角色设定（世界书）】\n${worldbookContent}\n\n` : ''}${role.opening ? `开场白：${role.opening}\n\n` : ''}下面是最近的剧情片段（按时间顺序）：\n${recent}${playerMessagesText ? `\n\n**重要：玩家刚刚通过微信向${roleName}发送了消息：${playerMessagesText}**\n请根据这个微信消息，生成角色收到消息后在剧情模式下的反应和后续发展。这是线下剧情，不是微信聊天，要描述角色在收到微信消息后的真实反应、心理活动、行为等。` : ''}\n\n请根据以上内容，自然接着写下一小段剧情。不要重复玩家刚才输入的内容，也不要总结，只需要继续往前一点点。请尽量控制在大约 ${targetLength} 个字左右，可以略多或略少，但必须是完整自然的一小段，不能在句子中途硬截断。`
          }
        ]
      })
    });

    if (!res.ok) {
      throw new Error(`接口返回状态 ${res.status}`);
    }

    const data = (await res.json()) as any;
    let text: string =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      '';

    if (!text) {
      throw new Error('未从接口结果中解析到文本内容');
    }

    const aiResponse = text.trim();

    const withAi: StoryTurn[] = [
      ...existingTurns,
      { from: 'narrator', text: aiResponse, kind: 'narration' }
    ];

    // 保存到localStorage
    saveRoleChat(roleId, withAi);

    // 从AI回复中提取微信消息并同步到微信聊天页面
    extractAndSyncWeChatMessages(roleId, aiResponse);

    // 触发UI更新事件
    window.dispatchEvent(new CustomEvent('story-updated', {
      detail: { roleId, turns: withAi }
    }));

    console.log('[StoryApp] [全局监听器] 已生成微信消息对应的剧情:', roleId);
  } catch (err) {
    console.error('[StoryApp] [全局监听器] 生成微信消息剧情失败:', err);
  }
};

// 全局事件处理器函数（不依赖React组件状态）
const handleFriendRequestGlobally = async (event: CustomEvent<{ roleId: string; requestId: string }>) => {
  const { roleId } = event.detail;
  console.log('[StoryApp] [全局监听器] 收到好友申请事件，开始处理:', roleId);
  
  // 延迟一点时间，确保localStorage已经保存
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 检查是否有待处理的好友申请
  const pendingRequests = loadFriendRequests().filter(
    req => req.roleId === roleId && req.status === 'pending'
  );

  console.log('[StoryApp] [全局监听器] 待处理的好友申请数量:', pendingRequests.length);

  if (pendingRequests.length === 0) {
    console.warn('[StoryApp] [全局监听器] 没有找到待处理的好友申请，退出');
    return;
  }

  // 从roles数组中查找角色
  const allRoles = loadRoles();
  console.log('[StoryApp] [全局监听器] 加载的角色总数:', allRoles.length);
  const role = allRoles.find((r) => r.id === roleId);
  if (!role) {
    console.warn('[StoryApp] [全局监听器] 未找到角色，无法自动生成剧情:', roleId);
    console.warn('[StoryApp] [全局监听器] 可用的角色ID:', allRoles.map(r => r.id));
    return;
  }

  console.log('[StoryApp] [全局监听器] 找到角色:', role.name);

  const cfg = loadApiConfig();
  if (!cfg.baseUrl || !cfg.model) {
    console.warn('[StoryApp] [全局监听器] API未配置，无法自动生成剧情. baseUrl:', cfg.baseUrl, 'model:', cfg.model);
    return;
  }

  console.log('[StoryApp] [全局监听器] API配置正常，开始生成剧情');

  // 从localStorage加载该角色的剧情数据
  const existingTurns = loadRoleChat(roleId);
  console.log('[StoryApp] [全局监听器] 加载的现有剧情轮次:', existingTurns.length);

  try {
    console.log('[StoryApp] [全局监听器] 开始调用AI生成剧情...');
    
    // 需要创建一个临时的generateAIResponse函数，或者直接在这里实现生成逻辑
    // 由于generateAIResponse在组件内部，我们需要重新实现或提取出来
    // 先尝试直接调用，如果不行再重构
    
    // 临时方案：触发一个自定义事件，让组件内的监听器处理
    // 但更好的方案是直接在这里实现生成逻辑
    
    // 构造API请求
    const endpointBase = cfg.baseUrl.replace(/\/+$/, '');
    const url =
      endpointBase.endsWith('/chat/completions') ||
        endpointBase.endsWith('/completions')
        ? endpointBase
        : endpointBase + '/chat/completions';

    // 构造最近几轮上下文
    const recent = existingTurns
      .slice(-6)
      .map((t) => {
        if (t.from === 'player') {
          return t.kind === 'speech'
            ? `【玩家对白】${t.text}`
            : `【玩家场景】${t.text}`;
        }
        return `【叙述】${t.text}`;
      })
      .join('\n');

    // 构造角色世界书内容
    const worldbookContent = role.worldbooks
      .map((wb) => {
        const wbName = wb.name || '未命名世界书';
        const entriesText = wb.entries
          .filter((e) => e.title || e.content)
          .map((e) => {
            const title = e.title || '（未命名条目）';
            const content = e.content || '';
            return content ? `「${title}」：${content}` : `「${title}」`;
          })
          .join('\n');
        return entriesText ? `【${wbName}】\n${entriesText}` : '';
      })
      .filter((text) => text.length > 0)
      .join('\n\n');

    // 获取玩家身份信息
    const playerIdentity = loadIdentity();
    const playerWorldbookContent = (playerIdentity.worldbooks ?? [])
      .map((wb) => {
        const wbName = wb.name || '未命名世界书';
        const entriesText = wb.entries
          .filter((e) => e.title || e.content)
          .map((e) => {
            const title = e.title || '（未命名条目）';
            const content = e.content || '';
            return content ? `「${title}」：${content}` : `「${title}」`;
          })
          .join('\n');
        return entriesText ? `【${wbName}】\n${entriesText}` : '';
      })
      .filter((text) => text.length > 0)
      .join('\n\n');
    
    const playerInfo = playerIdentity.name
      ? `玩家姓名：${playerIdentity.name}${playerIdentity.intro ? `\n玩家介绍：${playerIdentity.intro}` : ''}${playerIdentity.tags ? `\n玩家标签：${playerIdentity.tags}` : ''}${playerWorldbookContent ? `\n\n【玩家设定（世界书）】\n${playerWorldbookContent}` : ''}`
      : '（玩家尚未设置身份信息）';

    // 加载好感度
    const favorData = loadRoleFavorSync(roleId);
    const favorStage = getFavorStage(favorData.value);
    const favorStageLabel = getFavorStageLabel(favorStage);

    // 生成好感度描述（简化版，不调用AI）
    const favorDescription = `当前好感度为${favorData.value}/100，处于${favorStageLabel}阶段`;

    const roleName = role.name;
    const genderLabel =
      role.gender === 'male'
        ? '男'
        : role.gender === 'female'
          ? '女'
          : role.gender === 'other'
            ? '其他'
            : '未指定';
    const ageLabel =
      typeof role.age === 'number' && role.age > 0 ? `${role.age} 岁` : '年龄未填写';

    // 获取玩家微信信息
    const playerWechatNickname = (playerIdentity as any).wechatNickname || playerIdentity.name || '玩家';
    const playerWechatAvatar = (playerIdentity as any).wechatAvatar || '';
    
    const friendRequestContext = pendingRequests.length > 0
      ? `\n\n**重要：好友申请提醒**\n玩家通过微信向${roleName}发送了好友申请。角色只能看到以下信息：1）玩家的微信昵称："${playerWechatNickname}"；2）玩家的微信头像${playerWechatAvatar ? `（已设置头像）` : `（默认头像）`}；3）玩家填写的打招呼消息："${pendingRequests[0].greeting}"。角色看不到其他申请信息（如备注、标签、朋友权限等）。角色可能会在剧情中自然地回应这个好友申请，比如同意、拒绝或者需要更多了解。如果角色在剧情中明确表示同意或接受好友申请，这表示好友申请已通过。`
      : '';

    const targetLength = 200; // 默认长度

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              '你是一个线下剧情文字游戏的"剧情接力写手"。写作总规则：\n' +
              '1）每次只推进一小段完整剧情，长度由后续给出的目标字数决定，不再限制句子数量，但整体要紧凑、不要水字数。\n' +
              '2）坚决避免八股文、爽文、超雄、狗血、极端和病态情节，一切发展都建立在正常、合乎逻辑的前提下。\n' +
              '3）所有角色（包含 NPC）都是独立的人，不是功能模板：行为要符合他们在上下文中的信息和处境，不能出现集体同一种性格或口吻。\n' +
              '4）需要群像时，要适当描写场景中不同人物各自合理的反应，让他们互相"搭话"，而不是只围着单一主角转。\n' +
              '5）语言尽量口语化但不过度花哨，少用比喻与华丽辞藻，多用具体动作、细节和对话让人物"活"起来。\n' +
              '6）你的输出**永远不要替玩家做决定或安排具体行动**，不要写"你决定……""你选择……"之类的句式，只写当前时刻已经发生的角色和 NPC 的反应、对话与场景变化。\n' +
              '7）可以用第三人称，也可以在玩家输入是第一人称时保持第一人称视角，但仍然只描述当下和既成事实，不预设玩家未来的选择。\n' +
              '8）如果上一轮玩家输入是对白（被引号包住），你的续写要让这一句对白在当前场景中自然落地并引出新的反应；如果是场景描述，就顺势延展画面或人物状态。\n' +
              '9）**重要**：必须严格遵守角色设定（世界书内容），角色的行为、习惯、性格特征必须符合世界书中的设定。如果世界书中提到角色的某些习惯或特征（如"偶尔会抽烟"），在合适的场景中要自然地体现出来。\n' +
              '10）**重要**：叙述视角使用第三人称上帝视角，但在指代玩家时使用"你"来称呼，这样更有代入感。例如："角色A看见你这个样子"、"角色B想着你可能没吃饭"。角色在对话中可以使用玩家的真实姓名或其他称号来称呼玩家，例如："角色A看见你过来了，立马叫住你：\"XX！你在这里干嘛呢？\""。\n' +
              `11）**好感度系统**：当前角色对玩家的好感度为 ${favorData.value}/100，处于"${favorStageLabel}"阶段。角色对玩家的态度：${favorDescription}。**严禁玛丽苏式感情升温**：好感度的提升必须符合逻辑和现实，需要时间和合适的契机。即使玩家做了好事，角色的反应也要符合当前好感度阶段和角色人设，不会突然变得过于热情或做出不符合关系的亲密行为。好感度的提升是"慢火熬粥"式的渐进过程，不会因为一次互动就大幅提升。${friendRequestContext}\n` +
              '12）**微信消息格式**：如果剧情中角色需要通过微信向玩家发送消息，请使用明确的格式，例如："角色名在微信上发送："消息内容"" 或 "角色名发来微信："消息内容""。消息内容要用引号（""）明确标注，这样系统才能正确识别并同步到微信聊天页面。'
          },
          {
            role: 'user',
            content: `当前角色：${roleName}，性别：${genderLabel}，年龄：${ageLabel}。\n\n${playerInfo}\n\n${worldbookContent ? `【角色设定（世界书）】\n${worldbookContent}\n\n` : ''}${role.opening ? `开场白：${role.opening}\n\n` : ''}下面是最近的剧情片段（按时间顺序）：\n${recent}\n\n请根据以上内容，自然接着写下一小段剧情。不要重复玩家刚才输入的内容，也不要总结，只需要继续往前一点点。请尽量控制在大约 ${targetLength || 200} 个字左右，可以略多或略少，但必须是完整自然的一小段，不能在句子中途硬截断。`
          }
        ]
      })
    });

    if (!res.ok) {
      throw new Error(`接口返回状态 ${res.status}`);
    }

    const data = (await res.json()) as any;
    let text: string =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      '';

    if (!text) {
      throw new Error('未从接口结果中解析到文本内容');
    }

    const aiResponse = text.trim();
    console.log('[StoryApp] [全局监听器] AI生成成功，回复长度:', aiResponse.length);

    const withAi: StoryTurn[] = [
      ...existingTurns,
      { from: 'narrator', text: aiResponse, kind: 'narration' }
    ];
    
    // 保存到localStorage
    saveRoleChat(roleId, withAi);
    console.log('[StoryApp] [全局监听器] 已保存剧情到localStorage，总轮次:', withAi.length);

    // 从AI回复中提取微信消息并同步到微信聊天页面
    extractAndSyncWeChatMessages(roleId, aiResponse);

    // 触发UI更新事件（如果组件已挂载）
    window.dispatchEvent(new CustomEvent('story-updated', {
      detail: { roleId, turns: withAi }
    }));

    // 简化版：检查AI回复中是否包含角色同意好友申请的内容
    const acceptKeywords = ['同意', '接受', '通过', '可以', '好的', '行', '没问题', '加好友', '添加好友', '通过申请'];
    const rejectKeywords = ['拒绝', '不同意', '不行', '不可以', '不想'];
    const hasAcceptance = acceptKeywords.some(keyword => aiResponse.includes(keyword));
    const hasRejection = rejectKeywords.some(keyword => aiResponse.includes(keyword));
    
    if (hasAcceptance && !hasRejection) {
      const request = pendingRequests[0];
      request.status = 'accepted';
      saveFriendRequest(request);
      
      // 添加到微信联系人
      const contact: WeChatContact = {
        roleId: roleId,
        remark: request.remark,
        tags: request.tags,
        permission: request.permission,
        hideMyMoments: request.hideMyMoments,
        hideTheirMoments: request.hideTheirMoments,
        addedAt: Date.now()
      };
      saveWeChatContact(contact);
      
      // 触发事件，通知WeChatApp添加系统消息
      window.dispatchEvent(new CustomEvent('friend-request-accepted', {
        detail: { roleId, roleName: role.name, greeting: request.greeting }
      }));
      
      console.log('[StoryApp] [全局监听器] 好友申请已通过，已添加到微信联系人');
    } else if (hasRejection) {
      const request = pendingRequests[0];
      request.status = 'rejected';
      saveFriendRequest(request);
      console.log('[StoryApp] [全局监听器] 好友申请已被拒绝');
    }

    // 简化版：暂时跳过好感度评估，避免依赖组件内部函数
    // 可以在后续优化中添加

    console.log('[StoryApp] [全局监听器] 已自动生成好友申请剧情完成:', roleId);
  } catch (err) {
    console.error('[StoryApp] [全局监听器] 自动生成好友申请剧情失败:', err);
    console.error('[StoryApp] [全局监听器] 错误详情:', {
      roleId,
      roleName: role?.name,
      existingTurnsCount: existingTurns.length,
      error: err instanceof Error ? err.message : String(err)
    });
  }
};

// 在模块加载时立即注册全局监听器（不依赖组件挂载）
if (typeof window !== 'undefined') {
  console.log('[StoryApp] [模块初始化] 注册全局好友申请事件监听器');
  window.addEventListener('friend-request-sent', handleFriendRequestGlobally as unknown as EventListener);
  document.addEventListener('friend-request-sent', handleFriendRequestGlobally as unknown as EventListener);
  
  console.log('[StoryApp] [模块初始化] 注册全局微信消息剧情生成事件监听器');
  window.addEventListener('generate-story-for-wechat-message', handleWeChatMessageStoryGlobally as unknown as EventListener);
  document.addEventListener('generate-story-for-wechat-message', handleWeChatMessageStoryGlobally as unknown as EventListener);
}

export const StoryApp: React.FC<StoryAppProps> = ({ onTitleChange, onHeaderActionsChange }) => {
  const [roles, setRoles] = React.useState<StoryRole[]>(() => loadRoles());
  const [mode, setMode] = React.useState<'list' | 'create' | 'identity' | 'read' | 'edit' | 'appearance'>(
    () => (loadRoles().length === 0 ? 'create' : 'list')
  );
  const [name, setName] = React.useState('');
  const [gender, setGender] = React.useState<StoryRole['gender']>('');
  const [roleAge, setRoleAge] = React.useState('');
  const [opening, setOpening] = React.useState('');
  const [openingKeyword, setOpeningKeyword] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState('');
  const [worldbooks, setWorldbooks] = React.useState<StoryWorldbook[]>([]);
  // 角色联系方式
  const [rolePhoneNumber, setRolePhoneNumber] = React.useState('');
  const [roleWechatId, setRoleWechatId] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [openWorldbookIds, setOpenWorldbookIds] = React.useState<string[]>([]);
  const [openEntryIds, setOpenEntryIds] = React.useState<string[]>([]);
  const [identity, setIdentity] = React.useState<PlayerIdentity>(() => loadIdentity());
  const [playerWorldbooks, setPlayerWorldbooks] = React.useState<StoryWorldbook[]>(() => identity.worldbooks ?? []);
  const [openPlayerWorldbookIds, setOpenPlayerWorldbookIds] = React.useState<string[]>([]);
  const [openPlayerEntryIds, setOpenPlayerEntryIds] = React.useState<string[]>([]);
  const [appearance, setAppearance] = React.useState<StoryAppearance>(() => loadAppearance());
  const backgroundImageInputRef = React.useRef<HTMLInputElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [currentRoleId, setCurrentRoleId] = React.useState<string | null>(null);
  const [storyTurns, setStoryTurns] = React.useState<StoryTurn[]>([]);
  const [storyInput, setStoryInput] = React.useState('');
  const [storyLoading, setStoryLoading] = React.useState(false);
  const [quickReplies, setQuickReplies] = React.useState<string[]>([]);
  const [quickLoading, setQuickLoading] = React.useState(false);
  const [targetLength, setTargetLength] = React.useState<number>(120);
  const [lengthInput, setLengthInput] = React.useState('120');
  const [showLengthPanel, setShowLengthPanel] = React.useState(false);
  const [showQuickModal, setShowQuickModal] = React.useState(false);
  const [statusList, setStatusList] = React.useState<CharacterStatus[]>([]);
  const [showStatusModal, setShowStatusModal] = React.useState(false);
  const [statusLoading, setStatusLoading] = React.useState(false);
  const [activeStatusIndex, setActiveStatusIndex] = React.useState(0);
  const [statusKey, setStatusKey] = React.useState<string | null>(null);

  const generateRandomMaleName = React.useCallback(() => {
    const surname = surnamePool[Math.floor(Math.random() * surnamePool.length)];
    // 名字总长度控制在 2-4 个字，所以名部分为 1-3 个字
    const givenLength = 1 + Math.floor(Math.random() * 3);
    let given = '';
    for (let i = 0; i < givenLength; i += 1) {
      given += givenNamePool[Math.floor(Math.random() * givenNamePool.length)];
    }
    return surname + given;
  }, []);

  React.useEffect(() => {
    if (!onTitleChange) return;
    if (mode === 'read' && currentRoleId) {
      const role = roles.find((r) => r.id === currentRoleId);
      onTitleChange(role?.name ?? '线下故事');
    } else {
      onTitleChange('线下故事');
    }
  }, [mode, currentRoleId, roles, onTitleChange]);

  // 动态注入style标签以确保Safari PWA兼容性
  React.useEffect(() => {
    // 延迟执行，确保DOM已渲染
    const timer = setTimeout(() => {
      let styleElement = document.getElementById('story-appearance-style') as HTMLStyleElement | null;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'story-appearance-style';
        document.head.appendChild(styleElement);
      }
      
      const currentAppearance = loadAppearance();
      let css = '';
      
      if (currentAppearance.fontFamily) {
        // 确保字体名称格式正确
        const fontFamily = currentAppearance.fontFamily;
        // 直接使用，因为字体名称已经包含了正确的引号格式
        css += `.story-read { font-family: ${fontFamily} !important; }\n`;
        css += `.story-read-opening { font-family: ${fontFamily} !important; }\n`;
        css += `.story-read-entry-title { font-family: ${fontFamily} !important; }\n`;
        css += `.story-read-entry-content { font-family: ${fontFamily} !important; }\n`;
        
        // 调试输出
        console.log('[StoryApp] 注入字体样式:', fontFamily);
      }
      
      if (currentAppearance.fontSize) {
        css += `.story-read { font-size: ${currentAppearance.fontSize}px !important; }\n`;
        css += `.story-read-opening { font-size: ${currentAppearance.fontSize}px !important; }\n`;
        css += `.story-read-entry-title { font-size: ${currentAppearance.fontSize}px !important; }\n`;
        css += `.story-read-entry-content { font-size: ${currentAppearance.fontSize}px !important; }\n`;
      }
      
      // 调试输出
      if (css) {
        console.log('[StoryApp] 注入的CSS:', css);
        styleElement.textContent = css;
      } else {
        styleElement.textContent = '';
      }
      
      // 强制在所有相关元素上直接设置样式（Safari PWA兼容性）
      if (currentAppearance.fontFamily || currentAppearance.fontSize) {
        const storyReadElements = document.querySelectorAll('.story-read, .story-read-opening, .story-read-entry-title, .story-read-entry-content');
        storyReadElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          if (currentAppearance.fontFamily) {
            htmlEl.style.setProperty('font-family', currentAppearance.fontFamily, 'important');
          }
          if (currentAppearance.fontSize) {
            htmlEl.style.setProperty('font-size', `${currentAppearance.fontSize}px`, 'important');
          }
        });
        console.log('[StoryApp] 已直接设置', storyReadElements.length, '个元素的字体样式');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [appearance, mode, currentRoleId]); // 当appearance、mode或currentRoleId变化时更新

  React.useEffect(() => {
    if (!onHeaderActionsChange) return;
    
    if (mode === 'read' && currentRoleId) {
      // 阅读模式：返回列表页，显示三个点
      const role = roles.find((r) => r.id === currentRoleId);
      if (role) {
        const roleId = role.id;
        onHeaderActionsChange({
          showBack: true,
          showMore: true,
          onBack: () => {
            setCurrentRoleId(null);
            setMode('list');
          },
          onMore: () => {
            const targetRole = roles.find((r) => r.id === roleId);
            if (!targetRole) return;
            setCurrentRoleId(roleId);
            setName(targetRole.name);
            setGender(targetRole.gender);
            setRoleAge(typeof targetRole.age === 'number' && targetRole.age > 0 ? String(targetRole.age) : '');
            setOpening(targetRole.opening ?? '');
            setAvatarUrl(targetRole.avatarUrl);
            setWorldbooks(targetRole.worldbooks);
            setOpenWorldbookIds(targetRole.worldbooks.map((wb) => wb.id));
            setOpenEntryIds(
              targetRole.worldbooks.flatMap((wb) => wb.entries.map((e) => e.id))
            );
            // 加载联系方式
            setRolePhoneNumber(targetRole.phoneNumber ?? '');
            setRoleWechatId(targetRole.wechatId ?? '');
            setMode('edit');
          }
        });
      }
    } else if (mode === 'list') {
      // 列表模式：返回桌面（不显示返回键，让App.tsx处理）
      onHeaderActionsChange({
        showBack: true,
        showMore: false,
        onBack: undefined // 使用默认的返回桌面功能
      });
    } else if (mode === 'create' || mode === 'edit') {
      // 创建/编辑模式：如果有正在阅读的角色，返回阅读页；否则返回列表页
      onHeaderActionsChange({
        showBack: true,
        showMore: false,
        onBack: () => {
          // 如果是编辑模式且有正在阅读的角色，返回到阅读页
          if (mode === 'edit' && currentRoleId) {
            setMode('read');
          } else {
            // 创建模式或没有正在阅读的角色，返回列表页
            setCurrentRoleId(null);
            resetForm();
            setMode('list');
          }
        }
      });
    } else if (mode === 'identity' || mode === 'appearance') {
      // 身份设置模式或美化设置模式：如果有正在阅读的角色，返回阅读页；否则返回创建页
      onHeaderActionsChange({
        showBack: true,
        showMore: false,
        onBack: () => {
          // 如果有正在阅读的角色，返回到阅读页
          if (currentRoleId) {
            setMode('read');
          } else {
            // 否则返回到创建页
            setMode('create');
          }
        }
      });
    }
  }, [mode, currentRoleId, roles, onHeaderActionsChange]);

  // 当切换到identity模式时，同步加载玩家世界书
  React.useEffect(() => {
    if (mode === 'identity') {
      const loadedIdentity = loadIdentity();
      setPlayerWorldbooks(loadedIdentity.worldbooks ?? []);
      setOpenPlayerWorldbookIds((loadedIdentity.worldbooks ?? []).map((wb) => wb.id));
      setOpenPlayerEntryIds(
        (loadedIdentity.worldbooks ?? []).flatMap((wb) => wb.entries.map((e) => e.id))
      );
    }
  }, [mode]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem('mini-ai-phone.story-length');
      if (!raw) return;
      const n = Number(raw);
      if (!Number.isNaN(n) && n > 0) {
        setTargetLength(n);
        setLengthInput(String(n));
      }
    } catch {
      // ignore
    }
  }, []);

  // 使用ref存储最新的状态，避免useEffect依赖项变化导致监听器重新注册
  const currentRoleIdRef = React.useRef(currentRoleId);
  const modeRef = React.useRef(mode);
  const storyLoadingRef = React.useRef(storyLoading);
  const setStoryTurnsRef = React.useRef(setStoryTurns);
  const setStoryLoadingRef = React.useRef(setStoryLoading);
  const setMessageRef = React.useRef(setMessage);

  // 更新ref值
  React.useEffect(() => {
    currentRoleIdRef.current = currentRoleId;
    modeRef.current = mode;
    storyLoadingRef.current = storyLoading;
  }, [currentRoleId, mode, storyLoading]);

  // 监听好友申请事件，自动生成剧情（后台自动生成，不依赖当前模式）
  React.useEffect(() => {
    const handleFriendRequestSent = async (event: CustomEvent<{ roleId: string; requestId: string }>) => {
      const { roleId } = event.detail;
      console.log('[StoryApp] 收到好友申请事件，开始处理:', roleId);
      
      // 延迟一点时间，确保localStorage已经保存
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 检查是否有待处理的好友申请
      const pendingRequests = loadFriendRequests().filter(
        req => req.roleId === roleId && req.status === 'pending'
      );

      console.log('[StoryApp] 待处理的好友申请数量:', pendingRequests.length);

      if (pendingRequests.length === 0) {
        console.warn('[StoryApp] 没有找到待处理的好友申请，退出');
        return;
      }

      // 从roles数组中查找角色（需要确保roles已加载）
      const allRoles = loadRoles();
      console.log('[StoryApp] 加载的角色总数:', allRoles.length);
      const role = allRoles.find((r) => r.id === roleId);
      if (!role) {
        console.warn('[StoryApp] 未找到角色，无法自动生成剧情:', roleId);
        console.warn('[StoryApp] 可用的角色ID:', allRoles.map(r => r.id));
        return;
      }

      console.log('[StoryApp] 找到角色:', role.name);

      const cfg = loadApiConfig();
      if (!cfg.baseUrl || !cfg.model) {
        // 如果API未配置，不显示错误，静默返回
        console.warn('[StoryApp] API未配置，无法自动生成剧情. baseUrl:', cfg.baseUrl, 'model:', cfg.model);
        return;
      }

      console.log('[StoryApp] API配置正常，开始生成剧情');

      // 如果用户当前正在阅读该角色且正在生成中，不重复触发
      if (currentRoleIdRef.current === roleId && storyLoadingRef.current) {
        console.log('[StoryApp] 该角色正在生成中，跳过');
        return;
      }

      // 从localStorage加载该角色的剧情数据（不依赖当前UI状态）
      const existingTurns = loadRoleChat(roleId);
      console.log('[StoryApp] 加载的现有剧情轮次:', existingTurns.length);

      // 如果用户当前正在阅读该角色，显示加载状态
      const isCurrentRole = currentRoleIdRef.current === roleId && modeRef.current === 'read';
      if (isCurrentRole) {
        setStoryLoadingRef.current(true);
        setMessageRef.current(null);
      }

      try {
        console.log('[StoryApp] 开始调用AI生成剧情...');
        // 使用该角色的剧情数据生成下一段，让AI自然地回应好友申请
        const aiResponse = await generateAIResponse(existingTurns, role, undefined, roleId);
        console.log('[StoryApp] AI生成成功，回复长度:', aiResponse.length);

        const withAi: StoryTurn[] = [
          ...existingTurns,
          { from: 'narrator', text: aiResponse, kind: 'narration' }
        ];
        
        // 保存到localStorage
        saveRoleChat(roleId, withAi);
        console.log('[StoryApp] 已保存剧情到localStorage，总轮次:', withAi.length);

        // 从AI回复中提取微信消息并同步到微信聊天页面
        extractAndSyncWeChatMessages(roleId, aiResponse);

        // 如果用户当前正在阅读该角色，更新UI状态
        if (isCurrentRole) {
          console.log('[StoryApp] 用户正在阅读该角色，更新UI');
          setStoryTurnsRef.current(withAi);
        } else {
          console.log('[StoryApp] 用户不在该角色的阅读模式，已后台保存');
        }

        // 检查AI回复中是否包含角色同意好友申请的内容
        checkAndProcessFriendRequest(roleId, aiResponse);

        // 评估并更新好感度（好友申请可能影响好感度）
        const favorData = loadRoleFavorSync(roleId);
        await evaluateAndUpdateFavor(roleId, '', aiResponse, role, favorData);

        console.log('[StoryApp] 已自动生成好友申请剧情完成:', roleId);
      } catch (err) {
        // 显示详细错误信息
        console.error('[StoryApp] 自动生成好友申请剧情失败:', err);
        console.error('[StoryApp] 错误详情:', {
          roleId,
          roleName: role?.name,
          existingTurnsCount: existingTurns.length,
          error: err instanceof Error ? err.message : String(err)
        });
      } finally {
        // 如果用户当前正在阅读该角色，清除加载状态
        if (isCurrentRole) {
          setStoryLoadingRef.current(false);
        }
      }
    };

    // 监听story-updated事件，更新UI（当全局监听器生成剧情后）
    const handleStoryUpdated = (event: CustomEvent<{ roleId: string; turns: StoryTurn[] }>) => {
      const { roleId: updatedRoleId, turns } = event.detail;
      // 如果用户当前正在阅读该角色，更新UI
      if (currentRoleIdRef.current === updatedRoleId && modeRef.current === 'read') {
        console.log('[StoryApp] [组件监听器] 收到剧情更新事件，更新UI');
        setStoryTurnsRef.current(turns);
      }
    };

    console.log('[StoryApp] [组件监听器] 注册剧情更新事件监听器');
    window.addEventListener('story-updated', handleStoryUpdated as unknown as EventListener);

    return () => {
      console.log('[StoryApp] [组件监听器] 移除剧情更新事件监听器');
      window.removeEventListener('story-updated', handleStoryUpdated as unknown as EventListener);
      // 注意：generate-story-for-wechat-message 的监听器在模块级别注册，不需要在这里移除
    };
  }, []); // 空依赖数组，只在组件挂载时注册一次，使用ref访问最新状态

  const resetForm = () => {
    setName('');
    setGender('');
    setRoleAge('');
    setOpening('');
    setOpeningKeyword('');
    setAvatarUrl('');
    setWorldbooks([]);
    setMessage(null);
    setOpenWorldbookIds([]);
    setOpenEntryIds([]);
    // 重置联系方式
    setRolePhoneNumber('');
    setRoleWechatId('');
  };

  const handleAddWorldbook = () => {
    const id = createId();
    const firstEntryId = createId();
    setWorldbooks((prev) => [
      ...prev,
      {
        id,
        name: '',
        entries: [
          {
            id: firstEntryId,
            title: '',
            content: '',
            keyword: ''
          }
        ]
      }
    ]);
    setOpenWorldbookIds((prev) => [...prev, id]);
    setOpenEntryIds((prev) => [...prev, firstEntryId]);
  };

  const handleWorldbookNameChange = (id: string, value: string) => {
    setWorldbooks((prev) =>
      prev.map((wb) => (wb.id === id ? { ...wb, name: value } : wb))
    );
  };

  const handleAddEntry = (wbId: string) => {
    const newId = createId();
    setWorldbooks((prev) =>
      prev.map((wb) =>
        wb.id === wbId
          ? {
            ...wb,
            entries: [
              ...wb.entries,
              { id: newId, title: '', content: '' }
            ]
          }
          : wb
      )
    );
    setOpenEntryIds((prev) => [...prev, newId]);
  };

  const handleEntryChange = (
    wbId: string,
    entryId: string,
    field: 'title' | 'content' | 'keyword',
    value: string
  ) => {
    setWorldbooks((prev) =>
      prev.map((wb) =>
        wb.id === wbId
          ? {
            ...wb,
            entries: wb.entries.map((e) =>
              e.id === entryId ? { ...e, [field]: value } : e
            )
          }
          : wb
      )
    );
  };

  const handleGenerateEntryContent = async (
    wbId: string,
    entryId: string,
    keyword: string | undefined,
    title: string | undefined
  ) => {
    const kw = (keyword ?? '').trim();
    const entryTitle = (title ?? '').trim();
    if (!kw) {
      setMessage('请先在该条目的关键词中输入一些提示词');
      return;
    }

    const cfg = loadApiConfig();

    const roleName = name.trim() || '该角色';
    const genderLabel =
      gender === 'male' ? '男' : gender === 'female' ? '女' : gender === 'other' ? '其他' : '未指定';
    const ageLabel = roleAge.trim() ? `${roleAge.trim()} 岁` : '年龄未填写';

    const existingContext = worldbooks
      .map((wb) => {
        const wbName = wb.name || '未命名世界书';
        const entriesSummary = wb.entries
          .slice(0, 4)
          .map((e) => {
            const isCurrent = wb.id === wbId && e.id === entryId;
            const mark = isCurrent ? '（当前条目）' : '';
            const t = e.title || '未命名条目';
            const c = (e.content || '（暂未写内容，仅标题方向可供参考）').slice(0, 60);
            return `- 条目「${t}」${mark}：${c}`;
          })
          .join('\n');
        return `【世界书：${wbName}】\n${entriesSummary}`;
      })
      .join('\n\n');
    if (!cfg.baseUrl || !cfg.model) {
      setMessage('请先在 API 设置中配置好接口地址和模型');
      return;
    }

    setMessage('正在根据关键词生成世界书内容…');
    try {
      const endpointBase = cfg.baseUrl.replace(/\/+$/, '');
      const url =
        endpointBase.endsWith('/chat/completions') ||
          endpointBase.endsWith('/completions')
          ? endpointBase
          : endpointBase + '/chat/completions';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0.4,
          messages: [
            {
              role: 'system',
              content:
                '你是一个帮助玩家补充世界观与角色设定的助手。写作要求：1）用非常口语化、白话的中文来描述设定；2）不要写抒情句子、比喻和华丽修辞，只写干脆清晰的设定内容；3）长度适中，1～3段即可，每段2～3句；4）尽量用短句，直接说清楚「发生了什么」「现在是什么状态」「有哪些限制或规则」。生成内容时直接使用给出的角色姓名来指代，不要使用“这个角色”之类的模糊称呼；5）必须和后面提供的该角色其他世界书条目保持设定一致，避免出现前后矛盾或 OOC，如有冲突优先尊重已有条目。'
            },
            {
              role: 'user',
              content: `角色姓名：${roleName}，性别：${genderLabel}，年龄：${ageLabel}。当前世界书条目标题为：「${entryTitle || '（玩家尚未填写标题，可根据关键词自行概括一个小主题）'
                }」。以下是该角色已经写好的部分世界书条目摘要，请在此基础上补充新内容，保持风格和设定不 OOC：\n\n${existingContext ||
                '（当前还没有其他条目，可自由根据标题和关键词生成设定）'
                }\n\n请主要围绕当前条目标题的方向来写设定，再参考下面这些关键词进行补充。只用白话描述设定，不要写剧情展开，不要感叹：${kw}`
            }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`接口返回状态 ${res.status}`);
      }

      const data = (await res.json()) as any;
      let text: string =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        '';

      if (!text) {
        throw new Error('未从接口结果中解析到文本内容');
      }

      setWorldbooks((prev) =>
        prev.map((wb) =>
          wb.id === wbId
            ? {
              ...wb,
              entries: wb.entries.map((e) =>
                e.id === entryId
                  ? {
                    ...e,
                    content: e.content
                      ? `${e.content}\n\n${text}`
                      : text
                  }
                  : e
              )
            }
            : wb
        )
      );
      setMessage('已根据关键词生成补充内容，可继续手动修改');
    } catch (err) {
      setMessage(`生成失败：${(err as Error).message}`);
    }
  };

  const handleAvatarFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // 生成微信资料
  const generateWeChatProfile = async (role: StoryRole): Promise<{ nickname?: string; signature?: string }> => {
    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      return {};
    }

    try {
      const endpointBase = cfg.baseUrl.replace(/\/+$/, '');
      const url =
        endpointBase.endsWith('/chat/completions') ||
          endpointBase.endsWith('/completions')
          ? endpointBase
          : endpointBase + '/chat/completions';

      const genderLabel = role.gender === 'male' ? '男' : role.gender === 'female' ? '女' : '其他';
      const ageLabel = role.age ? `${role.age}岁` : '年龄未指定';
      
      // 获取角色世界书摘要
      const worldbookSummary = role.worldbooks?.slice(0, 3).map(wb => {
        const entries = wb.entries?.slice(0, 2).map((e: any) => e.title || '').filter(Boolean).join('、') || '';
        return entries ? `${wb.name}：${entries}` : '';
      }).filter(Boolean).join('；') || '';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: '你是一个帮助生成微信个人资料的助手。根据角色信息生成符合人设的微信昵称和个性签名。要求：1）微信昵称要简洁、有个性，符合角色性格，长度2-8个字，**绝对不要使用角色的真实姓名**，要创造一个符合人设的昵称；2）个性签名要简短、有特色，体现角色的性格或态度，长度不超过20个字；3）直接输出JSON格式：{"nickname": "微信昵称", "signature": "个性签名"}，不要添加任何其他说明，不要使用markdown代码块。'
            },
            {
              role: 'user',
              content: `角色姓名：${role.name}，性别：${genderLabel}，年龄：${ageLabel}。${worldbookSummary ? `角色设定：${worldbookSummary}。` : ''}请为这个角色生成一个符合人设的微信昵称（**不要使用角色真实姓名${role.name}**，要创造一个符合人设的昵称）和个性签名。`
            }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`接口返回状态 ${res.status}`);
      }

      const data = (await res.json()) as any;
      let text: string =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        '';

      if (!text) {
        throw new Error('未从接口结果中解析到文本内容');
      }

      // 尝试解析JSON
      let parsed: { nickname?: string; signature?: string } = {};
      try {
        // 移除可能的markdown代码块标记
        text = text.replace(/^```json\n?/g, '').replace(/^```\n?/g, '').replace(/\n?```$/g, '').trim();
        parsed = JSON.parse(text);
      } catch {
        // 如果解析失败，尝试提取昵称和签名（支持多种格式）
        const nicknameMatch = text.match(/["']nickname["']\s*:\s*["']([^"']+)["']/) || 
                              text.match(/nickname["']?\s*[:：]\s*["']?([^"',\n}]+)/);
        const signatureMatch = text.match(/["']signature["']\s*:\s*["']([^"']+)["']/) || 
                               text.match(/signature["']?\s*[:：]\s*["']?([^"',\n}]+)/);
        if (nicknameMatch) parsed.nickname = nicknameMatch[1].trim();
        if (signatureMatch) parsed.signature = signatureMatch[1].trim();
      }

      // 调试输出
      if (parsed.nickname || parsed.signature) {
        console.log('生成的微信资料:', parsed);
      } else {
        console.warn('微信资料生成失败，原始返回:', text);
      }

      return parsed;
    } catch (err) {
      console.error('生成微信资料失败:', err);
      return {};
    }
  };

  const handleSaveRole = async () => {
    if (!name.trim()) {
      setMessage('请先填写角色姓名');
      return;
    }
    const ageNumber = roleAge.trim() ? Number(roleAge.trim()) : null;
    if (roleAge.trim() && (Number.isNaN(ageNumber) || ageNumber! <= 0)) {
      setMessage('角色年龄请输入大于 0 的数字，或留空不填');
      return;
    }
    const id = mode === 'edit' && currentRoleId ? currentRoleId : createId();
    
    // 检查是否有联系方式，如果有则生成微信资料
    const hasContact = (rolePhoneNumber.trim() || roleWechatId.trim());
    let wechatProfile: { nickname?: string; signature?: string } = {};
    
    if (hasContact) {
      setMessage('正在生成微信资料...');
      const newRole: StoryRole = {
        id,
        name: name.trim(),
        gender,
        age: ageNumber,
        opening: opening.trim(),
        avatarUrl: avatarUrl.trim(),
        worldbooks,
        phoneNumber: rolePhoneNumber.trim() || undefined,
        wechatId: roleWechatId.trim() || undefined
      };
      wechatProfile = await generateWeChatProfile(newRole);
    }
    
    const newRole: StoryRole = {
      id,
      name: name.trim(),
      gender,
      age: ageNumber,
      opening: opening.trim(),
      avatarUrl: avatarUrl.trim(),
      worldbooks,
      // 保存联系方式
      phoneNumber: rolePhoneNumber.trim() || undefined,
      wechatId: roleWechatId.trim() || undefined,
      // 保存微信资料
      wechatNickname: wechatProfile.nickname,
      wechatSignature: wechatProfile.signature
    };
    
    // 如果是编辑模式，保留原有的微信资料（如果没有新生成且没有联系方式）
    if (mode === 'edit' && currentRoleId) {
      const oldRole = roles.find(r => r.id === currentRoleId);
      // 如果有联系方式但生成失败，保留原有资料；如果没有联系方式，也保留原有资料
      if (oldRole) {
        if (!hasContact || !wechatProfile.nickname) {
          newRole.wechatNickname = oldRole.wechatNickname;
        }
        if (!hasContact || !wechatProfile.signature) {
          newRole.wechatSignature = oldRole.wechatSignature;
        }
      }
    }
    
    // 如果有联系方式但生成失败，给出提示
    if (hasContact && (!wechatProfile.nickname || !wechatProfile.signature)) {
      console.warn('微信资料生成不完整:', wechatProfile);
    }
    
    const next =
      mode === 'edit' && currentRoleId
        ? roles.map((r) => (r.id === currentRoleId ? newRole : r))
        : [...roles, newRole];
    setRoles(next);
    saveRoles(next);
    setMode('list');
    resetForm();
    setCurrentRoleId(null);
    
    // 显示保存消息，如果有生成微信资料则提示
    let msg = mode === 'edit' ? '角色设定已更新' : '角色已创建，可以开始记录线下故事';
    if (hasContact) {
      if (wechatProfile.nickname && wechatProfile.signature) {
        msg += `（已生成微信昵称：${wechatProfile.nickname}）`;
      } else {
        msg += '（微信资料生成失败，请检查API配置）';
      }
    }
    setMessage(msg);
  };

  const handleIdentityChange = (field: keyof PlayerIdentity, value: string) => {
    setIdentity((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveIdentity = () => {
    const trimmed: PlayerIdentity = {
      name: identity.name.trim(),
      gender: identity.gender,
      intro: identity.intro.trim(),
      tags: identity.tags.trim(),
      worldbooks: playerWorldbooks,
      // 保存联系方式
      phoneNumber: identity.phoneNumber?.trim() || undefined,
      wechatId: identity.wechatId?.trim() || undefined
    };
    saveIdentity(trimmed);
    setIdentity(trimmed);
    setMessage('玩家个人身份已保存（仅保存在本地浏览器）');
  };

  const handleAppearanceChange = (field: keyof StoryAppearance, value: string | number) => {
    setAppearance((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAppearance = () => {
    saveAppearance(appearance);
    setMessage(`美化设置已保存${appearance.fontFamily ? ` - 字体: ${appearance.fontFamily}` : ''}${appearance.fontSize ? ` - 大小: ${appearance.fontSize}px` : ''}`);
  };

  const handleBackgroundImageFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAppearance((prev) => ({ ...prev, backgroundImage: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // 玩家世界书处理函数
  const handleAddPlayerWorldbook = () => {
    const id = createId();
    const firstEntryId = createId();
    setPlayerWorldbooks((prev) => [
      ...prev,
      {
        id,
        name: '',
        entries: [
          {
            id: firstEntryId,
            title: '',
            content: '',
            keyword: ''
          }
        ]
      }
    ]);
    setOpenPlayerWorldbookIds((prev) => [...prev, id]);
    setOpenPlayerEntryIds((prev) => [...prev, firstEntryId]);
  };

  const handlePlayerWorldbookNameChange = (id: string, value: string) => {
    setPlayerWorldbooks((prev) =>
      prev.map((wb) => (wb.id === id ? { ...wb, name: value } : wb))
    );
  };

  const handleAddPlayerEntry = (wbId: string) => {
    const newId = createId();
    setPlayerWorldbooks((prev) =>
      prev.map((wb) =>
        wb.id === wbId
          ? {
              ...wb,
              entries: [
                ...wb.entries,
                { id: newId, title: '', content: '' }
              ]
            }
          : wb
      )
    );
    setOpenPlayerEntryIds((prev) => [...prev, newId]);
  };

  const handlePlayerEntryChange = (
    wbId: string,
    entryId: string,
    field: 'title' | 'content' | 'keyword',
    value: string
  ) => {
    setPlayerWorldbooks((prev) =>
      prev.map((wb) =>
        wb.id === wbId
          ? {
              ...wb,
              entries: wb.entries.map((e) =>
                e.id === entryId ? { ...e, [field]: value } : e
              )
            }
          : wb
      )
    );
  };

  const handleGeneratePlayerEntryContent = async (
    wbId: string,
    entryId: string,
    keyword: string | undefined,
    title: string | undefined
  ) => {
    const kw = (keyword ?? '').trim();
    const entryTitle = (title ?? '').trim();
    if (!kw) {
      setMessage('请先在该条目的关键词中输入一些提示词');
      return;
    }

    const cfg = loadApiConfig();

    const playerName = identity.name.trim() || '该玩家';
    const genderLabel =
      identity.gender === 'male' ? '男' : identity.gender === 'female' ? '女' : identity.gender === 'other' ? '其他' : '未指定';

    const existingContext = playerWorldbooks
      .map((wb) => {
        const wbName = wb.name || '未命名世界书';
        const entriesSummary = wb.entries
          .slice(0, 4)
          .map((e) => {
            const isCurrent = wb.id === wbId && e.id === entryId;
            const mark = isCurrent ? '（当前条目）' : '';
            const t = e.title || '未命名条目';
            const c = (e.content || '（暂未写内容，仅标题方向可供参考）').slice(0, 60);
            return `- 条目「${t}」${mark}：${c}`;
          })
          .join('\n');
        return `【世界书：${wbName}】\n${entriesSummary}`;
      })
      .join('\n\n');
    if (!cfg.baseUrl || !cfg.model) {
      setMessage('请先在 API 设置中配置好接口地址和模型');
      return;
    }

    setMessage('正在根据关键词生成玩家世界书内容…');
    try {
      const endpointBase = cfg.baseUrl.replace(/\/+$/, '');
      const url =
        endpointBase.endsWith('/chat/completions') ||
          endpointBase.endsWith('/completions')
          ? endpointBase
          : endpointBase + '/chat/completions';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0.4,
          messages: [
            {
              role: 'system',
              content:
                '你是一个帮助玩家补充个人设定与身份信息的助手。写作要求：1）用非常口语化、白话的中文来描述设定；2）不要写抒情句子、比喻和华丽修辞，只写干脆清晰的设定内容；3）长度适中，1～3段即可，每段2～3句；4）尽量用短句，直接说清楚「发生了什么」「现在是什么状态」「有哪些限制或规则」。生成内容时直接使用给出的玩家姓名来指代，不要使用"这个玩家"之类的模糊称呼；5）必须和后面提供的该玩家其他世界书条目保持设定一致，避免出现前后矛盾，如有冲突优先尊重已有条目。'
            },
            {
              role: 'user',
              content: `玩家姓名：${playerName}，性别：${genderLabel}。当前世界书条目标题为：「${entryTitle || '（玩家尚未填写标题，可根据关键词自行概括一个小主题）'
                }」。以下是该玩家已经写好的部分世界书条目摘要，请在此基础上补充新内容，保持风格和设定一致：\n\n${existingContext ||
                '（当前还没有其他条目，可自由根据标题和关键词生成设定）'
                }\n\n请主要围绕当前条目标题的方向来写设定，再参考下面这些关键词进行补充。只用白话描述设定，不要写剧情展开，不要感叹：${kw}`
            }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`接口返回状态 ${res.status}`);
      }

      const data = (await res.json()) as any;
      let text: string =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        '';

      if (!text) {
        throw new Error('未从接口结果中解析到文本内容');
      }

      setPlayerWorldbooks((prev) =>
        prev.map((wb) =>
          wb.id === wbId
            ? {
                ...wb,
                entries: wb.entries.map((e) =>
                  e.id === entryId
                    ? {
                        ...e,
                        content: e.content
                          ? `${e.content}\n\n${text}`
                          : text
                      }
                    : e
                )
              }
            : wb
        )
      );
      setMessage('已根据关键词生成补充内容，可继续手动修改');
    } catch (err) {
      setMessage(`生成失败：${(err as Error).message}`);
    }
  };

  const handleGenerateIdentityIntro = async () => {
    const playerName = identity.name.trim();
    if (!playerName) {
      setMessage('请先填写玩家姓名');
      return;
    }

    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      setMessage('请先在 API 设置中配置好接口地址和模型');
      return;
    }

    const genderLabel =
      identity.gender === 'male'
        ? '男'
        : identity.gender === 'female'
          ? '女'
          : identity.gender === 'other'
            ? '其他 / 保密'
            : '未指定';

    setMessage('正在根据姓名和标签生成玩家自我介绍…');
    try {
      const endpointBase = cfg.baseUrl.replace(/\/+$/, '');
      const url =
        endpointBase.endsWith('/chat/completions') ||
          endpointBase.endsWith('/completions')
          ? endpointBase
          : endpointBase + '/chat/completions';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0.4,
          messages: [
            {
              role: 'system',
              content:
                '你是一个帮助玩家写一段简短自我介绍的助手。写作要求：1）使用非常口语化、自然的中文；2）控制在 1～2 句；3）要直接使用给出的姓名来指代，不要用“这个人”“玩家”等模糊称呼；4）可以参考给出的性别和标签信息，但不要编造极端设定；5）不要写煽情鸡汤或广告文案，只要朴素、生活化的描述。'
            },
            {
              role: 'user',
              content: `玩家姓名：${playerName}，性别：${genderLabel}。玩家标签：${identity.tags || '（玩家暂未填写标签，你可以补充一些常见的兴趣、职业或生活状态）'
                }。请基于这些信息写一段适合放在线下故事“玩家身份”里的自我介绍，长度 1～2 句即可。`
            }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`接口返回状态 ${res.status}`);
      }

      const data = (await res.json()) as any;
      let text: string =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        '';

      if (!text) {
        throw new Error('未从接口结果中解析到文本内容');
      }

      text = text.trim();

      setIdentity((prev) => ({
        ...prev,
        intro: text
      }));
      setMessage('玩家自我介绍已生成，可继续手动微调');
    } catch (err) {
      setMessage(`生成失败：${(err as Error).message}`);
    }
  };

  const handleGenerateOpening = async () => {
    if (!name.trim()) {
      setMessage('请先填写角色姓名，再为开场白补全关键词');
      return;
    }
    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      setMessage('请先在 API 设置中配置好接口地址和模型');
      return;
    }

    const roleName = name.trim();
    const genderLabel =
      gender === 'male' ? '男' : gender === 'female' ? '女' : gender === 'other' ? '其他' : '未指定';
    const ageLabel = roleAge.trim() ? `${roleAge.trim()} 岁` : '年龄未填写';
    const kw = openingKeyword.trim();

    setMessage('正在根据关键词生成角色故事开场白…');
    try {
      const endpointBase = cfg.baseUrl.replace(/\/+$/, '');
      const url =
        endpointBase.endsWith('/chat/completions') ||
          endpointBase.endsWith('/completions')
          ? endpointBase
          : endpointBase + '/chat/completions';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0.5,
          messages: [
            {
              role: 'system',
              content:
                '你是一个线上文字游戏的故事写手，负责为角色生成故事开场白。写作要求：1）使用简洁、带一点网文感但不过分夸张的中文；2）长度控制在 2～4 句，适合作为章节开头；3）要直接使用给出的角色姓名来称呼，不要用“主角”“他/她”开头；4）可以点到为止地交代时间、地点或角色当前处境，但不要把整段剧情写完；5）注意角色的性别和年龄设定，避免不符合设定的行为；6）不要出现第二人称「你」，保持第三人称叙述。'
            },
            {
              role: 'user',
              content: `角色姓名：${roleName}，性别：${genderLabel}，年龄：${ageLabel}。如果有关键词，请参考：${kw || '（玩家暂未填写关键词，可以自由构思一个日常系或轻剧情向的开场）'
                }。请为这个角色写一小段适合作为「故事开场白」的文字。`
            }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`接口返回状态 ${res.status}`);
      }

      const data = (await res.json()) as any;
      let text: string =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        '';

      if (!text) {
        throw new Error('未从接口结果中解析到文本内容');
      }

      text = text.trim();

      setOpening((prev) => (prev ? `${prev}\n\n${text}` : text));
      setMessage('角色开场白已生成，可继续手动润色');
    } catch (err) {
      setMessage(`生成失败：${(err as Error).message}`);
    }
  };

  /**
   * 评估并更新好感度
   * 根据玩家输入和AI生成的剧情,判断是否有合理的理由增加好感度
   */
  const evaluateAndUpdateFavor = async (
    roleId: string,
    playerInput: string,
    aiResponse: string,
    role: StoryRole,
    currentFavor: FavorData
  ) => {
    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      return; // 如果没有API配置,跳过评估
    }

    try {
      const endpointBase = cfg.baseUrl.replace(/\/+$/, '');
      const url =
        endpointBase.endsWith('/chat/completions') ||
          endpointBase.endsWith('/completions')
          ? endpointBase
          : endpointBase + '/chat/completions';

      // 获取角色世界书摘要
      const worldbookSummary = role.worldbooks
        ?.slice(0, 2)
        .map(wb => {
          const entries = wb.entries?.slice(0, 2).map((e: any) => e.title || '').filter(Boolean).join('、') || '';
          return entries ? `${wb.name}：${entries}` : '';
        })
        .filter(Boolean)
        .join('；') || '';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0.3, // 使用较低的温度以获得更稳定的判断
          messages: [
            {
              role: 'system',
              content:
                '你是一个评估角色好感度变化的助手。根据玩家输入和AI生成的剧情,判断角色对玩家的好感度是否应该增加或减少。\n' +
                '评估规则：\n' +
                '1）**严禁玛丽苏式升温**：好感度变化必须符合逻辑和现实,需要合理的契机。\n' +
                '2）**慢火熬粥原则**：好感度变化应该是渐进式的,不会因为一次互动就大幅变化。\n' +
                '3）**符合人设**：角色的反应必须符合其性格和人设,不会因为好感度变化就做出不符合人设的行为。\n' +
                '4）**符合好感度阶段**：角色的反应要符合当前好感度阶段,不会突然变得过于亲密或疏远。\n' +
                '5）**增加好感度的合理契机**：\n' +
                '   - 玩家做了符合角色价值观的好事或善举\n' +
                '   - 玩家在关键时刻帮助了角色\n' +
                '   - 玩家与角色有深度的情感交流或理解\n' +
                '   - 玩家与角色有共同的兴趣或话题,产生了共鸣\n' +
                '   - 玩家尊重角色的边界和感受\n' +
                '6）**减少好感度的合理契机**：\n' +
                '   - 玩家做了不符合角色价值观的事或伤害了角色\n' +
                '   - 玩家侵犯了角色的边界或隐私\n' +
                '   - 玩家对角色不尊重或冒犯\n' +
                '   - 玩家与角色发生冲突或争吵\n' +
                '   - 玩家做了让角色失望或生气的事\n' +
                '7）**不变化的情况**：\n' +
                '   - 只是普通的日常对话\n' +
                '   - 剧情只是正常推进,没有特别的互动\n' +
                '   - 互动是中性的,既没有正面也没有负面影响\n' +
                '8）**变化幅度**：\n' +
                '   - 增加：1-3点,且必须符合当前好感度阶段\n' +
                '   - 减少：1-3点,且必须符合当前好感度阶段\n' +
                '   - 严重事件(如重大冲突、严重伤害)可以减少更多,但最多不超过5点\n' +
                '9）输出格式：直接输出JSON,格式为 {"delta": -3到3之间的整数, "reason": "原因说明"}。\n' +
                '   - delta > 0 表示增加好感度\n' +
                '   - delta < 0 表示减少好感度\n' +
                '   - delta = 0 表示不变化\n' +
                '   - 绝对值应该在1-3之间,严重事件可以到5'
            },
            {
              role: 'user',
              content: `当前角色：${role.name}, 性别：${role.gender === 'male' ? '男' : role.gender === 'female' ? '女' : '其他'}, 年龄：${role.age || '未指定'}。\n` +
                `当前好感度：${currentFavor.value}/100 (${getFavorStageLabel(getFavorStage(currentFavor.value))}阶段)\n` +
                `${worldbookSummary ? `角色人设摘要：${worldbookSummary}\n` : ''}` +
                `玩家输入：${playerInput}\n` +
                `AI生成的剧情：${aiResponse}\n\n` +
                `请根据以上信息,评估这次互动是否应该增加或减少好感度。记住：必须符合逻辑和现实,严禁玛丽苏式升温,好感度变化是慢火熬粥式的渐进过程。如果玩家做了负面的事,好感度应该减少；如果做了正面的事,好感度可以增加；如果是普通互动,则不变化。`
            }
          ]
        })
      });

      if (!res.ok) {
        return; // 如果请求失败,跳过更新
      }

      const data = (await res.json()) as any;
      let text: string =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        '';

      if (!text) {
        return;
      }

      // 尝试解析JSON
      let parsed: { delta?: number; reason?: string } = {};
      try {
        // 移除可能的markdown代码块标记
        text = text.replace(/^```json\n?/g, '').replace(/^```\n?/g, '').replace(/\n?```$/g, '').trim();
        parsed = JSON.parse(text);
      } catch {
        // 如果解析失败,尝试提取关键信息
        const deltaMatch = text.match(/delta["']?\s*[:：]\s*(-?\d+)/);
        if (deltaMatch) {
          parsed.delta = parseInt(deltaMatch[1], 10);
        }
      }

      // 如果delta不为0,则更新好感度
      if (parsed.delta !== undefined && parsed.delta !== 0) {
        // 限制delta在-5到5之间(严重事件最多5点)
        const delta = Math.max(-5, Math.min(5, parsed.delta));
        updateRoleFavor(roleId, delta, parsed.reason || '剧情互动');
        // 可以在这里添加一个提示,但为了不打断用户体验,暂时不显示
      }
    } catch (err) {
      // 静默失败,不影响主流程
      console.error('好感度评估失败:', err);
    }
  };

  /**
   * 根据当前剧情和好感度，动态生成简短的好感度描述
   * @param turns 当前的剧情轮次
   * @param role 角色信息
   * @param favorData 好感度数据
   * @param favorStage 好感度阶段
   * @returns 动态生成的好感度描述
   */
  const generateDynamicFavorDescription = async (
    turns: StoryTurn[],
    role: StoryRole,
    favorData: FavorData,
    favorStage: FavorStage
  ): Promise<string> => {
    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      // 如果没有API配置,返回默认描述
      const defaultDescriptions: Record<FavorStage, string> = {
        stranger: '对玩家保持礼貌但疏离',
        acquaintance: '与玩家关系较浅，互动有限',
        familiar: '与玩家关系熟悉，可以日常交流',
        friend: '将玩家视为朋友，关系亲近',
        close: '对玩家非常信任和亲近'
      };
      return defaultDescriptions[favorStage];
    }

    try {
      const endpointBase = cfg.baseUrl.replace(/\/+$/, '');
      const url =
        endpointBase.endsWith('/chat/completions') ||
          endpointBase.endsWith('/completions')
          ? endpointBase
          : endpointBase + '/chat/completions';

      // 构造最近几轮上下文
      const recent = turns
        .slice(-4)
        .map((t) => {
          if (t.from === 'player') {
            return t.kind === 'speech'
              ? `【玩家对白】${t.text}`
              : `【玩家场景】${t.text}`;
          }
          return `【叙述】${t.text}`;
        })
        .join('\n');

      // 获取角色世界书摘要
      const worldbookSummary = role.worldbooks
        ?.slice(0, 2)
        .map(wb => {
          const entries = wb.entries?.slice(0, 2).map((e: any) => e.title || '').filter(Boolean).join('、') || '';
          return entries ? `${wb.name}：${entries}` : '';
        })
        .filter(Boolean)
        .join('；') || '';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0.5,
          messages: [
            {
              role: 'system',
              content:
                '你是一个评估角色与玩家关系的助手。根据当前剧情和好感度，用简洁自然的语言描述角色对玩家的态度和关系。\n' +
                '要求：\n' +
                '1）描述要简短，控制在15-25字之间\n' +
                '2）使用自然、生活化的语言，不要生硬\n' +
                '3）要符合当前好感度阶段和剧情发展\n' +
                '4）要符合角色的人设和性格\n' +
                '5）直接输出描述文字，不要添加引号或其他格式\n' +
                '6）使用第三人称，例如："对玩家保持礼貌但有些疏离"、"与玩家关系不错，可以轻松聊天"等'
            },
            {
              role: 'user',
              content: `角色：${role.name}，好感度：${favorData.value}/100（${getFavorStageLabel(favorStage)}阶段）。\n` +
                `${worldbookSummary ? `角色人设：${worldbookSummary}\n` : ''}` +
                `最近剧情：${recent || '（暂无剧情）'}\n\n` +
                `请根据以上信息，用15-25字简洁自然地描述角色对玩家的当前态度和关系。要符合好感度阶段、剧情发展和角色人设。`
            }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`接口返回状态 ${res.status}`);
      }

      const data = (await res.json()) as any;
      let text: string =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        '';

      if (!text) {
        throw new Error('未从接口结果中解析到文本内容');
      }

      text = text.trim();
      // 移除可能的引号
      text = text.replace(/^["'「『]|["'」』]$/g, '');
      
      // 如果太长，截断
      if (text.length > 30) {
        text = text.slice(0, 27) + '...';
      }

      return text || '对玩家保持基本礼貌';
    } catch (err) {
      console.error('生成好感度描述失败:', err);
      // 失败时返回默认描述
      const defaultDescriptions: Record<FavorStage, string> = {
        stranger: '对玩家保持礼貌但疏离',
        acquaintance: '与玩家关系较浅，互动有限',
        familiar: '与玩家关系熟悉，可以日常交流',
        friend: '将玩家视为朋友，关系亲近',
        close: '对玩家非常信任和亲近'
      };
      return defaultDescriptions[favorStage];
    }
  };

  /**
   * 生成AI回复的通用逻辑
   * @param turns 当前的剧情轮次
   * @param role 角色信息
   * @param playerInput 玩家输入（可选，用于好感度评估）
   * @param roleId 角色ID（可选，如果不提供则使用currentRoleId）
   * @returns 生成的AI回复文本
   */
  const generateAIResponse = async (
    turns: StoryTurn[],
    role: StoryRole,
    playerInput?: string,
    roleId?: string
  ): Promise<string> => {
    // 使用传入的roleId，如果没有则使用currentRoleId（向后兼容）
    const targetRoleId = roleId ?? currentRoleId;
    if (!targetRoleId) {
      throw new Error('角色ID未指定');
    }
    
    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      throw new Error('请先在 API 设置中配置好接口地址和模型');
    }

    const endpointBase = cfg.baseUrl.replace(/\/+$/, '');
    const url =
      endpointBase.endsWith('/chat/completions') ||
        endpointBase.endsWith('/completions')
        ? endpointBase
        : endpointBase + '/chat/completions';

    // 构造最近几轮上下文，避免太长
    const recent = turns
      .slice(-6)
      .map((t) => {
        if (t.from === 'player') {
          return t.kind === 'speech'
            ? `【玩家对白】${t.text}`
            : `【玩家场景】${t.text}`;
        }
        return `【叙述】${t.text}`;
      })
      .join('\n');

    // 构造角色世界书内容
    const worldbookContent = role.worldbooks
      .map((wb) => {
        const wbName = wb.name || '未命名世界书';
        const entriesText = wb.entries
          .filter((e) => e.title || e.content) // 只包含有内容的条目
          .map((e) => {
            const title = e.title || '（未命名条目）';
            const content = e.content || '';
            return content ? `「${title}」：${content}` : `「${title}」`;
          })
          .join('\n');
        return entriesText ? `【${wbName}】\n${entriesText}` : '';
      })
      .filter((text) => text.length > 0)
      .join('\n\n');

    // 获取玩家身份信息和世界书
    const playerIdentity = loadIdentity();
    const playerWorldbookContent = (playerIdentity.worldbooks ?? [])
      .map((wb) => {
        const wbName = wb.name || '未命名世界书';
        const entriesText = wb.entries
          .filter((e) => e.title || e.content) // 只包含有内容的条目
          .map((e) => {
            const title = e.title || '（未命名条目）';
            const content = e.content || '';
            return content ? `「${title}」：${content}` : `「${title}」`;
          })
          .join('\n');
        return entriesText ? `【${wbName}】\n${entriesText}` : '';
      })
      .filter((text) => text.length > 0)
      .join('\n\n');
    
    const playerInfo = playerIdentity.name
      ? `玩家姓名：${playerIdentity.name}${playerIdentity.intro ? `\n玩家介绍：${playerIdentity.intro}` : ''}${playerIdentity.tags ? `\n玩家标签：${playerIdentity.tags}` : ''}${playerWorldbookContent ? `\n\n【玩家设定（世界书）】\n${playerWorldbookContent}` : ''}`
      : '（玩家尚未设置身份信息）';

    // 加载当前好感度(使用同步版本,因为这里已经有角色信息)
    const favorData = loadRoleFavorSync(targetRoleId);
    const favorStage = getFavorStage(favorData.value);
    const favorStageLabel = getFavorStageLabel(favorStage);

    // 动态生成好感度描述
    const favorDescription = await generateDynamicFavorDescription(turns, role, favorData, favorStage);

    const roleName = role.name;
    const genderLabel =
      role.gender === 'male'
        ? '男'
        : role.gender === 'female'
          ? '女'
          : role.gender === 'other'
            ? '其他'
            : '未指定';
    const ageLabel =
      typeof role.age === 'number' && role.age > 0 ? `${role.age} 岁` : '年龄未填写';

    // 检查是否有待处理的好友申请
    const pendingRequests = loadFriendRequests().filter(
      req => req.roleId === role.id && req.status === 'pending'
    );
    
    // 获取玩家微信信息（角色只能看到这些）
    const playerIdentityData = loadIdentity();
    const playerWechatNickname = (playerIdentityData as any).wechatNickname || playerIdentityData.name || '玩家';
    const playerWechatAvatar = (playerIdentityData as any).wechatAvatar || ''; // 如果有微信头像的话
    
    const friendRequestContext = pendingRequests.length > 0
      ? `\n\n**重要：好友申请提醒**\n玩家通过微信向${roleName}发送了好友申请。角色只能看到以下信息：1）玩家的微信昵称："${playerWechatNickname}"；2）玩家的微信头像${playerWechatAvatar ? `（已设置头像）` : `（默认头像）`}；3）玩家填写的打招呼消息："${pendingRequests[0].greeting}"。角色看不到其他申请信息（如备注、标签、朋友权限等）。角色可能会在剧情中自然地回应这个好友申请，比如同意、拒绝或者需要更多了解。如果角色在剧情中明确表示同意或接受好友申请，这表示好友申请已通过。`
      : '';

    // 默认目标长度
    const targetLength = 200;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              '你是一个线下剧情文字游戏的"剧情接力写手"。写作总规则：\n' +
              '1）每次只推进一小段完整剧情，长度由后续给出的目标字数决定，不再限制句子数量，但整体要紧凑、不要水字数。\n' +
              '2）坚决避免八股文、爽文、超雄、狗血、极端和病态情节，一切发展都建立在正常、合乎逻辑的前提下。\n' +
              '3）所有角色（包含 NPC）都是独立的人，不是功能模板：行为要符合他们在上下文中的信息和处境，不能出现集体同一种性格或口吻。\n' +
              '4）需要群像时，要适当描写场景中不同人物各自合理的反应，让他们互相"搭话"，而不是只围着单一主角转。\n' +
              '5）语言尽量口语化但不过度花哨，少用比喻与华丽辞藻，多用具体动作、细节和对话让人物"活"起来。\n' +
              '6）你的输出**永远不要替玩家做决定或安排具体行动**，不要写"你决定……""你选择……"之类的句式，只写当前时刻已经发生的角色和 NPC 的反应、对话与场景变化。\n' +
              '7）可以用第三人称，也可以在玩家输入是第一人称时保持第一人称视角，但仍然只描述当下和既成事实，不预设玩家未来的选择。\n' +
              '8）如果上一轮玩家输入是对白（被引号包住），你的续写要让这一句对白在当前场景中自然落地并引出新的反应；如果是场景描述，就顺势延展画面或人物状态。\n' +
              '9）**重要**：必须严格遵守角色设定（世界书内容），角色的行为、习惯、性格特征必须符合世界书中的设定。如果世界书中提到角色的某些习惯或特征（如"偶尔会抽烟"），在合适的场景中要自然地体现出来。\n' +
              '10）**重要**：叙述视角使用第三人称上帝视角，但在指代玩家时使用"你"来称呼，这样更有代入感。例如："角色A看见你这个样子"、"角色B想着你可能没吃饭"。角色在对话中可以使用玩家的真实姓名或其他称号来称呼玩家，例如："角色A看见你过来了，立马叫住你：\"XX！你在这里干嘛呢？\""。\n' +
              `11）**好感度系统**：当前角色对玩家的好感度为 ${favorData.value}/100，处于"${favorStageLabel}"阶段。角色对玩家的态度：${favorDescription}。**严禁玛丽苏式感情升温**：好感度的提升必须符合逻辑和现实，需要时间和合适的契机。即使玩家做了好事，角色的反应也要符合当前好感度阶段和角色人设，不会突然变得过于热情或做出不符合关系的亲密行为。好感度的提升是"慢火熬粥"式的渐进过程，不会因为一次互动就大幅提升。${friendRequestContext}\n` +
              '12）**微信消息格式**：如果剧情中角色需要通过微信向玩家发送消息，请使用明确的格式，例如："角色名在微信上发送："消息内容"" 或 "角色名发来微信："消息内容""。消息内容要用引号（""）明确标注，这样系统才能正确识别并同步到微信聊天页面。'
          },
          {
            role: 'user',
            content: `当前角色：${roleName}，性别：${genderLabel}，年龄：${ageLabel}。\n\n${playerInfo}\n\n${worldbookContent ? `【角色设定（世界书）】\n${worldbookContent}\n\n` : ''}${role.opening ? `开场白：${role.opening}\n\n` : ''}下面是最近的剧情片段（按时间顺序）：\n${recent}\n\n请根据以上内容，自然接着写下一小段剧情。不要重复玩家刚才输入的内容，也不要总结，只需要继续往前一点点。请尽量控制在大约 ${targetLength || 200} 个字左右，可以略多或略少，但必须是完整自然的一小段，不能在句子中途硬截断。`
          }
        ]
      })
    });

    if (!res.ok) {
      throw new Error(`接口返回状态 ${res.status}`);
    }

    const data = (await res.json()) as any;
    let text: string =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      '';

    if (!text) {
      throw new Error('未从接口结果中解析到文本内容');
    }

    return text.trim();
  };

  /**
   * 自动生成剧情以响应好友申请
   */
  const handleAutoGenerateForFriendRequest = async (roleId: string) => {
    // 检查是否正在阅读该角色的剧情
    if (mode !== 'read' || currentRoleId !== roleId) {
      return;
    }

    // 检查是否有待处理的好友申请
    const pendingRequests = loadFriendRequests().filter(
      req => req.roleId === roleId && req.status === 'pending'
    );

    if (pendingRequests.length === 0) {
      return;
    }

    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      // 如果API未配置，不显示错误，静默返回
      return;
    }

    // 如果正在生成中，不重复触发
    if (storyLoading) {
      return;
    }

    setStoryLoading(true);
    setMessage(null);

    try {
      // 使用当前的剧情轮次生成下一段，让AI自然地回应好友申请
      const aiResponse = await generateAIResponse(storyTurns, role);

      const withAi: StoryTurn[] = [
        ...storyTurns,
        { from: 'narrator', text: aiResponse, kind: 'narration' }
      ];
      setStoryTurns(withAi);
      saveRoleChat(roleId, withAi);

      // 从AI回复中提取微信消息并同步到微信聊天页面
      extractAndSyncWeChatMessages(roleId, aiResponse);

      // 检查AI回复中是否包含角色同意好友申请的内容
      checkAndProcessFriendRequest(roleId, aiResponse);

      // 评估并更新好感度（好友申请可能影响好感度）
      const favorData = loadRoleFavorSync(roleId);
      await evaluateAndUpdateFavor(roleId, '', aiResponse, role, favorData);
    } catch (err) {
      // 静默处理错误，不显示给用户
      console.error('自动生成好友申请剧情失败:', err);
    } finally {
      setStoryLoading(false);
    }
  };

  /**
   * 检查AI回复中是否包含角色同意好友申请的内容，并处理
   */
  const checkAndProcessFriendRequest = (roleId: string, aiResponse: string) => {
    const pendingRequests = loadFriendRequests().filter(
      req => req.roleId === roleId && req.status === 'pending'
    );

    if (pendingRequests.length === 0) return;

    // 检查AI回复中是否包含同意好友申请的暗示
    const acceptKeywords = ['同意', '接受', '通过', '可以', '好的', '行', '没问题', '加好友', '添加好友', '通过申请'];
    const hasAcceptance = acceptKeywords.some(keyword => aiResponse.includes(keyword));

    // 检查是否明确拒绝
    const rejectKeywords = ['拒绝', '不同意', '不行', '不可以', '不想'];
    const hasRejection = rejectKeywords.some(keyword => aiResponse.includes(keyword));

    // 如果AI回复中明确表示同意，更新好友申请状态并添加到微信联系人
    if (hasAcceptance && !hasRejection) {
      const request = pendingRequests[0];
      request.status = 'accepted';
      saveFriendRequest(request);

      // 添加到微信联系人
      const contact: WeChatContact = {
        roleId: roleId,
        remark: request.remark,
        tags: request.tags,
        permission: request.permission,
        hideMyMoments: request.hideMyMoments,
        hideTheirMoments: request.hideTheirMoments,
        addedAt: Date.now()
      };
      saveWeChatContact(contact);

      // 查找角色信息
      const allRoles = loadRoles();
      const role = allRoles.find((r) => r.id === roleId);

      // 触发事件，通知WeChatApp添加系统消息
      if (role) {
        window.dispatchEvent(new CustomEvent('friend-request-accepted', {
          detail: { roleId, roleName: role.wechatNickname || role.name, greeting: request.greeting }
        }));
      }

      console.log('好友申请已通过，已添加到微信联系人:', contact);
    } else if (hasRejection) {
      // 如果明确拒绝，更新状态为拒绝
      const request = pendingRequests[0];
      request.status = 'rejected';
      saveFriendRequest(request);
      console.log('好友申请已被拒绝');
    }
  };

  /**
   * 重新生成最新一轮的AI回复
   */
  const handleRegenerateLastResponse = async () => {
    if (!currentRoleId) return;
    
    // 检查是否有剧情轮次
    if (storyTurns.length === 0) {
      setMessage('没有可重新生成的内容');
      return;
    }

    // 检查最后一轮是否是AI生成的
    const lastTurn = storyTurns[storyTurns.length - 1];
    if (lastTurn.from !== 'narrator') {
      setMessage('最后一轮不是AI生成的回复，无法重新生成');
      return;
    }

    const role = roles.find((r) => r.id === currentRoleId);
    if (!role) return;

    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      setMessage('请先在 API 设置中配置好接口地址和模型');
      return;
    }

    setStoryLoading(true);
    setMessage(null);

    try {
      // 删除最后一轮AI回复
      const turnsWithoutLast = storyTurns.slice(0, -1);
      setStoryTurns(turnsWithoutLast);
      saveRoleChat(currentRoleId, turnsWithoutLast);

      // 重新生成AI回复
      const newResponse = await generateAIResponse(turnsWithoutLast, role);

      // 添加新的AI回复
      const withNewResponse: StoryTurn[] = [
        ...turnsWithoutLast,
        { from: 'narrator', text: newResponse, kind: 'narration' }
      ];
      setStoryTurns(withNewResponse);
      saveRoleChat(currentRoleId, withNewResponse);

      // 从AI回复中提取微信消息并同步到微信聊天页面
      extractAndSyncWeChatMessages(currentRoleId, newResponse);

      // 如果最后一轮是玩家输入，需要评估好感度
      if (turnsWithoutLast.length > 0) {
        const lastPlayerTurn = turnsWithoutLast[turnsWithoutLast.length - 1];
        if (lastPlayerTurn.from === 'player') {
          const favorData = loadRoleFavorSync(currentRoleId);
          await evaluateAndUpdateFavor(currentRoleId, lastPlayerTurn.text, newResponse, role, favorData);
        }
      }
    } catch (err) {
      setMessage(`重新生成失败：${(err as Error).message}`);
      // 如果失败，恢复原来的剧情
      setStoryTurns(storyTurns);
      saveRoleChat(currentRoleId, storyTurns);
    } finally {
      setStoryLoading(false);
    }
  };

  const handleSubmitStoryTurn = async () => {
    if (!currentRoleId) return;
    const input = storyInput.trim();
    if (!input) return;

    const first = input[0];
    const last = input[input.length - 1];
    const isSpeech =
      ((first === '"' || first === '“') && (last === '"' || last === '”')) ||
      ((first === '「' || first === '『') && (last === '」' || last === '』'));

    const role = roles.find((r) => r.id === currentRoleId);
    if (!role) return;

    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      setMessage('请先在 API 设置中配置好接口地址和模型');
      return;
    }

    const roleName = role.name;
    const genderLabel =
      role.gender === 'male'
        ? '男'
        : role.gender === 'female'
          ? '女'
          : role.gender === 'other'
            ? '其他'
            : '未指定';
    const ageLabel =
      typeof role.age === 'number' && role.age > 0 ? `${role.age} 岁` : '年龄未填写';

    const nextTurns: StoryTurn[] = [
      ...storyTurns,
      { from: 'player', text: input, kind: isSpeech ? 'speech' : 'narration' }
    ];
    setStoryTurns(nextTurns);
    setStoryInput('');
    saveRoleChat(currentRoleId, nextTurns);

    setStoryLoading(true);
    setMessage(null);

    try {
      // 使用通用生成函数
      const aiResponse = await generateAIResponse(nextTurns, role, input);

      const withAi: StoryTurn[] = [
        ...nextTurns,
        { from: 'narrator', text: aiResponse, kind: 'narration' }
      ];
      setStoryTurns(withAi);
      saveRoleChat(currentRoleId, withAi);

      // 从AI回复中提取微信消息并同步到微信聊天页面
      extractAndSyncWeChatMessages(currentRoleId, aiResponse);

      // 检查AI回复中是否包含角色同意好友申请的内容
      checkAndProcessFriendRequest(currentRoleId, aiResponse);

      // 评估并更新好感度
      const favorData = loadRoleFavorSync(currentRoleId);
      await evaluateAndUpdateFavor(currentRoleId, input, aiResponse, role, favorData);
    } catch (err) {
      setMessage(`生成失败：${(err as Error).message}`);
    } finally {
      setStoryLoading(false);
    }
  };

  const handleOpenRoleStory = (roleId: string) => {
    setCurrentRoleId(roleId);
    setStoryTurns(loadRoleChat(roleId));
    setStoryInput('');
    setMode('read');
    
    // 如果是新角色(没有好感度数据),在后台异步计算初始好感度
    const role = roles.find((r) => r.id === roleId);
    if (role) {
      const existingFavor = loadRoleFavorSync(roleId);
      // 如果没有存储的好感度数据(值为0且没有历史记录),计算初始好感度
      if (existingFavor.value === 0 && !existingFavor.history) {
        loadRoleFavor(roleId, role).catch((err) => {
          console.error('计算初始好感度失败:', err);
        });
      }
    }
  };

  const handleEditRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    setCurrentRoleId(roleId);
    setName(role.name);
    setGender(role.gender);
    setRoleAge(typeof role.age === 'number' && role.age > 0 ? String(role.age) : '');
    setOpening(role.opening ?? '');
    setAvatarUrl(role.avatarUrl);
    setWorldbooks(role.worldbooks);
    setOpenWorldbookIds(role.worldbooks.map((wb) => wb.id));
    setOpenEntryIds(
      role.worldbooks.flatMap((wb) => wb.entries.map((e) => e.id))
    );
    setMode('edit');
  };

  const handleDeleteRole = () => {
    if (!currentRoleId) return;
    const next = roles.filter((r) => r.id !== currentRoleId);
    setRoles(next);
    saveRoles(next);
    setCurrentRoleId(null);
    resetForm();
    setMode(next.length ? 'list' : 'create');
    setMessage('角色及其相关剧情内容已删除');
  };

  const handleClearRoleHistory = () => {
    if (!currentRoleId) return;
    clearRoleRuntime(currentRoleId);
    setStoryTurns([]);
    setStoryInput('');
    setMessage('已清除该角色的聊天记录和记忆（角色设定仍然保留）');
  };

  const handleGenerateQuickReplies = async () => {
    if (!currentRoleId) return;
    const role = roles.find((r) => r.id === currentRoleId);
    if (!role) return;
    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      setMessage('请先在 API 设置中配置好接口地址和模型');
      return;
    }

    const roleName = role.name;
    const genderLabel =
      role.gender === 'male'
        ? '男'
        : role.gender === 'female'
          ? '女'
          : role.gender === 'other'
            ? '其他'
            : '未指定';

    const recent = storyTurns
      .slice(-6)
      .map((t) => {
        if (t.from === 'player') {
          return t.kind === 'speech'
            ? `【玩家对白】${t.text}`
            : `【玩家场景】${t.text}`;
        }
        return `【叙述】${t.text}`;
      })
      .join('\n');

    setQuickLoading(true);
    setMessage(null);

    try {
      const endpointBase = cfg.baseUrl.replace(/\/+$/, '');
      const url =
        endpointBase.endsWith('/chat/completions') ||
          endpointBase.endsWith('/completions')
          ? endpointBase
          : endpointBase + '/chat/completions';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content:
                '你现在只负责为玩家提供“下一句要输入什么”的三个候选选项，而不是直接续写剧情。写作规则：\n' +
                '1）输出三条候选语句，每条单独一行，不要添加序号或其他前缀。\n' +
                '2）默认用第一人称视角，句子可以是对白（建议加引号）或短篇场景描述，但都代表玩家这一轮的主动反应。\n' +
                '3）不要替玩家做未来决定，只写“此刻我准备说/做/感受到什么”，保持空间让后续剧情自行发展。\n' +
                '4）语气自然、有生活感，避免八股、病句或机械口吻。\n' +
                '5）三条之间要有明显的方向差异（例如：继续配合、轻微顶撞、转换话题等），避免同义改写。'
            },
            {
              role: 'user',
              content: `当前角色：${roleName}，性别：${genderLabel}。下面是最近的剧情片段：\n${recent}\n\n请基于这些内容，为玩家接下来可能输入的文字生成 3 条不同方向的候选句子，每条一句话。`
            }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`接口返回状态 ${res.status}`);
      }

      const data = (await res.json()) as any;
      let text: string =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        '';

      text = (text || '').trim();
      const lines = text
        .split('\n')
        .map((l) => l.replace(/^\s*\d+[\.\)]\s*/, '').trim())
        .filter((l) => l.length > 0)
        .slice(0, 3);

      setQuickReplies(lines);
      setShowQuickModal(true);
      if (!lines.length) {
        setMessage('未能生成候选回复，可以直接手动输入试试');
      }
    } catch (err) {
      setMessage(`生成失败：${(err as Error).message}`);
    } finally {
      setQuickLoading(false);
    }
  };

  const handleApplyQuickReply = (text: string) => {
    setStoryInput(text);
    setShowQuickModal(false);
    setQuickReplies([]);
  };

  const handleToggleLengthPanel = () => {
    setShowLengthPanel((prev) => !prev);
  };

  const handleLengthChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const raw = e.target.value;
    setLengthInput(raw);
    if (!raw.trim()) {
      return;
    }
    const n = Number(raw);
    if (Number.isNaN(n) || n <= 0) return;
    setTargetLength(n);
    try {
      window.localStorage.setItem('mini-ai-phone.story-length', String(n));
    } catch {
      // ignore
    }
  };

  const handleShowStatus = async () => {
    if (!currentRoleId) return;
    const role = roles.find((r) => r.id === currentRoleId);
    if (!role) return;
    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      setMessage('请先在 API 设置中配置好接口地址和模型');
      return;
    }

    const recent = storyTurns
      .slice(-6)
      .map((t) => {
        if (t.from === 'player') {
          return t.kind === 'speech'
            ? `【玩家对白】${t.text}`
            : `【玩家场景】${t.text}`;
        }
        return `【叙述】${t.text}`;
      })
      .join('\n');

    const key = `${storyTurns.length}:${storyTurns[storyTurns.length - 1]?.text ?? ''}`;

    // 先看内存里的缓存
    if (statusList.length && statusKey === key) {
      setShowStatusModal(true);
      return;
    }

    // 再看 localStorage 缓存
    const cached = loadRoleStatusCache(currentRoleId);
    if (cached && cached.key === key && cached.list.length) {
      setStatusList(cached.list);
      setActiveStatusIndex(0);
      setStatusKey(key);
      setShowStatusModal(true);
      return;
    }

    setStatusLoading(true);
    setMessage(null);

    // 获取玩家身份信息，用于过滤
    const playerIdentity = loadIdentity();

    // 获取之前的行程安排（如果有），用于保持一致性
    const previousSchedule: Record<string, string[]> = {};
    if (cached && cached.list.length) {
      cached.list.forEach((status) => {
        if (status.schedule && status.schedule.length > 0) {
          previousSchedule[status.name] = status.schedule;
        }
      });
    } else if (statusList.length) {
      statusList.forEach((status) => {
        if (status.schedule && status.schedule.length > 0) {
          previousSchedule[status.name] = status.schedule;
        }
      });
    }

    // 检查剧情中是否明确提到行程变更
    const hasScheduleChange = recent && (
      recent.includes('行程') || 
      recent.includes('安排') || 
      recent.includes('计划') ||
      recent.includes('改变') ||
      recent.includes('变更') ||
      recent.includes('临时') ||
      recent.includes('取消') ||
      recent.includes('推迟') ||
      recent.includes('提前')
    );

    const previousScheduleText = Object.keys(previousSchedule).length > 0
      ? `\n\n**重要：保持行程安排一致性**\n以下是各角色之前的行程安排，请尽量保持相同，除非剧情明确提到行程变更：\n${Object.entries(previousSchedule).map(([name, schedule]) => `${name}：${schedule.join('；')}`).join('\n')}\n\n${hasScheduleChange ? '注意：剧情中提到了行程相关的内容，如果确实有行程变更，可以更新行程安排。' : '**如果剧情中没有明确提到行程变更、临时安排或计划改变，请保持之前的行程安排不变。**'}`
      : '';

    try {
      const endpointBase = cfg.baseUrl.replace(/\/+$/, '');
      const url =
        endpointBase.endsWith('/chat/completions') ||
        endpointBase.endsWith('/completions')
          ? endpointBase
          : endpointBase + '/chat/completions';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0.4,
          messages: [
            {
              role: 'system',
              content:
                '你现在负责为当前场景中的人物生成一个"状态栏"摘要。输出必须是 JSON 数组，每个元素表示一个角色：\n' +
                '[\n  {\n    "name": "角色姓名",\n    "time": "当前世界时间点，例如：21:35 演唱会彩排现场",\n    "clothing": "当前衣着（简短句子）",\n    "mood": "当前心情（简短描述，不使用极端或病态词汇）",\n    "action": "此刻正在做的动作",\n    "innerVoice": "用第一人称写的一小段内心独白，贴合角色设定和场景",\n    "schedule": ["8:00-9:00  事件描述", "10:00-12:00  事件描述"]\n  }, ...]\n' +
                '规则：\n' +
                '1）必须包含当前主角一项，并将主角放在数组第一个位置；如果上下文中有重要 NPC，可以为他们额外生成条目。\n' +
                '2）**绝对禁止**生成玩家的状态条目。玩家不是角色，玩家是控制者，状态栏只显示故事中的角色和NPC，绝不包含玩家本人。\n' +
                '3）所有字段必须是字符串，其中 schedule 为字符串数组，每一项是"时间段＋事件"的格式，例如："8:00-9:00  去公司会议室开会"。\n' +
                '4）不要编造极端、病态或与已有信息明显矛盾的内容，一切设定要贴合上下文和现实逻辑。\n' +
                '5）innerVoice 一律使用该角色的第一人称视角，不要出现"他/她觉得……"这类旁观口吻。\n' +
                '6）**关于行程安排（schedule）的重要规则**：\n' +
                '   - 行程安排应该保持一致性，除非剧情明确提到行程变更、临时安排、计划改变等情况\n' +
                '   - 如果提供了之前的行程安排，且剧情中没有明确提到行程变更，请保持相同的行程安排\n' +
                '   - 只有在剧情明确提到"改变行程"、"临时安排"、"取消计划"、"推迟"、"提前"等关键词时，才更新行程安排\n' +
                '   - 不要因为角色当前所在位置或正在做的事情而随意改变整个行程安排\n' +
                '7）只返回 JSON，不要添加任何说明文字、注释或额外文本。'
            },
            {
              role: 'user',
              content: `主角姓名：${role.name}。${playerIdentity.name ? `注意：玩家姓名是"${playerIdentity.name}"，**绝对不要**为玩家生成状态条目，只生成角色和NPC的状态。` : ''}以下是最近的剧情片段：\n${recent || '（目前还没有剧情记录，可以结合角色开场白简单推测当前场景。）'}${previousScheduleText}\n请按上述 JSON 结构生成状态栏，只包含角色和NPC，绝不包含玩家。`
            }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`接口返回状态 ${res.status}`);
      }

      const data = (await res.json()) as any;
      let text: string =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        '';

      text = (text || '').trim();
      let parsed: CharacterStatus[] | null = null;
      try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          const playerIdentity = loadIdentity();
          parsed = json
            .map((item: any) => ({
              name: String(item.name ?? role.name),
              time: item.time !== undefined ? String(item.time) : '',
              clothing: String(item.clothing ?? ''),
              mood: String(item.mood ?? ''),
              action: String(item.action ?? ''),
              innerVoice: String(item.innerVoice ?? ''),
              schedule: Array.isArray(item.schedule)
                ? item.schedule.map((s: any) => String(s))
                : []
            }))
            // 绝对禁止显示玩家状态：过滤掉玩家姓名、以及任何包含"玩家"、"我"等标识的条目
            .filter((s) => {
              const name = s.name.trim();
              // 如果玩家设置了姓名，过滤掉匹配的条目
              if (playerIdentity.name && name === playerIdentity.name.trim()) {
                return false;
              }
              // 过滤掉包含"玩家"关键词的条目
              if (name.includes('玩家') || name.includes('Player') || name.toLowerCase().includes('player')) {
                return false;
              }
              // 过滤掉明显是玩家视角的条目（如"我"作为名字）
              if (name === '我' || name === '自己' || name === '本人') {
                return false;
              }
              return true;
            });
        }
      } catch {
        parsed = null;
      }

      if (!parsed || !parsed.length) {
        setMessage('状态栏生成失败或格式不正确，可以稍后重试');
        return;
      }

      // 如果之前有行程安排，且剧情中没有明确提到行程变更，则保留之前的行程安排
      if (Object.keys(previousSchedule).length > 0 && !hasScheduleChange) {
        parsed = parsed.map((status) => {
          const previous = previousSchedule[status.name];
          if (previous && previous.length > 0) {
            // 检查新生成的行程安排是否与之前的差异很大
            const newScheduleStr = status.schedule.join('|').toLowerCase();
            const previousScheduleStr = previous.join('|').toLowerCase();
            
            // 如果差异很大（相似度低于50%），则使用之前的行程安排
            const similarity = calculateScheduleSimilarity(newScheduleStr, previousScheduleStr);
            if (similarity < 0.5) {
              return {
                ...status,
                schedule: previous
              };
            }
          }
          return status;
        });
      }

      setStatusList(parsed);
      setActiveStatusIndex(0);
      setStatusKey(key);
      saveRoleStatusCache(currentRoleId, key, parsed);
      setShowStatusModal(true);
    } catch (err) {
      setMessage(`生成失败：${(err as Error).message}`);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleExportRoles = () => {
    if (!roles.length) {
      setMessage('当前没有可导出的角色');
      return;
    }
    try {
      const data = JSON.stringify(roles, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'offline-story-roles.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage('角色设定已导出为文件（offline-story-roles.json）');
    } catch {
      setMessage('导出角色时出现问题，请稍后重试');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        if (!text) {
          throw new Error('文件内容为空');
        }
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error('文件格式不正确，应为角色数组');
        }
        const imported = parsed as StoryRole[];
        setRoles(imported);
        saveRoles(imported);
        setMode('list');
        setMessage('角色设定导入成功（已覆盖本地原有角色）');
      } catch (err) {
        setMessage(`导入失败：${(err as Error).message}`);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  if (mode === 'identity') {
    return (
      <div className="story-app">
        <div className="story-form">
          <div className="story-top-tabs">
            <button
              type="button"
              className={`story-top-tab ${mode === 'create' ? 'active' : ''}`}
              onClick={() => setMode('create')}
            >
              角色设定
            </button>
            <button
              type="button"
              className={`story-top-tab ${mode === 'identity' ? 'active' : ''}`}
              onClick={() => setMode('identity')}
            >
              玩家身份
            </button>
            <button
              type="button"
              className={`story-top-tab ${mode === 'appearance' ? 'active' : ''}`}
              onClick={() => setMode('appearance')}
            >
              美化
            </button>
          </div>
          <div className="story-form-header-row">
            <div className="story-form-header">玩家个人身份</div>
          </div>

          <div className="story-row">
            <label className="story-label">玩家姓名</label>
            <input
              className="story-input"
              placeholder="例如：李明"
              value={identity.name}
              onChange={(e) => handleIdentityChange('name', e.target.value)}
            />
          </div>

          <div className="story-row">
            <label className="story-label">玩家性别（可选）</label>
            <div className="story-gender-row">
              <button
                type="button"
                className={`story-gender-btn ${identity.gender === 'male' ? 'active' : ''}`}
                onClick={() => handleIdentityChange('gender', 'male')}
              >
                男
              </button>
              <button
                type="button"
                className={`story-gender-btn ${identity.gender === 'female' ? 'active' : ''}`}
                onClick={() => handleIdentityChange('gender', 'female')}
              >
                女
              </button>
              <button
                type="button"
                className={`story-gender-btn ${identity.gender === 'other' ? 'active' : ''}`}
                onClick={() => handleIdentityChange('gender', 'other')}
              >
                其他 / 保密
              </button>
            </div>
          </div>

          <div className="story-row">
            <label className="story-label">联系方式</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                className="story-input"
                placeholder="手机号（10位数字，例如：1381234567）"
                value={identity.phoneNumber || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleIdentityChange('phoneNumber', value);
                }}
              />
              <input
                className="story-input"
                placeholder="微信号（例如：wxid_abc123）"
                value={identity.wechatId || ''}
                onChange={(e) => handleIdentityChange('wechatId', e.target.value)}
              />
            </div>
          </div>

          <div className="story-row">
            <label className="story-label">一句话自我介绍</label>
            <div className="story-entry-ai-row">
              <input
                className="story-entry-ai-input"
                placeholder="例如：喜欢在深夜写故事的上班族玩家"
                value={identity.intro}
                onChange={(e) => handleIdentityChange('intro', e.target.value)}
              />
              <button
                type="button"
                className="story-entry-ai-btn"
                onClick={handleGenerateIdentityIntro}
              >
                AI 补全
              </button>
            </div>
          </div>

          <div className="story-row">
            <label className="story-label">标签 / 关键词</label>
            <textarea
              className="story-textarea"
              placeholder="可以简单写几条自己相关的关键词，供后续故事参考，例如：广州 / 文学 / 二次元 / 喜欢慢热日常"
              value={identity.tags}
              onChange={(e) => handleIdentityChange('tags', e.target.value)}
            />
          </div>

          <div className="story-row">
            <label className="story-label">玩家世界书配置</label>
            <p className="story-tip">
              玩家世界书可以理解为「玩家个人设定 / 身份信息合集」，可以设置多个世界书，每个世界书下又可以有多个条目。
            </p>

            {playerWorldbooks.map((wb) => {
              const wbOpen = openPlayerWorldbookIds.includes(wb.id);
              return (
                <div key={wb.id} className="story-worldbook-card">
                  <div className="story-worldbook-header">
                    <input
                      className="story-input"
                      placeholder="世界书名称，例如：个人背景 / 工作生活 / 兴趣爱好"
                      value={wb.name}
                      onChange={(e) => handlePlayerWorldbookNameChange(wb.id, e.target.value)}
                    />
                    <div className="story-worldbook-header-actions">
                      <button
                        type="button"
                        className="story-mini-btn"
                        onClick={() =>
                          setOpenPlayerWorldbookIds((prev) =>
                            prev.includes(wb.id)
                              ? prev.filter((id) => id !== wb.id)
                              : [...prev, wb.id]
                          )
                        }
                      >
                        {wbOpen ? '收起' : '展开'}
                      </button>
                      <button
                        type="button"
                        className="story-mini-btn danger"
                        onClick={() => {
                          if (!window.confirm('确定要删除这本世界书及其所有条目吗？此操作不可撤销。')) {
                            return;
                          }
                          setPlayerWorldbooks((prev) => prev.filter((x) => x.id !== wb.id));
                          setOpenPlayerWorldbookIds((prev) => prev.filter((id) => id !== wb.id));
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  {wbOpen && (
                    <>
                      {wb.entries.map((entry) => {
                        const entryOpen = openPlayerEntryIds.includes(entry.id);
                        return (
                          <div key={entry.id} className="story-entry">
                            <div className="story-entry-header">
                              <input
                                className="story-input"
                                placeholder="条目标题，例如：个人背景 / 家庭关系 / 工作经历"
                                value={entry.title}
                                onChange={(e) =>
                                  handlePlayerEntryChange(wb.id, entry.id, 'title', e.target.value)
                                }
                              />
                              <div className="story-entry-header-actions">
                                <button
                                  type="button"
                                  className="story-mini-btn"
                                  onClick={() =>
                                    setOpenPlayerEntryIds((prev) =>
                                      prev.includes(entry.id)
                                        ? prev.filter((id) => id !== entry.id)
                                        : [...prev, entry.id]
                                    )
                                  }
                                >
                                  {entryOpen ? '收起' : '展开'}
                                </button>
                                <button
                                  type="button"
                                  className="story-mini-btn danger"
                                  onClick={() => {
                                    if (!window.confirm('确定要删除这个世界书条目吗？此操作不可撤销。')) {
                                      return;
                                    }
                                    setPlayerWorldbooks((prev) =>
                                      prev.map((wb2) =>
                                        wb2.id === wb.id
                                          ? {
                                              ...wb2,
                                              entries: wb2.entries.filter(
                                                (e) => e.id !== entry.id
                                              )
                                            }
                                          : wb2
                                      )
                                    );
                                  }}
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                            {entryOpen && (
                              <>
                                <div className="story-entry-ai-row">
                                  <input
                                    className="story-entry-ai-input"
                                    placeholder="输入关键词，例如：童年经历 / 性格特点 / 家庭背景"
                                    value={entry.keyword ?? ''}
                                    onChange={(e) =>
                                      handlePlayerEntryChange(
                                        wb.id,
                                        entry.id,
                                        'keyword',
                                        e.target.value
                                      )
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="story-entry-ai-btn"
                                    onClick={() =>
                                      handleGeneratePlayerEntryContent(
                                        wb.id,
                                        entry.id,
                                        entry.keyword,
                                        entry.title
                                      )
                                    }
                                  >
                                    AI 补全
                                  </button>
                                </div>
                                <textarea
                                  className="story-textarea"
                                  placeholder="条目具体设定，例如：个人背景、性格特点、关键经历等"
                                  value={entry.content}
                                  onChange={(e) =>
                                    handlePlayerEntryChange(
                                      wb.id,
                                      entry.id,
                                      'content',
                                      e.target.value
                                    )
                                  }
                                />
                              </>
                            )}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        className="story-add-entry"
                        onClick={() => handleAddPlayerEntry(wb.id)}
                      >
                        + 添加世界书条目
                      </button>
                    </>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              className="story-add-worldbook"
              onClick={handleAddPlayerWorldbook}
            >
              + 新建一个世界书
            </button>
          </div>

          <div className="story-actions">
            <button
              type="button"
              className="story-btn primary"
              onClick={handleSaveIdentity}
            >
              保存玩家身份
            </button>
            <button
              type="button"
              className="story-btn"
              onClick={() => setMode(roles.length ? 'list' : 'create')}
            >
              返回角色列表 / 角色创建
            </button>
          </div>

          {message && <div className="story-message">{message}</div>}
        </div>
      </div>
    );
  }

  if (mode === 'appearance') {
    return (
      <div className="story-app">
        <div className="story-form">
          <div className="story-top-tabs">
            <button
              type="button"
              className={`story-top-tab ${mode === 'create' ? 'active' : ''}`}
              onClick={() => setMode('create')}
            >
              角色设定
            </button>
            <button
              type="button"
              className={`story-top-tab ${mode === 'identity' ? 'active' : ''}`}
              onClick={() => setMode('identity')}
            >
              玩家身份
            </button>
            <button
              type="button"
              className={`story-top-tab ${mode === 'appearance' ? 'active' : ''}`}
              onClick={() => setMode('appearance')}
            >
              美化
            </button>
          </div>
          <div className="story-form-header-row">
            <div className="story-form-header">美化设置</div>
          </div>

          <div className="story-row">
            <label className="story-label">聊天页背景图</label>
            <div className="story-avatar-row">
              <div className="story-avatar-preview" style={{ backgroundImage: appearance.backgroundImage ? `url(${appearance.backgroundImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {!appearance.backgroundImage && <span>预览</span>}
              </div>
              <div className="story-avatar-actions">
                <input
                  type="file"
                  accept="image/*"
                  ref={backgroundImageInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => handleBackgroundImageFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  className="story-btn small"
                  onClick={() => backgroundImageInputRef.current?.click()}
                >
                  选择图片
                </button>
                <input
                  className="story-input"
                  placeholder="或粘贴一张背景图片的 URL"
                  value={appearance.backgroundImage || ''}
                  onChange={(e) => handleAppearanceChange('backgroundImage', e.target.value)}
                />
                {appearance.backgroundImage && (
                  <button
                    type="button"
                    className="story-btn small danger"
                    onClick={() => handleAppearanceChange('backgroundImage', '')}
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="story-row">
            <label className="story-label">字体样式</label>
            <select
              className="story-input"
              value={appearance.fontFamily || ''}
              onChange={(e) => handleAppearanceChange('fontFamily', e.target.value)}
            >
              <option value="">默认字体</option>
              <option value="'Microsoft YaHei', '微软雅黑', sans-serif">微软雅黑</option>
              <option value="'SimSun', '宋体', serif">宋体</option>
              <option value="'SimHei', '黑体', sans-serif">黑体</option>
              <option value="'KaiTi', '楷体', serif">楷体</option>
              <option value="'FangSong', '仿宋', serif">仿宋</option>
              <option value="'Arial', sans-serif">Arial</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="'Georgia', serif">Georgia</option>
              <option value="'Verdana', sans-serif">Verdana</option>
            </select>
          </div>

          <div className="story-row">
            <label className="story-label">字体大小</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                className="story-input"
                type="number"
                min="10"
                max="24"
                value={appearance.fontSize || 14}
                onChange={(e) => handleAppearanceChange('fontSize', Number(e.target.value))}
                style={{ width: '100px' }}
              />
              <span>px（10-24）</span>
            </div>
          </div>

          <div className="story-actions">
            <button
              type="button"
              className="story-btn primary"
              onClick={handleSaveAppearance}
            >
              保存美化设置
            </button>
            <button
              type="button"
              className="story-btn"
              onClick={() => setMode(roles.length ? 'list' : 'create')}
            >
              返回角色列表 / 角色创建
            </button>
          </div>

          {message && <div className="story-message">{message}</div>}
        </div>
      </div>
    );
  }

  if (mode === 'create' || mode === 'edit' || roles.length === 0) {
    return (
      <div className="story-app">
        <div className="story-form">
          <div className="story-top-tabs">
            <button
              type="button"
              className={`story-top-tab ${mode === 'create' ? 'active' : ''}`}
              onClick={() => setMode('create')}
            >
              角色设定
            </button>
            <button
              type="button"
              className={`story-top-tab ${mode === 'identity' ? 'active' : ''}`}
              onClick={() => setMode('identity')}
            >
              玩家身份
            </button>
            <button
              type="button"
              className={`story-top-tab ${mode === 'appearance' ? 'active' : ''}`}
              onClick={() => setMode('appearance')}
            >
              美化
            </button>
          </div>
          <div className="story-form-header-row">
            <div className="story-form-header">
              {mode === 'edit' ? '编辑线下故事角色' : '新建线下故事角色'}
            </div>
            <div className="story-list-actions">
              {mode === 'edit' && (
                <button
                  type="button"
                  className="story-btn small"
                  onClick={handleClearRoleHistory}
                >
                  清除聊天记忆
                </button>
              )}
              <button
                type="button"
                className="story-btn small"
                onClick={handleImportClick}
              >
                导入
              </button>
              <button
                type="button"
                className="story-btn small"
                onClick={handleExportRoles}
              >
                导出
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <div className="story-row">
            <label className="story-label">角色头像</label>
            <div className="story-avatar-row">
              <div className="story-avatar-preview">
                {avatarUrl ? <img src={avatarUrl} alt="avatar" /> : <span>预览</span>}
              </div>
              <div className="story-avatar-actions">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAvatarFile(e.target.files?.[0] ?? null)}
                />
                <input
                  className="story-input"
                  placeholder="或粘贴一张头像图片的 URL"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="story-row">
            <label className="story-label">角色姓名</label>
            <div className="story-name-row">
              <input
                className="story-input"
                placeholder="例如：李明"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                type="button"
                className="story-name-dice"
                onClick={() => {
                  setName(generateRandomMaleName());
                }}
              >
                🎲
              </button>
            </div>
          </div>

          <div className="story-row">
            <label className="story-label">角色年龄</label>
            <input
              className="story-input"
              type="number"
              min={0}
              placeholder="例如：18"
              value={roleAge}
              onChange={(e) => setRoleAge(e.target.value)}
            />
          </div>

          <div className="story-row">
            <label className="story-label">角色开场白</label>
            <div className="story-entry-ai-row">
              <input
                className="story-entry-ai-input"
                placeholder="输入关键词，例如：开篇场景 / 时间节点 / 事件线索"
                value={openingKeyword}
                onChange={(e) => setOpeningKeyword(e.target.value)}
              />
              <button
                type="button"
                className="story-entry-ai-btn"
                onClick={handleGenerateOpening}
              >
                AI 补全
              </button>
            </div>
            <textarea
              className="story-textarea"
              placeholder="例如：这是一个关于 XX 在城市与世界之间游走的故事……"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
            />
          </div>

          <div className="story-row">
            <label className="story-label">角色性别</label>
            <div className="story-gender-row">
              <button
                type="button"
                className={`story-gender-btn ${gender === 'male' ? 'active' : ''}`}
                onClick={() => setGender('male')}
              >
                男
              </button>
              <button
                type="button"
                className={`story-gender-btn ${gender === 'female' ? 'active' : ''}`}
                onClick={() => setGender('female')}
              >
                女
              </button>
              <button
                type="button"
                className={`story-gender-btn ${gender === 'other' ? 'active' : ''}`}
                onClick={() => setGender('other')}
              >
                其他
              </button>
            </div>
          </div>

          <div className="story-row">
            <label className="story-label">角色联系方式</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                className="story-input"
                placeholder="手机号（10位数字，例如：1381234567）"
                value={rolePhoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setRolePhoneNumber(value);
                }}
              />
              <input
                className="story-input"
                placeholder="微信号（例如：wxid_abc123）"
                value={roleWechatId}
                onChange={(e) => setRoleWechatId(e.target.value)}
              />
            </div>
          </div>

          <div className="story-row">
            <label className="story-label">世界书配置</label>
            <p className="story-tip">
              世界书可以理解为「角色所处世界观 / 设定合集」，一个角色可以有多个世界书，每个世界书下又可以有多个条目。
            </p>

            {worldbooks.map((wb) => {
              const wbOpen = openWorldbookIds.includes(wb.id);
              return (
                <div key={wb.id} className="story-worldbook-card">
                  <div className="story-worldbook-header">
                    <input
                      className="story-input"
                      placeholder="世界书名称，例如：主世界 / 校园线 / 工作线"
                      value={wb.name}
                      onChange={(e) => handleWorldbookNameChange(wb.id, e.target.value)}
                    />
                    <div className="story-worldbook-header-actions">
                      <button
                        type="button"
                        className="story-mini-btn"
                        onClick={() =>
                          setOpenWorldbookIds((prev) =>
                            prev.includes(wb.id)
                              ? prev.filter((id) => id !== wb.id)
                              : [...prev, wb.id]
                          )
                        }
                      >
                        {wbOpen ? '收起' : '展开'}
                      </button>
                      <button
                        type="button"
                        className="story-mini-btn danger"
                        onClick={() => {
                          if (!window.confirm('确定要删除这本世界书及其所有条目吗？此操作不可撤销。')) {
                            return;
                          }
                          setWorldbooks((prev) => prev.filter((x) => x.id !== wb.id));
                          setOpenWorldbookIds((prev) => prev.filter((id) => id !== wb.id));
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  {wbOpen && (
                    <>
                      {wb.entries.map((entry) => {
                        const entryOpen = openEntryIds.includes(entry.id);
                        return (
                          <div key={entry.id} className="story-entry">
                            <div className="story-entry-header">
                              <input
                                className="story-input"
                                placeholder="条目标题，例如：人物背景 / 家庭关系"
                                value={entry.title}
                                onChange={(e) =>
                                  handleEntryChange(wb.id, entry.id, 'title', e.target.value)
                                }
                              />
                              <div className="story-entry-header-actions">
                                <button
                                  type="button"
                                  className="story-mini-btn"
                                  onClick={() =>
                                    setOpenEntryIds((prev) =>
                                      prev.includes(entry.id)
                                        ? prev.filter((id) => id !== entry.id)
                                        : [...prev, entry.id]
                                    )
                                  }
                                >
                                  {entryOpen ? '收起' : '展开'}
                                </button>
                                <button
                                  type="button"
                                  className="story-mini-btn danger"
                                  onClick={() => {
                                    if (!window.confirm('确定要删除这个世界书条目吗？此操作不可撤销。')) {
                                      return;
                                    }
                                    setWorldbooks((prev) =>
                                      prev.map((wb2) =>
                                        wb2.id === wb.id
                                          ? {
                                            ...wb2,
                                            entries: wb2.entries.filter(
                                              (e) => e.id !== entry.id
                                            )
                                          }
                                          : wb2
                                      )
                                    );
                                  }}
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                            {entryOpen && (
                              <>
                                <div className="story-entry-ai-row">
                                  <input
                                    className="story-entry-ai-input"
                                    placeholder="输入关键词，例如：童年经历 / 性格特点 / 家庭背景"
                                    value={entry.keyword ?? ''}
                                    onChange={(e) =>
                                      handleEntryChange(
                                        wb.id,
                                        entry.id,
                                        'keyword',
                                        e.target.value
                                      )
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="story-entry-ai-btn"
                                    onClick={() =>
                                      handleGenerateEntryContent(
                                        wb.id,
                                        entry.id,
                                        entry.keyword,
                                        entry.title
                                      )
                                    }
                                  >
                                    AI 补全
                                  </button>
                                </div>
                                <textarea
                                  className="story-textarea"
                                  placeholder="条目具体设定，例如：童年经历、性格特点、关键事件等"
                                  value={entry.content}
                                  onChange={(e) =>
                                    handleEntryChange(
                                      wb.id,
                                      entry.id,
                                      'content',
                                      e.target.value
                                    )
                                  }
                                />
                              </>
                            )}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        className="story-add-entry"
                        onClick={() => handleAddEntry(wb.id)}
                      >
                        + 添加世界书条目
                      </button>
                    </>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              className="story-add-worldbook"
              onClick={handleAddWorldbook}
            >
              + 新建一个世界书
            </button>
          </div>

          <div className="story-actions">
            <button
              type="button"
              className="story-btn primary"
              onClick={handleSaveRole}
            >
              {mode === 'edit' ? '保存角色修改' : '创建角色并开始故事'}
            </button>
            {mode === 'edit' && (
              <button
                type="button"
                className="story-btn danger"
                onClick={handleDeleteRole}
              >
                删除该角色
              </button>
            )}
          </div>

          {message && <div className="story-message">{message}</div>}
        </div>
      </div>
    );
  }

  if (mode === 'read' && currentRoleId) {
    const currentRole = roles.find((r) => r.id === currentRoleId);
    if (!currentRole) {
      setMode('list');
    } else {
      const currentAppearance = loadAppearance();
      const appearanceStyle: React.CSSProperties & { [key: string]: string | undefined } = {
        backgroundImage: currentAppearance.backgroundImage ? `url(${currentAppearance.backgroundImage})` : undefined,
        backgroundSize: currentAppearance.backgroundImage ? 'cover' : undefined,
        backgroundPosition: currentAppearance.backgroundImage ? 'center' : undefined,
        backgroundRepeat: currentAppearance.backgroundImage ? 'no-repeat' : undefined,
      };
      
      // 使用CSS变量来设置字体样式（Safari PWA兼容性更好）
      if (currentAppearance.fontFamily) {
        (appearanceStyle as any)['--story-font-family'] = currentAppearance.fontFamily;
      }
      if (currentAppearance.fontSize) {
        (appearanceStyle as any)['--story-font-size'] = `${currentAppearance.fontSize}px`;
      }
      
      // 加载当前好感度(使用同步版本)
      const favorData = loadRoleFavorSync(currentRoleId);
      const favorStage = getFavorStage(favorData.value);
      const favorStageLabel = getFavorStageLabel(favorStage);
      
      return (
        <div className="story-app">
          <div 
            className="story-read"
            style={appearanceStyle}
          >

            {currentRole.opening && (
              <div className="story-read-opening">
                {currentRole.opening}
              </div>
            )}

            {storyTurns.length > 0 && (
              <div className="story-read-section">
                {storyTurns.map((turn, idx) => (
                  <div key={idx} className={`story-read-entry ${turn.from === 'player' ? 'story-read-entry-player' : 'story-read-entry-narrator'}`}>
                    <div className="story-read-entry-title">
                      {turn.from === 'player' ? '玩家' : '叙述'}
                    </div>
                    <div className="story-read-entry-content">
                      {turn.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showQuickModal && quickReplies.length > 0 && (
            <div className="story-read-quick-overlay">
              <div className="story-read-quick-panel">
                <div className="story-read-quick-header">
                  <span>选择一条下一句</span>
                  <button
                    type="button"
                    className="story-read-quick-close"
                    onClick={() => {
                      setShowQuickModal(false);
                      setQuickReplies([]);
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div className="story-read-quick-list">
                  {quickReplies.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="story-read-quick-item"
                      onClick={() => handleApplyQuickReply(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showStatusModal && statusList.length > 0 && (
            <div className="story-read-status-overlay">
              <div className="story-read-status-panel">
                <div className="story-read-status-header">
                  <div className="story-read-status-tabs">
                    {statusList.map((s, idx) => (
                      <button
                        key={`${s.name}-${idx}`}
                        type="button"
                        className={`story-read-status-tab ${idx === activeStatusIndex ? 'active' : ''}`}
                        onClick={() => setActiveStatusIndex(idx)}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="story-read-status-close"
                    onClick={() => setShowStatusModal(false)}
                  >
                    ✕
                  </button>
                </div>
                {statusList[activeStatusIndex] && (
                  <div className="story-read-status-body">
                    <div className="story-read-status-row">
                      <span className="story-read-status-label">当前时间</span>
                      <span className="story-read-status-value">
                        {statusList[activeStatusIndex].time || '—'}
                      </span>
                    </div>
                    <div className="story-read-status-row">
                      <span className="story-read-status-label">衣着</span>
                      <span className="story-read-status-value">
                        {statusList[activeStatusIndex].clothing || '—'}
                      </span>
                    </div>
                    <div className="story-read-status-row">
                      <span className="story-read-status-label">心情</span>
                      <span className="story-read-status-value">
                        {statusList[activeStatusIndex].mood || '—'}
                      </span>
                    </div>
                    <div className="story-read-status-row">
                      <span className="story-read-status-label">动作</span>
                      <span className="story-read-status-value">
                        {statusList[activeStatusIndex].action || '—'}
                      </span>
                    </div>
                    <div className="story-read-status-block">
                      <div className="story-read-status-label">内心想法</div>
                      <div className="story-read-status-inner">
                        {statusList[activeStatusIndex].innerVoice || '—'}
                      </div>
                    </div>
                    <div className="story-read-status-block">
                      <div className="story-read-status-label">当日行程安排</div>
                      <div className="story-read-status-schedule">
                        {(statusList[activeStatusIndex].schedule || []).length
                          ? statusList[activeStatusIndex].schedule.map((line, i) => (
                            <div key={i} className="story-read-status-schedule-item">
                              {line}
                            </div>
                          ))
                          : '—'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="story-read-input-bar">
            {/* 好感度显示 */}
            <div className="story-read-favor-info" style={{ 
              padding: '8px 12px', 
              marginBottom: '8px', 
              backgroundColor: 'rgba(0, 0, 0, 0.05)', 
              borderRadius: '4px',
              fontSize: '13px',
              color: '#666'
            }}>
              <span style={{ marginRight: '8px' }}>好感度：</span>
              <span style={{ fontWeight: 'bold', color: '#333' }}>{favorData.value}/100</span>
              <span style={{ marginLeft: '8px', color: '#888' }}>({favorStageLabel})</span>
            </div>
            <div className="story-read-tools">
              <button
                type="button"
                className="story-read-tool-btn"
                disabled={quickLoading || storyLoading}
                onClick={handleGenerateQuickReplies}
              >
                {quickLoading ? '候选生成中…' : '自动生成回复（3 条）'}
              </button>
              <button
                type="button"
                className="story-read-tool-btn"
                disabled={statusLoading || storyLoading}
                onClick={handleShowStatus}
              >
                {statusLoading ? '状态生成中…' : '状态栏'}
              </button>
              <button
                type="button"
                className="story-read-tool-btn"
                disabled={storyLoading || storyTurns.length === 0 || storyTurns[storyTurns.length - 1]?.from !== 'narrator'}
                onClick={handleRegenerateLastResponse}
              >
                {storyLoading ? '重新生成中…' : '重新生成回复'}
              </button>
              <button
                type="button"
                className="story-read-tool-btn"
                onClick={handleToggleLengthPanel}
              >
                推进速度
              </button>
            </div>
            {showLengthPanel && (
              <div className="story-read-length-row">
                <span className="story-read-length-label">每次生成字数：</span>
                <input
                  type="number"
                  className="story-read-length-input"
                  min={40}
                  max={800}
                  value={lengthInput}
                  onChange={handleLengthChange}
                />
                <span className="story-read-length-unit">个字</span>
              </div>
            )}
            {quickReplies.length > 0 && (
              <div className="story-read-suggestions">
                {quickReplies.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="story-read-suggestion"
                    onClick={() => handleApplyQuickReply(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div className="story-read-input-inner">
              <textarea
                className="story-read-input"
                placeholder="从你的视角或第三人称继续写接下来的片段，例如：我推开门，发现他正站在雨里……"
                value={storyInput}
                onChange={(e) => setStoryInput(e.target.value)}
                rows={2}
              />
              <button
                type="button"
                className="story-read-send"
                disabled={storyLoading}
                onClick={handleSubmitStoryTurn}
              >
                {storyLoading ? '生成中…' : '继续剧情'}
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="story-app">
      <div className="story-list">
        <div className="story-list-header">
          <span>已创建角色</span>
          <div className="story-list-actions">
            <button
              type="button"
              className="story-btn small"
              onClick={handleImportClick}
            >
              导入
            </button>
            <button
              type="button"
              className="story-btn small"
              onClick={handleExportRoles}
            >
              导出
            </button>
            <button
              type="button"
              className="story-btn small"
              onClick={() => setMode('create')}
            >
              + 新建角色
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
        {message && <div className="story-message">{message}</div>}
        {roles.map((role) => (
          <div
            key={role.id}
            className="story-role-card"
            onClick={() => handleOpenRoleStory(role.id)}
          >
            <div className="story-role-avatar">
              {role.avatarUrl ? <img src={role.avatarUrl} alt={role.name} /> : <span>像</span>}
            </div>
            <div className="story-role-main">
              <div className="story-role-name">{role.name}</div>
              <div className="story-role-meta">
                {role.gender === 'male' && '男生'}
                {role.gender === 'female' && '女生'}
                {role.gender === 'other' && '其他'}
                {!role.gender && '性别未设定'}
                {typeof role.age === 'number' && role.age > 0 && ` · ${role.age} 岁`}
                {' · 世界书 '}
                {role.worldbooks.length}
                {' 本'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


