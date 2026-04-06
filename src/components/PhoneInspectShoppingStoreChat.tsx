import React from 'react';

const ORANGE = '#ff5000';
const PAGE_BG = '#ededed';
/** 顶栏、底栏与查手机状态栏对齐为纯白 */
const CHROME_WHITE = '#ffffff';
/** 角色发出：浅橘气泡（近似淘宝/客服会话里用户侧） */
const ROLE_BUBBLE_BG = '#ffe7d2';
const STAFF_AVATAR_ORANGE = '#ff7a33';
/** 双侧气泡宽度上限 */
const STAFF_BUBBLE_MAX_WIDTH = '76%';
const ROLE_BUBBLE_MAX_WIDTH = '84%';

type Props = {
  onBack: () => void;
  shopName: string;
  recipientNickname: string;
  recipientAvatarUrl?: string;
  productTitle: string;
  productSpec: string;
  productPrice: string;
  /** 展示在地址卡片里 */
  detailAddress: string;
  /** 卡片内完整手机号（剧情展示） */
  displayPhone: string;
  roleId: string;
  /** 一次性模型生成的客服对话线程（用于替代本地示例对话） */
  threadTurns?: Array<{ from: 'staff' | 'role'; name?: string; text: string }>;
  /** 顶部时间文本（可选） */
  headerTimeText?: string;
  /** 是否展示“确认收货地址”卡片（待付款/未下单应关闭） */
  showOrderConfirmCard?: boolean;
};

function storeInitial(name: string): string {
  const s = (name || '店').trim();
  return s.slice(0, 1);
}

type ChatTurn =
  | { kind: 'staff'; name: string; text: string }
  | { kind: 'role'; text: string };
type ChatTurnWithRead =
  | { kind: 'staff'; name: string; text: string }
  | { kind: 'role'; text: string; read: boolean };

function roleInitial(nickname: string): string {
  return (nickname || '我').trim().slice(0, 1) || '我';
}

