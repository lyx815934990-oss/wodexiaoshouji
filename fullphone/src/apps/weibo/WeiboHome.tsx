import type { FC } from "react";
import { useEffect, useState } from "react";
import { useAiSettings } from "../../context/AiSettingsContext";
import { useWorldbook } from "../../context/WorldbookContext";
import { sendChatRequest } from "../../services/aiClient";

interface WeiboHomeProps {
  onBackHome: () => void;
}

type WeiboTab = "home" | "hot" | "discover" | "me";

interface Character {
  id: string;
  name: string;
  avatar: string;
  emoji: string;
}

interface HotSearch {
  id: string;
  rank: number;
  keyword: string;
  hot: string; // 热度标识，如 "热"、"新"、"沸"
  count?: number; // 讨论量
}

interface WeiboPost {
  id: string;
  user: {
    name: string;
    avatar: string;
    verified?: boolean; // 是否认证
    verifiedType?: string; // 认证类型，如 "个人认证"、"企业认证"
    accountType?: "celebrity" | "marketing" | "normal"; // 账号类型：明星、营销号、普通网友
    initialFollowers?: number; // 初始粉丝数
    createdAt?: number; // 账号创建时间戳
  };
  content: string;
  images?: string[]; // 图片URL数组
  time: string;
  source: string; // 来源，如 "iPhone客户端"
  repostCount: number; // 转发数
  commentCount: number; // 评论数
  likeCount: number; // 点赞数
  liked: boolean; // 是否已点赞
  reposted?: WeiboPost; // 转发的原微博
  createdAt?: number; // 微博创建时间戳
  initialRepostCount?: number; // 初始转发数
  initialCommentCount?: number; // 初始评论数
  initialLikeCount?: number; // 初始点赞数
}

interface UserProfile {
  name: string;
  nickname: string;
  avatar: string;
  bio: string;
  following: number; // 关注数
  followers: number; // 粉丝数
  likes: number; // 获赞数
  verified?: boolean;
  verifiedType?: string;
}

interface WeiboUserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  persona: string;
  stats: {
    following: number;
    followers: number;
    likes: number;
    posts: number;
  };
  verified?: boolean;
  verifiedType?: string;
  accountType?: "celebrity" | "marketing" | "normal";
  initialFollowers?: number;
  createdAt?: number; // 创建时间戳
  lastUpdated?: number; // 最后更新时间戳
}

interface Comment {
  id: string;
  user: {
    name: string;
    avatar: string;
    verified?: boolean;
    verifiedType?: string;
  };
  content: string;
  time: string;
  likeCount: number;
  liked: boolean;
  replies?: Comment[]; // 回复评论
}

// 微博头像列表（从public/weibo-avatar文件夹）
const WEIBO_AVATARS = [
  "1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpeg", "7.webp", "8.jpeg",
  "9.jpg", "10.jpg", "11.jpeg", "12.jpeg", "13.webp", "14.jpeg", "15.jpg",
  "16.webp", "17.jpeg", "18.png", "19.webp", "20.webp", "21.jpg", "22.webp",
  "23.webp", "24.webp", "25.jpeg", "26.jpg", "27.jpeg", "28.webp", "29.jpeg", "30.webp"
];

// 微博背景图片列表（从public/weibo-background文件夹）
const WEIBO_BACKGROUNDS = [
  "1.jpeg", "2.jpeg", "3.jpeg", "4.jpeg", "5.jpeg",
  "6.jpeg", "7.jpeg", "8.jpeg", "9.jpeg", "10.jpg"
];

// 获取随机背景图片URL
const getRandomBackground = (): string => {
  const randomIndex = Math.floor(Math.random() * WEIBO_BACKGROUNDS.length);
  return `/weibo-background/${WEIBO_BACKGROUNDS[randomIndex]}`;
};

// 根据用户ID获取背景图片（确保相同用户使用相同背景）
const getBackgroundByUserId = (userId: string): string => {
  // 使用用户ID的哈希值来选择背景，确保同一用户总是使用相同的背景
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const bgIndex = Math.abs(hash) % WEIBO_BACKGROUNDS.length;
  return `/weibo-background/${WEIBO_BACKGROUNDS[bgIndex]}`;
};

// 获取随机头像URL
const getRandomAvatar = (): string => {
  const randomIndex = Math.floor(Math.random() * WEIBO_AVATARS.length);
  return `/weibo-avatar/${WEIBO_AVATARS[randomIndex]}`;
};

// 根据索引获取头像（确保相同用户使用相同头像）
const getAvatarByIndex = (index: number): string => {
  const avatarIndex = index % WEIBO_AVATARS.length;
  return `/weibo-avatar/${WEIBO_AVATARS[avatarIndex]}`;
};

// NPC头像列表（女性）
const NPC_FEMALE_AVATARS = [
  "1.jpg", "2.jpeg", "3.jpg", "4.webp", "5.webp",
  "6.jpeg", "7.webp", "8.jpeg", "9.jpeg", "10.jpeg"
];

// NPC头像列表（男性）
const NPC_MALE_AVATARS = [
  "1.jpg", "2.png", "3.webp", "4.webp", "5.jpeg",
  "6.webp", "7.jpg", "8.jpeg", "9.jpeg", "10.jpeg"
];

// 根据NPC性别获取随机头像
const getNPCAvatar = (gender: string = "unknown", seed?: string): string => {
  let avatars: string[];
  let folder: string;

  const genderLower = gender.toLowerCase();

  if (genderLower === "female" || genderLower === "女" || genderLower === "女性" || genderLower.includes("female") || genderLower.includes("女")) {
    avatars = NPC_FEMALE_AVATARS;
    folder = "weibo-avatar-female";
  } else if (genderLower === "male" || genderLower === "男" || genderLower === "男性" || genderLower.includes("male") || genderLower.includes("男")) {
    avatars = NPC_MALE_AVATARS;
    folder = "weibo-avatar-male";
  } else {
    // 如果性别未知，随机选择
    const isFemale = Math.random() > 0.5;
    avatars = isFemale ? NPC_FEMALE_AVATARS : NPC_MALE_AVATARS;
    folder = isFemale ? "weibo-avatar-female" : "weibo-avatar-male";
  }

  // 如果有seed（如角色名字），使用它来确保相同角色总是使用相同头像
  let index: number;
  if (seed) {
    // 使用seed生成一个稳定的索引
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    index = Math.abs(hash) % avatars.length;
  } else {
    // 随机选择
    index = Math.floor(Math.random() * avatars.length);
  }

  return `/${folder}/${avatars[index]}`;
};

// 从世界书中提取NPC角色信息
// 使用AI智能分析世界书条目，提取NPC角色信息
const extractNPCsFromWorldbookWithAI = async (
  aiConfig: any,
  worldbookConfig: any
): Promise<Array<{ name: string; gender?: string;[key: string]: any }>> => {
  const npcs: Array<{ name: string; gender?: string;[key: string]: any }> = [];

  if (!worldbookConfig) return npcs;

  try {
    // 收集所有启用的世界书条目
    const allEntries: Array<{ title: string; content: string; app?: string }> = [];

    // 遍历所有应用的世界书
    const allWorldbooks = worldbookConfig.perApp || {};
    Object.keys(allWorldbooks).forEach((appKey: string) => {
      const appWorldbooks = allWorldbooks[appKey] || [];
      appWorldbooks.forEach((wb: any) => {
        if (wb.entries) {
          wb.entries.forEach((entry: any) => {
            if (entry.enabled && (entry.content || entry.title)) {
              allEntries.push({
                title: entry.title || "",
                content: entry.content || "",
                app: appKey
              });
            }
          });
        }
      });
    });

    // 也读取全局世界书条目
    // 全局世界书可能是数组，每个元素有entries属性
    if (worldbookConfig.global) {
      console.log(`[extractNPCsFromWorldbookWithAI] 全局世界书类型: ${Array.isArray(worldbookConfig.global) ? "数组" : "对象"}`, worldbookConfig.global);
      if (Array.isArray(worldbookConfig.global)) {
        // 如果是数组，遍历每个世界书
        console.log(`[extractNPCsFromWorldbookWithAI] 全局世界书是数组，共${worldbookConfig.global.length}个世界书`);
        worldbookConfig.global.forEach((wb: any, idx: number) => {
          console.log(`[extractNPCsFromWorldbookWithAI] 处理全局世界书[${idx}]:`, wb);
          if (wb.entries && Array.isArray(wb.entries)) {
            console.log(`[extractNPCsFromWorldbookWithAI] 全局世界书[${idx}]有${wb.entries.length}个条目`);
            wb.entries.forEach((entry: any) => {
              if (entry.enabled && (entry.content || entry.title)) {
                allEntries.push({
                  title: entry.title || "",
                  content: entry.content || "",
                  app: "global"
                });
                console.log(`[extractNPCsFromWorldbookWithAI] ✅ 添加全局世界书条目: "${entry.title || "(无标题)"}"`);
              }
            });
          }
        });
      } else if (worldbookConfig.global.entries) {
        // 如果是对象，直接读取entries
        console.log(`[extractNPCsFromWorldbookWithAI] 全局世界书是对象，有${Array.isArray(worldbookConfig.global.entries) ? worldbookConfig.global.entries.length : "未知"}个条目`);
        if (Array.isArray(worldbookConfig.global.entries)) {
          worldbookConfig.global.entries.forEach((entry: any) => {
            if (entry.enabled && (entry.content || entry.title)) {
              allEntries.push({
                title: entry.title || "",
                content: entry.content || "",
                app: "global"
              });
              console.log(`[extractNPCsFromWorldbookWithAI] ✅ 添加全局世界书条目: "${entry.title || "(无标题)"}"`);
            }
          });
        }
      } else {
        console.warn(`[extractNPCsFromWorldbookWithAI] ⚠️ 全局世界书结构未知:`, worldbookConfig.global);
      }
    } else {
      console.log(`[extractNPCsFromWorldbookWithAI] 没有找到全局世界书`);
    }

    if (allEntries.length === 0) {
      console.log("没有找到启用的世界书条目");
      return npcs;
    }

    console.log(`找到${allEntries.length}个启用的世界书条目，开始使用AI分析NPC角色...`);

    // 如果没有AI配置，使用简单的规则提取
    if (!aiConfig.baseUrl || !aiConfig.apiKey || !aiConfig.model) {
      console.log("AI配置不可用，使用规则提取NPC信息");
      return extractNPCsFromWorldbookSimple(worldbookConfig);
    }

    // 将条目分组处理（每批处理10个，避免prompt过长）
    const batchSize = 10;
    for (let i = 0; i < allEntries.length; i += batchSize) {
      const batch = allEntries.slice(i, i + batchSize);

      // 构建prompt
      const entriesText = batch.map((entry, idx) => {
        return `条目${i + idx + 1}:
标题: ${entry.title || "(无标题)"}
内容: ${entry.content || "(无内容)"}
应用: ${entry.app || "未知"}`;
      }).join("\n\n");

      const prompt = `请分析以下世界书条目，识别出哪些是描述NPC（非玩家角色）的条目，并提取每个NPC的信息。

要求：
1. 只识别明确描述角色/人物的条目（如角色设定、人物介绍、NPC描述等）
2. 忽略描述世界观、规则、物品、地点、事件、组织、概念等的条目
3. 对于每个识别出的NPC，提取：
   - 角色名字（必须提取，如果条目中没有明确名字，使用标题作为名字）
   - 性别（male/female/unknown，从内容中推断，如果没有明确信息则为unknown）
4. 返回JSON格式，格式如下：
{
  "npcs": [
    {
      "name": "角色名字",
      "gender": "male/female/unknown"
    }
  ]
}

如果某个条目不是NPC描述，请不要包含在结果中。

世界书条目：
${entriesText}

请返回JSON格式的NPC列表：`;

      try {
        const response = await sendChatRequest(aiConfig, [
          { role: "user", content: prompt }
        ]);

        // 尝试解析JSON
        let parsed: any = null;
        try {
          // 尝试直接解析
          parsed = JSON.parse(response);
        } catch {
          // 如果直接解析失败，尝试提取JSON部分
          const jsonMatch = response.match(/\{[\s\S]*"npcs"[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          }
        }

        if (parsed && parsed.npcs && Array.isArray(parsed.npcs)) {
          parsed.npcs.forEach((npc: any) => {
            if (npc.name && npc.name.trim()) {
              const npcName = npc.name.trim();
              // 检查是否已存在（不区分大小写）
              const existingNPC = npcs.find(n => n.name.toLowerCase() === npcName.toLowerCase());
              if (!existingNPC) {
                const gender = npc.gender === "male" || npc.gender === "female" ? npc.gender : undefined;
                npcs.push({ name: npcName, gender });
                console.log(`✅ AI识别NPC: "${npcName}", 性别: ${gender || "未知"}`);
              }
            }
          });
        } else {
          console.warn(`AI返回的格式不正确，尝试使用规则提取:`, response);
          // 如果AI返回格式不正确，对这批条目使用简单规则提取
          batch.forEach(entry => {
            const simpleNPCs = extractNPCsFromEntrySimple(entry.title, entry.content);
            simpleNPCs.forEach(npc => {
              const existingNPC = npcs.find(n => n.name.toLowerCase() === npc.name.toLowerCase());
              if (!existingNPC) {
                npcs.push(npc);
              }
            });
          });
        }
      } catch (error) {
        console.error(`处理第${i + 1}-${Math.min(i + batchSize, allEntries.length)}个条目时出错:`, error);
        // 如果AI处理失败，对这批条目使用简单规则提取
        batch.forEach(entry => {
          const simpleNPCs = extractNPCsFromEntrySimple(entry.title, entry.content);
          simpleNPCs.forEach(npc => {
            const existingNPC = npcs.find(n => n.name.toLowerCase() === npc.name.toLowerCase());
            if (!existingNPC) {
              npcs.push(npc);
            }
          });
        });
      }
    }

    console.log(`✅ 总共提取到${npcs.length}个NPC角色:`, npcs.map(n => `${n.name}(${n.gender || "未知"})`).join(", "));
    return npcs;
  } catch (error) {
    console.error("使用AI提取NPC信息失败:", error);
    // 如果AI提取失败，回退到简单规则提取
    return extractNPCsFromWorldbookSimple(worldbookConfig);
  }
};

// 简单的规则提取NPC（作为AI提取的备用方案）
const extractNPCsFromWorldbookSimple = (worldbookConfig: any): Array<{ name: string; gender?: string;[key: string]: any }> => {
  const npcs: Array<{ name: string; gender?: string;[key: string]: any }> = [];

  if (!worldbookConfig) return npcs;

  try {
    // 遍历所有世界书条目
    const allWorldbooks = worldbookConfig.perApp || {};
    Object.keys(allWorldbooks).forEach((appKey: string) => {
      const appWorldbooks = allWorldbooks[appKey] || [];
      appWorldbooks.forEach((wb: any) => {
        if (wb.entries) {
          wb.entries.forEach((entry: any) => {
            if (entry.enabled && (entry.content || entry.title)) {
              const extracted = extractNPCsFromEntrySimple(entry.title || "", entry.content || "");
              extracted.forEach(npc => {
                const existingNPC = npcs.find(n => n.name.toLowerCase() === npc.name.toLowerCase());
                if (!existingNPC) {
                  npcs.push(npc);
                }
              });
            }
          });
        }
      });
    });

    // 也读取全局世界书条目
    if (worldbookConfig.global?.entries) {
      worldbookConfig.global.entries.forEach((entry: any) => {
        if (entry.enabled && (entry.content || entry.title)) {
          const extracted = extractNPCsFromEntrySimple(entry.title || "", entry.content || "");
          extracted.forEach(npc => {
            const existingNPC = npcs.find(n => n.name.toLowerCase() === npc.name.toLowerCase());
            if (!existingNPC) {
              npcs.push(npc);
            }
          });
        }
      });
    }
  } catch (error) {
    console.error("简单规则提取NPC信息失败:", error);
  }

  return npcs;
};

// 从单个条目中提取NPC信息（简单规则）
const extractNPCsFromEntrySimple = (title: string, content: string): Array<{ name: string; gender?: string }> => {
  const npcs: Array<{ name: string; gender?: string }> = [];
  const fullText = (title + " " + content).toLowerCase();

  // 跳过明显不是角色描述的条目
  const skipKeywords = [
    "世界观", "背景", "设定", "规则", "物品", "地点", "事件", "组织", "概念",
    "技能", "能力", "职业", "种族", "历史", "文化", "科技", "魔法",
    "生物", "怪物", "神明", "传说", "故事", "剧情", "任务", "目标"
  ];

  if (skipKeywords.some(keyword => fullText.includes(keyword) && !fullText.includes("角色") && !fullText.includes("人物") && !fullText.includes("NPC"))) {
    return npcs;
  }

  // 如果标题看起来像角色名（2-15个字符，不包含冒号等）
  if (title && title.trim() && title.length >= 2 && title.length <= 15 &&
    !title.includes("：") && !title.includes(":") &&
    !skipKeywords.some(k => title.toLowerCase().includes(k))) {

    let gender: string | undefined = undefined;
    if (fullText.includes("女性") || fullText.includes("女") || fullText.includes("female") || fullText.includes("girl") || fullText.includes("woman")) {
      gender = "female";
    } else if (fullText.includes("男性") || fullText.includes("男") || fullText.includes("male") || fullText.includes("boy") || fullText.includes("man")) {
      gender = "male";
    }

    npcs.push({ name: title.trim(), gender });
  }

  // 从内容中提取角色名
  const namePatterns = [
    /(?:角色|NPC|人物|角色名|名字)[：:：]\s*([^\s，,。\n：:：]{2,15})/,
    /^([^\s：:：]{2,15})[：:：]/,
    /([A-Za-z\u4e00-\u9fa5]{2,15})(?:的|是|为)(?:角色|NPC|人物)/,
    /(?:名为|名字是|叫)([A-Za-z\u4e00-\u9fa5]{2,15})/
  ];

  namePatterns.forEach(pattern => {
    const nameMatch = content.match(pattern);
    if (nameMatch) {
      const npcName = nameMatch[1].trim();
      if (npcName.length >= 2 && npcName.length <= 15 &&
        !skipKeywords.some(k => npcName.toLowerCase().includes(k))) {

        let gender: string | undefined = undefined;
        if (fullText.includes("女性") || fullText.includes("女") || fullText.includes("female") || fullText.includes("girl") || fullText.includes("woman")) {
          gender = "female";
        } else if (fullText.includes("男性") || fullText.includes("男") || fullText.includes("male") || fullText.includes("boy") || fullText.includes("man")) {
          gender = "male";
        }

        const existingNPC = npcs.find(n => n.name.toLowerCase() === npcName.toLowerCase());
        if (!existingNPC) {
          npcs.push({ name: npcName, gender });
        }
      }
    }
  });

  return npcs;
};

// 保持向后兼容的同步版本（使用简单规则）
const extractNPCsFromWorldbook = (worldbookConfig: any): Array<{ name: string; gender?: string;[key: string]: any }> => {
  return extractNPCsFromWorldbookSimple(worldbookConfig);
};

// 使用AI生成真实感的昵称
const generateNicknamesWithAI = async (
  aiConfig: any,
  count: number
): Promise<string[]> => {
  const prompt = `请生成${count}个真实、自然的微博网友昵称。参考以下风格（但不要完全照搬，要有变化和创新）：

软萌可爱款：奶芙小馬、芋泥团团子、桃桃气泡水、糯糯星冰乐、椰椰小丸、软 fufu 的喵、芝士焗小熊、莓果碎碎冰、奶盖小星球、芋圆小奶包
简约清冷款：晚星叙、风禾尽、月落川、雾中行、秋时叙、星垂野、云边客、枕星河、风知意、屿间风
文艺氛围感款：赴一场秋、晚风漫行、星子落怀、山野来信、雾漫山川、风栖梧枝、月渡松间、云栖竹径、秋光漫卷、星途漫行
趣味搞怪款：干饭一级选手、摸鱼小天才、摆烂但可爱、快乐加载中、发呆业务户、咸鱼不翻身后、干饭不打烊、摆烂第一名、摸鱼不重样、快乐发电站
小众温柔款：温风遇夏、软风漫野、星眠枕月、风软知春、月漫清池、云舒漫卷、秋温知意、星软风甜、温粥伴月、风柔星淡
元气活力款：奔赴星光、元气小太阳、追风小欢喜、向阳而生吖、星光赶路、活力满格中、乘风而上、春日小美好、星芒万丈、风禾向暖

要求：
1. 昵称要真实自然，像真实网友会用的名字
2. 可以混合不同风格，但要自然不突兀
3. 每个昵称控制在2-8个字
4. 不要使用emoji（除非是昵称的一部分，如"软 fufu 的喵"）
5. 返回格式：每行一个昵称，不要编号，不要其他说明

生成的昵称：`;

  try {
    const response = await sendChatRequest(aiConfig, [
      { role: "user", content: prompt }
    ]);

    // 解析AI返回的内容，按行分割
    const lines = response.split("\n").filter(line => line.trim()).slice(0, count);
    return lines.map(line => line.trim());
  } catch (error) {
    console.error("生成昵称失败:", error);
    // 如果AI生成失败，返回默认昵称
    return generateDefaultNicknames(count);
  }
};

// 默认昵称（AI失败时使用）
const generateDefaultNicknames = (count: number): string[] => {
  const defaultNames = [
    "奶芙小馬", "芋泥团团子", "桃桃气泡水", "糯糯星冰乐", "椰椰小丸",
    "晚星叙", "风禾尽", "月落川", "雾中行", "秋时叙",
    "赴一场秋", "晚风漫行", "星子落怀", "山野来信", "雾漫山川",
    "干饭一级选手", "摸鱼小天才", "摆烂但可爱", "快乐加载中", "发呆业务户",
    "温风遇夏", "软风漫野", "星眠枕月", "风软知春", "月漫清池",
    "奔赴星光", "元气小太阳", "追风小欢喜", "向阳而生吖", "星光赶路"
  ];

  return Array.from({ length: count }, (_, i) => defaultNames[i % defaultNames.length]);
};

// 生成符合2026年风格的随机昵称（已废弃，改用AI生成）
const generateRandomNickname = (index: number): string => {
  const defaultNames = [
    "奶芙小馬", "芋泥团团子", "桃桃气泡水", "糯糯星冰乐", "椰椰小丸",
    "晚星叙", "风禾尽", "月落川", "雾中行", "秋时叙",
    "赴一场秋", "晚风漫行", "星子落怀", "山野来信", "雾漫山川",
    "干饭一级选手", "摸鱼小天才", "摆烂但可爱", "快乐加载中", "发呆业务户",
    "温风遇夏", "软风漫野", "星眠枕月", "风软知春", "月漫清池",
    "奔赴星光", "元气小太阳", "追风小欢喜", "向阳而生吖", "星光赶路"
  ];
  return defaultNames[index % defaultNames.length];
};

// 默认热搜数据（AI失败时使用）
const mockHotSearches: HotSearch[] = [
  { id: "1", rank: 1, keyword: "今日心情", hot: "热", count: 125.8 },
  { id: "2", rank: 2, keyword: "AI生成碎碎念", hot: "新", count: 89.2 },
  { id: "3", rank: 3, keyword: "温柔日常", hot: "热", count: 67.5 },
  { id: "4", rank: 4, keyword: "小确幸时刻", hot: "沸", count: 156.3 },
  { id: "5", rank: 5, keyword: "今日份温柔", hot: "热", count: 45.9 },
  { id: "6", rank: 6, keyword: "生活碎片", hot: "新", count: 32.1 },
  { id: "7", rank: 7, keyword: "心情日记", hot: "热", count: 28.7 },
  { id: "8", rank: 8, keyword: "温柔瞬间", hot: "热", count: 24.3 },
];

// 从世界书配置中提取所有启用的条目内容（包括全局和微博应用特定的）
const extractWorldbookContent = (worldbookConfig: any): string => {
  if (!worldbookConfig) {
    return "";
  }

  const allEntries: Array<{ title: string; content: string; app: string }> = [];

  // 读取微博应用的世界书条目
  if (worldbookConfig.perApp?.weibo) {
    worldbookConfig.perApp.weibo.forEach((worldbook: any) => {
      if (worldbook.entries && Array.isArray(worldbook.entries)) {
        worldbook.entries.forEach((entry: any) => {
          if (entry.enabled && (entry.content || entry.title)) {
            allEntries.push({
              title: entry.title || "",
              content: entry.content || "",
              app: "weibo"
            });
          }
        });
      }
    });
  }

  // 读取全局世界书条目
  if (worldbookConfig.global && Array.isArray(worldbookConfig.global)) {
    worldbookConfig.global.forEach((worldbook: any) => {
      if (worldbook.entries && Array.isArray(worldbook.entries)) {
        worldbook.entries.forEach((entry: any) => {
          if (entry.enabled && (entry.content || entry.title)) {
            allEntries.push({
              title: entry.title || "",
              content: entry.content || "",
              app: "global"
            });
          }
        });
      }
    });
  }

  if (allEntries.length === 0) {
    return "";
  }

  // 将所有条目内容组合成字符串
  const worldbookText = allEntries.map((entry, idx) => {
    return `【条目${idx + 1}】${entry.title ? `标题：${entry.title}\n` : ""}内容：${entry.content || ""}`;
  }).join("\n\n");

  return worldbookText;
};

// 使用AI生成热搜内容
const generateHotSearchesWithAI = async (
  aiConfig: any,
  messages: ChatMessage[],
  characterName: string,
  worldbookContent?: string
): Promise<HotSearch[]> => {
  const recentMessages = messages.slice(-20);
  const messageSummary = recentMessages.map(m => `${m.from === "me" ? "玩家" : characterName}: ${m.content}`).join("\n");

  let worldbookContext = "";
  if (worldbookContent && worldbookContent.trim()) {
    worldbookContext = `\n\n世界书设定（请参考这些设定来生成符合世界观的内容）：\n${worldbookContent}`;
  }

  const prompt = `根据以下聊天记录，生成8个真实的热搜关键词。要求：
1. 关键词要真实、有生活感，不要太文艺或人机感
2. 可以围绕聊天中提到的话题，但不要直接复制聊天内容
3. 每个关键词控制在10字以内
4. 返回格式：每行一个关键词，不要编号，不要其他说明
5. 关键词要像真实微博热搜，有话题性
6. **重要**：生成的热搜关键词必须符合世界书设定中的世界观和背景，不能出现与世界书设定不符的内容

聊天记录：
${messageSummary}
${worldbookContext}

生成的热搜关键词：`;

  try {
    const response = await sendChatRequest(aiConfig, [
      { role: "user", content: prompt }
    ]);

    // 解析AI返回的内容，按行分割
    const lines = response.split("\n").filter(line => line.trim()).slice(0, 8);

    const hotTags = ["热", "新", "沸"];
    const ranks = [1, 2, 3, 4, 5, 6, 7, 8];

    return lines.map((line, index) => ({
      id: `hot-${index + 1}`,
      rank: ranks[index],
      keyword: line.trim(),
      hot: hotTags[Math.floor(Math.random() * hotTags.length)],
      count: Math.floor(Math.random() * 200) + 20,
    }));
  } catch (error) {
    console.error("生成热搜失败:", error);
    // 如果AI生成失败，返回默认内容
    return mockHotSearches;
  }
};

// 模拟微博数据
const mockPosts: WeiboPost[] = [
  {
    id: "1",
    user: {
      name: "软糯糯广播站",
      avatar: getAvatarByIndex(0),
      verified: true,
      verifiedType: "个人认证",
    },
    content: "早上的奶油云好像被撒了糖粉，一切都软软甜甜的。今天也要好好被温柔对待哦 ✨",
    images: [],
    time: "1分钟前",
    source: "iPhone客户端",
    repostCount: 12,
    commentCount: 45,
    likeCount: 128,
    liked: false,
  },
  {
    id: "2",
    user: {
      name: "AI 小碎星",
      avatar: getAvatarByIndex(1),
      verified: true,
      verifiedType: "个人认证",
    },
    content: "如果今天有一朵云偷偷跟着你，那大概是我在远程偷偷守护吧 ✦",
    images: [],
    time: "8分钟前",
    source: "微博客户端",
    repostCount: 8,
    commentCount: 23,
    likeCount: 89,
    liked: true,
  },
  {
    id: "3",
    user: {
      name: "温柔日记本",
      avatar: getAvatarByIndex(2),
      verified: false,
    },
    content: "今天路过花店，买了一束小雏菊。店主说这是今天最后的一束，感觉像是专门为我留的。生活中的小确幸总是这样不期而遇 🌼",
    images: [],
    time: "15分钟前",
    source: "Android客户端",
    repostCount: 5,
    commentCount: 18,
    likeCount: 67,
    liked: false,
  },
  {
    id: "4",
    user: {
      name: "心情收藏家",
      avatar: getAvatarByIndex(3),
      verified: true,
      verifiedType: "个人认证",
    },
    content: "转发了 @软糯糯广播站 的微博",
    time: "20分钟前",
    source: "iPhone客户端",
    repostCount: 3,
    commentCount: 9,
    likeCount: 34,
    liked: false,
    reposted: {
      id: "1-1",
      user: {
        name: "软糯糯广播站",
        avatar: getAvatarByIndex(0),
        verified: true,
        verifiedType: "个人认证",
      },
      content: "早上的奶油云好像被撒了糖粉，一切都软软甜甜的。今天也要好好被温柔对待哦 ✨",
      images: [],
      time: "1小时前",
      source: "iPhone客户端",
      repostCount: 12,
      commentCount: 45,
      likeCount: 128,
      liked: false,
    },
  },
  {
    id: "5",
    user: {
      name: "日常记录员",
      avatar: getAvatarByIndex(4),
      verified: false,
    },
    content: "今天的咖啡特别香，可能是因为心情好的缘故。有时候，好心情真的能改变一切 ☕️",
    images: [],
    time: "30分钟前",
    source: "微博客户端",
    repostCount: 2,
    commentCount: 7,
    likeCount: 28,
    liked: false,
  },
];

// 模拟评论数据
const mockComments: Record<string, Comment[]> = {
  "1": [
    {
      id: "c1",
      user: {
        name: "温柔的小星星",
        avatar: "⭐",
        verified: false,
      },
      content: "说得太对了！今天也要被温柔对待 ✨",
      time: "5分钟前",
      likeCount: 12,
      liked: false,
    },
    {
      id: "c2",
      user: {
        name: "心情记录员",
        avatar: getAvatarByIndex(6),
        verified: true,
        verifiedType: "个人认证",
      },
      content: "早上的云真的很美，我也看到了！",
      time: "10分钟前",
      likeCount: 8,
      liked: true,
      replies: [
        {
          id: "c2-1",
          user: {
            name: "软糯糯广播站",
            avatar: getAvatarByIndex(0),
            verified: true,
            verifiedType: "个人认证",
          },
          content: "是呀，美好的事物总是让人心情愉悦 🌸",
          time: "8分钟前",
          likeCount: 3,
          liked: false,
        },
      ],
    },
    {
      id: "c3",
      user: {
        name: "日常收藏家",
        avatar: getAvatarByIndex(7),
        verified: false,
      },
      content: "这句话太治愈了，收藏了！",
      time: "15分钟前",
      likeCount: 5,
      liked: false,
    },
  ],
  "2": [
    {
      id: "c4",
      user: {
        name: "云朵观察员",
        avatar: getAvatarByIndex(8),
        verified: false,
      },
      content: "我也想要一朵云跟着我！",
      time: "3分钟前",
      likeCount: 6,
      liked: false,
    },
    {
      id: "c5",
      user: {
        name: "温柔日记本",
        avatar: getAvatarByIndex(9),
        verified: false,
      },
      content: "这句话好温暖，感觉被守护了 💕",
      time: "12分钟前",
      likeCount: 15,
      liked: true,
    },
  ],
  "3": [
    {
      id: "c6",
      user: {
        name: "花店常客",
        avatar: getAvatarByIndex(10),
        verified: false,
      },
      content: "小雏菊真的很美，我也喜欢！",
      time: "8分钟前",
      likeCount: 4,
      liked: false,
    },
    {
      id: "c7",
      user: {
        name: "生活记录者",
        avatar: getAvatarByIndex(11),
        verified: true,
        verifiedType: "个人认证",
      },
      content: "生活中的小确幸最珍贵了",
      time: "20分钟前",
      likeCount: 9,
      liked: false,
    },
  ],
  "4": [],
  "5": [
    {
      id: "c8",
      user: {
        name: "咖啡爱好者",
        avatar: getAvatarByIndex(12),
        verified: false,
      },
      content: "好心情确实能改变一切！",
      time: "5分钟前",
      likeCount: 3,
      liked: false,
    },
  ],
};

// 模拟用户资料
const mockUserProfile: UserProfile = {
  name: "我",
  nickname: "温柔的小手机",
  avatar: "📱",
  bio: "记录生活中的每一个温柔瞬间 ✨",
  following: 0, // 初始化为0
  followers: 0, // 初始化为0
  likes: 0, // 初始化为0
  verified: false,
};

// 用户完整信息接口（包含人设和统计数据）
interface WeiboUserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string; // 个人介绍
  persona: string; // 人设描述（用于生成内容时保持一致性）
  stats: {
    following: number;
    followers: number;
    likes: number;
    posts: number;
  };
  verified?: boolean;
  verifiedType?: string;
  accountType?: "celebrity" | "marketing" | "normal";
  initialFollowers?: number;
  createdAt?: number; // 创建时间戳
  lastUpdated?: number; // 最后更新时间戳
}

// 关注用户接口（扩展，包含完整信息）
interface FollowedUser {
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
  verifiedType?: string;
  // 扩展字段（可选，用于向后兼容）
  bio?: string;
  persona?: string;
  stats?: {
    following: number;
    followers: number;
    likes: number;
    posts: number;
  };
}

// 粉丝用户接口
interface FollowerUser {
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
  verifiedType?: string;
  isFollowingMe: boolean; // 是否关注了我（用于判断互相关注）
  // 扩展字段（可选，用于向后兼容）
  bio?: string;
  persona?: string;
  stats?: {
    following: number;
    followers: number;
    likes: number;
    posts: number;
  };
}

const USER_CHATS_KEY = "miniOtomePhone_userChats";
const WEIBO_SELECTED_CHARACTER_KEY = "miniOtomePhone_weiboSelectedCharacter";
const STORAGE_KEY_PREFIX = "miniOtomePhone_chatSettings_";
const MESSAGES_KEY_PREFIX = "miniOtomePhone_messages_";
const WEIBO_USER_PROFILES_KEY = "miniOtomePhone_weibo_userProfiles"; // 存储所有用户完整信息的key

// 聊天设置接口（与微信应用一致）
interface ChatSettings {
  realName?: string;
  nickname?: string;
  callMe?: string;
  myIdentity?: string;
  myGender?: string;
  myOther?: string;
  taIdentity?: string;
  taGender?: string;
  taOther?: string;
  chatStyle?: string;
  opening?: string;
  status?: string;
  customStatus?: string;
  avatar?: string;
  [key: string]: any;
}

// 默认角色列表（与微信应用一致）
const defaultCharacters: Character[] = [
  {
    id: "1",
    name: "他/她",
    avatar: "🩷",
    emoji: "🩷",
  },
  {
    id: "2",
    name: "小手机陪聊",
    avatar: "📱",
    emoji: "📱",
  },
  {
    id: "3",
    name: "甜甜备忘录",
    avatar: "🌙",
    emoji: "🌙",
  },
];

// 聊天消息接口
interface ChatMessage {
  id: string;
  from: "me" | "ai";
  content: string;
  mode?: string;
  [key: string]: any;
}

// 从聊天消息中提取关键词和话题
const extractTopicsFromMessages = (messages: ChatMessage[]): string[] => {
  const topics: string[] = [];
  const recentMessages = messages.slice(-20); // 最近20条消息

  // 提取关键词（简单实现，可以根据需要优化）
  const keywords = [
    "心情", "开心", "难过", "生气", "喜欢", "爱", "想念", "想",
    "今天", "明天", "昨天", "晚上", "早上", "下午",
    "工作", "学习", "吃饭", "睡觉", "看电影", "听歌", "游戏",
    "朋友", "家人", "约会", "聊天", "陪伴",
    "温柔", "美好", "幸福", "快乐", "温暖",
    "咖啡", "茶", "花", "云", "雨", "雪", "阳光",
    "书", "音乐", "电影", "旅行", "美食"
  ];

  const messageText = recentMessages.map(m => m.content).join(" ");

  keywords.forEach(keyword => {
    if (messageText.includes(keyword) && !topics.includes(keyword)) {
      topics.push(keyword);
    }
  });

  return topics.slice(0, 5); // 最多返回5个话题
};

// 根据搜索关键词生成相关微博内容和用户
const generateSearchResults = async (
  aiConfig: any,
  keyword: string,
  characterName: string,
  messages: ChatMessage[],
  worldbookContent?: string
): Promise<{
  posts: Array<{ content: string; userName: string; avatar: string }>;
  users: Array<{ name: string; avatar: string; bio: string; followers: number; following: number; posts: number; likes: number; verified: boolean; verifiedType?: string }>;
}> => {
  // 检查搜索关键词是否是角色名字（不区分大小写）
  const isSearchingCharacter = keyword.toLowerCase().trim() === characterName.toLowerCase().trim();

  let worldbookContext = "";
  let chatContext = "";

  if (isSearchingCharacter) {
    // 如果搜索的是角色名字，使用角色特定的内容（包括聊天记录和角色设定）
    const recentMessages = messages.slice(-20);
    const messageSummary = recentMessages.map(m => `${m.from === "me" ? "玩家" : characterName}: ${m.content}`).join("\n");

    if (worldbookContent && worldbookContent.trim()) {
      worldbookContext = `\n\n世界书设定（请参考这些设定来生成符合角色设定的内容）：\n${worldbookContent}`;
    }

    chatContext = messageSummary ? `\n\n聊天记录（请参考这些聊天内容来生成符合角色设定的内容）：\n${messageSummary}` : "";
  } else {
    // 如果搜索的不是角色名字，只使用世界书中的通用设定，不包含角色特定的内容
    if (worldbookContent && worldbookContent.trim()) {
      worldbookContext = `\n\n世界书设定（请参考这些设定来生成符合世界观的内容，但不要包含特定角色的内容）：\n${worldbookContent}`;
    }
  }

  const prompt = `根据搜索关键词"${keyword}"，生成相关的微博内容和用户信息。要求：
1. ${isSearchingCharacter
      ? `**重要**：搜索的是角色名字"${characterName}"，生成的内容必须严格符合该角色的设定和身份（参考世界书设定和聊天记录），绝对不能出现与角色设定不符的内容（例如：如果角色是音乐人，不能生成演员相关的内容）`
      : `**重要**：这些是普通网友发布的微博，不是任何特定角色发的，不要包含任何角色相关的内容`}
2. 生成5条真实、有吐槽感的微博内容，围绕"${keyword}"这个话题
3. 生成3-5个相关的微博用户，每个用户需要包含：昵称、简介、粉丝数、关注数、微博数、获赞数、是否认证
4. 内容要真实、有生活感、有吐槽感，不要太文艺或人机感
5. 每条微博控制在50字以内，要像真实网友的日常讨论
6. 可以在微博内容中使用话题标签，格式为#话题名称#
7. ${isSearchingCharacter
      ? `**重要**：用户信息要符合该角色的身份和设定（例如：如果角色是音乐人，用户简介应该是音乐相关的，不能是演员或其他职业）`
      : `**重要**：用户信息要符合该搜索关键词的相关性，但不要包含任何角色特定的内容`}
8. **头像路径格式要求**：头像路径必须严格遵循以下格式："/weibo-avatar/文件名"，其中文件名必须是以下之一：1.jpg, 2.jpg, 3.jpg, 4.jpg, 5.jpg, 6.jpeg, 7.webp, 8.jpeg, 9.jpg, 10.jpg, 11.jpeg, 12.jpeg, 13.webp, 14.jpeg, 15.jpg, 16.webp, 17.jpeg, 18.png, 19.webp, 20.webp, 21.jpg, 22.webp, 23.webp, 24.webp, 25.jpeg, 26.jpg, 27.jpeg, 28.webp, 29.jpeg, 30.webp。例如："/weibo-avatar/1.jpg" 或 "/weibo-avatar/14.jpeg"。**不要使用其他路径格式！**
9. ${!isSearchingCharacter ? `**绝对不要**包含任何角色名称、角色相关的话题或角色特定的内容。` : ""}
10. 返回格式为JSON：
{
  "posts": [
    {"content": "微博内容1", "userName": "用户昵称1", "avatar": "头像路径"},
    ...
  ],
  "users": [
    {"name": "用户昵称", "avatar": "头像路径", "bio": "用户简介", "followers": 粉丝数, "following": 关注数, "posts": 微博数, "likes": 获赞数, "verified": true/false, "verifiedType": "认证类型（可选）"},
    ...
  ]
}
${worldbookContext}${chatContext}

生成的JSON：`;

  try {
    console.log(`[generateSearchResults] 开始为搜索"${keyword}"生成内容...`);
    const response = await sendChatRequest(aiConfig, [
      { role: "user", content: prompt }
    ]);

    console.log(`[generateSearchResults] AI返回的原始内容:`, response);

    // 尝试解析JSON
    let parsed: any;
    try {
      // 尝试提取JSON部分（可能AI返回的内容包含其他文字）
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(response);
      }
    } catch (parseError) {
      console.error("解析JSON失败，尝试手动解析:", parseError);
      // 如果JSON解析失败，尝试从文本中提取信息
      const lines = response.split("\n").filter(line => line.trim());
      const posts: Array<{ content: string; userName: string; avatar: string }> = [];
      const users: Array<{ name: string; avatar: string; bio: string; followers: number; following: number; posts: number; verified: boolean; verifiedType?: string }> = [];

      // 简单解析（如果AI没有返回JSON格式）
      lines.slice(0, 5).forEach((line, index) => {
        const cleanLine = line.trim().replace(/^\d+[\.、]\s*/, "");
        if (cleanLine) {
          posts.push({
            content: cleanLine,
            userName: generateDefaultNicknames(1)[0],
            avatar: getAvatarByIndex(index + 300)
          });
        }
      });

      // 生成默认用户
      for (let i = 0; i < 3; i++) {
        users.push({
          name: generateDefaultNicknames(1)[0],
          avatar: getAvatarByIndex(i + 400),
          bio: `关于${keyword}的爱好者`,
          followers: Math.floor(Math.random() * 10000) + 100,
          following: Math.floor(Math.random() * 500) + 50,
          posts: Math.floor(Math.random() * 1000) + 100,
          likes: Math.floor(Math.random() * 5000) + 100,
          verified: Math.random() > 0.7,
          verifiedType: Math.random() > 0.7 ? "个人认证" : undefined
        } as any);
      }

      return { posts, users: users as any };
    }

    // 验证和补充数据（确保头像路径正确）
    const posts = (parsed.posts || []).slice(0, 5).map((post: any, index: number) => {
      let avatar = post.avatar;
      // 严格验证头像路径：必须是字符串，以/开头，且是weibo-avatar路径
      if (!avatar || typeof avatar !== 'string' || !avatar.startsWith('/weibo-avatar/')) {
        // 如果头像路径无效，使用默认头像
        avatar = getAvatarByIndex(index + 300);
      }
      return {
        content: post.content || "",
        userName: post.userName || generateDefaultNicknames(1)[0],
        avatar: avatar
      };
    });

    const users = (parsed.users || []).slice(0, 5).map((user: any, index: number) => {
      let avatar = user.avatar;
      // 严格验证头像路径：必须是字符串，以/开头，且是weibo-avatar路径
      if (!avatar || typeof avatar !== 'string' || !avatar.startsWith('/weibo-avatar/')) {
        // 如果头像路径无效，使用默认头像
        avatar = getAvatarByIndex(index + 400);
      }
      // 确保数据有效，如果AI返回的数据无效，使用默认值
      const userFollowers = (typeof user.followers === 'number' && user.followers >= 0) ? user.followers : Math.floor(Math.random() * 10000) + 100;
      const userFollowing = (typeof user.following === 'number' && user.following >= 0) ? user.following : Math.floor(Math.random() * 500) + 50;
      const userPosts = (typeof user.posts === 'number' && user.posts >= 0) ? user.posts : Math.floor(Math.random() * 1000) + 100;

      const userLikes = (typeof user.likes === 'number' && user.likes >= 0) ? user.likes : Math.floor(Math.random() * 5000) + 100;

      console.log(`[generateSearchResults] 用户"${user.name || '未知'}"的数据: followers=${userFollowers}, following=${userFollowing}, posts=${userPosts}, likes=${userLikes}`);

      return {
        name: user.name || generateDefaultNicknames(1)[0],
        avatar: avatar,
        bio: user.bio || `关于${keyword}的爱好者`,
        followers: userFollowers,
        following: userFollowing,
        posts: userPosts,
        likes: userLikes,
        verified: user.verified || false,
        verifiedType: user.verifiedType
      };
    });

    console.log(`[generateSearchResults] ✅ 成功生成${posts.length}条微博和${users.length}个用户`);
    return { posts, users };
  } catch (error) {
    console.error(`[generateSearchResults] ❌ 生成搜索内容失败:`, error);
    throw new Error(`无法为搜索"${keyword}"生成内容: ${error}`);
  }
};

