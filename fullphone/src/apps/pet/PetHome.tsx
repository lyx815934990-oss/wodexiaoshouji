import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ImageBackgroundRemover } from "../tools/ImageBackgroundRemover";

const STORAGE_KEY = "miniOtomePhone_petGame_v1";

type PetKind = "slime" | "cat" | "dragon";

interface PetState {
  kind: PetKind;
  name: string;
  level: number;
  exp: number;
  nextLevelExp: number;
  mood: "happy" | "normal" | "sad" | "sleepy";
  hunger: number; // 0-100，越高越饿
  clean: number; // 0-100，越高越干净
  energy: number; // 0-100，越高越有精神
  evolutionStage: 1 | 2 | 3;
  lastUpdated: number;
}

interface SpeechMessage {
  id: string;
  from: "pet" | "role";
  kind: "text" | "voice";
  text: string;
  roleName?: string;
}

const defaultPet: PetState = {
  kind: "slime",
  name: "小软软",
  level: 1,
  exp: 0,
  nextLevelExp: 30,
  mood: "happy",
  hunger: 20,
  clean: 80,
  energy: 80,
  evolutionStage: 1,
  lastUpdated: Date.now()
};

function loadPetState(): PetState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PetState> & { kind?: string };
    if (!parsed || typeof parsed.level !== "number") return null;
    return {
      ...defaultPet,
      ...parsed,
      kind: (parsed.kind as PetKind) ?? "slime"
    };
  } catch {
    return null;
  }
}

