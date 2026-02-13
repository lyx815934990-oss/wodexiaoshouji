import React from 'react';

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
  worldbooks?: any[];
  wechatNickname?: string;
  wechatSignature?: string;
};

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
  greeting?: string; // 打招呼消息（仅系统消息使用）
  voiceDuration?: number; // 语音消息时长（秒），如果存在则表示这是语音消息
};

const CHAT_MESSAGES_KEY_PREFIX = 'mini-ai-phone.chat-messages-';

// 加载聊天消息
const loadChatMessages = (chatId: string): ChatMessage[] => {
  try {
    const raw = window.localStorage.getItem(`${CHAT_MESSAGES_KEY_PREFIX}${chatId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return [];
  }
};

// 保存聊天消息
const saveChatMessages = (chatId: string, messages: ChatMessage[]) => {
  try {
    window.localStorage.setItem(`${CHAT_MESSAGES_KEY_PREFIX}${chatId}`, JSON.stringify(messages));
  } catch (err) {
    console.error('保存聊天消息失败:', err);
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

type TabId = 'chat' | 'contacts' | 'discover' | 'me';

type DiscoverView = 'list' | 'moments';

type SearchView = 'none' | 'search' | 'result';

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

// 玩家身份（用于获取微信昵称）
type PlayerIdentity = {
  name: string;
  wechatNickname?: string; // 玩家微信昵称
  [key: string]: any;
};

const IDENTITY_KEY = 'mini-ai-phone.player-identity';

const loadPlayerIdentity = (): PlayerIdentity => {
  try {
    const raw = window.localStorage.getItem(IDENTITY_KEY);
    if (!raw) {
      return { name: '' };
    }
    const parsed = JSON.parse(raw) as Partial<PlayerIdentity>;
    return {
      name: parsed.name ?? '',
      wechatNickname: parsed.wechatNickname ?? parsed.name ?? ''
    };
  } catch {
    return { name: '' };
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
};

export const WeChatApp: React.FC<WeChatAppProps> = ({ onExit }) => {
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabId>('chat');
  const [discoverView, setDiscoverView] = React.useState<DiscoverView>('list');
  const [showMomentsTitle, setShowMomentsTitle] = React.useState(false);
  const momentsListRef = React.useRef<HTMLDivElement | null>(null);
  // 聊天消息容器引用
  const chatContainerRef = React.useRef<HTMLDivElement | null>(null);
  
  // 滚动到聊天底部
  const scrollToBottom = React.useCallback(() => {
    if (chatContainerRef.current) {
      // 使用 setTimeout 确保 DOM 更新后再滚动
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, []);
  
  // 搜索相关状态
  const [searchView, setSearchView] = React.useState<SearchView>('none');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResult, setSearchResult] = React.useState<StoryRole | null>(null);
  // 好友申请页面状态
  const [showFriendRequest, setShowFriendRequest] = React.useState(false);
  const [friendRequestRole, setFriendRequestRole] = React.useState<StoryRole | null>(null);
  const [friendRequestGreeting, setFriendRequestGreeting] = React.useState('');
  const [friendRequestRemark, setFriendRequestRemark] = React.useState('');
  const [friendRequestTags, setFriendRequestTags] = React.useState('');
  const [friendRequestPermission, setFriendRequestPermission] = React.useState<'all' | 'chat-only'>('all');
  const [friendRequestHideMyMoments, setFriendRequestHideMyMoments] = React.useState(false);
  const [friendRequestHideTheirMoments, setFriendRequestHideTheirMoments] = React.useState(false);

  // 动态加载聊天列表（包含已添加的好友）
  const [chats, setChats] = React.useState(() => loadWeChatChats());
  // 用于强制重新渲染聊天消息
  const [chatMessagesKey, setChatMessagesKey] = React.useState(0);
  // 输入框文本
  const [inputText, setInputText] = React.useState('');
  // 语音消息弹窗状态
  const [showVoiceModal, setShowVoiceModal] = React.useState(false);
  const [voiceText, setVoiceText] = React.useState('');
  // 展开的语音消息ID
  const [expandedVoiceId, setExpandedVoiceId] = React.useState<string | null>(null);
  
  // 监听联系人变化，更新聊天列表
  React.useEffect(() => {
    const handleStorageChange = () => {
      setChats(loadWeChatChats());
    };
    
    // 监听好友申请通过事件
    const handleFriendRequestAccepted = (event: CustomEvent<{ roleId: string; roleName: string; greeting: string }>) => {
      const { roleId, roleName, greeting } = event.detail;
      console.log('[WeChatApp] 收到好友申请通过事件:', { roleId, roleName, greeting });
      addFriendAcceptedSystemMessage(roleId, roleName, greeting);
      // 如果当前正在查看该聊天，触发重新渲染
      if (activeChatId === `chat-${roleId}`) {
        console.log('[WeChatApp] 当前正在查看该聊天，触发重新渲染');
        setChats(loadWeChatChats());
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
        setChats(loadWeChatChats());
        setChatMessagesKey(prev => prev + 1); // 强制重新渲染消息
      }
    };
    
    // 监听 localStorage 变化
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('friend-request-accepted', handleFriendRequestAccepted as unknown as EventListener);
    window.addEventListener('wechat-messages-updated', handleWeChatMessagesUpdated as unknown as EventListener);
    
    // 定期检查（因为同源页面不会触发 storage 事件）
    // 只更新聊天列表，不强制刷新消息显示（避免频繁滚动）
    const interval = setInterval(() => {
      setChats(loadWeChatChats());
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

  // 发送消息状态
  const [isSending, setIsSending] = React.useState(false);

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

  // 分割长消息为多条短消息（控制每条消息字数）
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
      
      // 如果还没到末尾，尝试在标点符号处分割
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
        }
      }
      
      messages.push(text.slice(currentIndex, endIndex).trim());
      currentIndex = endIndex;
    }

    return messages;
  };

  // 生成AI回复（微信消息，第一人称）
  const generateWeChatReply = async (playerMessages: string[], role: StoryRole): Promise<Array<{ text: string; isVoice: boolean; voiceDuration?: number }>> => {
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

    // 获取玩家身份信息
    const playerIdentity = loadPlayerIdentity();
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
              `**核心要求：回复必须像真人一样自然、有活人感，绝对不能像机器人或AI！**\n\n` +
              `**重要规则：**\n` +
              `1）回复必须是第一人称视角，就像真实的微信聊天一样，使用"我"、"你"等称呼。\n` +
              `2）回复要极其自然、口语化，就像真人在打字聊天，可以有语气词、省略号、表情符号等。\n` +
              `3）每条回复控制在0-50字，保持简短自然。如果内容较长，可以分成多条消息发送。\n` +
              `4）不要一次性发送超长消息，保持微信聊天的节奏感。\n` +
              `5）**必须严格遵守角色设定（世界书内容）**，角色的性格、习惯、说话方式、用词习惯、语气都必须完全符合设定。如果角色是活泼的，就用活泼的语气；如果是高冷的，就用高冷的语气；如果是温柔的，就用温柔的语气。\n` +
              `6）回复要符合当前的好感度阶段，不要过于热情或过于冷淡。\n` +
              `7）如果玩家发送了多条消息，可以综合回复，也可以逐条回应。\n` +
              `8）**活人感要点**：\n` +
              `   - 可以有思考过程，比如"嗯..."、"让我想想"等\n` +
              `   - 可以有情绪表达，比如"哈哈"、"唉"、"emmm"等\n` +
              `   - 可以有省略号、问号、感叹号等标点符号\n` +
              `   - 可以有不完整的句子，就像真人在快速打字\n` +
              `   - 可以有口语化的表达，比如"咋了"、"干嘛"、"咋回事"等\n` +
              `   - 回复要有上下文连贯性，就像真人在看聊天记录后回复\n` +
              `   - 不要用过于正式或书面化的语言\n` +
              `   - 不要用"您好"、"感谢"等过于客套的词汇（除非角色设定如此）\n` +
              `9）**语音消息格式（可选）**：\n` +
              `   - 你可以选择发送语音消息，格式为：说话内容，可以包含声音描述或环境声音\n` +
              `   - 示例："（声音带有一丝委屈）啊..是吗"、"（周围充满了汽车的喇叭声）稍等一下"或直接输出角色说的话\n` +
              `   - 如果使用语音消息格式，请在消息前加上标记 [语音]\n` +
              `   - 语音消息的文本内容应该只包含说话内容和声音相关的描述\n` +
              `10）**关键：线上消息和线下剧情必须互相照应，不能脱节！**\n` +
              `   - 如果线下剧情中角色和玩家正在面对面（比如在同一场景、正在对话），角色可能只是看一眼手机，但不回复线上消息，而是直接在线下剧情中与玩家对话\n` +
              `   - 如果角色正在忙碌、睡觉、开会等场景，可能不回复或延迟回复\n` +
              `   - 如果角色和玩家不在同一场景，角色会正常回复微信消息\n` +
              `   - 回复内容要与线下剧情场景保持一致，不要出现矛盾\n` +
              `   - 如果线下剧情显示角色正在做某事，线上回复也要体现这个状态\n\n` +
              `${worldbookContent ? `【角色设定（世界书）- 必须严格遵守】\n${worldbookContent}\n\n` : ''}` +
              `${playerInfo ? `【玩家信息】\n${playerInfo}\n\n` : ''}` +
              `${recentStoryContext ? `【最近线下剧情场景（重要参考）】\n${recentStoryContext}\n\n**注意：**请根据上述线下剧情场景来决定是否回复微信消息。如果角色和玩家正在面对面，可能不回复或简短回复，而是在线下剧情中直接对话。如果不在同一场景，则正常回复。\n\n` : ''}` +
              `【最近聊天记录】\n${recentMessages || '（暂无聊天记录）'}\n\n` +
              `**记住：你的回复必须像真人在微信上聊天一样自然，有活人感，绝对不能像AI或机器人！同时，线上消息必须与线下剧情场景保持一致，不能脱节！**`
          },
          {
            role: 'user',
            content: `玩家刚刚发送了以下${playerMessages.length}条消息（请综合所有消息的内容和上下文来回复，不要只看最后一条）：\n${playerMessages.map((msg: string, i: number) => `${i + 1}. ${msg}`).join('\n')}\n\n请以${role.wechatNickname || role.name}的身份，用第一人称综合回复这些消息。\n\n**重要：**\n- 回复必须像真人在微信上聊天一样自然，有活人感\n- 严格遵守角色设定（世界书）中的性格、说话方式、用词习惯\n- 回复要简短，控制在0-50字\n- 如果内容较长，可以分成多条消息，每条消息用换行符分隔\n- 可以使用语气词、省略号、表情符号等，让回复更自然\n- 不要用过于正式或书面化的语言\n- 回复要有上下文连贯性，就像真人在看聊天记录后回复\n- **必须综合所有玩家消息的内容来回复，不要只看最后一条消息**\n- **关键：必须参考线下剧情场景！如果线下剧情显示角色和玩家正在面对面（比如在同一场景、正在对话），角色可能只是看一眼手机但不回复，或者简短回复"等会再说"、"见面聊"等，然后直接在线下剧情中与玩家对话。如果角色和玩家不在同一场景，则正常回复微信消息。线上消息和线下剧情必须保持一致，不能脱节！**`
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

    // 将回复分割成多条消息（按换行符或句号分割）
    let replies = text
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

    // 处理语音消息格式
    const processedReplies = replies.map(reply => {
      // 检测是否是语音消息格式
      const isVoiceMessage = reply.startsWith('[语音]') || 
                            reply.includes('（声音') || 
                            reply.includes('(声音') ||
                            reply.includes('（周围') ||
                            reply.includes('(周围');
      
      if (isVoiceMessage) {
        // 移除[语音]标记
        let voiceText = reply.replace(/^\[语音\]\s*/, '');
        
        // 提取纯文本内容用于计算时长（移除声音描述）
        const textContent = voiceText.replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').trim();
        
        // 计算语音时长
        const duration = calculateVoiceDuration(textContent || voiceText);
        
        // 返回语音消息对象
        return {
          text: voiceText,
          voiceDuration: duration,
          isVoice: true
        };
      }
      
      return {
        text: reply,
        isVoice: false
      };
    });

    return processedReplies.length > 0 ? processedReplies : [{ text: text.trim(), isVoice: false }];
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
      const message: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        from: 'self',
        text: msgText,
        time: time
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
    if (contact) {
      const roles = loadStoryRoles();
      const role = roles.find(r => r.id === chatRoleId);
      
      if (role) {
        // 先生成微信回复，然后将回复内容传递给剧情生成，确保一致性
        generateWeChatReply(unprocessedMessages, role)
          .then(async (replies) => {
            // 收集所有回复文本（用于传递给剧情生成）
            const allReplyTexts = replies.map(r => r.text).join('；');
            
            // 逐条添加AI回复，每条消息之间有延迟
            const replyTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            
            for (let i = 0; i < replies.length; i++) {
              const reply = replies[i];
              const replyMessage: ChatMessage = {
                id: `reply-${Date.now()}-${i}-${Math.random()}`,
                from: 'other',
                text: reply.text,
                time: replyTime,
                ...(reply.isVoice && reply.voiceDuration ? { voiceDuration: reply.voiceDuration } : {})
              };

              // 加载当前消息列表并添加新消息
              const currentMessages = loadChatMessages(activeChat.id);
              currentMessages.push(replyMessage);
              saveChatMessages(activeChat.id, currentMessages);
              
              // 触发重新渲染
              setChatMessagesKey(prev => prev + 1);
              
              // 滚动到底部
              scrollToBottom();
              
              console.log(`[WeChatApp] 已显示第${i + 1}条AI回复:`, reply.text, reply.isVoice ? `(语音消息 ${reply.voiceDuration}秒)` : '');
              
              // 如果不是最后一条，等待一段时间再显示下一条（模拟真实聊天）
              if (i < replies.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200)); // 0.8-2秒随机延迟
              }
            }

            console.log('[WeChatApp] 所有AI回复已显示完成');
            
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
          })
          .finally(() => {
            setIsSending(false);
          });
      }
    }
  };

  const handleBack = () => {
    if (showFriendRequest) {
      // 从好友申请页面返回到搜索结果页面
      setShowFriendRequest(false);
      setFriendRequestRole(null);
      setFriendRequestGreeting('');
      setFriendRequestRemark('');
      setFriendRequestTags('');
      setFriendRequestPermission('all');
      setFriendRequestHideMyMoments(false);
      setFriendRequestHideTheirMoments(false);
      return;
    }
    if (searchView === 'result') {
      // 从搜索结果返回到搜索页面
      setSearchView('search');
      setSearchResult(null);
      return;
    }
    if (searchView === 'search') {
      // 从搜索页面返回到通讯录
      setSearchView('none');
      setSearchQuery('');
      setSearchResult(null);
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
    if (onExit) {
      onExit();
    }
  };

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResult(null);
      setSearchView('search');
      return;
    }

    const roles = loadStoryRoles();
    
    // 搜索逻辑：支持手机号（10位数字）或微信号
    let foundRole: StoryRole | null = null;
    let searchSource: 'phone' | 'wechat' = 'wechat';
    
    // 如果是10位数字，按手机号搜索
    if (/^\d{10}$/.test(query)) {
      foundRole = roles.find(role => role.phoneNumber === query) || null;
      searchSource = 'phone';
    } else {
      // 否则按微信号搜索
      foundRole = roles.find(role => role.wechatId && role.wechatId.toLowerCase().includes(query.toLowerCase())) || null;
      searchSource = 'wechat';
    }

    setSearchResult(foundRole);
    setSearchView('result');
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (tab !== 'chat') {
      setActiveChatId(null);
    }
    if (tab !== 'discover') {
      setDiscoverView('list');
      setShowMomentsTitle(false);
    }
  };

  // 发送好友申请
  const handleSendFriendRequest = () => {
    if (!friendRequestRole) return;

    const request: FriendRequest = {
      id: `request-${Date.now()}-${friendRequestRole.id}`,
      roleId: friendRequestRole.id,
      greeting: friendRequestGreeting.trim() || `我是${loadPlayerIdentity().wechatNickname || loadPlayerIdentity().name || '我'}`,
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
    showFriendRequest
      ? '申请添加朋友'
      : searchView === 'result'
        ? '' // 搜索结果页面不显示标题
        : searchView === 'search'
          ? '搜索'
          : activeTab === 'chat'
            ? activeChat?.name ?? '微信'
            : activeTab === 'contacts'
              ? '通讯录'
              : activeTab === 'discover'
                ? discoverView === 'moments'
                  ? showMomentsTitle
                    ? '朋友圈'
                    : ''
                  : '发现'
                : '我';

  const isMoments = activeTab === 'discover' && discoverView === 'moments';

  return (
    <div className={`wechat-app ${isMoments ? 'wechat-app-overlay' : ''}`}>
      <div className={`wechat-header ${isMoments ? 'wechat-header-overlay' : ''}`}>
        <button
          type="button"
          className="wechat-header-back"
          onClick={handleBack}
          aria-label="返回"
        />
        {!showFriendRequest && searchView !== 'result' && <span className="wechat-header-label">{headerTitle}</span>}
        {showFriendRequest && <span className="wechat-header-label">{headerTitle}</span>}
        <div className="wechat-header-right">
          {showFriendRequest ? null : searchView === 'result' ? null : isMoments ? (
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
          ) : activeTab === 'chat' && activeChat ? (
            <button
              type="button"
              className="wechat-header-plus"
              aria-label="更多"
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <circle cx="6" cy="12" r="1.4" fill="currentColor" />
                <circle cx="12" cy="12" r="1.4" fill="currentColor" />
                <circle cx="18" cy="12" r="1.4" fill="currentColor" />
              </svg>
            </button>
          ) : activeTab === 'chat' || activeTab === 'contacts' ? (
            <button
              type="button"
              className="wechat-header-plus"
              aria-label="添加"
              onClick={() => {
                if (activeTab === 'contacts') {
                  setSearchView('search');
                }
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
          ) : null}
        </div>
      </div>

      {searchView === 'search' ? (
        <div className="wechat-search">
          <div className="wechat-search-input-wrapper">
            <div className="wechat-search-icon">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <input
              type="text"
              className="wechat-search-input"
              placeholder="微信号/手机号"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="wechat-search-clear"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResult(null);
                  setSearchView('search');
                }}
              >
                ×
              </button>
            )}
            <button
              type="button"
              className="wechat-search-btn"
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
            >
              搜索
            </button>
          </div>

          {!searchResult && (
            <div className="wechat-search-tips">
              <div className="wechat-search-tip-text">
                支持搜索微信号或手机号（10位数字）
              </div>
            </div>
          )}
        </div>
      ) : showFriendRequest && friendRequestRole ? (
        <div className="wechat-friend-request">
          <div className="wechat-friend-request-info">
            <div className="wechat-friend-request-avatar">
              {friendRequestRole.avatarUrl ? (
                <img src={friendRequestRole.avatarUrl} alt={friendRequestRole.name} />
              ) : (
                <div className="wechat-friend-request-avatar-default">
                  <span>{friendRequestRole.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="wechat-friend-request-name">
              {friendRequestRole.wechatNickname || friendRequestRole.name}
            </div>
          </div>

          <div className="wechat-friend-request-form">
            <div className="wechat-friend-request-item">
              <div className="wechat-friend-request-label">打招呼</div>
              <input
                type="text"
                className="wechat-friend-request-input"
                placeholder="我是XX"
                value={friendRequestGreeting}
                onChange={(e) => setFriendRequestGreeting(e.target.value)}
              />
            </div>

            <div className="wechat-friend-request-item">
              <div className="wechat-friend-request-label">备注</div>
              <input
                type="text"
                className="wechat-friend-request-input"
                placeholder="设置备注名"
                value={friendRequestRemark}
                onChange={(e) => setFriendRequestRemark(e.target.value)}
              />
            </div>

            <div className="wechat-friend-request-item">
              <div className="wechat-friend-request-label">标签</div>
              <input
                type="text"
                className="wechat-friend-request-input"
                placeholder="添加标签"
                value={friendRequestTags}
                onChange={(e) => setFriendRequestTags(e.target.value)}
              />
            </div>

            <div className="wechat-friend-request-item">
              <div className="wechat-friend-request-label">朋友权限</div>
              <div className="wechat-friend-request-radio-group">
                <label className="wechat-friend-request-radio">
                  <input
                    type="radio"
                    name="permission"
                    value="all"
                    checked={friendRequestPermission === 'all'}
                    onChange={() => setFriendRequestPermission('all')}
                  />
                  <span>聊天、朋友圈等</span>
                </label>
                <label className="wechat-friend-request-radio">
                  <input
                    type="radio"
                    name="permission"
                    value="chat-only"
                    checked={friendRequestPermission === 'chat-only'}
                    onChange={() => setFriendRequestPermission('chat-only')}
                  />
                  <span>仅聊天</span>
                </label>
              </div>
            </div>

            {friendRequestPermission === 'all' && (
              <div className="wechat-friend-request-options">
                <div className="wechat-friend-request-option-item">
                  <span>不给ta看我的朋友圈和状态</span>
                  <label className="wechat-friend-request-switch">
                    <input
                      type="checkbox"
                      checked={friendRequestHideMyMoments}
                      onChange={(e) => setFriendRequestHideMyMoments(e.target.checked)}
                    />
                    <span className="wechat-friend-request-switch-slider"></span>
                  </label>
                </div>
                <div className="wechat-friend-request-option-item">
                  <span>不看ta的朋友圈和聊天</span>
                  <label className="wechat-friend-request-switch">
                    <input
                      type="checkbox"
                      checked={friendRequestHideTheirMoments}
                      onChange={(e) => setFriendRequestHideTheirMoments(e.target.checked)}
                    />
                    <span className="wechat-friend-request-switch-slider"></span>
                  </label>
                </div>
              </div>
            )}

            <button
              type="button"
              className="wechat-friend-request-send-btn"
              onClick={handleSendFriendRequest}
            >
              发送
            </button>
          </div>
        </div>
      ) : searchView === 'result' ? (
        <div className="wechat-search">
            <div className="wechat-search-result">
              {searchResult ? (
                <div className="wechat-profile-card">
                  <div className="wechat-profile-header">
                    <div className="wechat-profile-avatar">
                      {searchResult.avatarUrl ? (
                        <img src={searchResult.avatarUrl} alt={searchResult.name} />
                      ) : (
                        <div className="wechat-profile-avatar-default">
                          <span>{searchResult.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="wechat-profile-info-right">
                      <div className="wechat-profile-name-row">
                        <span className="wechat-profile-name">
                          {searchResult.wechatNickname || searchResult.name}
                        </span>
                        {searchResult.gender === 'male' && (
                          <span className="wechat-profile-gender-icon wechat-profile-gender-male">
                            <img 
                              src="./image/微信联系人资料卡性别男.png" 
                              alt="男" 
                              style={{ width: '14px', height: '14px', display: 'block', objectFit: 'contain' }} 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }} 
                            />
                          </span>
                        )}
                        {searchResult.gender === 'female' && (
                          <span className="wechat-profile-gender-icon wechat-profile-gender-female">
                            <img 
                              src="./image/微信联系人资料卡性别女.png" 
                              alt="女" 
                              style={{ width: '14px', height: '14px', display: 'block', objectFit: 'contain' }} 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }} 
                            />
                          </span>
                        )}
                      </div>
                      <div className="wechat-profile-region">地区:中国大陆</div>
                    </div>
                  </div>

                  <div className="wechat-profile-info-section">
                    <div className="wechat-profile-info-header">
                      <span>朋友资料</span>
                      <span className="wechat-profile-info-arrow">›</span>
                    </div>
                    <div className="wechat-profile-info-item">
                      <span className="wechat-profile-info-label">签名</span>
                      <span className="wechat-profile-info-value">
                        {searchResult.wechatSignature || '暂无签名'}
                      </span>
                    </div>
                    <div className="wechat-profile-info-item">
                      <span className="wechat-profile-info-label">来源</span>
                      <span className="wechat-profile-info-value">
                        {/^\d{10}$/.test(searchQuery.trim()) ? '来自手机号搜索' : '来自微信号搜索'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="wechat-profile-add-btn"
                    onClick={() => {
                      // 打开好友申请页面
                      const playerIdentity = loadPlayerIdentity();
                      const defaultGreeting = `我是${playerIdentity.wechatNickname || playerIdentity.name || '我'}`;
                      setFriendRequestGreeting(defaultGreeting);
                      setFriendRequestRole(searchResult);
                      setShowFriendRequest(true);
                    }}
                  >
                    添加到通讯录
                  </button>
                </div>
              ) : (
                <div className="wechat-search-no-result">
                  <div className="wechat-search-no-result-text">
                    未找到该用户
                  </div>
                  <div className="wechat-search-no-result-hint">
                    请检查输入的微信号或手机号是否正确
                  </div>
                </div>
            )}
          </div>
        </div>
      ) : activeTab === 'chat' ? (
        activeChat ? (
          <>
            <div 
              className="wechat-chat"
              ref={chatContainerRef}
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
                    if (!hasTimeHeader && index === 0) {
                      groupedMessages.push({ type: 'time', content: '昨天 19:30' });
                      hasTimeHeader = true;
                    } else if (msg.time !== lastTime && index > 0) {
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
                                  <span>我</span>
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
                              className={`wechat-bubble wechat-bubble-${msg.from}`}
                              style={msg.voiceDuration ? {
                                cursor: 'pointer',
                                userSelect: 'none',
                                width: 'fit-content',
                                maxWidth: '70%'
                              } : {}}
                              onClick={msg.voiceDuration ? () => {
                                setExpandedVoiceId(isExpanded ? null : msg.id);
                              } : undefined}
                            >
                              {msg.voiceDuration ? (
                                // 语音消息样式
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  minWidth: '80px',
                                  padding: '0'
                                }}>
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
                                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" fill="none"/>
                                    <path d="M5 12.55a11 11 0 0 1 14.08 0" fill="none"/>
                                    <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2.5" strokeLinecap="round"/>
                                  </svg>
                                  <span style={{
                                    fontSize: '14px',
                                    fontWeight: '400'
                                  }}>
                                    &quot;{msg.voiceDuration}&quot;
                                  </span>
                                </div>
                              ) : (
                                // 普通文本消息
                                msg.text
                              )}
                            </div>
                            {msg.from === 'self' && (
                              <div className="wechat-avatar wechat-avatar-self">
                                <span>我</span>
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

            <div className="wechat-input-bar">
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
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
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
                className="wechat-input-send"
                title="添加"
                disabled={isSending}
              >
                {isSending ? '...' : '+'}
              </button>
              <button
                type="button"
                className="wechat-input-send-plane"
                onClick={handleSendWithAI}
                disabled={!hasUnprocessedMessages || isSending}
                title={hasUnprocessedMessages ? "生成AI回复和剧情" : "没有未处理的消息"}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>

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
          </>
        ) : (
          <div className="wechat-list">
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
        <div className="wechat-contacts">
          <div className="wechat-contacts-cards">
            <button 
              type="button" 
              className="wechat-contacts-card"
              onClick={() => setSearchView('search')}
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
            {['A', 'B', 'C'].map((letter) => (
              <div key={letter} className="wechat-contacts-section">
                <div className="wechat-contacts-letter">{letter}</div>
                <button type="button" className="wechat-contacts-item">
                  <div className="wechat-contacts-avatar">
                    <span>{letter}</span>
                  </div>
                  <span className="wechat-contacts-name">
                    {letter} 朋友示例
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'discover' ? (
        discoverView === 'list' ? (
          <div className="wechat-discover">
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
      ) : (
        <div className="wechat-me">
          <div className="wechat-me-profile">
            <div className="wechat-me-avatar">
              <span>A</span>
            </div>
            <div className="wechat-me-info">
              <div className="wechat-me-name">微信昵称</div>
              <div className="wechat-me-id">微信号：example_id</div>
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
            <button type="button" className="wechat-me-item">
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
      )}

      {!activeChat && searchView !== 'result' && (
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
    </div>
  );
};


