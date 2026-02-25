import React from 'react';
import {
  checkPushEnabled,
  disablePush,
  enablePush,
  isPushSupported,
  loadPushEnabledFromStorage
} from '../pushClient';
import { StoryApp } from './StoryApp';

// 从剧情模式加载角色数据
const STORAGE_KEY = 'mini-ai-phone.story-roles';

type StoryRole = {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other' | '';
  avatarUrl: string;
  age?: number | null;
  opening?: string;
  phoneNumber?: string;
  wechatId?: string;
  // 角色所在地区（由 AI 根据世界书和人设总结）
  region?: string;
  worldbooks?: any[];
  wechatNickname?: string;
  wechatSignature?: string;
  // 记录创建该角色时所使用的玩家身份马甲（可选）
  playerIdentityName?: string;
  playerIdentityWechatNickname?: string;
};

const WECHAT_GENDER_MALE_BADGE = new URL('../../image/微信联系人资料卡性别男.png', import.meta.url).toString();
const WECHAT_GENDER_FEMALE_BADGE = new URL('../../image/微信联系人资料卡性别女.png', import.meta.url).toString();

type ApiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

const API_STORAGE_KEY = 'mini-ai-phone.api-config';

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

const loadStoryRoles = (): StoryRole[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoryRole[]) : [];
  } catch {
    return [];
  }
};

const saveStoryRoles = (roles: StoryRole[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  } catch {
    // ignore
  }
};

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// 随机姓名生成池（从StoryApp复制）
const surnamePool = [
  '顾', '沈', '江', '陆', '言', '时', '程', '许', '林', '周', '傅', '岑', '苏', '席', '霍',
  '简', '黎', '祁', '唐', '薄', '闻', '池', '季', '柏', '洛', '湛', '慕', '喻', '阮', '纪', '孟'
];

const givenNamePool = [
  '旭', '泽', '昊', '轩', '宇', '辰', '浩', '俊', '凯', '睿', '博', '明', '辉', '阳', '帆',
  '航', '宸', '熙', '哲', '朗', '霖', '森', '磊', '峰', '伟', '涛', '鹏', '飞', '扬', '烁',
  '熠', '皓', '昭', '星', '曜', '晨', '曦', '瀚', '川', '澈', '逸', '远', '航', '帆', '扬',
  '杰', '瑞', '彬', '彦', '晟', '承', '煜', '煊', '朔', '朗', '安', '宁', '恒', '毅', '谦'
];

const generateRandomMaleName = () => {
  const surname = surnamePool[Math.floor(Math.random() * surnamePool.length)];
  const givenLength = 1 + Math.floor(Math.random() * 3);
  let given = '';
  for (let i = 0; i < givenLength; i += 1) {
    given += givenNamePool[Math.floor(Math.random() * givenNamePool.length)];
  }
  return surname + given;
};