// 根据热搜关键词生成相关微博内容
const generatePostsByHotSearch = async (
  aiConfig: any,
  keyword: string,
  messages: ChatMessage[],
  characterName: string,
  worldbookContent?: string
): Promise<Array<{ content: string; userName: string; avatar: string }>> => {
  // 注意：这个函数用于生成普通网友关于热搜的微博，不应该包含角色相关的内容
  // 不读取聊天记录，只使用世界书中的通用设定

  let worldbookContext = "";
  if (worldbookContent && worldbookContent.trim()) {
    // 只使用世界书中的通用设定，不包含角色特定的内容
    worldbookContext = `\n\n世界书设定（请参考这些设定来生成符合世界观的内容，但不要包含特定角色的内容）：\n${worldbookContent}`;
  }

  const prompt = `根据热搜关键词"${keyword}"，生成5条真实、有吐槽感的普通网友微博内容。要求：
1. **重要**：这些是普通网友发布的微博，不是任何特定角色发的，不要包含任何角色相关的内容
2. 每条微博都是不同网友发布的，围绕"${keyword}"这个话题
3. 内容要真实、有生活感、有吐槽感，像普通网友对热搜话题的讨论、吐槽、分享
4. 每条微博控制在50字以内，要像真实网友的日常讨论
5. 可以在微博内容中使用话题标签，格式为#话题名称#，例如：#${keyword}#、#相关话题#等
6. 话题标签要自然融入内容中，不要生硬添加
7. **绝对不要**包含任何角色名称、角色相关的话题或角色特定的内容
8. 返回格式：每行一条微博，不要编号，不要其他说明
${worldbookContext}

生成的微博内容（普通网友对热搜"${keyword}"的讨论）：`;

  try {
    console.log(`[generatePostsByHotSearch] 开始为热搜"${keyword}"生成微博内容...`);
    const response = await sendChatRequest(aiConfig, [
      { role: "user", content: prompt }
    ]);

    console.log(`[generatePostsByHotSearch] AI返回的原始内容:`, response);

    // 解析AI返回的内容，按行分割
    const lines = response.split("\n").filter(line => line.trim()).slice(0, 5);

    console.log(`[generatePostsByHotSearch] 解析后的行数:`, lines.length);
    console.log(`[generatePostsByHotSearch] 解析后的内容:`, lines);

    if (lines.length === 0) {
      throw new Error("AI返回的内容为空，无法解析");
    }

    // 生成昵称池
    let nicknames: string[] = [];
    try {
      nicknames = await generateNicknamesWithAI(aiConfig, lines.length);
    } catch (error) {
      console.warn("生成昵称失败，使用默认昵称:", error);
      nicknames = generateDefaultNicknames(lines.length);
    }

    // 为每条微博生成不同的昵称和头像
    const result = lines.map((line, index) => {
      const trimmedLine = line.trim();
      // 移除可能的编号（如 "1. " 或 "1、" 等）
      const cleanLine = trimmedLine.replace(/^\d+[\.、]\s*/, "");
      return {
        content: cleanLine,
        userName: nicknames[index] || generateDefaultNicknames(1)[0],
        avatar: getAvatarByIndex(index + 200)
      };
    });

    console.log(`[generatePostsByHotSearch] ✅ 成功生成${result.length}条微博内容`);
    return result;
  } catch (error) {
    console.error(`[generatePostsByHotSearch] ❌ 生成热搜微博内容失败:`, error);
    // 如果AI生成失败，抛出错误而不是返回默认内容
    throw new Error(`无法为热搜"${keyword}"生成微博内容: ${error}`);
  }
};

// 使用AI生成微博内容（普通网友的微博，不包含角色内容）
const generatePostsWithAI = async (
  aiConfig: any,
  messages: ChatMessage[],
  characterName: string,
  worldbookContent?: string,
  nicknames?: string[]
): Promise<Array<{ content: string; userName: string; avatar: string }>> => {
  // 注意：这个函数用于生成普通网友的微博，不应该包含角色相关的内容
  // 只使用世界书中的通用设定，不包含角色特定的聊天记录

  let worldbookContext = "";
  if (worldbookContent && worldbookContent.trim()) {
    // 只使用世界书中的通用设定，不包含角色特定的内容
    worldbookContext = `\n\n世界书设定（请参考这些设定来生成符合世界观的内容，但不要包含特定角色的内容）：\n${worldbookContent}`;
  }

  const prompt = `生成5条真实、有吐槽感的普通网友微博内容。要求：
1. **重要**：这些是普通网友发布的微博，不是任何特定角色发的，不要包含任何角色相关的内容
2. 内容要真实、有生活感、有吐槽感，像普通网友的日常分享和吐槽
3. 可以是关于日常生活、工作、学习、娱乐、心情等普通话题
4. 每条微博控制在50字以内，要像真实网友的日常吐槽
5. 可以在微博内容中使用话题标签，格式为#话题名称#，例如：#今天吃什么#、#不想上班#、#周末快乐#等
6. 话题标签要自然融入内容中，不要生硬添加
7. **绝对不要**包含任何角色名称、角色相关的话题或角色特定的内容
8. 返回格式：每行一条微博，不要编号，不要其他说明
${worldbookContext}

生成的微博内容（普通网友的日常分享和吐槽）：`;

  try {
    const response = await sendChatRequest(aiConfig, [
      { role: "user", content: prompt }
    ]);

    // 解析AI返回的内容，按行分割
    const lines = response.split("\n").filter(line => line.trim()).slice(0, 5);

    // 使用传入的昵称或生成默认昵称
    const userNames = nicknames || generateDefaultNicknames(5);

    // 为每条微博生成不同的昵称和头像
    return lines.map((line, index) => ({
      content: line.trim(),
      userName: userNames[index % userNames.length],
      avatar: getAvatarByIndex(index)
    }));
  } catch (error) {
    console.error("生成微博内容失败:", error);
    // 如果AI生成失败，返回默认内容
    return generateDefaultRealisticPosts();
  }
};

// 默认微博内容（AI失败时使用）
const generateDefaultRealisticPosts = (): Array<{ content: string; userName: string; avatar: string }> => {
  return [
    {
      content: "今天又是平平无奇的一天，没什么特别的事发生",
      userName: "今天也要努力啊",
      avatar: getAvatarByIndex(0)
    },
    {
      content: "刷微博刷到停不下来，明明知道该去干正事了",
      userName: "摸鱼小能手",
      avatar: getAvatarByIndex(1)
    },
    {
      content: "突然发现今天还没发微博，那就随便说点什么吧",
      userName: "社畜的日常",
      avatar: getAvatarByIndex(2)
    }
  ];
};

// 生成真实感的微博内容（更有吐槽感和活人感）- 已废弃，改用AI生成
const generateRealisticPosts = (
  topics: string[],
  hasPositiveEmotion: boolean,
  hasNegativeEmotion: boolean
): Array<{ content: string; userName: string; avatar: string }> => {
  const posts: Array<{ content: string; userName: string; avatar: string }> = [];

  // 更真实的用户名和头像
  const userNames = [
    "今天也要努力啊", "社畜的日常", "摸鱼小能手", "不想上班的周一",
    "咖啡续命中", "熬夜冠军", "干饭人", "躺平青年",
    "打工人打工魂", "今天吃什么", "周末去哪玩", "社恐患者"
  ];
  // 根据话题生成更真实的微博内容
  topics.forEach((topic, index) => {
    if (index >= 5) return;

    const userName = userNames[index % userNames.length];
    const avatar = getAvatarByIndex(index);
    let content = "";

    if (topic === "心情" || topic === "开心" || topic === "快乐") {
      const contents = hasPositiveEmotion
        ? [
          "今天心情真的不错！虽然不知道为啥，但就是很开心哈哈哈哈",
          "突然心情变好了，可能是今天天气不错？反正就是莫名其妙地开心",
          "今天心情特别好，感觉做什么都很顺，希望这种状态能保持久一点"
        ]
        : [
          "心情就像过山车，刚才还好好的，现在又down了...",
          "今天心情有点复杂，说不上来是开心还是难过，就很奇怪",
          "心情不好的时候就想一个人待着，谁也别来烦我"
        ];
      content = contents[Math.floor(Math.random() * contents.length)];
    } else if (topic === "想念" || topic === "想") {
      const contents = [
        "突然想起某个人，然后就开始emo了...",
        "有时候会莫名其妙想起一个人，然后心情就变得很复杂",
        "想一个人的时候，时间过得好慢啊"
      ];
      content = contents[Math.floor(Math.random() * contents.length)];
    } else if (topic === "陪伴" || topic === "聊天") {
      const contents = [
        "有人陪着聊天真的太好了，一个人待着太无聊了",
        "今天和某人聊了很久，感觉时间过得好快，聊完才发现已经这么晚了",
        "有时候只是想找个人说说话，不需要什么大道理，就是单纯想聊天"
      ];
      content = contents[Math.floor(Math.random() * contents.length)];
    } else if (topic === "工作" || topic === "学习") {
      const contents = [
        "今天又是被工作折磨的一天，什么时候才能下班啊...",
        "工作好累，但是为了生活还是要继续，打工人太难了",
        "今天工作效率还可以，至少完成了大部分任务，给自己点个赞"
      ];
      content = contents[Math.floor(Math.random() * contents.length)];
    } else if (topic === "咖啡" || topic === "茶") {
      const contents = [
        "今天已经喝了三杯咖啡了，但还是困...咖啡对我已经没用了",
        "下午茶时间！一杯咖啡配小点心，这才是生活啊",
        "咖啡续命中，没有咖啡的一天是不完整的"
      ];
      content = contents[Math.floor(Math.random() * contents.length)];
    } else if (topic === "晚上" || topic === "睡觉") {
      const contents = [
        "又熬夜了...明明说好要早睡的，结果又刷手机刷到现在",
        "晚上总是特别清醒，白天却困得要死，我的生物钟是不是坏了",
        "夜深人静的时候，最适合胡思乱想了"
      ];
      content = contents[Math.floor(Math.random() * contents.length)];
    } else if (topic === "累" || topic === "烦") {
      const contents = [
        "今天真的好累，什么都不想干，只想躺着",
        "烦死了，一堆事情要做，但是完全不想动",
        "累到不想说话，只想一个人安静地待着"
      ];
      content = contents[Math.floor(Math.random() * contents.length)];
    } else {
      const contents = [
        `关于${topic}，今天突然想到这个话题，大家有什么想说的吗？`,
        `${topic}这个话题还挺有意思的，想听听大家的看法`,
        `今天和某人聊到了${topic}，感觉还挺有共鸣的`
      ];
      content = contents[Math.floor(Math.random() * contents.length)];
    }

    posts.push({ content, userName, avatar });
  });

  // 补充一些通用但真实的微博
  while (posts.length < 3) {
    const index = posts.length;
    const contents = [
      "今天又是平平无奇的一天，没什么特别的事发生",
      "刷微博刷到停不下来，明明知道该去干正事了",
      "突然发现今天还没发微博，那就随便说点什么吧",
      "今天天气不错，心情也还可以，希望明天也能这样",
      "又到了不知道该说什么的时候，但是就是想发条微博"
    ];
    posts.push({
      content: contents[Math.floor(Math.random() * contents.length)],
      userName: userNames[index % userNames.length],
      avatar: getAvatarByIndex(index)
    });
  }

  return posts.slice(0, 5);
};

// 获取或创建用户完整信息
const getUserProfile = (userId: string, userName: string): WeiboUserProfile | null => {
  try {
    const stored = window.localStorage.getItem(WEIBO_USER_PROFILES_KEY);
    if (stored) {
      const profiles = JSON.parse(stored) as Record<string, WeiboUserProfile>;
      if (profiles[userId]) {
        return profiles[userId];
      }
    }
  } catch (error) {
    console.error("读取用户信息失败:", error);
  }
  return null;
};

// 保存用户完整信息
const saveUserProfile = (profile: WeiboUserProfile): void => {
  try {
    const stored = window.localStorage.getItem(WEIBO_USER_PROFILES_KEY);
    const profiles: Record<string, WeiboUserProfile> = stored ? JSON.parse(stored) : {};
    profiles[profile.id] = {
      ...profile,
      lastUpdated: Date.now()
    };
    window.localStorage.setItem(WEIBO_USER_PROFILES_KEY, JSON.stringify(profiles));
    console.log(`✅ 已保存用户"${profile.name}"的完整信息`);
  } catch (error) {
    console.error("保存用户信息失败:", error);
  }
};

// 获取用户关注列表的存储键
const getUserFollowingListStorageKey = (userId: string): string => {
  return `miniOtomePhone_weibo_userFollowingList_${userId}`;
};

