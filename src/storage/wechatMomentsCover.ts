import { appStorage } from './appStorage';

export const WECHAT_MOMENTS_COVER_KEY = 'mini-ai-phone.wechat-moments-cover';

export type WechatMomentsCoverPersist = {
  /** 背景图：外链 URL 或本地上传 data URL */
  bgUrl: string;
  /** 供好友 / AI 理解的画面描述（非图片本体） */
  description: string;
};

export function loadWechatMomentsCover(): WechatMomentsCoverPersist {
  try {
    const raw = appStorage.getItem(WECHAT_MOMENTS_COVER_KEY);
    if (!raw) return { bgUrl: '', description: '' };
    const o = JSON.parse(raw) as Partial<WechatMomentsCoverPersist>;
    return {
      bgUrl: typeof o.bgUrl === 'string' ? o.bgUrl : '',
      description: typeof o.description === 'string' ? o.description : ''
    };
  } catch {
    return { bgUrl: '', description: '' };
  }
}

export function saveWechatMomentsCover(v: WechatMomentsCoverPersist) {
  appStorage.setItem(WECHAT_MOMENTS_COVER_KEY, JSON.stringify(v));
}

/** 剧情、记忆、好友侧可调用：玩家朋友圈封面文字描述 */
export function getWechatMomentsCoverDescription(): string {
  return loadWechatMomentsCover().description.trim();
}
