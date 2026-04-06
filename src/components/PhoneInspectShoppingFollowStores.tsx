import React from 'react';

type Props = {
  roleId: string;
  nickname: string;
  /** 一次性模型生成的关注店铺列表；缺失时显示占位符 */
  stores?: FollowStore[]; // FollowStore declared below; TS allows due to hoisting
  onBack: () => void;
  onShoppingStatusBarLightChange?: (light: boolean) => void;
};

type FollowStore = {
  id: string;
  name: string;
  tagText?: string;
  goodsCountText?: string;
  followState: 'following' | 'not_following';
};

export const PhoneInspectShoppingFollowStores: React.FC<Props> = ({
  roleId,
  nickname,
  stores,
  onBack,
  onShoppingStatusBarLightChange
}) => {
  const list = stores || [];

  React.useEffect(() => {
    // 模拟：该页为纯白信息流，无需深色状态栏
    onShoppingStatusBarLightChange?.(false);
    return () => onShoppingStatusBarLightChange?.(false);
  }, [onShoppingStatusBarLightChange]);

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
      {/* 顶栏：返回 + 标题 */}
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
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>关注店铺</div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>Hi, {nickname}</div>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              backgroundColor: '#ffffff',
              borderRadius: 999,
              padding: '8px 12px',
              border: '1px solid rgba(0,0,0,0.06)',
              color: '#94a3b8',
              fontSize: 13,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            可搜索关注店铺的商品哟
          </div>
        </div>
      </div>

      {/* 店铺列表 */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 12px 24px' }}>
        {list.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
            {list.map((s) => (
            <div
              key={s.id}
              style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                padding: 12,
                boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(145deg,#f8fafc 0%,#e2e8f0 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#334155',
                  fontWeight: 800,
                  flexShrink: 0
                }}
              >
                {s.name.slice(0, 1)}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#111827',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {s.name}
                  </div>
                  {null}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                  {s.goodsCountText || (s as any).goodsCountText || '常购商品'}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  style={{
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    backgroundColor: s.followState === 'following' ? '#f3f4f6' : '#ea580c',
                    color: s.followState === 'following' ? '#64748b' : '#fff',
                    fontSize: 13,
                    fontWeight: 700
                  }}
                >
                  {s.followState === 'following' ? '已关注' : '关注'}
                </button>
              </div>
            </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '22px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 8 }}>暂无关注店铺数据</div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
              请先在查手机面板勾选“购物”并点击“一键生成”。
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

