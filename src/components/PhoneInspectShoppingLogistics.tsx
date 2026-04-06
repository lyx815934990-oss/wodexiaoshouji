import React from 'react';
import { PhoneInspectShoppingStoreChat } from './PhoneInspectShoppingStoreChat';

/** 京东系物流页常用橙 */
const ORANGE = '#ff6600';
const PAGE_BG = '#f7f7f7';
const CHROME_BG = '#f2f2f7';

type TimelineItem = {
  time: string;
  title?: string;
  body: string;
  current?: boolean;
};

const IN_TRANSIT_TIMELINE: TimelineItem[] = [
  {
    time: '02-11 08:42',
    title: '运输中',
    body: '快件正由【重庆转运中心】发往【渝中片区】，途经约 315KM，预计 02-12 18:00 前送达。',
    current: true
  },
  {
    time: '02-11 01:27',
    body: '快件已离开【杭州转运中心】，正发往重庆，干线运输中（约 1606KM）。'
  },
  {
    time: '02-10 22:05',
    body: '快件到达【杭州转运中心】，已扫描入库。'
  },
  {
    time: '02-10 18:33',
    body: '快件离开【嘉兴集散分拣中心】，发往杭州。'
  },
  {
    time: '02-10 15:16',
    title: '已揽件',
    body: '快递员【周师傅 86-188****2201】已在【嘉兴市】完成揽收。'
  },
  {
    time: '02-10 11:21',
    title: '已发货',
    body: '商家已交付快递公司，包裹发出。'
  },
  {
    time: '02-10 11:12',
    title: '仓库处理中',
    body: '订单打包完成，等待揽收。'
  },
  {
    time: '02-10 01:29',
    title: '仓库已接单',
    body: '商家仓库已确认订单。'
  },
  {
    time: '02-10 01:27',
    title: '已下单',
    body: '订单支付成功，系统已通知商家发货。'
  }
];

type Props = {
  onBack: () => void;
  recipientNickname: string;
  recipientAvatarUrl?: string;
  trackingNo: string;
  carrierName?: string;
  shopName: string;
  productTitle: string;
  productSpec: string;
  productPrice: string;
  detailAddress: string;
  displayPhone: string;
  roleId: string;
  /** 一次性模型生成的物流时间线；缺失则显示占位符 */
  timeline?: TimelineItem[];
  /** 从购物快照匹配的店铺客服线程（物流页点「客服」时展示） */
  storeChatThreadTurns?: Array<{ from: 'staff' | 'role'; name?: string; text: string }>;
  storeChatHeaderTimeText?: string;
  onShoppingStatusBarLightChange?: (light: boolean) => void;
};

const MIN_TIMELINE_ROWS = 6;

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function fakeDetailAddress(seed: string): string {
  const areas = [
    '重庆市渝中区解放碑街道·星桥里 12 栋 1 单元 602',
    '浙江省杭州市西湖区·文三路 188 号院 3 幢 902',
    '上海市静安区·南京西路 66 弄 5 号 101 室'
  ];
  return areas[hashSeed(seed) % areas.length];
}

function resolveLogisticsAddress(detailAddress: string, seed: string): string {
  const raw = String(detailAddress || '').trim();
  if (raw && !/请生成|示例地址|（示例）|剧情小区/.test(raw)) {
    return raw.replace(/（示例地址）|示例地址/g, '').trim() || fakeDetailAddress(seed);
  }
  return fakeDetailAddress(seed);
}

function maskPhone(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const d = String(Math.abs(h) % 9000 + 1000);
  return `86-133****${d.slice(0, 3)}`;
}

function resolveLogisticsPhoneLine(displayPhone: string, seed: string): string {
  const raw = String(displayPhone || '').trim();
  if (raw && !/请生成|号码已保护/.test(raw)) {
    if (/\*{2,}/.test(raw)) return raw.startsWith('86') ? raw : `86-${raw}`;
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 11) {
      return `86-${digits.slice(0, 3)}****${digits.slice(-3)}`;
    }
    if (digits.length >= 7) {
      return `86-${digits.slice(0, 3)}****${digits.slice(-3)}`;
    }
    return raw;
  }
  return maskPhone(seed);
}