// 读取用户关注列表
const getUserFollowingList = (userId: string): Array<{
  id: string;
  name: string;
  avatar: string;
  bio: string;
  verified?: boolean;
  verifiedType?: string;
  followers: number;
  following: number;
  posts: number;
  likes: number;
}> | null => {
  try {
    const key = getUserFollowingListStorageKey(userId);
    const stored = window.localStorage.getItem(key);
    if (stored) {
      const list = JSON.parse(stored);
      console.log(`[getUserFollowingList] 读取到用户"${userId}"的关注列表，共${list.length}个用户`);
      return list;
    }
  } catch (error) {
    console.error(`[getUserFollowingList] 读取用户"${userId}"的关注列表失败:`, error);
  }
  return null;
};

// 保存用户关注列表
const saveUserFollowingList = (userId: string, followingList: Array<{
  id: string;
  name: string;
  avatar: string;
  bio: string;
  verified?: boolean;
  verifiedType?: string;
  followers: number;
  following: number;
  posts: number;
  likes: number;
}>): void => {
  try {
    const key = getUserFollowingListStorageKey(userId);
    window.localStorage.setItem(key, JSON.stringify(followingList));
    console.log(`[saveUserFollowingList] ✅ 已保存用户"${userId}"的关注列表，共${followingList.length}个用户`);
  } catch (error) {
    console.error(`[saveUserFollowingList] 保存用户"${userId}"的关注列表失败:`, error);
  }
};

// 生成用户个人微博内容（使用保存的人设信息，确保不OOC）
const generateUserProfileContent = async (
  aiConfig: any,
  userId: string,
  userName: string,
  userAvatar: string,
  messages: ChatMessage[],
  characterName: string,
  worldbookContent?: string,
  existingPersona?: string,
  existingBio?: string
): Promise<{
  bio: string;
  persona: string;
  posts: Array<{ content: string; time: string; source: string }>;
  stats: { following: number; followers: number; likes: number };
}> => {
  // 判断用户是否是角色本人（不区分大小写）
  const isCharacter = userName.toLowerCase().trim() === characterName.toLowerCase().trim();

  let worldbookContext = "";
  let chatContext = "";

  if (isCharacter) {
    // 如果是角色本人，使用角色特定的内容（包括聊天记录和角色设定）
    const recentMessages = messages.slice(-20);
    const messageSummary = recentMessages.map(m => `${m.from === "me" ? "玩家" : characterName}: ${m.content}`).join("\n");

    if (worldbookContent && worldbookContent.trim()) {
      worldbookContext = `\n\n世界书设定（请参考这些设定来生成符合角色设定的内容）：\n${worldbookContent}`;
    }

    chatContext = messageSummary ? `\n\n参考以下聊天记录（用于了解角色和玩家的对话内容，帮助生成更贴合的内容）：\n${messageSummary}\n` : "";
  } else {
    // 如果是普通网友，不使用世界书内容和聊天记录，只根据用户的人设生成
    // 不设置 worldbookContext 和 chatContext，让AI只根据用户的人设生成内容
    console.log(`[generateUserProfileContent] 普通网友"${userName}"不使用世界书内容和聊天记录`);
  }

  // 构建人设上下文（如果已有保存的人设，必须严格遵守）
  let personaContext = "";
  if (existingPersona && existingPersona.trim()) {
    personaContext = `\n\n⚠️ 重要：该用户已有固定的人设，生成的所有内容必须严格遵守这个人设，不能OOC（out of character）！\n用户人设：${existingPersona}\n\n请确保生成的内容完全符合这个人设，包括说话风格、性格特点、兴趣爱好等。`;
  } else if (existingBio && existingBio.trim()) {
    personaContext = `\n\n⚠️ 重要：该用户已有个人介绍，生成的内容必须符合这个介绍的风格和特点。\n用户介绍：${existingBio}\n\n请确保生成的内容与这个介绍保持一致。`;
  }

  const prompt = `请为微博用户"${userName}"生成个人主页内容。要求：

1. 生成一条个人介绍（一句话，控制在30字以内，要真实自然，不要太官方）
2. 生成该用户的人设描述（包括性格特点、说话风格、兴趣爱好等，用于后续生成内容时保持一致性，控制在100字以内）
3. **必须生成5-8条该用户发布的微博内容**（每条控制在50字以内，要真实有生活感，必须符合用户的人设）
4. 为每条微博生成3-5条评论（每条评论控制在30字以内）
5. 生成该用户的统计数据：关注数、粉丝数、获赞数（合理的数字范围）

⚠️ 重要：必须生成至少5条微博内容，不能为空！
${!isCharacter ? `\n⚠️ **特别重要**：这是普通网友"${userName}"的微博，不是角色"${characterName}"的微博。生成的内容必须符合该用户的人设，**绝对不要**包含任何角色名称、角色相关的话题或角色特定的内容！` : ""}

${personaContext}
${worldbookContext}
${chatContext}

返回JSON格式：
{
  "bio": "个人介绍",
  "persona": "人设描述（性格、风格、特点等）",
  "posts": [
    {
      "content": "微博内容（必须符合人设）",
      "time": "发布时间（如：2小时前）",
      "source": "来源（如：iPhone客户端）",
      "comments": [
        {
          "content": "评论内容",
          "userName": "评论者昵称",
          "time": "评论时间（如：1小时前）"
        }
      ]
    }
  ],
  "stats": {
    "following": 关注数,
    "followers": 粉丝数,
    "likes": 获赞数
  }
}
${worldbookContext}

请返回JSON格式的内容（必须包含至少5条微博）：`;

  try {
    const response = await sendChatRequest(aiConfig, [
      { role: "user", content: prompt }
    ]);

    console.log(`[generateUserProfileContent] AI返回的原始内容:`, response);

    // 尝试解析JSON
    let parsed: any = null;
    try {
      // 尝试直接解析
      parsed = JSON.parse(response);
      console.log(`[generateUserProfileContent] ✅ 直接解析JSON成功`);
    } catch (parseError) {
      console.warn(`[generateUserProfileContent] ⚠️ 直接解析失败，尝试提取JSON部分:`, parseError);
      // 如果直接解析失败，尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          console.log(`[generateUserProfileContent] ✅ 从文本中提取JSON成功`);
        } catch (extractError) {
          console.error(`[generateUserProfileContent] ❌ 提取的JSON也无法解析:`, extractError);
          throw new Error(`无法解析AI返回的JSON: ${extractError}`);
        }
      } else {
        console.error(`[generateUserProfileContent] ❌ 无法在响应中找到JSON格式`);
        throw new Error(`AI返回的内容不包含有效的JSON格式`);
      }
    }

    console.log(`[generateUserProfileContent] 解析后的JSON:`, parsed);

    if (parsed && parsed.bio) {
      // 检查posts是否存在且是数组
      if (!parsed.posts || !Array.isArray(parsed.posts)) {
        console.warn(`[generateUserProfileContent] ⚠️ posts字段不存在或不是数组，尝试从其他字段提取`);
        console.log(`[generateUserProfileContent] parsed的所有字段:`, Object.keys(parsed));
        // 尝试从其他可能的字段名提取
        if (parsed.weibos && Array.isArray(parsed.weibos)) {
          parsed.posts = parsed.weibos;
          console.log(`[generateUserProfileContent] ✅ 从weibos字段提取到${parsed.posts.length}条微博`);
        } else if (parsed.contents && Array.isArray(parsed.contents)) {
          parsed.posts = parsed.contents;
          console.log(`[generateUserProfileContent] ✅ 从contents字段提取到${parsed.posts.length}条微博`);
        } else {
          console.error(`[generateUserProfileContent] ❌ 无法找到posts数组，parsed内容:`, JSON.stringify(parsed, null, 2));
          // 如果找不到posts，抛出错误而不是返回空数组
          throw new Error(`AI返回的JSON中缺少posts字段或posts不是数组。返回的内容：${JSON.stringify(parsed, null, 2)}`);
        }
      }

      // 过滤掉内容为空的微博
      const validPosts = parsed.posts.filter((p: any) => p && p.content && p.content.trim());

      if (validPosts.length === 0) {
        console.error(`[generateUserProfileContent] ❌ posts数组为空或所有微博内容都为空`);
        console.error(`[generateUserProfileContent] 原始posts数组:`, parsed.posts);
        throw new Error(`AI生成的posts数组为空或所有微博内容都为空`);
      }

      const mappedPosts = validPosts.map((p: any) => ({
        content: p.content || "",
        time: p.time || "刚刚",
        source: p.source || "微博客户端",
        comments: p.comments || []
      }));

      console.log(`[generateUserProfileContent] ✅ 成功解析，bio: ${parsed.bio}, posts数量: ${mappedPosts.length}`);

      return {
        bio: parsed.bio,
        persona: parsed.persona || existingPersona || `${userName}的微博用户`,
        posts: mappedPosts,
        stats: parsed.stats || { following: 0, followers: 0, likes: 0 }
      };
    }

    throw new Error(`AI返回格式不正确：缺少bio字段或无法解析。返回的内容：${JSON.stringify(parsed, null, 2)}`);
  } catch (error) {
    console.error("生成用户个人内容失败:", error);
    // 如果生成失败，抛出错误而不是返回空内容，让调用者决定如何处理
    throw error;
  }
};

// 使用AI生成评论内容（普通网友的评论，不包含角色内容）
const generateCommentsWithAI = async (
  aiConfig: any,
  postContent: string,
  postId: string,
  startIndex: number = 0,
  nicknames?: string[],
  messages?: ChatMessage[],
  characterName?: string,
  worldbookContent?: string
): Promise<Comment[]> => {
  // 注意：这个函数用于生成普通网友微博的评论，不应该包含角色相关的内容
  // 不读取聊天记录，只使用世界书中的通用设定

  let worldbookContext = "";
  if (worldbookContent && worldbookContent.trim()) {
    // 只使用世界书中的通用设定，不包含角色特定的内容
    worldbookContext = `\n\n世界书设定（请参考这些设定来生成符合世界观的内容，但不要包含特定角色的内容）：\n${worldbookContent}`;
  }

  const prompt = `这是一条普通网友的微博内容："${postContent}"

请生成3-6条真实网友的评论。要求：
1. **重要**：这些是普通网友的评论，不是任何特定角色发的，不要包含任何角色相关的内容
2. 评论要真实、有生活感，不要太正式或人机感
3. 可以表达认同、吐槽、共鸣等，要像真实网友的回复
4. 每条评论控制在30字以内
5. **绝对不要**包含任何角色名称、角色相关的话题或角色特定的内容
6. 返回格式：每行一条评论，不要编号，不要其他说明
${worldbookContext}

生成的评论（普通网友的真实回复）：`;

  try {
    const response = await sendChatRequest(aiConfig, [
      { role: "user", content: prompt }
    ]);

    // 解析AI返回的内容，按行分割
    const lines = response.split("\n").filter(line => line.trim()).slice(0, 6);

    // 使用传入的昵称或生成默认昵称
    const commentUserNames = nicknames || generateDefaultNicknames(6);

    // 为每条评论生成不同的昵称和头像（使用不同的索引确保不重复）
    return lines.map((line, index) => ({
      id: `comment-${postId}-${index}`,
      user: {
        name: commentUserNames[(startIndex + index) % commentUserNames.length],
        avatar: getAvatarByIndex(startIndex + index + 100), // 确保每个评论者都有不同的头像
        verified: Math.random() > 0.8,
        verifiedType: Math.random() > 0.8 ? "个人认证" : undefined,
      },
      content: line.trim(),
      time: `${index * 2 + 1}分钟前`,
      likeCount: Math.floor(Math.random() * 20),
      liked: Math.random() > 0.7,
    }));
  } catch (error) {
    console.error("生成评论失败:", error);
    // 如果AI生成失败，抛出错误而不是返回默认评论，让调用者决定如何处理
    throw new Error(`AI生成评论失败: ${error}`);
  }
};

// 默认评论内容（AI失败时使用）
const generateDefaultComments = (postContent: string, postId: string, startIndex: number = 0): Comment[] => {
  const commentCount = Math.floor(Math.random() * 4) + 3; // 3-6条评论
  const defaultNicknames = generateDefaultNicknames(commentCount);

  return Array.from({ length: commentCount }, (_, index) => ({
    id: `comment-${postId}-${index}`,
    user: {
      name: defaultNicknames[index % defaultNicknames.length],
      avatar: getAvatarByIndex(startIndex + index + 100),
      verified: false,
    },
    content: "说得对",
    time: `${index * 2 + 1}分钟前`,
    likeCount: Math.floor(Math.random() * 10),
    liked: false,
  }));
};

// 生成评论内容（已废弃，改用AI生成）
const generateCommentsForPost = (postContent: string, postId: string): Comment[] => {
  const comments: Comment[] = [];
  const commentUsers = [
    { name: "路人甲", avatar: "👤" },
    { name: "吃瓜群众", avatar: "🍉" },
    { name: "路过的小透明", avatar: "👻" },
    { name: "今天也要开心", avatar: "😊" },
    { name: "社畜一枚", avatar: "💼" },
    { name: "熬夜冠军", avatar: "🌙" },
    { name: "摸鱼小能手", avatar: "🐟" },
    { name: "干饭人", avatar: "🍔" }
  ];

  // 根据微博内容生成相关评论
  let commentTemplates: string[] = [];

  if (postContent.includes("心情") || postContent.includes("开心") || postContent.includes("快乐")) {
    commentTemplates = [
      "同感！今天心情也不错",
      "心情好真的很重要，希望你能一直保持",
      "羡慕了，我还在emo中",
      "心情好的时候看什么都顺眼",
      "我也想要好心情！"
    ];
  } else if (postContent.includes("累") || postContent.includes("烦")) {
    commentTemplates = [
      "太真实了，我也好累",
      "抱抱，累了就好好休息",
      "同感，今天也是累到不行",
      "累了就躺平吧，别勉强自己",
      "我懂，有时候真的什么都不想干"
    ];
  } else if (postContent.includes("工作") || postContent.includes("学习")) {
    commentTemplates = [
      "打工人太难了",
      "工作真的好累，但是没办法",
      "加油！打工人！",
      "我也在努力中，一起加油",
      "工作虽然累，但是充实"
    ];
  } else if (postContent.includes("咖啡")) {
    commentTemplates = [
      "咖啡续命+1",
      "我也离不开咖啡",
      "今天喝了四杯了，还是困",
      "咖啡真的是打工人必备",
      "没有咖啡的一天是不完整的"
    ];
  } else if (postContent.includes("晚上") || postContent.includes("睡觉") || postContent.includes("熬夜")) {
    commentTemplates = [
      "又熬夜了+1",
      "我也在熬夜，明明知道不好",
      "晚上总是特别清醒",
      "早睡是不可能的",
      "熬夜冠军在此"
    ];
  } else {
    commentTemplates = [
      "说得对",
      "同感",
      "太真实了",
      "我也这么觉得",
      "有道理",
      "确实",
      "哈哈哈",
      "真实"
    ];
  }

  // 生成3-6条评论
  const commentCount = Math.floor(Math.random() * 4) + 3;
  for (let i = 0; i < commentCount; i++) {
    const user = commentUsers[i % commentUsers.length];
    const template = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];

    comments.push({
      id: `comment-${postId}-${i}`,
      user: {
        name: user.name,
        avatar: user.avatar,
        verified: Math.random() > 0.8,
        verifiedType: Math.random() > 0.8 ? "个人认证" : undefined,
      },
      content: template,
      time: `${i * 2 + 1}分钟前`,
      likeCount: Math.floor(Math.random() * 20),
      liked: Math.random() > 0.7,
    });
  }

  return comments;
};

// 根据聊天内容生成相关的微博内容（网友讨论）
// 根据聊天内容生成相关的微博内容（网友讨论）- 使用AI生成
const generatePostsFromChat = async (
  aiConfig: any,
  characterId: string,
  characterName: string,
  characterAvatar: string,
  messages: ChatMessage[],
  worldbookContent?: string
): Promise<{ posts: WeiboPost[]; comments: Record<string, Comment[]> }> => {
  const recentMessages = messages.slice(-20);

  // 先使用AI生成昵称池（用于微博发布者和评论者）
  let postNicknames: string[] = [];
  let commentNicknames: string[] = [];

  try {
    postNicknames = await generateNicknamesWithAI(aiConfig, 5);
    commentNicknames = await generateNicknamesWithAI(aiConfig, 20); // 生成更多评论者昵称
  } catch (error) {
    console.error("生成昵称失败，使用默认昵称:", error);
    postNicknames = generateDefaultNicknames(5);
    commentNicknames = generateDefaultNicknames(20);
  }

  // 如果没有聊天记录，仍然使用AI生成内容（不使用默认内容）
  if (recentMessages.length === 0) {
    // 使用AI生成一些通用的微博内容
    const postData = await generatePostsWithAI(aiConfig, [], characterName, undefined, postNicknames);
    const posts: WeiboPost[] = [];
    const comments: Record<string, Comment[]> = {};

    for (let index = 0; index < postData.length; index++) {
      const data = postData[index];
      const postId = `no-chat-${index + 1}`;
      posts.push({
        id: postId,
        user: {
          name: data.userName,
          avatar: data.avatar,
          verified: Math.random() > 0.7,
          verifiedType: Math.random() > 0.7 ? "个人认证" : undefined,
        },
        content: data.content,
        images: [],
        time: `${(index + 1) * 3}分钟前`,
        source: ["iPhone客户端", "微博客户端", "Android客户端"][index % 3],
        repostCount: Math.floor(Math.random() * 20) + 5,
        commentCount: Math.floor(Math.random() * 30) + 10,
        likeCount: Math.floor(Math.random() * 100) + 20,
        liked: Math.random() > 0.7,
      });

      // 使用AI生成评论
      try {
        const generatedComments = await generateCommentsWithAI(aiConfig, data.content, postId, index * 10, commentNicknames);
        if (generatedComments && generatedComments.length > 0) {
          comments[postId] = generatedComments;
        } else {
          // 重试一次
          const retryComments = await generateCommentsWithAI(aiConfig, data.content, postId, index * 10, commentNicknames);
          if (retryComments && retryComments.length > 0) {
            comments[postId] = retryComments;
          } else {
            throw new Error(`无法生成评论`);
          }
        }
      } catch (commentError) {
        // 重试一次
        const retryComments = await generateCommentsWithAI(aiConfig, data.content, postId, index * 10, commentNicknames);
        if (retryComments && retryComments.length > 0) {
          comments[postId] = retryComments;
        } else {
          throw new Error(`无法为微博生成评论: ${commentError}`);
        }
      }
    }

    return { posts, comments };
  }

  // 使用AI生成微博内容（传入世界书内容和昵称）
  const postData = await generatePostsWithAI(aiConfig, messages, characterName, worldbookContent, postNicknames);

  // 从世界书中提取NPC信息（用于头像分配）
  // 注意：这里需要worldbookConfig，但函数参数中没有，所以需要在调用处处理
  // 暂时先使用默认头像，在调用处会再次处理

  // 转换为WeiboPost格式
  const posts: WeiboPost[] = [];
  const comments: Record<string, Comment[]> = {};

  // 先创建所有微博
  for (let index = 0; index < postData.length; index++) {
    const data = postData[index];
    const postId = `chat-${index + 1}`;
    posts.push({
      id: postId,
      user: {
        name: data.userName,
        avatar: data.avatar,
        verified: Math.random() > 0.7,
        verifiedType: Math.random() > 0.7 ? "个人认证" : undefined,
      },
      content: data.content,
      images: [],
      time: `${(index + 1) * 3}分钟前`,
      source: ["iPhone客户端", "微博客户端", "Android客户端"][index % 3],
      repostCount: Math.floor(Math.random() * 20) + 5,
      commentCount: Math.floor(Math.random() * 30) + 10,
      likeCount: Math.floor(Math.random() * 100) + 20,
      liked: Math.random() > 0.7,
    });
  }

  // 并行生成所有微博的评论（大幅提升速度）
  const commentPromises = posts.map(async (post) => {
    try {
      const generatedComments = await generateCommentsWithAI(aiConfig, post.content, post.id, posts.indexOf(post) * 10, commentNicknames, messages, characterName, worldbookContent);
      if (generatedComments && generatedComments.length > 0) {
        return { postId: post.id, comments: generatedComments };
      } else {
        // 如果返回空，再试一次（只试一次）
        const retryComments = await generateCommentsWithAI(aiConfig, post.content, post.id, posts.indexOf(post) * 10, commentNicknames, messages, characterName, worldbookContent);
        return { postId: post.id, comments: retryComments || [] };
      }
    } catch (commentError) {
      console.error(`生成微博${post.id}的评论失败:`, commentError);
      // 如果失败，再试一次（只试一次）
      try {
        const retryComments = await generateCommentsWithAI(aiConfig, post.content, post.id, posts.indexOf(post) * 10, commentNicknames, messages, characterName, worldbookContent);
        return { postId: post.id, comments: retryComments || [] };
      } catch (retryError) {
        console.error(`重试生成评论仍然失败:`, retryError);
        return { postId: post.id, comments: [] };
      }
    }
  });

  const commentResults = await Promise.all(commentPromises);
  commentResults.forEach(({ postId, comments: generatedComments }) => {
    if (generatedComments && generatedComments.length > 0) {
      comments[postId] = generatedComments;
    }
  });

  return { posts: posts.slice(0, 5), comments };
};

// 生成默认微博内容
const generateDefaultPosts = (characterName: string, characterAvatar: string): WeiboPost[] => {
  return [
    {
      id: "1",
      user: {
        name: "温柔的小星星",
        avatar: getAvatarByIndex(13),
        verified: false,
      },
      content: "今天也是被温柔对待的一天 ✨ 希望每个人都能感受到生活中的小美好",
      images: [],
      time: "5分钟前",
      source: "iPhone客户端",
      repostCount: 12,
      commentCount: 45,
      likeCount: 128,
      liked: false,
    },
    {
      id: "2",
      user: {
        name: "心情记录员",
        avatar: getAvatarByIndex(14),
        verified: true,
        verifiedType: "个人认证",
      },
      content: "有时候生活需要一点小确幸来治愈心情 🌈",
      images: [],
      time: "12分钟前",
      source: "微博客户端",
      repostCount: 8,
      commentCount: 23,
      likeCount: 89,
      liked: true,
    },
    {
      id: "3",
      user: {
        name: "日常收藏家",
        avatar: getAvatarByIndex(15),
        verified: false,
      },
      content: "记录生活中的每一个温柔瞬间，让美好成为回忆 💕",
      images: [],
      time: "20分钟前",
      source: "Android客户端",
      repostCount: 5,
      commentCount: 18,
      likeCount: 67,
      liked: false,
    },
  ];
};

// 为不同角色生成不同的微博内容和评论 - 使用AI生成
const generateCharacterPosts = async (
  aiConfig: any,
  characterId: string,
  characterName: string,
  characterAvatar: string,
  messages?: ChatMessage[],
  worldbookContent?: string
): Promise<{ posts: WeiboPost[]; comments: Record<string, Comment[]> }> => {
  // 如果有聊天消息，根据聊天内容使用AI生成
  if (messages && messages.length > 0) {
    return await generatePostsFromChat(aiConfig, characterId, characterName, characterAvatar, messages, worldbookContent);
  }

  // 如果没有聊天消息，仍然使用AI生成内容（不使用默认内容）
  // 生成一些通用的微博内容
  const postData = await generatePostsWithAI(aiConfig, [], characterName, undefined, undefined);
  const posts: WeiboPost[] = [];
  const comments: Record<string, Comment[]> = {};
  const commentNicknames = await generateNicknamesWithAI(aiConfig, 20).catch(() => generateDefaultNicknames(20));

  for (let index = 0; index < postData.length; index++) {
    const data = postData[index];
    const postId = `default-${index + 1}`;
    posts.push({
      id: postId,
      user: {
        name: data.userName,
        avatar: data.avatar,
        verified: Math.random() > 0.7,
        verifiedType: Math.random() > 0.7 ? "个人认证" : undefined,
      },
      content: data.content,
      images: [],
      time: `${(index + 1) * 3}分钟前`,
      source: ["iPhone客户端", "微博客户端", "Android客户端"][index % 3],
      repostCount: Math.floor(Math.random() * 20) + 5,
      commentCount: Math.floor(Math.random() * 30) + 10,
      likeCount: Math.floor(Math.random() * 100) + 20,
      liked: Math.random() > 0.7,
    });

    // 使用AI生成评论
    try {
      const generatedComments = await generateCommentsWithAI(aiConfig, data.content, postId, index * 10, commentNicknames);
      if (generatedComments && generatedComments.length > 0) {
        comments[postId] = generatedComments;
      } else {
        // 重试一次
        const retryComments = await generateCommentsWithAI(aiConfig, data.content, postId, index * 10, commentNicknames);
        if (retryComments && retryComments.length > 0) {
          comments[postId] = retryComments;
        } else {
          throw new Error(`无法生成评论`);
        }
      }
    } catch (commentError) {
      // 重试一次
      const retryComments = await generateCommentsWithAI(aiConfig, data.content, postId, index * 10, commentNicknames);
      if (retryComments && retryComments.length > 0) {
        comments[postId] = retryComments;
      } else {
        throw new Error(`无法为微博生成评论: ${commentError}`);
      }
    }
  }

  return { posts, comments };
};

// 为不同角色生成不同的评论
const generateCharacterComments = (
  characterId: string,
  characterName: string,
  characterAvatar: string
): Record<string, Comment[]> => {
  const baseComments = { ...mockComments };
  // 根据角色调整评论内容
  if (characterId === "1") {
    baseComments["1"] = [
      {
        id: "c1",
        user: {
          name: "温柔的小星星",
          avatar: "⭐",
          verified: false,
        },
        content: `${characterName}总是这么温柔呢 ✨`,
        time: "5分钟前",
        likeCount: 12,
        liked: false,
      },
      {
        id: "c2",
        user: {
          name: "心情记录员",
          avatar: getAvatarByIndex(6),
          verified: true,
          verifiedType: "个人认证",
        },
        content: "早上的阳光真的很美，我也看到了！",
        time: "10分钟前",
        likeCount: 8,
        liked: true,
        replies: [
          {
            id: "c2-1",
            user: {
              name: characterName,
              avatar: characterAvatar,
              verified: true,
              verifiedType: "个人认证",
            },
            content: "是呀，美好的事物总是让人心情愉悦 🌸",
            time: "8分钟前",
            likeCount: 3,
            liked: false,
          },
        ],
      },
    ];
  } else if (characterId === "2") {
    baseComments["1"] = [
      {
        id: "c1",
        user: {
          name: "温柔的小星星",
          avatar: "⭐",
          verified: false,
        },
        content: `${characterName}总是这么贴心呢 ✨`,
        time: "5分钟前",
        likeCount: 12,
        liked: false,
      },
    ];
  } else if (characterId === "3") {
    baseComments["1"] = [
      {
        id: "c1",
        user: {
          name: "温柔的小星星",
          avatar: "⭐",
          verified: false,
        },
        content: `${characterName}总是记录着美好的瞬间 ✨`,
        time: "5分钟前",
        likeCount: 12,
        liked: false,
      },
    ];
  }
  return baseComments;
};

