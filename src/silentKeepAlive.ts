/**
 * 静音循环保活：BGM 经 Web Audio 的 GainNode（增益 0）再输出，扬声器端真正无声；
 * 仍保留「正在播放」的媒体元素与 Media Session，便于灵动岛/锁屏展示。
 */

const KEEPALIVE_BGM_URL = new URL('../BGM/伤感、平淡.mp3', import.meta.url).href;

function keepAliveArtworkUrl(): string {
  try {
    return new URL('/image/主屏幕图标.png', window.location.origin).href;
  } catch {
    return '';
  }
}

function applyKeepAliveMediaSession() {
  if (!('mediaSession' in navigator)) return;
  try {
    const art = keepAliveArtworkUrl();
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Lumi Phone',
      artist: '后台保活',
      album: '',
      artwork: art
        ? [{ src: art, sizes: '180x180', type: 'image/png' }]
        : [],
    });
    navigator.mediaSession.playbackState = 'playing';
  } catch {
    // ignore
  }
}

function clearKeepAliveMediaSession() {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'paused';
  } catch {
    // ignore
  }
}

function getAudioContextCtor(): AudioContextConstructor | null {
  const w = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

type AudioContextConstructor = new () => AudioContext;

export function initSilentKeepAlive(): () => void {
  let audio: HTMLAudioElement | null = null;
  let audioCtx: AudioContext | null = null;
  let mediaSource: MediaElementAudioSourceNode | null = null;
  let gainNode: GainNode | null = null;

  const onAudioPause = () => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = 'paused';
    } catch {
      // ignore
    }
  };

  const ensure = () => {
    if (audio) return audio;
    const el = new Audio();
    el.src = KEEPALIVE_BGM_URL;
    el.loop = true;
    el.preload = 'auto';
    el.muted = false;
    el.volume = 1;
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');

    const Ctor = getAudioContextCtor();
    try {
      if (Ctor) {
        audioCtx = new Ctor();
        mediaSource = audioCtx.createMediaElementSource(el);
        gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;
        mediaSource.connect(gainNode);
        gainNode.connect(audioCtx.destination);
      } else {
        el.muted = true;
        el.volume = 0;
      }
    } catch {
      el.muted = true;
      el.volume = 0;
    }

    el.addEventListener('play', applyKeepAliveMediaSession);
    el.addEventListener('pause', onAudioPause);
    audio = el;
    return el;
  };

  const tryPlay = () => {
    const el = ensure();
    const resume = () => {
      if (audioCtx?.state === 'suspended') {
        return audioCtx.resume();
      }
      return Promise.resolve();
    };
    resume()
      .then(() => el.play())
      .then(() => {
        applyKeepAliveMediaSession();
      })
      .catch(() => {
        // 仍受自动播放策略限制时忽略
      });
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') tryPlay();
  };

  const onGesture = () => tryPlay();

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pointerdown', onGesture, { passive: true });
  window.addEventListener('touchstart', onGesture, { passive: true });
  window.addEventListener('keydown', onGesture);

  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pointerdown', onGesture);
    window.removeEventListener('touchstart', onGesture);
    window.removeEventListener('keydown', onGesture);
    if (audio) {
      audio.removeEventListener('play', applyKeepAliveMediaSession);
      audio.removeEventListener('pause', onAudioPause);
      audio.pause();
      audio.src = '';
      audio = null;
    }
    try {
      mediaSource?.disconnect();
    } catch {
      // ignore
    }
    mediaSource = null;
    try {
      gainNode?.disconnect();
    } catch {
      // ignore
    }
    gainNode = null;
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
    clearKeepAliveMediaSession();
  };
}

let disposeSilentKeepAlive: (() => void) | null = null;

/** 在通知应用等处调用一次即可；重复调用无效果。离开子应用不会停止，以便保活持续生效。 */
export function ensureSilentKeepAlive(): void {
  if (disposeSilentKeepAlive) return;
  disposeSilentKeepAlive = initSilentKeepAlive();
}

/** 停止静音保活并释放资源（例如用户主动关闭时）。 */
export function stopSilentKeepAlive(): void {
  disposeSilentKeepAlive?.();
  disposeSilentKeepAlive = null;
}
