import React from 'react';

type Props = {
  roleId: string;
  nickname: string;
  /** 一次性模型生成的足迹列表；缺失时显示占位符 */
  items?: FootprintItem[];
  onBack: () => void;
  onShoppingStatusBarLightChange?: (light: boolean) => void;
};

type FootprintItem = {
  id: string;
  title: string;
  desc: string;
  /** 例如：看过 3 次 */
  viewedText: string;
  /** 例如：3小时前 / 昨天 */
  viewedAtText?: string;
  priceText: string;
};

const FOOTPRINT_PREVIEW_URL = new URL('../../image/图片预览图（未接api）.png', import.meta.url).toString();

export const PhoneInspectShoppingFootprints: React.FC<Props> = ({
  roleId,
  nickname,
  items,
  onBack,
  onShoppingStatusBarLightChange
}) => {
  const list = React.useMemo(() => items || [], [items]);
  const [flipped, setFlipped] = React.useState<Record<string, boolean>>({});

  const grouped = React.useMemo(() => {
    const hash = (s: string): number => {
      let h = 0;
      for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
      return Math.abs(h);
    };
    const timePool = ['刚刚', '5分钟前', '10:30', '1小时前', '3小时前', '昨天', '前天'];
    const targetBucketCount = Math.max(2, Math.min(5, Math.ceil(Math.max(1, list.length) / 2)));
    const buckets = timePool.slice(0, targetBucketCount);
    const map = new Map<string, FootprintItem[]>();

    for (const it of list) {
      // 为了让足迹分布更自然：按 item 做稳定随机分桶，避免“一个时间点只挂一条”
      const seed = `${roleId}|${it.id}|${it.title}|${it.priceText}`;
      const idx = hash(seed) % buckets.length;
      const key = buckets[idx];
      const arr = map.get(key) || [];
      arr.push(it);
      map.set(key, arr);
    }

    // 按时间池顺序输出（从近到远）
    return buckets
      .filter((k) => (map.get(k) || []).length > 0)
      .map((viewedAtText) => ({ viewedAtText, list: map.get(viewedAtText) || [] }));
  }, [list, roleId]);

  React.useEffect(() => {
    onShoppingStatusBarLightChange?.(false);
    return () => onShoppingStatusBarLightChange?.(false);
  }, [onShoppingStatusBarLightChange]);

  React.useEffect(() => {
    setFlipped({});
  }, [roleId, list]);

  return (
    <div
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f2f2f7'
      }}
    >
      <div
        style={{
          flexShrink: 0,
          backgroundColor: '#f2f2f7',
          padding: '8px 12px 10px',
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#111827',
              fontSize: 22,
              lineHeight: 1,
              padding: '4px 2px',
              cursor: 'pointer',
              flexShrink: 0
            }}
            aria-label="返回"
          >
            ‹
          </button>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>足迹</div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>Hi, {nickname}</div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 12px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {grouped.length ? (
            grouped.map((g) => (
              <div key={g.viewedAtText}>
                <div style={{ fontSize: 12, color: '#94a3b8', margin: '0 2px 10px' }}>{g.viewedAtText}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                  {g.list.map((it) => {
                    const isFlipped = !!flipped[it.id];
                    return (
                      <div key={it.id} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setFlipped((prev) => ({ ...prev, [it.id]: !prev[it.id] }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setFlipped((prev) => ({ ...prev, [it.id]: !prev[it.id] }));
                            }
                          }}
                          style={{
                            width: '100%',
                            aspectRatio: '1 / 1',
                            borderRadius: 10,
                            perspective: 900,
                            WebkitPerspective: 900,
                            cursor: 'pointer',
                            backgroundColor: '#f1f5f9'
                          }}
                        >
                          <div
                            style={{
                              position: 'relative',
                              width: '100%',
                              height: '100%',
                              transition: 'transform 0.42s ease',
                              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                              WebkitTransform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                              transformStyle: 'preserve-3d',
                              WebkitTransformStyle: 'preserve-3d',
                              borderRadius: 10,
                              overflow: 'hidden',
                              willChange: 'transform'
                            }}
                          >
                            {!isFlipped ? (
                              <div style={{ position: 'absolute', inset: 0, backgroundColor: '#111827' }}>
                                <img
                                  src={FOOTPRINT_PREVIEW_URL}
                                  alt=""
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                              </div>
                            ) : (
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  transform: 'rotateY(180deg)',
                                  WebkitTransform: 'rotateY(180deg)',
                                  background: 'linear-gradient(135deg, #111827, #1f2937)',
                                  color: '#ffffff',
                                  padding: 8,
                                  boxSizing: 'border-box',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textAlign: 'center',
                                  fontSize: 11,
                                  lineHeight: 1.5,
                                  whiteSpace: 'pre-wrap'
                                }}
                              >
                                <div style={{ width: '100%' }}>
                                  <div style={{ opacity: 0.95 }}>{it.desc || '商品外观预览：材质与细节以实物为准。'}</div>
                                  <div style={{ marginTop: 8, fontSize: 10, opacity: 0.75 }}>{it.viewedText || '看过 1 次'}</div>
                                  <div style={{ marginTop: 8, fontSize: 10, opacity: 0.7 }}>点击翻回预览</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#111827',
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {it.title}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, color: '#f97316', fontWeight: 800, lineHeight: 1.2 }}>
                          {it.priceText}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '22px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 8 }}>暂无足迹数据</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>请先生成购物快照。</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

