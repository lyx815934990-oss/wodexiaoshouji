import { appStorage } from '../storage/appStorage';

// 与 VoiceTuningApp 保持一致：只保存在本设备浏览器
const VOICE_TUNING_STORAGE_KEY = 'mini-ai-phone.voice-tuning-settings';

const DEFAULT_CN_BASE_URL = 'https://api.minimaxi.com/v1';

export type VoiceTuningSettingsLite = {
  apiKey: string;
  voiceId?: string;
  speechModel?: string;
  minimaxRegion?: 'cn' | 'intl';
  minimaxBaseUrl?: string;
};

export const loadVoiceTuningSettingsLite = (): VoiceTuningSettingsLite => {
  try {
    const raw = appStorage.getItem(VOICE_TUNING_STORAGE_KEY);
    if (!raw) return { apiKey: '' };
    const parsed = JSON.parse(raw) as Partial<VoiceTuningSettingsLite> | null;
    if (!parsed || typeof parsed !== 'object') return { apiKey: '' };
    return {
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      voiceId: typeof parsed.voiceId === 'string' ? parsed.voiceId : undefined,
      speechModel: typeof parsed.speechModel === 'string' ? parsed.speechModel : undefined,
      minimaxRegion: parsed.minimaxRegion === 'intl' ? 'intl' : 'cn',
      minimaxBaseUrl: typeof parsed.minimaxBaseUrl === 'string' ? parsed.minimaxBaseUrl : undefined
    };
  } catch {
    return { apiKey: '' };
  }
};

export const resolveMiniMaxBaseUrl = (settings: VoiceTuningSettingsLite): string => {
  const raw = String(settings.minimaxBaseUrl || '').trim();
  if (raw) return raw;
  // intl 默认不写死域名，避免误导；如果未配置则仍回退 CN，至少不会产生 undefined
  return DEFAULT_CN_BASE_URL;
};

const hexToBytes = (hex: string): Uint8Array => {
  const cleaned = String(hex || '').trim();
  const pairs = cleaned.match(/.{1,2}/g);
  if (!pairs) return new Uint8Array();
  return new Uint8Array(pairs.map((h) => parseInt(h, 16)));
};

export type MiniMaxTtsRequest = {
  apiKey: string;
  voiceId: string;
  text: string;
  model?: string;
  baseUrl?: string;
  // 先按 VoiceTuningApp 默认输出 mp3
  format?: 'mp3';
  sampleRate?: number;
};

export const minimaxTtsToMp3Blob = async (req: MiniMaxTtsRequest): Promise<Blob> => {
  const apiKey = String(req.apiKey || '').trim();
  const voiceId = String(req.voiceId || '').trim();
  const text = String(req.text || '').trim();
  const model = String(req.model || '').trim() || 'speech-2.8-hd';

  if (!apiKey) throw new Error('缺少 MiniMax API Key（请先在「音色调整」里配置）');
  if (!voiceId) throw new Error('缺少 voice_id（请先为该角色绑定专属音色ID）');
  if (!text) throw new Error('没有可合成的文本');

  const safeText = text.slice(0, 500);
  const baseUrl = String(req.baseUrl || '').trim() || DEFAULT_CN_BASE_URL;
  const url = `${baseUrl.replace(/\/+$/, '')}/t2a_v2`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      text: safeText,
      stream: false,
      voice_setting: {
        voice_id: voiceId,
        speed: 1,
        vol: 1,
        pitch: 0
      },
      audio_setting: {
        sample_rate: typeof req.sampleRate === 'number' ? req.sampleRate : 32000,
        bitrate: 128000,
        format: req.format || 'mp3',
        channel: 1
      },
      subtitle_enable: false
    })
  });

  if (!res.ok) {
    const errorText = res.statusText || `HTTP ${res.status}`;
    throw new Error(`TTS 合成失败：${errorText}`);
  }

  const data = (await res.json()) as any;
  const baseResp = (data && (data.base_resp || data.baseResp)) as
    | { status_code?: number; status_msg?: string }
    | undefined;
  if (baseResp && typeof baseResp.status_code === 'number' && baseResp.status_code !== 0) {
    throw new Error(baseResp.status_msg || `接口返回错误码 ${baseResp.status_code}`);
  }

  const hexAudio =
    (data && data.data && (data.data.audio || data.data.audio_hex)) ||
    (data && (data.audio || data.audio_hex));
  if (!hexAudio || typeof hexAudio !== 'string') {
    throw new Error('TTS 接口返回中没有找到音频数据');
  }

  const bytes = hexToBytes(hexAudio);
  if (!bytes.length) {
    throw new Error('音频数据格式不正确');
  }
  // 兼容 TS 对 BlobPart 的类型约束：确保 buffer 为 ArrayBuffer（而不是 SharedArrayBuffer）
  const ab = bytes.buffer instanceof ArrayBuffer ? bytes.buffer : bytes.slice().buffer;
  return new Blob([ab], { type: 'audio/mpeg' });
};

export const playBlobAsAudio = async (
  blob: Blob,
  prevAudio?: HTMLAudioElement | null
): Promise<HTMLAudioElement> => {
  try {
    if (prevAudio) {
      prevAudio.pause();
    }
  } catch {
    // ignore
  }
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  // 播放结束后释放 URL
  audio.onended = () => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };
  await audio.play();
  return audio;
};