/** 模型轨迹过短时补足展示行数（不标注「示例」，仅作界面丰满）；无模型数据时不编造 */
function supplementTimeline(model: TimelineItem[], trackingNo: string, roleId: string): TimelineItem[] {
  if (!model.length) return [];
  if (model.length >= MIN_TIMELINE_ROWS) return model;
  const seen = new Set(model.map((m) => m.time));
  const out = model.map((m) => ({ ...m, current: !!m.current }));
  let i = 0;
  while (out.length < MIN_TIMELINE_ROWS && i < IN_TRANSIT_TIMELINE.length) {
    const tpl = IN_TRANSIT_TIMELINE[i++];
    if (seen.has(tpl.time)) continue;
    seen.add(tpl.time);
    out.push({
      ...tpl,
      current: false,
      body: tpl.body.replace(/\bSF\d+\b/g, trackingNo).replace(/【周师傅[^】]*】/g, `【快递员 ${maskPhone(trackingNo + roleId + String(i))}】`)
    });
  }
  return out;
}

export const PhoneInspectShoppingLogistics: React.FC<Props> = ({
  onBack,
  recipientNickname,
  recipientAvatarUrl,
  trackingNo,
  carrierName = 'Lumi速运',
  shopName,
  productTitle,
  productSpec,
  productPrice,
  detailAddress,
  displayPhone,
  roleId,
  timeline,
  storeChatThreadTurns,
  storeChatHeaderTimeText,
  onShoppingStatusBarLightChange
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const [storeChatOpen, setStoreChatOpen] = React.useState(false);
  const rawTimeline = timeline && timeline.length ? timeline : [];
  const srcTimeline = supplementTimeline(rawTimeline, trackingNo, roleId);
  const displayItems = expanded ? srcTimeline : srcTimeline.slice(0, 4);
  const addressLine = resolveLogisticsAddress(detailAddress, `${roleId}|${trackingNo}`);
  const phoneLine = resolveLogisticsPhoneLine(displayPhone, `${recipientNickname}|${trackingNo}|${roleId}`);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    onShoppingStatusBarLightChange?.(storeChatOpen);
  }, [storeChatOpen, onShoppingStatusBarLightChange]);

  React.useEffect(() => {
    return () => onShoppingStatusBarLightChange?.(false);
  }, [onShoppingStatusBarLightChange]);

  React.useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
    const t1 = window.requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    });
    const t2 = window.setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 0);
    return () => {
      window.cancelAnimationFrame(t1);
      window.clearTimeout(t2);
    };
  }, [trackingNo]);

  if (storeChatOpen) {
    return (
      <PhoneInspectShoppingStoreChat
        onBack={() => setStoreChatOpen(false)}
        shopName={shopName}
        recipientNickname={recipientNickname}
        recipientAvatarUrl={recipientAvatarUrl}
        productTitle={productTitle}
        productSpec={productSpec}
        productPrice={productPrice}
        detailAddress={addressLine}
        displayPhone={phoneLine}
        roleId={roleId}
        threadTurns={storeChatThreadTurns}
        headerTimeText={storeChatHeaderTimeText}
      />
    );
  }

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
      {/* 顶栏 */}
      <div
        style={{
          flexShrink: 0,
          backgroundColor: CHROME_BG,
          padding: '8px 10px 10px',
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
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
              cursor: 'pointer'
            }}
            aria-label="返回"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setStoreChatOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              backgroundColor: '#fff',
              borderRadius: 999,
              padding: '6px 12px',
              boxShadow: '0 1px 4px rgba(15,23,42,0.08)',
              fontSize: 11,
              color: '#374151',
              flexShrink: 0,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 10a8 8 0 0 1 16 0v1H4v-1Z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path d="M8 14h8M9 18h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            客服
          </button>
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* 运单号 */}
        <div
          style={{
            backgroundColor: '#fff',
            padding: '14px 14px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderBottom: '1px solid #f0f0f0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: 'linear-gradient(145deg, #e11d2e 0%, #b91c1c 100%)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              速
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{carrierName}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, wordBreak: 'break-all' }}>{trackingNo}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, fontSize: 12, color: ORANGE, fontWeight: 600 }}>
            <button type="button" style={{ border: 'none', background: 'none', color: ORANGE, cursor: 'pointer', padding: 0 }}>
              复制
            </button>
            <span style={{ width: 1, height: 12, backgroundColor: '#e5e7eb' }} />
            <button type="button" style={{ border: 'none', background: 'none', color: ORANGE, cursor: 'pointer', padding: 0 }}>
              打电话
            </button>
          </div>
        </div>

        {/* 时间轴 */}
        <div style={{ backgroundColor: '#fff', marginTop: 8, padding: '16px 14px 8px 0' }}>
          {!srcTimeline.length ? (
            <div style={{ padding: '22px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 8 }}>暂无物流数据</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>请先在查手机面板勾选“购物”并点击“一键生成”。</div>
            </div>
          ) : (
            <>
              {displayItems.map((item, idx) => {
                const isLast = idx === displayItems.length - 1;
                const isCurrent = !!item.current;
                return (
                  <div
                    key={`${item.time}-${idx}`}
                    style={{
                      position: 'relative',
                      paddingLeft: 36,
                      paddingRight: 14,
                      paddingBottom: isLast ? 8 : 18
                    }}
                  >
                    {!isLast ? (
                      <div
                        style={{
                          position: 'absolute',
                          left: 15,
                          top: 10,
                          bottom: -8,
                          width: 0,
                          borderLeft: '1px dashed #cbd5e1'
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        position: 'absolute',
                        left: isCurrent ? 10 : 11,
                        top: 4,
                        width: isCurrent ? 12 : 8,
                        height: isCurrent ? 12 : 8,
                        borderRadius: '50%',
                        backgroundColor: isCurrent ? ORANGE : 'transparent',
                        border: isCurrent ? 'none' : '2px solid #cbd5e1',
                        boxSizing: 'border-box',
                        zIndex: 1
                      }}
                    />
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{item.time}</div>
                    {item.title ? (
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: isCurrent ? ORANGE : '#111827',
                          marginBottom: 6,
                          lineHeight: 1.3
                        }}
                      >
                        {item.title}
                      </div>
                    ) : null}
                    <div
                      style={{
                        fontSize: 13,
                        color: '#64748b',
                        lineHeight: 1.55,
                        wordBreak: 'break-word'
                      }}
                    >
                      {item.body.split(/(86-\d{3}\*+\d+)/g).map((part, i) =>
                        /^86-\d{3}\*+\d+$/.test(part) ? (
                          <span key={i} style={{ color: ORANGE, fontWeight: 600 }}>
                            {part}
                          </span>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}

              {srcTimeline.length > 4 ? (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  style={{
                    display: 'block',
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    padding: '12px 14px 16px 36px',
                    fontSize: 13,
                    color: '#64748b',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  {expanded ? '收起更多物流明细' : '展开更多物流明细'}
                  <span style={{ marginLeft: 4 }}>{expanded ? '︿' : '﹀'}</span>
                </button>
              ) : null}
            </>
          )}
        </div>

        {/* 收货信息 */}
        <div
          style={{
            marginTop: 8,
            backgroundColor: '#fff',
            padding: '14px 16px 20px',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start'
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 2, color: '#64748b' }}>
            <path
              d="M12 21s-6-4.2-6-10a6 6 0 1 1 12 0c0 5.8-6 10-6 10Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <circle cx="12" cy="11" r="2.2" fill="currentColor" />
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, color: '#111827', lineHeight: 1.45 }}>
              <span style={{ color: '#94a3b8' }}>送至 </span>
              {addressLine}
            </div>
            <div style={{ marginTop: 10, fontSize: 14, color: '#111827', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600 }}>{recipientNickname || '收件人'}</span>
              <span style={{ color: '#64748b' }}>{phoneLine}</span>
              <span
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  border: '1px solid #e5e7eb',
                  borderRadius: 4,
                  padding: '2px 6px'
                }}
              >
                号码保护中
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