// 加载角色剧情数据（用于生成剧情）
const loadRoleChat = (roleId: string): any[] => {
  try {
    const raw = window.localStorage.getItem(`mini-ai-phone.chat-${roleId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
  // 是否星标好友
  starred?: boolean;
  // 是否拉黑
  blocked?: boolean;
  addedAt: number;
};

const WECHAT_CONTACTS_KEY = 'mini-ai-phone.wechat-contacts';

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

// 加载微信联系人并转换为聊天列表
const loadWeChatChats = () => {
  const contacts = loadWeChatContacts();
  const roles = loadStoryRoles();

  const contactChats = contacts.map(contact => {
    const role = roles.find(r => r.id === contact.roleId);
    if (!role) return null;

    return {
      id: `chat-${contact.roleId}`,
      name: contact.remark || role.wechatNickname || role.name,
      avatarText: role.name.charAt(0),
      avatarUrl: role.avatarUrl,
      lastMessage: '',
      time: '',
      unread: 0,
      roleId: contact.roleId
    };
  }).filter(Boolean) as Array<{
    id: string;
    name: string;
    avatarText: string;
    avatarUrl?: string;
    lastMessage: string;
    time: string;
    unread: number;
    roleId: string;
  }>;

  // 合并默认聊天和联系人聊天
  return [
    {
      id: 'chat-ai',
      name: 'AI 助手',
      avatarText: 'AI',
      avatarUrl: undefined,
      lastMessage: '',
      time: '',
      unread: 0
    },
    {
      id: 'chat-notes',
      name: '灵感备忘录',
      avatarText: '记',
      avatarUrl: undefined,
      lastMessage: '',
      time: '',
      unread: 0
    },
    ...contactChats
  ];
};

const mockChats = loadWeChatChats();

// 聊天消息类型
type ChatMessage = {
  id: string;
  from: 'other' | 'self' | 'system';
  text: string;
  time: string;
  // 可选：消息的时间戳（用于红包记录等需要按年份统计的场景）
  timestamp?: number;
  greeting?: string; // 打招呼消息（仅系统消息使用）
  voiceDuration?: number; // 语音消息时长（秒），如果存在则表示这是语音消息
  // 如果是表情/表情包消息，text 一般形如 "[表情] 小狗亲亲"，emojiName 保存表情名称，渲染时优先显示对应图片
  emojiName?: string;
  // 如果是红包消息
  redPacketAmount?: number; // 金额（单位：元）
  redPacketNote?: string; // 备注
};

// 聊天长期记忆快照（按会话/角色本地存储）
type ChatMemorySnapshot = {
  id: string;
  chatId: string;
  roleId?: string;
  roleName?: string;
  title: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
};

// 聊天记忆相关全局配置
type WeChatMemorySettings = {
  autoSummaryEnabled: boolean;
  // 每多少轮角色回复后自动总结一次（按每次 AI 回复算一轮）
  summaryInterval: number;
};

// 默认表情包配置（image/默认表情包）
const DEFAULT_EMOJIS: { key: string; name: string; src: string }[] = [
  {
    key: '小狗：只倾听不评判',
    name: '小狗：只倾听不评判',
    src: new URL('../../image/默认表情包/小狗：只倾听不评判.jpg', import.meta.url).href
  },
  {
    key: '小狗：女神我只追随你',
    name: '小狗：女神我只追随你',
    src: new URL('../../image/默认表情包/小狗：女神我只追随你.jpg', import.meta.url).href
  },
  {
    key: '小狗：妈咪辛苦了',
    name: '小狗：妈咪辛苦了',
    src: new URL('../../image/默认表情包/小狗：妈咪辛苦了.jpg', import.meta.url).href
  },
  {
    key: '小狗：妈妈我做不好',
    name: '小狗：妈妈我做不好',
    src: new URL('../../image/默认表情包/小狗：妈妈我做不好.jpg', import.meta.url).href
  },
  {
    key: '小狗：小狗能有什么坏心啊？',
    name: '小狗：小狗能有什么坏心啊？',
    src: new URL('../../image/默认表情包/小狗：小狗能有什么坏心啊？.jpg', import.meta.url).href
  },
  {
    key: '小狗亲亲',
    name: '小狗亲亲',
    src: new URL('../../image/默认表情包/小狗亲亲.jpg', import.meta.url).href
  },
  {
    key: '小狗亲你手背',
    name: '小狗亲你手背',
    src: new URL('../../image/默认表情包/小狗亲你手背.png', import.meta.url).href
  },
  {
    key: '小狗别扭生气但戳手指',
    name: '小狗别扭生气但戳手指',
    src: new URL('../../image/默认表情包/小狗别扭生气但戳手指.jpg', import.meta.url).href
  },
  {
    key: '小狗大哭',
    name: '小狗大哭',
    src: new URL('../../image/默认表情包/小狗大哭.jpg', import.meta.url).href
  },
  {
    key: '小狗大喊妈妈',
    name: '小狗大喊妈妈',
    src: new URL('../../image/默认表情包/小狗大喊妈妈.jpg', import.meta.url).href
  },
  {
    key: '小狗害羞戳手指',
    name: '小狗害羞戳手指',
    src: new URL('../../image/默认表情包/小狗害羞戳手指.jpg', import.meta.url).href
  },
  {
    key: '小狗我要妈妈',
    name: '小狗我要妈妈',
    src: new URL('../../image/默认表情包/小狗我要妈妈.jpg', import.meta.url).href
  },
  {
    key: '小狗戴墨镜酷酷',
    name: '小狗戴墨镜酷酷',
    src: new URL('../../image/默认表情包/小狗戴墨镜酷酷.jpg', import.meta.url).href
  },
  {
    key: '小狗戳手指',
    name: '小狗戳手指',
    src: new URL('../../image/默认表情包/小狗戳手指.jpg', import.meta.url).href
  },
  {
    key: '小狗星星眼摇尾巴',
    name: '小狗星星眼摇尾巴',
    src: new URL('../../image/默认表情包/小狗星星眼摇尾巴.jpg', import.meta.url).href
  },
  {
    key: '小狗晕晕趴',
    name: '小狗晕晕趴',
    src: new URL('../../image/默认表情包/小狗晕晕趴.jpg', import.meta.url).href
  },
  {
    key: '小狗流泪',
    name: '小狗流泪',
    src: new URL('../../image/默认表情包/小狗流泪.jpg', import.meta.url).href
  },
  {
    key: '小狗流泪2',
    name: '小狗流泪2',
    src: new URL('../../image/默认表情包/小狗流泪2.jpg', import.meta.url).href
  },
  {
    key: '小狗流泪3',
    name: '小狗流泪3',
    src: new URL('../../image/默认表情包/小狗流泪3.jpg', import.meta.url).href
  },
  {
    key: '小狗流泪4',
    name: '小狗流泪4',
    src: new URL('../../image/默认表情包/小狗流泪4.jpg', import.meta.url).href
  },
  {
    key: '小狗炫耀：我是全世界最幸福的小狗',
    name: '小狗炫耀：我是全世界最幸福的小狗',
    src: new URL('../../image/默认表情包/小狗炫耀：我是全世界最幸福的小狗.jpg', import.meta.url).href
  },
  {
    key: '小狗示爱',
    name: '小狗示爱',
    src: new URL('../../image/默认表情包/小狗示爱.jpg', import.meta.url).href
  },
  {
    key: '小狗脸好烫',
    name: '小狗脸好烫',
    src: new URL('../../image/默认表情包/小狗脸好烫.jpg', import.meta.url).href
  },
  {
    key: '小狗舔屏',
    name: '小狗舔屏',
    src: new URL('../../image/默认表情包/小狗舔屏.jpg', import.meta.url).href
  },
  {
    key: '小狗被摸头开心',
    name: '小狗被摸头开心',
    src: new URL('../../image/默认表情包/小狗被摸头开心.jpg', import.meta.url).href
  },
  {
    key: '小狗趴趴撒娇（唔...）',
    name: '小狗趴趴撒娇（唔...）',
    src: new URL('../../image/默认表情包/小狗趴趴撒娇（唔...）.jpg', import.meta.url).href
  }
];

// 将默认表情名称整理成一段用于提示词的列表，方便模型只从这些名称中选择
const DEFAULT_EMOJI_NAME_LIST_FOR_PROMPT = DEFAULT_EMOJIS.map((e) => `- ${e.name}`).join('\n');

// 单个聊天会话的本地设置（免打扰 / 置顶 / 自定义背景等）
type ChatSettings = {
  mute?: boolean; // 消息免打扰
  pinned?: boolean; // 置顶聊天
  // 后续可以扩展：自定义背景图、提醒等
};

const CHAT_SETTINGS_KEY_PREFIX = 'mini-ai-phone.chat-settings-';

const loadChatSettings = (chatId: string | null | undefined): ChatSettings => {
  if (!chatId) return {};
  try {
    const raw = window.localStorage.getItem(`${CHAT_SETTINGS_KEY_PREFIX}${chatId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ChatSettings;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const saveChatSettings = (chatId: string | null | undefined, settings: ChatSettings) => {
  if (!chatId) return;
  try {
    window.localStorage.setItem(`${CHAT_SETTINGS_KEY_PREFIX}${chatId}`, JSON.stringify(settings));
  } catch {
    // ignore
  }
};

const findEmojiByName = (name: string | undefined | null) => {
  if (!name) return undefined;
  // 精确匹配：名称或 key 必须完全一致
  return DEFAULT_EMOJIS.find((e) => e.name === name || e.key === name);
};

const CHAT_MESSAGES_KEY_PREFIX = 'mini-ai-phone.chat-messages-';
const CHAT_MEMORY_KEY_PREFIX = 'mini-ai-phone.chat-memories-';
const CHAT_MEMORY_COUNTER_PREFIX = 'mini-ai-phone.chat-memories-counter-';
const WECHAT_MEMORY_SETTINGS_KEY = 'mini-ai-phone.wechat-memory-settings';

// 加载聊天消息
const loadChatMessages = (chatId: string): ChatMessage[] => {
  try {
    const raw = window.localStorage.getItem(`${CHAT_MESSAGES_KEY_PREFIX}${chatId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // 兼容历史数据：过去的表情消息可能只有 "[表情] 名称" 的文本，没有 emojiName 字段
    const upgraded = (parsed as ChatMessage[]).map((msg) => {
      if (!msg || typeof msg.text !== 'string') return msg;
      if (msg.emojiName) return msg;

      // 识别形如 "[表情] 小狗亲亲" / "【表情】 小狗亲亲" 的文本
      const match =
        msg.text.match(/^[\[【]表情[\]】]\s*(.+)$/u) ||
        msg.text.match(/^[\[【]表情[\]】]\s*([^，,。.!！?？\s]+(?:[（(][^）)]*[）)])?)/u);

      if (!match) {
        return msg;
      }

      let emojiName = match[1].trim();

      // 尝试去掉末尾括号备注再匹配一次
      const candidates: string[] = [emojiName];
      const strippedOnce = emojiName.replace(/（[^）]*）$/u, '').trim();
      if (strippedOnce && strippedOnce !== emojiName) {
        candidates.push(strippedOnce);
      }

      let emojiConfig = undefined as ReturnType<typeof findEmojiByName> | undefined;
      for (const candidate of candidates) {
        emojiConfig = findEmojiByName(candidate);
        if (emojiConfig) {
          emojiName = emojiConfig.name;
          break;
        }
      }

      if (!emojiConfig) {
        // 找不到对应配置，保持原样，按纯文本显示
        return msg;
      }

      // 升级为带 emojiName 的表情消息
      return {
        ...msg,
        text: `[表情] ${emojiName}`,
        emojiName
      };
    });

    return upgraded;
  } catch {
    return [];
  }
};

// 从聊天记录中获取最近一条用于会话列表显示的预览文案和时间
const getLastMessagePreview = (chatId: string) => {
  const messages = loadChatMessages(chatId);
  if (!messages.length) {
    return { lastMessage: '', time: '' };
  }
  // 过滤掉系统消息，只看双方聊天内容；如果全是系统消息，就退回到最后一条任意消息
  const normalMessages = messages.filter(
    (m) => m.from === 'self' || m.from === 'other'
  );
  const source = normalMessages.length ? normalMessages : messages;
  const last = source[source.length - 1];

  let preview = last.text || '';

  // 语音消息：显示成「[语音] 15″」
  if (last.voiceDuration) {
    preview = `[语音] ${last.voiceDuration}″`;
  }

  // 表情/表情包消息：统一显示为「[动画表情]」
  if (last.emojiName) {
    preview = '[动画表情]';
  }

  return { lastMessage: preview, time: last.time };
};

// 保存聊天消息
const saveChatMessages = (chatId: string, messages: ChatMessage[]) => {
  try {
    window.localStorage.setItem(`${CHAT_MESSAGES_KEY_PREFIX}${chatId}`, JSON.stringify(messages));
  } catch (err) {
    console.error('保存聊天消息失败:', err);
  }
};

// 单个会话的长期记忆读写
const loadChatMemories = (chatId: string): ChatMemorySnapshot[] => {
  try {
    const raw = window.localStorage.getItem(`${CHAT_MEMORY_KEY_PREFIX}${chatId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ChatMemorySnapshot[];
  } catch {
    return [];
  }
};

const saveChatMemories = (chatId: string, list: ChatMemorySnapshot[]) => {
  try {
    window.localStorage.setItem(`${CHAT_MEMORY_KEY_PREFIX}${chatId}`, JSON.stringify(list));
  } catch (err) {
    console.error('保存聊天记忆失败:', err);
  }
};

// 基于最近若干条消息生成一条新的记忆快照
const createChatMemorySnapshot = (chatId: string, role: StoryRole, messages: ChatMessage[]) => {
  if (!messages || messages.length === 0) return;

  const roleName = role.wechatNickname || role.name || '对方';

  // 取最近若干条消息作为摘要基础，包含双方与系统
  const recent = messages.slice(-20);
  const lines = recent
    .filter((m) => typeof m.text === 'string' && m.text.trim().length > 0)
    .map((m) => {
      const text = m.text.trim();
      if (m.from === 'self') return `我：${text}`;
      if (m.from === 'other') return `${roleName}：${text}`;
      return `系统：${text}`;
    });

  if (!lines.length) return;

  let summary = lines.join('\n');
  // 控制摘要长度，避免对提示词和本地存储压力过大
  const MAX_SUMMARY_LEN = 400;
  if (summary.length > MAX_SUMMARY_LEN) {
    summary = summary.slice(0, MAX_SUMMARY_LEN) + '…';
  }

  const now = new Date();
  const nowStr = now.toLocaleString('zh-CN', { hour12: false });

  const snapshot: ChatMemorySnapshot = {
    id: `mem-${now.getTime()}-${Math.random().toString(16).slice(2)}`,
    chatId,
    roleId: role.id,
    roleName,
    title: `与${roleName}的对话记忆`,
    summary,
    createdAt: nowStr,
    updatedAt: nowStr
  };

  const list = loadChatMemories(chatId);
  list.push(snapshot);

  // 每个会话最多保留若干条记忆快照
  const MAX_SNAPSHOTS_PER_CHAT = 20;
  const kept = list.slice(-MAX_SNAPSHOTS_PER_CHAT);
  saveChatMemories(chatId, kept);
};

// 「存储空间」页面用的记忆概览
type ChatMemoryOverview = {
  chatId: string;
  roleId?: string;
  roleName?: string;
  snapshotCount: number;
  lastUpdatedAt: string;
};

const loadAllChatMemoryOverview = (): ChatMemoryOverview[] => {
  const result: ChatMemoryOverview[] = [];
  try {
    const storage = window.localStorage;
    const len = storage.length;
    for (let i = 0; i < len; i++) {
      const key = storage.key(i);
      if (!key || !key.startsWith(CHAT_MEMORY_KEY_PREFIX)) continue;
      const chatId = key.slice(CHAT_MEMORY_KEY_PREFIX.length);
      const raw = storage.getItem(key);
      if (!raw) continue;
      let snapshots: ChatMemorySnapshot[] | null = null;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          snapshots = parsed as ChatMemorySnapshot[];
        }
      } catch {
        // ignore parse error
      }
      if (!snapshots || snapshots.length === 0) continue;
      const last = snapshots[snapshots.length - 1];
      result.push({
        chatId,
        roleId: last.roleId,
        roleName: last.roleName,
        snapshotCount: snapshots.length,
        lastUpdatedAt: last.updatedAt || last.createdAt
      });
    }
  } catch (err) {
    console.error('读取聊天记忆概览失败:', err);
  }
  return result;
};

const clearAllChatMemories = () => {
  try {
    const storage = window.localStorage;
    const keysToRemove: string[] = [];
    const len = storage.length;
    for (let i = 0; i < len; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(CHAT_MEMORY_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => storage.removeItem(key));
  } catch (err) {
    console.error('清空聊天记忆失败:', err);
  }
};

const clearChatMemory = (chatId: string) => {
  try {
    window.localStorage.removeItem(`${CHAT_MEMORY_KEY_PREFIX}${chatId}`);
  } catch (err) {
    console.error('删除单个聊天记忆失败:', err);
  }
};

// 聊天记忆轮次计数（按会话）
const incrementChatMemoryCounter = (chatId: string): number => {
  try {
    const key = `${CHAT_MEMORY_COUNTER_PREFIX}${chatId}`;
    const raw = window.localStorage.getItem(key);
    const current = raw ? parseInt(raw, 10) || 0 : 0;
    const next = current + 1;
    window.localStorage.setItem(key, String(next));
    return next;
  } catch {
    return 1;
  }
};

const loadWeChatMemorySettings = (): WeChatMemorySettings => {
  try {
    const raw = window.localStorage.getItem(WECHAT_MEMORY_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WeChatMemorySettings>;
      const interval =
        typeof parsed.summaryInterval === 'number' && parsed.summaryInterval > 0
          ? Math.floor(parsed.summaryInterval)
          : 3;
      return {
        autoSummaryEnabled: parsed.autoSummaryEnabled ?? true,
        summaryInterval: interval
      };
    }
  } catch {
    // ignore
  }
  return {
    autoSummaryEnabled: true,
    summaryInterval: 3
  };
};

const saveWeChatMemorySettings = (settings: WeChatMemorySettings) => {
  try {
    const safe: WeChatMemorySettings = {
      autoSummaryEnabled: !!settings.autoSummaryEnabled,
      summaryInterval: Math.max(1, Math.floor(settings.summaryInterval || 3))
    };
    window.localStorage.setItem(WECHAT_MEMORY_SETTINGS_KEY, JSON.stringify(safe));
  } catch {
    // ignore
  }
};

// 添加好友申请通过的系统消息
const addFriendAcceptedSystemMessage = (roleId: string, roleName: string, greeting: string) => {
  const chatId = `chat-${roleId}`;
  const messages = loadChatMessages(chatId);

  console.log('[WeChatApp] 添加系统消息前，现有消息数:', messages.length, 'chatId:', chatId);

  // 检查是否已经添加过系统消息（避免重复）
  const hasSystemMessage = messages.some(msg =>
    msg.from === 'system' && msg.text.includes('通过了你的朋友验证请求')
  );

  // 清理所有与greeting内容相同的self消息（避免重复显示）
  const cleanedMessages = messages.filter(msg =>
    !(msg.from === 'self' && (msg.id.startsWith('greeting-') || msg.text === greeting))
  );

  if (!hasSystemMessage) {
    // 只添加系统消息，打招呼消息会在系统消息上方显示
    const systemMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      from: 'system',
      text: `${roleName}通过了你的朋友验证请求，以上是打招呼的消息`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      greeting: greeting
    };

    cleanedMessages.push(systemMessage);
    saveChatMessages(chatId, cleanedMessages);
    console.log('[WeChatApp] 已添加系统消息，消息数:', cleanedMessages.length, '消息内容:', cleanedMessages.map(m => ({ from: m.from, text: m.text })));
  } else {
    // 即使系统消息已存在，也保存清理后的消息
    if (cleanedMessages.length !== messages.length) {
      saveChatMessages(chatId, cleanedMessages);
      console.log('[WeChatApp] 已清理重复的打招呼消息，清理前:', messages.length, '清理后:', cleanedMessages.length);
    }
  }
};

const mockMessages: Array<ChatMessage> = [];

type TabId = 'chat' | 'contacts' | 'discover' | 'me' | 'story';

type DiscoverView = 'list' | 'moments';


// 好友申请相关类型
type FriendRequest = {
  id: string;
  roleId: string;
  greeting: string; // 打招呼消息
  remark?: string; // 备注
  tags?: string; // 标签
  permission: 'all' | 'chat-only'; // 朋友权限：all=聊天、朋友圈等，chat-only=仅聊天
  hideMyMoments?: boolean; // 不给ta看我的朋友圈和状态
  hideTheirMoments?: boolean; // 不看ta的朋友圈和聊天
  status: 'pending' | 'accepted' | 'rejected'; // 申请状态
  timestamp: number; // 申请时间
};

// 玩家身份（和线下故事 StoryApp 中的玩家身份结构保持一致）
type PlayerIdentity = {
  name: string;
  gender: 'male' | 'female' | 'other' | '';
  intro: string;
  tags: string;
  // 联系方式
  phoneNumber?: string; // 10位手机号
  wechatId?: string; // 微信号
  // 玩家世界书（在微信侧只做透传，不强校验结构）
  worldbooks?: any[];
  // 兼容微信侧使用的微信昵称字段：优先使用 name
  wechatNickname?: string;
};

// 微信侧「我」页使用的独立个人资料（与 StoryApp 中的玩家身份解耦）
type WeChatSelfProfile = {
  nickname: string;
  gender: 'male' | 'female' | 'other' | '';
  region: string;
  wechatId?: string;
  pokeText?: string;
  intro?: string;
  avatarUrl?: string;
  // 文字版头像描述，专门给角色和模型理解头像长什么样用
  avatarDesc?: string;
};

// 与 StoryApp 复用同一个本地存储键，作为「全局默认玩家身份」
const STORY_IDENTITY_KEY = 'mini-ai-phone.story-identity';
// 兼容早期微信侧单独存的玩家身份
const LEGACY_IDENTITY_KEY = 'mini-ai-phone.player-identity';
// 每个角色各自使用的玩家身份（微信聊天视角下的身份），键为 roleId
const WECHAT_ROLE_IDENTITY_KEY = 'mini-ai-phone.wechat-role-identity-per-role';
// 微信 App 内「我」页的独立资料存储键
const WECHAT_SELF_PROFILE_KEY = 'mini-ai-phone.wechat-self-profile';

const loadPlayerIdentity = (): PlayerIdentity => {
  // 优先读取线下故事中的玩家身份
  try {
    const raw = window.localStorage.getItem(STORY_IDENTITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlayerIdentity>;
      const name = (parsed as any).name ?? (parsed as any).nickname ?? '';
      return {
        name: name ?? '',
        gender: parsed.gender ?? '',
        intro: parsed.intro ?? '',
        tags: parsed.tags ?? '',
        worldbooks: (parsed as any).worldbooks ?? [],
        phoneNumber: (parsed as any).phoneNumber ?? undefined,
        wechatId: (parsed as any).wechatId ?? undefined,
        wechatNickname: (parsed as any).wechatNickname ?? name ?? ''
      };
    }
  } catch {
    // ignore and fallback
  }

  // 兼容旧版本的微信侧玩家身份
  try {
    const raw = window.localStorage.getItem(LEGACY_IDENTITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlayerIdentity>;
      const name = parsed.name ?? '';
      return {
        name,
        gender: '',
        intro: '',
        tags: '',
        worldbooks: [],
        phoneNumber: undefined,
        wechatId: undefined,
        wechatNickname: parsed.wechatNickname ?? name
      };
    }
  } catch {
    // ignore
  }

  return {
    name: '',
    gender: '',
    intro: '',
    tags: '',
    worldbooks: [],
    phoneNumber: undefined,
    wechatId: undefined,
    wechatNickname: ''
  };
};

// 加载微信「我」页使用的独立个人资料
const loadWeChatSelfProfile = (): WeChatSelfProfile => {
  try {
    const raw = window.localStorage.getItem(WECHAT_SELF_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WeChatSelfProfile>;
      return {
        nickname: parsed.nickname ?? '微信昵称',
        gender: parsed.gender ?? '',
        region: parsed.region ?? '',
        wechatId: parsed.wechatId,
        pokeText: parsed.pokeText,
        intro: parsed.intro ?? '',
        avatarUrl: parsed.avatarUrl,
        avatarDesc: parsed.avatarDesc ?? ''
      };
    }
  } catch {
    // ignore
  }

  // 首次使用时，可以用 Story 里的玩家身份做一次性初始化，但后续不做联动
  const identity = loadPlayerIdentity();
  return {
    nickname: identity.wechatNickname || identity.name || '微信昵称',
    gender: identity.gender || '',
    region: (identity as any).wechatRegion || '',
    wechatId: identity.wechatId,
    pokeText: (identity as any).pokeText || '',
    intro: identity.intro || '',
    avatarUrl: (identity as any).wechatAvatar || undefined,
    avatarDesc: ''
  };
};

const saveWeChatSelfProfile = (profile: WeChatSelfProfile) => {
  try {
    const toSave: WeChatSelfProfile = {
      ...profile,
      nickname: profile.nickname.trim() || '微信昵称',
      region: profile.region.trim(),
      intro: profile.intro?.trim?.() || '',
      pokeText: profile.pokeText?.trim?.() || undefined,
      wechatId: profile.wechatId?.trim?.() || undefined,
      avatarDesc: profile.avatarDesc?.trim?.() || ''
    };
    window.localStorage.setItem(WECHAT_SELF_PROFILE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore
  }
};

const savePlayerIdentity = (id: PlayerIdentity) => {
  try {
    const toSave: PlayerIdentity = {
      ...id,
      name: id.name.trim(),
      intro: id.intro.trim(),
      tags: id.tags.trim(),
      phoneNumber: id.phoneNumber?.trim() || undefined,
      wechatId: id.wechatId?.trim() || undefined
    };
    window.localStorage.setItem(STORY_IDENTITY_KEY, JSON.stringify(toSave));
  } catch {
    // ignore
  }
};

// 加载某个角色在微信聊天中看到的「玩家身份」
// 逻辑：先读取全局玩家身份作为默认，然后再叠加该角色专属的身份（如果有）
const loadPlayerIdentityForRole = (roleId: string | undefined | null): PlayerIdentity => {
  const base = loadPlayerIdentity();
  if (!roleId) return base;

  try {
    const raw = window.localStorage.getItem(WECHAT_ROLE_IDENTITY_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Record<string, Partial<PlayerIdentity>> | null;
    if (!parsed || typeof parsed !== 'object') return base;

    const perRole = parsed[roleId];
    if (!perRole) return base;

    const merged: PlayerIdentity = {
      ...base,
      ...perRole,
      // 世界书如果在 perRole 中未设置，则沿用全局
      worldbooks: (perRole.worldbooks ?? base.worldbooks) ?? [],
      // wechatNickname 优先取该角色下的设置，其次是名字，最后是全局昵称
      wechatNickname:
        perRole.wechatNickname ??
        perRole.name ??
        base.wechatNickname ??
        base.name
    };

    return merged;
  } catch {
    return base;
  }
};

// 保存某个角色专属使用的玩家身份（仅影响该角色相关的微信聊天）
const savePlayerIdentityForRole = (roleId: string, id: PlayerIdentity) => {
  if (!roleId) return;
  try {
    const raw = window.localStorage.getItem(WECHAT_ROLE_IDENTITY_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, PlayerIdentity>) : {};
    parsed[roleId] = id;
    window.localStorage.setItem(WECHAT_ROLE_IDENTITY_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
};

const FRIEND_REQUESTS_KEY = 'mini-ai-phone.friend-requests';

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

type WeChatAppProps = {
  onExit?: () => void;
  onOpenApiSettings?: () => void;
};

export const WeChatApp: React.FC<WeChatAppProps> = ({ onExit, onOpenApiSettings }) => {
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabId>('chat');
  // 是否正在查看线下剧情的具体内容页（阅读模式）
  const [inStoryRead, setInStoryRead] = React.useState(false);
  // 「我」页：是否进入设置页
  const [showMeSettings, setShowMeSettings] = React.useState(false);
  // 「我」-设置子视图：list=设置列表，profile=个人资料，storage=存储空间
  const [meSettingsView, setMeSettingsView] =
    React.useState<'list' | 'profile' | 'storage' | 'notifications'>('list');
  type MeProfileFieldKey = 'avatar' | 'name' | 'gender' | 'region' | 'wechatId' | 'poke' | 'intro';
  const [meProfileEditingField, setMeProfileEditingField] = React.useState<MeProfileFieldKey | null>(null);
  const [meProfileEditText, setMeProfileEditText] = React.useState('');
  const [meProfileAvatarDesc, setMeProfileAvatarDesc] = React.useState('');
  // 微信「我」页独立个人资料（与 StoryApp 的玩家身份解耦）
  const [wechatSelfProfile, setWeChatSelfProfile] = React.useState<WeChatSelfProfile>(() =>
    loadWeChatSelfProfile()
  );
  // 聊天长期记忆概览（用于「存储空间」页面展示）
  const [chatMemoryOverview, setChatMemoryOverview] = React.useState<ChatMemoryOverview[]>([]);
  // 聊天记忆自动总结设置（全局）
  const [memorySettings, setMemorySettings] = React.useState<WeChatMemorySettings>(() =>
    loadWeChatMemorySettings()
  );
  // Web Push 推送设置
  const [pushSupported] = React.useState(() => isPushSupported());
  const [pushEnabled, setPushEnabled] = React.useState(() => loadPushEnabledFromStorage());
  const [pushBusy, setPushBusy] = React.useState(false);
  const [pushMessage, setPushMessage] = React.useState<string | null>(null);
  // 最近一次记忆总结的轻量提示
  const [memoryToast, setMemoryToast] = React.useState<{
    roleName: string;
    createdAt: string;
  } | null>(null);
  const [discoverView, setDiscoverView] = React.useState<DiscoverView>('list');
  const [showMomentsTitle, setShowMomentsTitle] = React.useState(false);
  const momentsListRef = React.useRef<HTMLDivElement | null>(null);
  // 聊天消息容器引用
  const chatContainerRef = React.useRef<HTMLDivElement | null>(null);
  // 故事tab的标题和头部操作
  const [storyTitle, setStoryTitle] = React.useState('线下故事');
  const [storyHeaderActions, setStoryHeaderActions] = React.useState<{
    showBack?: boolean;
    showMore?: boolean;
    onBack?: () => void;
    onMore?: () => void;
  }>({});

  // 当离开线下剧情 Tab 时，重置阅读状态，确保其他 Tab 始终显示底部导航
  React.useEffect(() => {
    if (activeTab !== 'story' && inStoryRead) {
      setInStoryRead(false);
    }
  }, [activeTab, inStoryRead]);

  // 当离开「我」Tab 时自动退出设置页
  React.useEffect(() => {
    if (activeTab !== 'me' && showMeSettings) {
      setShowMeSettings(false);
      setMeSettingsView('list');
    }
  }, [activeTab, showMeSettings]);

  // 打开「存储空间」子页时，刷新当前所有会话的记忆概览
  React.useEffect(() => {
    if (activeTab === 'me' && showMeSettings && meSettingsView === 'storage') {
      setChatMemoryOverview(loadAllChatMemoryOverview());
    }
  }, [activeTab, showMeSettings, meSettingsView]);

  // 持久化聊天记忆自动总结设置
  React.useEffect(() => {
    saveWeChatMemorySettings(memorySettings);
  }, [memorySettings]);

  // 初次进入时根据浏览器实际订阅状态校准推送开关
  React.useEffect(() => {
    if (!pushSupported) return;
    checkPushEnabled()
      .then((real) => {
        if (real !== pushEnabled) {
          setPushEnabled(real);
        }
      })
      .catch(() => {
        // ignore
      });
  }, [pushSupported, pushEnabled]);

  // 记忆提示自动消失
  React.useEffect(() => {
    if (!memoryToast) return;
    const timer = window.setTimeout(() => {
      setMemoryToast(null);
    }, 2500);
    return () => {
      window.clearTimeout(timer);
    };
  }, [memoryToast]);

  const handleClearAllChatMemories = React.useCallback(() => {
    clearAllChatMemories();
    setChatMemoryOverview(loadAllChatMemoryOverview());
  }, []);

  const handleClearChatMemoryByChatId = React.useCallback((chatId: string) => {
    clearChatMemory(chatId);
    setChatMemoryOverview(loadAllChatMemoryOverview());
  }, []);
  // 好友申请页面状态
  const [showFriendRequest, setShowFriendRequest] = React.useState(false);
  const [friendRequestRole, setFriendRequestRole] = React.useState<StoryRole | null>(null);
  const [friendRequestGreeting, setFriendRequestGreeting] = React.useState('');
  const [friendRequestRemark, setFriendRequestRemark] = React.useState('');
  const [friendRequestTags, setFriendRequestTags] = React.useState('');
  const [friendRequestPermission, setFriendRequestPermission] = React.useState<'all' | 'chat-only'>('all');
  const [friendRequestHideMyMoments, setFriendRequestHideMyMoments] = React.useState(false);
  const [friendRequestHideTheirMoments, setFriendRequestHideTheirMoments] = React.useState(false);
  // 创建角色页面状态
  const [showCreateRole, setShowCreateRole] = React.useState(false);
  const [createRoleStep, setCreateRoleStep] = React.useState<'role' | 'identity'>('role');
  const [playerIdentityForCreate, setPlayerIdentityForCreate] = React.useState<PlayerIdentity>(() => loadPlayerIdentity());
  const [playerIdentityOpenWorldbookIds, setPlayerIdentityOpenWorldbookIds] = React.useState<string[]>([]);
  const [playerIdentityOpenEntryIds, setPlayerIdentityOpenEntryIds] = React.useState<string[]>([]);
  const [createRoleName, setCreateRoleName] = React.useState('');
  const [createRoleGender, setCreateRoleGender] = React.useState<StoryRole['gender']>('');
  const [createRoleAge, setCreateRoleAge] = React.useState('');
  const [createRoleAvatarUrl, setCreateRoleAvatarUrl] = React.useState('');
  const [createRoleOpening, setCreateRoleOpening] = React.useState('');
  const [createRoleOpeningKeyword, setCreateRoleOpeningKeyword] = React.useState('');
  const [createRoleWorldbooks, setCreateRoleWorldbooks] = React.useState<Array<{ id: string; name: string; entries: Array<{ id: string; title: string; content: string; keyword?: string }> }>>([]);
  const [createRoleOpenWorldbookIds, setCreateRoleOpenWorldbookIds] = React.useState<string[]>([]);
  const [createRoleOpenEntryIds, setCreateRoleOpenEntryIds] = React.useState<string[]>([]);
  const [createRoleMessage, setCreateRoleMessage] = React.useState<string | null>(null);
  const [creatingRole, setCreatingRole] = React.useState(false);
  const createRoleAvatarFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // 动态加载聊天列表（包含已添加的好友）
  const [chats, setChats] = React.useState(() => {
    const baseChats = loadWeChatChats();
    // 首次加载时，就根据聊天记录补一遍预览文案和时间
    return baseChats.map((chat) => {
      const { lastMessage, time } = getLastMessagePreview(chat.id);
      return {
        ...chat,
        lastMessage: chat.lastMessage || lastMessage,
        time: chat.time || time
      };
    });
  });
  // 用于强制重新渲染聊天消息
  const [chatMessagesKey, setChatMessagesKey] = React.useState(0);
  // 通讯录列表数据
  const [contactsList, setContactsList] = React.useState<Array<{ letter: string; contacts: Array<{ contact: WeChatContact; role: StoryRole }> }>>(() => {
    const contacts = loadWeChatContacts();
    const roles = loadStoryRoles();

    // 将联系人按字母分组
    const grouped: { [key: string]: Array<{ contact: WeChatContact; role: StoryRole }> } = {};

    contacts.forEach(contact => {
      const role = roles.find(r => r.id === contact.roleId);
      if (role) {
        const displayName = contact.remark || role.wechatNickname || role.name;
        const firstChar = displayName.charAt(0);
        // 判断是否是英文字母
        let letter: string;
        if (/[A-Za-z]/.test(firstChar)) {
          letter = firstChar.toUpperCase();
        } else if (/[\u4e00-\u9fa5]/.test(firstChar)) {
          // 中文字符，使用首字符作为分组（也可以后续改进为拼音首字母）
          letter = firstChar;
        } else {
          letter = '#';
        }

        if (!grouped[letter]) {
          grouped[letter] = [];
        }
        grouped[letter].push({ contact, role });
      }
    });

    // 对每个分组内的联系人按名称排序
    Object.keys(grouped).forEach(letter => {
      grouped[letter].sort((a, b) => {
        const nameA = a.contact.remark || a.role.wechatNickname || a.role.name;
        const nameB = b.contact.remark || b.role.wechatNickname || b.role.name;
        return nameA.localeCompare(nameB, 'zh-CN');
      });
    });

    // 转换为数组并按字母排序
    return Object.keys(grouped)
      .sort((a, b) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        // 英文字母优先，然后是中文
        const aIsLetter = /[A-Z]/.test(a);
        const bIsLetter = /[A-Z]/.test(b);
        if (aIsLetter && !bIsLetter) return -1;
        if (!aIsLetter && bIsLetter) return 1;
        return a.localeCompare(b, 'zh-CN');
      })
      .map(letter => ({
        letter,
        contacts: grouped[letter]
      }));
  });
  // 输入框文本
  const [inputText, setInputText] = React.useState('');
  // 语音消息弹窗状态
  const [showVoiceModal, setShowVoiceModal] = React.useState(false);
  // 联系人资料卡弹窗（仅角色会话）
  const [showContactProfile, setShowContactProfile] = React.useState(false);
  // 通讯录内的联系人详情页（资料卡 / 设置 / 权限页）
  const [contactsView, setContactsView] = React.useState<'list' | 'profile' | 'settings' | 'permission'>('list');
  const [contactsProfileRoleId, setContactsProfileRoleId] = React.useState<string | null>(null);
  // 用于强制刷新联系人相关视图（设置 / 权限页开关等实时反馈）
  const [contactsDataVersion, setContactsDataVersion] = React.useState(0);
  // 自动回复（功能菜单里的“自动回复”）的加载提示
  const [showAutoReplyLoading, setShowAutoReplyLoading] = React.useState(false);
  // 聊天表情面板（输入框左侧表情按钮）
  const [showEmojiPanel, setShowEmojiPanel] = React.useState(false);
  const [voiceText, setVoiceText] = React.useState('');
  // 展开的语音消息ID
  const [expandedVoiceId, setExpandedVoiceId] = React.useState<string | null>(null);
  // 聊天底部功能菜单（加号按钮）
  const [showChatTools, setShowChatTools] = React.useState(false);
  const [chatToolsPage, setChatToolsPage] = React.useState(0);
  // 滚动到聊天底部（不影响背景图位置）
  const scrollToBottom = React.useCallback(() => {
    if (!chatContainerRef.current) return;
    // 使用 setTimeout 确保 DOM 更新后再滚动
    setTimeout(() => {
      if (!chatContainerRef.current) return;
      const el = chatContainerRef.current;
      el.scrollTop = el.scrollHeight;
    }, 100);
  }, []);

  // 关闭聊天详情页：保留玩家当前在聊天里的停留位置，不自动滚动到底部
  const closeChatSettings = React.useCallback(() => {
    setShowChatSettings(false);
  }, []);

  // 发送红包
  const handleSendRedPacket = () => {
    if (!activeChat) return;
    const raw = redPacketAmountInput.trim();
    const amount = Number(raw);
    if (!raw || Number.isNaN(amount)) {
      setRedPacketError('请输入金额');
      return;
    }
    const fixed = Math.round(amount * 100) / 100;
    if (fixed < 0.01) {
      setRedPacketError('单个红包至少 0.01 元');
      return;
    }
    if (fixed > 200) {
      setRedPacketError('单个红包最多 200 元');
      return;
    }

    const note = redPacketNoteInput.trim() || '恭喜发财，大吉大利';

    const messages = loadChatMessages(activeChat.id);
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    const nowTimestamp = Date.now();

    const msg: ChatMessage = {
      id: `redpacket-${nowTimestamp}-${Math.random()}`,
      from: 'self',
      // 文本中不再包含金额，只保留红包备注，避免在气泡以外的位置露出金额
      text: `[红包] ${note}`,
      time,
      timestamp: nowTimestamp,
      redPacketAmount: fixed,
      redPacketNote: note
    };

    messages.push(msg);
    saveChatMessages(activeChat.id, messages);
    setChatMessagesKey((prev) => prev + 1);

    setShowRedPacketPage(false);
    setRedPacketError(null);
    // 发完红包后滚到最新
    scrollToBottom();
  };

  // 监听联系人变化，更新聊天列表和通讯录列表
  React.useEffect(() => {
    const updateContactsList = () => {
      const contacts = loadWeChatContacts();
      const roles = loadStoryRoles();

      // 将联系人按字母分组
      const grouped: { [key: string]: Array<{ contact: WeChatContact; role: StoryRole }> } = {};

      contacts.forEach(contact => {
        const role = roles.find(r => r.id === contact.roleId);
        if (role) {
          const displayName = contact.remark || role.wechatNickname || role.name;
          const firstChar = displayName.charAt(0);
          // 判断是否是英文字母
          let letter: string;
          if (/[A-Za-z]/.test(firstChar)) {
            letter = firstChar.toUpperCase();
          } else if (/[\u4e00-\u9fa5]/.test(firstChar)) {
            // 中文字符，使用首字符作为分组（也可以后续改进为拼音首字母）
            letter = firstChar;
          } else {
            letter = '#';
          }

          if (!grouped[letter]) {
            grouped[letter] = [];
          }
          grouped[letter].push({ contact, role });
        }
      });

      // 对每个分组内的联系人按名称排序
      Object.keys(grouped).forEach(letter => {
        grouped[letter].sort((a, b) => {
          const nameA = a.contact.remark || a.role.wechatNickname || a.role.name;
          const nameB = b.contact.remark || b.role.wechatNickname || b.role.name;
          return nameA.localeCompare(nameB, 'zh-CN');
        });
      });

      // 转换为数组并按字母排序
      const sortedList = Object.keys(grouped)
        .sort((a, b) => {
          if (a === '#') return 1;
          if (b === '#') return -1;
          // 英文字母优先，然后是中文
          const aIsLetter = /[A-Z]/.test(a);
          const bIsLetter = /[A-Z]/.test(b);
          if (aIsLetter && !bIsLetter) return -1;
          if (!aIsLetter && bIsLetter) return 1;
          return a.localeCompare(b, 'zh-CN');
        })
        .map(letter => ({
          letter,
          contacts: grouped[letter]
        }));

      setContactsList(sortedList);
    };

    const refreshChatsWithPreview = () => {
      const baseChats = loadWeChatChats();
      setChats(
        baseChats.map((chat) => {
          const { lastMessage, time } = getLastMessagePreview(chat.id);
          return {
            ...chat,
            lastMessage,
            time
          };
        })
      );
    };

    const handleStorageChange = () => {
      refreshChatsWithPreview();
      updateContactsList();
    };

    // 监听好友申请通过事件
    const handleFriendRequestAccepted = (event: CustomEvent<{ roleId: string; roleName: string; greeting: string }>) => {
      const { roleId, roleName, greeting } = event.detail;
      console.log('[WeChatApp] 收到好友申请通过事件:', { roleId, roleName, greeting });
      addFriendAcceptedSystemMessage(roleId, roleName, greeting);
      // 如果当前正在查看该聊天，触发重新渲染
      if (activeChatId === `chat-${roleId}`) {
        console.log('[WeChatApp] 当前正在查看该聊天，触发重新渲染');
        refreshChatsWithPreview();
        setChatMessagesKey(prev => prev + 1); // 强制重新渲染消息
      }
    };

    // 监听微信消息更新事件（从剧情模式同步的消息）
    const handleWeChatMessagesUpdated = (event: CustomEvent<{ roleId: string; chatId: string; messages: any[] }>) => {
      const { roleId, chatId } = event.detail;
      console.log('[WeChatApp] 收到微信消息更新事件:', { roleId, chatId });
      // 如果当前正在查看该聊天，触发重新渲染
      if (activeChatId === chatId) {
        console.log('[WeChatApp] 当前正在查看该聊天，触发重新渲染消息');
        refreshChatsWithPreview();
        setChatMessagesKey(prev => prev + 1); // 强制重新渲染消息
      }
    };

    // 监听 localStorage 变化
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('friend-request-accepted', handleFriendRequestAccepted as unknown as EventListener);
    window.addEventListener('wechat-messages-updated', handleWeChatMessagesUpdated as unknown as EventListener);

    // 定期检查（因为同源页面不会触发 storage 事件）
    // 只更新聊天列表和通讯录列表，不强制刷新消息显示（避免频繁滚动）
    const interval = setInterval(() => {
      refreshChatsWithPreview();
      updateContactsList();
      // 不再强制刷新消息显示，只在真正有新消息时才更新
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('friend-request-accepted', handleFriendRequestAccepted as unknown as EventListener);
      window.removeEventListener('wechat-messages-updated', handleWeChatMessagesUpdated as unknown as EventListener);
      clearInterval(interval);
    };
  }, [activeChatId]);

  // 当聊天ID变化或消息更新时，滚动到底部
  React.useEffect(() => {
    if (activeChatId) {
      scrollToBottom();
    }
  }, [activeChatId, chatMessagesKey, scrollToBottom]);

  const activeChat =
    activeChatId == null
      ? null
      : chats.find((chat) => chat.id === activeChatId) ?? null;

  // 初始化开场白消息：当打开聊天时，如果没有任何消息且角色有开场白，则将开场白按换行分割成多条消息
  React.useEffect(() => {
    if (!activeChat) return;

    // 检查是否是联系人聊天（有roleId属性）
    const roleId = 'roleId' in activeChat ? activeChat.roleId : null;
    if (!roleId) return; // 不是联系人聊天，不需要初始化开场白

    const messages = loadChatMessages(activeChat.id);
    // 如果已经有消息，不需要初始化
    if (messages.length > 0) return;

    // 获取角色信息
    const allRoles = loadStoryRoles();
    const role = allRoles.find(r => r.id === roleId);
    if (!role || !role.opening || !role.opening.trim()) return;

    // 将开场白按换行分割，过滤空行
    const openingLines = role.opening
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (openingLines.length === 0) return;

    // 创建多条消息，每条消息对应一行开场白
    const openingMessages: ChatMessage[] = openingLines.map((text, index) => ({
      id: `opening-${Date.now()}-${index}`,
      from: 'other',
      text: text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }));

    // 保存消息
    saveChatMessages(activeChat.id, openingMessages);

    // 触发消息更新事件
    setChatMessagesKey(prev => prev + 1);
  }, [activeChat?.id]);

  // 发送消息状态
  const [isSending, setIsSending] = React.useState(false);
  // AI 延迟回复定时器（用于“角色在忙”时的统一回复）
  const aiReplyTimeoutRef = React.useRef<number | null>(null);
  // 角色“在忙中”状态提示（例如：去拍戏、开会等，稍后统一回复）
  const [busyInfo, setBusyInfo] = React.useState<{ roleName: string; untilTimestamp: number } | null>(null);
  // 忙碌倒计时当前时间（用于展示时分秒）
  const [busyNow, setBusyNow] = React.useState<number>(() => Date.now());
  // 角色已读不回提示
  const [noReplyInfo, setNoReplyInfo] = React.useState<{ roleName: string; reason: string } | null>(null);
  // API 未配置提示
  const [showApiConfigModal, setShowApiConfigModal] = React.useState(false);
  // 当前聊天下「我的身份」查看弹窗
  const [showIdentityModal, setShowIdentityModal] = React.useState(false);
  const [currentRoleIdentity, setCurrentRoleIdentity] = React.useState<PlayerIdentity | null>(null);
  // 从微信侧跳转到 StoryApp 中“玩家身份”页并编辑的目标角色 ID
  const [pendingIdentityEditRoleId, setPendingIdentityEditRoleId] = React.useState<string | null>(null);
  // 聊天详情（聊天设置）页
  const [showChatSettings, setShowChatSettings] = React.useState(false);
  const [currentChatSettings, setCurrentChatSettings] = React.useState<ChatSettings>({});
  // 聊天功能菜单里的「通话」底部弹窗（语音/视频）
  const [showCallActionSheet, setShowCallActionSheet] = React.useState(false);
  // 发红包全屏页
  const [showRedPacketPage, setShowRedPacketPage] = React.useState(false);
  const [redPacketAmountInput, setRedPacketAmountInput] = React.useState('');
  const [redPacketNoteInput, setRedPacketNoteInput] = React.useState('');
  const [redPacketError, setRedPacketError] = React.useState<string | null>(null);

  // 打开红包动画 & 详情页
  const [openingRedPacketMessage, setOpeningRedPacketMessage] = React.useState<ChatMessage | null>(null);
  // 是否已经进入红包详情（拆开后）
  const [isRedPacketDetailOpened, setIsRedPacketDetailOpened] = React.useState(false);
  // 金币是否正在旋转动画中，避免重复点击
  const [isRedPacketCoinAnimating, setIsRedPacketCoinAnimating] = React.useState(false);

  // 收到的红包记录页（从红包详情页右上角“···”进入）
  const [showRedPacketRecordPage, setShowRedPacketRecordPage] = React.useState(false);
  // 当前红包记录查看的年份（例如 2026）
  const [redPacketRecordYear, setRedPacketRecordYear] = React.useState<number | null>(null);
  // 是否展开年份选择下拉
  const [showRedPacketYearPicker, setShowRedPacketYearPicker] = React.useState(false);

  // 全局「收到的」角色红包记录（仅统计 from === 'other' 的红包，按所有角色汇总）
  const allReceivedRedPacketRecords = React.useMemo(() => {
    const now = Date.now();

    const records: Array<{
      id: string;
      amount: number;
      note: string;
      timestamp: number;
      chatId: string;
      roleId?: string;
      roleName: string;
      roleAvatarText: string;
      roleAvatarUrl?: string;
    }> = [];

    chats.forEach((chat) => {
      const chatAny = chat as any;
      // 仅统计真实角色聊天，跳过「AI 助手」「灵感备忘录」等系统会话
      if (!chatAny.roleId) return;

      const messages = loadChatMessages(chat.id);

      messages.forEach((msg) => {
        if (typeof msg.redPacketAmount !== 'number' || msg.from !== 'other') return;

        const msgAny = msg as any;
        const ts =
          typeof msgAny.timestamp === 'number' && Number.isFinite(msgAny.timestamp)
            ? msgAny.timestamp
            : now;

        records.push({
          id: msg.id,
          amount: msg.redPacketAmount as number,
          note: msg.redPacketNote || '角色发来的红包',
          timestamp: ts,
          chatId: chat.id,
          roleId: chatAny.roleId,
          roleName: chat.name,
          roleAvatarText: chat.avatarText,
          roleAvatarUrl: chat.avatarUrl
        });
      });
    });

    records.sort((a, b) => b.timestamp - a.timestamp);
    return records;
  }, [chats, chatMessagesKey]);

  // 可选年份列表（从近到远排序）
  const receivedRedPacketYears = React.useMemo(() => {
    const yearSet = new Set<number>();
    allReceivedRedPacketRecords.forEach((item) => {
      const year = new Date(item.timestamp).getFullYear();
      if (!Number.isNaN(year)) {
        yearSet.add(year);
      }
    });

    if (yearSet.size === 0) {
      return [new Date().getFullYear()];
    }

    return Array.from(yearSet).sort((a, b) => b - a);
  }, [allReceivedRedPacketRecords]);

  // 当年份列表变化时，自动对齐当前选中的年份
  React.useEffect(() => {
    if (!receivedRedPacketYears || receivedRedPacketYears.length === 0) return;
    if (redPacketRecordYear === null || !receivedRedPacketYears.includes(redPacketRecordYear)) {
      setRedPacketRecordYear(receivedRedPacketYears[0]);
    }
  }, [receivedRedPacketYears, redPacketRecordYear]);

  // 当前年份下需要展示的红包记录 + 汇总数据
  const receivedRedPacketView = React.useMemo(() => {
    const records =
      redPacketRecordYear == null
        ? allReceivedRedPacketRecords
        : allReceivedRedPacketRecords.filter(
            (item) => new Date(item.timestamp).getFullYear() === redPacketRecordYear
          );

    const totalAmount = records.reduce((sum, item) => sum + item.amount, 0);
    const totalCount = records.length;
    const maxAmount = records.reduce((max, item) => (item.amount > max ? item.amount : max), 0);
    const bestLuckCount =
      maxAmount > 0 ? records.filter((item) => item.amount === maxAmount).length : 0;

    return {
      records,
      totalAmount,
      totalCount,
      bestLuckCount
    };
  }, [allReceivedRedPacketRecords, redPacketRecordYear]);

  // 忙碌状态倒计时：有 busyInfo 时，每秒刷新一次当前时间，用于计算剩余时分秒
  React.useEffect(() => {
    if (!busyInfo) return;

    setBusyNow(Date.now());
    const timer = window.setInterval(() => {
      setBusyNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [busyInfo]);

  const {
    records: receivedRedPacketRecordsForYear,
    totalAmount: receivedRedPacketTotalAmount,
    totalCount: receivedRedPacketTotalCount,
    bestLuckCount: receivedRedPacketBestLuckCount
  } = receivedRedPacketView;

  // 玩家自己的微信昵称 / 头像（用于「收到的红包」「我」页等展示，来源于独立的微信资料）
  const playerWechatNickname =
    (wechatSelfProfile.nickname || '微信昵称').trim() || '微信昵称';
  const playerAvatarUrl = wechatSelfProfile.avatarUrl || '';
  const playerAvatarText = playerWechatNickname.charAt(0) || '我';

  const openMeProfileEditor = (field: MeProfileFieldKey) => {
    if (field === 'gender') {
      setMeProfileEditingField('gender');
      setMeProfileEditText('');
      return;
    }

    let currentValue = '';
    let currentAvatarDesc = '';
    switch (field) {
      case 'avatar':
        currentValue = playerAvatarUrl;
        currentAvatarDesc = wechatSelfProfile.avatarDesc || '';
        break;
      case 'name':
        currentValue = wechatSelfProfile.nickname || playerWechatNickname;
        break;
      case 'region':
        currentValue = wechatSelfProfile.region || '';
        break;
      case 'wechatId':
        currentValue = wechatSelfProfile.wechatId || '';
        break;
      case 'poke':
        currentValue = wechatSelfProfile.pokeText || '';
        break;
      case 'intro':
        currentValue = wechatSelfProfile.intro || '';
        break;
      default:
        currentValue = '';
    }

    setMeProfileEditText(currentValue);
    setMeProfileAvatarDesc(currentAvatarDesc);
    setMeProfileEditingField(field);
  };

  const applyMeProfileTextEdit = () => {
    if (!meProfileEditingField || meProfileEditingField === 'gender') return;
    const rawValue = meProfileEditText;
    const value = meProfileEditingField === 'avatar' ? rawValue : rawValue.trim();

    setWeChatSelfProfile((prev) => {
      const next: WeChatSelfProfile = { ...prev };

      switch (meProfileEditingField) {
        case 'avatar':
          next.avatarUrl = value || undefined;
          next.avatarDesc = meProfileAvatarDesc.trim() || '';
          break;
        case 'name':
          next.nickname = value || prev.nickname || '微信昵称';
          break;
        case 'region':
          next.region = value;
          break;
        case 'wechatId':
          next.wechatId = value || undefined;
          break;
        case 'poke':
          next.pokeText = value || undefined;
          break;
        case 'intro':
          next.intro = value;
          break;
        default:
          break;
      }

      saveWeChatSelfProfile(next);
      return next;
    });

    setMeProfileEditingField(null);
    setMeProfileEditText('');
  };

  const handleMeProfileGenderSelect = (gender: PlayerIdentity['gender']) => {
    setWeChatSelfProfile((prev) => {
      const next: WeChatSelfProfile = { ...prev, gender };
      saveWeChatSelfProfile(next);
      return next;
    });
    setMeProfileEditingField(null);
  };

  const handleMeProfileAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMeProfileEditText(reader.result);
      }
    };
    reader.readAsDataURL(file);
    // 允许用户重复选择同一个文件
    e.target.value = '';
  };

  const getMeProfileEditTitle = (field: MeProfileFieldKey | null): string => {
    switch (field) {
      case 'name':
        return '设置名字';
      case 'avatar':
        return '头像';
      case 'region':
        return '地区';
      case 'wechatId':
        return '微信号';
      case 'poke':
        return '拍一拍';
      case 'intro':
        return '签名';
      case 'gender':
        return '性别';
      default:
        return '';
    }
  };

  // 检查是否有未处理的玩家消息（最后一条是玩家发送的，且之后没有AI回复）
  const hasUnprocessedMessages = React.useMemo(() => {
    if (!activeChat) return false;
    const messages = loadChatMessages(activeChat.id);
    if (messages.length === 0) return false;

    // 找到最后一条玩家消息
    let lastPlayerMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].from === 'self') {
        lastPlayerMessageIndex = i;
        break;
      }
    }

    if (lastPlayerMessageIndex === -1) return false; // 没有玩家消息

    // 检查最后一条玩家消息之后是否有AI回复
    for (let i = lastPlayerMessageIndex + 1; i < messages.length; i++) {
      if (messages[i].from === 'other') {
        return false; // 有AI回复，说明已处理
      }
    }

    return true; // 有未处理的玩家消息
  }, [activeChat?.id, chatMessagesKey]);

  // 分割长消息为多条短消息（控制每条消息字数，尽量不破坏句子完整性）
  const splitLongMessage = (text: string, maxLength: number = 100): string[] => {
    if (text.length <= maxLength) {
      return [text];
    }

    // 特殊情况：如果包含特殊标记（如公告、情感小作文等），不分割
    if (text.includes('【公告】') || text.includes('【通知】') || text.length > 500) {
      return [text];
    }

    const messages: string[] = [];
    let currentIndex = 0;

    while (currentIndex < text.length) {
      let endIndex = currentIndex + maxLength;

      // 如果还没到末尾，尝试在标点符号处分割，优先保证句子完整
      if (endIndex < text.length) {
        const punctuation = ['。', '！', '？', '，', '.', '!', '?', ',', '\n'];
        let lastPunctuationIndex = -1;

        for (let i = endIndex - 20; i < endIndex && i < text.length; i++) {
          if (punctuation.includes(text[i])) {
            lastPunctuationIndex = i;
          }
        }

        if (lastPunctuationIndex > currentIndex) {
          endIndex = lastPunctuationIndex + 1;
        } else {
          // 没有找到合适标点时，不做“硬截断”，直接把剩余内容当成最后一段
          messages.push(text.slice(currentIndex).trim());
          break;
        }
      }

      messages.push(text.slice(currentIndex, endIndex).trim());
      currentIndex = endIndex;
    }

    return messages;
  };

  // 生成玩家侧的自动回复建议：根据最近聊天上下文，帮玩家生成 1~2 句自然的回复文案，填入输入框但不直接发送
  const generatePlayerAutoReply = async (role: StoryRole): Promise<string> => {
    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      throw new Error('NO_API_CONFIG');
    }

    const endpointBase = cfg.baseUrl.replace(/\/+$/, '');
    const url =
      endpointBase.endsWith('/chat/completions') || endpointBase.endsWith('/completions')
        ? endpointBase
        : endpointBase + '/chat/completions';

    const chatId = `chat-${role.id}`;
    const messages = loadChatMessages(chatId);
    const recent = messages
      .slice(-12)
      .map((m) => {
        if (m.from === 'self') return `玩家：${m.text}`;
        if (m.from === 'other') return `${role.wechatNickname || role.name}：${m.text}`;
        return '';
      })
      .filter(Boolean)
      .join('\n');

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
              '你是玩家本人的小帮手，帮玩家想一两句自然的微信回复文案。\n' +
              '要求：1）用第一人称，从玩家视角回复；2）语气自然、有“活人感”，不要机械或太官方；3）可以稍微带点幽默或撒娇，但不要阴阳怪气；4）不要替玩家做长篇大论，控制在 5~25 字；5）只输出玩家要发送的中文内容本身，不要任何解释、前后缀、引号、角色名。'
          },
          {
            role: 'user',
            content:
              `下面是玩家和角色最近一段微信聊天记录（时间顺序从早到晚）：\n${recent || '（暂无历史聊天）'}\n\n` +
              '请基于这些上下文，帮玩家想一个此刻可以发给对方的合适回复。'
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

    text = text
      .trim()
      .replace(/^```[\s\S]*?\n/, '')
      .replace(/\n?```$/, '')
      .trim();

    // 简单清理可能的引号或前缀
    text = text.replace(/^["“『「]+/, '').replace(/["”』」]+$/, '').trim();

    return text;
  };

  // 简单移除文本中的常见 emoji，用于语音文本（避免语音文字里充满表情）
  const stripEmoji = (text: string): string => {
    return text.replace(
      /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{FE0F}\u{1F90C}-\u{1F9FF}]/gu,
      ''
    );
  };

  // 非语音文本：限制 emoji 密度（避免频繁出现导致“人机感”）
  // - 有多个 emoji：全部移除
  // - 只有 1 个 emoji：以较低概率保留（默认 25%），否则移除
  const softLimitEmoji = (text: string, keepProbability = 0.25): string => {
    const emojiRegex =
      /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{FE0F}\u{1F90C}-\u{1F9FF}]/gu;
    const matches = text.match(emojiRegex) ?? [];
    if (matches.length === 0) return text;
    if (matches.length > 1) {
      return text.replace(emojiRegex, '').replace(/\s{2,}/g, ' ').trim();
    }
    const keep = Math.random() < keepProbability;
    if (!keep) {
      return text.replace(emojiRegex, '').replace(/\s{2,}/g, ' ').trim();
    }
    const without = text.replace(emojiRegex, '').trim();
    const emoji = matches[0] ?? '';
    return without ? `${without}${emoji}` : emoji;
  };

  // 在一轮 AI 回复完成后，根据设置决定是否生成一条新的聊天记忆快照
  const maybeAutoCreateChatMemory = React.useCallback(
    (chatId: string, role: StoryRole) => {
      if (!memorySettings.autoSummaryEnabled) return;
      const interval = Math.max(1, Math.floor(memorySettings.summaryInterval || 3));
      const count = incrementChatMemoryCounter(chatId);
      if (count % interval !== 0) return;

      const messagesForSnapshot = loadChatMessages(chatId);
      if (!messagesForSnapshot.length) return;

      createChatMemorySnapshot(chatId, role, messagesForSnapshot);

      const nowStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });
      setMemoryToast({
        roleName: role.wechatNickname || role.name,
        createdAt: nowStr
      });
    },
    [memorySettings.autoSummaryEnabled, memorySettings.summaryInterval]
  );

  // 生成AI回复（微信消息，第一人称，角色视角）
  // 返回角色本次回复的消息数组；如果根据人设和当前状态选择已读不回，则不返回消息，而是携带 noReplyReason
  const generateWeChatReply = async (
    playerMessages: string[],
    role: StoryRole
  ): Promise<{ replies: Array<{ text: string; isVoice: boolean; voiceDuration?: number; emojiName?: string }>; noReplyReason?: string }> => {
    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      throw new Error('NO_API_CONFIG');
    }

    const endpointBase = cfg.baseUrl.replace(/\/+$/, '');
    const url =
      endpointBase.endsWith('/chat/completions') ||
        endpointBase.endsWith('/completions')
        ? endpointBase
        : endpointBase + '/chat/completions';

    // 获取最近的聊天记录（排除当前要处理的未处理消息，避免重复）
    const chatMessages = loadChatMessages(`chat-${role.id}`);
    // 找到最后一条AI回复的位置
    let lastAIReplyIndex = -1;
    for (let i = chatMessages.length - 1; i >= 0; i--) {
      if (chatMessages[i].from === 'other') {
        lastAIReplyIndex = i;
        break;
      }
    }

    // 获取最后一条AI回复之后的所有消息作为上下文（但不包括当前要处理的未处理消息）
    const contextMessages = lastAIReplyIndex >= 0
      ? chatMessages.slice(0, lastAIReplyIndex + 1)
      : chatMessages;

    const recentMessages = contextMessages.slice(-10).map(msg => {
      if (msg.from === 'self') {
        return `玩家：${msg.text}`;
      } else if (msg.from === 'other') {
        return `${role.wechatNickname || role.name}：${msg.text}`;
      }
      return '';
    }).filter(Boolean).join('\n');

    // 获取角色世界书
    const worldbookContent = (role.worldbooks || [])
      .map((wb: any) => {
        const wbName = wb.name || '未命名世界书';
        const entriesText = (wb.entries || [])
          .filter((e: any) => e.title || e.content)
          .map((e: any) => {
            const title = e.title || '（未命名条目）';
            const content = e.content || '';
            return content ? `「${title}」：${content}` : `「${title}」`;
          })
          .join('\n') || '';
        return entriesText ? `【${wbName}】\n${entriesText}` : '';
      })
      .filter((text: string) => text.length > 0)
      .join('\n\n') || '';

    // 获取玩家身份信息（针对当前角色的专属视角）
    const playerIdentity = loadPlayerIdentityForRole(role.id);
    const playerInfo = playerIdentity.name
      ? `玩家姓名：${playerIdentity.name}${playerIdentity.wechatNickname ? `（微信昵称：${playerIdentity.wechatNickname}）` : ''}`
      : '（玩家尚未设置身份信息）';

    // 加载角色的线下剧情内容，用于参考场景
    const storyTurns = loadRoleChat(role.id);
    // 获取最近几轮剧情（最后6轮），用于了解当前场景
    const recentStoryContext = storyTurns
      .slice(-6)
      .map((t: any) => {
        if (t.from === 'player') {
          return t.kind === 'speech'
            ? `【玩家对白】${t.text}`
            : `【玩家场景】${t.text}`;
        } else if (t.from === 'narrator') {
          return `【叙述】${t.text}`;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');

    // 当前玩家微信资料（用于提示角色理解玩家在微信上的账号外观）
    const wechatGenderLabelForPrompt =
      wechatSelfProfile.gender === 'male'
        ? '男'
        : wechatSelfProfile.gender === 'female'
          ? '女'
          : '保密/未设置';
    const wechatProfileForPrompt =
      `昵称：${wechatSelfProfile.nickname || '（未设置）'}\n` +
      `性别：${wechatGenderLabelForPrompt}\n` +
      `地区：${wechatSelfProfile.region || '（未设置）'}\n` +
      `微信号：${wechatSelfProfile.wechatId || '（未设置）'}\n` +
      `个性签名：${wechatSelfProfile.intro || '（未设置）'}\n` +
      `头像描述：${wechatSelfProfile.avatarDesc || '（玩家没有填写头像描述，仅能看到头像图片本身）'}`;
    // 读取当前会话已存在的长期记忆摘要，用于辅助提示词（是否新增由 maybeAutoCreateChatMemory 控制）
    const chatIdForMemory = `chat-${role.id}`;
    let memoryContext = '';
    try {
      const chatMemories = loadChatMemories(chatIdForMemory);
      if (chatMemories.length > 0) {
        const latest = chatMemories.slice(-5);
        memoryContext = latest
          .map((m, index) => `记忆${index + 1}（${m.createdAt}）\n${m.summary}`)
          .join('\n\n');
      }
    } catch (err) {
      console.warn('[WeChatApp] 读取聊天记忆快照失败:', err);
    }

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
              `你是${role.wechatNickname || role.name}，正在和玩家通过微信聊天。\n\n` +
              `【关于玩家的微信资料】\n` +
              `- 你能看到的是玩家微信账号上的公开资料：头像、微信昵称、性别、地区、微信号、个性签名。\n` +
              `- 这些资料是玩家为微信号设置的展示信息，**不一定等于玩家的真实身份**，也不等于线下剧情里的玩家人设，只是一个社交账号的外壳 / persona。\n` +
              `- 你可以像现实中一样，根据这些资料做合乎逻辑的观察、联想、调侃和吐槽，例如评论头像、吐槽昵称、根据签名猜测性格、提到 TA 写的地区等。\n` +
              `- 使用这些资料时要自然，并承认它们可能只是人设：可以说“看你头像/昵称/签名给人的感觉是……”，不要说成绝对事实。\n` +
              `- 除非玩家在聊天中明确说明，否则不要把微信资料当成 100% 真实信息去下结论，更不能擅自编造你看不到的隐私（真实姓名、身份证、具体住址等）。\n\n` +
              `**核心要求：回复必须像一个有血有肉的真人，绝对不能有任何机器人或AI的感觉。**\n\n` +
              `**重要规则：**\n` +
              `1）回复必须是第一人称视角，就像真实的微信聊天一样，使用"我"、"你"等称呼。\n` +
              `2）回复要极其自然、口语化，就像年轻人在手机上打字，可以有语气词、省略号、口头禅等。\n` +
              `3）普通聊天时，大部分消息长度控制在 1～20 字之间，保持简短自然即可；偶尔可以稍微长一点，但尽量不要超过 50 字，也不要频繁发很长的普通消息。\n` +
              `4）你可以根据需要选择只发 1 条消息，或者在确实需要时拆成多条消息发送；不要为了凑条数而故意拆分，多条消息时也要保证每一条都自然、有意义。\n` +
              `5）在少数特殊场景（例如：发布一个公告、认真表白的小作文、郑重认错的小作文、对一件重要事件的长篇感想等），可以发送【小作文】：\n` +
              `   - 小作文必须是一条连续的长消息（单条气泡），整体推荐字数在 200 字及以上，不能拆成多条短消息来凑；\n` +
              `   - 你可以在小作文前后追加几条普通长度的短消息气泡，用来铺垫或收尾，但小作文本身只能占用一条消息气泡；\n` +
              `   - 只有在剧情/关系确实需要时才使用小作文，大部分日常聊天仍然以短消息为主。\n` +
              `6）**角色是一个独立的人，不是随时围着玩家转的工具人。**\n` +
              `   - 角色有自己的生活节奏、日程安排和情绪状态。\n` +
              `   - 当角色在忙、心情不好、或与玩家关系一般时，可以冷淡、敷衍、暂时不回或已读不回。\n` +
              `   - 当角色自己有事想说时，可以主动聊自己的生活，而不是永远围绕玩家转。\n` +
              `7）**情绪与逻辑：**\n` +
              `   - 角色可以对玩家有真实情绪（惊喜、委屈、开心、害羞、偶尔不耐烦或生气等），但情绪必须有充分的上下文理由，绝对不能无缘无故态度很差或乱发火。\n` +
              `   - 即使角色人设偏冷淡/毒舌，也要有分寸感：不允许长期、反复地嘴毒或恶语攻击玩家，更多是调侃式、克制的吐槽，而不是纯粹发泄情绪。\n` +
              `   - 推荐的整体比例是：大部分时间（至少 70%）保持正常或偏温柔的语气，偶尔（少数回合）才嘴毒/阴阳一下，并且在损完之后要通过语气、补充的一句关心或玩笑来“软着陆”。\n` +
              `   - 情绪表达要符合角色性格和当前好感度，避免极端撕裂、辱骂、PUA等不健康内容。\n` +
              `8）**人设一致：**必须严格遵守角色设定（世界书内容），角色的性格、习惯、说话方式、用词习惯、语气都必须完全符合设定。\n` +
              `9）如果玩家连续发送多条消息，可以综合回复，也可以挑重点逐条回应，不需要对每句话都机械回答。\n` +
              `10）当你要发送表情包消息时，请使用【专属格式】，不要自己在正文里描述或编造表情名称：\n` +
              `   - 每条表情包消息必须单独占一行，内容只能是："<<EMOJI:表情包名称>>"（前后各两个尖括号，EMOJI 全大写，中间用英文冒号）。\n` +
              `   - "表情包名称"必须从下面列表中选择一个，并且要与列表中的文字完全一致（一个字都不能改，不能加任何说明）：\n` +
              `${DEFAULT_EMOJI_NAME_LIST_FOR_PROMPT ? `${DEFAULT_EMOJI_NAME_LIST_FOR_PROMPT}\n` : ''}` +
              `   - 一条回复如果要发多个表情包，请分别写在多行里，例如：\n` +
              `     "<<EMOJI:小狗亲亲>>"\n` +
              `     "<<EMOJI:小狗被摸头开心>>"\n` +
              `   - 如果你不确定应该选哪个表情，或者觉得这些都不合适，就不要用专属格式，也不要再自己写"[表情] XXX"这类东西，而是只发送文字消息。\n` +
              `11）表情包使用的前提和频率要求：\n` +
              `   - 发送表情包时，角色一般处于【中性或偏正向】情绪（开心、害羞、撒娇、委屈想被哄等），不要在强烈负面情绪中发表情包（明显生气、冷战、极度难过、彻底无语等状态下，不要发送表情包）。\n` +
              `   - 表情包应该根据当前对话语境、上一轮和这一轮的情绪，自行选择最贴切的一两个，而不是乱用；可以把表情当成“情绪加号”，而不是替代正常对话。\n` +
              `   - 默认情况下，你整体发送表情包的频率大约控制在 30% 左右：大部分轮次只发文字，少数轮次在合适的时候追加 1 条表情包消息即可（不是每一轮都要用表情）。\n` +
              `   - 当后续系统提供“表情包发送比例/消息类型比例”的具体配置时，请优先服从配置中的数值要求来调整你使用表情包的频率。\n` +
              `12）当你在聊天记录里看到类似"[表情] 小狗亲亲"这类内容时，请把这部分仅当作【表情包的名称/含义描述】，用来理解对方当前的情绪（撒娇、认错、示爱、求安慰等），而不要真的认为自己或对方变成了小狗或其他动物；只有在世界书或当前剧情里明确写了这个角色会把自己称作“小狗”等动物（比如粘人小狗型人设）时，才可以在语气里自然地玩这种设定。\n` +
              `13）**关于“忙碌/已读不回”的决策（一定要根据上下文和线下剧情合理判断）：**\n` +
              `   - 如果角色只是【暂时在忙】，比如在开会、拍戏、工作中、开车、洗澡、刚准备睡觉等，心里仍然愿意理玩家，只是此刻不方便立刻回，请判定为“忙碌但稍后会统一回复”。\n` +
              `   - 如果角色对玩家此刻【不想理/心里在冷战/有情绪不想说话】，而且短时间内也不准备认真回，请判定为“已读不回”。\n` +
              `   - **忙碌场景下：**不要真的回复微信内容，只输出一行形如 "[BUSY:3] 我在开会，等会儿统一看消息一起回" 的说明即可，其中冒号后面的数字表示大概多少分钟后有空（比如 3 表示大约 3 分钟），数字可以是 1～10 之间的整数；不要再输出任何其他内容。\n` +
              `   - **已读不回场景下：**不要回复微信内容，只输出一行以 "[NO_REPLY]" 开头的说明，例如："[NO_REPLY] 我现在心情一般，不太想回他"。不要再输出任何其他内容。\n` +
              `   - 如果你判断此刻应该正常回复（即既不算忙碌也不算故意已读不回），就不要输出 [BUSY] 或 [NO_REPLY]，直接像普通微信一样输出若干条消息即可。\n` +
              `   - **禁止** 同时输出 [BUSY]/[NO_REPLY] 和正常消息，只能三选一：正常回复 / 忙碌稍后统一回 / 已读不回。\n` +
              `14）**活人感要点：**\n` +
              `   - 可以有思考过程，比如"嗯..."、"让我想想"、"我真服了"、"我嘞个"等。\n` +
              `   - 可以有真实的情绪词，比如"笑死"、"谁懂啊"、"有的兄弟有的"、"素"、"尊嘟"、"666"、“妈呀大姐” 、“说是”等网络用语，但一条消息里不要塞太多梗，避免用力过猛；不要频繁用阴阳怪气、辱骂式的词。\n` +
              `   - emoji 表情**可以用，但必须低频**：不要每条都带，能不用就不用；即使用也尽量每次只用 0-1 个。\n` +
              `   - 标点习惯要符合真实微信打字：普通聊天里很少用句号结尾，句子之间更多用逗号、顿号或者直接空格分隔，结尾通常留空或用语气词；\n` +
              `     只有在表达无语、难过、冷淡等负面情绪时，才用句号结尾，或者单独发送一个或多个"。""."、"..." 等作为一条消息来表示无语或情绪低落。\n` +
              `   - 可以有省略号、问号、感叹号等标点，以及不完整的句子，就像真人在快速打字。\n` +
              `   - 可以用口语化表达，比如"咋了"、"干嘛"、"你别这啊"、"你认真的？"等。\n` +
              `   - 回复要有上下文连贯性，就像真人先翻了一眼聊天记录再回。\n` +
              `   - 严禁使用过于正式、书面、说明书式的语气，禁止自称为"AI"、"系统"或提到"模型"、"指令"等词。\n` +
              `12）**语音消息格式（可选）：**\n` +
              `   - 你可以选择发送语音消息，格式为：说话内容，可以包含声音描述或环境声音。\n` +
              `   - 示例："（声音带有一丝委屈）啊..是吗"、"（周围充满了汽车的喇叭声）稍等一下"或直接输出角色说的话。\n` +
              `   - 如果使用语音消息格式，请在消息前加上标记 [语音]。\n` +
              `   - 语音消息的文本内容应该只包含说话内容和声音相关的描述。\n` +
              `11）如果你根据当前剧情和关系判断，本次应该已读不回（例如：正在开会、忙工作、在生气或处于冷战期），请不要真的回复微信消息，而是只输出一行特殊标记："[NO_REPLY] + 简短原因"，例如："[NO_REPLY] 我现在在忙别的事，不太想理他"。不要再输出任何其他内容。\n` +
              `12）**关键：线上消息和线下剧情必须互相照应，不能脱节！**\n` +
              `   - 如果线下剧情中角色和玩家正在面对面（比如在同一场景、正在对话），角色可能只是看一眼手机，但不回复线上消息，而是直接在线下剧情中与玩家对话。\n` +
              `   - 如果角色正在忙碌、睡觉、开会等场景，可能不回复或延迟回复，并在合适的时候补一句解释，语气保持正常或略带情绪但不过分。\n` +
              `   - 如果角色和玩家不在同一场景，角色会正常回复微信消息。\n` +
              `   - 回复内容要与线下剧情场景保持一致，不要出现矛盾；如果线下剧情显示角色正在做某事，线上回复也要体现这个状态。\n\n` +
              `${worldbookContent ? `【角色设定（世界书）- 必须严格遵守】\n${worldbookContent}\n\n` : ''}` +
              `${playerInfo ? `【玩家信息】\n${playerInfo}\n\n` : ''}` +
              `${wechatProfileForPrompt ? `【玩家微信资料（账号外观，不一定是真实身份）】\n${wechatProfileForPrompt}\n\n` : ''}` +
              `${recentStoryContext ? `【最近线下剧情场景（重要参考）】\n${recentStoryContext}\n\n**注意：**请根据上述线下剧情场景来决定是否回复微信消息。如果角色和玩家正在面对面，可能不回复或简短回复，而是在线下剧情中直接对话。如果不在同一场景，则正常回复。\n\n` : ''}` +
              `${memoryContext ? `【对话长期记忆摘要（自动整理，仅供参考）】\n${memoryContext}\n\n` : ''}` +
              `【最近聊天记录】\n${recentMessages || '（暂无聊天记录）'}\n\n` +
              `**记住：你的回复必须像真人在微信上聊天一样自然，有活人感，绝对不能像AI或机器人！同时，线上消息必须与线下剧情场景保持一致，不能脱节！**`
          },
          {
            role: 'user',
            content: `玩家刚刚发送了以下${playerMessages.length}条消息（请综合所有消息的内容和上下文来回复，不要只看最后一条）：\n${playerMessages.map((msg: string, i: number) => `${i + 1}. ${msg}`).join('\n')}\n\n请以${role.wechatNickname || role.name}的身份，用第一人称综合回复这些消息。\n\n**重要：**\n- 回复必须像真人在微信上聊天一样自然，有明显的“活人感”，禁止任何机器人/AI口吻\n- 严格遵守角色设定（世界书）中的性格、说话方式、用词习惯\n- 角色是有独立人格的，可以有自己的情绪和生活重心，不需要时时刻刻围着玩家转\n- 在合理的上下文下，可以对玩家表达不耐烦、生气、委屈等情绪，但必须有清晰原因，情绪强度要符合好感度；禁止无缘无故对玩家态度很差或乱发火。\n- 即使角色人设偏冷淡/毒舌，也应该以“嘴上损、心里有分寸”为原则：可以偶尔毒舌式调侃，但不要长时间阴阳怪气或恶语中伤玩家。整体语气请以【正常/温柔】为主，嘴毒只是“调味料”，不能成为每一句话的主色。\n- 当你说了比较损的话时，建议在后续一两句里通过玩笑、转移话题、稍微哄一哄、或者加一句关心，来体现这个角色虽然嘴硬但心软，有明显的“反差萌”和在乎感。\n- 可以自然使用年轻人口头禅和网络用语，例如："我真服了"、"笑死"、"谁懂啊"、"我嘞个"、"有的兄弟有的"、"素"、"尊嘟"、"666" 等，但不要滥用，也不要频繁用带攻击性的词。\n- 当你看到类似"[表情] 小狗亲亲"这类消息时，请把这部分内容仅当作【表情包的名称/含义描述】，用来理解对方当前的情绪（撒娇、认错、示爱、求安慰等），而不要真的认为自己或对方变成了小狗或其他动物；只有在世界书或当前剧情里明确写了这个角色会把自己称作“小狗”等动物（比如粘人小狗型人设）时，才可以在语气里自然地玩这种设定。\n- 普通聊天时，每条消息通常控制在 1～20 字之间，可以只发 1 条消息；只有在确实需要时才根据语气和节奏自由拆成多条独立短消息，总字数一般不超过 50 字。\n- 当你判断这是一个需要郑重表达的特殊场景（例如发布公告、认真表白、郑重认错、对重要事件长篇感想等），可以切换到【小作文模式】：小作文必须是一条连续的长消息（单条气泡），整体字数应在 200 字及以上，不能拆成多条短消息来凑；你可以在这条小作文的前后搭配几条普通短消息。\n- emoji 表情不要频繁出现：能不用就不用；即使用也尽量 0-1 个，不要每条都带\n- 不要用过于正式或书面化的语言，禁止自称为AI或提到“系统”“模型”等词\n- 回复要有上下文连贯性，就像真人翻完聊天记录后再回\n- 如果你判断当前场景下角色应该已读不回（例如正在忙、心里在冷战、不想理对方等），请不要回复内容，而是只输出一行以 [NO_REPLY] 开头的说明，比如：[NO_REPLY] 我现在在忙工作，懒得理他。不要再输出别的。\n- **必须综合所有玩家消息的内容来回复，不要只盯着最后一条消息**\n- **关键：必须参考线下剧情场景！如果线下剧情显示角色和玩家正在面对面（比如在同一场景、正在对话），角色可能只是看一眼手机但不回复，或者简短回复"等会再说"、"见面聊"等，然后直接在线下剧情中与玩家对话。如果角色和玩家不在同一场景，则正常回复微信消息。线上消息和线下剧情必须保持一致，不能脱节！**`
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

    const rawText = text.trim();

    // 特殊模式：如果模型根据人设判断本次应该已读不回，则只返回一行 [NO_REPLY] 开头的说明
    if (rawText.startsWith('[NO_REPLY]')) {
      const reason = rawText.replace(/^\[NO_REPLY\]\s*/u, '').trim() || '对方看到了你的消息，但现在不想/不方便回复你。';
      return { replies: [], noReplyReason: reason };
    }

    // 将回复分割成多条消息（按换行符或句号分割）
    let replies = rawText
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // 如果只有一条消息但太长，尝试按句号分割
    if (replies.length === 1 && replies[0].length > 100) {
      const sentences = replies[0].split(/[。！？.!?]/).filter(s => s.trim().length > 0);
      if (sentences.length > 1) {
        replies = sentences.map(s => s.trim() + '。').filter(s => s.length > 1);
      }
    }

    // 处理表情包格式 + 语音消息格式
    // 为了避免“每轮必出一个表情包”，这里做一层频率 & 随机控制：
    // - 查看最近几条 AI 消息里用了多少次表情；
    // - 本轮最多只发送 1 条表情消息，其余按普通文字处理；
    // - 即使模型按表情格式输出，也会按一定概率退回文字，让表情更像点缀。
    const recentAIMessages = chatMessages.filter(m => m.from === 'other').slice(-6);
    const recentEmojiCount = recentAIMessages.filter(m => (m as any).emojiName).length;
    let usedEmojiThisRound = false;

    // 统一的回复结构类型
    type ProcessedReply = {
      text: string;
      isVoice: boolean;
      voiceDuration?: number;
      emojiName?: string;
    };

    const processedRepliesRaw: Array<ProcessedReply | null> = replies.map((reply) => {
      // 先检测是否是表情包专属格式：
      // 1）推荐严格格式：<<EMOJI:表情包名称>>，整条消息只有这一段内容
      // 2）兼容旧格式：[表情] 名称 或 【表情】 名称
      //    为了避免模型乱发不存在的表情名，这里仍然会强制校验是否在配置列表里

      // 新格式：<<EMOJI:小狗亲亲>>
      let emojiProtocolMatch = reply.match(/^<<EMOJI:(.+)>>$/u);

      // 兼容旧格式：[表情] 小狗亲亲 / 【表情】 小狗亲亲
      if (!emojiProtocolMatch) {
        const legacyMatch =
          reply.match(/^[\[【]表情[\]】]\s*(.+)$/u) ||
          reply.match(/^[\[【]表情[\]】]\s*([^，,。.!！?？\s]+(?:[（(][^）)]*[）)])?)/u);
        if (legacyMatch) {
          emojiProtocolMatch = legacyMatch;
        }
      }

      if (emojiProtocolMatch) {
        let emojiName = emojiProtocolMatch[1].trim();

        // 有些模型会在名字后面加备注，例如 "小狗亲亲（抱抱你）" → 先尝试去掉最后一段全角括号内容再匹配
        const candidates: string[] = [emojiName];
        const strippedOnce = emojiName.replace(/（[^）]*）$/u, '').trim();
        if (strippedOnce && strippedOnce !== emojiName) {
          candidates.push(strippedOnce);
        }

        let emojiConfig = undefined as ReturnType<typeof findEmojiByName> | undefined;
        for (const candidate of candidates) {
          emojiConfig = findEmojiByName(candidate);
          if (emojiConfig) {
            emojiName = emojiConfig.name;
            break;
          }
        }

        // 只有当名称在配置的表情列表中存在时，才有资格当成表情消息；否则退回普通文本
        if (emojiConfig) {
          // 决定这一条是否真的用表情，而不是每次都用：
          // - 最近完全没用表情 → 有较高概率（例如 70%）本轮用一次；
          // - 最近已经有 1 个表情 → 降低到大约 35%；
          // - 最近表情更多时，本轮直接不再用表情。
          let useEmoji = false;
          if (!usedEmojiThisRound) {
            if (recentEmojiCount === 0) {
              useEmoji = Math.random() < 0.7;
            } else if (recentEmojiCount === 1) {
              useEmoji = Math.random() < 0.35;
            } else {
              useEmoji = false;
            }
          }

          if (useEmoji) {
            usedEmojiThisRound = true;
            return {
              // 存储时依旧使用统一可读格式，方便上下文提示词理解
              text: `[表情] ${emojiName}`,
              isVoice: false,
              emojiName
            };
          }

          // 决定不使用表情时：整条回复直接跳过，不再输出表情名称文本
          return null;
        }

        // 未找到对应表情：去掉专属格式前缀，当成一句普通文字回复
        return {
          text: softLimitEmoji(emojiName),
          isVoice: false
        };
      }

      // 检测是否是语音消息格式
      const isVoiceMessage = reply.startsWith('[语音]') ||
        reply.includes('（声音') ||
        reply.includes('(声音') ||
        reply.includes('（周围') ||
        reply.includes('(周围');

      if (isVoiceMessage) {
        // 移除[语音]标记
        let voiceText = reply.replace(/^\[语音\]\s*/, '');
        // 语音文本不保留 emoji，避免看起来像纯文字表情
        voiceText = stripEmoji(voiceText);

        // 提取纯文本内容用于计算时长（移除声音描述）
        const textContent = voiceText.replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').trim();

        // 计算语音时长
        const duration = calculateVoiceDuration(textContent || voiceText);

        // 返回语音消息对象
        const voiceReply: ProcessedReply = {
          text: voiceText,
          voiceDuration: duration,
          isVoice: true
        };
        return voiceReply;
      }

      // 普通文本消息
      const textReply: ProcessedReply = {
        text: softLimitEmoji(reply),
        isVoice: false
      };
      return textReply;
    });

    // 过滤掉被频率控制逻辑跳过的空回复
    const processedReplies = processedRepliesRaw.filter(
      (item): item is ProcessedReply =>
        !!item && typeof (item as any).text === 'string' && (item as any).text.length > 0
    );

    // 二次切分：进一步把过长的普通文本回复拆成多条更短的消息，模拟真实微信打字节奏

    const expandedReplies: ProcessedReply[] = [];

    processedReplies.forEach((replyObj) => {
      // 表情消息和语音消息不再拆分，保持一条气泡
      if (replyObj.isVoice || (replyObj as any).emojiName) {
        expandedReplies.push(replyObj as ProcessedReply);
        return;
      }

      // 【小作文模式】：特别长的一段（例如 200 字以上），保持完整一条气泡，不再拆分
      if (replyObj.text && replyObj.text.length >= 200) {
        expandedReplies.push(replyObj as ProcessedReply);
        return;
      }

      // 普通文本：优先相信模型自身的分段，只在中长段时再辅助拆分
      if (!replyObj.text || replyObj.text.length <= 40) {
        // 40 字以内：直接保持一条，避免把完整句子拆散
        expandedReplies.push(replyObj as ProcessedReply);
        return;
      }

      // 超过一定长度（例如 40 字）再按标点智能分段，避免硬截断
      const segments = splitLongMessage(replyObj.text, 32);

      // 安全兜底：如果拆不出更合适的段落，就原样返回
      if (!segments || segments.length <= 1) {
        expandedReplies.push(replyObj as ProcessedReply);
        return;
      }

      segments.forEach((segment) => {
        expandedReplies.push({
          ...replyObj,
          text: segment
        } as ProcessedReply);
      });
    });

    const safeReplies =
      expandedReplies.length > 0
        ? expandedReplies
        : [{ text: rawText, isVoice: false }];

    return { replies: safeReplies };
  };

  // 异步生成剧情内容
  const generateStoryContent = async (playerMessages: string[], roleId: string, wechatReplies?: string) => {
    try {
      console.log('[WeChatApp] generateStoryContent 被调用:', { roleId, messageCount: playerMessages.length });

      const allRoles = loadStoryRoles();
      const role = allRoles.find(r => r.id === roleId);
      if (!role) {
        console.warn('[WeChatApp] 未找到角色，无法生成剧情:', roleId);
        return;
      }

      const cfg = loadApiConfig();
      if (!cfg.baseUrl || !cfg.model) {
        console.warn('[WeChatApp] API未配置，无法生成剧情');
        return;
      }

      // 从localStorage加载该角色的剧情数据
      const existingTurns = loadRoleChat(roleId);
      console.log('[WeChatApp] 加载的现有剧情轮次:', existingTurns.length);

      // 延迟一点时间，确保事件监听器已注册
      await new Promise(resolve => setTimeout(resolve, 100));

      // 调用StoryApp中的generateAIResponse函数（通过事件触发）
      const event = new CustomEvent('generate-story-for-wechat-message', {
        detail: { roleId, playerMessages, existingTurns, wechatReplies }
      });

      console.log('[WeChatApp] 准备触发剧情生成事件:', { roleId, playerMessages, existingTurnsCount: existingTurns.length });
      window.dispatchEvent(event);
      document.dispatchEvent(event); // 同时触发在document上，确保能被监听到

      console.log('[WeChatApp] 已触发剧情生成事件');
    } catch (err) {
      console.error('[WeChatApp] 生成剧情失败:', err);
    }
  };

  // 只发送消息，不调用AI
  const handleSendMessage = () => {
    if (!activeChat || !inputText.trim()) return;

    const textToSend = inputText.trim();
    const messagesToSend = splitLongMessage(textToSend);

    // 保存玩家发送的消息
    const messages = loadChatMessages(activeChat.id);
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    messagesToSend.forEach((msgText) => {
      const nowTimestamp = Date.now();
      const message: ChatMessage = {
        id: `msg-${nowTimestamp}-${Math.random()}`,
        from: 'self',
        text: msgText,
        time,
        timestamp: nowTimestamp
      };
      messages.push(message);
    });

    saveChatMessages(activeChat.id, messages);

    // 清空输入框
    setInputText('');
    // 触发重新渲染
    setChatMessagesKey(prev => prev + 1);
    // 滚动到底部
    scrollToBottom();

    console.log('[WeChatApp] 已发送消息（不调用AI）:', messagesToSend);
  };

  // 计算语音时长（根据文本字数，按每分钟180字计算，即3字/秒）
  const calculateVoiceDuration = (text: string): number => {
    const charCount = text.length;
    // 每分钟180字 = 每秒3字
    const duration = Math.ceil(charCount / 3);
    // 最少1秒
    return Math.max(1, duration);
  };

  // 打开语音消息弹窗
  const handleOpenVoiceModal = () => {
    if (!activeChat) return;
    setShowVoiceModal(true);
    setVoiceText('');
  };

  // 发送表情消息（默认表情包 + 未来的自定义表情）
  const handleSendEmojiMessage = (emojiName: string) => {
    if (!activeChat) return;

    const messages = loadChatMessages(activeChat.id);
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    const message: ChatMessage = {
      id: `emoji-${Date.now()}-${Math.random()}`,
      from: 'self',
      // 文本中保留一个可读标记，方便在AI提示词里被理解
      text: `[表情] ${emojiName}`,
      time,
      emojiName
    };

    messages.push(message);
    saveChatMessages(activeChat.id, messages);

    // 关闭表情面板并滚动到底部
    setShowEmojiPanel(false);
    setChatMessagesKey((prev) => prev + 1);
    scrollToBottom();
  };

  // 关闭语音消息弹窗
  const handleCloseVoiceModal = () => {
    setShowVoiceModal(false);
    setVoiceText('');
  };

  // 发送语音消息
  const handleSendVoiceMessage = () => {
    if (!activeChat || !voiceText.trim()) return;

    const textToSend = voiceText.trim();
    const duration = calculateVoiceDuration(textToSend);

    // 保存语音消息
    const messages = loadChatMessages(activeChat.id);
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    const message: ChatMessage = {
      id: `voice-${Date.now()}-${Math.random()}`,
      from: 'self',
      text: textToSend,
      time: time,
      voiceDuration: duration // 标记为语音消息
    };

    messages.push(message);
    saveChatMessages(activeChat.id, messages);

    // 关闭弹窗并清空输入
    handleCloseVoiceModal();

    // 触发重新渲染
    setChatMessagesKey(prev => prev + 1);
    // 滚动到底部
    scrollToBottom();

    console.log('[WeChatApp] 已发送语音消息，时长:', `"${duration}"`, '秒，内容:', textToSend);
  };

  // 调用AI生成回复和剧情（处理已有的未处理消息）
  const handleSendWithAI = () => {
    if (!activeChat || !hasUnprocessedMessages || isSending) return;

    // 获取所有未处理的玩家消息（最后一条玩家消息及其之后的所有玩家消息）
    const messages = loadChatMessages(activeChat.id);
    const unprocessedMessages: string[] = [];

    // 找到最后一条玩家消息的位置
    let lastPlayerMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].from === 'self') {
        lastPlayerMessageIndex = i;
        break;
      }
    }

    if (lastPlayerMessageIndex === -1) return; // 没有玩家消息

    // 检查最后一条玩家消息之后是否有AI回复
    let hasAIReplyAfter = false;
    for (let i = lastPlayerMessageIndex + 1; i < messages.length; i++) {
      if (messages[i].from === 'other') {
        hasAIReplyAfter = true;
        break;
      }
    }

    if (hasAIReplyAfter) return; // 已经有AI回复了

    // 收集所有未处理的玩家消息（从最后一条玩家消息往前，直到遇到AI回复）
    for (let i = lastPlayerMessageIndex; i >= 0; i--) {
      if (messages[i].from === 'self') {
        unprocessedMessages.unshift(messages[i].text);
      } else if (messages[i].from === 'other') {
        break; // 遇到AI回复，停止收集
      }
    }

    if (unprocessedMessages.length === 0) return;

    // 计算最后一条玩家消息与当前的时间差，用于控制“延迟回复”的阈值
    const lastPlayerMessage = messages[lastPlayerMessageIndex];
    const lastPlayerTimestamp = lastPlayerMessage.timestamp;
    // 角色看见并回复消息的时间阈值（例如 3 分钟）；在这段时间内视为“角色忙/不方便”，只积累玩家消息，不立刻回复
    const AI_REPLY_DELAY_MS = 3 * 60 * 1000;

    const triggerAIReply = () => {
      console.log('[WeChatApp] 开始生成AI回复和剧情，处理消息:', unprocessedMessages);

      // 异步生成AI回复和剧情
      setIsSending(true);

      // 获取角色信息
      const contacts = loadWeChatContacts();
      const chatRoleId = (activeChat as any).roleId;
      if (!chatRoleId) {
        setIsSending(false);
        return;
      }

      const contact = contacts.find(c => c.roleId === chatRoleId);
      if (!contact) {
        setIsSending(false);
        return;
      }

      const roles = loadStoryRoles();
      const role = roles.find(r => r.id === chatRoleId);
      // 聊天ID 单独缓存，保证即使玩家离开当前会话，回复仍然写入同一个聊天
      const chatId = activeChat.id;

      if (role) {
        // 角色开始正式回复时，认为“忙碌状态”已结束，关闭提示
        setBusyInfo(null);
        // 先生成微信回复，然后将回复内容传递给剧情生成，确保一致性
        generateWeChatReply(unprocessedMessages, role)
          .then(async ({ replies, noReplyReason, busyMinutes }) => {
            let allReplyTexts = '';

            if (typeof busyMinutes === 'number' && busyMinutes > 0 && (!replies || replies.length === 0)) {
              // 模型判断角色此刻在忙：不发送微信消息，仅弹出“对方在忙”提示，并根据模型给出的分钟数计算预计结束时间
              const roleDisplayName = role.wechatNickname || role.name;
              const busyUntil = Date.now() + busyMinutes * 60 * 1000;
              setBusyInfo({
                roleName: roleDisplayName,
                untilTimestamp: busyUntil
              });
              console.log(
                '[WeChatApp] 本轮为忙碌状态，不发送微信消息，仅提示玩家忙碌，预计分钟数:',
                busyMinutes
              );
              allReplyTexts = ''; // 剧情侧可以根据没有微信回复自行处理
            } else if (noReplyReason && (!replies || replies.length === 0)) {
              // 模型根据人设选择已读不回：不添加任何新消息，只弹出提示
              const roleDisplayName = role.wechatNickname || role.name;
              setNoReplyInfo({
                roleName: roleDisplayName,
                reason: noReplyReason
              });
              console.log('[WeChatApp] 本轮为已读不回，不发送微信消息，仅提示玩家:', noReplyReason);
              allReplyTexts = ''; // 剧情侧可以根据没有微信回复自行处理
            } else {
              // 正常有回复的情况，逐条添加AI回复
              allReplyTexts = replies.map(r => r.text).join('；');

              const replyTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

              for (let i = 0; i < replies.length; i++) {
                const reply = replies[i];
                const nowTimestamp = Date.now();
                const replyMessage: ChatMessage = {
                  id: `reply-${nowTimestamp}-${i}-${Math.random()}`,
                  from: 'other',
                  text: reply.text,
                  time: replyTime,
                  timestamp: nowTimestamp,
                  ...(reply.isVoice && reply.voiceDuration ? { voiceDuration: reply.voiceDuration } : {}),
                  ...(reply.emojiName ? { emojiName: reply.emojiName } : {})
                };

                // 加载当前消息列表并添加新消息（始终写入最初的那个会话）
                const currentMessages = loadChatMessages(chatId);
                currentMessages.push(replyMessage);
                saveChatMessages(chatId, currentMessages);

                // 触发重新渲染
                setChatMessagesKey(prev => prev + 1);

                // 如果玩家此时仍停留在该会话，再滚动到底部
                if (activeChat && activeChat.id === chatId) {
                  scrollToBottom();
                }

                console.log(`[WeChatApp] 已显示第${i + 1}条AI回复:`, reply.text, reply.isVoice ? `(语音消息 ${reply.voiceDuration}秒)` : '');

                // 如果不是最后一条，等待一段时间再显示下一条（模拟真实聊天）
                if (i < replies.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200)); // 0.8-2秒随机延迟
                }
              }

              console.log('[WeChatApp] 所有AI回复已显示完成');

              // 一轮 AI 回复完成后，根据设置尝试自动生成一条新的聊天记忆
              maybeAutoCreateChatMemory(chatId, role);
            }

            // 微信回复完成后，生成剧情内容，并将回复内容传递给剧情生成，确保一致性
            (async () => {
              try {
                console.log('[WeChatApp] 开始生成剧情内容，使用微信回复内容:', allReplyTexts);
                await generateStoryContent(unprocessedMessages, chatRoleId, allReplyTexts);
                console.log('[WeChatApp] 剧情生成事件已触发');
              } catch (err) {
                console.error('[WeChatApp] 生成剧情失败:', err);
              }
            })();
          })
          .catch((err) => {
            console.error('[WeChatApp] 生成AI回复失败:', err);
            const msg = (err as Error).message || '';
            // 未配置 / 鉴权错误 / 其他接口异常，都提示玩家检查 API 设置
            if (
              msg === 'NO_API_CONFIG' ||
              msg.includes('接口返回状态') ||
              msg.toLowerCase().includes('fetch') ||
              msg.toLowerCase().includes('network')
            ) {
              setShowApiConfigModal(true);
            }
          })
          .finally(() => {
            setIsSending(false);
          });
      }
    };

    // 如果有时间戳且距离现在小于阈值，则延迟到达阈值后再统一回复（仅用于“聚合多条玩家消息”，不再负责弹出忙碌提示）
    if (lastPlayerTimestamp && Date.now() - lastPlayerTimestamp < AI_REPLY_DELAY_MS) {
      const remaining = AI_REPLY_DELAY_MS - (Date.now() - lastPlayerTimestamp);
      console.log('[WeChatApp] 距离AI回复阈值还有毫秒数:', remaining);

      // 如果还没有挂起的定时器，则在阈值到达后统一触发一次 AI 回复（防抖）
      if (!aiReplyTimeoutRef.current) {
        aiReplyTimeoutRef.current = window.setTimeout(() => {
          aiReplyTimeoutRef.current = null;
          triggerAIReply();
        }, remaining);
      }

      return;
    }

    // 否则立即生成回复
    triggerAIReply();
  };

  // 重新生成本轮角色回复：删除最近一段AI回复，并基于对应玩家消息重新生成
  const handleRegenerateLastReply = () => {
    if (!activeChat || isSending) return;
    if (!('roleId' in activeChat)) return;

    const chatId = activeChat.id;
    const allMessages = loadChatMessages(chatId);
    if (allMessages.length === 0) return;

    // 从后往前找到最后一段玩家消息 + 紧随其后的AI回复块
    let lastPlayerIndex = -1;
    for (let i = allMessages.length - 1; i >= 0; i--) {
      if (allMessages[i].from === 'self') {
        lastPlayerIndex = i;
        break;
      }
    }
    if (lastPlayerIndex === -1) return;

    // 找到该玩家消息之后的第一条AI回复
    let firstAIIndex = -1;
    for (let i = lastPlayerIndex + 1; i < allMessages.length; i++) {
      if (allMessages[i].from === 'other') {
        firstAIIndex = i;
        break;
      }
    }
    if (firstAIIndex === -1) {
      // 还没有AI回复，相当于未处理消息，直接走正常生成流程
      handleSendWithAI();
      return;
    }

    // 收集参与本轮对话的玩家消息：从最后一个玩家消息往前，直到遇到上一条AI回复
    const playerMessages: string[] = [];
    for (let i = lastPlayerIndex; i >= 0; i--) {
      if (allMessages[i].from === 'self') {
        playerMessages.unshift(allMessages[i].text);
      } else if (allMessages[i].from === 'other') {
        break;
      }
    }
    if (playerMessages.length === 0) return;

    // 删除旧的这段AI回复
    const keptMessages = allMessages.slice(0, firstAIIndex);
    saveChatMessages(chatId, keptMessages);
    setChatMessagesKey((prev) => prev + 1);

    // 调用AI重新生成本轮回复
    const contacts = loadWeChatContacts();
    const chatRoleId = (activeChat as any).roleId;
    const contact = contacts.find((c) => c.roleId === chatRoleId);
    if (!contact) return;
    const roles = loadStoryRoles();
    const role = roles.find((r) => r.id === chatRoleId);
    if (!role) return;

    console.log('[WeChatApp] 开始重新生成本轮AI回复，基于玩家消息:', playerMessages);
    setIsSending(true);

    generateWeChatReply(playerMessages, role)
      .then(async ({ replies, noReplyReason, busyMinutes }) => {
        let allReplyTexts = '';

        if (typeof busyMinutes === 'number' && busyMinutes > 0 && (!replies || replies.length === 0)) {
          const roleDisplayName = role.wechatNickname || role.name;
          const busyUntil = Date.now() + busyMinutes * 60 * 1000;
          setBusyInfo({
            roleName: roleDisplayName,
            untilTimestamp: busyUntil
          });
          console.log(
            '[WeChatApp] 本轮为忙碌状态（重新生成），不发送微信消息，只提示玩家忙碌，预计分钟数:',
            busyMinutes
          );
          allReplyTexts = '';
        } else if (noReplyReason && (!replies || replies.length === 0)) {
          const roleDisplayName = role.wechatNickname || role.name;
          setNoReplyInfo({
            roleName: roleDisplayName,
            reason: noReplyReason
          });
          console.log('[WeChatApp] 本轮为已读不回（重新生成），不发送微信消息，只提示玩家:', noReplyReason);
          allReplyTexts = '';
        } else {
          allReplyTexts = replies.map((r) => r.text).join('；');

          const replyTime = new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          });

          for (let i = 0; i < replies.length; i++) {
            const reply = replies[i];
            const replyMessage: ChatMessage = {
              id: `reply-regenerate-${Date.now()}-${i}-${Math.random()}`,
              from: 'other',
              text: reply.text,
              time: replyTime,
              ...(reply.isVoice && reply.voiceDuration ? { voiceDuration: reply.voiceDuration } : {})
            };

            const currentMessages = loadChatMessages(chatId);
            currentMessages.push(replyMessage);
            saveChatMessages(chatId, currentMessages);

            setChatMessagesKey((prev) => prev + 1);

            if (activeChat && activeChat.id === chatId) {
              scrollToBottom();
            }

            if (i < replies.length - 1) {
              // 重新生成时可以略微加快节奏，但仍保留一点延迟感
              // eslint-disable-next-line no-await-in-loop
              await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 800));
            }
          }
        }

        // 重新生成后，同步触发剧情生成以保持一致
        (async () => {
          try {
            console.log('[WeChatApp] 重新生成后，开始同步剧情内容，使用微信回复内容:', allReplyTexts);
            await generateStoryContent(playerMessages, chatRoleId, allReplyTexts);
            console.log('[WeChatApp] 剧情重新生成事件已触发');
          } catch (err) {
            console.error('[WeChatApp] 重新生成剧情失败:', err);
          }
        })();
      })
      .catch((err) => {
        console.error('[WeChatApp] 重新生成AI回复失败:', err);
        const msg = (err as Error).message || '';
        if (
          msg === 'NO_API_CONFIG' ||
          msg.includes('接口返回状态') ||
          msg.toLowerCase().includes('fetch') ||
          msg.toLowerCase().includes('network')
        ) {
          setShowApiConfigModal(true);
        }
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  const handleBack = () => {
    if (showCreateRole) {
      // 从创建角色页面返回到通讯录
      setShowCreateRole(false);
      setCreateRoleName('');
      setCreateRoleGender('');
      setCreateRoleAge('');
      setCreateRoleAvatarUrl('');
      setCreateRoleOpening('');
      setCreateRoleOpeningKeyword('');
      setCreateRoleWorldbooks([]);
      setCreateRoleOpenWorldbookIds([]);
      setCreateRoleOpenEntryIds([]);
      setCreateRoleMessage(null);
      return;
    }
    if (activeTab === 'chat' && activeChat) {
      setActiveChatId(null);
      return;
    }
    if (activeTab === 'discover' && discoverView === 'moments') {
      setDiscoverView('list');
      setShowMomentsTitle(false);
      return;
    }
    if (activeTab === 'story' && storyHeaderActions.showBack && storyHeaderActions.onBack) {
      storyHeaderActions.onBack();
      return;
    }
    if (onExit) {
      onExit();
    }
  };


  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (tab !== 'chat') {
      setActiveChatId(null);
    }
    if (tab === 'contacts') {
      // 切到通讯录时，始终回到列表视图，而不是停留在上一次的资料卡
      setContactsView('list');
      setContactsProfileRoleId(null);
    }
    if (tab !== 'discover') {
      setDiscoverView('list');
      setShowMomentsTitle(false);
    }
    if (tab !== 'story') {
      // 切换到其他tab时，重置故事标题和头部操作
      setStoryTitle('线下故事');
      setStoryHeaderActions({});
    }
  };

  // 创建角色相关的处理函数（从StoryApp复制）
  const handleAddWorldbook = () => {
    const id = createId();
    const firstEntryId = createId();
    setCreateRoleWorldbooks((prev) => [
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
    setCreateRoleOpenWorldbookIds((prev) => [...prev, id]);
    setCreateRoleOpenEntryIds((prev) => [...prev, firstEntryId]);
  };

  const handleWorldbookNameChange = (id: string, value: string) => {
    setCreateRoleWorldbooks((prev) =>
      prev.map((wb) => (wb.id === id ? { ...wb, name: value } : wb))
    );
  };

  const handleAddEntry = (wbId: string) => {
    const newId = createId();
    setCreateRoleWorldbooks((prev) =>
      prev.map((wb) =>
        wb.id === wbId
          ? {
            ...wb,
            entries: [
              ...wb.entries,
              { id: newId, title: '', content: '', keyword: '' }
            ]
          }
          : wb
      )
    );
    setCreateRoleOpenEntryIds((prev) => [...prev, newId]);
  };

  const handleEntryChange = (
    wbId: string,
    entryId: string,
    field: 'title' | 'content' | 'keyword',
    value: string
  ) => {
    setCreateRoleWorldbooks((prev) =>
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
      setCreateRoleMessage('请先在该条目的关键词中输入一些提示词');
      return;
    }

    const cfg = loadApiConfig();
    const roleName = createRoleName.trim() || '该角色';
    const genderLabel =
      createRoleGender === 'male' ? '男' : createRoleGender === 'female' ? '女' : createRoleGender === 'other' ? '其他' : '未指定';
    const ageLabel = createRoleAge.trim() ? `${createRoleAge.trim()} 岁` : '年龄未填写';

    const existingContext = createRoleWorldbooks
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
      setCreateRoleMessage('请先在 API 设置中配置好接口地址和模型');
      return;
    }

    setCreateRoleMessage('正在根据关键词生成世界书内容…');
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
                '你是一个帮助玩家补充世界观与角色设定的助手。写作要求：1）用非常口语化、白话的中文来描述设定；2）不要写抒情句子、比喻和华丽修辞，只写干脆清晰的设定内容；3）长度适中，1～3段即可，每段2～3句；4）尽量用短句，直接说清楚「发生了什么」「现在是什么状态」「有哪些限制或规则」。生成内容时直接使用给出的角色姓名来指代，不要使用"这个角色"之类的模糊称呼；5）必须和后面提供的该角色其他世界书条目保持设定一致，避免出现前后矛盾或 OOC，如有冲突优先尊重已有条目。'
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

      setCreateRoleWorldbooks((prev) =>
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
      setCreateRoleMessage('已根据关键词生成补充内容，可继续手动修改');
    } catch (err) {
      setCreateRoleMessage(`生成失败：${(err as Error).message}`);
    }
  };

  // 玩家身份编辑（创建角色时使用）
  const handlePlayerIdentityFieldChange = (field: keyof PlayerIdentity, value: string) => {
    setPlayerIdentityForCreate((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateRoleNextStep = () => {
    const identity = loadPlayerIdentity();
    setPlayerIdentityForCreate(identity);
    setPlayerIdentityOpenWorldbookIds((identity.worldbooks ?? []).map((wb: any) => wb.id));
    setPlayerIdentityOpenEntryIds(
      (identity.worldbooks ?? []).flatMap((wb: any) => (wb.entries ?? []).map((e: any) => e.id))
    );
    setCreateRoleStep('identity');
  };

  const handleSaveIdentityAndCreateRole = async () => {
    const trimmed: PlayerIdentity = {
      name: playerIdentityForCreate.name.trim(),
      gender: playerIdentityForCreate.gender,
      intro: playerIdentityForCreate.intro.trim(),
      tags: playerIdentityForCreate.tags?.trim?.() || '',
      worldbooks: playerIdentityForCreate.worldbooks ?? [],
      phoneNumber: playerIdentityForCreate.phoneNumber?.trim() || undefined,
      wechatId: playerIdentityForCreate.wechatId?.trim() || undefined,
      wechatNickname: playerIdentityForCreate.wechatNickname ?? playerIdentityForCreate.name.trim()
    };
    // 保存为全局默认玩家身份（供后续新角色或线下剧情复用）
    savePlayerIdentity(trimmed);
    setPlayerIdentityForCreate(trimmed);
    // 保存身份后真正创建角色（在创建角色时，会将当前身份快照绑定到该角色下）
    await handleSaveCreateRole();
  };

  const handleAvatarFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCreateRoleAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // 生成微信资料（昵称 / 签名 / 微信号 / 地区）
  const generateWeChatProfile = async (role: StoryRole): Promise<{ nickname?: string; signature?: string; wechatId?: string; region?: string }> => {
    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      setShowApiConfigModal(true);
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

      // 获取角色世界书摘要（供 AI 判断人设和可能的地区/生活圈）
      const worldbookSummary = role.worldbooks?.slice(0, 3).map(wb => {
        const entries = (wb.entries ?? []).slice(0, 4).map((e: any) => {
          const title = e.title || '';
          const content = (e.content || '').slice(0, 40);
          return content ? `${title}：${content}` : title;
        }).filter(Boolean).join('；') || '';
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
              content:
                '你是一个帮助生成微信个人资料的助手。现在需要你根据角色信息，生成符合人设的微信昵称、个性签名、微信号以及展示用的地区。\n' +
                '要求：\n' +
                '1）微信昵称：简洁有个性，符合角色性格，长度 2～8 个汉字；绝对不要直接使用角色真实姓名，要创造一个贴合人设的昵称。\n' +
                '2）个性签名：简短、有特色，体现角色的性格或态度，长度不超过 20 个汉字。\n' +
                '3）微信号(wechatId)：格式自然真实，尽量像真实玩家常用的号，例如 "wxid_xxx"、拼音+数字等；不要包含空格和中文，不要太长；要尽量和角色人设、昵称有点关联。\n' +
                '4）地区(region)：从提供的世界书和设定里，推理出一个最贴合人设的常驻城市/地区，例如 "北京 海淀"、"重庆 巴南"、"上海 浦东"；如果设定里完全没有地区线索，可以根据角色氛围合理猜一个，但不要太冷门。\n' +
                '5）直接输出 JSON 格式：{"nickname": "微信昵称", "signature": "个性签名", "wechatId": "微信号", "region": "地区"}，不要添加任何其他说明，不要使用 markdown 代码块。'
            },
            {
              role: 'user',
              content:
                `角色姓名：${role.name}，性别：${genderLabel}，年龄：${ageLabel}。` +
                `${worldbookSummary ? `以下是部分世界书/设定摘要，用于参考角色背景和生活环境：${worldbookSummary}。` : ''}` +
                '请根据这些信息，生成符合以上要求的微信昵称、个性签名、微信号和地区，并按照要求的 JSON 格式返回。'
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
      let parsed: { nickname?: string; signature?: string; wechatId?: string; region?: string } = {};
      try {
        // 移除可能的markdown代码块标记
        text = text.replace(/^```json\n?/g, '').replace(/^```\n?/g, '').replace(/\n?```$/g, '').trim();
        parsed = JSON.parse(text);
      } catch {
        // 如果解析失败，尝试提取昵称/签名/微信号/地区（支持多种格式）
        const nicknameMatch = text.match(/["']nickname["']\s*:\s*["']([^"']+)["']/) ||
          text.match(/nickname["']?\s*[:：]\s*["']?([^"',\n}]+)/);
        const signatureMatch = text.match(/["']signature["']\s*:\s*["']([^"']+)["']/) ||
          text.match(/signature["']?\s*[:：]\s*["']?([^"',\n}]+)/);
        const wechatIdMatch = text.match(/["']wechatId["']\s*:\s*["']([^"']+)["']/) ||
          text.match(/wechatId["']?\s*[:：]\s*["']?([^"',\n}]+)/i);
        const regionMatch = text.match(/["']region["']\s*:\s*["']([^"']+)["']/) ||
          text.match(/region["']?\s*[:：]\s*["']?([^"',\n}]+)/i);
        if (nicknameMatch) parsed.nickname = nicknameMatch[1].trim();
        if (signatureMatch) parsed.signature = signatureMatch[1].trim();
        if (wechatIdMatch) parsed.wechatId = wechatIdMatch[1].trim();
        if (regionMatch) parsed.region = regionMatch[1].trim();
      }

      return parsed;
    } catch (err) {
      console.error('生成微信资料失败:', err);
      // 无论是未配置还是鉴权/网络错误，都弹出一次 API 配置提示，方便玩家排查
      setShowApiConfigModal(true);
      return {};
    }
  };

  const handleGenerateOpening = async () => {
    if (!createRoleName.trim()) {
      setCreateRoleMessage('请先填写角色姓名，再为开场白补全关键词');
      return;
    }
    const cfg = loadApiConfig();
    if (!cfg.baseUrl || !cfg.model) {
      setCreateRoleMessage('请先在 API 设置中配置好接口地址和模型');
      return;
    }

    const roleName = createRoleName.trim();
    const genderLabel =
      createRoleGender === 'male' ? '男' : createRoleGender === 'female' ? '女' : createRoleGender === 'other' ? '其他' : '未指定';
    const ageLabel = createRoleAge.trim() ? `${createRoleAge.trim()} 岁` : '年龄未填写';
    const kw = createRoleOpeningKeyword.trim();

    // 构建世界书内容摘要
    const worldbookContent = createRoleWorldbooks
      .filter(wb => wb.name.trim())
      .map(wb => {
        const wbName = wb.name || '未命名世界书';
        const entries = wb.entries
          .filter(e => e.title.trim() || e.content.trim())
          .map(e => {
            const title = e.title || '未命名条目';
            const content = (e.content || '').slice(0, 100);
            return content ? `- ${title}：${content}` : `- ${title}`;
          })
          .join('\n');
        return entries ? `【${wbName}】\n${entries}` : '';
      })
      .filter(Boolean)
      .join('\n\n');

    setCreateRoleMessage('正在根据关键词生成角色开场白消息…');
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
                '你是一个帮助生成微信聊天开场消息的助手。根据角色信息生成符合人设的微信消息。要求：1）**必须使用第一人称**，就像角色本人在微信上发送消息一样，例如"我"、"我现在"、"我刚"等；2）每条消息要简短自然，像真人聊天一样，控制在10-30字左右；3）生成多条消息，每条消息用换行符分隔，建议生成2-5条消息；4）消息要符合角色的性格、说话方式和用词习惯；5）可以使用语气词、省略号等让消息更自然；emoji 表情尽量少用，能不用就不用，即使用也尽量 0-1 个；6）不要用过于正式或书面化的语言；7）消息要有连贯性，就像角色在主动和对方聊天。'
            },
            {
              role: 'user',
              content: `角色姓名：${roleName}，性别：${genderLabel}，年龄：${ageLabel}。${worldbookContent ? `\n\n【角色设定（世界书）】\n${worldbookContent}\n\n` : ''}${kw ? `关键词提示：${kw}\n\n` : ''}请为这个角色生成几条微信开场消息，要求：1）使用第一人称，就像角色本人在微信上发送消息；2）每条消息一行，用换行符分隔；3）消息要简短自然，符合角色人设；4）根据关键词和角色设定生成合适的内容。`
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

      // 如果生成的内容包含引号或其他标记，尝试清理
      // 移除可能的markdown代码块标记
      text = text.replace(/^```[\w]*\n?/g, '').replace(/\n?```$/g, '').trim();
      // 移除可能的引号包裹
      text = text.replace(/^["'「」『』]|["'「」『』]$/g, '').trim();

      setCreateRoleOpening((prev) => (prev ? `${prev}\n${text}` : text));
      setCreateRoleMessage('角色开场白消息已生成，可继续手动润色');
    } catch (err) {
      setCreateRoleMessage(`生成失败：${(err as Error).message}`);
    }
  };

  // 保存角色（直接添加到微信联系人）
  const handleSaveCreateRole = async () => {
    if (!createRoleName.trim()) {
      setCreateRoleMessage('请先填写角色姓名');
      return;
    }
    const ageNumber = createRoleAge.trim() ? Number(createRoleAge.trim()) : null;
    if (createRoleAge.trim() && (Number.isNaN(ageNumber) || ageNumber! <= 0)) {
      setCreateRoleMessage('角色年龄请输入大于 0 的数字，或留空不填');
      return;
    }
    const roleId = createId();

    const newRole: StoryRole = {
      id: roleId,
      name: createRoleName.trim(),
      gender: createRoleGender,
      age: ageNumber,
      opening: createRoleOpening.trim(),
      avatarUrl: createRoleAvatarUrl.trim(),
      worldbooks: createRoleWorldbooks
    };

    setCreatingRole(true);
    try {
      setCreateRoleMessage('正在生成该角色的微信资料卡…');
      // 生成微信资料卡（昵称/签名）。若 API 未配置会快速返回空对象，不阻塞创建流程。
      const profile = await generateWeChatProfile(newRole);
      const nickname = (profile.nickname ?? '').trim().replace(/^["'「『]|["'」』]$/g, '');
      const signature = (profile.signature ?? '').trim().replace(/^["'「『]|["'」』]$/g, '');
      const wechatIdFromAi = (profile.wechatId ?? '').trim();
      const regionFromAi = (profile.region ?? '').trim();
      if (nickname) newRole.wechatNickname = nickname.slice(0, 12);
      if (signature) newRole.wechatSignature = signature.slice(0, 30);
      if (wechatIdFromAi) newRole.wechatId = wechatIdFromAi.slice(0, 40);
      if (regionFromAi) (newRole as any).region = regionFromAi.slice(0, 40);

      // 保存角色
      const roles = loadStoryRoles();
      roles.push(newRole);
      saveStoryRoles(roles);

      // 将当前填写的玩家身份快照，绑定到该角色专属的玩家身份上（仅影响该角色相关的微信聊天）
      try {
        const identitySnapshot: PlayerIdentity = {
          name: playerIdentityForCreate.name.trim(),
          gender: playerIdentityForCreate.gender,
          intro: playerIdentityForCreate.intro?.trim?.() || '',
          tags: playerIdentityForCreate.tags?.trim?.() || '',
          worldbooks: playerIdentityForCreate.worldbooks ?? [],
          phoneNumber: playerIdentityForCreate.phoneNumber?.trim() || undefined,
          wechatId: playerIdentityForCreate.wechatId?.trim() || undefined,
          wechatNickname: playerIdentityForCreate.wechatNickname ?? playerIdentityForCreate.name.trim()
        };
        savePlayerIdentityForRole(roleId, identitySnapshot);
      } catch {
        // 忽略单个角色身份保存失败，不影响角色创建
      }

      // 直接添加到微信联系人
      const contact: WeChatContact = {
        roleId: roleId,
        remark: undefined,
        tags: undefined,
        permission: 'all',
        addedAt: Date.now()
      };
      saveWeChatContact(contact);

      // 更新聊天列表
      setChats(loadWeChatChats());

      // 更新通讯录列表
      const contacts = loadWeChatContacts();
      const allRoles = loadStoryRoles();
      const grouped: { [key: string]: Array<{ contact: WeChatContact; role: StoryRole }> } = {};

      contacts.forEach(contact => {
        const role = allRoles.find(r => r.id === contact.roleId);
        if (role) {
          const displayName = contact.remark || role.wechatNickname || role.name;
          const firstChar = displayName.charAt(0);
          let letter: string;
          if (/[A-Za-z]/.test(firstChar)) {
            letter = firstChar.toUpperCase();
          } else if (/[\u4e00-\u9fa5]/.test(firstChar)) {
            letter = firstChar;
          } else {
            letter = '#';
          }

          if (!grouped[letter]) {
            grouped[letter] = [];
          }
          grouped[letter].push({ contact, role });
        }
      });

      const sortedList = Object.keys(grouped)
        .sort((a, b) => {
          if (a === '#') return 1;
          if (b === '#') return -1;
          const aIsLetter = /[A-Z]/.test(a);
          const bIsLetter = /[A-Z]/.test(b);
          if (aIsLetter && !bIsLetter) return -1;
          if (!aIsLetter && bIsLetter) return 1;
          return a.localeCompare(b, 'zh-CN');
        })
        .map(letter => ({
          letter,
          contacts: grouped[letter].sort((a, b) => {
            const nameA = a.contact.remark || a.role.wechatNickname || a.role.name;
            const nameB = b.contact.remark || b.role.wechatNickname || b.role.name;
            return nameA.localeCompare(nameB, 'zh-CN');
          })
        }));

      setContactsList(sortedList);

      // 重置表单并跳转到聊天
      setShowCreateRole(false);
      setCreateRoleStep('role');
      setCreateRoleName('');
      setCreateRoleGender('');
      setCreateRoleAge('');
      setCreateRoleAvatarUrl('');
      setCreateRoleOpening('');
      setCreateRoleOpeningKeyword('');
      setCreateRoleWorldbooks([]);
      setCreateRoleOpenWorldbookIds([]);
      setCreateRoleOpenEntryIds([]);
      setCreateRoleMessage(null);
      setActiveTab('chat');
      setActiveChatId(`chat-${roleId}`);
    } finally {
      setCreatingRole(false);
    }
  };

  // 发送好友申请
  const handleSendFriendRequest = () => {
    if (!friendRequestRole) return;

    const request: FriendRequest = {
      id: `request-${Date.now()}-${friendRequestRole.id}`,
      roleId: friendRequestRole.id,
      greeting: friendRequestGreeting.trim() || (() => {
        const identityForRole = loadPlayerIdentityForRole(friendRequestRole.id);
        return `我是${identityForRole.wechatNickname || identityForRole.name || '我'}`;
      })(),
      remark: friendRequestRemark.trim() || undefined,
      tags: friendRequestTags.trim() || undefined,
      permission: friendRequestPermission,
      hideMyMoments: friendRequestPermission === 'all' ? friendRequestHideMyMoments : undefined,
      hideTheirMoments: friendRequestPermission === 'all' ? friendRequestHideTheirMoments : undefined,
      status: 'pending',
      timestamp: Date.now()
    };

    saveFriendRequest(request);

    // 触发自定义事件，通知StoryApp有新好友申请
    // 同时在window和document上触发，确保能被捕获
    const event = new CustomEvent('friend-request-sent', {
      detail: { roleId: friendRequestRole.id, requestId: request.id }
    });
    window.dispatchEvent(event);
    document.dispatchEvent(event);
    console.log('[WeChatApp] 已触发好友申请事件:', { roleId: friendRequestRole.id, requestId: request.id });

    // 关闭申请页面，返回到搜索结果
    setShowFriendRequest(false);
    setFriendRequestRole(null);
    setFriendRequestGreeting('');
    setFriendRequestRemark('');
    setFriendRequestTags('');
    setFriendRequestPermission('all');
    setFriendRequestHideMyMoments(false);
    setFriendRequestHideTheirMoments(false);
    console.log('好友申请已发送，等待角色在剧情模式中做出反应:', request);
  };

  const handleMomentsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const threshold = el.clientHeight / 2;
    setShowMomentsTitle(el.scrollTop > threshold);
  };

  const headerTitle =
    showCreateRole
      ? '创建新角色'
      : activeTab === 'chat'
        ? (isSending && activeChat && 'roleId' in activeChat
          ? '对方正在输入中...'
          : activeChat?.name ?? '微信')
        : activeTab === 'contacts'
          ? contactsView === 'profile'
            ? ''
            : contactsView === 'settings'
              ? '设置'
              : contactsView === 'permission'
                ? '权限'
                : '通讯录'
          : activeTab === 'discover'
            ? discoverView === 'moments'
              ? showMomentsTitle
                ? '朋友圈'
                : ''
              : '发现'
            : activeTab === 'story'
              ? storyTitle
              : activeTab === 'me'
                ? showMeSettings
                  ? (meSettingsView === 'profile'
                    ? '个人资料'
                    : meSettingsView === 'storage'
                      ? '存储空间'
                      : '设置')
                  : '我'
                : '我';

  const isContactsProfile = activeTab === 'contacts' && contactsView === 'profile';
  const isMoments = activeTab === 'discover' && discoverView === 'moments';
  // 联系人资料卡：整体内容（包括返回键）稍微往下移动一些，通过在 header 内增加 paddingTop 来模拟安全区留白
  const headerStyle: React.CSSProperties | undefined = isContactsProfile
    ? { backgroundColor: '#ffffff', borderBottom: 'none', paddingTop: 100 }
    : undefined;

  return (
    <div
      className={`wechat-app ${isMoments || isContactsProfile ? 'wechat-app-overlay' : ''}`}
      style={isContactsProfile ? { backgroundColor: '#ffffff' } : undefined}
    >
      {!showChatSettings && (
        <div
          className={`wechat-header ${isMoments ? 'wechat-header-overlay' : ''}`}
          style={headerStyle}
        >
          <button
            type="button"
            className="wechat-header-back"
            onClick={() => {
              if (activeTab === 'me' && showMeSettings) {
                // 「我」Tab 下设置子页面返回：profile/storage -> 设置列表 -> 我
                if (meSettingsView === 'profile' || meSettingsView === 'storage') {
                  setMeSettingsView('list');
                } else {
                  setShowMeSettings(false);
                }
                return;
              }
              if (activeTab === 'contacts') {
                if (contactsView === 'permission') {
                  // 权限页返回到设置页
                  setContactsView('settings');
                  return;
                }
                if (contactsView === 'settings') {
                  // 设置页返回到资料卡
                  setContactsView('profile');
                  return;
                }
                if (contactsView === 'profile') {
                  // 资料卡返回到通讯录列表
                  setContactsView('list');
                  setContactsProfileRoleId(null);
                  return;
                }
              }
              handleBack();
            }}
            aria-label="返回"
            style={isContactsProfile ? { marginTop: 20 } : undefined}
          />
          <span className="wechat-header-label">{headerTitle}</span>
          <div className="wechat-header-right">
            {isMoments ? (
              <button
                type="button"
                className="wechat-header-plus"
                aria-label="发布朋友圈"
              >
                <svg viewBox="0 0 24 24" width="34" height="34">
                  <rect
                    x="6"
                    y="7"
                    width="12"
                    height="9"
                    rx="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M9 7L10 6H14L15 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="11.5"
                    r="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <circle cx="16" cy="8.5" r="0.6" fill="currentColor" />
                </svg>
              </button>
            ) : activeTab === 'story' && storyHeaderActions.showMore ? (
              <button
                type="button"
                className="wechat-header-plus"
                aria-label="更多"
                onClick={storyHeaderActions.onMore}
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <circle cx="6" cy="12" r="1.4" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.4" fill="currentColor" />
                  <circle cx="18" cy="12" r="1.4" fill="currentColor" />
                </svg>
              </button>
            ) : activeTab === 'chat' && activeChat ? (
              <button
                type="button"
                className="wechat-header-plus"
                aria-label="更多"
                onClick={() => {
                  // 打开当前聊天的“聊天详情”设置页
                  setShowContactProfile(false);
                  const settings = loadChatSettings(activeChat.id);
                  setCurrentChatSettings(settings);
                  setShowChatSettings(true);
                }}
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <circle cx="6" cy="12" r="1.4" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.4" fill="currentColor" />
                  <circle cx="18" cy="12" r="1.4" fill="currentColor" />
                </svg>
              </button>
            ) : activeTab === 'contacts' ? (
              contactsView === 'profile' ? (
                // 资料卡右上角三个点
                <button
                  type="button"
                  className="wechat-header-plus"
                  aria-label="更多"
                  onClick={() => setContactsView('settings')}
                  style={{ marginTop: 40 }}
                >
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <circle cx="6" cy="12" r="1.4" fill="currentColor" />
                    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
                    <circle cx="18" cy="12" r="1.4" fill="currentColor" />
                  </svg>
                </button>
              ) : contactsView === 'list' && !showCreateRole ? (
                // 通讯录列表右上角加号
                <button
                  type="button"
                  className="wechat-header-plus"
                  aria-label="添加"
                  onClick={() => {
                    setCreateRoleStep('role');
                    setPlayerIdentityForCreate(loadPlayerIdentity());
                    setShowCreateRole(true);
                  }}
                >
                  <svg viewBox="0 0 24 24" width="28" height="28">
                    <circle
                      cx="12"
                      cy="12"
                      r="8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M12 8V16"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M8 12H16"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              ) : null
            ) : null}
          </div>
        </div>
      )}

      {showCreateRole ? (
        <div className="story-app" style={{ height: '100%', overflow: 'auto', paddingBottom: '110px' }}>
          <div className="story-form">
            {createRoleStep === 'identity' && (
              <div className="story-form-header-row">
                <div className="story-form-header">玩家个人身份</div>
              </div>
            )}

            {createRoleStep === 'role' ? (
              <>
                <div className="story-row">
                  <label className="story-label">角色头像</label>
                  <div className="story-avatar-row">
                    <div className="story-avatar-preview">
                      {createRoleAvatarUrl ? <img src={createRoleAvatarUrl} alt="avatar" /> : <span>预览</span>}
                    </div>
                    <div className="story-avatar-actions">
                      <input
                        type="file"
                        accept="image/*"
                        ref={createRoleAvatarFileInputRef}
                        onChange={(e) => handleAvatarFile(e.target.files?.[0] ?? null)}
                      />
                      <input
                        className="story-input"
                        placeholder="或粘贴一张头像图片的 URL"
                        value={createRoleAvatarUrl}
                        onChange={(e) => setCreateRoleAvatarUrl(e.target.value)}
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
                      value={createRoleName}
                      onChange={(e) => setCreateRoleName(e.target.value)}
                    />
                    <button
                      type="button"
                      className="story-name-dice"
                      onClick={() => {
                        setCreateRoleName(generateRandomMaleName());
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
                    value={createRoleAge}
                    onChange={(e) => setCreateRoleAge(e.target.value)}
                  />
                </div>

                <div className="story-row">
                  <label className="story-label">角色开场白</label>
                  <div className="story-entry-ai-row">
                    <input
                      className="story-entry-ai-input"
                      placeholder="输入关键词，例如：开篇场景 / 时间节点 / 事件线索"
                      value={createRoleOpeningKeyword}
                      onChange={(e) => setCreateRoleOpeningKeyword(e.target.value)}
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
                    placeholder="例如：&#10;我刚刚到公司&#10;今天天气真好&#10;你在干嘛呢？&#10;&#10;（每行代表一条消息，角色会以第一人称发送这些消息作为开场白）"
                    value={createRoleOpening}
                    onChange={(e) => setCreateRoleOpening(e.target.value)}
                  />
                </div>

                <div className="story-row">
                  <label className="story-label">角色性别</label>
                  <div className="story-gender-row">
                    <button
                      type="button"
                      className={`story-gender-btn ${createRoleGender === 'male' ? 'active' : ''}`}
                      onClick={() => setCreateRoleGender('male')}
                    >
                      男
                    </button>
                    <button
                      type="button"
                      className={`story-gender-btn ${createRoleGender === 'female' ? 'active' : ''}`}
                      onClick={() => setCreateRoleGender('female')}
                    >
                      女
                    </button>
                    <button
                      type="button"
                      className={`story-gender-btn ${createRoleGender === 'other' ? 'active' : ''}`}
                      onClick={() => setCreateRoleGender('other')}
                    >
                      其他
                    </button>
                  </div>
                </div>

                <div className="story-row">
                  <label className="story-label">世界书配置</label>
                  <p className="story-tip">
                    世界书可以理解为「角色所处世界观 / 设定合集」，一个角色可以有多个世界书，每个世界书下又可以有多个条目。
                  </p>

                  {createRoleWorldbooks.map((wb) => {
                    const wbOpen = createRoleOpenWorldbookIds.includes(wb.id);
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
                                setCreateRoleOpenWorldbookIds((prev) =>
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
                                setCreateRoleWorldbooks((prev) => prev.filter((x) => x.id !== wb.id));
                                setCreateRoleOpenWorldbookIds((prev) => prev.filter((id) => id !== wb.id));
                              }}
                            >
                              删除
                            </button>
                          </div>
                        </div>
                        {wbOpen && (
                          <>
                            {wb.entries.map((entry) => {
                              const entryOpen = createRoleOpenEntryIds.includes(entry.id);
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
                                          setCreateRoleOpenEntryIds((prev) =>
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
                                          setCreateRoleWorldbooks((prev) =>
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
                    onClick={handleCreateRoleNextStep}
                    disabled={creatingRole}
                  >
                    下一步：填写玩家身份
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="story-row">
                  <label className="story-label">玩家姓名</label>
                  <input
                    className="story-input"
                    placeholder="例如：李明"
                    value={playerIdentityForCreate.name}
                    onChange={(e) => handlePlayerIdentityFieldChange('name', e.target.value)}
                  />
                </div>

                <div className="story-row">
                  <label className="story-label">玩家性别（可选）</label>
                  <div className="story-gender-row">
                    <button
                      type="button"
                      className={`story-gender-btn ${playerIdentityForCreate.gender === 'male' ? 'active' : ''}`}
                      onClick={() => handlePlayerIdentityFieldChange('gender', 'male')}
                    >
                      男
                    </button>
                    <button
                      type="button"
                      className={`story-gender-btn ${playerIdentityForCreate.gender === 'female' ? 'active' : ''}`}
                      onClick={() => handlePlayerIdentityFieldChange('gender', 'female')}
                    >
                      女
                    </button>
                    <button
                      type="button"
                      className={`story-gender-btn ${playerIdentityForCreate.gender === 'other' ? 'active' : ''}`}
                      onClick={() => handlePlayerIdentityFieldChange('gender', 'other')}
                    >
                      其他 / 保密
                    </button>
                  </div>
                </div>

                <div className="story-row">
                  <label className="story-label">一句话自我介绍</label>
                  <input
                    className="story-input"
                    placeholder="例如：喜欢在深夜写故事的上班族玩家"
                    value={playerIdentityForCreate.intro}
                    onChange={(e) => handlePlayerIdentityFieldChange('intro', e.target.value)}
                  />
                </div>

                {/* 玩家世界书配置（精简版，只展示和 StoryApp 同结构的玩家世界书） */}
                <div className="story-row">
                  <label className="story-label">玩家世界书配置</label>
                  <p className="story-tip">
                    玩家世界书可以理解为「玩家个人设定 / 身份信息合集」，可以设置多个世界书，每个世界书下又可以有多个条目。
                  </p>

                  {(playerIdentityForCreate.worldbooks ?? []).map((wb: any) => {
                    const wbOpen = playerIdentityOpenWorldbookIds.includes(wb.id);
                    return (
                      <div key={wb.id} className="story-worldbook-card">
                        <div className="story-worldbook-header">
                          <input
                            className="story-input"
                            placeholder="世界书名称，例如：个人背景 / 工作生活 / 兴趣爱好"
                            value={wb.name}
                            onChange={(e) => {
                              const name = e.target.value;
                              setPlayerIdentityForCreate((prev) => ({
                                ...prev,
                                worldbooks: (prev.worldbooks ?? []).map((x: any) =>
                                  x.id === wb.id ? { ...x, name } : x
                                )
                              }));
                            }}
                          />
                          <div className="story-worldbook-header-actions">
                            <button
                              type="button"
                              className="story-mini-btn"
                              onClick={() =>
                                setPlayerIdentityOpenWorldbookIds((prev) =>
                                  prev.includes(wb.id)
                                    ? prev.filter((id) => id !== wb.id)
                                    : [...prev, wb.id]
                                )
                              }
                            >
                              {wbOpen ? '收起' : '展开'}
                            </button>
                          </div>
                        </div>
                        {wbOpen && (
                          <>
                            {(wb.entries ?? []).map((entry: any) => {
                              const entryOpen = playerIdentityOpenEntryIds.includes(entry.id);
                              return (
                                <div key={entry.id} className="story-entry">
                                  <div className="story-entry-header">
                                    <input
                                      className="story-input"
                                      placeholder="条目标题，例如：个人背景 / 家庭关系 / 工作经历"
                                      value={entry.title}
                                      onChange={(e) => {
                                        const title = e.target.value;
                                        setPlayerIdentityForCreate((prev) => ({
                                          ...prev,
                                          worldbooks: (prev.worldbooks ?? []).map((wb2: any) =>
                                            wb2.id === wb.id
                                              ? {
                                                ...wb2,
                                                entries: (wb2.entries ?? []).map((e2: any) =>
                                                  e2.id === entry.id ? { ...e2, title } : e2
                                                )
                                              }
                                              : wb2
                                          )
                                        }));
                                      }}
                                    />
                                    <div className="story-entry-header-actions">
                                      <button
                                        type="button"
                                        className="story-mini-btn"
                                        onClick={() =>
                                          setPlayerIdentityOpenEntryIds((prev) =>
                                            prev.includes(entry.id)
                                              ? prev.filter((id) => id !== entry.id)
                                              : [...prev, entry.id]
                                          )
                                        }
                                      >
                                        {entryOpen ? '收起' : '展开'}
                                      </button>
                                    </div>
                                  </div>
                                  {entryOpen && (
                                    <textarea
                                      className="story-textarea"
                                      placeholder="条目具体设定，例如：个人背景、性格特点、关键经历等"
                                      value={entry.content}
                                      onChange={(e) => {
                                        const content = e.target.value;
                                        setPlayerIdentityForCreate((prev) => ({
                                          ...prev,
                                          worldbooks: (prev.worldbooks ?? []).map((wb2: any) =>
                                            wb2.id === wb.id
                                              ? {
                                                ...wb2,
                                                entries: (wb2.entries ?? []).map((e2: any) =>
                                                  e2.id === entry.id ? { ...e2, content } : e2
                                                )
                                              }
                                              : wb2
                                          )
                                        }));
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    className="story-add-worldbook"
                    onClick={() => {
                      const id = createId();
                      const firstEntryId = createId();
                      const newWb = {
                        id,
                        name: '',
                        entries: [
                          {
                            id: firstEntryId,
                            title: '',
                            content: ''
                          }
                        ]
                      };
                      setPlayerIdentityForCreate((prev) => ({
                        ...prev,
                        worldbooks: [...(prev.worldbooks ?? []), newWb]
                      }));
                      setPlayerIdentityOpenWorldbookIds((prev) => [...prev, id]);
                      setPlayerIdentityOpenEntryIds((prev) => [...prev, firstEntryId]);
                    }}
                  >
                    + 新建玩家世界书
                  </button>
                </div>

                <div className="story-actions">
                  <button
                    type="button"
                    className="story-btn"
                    onClick={() => setCreateRoleStep('role')}
                    disabled={creatingRole}
                  >
                    上一步：返回角色
                  </button>
                  <button
                    type="button"
                    className="story-btn primary"
                    onClick={handleSaveIdentityAndCreateRole}
                    disabled={creatingRole}
                  >
                    {creatingRole ? '正在生成资料卡…' : '完成并创建角色'}
                  </button>
                </div>
              </>
            )}

            {createRoleMessage && <div className="story-message">{createRoleMessage}</div>}
          </div>
        </div>
      ) : activeTab === 'chat' ? (
        activeChat ? (
          <>
            <div
              className="wechat-chat"
              ref={chatContainerRef}
              style={
                showEmojiPanel
                  ? { paddingBottom: 260 }
                  : showChatTools
                    ? { paddingBottom: 180 }
                    : undefined
              }
            >
              {(() => {
                let chatMessages = loadChatMessages(activeChat.id);

                // 在加载时也清理重复的打招呼消息
                const systemMessages = chatMessages.filter(msg => msg.from === 'system');
                if (systemMessages.length > 0) {
                  // 如果有系统消息，清理所有与系统消息greeting相同的self消息
                  systemMessages.forEach(systemMsg => {
                    if (systemMsg.greeting) {
                      chatMessages = chatMessages.filter(msg =>
                        !(msg.from === 'self' && (msg.id.startsWith('greeting-') || msg.text === systemMsg.greeting))
                      );
                    }
                  });
                  // 如果清理了消息，保存回去
                  const originalCount = loadChatMessages(activeChat.id).length;
                  if (chatMessages.length !== originalCount) {
                    saveChatMessages(activeChat.id, chatMessages);
                    console.log('[WeChatApp] 已清理重复的打招呼消息，清理前:', originalCount, '清理后:', chatMessages.length);
                  }
                }

                const allMessages = [...mockMessages, ...chatMessages];

                if (allMessages.length === 0) return null;

                // 按时间分组，系统消息单独处理
                const groupedMessages: Array<{ type: 'time' | 'message' | 'system'; content: any }> = [];
                let lastTime = '';
                let hasTimeHeader = false;

                allMessages.forEach((msg, index) => {
                  if (msg.from === 'system') {
                    groupedMessages.push({ type: 'system', content: msg });
                  } else {
                    // 第一条消息使用真实时间（如果没有，则使用当前系统时间）
                    if (!hasTimeHeader && index === 0) {
                      const firstTime =
                        msg.time ||
                        new Date().toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      groupedMessages.push({ type: 'time', content: firstTime });
                      hasTimeHeader = true;
                    } else if (msg.time !== lastTime && index > 0) {
                      // 后续消息在时间变化时插入新的时间分隔
                      groupedMessages.push({ type: 'time', content: msg.time });
                    }
                    groupedMessages.push({ type: 'message', content: msg });
                    lastTime = msg.time;
                  }
                });

                return (
                  <>
                    {groupedMessages.map((item, index) => {
                      if (item.type === 'time') {
                        return <div key={`time-${index}`} className="wechat-chat-time">{item.content}</div>;
                      }

                      if (item.type === 'system') {
                        const msg = item.content as ChatMessage;
                        return (
                          <div key={msg.id} className="wechat-system-message-wrapper">
                            {msg.greeting && (
                              <div className="wechat-row wechat-row-self">
                                <div className="wechat-bubble wechat-bubble-self">
                                  {msg.greeting}
                                </div>
                                <div className="wechat-avatar wechat-avatar-self">
                                  {playerAvatarUrl ? (
                                    <img src={playerAvatarUrl} alt={playerWechatNickname} />
                                  ) : (
                                    <span>{playerAvatarText}</span>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="wechat-system-message">
                              {msg.text}
                            </div>
                          </div>
                        );
                      }

                      const msg = item.content as ChatMessage;
                      const isExpanded = expandedVoiceId === msg.id;

                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.from === 'self' ? 'flex-end' : 'flex-start',
                            width: '100%'
                          }}
                        >
                          <div
                            className={`wechat-row wechat-row-${msg.from}`}
                            style={{ width: '100%' }}
                          >
                            {msg.from === 'other' && (
                              <div className="wechat-avatar">
                                {activeChat.avatarUrl ? (
                                  <img src={activeChat.avatarUrl} alt={activeChat.name} />
                                ) : (
                                  <span>{activeChat.avatarText}</span>
                                )}
                              </div>
                            )}
                            <div
                              className={`wechat-bubble wechat-bubble-${msg.from} ${msg.emojiName || msg.redPacketAmount ? 'wechat-bubble-no-tail' : ''}`}
                              style={
                                msg.voiceDuration
                                  ? {
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    width: 'fit-content',
                                    maxWidth: '72%'
                                  }
                                  : msg.emojiName
                                    ? {
                                      // 表情消息：去掉气泡样式，只显示图片
                                      background: 'transparent',
                                      padding: 0,
                                      boxShadow: 'none',
                                      borderRadius: 0,
                                      width: 'fit-content',
                                      maxWidth: '72%'
                                    }
                                    : msg.redPacketAmount
                                      ? {
                                        // 红包消息：去掉默认气泡样式，使用自定义卡片
                                        background: 'transparent',
                                        padding: 0,
                                        boxShadow: 'none',
                                        borderRadius: 0,
                                        width: 'fit-content',
                                        maxWidth: '72%'
                                      }
                                      : {
                                        width: 'fit-content',
                                        maxWidth: '72%'
                                      }
                              }
                              onClick={
                                msg.voiceDuration
                                  ? () => {
                                    setExpandedVoiceId(isExpanded ? null : msg.id);
                                  }
                                  : msg.redPacketAmount
                                    ? () => {
                                      setOpeningRedPacketMessage(msg);
                                      setIsRedPacketCoinAnimating(false);
                                      // 自己发出的红包：直接进入详情页，不显示红包弹窗
                                      if ((msg as any).from === 'self') {
                                        setIsRedPacketDetailOpened(true);
                                      } else {
                                        setIsRedPacketDetailOpened(false);
                                      }
                                    }
                                    : undefined
                              }
                            >
                              {msg.voiceDuration ? (
                                // 语音消息样式
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    minWidth: '80px',
                                    padding: '0'
                                  }}
                                >
                                  {/* 玩家侧（self）保持原来的布局：图标在左，秒数在右 */}
                                  {msg.from === 'self' ? (
                                    <>
                                      <svg
                                        viewBox="0 0 24 24"
                                        width="20"
                                        height="20"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        style={{
                                          flexShrink: 0,
                                          transform: 'rotate(-90deg)',
                                          transformOrigin: 'center'
                                        }}
                                      >
                                        {/* WiFi/声波样式 - 2层弧形从底部中心向上扩散 */}
                                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" fill="none" />
                                        <path d="M5 12.55a11 11 0 0 1 14.08 0" fill="none" />
                                        <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2.5" strokeLinecap="round" />
                                      </svg>
                                      <span
                                        style={{
                                          fontSize: '14px',
                                          fontWeight: '400'
                                        }}
                                      >
                                        &quot;{msg.voiceDuration}&quot;
                                      </span>
                                    </>
                                  ) : (
                                    // 角色侧（other）：图标水平翻转并移动到秒数右侧
                                    <>
                                      <span
                                        style={{
                                          fontSize: '14px',
                                          fontWeight: '400'
                                        }}
                                      >
                                        &quot;{msg.voiceDuration}&quot;
                                      </span>
                                      <svg
                                        viewBox="0 0 24 24"
                                        width="20"
                                        height="20"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        style={{
                                          flexShrink: 0,
                                          // 角色侧：图标整体朝右侧扩散
                                          transform: 'rotate(90deg)',
                                          transformOrigin: 'center'
                                        }}
                                      >
                                        {/* WiFi/声波样式 - 2层弧形从底部中心向上扩散 */}
                                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" fill="none" />
                                        <path d="M5 12.55a11 11 0 0 1 14.08 0" fill="none" />
                                        <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2.5" strokeLinecap="round" />
                                      </svg>
                                    </>
                                  )}
                                </div>
                              ) : msg.redPacketAmount ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 230,
                                      borderRadius: 14,
                                      overflow: 'hidden',
                                      background: 'linear-gradient(135deg, #f97316, #ef4444)',
                                      color: '#ffffff',
                                      boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
                                      boxSizing: 'border-box'
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '10px 12px 8px'
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: 36,
                                          height: 48,
                                          borderRadius: 8,
                                          background: 'rgba(0,0,0,0.1)',
                                          marginRight: 10,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                                          <rect
                                            x="5.5"
                                            y="4"
                                            width="13"
                                            height="16"
                                            rx="2"
                                            stroke="#ffffff"
                                            strokeWidth="1.4"
                                          />
                                          <path
                                            d="M6.5 9C8.1 10.1 9.5 10.6 12 10.6C14.5 10.6 15.9 10.1 17.5 9"
                                            stroke="#ffffff"
                                            strokeWidth="1.2"
                                            strokeLinecap="round"
                                          />
                                          <circle cx="12" cy="13.4" r="1.1" fill="#ffffff" />
                                        </svg>
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                          style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            marginBottom: 4,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                          }}
                                        >
                                          {msg.redPacketNote || '恭喜发财，大吉大利'}
                                        </div>
                                      </div>
                                    </div>
                                    <div
                                      style={{
                                        padding: '6px 12px 8px',
                                        borderTop: '1px solid rgba(255,255,255,0.12)',
                                        fontSize: 12,
                                        opacity: 0.92
                                      }}
                                    >
                                      Lumi红包
                                    </div>
                                  </div>
                                </div>
                              ) : msg.emojiName && findEmojiByName(msg.emojiName) ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {/* 默认表情包图片 */}
                                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                  <img
                                    src={findEmojiByName(msg.emojiName)!.src}
                                    style={{
                                      width: 120,
                                      height: 'auto',
                                      borderRadius: 12,
                                      display: 'block'
                                    }}
                                  />
                                </div>
                              ) : (
                                // 普通文本消息
                                msg.text
                              )}
                            </div>
                            {msg.from === 'self' && (
                              <div className="wechat-avatar wechat-avatar-self">
                                {playerAvatarUrl ? (
                                  <img src={playerAvatarUrl} alt={playerWechatNickname} />
                                ) : (
                                  <span>{playerAvatarText}</span>
                                )}
                              </div>
                            )}
                          </div>
                          {/* 展开的语音文字内容 - 显示在气泡下方 */}
                          {msg.voiceDuration && isExpanded && (
                            <div
                              style={{
                                marginTop: '4px',
                                marginBottom: '16px',
                                padding: '10px 12px',
                                backgroundColor: '#ffffff',
                                borderRadius: '8px',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                color: '#000000',
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                                width: 'fit-content',
                                maxWidth: '70%',
                                boxSizing: 'border-box',
                                alignSelf: msg.from === 'self' ? 'flex-end' : 'flex-start',
                                marginLeft: msg.from === 'other' ? '48px' : '0',
                                marginRight: msg.from === 'self' ? '48px' : '0'
                              }}
                            >
                              {msg.text}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>

            {/* 底部功能菜单（加号） */}

            <div
              className="wechat-input-bar"
              style={
                showEmojiPanel
                  ? { transform: 'translateY(-210px)' }
                  : showChatTools
                    ? { transform: 'translateY(-140px)' }
                    : undefined
              }
            >
              <button
                type="button"
                className="wechat-input-voice"
                onClick={handleOpenVoiceModal}
                title="语音消息"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                  marginRight: '8px',
                  padding: 0
                }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#666">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              </button>
              <textarea
                className="wechat-input-main"
                placeholder="发一条消息给 AI..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  // 按Enter键发送消息，Shift+Enter换行
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (inputText.trim() && !isSending) {
                      handleSendMessage();
                    }
                  }
                }}
                rows={1}
                style={{
                  resize: 'none',
                  minHeight: '42px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  lineHeight: '1.5'
                }}
              />
              <button
                type="button"
                className="wechat-input-emoji"
                title="表情"
                onClick={() => {
                  setShowEmojiPanel((prev) => {
                    const next = !prev;
                    if (next) {
                      setTimeout(() => {
                        scrollToBottom();
                      }, 50);
                    }
                    return next;
                  });
                  if (showChatTools) {
                    setShowChatTools(false);
                  }
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                  marginLeft: '8px',
                  marginRight: '8px',
                  padding: 0
                }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#666" strokeWidth="1.6" />
                  <circle cx="9" cy="10" r="0.9" fill="#666" />
                  <circle cx="15" cy="10" r="0.9" fill="#666" />
                  <path
                    d="M8.5 14C9.1 15 10.4 15.7 12 15.7C13.6 15.7 14.9 15 15.5 14"
                    stroke="#666"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="wechat-input-send"
                title="更多功能"
                onClick={() => {
                  setShowChatTools((prev) => {
                    const next = !prev;
                    if (next) {
                      setChatToolsPage(0);
                      setShowEmojiPanel(false);
                      setTimeout(() => {
                        scrollToBottom();
                      }, 50);
                    }
                    return next;
                  });
                }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <circle cx="12" cy="12" r="9" fill="#111827" />
                  <path
                    d="M12 8V16"
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 12H16"
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="wechat-input-send-plane"
                onClick={handleSendWithAI}
                disabled={!hasUnprocessedMessages || isSending}
                title={hasUnprocessedMessages ? "生成AI回复和剧情" : "没有未处理的消息"}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>

            {/* 底部表情面板（表情按钮） */}
            {showEmojiPanel && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 8,
                  padding: '0 8px 4px',
                  boxSizing: 'border-box',
                  pointerEvents: 'none',
                  overflowX: 'hidden'
                }}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '18px 18px 0 0',
                    padding: '10px 8px 6px',
                    boxShadow: 'none',
                    pointerEvents: 'auto',
                    maxHeight: 220,
                    overflowY: 'auto',
                    overflowX: 'hidden'
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                      rowGap: 10,
                      columnGap: 4,
                      paddingBottom: 6
                    }}
                  >
                    {DEFAULT_EMOJIS.map((emoji) => (
                      <button
                        key={emoji.key}
                        type="button"
                        onClick={() => handleSendEmojiMessage(emoji.name)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            paddingTop: '100%',
                            position: 'relative',
                            borderRadius: 16,
                            backgroundColor: '#f5f5f5',
                            overflow: 'hidden'
                          }}
                        >
                          {/* eslint-disable-next-line jsx-a11y/alt-text */}
                          <img
                            src={emoji.src}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 聊天功能菜单（加号展开）：底部两行，4列，支持翻页 */}
            {showChatTools && (
              (() => {
                const tools = [
                  {
                    key: 'photo',
                    label: '照片',
                    onClick: () => {
                      setShowChatTools(false);
                      alert('“照片”功能开发中');
                    },
                    icon: (
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <rect
                          x="4"
                          y="6.5"
                          width="16"
                          height="11"
                          rx="2"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.4"
                        />
                        <path
                          d="M8.5 14L11 11.5L13.8 14.3L15.5 12.5L18 15"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="9" cy="9.5" r="1" fill="#111827" />
                      </svg>
                    )
                  },
                  {
                    key: 'video-call',
                    label: '视频通话',
                    onClick: () => {
                      setShowChatTools(false);
                      setShowCallActionSheet(true);
                    },
                    icon: (
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <rect
                          x="4.5"
                          y="6"
                          width="11"
                          height="12"
                          rx="2"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.4"
                        />
                        <path
                          d="M15.5 9L19 7V17L15.5 15"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="9.5" cy="10" r="0.9" fill="#111827" />
                      </svg>
                    )
                  },
                  {
                    key: 'red-packet',
                    label: '红包',
                    onClick: () => {
                      setShowChatTools(false);
                      if (!activeChat) return;
                      // 重置表单并打开发红包页
                      setRedPacketAmountInput('');
                      setRedPacketNoteInput('');
                      setRedPacketError(null);
                      setShowRedPacketPage(true);
                    },
                    icon: (
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <rect
                          x="6"
                          y="4"
                          width="12"
                          height="16"
                          rx="2"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.4"
                        />
                        <path
                          d="M7 9C9 10.5 10.5 11 12 11C13.5 11 15 10.5 17 9"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                        <circle cx="12" cy="13.2" r="1.1" fill="#111827" />
                      </svg>
                    )
                  },
                  {
                    key: 'transfer',
                    label: '转账',
                    onClick: () => {
                      setShowChatTools(false);
                      alert('“转账”功能开发中');
                    },
                    icon: (
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <rect
                          x="5"
                          y="6"
                          width="14"
                          height="12"
                          rx="2"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.4"
                        />
                        <path
                          d="M8 12H16"
                          stroke="#111827"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M10.5 9.5L8 12L10.5 14.5"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )
                  },
                  {
                    key: 'location',
                    label: '位置',
                    onClick: () => {
                      setShowChatTools(false);
                      alert('“位置”功能开发中');
                    },
                    icon: (
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <path
                          d="M12 4.5C9.51472 4.5 7.5 6.51472 7.5 9C7.5 12.25 12 18.5 12 18.5C12 18.5 16.5 12.25 16.5 9C16.5 6.51472 14.4853 4.5 12 4.5Z"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="9" r="1.6" fill="#111827" />
                      </svg>
                    )
                  },
                  {
                    key: 'regenerate',
                    label: '重新生成',
                    onClick: () => {
                      setShowChatTools(false);
                      handleRegenerateLastReply();
                    },
                    icon: (
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <path
                          d="M7 7.5L4.5 10L7 12.5"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M4.5 10H12C14.4853 10 16.5 12.0147 16.5 14.5C16.5 16.9853 14.4853 19 12 19C10.3831 19 8.94813 18.2261 8.07812 17"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )
                  },
                  {
                    key: 'auto-reply',
                    label: '自动回复',
                    onClick: async () => {
                      setShowChatTools(false);
                      if (!activeChat || !('roleId' in activeChat)) return;
                      const roles = loadStoryRoles();
                      const role = roles.find((r) => r.id === (activeChat as any).roleId);
                      if (!role) return;

                      setShowAutoReplyLoading(true);
                      try {
                        const suggestion = await generatePlayerAutoReply(role);
                        if (suggestion) {
                          setInputText(suggestion);
                        }
                      } catch (err) {
                        console.error('[WeChatApp] 生成自动回复失败:', err);
                        const msg = (err as Error).message || '';
                        if (
                          msg === 'NO_API_CONFIG' ||
                          msg.includes('接口返回状态') ||
                          msg.toLowerCase().includes('fetch') ||
                          msg.toLowerCase().includes('network')
                        ) {
                          setShowApiConfigModal(true);
                        }
                      } finally {
                        setShowAutoReplyLoading(false);
                      }
                    },
                    icon: (
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <path
                          d="M6.5 7.5C6.5 6.39543 7.39543 5.5 8.5 5.5H15.5C16.6046 5.5 17.5 6.39543 17.5 7.5V11.5C17.5 12.6046 16.6046 13.5 15.5 13.5H11.2L8.5 15.8V13.5"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9 9H15"
                          stroke="#111827"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M9 11H12.5"
                          stroke="#111827"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    )
                  },
                  {
                    key: 'my-identity',
                    label: '我的身份',
                    onClick: () => {
                      setShowChatTools(false);
                      if (!activeChat || !('roleId' in activeChat)) {
                        // 没有关联角色时，直接使用全局身份
                        setCurrentRoleIdentity(loadPlayerIdentity());
                        setShowIdentityModal(true);
                        return;
                      }
                      const roles = loadStoryRoles();
                      const role = roles.find((r) => r.id === (activeChat as any).roleId);
                      const identity = role ? loadPlayerIdentityForRole(role.id) : loadPlayerIdentity();
                      setCurrentRoleIdentity(identity);
                      setShowIdentityModal(true);
                    },
                    icon: (
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        {/* 身份卡片外框 */}
                        <rect
                          x="4.5"
                          y="6"
                          width="15"
                          height="12"
                          rx="2.2"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.4"
                        />
                        {/* 头像圆形 */}
                        <circle
                          cx="9"
                          cy="11"
                          r="2.3"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.3"
                        />
                        {/* 头像下方肩膀弧线 */}
                        <path
                          d="M6.8 14.7C7.5 13.8 8.2 13.4 9 13.4C9.8 13.4 10.5 13.8 11.2 14.7"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                        {/* 右侧两行信息 */}
                        <path
                          d="M13.2 10H17"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />
                        <path
                          d="M13.2 12.7H16.2"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />
                      </svg>
                    )
                  }
                ];

                const perPage = 8;
                const totalPages = Math.max(1, Math.ceil(tools.length / perPage));
                const currentPage = Math.min(chatToolsPage, totalPages - 1);
                const start = currentPage * perPage;
                const visibleTools = tools.slice(start, start + perPage);

                return (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 16,
                      padding: '0 16px 4px',
                      boxSizing: 'border-box',
                      pointerEvents: 'none'
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '18px 18px 0 0',
                        padding: '10px 12px 6px',
                        boxShadow: 'none',
                        pointerEvents: 'auto'
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          rowGap: 10,
                          columnGap: 4,
                          paddingBottom: 6
                        }}
                      >
                        {visibleTools.map((tool) => (
                          <button
                            key={tool.key}
                            type="button"
                            onClick={tool.onClick}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer'
                            }}
                          >
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 16,
                                backgroundColor: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {tool.icon}
                            </div>
                            <span style={{ fontSize: 11, color: '#4b5563' }}>{tool.label}</span>
                          </button>
                        ))}
                      </div>

                      {totalPages > 1 && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 10,
                            paddingBottom: 2
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setChatToolsPage((p) => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: currentPage === 0 ? '#d1d5db' : '#6b7280',
                              fontSize: 16,
                              cursor: currentPage === 0 ? 'default' : 'pointer'
                            }}
                          >
                            ‹
                          </button>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {Array.from({ length: totalPages }).map((_, idx) => (
                              <span
                                // eslint-disable-next-line react/no-array-index-key
                                key={idx}
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  backgroundColor: idx === currentPage ? '#111827' : '#d1d5db'
                                }}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setChatToolsPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage === totalPages - 1}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: currentPage === totalPages - 1 ? '#d1d5db' : '#6b7280',
                              fontSize: 16,
                              cursor: currentPage === totalPages - 1 ? 'default' : 'pointer'
                            }}
                          >
                            ›
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}

            {/* 语音消息输入弹窗 */}
            {showVoiceModal && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}
                onClick={handleCloseVoiceModal}
              >
                <div
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    width: '90%',
                    maxWidth: '400px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '500' }}>
                      语音消息
                    </h3>
                    <textarea
                      value={voiceText}
                      onChange={(e) => setVoiceText(e.target.value)}
                      placeholder="输入语音消息内容..."
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                      autoFocus
                    />
                    <div
                      style={{
                        marginTop: '12px',
                        fontSize: '14px',
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>时长：</span>
                      <span style={{ fontWeight: '500', color: '#333' }}>
                        &quot;{calculateVoiceDuration(voiceText)}&quot;
                      </span>
                      <span>秒</span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      justifyContent: 'flex-end'
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleCloseVoiceModal}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleSendVoiceMessage}
                      disabled={!voiceText.trim()}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        background: voiceText.trim() ? '#07c160' : '#ccc',
                        color: 'white',
                        cursor: voiceText.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      发送
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 联系人资料卡弹窗（角色会话） - 目前通过聊天详情页替代，大部分场景不直接使用 */}
            {showContactProfile && !showChatSettings && activeChat && 'roleId' in activeChat && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}
                onClick={() => setShowContactProfile(false)}
              >
                {(() => {
                  const role = loadStoryRoles().find((r) => r.id === (activeChat as any).roleId) ?? null;
                  const displayName = role?.wechatNickname || role?.name || activeChat.name;
                  const signature = role?.wechatSignature?.trim() || '这个人很懒，什么都没写';
                  const genderBadge =
                    role?.gender === 'male'
                      ? WECHAT_GENDER_MALE_BADGE
                      : role?.gender === 'female'
                        ? WECHAT_GENDER_FEMALE_BADGE
                        : null;

                  return (
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        width: '86%',
                        maxWidth: '420px',
                        boxShadow: '0 12px 36px rgba(15, 23, 42, 0.28)',
                        overflow: 'hidden'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          padding: '18px 16px 14px',
                          display: 'flex',
                          gap: '14px',
                          alignItems: 'center',
                          borderBottom: '1px solid #f3f4f6'
                        }}
                      >
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            background: '#111827',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '18px'
                          }}
                        >
                          {role?.avatarUrl ? (
                            <img
                              src={role.avatarUrl}
                              alt={displayName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span>{displayName.charAt(0)}</span>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                fontSize: '18px',
                                fontWeight: 700,
                                color: '#111827',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {displayName}
                            </div>
                            {genderBadge && (
                              <img
                                src={genderBadge}
                                alt={role?.gender === 'male' ? '男' : '女'}
                                style={{ width: '18px', height: '18px', flexShrink: 0 }}
                              />
                            )}
                          </div>
                          <div
                            style={{
                              marginTop: '6px',
                              fontSize: '13px',
                              color: '#6b7280',
                              lineHeight: 1.5,
                              wordBreak: 'break-word'
                            }}
                          >
                            {signature}
                          </div>
                        </div>
                      </div>

                      <div style={{ padding: '14px 16px 16px' }}>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>微信昵称</div>
                        <div style={{ fontSize: '15px', color: '#111827', marginBottom: '12px' }}>{displayName}</div>

                        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>个性签名</div>
                        <div style={{ fontSize: '15px', color: '#111827', lineHeight: 1.6 }}>{signature}</div>

                        <button
                          type="button"
                          onClick={() => setShowContactProfile(false)}
                          style={{
                            marginTop: '16px',
                            width: '100%',
                            padding: '10px 0',
                            borderRadius: '999px',
                            border: 'none',
                            backgroundColor: '#111827',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          关闭
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 聊天详情 / 聊天设置页（仿微信“聊天详情”） */}
            {showChatSettings && activeChat && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#f5f5f5',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* 顶部导航栏 - 独立于主 header，带安全区内边距，避免贴着状态栏 */}
                <div
                  style={{
                    paddingTop: 44,
                    paddingBottom: 8,
                    paddingLeft: 16,
                    paddingRight: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f5f5f5',
                    boxSizing: 'border-box'
                  }}
                >
                  <button
                    type="button"
                    onClick={closeChatSettings}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <path
                        d="M15 6L9 12L15 18"
                        fill="none"
                        stroke="#111827"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#111827'
                    }}
                  >
                    聊天详情
                  </div>
                  <div style={{ width: 32 }} />
                </div>

                {/* 内容区域 */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    backgroundColor: '#f5f5f5'
                  }}
                >
                  {/* 头像区域（单聊：一个头像 + 添加） */}
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      padding: '16px 18px',
                      display: 'flex',
                      gap: 16,
                      borderBottom: '8px solid #f5f5f5'
                    }}
                  >
                    <div
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 10,
                        overflow: 'hidden',
                        backgroundColor: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: 18
                      }}
                    >
                      {activeChat.avatarUrl ? (
                        <img
                          src={activeChat.avatarUrl}
                          alt={activeChat.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span>{activeChat.avatarText}</span>
                      )}
                    </div>
                    <div
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 10,
                        border: '1px dashed #d1d5db',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9ca3af',
                        fontSize: 26
                      }}
                    >
                      +
                    </div>
                  </div>

                  {/* 查找聊天内容 */}
                  <div
                    style={{
                      marginTop: 0,
                      backgroundColor: '#ffffff',
                      borderTop: '0.5px solid #f3f4f6',
                      borderBottom: '8px solid #f5f5f5'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        // 预留：未来可跳转到搜索聊天内容功能
                        alert('“查找聊天内容”功能开发中');
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span style={{ fontSize: 16, color: '#111827' }}>查找聊天内容</span>
                      <svg viewBox="0 0 24 24" width="18" height="18">
                        <path
                          d="M10 6L16 12L10 18"
                          fill="none"
                          stroke="#c4c4c4"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* 开关区域：消息免打扰 / 置顶聊天（不显示“提醒”） */}
                  <div
                    style={{
                      marginTop: 0,
                      backgroundColor: '#ffffff',
                      borderTop: '0.5px solid #f3f4f6',
                      borderBottom: '8px solid #f5f5f5'
                    }}
                  >
                    {/* 消息免打扰 */}
                    <div
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '0.5px solid #f3f4f6',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span style={{ fontSize: 16, color: '#111827' }}>消息免打扰</span>
                      <label
                        style={{
                          position: 'relative',
                          display: 'inline-flex',
                          alignItems: 'center',
                          width: 52,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: currentChatSettings.mute ? '#111827' : '#e5e7eb',
                          padding: 3,
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!currentChatSettings.mute}
                          onChange={(e) => {
                            const next = { ...currentChatSettings, mute: e.target.checked };
                            setCurrentChatSettings(next);
                            saveChatSettings(activeChat.id, next);
                          }}
                          style={{ display: 'none' }}
                        />
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '999px',
                            backgroundColor: '#ffffff',
                            transform: currentChatSettings.mute ? 'translateX(20px)' : 'translateX(0)',
                            transition: 'transform 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                          }}
                        />
                      </label>
                    </div>

                    {/* 置顶聊天 */}
                    <div
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span style={{ fontSize: 16, color: '#111827' }}>置顶聊天</span>
                      <label
                        style={{
                          position: 'relative',
                          display: 'inline-flex',
                          alignItems: 'center',
                          width: 52,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: currentChatSettings.pinned ? '#111827' : '#e5e7eb',
                          padding: 3,
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!currentChatSettings.pinned}
                          onChange={(e) => {
                            const next = { ...currentChatSettings, pinned: e.target.checked };
                            setCurrentChatSettings(next);
                            saveChatSettings(activeChat.id, next);
                            // 目前仅保存设置，列表排序后续再实现
                          }}
                          style={{ display: 'none' }}
                        />
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '999px',
                            backgroundColor: '#ffffff',
                            transform: currentChatSettings.pinned ? 'translateX(20px)' : 'translateX(0)',
                            transition: 'transform 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* 设置当前聊天背景 */}
                  <div
                    style={{
                      marginTop: 0,
                      backgroundColor: '#ffffff',
                      borderTop: '0.5px solid #f3f4f6',
                      borderBottom: '8px solid #f5f5f5'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        alert('“设置当前聊天背景”功能开发中，可在左侧“故事-美化”中配置全局背景。');
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span style={{ fontSize: 16, color: '#111827' }}>设置当前聊天背景</span>
                      <svg viewBox="0 0 24 24" width="18" height="18">
                        <path
                          d="M10 6L16 12L10 18"
                          fill="none"
                          stroke="#c4c4c4"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* 清空聊天记录 / 投诉 */}
                  <div
                    style={{
                      marginTop: 0,
                      backgroundColor: '#ffffff',
                      borderTop: '0.5px solid #f3f4f6',
                      borderBottom: '0.5px solid #f3f4f6'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeChat) return;
                        const ok = window.confirm('确定要清空与对方的全部聊天记录吗？此操作不可恢复。');
                        if (!ok) return;
                        saveChatMessages(activeChat.id, []);
                        setChatMessagesKey((prev) => prev + 1);
                        closeChatSettings();
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        color: '#ef4444',
                        fontSize: 16,
                        boxSizing: 'border-box'
                      }}
                    >
                      清空聊天记录
                    </button>
                    <div
                      style={{
                        height: 8,
                        backgroundColor: '#f5f5f5'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        alert('“投诉”功能仅做展示，当前版本不会真的发送任何数据。');
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        color: '#111827',
                        fontSize: 16,
                        boxSizing: 'border-box'
                      }}
                    >
                      投诉
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 通话 Action Sheet（聊天功能菜单：视频通话按钮触发） */}
            {showCallActionSheet && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  zIndex: 1200
                }}
                onClick={() => setShowCallActionSheet(false)}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: '10px 10px 14px',
                    boxSizing: 'border-box'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 14,
                      overflow: 'hidden',
                      boxShadow: '0 -10px 30px rgba(0,0,0,0.12)'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowCallActionSheet(false);
                        alert('“视频通话”功能开发中');
                      }}
                      style={{
                        width: '100%',
                        padding: '16px 0',
                        border: 'none',
                        background: 'transparent',
                        fontSize: 17,
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                          <path
                            d="M4.5 7.2C4.5 6.53726 5.03726 6 5.7 6H14.3C14.9627 6 15.5 6.53726 15.5 7.2V16.8C15.5 17.4627 14.9627 18 14.3 18H5.7C5.03726 18 4.5 17.4627 4.5 16.8V7.2Z"
                            stroke="#111827"
                            strokeWidth="1.6"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15.5 10L19.5 8V16L15.5 14"
                            stroke="#111827"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      视频通话
                    </button>
                    <div style={{ height: 1, backgroundColor: '#f3f4f6' }} />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCallActionSheet(false);
                        alert('“语音通话”功能开发中');
                      }}
                      style={{
                        width: '100%',
                        padding: '16px 0',
                        border: 'none',
                        background: 'transparent',
                        fontSize: 17,
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                          {/* 语音通话：使用更清晰的电话轮廓图标（Heroicons Phone 样式） */}
                          <path
                            d="M2.25 6.75c0 8.284 6.716 15 15 15 .966 0 1.75-.784 1.75-1.75v-2.943a1.25 1.25 0 0 0-.915-1.2l-3.108-.777a1.25 1.25 0 0 0-1.172.326l-1.21 1.21a11.048 11.048 0 0 1-4.845-4.845l1.21-1.21a1.25 1.25 0 0 0 .326-1.172L8.943 3.665A1.25 1.25 0 0 0 7.743 2.75H4.8A1.75 1.75 0 0 0 3.05 4.5v2.25Z"
                            fill="none"
                            stroke="#111827"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      语音通话
                    </button>
                  </div>

                  <div style={{ height: 10 }} />

                  <button
                    type="button"
                    onClick={() => setShowCallActionSheet(false)}
                    style={{
                      width: '100%',
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderRadius: 14,
                      padding: '16px 0',
                      fontSize: 17,
                      color: '#111827',
                      cursor: 'pointer',
                      boxShadow: '0 -10px 30px rgba(0,0,0,0.08)'
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* 发红包全屏页（仿微信发红包布局） */}
            {showRedPacketPage && activeChat && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#f5f5f5',
                  zIndex: 1200,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* 顶部导航栏 */}
                <div
                  style={{
                    // 顶部安全区留白：略大一点，避免贴着状态栏（比其它页面更“下沉”）
                    paddingTop: 56,
                    paddingBottom: 8,
                    paddingLeft: 16,
                    paddingRight: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f5f5f5',
                    boxSizing: 'border-box'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowRedPacketPage(false);
                      setRedPacketError(null);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <path
                        d="M15 6L9 12L15 18"
                        fill="none"
                        stroke="#111827"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#111827'
                    }}
                  >
                    发红包
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('更多功能开发中')}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      width: 32
                    }}
                    aria-label="更多"
                    title="更多"
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <circle cx="6" cy="12" r="1.5" fill="#111827" />
                      <circle cx="12" cy="12" r="1.5" fill="#111827" />
                      <circle cx="18" cy="12" r="1.5" fill="#111827" />
                    </svg>
                  </button>
                </div>

                {/* 内容区域 */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '14px 16px 0',
                    boxSizing: 'border-box'
                  }}
                >
                  {(() => {
                    const parsed = Number(redPacketAmountInput || '0');
                    const safe = Number.isFinite(parsed) ? parsed : 0;
                    const displayAmount = (Math.round(safe * 100) / 100).toFixed(2);
                    const canSend = safe >= 0.01 && safe <= 200;
                    const hasAmountInput = redPacketAmountInput.trim().length > 0;
                    const amountTextForWidth = (redPacketAmountInput.trim() || '0.00').replace(/\s+/g, '');
                    // 多留一点宽度，避免不同字体/内核下被裁切
                    const amountWidthCh = Math.min(14, Math.max(5, amountTextForWidth.length + 2));

                    const cardStyle: React.CSSProperties = {
                      backgroundColor: '#ffffff',
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: '1px solid #f0f0f0'
                    };

                    const rowStyle: React.CSSProperties = {
                      padding: '16px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12
                    };

                    return (
                      <>
                        {/* 金额 */}
                        <div style={{ ...cardStyle, marginBottom: 12 }}>
                          <div style={rowStyle}>
                            <div style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>金额</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
                              <span style={{ fontSize: 18, fontWeight: 500, color: hasAmountInput ? '#111827' : '#9ca3af' }}>¥</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={redPacketAmountInput}
                                onChange={(e) => {
                                  // 规范化金额输入：只允许数字和一个小数点，最多两位小数
                                  let v = e.target.value ?? '';
                                  v = v.replace(/[^\d.]/g, '');
                                  const dotIndex = v.indexOf('.');
                                  if (dotIndex !== -1) {
                                    v = v.slice(0, dotIndex + 1) + v.slice(dotIndex + 1).replace(/\./g, '');
                                    const [intPart, decPart = ''] = v.split('.');
                                    v = `${intPart}.${decPart.slice(0, 2)}`;
                                  }
                                  // 限制整体长度，避免极端长输入撑爆布局
                                  if (v.length > 12) v = v.slice(0, 12);
                                  setRedPacketAmountInput(v);
                                  setRedPacketError(null);
                                }}
                                placeholder="0.00"
                                style={{
                                  width: `${amountWidthCh}ch`,
                                  border: 'none',
                                  outline: 'none',
                                  background: 'transparent',
                                  textAlign: 'left',
                                  fontSize: 26,
                                  fontWeight: 500,
                                  color: hasAmountInput ? '#111827' : '#9ca3af',
                                  padding: 0,
                                  margin: 0,
                                  // 数字等宽，避免 ch 宽度估算在不同数字上跳动
                                  fontVariantNumeric: 'tabular-nums'
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* 备注 */}
                        <div style={{ ...cardStyle, marginBottom: 12 }}>
                          <div style={rowStyle}>
                            <input
                              type="text"
                              maxLength={25}
                              value={redPacketNoteInput}
                              onChange={(e) => setRedPacketNoteInput(e.target.value)}
                              placeholder="恭喜发财，大吉大利"
                              style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                fontSize: 18,
                                color: '#111827',
                                background: 'transparent'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => alert('表情功能开发中')}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                padding: 6,
                                cursor: 'pointer',
                                color: '#6b7280'
                              }}
                              aria-label="表情"
                              title="表情"
                            >
                              <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                                {/* 微信同款感觉：笑脸 + 右下角外置加号 */}
                                <circle cx="10.5" cy="10.5" r="7.1" stroke="currentColor" strokeWidth="1.6" />
                                {/* 眼睛（短横线） */}
                                <path d="M8.2 9.8H9.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                <path d="M11.4 9.8H12.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                {/* 微笑嘴 */}
                                <path
                                  d="M7.9 12.6C8.7 13.7 9.6 14.2 10.5 14.2C11.4 14.2 12.3 13.7 13.1 12.6"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                />
                                {/* 外置加号 */}
                                <path d="M18.3 15.6V20.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                <path d="M16 17.9H20.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* 红包封面 */}
                        <div style={{ ...cardStyle, marginBottom: 18 }}>
                          <button
                            type="button"
                            onClick={() => alert('“红包封面”功能开发中')}
                            style={{
                              ...rowStyle,
                              width: '100%',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>红包封面</div>
                            <svg viewBox="0 0 24 24" width="18" height="18">
                              <path d="M10 6L16 12L10 18" fill="none" stroke="#c4c4c4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <div style={{ height: 1, backgroundColor: '#f3f4f6' }} />
                          <div style={{ ...rowStyle, color: '#9ca3af' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                                <rect x="4.5" y="6.5" width="15" height="12" rx="2" stroke="#ef4444" strokeWidth="1.4" />
                                <path d="M7 10.5C9 12 10.5 12.6 12 12.6C13.5 12.6 15 12 17 10.5" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
                              </svg>
                              <span style={{ fontSize: 16 }}>制作我的专属红包封面</span>
                            </div>
                            <div />
                          </div>
                        </div>

                        {/* 中间大金额 */}
                        <div style={{ textAlign: 'center', marginTop: 6, marginBottom: 18 }}>
                          <div style={{ fontSize: 54, fontWeight: 800, color: '#111827' }}>
                            ¥ {displayAmount}
                          </div>
                          {redPacketError && (
                            <div style={{ marginTop: 6, fontSize: 12, color: '#b91c1c' }}>{redPacketError}</div>
                          )}
                        </div>

                        {/* 按钮 */}
                        <div style={{ padding: '0 50px', boxSizing: 'border-box' }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (!canSend) {
                                if (safe < 0.01) setRedPacketError('单个红包至少 0.01 元');
                                else if (safe > 200) setRedPacketError('单个红包最多 200 元');
                                else setRedPacketError('金额不合法');
                                return;
                              }
                              handleSendRedPacket();
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 0',
                              borderRadius: 8,
                              border: 'none',
                              backgroundColor: canSend ? '#FA5151' : '#fca5a5',
                              color: '#ffffff',
                              fontSize: 18,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            塞钱进红包
                          </button>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: 26, color: '#9ca3af', fontSize: 14 }}>
                          可直接使用收到的零钱发红包
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div style={{ height: 18 }} />
              </div>
            )}

            {/* API 未配置提示弹窗 */}
            {showApiConfigModal && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1100
                }}
                onClick={() => setShowApiConfigModal(false)}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '20px 18px 16px',
                    width: '78%',
                    maxWidth: '360px',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.25)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ marginBottom: '10px', textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#111827',
                        marginBottom: '6px'
                      }}
                    >
                      需要先配置 API
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#4b5563',
                        lineHeight: 1.6
                      }}
                    >
                      当前操作需要调用 AI 能力（生成角色微信资料或聊天回复），请先在「我 &gt; 设置 &gt; API 设置」中配置接口地址、密钥和模型。
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowApiConfigModal(false);
                      if (onOpenApiSettings) {
                        onOpenApiSettings();
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 0',
                      borderRadius: '999px',
                      border: 'none',
                      backgroundColor: '#111827',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    去配置 API
                  </button>
                </div>
              </div>
            )}

            {/* 当前聊天下的「我的身份」查看弹窗 */}
            {showIdentityModal && currentRoleIdentity && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1050
                }}
                onClick={() => setShowIdentityModal(false)}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '18px 18px 14px',
                    width: '82%',
                    maxWidth: '380px',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.25)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ marginBottom: '10px' }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#111827',
                        marginBottom: '4px',
                        textAlign: 'center'
                      }}
                    >
                      我的身份（当前聊天）
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#4b5563',
                        lineHeight: 1.7,
                        maxHeight: 220,
                        overflowY: 'auto',
                        paddingRight: 2
                      }}
                    >
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>玩家姓名：</span>
                        <span>{currentRoleIdentity.name || '（未设置）'}</span>
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>性别：</span>
                        <span>
                          {currentRoleIdentity.gender === 'male'
                            ? '男'
                            : currentRoleIdentity.gender === 'female'
                              ? '女'
                              : currentRoleIdentity.gender === 'other'
                                ? '其他 / 保密'
                                : '（未设置）'}
                        </span>
                      </div>
                      {currentRoleIdentity.intro && (
                        <div style={{ marginBottom: 4 }}>
                          <span style={{ fontWeight: 500 }}>玩家介绍：</span>
                          <span>{currentRoleIdentity.intro}</span>
                        </div>
                      )}
                      {currentRoleIdentity.tags && (
                        <div style={{ marginBottom: 4 }}>
                          <span style={{ fontWeight: 500 }}>玩家标签：</span>
                          <span>{currentRoleIdentity.tags}</span>
                        </div>
                      )}
                      {currentRoleIdentity.wechatId && (
                        <div style={{ marginBottom: 4 }}>
                          <span style={{ fontWeight: 500 }}>微信号：</span>
                          <span>{currentRoleIdentity.wechatId}</span>
                        </div>
                      )}
                      {currentRoleIdentity.phoneNumber && (
                        <div style={{ marginBottom: 4 }}>
                          <span style={{ fontWeight: 500 }}>手机号：</span>
                          <span>{currentRoleIdentity.phoneNumber}</span>
                        </div>
                      )}
                      {!currentRoleIdentity.intro &&
                        !currentRoleIdentity.tags &&
                        !currentRoleIdentity.wechatId &&
                        !currentRoleIdentity.phoneNumber && (
                          <div style={{ marginTop: 4, color: '#9ca3af' }}>
                            你还没有为这个角色单独设置更详细的身份信息，目前使用的是全局玩家身份。
                          </div>
                        )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowIdentityModal(false);
                        // 跳转到「故事」Tab 下的“玩家身份”设置页，并为当前角色编辑专属身份
                        if (activeChat && 'roleId' in activeChat) {
                          setPendingIdentityEditRoleId((activeChat as any).roleId);
                        } else {
                          setPendingIdentityEditRoleId(null);
                        }
                        setActiveTab('story');
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 0',
                        borderRadius: '999px',
                        border: 'none',
                        backgroundColor: '#111827',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      修改身份
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowIdentityModal(false);
                        alert('“选择其他身份”功能开发中，后续会支持为同一角色切换不同玩家身份。');
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 0',
                        borderRadius: '999px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#4b5563',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      选择其他身份
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 打开红包动画（拆开前） - 仅角色发给玩家的红包使用 */}
            {openingRedPacketMessage &&
              activeChat &&
              !isRedPacketDetailOpened &&
              (openingRedPacketMessage as any).from !== 'self' && (
              <div
                className="lumi-redpacket-overlay"
                onClick={() => {
                  setOpeningRedPacketMessage(null);
                  setIsRedPacketDetailOpened(false);
                  setIsRedPacketCoinAnimating(false);
                }}
              >
                <div
                  className={`lumi-redpacket-container ${isRedPacketDetailOpened ? 'lumi-redpacket-opened' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 头部：头像 + 备注/昵称 */}
                      <div className="lumi-redpacket-header">
                    <div className="lumi-redpacket-header-top">
                      <div className="lumi-redpacket-avatar">
                        {openingRedPacketMessage.from === 'self' ? (
                          playerAvatarUrl ? (
                            <img src={playerAvatarUrl} alt={playerWechatNickname} />
                          ) : (
                            <span>{playerAvatarText}</span>
                          )
                        ) : activeChat.avatarUrl ? (
                          <img src={activeChat.avatarUrl} alt={activeChat.name} />
                        ) : (
                          <span>{activeChat.avatarText}</span>
                        )}
                      </div>
                      <div className="lumi-redpacket-sender-name">
                        {openingRedPacketMessage.from === 'self'
                          ? `${playerWechatNickname}发出的红包`
                          : `${activeChat.name}发来的红包`}
                      </div>
                    </div>
                    {!isRedPacketDetailOpened && (
                      <div className="lumi-redpacket-note">
                        {openingRedPacketMessage.redPacketNote || '恭喜发财，大吉大利'}
                      </div>
                    )}
                  </div>

                  {/* 中间：金币按钮 + 提示文字 */}
                  <div className="lumi-redpacket-open-area">
                    <button
                      type="button"
                      className={`lumi-redpacket-coin ${isRedPacketCoinAnimating ? 'lumi-redpacket-coin-spinning' : ''}`}
                      onClick={() => {
                        if (isRedPacketCoinAnimating) return;
                        setIsRedPacketCoinAnimating(true);
                        // 动画结束后进入详情页
                        window.setTimeout(() => {
                          setIsRedPacketDetailOpened(true);
                        }, 1200);
                      }}
                    >
                      <span className="lumi-redpacket-coin-symbol">開</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 拆开后的红包详情页（仿微信原生详情页） */}
            {openingRedPacketMessage && activeChat && isRedPacketDetailOpened && (
              <div className="lumi-redpacket-detail-page">
                <div className="lumi-redpacket-detail-top">
                  <div className="lumi-redpacket-detail-nav">
                    <button
                      type="button"
                      className="lumi-redpacket-detail-back"
                      onClick={() => {
                        setOpeningRedPacketMessage(null);
                        setIsRedPacketDetailOpened(false);
                        setIsRedPacketCoinAnimating(false);
                        setShowRedPacketRecordPage(false);
                        setShowRedPacketYearPicker(false);
                      }}
                    >
                      ‹
                    </button>
                    <div className="lumi-redpacket-detail-nav-title" />
                    <button
                      type="button"
                      className="lumi-redpacket-detail-nav-more"
                      onClick={() => {
                        setShowRedPacketRecordPage(true);
                        setShowRedPacketYearPicker(false);
                        if (receivedRedPacketYears.length > 0) {
                          setRedPacketRecordYear(receivedRedPacketYears[0]);
                        } else {
                          setRedPacketRecordYear(new Date().getFullYear());
                        }
                      }}
                    >
                      ···
                    </button>
                  </div>
                </div>
                <div className="lumi-redpacket-detail-main">
                  {openingRedPacketMessage.from === 'self' ? (
                    <>
                      <div className="lumi-redpacket-detail-sender-row">
                        <div className="lumi-redpacket-detail-avatar">
                          {playerAvatarUrl ? (
                            <img src={playerAvatarUrl} alt={playerWechatNickname} />
                          ) : (
                            <span>{playerAvatarText}</span>
                          )}
                        </div>
                        <div className="lumi-redpacket-detail-sender-name">
                          {playerWechatNickname}发出的红包
                        </div>
                      </div>
                      <div className="lumi-redpacket-detail-note-line">
                        {openingRedPacketMessage.redPacketNote || '恭喜发财，大吉大利'}
                      </div>
                      {typeof openingRedPacketMessage.redPacketAmount === 'number' && (
                        <div className="lumi-redpacket-detail-pending-line">
                          红包金额 {openingRedPacketMessage.redPacketAmount.toFixed(2)} 元，等待对方领取
                        </div>
                      )}
                      <div className="lumi-redpacket-detail-pending-footer">
                        未领取的红包，将于 24 小时后发起退款
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="lumi-redpacket-detail-sender-row">
                        <div className="lumi-redpacket-detail-avatar">
                          {activeChat.avatarUrl ? (
                            <img src={activeChat.avatarUrl} alt={activeChat.name} />
                          ) : (
                            <span>{activeChat.avatarText}</span>
                          )}
                        </div>
                        <div className="lumi-redpacket-detail-sender-name">
                          {activeChat.name}发出的红包
                        </div>
                      </div>
                      <div className="lumi-redpacket-detail-note-line">
                        {openingRedPacketMessage.redPacketNote || '恭喜发财，大吉大利'}
                      </div>
                      {typeof openingRedPacketMessage.redPacketAmount === 'number' && (
                        <div className="lumi-redpacket-detail-amount-block">
                          <span className="lumi-redpacket-detail-amount-value">
                            {openingRedPacketMessage.redPacketAmount.toFixed(2)}
                          </span>
                          <span className="lumi-redpacket-detail-amount-unit">元</span>
                        </div>
                      )}
                      <div className="lumi-redpacket-detail-tip">已存入零钱，可直接消费</div>
                      <div className="lumi-redpacket-detail-record">
                        <div className="lumi-redpacket-detail-record-item">
                        <div className="lumi-redpacket-detail-record-avatar">
                            {playerAvatarUrl ? (
                              <img src={playerAvatarUrl} alt={playerWechatNickname} />
                            ) : (
                              <span>{playerAvatarText}</span>
                            )}
                          </div>
                          <div className="lumi-redpacket-detail-record-info">
                            <div className="lumi-redpacket-detail-record-name">
                              {playerWechatNickname}
                            </div>
                            <div className="lumi-redpacket-detail-record-time">
                              {openingRedPacketMessage.time || ''}
                            </div>
                          </div>
                          {typeof openingRedPacketMessage.redPacketAmount === 'number' && (
                            <div className="lumi-redpacket-detail-record-amount">
                              {openingRedPacketMessage.redPacketAmount.toFixed(2)} 元
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 收到的红包记录页（从红包详情右上角进入，展示「玩家收到的角色红包」汇总） */}
            {showRedPacketRecordPage && (
              <div className="lumi-redpacket-record-page">
                <div className="lumi-redpacket-record-top">
                  <div className="lumi-redpacket-record-nav">
                    <button
                      type="button"
                      className="lumi-redpacket-record-close"
                      onClick={() => {
                        setShowRedPacketRecordPage(false);
                        setShowRedPacketYearPicker(false);
                      }}
                    >
                      ×
                    </button>
                    <div className="lumi-redpacket-record-title">收到的红包</div>
                    <button
                      type="button"
                      className="lumi-redpacket-record-nav-more"
                      onClick={() => {
                        // 预留：后续可扩展“红包封面”“帮助”等更多入口
                        window.alert('更多功能开发中');
                      }}
                    >
                      ···
                    </button>
                  </div>
                </div>

                <div className="lumi-redpacket-record-main">
                  <div className="lumi-redpacket-record-summary">
                    <div className="lumi-redpacket-record-header-row">
                      <div className="lumi-redpacket-record-sender">
                        <div className="lumi-redpacket-detail-avatar">
                          {playerAvatarUrl ? (
                            <img src={playerAvatarUrl} alt={playerWechatNickname} />
                          ) : (
                            <span>{playerAvatarText}</span>
                          )}
                        </div>
                        <div className="lumi-redpacket-record-sender-one-line">
                          {playerWechatNickname} · 共收到
                        </div>
                      </div>
                      <div className="lumi-redpacket-record-year-wrapper">
                        <button
                          type="button"
                          className="lumi-redpacket-record-year-btn"
                          onClick={() => {
                            if (!receivedRedPacketYears || receivedRedPacketYears.length <= 1) {
                              return;
                            }
                            setShowRedPacketYearPicker((prev) => !prev);
                          }}
                        >
                          {redPacketRecordYear ?? receivedRedPacketYears[0]} 年
                          {receivedRedPacketYears.length > 1 && (
                            <span className="lumi-redpacket-record-year-arrow">⌄</span>
                          )}
                        </button>
                        {showRedPacketYearPicker && receivedRedPacketYears.length > 1 && (
                          <div className="lumi-redpacket-record-year-dropdown">
                            {receivedRedPacketYears.map((year) => (
                              <button
                                key={year}
                                type="button"
                                className="lumi-redpacket-record-year-option"
                                onClick={() => {
                                  setRedPacketRecordYear(year);
                                  setShowRedPacketYearPicker(false);
                                }}
                              >
                                {year} 年
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lumi-redpacket-record-summary-amount">
                      {receivedRedPacketTotalAmount.toFixed(2)}
                    </div>
                    <div className="lumi-redpacket-record-summary-row">
                      <div>
                        <div className="lumi-redpacket-record-summary-number">
                          {receivedRedPacketTotalCount}
                        </div>
                        <div>收到红包</div>
                      </div>
                      <div>
                        <div className="lumi-redpacket-record-summary-number">
                          {receivedRedPacketBestLuckCount}
                        </div>
                        <div>手气最佳</div>
                      </div>
                    </div>
                  </div>

                  <div className="lumi-redpacket-record-list">
                    {receivedRedPacketRecordsForYear.length === 0 ? (
                      <div className="lumi-redpacket-record-empty">暂无收到的红包</div>
                    ) : (
                      receivedRedPacketRecordsForYear.map((item) => {
                        const dateObj = new Date(item.timestamp);
                        const month = `${dateObj.getMonth() + 1}`.padStart(2, '0');
                        const day = `${dateObj.getDate()}`.padStart(2, '0');
                        const dateLabel = `${month}月${day}日`;

                        return (
                          <div
                            key={item.id}
                            className="lumi-redpacket-detail-record-item"
                            style={{ paddingLeft: 16, paddingRight: 16 }}
                          >
                            <div className="lumi-redpacket-detail-record-avatar">
                              {item.roleAvatarUrl ? (
                                <img src={item.roleAvatarUrl} alt={item.roleName} />
                              ) : (
                                <span>{item.roleAvatarText}</span>
                              )}
                            </div>
                            <div className="lumi-redpacket-detail-record-info">
                              <div className="lumi-redpacket-detail-record-name">
                                {item.roleName}
                              </div>
                              <div className="lumi-redpacket-detail-record-time">{dateLabel}</div>
                            </div>
                            <div className="lumi-redpacket-detail-record-amount">
                              {item.amount.toFixed(2)} 元
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 角色忙碌中提示弹窗（去忙工作/拍戏/开会，一段时间后再统一回复） */}
            {busyInfo && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}
                onClick={() => setBusyInfo(null)}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '18px 16px 14px',
                    width: '78%',
                    maxWidth: '360px',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.25)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#111827',
                      marginBottom: 8,
                      textAlign: 'center'
                    }}
                  >
                    对方现在在忙
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#4b5563',
                      lineHeight: 1.6,
                      textAlign: 'center',
                      marginBottom: 10
                    }}
                  >
                    {busyInfo.roleName} 这会儿不会立刻回你。
                    <br />
                    {(() => {
                      const diffMs = Math.max(0, busyInfo.untilTimestamp - busyNow);
                      if (diffMs <= 0) {
                        return '随时可能会看完这段聊天一起回复你。';
                      }
                      const totalSeconds = Math.floor(diffMs / 1000);
                      const hours = Math.floor(totalSeconds / 3600);
                      const minutes = Math.floor((totalSeconds % 3600) / 60);
                      const seconds = totalSeconds % 60;
                      const hh = String(hours).padStart(2, '0');
                      const mm = String(minutes).padStart(2, '0');
                      const ss = String(seconds).padStart(2, '0');
                      return `预计大概 ${hh}:${mm}:${ss} 后有空，再统一看完这段聊天一起回复你。`;
                    })()}
                  </div>
                  <button
                    type="button"
                    onClick={() => setBusyInfo(null)}
                    style={{
                      width: '100%',
                      padding: '8px 0',
                      borderRadius: 999,
                      border: 'none',
                      backgroundColor: '#111827',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    知道了
                  </button>
                </div>
              </div>
            )}

            {/* 角色已读不回提示弹窗 */}
            {noReplyInfo && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}
                onClick={() => setNoReplyInfo(null)}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '20px 18px 16px',
                    width: '78%',
                    maxWidth: '360px',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.25)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ marginBottom: '10px', textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#111827',
                        marginBottom: '6px'
                      }}
                    >
                      已读不回
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#4b5563',
                        lineHeight: 1.6
                      }}
                    >
                      {noReplyInfo.roleName} 看到了你的消息，但这会儿没有回你。
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      lineHeight: 1.6,
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      marginBottom: '14px'
                    }}
                  >
                    {noReplyInfo.reason}
                  </div>
                  <button
                    type="button"
                    onClick={() => setNoReplyInfo(null)}
                    style={{
                      width: '100%',
                      padding: '9px 0',
                      borderRadius: '999px',
                      border: 'none',
                      backgroundColor: '#111827',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    知道了
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="wechat-list" style={{ paddingBottom: '110px' }}>
            {chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                className="wechat-conv"
                onClick={() => setActiveChatId(chat.id)}
              >
                <div className="wechat-conv-avatar">
                  {chat.avatarUrl ? (
                    <img src={chat.avatarUrl} alt={chat.name} />
                  ) : (
                    <span>{chat.avatarText}</span>
                  )}
                </div>
                <div className="wechat-conv-main">
                  <div className="wechat-conv-top">
                    <span className="wechat-conv-name">{chat.name}</span>
                    <span className="wechat-conv-time">{chat.time}</span>
                  </div>
                  <div className="wechat-conv-bottom">
                    <span className="wechat-conv-preview">
                      {chat.lastMessage}
                    </span>
                    {chat.unread > 0 && <span className="wechat-conv-unread" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )
      ) : activeTab === 'contacts' ? (
        contactsView === 'profile' && contactsProfileRoleId
          ? (() => {
            const roles = loadStoryRoles();
            const role = roles.find(r => r.id === contactsProfileRoleId) ?? null;
            if (!role) {
              return (
                <div className="wechat-contacts" style={{ paddingBottom: '110px' }}>
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                    未找到该联系人
                  </div>
                </div>
              );
            }

            // 加载联系人信息，用于备注展示
            const contacts = loadWeChatContacts();
            const contact = contacts.find(c => c.roleId === role.id) ?? null;
            const remark = contact?.remark?.trim() || '';
            const nickname = role.wechatNickname || role.name;
            const displayName = remark || nickname;
            const wechatId = role.wechatId || '未设置';
            const region = role.region?.trim() || null;

            const genderBadge =
              role.gender === 'male'
                ? WECHAT_GENDER_MALE_BADGE
                : role.gender === 'female'
                  ? WECHAT_GENDER_FEMALE_BADGE
                  : null;

            return (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: '#ffffff'
                }}
              >
                <div
                  style={{
                    padding: '28px 18px 20px',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderBottom: '1px solid #f3f4f6'
                  }}
                >
                  <div
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      backgroundColor: '#111827',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '14px',
                      color: '#ffffff',
                      fontSize: '18px',
                      flexShrink: 0
                    }}
                  >
                    {role.avatarUrl ? (
                      <img
                        src={role.avatarUrl}
                        alt={displayName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span>{displayName.charAt(0)}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {displayName}
                      </span>
                      {genderBadge && (
                        <img
                          src={genderBadge}
                          alt={role.gender === 'male' ? '男' : '女'}
                          style={{ width: '18px', height: '18px', flexShrink: 0 }}
                        />
                      )}
                    </div>
                    {/* 如果有备注名，则额外显示“昵称：xxx” */}
                    {remark && (
                      <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, marginBottom: 2 }}>
                        昵称：{nickname}
                      </div>
                    )}
                    <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, marginBottom: region ? 2 : 0 }}>
                      微信号：{wechatId}
                    </div>
                    {region && (
                      <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6 }}>
                        地区：{region}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: '15px', color: '#111827', marginBottom: '8px' }}>朋友资料</div>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                    添加朋友的备注名、电话、标签、备注、照片等，并设置朋友权限。
                  </div>
                </div>

                <div style={{ padding: '20px 18px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: '15px', color: '#111827', marginBottom: '10px' }}>朋友圈</div>
                  <div
                    style={{
                      width: '70px',
                      height: '70px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '6px'
                    }}
                  />
                  <div style={{ height: '10px' }} />
                </div>

                <div
                  style={{
                    padding: '22px 20px 32px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveChatId(`chat-${role.id}`);
                      setActiveTab('chat');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      borderRadius: '999px',
                      border: 'none',
                      backgroundColor: '#111827',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    发消息
                  </button>
                  <button
                    type="button"
                    disabled
                    style={{
                      width: '100%',
                      padding: '9px 0',
                      borderRadius: '999px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#9ca3af',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                  >
                    音视频通话（开发中）
                  </button>
                </div>
              </div>
            );
          })()
          : contactsView === 'settings' && contactsProfileRoleId
            ? (() => {
              // 使用 contactsDataVersion 作为依赖，确保更新后立即重新渲染最新数据
              contactsDataVersion;
              const contacts = loadWeChatContacts();
              const roles = loadStoryRoles();
              const contact = contacts.find(c => c.roleId === contactsProfileRoleId) ?? null;
              const role = roles.find(r => r.id === contactsProfileRoleId) ?? null;
              if (!contact || !role) {
                return (
                  <div className="wechat-contacts" style={{ paddingBottom: '110px' }}>
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                      未找到该联系人
                    </div>
                  </div>
                );
              }

              const handleUpdateContact = (patch: Partial<WeChatContact>) => {
                const updated: WeChatContact = {
                  ...contact,
                  ...patch
                };
                saveWeChatContact(updated);
                setContactsDataVersion((v) => v + 1);
              };

              const handleDeleteContact = () => {
                if (!window.confirm('确定要删除该联系人吗？此操作不可撤销。')) return;
                try {
                  const contactsAll = loadWeChatContacts().filter(c => c.roleId !== contactsProfileRoleId);
                  window.localStorage.setItem(WECHAT_CONTACTS_KEY, JSON.stringify(contactsAll));
                  // 删除对应聊天记录
                  const chatId = `chat-${contactsProfileRoleId}`;
                  window.localStorage.removeItem(`${CHAT_MESSAGES_KEY_PREFIX}${chatId}`);
                } catch (err) {
                  console.error('删除联系人失败:', err);
                }
                setContactsView('list');
                setContactsProfileRoleId(null);
                setActiveChatId(null);
              };

              const currentRemark = contact.remark ?? '';
              const currentPermission = contact.permission;
              const currentStarred = !!contact.starred;
              const currentBlocked = !!contact.blocked;

              // 共同群聊数量（当前版本暂不区分群聊，展示为 0 个以保持结构，可后续扩展）
              const mutualGroupCount = 0;
              const taLabel = role.gender === 'female' ? '她' : '他';
              const signatureText = role.wechatSignature?.trim() || '未设置';
              const addedDate = new Date(contact.addedAt);
              const addedTimeLabel = `${addedDate.getFullYear()} 年 ${addedDate.getMonth() + 1} 月`;

              return (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    backgroundColor: '#f3f4f6'
                  }}
                >
                  <div style={{ marginTop: 12 }} />
                  <div style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const value = window.prompt('编辑备注', currentRemark) ?? '';
                        const trimmed = value.trim();
                        handleUpdateContact({ remark: trimmed || undefined });
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: 15, color: '#111827' }}>编辑备注</span>
                      <span style={{ fontSize: 13, color: '#9ca3af' }}>
                        {currentRemark || '未设置'}
                      </span>
                    </button>
                    <div style={{ marginLeft: 18, height: 1, backgroundColor: '#f3f4f6' }} />
                    <button
                      type="button"
                      onClick={() => setContactsView('permission')}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: 15, color: '#111827' }}>设置权限</span>
                      <span style={{ fontSize: 13, color: '#9ca3af' }}>
                        {currentPermission === 'all' ? '聊天、朋友圈等' : '仅聊天'}
                      </span>
                    </button>
                    <div style={{ marginLeft: 18, height: 1, backgroundColor: '#f3f4f6' }} />
                    <div
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: 15, color: '#111827' }}>
                        我和{taLabel}的共同群聊
                      </span>
                      <span style={{ fontSize: 13, color: '#9ca3af' }}>
                        {mutualGroupCount} 个
                      </span>
                    </div>
                    <div style={{ marginLeft: 18, height: 1, backgroundColor: '#f3f4f6' }} />
                    <div
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: 15, color: '#111827' }}>签名</span>
                      <span style={{ fontSize: 13, color: '#9ca3af', maxWidth: '60%', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {signatureText}
                      </span>
                    </div>
                    <div style={{ marginLeft: 18, height: 1, backgroundColor: '#f3f4f6' }} />
                    <div
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: 15, color: '#111827' }}>添加时间</span>
                      <span style={{ fontSize: 13, color: '#9ca3af' }}>
                        {addedTimeLabel}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }} />
                  <div style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
                    <button
                      type="button"
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: 15, color: '#111827' }}>把他推荐给朋友</span>
                      <span style={{ fontSize: 13, color: '#9ca3af' }}>开发中</span>
                    </button>
                    <div style={{ marginLeft: 18, height: 1, backgroundColor: '#f3f4f6' }} />
                    <div
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: 15, color: '#111827' }}>设为星标朋友</span>
                      <label style={{ position: 'relative', display: 'inline-block', width: 46, height: 26 }}>
                        <input
                          type="checkbox"
                          checked={currentStarred}
                          onChange={(e) => handleUpdateContact({ starred: e.target.checked })}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: currentStarred ? '#111827' : '#d1d5db',
                            borderRadius: 999,
                            transition: '0.2s'
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            left: currentStarred ? 22 : 4,
                            top: 3,
                            width: 20,
                            height: 20,
                            backgroundColor: '#ffffff',
                            borderRadius: '50%',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            transition: '0.2s'
                          }}
                        />
                      </label>
                    </div>
                    <div style={{ marginLeft: 18, height: 1, backgroundColor: '#f3f4f6' }} />
                    <div
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: 15, color: '#111827' }}>加入黑名单</span>
                      <label style={{ position: 'relative', display: 'inline-block', width: 46, height: 26 }}>
                        <input
                          type="checkbox"
                          checked={currentBlocked}
                          onChange={(e) => handleUpdateContact({ blocked: e.target.checked })}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: currentBlocked ? '#111827' : '#d1d5db',
                            borderRadius: 999,
                            transition: '0.2s'
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            left: currentBlocked ? 22 : 4,
                            top: 3,
                            width: 20,
                            height: 20,
                            backgroundColor: '#ffffff',
                            borderRadius: '50%',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            transition: '0.2s'
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }} />
                  <div style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
                    <button
                      type="button"
                      onClick={() => window.alert('投诉功能仅用于展示，暂不支持实际提交。')}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: 15, color: '#111827' }}>投诉</span>
                    </button>
                  </div>

                  <div style={{ marginTop: 32 }} />
                  <button
                    type="button"
                    onClick={handleDeleteContact}
                    style={{
                      margin: '0 0 24px',
                      alignSelf: 'center',
                      padding: '10px 24px',
                      borderRadius: 999,
                      border: 'none',
                      background: 'transparent',
                      color: '#ef4444',
                      fontSize: 16,
                      cursor: 'pointer'
                    }}
                  >
                    删除联系人
                  </button>
                </div>
              );
            })()
            : contactsView === 'permission' && contactsProfileRoleId
              ? (() => {
                // 使用 contactsDataVersion 作为依赖，确保更新后立即重新渲染最新数据
                contactsDataVersion;
                const contacts = loadWeChatContacts();
                const roles = loadStoryRoles();
                const contact = contacts.find(c => c.roleId === contactsProfileRoleId) ?? null;
                const role = roles.find(r => r.id === contactsProfileRoleId) ?? null;
                if (!contact || !role) {
                  return (
                    <div className="wechat-contacts" style={{ paddingBottom: '110px' }}>
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                        未找到该联系人
                      </div>
                    </div>
                  );
                }

                const currentPermission = contact.permission;
                const currentHideMy = !!contact.hideMyMoments;
                const currentHideTheir = !!contact.hideTheirMoments;
                const taLabel = role.gender === 'female' ? '她' : '他';

                const handleUpdateContact = (patch: Partial<WeChatContact>) => {
                  const updated: WeChatContact = {
                    ...contact,
                    ...patch
                  };
                  saveWeChatContact(updated);
                  setContactsDataVersion((v) => v + 1);
                };

                const handleChangePermission = (perm: 'all' | 'chat-only') => {
                  if (perm === currentPermission) return;
                  if (perm === 'chat-only') {
                    handleUpdateContact({
                      permission: 'chat-only',
                      hideMyMoments: undefined,
                      hideTheirMoments: undefined
                    });
                  } else {
                    handleUpdateContact({
                      permission: 'all',
                      hideMyMoments: currentHideMy,
                      hideTheirMoments: currentHideTheir
                    });
                  }
                };

                const disabledToggles = currentPermission !== 'all';

                return (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      backgroundColor: '#f3f4f6'
                    }}
                  >
                    <div style={{ padding: '12px 18px 4px', fontSize: 13, color: '#9ca3af' }}>设置权限</div>
                    <div style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
                      <button
                        type="button"
                        onClick={() => handleChangePermission('all')}
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: 15, color: '#111827' }}>聊天、朋友圈、微信运动等</span>
                        {currentPermission === 'all' && (
                          <svg viewBox="0 0 24 24" width="18" height="18" style={{ color: '#111827' }}>
                            <polyline
                              points="5 13 10 18 19 7"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                      <div style={{ marginLeft: 18, height: 1, backgroundColor: '#f3f4f6' }} />
                      <button
                        type="button"
                        onClick={() => handleChangePermission('chat-only')}
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: 15, color: '#111827' }}>仅聊天</span>
                        {currentPermission === 'chat-only' && (
                          <svg viewBox="0 0 24 24" width="18" height="18" style={{ color: '#111827' }}>
                            <polyline
                              points="5 13 10 18 19 7"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    </div>

                    {currentPermission === 'chat-only' && (
                      <div style={{ padding: '10px 18px', fontSize: 13, color: '#9ca3af' }}>
                        对方看不到你的朋友圈、状态、微信运动等
                      </div>
                    )}

                    {currentPermission === 'all' && (
                      <>
                        <div style={{ padding: '12px 18px 4px', fontSize: 13, color: '#9ca3af' }}>朋友圈和状态</div>
                        <div style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
                          <div
                            style={{
                              width: '100%',
                              padding: '14px 18px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span style={{ fontSize: 15, color: '#111827' }}>不让{taLabel}看</span>
                            <label style={{ position: 'relative', display: 'inline-block', width: 46, height: 26 }}>
                              <input
                                type="checkbox"
                                checked={currentHideMy}
                                onChange={(e) =>
                                  handleUpdateContact({
                                    hideMyMoments: e.target.checked
                                  })
                                }
                                style={{ opacity: 0, width: 0, height: 0 }}
                              />
                              <span
                                style={{
                                  position: 'absolute',
                                  cursor: 'pointer',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: currentHideMy ? '#111827' : '#d1d5db',
                                  borderRadius: 999,
                                  transition: '0.2s'
                                }}
                              />
                              <span
                                style={{
                                  position: 'absolute',
                                  left: currentHideMy ? 22 : 4,
                                  top: 3,
                                  width: 20,
                                  height: 20,
                                  backgroundColor: '#ffffff',
                                  borderRadius: '50%',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                  transition: '0.2s'
                                }}
                              />
                            </label>
                          </div>
                          <div style={{ marginLeft: 18, height: 1, backgroundColor: '#f3f4f6' }} />
                          <div
                            style={{
                              width: '100%',
                              padding: '14px 18px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span style={{ fontSize: 15, color: '#111827' }}>不看{taLabel}</span>
                            <label style={{ position: 'relative', display: 'inline-block', width: 46, height: 26 }}>
                              <input
                                type="checkbox"
                                checked={currentHideTheir}
                                onChange={(e) =>
                                  handleUpdateContact({
                                    hideTheirMoments: e.target.checked
                                  })
                                }
                                style={{ opacity: 0, width: 0, height: 0 }}
                              />
                              <span
                                style={{
                                  position: 'absolute',
                                  cursor: 'pointer',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: currentHideTheir ? '#111827' : '#d1d5db',
                                  borderRadius: 999,
                                  transition: '0.2s'
                                }}
                              />
                              <span
                                style={{
                                  position: 'absolute',
                                  left: currentHideTheir ? 22 : 4,
                                  top: 3,
                                  width: 20,
                                  height: 20,
                                  backgroundColor: '#ffffff',
                                  borderRadius: '50%',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                  transition: '0.2s'
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()
              : (
                <div className="wechat-contacts" style={{ paddingBottom: '110px' }}>
                  <div className="wechat-contacts-cards">
                    <button
                      type="button"
                      className="wechat-contacts-card"
                      onClick={() => {
                        setCreateRoleStep('role');
                        setPlayerIdentityForCreate(loadPlayerIdentity());
                        setShowCreateRole(true);
                      }}
                    >
                      <div className="wechat-contacts-icon">
                        <svg viewBox="0 0 24 24" width="40" height="40">
                          <circle
                            cx="9"
                            cy="9"
                            r="3"
                            fill="none"
                            stroke="#111827"
                            strokeWidth="1.4"
                          />
                          <path
                            d="M5.5 16C6.3 14.7 7.6 14 9 14C10.4 14 11.7 14.7 12.5 16"
                            fill="none"
                            stroke="#111827"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                          />
                          <circle cx="16" cy="8" r="1.1" fill="#111827" />
                          <path
                            d="M16 5.8V10.2"
                            stroke="#111827"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                          />
                          <path
                            d="M13.8 8H18.2"
                            stroke="#111827"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <span>新的朋友</span>
                    </button>
                    <button type="button" className="wechat-contacts-card">
                      <div className="wechat-contacts-icon">
                        <svg viewBox="0 0 24 24" width="40" height="40">
                          <path
                            d="M6 7.5C6 6.39543 6.89543 5.5 8 5.5H16C17.1046 5.5 18 6.39543 18 7.5V12C18 13.1046 17.1046 14 16 14H11L8 16.5V14H8C6.89543 14 6 13.1046 6 12V7.5Z"
                            fill="none"
                            stroke="#111827"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="10" cy="9.5" r="0.9" fill="#111827" />
                          <circle cx="14" cy="9.5" r="0.9" fill="#111827" />
                        </svg>
                      </div>
                      <span>仅聊天的朋友</span>
                    </button>
                    <button type="button" className="wechat-contacts-card">
                      <div className="wechat-contacts-icon">
                        <svg viewBox="0 0 24 24" width="36" height="36">
                          <circle
                            cx="12"
                            cy="11.2"
                            r="2.6"
                            fill="none"
                            stroke="#111827"
                            strokeWidth="1.4"
                          />
                          <circle
                            cx="7.2"
                            cy="9"
                            r="2.1"
                            fill="none"
                            stroke="#111827"
                            strokeWidth="1.3"
                          />
                          <circle
                            cx="16.8"
                            cy="9"
                            r="2.1"
                            fill="none"
                            stroke="#111827"
                            strokeWidth="1.3"
                          />
                          <path
                            d="M7.5 16.5C8.5 14.8 10 13.9 12 13.9C14 13.9 15.5 14.8 16.5 16.5"
                            fill="none"
                            stroke="#111827"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                          />
                          <path
                            d="M5.2 12.8C5.9 12 6.8 11.6 7.9 11.6"
                            fill="none"
                            stroke="#111827"
                            strokeWidth="1.1"
                            strokeLinecap="round"
                          />
                          <path
                            d="M16.1 11.6C17.2 11.6 18.1 12 18.8 12.8"
                            fill="none"
                            stroke="#111827"
                            strokeWidth="1.1"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <span>群聊</span>
                    </button>
                    <button type="button" className="wechat-contacts-card">
                      <div className="wechat-contacts-icon">
                        <svg viewBox="0 0 24 24" width="40" height="40">
                          <path
                            d="M6 7C6 6.44772 6.44772 6 7 6H13.5L18 10.5L13.5 15H7C6.44772 15 6 14.5523 6 14V7Z"
                            fill="none"
                            stroke="#111827"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="9.2" cy="10.5" r="1" fill="#111827" />
                        </svg>
                      </div>
                      <span>标签</span>
                    </button>
                  </div>

                  <div className="wechat-contacts-list">
                    {contactsList.length === 0 ? (
                      <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: '#999',
                        fontSize: '14px'
                      }}>
                        暂无好友，点击上方"新的朋友"添加好友
                      </div>
                    ) : (
                      contactsList.map((section) => (
                        <div key={section.letter} className="wechat-contacts-section">
                          <div className="wechat-contacts-letter">{section.letter}</div>
                          {section.contacts.map(({ contact, role }) => {
                            const displayName = contact.remark || role.wechatNickname || role.name;
                            return (
                              <button
                                key={contact.roleId}
                                type="button"
                                className="wechat-contacts-item"
                                onClick={() => {
                                  setContactsProfileRoleId(contact.roleId);
                                  setContactsView('profile');
                                }}
                              >
                                <div className="wechat-contacts-avatar">
                                  {role.avatarUrl ? (
                                    <img src={role.avatarUrl} alt={displayName} />
                                  ) : (
                                    <span>{displayName.charAt(0)}</span>
                                  )}
                                </div>
                                <span className="wechat-contacts-name">
                                  {displayName}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
      ) : activeTab === 'discover' ? (
        discoverView === 'list' ? (
          <div className="wechat-discover" style={{ paddingBottom: '110px' }}>
            <button
              type="button"
              className="wechat-discover-card"
              onClick={() => setDiscoverView('moments')}
            >
              <div className="wechat-discover-icon">
                <svg viewBox="0 0 24 24" width="32" height="32">
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    fill="none"
                    stroke="#111827"
                    strokeWidth="1.4"
                  />
                  <circle cx="12" cy="12" r="1.2" fill="#111827" />
                  <path
                    d="M12 5.5V4"
                    stroke="#111827"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M17 7L18.2 5.8"
                    stroke="#111827"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18.5 12H20"
                    stroke="#111827"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M17 17L18.2 18.2"
                    stroke="#111827"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 18.5V20"
                    stroke="#111827"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7 17L5.8 18.2"
                    stroke="#111827"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M5.5 12H4"
                    stroke="#111827"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7 7L5.8 5.8"
                    stroke="#111827"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="wechat-discover-text">朋友圈</span>
            </button>

            <button type="button" className="wechat-discover-card">
              <div className="wechat-discover-icon">
                <svg viewBox="0 0 24 24" width="32" height="32">
                  <path
                    d="M7 16.5V11.5C7 8.5 8.8 6 12 6C15.2 6 17 8.5 17 11.5V16.5"
                    fill="none"
                    stroke="#111827"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M5.5 16.5C4.7 16.5 4 15.8 4 15V14C4 13.2 4.7 12.5 5.5 12.5"
                    fill="none"
                    stroke="#111827"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18.5 16.5C19.3 16.5 20 15.8 20 15V14C20 13.2 19.3 12.5 18.5 12.5"
                    fill="none"
                    stroke="#111827"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="17.5" r="1" fill="#111827" />
                  <circle cx="14" cy="17.5" r="1" fill="#111827" />
                </svg>
              </div>
              <span className="wechat-discover-text">听一听</span>
            </button>
          </div>
        ) : (
          <div className="wechat-moments">
            <div className="wechat-moments-hero">
              <div className="wechat-moments-bg" />
              <div className="wechat-moments-hero-name">微信昵称</div>
              <div className="wechat-moments-hero-avatar">
                <span>A</span>
              </div>
            </div>

            <div
              ref={momentsListRef}
              className="wechat-moments-list"
              onScroll={handleMomentsScroll}
            >
              <div className="wechat-moment-item">
                <div className="wechat-moment-avatar">
                  <span>友</span>
                </div>
                <div className="wechat-moment-main">
                  <div className="wechat-moment-name">朋友一号</div>
                  <div className="wechat-moment-text">
                    今天在用 AI 打造一个属于自己的小手机系统，感觉还挺有趣的。
                  </div>
                  <div className="wechat-moment-image-row">
                    <div className="wechat-moment-image" />
                    <div className="wechat-moment-image" />
                    <div className="wechat-moment-image" />
                  </div>
                  <div className="wechat-moment-meta">
                    <span className="wechat-moment-time">1 分钟前</span>
                    <span className="wechat-moment-actions">···</span>
                  </div>
                </div>
              </div>

              <div className="wechat-moment-item">
                <div className="wechat-moment-avatar">
                  <span>B</span>
                </div>
                <div className="wechat-moment-main">
                  <div className="wechat-moment-name">产品灵感库</div>
                  <div className="wechat-moment-text">
                    记录一下：极简配色 + 卡片式布局，在小屏幕上看起来真的很舒服。
                  </div>
                  <div className="wechat-moment-meta">
                    <span className="wechat-moment-time">昨天 21:16</span>
                    <span className="wechat-moment-actions">···</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      ) : activeTab === 'story' ? (
        <div className="wechat-story" style={{
          height: '100%',
          overflow: 'auto'
        }}>
          <StoryApp
            onTitleChange={setStoryTitle}
            onHeaderActionsChange={setStoryHeaderActions}
            onNavigateToAddFriend={() => {
              setActiveTab('contacts');
              setShowCreateRole(true);
            }}
            onReadModeChange={setInStoryRead}
            identityEditRoleId={pendingIdentityEditRoleId}
            onIdentityEditRoleHandled={() => setPendingIdentityEditRoleId(null)}
            onExitIdentityFromChat={() => {
              setPendingIdentityEditRoleId(null);
              setActiveTab('chat');
              // 等待 Tab 切回聊天页并完成渲染后，将当前会话滚动到最底部
              setTimeout(() => {
                try {
                  scrollToBottom();
                } catch {
                  // ignore
                }
              }, 50);
            }}
          />
        </div>
      ) : (
        showMeSettings ? (
          meSettingsView === 'profile' ? (
            <div className="wechat-settings">
              <div className="wechat-settings-body wechat-profile-settings-body">
                <div className="wechat-profile-section">
                  <button
                    type="button"
                    className="wechat-profile-row wechat-profile-row-avatar"
                    onClick={() => openMeProfileEditor('avatar')}
                  >
                    <span className="wechat-profile-label">头像</span>
                    <div className="wechat-profile-value">
                      <div className="wechat-profile-avatar-thumb">
                        {playerAvatarUrl ? (
                          <img src={playerAvatarUrl} alt={playerWechatNickname} />
                        ) : (
                          <span>{playerAvatarText}</span>
                        )}
                      </div>
                      <span className="wechat-settings-item-arrow">›</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="wechat-profile-row"
                    onClick={() => openMeProfileEditor('name')}
                  >
                    <span className="wechat-profile-label">名字</span>
                    <div className="wechat-profile-value">
                      <span className="wechat-profile-value-text">
                        {wechatSelfProfile.nickname || '微信昵称'}
                      </span>
                      <span className="wechat-settings-item-arrow">›</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="wechat-profile-row"
                    onClick={() => openMeProfileEditor('gender')}
                  >
                    <span className="wechat-profile-label">性别</span>
                    <div className="wechat-profile-value">
                      <span className="wechat-profile-value-text">
                        {wechatSelfProfile.gender === 'male'
                          ? '男'
                          : wechatSelfProfile.gender === 'female'
                            ? '女'
                            : '保密'}
                      </span>
                      <span className="wechat-settings-item-arrow">›</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="wechat-profile-row"
                    onClick={() => openMeProfileEditor('region')}
                  >
                    <span className="wechat-profile-label">地区</span>
                    <div className="wechat-profile-value">
                      <span className="wechat-profile-value-text">
                        {wechatSelfProfile.region || '未设置'}
                      </span>
                      <span className="wechat-settings-item-arrow">›</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="wechat-profile-row"
                    onClick={() => openMeProfileEditor('wechatId')}
                  >
                    <span className="wechat-profile-label">微信号</span>
                    <div className="wechat-profile-value">
                      <span className="wechat-profile-value-text">
                        {wechatSelfProfile.wechatId || 'example_id'}
                      </span>
                    </div>
                  </button>
                </div>

                <div className="wechat-profile-section">
                  <button
                    type="button"
                    className="wechat-profile-row"
                    onClick={() => openMeProfileEditor('poke')}
                  >
                    <span className="wechat-profile-label">拍一拍</span>
                    <div className="wechat-profile-value">
                      <span className="wechat-profile-value-text">
                        {wechatSelfProfile.pokeText || '拍一拍会出现这里的文案'}
                      </span>
                      <span className="wechat-settings-item-arrow">›</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="wechat-profile-row"
                    onClick={() => openMeProfileEditor('intro')}
                  >
                    <span className="wechat-profile-label">签名</span>
                    <div className="wechat-profile-value">
                      <span className="wechat-profile-value-text">
                        {wechatSelfProfile.intro || '这个人很懒，还没有写签名'}
                      </span>
                      <span className="wechat-settings-item-arrow">›</span>
                    </div>
                  </button>
                </div>

                <div className="wechat-profile-section">
                  <button type="button" className="wechat-profile-row">
                    <span className="wechat-profile-label">来电铃声</span>
                    <div className="wechat-profile-value">
                      <span className="wechat-profile-value-text">背景声音</span>
                      <span className="wechat-settings-item-arrow">›</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : meSettingsView === 'storage' ? (
            <div className="wechat-settings">
              <div className="wechat-settings-header">
                <button
                  type="button"
                  className="wechat-settings-back"
                  onClick={() => setMeSettingsView('list')}
                >
                  ‹
                </button>
                <div className="wechat-settings-title">存储空间</div>
              </div>
              <div className="wechat-settings-body">
                <div className="wechat-settings-section">
                  <div style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                    共{' '}
                    {chatMemoryOverview.reduce(
                      (sum, item) => sum + item.snapshotCount,
                      0
                    )}{' '}
                    条对话记忆快照，按每个角色会话分别存储，只会在对应聊天中被读取。
                  </div>
                  {chatMemoryOverview.length === 0 ? (
                    <div style={{ padding: '12px 16px', fontSize: 14, color: '#9ca3af' }}>
                      当前没有任何已保存的对话记忆。
                    </div>
                  ) : (
                    chatMemoryOverview.map((item) => (
                      <button
                        key={item.chatId}
                        type="button"
                        className="wechat-settings-item"
                        onClick={() => handleClearChatMemoryByChatId(item.chatId)}
                      >
                        <span>
                          {item.roleName || '未知会话'}
                          <span
                            style={{
                              display: 'block',
                              fontSize: 12,
                              color: '#6b7280',
                              marginTop: 2
                            }}
                          >
                            记忆快照：{item.snapshotCount} 条 · 最近更新：{item.lastUpdatedAt}
                          </span>
                        </span>
                        <span style={{ fontSize: 13, color: '#ef4444' }}>清空</span>
                      </button>
                    ))
                  )}
                </div>
                {chatMemoryOverview.length > 0 && (
                  <div className="wechat-settings-section">
                    <button
                      type="button"
                      className="wechat-settings-item"
                      onClick={handleClearAllChatMemories}
                    >
                      <span style={{ color: '#b91c1c' }}>清空所有聊天记忆</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : meSettingsView === 'notifications' ? (
            <div className="wechat-settings">
              <div className="wechat-settings-header">
                <button
                  type="button"
                  className="wechat-settings-back"
                  onClick={() => setMeSettingsView('list')}
                >
                  ‹
                </button>
                <div className="wechat-settings-title">新消息通知</div>
              </div>
              <div className="wechat-settings-body">
                <div className="wechat-settings-section">
                  <div className="wechat-settings-item">
                    <span>后台推送消息</span>
                    <label className="wechat-friend-request-switch" style={{ marginLeft: 'auto' }}>
                      <input
                        type="checkbox"
                        checked={pushEnabled}
                        disabled={!pushSupported || pushBusy}
                        onChange={async (e) => {
                          if (pushBusy) return;
                          setPushBusy(true);
                          setPushMessage(null);
                          try {
                            if (e.target.checked) {
                              const result = await enablePush();
                              setPushEnabled(result.ok);
                              setPushMessage(result.message);
                            } else {
                              const result = await disablePush();
                              if (result.ok) {
                                setPushEnabled(false);
                              }
                              setPushMessage(result.message);
                            }
                          } finally {
                            setPushBusy(false);
                          }
                        }}
                      />
                      <span className="wechat-friend-request-switch-slider" />
                    </label>
                  </div>
                </div>

                <div style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                  {!pushSupported && (
                    <div style={{ marginBottom: 8 }}>
                      当前浏览器不支持 Web Push。建议使用最新版桌面 Chrome / Edge，或在支持通知的手机浏览器中以
                      「添加到主屏幕」的方式打开小手机。
                    </div>
                  )}
                  <div>
                    开启后，即使你切到别的标签页或把浏览器缩到后台，只要浏览器还在运行，就可以收到来自小手机的系统通知。
                    记得在浏览器和系统设置中都允许「通知」权限。
                  </div>
                  {pushMessage && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#4b5563' }}>{pushMessage}</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="wechat-settings">
              <div className="wechat-settings-body">
                <div className="wechat-settings-section">
                  <button
                    type="button"
                    className="wechat-settings-item"
                    onClick={() => setMeSettingsView('profile')}
                  >
                    <span>个人资料</span>
                    <span className="wechat-settings-item-arrow">›</span>
                  </button>
                  <button type="button" className="wechat-settings-item">
                    <span>聊天背景</span>
                    <span className="wechat-settings-item-arrow">›</span>
                  </button>
                  <button type="button" className="wechat-settings-item">
                    <span>朋友权限</span>
                    <span className="wechat-settings-item-arrow">›</span>
                  </button>
                </div>

                <div className="wechat-settings-section">
                  <button
                    type="button"
                    className="wechat-settings-item"
                    onClick={() => setMeSettingsView('notifications')}
                  >
                    <span>通知</span>
                    <span className="wechat-settings-item-arrow">›</span>
                  </button>
                </div>

                <div className="wechat-settings-section">
                  <button type="button" className="wechat-settings-item">
                    <span>聊天记录管理</span>
                    <span className="wechat-settings-item-arrow">›</span>
                  </button>
                  <button
                    type="button"
                    className="wechat-settings-item"
                    onClick={() => setMeSettingsView('storage')}
                  >
                    <span>存储空间</span>
                    <span className="wechat-settings-item-arrow">›</span>
                  </button>
                </div>

                <div className="wechat-settings-section">
                  <button type="button" className="wechat-settings-item">
                    <span>自动总结聊天记忆</span>
                    <label className="wechat-friend-request-switch" style={{ marginLeft: 'auto' }}>
                      <input
                        type="checkbox"
                        checked={memorySettings.autoSummaryEnabled}
                        onChange={(e) =>
                          setMemorySettings((prev) => ({
                            ...prev,
                            autoSummaryEnabled: e.target.checked
                          }))
                        }
                      />
                      <span className="wechat-friend-request-switch-slider" />
                    </label>
                  </button>
                  {memorySettings.autoSummaryEnabled && (
                    <div
                      style={{
                        padding: '0 16px 12px',
                        fontSize: 13,
                        color: '#6b7280'
                      }}
                    >
                      <div>
                        每
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={memorySettings.summaryInterval}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              // 允许用户把数字暂时删空，等失焦或再次输入时再修正
                              setMemorySettings((prev) => ({
                                ...prev,
                                summaryInterval: prev.summaryInterval
                              }));
                              return;
                            }
                            const raw = parseInt(value, 10);
                            if (Number.isNaN(raw)) {
                              return;
                            }
                            const safe = Math.max(1, Math.min(20, raw));
                            setMemorySettings((prev) => ({
                              ...prev,
                              summaryInterval: safe
                            }));
                          }}
                          onBlur={(e) => {
                            let value = parseInt(e.target.value || '0', 10);
                            if (Number.isNaN(value) || value <= 0) value = 1;
                            const safe = Math.max(1, Math.min(20, value));
                            setMemorySettings((prev) => ({
                              ...prev,
                              summaryInterval: safe
                            }));
                          }}
                          style={{
                            width: 40,
                            margin: '0 6px',
                            padding: '2px 4px',
                            fontSize: 13,
                            textAlign: 'center'
                          }}
                        />
                        轮角色回复后自动生成 1 条对话记忆摘要
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="wechat-me" style={{ paddingBottom: '110px' }}>
            <div className="wechat-me-profile">
              <div className="wechat-me-avatar">
                {playerAvatarUrl ? (
                  <img src={playerAvatarUrl} alt={playerWechatNickname} />
                ) : (
                  <span>{playerAvatarText}</span>
                )}
              </div>
              <div className="wechat-me-info">
                <div className="wechat-me-name">{playerWechatNickname}</div>
                <div className="wechat-me-id">
                  微信号：{wechatSelfProfile.wechatId || 'example_id'}
                </div>
              </div>
            </div>

            <div className="wechat-me-section">
              <button type="button" className="wechat-me-item">
                <div className="wechat-me-item-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <rect
                      x="5"
                      y="7"
                      width="14"
                      height="10"
                      rx="2"
                      fill="none"
                      stroke="#111827"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M5 10H19"
                      stroke="#111827"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <circle cx="16" cy="12.5" r="0.9" fill="#111827" />
                  </svg>
                </div>
                <span className="wechat-me-item-text">钱包</span>
              </button>
            </div>

            <div className="wechat-me-section">
              <button type="button" className="wechat-me-item">
                <div className="wechat-me-item-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path
                      d="M8 5H16C16.5523 5 17 5.44772 17 6V18L12 15.5L7 18V6C7 5.44772 7.44772 5 8 5Z"
                      fill="none"
                      stroke="#111827"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="wechat-me-item-text">收藏</span>
              </button>
              <button type="button" className="wechat-me-item">
                <div className="wechat-me-item-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <circle
                      cx="12"
                      cy="12"
                      r="7"
                      fill="none"
                      stroke="#111827"
                      strokeWidth="1.6"
                    />
                    <circle cx="9.5" cy="10" r="0.8" fill="#111827" />
                    <circle cx="14.5" cy="10" r="0.8" fill="#111827" />
                    <path
                      d="M9.2 14C9.8 14.7 10.8 15.2 12 15.2C13.2 15.2 14.2 14.7 14.8 14"
                      fill="none"
                      stroke="#111827"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span className="wechat-me-item-text">表情包</span>
              </button>
            </div>

            <div className="wechat-me-section">
              <button
                type="button"
                className="wechat-me-item"
                onClick={() => setShowMeSettings(true)}
              >
                <div className="wechat-me-item-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <circle
                      cx="12"
                      cy="12"
                      r="5"
                      fill="none"
                      stroke="#111827"
                      strokeWidth="1.3"
                    />
                    <path
                      d="M12 7V5.5"
                      stroke="#111827"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12 18.5V17"
                      stroke="#111827"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M7 12H5.5"
                      stroke="#111827"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18.5 12H17"
                      stroke="#111827"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M15.5 8.5L16.6 7.4"
                      stroke="#111827"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M7.4 16.6L8.5 15.5"
                      stroke="#111827"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M8.5 8.5L7.4 7.4"
                      stroke="#111827"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M16.6 16.6L15.5 15.5"
                      stroke="#111827"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <circle cx="12" cy="12" r="1.2" fill="#111827" />
                  </svg>
                </div>
                <span className="wechat-me-item-text">设置</span>
              </button>
            </div>
          </div>
        )
      )}

      {/* 「我」-个人资料编辑弹层 */}
      {activeTab === 'me' && showMeSettings && meSettingsView === 'profile' && meProfileEditingField && (
        <div className="wechat-profile-edit-overlay">
          <div className="wechat-profile-edit-panel">
            <div className="wechat-profile-edit-header">
              <button
                type="button"
                className="wechat-profile-edit-cancel"
                onClick={() => {
                  setMeProfileEditingField(null);
                  setMeProfileEditText('');
                }}
              >
                取消
              </button>
              <div className="wechat-profile-edit-title">{getMeProfileEditTitle(meProfileEditingField)}</div>
              {meProfileEditingField !== 'gender' && (
                <button
                  type="button"
                  className="wechat-profile-edit-done"
                  onClick={applyMeProfileTextEdit}
                >
                  完成
                </button>
              )}
            </div>

            {meProfileEditingField === 'gender' ? (
              <div className="wechat-profile-edit-gender-group">
                <button
                  type="button"
                  className={`wechat-profile-edit-gender-btn ${wechatSelfProfile.gender === 'male' ? 'active' : ''}`}
                  onClick={() => handleMeProfileGenderSelect('male')}
                >
                  男
                </button>
                <button
                  type="button"
                  className={`wechat-profile-edit-gender-btn ${wechatSelfProfile.gender === 'female' ? 'active' : ''}`}
                  onClick={() => handleMeProfileGenderSelect('female')}
                >
                  女
                </button>
                <button
                  type="button"
                  className={`wechat-profile-edit-gender-btn ${!wechatSelfProfile.gender || wechatSelfProfile.gender === 'other' ? 'active' : ''}`}
                  onClick={() => handleMeProfileGenderSelect('other')}
                >
                  其他
                </button>
              </div>
            ) : (
              <div className="wechat-profile-edit-body">
                {meProfileEditingField === 'avatar' ? (
                  <div className="wechat-profile-edit-avatar">
                    <div className="wechat-profile-edit-avatar-top">
                      <div className="wechat-profile-edit-avatar-preview">
                        {meProfileEditText || playerAvatarUrl ? (
                          <img src={meProfileEditText || playerAvatarUrl} alt="头像预览" />
                        ) : (
                          <span>{playerAvatarText}</span>
                        )}
                      </div>
                      <div className="wechat-profile-edit-avatar-text">
                        可输入图片 URL，或从本地上传图片作为你的微信头像。下面可以写一段头像的文字描述，角色会根据这段描述来理解你的头像长什么样。
                      </div>
                    </div>
                    <div className="wechat-profile-edit-avatar-actions">
                      <input
                        className="wechat-profile-edit-input"
                        value={meProfileEditText}
                        onChange={(e) => setMeProfileEditText(e.target.value)}
                        placeholder="请输入头像图片 URL（可为空，仅用本地上传）"
                      />
                      <label className="wechat-profile-edit-avatar-upload-btn">
                        从本地选择图片
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleMeProfileAvatarFileChange}
                        />
                      </label>
                      <textarea
                        className="wechat-profile-edit-input wechat-profile-edit-textarea"
                        style={{ minHeight: 64 }}
                        value={meProfileAvatarDesc}
                        onChange={(e) => setMeProfileAvatarDesc(e.target.value)}
                        placeholder="用一两句话描述一下头像里是什么（例如：一只在浴室里洗澡的小狗，画风可爱、偏蓝色调）"
                      />
                    </div>
                  </div>
                ) : meProfileEditingField === 'intro' ? (
                  <textarea
                    className="wechat-profile-edit-input wechat-profile-edit-textarea"
                    value={meProfileEditText}
                    onChange={(e) => setMeProfileEditText(e.target.value)}
                    placeholder="填写个性签名"
                  />
                ) : (
                  <input
                    className="wechat-profile-edit-input"
                    value={meProfileEditText}
                    onChange={(e) => setMeProfileEditText(e.target.value)}
                    placeholder="请输入"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 底部导航：聊天页进入具体会话、线下剧情阅读页、联系人资料卡/设置页/权限页、以及「我」页进入设置页时隐藏，其余场景都显示 */}
      {!activeChat &&
        !showCreateRole &&
        !(activeTab === 'story' && inStoryRead) &&
        !(activeTab === 'contacts' && (contactsView === 'profile' || contactsView === 'settings' || contactsView === 'permission')) &&
        !(activeTab === 'me' && showMeSettings) && (
        <div className="wechat-tabs">
          <button
            type="button"
            className={`wechat-tab ${activeTab === 'chat' ? 'wechat-tab-active' : ''}`}
            onClick={() => handleTabChange('chat')}
          >
            <div className="wechat-tab-icon">
              <svg viewBox="0 0 24 24" width="32" height="32">
                <path
                  d="M6 8.5C6 7.11929 7.11929 6 8.5 6H15C16.3807 6 17.5 7.11929 17.5 8.5V12C17.5 13.3807 16.3807 14.5 15 14.5H11.2L8.8 16.5V14.5H8.5C7.11929 14.5 6 13.3807 6 12V8.5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="10" r="0.9" fill="currentColor" />
                <circle cx="13.5" cy="10" r="0.9" fill="currentColor" />
              </svg>
            </div>
            <span>微信</span>
          </button>
          <button
            type="button"
            className={`wechat-tab ${activeTab === 'contacts' ? 'wechat-tab-active' : ''}`}
            onClick={() => handleTabChange('contacts')}
          >
            <div className="wechat-tab-icon">
              <svg viewBox="0 0 24 24" width="32" height="32">
                <rect
                  x="6.5"
                  y="4.5"
                  width="11"
                  height="15"
                  rx="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle
                  cx="11"
                  cy="10"
                  r="1.7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8.8 14C9.4 13 10.2 12.5 11 12.5C11.8 12.5 12.6 13 13.2 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M14.2 8.3H16.2"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M14.2 10.6H16.2"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M14.2 12.9H16.2"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span>通讯录</span>
          </button>
          <button
            type="button"
            className={`wechat-tab ${activeTab === 'discover' ? 'wechat-tab-active' : ''}`}
            onClick={() => handleTabChange('discover')}
          >
            <div className="wechat-tab-icon">
              <svg viewBox="0 0 24 24" width="32" height="32">
                <circle
                  cx="12"
                  cy="12"
                  r="7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M10 10L15 9L14 14L9 15L10 10Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="0.9" fill="currentColor" />
              </svg>
            </div>
            <span>发现</span>
          </button>
          <button
            type="button"
            className="wechat-tab"
            onClick={() => handleTabChange('story')}
          >
            <div className="wechat-tab-icon">
              <svg viewBox="0 0 24 24" width="32" height="32">
                <rect
                  x="6"
                  y="7"
                  width="12"
                  height="9"
                  rx="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M9 7L10 6H14L15 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12H15"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M9 15H12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span>线下</span>
          </button>
          <button
            type="button"
            className={`wechat-tab ${activeTab === 'me' ? 'wechat-tab-active' : ''}`}
            onClick={() => handleTabChange('me')}
          >
            <div className="wechat-tab-icon">
              <svg viewBox="0 0 24 24" width="32" height="32">
                <circle
                  cx="12"
                  cy="10"
                  r="2.6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M7.5 17C8.5 15.3 10.1 14.4 12 14.4C13.9 14.4 15.5 15.3 16.5 17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
              </svg>
            </div>
            <span>我</span>
          </button>
        </div>
      )}

      {/* 自动回复（功能菜单里的“自动回复”）加载提示 */}
      {showAutoReplyLoading && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 120,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(17,24,39,0.9)',
              color: '#f9fafb',
              padding: '8px 14px',
              borderRadius: 999,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 8px 20px rgba(15,23,42,0.4)',
              pointerEvents: 'auto'
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '2px solid rgba(249,250,251,0.5)',
                borderTopColor: '#f9fafb',
                animation: 'wechat-ai-spin 0.9s linear infinite'
              }}
            />
            <span>AI 正在生成推荐回复…</span>
          </div>
        </div>
      )}
    </div>
  );
};


