import React from 'react';

type Props = {
  onExit: () => void;
};

type BottomTabId = '首页' | '视频' | '发现' | '消息' | '我';

type FeedItem = {
  id: string;
  userName: string;
  userBadge?: string;
  superTopicName?: string;
  timeText: string;
  sourceText?: string;
  text: string;
  images?: { kind: 'grid'; count: number };
  commentCount: number;
  likeCount: number;
  repostCount: number;
  isHot?: boolean;
  topic?: string;
};

const CATEGORIES: string[] = ['热门', '同城', '情感', '影视', '明星', '美食', '搞笑'];

const BOTTOM_TABS: { id: BottomTabId; label: string }[] = [
  { id: '首页', label: '微博' },
  { id: '视频', label: '视频' },
  { id: '发现', label: '发现' },
  { id: '消息', label: '消息' },
  { id: '我', label: '我' },
];

const formatCount = (n: number) => {
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)}万`;
  return String(n);
};

const formatTopic = (raw?: string) => {
  const t = String(raw ?? '').trim();
  if (!t) return '';
  const core = t.replace(/^#+/, '').replace(/#+$/, '');
  return `#${core}#`;
};

const LineIcon: React.FC<{ name: BottomTabId; active: boolean }> = ({ name, active }) => {
  const stroke = active ? '#ff8200' : '#9ca3af';
  const strokeWidth = 2;
  const common = {
    fill: 'none',
    stroke,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (name === '首页') {
    return (
      <svg className="weibo-bottomIconSvg" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M4 11.5l8-7 8 7" />
        <path {...common} d="M6.5 10.5V20.5h11V10.5" />
      </svg>
    );
  }
  if (name === '视频') {
    return (
      <svg className="weibo-bottomIconSvg" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M6.5 7.5h9a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3Z" />
        <path {...common} d="M11 10.2l3.8 1.8-3.8 1.8v-3.6Z" />
      </svg>
    );
  }
  if (name === '发现') {
    return (
      <svg className="weibo-bottomIconSvg" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M12 21.5c5 0 9-4 9-9s-4-9-9-9-9 4-9 9 4 9 9 9Z" />
        <path {...common} d="M12 7.2v5.1l3.6 2.1" />
      </svg>
    );
  }
  if (name === '消息') {
    return (
      <svg className="weibo-bottomIconSvg" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M6.5 7.5h11a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H10l-3.6 3V15.5h-0.9a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3Z" />
      </svg>
    );
  }
  return (
    <svg className="weibo-bottomIconSvg" viewBox="0 0 24 24" aria-hidden="true">
      <path {...common} d="M12 12.2a4 4 0 1 0 0-8a4 4 0 0 0 0 8Z" />
      <path {...common} d="M4.5 20.5c1.6-4 5.1-6 7.5-6s5.9 2 7.5 6" />
    </svg>
  );
};

export const WeiboApp: React.FC<Props> = ({ onExit }) => {
  const [activeCategory, setActiveCategory] = React.useState(CATEGORIES[0]);
  const [bottomTab, setBottomTab] = React.useState<BottomTabId>('首页');

  const feed = React.useMemo<FeedItem[]>(
    () => [
      {
        id: '1',
        userName: '恋与深空',
        userBadge: '超话',
        superTopicName: '恋与深空',
        timeText: '5小时前',
        sourceText: '来自微博网页版',
        topic: '#恋与深空#',
        text: '男主专属服装、全新通用头饰即将永久上架！3月19日5:00起，前往「商城-甄选-日常装扮」即可选购。',
        images: { kind: 'grid', count: 7 },
        commentCount: 3142,
        likeCount: 23000,
        repostCount: 1741,
        isHot: true,
      },
      {
        id: '2',
        userName: '影视星闻',
        timeText: '10分钟前',
        sourceText: '来自 iPhone客户端',
        topic: '#今日热搜#',
        text: '一条关于「UI 质感」的建议：留白 + 层级 + 阴影要克制，信息密度高但不压迫，才像“官方”。',
        images: { kind: 'grid', count: 3 },
        commentCount: 268,
        likeCount: 980,
        repostCount: 112,
      },
      {
        id: '3',
        userName: '城市生活指南',
        timeText: '1小时前',
        sourceText: '来自 Android客户端',
        text: '周末同城活动合集：音乐节、展览、咖啡市集、夜跑路线。你更想去哪个？',
        commentCount: 842,
        likeCount: 5023,
        repostCount: 397,
      },
      {
        id: '4',
        userName: '数码研究所',
        timeText: '3小时前',
        sourceText: '来自 微博网页版',
        topic: '#产品观察#',
        text: '信息流里，标题/正文/媒体/互动区的间距固定，会让整体更“稳”。另外，按钮触控热区要够大。',
        images: { kind: 'grid', count: 1 },
        commentCount: 146,
        likeCount: 1280,
        repostCount: 88,
      },
    ],
    []
  );

  const showFeed = bottomTab === '首页';

  return (
    <div className="weibo-app">
      <div className="weibo-safe-top">
        <div className="weibo-topBar">
          <button type="button" className="weibo-topIconBtn weibo-backBtn" aria-label="返回桌面" onClick={onExit} />

          <div className="weibo-topActions">
            <button type="button" className="weibo-topIconBtn weibo-topIconBtn--primary" aria-label="发布">
              <span className="weibo-topIconGlyph">＋</span>
            </button>
          </div>
        </div>

        <div className="weibo-categories" role="tablist" aria-label="分类">
          {CATEGORIES.map((c) => {
            const active = c === activeCategory;
            return (
              <button
                key={c}
                type="button"
                className={`weibo-catItem ${active ? 'is-active' : ''}`}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(c)}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="weibo-scroll">
        {showFeed ? (
          <div className="weibo-feed">
            <div className="weibo-feedHint">
              <span className="weibo-feedHintDot" />
              <span className="weibo-feedHintText">{activeCategory}</span>
            </div>

            {feed.map((it) => (
              <article key={it.id} className="weibo-card">
                <header className="weibo-cardHeader">
                  <div className="weibo-avatar" aria-hidden="true">
                    {it.userName.slice(0, 1)}
                  </div>
                  <div className="weibo-cardMeta">
                    <div className="weibo-cardTitleRow">
                      <div className="weibo-userName">{it.userName}</div>
                      {it.userBadge === '超话' && it.superTopicName ? (
                        <span className="weibo-superTopicBadge" aria-label={`超话：${it.superTopicName}`}>
                          <svg className="weibo-superTopicDiamondSvg" viewBox="0 0 12 12" aria-hidden="true">
                            <path
                              d="M6 1L11 6L6 11L1 6L6 1Z"
                              fill="currentColor"
                            />
                            <path
                              d="M6 2.2L9.8 6L6 9.8L2.2 6L6 2.2Z"
                              fill="none"
                              stroke="rgba(255,255,255,0.55)"
                              strokeWidth="0.7"
                            />
                          </svg>
                          <span className="weibo-superTopicText">{it.superTopicName}超话</span>
                        </span>
                      ) : it.userBadge ? (
                        <span className="weibo-userBadge">{it.userBadge}</span>
                      ) : null}
                    </div>
                    <div className="weibo-subMeta">
                      {it.isHot ? <span className="weibo-hotBadge">热门</span> : null}
                      <span>{it.timeText}</span>
                      {it.sourceText ? <span className="weibo-dot">·</span> : null}
                      {it.sourceText ? <span>{it.sourceText}</span> : null}
                    </div>
                  </div>
                  <button type="button" className="weibo-moreBtn" aria-label="更多">
                    ⋯
                  </button>
                </header>

                <div className="weibo-cardBody">
                  {it.topic ? <div className="weibo-topic">{formatTopic(it.topic)}</div> : null}
                  <div className="weibo-text">{it.text}</div>

                  {it.images ? (
                    <div className={`weibo-media weibo-media--grid`} aria-label="配图">
                      {Array.from({ length: it.images.count }).map((_, idx) => (
                        <div key={idx} className="weibo-mediaItem" />
                      ))}
                      {it.images.count > 6 ? <div className="weibo-mediaMore">+{it.images.count - 6}</div> : null}
                    </div>
                  ) : null}
                </div>

                <footer className="weibo-actions">
                  <button type="button" className="weibo-actionBtn" aria-label="转发">
                    <span className="weibo-actionIcon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7.5 7.5h8.6l-1.8-1.8" />
                        <path d="M16.1 7.5l-1.8 1.8" />
                        <path d="M16.5 16.5H7.9l1.8 1.8" />
                        <path d="M7.9 16.5l1.8-1.8" />
                        <path d="M7.5 7.5c-1.9 0-3 1.2-3 3v0.6" />
                        <path d="M16.5 16.5c1.9 0 3-1.2 3-3v-0.6" />
                      </svg>
                    </span>
                    <span className="weibo-actionText">{formatCount(it.repostCount)}</span>
                  </button>
                  <button type="button" className="weibo-actionBtn" aria-label="评论">
                    <span className="weibo-actionIcon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6.2 6.6h11.6a3.4 3.4 0 0 1 3.4 3.4v2.4a3.4 3.4 0 0 1-3.4 3.4H11.4l-5 3.4v-3.4H6.2A3.4 3.4 0 0 1 2.8 14.4V10A3.4 3.4 0 0 1 6.2 6.6Z" />
                      </svg>
                    </span>
                    <span className="weibo-actionText">{formatCount(it.commentCount)}</span>
                  </button>
                  <button type="button" className="weibo-actionBtn" aria-label="点赞">
                    <span className="weibo-actionIcon" aria-hidden="true">
                      <svg className="weibo-likeIconSvg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path className="weibo-likeHandPath" d="M10.5 11.2V7.9c0-1.6 1-3 2.2-3c.8 0 1.3.7 1.2 1.6l-.4 2.6h4.1c1.3 0 2.1 1.1 1.8 2.3l-1.2 6c-.2 1-1.1 1.8-2.2 1.8H10.5" />
                        <path d="M7.2 11.2h3.3v10.2H7.2c-.8 0-1.5-.7-1.5-1.5v-7.2c0-.8.7-1.5 1.5-1.5Z" />
                      </svg>
                    </span>
                    <span className="weibo-actionText">{formatCount(it.likeCount)}</span>
                  </button>
                </footer>
              </article>
            ))}

            <div className="weibo-endSpacer" />
          </div>
        ) : (
          <div className="weibo-placeholder">
            <div className="weibo-placeholderTitle">{bottomTab}</div>
            <div className="weibo-placeholderDesc">这里先做了微博首页（信息流），其它 Tab 后续也能按同样质感补齐。</div>
          </div>
        )}
      </div>

      <nav className="weibo-bottom" aria-label="底部导航">
        {BOTTOM_TABS.map((t) => {
          const active = t.id === bottomTab;
          return (
            <button
              key={t.id}
              type="button"
              className={`weibo-bottomItem ${active ? 'is-active' : ''}`}
              onClick={() => setBottomTab(t.id)}
              aria-current={active ? 'page' : undefined}
            >
              <span className="weibo-bottomIcon">
                <LineIcon name={t.id} active={active} />
              </span>
              <span className="weibo-bottomLabel">{t.label}</span>
              {t.id === '消息' ? <span className="weibo-badge">117</span> : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