function cleanRecipientName(nickname: string): string {
  const n = String(nickname || '').replace(/\(我\)/g, '').trim();
  return n || '收件人';
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeTurnText(text: string, recipientNickname: string): string {
  const raw = String(text || '');
  const nick = String(recipientNickname || '').trim();
  if (!nick) return raw;
  const reg = new RegExp(escapeRegExp(nick), 'g');
  return raw.replace(reg, '您');
}

export const PhoneInspectShoppingStoreChat: React.FC<Props> = ({
  onBack,
  shopName,
  recipientNickname,
  recipientAvatarUrl,
  productTitle,
  productSpec,
  productPrice,
  detailAddress,
  displayPhone,
  roleId,
  threadTurns,
  headerTimeText,
  showOrderConfirmCard = true
}) => {
  const chatTurns = React.useMemo<ChatTurn[]>(() => {
    const src = threadTurns || [];
    const out: ChatTurn[] = [];
    for (const t of src) {
      if (t.from === 'staff') {
        out.push({ kind: 'staff', name: String(t.name || '小禾'), text: sanitizeTurnText(String(t.text || ''), recipientNickname) });
      } else {
        out.push({ kind: 'role', text: sanitizeTurnText(String(t.text || ''), recipientNickname) });
      }
    }
    return out;
  }, [threadTurns, recipientNickname]);
  const chatTurnsWithRead = React.useMemo<ChatTurnWithRead[]>(() => {
    // 规则：若某条角色消息后面存在客服回复，则该条显示“已读”。
    const out: ChatTurnWithRead[] = [];
    let hasStaffAfter = false;
    for (let i = chatTurns.length - 1; i >= 0; i--) {
      const t = chatTurns[i];
      if (t.kind === 'staff') {
        hasStaffAfter = true;
        out.push(t);
      } else {
        out.push({ ...t, read: hasStaffAfter });
      }
    }
    out.reverse();
    return out;
  }, [chatTurns]);
  const init = storeInitial(shopName);
  const rInit = roleInitial(recipientNickname);
  const recipientName = cleanRecipientName(recipientNickname);

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: PAGE_BG
      }}
    >
      {/* 顶栏：微信会话样式 — 左返回、中标题、右侧留白占位 */}
      <div
        style={{
          flexShrink: 0,
          backgroundColor: CHROME_WHITE,
          padding: '8px 0 10px',
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 36 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#111827',
              fontSize: 22,
              lineHeight: 1,
              width: 44,
              padding: 0,
              cursor: 'pointer',
              flexShrink: 0
            }}
            aria-label="返回"
          >
            ‹
          </button>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'center', padding: '0 4px' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.25 }}>{shopName}</div>
            <div
              style={{
                fontSize: 10,
                color: '#94a3b8',
                marginTop: 2,
                lineHeight: 1.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                flexWrap: 'wrap'
              }}
            >
              <span aria-hidden>😊</span>
              <span style={{ color: '#ca8a04', fontWeight: 600 }}>金牌客服</span>
              <span>|</span>
              <span>超 99% 店铺</span>
            </div>
          </div>
          <div style={{ width: 44, flexShrink: 0 }} aria-hidden />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '12px 10px max(16px, env(safe-area-inset-bottom, 0px))'
        }}
      >
        <div
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#9ca3af',
            marginBottom: 12
          }}
        >
          {headerTimeText || '暂无对话时间'}
        </div>

        <div
          style={{
            maxWidth: '92%',
            margin: '0 auto 14px',
            padding: '8px 12px',
            borderRadius: 6,
            backgroundColor: 'rgba(0,0,0,0.04)',
            fontSize: 12,
            color: '#6b7280',
            lineHeight: 1.5,
            textAlign: 'center'
          }}
        >
          安全提示：请勿轻信任何要求转账、扫码或点击陌生链接的信息，涉及钱款请通过官方订单页面操作。
        </div>

        {/* 确认地址卡片（待付款/未下单不显示） */}
        {showOrderConfirmCard ? (
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: '12px 12px 14px',
            marginBottom: 16,
            boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#111827',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {init}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>请确认收货地址</div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 8,
                background: 'linear-gradient(145deg, #fecdd3 0%, #fda4af 100%)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28
              }}
            >
              🌸
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#111827',
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                【优惠价】{productTitle}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{productSpec}</div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: ORANGE }}>{productPrice}</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>共1件</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>
            <div>
              <span style={{ color: '#9ca3af' }}>收货人 </span>
              {recipientName}
            </div>
            <div style={{ marginTop: 6 }}>
              <span style={{ color: '#9ca3af' }}>手机号码 </span>
              {displayPhone}
              <span style={{ fontSize: 11, color: '#94a3af', marginLeft: 6 }}>（号码已保护）</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <span style={{ color: '#9ca3af' }}>详细地址 </span>
              {detailAddress}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
            <button
              type="button"
              style={{
                border: `1px solid ${ORANGE}`,
                background: '#fff',
                color: ORANGE,
                borderRadius: 999,
                padding: '6px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'default'
              }}
            >
              修改地址
            </button>
            <button
              type="button"
              style={{
                border: 'none',
                background: ORANGE,
                color: '#fff',
                borderRadius: 999,
                padding: '6px 22px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'default'
              }}
            >
              确认
            </button>
          </div>
        </div>
        ) : null}

        <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>
          {headerTimeText || '暂无对话时间'}
        </div>

        {chatTurnsWithRead.length ? (
          chatTurnsWithRead.map((turn, i) =>
          turn.kind === 'staff' ? (
            <div
              key={`s-${turn.name}-${i}`}
              style={{
                marginBottom: 12,
                paddingLeft: 4,
                paddingRight: 24
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    backgroundColor: STAFF_AVATAR_ORANGE,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {init}
                </div>
                <div
                  style={{
                    position: 'relative',
                    flex: '0 1 auto',
                    minWidth: 0,
                    maxWidth: STAFF_BUBBLE_MAX_WIDTH,
                    paddingTop: 16
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      fontSize: 11,
                      color: '#9ca3af',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {turn.name}
                  </div>
                <div
                  style={{
                    backgroundColor: CHROME_WHITE,
                    borderRadius: 4,
                    padding: '8px 11px',
                    fontSize: 14,
                    color: '#111827',
                    lineHeight: 1.45,
                    border: '1px solid #e5e5e5',
                    wordBreak: 'break-word'
                  }}
                >
                  {turn.text}
                </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={`r-${i}`}
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
                gap: 8,
                marginBottom: 12,
                paddingLeft: 24,
                paddingRight: 4
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 6,
                  maxWidth: ROLE_BUBBLE_MAX_WIDTH
                }}
              >
                {turn.read ? (
                  <span
                    style={{
                      fontSize: 10,
                      color: '#9ca3af',
                      lineHeight: 1,
                      flexShrink: 0,
                      userSelect: 'none',
                      paddingBottom: 2
                    }}
                  >
                    已读
                  </span>
                ) : null}
                <div
                  style={{
                    display: 'inline-block',
                    maxWidth: '100%',
                    backgroundColor: ROLE_BUBBLE_BG,
                    borderRadius: 4,
                    padding: '8px 11px',
                    fontSize: 14,
                    color: '#111827',
                    lineHeight: 1.45,
                    textAlign: 'left',
                    wordBreak: 'break-word'
                  }}
                >
                  {turn.text}
                </div>
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 4,
                  overflow: 'hidden',
                  backgroundColor: '#e5e7eb',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#4b5563'
                }}
              >
                {recipientAvatarUrl ? (
                  <img src={recipientAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  rInit
                )}
              </div>
            </div>
          )
        )
        ) : (
          <div style={{ padding: '18px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 8 }}>暂无对话数据</div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>请先在查手机面板勾选“购物”并点击“一键生成”。</div>
          </div>
        )}
      </div>
    </div>
  );
};
