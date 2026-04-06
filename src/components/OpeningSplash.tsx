import React from 'react';

/** 开场随机文案（与项目风格一致） */
const OPENING_QUOTES: string[] = [
  '没什么好焦虑的 活着就能翻盘.',
  '亲爱的朋友 人生总是柳暗花明.',
  '我说此刻最好.',
  '好的总是压箱底 我猜幸福也是.',
  '什么都不在乎 所以我漂亮又自由.',
  '我知我喜乐 纵情跋涉.',
  '世界应该一直春天和到处小狗.',
  '祝好 在数不尽的明天.',
  '关于幸福我定义成睡得着觉.',
  '人生得意须尽欢 胡吃海喝需尽兴.',
  '在自己的白日梦里种了九万朵玫瑰.',
  '我明媚也自由.',
  '风来自远方，我去去也无妨.',
  '或许是我错了 但那又怎样呢.',
  '高举爱自己的旗才是我看自己的life style.',
  '世界只是你的游乐场 大胆一点.',
  '人生不止一个方向.',
  '从此唯行乐 闲愁奈我何.',
];

const logoSrc = new URL('../../image/主屏幕图标.png', import.meta.url).toString();

type OpeningSplashProps = {
  onFinish: () => void;
};

export const OpeningSplash: React.FC<OpeningSplashProps> = ({ onFinish }) => {
  const quote = React.useMemo(
    () => OPENING_QUOTES[Math.floor(Math.random() * OPENING_QUOTES.length)] ?? OPENING_QUOTES[0],
    []
  );
  const [exiting, setExiting] = React.useState(false);
  const doneRef = React.useRef(false);
  const finishRef = React.useRef(onFinish);
  finishRef.current = onFinish;

  const finishOnce = React.useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    finishRef.current();
  }, []);

  React.useEffect(() => {
    const tExit = window.setTimeout(() => setExiting(true), 3800);
    const tDone = window.setTimeout(() => finishOnce(), 4500);
    return () => {
      window.clearTimeout(tExit);
      window.clearTimeout(tDone);
    };
  }, [finishOnce]);

  const handleSkip = React.useCallback(() => {
    setExiting(true);
    window.setTimeout(() => finishOnce(), 420);
  }, [finishOnce]);

  return (
    <div
      className={`opening-splash ${exiting ? 'opening-splash--exit' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="开场画面"
      onClick={handleSkip}
    >
      <div className="opening-splash-bg" aria-hidden />
      <div className="opening-splash-inner">
        <img className="opening-splash-logo" src={logoSrc} alt="" draggable={false} />
        <p className="opening-splash-quote">{quote}</p>
        <span className="opening-splash-hint">轻触跳过</span>
      </div>
    </div>
  );
};
