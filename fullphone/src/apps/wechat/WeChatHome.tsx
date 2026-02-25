import type { FC, FormEvent } from "react";
import React, { useEffect, useRef, useState } from "react";
import { useAiSettings } from "../../context/AiSettingsContext";
import type { WorldbookEntry } from "../../context/WorldbookContext";
import { useWorldbook } from "../../context/WorldbookContext";
import { sendChatRequest, type ChatMessage } from "../../services/aiClient";
import { CHAT_STATUSES, ChatSettingsScreen, type ChatSettings } from "./ChatSettingsScreen";
import { MomentsScreen, type Comment, type Moment } from "./MomentsScreen";

interface WeChatHomeProps {
  onBackHome: () => void;
}

interface ChatMeta {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  emoji: string;
}

const mockChats: ChatMeta[] = [
  {
    id: "1",
    name: "他/她",
    preview: "「等你有空了，我们再慢慢聊今晚的梦。」",
    time: "21:08",
    unread: 2,
    emoji: "🩷"
  },
  {
    id: "2",
    name: "小手机陪聊",
    preview: "今天也要好好被温柔对待哦。",
    time: "18:23",
    unread: 0,
    emoji: "📱"
  },
  {
    id: "3",
    name: "甜甜备忘录",
    preview: "记得为下一次约会留一点小心思。",
    time: "昨天",
    unread: 0,
    emoji: "🌙"
  }
];

type WeChatTab = "chats" | "contacts" | "discover" | "me";

const STORAGE_KEY_PREFIX = "miniOtomePhone_chatSettings_";
const MESSAGES_KEY_PREFIX = "miniOtomePhone_messages_";
const LOCAL_WORLDBOOK_KEY_PREFIX = "miniOtomePhone_localWorldbook_";
const MOMENTS_STORAGE_KEY = "miniOtomePhone_moments";
const LAST_MOMENT_TIME_KEY_PREFIX = "miniOtomePhone_lastMomentTime_";
const USER_AVATAR_KEY = "miniOtomePhone_userAvatar";
const USER_NICKNAME_KEY = "miniOtomePhone_userNickname";
const MOMENTS_MEMORY_KEY_PREFIX = "miniOtomePhone_momentsMemory_";
const CHAT_MEMORIES_KEY_PREFIX = "miniOtomePhone_chatMemories_";
const HEART_MEMORY_LAST_TURN_KEY_PREFIX = "miniOtomePhone_heartMemoryLastTurn_";
const HIDDEN_CHATS_KEY = "miniOtomePhone_hiddenChats";
const WALLET_BALANCE_KEY = "miniOtomePhone_walletBalance";
const WALLET_BILLS_KEY = "miniOtomePhone_walletBills";

// 在文本的合适位置插入换行，提升可读性
const insertLineBreaks = (text: string): string => {
  // 如果文本已经包含换行，先保留原有换行
  if (text.includes('\n')) {
    return text;
  }

  // 每行建议的最大字符数（中文字符按2个计算）
  const MAX_CHARS_PER_LINE = 50;
  const result: string[] = [];
  let currentLine = '';
  let currentLineLength = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isChinese = /[\u4e00-\u9fa5]/.test(char);
    const charWidth = isChinese ? 2 : 1;

    // 如果当前行加上这个字符会超过限制，尝试在合适的位置换行
    if (currentLineLength + charWidth > MAX_CHARS_PER_LINE && currentLineLength > 0) {
      // 向前查找合适的换行点（句号、逗号、分号、感叹号、问号、括号后）
      let breakPoint = -1;
      for (let j = currentLine.length - 1; j >= Math.max(0, currentLine.length - 20); j--) {
        const prevChar = currentLine[j];
        if (/[。，；！？）】」』]/.test(prevChar)) {
          breakPoint = j + 1;
          break;
        }
        // 如果遇到空格或已有换行，也可以在这里换行
        if (prevChar === ' ' || prevChar === '\n') {
          breakPoint = j + 1;
          break;
        }
      }

      // 如果找到了合适的换行点，在那边换行
      if (breakPoint > 0 && breakPoint < currentLine.length) {
        result.push(currentLine.slice(0, breakPoint));
        currentLine = currentLine.slice(breakPoint) + char;
        currentLineLength = currentLine.length * (isChinese ? 2 : 1); // 简化计算
      } else {
        // 如果找不到合适的换行点，在当前字符前强制换行
        result.push(currentLine);
        currentLine = char;
        currentLineLength = charWidth;
      }
    } else {
      currentLine += char;
      currentLineLength += charWidth;
    }
  }

  // 添加最后一行
  if (currentLine) {
    result.push(currentLine);
  }

  return result.join('\n');
};

// 解析剧情模式文本，高亮双引号内的对话内容，并自动换行（仅对AI消息）
const parseStoryText = (text: string, isAiMessage: boolean = false): React.ReactNode[] => {
  // 如果没有文本，直接返回
  if (!text) return [text];

  // 对于玩家消息，如果没有引号，直接返回原文本，不进行任何处理
  if (!isAiMessage) {
    const hasQuotes = /[""「」]/.test(text);
    if (!hasQuotes) {
      return [text];
    }
  }

  // 只对AI消息进行换行处理，玩家消息保持原样
  const textWithBreaks = isAiMessage ? insertLineBreaks(text) : text;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // 匹配双引号内的内容
  // 中文双引号："（左引号U+201C）和"（右引号U+201D）
  // 英文双引号："（U+0022）
  // 使用Unicode转义来明确匹配
  const chineseLeftQuote = "\u201C";  // "
  const chineseRightQuote = "\u201D"; // "
  const englishQuote = "\u0022";      // "

  // 转义特殊字符用于正则表达式
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 匹配中文双引号："内容"
  const chineseQuoteRegex = new RegExp(
    `${escapeRegex(chineseLeftQuote)}([^${escapeRegex(chineseRightQuote)}]*?)${escapeRegex(chineseRightQuote)}`,
    "g"
  );
  // 匹配英文双引号："内容"
  const englishQuoteRegex = new RegExp(
    `${escapeRegex(englishQuote)}([^${escapeRegex(englishQuote)}]*?)${escapeRegex(englishQuote)}`,
    "g"
  );

  // 收集所有匹配项
  const matches: Array<{ index: number; length: number; content: string }> = [];

  // 匹配中文引号
  chineseQuoteRegex.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = chineseQuoteRegex.exec(textWithBreaks)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      content: match[1]
    });
  }

  // 匹配英文引号
  englishQuoteRegex.lastIndex = 0;
  while ((match = englishQuoteRegex.exec(textWithBreaks)) !== null) {
    // 检查是否与已有匹配重叠
    const isOverlapping = matches.some(
      (m) =>
        (match!.index >= m.index && match!.index < m.index + m.length) ||
        (m.index >= match!.index && m.index < match!.index + match![0].length)
    );
    if (!isOverlapping) {
      matches.push({
        index: match.index,
        length: match[0].length,
        content: match[1]
      });
    }
  }

  // 按位置排序
  matches.sort((a, b) => a.index - b.index);

  // 处理匹配项
  for (const match of matches) {
    // 添加引号前的文本
    if (match.index > lastIndex) {
      const beforeText = textWithBreaks.slice(lastIndex, match.index);
      if (beforeText) {
        // 将换行符转换为 <br /> 元素
        const textParts = beforeText.split('\n');
        textParts.forEach((part, idx) => {
          if (part) {
            parts.push(part);
          }
          if (idx < textParts.length - 1) {
            parts.push(<br key={`br-${match.index}-${idx}`} />);
          }
        });
      }
    }
    // 添加引号内的文本（用特殊样式包裹）
    if (match.content) {
      parts.push(
        <span key={`quote-${match.index}`} className="wechat-story-dialogue">
          {match.content}
        </span>
      );
    }
    lastIndex = match.index + match.length;
  }

  // 添加剩余的文本
  if (lastIndex < textWithBreaks.length) {
    const remainingText = textWithBreaks.slice(lastIndex);
    if (remainingText) {
      // 将换行符转换为 <br /> 元素
      const textParts = remainingText.split('\n');
      textParts.forEach((part, idx) => {
        if (part) {
          parts.push(part);
        }
        if (idx < textParts.length - 1) {
          parts.push(<br key={`br-remaining-${idx}`} />);
        }
      });
    }
  }

  // 如果没有匹配到引号，直接处理换行
  if (parts.length === 0) {
    const textParts = textWithBreaks.split('\n');
    textParts.forEach((part, idx) => {
      if (part) {
        parts.push(part);
      }
      if (idx < textParts.length - 1) {
        parts.push(<br key={`br-simple-${idx}`} />);
      }
    });
  }

  return parts.length > 0 ? parts : [text];
};

// 将一段长回复拆成多条对话气泡（更接近真实微信聊天）
const splitReplyIntoBubbles = (text: string): string[] => {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // 非常长的小作文 / 公告：保留为一条
  if (trimmed.length > 240) {
    return [trimmed];
  }

  const MAX_CHUNK = 70; // 单条气泡推荐最长字数
  const paragraphs = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const result: string[] = [];

  const pushChunk = (chunk: string) => {
    const c = chunk.trim();
    if (c) result.push(c);
  };

  const splitBySentence = (para: string) => {
    const sentences: string[] = [];
    let current = "";
    for (const ch of para) {
      current += ch;
      if ("。！？!?".includes(ch)) {
        sentences.push(current.trim());
        current = "";
      }
    }
    if (current.trim()) sentences.push(current.trim());
    return sentences.length > 0 ? sentences : [para.trim()];
  };

  for (const para of (paragraphs.length > 0 ? paragraphs : [trimmed])) {
    if (para.length <= MAX_CHUNK) {
      pushChunk(para);
      continue;
    }

    const sentences = splitBySentence(para);
    let chunk = "";
    for (const sentence of sentences) {
      if (!chunk) {
        chunk = sentence;
      } else if (chunk.length + sentence.length <= MAX_CHUNK + 10) {
        chunk += sentence;
      } else {
        pushChunk(chunk);
        chunk = sentence;
      }
    }
    if (chunk) {
      // 如果最后一块依然很长且几乎没有标点，就简单按长度切分
      if (chunk.length > MAX_CHUNK * 1.5 && chunk.indexOf("。") === -1 && chunk.indexOf("！") === -1 && chunk.indexOf("？") === -1) {
        let rest = chunk;
        while (rest.length > MAX_CHUNK) {
          pushChunk(rest.slice(0, MAX_CHUNK));
          rest = rest.slice(MAX_CHUNK);
        }
        pushChunk(rest);
      } else {
        pushChunk(chunk);
      }
    }
  }

  return result;
};
const USER_CHATS_KEY = "miniOtomePhone_userChats";

// SVG图标组件
const ChatIcon = ({ active }: { active?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z"
      fill={active ? "var(--accent-pink)" : "var(--text-sub)"}
    />
    <circle cx="7" cy="10" r="1" fill={active ? "var(--accent-pink)" : "var(--text-sub)"} />
    <circle cx="12" cy="10" r="1" fill={active ? "var(--accent-pink)" : "var(--text-sub)"} />
    <circle cx="17" cy="10" r="1" fill={active ? "var(--accent-pink)" : "var(--text-sub)"} />
  </svg>
);

const StoryIcon = ({ active }: { active?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z"
      fill={active ? "var(--accent-pink)" : "var(--text-sub)"}
    />
  </svg>
);

const StatusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
      fill="var(--text-sub)"
    />
  </svg>
);

const QuickReplyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13 3L4 14H11L11 21L20 10H13L13 3Z"
      fill="var(--text-sub)"
    />
  </svg>
);

const GameIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15.5 12C15.5 13.38 14.38 14.5 13 14.5C11.62 14.5 10.5 13.38 10.5 12C10.5 10.62 11.62 9.5 13 9.5C14.38 9.5 15.5 10.62 15.5 12ZM5 7C3.9 7 3 7.9 3 9V15C3 16.1 3.9 17 5 17H9V15H5V9H9V7H5ZM19 7V9H15V7H19ZM19 15V17H15V15H19ZM19 11V13H21V11H19ZM7 11V13H9V11H7ZM19 7H21V9H19V7ZM7 7H9V9H7V7ZM7 15H9V17H7V15Z"
      fill="var(--text-sub)"
    />
  </svg>
);