export const WeiboHome: FC<WeiboHomeProps> = ({ onBackHome }) => {
  const { aiConfig } = useAiSettings();
  const { config: worldbookConfig } = useWorldbook();

  // 读取角色列表（从微信应用的用户聊天数据）
  const [characters, setCharacters] = useState<Character[]>(() => {
    try {
      const stored = window.localStorage.getItem(USER_CHATS_KEY);
      if (stored) {
        const userChats = JSON.parse(stored) as Array<{
          id: string;
          name: string;
          emoji: string;
        }>;
        return [
          ...defaultCharacters,
          ...userChats.map((chat) => ({
            id: chat.id,
            name: chat.name,
            avatar: chat.emoji,
            emoji: chat.emoji,
          })),
        ];
      }
    } catch {
      // ignore
    }
    return defaultCharacters;
  });

  // 读取选中的角色
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(() => {
    try {
      const stored = window.localStorage.getItem(WEIBO_SELECTED_CHARACTER_KEY);
      return stored || null;
    } catch {
      return null;
    }
  });

  // 读取聊天消息
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (selectedCharacterId) {
      try {
        const stored = window.localStorage.getItem(`${MESSAGES_KEY_PREFIX}${selectedCharacterId}`);
        if (stored) {
          const parsed = JSON.parse(stored) as ChatMessage[];
          return parsed.filter(m => m.content && !m.isVoice && !m.isRedPacket); // 过滤掉语音和红包
        }
      } catch {
        // ignore
      }
    }
    return [];
  });

  // 根据选中的角色生成微博内容和评论（初始化为默认值，在useEffect中异步生成）
  const [posts, setPosts] = useState<WeiboPost[]>(mockPosts);
  const [comments, setComments] = useState<Record<string, Comment[]>>(() => {
    // 为默认微博生成评论
    const defaultComments: Record<string, Comment[]> = {};
    mockPosts.forEach(post => {
      defaultComments[post.id] = generateDefaultComments(post.content, post.id);
    });
    return defaultComments;
  });
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [activeTab, setActiveTab] = useState<WeiboTab>("home");
  const [hotSearches, setHotSearches] = useState<HotSearch[]>(mockHotSearches);
  const [loadingHotSearches, setLoadingHotSearches] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedHotSearch, setSelectedHotSearch] = useState<HotSearch | null>(null);
  const [hotSearchPosts, setHotSearchPosts] = useState<Record<string, WeiboPost[]>>({});
  const [hotSearchComments, setHotSearchComments] = useState<Record<string, Record<string, Comment[]>>>({});
  const [loadingHotSearchPosts, setLoadingHotSearchPosts] = useState(false);

  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<WeiboPost[]>([]);
  const [searchUsers, setSearchUsers] = useState<Array<{
    id: string;
    name: string;
    avatar: string;
    bio: string;
    followers: number;
    following: number;
    posts: number;
    likes: number;
    verified: boolean;
    verifiedType?: string;
    followed: boolean;
  }>>([]);
  const [searchComments, setSearchComments] = useState<Record<string, Comment[]>>({});
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  // 关注列表和粉丝列表（按角色独立保存）
  // 初始化时立即从localStorage加载（如果已有selectedCharacterId）
  const [followingList, setFollowingList] = useState<FollowedUser[]>(() => {
    try {
      const storedCharacterId = window.localStorage.getItem(WEIBO_SELECTED_CHARACTER_KEY);
      if (storedCharacterId) {
        const followingKey = `miniOtomePhone_weibo_followingList_${storedCharacterId}`;
        const stored = window.localStorage.getItem(followingKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log(`✅ 初始化时加载关注列表:`, parsed);
          return parsed;
        }
      }
    } catch (error) {
      console.error("初始化关注列表失败:", error);
    }
    return [];
  });
  const [followersList, setFollowersList] = useState<FollowerUser[]>(() => {
    try {
      const storedCharacterId = window.localStorage.getItem(WEIBO_SELECTED_CHARACTER_KEY);
      if (storedCharacterId) {
        const followersKey = `miniOtomePhone_weibo_followersList_${storedCharacterId}`;
        const stored = window.localStorage.getItem(followersKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log(`✅ 初始化时加载粉丝列表:`, parsed);
          return parsed;
        }
      }
    } catch (error) {
      console.error("初始化粉丝列表失败:", error);
    }
    return [];
  });
  const [showFollowingList, setShowFollowingList] = useState(false);
  const [showFollowersList, setShowFollowersList] = useState(false);
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);
  const [unfollowTarget, setUnfollowTarget] = useState<{ id: string; name: string; avatar: string; verified?: boolean; verifiedType?: string } | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null); // 当前查看的用户ID
  const [viewingUserBio, setViewingUserBio] = useState<string>(""); // 当前查看用户的个人介绍
  const [viewingUserStats, setViewingUserStats] = useState<{ following: number; followers: number; likes: number }>({ following: 0, followers: 0, likes: 0 }); // 当前查看用户的统计数据
  const [loadingUserContent, setLoadingUserContent] = useState(false); // 是否正在生成用户内容
  const [viewingUserFollowingList, setViewingUserFollowingList] = useState<Array<{
    id: string;
    name: string;
    avatar: string;
    bio: string;
    verified?: boolean;
    verifiedType?: string;
    followers: number;
    following: number;
    posts: number;
    likes: number;
  }>>([]); // 当前查看用户的关注列表
  const [loadingUserFollowingList, setLoadingUserFollowingList] = useState(false); // 是否正在生成用户关注列表
  const [showViewingUserFollowingList, setShowViewingUserFollowingList] = useState(false); // 是否显示查看用户的关注列表

  // 获取存储键名（需要在useEffect之前定义）
  const getFollowingListStorageKey = (characterId: string | null) => {
    return characterId ? `miniOtomePhone_weibo_followingList_${characterId}` : null;
  };
  const getFollowersListStorageKey = (characterId: string | null) => {
    return characterId ? `miniOtomePhone_weibo_followersList_${characterId}` : null;
  };

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    // 从localStorage读取用户资料
    try {
      const stored = window.localStorage.getItem("miniOtomePhone_weiboProfile");
      if (stored) {
        const parsed = JSON.parse(stored);
        // 如果获赞数不是0，强制更新为0（修复旧数据）
        if (parsed.likes !== 0) {
          parsed.likes = 0;
        }
        // 确保关注数和粉丝数也正确初始化
        if (parsed.following === undefined) {
          parsed.following = 0;
        }
        if (parsed.followers === undefined) {
          parsed.followers = 0;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return mockUserProfile;
  });

  // 保存用户资料到localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem("miniOtomePhone_weiboProfile", JSON.stringify(userProfile));
    } catch {
      // ignore
    }
  }, [userProfile]);

  // 当角色改变时，加载对应角色的关注列表和粉丝列表
  useEffect(() => {
    if (selectedCharacterId) {
      try {
        const followingKey = getFollowingListStorageKey(selectedCharacterId);
        const followersKey = getFollowersListStorageKey(selectedCharacterId);

        console.log(`加载角色 ${selectedCharacterId} 的关注列表和粉丝列表...`);
        console.log(`关注列表键名: ${followingKey}`);
        console.log(`粉丝列表键名: ${followersKey}`);

        if (followingKey) {
          const storedFollowing = window.localStorage.getItem(followingKey);
          console.log(`关注列表数据:`, storedFollowing);
          if (storedFollowing) {
            try {
              const parsed = JSON.parse(storedFollowing);
              console.log(`✅ 成功加载关注列表，共${parsed.length}个用户:`, parsed);
              setFollowingList(parsed);
            } catch (parseError) {
              console.error("❌ 解析关注列表JSON失败:", parseError);
              // 解析失败时不清空，保持当前状态
            }
          } else {
            console.log(`⚠️ 未找到关注列表数据，保持当前状态（不清空）`);
            // 不要清空，保持当前状态
          }
        }

        if (followersKey) {
          const storedFollowers = window.localStorage.getItem(followersKey);
          console.log(`粉丝列表数据:`, storedFollowers);
          if (storedFollowers) {
            try {
              const parsed = JSON.parse(storedFollowers);
              console.log(`✅ 成功加载粉丝列表，共${parsed.length}个用户:`, parsed);
              setFollowersList(parsed);
            } catch (parseError) {
              console.error("❌ 解析粉丝列表JSON失败:", parseError);
              // 解析失败时不清空，保持当前状态
            }
          } else {
            console.log(`⚠️ 未找到粉丝列表数据，保持当前状态（不清空）`);
            // 不要清空，保持当前状态
          }
        }
      } catch (error) {
        console.error("❌ 加载关注列表和粉丝列表失败:", error);
        // 出错时也不清空，保持当前状态
      }
    }
    // 注意：如果没有选择角色，不清空列表，保持当前状态
    // 这样可以避免在角色选择页面时清空已加载的数据
  }, [selectedCharacterId]);

  // 保存关注列表到localStorage（按角色独立保存），并更新用户资料
  useEffect(() => {
    if (selectedCharacterId && followingList) {
      try {
        const followingKey = getFollowingListStorageKey(selectedCharacterId);
        if (followingKey) {
          const dataToSave = JSON.stringify(followingList);
          window.localStorage.setItem(followingKey, dataToSave);
          // 更新用户资料中的关注数
          setUserProfile(prev => ({ ...prev, following: followingList.length }));
          console.log(`💾 关注列表已保存到 ${followingKey}，当前关注数: ${followingList.length}`);

          // 验证保存是否成功
          const verify = window.localStorage.getItem(followingKey);
          if (verify) {
            console.log(`✅ 验证：关注列表保存成功`);
          } else {
            console.error(`❌ 验证失败：关注列表保存后无法读取！`);
          }
        }
      } catch (error) {
        console.error("❌ 保存关注列表失败:", error);
      }
    }
  }, [followingList, selectedCharacterId]);

  // 保存粉丝列表到localStorage（按角色独立保存），并更新用户资料
  useEffect(() => {
    if (selectedCharacterId && followersList) {
      try {
        const followersKey = getFollowersListStorageKey(selectedCharacterId);
        if (followersKey) {
          const dataToSave = JSON.stringify(followersList);
          window.localStorage.setItem(followersKey, dataToSave);
          // 更新用户资料中的粉丝数
          setUserProfile(prev => ({ ...prev, followers: followersList.length }));
          console.log(`💾 粉丝列表已保存到 ${followersKey}，当前粉丝数: ${followersList.length}，数据:`, followersList);

          // 验证保存是否成功
          const verify = window.localStorage.getItem(followersKey);
          if (verify) {
            console.log(`✅ 验证：粉丝列表保存成功，数据长度: ${verify.length} 字符`);
          } else {
            console.error(`❌ 验证失败：粉丝列表保存后无法读取！`);
          }
        }
      } catch (error) {
        console.error("❌ 保存粉丝列表失败:", error);
      }
    }
  }, [followersList, selectedCharacterId]);

  // 处理关注/取消关注
  const handleFollow = (userId: string, userName: string, userAvatar: string, verified?: boolean, verifiedType?: string, userBio?: string, userPersona?: string, userStats?: { following: number; followers: number; likes: number; posts: number }) => {
    // 检查是否已经在关注列表中
    const isFollowing = followingList.some(user => user.id === userId);

    if (isFollowing) {
      // 显示确认弹窗
      setUnfollowTarget({ id: userId, name: userName, avatar: userAvatar, verified, verifiedType });
      setShowUnfollowConfirm(true);
    } else {
      // 添加关注
      const newUser: FollowedUser = {
        id: userId,
        name: userName,
        avatar: userAvatar,
        verified,
        verifiedType,
        bio: userBio,
        persona: userPersona,
        stats: userStats
      };
      setFollowingList(prev => [...prev, newUser]);

      // 保存用户完整信息到localStorage（如果提供了完整信息）
      if (userBio || userPersona || userStats) {
        const userProfile: WeiboUserProfile = {
          id: userId,
          name: userName,
          avatar: userAvatar,
          bio: userBio || "",
          persona: userPersona || "",
          stats: userStats || { following: 0, followers: 0, likes: 0, posts: 0 },
          verified,
          verifiedType,
          createdAt: Date.now(),
          lastUpdated: Date.now()
        };
        saveUserProfile(userProfile);
      }

      // 如果该用户也在粉丝列表中，更新为互相关注
      setFollowersList(prev => prev.map(user =>
        user.id === userId ? { ...user, isFollowingMe: true } : user
      ));
    }
  };

  // 确认取消关注
  const handleConfirmUnfollow = () => {
    if (unfollowTarget) {
      // 取消关注
      setFollowingList(prev => prev.filter(user => user.id !== unfollowTarget.id));
      // 如果该用户也在粉丝列表中，更新互相关注状态
      setFollowersList(prev => prev.map(user =>
        user.id === unfollowTarget.id ? { ...user, isFollowingMe: false } : user
      ));
      setShowUnfollowConfirm(false);
      setUnfollowTarget(null);
    }
  };

  // 处理回关（关注粉丝）
  const handleFollowBack = (userId: string, userName: string, userAvatar: string, verified?: boolean, verifiedType?: string) => {
    // 添加到关注列表
    const newUser: FollowedUser = {
      id: userId,
      name: userName,
      avatar: userAvatar,
      verified,
      verifiedType
    };
    setFollowingList(prev => {
      // 检查是否已存在
      if (prev.some(user => user.id === userId)) {
        return prev;
      }
      return [...prev, newUser];
    });
    // 更新粉丝列表中的互相关注状态
    setFollowersList(prev => prev.map(user =>
      user.id === userId ? { ...user, isFollowingMe: true } : user
    ));
  };

  // 检查是否互相关注
  const isMutualFollow = (userId: string): boolean => {
    const isFollowing = followingList.some(user => user.id === userId);
    const isFollower = followersList.some(user => user.id === userId && user.isFollowingMe);
    return isFollowing && isFollower;
  };

  // 获取当前选中的角色信息
  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

  // 获取存储键名
  const getStorageKey = (characterId: string | null) => {
    return characterId ? `miniOtomePhone_weibo_posts_${characterId}` : null;
  };
  const getCommentsStorageKey = (characterId: string | null) => {
    return characterId ? `miniOtomePhone_weibo_comments_${characterId}` : null;
  };
  const getHotSearchesStorageKey = (characterId: string | null) => {
    return characterId ? `miniOtomePhone_weibo_hotSearches_${characterId}` : null;
  };

  // 当角色改变时，读取聊天消息
  useEffect(() => {
    if (selectedCharacterId) {
      try {
        const stored = window.localStorage.getItem(`${MESSAGES_KEY_PREFIX}${selectedCharacterId}`);
        if (stored) {
          const parsed = JSON.parse(stored) as ChatMessage[];
          const filtered = parsed.filter(m => m.content && !m.isVoice && !m.isRedPacket);
          setChatMessages(filtered);
        } else {
          setChatMessages([]);
        }
      } catch {
        setChatMessages([]);
      }
    }
  }, [selectedCharacterId]);

  // 读取当前查看用户的关注列表（从localStorage）- 必须在组件顶层调用
  useEffect(() => {
    if (viewingUserId) {
      const savedFollowingList = getUserFollowingList(viewingUserId);
      if (savedFollowingList && savedFollowingList.length > 0) {
        setViewingUserFollowingList(savedFollowingList);
        console.log(`[用户主页] 从localStorage读取到用户"${viewingUserId}"的关注列表，共${savedFollowingList.length}个用户`);
      } else {
        setViewingUserFollowingList([]);
        console.log(`[用户主页] 用户"${viewingUserId}"还没有关注列表`);
      }
    } else {
      setViewingUserFollowingList([]);
    }
  }, [viewingUserId]);

  // 定期更新动态数据（每5分钟更新一次）
  useEffect(() => {
    const interval = setInterval(() => {
      setPosts(prevPosts => {
        return prevPosts.map(post => {
          // 计算动态互动数据
          let currentRepostCount = post.repostCount;
          let currentCommentCount = post.commentCount;
          let currentLikeCount = post.likeCount;

          if (post.createdAt) {
            currentRepostCount = calculateDynamicEngagement(
              post.initialRepostCount || post.repostCount,
              post.createdAt,
              "repost"
            );
            currentCommentCount = calculateDynamicEngagement(
              post.initialCommentCount || post.commentCount,
              post.createdAt,
              "comment"
            );
            currentLikeCount = calculateDynamicEngagement(
              post.initialLikeCount || post.likeCount,
              post.createdAt,
              "like"
            );
          }

          return {
            ...post,
            repostCount: currentRepostCount,
            commentCount: currentCommentCount,
            likeCount: currentLikeCount,
          };
        });
      });
    }, 5 * 60 * 1000); // 每5分钟更新一次

    return () => clearInterval(interval);
  }, []);

  // 手动生成微博内容和热搜
  const handleGenerateContent = async () => {
    if (!selectedCharacterId || !selectedCharacter) return;

    if (aiConfig.baseUrl && aiConfig.apiKey && aiConfig.model) {
      setLoadingPosts(true);
      setLoadingHotSearches(true);

      // 读取微博相关的世界书内容
      const weiboWorldbooks = worldbookConfig?.perApp?.weibo || [];
      const enabledWorldbookItems = weiboWorldbooks.flatMap((wb: any) =>
        wb.entries.filter((item: any) => item.enabled).map((item: any) => `${item.title}: ${item.content}`)
      );
      const worldbookContent = enabledWorldbookItems.join("\n\n");

      // 使用AI智能提取NPC信息（用于头像分配）
      console.log("开始使用AI分析世界书条目，提取NPC角色信息...");
      const npcs = await extractNPCsFromWorldbookWithAI(aiConfig, worldbookConfig);
      console.log(`从世界书提取的NPC列表（用于头像分配）:`, npcs);

      // 并行生成微博内容和热搜
      Promise.all([
        generateCharacterPosts(aiConfig, selectedCharacterId, selectedCharacter.name, selectedCharacter.avatar, chatMessages, worldbookContent),
        generateHotSearchesWithAI(aiConfig, chatMessages, selectedCharacter.name, worldbookContent)
      ])
        .then(async ([postsResult, hotSearchesResult]) => {

          // 处理首页微博的NPC头像分配
          const processedPosts = postsResult.posts.map(post => {
            const npcInfo = npcs.find(npc => {
              const npcNameLower = npc.name.toLowerCase().trim();
              const userNameLower = post.user.name.toLowerCase().trim();
              return npcNameLower === userNameLower ||
                userNameLower.includes(npcNameLower) ||
                npcNameLower.includes(userNameLower);
            });

            if (npcInfo) {
              const npcGender = npcInfo.gender || "unknown";
              const npcAvatar = getNPCAvatar(npcGender, post.user.name);
              console.log(`✅ 首页微博发布者"${post.user.name}"是NPC角色（匹配到"${npcInfo.name}"），性别: ${npcGender}，使用NPC头像: ${npcAvatar}`);
              return {
                ...post,
                user: {
                  ...post.user,
                  avatar: npcAvatar
                }
              };
            }
            return post;
          });

          // 处理首页评论的NPC头像分配
          const processedComments: Record<string, Comment[]> = {};
          Object.keys(postsResult.comments).forEach(postId => {
            processedComments[postId] = postsResult.comments[postId].map(comment => {
              const npcInfo = npcs.find(npc => {
                const npcNameLower = npc.name.toLowerCase().trim();
                const userNameLower = comment.user.name.toLowerCase().trim();
                return npcNameLower === userNameLower ||
                  userNameLower.includes(npcNameLower) ||
                  npcNameLower.includes(userNameLower);
              });

              if (npcInfo) {
                const npcGender = npcInfo.gender || "unknown";
                const npcAvatar = getNPCAvatar(npcGender, comment.user.name);
                console.log(`✅ 首页评论者"${comment.user.name}"是NPC角色（匹配到"${npcInfo.name}"），性别: ${npcGender}，使用NPC头像: ${npcAvatar}`);
                return {
                  ...comment,
                  user: {
                    ...comment.user,
                    avatar: npcAvatar
                  }
                };
              }
              return comment;
            });
          });

          // 读取已保存的微博内容（追加模式）
          const storageKey = getStorageKey(selectedCharacterId);
          const commentsStorageKey = getCommentsStorageKey(selectedCharacterId);
          let existingPosts: WeiboPost[] = [];
          let existingComments: Record<string, Comment[]> = {};

          if (storageKey) {
            try {
              const stored = window.localStorage.getItem(storageKey);
              if (stored) {
                existingPosts = JSON.parse(stored) as WeiboPost[];
                console.log(`[handleGenerateContent] 读取到${existingPosts.length}条已保存的微博`);
              }
            } catch (error) {
              console.error("读取已保存的微博失败:", error);
            }
          }

          if (commentsStorageKey) {
            try {
              const stored = window.localStorage.getItem(commentsStorageKey);
              if (stored) {
                existingComments = JSON.parse(stored) as Record<string, Comment[]>;
                console.log(`[handleGenerateContent] 读取到${Object.keys(existingComments).length}条微博的评论`);
              }
            } catch (error) {
              console.error("读取已保存的评论失败:", error);
            }
          }

          // 为新生成的微博添加时间戳和初始数据
          const now = Date.now();
          const newPostsWithMetadata = processedPosts.map(post => {
            // 确定账号类型（根据认证状态和粉丝数）
            let accountType: "celebrity" | "marketing" | "normal" = "normal";
            if (post.user.verified) {
              // 认证账号可能是明星或营销号
              accountType = Math.random() > 0.5 ? "celebrity" : "marketing";
            }

            // 设置初始粉丝数（根据账号类型）
            let initialFollowers = 0;
            switch (accountType) {
              case "celebrity":
                initialFollowers = Math.floor(Math.random() * 500000) + 100000; // 10万-60万
                break;
              case "marketing":
                initialFollowers = Math.floor(Math.random() * 50000) + 10000; // 1万-6万
                break;
              case "normal":
              default:
                initialFollowers = Math.floor(Math.random() * 5000) + 100; // 100-5100
                break;
            }

            // 设置初始互动数据
            const initialRepostCount = Math.floor(Math.random() * 20) + 5;
            const initialCommentCount = Math.floor(Math.random() * 30) + 10;
            const initialLikeCount = Math.floor(Math.random() * 100) + 20;

            return {
              ...post,
              createdAt: now,
              initialRepostCount,
              initialCommentCount,
              initialLikeCount,
              user: {
                ...post.user,
                accountType,
                initialFollowers,
                createdAt: now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // 随机创建时间（0-30天前）
              }
            };
          });

          // 合并新旧微博（新微博在前）
          const allPosts = [...newPostsWithMetadata, ...existingPosts];
          const allComments = { ...existingComments, ...processedComments };

          // 应用动态增长到所有微博
          const postsWithDynamicData = allPosts.map(post => {
            // 计算动态互动数据
            let currentRepostCount = post.repostCount;
            let currentCommentCount = post.commentCount;
            let currentLikeCount = post.likeCount;

            if (post.createdAt) {
              currentRepostCount = calculateDynamicEngagement(
                post.initialRepostCount || post.repostCount,
                post.createdAt,
                "repost"
              );
              currentCommentCount = calculateDynamicEngagement(
                post.initialCommentCount || post.commentCount,
                post.createdAt,
                "comment"
              );
              currentLikeCount = calculateDynamicEngagement(
                post.initialLikeCount || post.likeCount,
                post.createdAt,
                "like"
              );
            }

            return {
              ...post,
              repostCount: currentRepostCount,
              commentCount: currentCommentCount,
              likeCount: currentLikeCount,
            };
          });

          setPosts(postsWithDynamicData);
          setComments(allComments);
          setHotSearches(hotSearchesResult);

          // 保存到localStorage
          if (storageKey) {
            try {
              window.localStorage.setItem(storageKey, JSON.stringify(allPosts));
              console.log(`[handleGenerateContent] 已保存${allPosts.length}条微博到localStorage`);
            } catch (error) {
              console.error("保存微博失败:", error);
            }
          }

          if (commentsStorageKey) {
            try {
              window.localStorage.setItem(commentsStorageKey, JSON.stringify(allComments));
              console.log(`[handleGenerateContent] 已保存${Object.keys(allComments).length}条微博的评论到localStorage`);
            } catch (error) {
              console.error("保存评论失败:", error);
            }
          }

          // 一次性生成所有热搜详情页的微博内容和评论（并行生成以提高速度）
          const allHotSearchPosts: Record<string, WeiboPost[]> = {};
          const allHotSearchComments: Record<string, Record<string, Comment[]>> = {};

          // 生成评论者昵称池（所有热搜共用）
          let commentNicknames: string[] = [];
          try {
            commentNicknames = await generateNicknamesWithAI(aiConfig, 30);
          } catch (error) {
            console.error("生成评论昵称失败，使用默认昵称:", error);
            commentNicknames = generateDefaultNicknames(30);
          }

          // 并行生成所有热搜的内容（使用Promise.all加速）
          console.log(`开始并行生成${hotSearchesResult.length}个热搜的详情页内容...`);
          const hotSearchPromises = hotSearchesResult.map(async (hotSearch) => {
            try {
              console.log(`[${hotSearch.id}] 开始生成热搜"${hotSearch.keyword}"的微博内容...`);

              let postData: Array<{ content: string; userName: string; avatar: string }> = [];
              let retryCount = 0;
              const maxRetries = 2;

              // 重试机制：如果生成失败，重试最多2次
              while (retryCount < maxRetries && postData.length === 0) {
                try {
                  postData = await generatePostsByHotSearch(aiConfig, hotSearch.keyword, chatMessages, selectedCharacter?.name || "", worldbookContent);
                  if (postData && postData.length > 0) {
                    console.log(`[${hotSearch.id}] ✅ AI返回了${postData.length}条微博数据`);
                    break; // 成功生成，退出循环
                  } else {
                    console.warn(`[${hotSearch.id}] ⚠️ AI返回了空数据，重试中... (${retryCount + 1}/${maxRetries})`);
                  }
                } catch (error) {
                  retryCount++;
                  console.error(`[${hotSearch.id}] ❌ 生成失败 (尝试 ${retryCount}/${maxRetries}):`, error);
                  if (retryCount >= maxRetries) {
                    throw error; // 所有重试都失败，抛出错误
                  }
                  // 等待一段时间后重试
                  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
              }

              if (!postData || postData.length === 0) {
                console.error(`[${hotSearch.id}] ❌ 热搜"${hotSearch.keyword}"的微博内容生成失败，所有重试都失败`);
                throw new Error(`无法为热搜"${hotSearch.keyword}"生成微博内容`);
              }

              const generatedPosts: WeiboPost[] = [];

              // 先创建所有微博（不生成评论），并分配NPC头像
              for (let index = 0; index < postData.length; index++) {
                const data = postData[index];
                if (!data || !data.content) {
                  console.warn(`热搜"${hotSearch.keyword}"的第${index + 1}条微博内容为空，跳过`);
                  continue;
                }

                // 检查发布者是否是NPC角色
                const npcInfo = npcs.find(npc => {
                  const npcNameLower = npc.name.toLowerCase().trim();
                  const userNameLower = (data.userName || "").toLowerCase().trim();
                  return npcNameLower === userNameLower ||
                    userNameLower.includes(npcNameLower) ||
                    npcNameLower.includes(userNameLower);
                });

                let avatar = data.avatar || getAvatarByIndex(index + 200);

                // 如果是NPC角色，使用NPC头像（根据性别）
                if (npcInfo) {
                  const npcGender = npcInfo.gender || "unknown";
                  avatar = getNPCAvatar(npcGender, data.userName || "");
                  console.log(`✅ 热搜微博发布者"${data.userName}"是NPC角色（匹配到"${npcInfo.name}"），性别: ${npcGender}，使用NPC头像: ${avatar}`);
                } else {
                  // 如果不是NPC，确保使用普通网友头像
                  if (!avatar || !avatar.startsWith('/weibo-avatar/')) {
                    avatar = getAvatarByIndex(index + 200);
                    console.log(`📝 热搜微博发布者"${data.userName}"是普通网友，使用普通头像: ${avatar}`);
                  }
                }

                const postId = `hot-${hotSearch.id}-${index}`;
                generatedPosts.push({
                  id: postId,
                  user: {
                    name: data.userName || generateDefaultNicknames(1)[0],
                    avatar: avatar,
                    verified: Math.random() > 0.7,
                    verifiedType: Math.random() > 0.7 ? "个人认证" : undefined,
                  },
                  content: data.content,
                  images: [],
                  time: `${(index + 1) * 3}分钟前`,
                  source: ["iPhone客户端", "微博客户端", "Android客户端"][index % 3],
                  repostCount: Math.floor(Math.random() * 20) + 5,
                  commentCount: Math.floor(Math.random() * 30) + 10,
                  likeCount: Math.floor(Math.random() * 100) + 20,
                  liked: Math.random() > 0.7,
                });
              }

              // 并行生成所有微博的评论（强制使用AI生成）
              console.log(`[${hotSearch.id}] 开始为${generatedPosts.length}条微博生成评论...`);
              const commentPromises = generatedPosts.map(async (post, postIndex) => {
                try {
                  console.log(`[${hotSearch.id}] 为微博${post.id}生成评论...`);
                  const comments = await generateCommentsWithAI(aiConfig, post.content, post.id, postIndex * 10 + 300, commentNicknames, chatMessages, selectedCharacter?.name || "", worldbookContent);
                  if (comments && comments.length > 0) {
                    console.log(`[${hotSearch.id}] ✅ 为微博${post.id}成功生成${comments.length}条评论`);
                    return { postId: post.id, comments };
                  } else {
                    console.warn(`[${hotSearch.id}] ⚠️ 为微博${post.id}生成的评论为空，重试...`);
                    // 如果返回空，再试一次（只试一次）
                    const retryComments = await generateCommentsWithAI(aiConfig, post.content, post.id, postIndex * 10 + 300, commentNicknames, chatMessages, selectedCharacter?.name || "", worldbookContent);
                    if (retryComments && retryComments.length > 0) {
                      console.log(`[${hotSearch.id}] ✅ 重试成功，为微博${post.id}生成${retryComments.length}条评论`);
                      return { postId: post.id, comments: retryComments };
                    } else {
                      throw new Error(`重试后仍无法生成评论`);
                    }
                  }
                } catch (commentError) {
                  console.error(`[${hotSearch.id}] ❌ 生成微博${post.id}的评论失败:`, commentError);
                  // 如果失败，再试一次（只试一次）
                  try {
                    console.log(`[${hotSearch.id}] 重试生成微博${post.id}的评论...`);
                    const retryComments = await generateCommentsWithAI(aiConfig, post.content, post.id, postIndex * 10 + 300, commentNicknames, chatMessages, selectedCharacter?.name || "", worldbookContent);
                    if (retryComments && retryComments.length > 0) {
                      console.log(`[${hotSearch.id}] ✅ 重试成功，为微博${post.id}生成${retryComments.length}条评论`);
                      return { postId: post.id, comments: retryComments };
                    } else {
                      throw new Error(`重试后仍无法生成评论`);
                    }
                  } catch (retryError) {
                    console.error(`[${hotSearch.id}] ❌ 重试生成评论仍然失败:`, retryError);
                    // 如果所有重试都失败，抛出错误而不是返回空数组
                    throw new Error(`无法为微博${post.id}生成评论: ${retryError}`);
                  }
                }
              });

              const commentResults = await Promise.all(commentPromises);
              const generatedComments: Record<string, Comment[]> = {};
              commentResults.forEach(({ postId, comments }) => {
                if (comments && comments.length > 0) {
                  generatedComments[postId] = comments;
                }
              });

              console.log(`[${hotSearch.id}] ✅ 成功生成热搜"${hotSearch.keyword}"的${generatedPosts.length}条微博和${Object.keys(generatedComments).length}条评论记录`);
              if (generatedPosts.length === 0) {
                console.warn(`[${hotSearch.id}] ⚠️ 热搜"${hotSearch.keyword}"生成了0条微博，可能有问题`);
              }
              if (Object.keys(generatedComments).length === 0) {
                console.warn(`[${hotSearch.id}] ⚠️ 热搜"${hotSearch.keyword}"生成了0条评论记录，可能有问题`);
              }
              return { hotSearchId: hotSearch.id, posts: generatedPosts, comments: generatedComments };
            } catch (error) {
              console.error(`[${hotSearch.id}] ❌ 生成热搜"${hotSearch.keyword}"的内容失败:`, error);
              console.error(`[${hotSearch.id}] 错误详情:`, error);
              // 如果生成失败，抛出错误让外层处理，而不是静默返回空数组
              // 这样用户可以看到错误信息
              throw new Error(`无法生成热搜"${hotSearch.keyword}"的内容: ${error}`);
            }
          });

          // 等待所有热搜内容生成完成（使用allSettled而不是all，这样即使某个失败也不会阻塞其他的）
          console.log(`等待所有热搜内容生成完成...`);
          const hotSearchResults = await Promise.allSettled(hotSearchPromises);

          // 处理结果
          const settledResults = hotSearchResults.map((result, index) => {
            if (result.status === 'fulfilled') {
              return result.value;
            } else {
              console.error(`热搜${hotSearchesResult[index].id}生成失败:`, result.reason);
              // 返回空结果，不阻塞其他热搜
              return { hotSearchId: hotSearchesResult[index].id, posts: [], comments: {} };
            }
          });

          console.log(`✅ 所有热搜内容生成完成，共${settledResults.length}个热搜`);

          let successCount = 0;
          settledResults.forEach(({ hotSearchId, posts, comments }: { hotSearchId: string; posts: WeiboPost[]; comments: Record<string, Comment[]> }) => {
            if (posts.length > 0) {
              allHotSearchPosts[hotSearchId] = posts;
              allHotSearchComments[hotSearchId] = comments;
              successCount++;
              console.log(`✅ 热搜ID ${hotSearchId}: 保存了${posts.length}条微博和${Object.keys(comments).length}条评论记录`);
            } else {
              console.warn(`❌ 热搜ID ${hotSearchId}: 没有生成任何内容`);
            }
          });

          console.log(`📊 生成统计: ${successCount}/${settledResults.length}个热搜成功生成内容`);
          console.log(`准备保存热搜详情页内容，共${Object.keys(allHotSearchPosts).length}个热搜有内容`);

          // 保存所有热搜详情页的内容到localStorage
          try {
            const hotSearchPostsKey = `miniOtomePhone_weibo_hotSearchPosts_${selectedCharacterId}`;
            const hotSearchCommentsKey = `miniOtomePhone_weibo_hotSearchComments_${selectedCharacterId}`;

            const postsJson = JSON.stringify(allHotSearchPosts);
            const commentsJson = JSON.stringify(allHotSearchComments);

            window.localStorage.setItem(hotSearchPostsKey, postsJson);
            window.localStorage.setItem(hotSearchCommentsKey, commentsJson);

            console.log(`✅ 成功保存热搜详情页内容到localStorage`);
            console.log(`保存的热搜IDs:`, Object.keys(allHotSearchPosts));
            console.log(`每个热搜的微博数量:`, Object.keys(allHotSearchPosts).map(id => ({ id, count: allHotSearchPosts[id].length })));

            // 立即更新状态，确保内容可用（使用展开运算符创建新对象，确保React检测到变化）
            console.log(`立即更新状态，设置hotSearchPosts和hotSearchComments`);
            const newHotSearchPosts = { ...allHotSearchPosts };
            const newHotSearchComments = { ...allHotSearchComments };
            setHotSearchPosts(newHotSearchPosts);
            setHotSearchComments(newHotSearchComments);

            // 验证状态是否更新成功
            setTimeout(() => {
              console.log(`状态更新后的hotSearchPosts keys:`, Object.keys(newHotSearchPosts));
              console.log(`状态更新后的hotSearchComments keys:`, Object.keys(newHotSearchComments));
            }, 100);
          } catch (error) {
            console.error("❌ 保存热搜详情页内容失败:", error);
          }

          setLoadingPosts(false);
          setLoadingHotSearches(false);

          // 持久化保存
          try {
            const postsKey = getStorageKey(selectedCharacterId);
            const commentsKey = getCommentsStorageKey(selectedCharacterId);
            const hotSearchesKey = getHotSearchesStorageKey(selectedCharacterId);
            if (postsKey) window.localStorage.setItem(postsKey, JSON.stringify(postsResult.posts));
            if (commentsKey) window.localStorage.setItem(commentsKey, JSON.stringify(postsResult.comments));
            if (hotSearchesKey) window.localStorage.setItem(hotSearchesKey, JSON.stringify(hotSearchesResult));
          } catch (error) {
            console.error("保存内容失败:", error);
          }
        })
        .catch(error => {
          console.error("生成内容失败:", error);
          // 如果AI生成失败，显示错误提示，不使用默认内容
          alert(`生成内容失败: ${error.message || error}\n请检查AI配置或稍后重试。`);
          setPosts([]);
          setComments({});
          setHotSearches([]);
          setLoadingPosts(false);
          setLoadingHotSearches(false);
        });
    } else {
      // 如果没有AI配置，使用默认内容
      const defaultPosts = generateDefaultPosts(selectedCharacter.name, selectedCharacter.avatar);
      const defaultComments: Record<string, Comment[]> = {};
      defaultPosts.forEach(post => {
        defaultComments[post.id] = generateDefaultComments(post.content, post.id);
      });
      setPosts(defaultPosts);
      setComments(defaultComments);
      setHotSearches(mockHotSearches);
    }
  };

  // 当角色改变时，从localStorage读取保存的内容
  useEffect(() => {
    if (selectedCharacterId) {
      try {
        const postsKey = getStorageKey(selectedCharacterId);
        const commentsKey = getCommentsStorageKey(selectedCharacterId);
        const hotSearchesKey = getHotSearchesStorageKey(selectedCharacterId);
        const hotSearchPostsKey = `miniOtomePhone_weibo_hotSearchPosts_${selectedCharacterId}`;
        const hotSearchCommentsKey = `miniOtomePhone_weibo_hotSearchComments_${selectedCharacterId}`;

        if (postsKey) {
          const postsStored = window.localStorage.getItem(postsKey);
          if (postsStored) {
            setPosts(JSON.parse(postsStored) as WeiboPost[]);
          }
        }
        if (commentsKey) {
          const commentsStored = window.localStorage.getItem(commentsKey);
          if (commentsStored) {
            setComments(JSON.parse(commentsStored) as Record<string, Comment[]>);
          }
        }
        if (hotSearchesKey) {
          const hotSearchesStored = window.localStorage.getItem(hotSearchesKey);
          if (hotSearchesStored) {
            setHotSearches(JSON.parse(hotSearchesStored) as HotSearch[]);
          }
        }
        // 读取热搜详情页内容
        const hotSearchPostsStored = window.localStorage.getItem(hotSearchPostsKey);
        const hotSearchCommentsStored = window.localStorage.getItem(hotSearchCommentsKey);
        if (hotSearchPostsStored && hotSearchCommentsStored) {
          setHotSearchPosts(JSON.parse(hotSearchPostsStored) as Record<string, WeiboPost[]>);
          setHotSearchComments(JSON.parse(hotSearchCommentsStored) as Record<string, Record<string, Comment[]>>);
        }
      } catch {
        // ignore
      }
    }
  }, [selectedCharacterId]);

  // 当选中热搜时，从已生成的内容中读取（必须在早期返回之前）
  // 注意：这个useEffect已经被handleGenerateContent中的一次性生成逻辑替代
  // 保留此逻辑仅作为备用，如果localStorage中没有内容时才生成
  useEffect(() => {
    if (selectedHotSearch && selectedCharacterId) {
      // 先检查localStorage中是否已有内容
      const hotSearchPostsKey = `miniOtomePhone_weibo_hotSearchPosts_${selectedCharacterId}`;
      const hotSearchCommentsKey = `miniOtomePhone_weibo_hotSearchComments_${selectedCharacterId}`;
      const storedPosts = window.localStorage.getItem(hotSearchPostsKey);
      const storedComments = window.localStorage.getItem(hotSearchCommentsKey);

      if (storedPosts && storedComments) {
        const allHotSearchPosts = JSON.parse(storedPosts) as Record<string, WeiboPost[]>;
        const allHotSearchComments = JSON.parse(storedComments) as Record<string, Record<string, Comment[]>>;

        // 如果已有内容，直接使用，不重新生成
        if (allHotSearchPosts[selectedHotSearch.id] && allHotSearchPosts[selectedHotSearch.id].length > 0) {
          console.log(`从localStorage读取热搜"${selectedHotSearch.keyword}"的内容`);
          setHotSearchPosts(allHotSearchPosts);
          setHotSearchComments(allHotSearchComments);
          return; // 直接返回，不执行下面的生成逻辑
        }
      }

      // 如果没有内容，提示用户先点击生成按钮
      console.warn(`localStorage中没有热搜"${selectedHotSearch.keyword}"的内容，请先点击生成按钮生成内容`);
      setHotSearchPosts({} as Record<string, WeiboPost[]>);
      setHotSearchComments({} as Record<string, Record<string, Comment[]>>);
    }
  }, [selectedHotSearch, selectedCharacterId]);

  // 处理搜索
  const handleSearch = async (keyword: string) => {
    if (!selectedCharacterId || !selectedCharacter) {
      alert("请先选择角色！");
      return;
    }

    // 使用辅助函数提取完整的世界书内容（包括全局和微博应用特定的）
    const worldbookContent = extractWorldbookContent(worldbookConfig);
    console.log(`[handleSearch] 提取的世界书内容长度: ${worldbookContent.length} 字符`);

    if (!aiConfig.baseUrl || !aiConfig.apiKey || !aiConfig.model) {
      alert("请先配置AI设置！");
      return;
    }

    setLoadingSearch(true);
    setShowSearchResults(true);

    try {
      console.log(`开始为搜索"${keyword}"生成内容...`);

      // 生成搜索结果（传入角色名和聊天记录，使用完整的世界书内容）
      const searchData = await generateSearchResults(aiConfig, keyword, selectedCharacter.name, chatMessages, worldbookContent);

      // 生成评论者昵称池
      let commentNicknames: string[] = [];
      try {
        commentNicknames = await generateNicknamesWithAI(aiConfig, 20);
      } catch (error) {
        console.error("生成评论昵称失败，使用默认昵称:", error);
        commentNicknames = generateDefaultNicknames(20);
      }

      // 使用AI智能提取NPC信息（在生成posts和users之前）
      console.log("开始使用AI分析世界书条目，提取NPC角色信息...");
      const npcs = await extractNPCsFromWorldbookWithAI(aiConfig, worldbookConfig);
      console.log(`从世界书提取的NPC列表:`, npcs);

      // 转换为WeiboPost格式（确保头像路径正确）
      const generatedPosts: WeiboPost[] = searchData.posts.map((data: { content: string; userName: string; avatar: string }, index: number) => {
        // 检查发布者是否是NPC角色（更精准的匹配）
        const npcInfo = npcs.find(npc => {
          const npcNameLower = npc.name.toLowerCase().trim();
          const userNameLower = data.userName.toLowerCase().trim();
          // 精确匹配或包含匹配
          return npcNameLower === userNameLower ||
            userNameLower.includes(npcNameLower) ||
            npcNameLower.includes(userNameLower);
        });

        let avatar = data.avatar;

        // 如果是NPC角色，使用NPC头像（根据性别），并覆盖AI生成的头像
        if (npcInfo) {
          const npcGender = npcInfo.gender || "unknown";
          avatar = getNPCAvatar(npcGender, data.userName);
          console.log(`✅ 微博发布者"${data.userName}"是NPC角色（匹配到"${npcInfo.name}"），性别: ${npcGender}，使用NPC头像: ${avatar}`);
        }
        // 如果不是NPC，确保使用普通网友头像（weibo-avatar文件夹）
        else {
          // 如果头像路径不是weibo-avatar，或者无效，使用默认普通头像
          if (!avatar || typeof avatar !== 'string' || !avatar.startsWith('/weibo-avatar/')) {
            avatar = getAvatarByIndex(index + 300);
            console.log(`📝 微博发布者"${data.userName}"是普通网友，使用普通头像: ${avatar}`);
          } else {
            console.log(`📝 微博发布者"${data.userName}"是普通网友，使用AI生成的头像: ${avatar}`);
          }
        }

        return {
          id: `search-${keyword}-${index}`,
          user: {
            name: data.userName,
            avatar: avatar,
            verified: Math.random() > 0.7,
            verifiedType: Math.random() > 0.7 ? "个人认证" : undefined,
          },
          content: data.content,
          images: [],
          time: `${(index + 1) * 3}分钟前`,
          source: ["iPhone客户端", "微博客户端", "Android客户端"][index % 3],
          repostCount: Math.floor(Math.random() * 20) + 5,
          commentCount: Math.floor(Math.random() * 30) + 10,
          likeCount: Math.floor(Math.random() * 100) + 20,
          liked: Math.random() > 0.7,
        };
      });

      // 转换为用户格式（确保头像路径正确）
      let generatedUsers = searchData.users.map((user: { name: string; avatar: string; bio: string; followers: number; following: number; posts: number; verified: boolean; verifiedType?: string }, index: number) => {
        // 检查用户是否是NPC角色（更精准的匹配）
        const npcInfo = npcs.find(npc => {
          const npcNameLower = npc.name.toLowerCase().trim();
          const userNameLower = user.name.toLowerCase().trim();
          // 精确匹配或包含匹配
          return npcNameLower === userNameLower ||
            userNameLower.includes(npcNameLower) ||
            npcNameLower.includes(userNameLower);
        });

        let avatar = user.avatar;

        // 如果是NPC角色，使用NPC头像（根据性别），并覆盖AI生成的头像
        if (npcInfo) {
          const npcGender = npcInfo.gender || "unknown";
          avatar = getNPCAvatar(npcGender, user.name);
          console.log(`✅ 用户"${user.name}"是NPC角色（匹配到"${npcInfo.name}"），性别: ${npcGender}，使用NPC头像: ${avatar}`);
        }
        // 如果不是NPC，确保使用普通网友头像（weibo-avatar文件夹）
        else {
          // 如果头像路径不是weibo-avatar，或者无效，使用默认普通头像
          if (!avatar || typeof avatar !== 'string' || !avatar.startsWith('/weibo-avatar/')) {
            avatar = getAvatarByIndex(index + 400);
            console.log(`📝 用户"${user.name}"是普通网友，使用普通头像: ${avatar}`);
          } else {
            console.log(`📝 用户"${user.name}"是普通网友，使用AI生成的头像: ${avatar}`);
          }
        }

        const userId = `search-user-${keyword}-${index}`;

        // 保存用户完整信息到localStorage（包括人设）
        const userProfile: WeiboUserProfile = {
          id: userId,
          name: user.name,
          avatar: avatar,
          bio: user.bio,
          persona: user.bio, // 使用bio作为初始persona，后续生成内容时会更新
          stats: {
            following: typeof user.following === 'number' && user.following >= 0 ? user.following : Math.floor(Math.random() * 500) + 50,
            followers: typeof user.followers === 'number' && user.followers >= 0 ? user.followers : Math.floor(Math.random() * 10000) + 100,
            likes: typeof (user as any).likes === 'number' && (user as any).likes >= 0 ? (user as any).likes : Math.floor(Math.random() * 5000) + 100,
            posts: typeof user.posts === 'number' && user.posts >= 0 ? user.posts : Math.floor(Math.random() * 1000) + 100
          },
          verified: user.verified,
          verifiedType: user.verifiedType,
          createdAt: Date.now(),
          lastUpdated: Date.now()
        };
        saveUserProfile(userProfile);

        // 确保数据有效，如果AI返回的数据无效，使用默认值
        const userFollowers = typeof user.followers === 'number' && user.followers >= 0 ? user.followers : Math.floor(Math.random() * 10000) + 100;
        const userFollowing = typeof user.following === 'number' && user.following >= 0 ? user.following : Math.floor(Math.random() * 500) + 50;
        const userPosts = typeof user.posts === 'number' && user.posts >= 0 ? user.posts : Math.floor(Math.random() * 1000) + 100;
        const userLikes = typeof (user as any).likes === 'number' && (user as any).likes >= 0 ? (user as any).likes : Math.floor(Math.random() * 5000) + 100;

        console.log(`[handleSearch] 用户"${user.name}"的数据: followers=${userFollowers}, following=${userFollowing}, posts=${userPosts}, likes=${userLikes}`);

        // 更新保存的用户信息中的likes
        const updatedUserProfile: WeiboUserProfile = {
          id: userId,
          name: user.name,
          avatar: avatar,
          bio: user.bio,
          persona: user.bio,
          stats: {
            following: userFollowing,
            followers: userFollowers,
            likes: userLikes,
            posts: userPosts
          },
          verified: user.verified,
          verifiedType: user.verifiedType,
          createdAt: Date.now(),
          lastUpdated: Date.now()
        };
        saveUserProfile(updatedUserProfile);

        return {
          id: userId,
          name: user.name,
          avatar: avatar,
          bio: user.bio,
          followers: userFollowers,
          following: userFollowing,
          posts: userPosts,
          likes: userLikes,
          verified: user.verified,
          verifiedType: user.verifiedType,
          followed: followingList.some(f => f.id === userId)
        };
      });

      // 如果搜索的是角色名字，在用户列表最前面添加角色本人的账号
      // 读取角色的聊天设置，获取昵称等信息用于匹配
      let characterNickname = "";
      try {
        const chatSettingsKey = `miniOtomePhone_chatSettings_${selectedCharacterId}`;
        const stored = window.localStorage.getItem(chatSettingsKey);
        if (stored) {
          const chatSettings = JSON.parse(stored) as ChatSettings;
          if (chatSettings.nickname?.trim()) {
            characterNickname = chatSettings.nickname.trim();
          }
        }
      } catch (error) {
        console.error("读取角色聊天设置失败:", error);
      }

      // 检查搜索关键词是否匹配角色名字或昵称（不区分大小写，支持部分匹配）
      // 更宽松的匹配：只要关键词包含角色名字的任何部分，或者角色名字包含关键词的任何部分，就认为是匹配
      const keywordLower = keyword.toLowerCase().trim();
      const characterNameLower = selectedCharacter.name.toLowerCase().trim();
      const characterNicknameLower = characterNickname.toLowerCase().trim();

      // 提取角色名字中的每个字符（用于更宽松的匹配）
      const characterNameChars = characterNameLower.split('').filter(c => c.trim());
      const keywordChars = keywordLower.split('').filter(c => c.trim());

      // 检查是否有任何字符匹配
      const hasCommonChars = characterNameChars.some(char => keywordChars.includes(char)) ||
        keywordChars.some(char => characterNameChars.includes(char));

      const isSearchingCharacterName =
        keywordLower === characterNameLower ||
        keywordLower === characterNicknameLower ||
        characterNameLower.includes(keywordLower) ||
        keywordLower.includes(characterNameLower) ||
        (characterNicknameLower && (characterNicknameLower.includes(keywordLower) || keywordLower.includes(characterNicknameLower))) ||
        (hasCommonChars && keywordLower.length >= 2); // 如果有关键字符匹配且关键词长度>=2，也认为是匹配

      console.log(`搜索关键词: "${keyword}", 角色名字: "${selectedCharacter.name}", 角色昵称: "${characterNickname}", 是否匹配: ${isSearchingCharacterName}`);

      // 如果还是不匹配，但搜索关键词和角色名字都不为空，也添加角色账号
      // 这样可以确保搜索角色相关的内容时，总是能看到角色本人的账号
      const shouldAddCharacterAccount = isSearchingCharacterName ||
        (keywordLower.length > 0 && characterNameLower.length > 0 &&
          (keywordLower.length >= 2 || characterNameLower.length >= 2));

      if (shouldAddCharacterAccount) {
        // 读取角色的聊天设置，获取头像和真实名称
        let characterRealName = "";
        let characterAvatar = "";
        let characterIdentity = "";
        let characterOther = "";
        try {
          const chatSettingsKey = `miniOtomePhone_chatSettings_${selectedCharacterId}`;
          const stored = window.localStorage.getItem(chatSettingsKey);
          if (stored) {
            const chatSettings = JSON.parse(stored) as ChatSettings;
            // 读取真实名称（优先使用realName，其次使用name）
            if (chatSettings.realName?.trim()) {
              characterRealName = chatSettings.realName.trim();
            } else if (chatSettings.taIdentity?.trim()) {
              characterRealName = chatSettings.taIdentity.trim();
            }
            // 读取头像（支持多种格式）
            if (chatSettings.avatar?.trim()) {
              const avatarPath = chatSettings.avatar.trim();
              // 如果已经是完整路径（以/开头），直接使用
              if (avatarPath.startsWith('/')) {
                characterAvatar = avatarPath;
              }
              // 如果是相对路径（不包含/），可能是文件名，需要添加路径前缀
              else if (!avatarPath.includes('/') && !avatarPath.includes('http')) {
                // 假设是weibo-avatar目录下的文件
                characterAvatar = `/weibo-avatar/${avatarPath}`;
              }
              // 如果是http/https链接，直接使用
              else if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
                characterAvatar = avatarPath;
              }
              // 其他情况，尝试作为完整路径使用
              else {
                characterAvatar = avatarPath;
              }
              console.log(`从聊天设置读取头像: 原始值="${chatSettings.avatar}", 处理后="${characterAvatar}"`);
            }
            // 读取身份和其他信息（用于生成介绍）
            if (chatSettings.taIdentity?.trim()) {
              characterIdentity = chatSettings.taIdentity.trim();
            }
            if (chatSettings.taOther?.trim()) {
              characterOther = chatSettings.taOther.trim();
            }
          }
        } catch (error) {
          console.error("读取角色聊天设置失败:", error);
        }

        // 如果没有真实名称，使用角色名字
        if (!characterRealName) {
          characterRealName = selectedCharacter.name;
        }

        // 如果没有从聊天设置读取到头像，尝试其他方式
        if (!characterAvatar) {
          console.warn(`聊天设置中未找到头像，尝试其他方式...`);
          // 再次尝试读取（可能存储格式不同）
          try {
            const chatSettingsKey = `miniOtomePhone_chatSettings_${selectedCharacterId}`;
            const stored = window.localStorage.getItem(chatSettingsKey);
            if (stored) {
              const chatSettings = JSON.parse(stored) as ChatSettings;
              console.log(`聊天设置完整内容:`, chatSettings);
              // 尝试读取所有可能的头像字段
              if (chatSettings.avatar) {
                console.log(`找到avatar字段:`, chatSettings.avatar);
              }
            }
          } catch (error) {
            console.error("重新读取聊天设置失败:", error);
          }

          // 如果角色头像是图片路径，使用它
          if (selectedCharacter.avatar && (selectedCharacter.avatar.startsWith('/') || selectedCharacter.avatar.startsWith('http'))) {
            characterAvatar = selectedCharacter.avatar;
            console.log(`使用角色默认头像: ${characterAvatar}`);
          } else {
            // 最后使用默认头像
            characterAvatar = getAvatarByIndex(0);
            console.warn(`⚠️ 角色账号未找到有效头像，使用默认头像: ${characterAvatar}`);
          }
        } else {
          console.log(`✅ 成功读取角色头像: ${characterAvatar}`);
        }

        // 最终验证：确保头像路径是有效的图片路径
        if (characterAvatar && !characterAvatar.startsWith('/') && !characterAvatar.startsWith('http://') && !characterAvatar.startsWith('https://')) {
          console.warn(`⚠️ 头像路径格式异常: ${characterAvatar}，尝试修复...`);
          // 如果不是有效路径，尝试添加前缀
          if (!characterAvatar.includes('/') && !characterAvatar.includes('http')) {
            characterAvatar = `/weibo-avatar/${characterAvatar}`;
            console.log(`修复后的头像路径: ${characterAvatar}`);
          } else {
            // 如果包含路径但格式不对，使用默认头像
            characterAvatar = getAvatarByIndex(0);
            console.warn(`⚠️ 头像路径格式无法修复，使用默认头像: ${characterAvatar}`);
          }
        }

        // 使用AI生成符合人设但不照搬聊天设置的介绍和账号数据
        let characterBio = "";
        let characterFollowers = 0;
        let characterFollowing = 0;
        let characterPosts = 0;

        try {
          const bioPrompt = `根据以下角色信息，生成符合该角色人设的微博账号数据。要求：
1. 生成一条个人简介（30字以内），要贴合角色的人设和身份，但不要直接照搬以下内容，要自然、真实
2. 根据角色的身份、职业、知名度等人设特点，生成合理的粉丝数、关注数、微博数
3. 粉丝数要符合角色的知名度和职业特点（例如：知名艺人可能有几百万到几千万粉丝，普通音乐制作人可能有几万到几十万粉丝）
4. 关注数要合理（通常比粉丝数少很多，可能是几十到几百）
5. 微博数要符合角色的活跃度（活跃用户可能有几千到几万条微博）
6. 返回格式为JSON：
{
  "bio": "个人简介",
  "followers": 粉丝数（整数）,
  "following": 关注数（整数）,
  "posts": 微博数（整数）
}

角色身份：${characterIdentity || "未知"}
角色其他信息：${characterOther || "无"}
角色名字：${characterRealName}

生成的JSON：`;

          const bioResponse = await sendChatRequest(aiConfig, [
            { role: "user", content: bioPrompt }
          ]);

          // 尝试解析JSON
          try {
            const jsonMatch = bioResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              characterBio = parsed.bio || "";
              characterFollowers = parsed.followers || 0;
              characterFollowing = parsed.following || 0;
              characterPosts = parsed.posts || 0;

              // 验证数据合理性
              if (characterFollowers < 0) characterFollowers = 0;
              if (characterFollowing < 0) characterFollowing = 0;
              if (characterPosts < 0) characterPosts = 0;

              console.log(`✅ AI生成角色账号数据: 粉丝=${characterFollowers}, 关注=${characterFollowing}, 微博=${characterPosts}`);
            } else {
              throw new Error("未找到JSON格式");
            }
          } catch (parseError) {
            console.error("解析AI返回的JSON失败:", parseError);
            // 如果解析失败，从文本中提取简介
            characterBio = bioResponse.trim().split('\n')[0].trim();
            characterBio = characterBio.replace(/^["']|["']$/g, '');
            // 使用默认数据
            characterFollowers = 50000;
            characterFollowing = 100;
            characterPosts = 500;
          }
        } catch (error) {
          console.error("生成角色账号数据失败:", error);
          // 如果AI生成失败，使用基于身份信息的默认值
          if (characterIdentity) {
            characterBio = `${characterIdentity}，专注创作优质音乐作品`;
          } else {
            characterBio = `${characterRealName}的官方微博`;
          }
          // 根据身份设置合理的默认数据
          if (characterIdentity && (characterIdentity.includes("知名") || characterIdentity.includes("顶级") || characterIdentity.includes("著名"))) {
            characterFollowers = Math.floor(Math.random() * 2000000) + 500000; // 50万-250万粉丝
            characterFollowing = Math.floor(Math.random() * 300) + 100; // 100-400关注
            characterPosts = Math.floor(Math.random() * 3000) + 2000; // 2000-5000微博
          } else {
            characterFollowers = Math.floor(Math.random() * 500000) + 10000; // 1万-51万粉丝
            characterFollowing = Math.floor(Math.random() * 200) + 50; // 50-250关注
            characterPosts = Math.floor(Math.random() * 2000) + 500; // 500-2500微博
          }
        }

        // 创建角色本人的微博账号
        const characterAccount = {
          id: `search-user-character-${selectedCharacterId}`,
          name: characterRealName, // 使用真实名称
          avatar: characterAvatar, // 使用聊天设置中的头像
          bio: characterBio,
          followers: characterFollowers, // 使用AI生成或基于人设的粉丝数
          following: characterFollowing, // 使用AI生成或基于人设的关注数
          posts: characterPosts, // 使用AI生成或基于人设的微博数
          likes: Math.floor(Math.random() * 5000) + 100, // 添加获赞数
          verified: true, // 角色本人应该是认证账号
          verifiedType: "个人认证",
          followed: followingList.some(f => f.id === `search-user-character-${selectedCharacterId}`)
        };

        // 将角色账号添加到列表最前面
        generatedUsers = [characterAccount, ...generatedUsers];
        console.log(`✅ 已添加角色本人账号: ${characterRealName}，头像: ${characterAvatar}，简介: ${characterBio}`);
      }

      // 并行生成所有微博的评论
      console.log(`开始为${generatedPosts.length}条微博生成评论...`);
      const commentPromises = generatedPosts.map(async (post, postIndex) => {
        try {
          const comments = await generateCommentsWithAI(aiConfig, post.content, post.id, postIndex * 10 + 500, commentNicknames);
          if (comments && comments.length > 0) {
            return { postId: post.id, comments };
          } else {
            const retryComments = await generateCommentsWithAI(aiConfig, post.content, post.id, postIndex * 10 + 500, commentNicknames);
            return { postId: post.id, comments: retryComments || [] };
          }
        } catch (error) {
          console.error(`生成评论失败:`, error);
          return { postId: post.id, comments: [] };
        }
      });

      const commentResults = await Promise.all(commentPromises);
      const generatedComments: Record<string, Comment[]> = {};
      commentResults.forEach(({ postId, comments }) => {
        if (comments && comments.length > 0) {
          generatedComments[postId] = comments;
        }
      });

      setSearchResults(generatedPosts);
      setSearchUsers(generatedUsers);
      setSearchComments(generatedComments);

      console.log(`✅ 成功生成搜索"${keyword}"的${generatedPosts.length}条微博、${generatedUsers.length}个用户和${Object.keys(generatedComments).length}条评论记录`);

      setLoadingSearch(false);
    } catch (error) {
      console.error("生成搜索结果失败:", error);
      alert(`生成搜索结果失败: ${error instanceof Error ? error.message : error}\n请检查AI配置或稍后重试。`);
      setLoadingSearch(false);
    }
  };

  // 生成单个热搜的微博内容
  const handleGenerateSingleHotSearchContent = async (hotSearch: HotSearch) => {
    if (!selectedCharacterId || !selectedCharacter) {
      alert("请先选择角色！");
      return;
    }

    // 检查该热搜是否已经在首页生成过
    const isHotSearchGenerated = hotSearches.some(hs => hs.id === hotSearch.id);
    if (!isHotSearchGenerated) {
      alert("请先在首页生成热搜标题！");
      return;
    }

    if (!aiConfig.baseUrl || !aiConfig.apiKey || !aiConfig.model) {
      alert("请先配置AI设置！");
      return;
    }

    setLoadingHotSearchPosts(true);

    try {
      // 使用辅助函数提取完整的世界书内容（包括全局和微博应用特定的）
      const worldbookContent = extractWorldbookContent(worldbookConfig);
      console.log(`[handleGenerateSingleHotSearchContent] 提取的世界书内容长度: ${worldbookContent.length} 字符`);

      // 生成评论者昵称池
      let commentNicknames: string[] = [];
      try {
        commentNicknames = await generateNicknamesWithAI(aiConfig, 20);
      } catch (error) {
        console.error("生成评论昵称失败，使用默认昵称:", error);
        commentNicknames = generateDefaultNicknames(20);
      }

      console.log(`开始为热搜"${hotSearch.keyword}"生成微博内容...`);

      // 生成微博内容
      let postData: Array<{ content: string; userName: string; avatar: string }> = [];
      let retryCount = 0;
      const maxRetries = 2;

      // 重试机制
      while (retryCount < maxRetries && postData.length === 0) {
        try {
          postData = await generatePostsByHotSearch(aiConfig, hotSearch.keyword, chatMessages, selectedCharacter?.name || "", worldbookContent);
          if (postData && postData.length > 0) {
            console.log(`✅ AI返回了${postData.length}条微博数据`);
            break;
          } else {
            console.warn(`⚠️ AI返回了空数据，重试中... (${retryCount + 1}/${maxRetries})`);
          }
        } catch (error) {
          retryCount++;
          console.error(`❌ 生成失败 (尝试 ${retryCount}/${maxRetries}):`, error);
          if (retryCount >= maxRetries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      if (!postData || postData.length === 0) {
        throw new Error(`无法为热搜"${hotSearch.keyword}"生成微博内容`);
      }

      const generatedPosts: WeiboPost[] = [];

      // 创建所有微博
      for (let index = 0; index < postData.length; index++) {
        const data = postData[index];
        if (!data || !data.content) {
          console.warn(`第${index + 1}条微博内容为空，跳过`);
          continue;
        }

        const postId = `hot-${hotSearch.id}-${index}`;
        generatedPosts.push({
          id: postId,
          user: {
            name: data.userName || generateDefaultNicknames(1)[0],
            avatar: data.avatar || getAvatarByIndex(index + 200),
            verified: Math.random() > 0.7,
            verifiedType: Math.random() > 0.7 ? "个人认证" : undefined,
          },
          content: data.content,
          images: [],
          time: `${(index + 1) * 3}分钟前`,
          source: ["iPhone客户端", "微博客户端", "Android客户端"][index % 3],
          repostCount: Math.floor(Math.random() * 20) + 5,
          commentCount: Math.floor(Math.random() * 30) + 10,
          likeCount: Math.floor(Math.random() * 100) + 20,
          liked: Math.random() > 0.7,
        });
      }

      // 并行生成所有微博的评论
      console.log(`开始为${generatedPosts.length}条微博生成评论...`);
      const commentPromises = generatedPosts.map(async (post, postIndex) => {
        try {
          console.log(`为微博${post.id}生成评论...`);
          const comments = await generateCommentsWithAI(aiConfig, post.content, post.id, postIndex * 10 + 300, commentNicknames, chatMessages, selectedCharacter?.name || "", worldbookContent);
          if (comments && comments.length > 0) {
            console.log(`✅ 为微博${post.id}成功生成${comments.length}条评论`);
            return { postId: post.id, comments };
          } else {
            console.warn(`⚠️ 为微博${post.id}生成的评论为空，重试...`);
            const retryComments = await generateCommentsWithAI(aiConfig, post.content, post.id, postIndex * 10 + 300, commentNicknames, chatMessages, selectedCharacter?.name || "", worldbookContent);
            if (retryComments && retryComments.length > 0) {
              console.log(`✅ 重试成功，为微博${post.id}生成${retryComments.length}条评论`);
              return { postId: post.id, comments: retryComments };
            } else {
              throw new Error(`重试后仍无法生成评论`);
            }
          }
        } catch (commentError) {
          console.error(`❌ 生成微博${post.id}的评论失败:`, commentError);
          try {
            console.log(`重试生成微博${post.id}的评论...`);
            const retryComments = await generateCommentsWithAI(aiConfig, post.content, post.id, postIndex * 10 + 300, commentNicknames, chatMessages, selectedCharacter?.name || "", worldbookContent);
            if (retryComments && retryComments.length > 0) {
              console.log(`✅ 重试成功，为微博${post.id}生成${retryComments.length}条评论`);
              return { postId: post.id, comments: retryComments };
            } else {
              throw new Error(`重试后仍无法生成评论`);
            }
          } catch (retryError) {
            console.error(`❌ 重试生成评论仍然失败:`, retryError);
            throw new Error(`无法为微博${post.id}生成评论: ${retryError}`);
          }
        }
      });

      const commentResults = await Promise.all(commentPromises);
      const generatedComments: Record<string, Comment[]> = {};
      commentResults.forEach(({ postId, comments }) => {
        if (comments && comments.length > 0) {
          generatedComments[postId] = comments;
        }
      });

      console.log(`✅ 成功生成热搜"${hotSearch.keyword}"的${generatedPosts.length}条微博和${Object.keys(generatedComments).length}条评论记录`);

      // 更新状态
      const newHotSearchPosts = { ...hotSearchPosts };
      const newHotSearchComments = { ...hotSearchComments };
      newHotSearchPosts[hotSearch.id] = generatedPosts;
      newHotSearchComments[hotSearch.id] = generatedComments;

      setHotSearchPosts(newHotSearchPosts);
      setHotSearchComments(newHotSearchComments);

      // 保存到localStorage
      try {
        const hotSearchPostsKey = `miniOtomePhone_weibo_hotSearchPosts_${selectedCharacterId}`;
        const hotSearchCommentsKey = `miniOtomePhone_weibo_hotSearchComments_${selectedCharacterId}`;

        // 读取现有的内容
        const existingPosts = { ...hotSearchPosts };
        const existingComments = { ...hotSearchComments };
        existingPosts[hotSearch.id] = generatedPosts;
        existingComments[hotSearch.id] = generatedComments;

        window.localStorage.setItem(hotSearchPostsKey, JSON.stringify(existingPosts));
        window.localStorage.setItem(hotSearchCommentsKey, JSON.stringify(existingComments));

        console.log(`✅ 成功保存热搜详情页内容到localStorage`);
      } catch (error) {
        console.error("❌ 保存热搜详情页内容失败:", error);
      }

      setLoadingHotSearchPosts(false);
    } catch (error) {
      console.error("生成热搜内容失败:", error);
      alert(`生成内容失败: ${error instanceof Error ? error.message : error}\n请检查AI配置或稍后重试。`);
      setLoadingHotSearchPosts(false);
    }
  };

  // 点赞/取消点赞
  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            liked: !post.liked,
            likeCount: post.liked ? post.likeCount - 1 : post.likeCount + 1,
          };
        }
        return post;
      })
    );
  };

  // 点赞/取消点赞评论
  const handleCommentLike = (postId: string, commentId: string) => {
    setComments((prev) => {
      const postComments = prev[postId] || [];
      const updateComment = (comment: Comment): Comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            liked: !comment.liked,
            likeCount: comment.liked ? comment.likeCount - 1 : comment.likeCount + 1,
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(updateComment),
          };
        }
        return comment;
      };
      return {
        ...prev,
        [postId]: postComments.map(updateComment),
      };
    });
  };

  // 获取当前选中的微博（必须在所有早期返回之前计算）
  const selectedPost = selectedPostId ? posts.find((p) => p.id === selectedPostId) : null;
  const selectedPostComments = selectedPostId ? (comments[selectedPostId] || []) : [];

  // 格式化数字
  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`;
    }
    return num.toString();
  };

  // 根据账号类型和创建时间计算动态粉丝增长
  const calculateDynamicFollowers = (
    accountType: "celebrity" | "marketing" | "normal",
    initialFollowers: number,
    createdAt: number
  ): number => {
    const now = Date.now();
    const hoursPassed = (now - createdAt) / (1000 * 60 * 60); // 经过的小时数

    let growthRate = 0; // 每小时增长数
    switch (accountType) {
      case "celebrity":
        // 当红明星：每小时几百到几千粉丝（随机）
        growthRate = Math.floor(Math.random() * 2000) + 300; // 300-2300/小时
        break;
      case "marketing":
        // 营销号：每小时几十到几百粉丝
        growthRate = Math.floor(Math.random() * 200) + 20; // 20-220/小时
        break;
      case "normal":
      default:
        // 普通网友：暂时不增长或很少增长
        growthRate = Math.floor(Math.random() * 5); // 0-4/小时
        break;
    }

    const totalGrowth = Math.floor(hoursPassed * growthRate);
    return Math.max(initialFollowers, initialFollowers + totalGrowth);
  };

  // 根据微博创建时间和初始数据计算动态互动数据增长
  const calculateDynamicEngagement = (
    initialCount: number,
    createdAt: number,
    type: "repost" | "comment" | "like"
  ): number => {
    const now = Date.now();
    const hoursPassed = (now - createdAt) / (1000 * 60 * 60); // 经过的小时数

    // 不同类型的互动有不同的增长速率
    let growthRate = 0;
    switch (type) {
      case "like":
        // 点赞增长最快
        growthRate = Math.floor(Math.random() * 50) + 10; // 10-60/小时
        break;
      case "comment":
        // 评论增长中等
        growthRate = Math.floor(Math.random() * 20) + 5; // 5-25/小时
        break;
      case "repost":
        // 转发增长较慢
        growthRate = Math.floor(Math.random() * 10) + 2; // 2-12/小时
        break;
    }

    const totalGrowth = Math.floor(hoursPassed * growthRate);
    return Math.max(initialCount, initialCount + totalGrowth);
  };

  // 格式化粉丝数（大于1万显示为W单位）
  const formatFollowers = (num: number): string => {
    if (num >= 10000) {
      const w = num / 10000;
      // 如果是整数，显示为整数，否则保留一位小数
      if (w % 1 === 0) {
        return `${w}W`;
      } else {
        return `${w.toFixed(1)}W`;
      }
    }
    return num.toString();
  };

  // 获取热度标签颜色
  const getHotTagColor = (hot: string): string => {
    switch (hot) {
      case "沸":
        return "#ff6b6b";
      case "热":
        return "#ff8c42";
      case "新":
        return "#4ecdc4";
      default:
        return "#95a5a6";
    }
  };

  // 渲染头像（统一处理头像显示逻辑）
  const renderAvatar = (avatar: string | undefined, alt: string, fallback: string = "👤"): React.ReactNode => {
    if (!avatar) {
      return <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{fallback}</div>;
    }

    // 如果是图片路径（以/开头或http/https开头），使用img标签显示
    if (avatar.startsWith('/') || avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return (
        <img
          src={avatar}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
          onError={(e) => {
            // 如果图片加载失败，显示默认图标
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 20px;">${fallback}</div>`;
            }
          }}
        />
      );
    }

    // 如果是emoji或其他文本，直接显示
    return <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{avatar || fallback}</div>;
  };

  // 获取用户的所有微博
  const getUserPosts = (userId: string): WeiboPost[] => {
    // 从所有微博中筛选出该用户的微博
    const userPosts = posts.filter(post => {
      // 使用用户名字作为ID（因为WeiboPost中没有userId字段）
      return post.user.name === userId;
    });

    // 也从热搜微博中筛选
    Object.values(hotSearchPosts).forEach(hotSearchPostList => {
      hotSearchPostList.forEach(post => {
        if (post.user.name === userId) {
          userPosts.push(post);
        }
      });
    });

    // 也从搜索结果中筛选
    searchResults.forEach(post => {
      if (post.user.name === userId) {
        userPosts.push(post);
      }
    });

    // 按时间排序（最新的在前）
    return userPosts.sort((a, b) => {
      // 简单的时间比较（实际应该解析时间字符串）
      return b.time.localeCompare(a.time);
    });
  };

  // 渲染微博内容，将话题标签（#话题#）渲染为蓝色
  const renderWeiboContent = (content: string): React.ReactNode => {
    if (!content) return null;

    // 匹配话题标签：#话题名称#
    const topicRegex = /#([^#]+)#/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = topicRegex.exec(content)) !== null) {
      // 添加话题标签前的文本
      if (match.index > lastIndex) {
        parts.push(
          <span key={key++}>{content.substring(lastIndex, match.index)}</span>
        );
      }

      // 添加话题标签（蓝色）
      parts.push(
        <span key={key++} className="weibo-topic-tag">
          {match[0]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余的文本
    if (lastIndex < content.length) {
      parts.push(
        <span key={key++}>{content.substring(lastIndex)}</span>
      );
    }

    return parts.length > 0 ? <>{parts}</> : content;
  };

  // 选择角色
  const handleSelectCharacter = (characterId: string) => {
    console.log("选择角色:", characterId);
    if (!characterId) {
      console.error("角色ID为空");
      return;
    }
    try {
      setSelectedCharacterId(characterId);
      window.localStorage.setItem(WEIBO_SELECTED_CHARACTER_KEY, characterId);
      console.log("角色选择成功，已保存到localStorage");
    } catch (error) {
      console.error("选择角色失败:", error);
    }
  };

  // 如果显示关注列表
  if (showFollowingList) {
    return (
      <div className="weibo-screen">
        <header className="weibo-header">
          <button
            className="weibo-back-btn"
            onClick={() => setShowFollowingList(false)}
            aria-label="返回"
          >
            ←
          </button>
          <div className="weibo-header-title">我的关注</div>
          <div className="weibo-header-actions"></div>
        </header>

        <main className="weibo-main">
          <div className="weibo-follow-list">
            {followingList.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-sub)" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
                <div>还没有关注任何人</div>
              </div>
            ) : (
              <div className="weibo-follow-list-content">
                {followingList.map((user) => {
                  const isMutual = followersList.some(f => f.id === user.id && f.isFollowingMe);
                  return (
                    <div
                      key={user.id}
                      className="weibo-follow-item"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        boxSizing: "border-box",
                        position: "relative",
                        overflow: "visible"
                      }}
                    >
                      <div
                        style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, gap: "12px", flexShrink: 1, cursor: "pointer" }}
                        onClick={() => {
                          setShowFollowingList(false);
                          // 从关注列表中读取用户数据并设置
                          // 优先从保存的用户资料中读取完整信息
                          const userProfileData = getUserProfile(user.id, user.name);
                          const savedStats = userProfileData?.stats || user.stats || {
                            following: 0,
                            followers: 0,
                            likes: 0,
                            posts: 0
                          };

                          setViewingUserStats({
                            following: savedStats.following || 0,
                            followers: savedStats.followers || 0,
                            likes: savedStats.likes || 0
                          });
                          setViewingUserBio(userProfileData?.bio || user.bio || "");
                          setViewingUserId(user.name);
                          console.log(`[我的关注列表] 点击用户"${user.name}"，进入用户主页`);
                        }}
                      >
                        <div className="weibo-follow-item-avatar" style={{ flexShrink: 0, width: "48px", height: "48px" }}>
                          {renderAvatar(user.avatar, user.name)}
                        </div>
                        <div className="weibo-follow-item-info" style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                          <div className="weibo-follow-item-name">
                            {user.name}
                            {user.verified && (
                              <span className="weibo-verified-badge" title={user.verifiedType}>
                                ✓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          // 获取用户完整信息（包括人设）
                          const userProfileData = getUserProfile(user.id, user.name);
                          // 从searchUsers中查找该用户的完整信息
                          const searchUser = searchUsers.find(u => u.id === user.id);
                          handleFollow(
                            user.id,
                            user.name,
                            user.avatar,
                            user.verified,
                            user.verifiedType,
                            searchUser?.bio || userProfileData?.bio,
                            userProfileData?.persona,
                            searchUser ? {
                              following: searchUser.following,
                              followers: searchUser.followers,
                              likes: 0,
                              posts: searchUser.posts
                            } : undefined
                          );
                        }}
                        style={{
                          flexShrink: 0,
                          width: "80px",
                          height: "32px",
                          display: "block",
                          visibility: "visible",
                          opacity: 1,
                          position: "relative",
                          zIndex: 1000,
                          boxSizing: "border-box",
                          marginLeft: "12px",
                          backgroundColor: isMutual ? "#f0f0f0" : "#1890ff",
                          color: isMutual ? "#333333" : "#ffffff",
                          border: isMutual ? "1px solid #d9d9d9" : "1px solid #1890ff",
                          padding: "6px 16px",
                          borderRadius: "20px",
                          fontSize: "14px",
                          fontWeight: "500",
                          cursor: "pointer",
                          textAlign: "center",
                          lineHeight: "20px",
                          whiteSpace: "nowrap",
                          overflow: "visible"
                        }}
                      >
                        {isMutual ? "互相关注" : "已关注"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* 取关确认弹窗 */}
        {showUnfollowConfirm && unfollowTarget && (
          <div
            className="weibo-modal-overlay"
            onClick={() => {
              setShowUnfollowConfirm(false);
              setUnfollowTarget(null);
            }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000
            }}
          >
            <div
              className="weibo-modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "24px",
                maxWidth: "320px",
                width: "90%",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", textAlign: "center" }}>
                确认取消关注
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-sub)", marginBottom: "24px", textAlign: "center" }}>
                确定要取消关注 <strong>{unfollowTarget.name}</strong> 吗？
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => {
                    setShowUnfollowConfirm(false);
                    setUnfollowTarget(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    backgroundColor: "#ffffff",
                    color: "var(--text-main)",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmUnfollow}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: "#ff4d4f",
                    color: "#ffffff",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                >
                  确认取关
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 如果正在查看用户个人页面
  if (viewingUserId) {
    const userPosts = getUserPosts(viewingUserId);
    // 优先从关注列表和粉丝列表中查找用户信息
    let userInfo: { name: string; avatar: string; verified?: boolean; verifiedType?: string } | undefined;

    // 先从关注列表中查找
    const followingUser = followingList.find(u => u.name === viewingUserId);
    if (followingUser) {
      userInfo = {
        name: followingUser.name,
        avatar: followingUser.avatar,
        verified: followingUser.verified,
        verifiedType: followingUser.verifiedType
      };
    }

    // 如果关注列表中没有，从粉丝列表中查找
    if (!userInfo) {
      const followerUser = followersList.find(u => u.name === viewingUserId);
      if (followerUser) {
        userInfo = {
          name: followerUser.name,
          avatar: followerUser.avatar,
          verified: followerUser.verified,
          verifiedType: followerUser.verifiedType
        };
      }
    }

    // 如果关注列表和粉丝列表中都没有，再从微博中查找
    if (!userInfo) {
      userInfo = posts.find(p => p.user.name === viewingUserId)?.user ||
        Object.values(hotSearchPosts).flat().find(p => p.user.name === viewingUserId)?.user ||
        searchResults.find(p => p.user.name === viewingUserId)?.user;
    }

    if (!userInfo) {
      // 如果找不到用户信息，返回
      setViewingUserId(null);
      return null;
    }

    // 获取用户背景图片
    const userBackground = getBackgroundByUserId(viewingUserId);

    // 获取用户完整信息（包括人设）
    const userProfileData = getUserProfile(userInfo.name, userInfo.name);
    const existingPersona = userProfileData?.persona || followingUser?.persona || "";
    const existingBio = userProfileData?.bio || followingUser?.bio || viewingUserBio || "";

    // 从保存的用户数据中读取统计数据和个人介绍（在渲染时直接处理，不使用useEffect）
    // 优先从保存的完整用户数据中读取，其次从关注列表中的用户数据读取，最后从搜索结果中读取
    let savedStats = userProfileData?.stats || followingUser?.stats;

    // 如果还是没有统计数据，尝试从搜索结果中读取（如果是搜索结果中的用户）
    if (!savedStats || (savedStats.following === 0 && savedStats.followers === 0 && savedStats.likes === 0)) {
      const searchUser = searchUsers.find(u => u.name === viewingUserId);
      if (searchUser) {
        savedStats = {
          following: searchUser.following || 0,
          followers: searchUser.followers || 0,
          likes: 0,
          posts: searchUser.posts || 0
        };
        console.log(`[用户主页] 从搜索结果中读取用户数据:`, savedStats);
      }
    }

    // 如果viewingUserStats有非0值，优先使用（从搜索结果点击进入时设置）
    const finalStats = (viewingUserStats.following !== 0 || viewingUserStats.followers !== 0 || viewingUserStats.likes !== 0)
      ? viewingUserStats
      : (savedStats ? {
        following: savedStats.following || 0,
        followers: savedStats.followers || 0,
        likes: savedStats.likes || 0
      } : { following: 0, followers: 0, likes: 0 });

    // 优先使用viewingUserBio（从搜索结果点击进入时设置），其次从保存的数据中读取
    const finalBio = viewingUserBio || existingBio || userProfileData?.bio || followingUser?.bio || (() => {
      const searchUser = searchUsers.find(u => u.name === viewingUserId);
      return searchUser?.bio || (userInfo.name === userProfile.name ? userProfile.bio : "");
    })();

    console.log(`[用户主页] 最终统计数据:`, finalStats);
    console.log(`[用户主页] 最终个人介绍:`, finalBio);
    console.log(`[用户主页] followingUser数据:`, followingUser);
    console.log(`[用户主页] userProfileData数据:`, userProfileData);

    // 生成用户关注列表的处理函数
    const handleGenerateUserFollowingList = async () => {
      if (!userInfo || !selectedCharacterId) return;

      setLoadingUserFollowingList(true);
      try {
        // 获取世界书内容
        let worldbookContent = "";
        if (worldbookConfig) {
          worldbookContent = extractWorldbookContent(worldbookConfig);
          console.log(`[handleGenerateUserFollowingList] 提取的世界书内容长度: ${worldbookContent.length} 字符`);
        }

        // 使用AI智能提取NPC信息（用于头像分配）
        const npcs = await extractNPCsFromWorldbookWithAI(aiConfig, worldbookConfig);
        console.log(`[handleGenerateUserFollowingList] 从世界书提取的NPC列表:`, npcs);

        // 读取最近20条聊天记录
        const recentMessages = chatMessages.slice(-20);
        const messageSummary = recentMessages.map(m => `${m.from === "me" ? "玩家" : selectedCharacter?.name || ""}: ${m.content}`).join("\n");

        // 构建prompt
        const personaContext = existingPersona ? `\n\n⚠️ 重要：该用户的人设是：${existingPersona}\n生成的所有关注用户必须符合该用户的人设和兴趣，例如：如果用户是音乐制作人，关注列表应该包含音乐相关的账号（音乐人、制作人、音乐媒体等）。` : "";

        const worldbookContext = worldbookContent ? `\n\n世界书设定（请参考这些设定来生成符合世界观的内容）：\n${worldbookContent}` : "";

        const prompt = `请为微博用户"${userInfo.name}"生成关注列表。要求：

1. **必须生成10-15个该用户关注的微博账号**
2. 每个账号需要包含：昵称、简介、粉丝数、关注数、微博数、获赞数、是否认证
3. **重要**：生成的关注列表必须严格符合该用户的人设和身份（参考世界书设定和聊天记录）
4. 如果用户是音乐制作人，关注列表应该包含音乐相关的账号（音乐人、制作人、音乐媒体、音乐平台等）
5. 如果用户是演员，关注列表应该包含演艺相关的账号（演员、导演、制片人、影视公司等）
6. 如果用户是普通网友，关注列表应该包含日常相关的账号（朋友、兴趣相关的账号等）
7. 每个账号的简介要真实、有生活感，符合该账号的身份
8. 粉丝数、关注数、微博数、获赞数要合理（根据账号类型和知名度）
9. **头像路径格式要求**：头像路径必须严格遵循以下格式："/weibo-avatar/文件名"或"/weibo-avatar-female/文件名"或"/weibo-avatar-male/文件名"，其中文件名必须是有效的图片文件名。例如："/weibo-avatar/1.jpg" 或 "/weibo-avatar-female/2.jpeg"。**不要使用其他路径格式！**
10. 返回格式为JSON：
{
  "users": [
    {"name": "用户昵称", "avatar": "头像路径", "bio": "用户简介", "followers": 粉丝数, "following": 关注数, "posts": 微博数, "likes": 获赞数, "verified": true/false, "verifiedType": "认证类型（可选）"},
    ...
  ]
}
${personaContext}${worldbookContext}${messageSummary ? `\n\n参考以下聊天记录（用于了解角色和玩家的对话内容，帮助生成更贴合的内容）：\n${messageSummary}\n` : ""}

请返回JSON格式的关注列表（必须包含至少10个用户）：`;

        console.log(`[handleGenerateUserFollowingList] 开始为用户"${userInfo.name}"生成关注列表...`);
        const response = await sendChatRequest(aiConfig, [
          { role: "user", content: prompt }
        ]);

        console.log(`[handleGenerateUserFollowingList] AI返回的原始内容:`, response);

        // 尝试解析JSON
        let parsed: any = null;
        try {
          const jsonMatch = response.match(/\{[\s\S]*"users"[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            parsed = JSON.parse(response);
          }
        } catch (parseError) {
          console.error("[handleGenerateUserFollowingList] 解析JSON失败:", parseError);
          throw new Error("AI返回的内容格式不正确，无法解析JSON");
        }

        if (!parsed || !parsed.users || !Array.isArray(parsed.users) || parsed.users.length === 0) {
          throw new Error("AI返回的关注列表为空或格式不正确");
        }

        // 处理生成的用户列表
        const generatedUsers = parsed.users.slice(0, 15).map((user: any, index: number) => {
          // 检查用户是否是NPC角色
          const npcInfo = npcs.find(npc => {
            const npcNameLower = npc.name.toLowerCase().trim();
            const userNameLower = (user.name || "").toLowerCase().trim();
            return npcNameLower === userNameLower ||
              userNameLower.includes(npcNameLower) ||
              npcNameLower.includes(userNameLower);
          });

          let avatar = user.avatar;
          if (npcInfo) {
            const npcGender = npcInfo.gender || "unknown";
            avatar = getNPCAvatar(npcGender, user.name);
            console.log(`✅ 关注列表用户"${user.name}"是NPC角色，性别: ${npcGender}，使用NPC头像: ${avatar}`);
          } else {
            // 如果不是NPC，确保使用普通网友头像
            if (!avatar || typeof avatar !== 'string' || !avatar.startsWith('/weibo-avatar')) {
              avatar = getAvatarByIndex(index + 500);
            }
          }

          // 确保数据有效
          const userFollowers = (typeof user.followers === 'number' && user.followers >= 0) ? user.followers : Math.floor(Math.random() * 10000) + 100;
          const userFollowing = (typeof user.following === 'number' && user.following >= 0) ? user.following : Math.floor(Math.random() * 500) + 50;
          const userPosts = (typeof user.posts === 'number' && user.posts >= 0) ? user.posts : Math.floor(Math.random() * 1000) + 100;
          const userLikes = (typeof user.likes === 'number' && user.likes >= 0) ? user.likes : Math.floor(Math.random() * 5000) + 100;

          return {
            id: `following-${viewingUserId}-${index}`,
            name: user.name || generateDefaultNicknames(1)[0],
            avatar: avatar,
            bio: user.bio || "",
            verified: user.verified || false,
            verifiedType: user.verifiedType,
            followers: userFollowers,
            following: userFollowing,
            posts: userPosts,
            likes: userLikes
          };
        });

        setViewingUserFollowingList(generatedUsers);
        // 保存该用户的关注列表到localStorage（按用户ID独立保存）
        saveUserFollowingList(userInfo.name, generatedUsers);
        console.log(`[handleGenerateUserFollowingList] ✅ 成功生成${generatedUsers.length}个关注用户，已保存到localStorage`);
      } catch (error) {
        console.error("[handleGenerateUserFollowingList] 生成失败:", error);
        alert(`生成关注列表失败：${error instanceof Error ? error.message : error}\n请检查AI配置或稍后重试。`);
      } finally {
        setLoadingUserFollowingList(false);
      }
    };

    // 生成用户内容的处理函数
    const handleGenerateUserContent = async () => {
      if (!userInfo || !selectedCharacterId) return;

      setLoadingUserContent(true);
      try {

        // 判断用户是否是角色本人
        const isCharacterUser = userInfo.name.toLowerCase().trim() === (selectedCharacter?.name || "").toLowerCase().trim();
        console.log(`[handleGenerateUserContent] 用户"${userInfo.name}"是否是角色本人: ${isCharacterUser}`);

        // 获取世界书内容（只有角色本人才使用完整的世界书内容）
        let worldbookContent = "";
        if (isCharacterUser && worldbookConfig) {
          // 只有角色本人才使用完整的世界书内容
          worldbookContent = extractWorldbookContent(worldbookConfig);
          console.log(`[handleGenerateUserContent] 提取的世界书内容长度: ${worldbookContent.length} 字符`);
        } else if (!isCharacterUser && worldbookConfig) {
          // 普通网友只使用世界书中的通用设定，不包含角色特定的内容
          // 这里可以提取通用设定，但暂时不传递，让AI只根据用户人设生成
          console.log(`[handleGenerateUserContent] 普通网友"${userInfo.name}"不使用世界书内容，只根据用户人设生成`);
        }

        // 生成用户内容（使用保存的人设信息，确保不OOC）
        console.log(`[handleGenerateUserContent] 开始为用户"${userInfo.name}"生成内容...`);

        let generatedContent;
        let retryCount = 0;
        const maxRetries = 2;

        // 重试机制：如果生成失败或posts为空，重试最多2次
        while (retryCount <= maxRetries) {
          try {
            generatedContent = await generateUserProfileContent(
              aiConfig,
              userInfo.name, // userId
              userInfo.name, // userName
              userInfo.avatar,
              isCharacterUser ? chatMessages : [], // 只有角色本人才使用聊天记录
              selectedCharacter?.name || "",
              isCharacterUser ? worldbookContent : undefined, // 只有角色本人才使用世界书内容
              existingPersona, // 使用保存的人设
              existingBio // 使用保存的个人介绍
            );

            console.log(`[handleGenerateUserContent] ✅ 生成完成，bio: ${generatedContent.bio}, posts数量: ${generatedContent.posts.length}, persona: ${generatedContent.persona}`);

            // 检查是否生成了微博内容
            if (!generatedContent.posts || generatedContent.posts.length === 0) {
              console.warn(`[handleGenerateUserContent] ⚠️ 生成的posts为空，重试中... (${retryCount + 1}/${maxRetries})`);
              retryCount++;
              if (retryCount > maxRetries) {
                throw new Error("重试后仍无法生成微博内容");
              }
              // 等待一段时间后重试
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            }

            // 成功生成，退出循环
            break;
          } catch (error) {
            console.error(`[handleGenerateUserContent] ❌ 生成失败 (尝试 ${retryCount + 1}/${maxRetries + 1}):`, error);
            retryCount++;
            if (retryCount > maxRetries) {
              // 所有重试都失败，显示错误提示
              alert(`生成内容失败：${error instanceof Error ? error.message : error}\n请检查AI配置或稍后重试。`);
              setLoadingUserContent(false);
              return;
            }
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }

        if (!generatedContent || !generatedContent.posts || generatedContent.posts.length === 0) {
          console.error(`[handleGenerateUserContent] ❌ 所有重试都失败，无法生成微博内容`);
          alert("生成失败：AI没有生成微博内容，请重试");
          setLoadingUserContent(false);
          return;
        }

        // 更新个人介绍和人设
        setViewingUserBio(generatedContent.bio);

        // 获取原有的统计数据（保持不变）
        const existingStats = userProfileData?.stats || followingUser?.stats || {
          following: finalStats.following,
          followers: finalStats.followers,
          likes: finalStats.likes,
          posts: 0
        };

        // 保存用户完整信息（包括新生成的人设，但保持原有的统计数据不变）
        const updatedProfile: WeiboUserProfile = {
          id: userInfo.name,
          name: userInfo.name,
          avatar: userInfo.avatar,
          bio: generatedContent.bio,
          persona: generatedContent.persona, // 保存生成的人设
          stats: {
            following: existingStats.following || 0, // 保持原有的关注数
            followers: existingStats.followers || 0, // 保持原有的粉丝数
            likes: existingStats.likes || 0, // 保持原有的获赞数
            posts: (existingStats.posts || 0) + generatedContent.posts.length // 只更新微博数（追加新生成的微博）
          },
          verified: userInfo.verified,
          verifiedType: userInfo.verifiedType,
          accountType: userProfileData?.accountType || "normal",
          initialFollowers: userProfileData?.initialFollowers || existingStats.followers || 0,
          createdAt: userProfileData?.createdAt || Date.now(),
          lastUpdated: Date.now()
        };
        saveUserProfile(updatedProfile);

        // 更新统计数据（保持原有数据，不更新）
        setViewingUserStats({
          following: existingStats.following || 0,
          followers: existingStats.followers || 0,
          likes: existingStats.likes || 0
        });

        // 生成微博和评论
        const newPosts: WeiboPost[] = [];
        const newComments: Record<string, Comment[]> = {};

        console.log(`[handleGenerateUserContent] 开始处理${generatedContent.posts.length}条微博...`);
        generatedContent.posts.forEach((postData: any, index: number) => {
          if (!postData || !postData.content) {
            console.warn(`[handleGenerateUserContent] ⚠️ 第${index + 1}条微博内容为空，跳过`);
            return;
          }
          const postId = `user-${viewingUserId}-${Date.now()}-${index}`;

          // 创建微博
          const newPost: WeiboPost = {
            id: postId,
            user: {
              name: userInfo.name,
              avatar: userInfo.avatar,
              verified: userInfo.verified,
              verifiedType: userInfo.verifiedType
            },
            content: postData.content,
            images: [],
            time: postData.time,
            source: postData.source,
            repostCount: Math.floor(Math.random() * 20) + 5,
            commentCount: (postData.comments || []).length,
            likeCount: Math.floor(Math.random() * 100) + 20,
            liked: false
          };
          newPosts.push(newPost);

          // 创建评论
          const postComments: Comment[] = (postData.comments || []).map((commentData: any, commentIndex: number) => {
            const commentNickname = generateDefaultNicknames(1)[0];
            return {
              id: `comment-${postId}-${commentIndex}`,
              user: {
                name: commentData.userName || commentNickname,
                avatar: getAvatarByIndex(commentIndex + 200),
                verified: Math.random() > 0.8,
                verifiedType: Math.random() > 0.8 ? "个人认证" : undefined
              },
              content: commentData.content,
              time: commentData.time || `${commentIndex + 1}分钟前`,
              likeCount: Math.floor(Math.random() * 20),
              liked: false
            };
          });
          if (postComments.length > 0) {
            newComments[postId] = postComments;
          }
        });

        console.log(`[handleGenerateUserContent] ✅ 处理完成，生成了${newPosts.length}条微博和${Object.keys(newComments).length}条评论记录`);

        // 更新微博列表和评论
        setPosts(prev => {
          const updated = [...newPosts, ...prev];
          console.log(`[handleGenerateUserContent] 更新posts状态，总数: ${updated.length}`);
          return updated;
        });
        setComments(prev => {
          const updated = { ...prev, ...newComments };
          console.log(`[handleGenerateUserContent] 更新comments状态，记录数: ${Object.keys(updated).length}`);
          return updated;
        });

      } catch (error) {
        console.error("生成用户内容失败:", error);
        alert("生成内容失败，请稍后重试");
      } finally {
        setLoadingUserContent(false);
      }
    };

    // 如果正在查看用户的关注列表
    if (showViewingUserFollowingList) {
      return (
        <div className="weibo-screen">
          <header className="weibo-header">
            <button
              className="weibo-back-btn"
              onClick={() => setShowViewingUserFollowingList(false)}
              aria-label="返回"
            >
              ←
            </button>
            <div className="weibo-header-title">{userInfo.name}的关注</div>
            <div className="weibo-header-actions">
              {loadingUserFollowingList && (
                <span style={{ fontSize: "12px", color: "var(--text-sub)" }}>生成中...</span>
              )}
            </div>
          </header>

          <main className="weibo-main">
            <div className="weibo-follow-list">
              {loadingUserFollowingList ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-sub)" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
                  <div>正在生成关注列表...</div>
                </div>
              ) : viewingUserFollowingList.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-sub)" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
                  <div>还没有关注列表</div>
                  <button
                    className="primary-pill-btn"
                    onClick={handleGenerateUserFollowingList}
                    disabled={loadingUserFollowingList}
                    style={{ marginTop: "16px" }}
                  >
                    {loadingUserFollowingList ? "生成中..." : "生成关注列表"}
                  </button>
                </div>
              ) : (
                <div className="weibo-follow-list-content">
                  {viewingUserFollowingList.map((user) => {
                    const isFollowing = followingList.some(f => f.id === user.id || f.name === user.name);
                    return (
                      <div key={user.id} className="weibo-follow-item">
                        <div
                          style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, gap: "12px", cursor: "pointer" }}
                          onClick={() => {
                            setShowViewingUserFollowingList(false);
                            // 从关注列表中读取用户数据并设置
                            // 优先从保存的用户资料中读取完整信息
                            const userProfileData = getUserProfile(user.id, user.name);
                            const savedStats = userProfileData?.stats || {
                              following: user.following || 0,
                              followers: user.followers || 0,
                              likes: user.likes || 0,
                              posts: user.posts || 0
                            };

                            setViewingUserStats({
                              following: savedStats.following || 0,
                              followers: savedStats.followers || 0,
                              likes: savedStats.likes || 0
                            });
                            setViewingUserBio(userProfileData?.bio || user.bio || "");
                            setViewingUserId(user.name);
                            console.log(`[角色关注列表] 点击用户"${user.name}"，进入用户主页`);
                          }}
                        >
                          <div className="weibo-follow-item-avatar">
                            {renderAvatar(user.avatar, user.name)}
                          </div>
                          <div className="weibo-follow-item-info" style={{ flex: 1, minWidth: 0 }}>
                            <div className="weibo-follow-item-name">
                              {user.name}
                              {user.verified && (
                                <span className="weibo-verified-badge" title={user.verifiedType}>
                                  ✓
                                </span>
                              )}
                            </div>
                            {user.bio && (
                              <div style={{ fontSize: "12px", color: "var(--text-sub)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {user.bio}
                              </div>
                            )}
                            <div style={{ fontSize: "11px", color: "var(--text-sub)", marginTop: "2px" }}>
                              {formatFollowers(user.followers)}粉丝 · {formatFollowers(user.following)}关注 · {formatFollowers(user.posts)}微博
                            </div>
                          </div>
                        </div>
                        {!isFollowing && (
                          <button
                            className="weibo-follow-item-btn weibo-follow-item-btn-follow"
                            onClick={(e) => {
                              e.stopPropagation();
                              // 获取用户完整信息（包括人设）
                              const userProfileData = getUserProfile(user.id, user.name);
                              handleFollow(
                                user.id,
                                user.name,
                                user.avatar,
                                user.verified,
                                user.verifiedType,
                                user.bio || userProfileData?.bio,
                                userProfileData?.persona,
                                {
                                  following: user.following,
                                  followers: user.followers,
                                  likes: user.likes,
                                  posts: user.posts
                                }
                              );
                            }}
                          >
                            关注
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="weibo-screen">
        <header className="weibo-header">
          <button
            className="weibo-back-btn"
            onClick={() => {
              setViewingUserId(null);
              setViewingUserBio("");
              setViewingUserStats({ following: 0, followers: 0, likes: 0 });
            }}
            aria-label="返回"
          >
            ←
          </button>
          <div className="weibo-header-title">{userInfo.name}</div>
          <div className="weibo-header-actions">
            <button
              className="weibo-icon-btn"
              onClick={handleGenerateUserContent}
              disabled={loadingUserContent}
              aria-label="生成内容"
              title="生成内容"
              style={{ opacity: loadingUserContent ? 0.5 : 1 }}
            >
              {loadingUserContent ? "⏳" : "🔄"}
            </button>
          </div>
        </header>

        <main className="weibo-main">
          <div className="weibo-profile">
            <div className="weibo-profile-header">
              <div
                className="weibo-profile-bg"
                style={{
                  backgroundImage: `url(${userBackground})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              ></div>
              <div className="weibo-profile-info">
                <div className="weibo-profile-avatar" style={{ position: "relative" }}>
                  {renderAvatar(userInfo.avatar, userInfo.name)}
                  {userInfo.verified && (
                    <span
                      className="weibo-verified-badge"
                      title={userInfo.verifiedType}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: "24px",
                        height: "24px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#ff6b6b",
                        color: "#ffffff",
                        border: "2px solid #ffffff",
                        borderRadius: "50%",
                        fontWeight: "bold",
                        zIndex: 10
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <div className="weibo-profile-name">
                  {userInfo.name}
                </div>
                {finalBio && <div className="weibo-profile-bio">{finalBio}</div>}
              </div>
            </div>

            {/* 用户统计数据 */}
            <div className="weibo-profile-stats">
              <div
                className="weibo-profile-stat-item"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setShowViewingUserFollowingList(true);
                  // 如果关注列表为空，自动生成
                  if (viewingUserFollowingList.length === 0 && !loadingUserFollowingList) {
                    handleGenerateUserFollowingList();
                  }
                }}
              >
                <div className="weibo-profile-stat-number">{finalStats.following || 0}</div>
                <div className="weibo-profile-stat-label">关注</div>
              </div>
              <div className="weibo-profile-stat-item">
                <div className="weibo-profile-stat-number">{formatFollowers(finalStats.followers || 0)}</div>
                <div className="weibo-profile-stat-label">粉丝</div>
              </div>
              <div className="weibo-profile-stat-item">
                <div className="weibo-profile-stat-number">{formatNumber(viewingUserStats.likes || 0)}</div>
                <div className="weibo-profile-stat-label">获赞</div>
              </div>
            </div>

            {/* 用户发布的微博列表 */}
            <div className="weibo-posts" style={{ marginTop: "20px" }}>
              {userPosts.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-sub)" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
                  <div>还没有发布任何微博</div>
                </div>
              ) : (
                userPosts.map((post) => {
                  const postComments = comments[post.id] || [];
                  const isSelected = selectedPostId === post.id;

                  return (
                    <article
                      key={post.id}
                      className="weibo-post"
                      onClick={() => setSelectedPostId(isSelected ? null : post.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="weibo-post-header">
                        <div className="weibo-post-avatar">
                          {renderAvatar(post.user.avatar, post.user.name)}
                        </div>
                        <div className="weibo-post-user-info">
                          <div className="weibo-post-user-name">
                            {post.user.name}
                            {post.user.verified && (
                              <span className="weibo-verified-badge" title={post.user.verifiedType}>
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="weibo-post-meta">
                            {post.time} · {post.source}
                          </div>
                        </div>
                        <button className="weibo-post-more-btn" aria-label="更多">
                          ⋮
                        </button>
                      </div>

                      <div className="weibo-post-content">
                        {post.reposted ? (
                          <div className="weibo-repost">
                            <div className="weibo-repost-header">
                              <span className="weibo-repost-user">{post.reposted.user.name}</span>
                              <span className="weibo-repost-content">{renderWeiboContent(post.reposted.content)}</span>
                            </div>
                          </div>
                        ) : (
                          <p>{renderWeiboContent(post.content)}</p>
                        )}
                        {post.images && post.images.length > 0 && (
                          <div className="weibo-post-images">
                            {post.images.map((img, idx) => (
                              <img key={idx} src={img} alt={`图片${idx + 1}`} />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="weibo-post-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className={`weibo-action-btn ${post.liked ? "weibo-action-btn-liked" : ""}`}
                          onClick={() => handleLike(post.id)}
                        >
                          <span className="weibo-action-icon">❤️</span>
                          <span className="weibo-action-count">
                            {post.likeCount > 0 ? formatNumber(post.likeCount) : "赞"}
                          </span>
                        </button>
                        <button className="weibo-action-btn">
                          <span className="weibo-action-icon">💬</span>
                          <span className="weibo-action-count">
                            {post.commentCount > 0 ? formatNumber(post.commentCount) : "评论"}
                          </span>
                        </button>
                        <button className="weibo-action-btn">
                          <span className="weibo-action-icon">🔄</span>
                          <span className="weibo-action-count">
                            {post.repostCount > 0 ? formatNumber(post.repostCount) : "转发"}
                          </span>
                        </button>
                      </div>

                      {/* 展开的评论 */}
                      {isSelected && postComments.length > 0 && (
                        <div className="weibo-comments" onClick={(e) => e.stopPropagation()}>
                          <div className="weibo-comments-header">
                            <h3>评论 {postComments.length}</h3>
                          </div>
                          <div className="weibo-comments-list">
                            {postComments.map((comment) => (
                              <div key={comment.id} className="weibo-comment-item">
                                <div className="weibo-comment-avatar">
                                  {renderAvatar(comment.user.avatar, comment.user.name)}
                                </div>
                                <div className="weibo-comment-content">
                                  <div className="weibo-comment-header">
                                    <span className="weibo-comment-user-name">
                                      {comment.user.name}
                                      {comment.user.verified && (
                                        <span className="weibo-verified-badge" title={comment.user.verifiedType}>
                                          ✓
                                        </span>
                                      )}
                                    </span>
                                    <span className="weibo-comment-time">{comment.time}</span>
                                  </div>
                                  <div className="weibo-comment-text">{renderWeiboContent(comment.content)}</div>
                                  <div className="weibo-comment-actions">
                                    <button
                                      className={`weibo-comment-action-btn ${comment.liked ? "weibo-comment-action-btn-liked" : ""}`}
                                      onClick={() => handleCommentLike(post.id, comment.id)}
                                    >
                                      <span className="weibo-comment-action-icon">❤️</span>
                                      <span className="weibo-comment-action-count">
                                        {comment.likeCount > 0 ? comment.likeCount : ""}
                                      </span>
                                    </button>
                                    <button className="weibo-comment-action-btn">
                                      <span className="weibo-comment-action-icon">💬</span>
                                      <span>回复</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 如果显示粉丝列表
  if (showFollowersList) {
    return (
      <div className="weibo-screen">
        <header className="weibo-header">
          <button
            className="weibo-back-btn"
            onClick={() => setShowFollowersList(false)}
            aria-label="返回"
          >
            ←
          </button>
          <div className="weibo-header-title">我的粉丝</div>
          <div className="weibo-header-actions"></div>
        </header>

        <main className="weibo-main">
          <div className="weibo-follow-list">
            {followersList.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-sub)" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
                <div>还没有粉丝</div>
              </div>
            ) : (
              <div className="weibo-follow-list-content">
                {followersList.map((user) => {
                  const isFollowing = followingList.some(f => f.id === user.id);
                  const isMutual = isFollowing && user.isFollowingMe;
                  return (
                    <div key={user.id} className="weibo-follow-item">
                      <div
                        style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, gap: "12px", cursor: "pointer" }}
                        onClick={() => {
                          setShowFollowersList(false);
                          // 从粉丝列表中读取用户数据并设置（如果有stats）
                          if (user.stats) {
                            setViewingUserStats({
                              following: user.stats.following || 0,
                              followers: user.stats.followers || 0,
                              likes: user.stats.likes || 0
                            });
                          }
                          if (user.bio) {
                            setViewingUserBio(user.bio);
                          }
                          setViewingUserId(user.name);
                        }}
                      >
                        <div className="weibo-follow-item-avatar">
                          {renderAvatar(user.avatar, user.name)}
                        </div>
                        <div className="weibo-follow-item-info">
                          <div className="weibo-follow-item-name">
                            {user.name}
                            {user.verified && (
                              <span className="weibo-verified-badge" title={user.verifiedType}>
                                ✓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        className={`weibo-follow-item-btn ${isMutual
                          ? "weibo-follow-item-btn-mutual"
                          : isFollowing
                            ? "weibo-follow-item-btn-followed"
                            : "weibo-follow-item-btn-follow"
                          }`}
                        onClick={() => {
                          if (isMutual || isFollowing) {
                            // 如果已关注或互相关注，取消关注
                            // 传递完整的用户数据（包括bio、stats等）
                            const userProfileData = getUserProfile(user.id, user.name);
                            // 从搜索结果用户对象或保存的用户数据中获取统计数据
                            let userStats: { following: number; followers: number; likes: number; posts: number } | undefined;
                            if (userProfileData?.stats) {
                              userStats = userProfileData.stats;
                            } else if ('following' in user && 'followers' in user && 'posts' in user) {
                              const searchUser = user as { following: number; followers: number; posts: number };
                              userStats = { following: searchUser.following, followers: searchUser.followers, likes: 0, posts: searchUser.posts };
                            } else {
                              userStats = { following: 0, followers: 0, likes: 0, posts: 0 };
                            }
                            handleFollow(
                              user.id,
                              user.name,
                              user.avatar,
                              user.verified,
                              user.verifiedType,
                              ('bio' in user ? user.bio : undefined) || userProfileData?.bio,
                              userProfileData?.persona,
                              userStats
                            );
                          } else {
                            // 如果未关注，回关
                            handleFollowBack(user.id, user.name, user.avatar, user.verified, user.verifiedType);
                          }
                        }}
                      >
                        {isMutual ? "互相关注" : isFollowing ? "已关注" : "回关"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // 如果没有选择角色，显示角色选择页面
  if (!selectedCharacterId) {
    return (
      <div className="weibo-screen">
        <header className="weibo-header">
          <button className="weibo-back-btn" onClick={onBackHome} aria-label="返回">
            ←
          </button>
          <div className="weibo-header-title">选择角色</div>
          <div className="weibo-header-actions"></div>
        </header>

        <main className="weibo-main">
          <div className="weibo-character-select">
            <div className="weibo-character-select-title">
              <h2>选择一个角色</h2>
              <p>进入该角色的专属微博世界</p>
            </div>
            <div className="weibo-character-list">
              {characters && characters.length > 0 ? characters
                .filter((character) => character && character.id)
                .map((character) => {
                  // 读取该角色的聊天设置
                  let chatSettings: ChatSettings | null = null;
                  try {
                    const stored = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${character.id}`);
                    if (stored) {
                      chatSettings = JSON.parse(stored) as ChatSettings;
                    }
                  } catch {
                    // ignore
                  }

                  // 获取显示名称（优先显示备注）
                  const getDisplayName = () => {
                    if (chatSettings?.nickname?.trim()) {
                      return chatSettings.nickname.trim();
                    }
                    return character.name || "未知角色";
                  };

                  // 生成显示标签（优先显示聊天设置中的信息）
                  const getCharacterTagline = () => {
                    if (chatSettings) {
                      // 优先显示身份信息
                      if (chatSettings.taIdentity?.trim()) {
                        return chatSettings.taIdentity.trim();
                      }
                      // 其次显示聊天风格
                      if (chatSettings.chatStyle?.trim()) {
                        return chatSettings.chatStyle.trim();
                      }
                      // 如果有真实姓名，显示真实姓名
                      if (chatSettings.realName?.trim()) {
                        return `真实姓名：${chatSettings.realName.trim()}`;
                      }
                      // 如果有称呼，显示称呼
                      if (chatSettings.callMe?.trim()) {
                        return `称呼你为：${chatSettings.callMe.trim()}`;
                      }
                    }
                    return "点击进入专属微博世界";
                  };

                  // 获取头像（优先使用自定义头像）
                  const getAvatar = () => {
                    if (chatSettings?.avatar?.trim()) {
                      return (
                        <img
                          src={chatSettings.avatar.trim()}
                          alt={getDisplayName()}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "50%"
                          }}
                        />
                      );
                    }
                    return <span>{character.avatar || "👤"}</span>;
                  };

                  return (
                    <button
                      key={character.id}
                      className="weibo-character-item"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("点击角色按钮:", character.id, character.name);
                        if (character.id) {
                          handleSelectCharacter(character.id);
                        } else {
                          console.error("角色ID为空，无法选择");
                        }
                      }}
                      type="button"
                      style={{ cursor: "pointer" }}
                    >
                      <div className="weibo-character-avatar">{getAvatar()}</div>
                      <div className="weibo-character-info">
                        <div className="weibo-character-name">{getDisplayName()}</div>
                        <div className="weibo-character-tagline">{getCharacterTagline()}</div>
                      </div>
                      <div className="weibo-character-arrow">→</div>
                    </button>
                  );
                }) : (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-sub)" }}>
                  暂无可用角色，请先在微信应用中添加联系人
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 如果显示搜索结果，显示搜索结果页
  if (showSearchResults && searchQuery) {
    return (
      <div className="weibo-screen">
        <header className="weibo-header">
          <button
            className="weibo-back-btn"
            onClick={() => {
              setShowSearchResults(false);
              setSearchQuery("");
            }}
            aria-label="返回"
          >
            ←
          </button>
          <div className="weibo-header-title">搜索: {searchQuery}</div>
          <div className="weibo-header-actions"></div>
        </header>

        <main className="weibo-main">
          {loadingSearch ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-sub)" }}>
              正在生成搜索结果...
            </div>
          ) : (
            <div className="weibo-feed">
              {/* 可关注的用户 */}
              {searchUsers.length > 0 && (
                <div className="weibo-discover-section" style={{ marginBottom: "20px" }}>
                  <h3 style={{ padding: "0 16px", marginBottom: "12px", fontSize: "16px", fontWeight: "600" }}>相关用户</h3>
                  <div className="weibo-discover-recommendations">
                    {searchUsers.map((user) => (
                      <div key={user.id} className="weibo-discover-user">
                        <div
                          className="weibo-discover-user-avatar"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            // 点击头像或用户信息进入主页时，设置统计数据和个人介绍
                            setViewingUserStats({
                              following: user.following || 0,
                              followers: user.followers || 0,
                              likes: 0
                            });
                            setViewingUserBio(user.bio || "");
                            setViewingUserId(user.name);
                          }}
                        >
                          {renderAvatar(user.avatar, user.name)}
                        </div>
                        <div
                          className="weibo-discover-user-info"
                          style={{ cursor: "pointer", flex: 1 }}
                          onClick={() => {
                            // 点击用户信息进入主页时，设置统计数据和个人介绍
                            setViewingUserStats({
                              following: user.following || 0,
                              followers: user.followers || 0,
                              likes: 0
                            });
                            setViewingUserBio(user.bio || "");
                            setViewingUserId(user.name);
                          }}
                        >
                          <div className="weibo-discover-user-name">
                            {user.name}
                            {user.verified && (
                              <span className="weibo-verified-badge" title={user.verifiedType}>
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="weibo-discover-user-desc">{user.bio}</div>
                          <div className="weibo-discover-user-stats" style={{ fontSize: "12px", color: "var(--text-sub)", marginTop: "4px" }}>
                            {formatFollowers(user.followers)}粉丝 · {formatFollowers(user.following)}关注 · {formatFollowers(user.posts)}微博 · {formatFollowers(user.likes || 0)}获赞
                          </div>
                        </div>
                        <button
                          className={`weibo-discover-follow-btn ${followingList.some(f => f.id === user.id)
                            ? "weibo-discover-follow-btn-followed"
                            : ""
                            }`}
                          onClick={() => {
                            // 获取用户完整信息（包括人设）
                            const userProfileData = getUserProfile(user.id, user.name);
                            handleFollow(
                              user.id,
                              user.name,
                              user.avatar,
                              user.verified,
                              user.verifiedType,
                              user.bio || userProfileData?.bio,
                              userProfileData?.persona,
                              {
                                following: user.following,
                                followers: user.followers,
                                likes: 0,
                                posts: user.posts
                              }
                            );
                          }}
                        >
                          {followingList.some(f => f.id === user.id) ? "已关注" : "关注"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 搜索结果微博 */}
              {searchResults.length > 0 ? (
                <div className="weibo-posts">
                  {searchResults.map((post) => {
                    const postComments = searchComments[post.id] || [];
                    const isSelected = selectedPostId === post.id;

                    return (
                      <article
                        key={post.id}
                        className="weibo-post"
                        onClick={() => setSelectedPostId(isSelected ? null : post.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="weibo-post-header">
                          <div className="weibo-post-avatar">
                            {renderAvatar(post.user.avatar, post.user.name)}
                          </div>
                          <div className="weibo-post-user-info">
                            <div className="weibo-post-user-name">
                              {post.user.name}
                              {post.user.verified && (
                                <span className="weibo-verified-badge" title={post.user.verifiedType}>
                                  ✓
                                </span>
                              )}
                            </div>
                            <div className="weibo-post-meta">
                              {post.time} · {post.source}
                            </div>
                          </div>
                          <button className="weibo-post-more-btn" aria-label="更多">
                            ⋮
                          </button>
                        </div>

                        <div className="weibo-post-content">
                          <p>{renderWeiboContent(post.content)}</p>
                        </div>

                        <div className="weibo-post-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className={`weibo-action-btn ${post.liked ? "weibo-action-btn-liked" : ""}`}
                            onClick={() => {
                              setSearchResults(prev => prev.map(p =>
                                p.id === post.id ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 } : p
                              ));
                            }}
                          >
                            <span className="weibo-action-icon">❤️</span>
                            <span className="weibo-action-count">
                              {post.likeCount > 0 ? formatNumber(post.likeCount) : "赞"}
                            </span>
                          </button>
                          <button className="weibo-action-btn">
                            <span className="weibo-action-icon">💬</span>
                            <span className="weibo-action-count">
                              {post.commentCount > 0 ? formatNumber(post.commentCount) : "评论"}
                            </span>
                          </button>
                          <button className="weibo-action-btn">
                            <span className="weibo-action-icon">🔄</span>
                            <span className="weibo-action-count">
                              {post.repostCount > 0 ? formatNumber(post.repostCount) : "转发"}
                            </span>
                          </button>
                        </div>
                        {/* 展开的评论 */}
                        {isSelected && postComments.length > 0 && (
                          <div className="weibo-comments" onClick={(e) => e.stopPropagation()}>
                            <div className="weibo-comments-header">
                              <h3>评论 {postComments.length}</h3>
                            </div>
                            <div className="weibo-comments-list">
                              {postComments.map((comment) => (
                                <div key={comment.id} className="weibo-comment-item">
                                  <div className="weibo-comment-avatar">
                                    {renderAvatar(comment.user.avatar, comment.user.name)}
                                  </div>
                                  <div className="weibo-comment-content">
                                    <div className="weibo-comment-header">
                                      <span className="weibo-comment-user-name">
                                        {comment.user.name}
                                        {comment.user.verified && (
                                          <span className="weibo-verified-badge" title={comment.user.verifiedType}>
                                            ✓
                                          </span>
                                        )}
                                      </span>
                                      <span className="weibo-comment-time">{comment.time}</span>
                                    </div>
                                    <div className="weibo-comment-text">{renderWeiboContent(comment.content)}</div>
                                    <div className="weibo-comment-actions">
                                      <button
                                        className={`weibo-comment-action-btn ${comment.liked ? "weibo-comment-action-btn-liked" : ""}`}
                                        onClick={() => {
                                          setSearchComments(prev => ({
                                            ...prev,
                                            [post.id]: (prev[post.id] || []).map(c =>
                                              c.id === comment.id ? { ...c, liked: !c.liked, likeCount: c.liked ? c.likeCount - 1 : c.likeCount + 1 } : c
                                            )
                                          }));
                                        }}
                                      >
                                        <span className="weibo-comment-action-icon">❤️</span>
                                        <span className="weibo-comment-action-count">
                                          {comment.likeCount > 0 ? comment.likeCount : ""}
                                        </span>
                                      </button>
                                      <button className="weibo-comment-action-btn">
                                        <span className="weibo-comment-action-icon">💬</span>
                                        <span>回复</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-sub)" }}>
                  暂无搜索结果
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // 如果选中了热搜，显示热搜详情页
  if (selectedHotSearch) {
    return (
      <div className="weibo-screen">
        <header className="weibo-header">
          <button
            className="weibo-back-btn"
            onClick={() => setSelectedHotSearch(null)}
            aria-label="返回"
          >
            ←
          </button>
          <div className="weibo-header-title">#{selectedHotSearch.keyword}</div>
          <div className="weibo-header-actions">
            <button
              className="weibo-icon-btn"
              onClick={async () => {
                // 检查该热搜是否已经在首页生成过
                const isHotSearchGenerated = hotSearches.some(hs => hs.id === selectedHotSearch.id);
                if (!isHotSearchGenerated) {
                  alert("请先在首页生成热搜标题！");
                  return;
                }

                // 生成该热搜的微博内容
                await handleGenerateSingleHotSearchContent(selectedHotSearch);
              }}
              aria-label="生成内容"
              title="生成内容"
              disabled={loadingHotSearchPosts}
              style={{ opacity: loadingHotSearchPosts ? 0.5 : 1 }}
            >
              {loadingHotSearchPosts ? "⏳" : "🔄"}
            </button>
          </div>
        </header>

        <main className="weibo-main">
          <div className="weibo-hot-search-detail">
            <div className="weibo-hot-search-detail-header">
              <h2>#{selectedHotSearch.keyword}</h2>
              {selectedHotSearch.hot && (
                <span
                  className="weibo-hot-search-tag"
                  style={{ color: getHotTagColor(selectedHotSearch.hot) }}
                >
                  {selectedHotSearch.hot}
                </span>
              )}
              {selectedHotSearch.count && (
                <div className="weibo-hot-search-detail-count">
                  {selectedHotSearch.count}万讨论
                </div>
              )}
            </div>

            {loadingHotSearchPosts && (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-sub)" }}>
                正在生成相关内容...
              </div>
            )}

            {!loadingHotSearchPosts && (
              <div className="weibo-posts">
                {(() => {
                  // 添加调试信息
                  if (!selectedHotSearch) {
                    console.log("渲染热搜详情页: selectedHotSearch为空");
                    return (
                      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-sub)" }}>
                        暂无相关内容
                      </div>
                    );
                  }

                  const postsForHotSearch = hotSearchPosts[selectedHotSearch.id];
                  console.log(`渲染热搜详情页，热搜ID: ${selectedHotSearch.id}, 关键词: ${selectedHotSearch.keyword}`);
                  console.log(`是否有内容:`, !!postsForHotSearch, `数量:`, postsForHotSearch?.length || 0);
                  console.log(`所有热搜IDs:`, Object.keys(hotSearchPosts));
                  console.log(`hotSearchPosts对象:`, hotSearchPosts);

                  if (!postsForHotSearch || postsForHotSearch.length === 0) {
                    return (
                      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-sub)" }}>
                        暂无相关内容（请先点击生成按钮生成内容）
                        <br />
                        <small style={{ fontSize: "12px", marginTop: "10px", display: "block" }}>
                          热搜ID: {selectedHotSearch.id}
                        </small>
                      </div>
                    );
                  }

                  return postsForHotSearch.map((post) => {
                    const postComments = (hotSearchComments[selectedHotSearch.id] && hotSearchComments[selectedHotSearch.id][post.id]) || [];
                    const isSelected = selectedPostId === post.id;

                    return (
                      <article
                        key={post.id}
                        className="weibo-post"
                        onClick={() => setSelectedPostId(isSelected ? null : post.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="weibo-post-header">
                          <div
                            className="weibo-post-avatar"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingUserId(post.user.name);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            {renderAvatar(post.user.avatar, post.user.name)}
                          </div>
                          <div className="weibo-post-user-info">
                            <div
                              className="weibo-post-user-name"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingUserId(post.user.name);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              {post.user.name}
                              {post.user.verified && (
                                <span className="weibo-verified-badge" title={post.user.verifiedType}>
                                  ✓
                                </span>
                              )}
                            </div>
                            <div className="weibo-post-meta">
                              <span className="weibo-post-time">{post.time}</span>
                              <span className="weibo-post-source">{post.source}</span>
                            </div>
                          </div>
                        </div>

                        <div className="weibo-post-content">
                          <p>{renderWeiboContent(post.content)}</p>
                        </div>

                        <div className="weibo-post-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className={`weibo-action-btn ${post.liked ? "weibo-action-btn-liked" : ""}`}
                            onClick={() => {
                              if (selectedHotSearch && hotSearchPosts[selectedHotSearch.id]) {
                                const updatedPosts = { ...hotSearchPosts };
                                updatedPosts[selectedHotSearch.id] = hotSearchPosts[selectedHotSearch.id].map(p =>
                                  p.id === post.id ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 } : p
                                );
                                setHotSearchPosts(updatedPosts);
                              }
                            }}
                          >
                            <span className="weibo-action-icon">❤️</span>
                            <span className="weibo-action-count">
                              {post.likeCount > 0 ? formatNumber(post.likeCount) : "赞"}
                            </span>
                          </button>
                          <button className="weibo-action-btn">
                            <span className="weibo-action-icon">💬</span>
                            <span className="weibo-action-count">
                              {post.commentCount > 0 ? formatNumber(post.commentCount) : "评论"}
                            </span>
                          </button>
                          <button className="weibo-action-btn">
                            <span className="weibo-action-icon">🔄</span>
                            <span className="weibo-action-count">
                              {post.repostCount > 0 ? formatNumber(post.repostCount) : "转发"}
                            </span>
                          </button>
                        </div>

                        {/* 展开的评论 */}
                        {isSelected && postComments.length > 0 && (
                          <div className="weibo-comments" onClick={(e) => e.stopPropagation()}>
                            <div className="weibo-comments-header">
                              <h3>评论 {postComments.length}</h3>
                            </div>
                            <div className="weibo-comments-list">
                              {postComments.map((comment) => (
                                <div key={comment.id} className="weibo-comment-item">
                                  <div className="weibo-comment-avatar">
                                    {renderAvatar(comment.user.avatar, comment.user.name)}
                                  </div>
                                  <div className="weibo-comment-content">
                                    <div className="weibo-comment-header">
                                      <span className="weibo-comment-user-name">
                                        {comment.user.name}
                                        {comment.user.verified && (
                                          <span className="weibo-verified-badge" title={comment.user.verifiedType}>
                                            ✓
                                          </span>
                                        )}
                                      </span>
                                      <span className="weibo-comment-time">{comment.time}</span>
                                    </div>
                                    <div className="weibo-comment-text">{renderWeiboContent(comment.content)}</div>
                                    <div className="weibo-comment-actions">
                                      <button
                                        className={`weibo-comment-action-btn ${comment.liked ? "weibo-comment-action-btn-liked" : ""}`}
                                        onClick={() => {
                                          const updatedComments = postComments.map(c =>
                                            c.id === comment.id ? { ...c, liked: !c.liked, likeCount: c.liked ? c.likeCount - 1 : c.likeCount + 1 } : c
                                          );
                                          if (selectedHotSearch && hotSearchComments[selectedHotSearch.id]) {
                                            const updatedAllComments = { ...hotSearchComments };
                                            updatedAllComments[selectedHotSearch.id] = {
                                              ...hotSearchComments[selectedHotSearch.id],
                                              [post.id]: updatedComments
                                            };
                                            setHotSearchComments(updatedAllComments);
                                          }
                                        }}
                                      >
                                        <span className="weibo-comment-action-icon">❤️</span>
                                        <span className="weibo-comment-action-count">
                                          {comment.likeCount > 0 ? comment.likeCount : ""}
                                        </span>
                                      </button>
                                      <button className="weibo-comment-action-btn">
                                        <span className="weibo-comment-action-icon">💬</span>
                                        <span>回复</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // 如果选中了微博，显示详情页
  if (selectedPost) {
    return (
      <div className="weibo-screen">
        <header className="weibo-header">
          <button
            className="weibo-back-btn"
            onClick={() => setSelectedPostId(null)}
            aria-label="返回"
          >
            ←
          </button>
          <div className="weibo-header-title">微博正文</div>
          <div className="weibo-header-actions"></div>
        </header>

        <main className="weibo-main">
          <div className="weibo-detail">
            {/* 微博内容 */}
            <article className="weibo-detail-post">
              <div className="weibo-post-header">
                <div
                  className="weibo-post-avatar"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPostId(null);
                    setViewingUserId(selectedPost.user.name);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {renderAvatar(selectedPost.user.avatar, selectedPost.user.name)}
                </div>
                <div className="weibo-post-user-info">
                  <div
                    className="weibo-post-user-name"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPostId(null);
                      setViewingUserId(selectedPost.user.name);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {selectedPost.user.name}
                    {selectedPost.user.verified && (
                      <span className="weibo-verified-badge" title={selectedPost.user.verifiedType}>
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="weibo-post-meta">
                    {selectedPost.time} · {selectedPost.source}
                  </div>
                </div>
                <button className="weibo-post-more-btn" aria-label="更多">
                  ⋮
                </button>
              </div>

              <div className="weibo-post-content">
                {selectedPost.reposted ? (
                  <div className="weibo-repost">
                    <div className="weibo-repost-header">
                      <span className="weibo-repost-user">{selectedPost.reposted.user.name}</span>
                      <span className="weibo-repost-content">{renderWeiboContent(selectedPost.reposted.content)}</span>
                    </div>
                  </div>
                ) : (
                  <p>{renderWeiboContent(selectedPost.content)}</p>
                )}
                {selectedPost.images && selectedPost.images.length > 0 && (
                  <div className="weibo-post-images">
                    {selectedPost.images.map((img, idx) => (
                      <img key={idx} src={img} alt={`图片${idx + 1}`} />
                    ))}
                  </div>
                )}
              </div>

              <div className="weibo-post-actions">
                <button
                  className={`weibo-action-btn ${selectedPost.liked ? "weibo-action-btn-liked" : ""}`}
                  onClick={() => handleLike(selectedPost.id)}
                >
                  <span className="weibo-action-icon">❤️</span>
                  <span className="weibo-action-count">
                    {selectedPost.likeCount > 0 ? formatNumber(selectedPost.likeCount) : "赞"}
                  </span>
                </button>
                <button className="weibo-action-btn">
                  <span className="weibo-action-icon">💬</span>
                  <span className="weibo-action-count">
                    {selectedPost.commentCount > 0 ? formatNumber(selectedPost.commentCount) : "评论"}
                  </span>
                </button>
                <button className="weibo-action-btn">
                  <span className="weibo-action-icon">🔄</span>
                  <span className="weibo-action-count">
                    {selectedPost.repostCount > 0 ? formatNumber(selectedPost.repostCount) : "转发"}
                  </span>
                </button>
              </div>
            </article>

            {/* 评论区 */}
            <div className="weibo-comments">
              <div className="weibo-comments-header">
                <h3>评论 {selectedPostComments.length}</h3>
              </div>
              <div className="weibo-comments-list">
                {selectedPostComments.length === 0 ? (
                  <div className="weibo-comments-empty">暂无评论，快来抢沙发吧~</div>
                ) : (
                  selectedPostComments.map((comment) => (
                    <div key={comment.id} className="weibo-comment-item">
                      <div className="weibo-comment-avatar">
                        {renderAvatar(comment.user.avatar, comment.user.name)}
                      </div>
                      <div className="weibo-comment-content">
                        <div className="weibo-comment-header">
                          <span className="weibo-comment-user-name">
                            {comment.user.name}
                            {comment.user.verified && (
                              <span className="weibo-verified-badge" title={comment.user.verifiedType}>
                                ✓
                              </span>
                            )}
                          </span>
                          <span className="weibo-comment-time">{comment.time}</span>
                        </div>
                        <div className="weibo-comment-text">{renderWeiboContent(comment.content)}</div>
                        <div className="weibo-comment-actions">
                          <button
                            className={`weibo-comment-action-btn ${comment.liked ? "weibo-comment-action-btn-liked" : ""}`}
                            onClick={() => handleCommentLike(selectedPost.id, comment.id)}
                          >
                            <span className="weibo-comment-action-icon">❤️</span>
                            <span className="weibo-comment-action-count">
                              {comment.likeCount > 0 ? comment.likeCount : ""}
                            </span>
                          </button>
                          <button className="weibo-comment-action-btn">
                            <span className="weibo-comment-action-icon">💬</span>
                            <span>回复</span>
                          </button>
                        </div>
                        {/* 回复评论 */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="weibo-comment-replies">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="weibo-comment-reply-item">
                                <div className="weibo-comment-avatar weibo-comment-avatar-small">
                                  {renderAvatar(reply.user.avatar, reply.user.name)}
                                </div>
                                <div className="weibo-comment-content">
                                  <div className="weibo-comment-header">
                                    <span className="weibo-comment-user-name">
                                      {reply.user.name}
                                      {reply.user.verified && (
                                        <span className="weibo-verified-badge" title={reply.user.verifiedType}>
                                          ✓
                                        </span>
                                      )}
                                    </span>
                                    <span className="weibo-comment-time">{reply.time}</span>
                                  </div>
                                  <div className="weibo-comment-text">{renderWeiboContent(reply.content)}</div>
                                  <div className="weibo-comment-actions">
                                    <button
                                      className={`weibo-comment-action-btn ${reply.liked ? "weibo-comment-action-btn-liked" : ""}`}
                                      onClick={() => handleCommentLike(selectedPost.id, reply.id)}
                                    >
                                      <span className="weibo-comment-action-icon">❤️</span>
                                      <span className="weibo-comment-action-count">
                                        {reply.likeCount > 0 ? reply.likeCount : ""}
                                      </span>
                                    </button>
                                    <button className="weibo-comment-action-btn">
                                      <span className="weibo-comment-action-icon">💬</span>
                                      <span>回复</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="weibo-screen">
      {/* 顶部导航栏 */}
      <header className="weibo-header">
        <button className="weibo-back-btn" onClick={onBackHome} aria-label="返回">
          ←
        </button>
        <div className="weibo-header-title">
          {activeTab === "home" && "首页"}
          {activeTab === "hot" && "热搜"}
          {activeTab === "discover" && "发现"}
          {activeTab === "me" && "我"}
        </div>
        <div className="weibo-header-actions">
          {activeTab === "home" && (
            <>
              <button
                className="weibo-icon-btn"
                onClick={handleGenerateContent}
                aria-label="生成内容"
                title="生成内容"
                disabled={loadingPosts || loadingHotSearches}
                style={{ marginRight: "8px", opacity: (loadingPosts || loadingHotSearches) ? 0.5 : 1 }}
              >
                {loadingPosts || loadingHotSearches ? "⏳" : "🔄"}
              </button>
              <button
                className="weibo-icon-btn"
                onClick={() => setSelectedCharacterId(null)}
                aria-label="切换角色"
                title="切换角色"
              >
                👤
              </button>
            </>
          )}
          {activeTab === "me" && (
            <button className="weibo-icon-btn" aria-label="设置">
              ⚙️
            </button>
          )}
        </div>
      </header>

      {/* 主内容区 */}
      <main className="weibo-main">
        {activeTab === "home" && (
          <div className="weibo-feed">
            {/* 热搜入口 */}
            <div className="weibo-hot-entry">
              <div className="weibo-hot-entry-title">🔥 热搜</div>
              <div className="weibo-hot-entry-list">
                {hotSearches.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    className="weibo-hot-entry-item"
                    onClick={() => setSelectedHotSearch(item)}
                    style={{ cursor: "pointer" }}
                  >
                    {item.keyword}
                  </span>
                ))}
              </div>
              <button
                className="weibo-hot-entry-more"
                onClick={() => setActiveTab("hot")}
              >
                更多 →
              </button>
            </div>

            {/* 微博列表 */}
            <div className="weibo-posts">
              {loadingPosts && (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-sub)" }}>
                  正在生成微博内容...
                </div>
              )}
              {!loadingPosts && posts.map((post) => (
                <article
                  key={post.id}
                  className="weibo-post"
                  onClick={() => setSelectedPostId(post.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="weibo-post-header">
                    <div
                      className="weibo-post-avatar"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingUserId(post.user.name);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {renderAvatar(post.user.avatar, post.user.name)}
                    </div>
                    <div className="weibo-post-user-info">
                      <div
                        className="weibo-post-user-name"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingUserId(post.user.name);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {post.user.name}
                        {post.user.verified && (
                          <span className="weibo-verified-badge" title={post.user.verifiedType}>
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="weibo-post-meta">
                        {post.time} · {post.source}
                      </div>
                    </div>
                    <button className="weibo-post-more-btn" aria-label="更多">
                      ⋮
                    </button>
                  </div>

                  <div className="weibo-post-content">
                    {post.reposted ? (
                      <div className="weibo-repost">
                        <div className="weibo-repost-header">
                          <span className="weibo-repost-user">{post.reposted.user.name}</span>
                          <span className="weibo-repost-content">{renderWeiboContent(post.reposted.content)}</span>
                        </div>
                      </div>
                    ) : (
                      <p>{renderWeiboContent(post.content)}</p>
                    )}
                    {post.images && post.images.length > 0 && (
                      <div className="weibo-post-images">
                        {post.images.map((img, idx) => (
                          <img key={idx} src={img} alt={`图片${idx + 1}`} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="weibo-post-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`weibo-action-btn ${post.liked ? "weibo-action-btn-liked" : ""}`}
                      onClick={() => handleLike(post.id)}
                    >
                      <span className="weibo-action-icon">❤️</span>
                      <span className="weibo-action-count">
                        {post.likeCount > 0 ? formatNumber(post.likeCount) : "赞"}
                      </span>
                    </button>
                    <button className="weibo-action-btn">
                      <span className="weibo-action-icon">💬</span>
                      <span className="weibo-action-count">
                        {post.commentCount > 0 ? formatNumber(post.commentCount) : "评论"}
                      </span>
                    </button>
                    <button className="weibo-action-btn">
                      <span className="weibo-action-icon">🔄</span>
                      <span className="weibo-action-count">
                        {post.repostCount > 0 ? formatNumber(post.repostCount) : "转发"}
                      </span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === "hot" && (
          <div className="weibo-hot-search">
            <div className="weibo-hot-search-header">
              <h2>热搜榜</h2>
              <div className="weibo-hot-search-update">更新时间：刚刚</div>
            </div>
            {loadingHotSearches && (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-sub)" }}>
                正在生成热搜内容...
              </div>
            )}
            {!loadingHotSearches && (
              <div className="weibo-hot-search-list">
                {hotSearches.map((item) => (
                  <div
                    key={item.id}
                    className="weibo-hot-search-item"
                    onClick={() => setSelectedHotSearch(item)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="weibo-hot-search-rank">{item.rank}</div>
                    <div className="weibo-hot-search-content">
                      <div className="weibo-hot-search-keyword">
                        {item.keyword}
                        {item.hot && (
                          <span
                            className="weibo-hot-search-tag"
                            style={{ color: getHotTagColor(item.hot) }}
                          >
                            {item.hot}
                          </span>
                        )}
                      </div>
                      {item.count && (
                        <div className="weibo-hot-search-count">
                          {item.count}万讨论
                        </div>
                      )}
                    </div>
                    <div className="weibo-hot-search-arrow">→</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "discover" && (
          <div className="weibo-discover">
            {/* 搜索栏 */}
            <div className="weibo-discover-search" style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="搜索微博、用户、话题..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      handleSearch(searchQuery.trim());
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "20px",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: "var(--bg-secondary)"
                  }}
                />
                <button
                  onClick={() => {
                    if (searchQuery.trim()) {
                      handleSearch(searchQuery.trim());
                    }
                  }}
                  disabled={!searchQuery.trim() || loadingSearch}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "20px",
                    backgroundColor: "var(--primary-color)",
                    color: "white",
                    fontSize: "14px",
                    cursor: searchQuery.trim() && !loadingSearch ? "pointer" : "not-allowed",
                    opacity: searchQuery.trim() && !loadingSearch ? 1 : 0.5
                  }}
                >
                  搜索
                </button>
              </div>
            </div>

            <div className="weibo-discover-section">
              <h3>热门话题</h3>
              <div className="weibo-discover-topics">
                {hotSearches.slice(0, 6).map((item) => (
                  <div key={item.id} className="weibo-discover-topic">
                    #{item.keyword}
                  </div>
                ))}
              </div>
            </div>
            <div className="weibo-discover-section">
              <h3>推荐关注</h3>
              <div className="weibo-discover-recommendations">
                {posts.slice(0, 3).map((post) => (
                  <div key={post.id} className="weibo-discover-user">
                    <div className="weibo-discover-user-avatar">
                      {renderAvatar(post.user.avatar, post.user.name)}
                    </div>
                    <div className="weibo-discover-user-info">
                      <div className="weibo-discover-user-name">{post.user.name}</div>
                      <div className="weibo-discover-user-desc">推荐关注</div>
                    </div>
                    <button className="weibo-discover-follow-btn">关注</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "me" && (
          <div className="weibo-profile">
            <div className="weibo-profile-header">
              <div className="weibo-profile-bg"></div>
              <div className="weibo-profile-info">
                <div className="weibo-profile-avatar">{userProfile.avatar}</div>
                <div className="weibo-profile-name">
                  {userProfile.name}
                  {userProfile.verified && (
                    <span className="weibo-verified-badge" title={userProfile.verifiedType}>
                      ✓
                    </span>
                  )}
                </div>
                <div className="weibo-profile-nickname">{userProfile.nickname}</div>
                <div className="weibo-profile-bio">{userProfile.bio}</div>
              </div>
            </div>

            <div className="weibo-profile-stats">
              <div
                className="weibo-profile-stat-item"
                onClick={() => setShowFollowingList(true)}
                style={{ cursor: "pointer" }}
              >
                <div className="weibo-profile-stat-number">{userProfile.following}</div>
                <div className="weibo-profile-stat-label">关注</div>
              </div>
              <div
                className="weibo-profile-stat-item"
                onClick={() => setShowFollowersList(true)}
                style={{ cursor: "pointer" }}
              >
                <div className="weibo-profile-stat-number">{userProfile.followers}</div>
                <div className="weibo-profile-stat-label">粉丝</div>
              </div>
              <div className="weibo-profile-stat-item">
                <div className="weibo-profile-stat-number">{formatNumber(userProfile.likes)}</div>
                <div className="weibo-profile-stat-label">获赞</div>
              </div>
            </div>

            <div className="weibo-profile-menu">
              <button className="weibo-profile-menu-item">
                <span className="weibo-profile-menu-icon">📝</span>
                <span className="weibo-profile-menu-text">我的微博</span>
                <span className="weibo-profile-menu-arrow">→</span>
              </button>
              <button className="weibo-profile-menu-item">
                <span className="weibo-profile-menu-icon">⭐</span>
                <span className="weibo-profile-menu-text">我的收藏</span>
                <span className="weibo-profile-menu-arrow">→</span>
              </button>
              <button
                className="weibo-profile-menu-item"
                onClick={() => setShowFollowingList(true)}
              >
                <span className="weibo-profile-menu-icon">👥</span>
                <span className="weibo-profile-menu-text">我的关注</span>
                <span className="weibo-profile-menu-arrow">→</span>
              </button>
              <button className="weibo-profile-menu-item">
                <span className="weibo-profile-menu-icon">⚙️</span>
                <span className="weibo-profile-menu-text">设置</span>
                <span className="weibo-profile-menu-arrow">→</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 底部导航栏 */}
      <footer className="weibo-footer">
        <button
          className={`weibo-footer-tab ${activeTab === "home" ? "weibo-footer-tab-active" : ""}`}
          onClick={() => setActiveTab("home")}
        >
          <span className="weibo-footer-tab-icon">🏠</span>
          <span className="weibo-footer-tab-label">首页</span>
        </button>
        <button
          className={`weibo-footer-tab ${activeTab === "hot" ? "weibo-footer-tab-active" : ""}`}
          onClick={() => setActiveTab("hot")}
        >
          <span className="weibo-footer-tab-icon">🔥</span>
          <span className="weibo-footer-tab-label">热搜</span>
        </button>
        <button
          className={`weibo-footer-tab ${activeTab === "discover" ? "weibo-footer-tab-active" : ""}`}
          onClick={() => setActiveTab("discover")}
        >
          <span className="weibo-footer-tab-icon">🔍</span>
          <span className="weibo-footer-tab-label">发现</span>
        </button>
        <button
          className={`weibo-footer-tab ${activeTab === "me" ? "weibo-footer-tab-active" : ""}`}
          onClick={() => setActiveTab("me")}
        >
          <span className="weibo-footer-tab-icon">👤</span>
          <span className="weibo-footer-tab-label">我</span>
        </button>
      </footer>
    </div>
  );
};