function savePetState(state: PetState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function getMood(hunger: number, clean: number, energy: number): PetState["mood"] {
  if (energy < 25) return "sleepy";
  if (hunger > 70 || clean < 30) return "sad";
  if (hunger > 45 || clean < 55) return "normal";
  return "happy";
}

function evolveIfNeeded(state: PetState): PetState {
  let { level, evolutionStage } = state;
  if (level >= 15) {
    evolutionStage = 3;
  } else if (level >= 7) {
    evolutionStage = 2;
  } else {
    evolutionStage = 1;
  }
  return { ...state, evolutionStage };
}

// 自动背景移除的图片组件
const AutoBackgroundRemovedImage: FC<{
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ src, alt, className, style }) => {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // 计算两个颜色的距离
  const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number => {
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  };

  useEffect(() => {
    // 检查 localStorage 中是否有缓存
    const cacheKey = `pet_image_processed_${src}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setProcessedSrc(cached);
      return;
    }

    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 改进的边缘采样法：只采样真正的边缘区域，避免采样到主体
      const edgeColors: Array<{ r: number; g: number; b: number; count: number }> = [];
      const sampleCount = 12;
      const edgeThickness = 3; // 边缘厚度

      // 采样四个角落和边缘中间区域
      const corners = [
        { x: 0, y: 0 }, // 左上
        { x: canvas.width - 1, y: 0 }, // 右上
        { x: 0, y: canvas.height - 1 }, // 左下
        { x: canvas.width - 1, y: canvas.height - 1 } // 右下
      ];

      // 采样角落区域
      corners.forEach(corner => {
        for (let dy = 0; dy < edgeThickness; dy++) {
          for (let dx = 0; dx < edgeThickness; dx++) {
            const x = Math.min(canvas.width - 1, corner.x + dx);
            const y = Math.min(canvas.height - 1, corner.y + dy);
            const idx = (y * canvas.width + x) * 4;
            edgeColors.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2], count: 1 });
          }
        }
      });

      // 采样边缘中间区域（避免采样到主体）
      const edgeMargin = Math.min(canvas.width, canvas.height) * 0.1; // 边缘10%区域
      for (let i = 0; i < sampleCount; i++) {
        const t = i / sampleCount;
        // 上边缘中间
        const x1 = Math.floor(edgeMargin + t * (canvas.width - 2 * edgeMargin));
        const idx1 = (0 * canvas.width + x1) * 4;
        edgeColors.push({ r: data[idx1], g: data[idx1 + 1], b: data[idx1 + 2], count: 1 });
        // 下边缘中间
        const idx2 = ((canvas.height - 1) * canvas.width + x1) * 4;
        edgeColors.push({ r: data[idx2], g: data[idx2 + 1], b: data[idx2 + 2], count: 1 });
      }

      // 计算平均背景色（加权平均）
      let totalR = 0, totalG = 0, totalB = 0, totalCount = 0;
      edgeColors.forEach(c => {
        totalR += c.r * c.count;
        totalG += c.g * c.count;
        totalB += c.b * c.count;
        totalCount += c.count;
      });
      const avgR = Math.round(totalR / totalCount);
      const avgG = Math.round(totalG / totalCount);
      const avgB = Math.round(totalB / totalCount);

      // 使用更保守的容差值，避免移除主体内的浅色区域
      const tolerance = 25; // 降低容差值，更保守

      // 创建标记数组，用于连通性检测
      const visited = new Uint8Array(canvas.width * canvas.height);
      const shouldRemove = new Uint8Array(canvas.width * canvas.height);

      // 第一遍：标记所有可能是背景的像素
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const distance = colorDistance(r, g, b, avgR, avgG, avgB);

          // 只在边缘区域或颜色非常接近背景色时才标记为可移除
          const isEdge = x < edgeMargin || x > canvas.width - edgeMargin ||
            y < edgeMargin || y > canvas.height - edgeMargin;

          if (distance < tolerance && (isEdge || distance < tolerance * 0.6)) {
            shouldRemove[y * canvas.width + x] = 1;
          }
        }
      }

      // 移除右下角水印区域（右下角10%x10%的区域）
      const watermarkArea = {
        x: Math.floor(canvas.width * 0.9),
        y: Math.floor(canvas.height * 0.9),
        width: canvas.width - Math.floor(canvas.width * 0.9),
        height: canvas.height - Math.floor(canvas.height * 0.9)
      };

      for (let y = watermarkArea.y; y < canvas.height; y++) {
        for (let x = watermarkArea.x; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          // 检测是否为水印（通常是半透明或浅色的文字/图案）
          const alpha = data[idx + 3];
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // 如果像素是半透明或颜色接近背景，移除它
          if (alpha < 200 || colorDistance(r, g, b, avgR, avgG, avgB) < tolerance * 1.5) {
            data[idx + 3] = 0; // 设为透明
          }
        }
      }

      // 应用背景移除（只移除边缘区域的背景色）
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          if (shouldRemove[y * canvas.width + x]) {
            const idx = (y * canvas.width + x) * 4;
            data[idx + 3] = 0; // 设为透明
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const processedDataUrl = canvas.toDataURL("image/png");

      // 缓存处理后的图片
      try {
        localStorage.setItem(cacheKey, processedDataUrl);
      } catch {
        // 如果缓存失败（可能超出大小限制），忽略
      }

      setProcessedSrc(processedDataUrl);
      setIsProcessing(false);
    };

    img.onerror = () => {
      setIsProcessing(false);
      // 如果处理失败，使用原图
      setProcessedSrc(src);
    };

    img.src = src;
    imgRef.current = img;
  }, [src]);

  // 如果正在处理，显示原图；处理完成后显示处理后的图片
  const displaySrc = processedSrc || src;

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: isProcessing ? 0.7 : 1,
        transition: "opacity 0.3s ease"
      }}
    />
  );
};

const PetSprite: FC<{
  kind: PetKind;
  stage: PetState["evolutionStage"];
  mood: PetState["mood"];
}> = ({ kind, stage }) => {
  const title = useMemo(() => {
    const base =
      kind === "cat" ? "像小猫一样的心宠" : kind === "dragon" ? "有点傲娇的小龙崽" : "软软的史莱姆";
    return `${base} · ${stage === 1 ? "初遇" : stage === 2 ? "陪伴" : "共鸣"}阶段`;
  }, [kind, stage]);

  const sprite = useMemo(() => {
    if (kind === "cat") {
      // 根据进化阶段显示不同的猫咪图片
      // 使用 public 目录下的图片，如果不存在则回退到 SVG
      const catImages: Record<1 | 2 | 3, string> = {
        1: "/pet-images/cat-stage1.png",
        2: "/pet-images/cat-stage2.png",
        3: "/pet-images/cat-stage3.png"
      };

      return (
        <AutoBackgroundRemovedImage
          src={catImages[stage]}
          alt="猫咪宠物"
          className="pet-sprite-img"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            imageRendering: "pixelated",
            background: "transparent",
            display: "block"
          }}
        />
      );
    }

    if (kind === "dragon") {
      return (
        <svg
          viewBox="0 0 16 16"
          className="pet-sprite-svg"
          aria-hidden="true"
        >
          {/* 翅膀 */}
          <rect x="1" y="7" width="3" height="3" fill="#bfdbfe" />
          <rect x="12" y="7" width="3" height="3" fill="#bfdbfe" />
          {/* 头+身 */}
          <rect x="4" y="3" width="8" height="9" fill="#93c5fd" />
          {/* 角 */}
          <rect x="5" y="1" width="1" height="2" fill="#e5e7eb" />
          <rect x="10" y="1" width="1" height="2" fill="#e5e7eb" />
          {/* 眼睛 */}
          <rect x="6" y="6" width="1" height="1" fill="#0f172a" />
          <rect x="9" y="6" width="1" height="1" fill="#0f172a" />
          {/* 肚皮 */}
          <rect x="6" y="8" width="4" height="3" fill="#e5e7eb" />
          <rect x="6" y="9" width="4" height="1" fill="#d1d5db" />
          {/* 尾巴 */}
          <rect x="11" y="11" width="2" height="1" fill="#60a5fa" />
          <rect x="12" y="12" width="1" height="1" fill="#2563eb" />
        </svg>
      );
    }

    // slime
    return (
      <svg
        viewBox="0 0 16 16"
        className="pet-sprite-svg"
        aria-hidden="true"
      >
        {/* 主体 */}
        <rect x="3" y="4" width="10" height="8" fill="#bbf7d0" />
        <rect x="4" y="3" width="8" height="2" fill="#a7f3d0" />
        {/* 高光 */}
        <rect x="5" y="4" width="2" height="1" fill="#ecfdf5" />
        <rect x="10" y="5" width="1" height="1" fill="#ecfdf5" />
        {/* 眼睛 */}
        <rect x="6" y="7" width="1" height="1" fill="#064e3b" />
        <rect x="9" y="7" width="1" height="1" fill="#064e3b" />
        {/* 嘴巴 */}
        <rect x="7" y="9" width="2" height="1" fill="#16a34a" />
      </svg>
    );
  }, [kind]);

  return (
    <div className="pet-avatar-emoji" aria-label={title}>
      {sprite}
    </div>
  );
};

const StatBar: FC<{
  label: string;
  value: number;
  color: "pink" | "blue" | "green";
}> = ({ label, value, color }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="pet-stat-row">
      <span className="pet-stat-label">{label}</span>
      <div className={`pet-stat-bar pet-stat-bar-${color}`}>
        <div className="pet-stat-bar-inner" style={{ width: `${clamped}%` }} />
      </div>
      <span className="pet-stat-value">{Math.round(clamped)}</span>
    </div>
  );
};

interface PetHomeProps {
  onBackHome: () => void;
}

export const PetHome: FC<PetHomeProps> = ({ onBackHome }) => {
  const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const [pet, setPet] = useState<PetState | null>(() => loadPetState());
  const [stage, setStage] = useState<"choose" | "name" | "play">(() =>
    loadPetState() ? "play" : "choose"
  );
  const [selectedKind, setSelectedKind] = useState<PetKind | null>(null);
  const [tempName, setTempName] = useState("小软软");
  const [log, setLog] = useState<string[]>([]);
  const [speech, setSpeech] = useState<SpeechMessage | null>(null);
  const [showImageTool, setShowImageTool] = useState(false);

  const speakFromPet = (text: string, kind: SpeechMessage["kind"] = "text") => {
    setSpeech({
      id: genId(),
      from: "pet",
      kind,
      text
    });
  };

  const speakFromRole = (text: string, roleName: string, kind: SpeechMessage["kind"] = "voice") => {
    setSpeech({
      id: genId(),
      from: "role",
      kind,
      text,
      roleName
    });
  };

  const randomPetLine = (state: PetState): string => {
    const base: string[] = [];
    if (state.hunger > 70) {
      base.push("我有一点点饿了，但可以再等等你忙完。");
    } else if (state.clean < 40) {
      base.push("刚刚在草地上滚得有点脏了，你会帮我洗洗吗？");
    } else if (state.energy < 30) {
      base.push("有点困了，可以靠在你这边慢慢打瞌睡吗？");
    } else if (state.mood === "happy") {
      base.push("今天在草原上跑来跑去，感觉每一格像素都好亮。");
    } else {
      base.push("我一直在这个小小的窗口里等你点我。");
    }

    base.push(
      "你戳到我了，那是不是可以顺便抱一抱？",
      "被你这么盯着看，会有点害羞……但也很开心。",
      "如果有一天你不开心，也可以来这里躲一会儿，我会一直在。"
    );

    const idx = Math.floor(Math.random() * base.length);
    return base[idx];
  };

  // 持续时间流逝逻辑：每隔一段时间微调饥饿/清洁/能量
  useEffect(() => {
    const id = window.setInterval(() => {
      setPet((prev) => {
        if (!prev) return prev;
        const now = Date.now();
        const elapsedMinutes = Math.min(60, (now - prev.lastUpdated) / 60000);
        if (elapsedMinutes < 0.1) return prev;

        let hunger = prev.hunger + elapsedMinutes * 1.2;
        let clean = prev.clean - elapsedMinutes * 0.8;
        let energy = prev.energy - elapsedMinutes * 0.9;

        hunger = Math.max(0, Math.min(100, hunger));
        clean = Math.max(0, Math.min(100, clean));
        energy = Math.max(0, Math.min(100, energy));

        let next = {
          ...prev,
          hunger,
          clean,
          energy,
          mood: getMood(hunger, clean, energy),
          lastUpdated: now
        };
        next = evolveIfNeeded(next);
        savePetState(next);

        // 偶尔在后台自己说两句像素宠物会说的话
        const chance = Math.random();
        if (chance < 0.3) {
          if (hunger > 70) {
            speakFromPet("有点饿了……你忙完了吗？可以顺手喂我一小口就好。");
          } else if (clean < 40) {
            speakFromPet("感觉身上有一点点黏黏的，想要泡泡澡泡很久那种。");
          } else if (energy < 35) {
            speakFromPet("今天有点累了，可以一起早点睡吗？我会乖乖躺好。");
          } else if (next.mood === "happy") {
            speakFromPet("我刚刚自己在小小像素世界里转了一圈，又回来看你了。");
          } else {
            speakFromPet("我一直在这里等你，有空就来戳戳我一下吧。");
          }
        }

        return next;
      });
    }, 60_000);

    return () => window.clearInterval(id);
  }, []);

  const pushLog = (text: string) => {
    setLog((prev) => {
      const next = [text, ...prev];
      return next.slice(0, 20);
    });
  };

  const createPet = (kind: PetKind, name: string): PetState => {
    const now = Date.now();
    const safeName = name.trim() || (kind === "dragon" ? "小炽" : kind === "cat" ? "小喵" : "小软软");

    let hunger = 20;
    let clean = 80;
    let energy = 80;

    if (kind === "cat") {
      hunger = 25;
      clean = 70;
      energy = 85;
    } else if (kind === "dragon") {
      hunger = 30;
      clean = 75;
      energy = 70;
    }

    return {
      ...defaultPet,
      kind,
      name: safeName,
      hunger,
      clean,
      energy,
      lastUpdated: now
    };
  };

  const handleChooseKind = (kind: PetKind) => {
    setSelectedKind(kind);
    setTempName(kind === "dragon" ? "小炽" : kind === "cat" ? "小喵" : "小软软");
    setStage("name");
  };

  const handleConfirmName = () => {
    if (!selectedKind) return;
    const newPet = createPet(selectedKind, tempName);
    setPet(newPet);
    savePetState(newPet);
    pushLog(`✧ ${newPet.name} 来到你的手机里啦，好好照顾它吧。`);
    speakFromPet(`初次见面，我叫「${newPet.name}」，以后就住在这块小小像素屏里啦。`);
    setStage("play");
  };

  const handleResetPet = () => {
    setPet(null);
    setSelectedKind(null);
    setTempName("小软软");
    setStage("choose");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const addExp = (delta: number) => {
    setPet((prev) => {
      if (!prev) return prev;
      let { level, exp, nextLevelExp } = prev;
      exp += delta;
      let leveledUp = false;

      while (exp >= nextLevelExp) {
        exp -= nextLevelExp;
        level += 1;
        nextLevelExp = Math.round(nextLevelExp * 1.35 + 10);
        leveledUp = true;
      }

      let next = {
        ...prev,
        level,
        exp,
        nextLevelExp,
        mood: getMood(prev.hunger, prev.clean, prev.energy),
        lastUpdated: Date.now()
      };
      next = evolveIfNeeded(next);
      savePetState(next);

      if (leveledUp) {
        pushLog(`✧ 恭喜，${next.name} 升到 Lv.${next.level} 啦！`);
      }
      return next;
    });
  };

  const handleFeed = () => {
    setPet((prev) => {
      if (!prev) return prev;
      const hunger = Math.max(0, prev.hunger - 28);
      const energy = Math.min(100, prev.energy + 8);
      let next: PetState = {
        ...prev,
        hunger,
        energy,
        mood: getMood(hunger, prev.clean, energy),
        lastUpdated: Date.now()
      };
      next = evolveIfNeeded(next);
      savePetState(next);
      return next;
    });
    addExp(8);
    pushLog("🍰 你喂了心宠一小块点心，它眯起眼睛蹭了蹭你的手。");
    speakFromPet("好甜……下次也分你一口，我们一起慢慢吃。");
  };

  const handleClean = () => {
    setPet((prev) => {
      if (!prev) return prev;
      const clean = Math.min(100, prev.clean + 30);
      let next: PetState = {
        ...prev,
        clean,
        hunger: Math.min(100, prev.hunger + 5),
        mood: getMood(prev.hunger + 5, clean, prev.energy),
        lastUpdated: Date.now()
      };
      next = evolveIfNeeded(next);
      savePetState(next);
      return next;
    });
    addExp(6);
    pushLog("🫧 你帮心宠洗了个泡泡澡，它在水里转了两圈，毛茸茸的像一团云。");
    speakFromPet("泡泡好软，我是不是现在闻起来也很好闻？要不要靠近一点闻闻看。");
  };

  const handlePlay = () => {
    setPet((prev) => {
      if (!prev) return prev;
      const energy = Math.max(0, prev.energy - 12);
      const hunger = Math.min(100, prev.hunger + 10);
      let next: PetState = {
        ...prev,
        energy,
        hunger,
        clean: Math.max(0, prev.clean - 8),
        mood: getMood(hunger, prev.clean - 8, energy),
        lastUpdated: Date.now()
      };
      next = evolveIfNeeded(next);
      savePetState(next);
      return next;
    });
    addExp(10);
    pushLog("🎀 你挥了挥小逗猫棒，心宠追着彩绳绕了好几圈，尾巴开心得摇来摇去。");
    speakFromPet("再抖一抖那根小绳子！我还可以再追一轮，真的完全不累。");
  };

  const handleRest = () => {
    setPet((prev) => {
      if (!prev) return prev;
      const energy = Math.min(100, prev.energy + 30);
      const hunger = Math.min(100, prev.hunger + 12);
      let next: PetState = {
        ...prev,
        energy,
        hunger,
        mood: getMood(hunger, prev.clean, energy),
        lastUpdated: Date.now()
      };
      next = evolveIfNeeded(next);
      savePetState(next);
      return next;
    });
    addExp(4);
    pushLog("🌙 你把心宠安置在软乎乎的小窝里，它蜷成一团，很快就睡着了。");
    speakFromPet("那我先睡一会儿，你要记得也好好休息，我们明天再继续玩。", "voice");
  };

  const handleRoleCare = () => {
    if (!pet) return;
    pushLog("🎧 今天换成角色来照顾心宠，它们在像素世界里小声说了很久的话。");
    speakFromRole(
      "喂完它我才发现，你好像对它也特别温柔。等你有空，再一起陪它玩一会儿吧。",
      "他/她",
      "voice"
    );
  };

  const evolutionText = useMemo(() => {
    if (!pet) return "";
    if (pet.evolutionStage === 1) {
      return "阶段一 · 软软雏形 | 正在慢慢熟悉你的世界";
    }
    if (pet.evolutionStage === 2) {
      return "阶段二 · 亲亲守护 | 已经把你当成最重要的人";
    }
    return "阶段三 · 梦境共鸣 | 会在很多细小的情绪里和你产生共振";
  }, [pet]);

  // 计算下一个进化阶段需要的等级
  const nextEvolutionInfo = useMemo(() => {
    if (!pet) return null;

    if (pet.evolutionStage === 1) {
      // 阶段1 -> 阶段2 需要 Lv7
      const neededLevel = 7;
      const levelsNeeded = neededLevel - pet.level;
      return {
        stage: 2,
        neededLevel,
        levelsNeeded,
        text: levelsNeeded > 0
          ? `距离阶段二还需 ${levelsNeeded} 级（Lv${neededLevel}）`
          : "已达到阶段二所需等级"
      };
    } else if (pet.evolutionStage === 2) {
      // 阶段2 -> 阶段3 需要 Lv15
      const neededLevel = 15;
      const levelsNeeded = neededLevel - pet.level;
      return {
        stage: 3,
        neededLevel,
        levelsNeeded,
        text: levelsNeeded > 0
          ? `距离阶段三还需 ${levelsNeeded} 级（Lv${neededLevel}）`
          : "已达到阶段三所需等级"
      };
    } else {
      // 阶段3 已经是最高阶段
      return {
        stage: 3,
        neededLevel: null,
        levelsNeeded: 0,
        text: "已达到最高进化阶段"
      };
    }
  }, [pet]);

  const moodText = useMemo(() => {
    if (!pet) return "";
    switch (pet.mood) {
      case "happy":
        return "今天的小软软状态很好，和你在一起的每一秒都闪着光。";
      case "normal":
        return "小软软静静地待在你身边，偶尔抬头看看你，仿佛在等一句悄悄话。";
      case "sad":
        return "小软软好像有点委屈，最好赶紧抱一抱它、喂点小零食。";
      case "sleepy":
        return "今晚的小软软很困了，眼睛一眨一眨的，等你一句“晚安”。";
      default:
        return "";
    }
  }, [pet]);

  const levelPercent = pet ? (pet.exp / pet.nextLevelExp) * 100 : 0;

  return (
    <div className="wechat-page">
      <header className="wechat-header wechat-header-with-back">
        <button
          type="button"
          className="wechat-back-btn"
          onClick={onBackHome}
        >
          <span className="wechat-back-arrow">‹</span>
          <span>返回桌面</span>
        </button>
        <div className="wechat-header-title">
          <div className="wechat-header-main">口袋宠物</div>
          <div className="wechat-header-sub">像独立小养成游戏一样慢慢升级和进化</div>
        </div>
        <div className="wechat-header-right">
          <button
            type="button"
            className="soft-icon-btn"
            onClick={() => setShowImageTool(true)}
            title="图片背景移除工具"
          >
            🖼️ 图片工具
          </button>
        </div>
      </header>

      {showImageTool ? (
        <ImageBackgroundRemover onBackHome={() => setShowImageTool(false)} />
      ) : (
        <main className="wechat-main pet-main-scroll">
          {(!pet || stage !== "play") && (
            <section className="soft-card-minimal pet-onboarding-card">
              {stage === "choose" && (
                <>
                  <div className="pet-section-title">先选一只想要一起养大的像素宠物</div>
                  <div className="pet-choose-grid">
                    <button
                      type="button"
                      className="pet-choose-card"
                      onClick={() => handleChooseKind("slime")}
                    >
                      <div className="pet-choose-sprite pet-sprite pet-sprite-slime" />
                      <div className="pet-choose-name">软软史莱姆</div>
                      <div className="pet-choose-desc">上手简单，不太会生气，适合随时云养。</div>
                    </button>
                    <button
                      type="button"
                      className="pet-choose-card"
                      onClick={() => handleChooseKind("cat")}
                    >
                      <div className="pet-choose-sprite pet-sprite pet-sprite-cat" />
                      <div className="pet-choose-name">小猫心宠</div>
                      <div className="pet-choose-desc">有点黏人，也会偶尔傲娇，需要多多陪它玩。</div>
                    </button>
                    <button
                      type="button"
                      className="pet-choose-card"
                      onClick={() => handleChooseKind("dragon")}
                    >
                      <div className="pet-choose-sprite pet-sprite pet-sprite-dragon" />
                      <div className="pet-choose-name">梦境小龙</div>
                      <div className="pet-choose-desc">成长稍微难一点，但后期会变得特别酷。</div>
                    </button>
                  </div>
                  <p className="pet-onboarding-tip">
                    以后也可以点击右上角的「重新开局」，换一只新的心宠重新来过。
                  </p>
                </>
              )}

              {stage === "name" && (
                <>
                  <div className="pet-section-title">给这只宠物取一个只在你们这部手机里使用的名字</div>
                  <div className="pet-name-preview-row">
                    <div className="pet-avatar-emoji">
                      <PetSprite kind={selectedKind ?? "slime"} stage={1} mood="happy" />
                    </div>
                    <div className="pet-name-preview-text">
                      <div className="pet-name-preview-label">心宠代号</div>
                      <div className="pet-name-preview-value">
                        {(tempName || "").trim() || "还没有名字哦"}
                      </div>
                    </div>
                  </div>
                  <input
                    className="pet-name-input"
                    value={tempName}
                    maxLength={12}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="输入一个你想对它使用的昵称，比如 小软软、小煤球、阿玖..."
                  />
                  <button
                    type="button"
                    className="primary-pill-btn pet-name-confirm-btn"
                    onClick={handleConfirmName}
                    disabled={!selectedKind}
                  >
                    确认，用这个名字开始养成
                  </button>
                  <button
                    type="button"
                    className="pet-name-back-btn"
                    onClick={() => setStage("choose")}
                  >
                    返回上一步，重新挑一只
                  </button>
                </>
              )}
            </section>
          )}

          {pet && stage === "play" && (
            <>
              <section className="soft-card-minimal pet-top-card">
                <div className="pet-screen">
                  <div className="pet-screen-frame">
                    <div className="pet-screen-window-bar">
                      <div className="pet-screen-window-dots">
                        <div className="pet-screen-window-dot" />
                        <div className="pet-screen-window-dot" />
                        <div className="pet-screen-window-dot" />
                      </div>
                      <div className="pet-screen-window-title">像素草原 · 心宠活动中</div>
                    </div>
                    <div className="pet-screen-inner">
                      {speech && (
                        <div
                          className={`pet-screen-speech pet-screen-speech-${speech.from} pet-screen-speech-${speech.kind}`}
                        >
                          <div className="pet-screen-speech-meta">
                            {speech.from === "pet"
                              ? pet.name
                              : speech.roleName
                                ? `${speech.roleName}（语音）`
                                : "来访者"}
                          </div>
                          <div className="pet-screen-speech-text">{speech.text}</div>
                        </div>
                      )}
                      <div className="pet-screen-pet">
                        <button
                          type="button"
                          className="pet-screen-pet-btn"
                          onClick={() => speakFromPet(randomPetLine(pet))}
                        >
                          <PetSprite kind={pet.kind} stage={pet.evolutionStage} mood={pet.mood} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pet-avatar-info pet-avatar-info-under-screen">
                  <div className="pet-avatar-name">
                    {pet.name} · Lv.{pet.level}
                  </div>
                  <div className="pet-avatar-evolution">{evolutionText}</div>
                  {nextEvolutionInfo && nextEvolutionInfo.levelsNeeded > 0 && (
                    <div className="pet-next-evolution">
                      ✨ {nextEvolutionInfo.text}
                    </div>
                  )}
                  {nextEvolutionInfo && nextEvolutionInfo.levelsNeeded === 0 && pet.evolutionStage < 3 && (
                    <div className="pet-next-evolution pet-next-evolution-ready">
                      ✨ 已达到进化条件，升级后自动进化！
                    </div>
                  )}
                  <button
                    type="button"
                    className="pet-reset-btn"
                    onClick={handleResetPet}
                  >
                    重新开局
                  </button>
                </div>

                <div className="pet-level-bar">
                  <div className="pet-level-bar-label">
                    经验值 {pet.exp.toFixed(0)} / {pet.nextLevelExp.toFixed(0)}
                  </div>
                  <div className="pet-level-bar-outer">
                    <div
                      className="pet-level-bar-inner"
                      style={{ width: `${Math.min(100, levelPercent)}%` }}
                    />
                  </div>
                </div>

                <p className="pet-mood-text">{moodText}</p>
              </section>

              <section className="soft-card-minimal pet-stats-card">
                <div className="pet-section-title">今日状态</div>
                <StatBar label="饥饿度" value={pet.hunger} color="pink" />
                <StatBar label="清洁度" value={pet.clean} color="blue" />
                <StatBar label="精神值" value={pet.energy} color="green" />
              </section>

              <section className="soft-card-minimal pet-actions-card">
                <div className="pet-section-title">可以一起做的事</div>
                <div className="pet-actions-grid">
                  <button
                    type="button"
                    className="pet-action-btn"
                    onClick={handleFeed}
                  >
                    <span className="pet-action-emoji">🍰</span>
                    <span className="pet-action-title">喂点好吃的</span>
                    <span className="pet-action-sub">降低饥饿，微微恢复精神</span>
                    <span className="pet-action-exp">+8 经验</span>
                  </button>

                  <button
                    type="button"
                    className="pet-action-btn"
                    onClick={handleClean}
                  >
                    <span className="pet-action-emoji">🫧</span>
                    <span className="pet-action-title">泡泡澡澡</span>
                    <span className="pet-action-sub">提升清洁，会稍微有点饿</span>
                    <span className="pet-action-exp">+6 经验</span>
                  </button>

                  <button
                    type="button"
                    className="pet-action-btn"
                    onClick={handlePlay}
                  >
                    <span className="pet-action-emoji">🎀</span>
                    <span className="pet-action-title">一起玩耍</span>
                    <span className="pet-action-sub">消耗能量与清洁，但会很开心</span>
                    <span className="pet-action-exp">+10 经验</span>
                  </button>

                  <button
                    type="button"
                    className="pet-action-btn"
                    onClick={handleRest}
                  >
                    <span className="pet-action-emoji">🌙</span>
                    <span className="pet-action-title">好好睡一觉</span>
                    <span className="pet-action-sub">大量恢复精神，但会有些饿</span>
                    <span className="pet-action-exp">+4 经验</span>
                  </button>
                </div>

                <p className="pet-tip-text">
                  可以和喜欢的人约好，每天轮流点进来照顾一下它，
                  看看你们一起努力下，它能长成什么样子。
                </p>
              </section>

              <section className="soft-card-minimal pet-log-card">
                <div className="pet-section-title">最近的小记</div>
                {log.length === 0 ? (
                  <p className="pet-log-empty">还没有记录哦，试着先喂它一口点心，看看会发生什么。</p>
                ) : (
                  <ul className="pet-log-list">
                    {log.map((item, idx) => (
                      <li key={idx} className="pet-log-item">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </main>
      )}
    </div>
  );
};