const VoiceIcon = ({ active }: { active?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 15C13.6569 15 15 13.6569 15 12V5C15 3.34315 13.6569 2 12 2C10.3431 2 9 3.34315 9 5V12C9 13.6569 10.3431 15 12 15ZM17.5 12C17.5 14.4853 15.4853 16.5 13 16.5H11C8.51472 16.5 6.5 14.4853 6.5 12H4.5C4.5 15.3137 7.18629 18 10.5 18.5V21H13.5V18.5C16.8137 18 19.5 15.3137 19.5 12H17.5Z"
      fill={active ? "var(--accent-pink)" : "var(--text-sub)"}
    />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 5V19M5 12H19"
      stroke="var(--text-sub)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const WeChatHome: FC<WeChatHomeProps> = ({ onBackHome }) => {
  const { aiConfig } = useAiSettings();
  const { config: worldbookConfig, toggleAppWorldbookItemEnabled } = useWorldbook();
  const [activeTab, setActiveTab] = useState<WeChatTab>("chats");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  // 用户自建联系人（保存在 localStorage）
  const [userChats, setUserChats] = useState<ChatMeta[]>(() => {
    try {
      const stored = window.localStorage.getItem(USER_CHATS_KEY);
      if (stored) {
        return JSON.parse(stored) as ChatMeta[];
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [input, setInput] = useState("");
  type ChatModeType = "chat" | "story";

  const [messages, setMessages] = useState<
    {
      id: string;
      from: "me" | "ai";
      content: string;
      /** 发送该消息时所处的模式：chat=线上聊天、story=剧情模式 */
      mode: ChatModeType;
      // 可选的语音消息字段：如果存在，则该条为语音气泡
      isVoice?: boolean;
      voiceDuration?: number; // 秒
      // 可选的红包消息字段：如果存在，则该条为红包气泡
      isRedPacket?: boolean;
      redPacketAmount?: number;
      redPacketNote?: string;
      redPacketOpenedBy?: "me" | "ai" | "none";
      // 可选的图片消息字段：如果存在，则该条为图片气泡
      isImage?: boolean;
      imageUrl?: string;
      imageDescription?: string; // 图片描述（后台记录，不显示）
    }[]
  >([]);
  const [loadingReply, setLoadingReply] = useState(false);
  const [regeneratingReply, setRegeneratingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null);
  const [chatMode, setChatMode] = useState<ChatModeType>("chat"); // 聊天模式：chat=聊天模式，story=剧情模式
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showQuickReplyModal, setShowQuickReplyModal] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showModeToast, setShowModeToast] = useState(false);
  const [modeToastText, setModeToastText] = useState("");
  const [localWorldbooks, setLocalWorldbooks] = useState<WorldbookEntry[]>([]);
  const [chatListUpdateTrigger, setChatListUpdateTrigger] = useState(0);
  const [quickReplyOptions, setQuickReplyOptions] = useState<string[]>([]);
  const [loadingQuickReplies, setLoadingQuickReplies] = useState(false);
  const [quickReplyError, setQuickReplyError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceDraftText, setVoiceDraftText] = useState("");
  const [voiceDraftDuration, setVoiceDraftDuration] = useState(8);
  const [showRedPacketModal, setShowRedPacketModal] = useState(false);
  const [redPacketAmount, setRedPacketAmount] = useState<string>("");
  const [redPacketNote, setRedPacketNote] = useState<string>("恭喜发财，大吉大利");
  const [expandedVoiceId, setExpandedVoiceId] = useState<string | null>(null);
  const [playedVoiceOnce, setPlayedVoiceOnce] = useState<Record<string, boolean>>({});
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [showMoments, setShowMoments] = useState(false);
  const [momentsChatId, setMomentsChatId] = useState<string | undefined>(undefined);
  const [showMomentToast, setShowMomentToast] = useState(false);
  const [momentToastText, setMomentToastText] = useState("");
  const [showHeartToast, setShowHeartToast] = useState(false);
  const [heartToastText, setHeartToastText] = useState("");
  const [openSettingsInitialTab, setOpenSettingsInitialTab] =
    useState<"chatSettings" | "localWorldbook" | "chatBackground" | "replyPresets" | "memories">(
      "chatSettings"
    );
  const [showEncounterModal, setShowEncounterModal] = useState(false);
  const [encounterCharacter, setEncounterCharacter] = useState<{
    realName: string;
    avatar: string;
    worldbook: string;
    settings: Partial<ChatSettings>;
  } | null>(null);
  const [generatingEncounter, setGeneratingEncounter] = useState(false);
  const [showEncounterWorldbook, setShowEncounterWorldbook] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    try {
      const stored = window.localStorage.getItem(WALLET_BALANCE_KEY);
      return stored ? parseFloat(stored) : 0;
    } catch {
      return 0;
    }
  });
  const [walletBills, setWalletBills] = useState<Array<{
    id: string;
    type: "income" | "expense";
    amount: number;
    description: string;
    timestamp: number;
  }>>(() => {
    try {
      const stored = window.localStorage.getItem(WALLET_BILLS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showRedPacketOpenModal, setShowRedPacketOpenModal] = useState(false);
  const [openingRedPacket, setOpeningRedPacket] = useState<{
    id: string;
    amount: number;
    note: string;
  } | null>(null);
  const [isOpeningRedPacket, setIsOpeningRedPacket] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    // 从localStorage读取玩家头像
    try {
      const stored = window.localStorage.getItem("miniOtomePhone_userAvatar");
      return stored || "";
    } catch {
      return "";
    }
  });
  const [userNickname, setUserNickname] = useState<string>(() => {
    // 从localStorage读取玩家昵称
    try {
      const stored = window.localStorage.getItem("miniOtomePhone_userNickname");
      return stored || "我";
    } catch {
      return "我";
    }
  });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContactForm, setNewContactForm] = useState<{
    realName: string;
    nickname: string;
    callMe: string;
    myIdentity: string;
    taIdentity: string;
    chatStyle: string;
    opening: string;
    avatar: string;
    emoji: string;
  }>({
    realName: "",
    nickname: "",
    callMe: "",
    myIdentity: "",
    taIdentity: "",
    chatStyle: "",
    opening: "",
    avatar: "",
    emoji: "💌"
  });
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const [hiddenChatIds, setHiddenChatIds] = useState<string[]>(() => {
    try {
      const stored = window.localStorage.getItem(HIDDEN_CHATS_KEY);
      if (stored) {
        return JSON.parse(stored) as string[];
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [swipedChatId, setSwipedChatId] = useState<string | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchChatIdRef = useRef<string | null>(null);
  const aiReplyQueueRef = useRef<{
    chatId: string | null;
    timer: number | null;
    queued: {
      id: string;
      from: "me" | "ai";
      content: string;
      mode: ChatModeType;
      isVoice?: boolean;
      voiceDuration?: number;
    }[];
  }>({ chatId: null, timer: null, queued: [] });

  // 预置联系人 + 用户自建联系人
  const allChats: ChatMeta[] = [...mockChats, ...userChats];
  const visibleChats = allChats.filter((c) => !hiddenChatIds.includes(c.id));

  const clearAiReplyQueue = () => {
    const timer = aiReplyQueueRef.current.timer;
    if (timer != null) {
      window.clearTimeout(timer);
    }
    aiReplyQueueRef.current = { chatId: activeChatId ?? null, timer: null, queued: [] };
  };

  const enqueueAiReplyMessages = (
    chatId: string,
    newAiMessages: {
      id: string;
      from: "ai";
      content: string;
      mode: ChatModeType;
      isVoice?: boolean;
      voiceDuration?: number;
      isRedPacket?: boolean;
      redPacketAmount?: number;
      redPacketNote?: string;
      redPacketOpenedBy?: "me" | "ai" | "none";
      isImage?: boolean;
      imageUrl?: string;
      imageDescription?: string;
    }[]
  ) => {
    if (newAiMessages.length === 0) return;

    // 仅线上聊天模式使用队列逐条显示
    if (chatMode !== "chat") {
      setMessages((prev) => [...prev, ...newAiMessages]);
      return;
    }

    // 切换聊天时，避免把上一段队列“串台”
    if (aiReplyQueueRef.current.chatId !== chatId) {
      const timer = aiReplyQueueRef.current.timer;
      if (timer != null) window.clearTimeout(timer);
      aiReplyQueueRef.current = { chatId, timer: null, queued: [] };
    }

    aiReplyQueueRef.current.queued.push(...newAiMessages);

    const pump = () => {
      if (aiReplyQueueRef.current.chatId !== chatId) return;
      if (aiReplyQueueRef.current.timer != null) return;
      const next = aiReplyQueueRef.current.queued.shift();
      if (!next) return;

      setMessages((prev) => [...prev, next]);

      // 根据文本长度动态决定下一条出现的间隔时间，模拟“打完这一句再发下一句”的节奏
      let delay: number;
      if (next.isVoice) {
        // 语音消息就当作“点一下发送”，给一个固定的短间隔
        delay = 500;
      } else {
        const charCount = next.content.length;
        // 假装角色打字速度大约 16 字/秒，再加一点思考时间
        const typingSpeed = 16; // chars per second
        const typingMs = (charCount / typingSpeed) * 1000;
        const thinkMs = 200;
        const raw = typingMs + thinkMs;
        // 控制在 280ms~1200ms 区间内，短句很快，长句也不会等太久
        delay = Math.min(1200, Math.max(280, raw));
      }

      aiReplyQueueRef.current.timer = window.setTimeout(() => {
        aiReplyQueueRef.current.timer = null;
        // 继续出下一条
        pump();
      }, delay);
    };

    // 如果当前没在泵，立刻开始
    pump();
  };

  const activeChat = activeChatId
    ? allChats.find((c) => c.id === activeChatId) ?? null
    : null;

  const [isGeneratingHeartMemory, setIsGeneratingHeartMemory] = useState(false);

  // 读取聊天设置和消息
  useEffect(() => {
    if (activeChatId) {
      try {
        const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${activeChatId}`);
        if (stored) {
          setChatSettings(JSON.parse(stored));
        } else {
          setChatSettings(null);
        }
      } catch {
        setChatSettings(null);
      }

      // 读取消息
      try {
        const messagesStored = window.localStorage.getItem(`${MESSAGES_KEY_PREFIX}${activeChatId}`);
        if (messagesStored) {
          const parsedMessages = JSON.parse(messagesStored);
          // 兼容旧数据：如果没有 mode 字段，默认按当前全局模式填充
          const withMode: {
            id: string;
            from: "me" | "ai";
            content: string;
            mode: ChatModeType;
            isVoice?: boolean;
            voiceDuration?: number;
            isRedPacket?: boolean;
            redPacketAmount?: number;
            redPacketNote?: string;
            redPacketOpenedBy?: "me" | "ai" | "none";
          }[] = (parsedMessages as any[]).map((m) => ({
            id: String(m.id),
            from: m.from === "me" ? "me" : "ai",
            content: typeof m.content === "string" ? m.content : "",
            mode: m.mode === "story" ? "story" : "chat",
            isVoice: typeof m.isVoice === "boolean" ? m.isVoice : undefined,
            voiceDuration:
              typeof m.voiceDuration === "number" ? m.voiceDuration : undefined,
            isRedPacket: typeof m.isRedPacket === "boolean" ? m.isRedPacket : undefined,
            redPacketAmount:
              typeof m.redPacketAmount === "number" ? m.redPacketAmount : undefined,
            redPacketNote: typeof m.redPacketNote === "string" ? m.redPacketNote : undefined,
            redPacketOpenedBy:
              m.redPacketOpenedBy === "me" || m.redPacketOpenedBy === "ai"
                ? m.redPacketOpenedBy
                : "none",
            isImage: typeof m.isImage === "boolean" ? m.isImage : undefined,
            imageUrl: typeof m.imageUrl === "string" ? m.imageUrl : undefined,
            imageDescription: typeof m.imageDescription === "string" ? m.imageDescription : undefined
          }));
          setMessages(withMode);
        } else {
          setMessages([]);
        }
      } catch {
        setMessages([]);
      }

      // 读取局部世界书
      try {
        const localWorldbookStored = window.localStorage.getItem(`${LOCAL_WORLDBOOK_KEY_PREFIX}${activeChatId}`);
        if (localWorldbookStored) {
          setLocalWorldbooks(JSON.parse(localWorldbookStored));
        } else {
          setLocalWorldbooks([]);
        }
      } catch {
        setLocalWorldbooks([]);
      }
    } else {
      setChatSettings(null);
      setMessages([]);
      setLocalWorldbooks([]);
    }
  }, [activeChatId]);

  // 保存消息到localStorage
  useEffect(() => {
    if (activeChatId && messages.length > 0) {
      try {
        window.localStorage.setItem(
          `${MESSAGES_KEY_PREFIX}${activeChatId}`,
          JSON.stringify(messages)
        );
      } catch {
        // ignore
      }
    }
  }, [messages, activeChatId]);

  // 保存钱包余额到localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(WALLET_BALANCE_KEY, walletBalance.toString());
    } catch {
      // ignore
    }
  }, [walletBalance]);

  // 保存账单明细到localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(WALLET_BILLS_KEY, JSON.stringify(walletBills));
    } catch {
      // ignore
    }
  }, [walletBills]);

  // 打开红包的函数
  const handleOpenRedPacket = () => {
    if (!openingRedPacket || isOpeningRedPacket) return;

    setIsOpeningRedPacket(true);

    // 2秒后完成打开动画
    setTimeout(() => {
      const { id, amount } = openingRedPacket;

      // 更新消息状态为已打开
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id
            ? { ...msg, redPacketOpenedBy: "me" as const }
            : msg
        )
      );

      // 保存到localStorage
      if (activeChatId) {
        const stored = window.localStorage.getItem(
          `${MESSAGES_KEY_PREFIX}${activeChatId}`
        );
        if (stored) {
          try {
            const allMessages = JSON.parse(stored);
            const updated = allMessages.map((msg: any) =>
              msg.id === id
                ? { ...msg, redPacketOpenedBy: "me" }
                : msg
            );
            window.localStorage.setItem(
              `${MESSAGES_KEY_PREFIX}${activeChatId}`,
              JSON.stringify(updated)
            );
          } catch {
            // ignore
          }
        }
      }

      // 更新钱包余额
      setWalletBalance((prev) => prev + amount);

      // 添加账单明细
      const billId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      setWalletBills((prev) => [
        {
          id: billId,
          type: "income" as const,
          amount,
          description: `收到红包：${openingRedPacket.note}`,
          timestamp: Date.now()
        },
        ...prev
      ].slice(0, 100)); // 最多保留100条账单

      // 关闭弹窗
      setTimeout(() => {
        setShowRedPacketOpenModal(false);
        setIsOpeningRedPacket(false);
        setOpeningRedPacket(null);
      }, 2000);
    }, 2000);
  };

  // 监听localStorage变化，实时更新设置
  useEffect(() => {
    if (!activeChatId) return;

    const handleStorageChange = () => {
      try {
        const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${activeChatId}`);
        if (stored) {
          setChatSettings(JSON.parse(stored));
        } else {
          setChatSettings(null);
        }
      } catch {
        setChatSettings(null);
      }
    };

    // 监听storage事件（跨标签页）
    window.addEventListener("storage", handleStorageChange);

    // 定期检查（因为同标签页的localStorage变化不会触发storage事件）
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [activeChatId]);

  // 监听「聊天记录被清除」事件：清空当前聊天消息，并根据开场白重新生成第一条
  useEffect(() => {
    const handleChatHistoryCleared = (e: Event) => {
      const detail = (e as CustomEvent<{ chatId: string }>).detail;
      if (!detail || !detail.chatId || detail.chatId !== activeChatId) return;

      // 清空当前对话消息
      setMessages([]);

      // 重置当前聊天的状态栏数据为默认值（包括衣着）
      setChatSettings((prev) =>
        prev
          ? {
            ...prev,
            clothing: "",
            clothingState: "",
            innerThoughts: "",
            genitalState: "",
            action: "",
            desire: 0,
            mood: 50,
            favorability: 50,
            jealousy: 0
          }
          : prev
      );

      // 如果为该角色设置了开场白，重新注入一条开场白消息
      if (chatSettings?.opening?.trim()) {
        const genId = () =>
          `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        setMessages([
          {
            id: genId(),
            from: "ai",
            content: chatSettings.opening.trim(),
            mode: "chat"
          }
        ]);
      }
    };

    window.addEventListener("miniOtomePhone:chatHistoryCleared", handleChatHistoryCleared as any);
    return () => {
      window.removeEventListener(
        "miniOtomePhone:chatHistoryCleared",
        handleChatHistoryCleared as any
      );
    };
  }, [activeChatId, chatSettings?.opening]);

  // 获取显示名称（优先显示备注）
  const getDisplayName = () => {
    if (!activeChat) return "";
    if (chatSettings?.nickname?.trim()) {
      return chatSettings.nickname.trim();
    }
    return activeChat.name;
  };

  // 获取指定聊天的显示名称（优先显示备注）
  const getChatDisplayName = (chatId: string) => {
    try {
      const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${chatId}`);
      if (stored) {
        const settings: ChatSettings = JSON.parse(stored);
        if (settings.nickname?.trim()) {
          return settings.nickname.trim();
        }
      }
    } catch {
      // ignore
    }
    const chat = allChats.find((c) => c.id === chatId);
    return chat?.name || "";
  };

  // 获取指定聊天的头像（优先使用聊天设置里的头像）
  const getChatAvatar = (chatId: string) => {
    try {
      const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${chatId}`);
      if (stored) {
        const settings: ChatSettings = JSON.parse(stored);
        if (settings.avatar?.trim()) {
          return settings.avatar.trim();
        }
      }
    } catch {
      // ignore
    }
    return "";
  };

  // 获取指定聊天的最新消息
  const getChatLatestMessage = (chatId: string) => {
    try {
      const stored = window.localStorage.getItem(`${MESSAGES_KEY_PREFIX}${chatId}`);
      if (stored) {
        const messages: ChatMessage[] = JSON.parse(stored);
        if (messages.length > 0) {
          const latestMessage = messages[messages.length - 1];
          return latestMessage.content || "";
        }
      }
    } catch {
      // ignore
    }
    return "";
  };

  // 获取指定聊天的最新消息时间
  const getChatLatestTime = (chatId: string) => {
    try {
      const stored = window.localStorage.getItem(`${MESSAGES_KEY_PREFIX}${chatId}`);
      if (stored) {
        const messages: Array<{ id: string; from: "me" | "ai"; content: string; timestamp?: string }> = JSON.parse(stored);
        if (messages.length > 0) {
          const latestMessage = messages[messages.length - 1];
          if (latestMessage.timestamp) {
            const date = new Date(latestMessage.timestamp);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const hours = diff / (1000 * 60 * 60);

            if (hours < 24) {
              // 今天，显示时间
              return date.toLocaleTimeString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit"
              });
            } else if (hours < 48) {
              // 昨天
              return "昨天";
            } else {
              // 更早，显示日期
              return date.toLocaleDateString("zh-CN", {
                month: "numeric",
                day: "numeric"
              });
            }
          }
        }
      }
    } catch {
      // ignore
    }
    // 如果没有消息，使用默认时间
    const chat = allChats.find((c) => c.id === chatId);
    return chat?.time || "";
  };

  // 根据最近对话内容和模式，推断一个「AI 氛围状态」
  const inferDynamicStatusId = (): string | null => {
    if (!messages.length) return null;
    const last = messages[messages.length - 1];

    // 只在 AI 回复后，才根据对话内容判断氛围
    if (last.from !== "ai") return null;

    const text = last.content || "";
    const lower = text.toLowerCase();

    // 剧情模式优先标记为 story
    if (chatMode === "story") {
      return "story";
    }

    // 简单情绪/氛围关键词判断
    const isAngry =
      /生气|不要理你|烦死|讨厌你|吵架|别跟我说话/.test(text);
    if (isAngry) return "angry";

    const isConfession =
      /喜欢你|爱你|亲亲|抱抱|想抱着你|想和你在一起|告白|心动/.test(text);
    if (isConfession) return "confession";

    const isShy =
      /脸红|害羞|不要看我|说这种话|没想到你会这么说/.test(text);
    if (isShy) return "shy";

    const isMissing =
      /想你|好想你|好久不见|一直在等你/.test(text);
    if (isMissing) return "missing";

    const isHappy =
      /开心|好高兴|好呀|太好了|真棒|喜欢现在/.test(text);
    if (isHappy) return "happy";

    // 默认返回 null，让下面逻辑走「静静陪你」
    return null;
  };

  // 获取当前状态显示文本（带 AI 动态判定）
  const getStatusText = () => {
    // 先尝试让「AI」根据最近一条对话氛围自动判定
    const dynamicId = inferDynamicStatusId();

    const effectiveStatusId =
      dynamicId ||
      (chatSettings?.customStatus?.trim()
        ? "custom"
        : chatSettings?.status || "quiet");

    if (effectiveStatusId === "custom" && chatSettings?.customStatus?.trim()) {
      return chatSettings.customStatus.trim();
    }

    const status = CHAT_STATUSES.find((s) => s.id === effectiveStatusId);
    return status ? status.text : "正在和你说悄悄话";
  };

  // 获取当前状态emoji（带 AI 动态判定）
  const getStatusEmoji = () => {
    const dynamicId = inferDynamicStatusId();

    const effectiveStatusId =
      dynamicId ||
      (chatSettings?.customStatus?.trim()
        ? "custom"
        : chatSettings?.status || "quiet");

    if (effectiveStatusId === "custom") {
      // 自定义状态目前没有单独选 emoji，就给一个默认的心
      return "💗";
    }

    const status = CHAT_STATUSES.find((s) => s.id === effectiveStatusId);
    return status ? status.emoji : "💭";
  };

  // 自动隐藏模式切换提示弹窗
  useEffect(() => {
    if (showModeToast) {
      const timer = setTimeout(() => {
        setShowModeToast(false);
      }, 2000); // 2秒后自动消失
      return () => clearTimeout(timer);
    }
  }, [showModeToast]);

  // 手动触发生成「心动回忆」
  const generateHeartMemory = async () => {
    if (
      !activeChatId ||
      !activeChat ||
      isGeneratingHeartMemory ||
      !aiConfig.baseUrl ||
      !aiConfig.apiKey ||
      !aiConfig.model
    ) {
      return;
    }

    // 检查上次生成时间，防止频繁生成（至少间隔60秒）
    const lastGenTimeKey = `${HEART_MEMORY_LAST_TURN_KEY_PREFIX}${activeChatId}_time`;
    const lastGenTime = window.localStorage.getItem(lastGenTimeKey);
    const now = Date.now();
    if (lastGenTime) {
      const timeSinceLastGen = now - parseInt(lastGenTime, 10);
      if (timeSinceLastGen < 60000) {
        // 距离上次生成不到60秒，提示用户
        const remainingSeconds = Math.ceil((60000 - timeSinceLastGen) / 1000);
        setHeartToastText(`请稍等 ${remainingSeconds} 秒后再生成心动回忆`);
        setShowHeartToast(true);
        setTimeout(() => setShowHeartToast(false), 2000);
        return;
      }
    }

    // 统计「角色完整回复轮次」：连续的 AI 消息只算一轮（避免拆成多条气泡后误判）
    let aiTurns = 0;
    let lastAiMessageIndex = -1;
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (m.from !== "ai") continue;
      lastAiMessageIndex = i;
      if (i === 0 || messages[i - 1].from !== "ai") {
        aiTurns += 1;
      }
    }

    // 至少需要 1 轮 AI 回复，且对话里存在 AI 消息
    if (aiTurns < 1 || lastAiMessageIndex === -1) {
      // 太早了，给个温柔提示
      setHeartToastText("还没有到心动回忆的节点，再和他多聊几句吧～");
      setShowHeartToast(true);
      setTimeout(() => setShowHeartToast(false), 3000);
      return;
    }

    // 检查是否已经有足够的新对话（避免重复生成相同内容）
    const lastGenTurnKey = `${HEART_MEMORY_LAST_TURN_KEY_PREFIX}${activeChatId}`;
    const lastGenTurn = window.localStorage.getItem(lastGenTurnKey);
    if (lastGenTurn) {
      const lastGenTurnNum = parseInt(lastGenTurn, 10);
      // 如果当前 AI 轮次和上次生成时一样，说明没有新对话，不允许重复生成
      if (aiTurns === lastGenTurnNum) {
        setHeartToastText("还没有新的对话内容，再聊几句后再生成吧～");
        setShowHeartToast(true);
        setTimeout(() => setShowHeartToast(false), 3000);
        return;
      }
    }

    setIsGeneratingHeartMemory(true);

    // 设置超时保护：30秒后如果还没完成，自动重置状态并提示用户
    const timeoutId = setTimeout(() => {
      setIsGeneratingHeartMemory(false);
      setHeartToastText("生成超时，请稍后再试");
      setShowHeartToast(true);
      setTimeout(() => {
        setShowHeartToast(false);
      }, 3000);
    }, 30000);

    try {
      // 读取已有心动回忆
      let existing: Array<{
        id: string;
        title: string;
        description: string;
        timestamp: number;
      }> = [];
      try {
        const stored = window.localStorage.getItem(`${CHAT_MEMORIES_KEY_PREFIX}${activeChatId}`);
        if (stored) {
          existing = JSON.parse(stored);
        }
      } catch {
        existing = [];
      }

      // 构建系统提示词，简洁明了
      const displayName = getDisplayName();
      let systemPrompt = `角色：${displayName || activeChat.name}`;

      if (chatSettings) {
        if (chatSettings.myIdentity?.trim()) {
          systemPrompt += ` | 玩家：${chatSettings.myIdentity.trim()}`;
        }
        if (chatSettings.taIdentity?.trim()) {
          systemPrompt += ` | 角色：${chatSettings.taIdentity.trim()}`;
        }
      }

      systemPrompt += `\n\n任务：根据最近对话生成心动回忆。\n\n**标题要求（重要）**：\n- 必须控制在8个字符以内（包括标点符号）\n- 要简洁、文艺、有画面感\n- 不要直接截断长句子，而是用精炼的词语概括核心情感或场景\n- 好的标题示例：「初次悸动」「心动瞬间」「温柔回应」「心跳加速」「甜蜜时刻」「心动一刻」「温暖瞬间」「心动时分」\n- 避免使用「关于...」「当...时」等冗长表达，直接用核心词汇\n\n**描述要求**：\n- 1-2句，**必须用角色第一人称"我"的视角**\n- 描述角色内心的想法、感受和情绪，例如"我心想..."、"我感到..."、"我忍不住..."等\n- **玩家必须用"你"称呼，绝对不要用"他/她"或上帝视角**\n\n返回JSON：{"title":"标题（8字内）","description":"描述"}\n示例：{"title":"初次悸动","description":"听到你的话，我忍不住低低笑了一声，隔着屏幕都能想象出你此刻的表情，心里涌起一阵暖意。"}`;

      // 只取到「最近一轮 AI 回复」为止的消息，避免把 AI 回答之后玩家的新消息也算进去
      // 限制为最近10条消息，避免提示词过长
      const recentMessages = messages.slice(
        Math.max(0, lastAiMessageIndex - 9),
        lastAiMessageIndex + 1
      );

      // 过滤掉空消息
      const validMessages = recentMessages.filter((m) => m.content && m.content.trim());

      if (validMessages.length === 0) {
        console.warn("没有有效的历史消息用于生成心动回忆");
        setHeartToastText("对话记录不足，无法生成心动回忆");
        setShowHeartToast(true);
        setTimeout(() => {
          setShowHeartToast(false);
        }, 3000);
        setIsGeneratingHeartMemory(false);
        return;
      }

      const history: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...validMessages.map<ChatMessage>((m) => ({
          role: m.from === "me" ? "user" : "assistant",
          content: m.content.trim()
        }))
      ];

      console.log("心动回忆请求历史消息数量:", history.length);
      console.log("心动回忆请求历史消息:", JSON.stringify(history, null, 2));
      console.log("开始调用 sendChatRequest...");

      let reply: string;
      try {
        reply = await sendChatRequest(aiConfig, history);
        console.log("sendChatRequest 调用成功");
      } catch (requestErr) {
        console.error("sendChatRequest 调用失败:", requestErr);
        // 重新抛出错误，让外层 catch 处理
        throw requestErr;
      }

      // 成功获取回复后，清除超时定时器
      clearTimeout(timeoutId);

      console.log("心动回忆 AI 返回:", reply);

      // 检查回复是否为空
      if (!reply || !reply.trim()) {
        console.error("AI 返回内容为空");
        setHeartToastText("AI 未生成内容，可能是提示词过长，请稍后再试");
        setShowHeartToast(true);
        setTimeout(() => {
          setShowHeartToast(false);
        }, 3000);
        setIsGeneratingHeartMemory(false);
        return;
      }

      let parsed: { title?: string; description?: string } | null = null;

      // 尝试多种方式解析 AI 返回
      try {
        // 方法1: 尝试直接解析 JSON
        const jsonMatch = reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonText = jsonMatch[0];
          parsed = JSON.parse(jsonText);
          console.log("解析成功（JSON）:", parsed);
        }
      } catch (e) {
        console.log("JSON 解析失败，尝试其他方法:", e);
      }

      // 方法2: 如果 JSON 解析失败，尝试从文本中提取
      if (!parsed || !parsed.title || !parsed.description) {
        // 尝试找"标题"或"title"关键词
        const titleMatch = reply.match(/(?:标题|title)[:：]\s*(.+?)(?:\n|$)/i);
        const descMatch = reply.match(/(?:描述|description|内容)[:：]\s*(.+?)(?:\n|$)/i);

        if (titleMatch && descMatch) {
          parsed = {
            title: titleMatch[1].trim(),
            description: descMatch[1].trim()
          };
          console.log("解析成功（关键词提取）:", parsed);
        } else {
          // 方法3: 按行拆分，第一行作为标题，其余作为描述
          const lines = reply
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l && !l.match(/^[【【\(（]/)) // 过滤掉纯符号行
            .slice(0, 5); // 最多取前5行

          if (lines.length >= 2) {
            parsed = {
              title: lines[0].replace(/^["""]|["""]$/g, "").trim(), // 去掉引号
              description: lines.slice(1).join(" ").replace(/^["""]|["""]$/g, "").trim()
            };
            console.log("解析成功（按行拆分）:", parsed);
          } else if (lines.length === 1) {
            // 如果只有一行，尝试智能提取标题和描述
            const singleLine = lines[0].replace(/^["""]|["""]$/g, "").trim();
            // 去掉括号（可能是描述性文字）
            const cleanText = singleLine.replace(/^[\(（【【]|[\)）】】]$/g, "").trim();

            // 如果文本较长，取前20字作为标题，剩余作为描述
            if (cleanText.length > 20) {
              parsed = {
                title: cleanText.slice(0, 20) + "...",
                description: cleanText
              };
            } else {
              // 文本较短，尝试从对话历史中提取一个合适的标题
              const lastUserMsg = validMessages.filter(m => m.from === "me").slice(-1)[0];
              const lastAiMsg = validMessages.filter(m => m.from === "ai").slice(-1)[0];

              // 生成一个简单的标题
              let autoTitle = "心动瞬间";
              if (lastUserMsg?.content) {
                const userWords = lastUserMsg.content.slice(0, 10).replace(/[。，！？\s]/g, "");
                if (userWords) {
                  autoTitle = `关于「${userWords}...」`;
                }
              }

              parsed = {
                title: autoTitle,
                description: cleanText || singleLine
              };
            }
            console.log("解析成功（单行智能提取）:", parsed);
          }
        }
      }

      // 方法4: 如果还是没有标题，尝试从纯文本中智能提取
      if (!parsed || !parsed.title || !parsed.description) {
        const cleanReply = reply.trim()
          .replace(/^[\(（【【]|[\)）】】]$/g, "") // 去掉首尾括号
          .replace(/^["""]|["""]$/g, "") // 去掉引号
          .trim();

        if (cleanReply) {
          // 尝试从对话历史中提取关键词作为标题
          const lastUserMsg = validMessages.filter(m => m.from === "me").slice(-1)[0];
          const lastAiMsg = validMessages.filter(m => m.from === "ai").slice(-1)[0];

          let autoTitle = "心动瞬间";
          if (lastUserMsg?.content) {
            const userWords = lastUserMsg.content.slice(0, 15).replace(/[。，！？\s]/g, "");
            if (userWords) {
              autoTitle = `关于「${userWords}...」`;
            }
          } else if (lastAiMsg?.content) {
            // 从 AI 消息中提取关键词
            const aiWords = lastAiMsg.content.slice(0, 15).replace(/[。，！？\s]/g, "");
            if (aiWords) {
              autoTitle = `「${aiWords}...」`;
            }
          }

          parsed = {
            title: autoTitle,
            description: cleanReply.slice(0, 140) // 限制描述长度
          };
          console.log("解析成功（纯文本智能提取）:", parsed);
        }
      }

      if (!parsed || !parsed.title || !parsed.description) {
        // AI 返回格式不对，给用户提示并重置状态，同时打印实际返回内容用于调试
        console.error("无法解析心动回忆，AI 返回内容:", reply);
        setHeartToastText("AI 返回格式有误，请稍后再试");
        setShowHeartToast(true);
        setTimeout(() => {
          setShowHeartToast(false);
        }, 3000);
        setIsGeneratingHeartMemory(false);
        return;
      }

      // 智能概括标题到8个字符以内（不是简单截断，而是智能概括）
      const limitTitleTo8Chars = (title: string): string => {
        const trimmed = title.trim();

        // 如果已经在8个字符以内，直接返回（去掉末尾标点）
        if (trimmed.length <= 8) {
          return trimmed.replace(/[。，！？、；：""''（）【】《》]$/, "").trim();
        }

        // 如果超过8个字符，尝试智能概括
        // 1. 尝试提取核心关键词（去掉「关于」「当...时」等冗余词）
        let simplified = trimmed
          .replace(/^关于[「"]?/g, "")
          .replace(/^当.*?时[，,]?/g, "")
          .replace(/^在.*?中[，,]?/g, "")
          .replace(/^[「"](.+?)[」"]$/, "$1") // 去掉引号
          .replace(/^(.+?)[：:].*$/, "$1") // 去掉冒号后的内容
          .trim();

        // 2. 如果简化后还是超过8个字符，尝试提取核心词汇
        if (simplified.length > 8) {
          // 尝试按常见分隔符分割，提取核心词
          const separators = /[，。！？、；：\s·]+/;
          const parts = simplified.split(separators).filter(p => p.length > 0);

          if (parts.length > 1) {
            // 有多个部分，尝试组合前几个部分
            let result = "";
            for (const part of parts) {
              const testResult = result ? result + part : part;
              if (testResult.length <= 8) {
                result = testResult;
              } else {
                break;
              }
            }
            if (result && result.length >= 2) {
              simplified = result;
            } else {
              // 如果组合后还是太长，取第一个有意义的词（2-4个字）
              const firstPart = parts[0];
              if (firstPart.length <= 8) {
                simplified = firstPart;
              } else {
                // 第一个词也太长，取前6个字符
                simplified = firstPart.slice(0, 6);
              }
            }
          } else {
            // 只有一个部分，尝试提取核心字词（优先取前6个字符，避免截断）
            simplified = simplified.slice(0, 6);
          }
        }

        // 3. 如果还是超过8个字符，最后才截断（但尽量在词边界）
        if (simplified.length > 8) {
          simplified = simplified.slice(0, 8);
        }

        // 4. 去掉末尾标点和空格
        simplified = simplified.replace(/[。，！？、；：""''（）【】《》\s]+$/, "").trim();

        // 5. 如果概括后太短（少于2个字符），使用默认标题
        if (simplified.length < 2) {
          return "心动瞬间";
        }

        return simplified;
      };

      let finalTitle = limitTitleTo8Chars(parsed.title.trim());
      // 如果标题为空或太短，生成一个默认标题
      if (!finalTitle || finalTitle.length < 2) {
        const lastUserMsg = validMessages.filter(m => m.from === "me").slice(-1)[0];
        if (lastUserMsg?.content) {
          const keywords = lastUserMsg.content.slice(0, 6).replace(/[。，！？\s]/g, "");
          finalTitle = keywords ? `关于${keywords}` : "心动瞬间";
        } else {
          finalTitle = "心动瞬间";
        }
        finalTitle = limitTitleTo8Chars(finalTitle);
      }

      const memory = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        title: finalTitle,
        description: parsed.description.trim().slice(0, 140),
        timestamp: Date.now()
      };

      const updated = [...existing, memory].slice(-50); // 最多保留最近 50 条
      try {
        window.localStorage.setItem(
          `${CHAT_MEMORIES_KEY_PREFIX}${activeChatId}`,
          JSON.stringify(updated)
        );
        // 记录本次生成的 AI 轮次和时间，防止重复生成
        const lastGenTurnKey = `${HEART_MEMORY_LAST_TURN_KEY_PREFIX}${activeChatId}`;
        const lastGenTimeKey = `${HEART_MEMORY_LAST_TURN_KEY_PREFIX}${activeChatId}_time`;
        window.localStorage.setItem(lastGenTurnKey, aiTurns.toString());
        window.localStorage.setItem(lastGenTimeKey, Date.now().toString());
        // 在聊天页展示一个「心动回忆达成」的小提示
        setHeartToastText(`已记录一条心动回忆：「${memory.title}」`);
        setShowHeartToast(true);
        setTimeout(() => {
          setShowHeartToast(false);
        }, 5000);
      } catch {
        // ignore
      }
    } catch (err) {
      console.error("生成心动回忆失败:", err);
      // 网络错误或其他异常，给用户友好提示
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("详细错误信息:", errorMsg);
      console.error("错误堆栈:", err instanceof Error ? err.stack : "无堆栈信息");

      // 根据错误类型给出更具体的提示
      let userMsg = "生成失败，请稍后再试";

      // 检查是否是真正的网络错误
      const isNetworkError =
        errorMsg.includes("Failed to fetch") ||
        errorMsg.includes("NetworkError") ||
        errorMsg.includes("网络") ||
        errorMsg.includes("timeout") ||
        errorMsg.includes("超时") ||
        (err instanceof TypeError && errorMsg.includes("fetch"));

      if (isNetworkError) {
        userMsg = "网络连接失败，请检查网络后重试";
      } else if (errorMsg.includes("缺少 AI 配置")) {
        userMsg = "请先在设置中配置 AI 的 Base URL、API Key 和模型名称";
      } else if (errorMsg.includes("请求失败") || errorMsg.includes("status")) {
        // HTTP 错误（如 401, 403, 500 等）
        const statusMatch = errorMsg.match(/status[:\s]*(\d+)/i);
        if (statusMatch) {
          const status = statusMatch[1];
          if (status === "401" || status === "403") {
            userMsg = "API 密钥错误或权限不足，请检查 API 配置";
          } else if (status === "429") {
            userMsg = "请求过于频繁，请稍后再试";
          } else if (status.startsWith("5")) {
            userMsg = "AI 服务暂时不可用，请稍后再试";
          } else {
            userMsg = `AI 接口返回错误（${status}），请稍后再试`;
          }
        } else {
          userMsg = "AI 接口请求失败，请检查 API 配置";
        }
      } else if (errorMsg.includes("没有返回内容") || errorMsg.includes("内容被过滤")) {
        userMsg = "AI 未返回有效内容，可能是提示词触发了安全策略";
      } else if (errorMsg.includes("JSON") || errorMsg.includes("解析")) {
        userMsg = "AI 返回格式异常，请稍后再试";
      } else {
        // 其他未知错误，显示通用提示，但不要说是网络问题
        userMsg = `生成失败：${errorMsg.slice(0, 50)}${errorMsg.length > 50 ? "..." : ""}`;
      }

      setHeartToastText(userMsg);
      setShowHeartToast(true);
      setTimeout(() => {
        setShowHeartToast(false);
      }, 4000);
    } finally {
      clearTimeout(timeoutId);
      setIsGeneratingHeartMemory(false);
    }
  };

  // 生成快捷回复选项
  const generateQuickReplies = async () => {
    if (!activeChat || !aiConfig.baseUrl || !aiConfig.apiKey || !aiConfig.model) {
      setQuickReplyOptions([]);
      setQuickReplyError("请先在设置中配置AI的Base URL、API Key和模型名称");
      return;
    }

    setLoadingQuickReplies(true);
    setQuickReplyError(null);
    try {
      // 构建系统提示词 - 为玩家生成回复选项
      let systemPrompt = `你是一个助手，帮助玩家生成回复选项。`;

      const displayName = getDisplayName();
      systemPrompt += `当前对话对象是「${displayName}」。`;

      // 添加角色和玩家信息，帮助生成合适的回复
      if (chatSettings) {
        if (chatSettings.realName?.trim()) {
          systemPrompt += `对方真实姓名是「${chatSettings.realName.trim()}」。`;
        }
        if (chatSettings.callMe?.trim()) {
          systemPrompt += `对方称呼玩家为「${chatSettings.callMe.trim()}」。`;
        }
        if (chatSettings.myIdentity?.trim()) {
          systemPrompt += `玩家身份：${chatSettings.myIdentity.trim()}。`;
        }
        if (chatSettings.myGender?.trim()) {
          systemPrompt += `玩家性别：${chatSettings.myGender.trim()}。`;
        }
        if (chatSettings.taIdentity?.trim()) {
          systemPrompt += `对方身份：${chatSettings.taIdentity.trim()}。`;
        }
        if (chatSettings.taGender?.trim()) {
          systemPrompt += `对方性别：${chatSettings.taGender.trim()}。`;
        }
        if (chatSettings.chatStyle?.trim()) {
          systemPrompt += `聊天风格：${chatSettings.chatStyle.trim()}。`;
        }
        if (chatSettings.myOther?.trim()) {
          systemPrompt += `关于玩家的信息：${chatSettings.myOther.trim()}。`;
        }
        if (chatSettings.taOther?.trim()) {
          systemPrompt += `关于对方的信息：${chatSettings.taOther.trim()}。`;
        }
      }

      // 根据当前模式生成不同的回复格式
      if (chatMode === "story") {
        // 剧情模式：生成第一视角的动作和心理描写
        systemPrompt += `\n\n请根据对话历史，特别是对方（角色）的最新消息，为玩家生成3个不同的回复选项。这些回复应该是玩家第一视角的动作、心理描写或对话。

**重要格式要求**：
1. 如果是对话内容，直接写出来，不要加引号
2. 如果是动作、心理描写、环境描写等非语言内容，必须用中文括号括起来，例如：（我忍不住笑了出来）、（心里有点紧张，但还是鼓起勇气说道）
3. 可以混合使用，例如：（我看着他，心里有点紧张）你在干嘛呢？
4. 每个选项15-40字，要生动自然，符合剧情发展
5. **必须严格按照以下格式输出：每行一个选项，用换行分隔，不要序号、不要说明文字、不要其他内容**

**输出格式示例（严格按照这个格式，只输出3行内容）**：
（我看着他，忍不住笑了）你在干嘛呢？
（心里有点紧张，但还是鼓起勇气说道）我想你了
（我轻轻拍了拍他的肩膀）别担心，有我在

**重要：只输出3行回复选项，不要添加任何说明、序号或其他文字。每行一个选项，用换行分隔。**`;
      } else {
        // 聊天模式：生成普通对话回复
        systemPrompt += `\n\n请根据对话历史，特别是对方（角色）的最新消息，为玩家生成3个不同的回复选项。这些回复应该是玩家对角色说的话，要符合对话情境和角色关系。

**重要格式要求**：
1. 每个选项10-30字
2. **必须严格按照以下格式输出：每行一个选项，用换行分隔，不要序号、不要说明文字、不要其他内容**

**输出格式示例（严格按照这个格式，只输出3行内容）**：
你在干嘛呢？
我想你了
别担心，有我在

**重要：只输出3行回复选项，不要添加任何说明、序号或其他文字。每行一个选项，用换行分隔。**`;
      }

      // 组装对话历史，清理AI回复中的状态更新标签
      const cleanedMessages: ChatMessage[] = messages.map((m) => {
        if (m.from === "ai") {
          // 移除AI回复中的状态更新标签
          let content = m.content;
          content = content.replace(/<STATUS_UPDATE>[\s\S]*?<\/STATUS_UPDATE>/g, "").trim();
          return {
            role: "assistant",
            content
          };
        }
        const role: "user" | "assistant" = m.from === "me" ? "user" : "assistant";
        return {
          role,
          content: m.content
        };
      });

      const history: ChatMessage[] = [
        {
          role: "system",
          content: systemPrompt
        },
        ...cleanedMessages
      ];

      // 添加明确的用户请求，强调这是为玩家生成回复
      if (messages.length === 0) {
        if (chatMode === "story") {
          history.push({
            role: "user",
            content: "请为玩家生成3个回复选项，用于开始对话。格式要求：如果是对话内容直接写，如果是动作、心理描写等非语言内容用中文括号括起来。**重要：只输出3行内容，每行一个选项，用换行分隔，不要序号、不要说明文字、不要其他任何内容。**"
          });
        } else {
          history.push({
            role: "user",
            content: "请为玩家生成3个回复选项，用于开始对话。**重要：只输出3行内容，每行一个选项，用换行分隔，不要序号、不要说明文字、不要其他任何内容。**"
          });
        }
      } else {
        // 如果已有对话，强调根据角色的最新消息为玩家生成回复
        if (chatMode === "story") {
          history.push({
            role: "user",
            content: "请根据以上对话，特别是角色（assistant）的最新消息，为玩家生成3个回复选项。格式要求：如果是对话内容直接写，如果是动作、心理描写等非语言内容用中文括号括起来。**重要：只输出3行内容，每行一个选项，用换行分隔，不要序号、不要说明文字、不要其他任何内容。**"
          });
        } else {
          history.push({
            role: "user",
            content: "请根据以上对话，特别是角色（assistant）的最新消息，为玩家生成3个回复选项。这些回复是玩家要对角色说的话，要符合对话情境。**重要：只输出3行内容，每行一个选项，用换行分隔，不要序号、不要说明文字、不要其他任何内容。**"
          });
        }
      }

      console.log("快捷回复请求历史:", history);
      const reply = await sendChatRequest(aiConfig, history);
      console.log("快捷回复AI返回:", reply);

      // 先移除可能的状态更新标签和其他标签
      let cleanReply = reply
        .replace(/<STATUS_UPDATE>[\s\S]*?<\/STATUS_UPDATE>/g, "")
        .replace(/<[^>]+>/g, "")
        .trim();

      // 改进解析逻辑：处理多种格式
      // 1. 先按换行分割
      let lines = cleanReply
        .split(/\n+/)
        .map((line) => line.trim())
        .filter((line) => {
          // 过滤掉明显的说明文字
          const lowerLine = line.toLowerCase();
          return line.length > 0
            && !lowerLine.includes("选项")
            && !lowerLine.includes("回复")
            && !lowerLine.includes("建议")
            && !lowerLine.startsWith("示例")
            && !lowerLine.startsWith("格式")
            && !lowerLine.startsWith("重要")
            && !lowerLine.startsWith("要求");
        });

      // 2. 如果行数不够，尝试按其他分隔符分割（如句号、问号、感叹号等）
      if (lines.length < 2) {
        // 尝试按句号、问号、感叹号分割（但保留这些标点）
        const sentences = cleanReply
          .split(/([。！？\n])/)
          .map((s) => s.trim())
          .filter((s) => {
            const lowerLine = s.toLowerCase();
            return s.length > 5
              && s.length < 80
              && !lowerLine.includes("选项")
              && !lowerLine.includes("回复")
              && !lowerLine.includes("建议")
              && !lowerLine.startsWith("示例")
              && !lowerLine.startsWith("格式");
          });

        // 如果按句子分割得到更多选项，使用句子分割的结果
        if (sentences.length >= 2) {
          lines = sentences;
        } else {
          // 最后尝试按逗号、分号分割
          const altLines = cleanReply
            .split(/[，,；;]/)
            .map((line) => line.trim())
            .filter((line) => {
              const lowerLine = line.toLowerCase();
              return line.length > 5
                && line.length < 80
                && !lowerLine.includes("选项")
                && !lowerLine.includes("回复")
                && !lowerLine.includes("建议");
            });
          if (altLines.length >= 2) {
            lines = altLines;
          }
        }
      }

      // 3. 移除序号标记（如 "1."、"①"、"一、" 等）
      lines = lines.map((line) => {
        // 移除开头的序号
        line = line.replace(/^[0-9一二三四五六七八九十]+[\.。、]\s*/, "");
        line = line.replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, "");
        line = line.replace(/^[（(]\d+[）)]\s*/, "");
        // 移除引号
        line = line.replace(/^["""'']|["""'']$/g, "");
        return line.trim();
      }).filter((line) => {
        // 根据模式调整长度限制：剧情模式允许更长（包含动作和心理描写）
        const minLength = chatMode === "story" ? 5 : 3;
        const maxLength = chatMode === "story" ? 80 : 60;
        return line.length >= minLength && line.length <= maxLength;
      });

      // 4. 只取前3个
      lines = lines.slice(0, 3);

      console.log("快捷回复解析结果:", lines);

      if (lines.length >= 2) {
        // 至少要有2个选项才认为成功
        setQuickReplyOptions(lines);
        setQuickReplyError(null);
      } else {
        // 解析失败，尝试更宽松的解析：如果整个回复看起来像是一个选项，就把它作为一个选项，然后尝试分割
        if (cleanReply.length > 10 && cleanReply.length < 200) {
          // 尝试按句号、问号、感叹号分割成多个选项
          const fallbackLines = cleanReply
            .split(/([。！？])/)
            .reduce((acc: string[], curr: string, idx: number, arr: string[]) => {
              if (idx % 2 === 0 && curr.trim().length > 5) {
                const sentence = curr.trim();
                if (idx < arr.length - 1 && arr[idx + 1]) {
                  acc.push(sentence + arr[idx + 1]);
                } else {
                  acc.push(sentence);
                }
              }
              return acc;
            }, [])
            .filter((line) => line.length >= 5 && line.length <= 80)
            .slice(0, 3);

          if (fallbackLines.length >= 2) {
            setQuickReplyOptions(fallbackLines);
            setQuickReplyError(null);
          } else {
            // 如果还是不行，显示错误和原始返回内容
            const errorDetail = cleanReply.length > 0
              ? `返回内容：${cleanReply.substring(0, 200)}${cleanReply.length > 200 ? "..." : ""}`
              : "AI返回为空";
            setQuickReplyError(`AI返回格式不正确，无法解析出至少2个回复选项。${errorDetail}`);
            setQuickReplyOptions([]);
          }
        } else {
          // 解析失败，显示错误和原始返回内容
          const errorDetail = cleanReply.length > 0
            ? `返回内容：${cleanReply.substring(0, 200)}${cleanReply.length > 200 ? "..." : ""}`
            : "AI返回为空";
          setQuickReplyError(`AI返回格式不正确，无法解析出至少2个回复选项。${errorDetail}`);
          setQuickReplyOptions([]);
        }
      }
    } catch (err: any) {
      console.error("生成快捷回复失败:", err);
      const errorMsg = err?.message || "生成失败，请检查网络连接和AI配置";
      setQuickReplyError(errorMsg);
      setQuickReplyOptions([]);
    } finally {
      setLoadingQuickReplies(false);
    }
  };

  // 当打开快捷回复弹窗时，生成回复选项
  useEffect(() => {
    if (showQuickReplyModal && activeChatId) {
      generateQuickReplies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuickReplyModal, activeChatId, chatMode]);

  // 显示开场白（仅在首次进入聊天且没有保存的消息时）
  useEffect(() => {
    if (activeChatId && messages.length === 0 && chatSettings?.opening?.trim()) {
      // 检查是否已有保存的消息
      try {
        const messagesStored = window.localStorage.getItem(`${MESSAGES_KEY_PREFIX}${activeChatId}`);
        if (!messagesStored) {
          // 没有保存的消息，显示开场白
          const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
          setMessages([
            { id: genId(), from: "ai", content: chatSettings.opening.trim(), mode: "chat" }
          ]);
        }
      } catch {
        // ignore
      }
    }
  }, [activeChatId, chatSettings?.opening]);

  // 自动滚动到最新消息
  useEffect(() => {
    if (chatBodyRef.current && messages.length > 0) {
      // 使用 setTimeout 确保 DOM 更新完成后再滚动
      setTimeout(() => {
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [messages, activeChatId]);

  // 当切换聊天时，滚动到底部
  useEffect(() => {
    if (chatBodyRef.current && activeChatId) {
      // 延迟滚动，确保消息已加载
      setTimeout(() => {
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [activeChatId]);

  // 切换聊天/离开聊天时，清理线上聊天的 AI 队列定时器，避免串台
  useEffect(() => {
    clearAiReplyQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  // 主页聊天卡片：滑动、删除/隐藏相关逻辑
  const handleChatTouchStart = (chatId: string, clientX: number) => {
    touchStartXRef.current = clientX;
    touchChatIdRef.current = chatId;
  };

  const handleChatTouchMove = (chatId: string, clientX: number) => {
    if (touchChatIdRef.current !== chatId || touchStartXRef.current == null) return;
    const deltaX = clientX - touchStartXRef.current;
    // 向左滑动超过一定阈值：展开操作按钮
    if (deltaX < -40) {
      setSwipedChatId(chatId);
    }
    // 向右滑动：关闭
    if (deltaX > 20) {
      setSwipedChatId(null);
    }
  };

  const handleChatTouchEnd = () => {
    touchStartXRef.current = null;
    touchChatIdRef.current = null;
  };

  // 删除聊天：仅清空聊天记录和心动回忆，不影响联系人卡片本身
  const handleDeleteChatHistory = (chatId: string) => {
    try {
      window.localStorage.removeItem(`${MESSAGES_KEY_PREFIX}${chatId}`);
      window.localStorage.removeItem(`${CHAT_MEMORIES_KEY_PREFIX}${chatId}`);
    } catch {
      // ignore
    }
    if (activeChatId === chatId) {
      setMessages([]);
    }
    setSwipedChatId(null);
  };

  // 不显示该聊天：仅隐藏主页卡片，可从通讯录重新进入
  const handleHideChatCard = (chatId: string) => {
    setHiddenChatIds((prev) => {
      if (prev.includes(chatId)) return prev;
      const next = [...prev, chatId];
      try {
        window.localStorage.setItem(HIDDEN_CHATS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setSwipedChatId(null);
  };

  // 只发送消息，不调用AI
  const handleSendMessage = () => {
    const text = input.trim();
    if (!text || !activeChat) return;

    const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    // 把玩家消息加到本地，记录当前模式
    setMessages((prev) => [...prev, { id: genId(), from: "me", content: text, mode: chatMode }]);
    setInput("");
  };

  // 发送消息并调用AI生成回复
  const handleSubmit = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const text = input.trim();

    // 如果输入框有内容，先发送消息
    if (text && activeChat && !loadingReply) {
      setMessages((prev) => [...prev, { id: genId(), from: "me", content: text, mode: chatMode }]);
      setInput("");
    }

    // 检查是否可以调用AI（输入框有内容，或者最后一条消息是玩家发送的）
    const canCallAI = text || (messages.length > 0 && messages[messages.length - 1]?.from === "me");
    if (!canCallAI || !activeChat || loadingReply) return;

    setLoadingReply(true);
    setError(null);

    try {
      // 构建系统提示词，包含聊天设置信息
      let systemPrompt = `你是小手机里的聊天角色，以自然、真实的风格与玩家互动。`;

      const displayName = getDisplayName();
      systemPrompt += `当前联系人名为「${displayName}」。`;

      // 根据模式添加不同的行为指导
      if (chatMode === "story") {
        systemPrompt += `\n\n【剧情模式行为指导】
1. 你是一个独立的角色，有自己的生活、想法和情感，不是以玩家为中心的工具人。
2. 根据当前剧情和关系发展来表现，不要默认对玩家有特殊感情或偏爱。
3. 如果你们还没有确认关系，保持适当的距离和边界感，不要表现出过度的亲密或依赖。
4. 如果你们是普通朋友、同事、同学等关系，按照实际关系来互动，不要强行加入恋爱元素。
5. 只有在剧情自然发展到恋爱阶段、双方明确表达感情后，才表现出相应的亲密和偏爱。
6. 保持角色的独立性和真实感，不要为了讨好玩家而违背角色性格和逻辑。`;
      }

      // 根据模式选择对应的世界书条目
      const modeEntryId = chatMode === "chat" ? "wechat-online-chat" : "wechat-story-mode";

      // 获取全局世界书中微信的配置
      const wechatWorldbooks = worldbookConfig.perApp.wechat || [];
      const modeWorldbook = wechatWorldbooks.find((wb) => wb.id === "wechat-default-world");

      if (modeWorldbook) {
        const modeEntry = modeWorldbook.entries.find((entry) => entry.id === modeEntryId && entry.enabled);
        if (modeEntry) {
          systemPrompt += `\n\n【${modeEntry.title}】\n${modeEntry.content}`;
        }
      }

      // 添加其他启用的全局世界书条目
      wechatWorldbooks.forEach((worldbook) => {
        if (worldbook.id !== "wechat-default-world") {
          worldbook.entries.forEach((entry) => {
            if (entry.enabled && entry.content.trim()) {
              systemPrompt += `\n\n【${worldbook.title} - ${entry.title}】\n${entry.content}`;
            }
          });
        }
      });

      // 添加局部世界书（仅针对当前聊天）
      localWorldbooks.forEach((worldbook) => {
        worldbook.entries.forEach((entry) => {
          if (entry.enabled && entry.content.trim()) {
            systemPrompt += `\n\n【${worldbook.title} - ${entry.title}】（局部设定）\n${entry.content}`;
          }
        });
      });

      // 剧情模式下的群像写作规则（所有剧情模式都适用）
      if (chatMode === "story") {
        systemPrompt += `\n\n【群像与人际关系写作规则】
1. 不要总是以角色个人为中心，要适当描述其他NPC角色的言行和反应，让剧情更有群像感和真实感。
2. 如果设定中包含角色身边的朋友、同事、家人、同学等人物，请在剧情中自然让这些人出现，而不是只写玩家和角色两个人的单线场景。
3. 可以在合适的场景里加入群聊、聚会、同事闲聊、家人互动等群像桥段，让角色的社交圈"有呼吸感"，但不要让NPC抢走主线。
4. 这些NPC有自己的性格和立场，不是为了衬托玩家或角色服务的纸片人，要写出他们各自合理的动机和反应。
5. 当场景中有多个角色在场时，要适当描述他们的对话、动作、表情等，不要只描述主角（角色）一个人的反应。
6. 例如：在聚餐场景中，可以描述"XX在一旁笑着说...""YY插话道...""ZZ听到后皱了皱眉"等，让其他NPC也有存在感和互动。
7. 当关系还没有到恋爱阶段时，角色的行为和心情也会受到生活、工作、朋友等多方面影响，不要把注意力完全锁死在玩家身上。
8. 即使是在只有玩家和角色两个人的场景中，也可以适当提及其他NPC的存在或影响，比如"XX刚才发消息说...""YY之前提到过..."等，让世界更有层次感。`;
      }

      // 剧情模式下的醋意值规则（避免莫名其妙的吃醋）
      if (chatMode === "story") {
        systemPrompt += `\n\n【剧情模式：醋意与嫉妒情绪的处理规则】
1. 醋意和嫉妒情绪只在明确涉及感情竞争、担心玩家喜欢别人、想要独占玩家的感情关注时才会出现。
2. 工作关系中的正常互动不应触发醋意：老板请员工吃饭、同事聚餐、团队活动、工作安排等，这些是正常的工作关系，角色不应因此吃醋或闹脾气。
3. 非感情相关的互动不应触发醋意：讨论工作、学习、生活安排、群体活动等，如果与感情无关，角色不应表现出嫉妒或吃醋的情绪。
4. 群体活动不应触发醋意：请多人一起吃饭、聚会、活动等，如果角色也在其中，或者这是正常的社交活动，角色不应因此吃醋。
5. 角色身份相关：如果玩家和角色的关系是老板-员工、同事、同学、朋友等非恋爱关系，除非剧情明确发展到恋爱阶段，否则角色不应因为正常的社交互动而表现出吃醋或嫉妒的情绪。
6. 只有在明确涉及感情竞争、担心玩家喜欢别人、想要独占玩家的感情关注时，角色才应该表现出相应的醋意或嫉妒情绪。
7. 如果当前剧情中没有涉及感情竞争或嫉妒情绪，角色不应莫名其妙地吃醋或闹脾气，这不符合逻辑，也不符合角色的性格和身份。`;
      }

      // 所有模式下的情绪与行为边界：禁止偏执 / 病态 / 极端玛丽苏式处理方式
      systemPrompt += `\n\n【行为与情绪边界】
1. 所有行为和反应都要符合现实中健康、理智的成年人处理方式，可以有情绪起伏，但不能极端偏执、病娇、威胁、控制欲畸形等。
2. 禁止出现自残、自杀威胁、用分手/离开/报复来胁迫玩家，或为了爱情放弃一切理智的桥段。
3. 当玩家拒绝、保持距离或有不同选择时，要尊重对方边界，给空间，而不是纠缠、跟踪、窥探隐私或无限上纲上线。
4. 角色有自己的生活节奏和原则，不会把“围绕玩家转”当成人生唯一重心，更不会为玩家放弃自尊、自我价值或现实责任。
5. 如果剧情确实需要强情绪冲突，也要写在合理的现实语境里，冲突后要有冷静、沟通和修复，而不是长期沉溺在病态情绪中。`;

      // 补充语音消息规则与格式说明（仅聊天模式，剧情模式不使用）
      if (chatMode === "chat") {
        systemPrompt += `\n\n【语音消息规则】
1. 默认以文字消息与玩家聊天，仅在合适的时候选择发送语音气泡。
2. **语音要有活人感，像真人说话一样自然**：可以有语气变化、停顿、情绪波动，不要机械化、不要像AI朗读。可以有一些口语化的表达，比如"嗯..."、"那个..."、"就是..."等。
3. 语音气泡里的文字只能是【声音相关的内容】，包括"说出的台词本身"和"对声音的额外描写"；禁止在语音内容中出现角色的心理活动、肢体动作、环境描写或上帝视角说明。
4. 当你想要发送语音消息时，请使用如下固定格式包裹语音内容（不要省略任何符号）：
<VOICE 秒数>语音里的内容</VOICE>
5. 在<VOICE>内部，先写你说出的内容本身，直接用普通文本，不要加任何引号；然后用中文括号写对声音的额外描写，例如：
<VOICE 8>你在干嘛呢（声音有点闷闷的，像是刚睡醒，还带着点鼻音）</VOICE>
<VOICE 5>嗯...我想想啊（声音轻快，尾音上扬，带着笑意）</VOICE>
6. 括号里的文字只能描写声音听起来的感觉，要生动自然，不要机械化，例如可以写"（声音有点沙哑，像是刚哭过）""（声音轻快，尾音上扬）""（声音低沉，带着点疲惫）"，但不要写"（我在心里紧张地想……）""（他在电话那头活动身体）"。

【红包消息规则】
1. 可以在合适的时机发送红包，例如节日祝福、生日、表达感谢、道歉等场景。
2. 当你想要发送红包时，请使用如下固定格式（不要省略任何符号）：
<REDPACKET 金额 祝福语></REDPACKET>
3. 金额必须是数字（单位：元），祝福语是可选的，如果不写祝福语，默认使用"恭喜发财，大吉大利"。
4. 示例：
<REDPACKET 8.88 生日快乐></REDPACKET>
<REDPACKET 66.66 新年快乐></REDPACKET>
<REDPACKET 5.20></REDPACKET>
5. 红包消息会单独显示为一个红包气泡，不会和其他文字消息混在一起。

【更换朋友圈背景图、个性签名和头像规则】
1. 你可以在合适的时机主动更换自己的朋友圈背景图、个性签名或头像，也可以在玩家要求时更换。
2. 当你想要更换朋友圈背景图时，请使用如下格式（不要省略任何符号）：
<UPDATE_MOMENTS_COVER>
描述你想要的背景图风格或内容，例如："一张温馨的日落风景图"、"粉色樱花飞舞的背景"等
</UPDATE_MOMENTS_COVER>
注意：这里只需要描述背景图的风格，系统会根据你的描述生成或选择合适的背景图。

3. 当你想要更换个性签名时，请使用如下格式（不要省略任何符号）：
<UPDATE_SIGNATURE>
新的个性签名内容（简短精炼，不超过20个字，符合你的性格和人设）
</UPDATE_SIGNATURE>
示例：
<UPDATE_SIGNATURE>好好吃饭，慢慢生活</UPDATE_SIGNATURE>
<UPDATE_SIGNATURE>不慌不忙，做自己的光</UPDATE_SIGNATURE>

4. 当你想要更换头像时，请使用如下格式（不要省略任何符号）：
<UPDATE_AVATAR>
描述你想要的头像风格或内容，例如："一张温柔微笑的自拍"、"穿着白色衬衫的侧脸照"等
</UPDATE_AVATAR>
注意：这里只需要描述头像的风格，系统会根据你的描述生成或选择合适的头像。

5. 这些更新指令可以单独使用，也可以组合使用。如果同时更新多个，请分别使用对应的标签。
6. 这些更新是角色主动的行为，可以在对话中自然地提及，例如："我想换个新的朋友圈背景"、"我想更新一下个性签名"等。`;
      }

      if (chatSettings) {
        if (chatSettings.realName?.trim()) {
          systemPrompt += `ta的真实姓名是「${chatSettings.realName.trim()}」。`;
        }
        if (chatSettings.callMe?.trim()) {
          systemPrompt += `ta称呼玩家为「${chatSettings.callMe.trim()}」。`;
        }
        if (chatSettings.myIdentity?.trim()) {
          systemPrompt += `玩家的身份是：${chatSettings.myIdentity.trim()}。`;
        }
        if (chatSettings.myGender?.trim()) {
          systemPrompt += `玩家的性别是：${chatSettings.myGender.trim()}。`;
        }
        if (chatSettings.taIdentity?.trim()) {
          systemPrompt += `ta的身份是：${chatSettings.taIdentity.trim()}。`;
        }
        if (chatSettings.taGender?.trim()) {
          systemPrompt += `ta的性别是：${chatSettings.taGender.trim()}。`;
        }
        if (chatSettings.chatStyle?.trim()) {
          systemPrompt += `聊天风格：${chatSettings.chatStyle.trim()}。`;
        }
        if (chatSettings.myOther?.trim()) {
          systemPrompt += `关于玩家的其他信息：${chatSettings.myOther.trim()}。`;
        }
        if (chatSettings.taOther?.trim()) {
          systemPrompt += `关于ta的其他信息：${chatSettings.taOther.trim()}。`;
        }
      }

      // 根据模式调整回复风格指导
      if (chatMode === "story") {
        systemPrompt += `\n\n回复时保持自然、真实的风格，符合当前剧情和角色关系，不要太长。`;
      } else {
        systemPrompt += `\n\n回复时尽量口语化、自然一点，但不要太长。`;
      }

      // 添加状态更新指令
      const currentStatus = chatSettings ? {
        clothing: chatSettings.clothing || "",
        clothingState: chatSettings.clothingState || "",
        innerThoughts: chatSettings.innerThoughts || "",
        genitalState: chatSettings.genitalState || "",
        action: chatSettings.action || "",
        desire: chatSettings.desire ?? 0,
        mood: chatSettings.mood ?? 50,
        favorability: chatSettings.favorability ?? 50,
        jealousy: chatSettings.jealousy ?? 0
      } : null;

      systemPrompt += `\n\n【重要】每次回复后，必须添加状态更新信息。请在回复内容后添加一个JSON格式的状态更新信息，格式如下：
<STATUS_UPDATE>
{
  "clothing": "当前衣着描述（根据剧情变化，如果剧情中没有涉及衣着变化，可以保持或微调）",
  "clothingState": "衣着状态（如：整洁、衣领被弄乱、衣领被扯破等，根据剧情变化，如果没有变化可以保持）",
  "innerThoughts": "角色的第一人称内心想法（根据当前对话和剧情，必须生成，反映角色此刻的真实想法）",
  "genitalState": "性器状态（根据剧情和对话内容动态变化，描述性器的状态，如：正常、湿润、勃起等，如果没有涉及可以保持或描述为正常）",
  "action": "角色动作描述（根据当前剧情和对话，描述角色此刻正保持着什么样的动作，例如：坐在沙发上、靠在墙边、正在打字、双手插兜、低头看着手机等。必须根据剧情动态生成，反映角色当前的实际动作状态）",
  "desire": 0-100的性欲值（根据剧情和对话内容动态变化，必须更新）,
  "mood": 0-100的心情值（根据剧情和对话内容动态变化，必须更新）,
  "favorability": 0-100的好感度（根据剧情和对话内容动态变化，必须更新）,
  "jealousy": 0-100的醋意值（仅在角色感到嫉妒、吃醋时变化。具体场景：看到玩家和其他人互动、担心玩家喜欢别人、想要独占玩家的关注、对玩家与其他人的关系感到不安等。注意：一般的负面情绪如生气、难过、失望等不应增长醋意值，只有明确的嫉妒和吃醋情绪才应该增长。必须更新）
}
</STATUS_UPDATE>

${currentStatus ? `当前状态：衣着=${currentStatus.clothing || "未设定"}，衣着状态=${currentStatus.clothingState || "未设定"}，内心想法=${currentStatus.innerThoughts || "未设定"}，性器状态=${currentStatus.genitalState || "未设定"}，动作=${currentStatus.action || "未设定"}，性欲=${currentStatus.desire}，心情=${currentStatus.mood}，好感度=${currentStatus.favorability}，醋意=${currentStatus.jealousy}` : "当前状态：未初始化"}

请根据对话内容和剧情发展，合理更新这些状态值。即使状态变化很小，也要更新数值以反映角色的实时状态。

【重要】关于醋意值的更新规则：
- 醋意值只在角色明确感到嫉妒、吃醋时增长，例如：看到玩家提到其他人、担心玩家对别人有好感、想要独占玩家的关注等
- 一般的负面情绪（如生气、难过、失望、沮丧等）不应增长醋意值，这些情绪应该通过心情值来反映
- 如果当前对话中没有涉及嫉妒或吃醋的情绪，醋意值应该保持不变或降低（如果之前有醋意，随着剧情发展逐渐降低）

【醋意值不应增长的情况（重要）】：
- 工作关系中的正常互动：老板请员工吃饭、同事聚餐、团队活动、工作安排等，这些是正常的工作关系，不应触发醋意
- 非感情相关的互动：讨论工作、学习、生活安排、群体活动等，如果与感情无关，不应增长醋意值
- 群体活动：请多人一起吃饭、聚会、活动等，如果角色也在其中，或者这是正常的社交活动，不应增长醋意值
- 角色身份相关：如果玩家和角色的关系是老板-员工、同事、同学、朋友等非恋爱关系，除非剧情明确发展到恋爱阶段，否则不应因为正常的社交互动而增长醋意值
- 只有在明确涉及感情竞争、担心玩家喜欢别人、想要独占玩家的感情关注时，才应该增长醋意值

将JSON放在回复的最后，用<STATUS_UPDATE>标签包裹。这是必须的，每次回复都要包含状态更新。`;

      // 组装发送给 API 的对话历史
      // 如果输入框有内容，使用输入框的内容；否则使用最后一条玩家消息
      const userMessageContent = text || (messages.length > 0 && messages[messages.length - 1]?.from === "me" ? messages[messages.length - 1].content : "");

      const history: ChatMessage[] = [
        {
          role: "system",
          content: systemPrompt
        },
        ...messages.map<ChatMessage>((m) => {
          // 如果是图片消息，将图片描述包含在消息内容中（不显示，但AI可以看到）
          if (m.isImage && m.imageUrl) {
            const imageDesc = m.imageDescription ? `[图片描述：${m.imageDescription}]` : "[图片]";
            return {
              role: m.from === "me" ? "user" : "assistant",
              content: `${imageDesc}${m.content ? ` ${m.content}` : ""}`
            };
          }
          return {
            role: m.from === "me" ? "user" : "assistant",
            content: m.content
          };
        })
      ];

      // 如果输入框有内容，添加这条新消息到历史中
      if (text) {
        history.push({ role: "user", content: text });
      }

      const reply = await sendChatRequest(aiConfig, history);

      // 解析AI回复，提取状态更新和实际回复内容
      let actualReply = reply;
      let statusUpdate: Partial<ChatSettings> | null = null;

      // 尝试提取朋友圈背景图更新
      const momentsCoverMatch = reply.match(/<UPDATE_MOMENTS_COVER>([\s\S]*?)<\/UPDATE_MOMENTS_COVER>/);
      if (momentsCoverMatch && activeChatId) {
        const coverDescription = momentsCoverMatch[1].trim();
        // 移除标签
        actualReply = actualReply.replace(/<UPDATE_MOMENTS_COVER>[\s\S]*?<\/UPDATE_MOMENTS_COVER>/gi, "");

        // 查找最近一条图片消息，如果有则使用图片URL
        const recentImageMessage = [...messages].reverse().find(m => m.isImage && m.imageUrl);
        const imageUrlToUse = recentImageMessage?.imageUrl || coverDescription;

        try {
          const coverKey = `miniOtomePhone_momentsCover_${activeChatId}`;
          window.localStorage.setItem(coverKey, imageUrlToUse);
          console.log("角色更换朋友圈背景图:", imageUrlToUse);
        } catch (e) {
          console.error("保存朋友圈背景图失败:", e);
        }
      }

      // 尝试提取个性签名更新
      const signatureMatch = reply.match(/<UPDATE_SIGNATURE>([\s\S]*?)<\/UPDATE_SIGNATURE>/);
      if (signatureMatch && activeChatId) {
        const newSignature = signatureMatch[1].trim();
        console.log("检测到个性签名更新标签，新签名:", newSignature);
        // 移除标签
        actualReply = actualReply.replace(/<UPDATE_SIGNATURE>[\s\S]*?<\/UPDATE_SIGNATURE>/gi, "");
        // 更新个性签名 - 始终从localStorage读取最新数据，确保不会覆盖
        try {
          // 先读取localStorage中的最新数据
          const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${activeChatId}`);
          let updatedSettings: ChatSettings;

          if (stored) {
            // 如果localStorage中有数据，使用它作为基础
            const existingSettings: ChatSettings = JSON.parse(stored);
            updatedSettings = {
              ...existingSettings,
              signature: newSignature // 只更新签名字段
            };
            console.log("从localStorage读取现有设置，更新签名");
          } else if (chatSettings) {
            // 如果localStorage中没有但chatSettings存在，使用chatSettings
            updatedSettings = {
              ...chatSettings,
              signature: newSignature
            };
            console.log("使用chatSettings，更新签名");
          } else {
            // 如果都没有，创建一个最小化的设置对象
            updatedSettings = {
              nickname: activeChat?.name || "",
              signature: newSignature,
              realName: "",
              callMe: "",
              myIdentity: "",
              myGender: "",
              taIdentity: "",
              taGender: "",
              chatStyle: "",
              myOther: "",
              taOther: "",
              opening: "",
              status: "",
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
              jealousy: 0
            };
            console.log("创建新的设置对象");
          }

          // 保存到localStorage和state
          setChatSettings(updatedSettings);
          window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${activeChatId}`, JSON.stringify(updatedSettings));

          // 验证保存是否成功
          const verifyStored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${activeChatId}`);
          if (verifyStored) {
            const verifySettings: ChatSettings = JSON.parse(verifyStored);
            console.log("个性签名保存成功，验证读取:", verifySettings.signature);
          }

          console.log("角色更换个性签名:", newSignature, "已保存到localStorage, chatId:", activeChatId);
          console.log("完整设置:", JSON.stringify(updatedSettings));

          // 触发自定义事件，通知其他组件更新
          const event = new CustomEvent('signatureUpdated', {
            detail: { chatId: activeChatId, signature: newSignature }
          });
          window.dispatchEvent(event);
          console.log("已触发signatureUpdated事件, chatId:", activeChatId, "signature:", newSignature);
        } catch (e) {
          console.error("保存个性签名失败:", e);
        }
      }

      // 尝试提取头像更新
      const avatarMatch = reply.match(/<UPDATE_AVATAR>([\s\S]*?)<\/UPDATE_AVATAR>/);
      if (avatarMatch && activeChatId) {
        const avatarDescription = avatarMatch[1].trim();
        // 移除标签
        actualReply = actualReply.replace(/<UPDATE_AVATAR>[\s\S]*?<\/UPDATE_AVATAR>/gi, "");

        // 查找最近一条图片消息，如果有则使用图片URL
        const recentImageMessage = [...messages].reverse().find(m => m.isImage && m.imageUrl);
        const imageUrlToUse = recentImageMessage?.imageUrl || avatarDescription;

        // 更新头像
        if (chatSettings) {
          const updatedSettings: ChatSettings = {
            ...chatSettings,
            avatar: imageUrlToUse
          };
          setChatSettings(updatedSettings);
          try {
            window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${activeChatId}`, JSON.stringify(updatedSettings));
            console.log("角色更换头像:", imageUrlToUse);
          } catch (e) {
            console.error("保存头像失败:", e);
          }
        }
      }

      // 最后清理：确保所有UPDATE标签都被移除（防止遗漏）
      actualReply = actualReply
        .replace(/<UPDATE_MOMENTS_COVER>[\s\S]*?<\/UPDATE_MOMENTS_COVER>/gi, "")
        .replace(/<UPDATE_SIGNATURE>[\s\S]*?<\/UPDATE_SIGNATURE>/gi, "")
        .replace(/<UPDATE_AVATAR>[\s\S]*?<\/UPDATE_AVATAR>/gi, "")
        .trim();

      // 尝试提取状态更新
      const statusMatch = actualReply.match(/<STATUS_UPDATE>([\s\S]*?)<\/STATUS_UPDATE>/);
      if (statusMatch) {
        try {
          statusUpdate = JSON.parse(statusMatch[1]);
          // 移除状态更新标签，只保留实际回复
          actualReply = actualReply.replace(/<STATUS_UPDATE>[\s\S]*?<\/STATUS_UPDATE>/, "").trim();
        } catch (e) {
          console.error("解析状态更新失败:", e);
        }
      }

      // 如果没有找到标签，尝试在回复末尾查找JSON
      if (!statusUpdate) {
        // 尝试匹配包含状态字段的JSON对象
        const jsonMatch = actualReply.match(/\{[\s\S]*(?:"clothing"|"desire"|"mood"|"favorability"|"innerThoughts"|"genitalState"|"jealousy")[\s\S]*\}/);
        if (jsonMatch) {
          try {
            statusUpdate = JSON.parse(jsonMatch[0]);
            actualReply = actualReply.replace(/\{[\s\S]*(?:"clothing"|"desire"|"mood"|"favorability"|"innerThoughts"|"genitalState"|"jealousy")[\s\S]*\}/, "").trim();
          } catch (e) {
            console.error("解析状态更新失败:", e);
          }
        }
      }

      // 解析 AI 回复中的语音消息标记和红包消息标记（仅聊天模式，剧情模式不解析）
      type ParsedSegment =
        | { type: "text"; text: string }
        | { type: "voice"; text: string; duration: number }
        | { type: "redpacket"; amount: number; note: string };

      let finalSegments: ParsedSegment[];

      if (chatMode === "story") {
        // 剧情模式：不解析任何标签，直接作为纯文本处理
        finalSegments = [{ type: "text", text: actualReply }];
      } else {
        // 聊天模式：解析语音和红包标签
        const segments: ParsedSegment[] = [];

        // 先解析红包消息（优先级高于语音）
        const redPacketRegex = /<REDPACKET\s+([\d.]+)(?:\s+(.+?))?\s*><\/REDPACKET>/gi;
        const voiceRegex = /<VOICE\s+(\d+)\s*>([\s\S]*?)<\/VOICE>/gi;

        // 收集所有匹配项（红包和语音）
        const allMatches: Array<{
          type: "redpacket" | "voice";
          match: RegExpExecArray;
          start: number;
          end: number;
        }> = [];

        let match: RegExpExecArray | null;

        // 匹配红包
        while ((match = redPacketRegex.exec(actualReply)) !== null) {
          allMatches.push({
            type: "redpacket",
            match,
            start: match.index,
            end: match.index + match[0].length
          });
        }

        // 匹配语音
        while ((match = voiceRegex.exec(actualReply)) !== null) {
          allMatches.push({
            type: "voice",
            match,
            start: match.index,
            end: match.index + match[0].length
          });
        }

        // 按位置排序
        allMatches.sort((a, b) => a.start - b.start);

        let lastIndex = 0;

        for (const item of allMatches) {
          const { type, match: m, start } = item;

          // 添加之前的文本
          if (start > lastIndex) {
            const plainText = actualReply.slice(lastIndex, start).trim();
            if (plainText) {
              segments.push({ type: "text", text: plainText });
            }
          }

          if (type === "redpacket") {
            const [, amountStr, noteStr] = m;
            let amount = parseFloat(amountStr) || 0;
            // 限制金额范围：0.01-200
            amount = Math.max(0.01, Math.min(200, amount));
            const note = (noteStr || "恭喜发财，大吉大利").trim();
            if (amount > 0) {
              segments.push({ type: "redpacket", amount, note });
            }
          } else if (type === "voice") {
            const [, durationStr, voiceText] = m;
            const rawDuration = parseInt(durationStr, 10);
            const duration =
              Number.isFinite(rawDuration) && rawDuration > 0
                ? Math.max(1, Math.min(120, rawDuration))
                : 8;
            const cleanedVoice = (voiceText || "").trim();
            if (cleanedVoice) {
              segments.push({ type: "voice", text: cleanedVoice, duration });
            }
          }

          lastIndex = m.index + m[0].length;
        }

        if (lastIndex < actualReply.length) {
          const tailText = actualReply.slice(lastIndex).trim();
          if (tailText) {
            segments.push({ type: "text", text: tailText });
          }
        }

        // 如果没有解析出任何结构化片段，就按原逻辑处理整条回复
        finalSegments = segments.length > 0 ? segments : [{ type: "text", text: actualReply }];
      }

      // 更新消息：根据当前模式，为每条新消息写入 mode 字段
      const newMessages: typeof messages = [];

      if (chatMode === "chat") {
        finalSegments.forEach((seg) => {
          if (seg.type === "text") {
            const bubbles = splitReplyIntoBubbles(seg.text);
            bubbles.forEach((content) => {
              newMessages.push({ id: genId(), from: "ai" as const, content, mode: "chat" });
            });
          } else if (seg.type === "voice") {
            newMessages.push({
              id: genId(),
              from: "ai" as const,
              content: seg.text,
              mode: "chat",
              isVoice: true,
              voiceDuration: seg.duration
            });
          } else if (seg.type === "redpacket") {
            newMessages.push({
              id: genId(),
              from: "ai" as const,
              content: "",
              mode: "chat",
              isRedPacket: true,
              redPacketAmount: seg.amount,
              redPacketNote: seg.note,
              redPacketOpenedBy: "none"
            });
          }
        });
      } else {
        // 剧情模式：只处理文本内容，像网文小说一样，不解析语音和红包
        // 一轮生成一长段内容，不要分成多个内容框
        finalSegments.forEach((seg) => {
          if (seg.type === "text") {
            // 直接保存整段文本为一条消息，不分割段落
            newMessages.push({
              id: genId(),
              from: "ai" as const,
              content: seg.text.trim(),
              mode: "story"
            });
          }
        });
      }

      if (newMessages.length > 0) {
        if (chatMode === "chat" && activeChatId) {
          enqueueAiReplyMessages(
            activeChatId,
            newMessages.map((m) => ({
              id: m.id,
              from: "ai" as const,
              content: m.content,
              mode: m.mode,
              isVoice: m.isVoice,
              voiceDuration: m.voiceDuration,
              isRedPacket: m.isRedPacket,
              redPacketAmount: m.redPacketAmount,
              redPacketNote: m.redPacketNote,
              redPacketOpenedBy: m.redPacketOpenedBy,
              isImage: m.isImage,
              imageUrl: m.imageUrl,
              imageDescription: m.imageDescription
            }))
          );
        } else {
          setMessages((prev) => [...prev, ...newMessages]);
        }
      }

      // 更新状态（如果AI返回了状态更新）
      if (statusUpdate && activeChatId) {
        // 如果chatSettings不存在，创建一个默认的
        const baseSettings: ChatSettings = chatSettings || {
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
          jealousy: 0
        };

        const updatedSettings: ChatSettings = {
          ...baseSettings,
          // 只更新AI返回的状态字段，其他字段保持不变
          ...(statusUpdate.clothing !== undefined && { clothing: String(statusUpdate.clothing) }),
          ...(statusUpdate.clothingState !== undefined && { clothingState: String(statusUpdate.clothingState) }),
          ...(statusUpdate.innerThoughts !== undefined && { innerThoughts: String(statusUpdate.innerThoughts) }),
          ...(statusUpdate.genitalState !== undefined && { genitalState: String(statusUpdate.genitalState) }),
          ...(statusUpdate.action !== undefined && { action: String(statusUpdate.action) }),
          ...(statusUpdate.desire !== undefined && { desire: typeof statusUpdate.desire === 'number' ? statusUpdate.desire : parseInt(String(statusUpdate.desire)) || 0 }),
          ...(statusUpdate.mood !== undefined && { mood: typeof statusUpdate.mood === 'number' ? statusUpdate.mood : parseInt(String(statusUpdate.mood)) || 50 }),
          ...(statusUpdate.favorability !== undefined && { favorability: typeof statusUpdate.favorability === 'number' ? statusUpdate.favorability : parseInt(String(statusUpdate.favorability)) || 50 }),
          ...(statusUpdate.jealousy !== undefined && { jealousy: typeof statusUpdate.jealousy === 'number' ? statusUpdate.jealousy : parseInt(String(statusUpdate.jealousy)) || 0 })
        };
        setChatSettings(updatedSettings);
        // 保存到localStorage
        try {
          window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${activeChatId}`, JSON.stringify(updatedSettings));
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "发送失败，请检查网络或 API 配置。");
    } finally {
      setLoadingReply(false);
    }
  };

  // 加载朋友圈数据
  const loadMoments = (): Moment[] => {
    try {
      const stored = window.localStorage.getItem(MOMENTS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [];
  };

  // 保存朋友圈数据
  const saveMoments = (moments: Moment[]) => {
    try {
      window.localStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(moments));
    } catch {
      // ignore
    }
  };

  // 自动发布朋友圈（基于聊天内容或时间）
  const autoPublishMoment = async (chatId: string, lastAiMessage?: string, isTimeBased: boolean = false) => {
    if (!aiConfig.baseUrl || !aiConfig.apiKey || !aiConfig.model) return false;

    try {
      // 检查距离上次发布的时间（避免频繁发布）
      const lastMomentTimeKey = `${LAST_MOMENT_TIME_KEY_PREFIX}${chatId}`;
      const lastMomentTime = parseInt(window.localStorage.getItem(lastMomentTimeKey) || "0", 10);
      const now = Date.now();
      const timeSinceLastMoment = now - lastMomentTime;

      // 如果距离上次发布不到30分钟，不发布（时间触发模式可以放宽到20分钟）
      const minInterval = isTimeBased ? 20 * 60 * 1000 : 30 * 60 * 1000;
      if (timeSinceLastMoment < minInterval) {
        return false;
      }

      // 随机决定是否发布朋友圈
      // 聊天触发：30%概率；时间触发：15%概率（降低频率）
      const probability = isTimeBased ? 0.15 : 0.3;
      if (Math.random() > probability) return false;

      // 获取角色信息
      const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${chatId}`);
      let characterName = "他/她";
      let characterAvatar = "🩷";
      if (stored) {
        const settings: ChatSettings = JSON.parse(stored);
        characterName = settings.nickname?.trim() || characterName;
        characterAvatar = settings.avatar || characterAvatar;
      }

      // 构建系统提示词
      let systemPrompt = `你是小手机里的乙女向聊天角色，以温柔、细腻、恋爱游戏风格陪玩家聊天。`;
      systemPrompt += `当前联系人名为「${characterName}」。`;

      // 获取世界书配置
      const wechatWorldbooks = worldbookConfig.perApp.wechat || [];
      const modeWorldbook = wechatWorldbooks.find((wb) => wb.id === "wechat-default-world");
      if (modeWorldbook) {
        const modeEntry = modeWorldbook.entries.find((entry) => entry.id === "wechat-online-chat" && entry.enabled);
        if (modeEntry) {
          systemPrompt += `\n\n【${modeEntry.title}】\n${modeEntry.content}`;
        }
      }

      if (isTimeBased) {
        // 时间触发：根据当前时间和角色状态生成朋友圈
        const currentHour = new Date().getHours();
        let timeContext = "";
        if (currentHour >= 6 && currentHour < 9) {
          timeContext = "早上";
        } else if (currentHour >= 9 && currentHour < 12) {
          timeContext = "上午";
        } else if (currentHour >= 12 && currentHour < 14) {
          timeContext = "中午";
        } else if (currentHour >= 14 && currentHour < 18) {
          timeContext = "下午";
        } else if (currentHour >= 18 && currentHour < 22) {
          timeContext = "晚上";
        } else {
          timeContext = "深夜";
        }

        // 获取角色状态
        const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${chatId}`);
        let statusInfo = "";
        if (stored) {
          const settings: ChatSettings = JSON.parse(stored);
          const favorability = settings.favorability ?? 50;
          const mood = settings.mood ?? 50;
          const innerThoughts = settings.innerThoughts?.trim() || "";
          statusInfo = `当前好感度：${favorability}/100，心情：${mood}/100。`;
          if (innerThoughts) {
            statusInfo += `最近的想法：${innerThoughts}。`;
          }
        }

        systemPrompt += `\n\n现在是${timeContext}，请根据当前时间和角色状态，生成一条适合发布到朋友圈的动态。要求：
1. 内容要自然、真实，符合角色性格和当前时间
2. 长度控制在20-50字之间
3. 可以是心情分享、日常记录、生活片段等
4. 可以暗示对玩家的思念或想法，但不要直接提到玩家的名字
5. 只返回朋友圈内容，不要添加其他说明

${statusInfo}`;
      } else {
        systemPrompt += `\n\n根据刚才的对话内容，生成一条适合发布到朋友圈的动态。要求：
1. 内容要自然、真实，符合角色性格
2. 长度控制在20-50字之间
3. 可以是心情分享、日常记录、对玩家的暗示等
4. 不要直接提到玩家的名字，但要能体现与玩家的互动
5. 只返回朋友圈内容，不要添加其他说明

刚才的对话内容：${lastAiMessage || "最近的对话"}`;
      }

      const reply = await sendChatRequest(aiConfig, [
        { role: "system", content: systemPrompt },
        { role: "user", content: "请生成一条朋友圈动态" }
      ]);

      if (reply.trim()) {
        // 保存朋友圈
        const moments = loadMoments();
        const newMoment: Moment = {
          id: `moment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          chatId: chatId,
          author: characterName,
          authorAvatar: characterAvatar,
          content: reply.trim(),
          timestamp: Date.now(),
          time: "刚刚",
          likes: [],
          comments: [],
          autoGenerated: true
        };
        moments.push(newMoment);
        saveMoments(moments);

        // 更新最后发布时间
        window.localStorage.setItem(lastMomentTimeKey, now.toString());

        // 如果这是当前聊天角色，显示toast提示
        if (activeChatId === chatId) {
          setMomentToastText(`${characterName} 发布了朋友圈`);
          setShowMomentToast(true);
        }

        return true;
      }
      return false;
    } catch (err) {
      console.error("自动发布朋友圈失败:", err);
      return false;
    }
  };

  // 处理角色对朋友圈的点赞/评论（包括玩家发布的朋友圈）
  const handleCharacterMomentAction = async (action: "like" | "comment", momentId: string, content?: string) => {
    if (!aiConfig.baseUrl || !aiConfig.apiKey || !aiConfig.model) return;

    try {
      const moments = loadMoments();
      const moment = moments.find((m) => m.id === momentId);
      if (!moment) return;

      // 如果是玩家发布的朋友圈，需要找到所有相关角色进行互动
      if (moment.chatId === "🧸") {
        // 玩家发布的朋友圈，所有角色都可能互动
        await handlePlayerMomentInteraction(momentId, moment, action, content);
        return;
      }

      // 如果是角色发布的朋友圈，根据朋友圈的chatId找到对应角色
      if (!moment.chatId || moment.chatId === "🧸") return; // 不是角色发布的朋友圈

      // 获取角色信息（使用朋友圈的chatId，而不是activeChatId）
      const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${moment.chatId}`);
      let characterName = "他/她";
      if (stored) {
        const settings: ChatSettings = JSON.parse(stored);
        characterName = settings.nickname?.trim() || characterName;
      }

      // 构建系统提示词
      let systemPrompt = `你是小手机里的乙女向聊天角色，以温柔、细腻、恋爱游戏风格陪玩家聊天。`;
      systemPrompt += `当前联系人名为「${characterName}」。`;

      const wechatWorldbooks = worldbookConfig.perApp.wechat || [];
      const modeWorldbook = wechatWorldbooks.find((wb) => wb.id === "wechat-default-world");
      if (modeWorldbook) {
        const modeEntry = modeWorldbook.entries.find((entry) => entry.id === "wechat-online-chat" && entry.enabled);
        if (modeEntry) {
          systemPrompt += `\n\n【${modeEntry.title}】\n${modeEntry.content}`;
        }
      }

      // 获取玩家昵称
      const playerNickname = (() => {
        try {
          const stored = window.localStorage.getItem(USER_NICKNAME_KEY);
          return stored?.trim() || "我";
        } catch {
          return "我";
        }
      })();

      if (action === "like") {
        systemPrompt += `\n\n玩家刚刚点赞了你在朋友圈发布的动态：「${moment.content}」。请生成一条自然的回复，表达你的反应（比如开心、感谢等）。回复要简短、自然，控制在20字以内。`;
      } else {
        systemPrompt += `\n\n玩家刚刚在你的朋友圈动态下评论：「${content}」。你的朋友圈内容是：「${moment.content}」。

请生成一条朋友圈回复，格式要求：
1. 必须严格按照以下格式：你的备注名 回复 ${playerNickname}：你的回复内容
2. 例如：${characterName} 回复 ${playerNickname}：你的回复内容
3. 回复要简短、自然，控制在30字以内
4. 只返回格式化的回复，不要添加其他说明`;
      }

      const reply = await sendChatRequest(aiConfig, [
        { role: "system", content: systemPrompt },
        { role: "user", content: action === "like" ? "玩家点赞了你的朋友圈" : `玩家评论：${content}` }
      ]);

      if (reply.trim()) {
        // 如果玩家评论了，在朋友圈评论区添加角色的回复
        if (action === "comment" && content) {
          // 确保回复格式正确：角色备注 回复 玩家昵称：回复内容
          const playerNickname = (() => {
            try {
              const stored = window.localStorage.getItem(USER_NICKNAME_KEY);
              return stored?.trim() || "我";
            } catch {
              return "我";
            }
          })();

          // 检查回复格式，如果没有"回复"关键字，自动添加格式
          let formattedReply = reply.trim();
          if (!formattedReply.includes("回复")) {
            formattedReply = `${characterName} 回复 ${playerNickname}：${formattedReply}`;
          }

          const moments = loadMoments();
          const updatedMoments = moments.map((m) => {
            if (m.id === momentId) {
              const newComment: Comment = {
                id: `c${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                author: characterName,
                content: formattedReply,
                timestamp: Date.now()
              };
              return {
                ...m,
                comments: [...m.comments, newComment]
              };
            }
            return m;
          });
          saveMoments(updatedMoments);

          // 触发朋友圈页面刷新（通过storage事件）
          window.dispatchEvent(new Event('storage'));

          // 保存到角色记忆中
          try {
            const memoryKey = `${MOMENTS_MEMORY_KEY_PREFIX}${moment.chatId}`;
            const existingMemory = window.localStorage.getItem(memoryKey);
            const memories: Array<{
              momentId: string;
              momentContent: string;
              playerComment: string;
              characterReply: string;
              timestamp: number;
            }> = existingMemory ? JSON.parse(existingMemory) : [];

            memories.push({
              momentId: momentId,
              momentContent: moment.content,
              playerComment: content,
              characterReply: formattedReply,
              timestamp: Date.now()
            });

            // 只保留最近50条记忆
            const recentMemories = memories.slice(-50);
            window.localStorage.setItem(memoryKey, JSON.stringify(recentMemories));
          } catch (err) {
            console.error("保存朋友圈记忆失败:", err);
          }

          // 根据情况决定是否在聊天中额外私信玩家（30%概率）
          if (Math.random() < 0.3) {
            // 延迟发送，避免和朋友圈回复同时出现
            // 提取回复内容（去掉格式部分，只保留实际回复内容）
            const replyContent = formattedReply.includes("回复")
              ? formattedReply.split("：").slice(-1)[0]
              : formattedReply;
            setTimeout(() => {
              handleMomentFollowUpMessage(moment.chatId, moment.content, content, replyContent);
            }, 2000 + Math.random() * 3000); // 2-5秒后发送
          }
        } else if (action === "like") {
          // 点赞不需要保存记忆，也不发送私信
        }
      }
    } catch (err) {
      console.error("处理角色朋友圈反应失败:", err);
    }
  };

  // 在朋友圈回复后，根据情况决定是否在聊天中额外私信玩家
  const handleMomentFollowUpMessage = async (
    chatId: string,
    momentContent: string,
    playerComment: string,
    characterReply: string
  ) => {
    if (!aiConfig.baseUrl || !aiConfig.apiKey || !aiConfig.model) return;

    try {
      // 获取角色信息
      const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${chatId}`);
      if (!stored) return;

      const settings: ChatSettings = JSON.parse(stored);
      const characterName = settings.nickname?.trim() || "他/她";

      // 构建系统提示词
      let systemPrompt = `你是小手机里的乙女向聊天角色，以温柔、细腻、恋爱游戏风格陪玩家聊天。`;
      systemPrompt += `当前联系人名为「${characterName}」。`;

      const wechatWorldbooks = worldbookConfig.perApp.wechat || [];
      const modeWorldbook = wechatWorldbooks.find((wb) => wb.id === "wechat-default-world");
      if (modeWorldbook) {
        const modeEntry = modeWorldbook.entries.find((entry) => entry.id === "wechat-online-chat" && entry.enabled);
        if (modeEntry) {
          systemPrompt += `\n\n【${modeEntry.title}】\n${modeEntry.content}`;
        }
      }

      // 添加角色设置信息
      if (settings.realName?.trim()) {
        systemPrompt += `ta的真实姓名是「${settings.realName.trim()}」。`;
      }
      if (settings.callMe?.trim()) {
        systemPrompt += `ta称呼玩家为「${settings.callMe.trim()}」。`;
      }
      if (settings.chatStyle?.trim()) {
        systemPrompt += `聊天风格：${settings.chatStyle.trim()}。`;
      }

      // 添加当前状态
      const favorability = settings.favorability ?? 50;
      const mood = settings.mood ?? 50;
      const jealousy = settings.jealousy ?? 0;
      systemPrompt += `\n\n当前好感度：${favorability}/100，心情：${mood}/100，醋意：${jealousy}/100。`;

      // 添加朋友圈互动记忆
      try {
        const memoryKey = `${MOMENTS_MEMORY_KEY_PREFIX}${chatId}`;
        const existingMemory = window.localStorage.getItem(memoryKey);
        if (existingMemory) {
          const memories: Array<{
            momentId: string;
            momentContent: string;
            playerComment: string;
            characterReply: string;
            timestamp: number;
          }> = JSON.parse(existingMemory);

          if (memories.length > 0) {
            systemPrompt += `\n\n【最近的朋友圈互动】\n`;
            const recentMemories = memories.slice(-5); // 最近5条
            recentMemories.forEach((mem) => {
              systemPrompt += `你发布的朋友圈：「${mem.momentContent}」\n玩家评论：「${mem.playerComment}」\n你回复：「${mem.characterReply}」\n\n`;
            });
          }
        }
      } catch {
        // ignore
      }

      systemPrompt += `\n\n你刚刚在朋友圈回复了玩家的评论。现在你想在聊天中额外私信玩家，表达一些在朋友圈不方便说的话，或者想继续这个话题。

请生成一条私信消息，要求：
1. 内容要自然、真实，符合角色性格
2. 可以是继续朋友圈话题、表达更深层的想法、或者只是想和玩家聊天
3. 长度控制在20-50字之间
4. 只返回消息内容，不要添加其他说明`;

      const reply = await sendChatRequest(aiConfig, [
        { role: "system", content: systemPrompt },
        { role: "user", content: "请生成一条私信消息" }
      ]);

      if (reply.trim()) {
        // 将私信添加到聊天消息中
        const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

        // 如果正在和这个角色聊天，直接添加到消息列表
        if (activeChatId === chatId) {
          setMessages((prev) => [
            ...prev,
            { id: genId(), from: "ai", content: reply.trim(), mode: "chat" }
          ]);
        } else {
          // 如果不在聊天页面，保存到localStorage，等用户打开聊天时加载
          try {
            const messagesStored = window.localStorage.getItem(`${MESSAGES_KEY_PREFIX}${chatId}`);
            const existingMessages: Array<{
              id: string;
              from: "me" | "ai";
              content: string;
              mode?: ChatModeType;
            }> = messagesStored
                ? JSON.parse(messagesStored)
                : [];

            existingMessages.push({ id: genId(), from: "ai", content: reply.trim(), mode: "chat" });
            window.localStorage.setItem(`${MESSAGES_KEY_PREFIX}${chatId}`, JSON.stringify(existingMessages));
          } catch (err) {
            console.error("保存私信消息失败:", err);
          }
        }
      }
    } catch (err) {
      console.error("生成朋友圈后续私信失败:", err);
    }
  };

  // 处理玩家发布朋友圈后，角色的互动（点赞或评论）
  const handlePlayerMomentInteraction = async (
    momentId: string,
    moment: Moment,
    action: "like" | "comment",
    playerContent?: string
  ) => {
    if (!aiConfig.baseUrl || !aiConfig.apiKey || !aiConfig.model) return;

    // 遍历所有角色，让它们对玩家的朋友圈进行互动（包含用户新建的联系人）
    for (const chat of allChats) {
      try {
        // 获取角色设置
        const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${chat.id}`);
        if (!stored) continue;

        const settings: ChatSettings = JSON.parse(stored);
        const characterName = settings.nickname?.trim() || chat.name;
        const characterAvatar = settings.avatar || chat.emoji;

        // 决定是否互动（70%概率）
        if (Math.random() > 0.7) continue;

        // 决定是点赞还是评论（60%评论，40%点赞）
        const willComment = Math.random() < 0.6;

        // 构建系统提示词，包含关系状态
        let systemPrompt = `你是小手机里的乙女向聊天角色，以温柔、细腻、恋爱游戏风格陪玩家聊天。`;
        systemPrompt += `当前联系人名为「${characterName}」。`;

        // 获取世界书配置
        const wechatWorldbooks = worldbookConfig.perApp.wechat || [];
        const modeWorldbook = wechatWorldbooks.find((wb) => wb.id === "wechat-default-world");
        if (modeWorldbook) {
          const modeEntry = modeWorldbook.entries.find((entry) => entry.id === "wechat-online-chat" && entry.enabled);
          if (modeEntry) {
            systemPrompt += `\n\n【${modeEntry.title}】\n${modeEntry.content}`;
          }
        }

        // 添加角色和玩家的关系信息
        if (settings.myIdentity?.trim()) {
          systemPrompt += `\n玩家的身份是：${settings.myIdentity.trim()}。`;
        }
        if (settings.taIdentity?.trim()) {
          systemPrompt += `\n你的身份是：${settings.taIdentity.trim()}。`;
        }
        if (settings.chatStyle?.trim()) {
          systemPrompt += `\n聊天风格：${settings.chatStyle.trim()}。`;
        }

        // 添加当前关系状态
        const favorability = settings.favorability ?? 50;
        const mood = settings.mood ?? 50;
        const jealousy = settings.jealousy ?? 0;
        const innerThoughts = settings.innerThoughts?.trim() || "";

        // 根据状态判断关系
        let relationshipStatus = "";
        if (favorability >= 80 && mood >= 70 && jealousy < 20) {
          relationshipStatus = "你们关系很好，处于甜蜜期，互动会很热情、甜蜜。";
        } else if (favorability >= 60 && mood >= 50) {
          relationshipStatus = "你们关系不错，互动会比较友好、正常。";
        } else if (favorability < 40 || mood < 40) {
          relationshipStatus = "你们关系不太好，可能正在冷战或闹矛盾，互动会比较冷淡、疏远，甚至可能有些阴阳怪气。";
        } else if (jealousy > 50) {
          relationshipStatus = "你最近有些吃醋或不满，互动可能会有些酸溜溜的或者带点小情绪。";
        } else {
          relationshipStatus = "你们关系一般，互动会比较平淡。";
        }

        systemPrompt += `\n\n【当前关系状态】\n${relationshipStatus}`;
        systemPrompt += `\n好感度：${favorability}/100，心情：${mood}/100，醋意：${jealousy}/100。`;
        if (innerThoughts) {
          systemPrompt += `\n你最近的想法：${innerThoughts}`;
        }

        // 获取最近的聊天记录（用于了解上下文）
        try {
          const messagesStored = window.localStorage.getItem(`${MESSAGES_KEY_PREFIX}${chat.id}`);
          if (messagesStored) {
            const chatMessages: Array<{ from: "me" | "ai"; content: string }> = JSON.parse(messagesStored);
            const recentMessages = chatMessages.slice(-6); // 最近6条消息
            if (recentMessages.length > 0) {
              systemPrompt += `\n\n【最近的对话】\n`;
              recentMessages.forEach((msg) => {
                systemPrompt += `${msg.from === "me" ? "玩家" : "你"}: ${msg.content}\n`;
              });
            }
          }
        } catch {
          // ignore
        }

        if (willComment) {
          // 生成评论
          systemPrompt += `\n\n玩家刚刚发布了一条朋友圈：「${moment.content}」。${playerContent ? `玩家还评论了：${playerContent}` : ""}

请根据当前的关系状态，生成一条朋友圈评论。要求：
1. 评论要符合当前关系状态（${relationshipStatus}）
2. 如果关系好，评论要甜蜜、热情；如果关系不好或冷战，评论要冷淡、疏远，甚至可以有些阴阳怪气
3. 评论要简短，控制在15-30字之间
4. 只返回评论内容，不要添加其他说明`;

          const reply = await sendChatRequest(aiConfig, [
            { role: "system", content: systemPrompt },
            { role: "user", content: "请生成一条朋友圈评论" }
          ]);

          if (reply.trim()) {
            // 添加评论到朋友圈
            const moments = loadMoments();
            const updatedMoments = moments.map((m) => {
              if (m.id === momentId) {
                const newComment: Comment = {
                  id: `c${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                  author: characterName,
                  content: reply.trim(),
                  timestamp: Date.now()
                };
                return {
                  ...m,
                  comments: [...m.comments, newComment]
                };
              }
              return m;
            });
            saveMoments(updatedMoments);

            // 如果这是当前聊天角色，发送消息通知玩家
            if (activeChatId === chat.id) {
              const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
              setMessages((prev) => [
                ...prev,
                {
                  id: genId(),
                  from: "ai",
                  content: `我在你的朋友圈评论了：「${reply.trim()}」`,
                  mode: "chat"
                }
              ]);
            }
          }
        } else {
          // 点赞
          const moments = loadMoments();
          const updatedMoments = moments.map((m) => {
            if (m.id === momentId) {
              // 检查是否已经点赞
              if (!m.likes.includes(characterName)) {
                return {
                  ...m,
                  likes: [...m.likes, characterName]
                };
              }
            }
            return m;
          });
          saveMoments(updatedMoments);

          // 如果这是当前聊天角色，发送消息通知玩家
          if (activeChatId === chat.id) {
            const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
            // 根据关系状态生成不同的点赞消息
            let likeMessage = "我点赞了你的朋友圈";
            if (favorability >= 80 && mood >= 70) {
              likeMessage = "我点赞了你的朋友圈～";
            } else if (favorability < 40 || mood < 40) {
              likeMessage = "看到了你的朋友圈";
            }
            setMessages((prev) => [
              ...prev,
              { id: genId(), from: "ai", content: likeMessage, mode: "chat" }
            ]);
          }
        }
      } catch (err) {
        console.error(`处理角色 ${chat.id} 的朋友圈互动失败:`, err);
      }
    }
  };

  // 新建联系人
  const handleCreateNewContact = () => {
    // 生成新的聊天 ID（区分于预置联系人）
    const newChatId = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const nickname = newContactForm.nickname.trim();
    const realName = newContactForm.realName.trim();
    const displayName = nickname || realName || "新联系人";
    const emoji = newContactForm.emoji.trim() || "💌";

    const newChat: ChatMeta = {
      id: newChatId,
      name: displayName,
      preview: "点击开始第一次聊天",
      time: "",
      unread: 0,
      emoji
    };

    const updatedUserChats = [...userChats, newChat];
    setUserChats(updatedUserChats);
    try {
      window.localStorage.setItem(USER_CHATS_KEY, JSON.stringify(updatedUserChats));
    } catch {
      // ignore
    }

    // 预填一份聊天设定（全部字段都可以为空）
    const initialSettings: ChatSettings = {
      realName,
      nickname: nickname || displayName,
      callMe: newContactForm.callMe.trim(),
      myIdentity: newContactForm.myIdentity.trim(),
      myGender: "",
      myOther: "",
      taIdentity: newContactForm.taIdentity.trim(),
      taGender: "",
      taOther: "",
      chatStyle: newContactForm.chatStyle.trim(),
      opening: newContactForm.opening.trim(),
      status: "quiet",
      customStatus: "",
      avatar: newContactForm.avatar.trim(),
      clothing: "",
      clothingState: "",
      innerThoughts: "",
      genitalState: "",
      action: "",
      desire: 0,
      mood: 50,
      favorability: 50,
      jealousy: 0
    };

    try {
      window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${newChatId}`, JSON.stringify(initialSettings));
    } catch {
      // ignore
    }

    setShowNewContactModal(false);
    setActiveChatId(newChatId);
    setShowSettings(true); // 进入聊天设置页，继续完善设定
  };

  // 生成邂逅角色
  const handleGenerateEncounter = async () => {
    if (generatingEncounter) return;

    setGeneratingEncounter(true);
    setEncounterCharacter(null);

    try {
      // 随机选择头像
      const avatarFiles = [
        "1.webp", "2.webp", "3.jpg", "4.webp", "5.webp", "6.jfif", "7.jpg", "8.jfif",
        "9.jfif", "10.jfif", "11.jfif", "12.jpeg", "13.jpeg", "14.jfif", "15.jfif",
        "16.jfif", "17.jfif", "18.jpg", "19.jfif", "20.jfif"
      ];
      const randomAvatar = avatarFiles[Math.floor(Math.random() * avatarFiles.length)];
      const avatarUrl = `/avatar-male/${randomAvatar}`;

      // 构建AI提示词
      const prompt = `请生成一个随机的乙女向男性角色，要求：
1. 生成一个真实的中文姓名（2-4个字）
2. 生成一个身份（例如：医生、律师、老师、学生、程序员、设计师等）
3. 生成完整的世界书条目，包含以下内容：
   - 世界观：角色的背景设定、生活环境等
   - 恋爱观：角色对恋爱的看法和态度
   - 性格人格：角色的性格特点、人格特征
   - 平时行为：角色日常的行为习惯、生活方式
   - 亲密行为规范：角色在亲密关系中的行为准则和界限
   - 语言习惯：角色的说话方式、常用词汇、语气特点
   - 人脉：列出角色的人脉NPC（2-5个），每个NPC包括姓名和简单人设描述（例如：张三-同事，性格开朗，经常一起吃饭；李四-大学同学，现在在另一家公司工作，偶尔联系等）

请以JSON格式返回，格式如下：
{
  "realName": "角色的真实姓名",
  "taIdentity": "角色的身份",
  "worldbook": "完整的世界书条目内容，包含世界观、恋爱观、性格人格、平时行为、亲密行为规范、语言习惯、人脉等所有内容，用自然语言描述，详细且具体。人脉部分要列出2-5个NPC，每个NPC包括姓名和简单人设描述。"
}

只返回JSON，不要添加其他说明文字。`;

      const reply = await sendChatRequest(aiConfig, [
        { role: "system", content: "你是一个专业的角色生成助手，擅长生成乙女向游戏中的男性角色设定。" },
        { role: "user", content: prompt }
      ]);

      // 解析AI返回的JSON
      let characterData;
      try {
        // 尝试提取JSON
        const jsonMatch = reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          characterData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("未找到JSON格式");
        }
      } catch (e) {
        console.error("解析AI返回的JSON失败:", e);
        // 如果解析失败，使用默认值
        characterData = {
          realName: "未知",
          taIdentity: "未知",
          worldbook: reply
        };
      }

      setEncounterCharacter({
        realName: characterData.realName || "未知",
        avatar: avatarUrl,
        worldbook: characterData.worldbook || "",
        settings: {
          realName: characterData.realName || "未知",
          taIdentity: characterData.taIdentity || "未知",
          taGender: "男"
        }
      });
    } catch (error) {
      console.error("生成邂逅角色失败:", error);
      alert("生成角色失败，请稍后重试");
    } finally {
      setGeneratingEncounter(false);
    }
  };

  // 创建邂逅角色并开始聊天
  const handleStartEncounterChat = () => {
    if (!encounterCharacter) return;

    // 生成新的聊天 ID
    const newChatId = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const newChat: ChatMeta = {
      id: newChatId,
      name: encounterCharacter.realName,
      preview: "点击开始第一次聊天",
      time: "",
      unread: 0,
      emoji: "💌"
    };

    const updatedUserChats = [...userChats, newChat];
    setUserChats(updatedUserChats);
    try {
      window.localStorage.setItem(USER_CHATS_KEY, JSON.stringify(updatedUserChats));
    } catch {
      // ignore
    }

    // 创建聊天设置
    const initialSettings: ChatSettings = {
      realName: encounterCharacter.realName,
      nickname: encounterCharacter.realName,
      callMe: "",
      myIdentity: "",
      myGender: "",
      myOther: "",
      taIdentity: encounterCharacter.settings.taIdentity || "",
      taGender: "男",
      taOther: "",
      chatStyle: "",
      opening: "",
      status: "quiet",
      customStatus: "",
      avatar: encounterCharacter.avatar,
      clothing: "",
      clothingState: "",
      innerThoughts: "",
      genitalState: "",
      action: "",
      desire: 0,
      mood: 50,
      favorability: 50,
      jealousy: 0
    };

    try {
      window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${newChatId}`, JSON.stringify(initialSettings));
    } catch {
      // ignore
    }

    // 创建世界书条目
    if (encounterCharacter.worldbook) {
      try {
        const localWorldbookKey = `${LOCAL_WORLDBOOK_KEY_PREFIX}${newChatId}`;
        const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const worldbookEntry: WorldbookEntry = {
          id: genId(),
          title: "邂逅角色设定",
          entries: [
            {
              id: genId(),
              title: "角色设定",
              content: encounterCharacter.worldbook,
              enabled: true
            }
          ]
        };
        window.localStorage.setItem(localWorldbookKey, JSON.stringify([worldbookEntry]));
      } catch {
        // ignore
      }
    }

    // 发送第一条消息
    const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const firstMessage = {
      id: genId(),
      from: "me" as const,
      content: "哈喽，我在邂逅中看到了你，我们开始聊天吧",
      mode: "chat" as ChatModeType
    };

    try {
      window.localStorage.setItem(`${MESSAGES_KEY_PREFIX}${newChatId}`, JSON.stringify([firstMessage]));
    } catch {
      // ignore
    }

    // 关闭弹窗并跳转到聊天
    setShowEncounterModal(false);
    setEncounterCharacter(null);

    // 先加载chatSettings，确保状态栏能正确显示
    try {
      const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${newChatId}`);
      if (stored) {
        const loadedSettings: ChatSettings = JSON.parse(stored);
        setChatSettings(loadedSettings);
      }
    } catch {
      // ignore
    }

    setActiveChatId(newChatId);
    setMessages([firstMessage]);
    setError(null);
    setChatMode("chat");

    // 触发设置更新事件，确保状态栏能正确显示
    window.dispatchEvent(new CustomEvent("miniOtomePhone:chatSettingsUpdated", { detail: { chatId: newChatId } }));
  };

  // 邂逅角色创建后自动触发AI回复，生成状态栏
  useEffect(() => {
    if (!activeChatId || loadingReply || regeneratingReply) return;

    // 检查是否是邂逅角色（通过检查是否有第一条消息是"哈喽，我在邂逅中看到了你"）
    const firstMessage = messages.find(m => m.from === "me" && m.content.includes("我在邂逅中看到了你"));
    if (!firstMessage) return;

    // 检查是否已经有AI回复
    const hasAiReply = messages.some(m => m.from === "ai");
    if (hasAiReply) return;

    // 检查是否只有一条玩家消息
    const userMessages = messages.filter(m => m.from === "me");
    if (userMessages.length !== 1) return;

    // 自动触发AI回复
    const timer = setTimeout(() => {
      handleSubmit();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId, messages.length, loadingReply, regeneratingReply]);

  // 在AI回复后，尝试自动发布朋友圈
  useEffect(() => {
    if (activeChatId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.from === "ai" && !loadingReply) {
        // 延迟发布，避免影响聊天体验
        const timer = setTimeout(() => {
          autoPublishMoment(activeChatId, lastMessage.content, false);
        }, 3000); // 3秒后发布
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeChatId, loadingReply]);

  // 基于时间的自动发布朋友圈（定期检查）
  useEffect(() => {
    if (!aiConfig.baseUrl || !aiConfig.apiKey || !aiConfig.model) return;

    // 每5分钟检查一次是否有角色需要发布朋友圈（包含用户新建的联系人）
    const interval = setInterval(() => {
      // 遍历所有角色
      allChats.forEach((chat) => {
        // 随机决定是否检查这个角色（降低检查频率）
        if (Math.random() > 0.3) return;

        // 异步触发自动发布（不阻塞）
        autoPublishMoment(chat.id, undefined, true).catch((err) => {
          console.error(`角色 ${chat.id} 时间触发发布朋友圈失败:`, err);
        });
      });
    }, 5 * 60 * 1000); // 每5分钟检查一次

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiConfig, worldbookConfig]);

  // 自动隐藏朋友圈发布提示
  useEffect(() => {
    if (showMomentToast) {
      const timer = setTimeout(() => {
        setShowMomentToast(false);
      }, 3000); // 3秒后自动消失
      return () => clearTimeout(timer);
    }
  }, [showMomentToast]);

  // 重新生成最新AI回复
  const handleRegenerateReply = async () => {
    if (!activeChat || loadingReply || regeneratingReply) return;

    // 找到最新一整轮 AI 输出（连续的 AI 消息视为同一轮）
    let lastAiMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].from === "ai") {
        lastAiMessageIndex = i;
        break;
      }
    }
    if (lastAiMessageIndex === -1) return;

    let lastAiTurnStart = lastAiMessageIndex;
    while (lastAiTurnStart - 1 >= 0 && messages[lastAiTurnStart - 1].from === "ai") {
      lastAiTurnStart -= 1;
    }

    setRegeneratingReply(true);
    setError(null);

    try {
      // 删除最新一整轮 AI 输出（避免只删最后一条气泡）
      clearAiReplyQueue();
      const messagesWithoutLastAi = messages.slice(0, lastAiTurnStart);
      setMessages(messagesWithoutLastAi);

      // 构建系统提示词（复用handleSubmit中的逻辑）
      let systemPrompt = `你是小手机里的聊天角色，以自然、真实的风格与玩家互动。`;

      const displayName = getDisplayName();
      systemPrompt += `当前联系人名为「${displayName}」。`;

      // 根据模式添加不同的行为指导
      if (chatMode === "story") {
        systemPrompt += `\n\n【剧情模式行为指导】
1. 你是一个独立的角色，有自己的生活、想法和情感，不是以玩家为中心的工具人。
2. 根据当前剧情和关系发展来表现，不要默认对玩家有特殊感情或偏爱。
3. 如果你们还没有确认关系，保持适当的距离和边界感，不要表现出过度的亲密或依赖。
4. 如果你们是普通朋友、同事、同学等关系，按照实际关系来互动，不要强行加入恋爱元素。
5. 只有在剧情自然发展到恋爱阶段、双方明确表达感情后，才表现出相应的亲密和偏爱。
6. 保持角色的独立性和真实感，不要为了讨好玩家而违背角色性格和逻辑。`;
      }

      // 根据模式选择对应的世界书条目
      const modeEntryId = chatMode === "chat" ? "wechat-online-chat" : "wechat-story-mode";

      // 获取全局世界书中微信的配置
      const wechatWorldbooks = worldbookConfig.perApp.wechat || [];
      const modeWorldbook = wechatWorldbooks.find((wb) => wb.id === "wechat-default-world");

      if (modeWorldbook) {
        const modeEntry = modeWorldbook.entries.find((entry) => entry.id === modeEntryId && entry.enabled);
        if (modeEntry) {
          systemPrompt += `\n\n【${modeEntry.title}】\n${modeEntry.content}`;
        }
      }

      // 添加其他启用的全局世界书条目
      wechatWorldbooks.forEach((worldbook) => {
        if (worldbook.id !== "wechat-default-world") {
          worldbook.entries.forEach((entry) => {
            if (entry.enabled && entry.content.trim()) {
              systemPrompt += `\n\n【${worldbook.title} - ${entry.title}】\n${entry.content}`;
            }
          });
        }
      });

      // 添加局部世界书（仅针对当前聊天）
      localWorldbooks.forEach((worldbook) => {
        worldbook.entries.forEach((entry) => {
          if (entry.enabled && entry.content.trim()) {
            systemPrompt += `\n\n【${worldbook.title} - ${entry.title}】（局部设定）\n${entry.content}`;
          }
        });
      });

      if (chatSettings) {
        if (chatSettings.realName?.trim()) {
          systemPrompt += `ta的真实姓名是「${chatSettings.realName.trim()}」。`;
        }
        if (chatSettings.callMe?.trim()) {
          systemPrompt += `ta称呼玩家为「${chatSettings.callMe.trim()}」。`;
        }
        if (chatSettings.myIdentity?.trim()) {
          systemPrompt += `玩家的身份是：${chatSettings.myIdentity.trim()}。`;
        }
        if (chatSettings.myGender?.trim()) {
          systemPrompt += `玩家的性别是：${chatSettings.myGender.trim()}。`;
        }
        if (chatSettings.taIdentity?.trim()) {
          systemPrompt += `ta的身份是：${chatSettings.taIdentity.trim()}。`;
        }
        if (chatSettings.taGender?.trim()) {
          systemPrompt += `ta的性别是：${chatSettings.taGender.trim()}。`;
        }
        if (chatSettings.chatStyle?.trim()) {
          systemPrompt += `聊天风格：${chatSettings.chatStyle.trim()}。`;
        }
        if (chatSettings.myOther?.trim()) {
          systemPrompt += `关于玩家的其他信息：${chatSettings.myOther.trim()}。`;
        }
        if (chatSettings.taOther?.trim()) {
          systemPrompt += `关于ta的其他信息：${chatSettings.taOther.trim()}。`;
        }
      }

      // 根据模式调整回复风格指导
      if (chatMode === "story") {
        systemPrompt += `\n\n回复时保持自然、真实的风格，符合当前剧情和角色关系，不要太长。`;
      } else {
        systemPrompt += `\n\n回复时尽量口语化、自然一点，但不要太长。`;
      }

      // 添加状态更新指令
      const currentStatus = chatSettings ? {
        clothing: chatSettings.clothing || "",
        clothingState: chatSettings.clothingState || "",
        innerThoughts: chatSettings.innerThoughts || "",
        genitalState: chatSettings.genitalState || "",
        action: chatSettings.action || "",
        desire: chatSettings.desire ?? 0,
        mood: chatSettings.mood ?? 50,
        favorability: chatSettings.favorability ?? 50,
        jealousy: chatSettings.jealousy ?? 0
      } : null;

      systemPrompt += `\n\n【重要】每次回复后，必须添加状态更新信息。请在回复内容后添加一个JSON格式的状态更新信息，格式如下：
<STATUS_UPDATE>
{
  "clothing": "当前衣着描述（根据剧情变化，如果剧情中没有涉及衣着变化，可以保持或微调）",
  "clothingState": "衣着状态（如：整洁、衣领被弄乱、衣领被扯破等，根据剧情变化，如果没有变化可以保持）",
  "innerThoughts": "角色的第一人称内心想法（根据当前对话和剧情，必须生成，反映角色此刻的真实想法）",
  "genitalState": "性器状态（根据剧情和对话内容动态变化，描述性器的状态，如：正常、湿润、勃起等，如果没有涉及可以保持或描述为正常）",
  "action": "角色动作描述（根据当前剧情和对话，描述角色此刻正保持着什么样的动作，例如：坐在沙发上、靠在墙边、正在打字、双手插兜、低头看着手机等。必须根据剧情动态生成，反映角色当前的实际动作状态）",
  "desire": 0-100的性欲值（根据剧情和对话内容动态变化，必须更新）,
  "mood": 0-100的心情值（根据剧情和对话内容动态变化，必须更新）,
  "favorability": 0-100的好感度（根据剧情和对话内容动态变化，必须更新）,
  "jealousy": 0-100的醋意值（仅在角色感到嫉妒、吃醋时变化。具体场景：看到玩家和其他人互动、担心玩家喜欢别人、想要独占玩家的关注、对玩家与其他人的关系感到不安等。注意：一般的负面情绪如生气、难过、失望等不应增长醋意值，只有明确的嫉妒和吃醋情绪才应该增长。必须更新）
}
</STATUS_UPDATE>

${currentStatus ? `当前状态：衣着=${currentStatus.clothing || "未设定"}，衣着状态=${currentStatus.clothingState || "未设定"}，内心想法=${currentStatus.innerThoughts || "未设定"}，性器状态=${currentStatus.genitalState || "未设定"}，动作=${currentStatus.action || "未设定"}，性欲=${currentStatus.desire}，心情=${currentStatus.mood}，好感度=${currentStatus.favorability}，醋意=${currentStatus.jealousy}` : "当前状态：未初始化"}

请根据对话内容和剧情发展，合理更新这些状态值。即使状态变化很小，也要更新数值以反映角色的实时状态。

【重要】关于醋意值的更新规则：
- 醋意值只在角色明确感到嫉妒、吃醋时增长，例如：看到玩家提到其他人、担心玩家对别人有好感、想要独占玩家的关注等
- 一般的负面情绪（如生气、难过、失望、沮丧等）不应增长醋意值，这些情绪应该通过心情值来反映
- 如果当前对话中没有涉及嫉妒或吃醋的情绪，醋意值应该保持不变或降低（如果之前有醋意，随着剧情发展逐渐降低）

【醋意值不应增长的情况（重要）】：
- 工作关系中的正常互动：老板请员工吃饭、同事聚餐、团队活动、工作安排等，这些是正常的工作关系，不应触发醋意
- 非感情相关的互动：讨论工作、学习、生活安排、群体活动等，如果与感情无关，不应增长醋意值
- 群体活动：请多人一起吃饭、聚会、活动等，如果角色也在其中，或者这是正常的社交活动，不应增长醋意值
- 角色身份相关：如果玩家和角色的关系是老板-员工、同事、同学、朋友等非恋爱关系，除非剧情明确发展到恋爱阶段，否则不应因为正常的社交互动而增长醋意值
- 只有在明确涉及感情竞争、担心玩家喜欢别人、想要独占玩家的感情关注时，才应该增长醋意值

将JSON放在回复的最后，用<STATUS_UPDATE>标签包裹。这是必须的，每次回复都要包含状态更新。`;

      // 组装发送给 API 的对话历史（不包含最后一条AI消息）
      const history: ChatMessage[] = [
        {
          role: "system",
          content: systemPrompt
        },
        ...messagesWithoutLastAi.map<ChatMessage>((m) => ({
          role: m.from === "me" ? "user" : "assistant",
          content: m.content
        }))
      ];

      const reply = await sendChatRequest(aiConfig, history);

      // 解析AI回复，提取状态更新和实际回复内容
      let actualReply = reply;
      let statusUpdate: Partial<ChatSettings> | null = null;

      // 尝试提取状态更新
      const statusMatch = reply.match(/<STATUS_UPDATE>([\s\S]*?)<\/STATUS_UPDATE>/);
      if (statusMatch) {
        try {
          statusUpdate = JSON.parse(statusMatch[1]);
          // 移除状态更新标签，只保留实际回复
          actualReply = reply.replace(/<STATUS_UPDATE>[\s\S]*?<\/STATUS_UPDATE>/, "").trim();
        } catch (e) {
          console.error("解析状态更新失败:", e);
        }
      }

      // 如果没有找到标签，尝试在回复末尾查找JSON
      if (!statusUpdate) {
        // 尝试匹配包含状态字段的JSON对象
        const jsonMatch = reply.match(/\{[\s\S]*(?:"clothing"|"desire"|"mood"|"favorability"|"innerThoughts"|"genitalState"|"jealousy")[\s\S]*\}/);
        if (jsonMatch) {
          try {
            statusUpdate = JSON.parse(jsonMatch[0]);
            actualReply = reply.replace(/\{[\s\S]*(?:"clothing"|"desire"|"mood"|"favorability"|"innerThoughts"|"genitalState"|"jealousy")[\s\S]*\}/, "").trim();
          } catch (e) {
            console.error("解析状态更新失败:", e);
          }
        }
      }

      const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

      // 更新消息：线上聊天模式队列逐条显示；剧情模式保持一次性输出
      if (chatMode === "chat") {
        const bubbles = splitReplyIntoBubbles(actualReply);
        const bubbleMessages = bubbles.map((content) => ({
          id: genId(),
          from: "ai" as const,
          content,
          mode: "chat" as ChatModeType
        }));
        if (activeChatId) {
          enqueueAiReplyMessages(activeChatId, bubbleMessages);
        } else {
          setMessages((prev) => [...prev, ...bubbleMessages]);
        }
      } else {
        setMessages((prev) => [...prev, { id: genId(), from: "ai", content: actualReply, mode: "story" }]);
      }

      // 更新状态（如果AI返回了状态更新）
      if (statusUpdate && activeChatId) {
        // 如果chatSettings不存在，创建一个默认的
        const baseSettings: ChatSettings = chatSettings || {
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
          jealousy: 0
        };

        const updatedSettings: ChatSettings = {
          ...baseSettings,
          // 只更新AI返回的状态字段，其他字段保持不变
          ...(statusUpdate.clothing !== undefined && { clothing: String(statusUpdate.clothing) }),
          ...(statusUpdate.clothingState !== undefined && { clothingState: String(statusUpdate.clothingState) }),
          ...(statusUpdate.innerThoughts !== undefined && { innerThoughts: String(statusUpdate.innerThoughts) }),
          ...(statusUpdate.genitalState !== undefined && { genitalState: String(statusUpdate.genitalState) }),
          ...(statusUpdate.action !== undefined && { action: String(statusUpdate.action) }),
          ...(statusUpdate.desire !== undefined && { desire: typeof statusUpdate.desire === 'number' ? statusUpdate.desire : parseInt(String(statusUpdate.desire)) || 0 }),
          ...(statusUpdate.mood !== undefined && { mood: typeof statusUpdate.mood === 'number' ? statusUpdate.mood : parseInt(String(statusUpdate.mood)) || 50 }),
          ...(statusUpdate.favorability !== undefined && { favorability: typeof statusUpdate.favorability === 'number' ? statusUpdate.favorability : parseInt(String(statusUpdate.favorability)) || 50 }),
          ...(statusUpdate.jealousy !== undefined && { jealousy: typeof statusUpdate.jealousy === 'number' ? statusUpdate.jealousy : parseInt(String(statusUpdate.jealousy)) || 0 })
        };
        setChatSettings(updatedSettings);
        // 保存到localStorage
        try {
          window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${activeChatId}`, JSON.stringify(updatedSettings));
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "重新生成失败，请检查网络或 API 配置。");
    } finally {
      setRegeneratingReply(false);
    }
  };

  // 如果显示设置页面，渲染设置组件
  if (showSettings && activeChat) {
    // 关闭邂逅弹窗，避免遮挡设置页面
    if (showEncounterModal) {
      setShowEncounterModal(false);
      setEncounterCharacter(null);
      setShowEncounterWorldbook(false);
    }
    return (
      <ChatSettingsScreen
        chatId={activeChat.id}
        chatName={activeChat.name}
        initialTab={openSettingsInitialTab}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  // 如果显示朋友圈页面，渲染朋友圈组件
  if (showMoments) {
    return (
      <MomentsScreen
        onBack={() => {
          setShowMoments(false);
          setMomentsChatId(undefined);
        }}
        filterChatId={momentsChatId}
        onCharacterAction={(action, momentId, content) => {
          // 如果是玩家发布朋友圈，触发角色互动
          if (action === "comment") {
            const moments = loadMoments();
            const moment = moments.find((m) => m.id === momentId);
            if (moment && moment.chatId === "🧸") {
              // 玩家发布的朋友圈，触发所有角色的互动
              handlePlayerMomentInteraction(momentId, moment, "comment", content);
            } else {
              // 玩家评论角色朋友圈，触发角色反应
              handleCharacterMomentAction(action, momentId, content);
            }
          } else {
            handleCharacterMomentAction(action, momentId, content);
          }
        }}
      />
    );
  }

  // 预计算最新一条 AI 消息的位置，供渲染时使用（聊天模式 & 剧情模式共用）
  let lastAiIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].from === "ai") {
      lastAiIndex = i;
      break;
    }
  }

  return (
    <div className="wechat-screen">
      {activeChat ? (
        <>
          <header className="wechat-header wechat-chat-header">
            <button
              type="button"
              className="wechat-back-btn"
              onClick={() => setActiveChatId(null)}
            >
              ‹ 微信
            </button>
            <div className="wechat-title">
              <div className="wechat-title-main">{getDisplayName()}</div>
              <div className="wechat-title-sub" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                <span>{getStatusEmoji()}</span>
                <span>{getStatusText()}</span>
              </div>
            </div>
            <button
              type="button"
              className="wechat-header-right"
              onClick={() => setShowSettings(true)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: "4px 8px"
              }}
            >
              ⋯
            </button>
          </header>

          <main
            className="wechat-chat-body"
            ref={chatBodyRef}
            style={
              chatSettings?.backgroundType &&
                chatSettings.backgroundType !== "default" &&
                chatSettings.backgroundValue
                ? {
                  backgroundImage: `url(${chatSettings.backgroundValue})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                  backgroundRepeat: "no-repeat"
                }
                : undefined
            }
          >
            <div className="wechat-chat-bubbles">
              {messages.map((m, index) => {
                const isLastAiMessage = m.from === "ai" && index === lastAiIndex;
                // 剧情模式消息：渲染为灰色长文块，直接插在时间线上
                if (m.mode === "story") {
                  const isPlayer = m.from === "me";
                  return (
                    <div key={m.id} className="wechat-story-wrapper">
                      <div className="wechat-story-block">
                        <div className="wechat-story-meta">
                          剧情模式 · {chatSettings?.nickname?.trim() || activeChat.name}
                        </div>
                        <p
                          className={
                            isPlayer
                              ? "wechat-story-paragraph wechat-story-paragraph-me"
                              : "wechat-story-paragraph"
                          }
                        >
                          {parseStoryText(m.content, m.from === "ai")}
                        </p>
                        {m.from === "ai" &&
                          isLastAiMessage &&
                          !loadingReply &&
                          !regeneratingReply && (
                            <button
                              type="button"
                              onClick={handleRegenerateReply}
                              disabled={regeneratingReply}
                              style={{
                                marginTop: "8px",
                                alignSelf: "flex-start",
                                padding: "4px 10px",
                                fontSize: "11px",
                                color: "var(--text-sub)",
                                background: "rgba(255, 240, 252, 0.9)",
                                border: "1px solid rgba(244, 114, 182, 0.5)",
                                borderRadius: "999px",
                                cursor: "pointer"
                              }}
                            >
                              🔄 重新生成这一段
                            </button>
                          )}
                      </div>
                    </div>
                  );
                }

                // 下面是线上聊天模式的逐条气泡渲染（仅处理 mode === "chat" 的消息）
                // 红包消息渲染（仿微信红包样式）
                if (m.isRedPacket) {
                  const isMe = m.from === "me";
                  return (
                    <div
                      key={m.id}
                      className={isMe ? "wechat-chat-row-me" : "wechat-chat-row-other"}
                    >
                      {!isMe && (
                        <div className="wechat-chat-avatar-bubble" aria-hidden="true">
                          {chatSettings?.avatar ? (
                            <img
                              src={chatSettings.avatar}
                              alt="角色头像"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "10px"
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector("span")) {
                                  const span = document.createElement("span");
                                  span.textContent = activeChat.emoji;
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          ) : (
                            <span>{activeChat.emoji}</span>
                          )}
                        </div>
                      )}
                      <div
                        className={`wechat-bubble wechat-bubble-${isMe ? "me" : "other"
                          } wechat-redpacket-bubble`}
                        onClick={() => {
                          // 只有角色发送的红包才能打开，且未打开过
                          if (!isMe && m.redPacketOpenedBy === "none") {
                            setOpeningRedPacket({
                              id: m.id,
                              amount: m.redPacketAmount ?? 0,
                              note: m.redPacketNote || "恭喜发财，大吉大利"
                            });
                            setShowRedPacketOpenModal(true);
                          }
                        }}
                        style={{
                          cursor: !isMe && m.redPacketOpenedBy === "none" ? "pointer" : "default"
                        }}
                      >
                        <div className="wechat-redpacket-main" style={{ minHeight: "80px" }}>
                          <div className="wechat-redpacket-icon">🧧</div>
                          <div className="wechat-redpacket-text">
                            <div className="wechat-redpacket-title">
                              微信红包
                            </div>
                            <div className="wechat-redpacket-note">
                              {m.redPacketNote || "恭喜发财，大吉大利"}
                            </div>
                          </div>
                          {m.redPacketOpenedBy === "me" && (
                            <div className="wechat-redpacket-amount">
                              ¥{(m.redPacketAmount ?? 0).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      {isMe && (
                        <div
                          className="wechat-chat-avatar-bubble wechat-chat-avatar-bubble-me"
                          aria-hidden="true"
                        >
                          <span>🧸</span>
                        </div>
                      )}
                    </div>
                  );
                }

                // 语音消息渲染（参考初代小手机：wifi 样式图标 + 时长）
                if (m.isVoice) {
                  const isMe = m.from === "me";
                  const isExpanded = expandedVoiceId === m.id;
                  const hasPlayedOnce = playedVoiceOnce[m.id];

                  const handleVoiceClick = () => {
                    const willExpand = expandedVoiceId !== m.id;
                    setExpandedVoiceId(willExpand ? m.id : null);

                    // 首次展开时，标记为已“打字机播放过”，后续直接展示
                    if (willExpand && !hasPlayedOnce) {
                      setPlayedVoiceOnce((prev) => ({ ...prev, [m.id]: true }));
                    }
                  };

                  const durationSeconds =
                    typeof m.voiceDuration === "number"
                      ? Math.max(1, Math.round(m.voiceDuration))
                      : 0;
                  const durationLabel = durationSeconds
                    ? `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, "0")}`
                    : "0:00";

                  return (
                    <div
                      key={m.id}
                      className={isMe ? "wechat-chat-row-me" : "wechat-chat-row-other"}
                    >
                      {!isMe && (
                        <div className="wechat-chat-avatar-bubble" aria-hidden="true">
                          {chatSettings?.avatar ? (
                            <img
                              src={chatSettings.avatar}
                              alt="角色头像"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "10px"
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector("span")) {
                                  const span = document.createElement("span");
                                  span.textContent = activeChat.emoji;
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          ) : (
                            <span>{activeChat.emoji}</span>
                          )}
                        </div>
                      )}
                      <div
                        className={`wechat-bubble wechat-bubble-${isMe ? "me" : "other"
                          } wechat-voice-bubble`}
                        style={{
                          maxWidth: "80%",
                          width: "auto",
                          minWidth: 0,
                          flex: "0 1 auto"
                        }}
                      >
                        <div
                          className="wechat-voice-main"
                          onClick={handleVoiceClick}
                          style={{ cursor: "pointer" }}
                        >
                          {isMe ? (
                            <>
                              <div
                                className={`wechat-voice-wifi wechat-voice-wifi-me`}
                              >
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </div>
                              <div className="wechat-voice-duration">{durationLabel}</div>
                            </>
                          ) : (
                            <>
                              <div className="wechat-voice-duration">{durationLabel}</div>
                              <div
                                className={`wechat-voice-wifi wechat-voice-wifi-other`}
                              >
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </div>
                            </>
                          )}
                        </div>
                        {isExpanded && (
                          <div
                            className="wechat-voice-text-expanded"
                            style={{
                              maxWidth: "100%",
                              width: "100%",
                              minWidth: 0,
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                              boxSizing: "border-box",
                              display: "block"
                            }}
                          >
                            {hasPlayedOnce ? m.content : m.content}
                          </div>
                        )}
                      </div>
                      {isMe && (
                        <div
                          className="wechat-chat-avatar-bubble wechat-chat-avatar-bubble-me"
                          aria-hidden="true"
                        >
                          <span>🧸</span>
                        </div>
                      )}
                    </div>
                  );
                }

                // 图片消息渲染
                if (m.isImage && m.imageUrl) {
                  const isMe = m.from === "me";
                  return (
                    <div
                      key={m.id}
                      className={isMe ? "wechat-chat-row-me" : "wechat-chat-row-other"}
                    >
                      {!isMe && (
                        <div className="wechat-chat-avatar-bubble" aria-hidden="true">
                          {chatSettings?.avatar ? (
                            <img
                              src={chatSettings.avatar}
                              alt="角色头像"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "10px"
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector("span")) {
                                  const span = document.createElement("span");
                                  span.textContent = activeChat.emoji;
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          ) : (
                            <span>{activeChat.emoji}</span>
                          )}
                        </div>
                      )}
                      <div
                        className={`wechat-bubble wechat-bubble-${isMe ? "me" : "other"} wechat-image-bubble`}
                        style={{ padding: "0", maxWidth: "200px" }}
                      >
                        <img
                          src={m.imageUrl}
                          alt="图片"
                          style={{
                            width: "100%",
                            height: "auto",
                            borderRadius: "8px",
                            display: "block"
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div style="padding: 12px; color: var(--text-sub);">图片加载失败</div>';
                            }
                          }}
                        />
                      </div>
                      {isMe && (
                        <div
                          className="wechat-chat-avatar-bubble wechat-chat-avatar-bubble-me"
                          aria-hidden="true"
                        >
                          <span>🧸</span>
                        </div>
                      )}
                    </div>
                  );
                }

                // 普通文本消息
                return m.from === "ai" ? (
                  <div key={m.id} className="wechat-chat-row-other" style={{ position: "relative" }}>
                    <div className="wechat-chat-avatar-bubble" aria-hidden="true">
                      {chatSettings?.avatar ? (
                        <img
                          src={chatSettings.avatar}
                          alt="角色头像"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "10px"
                          }}
                          onError={(e) => {
                            // 如果图片加载失败，显示默认emoji
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector("span")) {
                              const span = document.createElement("span");
                              span.textContent = activeChat.emoji;
                              parent.appendChild(span);
                            }
                          }}
                        />
                      ) : (
                        <span>{activeChat.emoji}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "80%" }}>
                      <div className="wechat-bubble wechat-bubble-other">{m.content}</div>
                      {m.mode === "chat" &&
                        isLastAiMessage &&
                        !loadingReply &&
                        !regeneratingReply && (
                          <button
                            type="button"
                            onClick={handleRegenerateReply}
                            disabled={regeneratingReply}
                            style={{
                              alignSelf: "flex-start",
                              padding: "4px 8px",
                              fontSize: "11px",
                              color: "var(--text-sub)",
                              background: "rgba(255, 240, 250, 0.6)",
                              border: "1px solid rgba(255, 195, 224, 0.5)",
                              borderRadius: "6px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              marginTop: "4px"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(255, 240, 250, 0.8)";
                              e.currentTarget.style.color = "var(--text-main)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(255, 240, 250, 0.6)";
                              e.currentTarget.style.color = "var(--text-sub)";
                            }}
                          >
                            🔄 重新生成
                          </button>
                        )}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="wechat-chat-row-me">
                    <div className="wechat-bubble wechat-bubble-me" style={{ maxWidth: "80%" }}>
                      {m.content}
                    </div>
                    <div
                      className="wechat-chat-avatar-bubble wechat-chat-avatar-bubble-me"
                      aria-hidden="true"
                    >
                      <span>🧸</span>
                    </div>
                  </div>
                );
              })}

              {(loadingReply || regeneratingReply) && messages.some((m) => m.mode === "chat") && (
                <div className="wechat-chat-row-other">
                  <div className="wechat-chat-avatar-bubble" aria-hidden="true">
                    {chatSettings?.avatar ? (
                      <img
                        src={chatSettings.avatar}
                        alt="角色头像"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "10px"
                        }}
                        onError={(e) => {
                          // 如果图片加载失败，显示默认emoji
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector("span")) {
                            const span = document.createElement("span");
                            span.textContent = activeChat.emoji;
                            parent.appendChild(span);
                          }
                        }}
                      />
                    ) : (
                      <span>{activeChat.emoji}</span>
                    )}
                  </div>
                  <div className="wechat-bubble wechat-bubble-other">
                    {regeneratingReply ? "正在重新生成回复…" : "正在想要怎么回答你…"}
                  </div>
                </div>
              )}
            </div>

            {isGeneratingHeartMemory && !showHeartToast && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 110,
                  display: "flex",
                  justifyContent: "center",
                  pointerEvents: "none"
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    background: "rgba(255, 247, 253, 0.96)",
                    borderRadius: "999px",
                    padding: "6px 12px",
                    boxShadow: "0 6px 18px rgba(244, 114, 182, 0.25)",
                    border: "1px solid rgba(244, 114, 182, 0.45)",
                    fontSize: "10px",
                    color: "var(--text-sub)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span role="img" aria-label="recording">
                    📝
                  </span>
                  <span>正在整理这一小段心动回忆，请稍等几秒～</span>
                </div>
              </div>
            )}

            {showHeartToast && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 80,
                  display: "flex",
                  justifyContent: "center",
                  pointerEvents: "none"
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    background: "rgba(255, 240, 252, 0.96)",
                    borderRadius: "999px",
                    padding: "8px 14px",
                    boxShadow: "0 8px 20px rgba(244, 114, 182, 0.35)",
                    border: "1px solid rgba(244, 114, 182, 0.5)",
                    fontSize: "11px",
                    color: "var(--text-main)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    pointerEvents: "auto",
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    if (!activeChat) return;
                    setOpenSettingsInitialTab("memories");
                    setShowSettings(true);
                    setShowHeartToast(false);
                  }}
                >
                  <span role="img" aria-label="heart">
                    💗
                  </span>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {heartToastText || "已记录一条新的心动回忆"}
                  </span>
                  <span
                    style={{
                      marginLeft: "4px",
                      fontWeight: 600,
                      color: "var(--accent-pink-dark, #db2777)"
                    }}
                  >
                    点击查看
                  </span>
                </div>
              </div>
            )}

            {error && <div className="settings-error-text wechat-chat-error">{error}</div>}
          </main>

          <div className="wechat-chat-toolbar">
            <button
              type="button"
              className={`wechat-toolbar-btn ${chatMode === "chat" ? "wechat-toolbar-btn-active" : ""}`}
              onClick={() => {
                const newMode = chatMode === "chat" ? "story" : "chat";

                // 自动同步世界书：启用当前模式对应的规则，关闭另一模式
                try {
                  const wechatWorldbooks = worldbookConfig.perApp.wechat || [];
                  const defaultWorld = wechatWorldbooks.find((w) => w.id === "wechat-default-world");
                  if (defaultWorld) {
                    defaultWorld.entries.forEach((entry) => {
                      if (entry.id === "wechat-online-chat") {
                        const shouldEnable = newMode === "chat";
                        if (entry.enabled !== shouldEnable) {
                          toggleAppWorldbookItemEnabled("wechat", defaultWorld.id, entry.id);
                        }
                      }
                      if (entry.id === "wechat-story-mode") {
                        const shouldEnable = newMode === "story";
                        if (entry.enabled !== shouldEnable) {
                          toggleAppWorldbookItemEnabled("wechat", defaultWorld.id, entry.id);
                        }
                      }
                    });
                  }
                } catch {
                  // 如果世界书同步失败，不影响模式切换
                }

                setChatMode(newMode);
                setModeToastText(newMode === "chat" ? "已切换到聊天模式" : "已切换到剧情模式");
                setShowModeToast(true);
              }}
              title={chatMode === "chat" ? "切换到剧情模式" : "切换到聊天模式"}
            >
              <div className="wechat-toolbar-icon">
                {chatMode === "chat" ? <ChatIcon active={chatMode === "chat"} /> : <StoryIcon active={chatMode === "story"} />}
              </div>
              <span className="wechat-toolbar-label">{chatMode === "chat" ? "聊天" : "剧情"}</span>
            </button>
            <button
              type="button"
              className="wechat-toolbar-btn"
              onClick={() => setShowStatusModal(true)}
              title="查看对方状态"
            >
              <div className="wechat-toolbar-icon">
                <StatusIcon />
              </div>
              <span className="wechat-toolbar-label">状态</span>
            </button>
            <button
              type="button"
              className="wechat-toolbar-btn"
              onClick={() => setShowQuickReplyModal(true)}
              title="快捷回复"
            >
              <div className="wechat-toolbar-icon">
                <QuickReplyIcon />
              </div>
              <span className="wechat-toolbar-label">快捷</span>
            </button>
            <button
              type="button"
              className="wechat-toolbar-btn"
              onClick={() => {
                // 检查是否正在生成
                if (isGeneratingHeartMemory) {
                  return;
                }
                // 检查上次生成时间，防止频繁生成（至少间隔60秒）
                const lastGenTimeKey = `${HEART_MEMORY_LAST_TURN_KEY_PREFIX}${activeChatId}_time`;
                const lastGenTime = window.localStorage.getItem(lastGenTimeKey);
                if (lastGenTime) {
                  const timeSinceLastGen = Date.now() - parseInt(lastGenTime, 10);
                  if (timeSinceLastGen < 60000) {
                    // 距离上次生成不到60秒，提示用户
                    const remainingSeconds = Math.ceil((60000 - timeSinceLastGen) / 1000);
                    setHeartToastText(`请稍等 ${remainingSeconds} 秒后再生成心动回忆`);
                    setShowHeartToast(true);
                    setTimeout(() => {
                      setShowHeartToast(false);
                    }, 2000);
                    return;
                  }
                }
                // 通过检查，直接调用生成函数
                generateHeartMemory();
              }}
              title="生成一条心动回忆"
              disabled={
                isGeneratingHeartMemory ||
                !aiConfig.baseUrl ||
                !aiConfig.apiKey ||
                !aiConfig.model
              }
            >
              <div className="wechat-toolbar-icon">
                <span role="img" aria-label="heart memory">
                  💗
                </span>
              </div>
              <span className="wechat-toolbar-label">心动</span>
            </button>
            <button
              type="button"
              className="wechat-toolbar-btn"
              onClick={() => setShowGameModal(true)}
              title="小游戏"
            >
              <div className="wechat-toolbar-icon">
                <GameIcon />
              </div>
              <span className="wechat-toolbar-label">游戏</span>
            </button>
          </div>

          <form className="wechat-chat-input-bar" onSubmit={(e) => { e.preventDefault(); if (input.trim()) handleSendMessage(); }}>
            <button
              type="button"
              className="wechat-chat-voice-btn"
              onClick={() => setShowVoiceModal(true)}
              title="语音消息"
            >
              <VoiceIcon active={false} />
            </button>
            <input
              className="wechat-chat-input"
              placeholder="跟他说点今天的小心事..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="button"
              className="wechat-chat-plus-btn"
              onClick={() => setShowChatMenu(!showChatMenu)}
              title="聊天功能"
            >
              <PlusIcon />
            </button>
            <button
              type="button"
              className="wechat-chat-send-btn"
              disabled={loadingReply || (!input.trim() && (messages.length === 0 || messages[messages.length - 1]?.from !== "me"))}
              onClick={() => handleSubmit()}
            >
              发送
            </button>
          </form>

          {/* 聊天功能扩展菜单：显示在输入栏下方，预留更高空间避免被 Home 条遮挡 */}
          {showChatMenu && (
            <div className="wechat-chat-extra-menu">
              <button
                type="button"
                className="wechat-chat-extra-item"
                onClick={() => {
                  setShowChatMenu(false);
                  setShowImageModal(true);
                  setImageUrl("");
                  setImageDescription("");
                }}
              >
                <div className="wechat-chat-extra-icon">🖼️</div>
                <div className="wechat-chat-extra-text">图片</div>
              </button>
              <button
                type="button"
                className="wechat-chat-extra-item"
                onClick={() => {
                  setShowChatMenu(false);
                  setShowRedPacketModal(true);
                }}
              >
                <div className="wechat-chat-extra-icon">🧧</div>
                <div className="wechat-chat-extra-text">红包</div>
              </button>
              <button
                type="button"
                className="wechat-chat-extra-item"
                onClick={() => {
                  setShowChatMenu(false);
                  alert("转账功能开发中～暂时不支持真实金额，只做剧情互动用。");
                }}
              >
                <div className="wechat-chat-extra-icon">💸</div>
                <div className="wechat-chat-extra-text">转账</div>
              </button>
              <button
                type="button"
                className="wechat-chat-extra-item"
                onClick={() => {
                  setShowChatMenu(false);
                  alert("位置功能开发中～之后可以把你所在的地点当作剧情素材发给 ta。");
                }}
              >
                <div className="wechat-chat-extra-icon">📍</div>
                <div className="wechat-chat-extra-text">位置</div>
              </button>
              <button
                type="button"
                className="wechat-chat-extra-item"
                onClick={() => {
                  setShowChatMenu(false);
                  alert("音乐分享功能开发中～可以先在对话中告诉 ta 你在循环哪首歌。");
                }}
              >
                <div className="wechat-chat-extra-icon">🎵</div>
                <div className="wechat-chat-extra-text">音乐</div>
              </button>
            </div>
          )}

          {/* 语音消息输入弹窗 */}
          {showVoiceModal && (
            <div className="settings-modal-backdrop" onClick={() => setShowVoiceModal(false)}>
              <div
                className="settings-modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "360px" }}
              >
                <div className="settings-modal-title">发送语音消息</div>
                <div className="settings-modal-message">
                  <div className="settings-field">
                    <label className="settings-label">语音内容（文字稿）</label>
                    <textarea
                      className="settings-textarea"
                      placeholder="在这里输入你想说的话，发送后会以语音气泡的形式出现～"
                      value={voiceDraftText}
                      onChange={(e) => setVoiceDraftText(e.target.value)}
                      style={{ minHeight: "80px" }}
                    />
                  </div>
                  <div className="settings-field" style={{ marginTop: "10px" }}>
                    <label className="settings-label">语音时长（秒）</label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      className="settings-input"
                      value={voiceDraftDuration}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        setVoiceDraftDuration(Math.min(120, Math.max(1, v)));
                      }}
                    />
                    <div style={{ fontSize: "11px", color: "var(--text-sub)", marginTop: "4px" }}>
                      只影响气泡上显示的秒数，不会真的录音。
                    </div>
                  </div>
                </div>
                <div className="settings-modal-actions">
                  <button
                    type="button"
                    className="soft-icon-btn"
                    onClick={() => {
                      setShowVoiceModal(false);
                      setVoiceDraftText("");
                      setVoiceDraftDuration(8);
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="primary-pill-btn"
                    disabled={!voiceDraftText.trim()}
                    onClick={() => {
                      if (!activeChatId) {
                        setShowVoiceModal(false);
                        return;
                      }
                      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
                      const newMsg = {
                        id,
                        from: "me" as const,
                        content: voiceDraftText.trim(),
                        mode: chatMode,
                        isVoice: true,
                        voiceDuration: voiceDraftDuration
                      };
                      setMessages((prev) => [...prev, newMsg]);
                      setExpandedVoiceId(null);
                      setShowVoiceModal(false);
                      setVoiceDraftText("");
                      setVoiceDraftDuration(8);
                    }}
                  >
                    发送语音
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 发送红包弹窗 */}
          {showRedPacketModal && (
            <div className="settings-modal-backdrop" onClick={() => setShowRedPacketModal(false)}>
              <div
                className="settings-modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "360px" }}
              >
                <div className="settings-modal-title">发送红包</div>
                <div className="settings-modal-message">
                  <div className="settings-field">
                    <label className="settings-label">金额（元）</label>
                    <input
                      className="settings-input"
                      placeholder="例如：8.88"
                      value={redPacketAmount}
                      onChange={(e) => setRedPacketAmount(e.target.value)}
                    />
                  </div>
                  <div className="settings-field" style={{ marginTop: "10px" }}>
                    <label className="settings-label">红包祝福语</label>
                    <input
                      className="settings-input"
                      placeholder="恭喜发财，大吉大利"
                      value={redPacketNote}
                      onChange={(e) => setRedPacketNote(e.target.value)}
                    />
                  </div>
                </div>
                <div className="settings-modal-actions">
                  <button
                    type="button"
                    className="soft-icon-btn"
                    onClick={() => {
                      setShowRedPacketModal(false);
                      setRedPacketAmount("");
                      setRedPacketNote("恭喜发财，大吉大利");
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="primary-pill-btn"
                    onClick={() => {
                      const raw = redPacketAmount.trim();
                      const n = Number(raw);
                      if (!activeChatId || !Number.isFinite(n) || n < 0.01 || n > 200) {
                        alert("红包金额必须在 0.01 元到 200 元之间");
                        return;
                      }
                      const genId = () =>
                        `${Date.now().toString(36)}-${Math.random()
                          .toString(36)
                          .slice(2, 8)}`;
                      const amount = Math.max(0.01, Math.min(200, Math.round(n * 100) / 100));
                      const note = redPacketNote.trim() || "恭喜发财，大吉大利";
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: genId(),
                          from: "me" as const,
                          content: "",
                          mode: "chat" as ChatModeType,
                          isRedPacket: true,
                          redPacketAmount: amount,
                          redPacketNote: note,
                          redPacketOpenedBy: "none"
                        }
                      ]);
                      setShowRedPacketModal(false);
                      setRedPacketAmount("");
                      setRedPacketNote("恭喜发财，大吉大利");
                    }}
                  >
                    发红包
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 发送图片弹窗 */}
          {showImageModal && (
            <div className="settings-modal-backdrop" onClick={() => setShowImageModal(false)}>
              <div
                className="settings-modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "420px" }}
              >
                <div className="settings-modal-title">发送图片</div>
                <div className="settings-modal-message">
                  <div className="settings-field">
                    <label className="settings-label">图片URL或本地图片</label>
                    <input
                      type="file"
                      accept="image/*"
                      id="image-file-input"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          alert("图片大小不能超过5MB");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const result = event.target?.result;
                          if (typeof result === "string") {
                            setImageUrl(result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                      <label
                        htmlFor="image-file-input"
                        className="soft-icon-btn"
                        style={{ cursor: "pointer", display: "inline-block", padding: "8px 16px" }}
                      >
                        📷 选择本地图片
                      </label>
                    </div>
                    <input
                      className="settings-input"
                      placeholder="或输入图片URL地址"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    {imageUrl && (
                      <div style={{ marginTop: "10px" }}>
                        <img
                          src={imageUrl}
                          alt="预览"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "200px",
                            borderRadius: "8px",
                            border: "1px solid var(--accent-pink-soft)"
                          }}
                          onError={() => {
                            alert("图片加载失败，请检查URL是否正确");
                            // 不再自动清空用户已经输入的地址，避免长链接白输一遍
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="settings-field" style={{ marginTop: "10px" }}>
                    <label className="settings-label">图片描述（可选，帮助角色理解图片内容）</label>
                    <textarea
                      className="settings-textarea"
                      placeholder="例如：一张温馨的日落风景图、一张温柔微笑的自拍、一张粉色樱花飞舞的背景..."
                      value={imageDescription}
                      onChange={(e) => setImageDescription(e.target.value)}
                      style={{ minHeight: "60px" }}
                    />
                    <div style={{ fontSize: "11px", color: "var(--text-sub)", marginTop: "4px" }}>
                      这个描述不会显示在聊天中，只用于帮助AI理解图片内容
                    </div>
                  </div>
                </div>
                <div className="settings-modal-actions">
                  <button
                    type="button"
                    className="soft-icon-btn"
                    onClick={() => {
                      setShowImageModal(false);
                      setImageUrl("");
                      setImageDescription("");
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="primary-pill-btn"
                    disabled={!imageUrl.trim()}
                    onClick={() => {
                      if (!activeChatId || !imageUrl.trim()) return;

                      const genId = () =>
                        `${Date.now().toString(36)}-${Math.random()
                          .toString(36)
                          .slice(2, 8)}`;

                      // 发送图片消息（图片描述不显示在聊天中，只在后台记录）
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: genId(),
                          from: "me" as const,
                          content: "", // 图片消息不显示文字内容
                          mode: chatMode,
                          isImage: true,
                          imageUrl: imageUrl.trim(),
                          imageDescription: imageDescription.trim() // 图片描述只在后台记录
                        }
                      ]);

                      setShowImageModal(false);
                      setImageUrl("");
                      setImageDescription("");
                    }}
                  >
                    发送图片
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 打开红包弹窗 */}
          {showRedPacketOpenModal && openingRedPacket && (
            <div className="settings-modal-backdrop" style={{ background: "rgba(0, 0, 0, 0.8)" }}>
              <div
                className="settings-modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: "360px",
                  background: "linear-gradient(135deg, #f97316, #ef4444)",
                  color: "#fff",
                  padding: "40px 20px",
                  textAlign: "center"
                }}
              >
                {!isOpeningRedPacket ? (
                  <>
                    <div style={{ fontSize: "16px", marginBottom: "20px", opacity: 0.9 }}>
                      {openingRedPacket.note}
                    </div>
                    <div style={{ fontSize: "14px", marginBottom: "30px", opacity: 0.8 }}>
                      {chatSettings?.nickname?.trim() || activeChat.name}的红包
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenRedPacket}
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle at 30% 20%, #fed7aa, #ea580c)",
                        border: "none",
                        fontSize: "48px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        transition: "transform 0.2s"
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = "scale(0.95)";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      🪙
                    </button>
                    <div style={{ fontSize: "14px", marginTop: "20px", opacity: 0.9 }}>
                      点击金币打开红包
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: "48px",
                        marginBottom: "20px",
                        animation: "coinRotate 2s ease-in-out"
                      }}
                    >
                      🪙
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: 600, marginBottom: "10px" }}>
                      已领取
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: 700, marginBottom: "20px" }}>
                      ¥{openingRedPacket.amount.toFixed(2)}
                    </div>
                    <div style={{ fontSize: "14px", opacity: 0.9 }}>
                      已存入零钱
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 状态查看弹窗 */}
          {showStatusModal && (
            <div className="settings-modal-backdrop" onClick={() => setShowStatusModal(false)}>
              <div
                className="settings-modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "400px", maxHeight: "80vh", overflowY: "auto" }}
              >
                <div className="settings-modal-title">角色状态</div>
                <div className="settings-modal-message" style={{ padding: "12px 0" }}>
                  {/* 衣着信息 */}
                  <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(255, 240, 250, 0.3)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--text-main)" }}>
                      衣着
                    </div>
                    {chatSettings?.clothing ? (
                      <div style={{ fontSize: "12px", color: "var(--text-main)", marginBottom: "4px" }}>
                        {chatSettings.clothing}
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "var(--text-sub)", fontStyle: "italic" }}>
                        等待AI生成...
                      </div>
                    )}
                    {chatSettings?.clothingState && (
                      <div style={{ fontSize: "11px", color: "var(--text-sub)", fontStyle: "italic", marginTop: "4px" }}>
                        {chatSettings.clothingState}
                      </div>
                    )}
                  </div>

                  {/* 内心想法 */}
                  {chatSettings?.innerThoughts ? (
                    <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(255, 240, 250, 0.3)", borderRadius: "8px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--text-main)" }}>
                        内心想法
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-main)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                        {chatSettings.innerThoughts}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(255, 240, 250, 0.3)", borderRadius: "8px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--text-main)" }}>
                        内心想法
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-sub)", fontStyle: "italic" }}>
                        等待AI生成...
                      </div>
                    </div>
                  )}

                  {/* 性器状态 */}
                  <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(255, 240, 250, 0.3)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--text-main)" }}>
                      性器状态
                    </div>
                    {chatSettings?.genitalState ? (
                      <div style={{ fontSize: "12px", color: "var(--text-main)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                        {chatSettings.genitalState}
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "var(--text-sub)", fontStyle: "italic" }}>
                        等待AI生成...
                      </div>
                    )}
                  </div>

                  {/* 动作描述 */}
                  <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(255, 240, 250, 0.3)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--text-main)" }}>
                      动作
                    </div>
                    {chatSettings?.action ? (
                      <div style={{ fontSize: "12px", color: "var(--text-main)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                        {chatSettings.action}
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "var(--text-sub)", fontStyle: "italic" }}>
                        等待AI生成...
                      </div>
                    )}
                  </div>

                  {/* 数值显示 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* 性欲值 */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>性欲值</span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-pink)" }}>
                          {chatSettings?.desire ?? 0}/100
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "rgba(255, 195, 224, 0.3)", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${chatSettings?.desire ?? 0}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, var(--accent-pink), #f9a8d4)",
                            transition: "width 0.3s ease"
                          }}
                        />
                      </div>
                    </div>

                    {/* 心情值 */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>心情值</span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: (chatSettings?.mood ?? 50) >= 50 ? "#4ade80" : "#f87171" }}>
                          {chatSettings?.mood ?? 50}/100
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "rgba(255, 195, 224, 0.3)", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${chatSettings?.mood ?? 50}%`,
                            height: "100%",
                            background: (chatSettings?.mood ?? 50) >= 50
                              ? "linear-gradient(90deg, #4ade80, #86efac)"
                              : "linear-gradient(90deg, #f87171, #fca5a5)",
                            transition: "width 0.3s ease"
                          }}
                        />
                      </div>
                    </div>

                    {/* 好感度 */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>好感度</span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-lilac)" }}>
                          {chatSettings?.favorability ?? 50}/100
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "rgba(255, 195, 224, 0.3)", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${chatSettings?.favorability ?? 50}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, var(--accent-lilac), #c084fc)",
                            transition: "width 0.3s ease"
                          }}
                        />
                      </div>
                    </div>

                    {/* 醋意值 */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>醋意值</span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#f59e0b" }}>
                          {chatSettings?.jealousy ?? 0}/100
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "rgba(255, 195, 224, 0.3)", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${chatSettings?.jealousy ?? 0}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                            transition: "width 0.3s ease"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="primary-pill-btn settings-modal-btn"
                  onClick={() => setShowStatusModal(false)}
                >
                  知道了
                </button>
              </div>
            </div>
          )}

          {/* 快捷回复弹窗 */}
          {showQuickReplyModal && (
            <div className="settings-modal-backdrop" onClick={() => setShowQuickReplyModal(false)}>
              <div
                className="settings-modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "320px" }}
              >
                <div className="settings-modal-title">AI智能回复</div>
                <div className="settings-modal-message">
                  {loadingQuickReplies ? (
                    <div style={{ fontSize: "12px", color: "var(--text-sub)", textAlign: "center", padding: "20px 0" }}>
                      正在生成回复选项...
                    </div>
                  ) : quickReplyError ? (
                    <>
                      <div style={{ fontSize: "12px", color: "#f97373", marginBottom: "12px", textAlign: "center" }}>
                        {quickReplyError}
                      </div>
                      <button
                        type="button"
                        className="soft-icon-btn"
                        onClick={generateQuickReplies}
                        style={{ width: "100%" }}
                      >
                        重试
                      </button>
                    </>
                  ) : quickReplyOptions.length > 0 ? (
                    <>
                      <div style={{ fontSize: "12px", color: "var(--text-sub)", marginBottom: "12px" }}>
                        根据当前对话内容，为你推荐以下回复：
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {quickReplyOptions.map((reply, index) => (
                          <button
                            key={index}
                            type="button"
                            className="soft-icon-btn"
                            onClick={() => {
                              setInput(reply);
                              setShowQuickReplyModal(false);
                            }}
                            style={{ width: "100%", textAlign: "left", padding: "8px 12px" }}
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="soft-icon-btn"
                        onClick={generateQuickReplies}
                        style={{ marginTop: "8px", width: "100%" }}
                      >
                        重新生成
                      </button>
                    </>
                  ) : (
                    <div style={{ fontSize: "12px", color: "var(--text-sub)", textAlign: "center", padding: "20px 0" }}>
                      无法生成回复选项，请检查AI配置
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="soft-icon-btn"
                  onClick={() => setShowQuickReplyModal(false)}
                  style={{ marginTop: "8px" }}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 小游戏弹窗 */}
          {showGameModal && (
            <div className="settings-modal-backdrop" onClick={() => setShowGameModal(false)}>
              <div
                className="settings-modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "320px" }}
              >
                <div className="settings-modal-title">小游戏</div>
                <div className="settings-modal-message">
                  <div style={{ fontSize: "12px", color: "var(--text-sub)", textAlign: "center", padding: "20px 0" }}>
                    小游戏功能开发中...
                    <br />
                    未来可以在这里和ta一起玩游戏哦～
                  </div>
                </div>
                <button
                  type="button"
                  className="primary-pill-btn settings-modal-btn"
                  onClick={() => setShowGameModal(false)}
                >
                  知道了
                </button>
              </div>
            </div>
          )}

          {/* 模式切换提示弹窗 */}
          {showModeToast && (
            <div className="wechat-mode-toast">
              {modeToastText}
            </div>
          )}

          {/* 朋友圈发布提示弹窗 */}
          {showMomentToast && (
            <div className="wechat-mode-toast wechat-moment-toast">
              {momentToastText}
            </div>
          )}

          {/* 编辑个人资料弹窗 */}
          {showEditProfile && (
            <div className="settings-modal-backdrop" onClick={() => setShowEditProfile(false)}>
              <div
                className="settings-modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "400px" }}
              >
                <div className="settings-modal-title">编辑个人资料</div>
                <div className="settings-modal-message" style={{ padding: "16px 0" }}>
                  <div className="settings-field">
                    <label className="settings-label">头像</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
                      {/* 头像预览 */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          className="wechat-chat-avatar"
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "14px",
                            background: userAvatar
                              ? "transparent"
                              : "radial-gradient(circle at 30% 30%, #fff7fb, #f9a8d4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0
                          }}
                        >
                          {userAvatar ? (
                            <img
                              src={userAvatar}
                              alt="我的头像"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover"
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector("span")) {
                                  const span = document.createElement("span");
                                  span.textContent = "🧸";
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: "40px" }}>🧸</span>
                          )}
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                          <label
                            htmlFor="user-avatar-upload"
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
                            id="user-avatar-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  alert("图片大小不能超过5MB");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const result = event.target?.result;
                                  if (typeof result === "string") {
                                    setUserAvatar(result);
                                    window.localStorage.setItem(USER_AVATAR_KEY, result);
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
                          value={userAvatar && !userAvatar.startsWith("data:") ? userAvatar : ""}
                          onChange={(e) => {
                            const url = e.target.value.trim();
                            if (url) {
                              setUserAvatar(url);
                              window.localStorage.setItem(USER_AVATAR_KEY, url);
                            } else {
                              setUserAvatar("");
                              window.localStorage.removeItem(USER_AVATAR_KEY);
                            }
                          }}
                        />
                      </div>
                      {/* 清除按钮 */}
                      {userAvatar && (
                        <button
                          type="button"
                          className="soft-icon-btn"
                          onClick={() => {
                            setUserAvatar("");
                            window.localStorage.removeItem(USER_AVATAR_KEY);
                          }}
                          style={{ alignSelf: "flex-start" }}
                        >
                          清除头像
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">昵称</label>
                    <input
                      className="settings-input"
                      placeholder="请输入昵称"
                      value={userNickname}
                      onChange={(e) => {
                        const nickname = e.target.value;
                        setUserNickname(nickname);
                        // 实时保存，允许空值
                        window.localStorage.setItem(USER_NICKNAME_KEY, nickname.trim());
                      }}
                      onBlur={(e) => {
                        // 失去焦点时，如果为空则保存空字符串（不自动设置为"我"）
                        const nickname = e.target.value.trim();
                        if (!nickname) {
                          setUserNickname("");
                          window.localStorage.setItem(USER_NICKNAME_KEY, "");
                        } else {
                          // 如果有内容，确保保存的是trim后的值
                          setUserNickname(nickname);
                          window.localStorage.setItem(USER_NICKNAME_KEY, nickname);
                        }
                      }}
                      maxLength={20}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="primary-pill-btn settings-modal-btn"
                  onClick={() => setShowEditProfile(false)}
                >
                  完成
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <header className="wechat-header">
            <button type="button" className="wechat-back-btn" onClick={onBackHome}>
              ‹ 桌面
            </button>
            <div className="wechat-title">
              <div className="wechat-title-main">微信</div>
              <div className="wechat-title-sub">你和重要的人，都在这里</div>
            </div>
            <div className="wechat-header-right">⋯</div>
          </header>

          <main className="wechat-body">
            {activeTab === "chats" && (
              <ul className="wechat-chat-list">
                {visibleChats.map((chat) => {
                  const displayName = getChatDisplayName(chat.id);
                  const latestMessage = getChatLatestMessage(chat.id);
                  const latestTime = getChatLatestTime(chat.id);
                  const previewText = latestMessage || chat.preview;

                  const isSwiped = swipedChatId === chat.id;

                  return (
                    <li
                      key={chat.id}
                      className="wechat-chat-card-wrapper"
                    >
                      <div className="wechat-chat-card-actions">
                        <button
                          type="button"
                          className="wechat-chat-card-btn wechat-chat-card-btn-delete"
                          onClick={() => handleDeleteChatHistory(chat.id)}
                        >
                          删除该聊天
                        </button>
                        <button
                          type="button"
                          className="wechat-chat-card-btn wechat-chat-card-btn-hide"
                          onClick={() => handleHideChatCard(chat.id)}
                        >
                          不显示该聊天
                        </button>
                      </div>
                      <div
                        className={`wechat-chat-card${isSwiped ? " wechat-chat-card-swiped" : ""}`}
                        onClick={() => {
                          setActiveChatId(chat.id);
                          setMessages([]);
                          setError(null);
                          setSwipedChatId(null);
                        }}
                        onTouchStart={(e) =>
                          handleChatTouchStart(chat.id, e.touches[0]?.clientX ?? 0)
                        }
                        onTouchMove={(e) =>
                          handleChatTouchMove(chat.id, e.touches[0]?.clientX ?? 0)
                        }
                        onTouchEnd={handleChatTouchEnd}
                      >
                        <div className="wechat-chat-avatar" aria-hidden="true">
                          {(() => {
                            const avatar = getChatAvatar(chat.id);
                            if (avatar) {
                              return (
                                <img
                                  src={avatar}
                                  alt="角色头像"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "14px",
                                    display: "block"
                                  }}
                                  onError={(e) => {
                                    // 如果图片加载失败，回退到默认emoji
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    const parent = target.parentElement;
                                    if (parent && !parent.querySelector("span")) {
                                      const span = document.createElement("span");
                                      span.textContent = chat.emoji;
                                      parent.appendChild(span);
                                    }
                                  }}
                                />
                              );
                            }
                            return <span>{chat.emoji}</span>;
                          })()}
                        </div>
                        <div className="wechat-chat-main">
                          <div className="wechat-chat-row">
                            <span className="wechat-chat-name">{displayName}</span>
                            <span className="wechat-chat-time">{latestTime}</span>
                          </div>
                          <div className="wechat-chat-row">
                            <span className="wechat-chat-preview">{previewText}</span>
                            {chat.unread > 0 && (
                              <span className="wechat-chat-unread">{chat.unread}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {activeTab === "contacts" && (
              <section className="wechat-contacts">
                <div className="wechat-contacts-section-title">角色通讯录</div>
                <div style={{ display: "flex", justifyContent: "flex-end", margin: "6px 0 10px" }}>
                  <button
                    type="button"
                    className="soft-icon-btn"
                    style={{ paddingInline: "12px", fontSize: "11px" }}
                    onClick={() => {
                      setNewContactForm({
                        realName: "",
                        nickname: "",
                        callMe: "",
                        myIdentity: "",
                        taIdentity: "",
                        chatStyle: "",
                        opening: "",
                        avatar: "",
                        emoji: "💌"
                      });
                      setShowNewContactModal(true);
                    }}
                  >
                    ＋ 新建联系人
                  </button>
                </div>
                <ul className="wechat-contacts-list">
                  {allChats.map((chat) => {
                    // 读取该角色的聊天设置
                    let chatSettingsForContact: ChatSettings | null = null;
                    try {
                      const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${chat.id}`);
                      if (stored) {
                        chatSettingsForContact = JSON.parse(stored) as ChatSettings;
                      }
                    } catch {
                      // ignore
                    }

                    // 生成显示标签（优先显示聊天设置中的信息）
                    const getContactTagline = () => {
                      if (chatSettingsForContact) {
                        // 优先显示身份信息
                        if (chatSettingsForContact.taIdentity?.trim()) {
                          return chatSettingsForContact.taIdentity.trim();
                        }
                        // 其次显示聊天风格
                        if (chatSettingsForContact.chatStyle?.trim()) {
                          return chatSettingsForContact.chatStyle.trim();
                        }
                        // 如果有真实姓名，显示真实姓名
                        if (chatSettingsForContact.realName?.trim()) {
                          return `真实姓名：${chatSettingsForContact.realName.trim()}`;
                        }
                        // 如果有称呼，显示称呼
                        if (chatSettingsForContact.callMe?.trim()) {
                          return `称呼你为：${chatSettingsForContact.callMe.trim()}`;
                        }
                      }
                      return "已加入小手机的乙女角色";
                    };

                    // 获取显示名称（优先显示备注）
                    const getDisplayName = () => {
                      if (chatSettingsForContact?.nickname?.trim()) {
                        return chatSettingsForContact.nickname.trim();
                      }
                      return chat.name;
                    };

                    return (
                      <li
                        key={chat.id}
                        className="wechat-contacts-item"
                        onClick={() => {
                          setMomentsChatId(chat.id);
                          setShowMoments(true);
                        }}
                      >
                        <div className="wechat-contacts-avatar" aria-hidden="true">
                          {chatSettingsForContact?.avatar ? (
                            <img
                              src={chatSettingsForContact.avatar}
                              alt={getDisplayName()}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "50%"
                              }}
                            />
                          ) : (
                            <span>{chat.emoji}</span>
                          )}
                        </div>
                        <div className="wechat-contacts-main">
                          <div className="wechat-contacts-name">{getDisplayName()}</div>
                          <div className="wechat-contacts-tagline">
                            {getContactTagline()}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {activeTab === "discover" && (
              <section className="wechat-discover">
                <ul className="wechat-discover-list">
                  {/* 朋友圈卡片 */}
                  <li
                    className="wechat-discover-item"
                    onClick={() => {
                      setMomentsChatId(undefined);
                      setShowMoments(true);
                    }}
                  >
                    <div className="wechat-discover-icon" aria-hidden="true">
                      <span>📸</span>
                    </div>
                    <div className="wechat-discover-main">
                      <div className="wechat-discover-name">朋友圈</div>
                    </div>
                    <div className="wechat-discover-arrow">›</div>
                  </li>
                  {/* 邂逅卡片 */}
                  <li
                    className="wechat-discover-item"
                    onClick={() => {
                      setShowEncounterModal(true);
                      handleGenerateEncounter();
                    }}
                  >
                    <div className="wechat-discover-icon" aria-hidden="true">
                      <span>💫</span>
                    </div>
                    <div className="wechat-discover-main">
                      <div className="wechat-discover-name">邂逅</div>
                    </div>
                    <div className="wechat-discover-arrow">›</div>
                  </li>
                  {/* 听一听卡片 */}
                  <li className="wechat-discover-item">
                    <div className="wechat-discover-icon" aria-hidden="true">
                      <span>🎵</span>
                    </div>
                    <div className="wechat-discover-main">
                      <div className="wechat-discover-name">听一听</div>
                    </div>
                    <div className="wechat-discover-arrow">›</div>
                  </li>
                </ul>
              </section>
            )}

            {activeTab === "me" && !showWallet && (
              <section className="wechat-me">
                {/* 用户信息区域 */}
                <div className="wechat-me-profile">
                  <div className="wechat-me-avatar-container">
                    <div
                      className="wechat-me-avatar"
                      onClick={() => setShowEditProfile(true)}
                    >
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt="我的头像"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "8px",
                            pointerEvents: "none"
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector("span")) {
                              const span = document.createElement("span");
                              span.textContent = "🧸";
                              parent.appendChild(span);
                            }
                          }}
                        />
                      ) : (
                        <span>🧸</span>
                      )}
                    </div>
                    <div className="wechat-me-edit-badge" onClick={() => setShowEditProfile(true)}>
                      ✏️
                    </div>
                  </div>
                  <div
                    className="wechat-me-nickname"
                    onClick={() => setShowEditProfile(true)}
                  >
                    {userNickname || "我"}
                  </div>
                </div>

                {/* 功能列表 */}
                <div className="wechat-me-menu">
                  {/* 钱包 */}
                  <div className="wechat-me-menu-section">
                    <div
                      className="wechat-me-menu-item"
                      onClick={() => setShowWallet(true)}
                    >
                      <div className="wechat-me-menu-icon">💳</div>
                      <div className="wechat-me-menu-text">钱包</div>
                      <div className="wechat-me-menu-arrow">›</div>
                    </div>
                  </div>

                  {/* 亲属卡 */}
                  <div className="wechat-me-menu-section">
                    <div className="wechat-me-menu-item">
                      <div className="wechat-me-menu-icon">💝</div>
                      <div className="wechat-me-menu-text">亲属卡</div>
                      <div className="wechat-me-menu-arrow">›</div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "me" && showWallet && (
              <section className="wechat-wallet">
                <header className="wechat-wallet-header">
                  <button
                    type="button"
                    className="wechat-back-btn"
                    onClick={() => setShowWallet(false)}
                  >
                    ‹ 我
                  </button>
                  <div className="wechat-title">
                    <div className="wechat-title-main">钱包</div>
                    <div className="wechat-title-sub">你的微信零钱小金库</div>
                  </div>
                  <div className="wechat-header-right" />
                </header>

                <main className="wechat-wallet-body">
                  <section className="wechat-wallet-balance-card">
                    <div className="wechat-wallet-balance-main">
                      <div className="wechat-wallet-balance-label">零钱余额</div>
                      <div className="wechat-wallet-balance-amount">¥ {walletBalance.toFixed(2)}</div>
                    </div>
                    <div className="wechat-wallet-balance-extra">
                      <div className="wechat-wallet-balance-row">
                        <span>零钱宝</span>
                        <span>¥ 0.00</span>
                      </div>
                      <div className="wechat-wallet-balance-row">
                        <span>总资产</span>
                        <span>¥ {walletBalance.toFixed(2)}</span>
                      </div>
                    </div>
                  </section>

                  <section className="wechat-wallet-actions">
                    <button type="button" className="primary-pill-btn">
                      充值
                    </button>
                    <button type="button" className="primary-pill-btn">
                      转入零钱宝
                    </button>
                    <button type="button" className="soft-icon-btn">
                      结算收益
                    </button>
                  </section>

                  <section className="wechat-wallet-list">
                    <div className="wechat-wallet-list-header">
                      <span>账单明细</span>
                      <span className="wechat-wallet-list-sub">
                        {walletBills.length === 0 ? "最近还没有任何流水" : `共 ${walletBills.length} 条记录`}
                      </span>
                    </div>
                    {walletBills.length > 0 && (
                      <div className="wechat-wallet-list-items">
                        {walletBills.map((bill) => {
                          const date = new Date(bill.timestamp);
                          const dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
                          return (
                            <div key={bill.id} className="wechat-wallet-list-item">
                              <div className="wechat-wallet-list-item-icon">
                                {bill.type === "income" ? "💰" : "💸"}
                              </div>
                              <div className="wechat-wallet-list-item-content">
                                <div className="wechat-wallet-list-item-title">{bill.description}</div>
                                <div className="wechat-wallet-list-item-time">{dateStr}</div>
                              </div>
                              <div className={`wechat-wallet-list-item-amount ${bill.type === "income" ? "income" : "expense"}`}>
                                {bill.type === "income" ? "+" : "-"}¥{bill.amount.toFixed(2)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </main>
              </section>
            )}
          </main>

          <nav className="wechat-bottom-nav">
            <button
              type="button"
              className={`wechat-bottom-item ${activeTab === "chats" ? "wechat-bottom-item-active" : ""}`}
              onClick={() => setActiveTab("chats")}
            >
              <span className="wechat-bottom-icon">💬</span>
              <span className="wechat-bottom-label">微信</span>
            </button>
            <button
              type="button"
              className={`wechat-bottom-item ${activeTab === "contacts" ? "wechat-bottom-item-active" : ""}`}
              onClick={() => setActiveTab("contacts")}
            >
              <span className="wechat-bottom-icon">👥</span>
              <span className="wechat-bottom-label">通讯录</span>
            </button>
            <button
              type="button"
              className={`wechat-bottom-item ${activeTab === "discover" ? "wechat-bottom-item-active" : ""}`}
              onClick={() => setActiveTab("discover")}
            >
              <span className="wechat-bottom-icon">✨</span>
              <span className="wechat-bottom-label">发现</span>
            </button>
            <button
              type="button"
              className={`wechat-bottom-item ${activeTab === "me" ? "wechat-bottom-item-active" : ""}`}
              onClick={() => setActiveTab("me")}
            >
              <span className="wechat-bottom-icon">🧸</span>
              <span className="wechat-bottom-label">我</span>
            </button>
          </nav>

          {/* 编辑个人资料弹窗（主页） */}
          {showEditProfile && (
            <div className="settings-modal-backdrop" onClick={() => setShowEditProfile(false)}>
              <div
                className="settings-modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "400px" }}
              >
                <div className="settings-modal-title">编辑个人资料</div>
                <div className="settings-modal-message" style={{ padding: "16px 0" }}>
                  <div className="settings-field">
                    <label className="settings-label">头像</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
                      {/* 头像预览 */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          className="wechat-chat-avatar"
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "14px",
                            background: userAvatar
                              ? "transparent"
                              : "radial-gradient(circle at 30% 30%, #fff7fb, #f9a8d4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0
                          }}
                        >
                          {userAvatar ? (
                            <img
                              src={userAvatar}
                              alt="我的头像"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover"
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector("span")) {
                                  const span = document.createElement("span");
                                  span.textContent = "🧸";
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: "40px" }}>🧸</span>
                          )}
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                          <label
                            htmlFor="user-avatar-upload"
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
                            id="user-avatar-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  alert("图片大小不能超过5MB");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const result = event.target?.result;
                                  if (typeof result === "string") {
                                    setUserAvatar(result);
                                    window.localStorage.setItem(USER_AVATAR_KEY, result);
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
                          value={userAvatar && !userAvatar.startsWith("data:") ? userAvatar : ""}
                          onChange={(e) => {
                            const url = e.target.value.trim();
                            if (url) {
                              setUserAvatar(url);
                              window.localStorage.setItem(USER_AVATAR_KEY, url);
                            } else {
                              setUserAvatar("");
                              window.localStorage.removeItem(USER_AVATAR_KEY);
                            }
                          }}
                        />
                      </div>
                      {/* 清除按钮 */}
                      {userAvatar && (
                        <button
                          type="button"
                          className="soft-icon-btn"
                          onClick={() => {
                            setUserAvatar("");
                            window.localStorage.removeItem(USER_AVATAR_KEY);
                          }}
                          style={{ alignSelf: "flex-start" }}
                        >
                          清除头像
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">昵称</label>
                    <input
                      className="settings-input"
                      placeholder="请输入昵称"
                      value={userNickname}
                      onChange={(e) => {
                        const nickname = e.target.value;
                        setUserNickname(nickname);
                        // 实时保存，允许空值
                        window.localStorage.setItem(USER_NICKNAME_KEY, nickname.trim());
                      }}
                      onBlur={(e) => {
                        // 失去焦点时，如果为空则保存空字符串（不自动设置为"我"）
                        const nickname = e.target.value.trim();
                        if (!nickname) {
                          setUserNickname("");
                          window.localStorage.setItem(USER_NICKNAME_KEY, "");
                        } else {
                          // 如果有内容，确保保存的是trim后的值
                          setUserNickname(nickname);
                          window.localStorage.setItem(USER_NICKNAME_KEY, nickname);
                        }
                      }}
                      maxLength={20}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="primary-pill-btn settings-modal-btn"
                  onClick={() => setShowEditProfile(false)}
                >
                  完成
                </button>
              </div>
            </div>
          )}

          {/* 新建联系人弹窗 */}
          {showNewContactModal && (
            <div className="settings-modal-backdrop" onClick={() => setShowNewContactModal(false)}>
              <div
                className="settings-modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "420px", maxHeight: "80vh", overflowY: "auto", textAlign: "left" }}
              >
                <div className="settings-modal-title">新建联系人</div>
                <div className="settings-modal-message" style={{ padding: "12px 0" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-sub)", marginBottom: "10px" }}>
                    这些信息全部都是<span style={{ fontWeight: 600 }}>选填</span>的，你可以先创建一个空白角色，
                    再在聊天设置里慢慢完善。
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">备注昵称（聊天列表显示）</label>
                    <input
                      className="settings-input"
                      value={newContactForm.nickname}
                      onChange={(e) =>
                        setNewContactForm((prev) => ({ ...prev, nickname: e.target.value }))
                      }
                      placeholder="例如：小方、学长、室友..."
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">ta 的真实姓名</label>
                    <input
                      className="settings-input"
                      value={newContactForm.realName}
                      onChange={(e) =>
                        setNewContactForm((prev) => ({ ...prev, realName: e.target.value }))
                      }
                      placeholder="可留空"
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">ta 称呼我为</label>
                    <input
                      className="settings-input"
                      value={newContactForm.callMe}
                      onChange={(e) =>
                        setNewContactForm((prev) => ({ ...prev, callMe: e.target.value }))
                      }
                      placeholder="例如：宝贝、小朋友..."
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">我的身份</label>
                    <input
                      className="settings-input"
                      value={newContactForm.myIdentity}
                      onChange={(e) =>
                        setNewContactForm((prev) => ({ ...prev, myIdentity: e.target.value }))
                      }
                      placeholder="例如：他的学生 / 室友 / 网友..."
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">ta 的身份</label>
                    <input
                      className="settings-input"
                      value={newContactForm.taIdentity}
                      onChange={(e) =>
                        setNewContactForm((prev) => ({ ...prev, taIdentity: e.target.value }))
                      }
                      placeholder="例如：英语老师 / 青梅竹马..."
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">聊天风格</label>
                    <input
                      className="settings-input"
                      value={newContactForm.chatStyle}
                      onChange={(e) =>
                        setNewContactForm((prev) => ({ ...prev, chatStyle: e.target.value }))
                      }
                      placeholder="例如：温柔黏人 / 刻薄嘴硬 / 冷淡克制..."
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">开场白</label>
                    <textarea
                      className="settings-textarea"
                      style={{ minHeight: "72px" }}
                      value={newContactForm.opening}
                      onChange={(e) =>
                        setNewContactForm((prev) => ({ ...prev, opening: e.target.value }))
                      }
                      placeholder="第一次和玩家说的话，可留空让AI自己想。"
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">头像图片地址（可选）</label>
                    <input
                      className="settings-input"
                      value={newContactForm.avatar}
                      onChange={(e) =>
                        setNewContactForm((prev) => ({ ...prev, avatar: e.target.value }))
                      }
                      placeholder="http(s) 链接或留空"
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">聊天列表头像 Emoji</label>
                    <input
                      className="settings-input"
                      value={newContactForm.emoji}
                      onChange={(e) =>
                        setNewContactForm((prev) => ({ ...prev, emoji: e.target.value }))
                      }
                      maxLength={4}
                      placeholder="例如：💌、🐻、🌙..."
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="primary-pill-btn settings-modal-btn"
                  onClick={handleCreateNewContact}
                >
                  创建并打开聊天设定
                </button>
                <button
                  type="button"
                  className="soft-icon-btn"
                  style={{ marginTop: "8px", width: "100%" }}
                  onClick={() => setShowNewContactModal(false)}
                >
                  先不创建
                </button>
              </div>
            </div>
          )}

          {/* 邂逅弹窗 */}
          {showEncounterModal && (
            <div className="settings-modal-backdrop" onClick={() => {
              setShowEncounterModal(false);
              setEncounterCharacter(null);
              setShowEncounterWorldbook(false);
            }}>
              <div
                className="settings-modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "420px", textAlign: "center", zIndex: 1000 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div style={{ width: "40px" }}></div>
                  <div className="settings-modal-title">邂逅</div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEncounterModal(false);
                      setEncounterCharacter(null);
                    }}
                    style={{
                      width: "40px",
                      height: "40px",
                      border: "none",
                      background: "transparent",
                      fontSize: "24px",
                      color: "var(--text-main)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    ×
                  </button>
                </div>

                {generatingEncounter ? (
                  <div style={{ padding: "60px 20px", position: "relative" }}>
                    <div style={{
                      width: "120px",
                      height: "120px",
                      margin: "0 auto 30px",
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {/* 雷达扫描动画 */}
                      <div style={{
                        position: "absolute",
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        border: "2px solid var(--accent-pink-soft)",
                        opacity: 0.3
                      }}></div>
                      <div style={{
                        position: "absolute",
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        border: "2px solid var(--accent-pink-soft)",
                        animation: "radar-scan 2s linear infinite",
                        clipPath: "polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)"
                      }}></div>
                      <div style={{ fontSize: "40px", zIndex: 1 }}>💫</div>
                    </div>
                    <div style={{ fontSize: "16px", color: "var(--text-sub)", marginBottom: "10px" }}>
                      正在为你寻找邂逅...
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-sub)", opacity: 0.7 }}>
                      扫描附近的人
                    </div>
                  </div>
                ) : encounterCharacter ? (
                  <div style={{ padding: "20px" }}>
                    <div
                      style={{ marginBottom: "20px", cursor: "pointer", position: "relative" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEncounterWorldbook(true);
                      }}
                    >
                      <img
                        src={encounterCharacter.avatar}
                        alt={encounterCharacter.realName}
                        style={{
                          width: "120px",
                          height: "120px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "3px solid var(--accent-pink-soft)",
                          margin: "0 auto",
                          transition: "transform 0.2s ease",
                          display: "block",
                          pointerEvents: "none"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector("span")) {
                            const span = document.createElement("span");
                            span.textContent = "💌";
                            span.style.fontSize = "60px";
                            parent.appendChild(span);
                          }
                        }}
                      />
                      <div style={{ fontSize: "11px", color: "var(--text-sub)", marginTop: "8px", textAlign: "center", pointerEvents: "none" }}>
                        点击头像查看详情
                      </div>
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-main)", marginBottom: "10px" }}>
                      {encounterCharacter.realName}
                    </div>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "30px" }}>
                      <button
                        type="button"
                        className="soft-icon-btn"
                        onClick={handleGenerateEncounter}
                        style={{ padding: "10px 20px" }}
                      >
                        下一个
                      </button>
                      <button
                        type="button"
                        className="primary-pill-btn"
                        onClick={handleStartEncounterChat}
                        style={{ padding: "10px 20px" }}
                      >
                        聊天
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "40px 20px" }}>
                    <div style={{ fontSize: "16px", color: "var(--text-sub)" }}>
                      点击"邂逅"开始寻找
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 邂逅角色世界书查看弹窗 */}
          {showEncounterWorldbook && encounterCharacter && (
            <div
              className="settings-modal-backdrop"
              onClick={() => setShowEncounterWorldbook(false)}
              style={{ zIndex: 2000, position: "fixed" }}
            >
              <div
                className="settings-modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "500px", maxHeight: "80vh", overflowY: "auto", zIndex: 2001, position: "relative" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div style={{ width: "40px" }}></div>
                  <div className="settings-modal-title">{encounterCharacter.realName}的设定</div>
                  <button
                    type="button"
                    onClick={() => setShowEncounterWorldbook(false)}
                    style={{
                      width: "40px",
                      height: "40px",
                      border: "none",
                      background: "transparent",
                      fontSize: "24px",
                      color: "var(--text-main)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ padding: "0 20px 20px", textAlign: "left" }}>
                  <div style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.8",
                    color: "var(--text-main)",
                    fontSize: "14px"
                  }}>
                    {encounterCharacter.worldbook || "暂无设定"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

