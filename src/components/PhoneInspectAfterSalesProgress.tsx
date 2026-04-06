import React from 'react';

const ORANGE = '#ff5000';
const REFUND_REASON_OPTIONS = [
  '不想要了',
  '材质、面料与商品描述不符',
  '大小尺寸与商品描述不符',
  '颜色、款式、吊牌等与商品描述不符',
  '质量问题',
  '收到商品少件（含少配件）',
  '商品破损或污渍',
  '商家发错货',
  '假冒品牌',
  '其他原因'
] as const;

type ProgressNode = {
  time: string;
  title: string;
  detail: string;
  done: boolean;
  current?: boolean;
};

type AfterSalesFlow = 'merchant_agree' | 'merchant_reject';

type Props = {
  onBack: () => void;
  onContactMerchant: () => void;
  shopName: string;
  productTitle: string;
  productSpec: string;
  refundAmount: string;
  afterSalesType: 'refund_only' | 'return_refund' | 'exchange';
  flow: AfterSalesFlow;
  returnTrackingNo?: string;
  exchangeTrackingNo?: string;
  /** 一次性模型生成的售后进度节点；缺失则显示占位符 */
  nodes?: ProgressNode[];
  /** 一次性模型生成的原因文案（可选） */
  refundReasonText?: string;
  /** 一次性模型生成的补充说明（可选） */
  evidenceNoteText?: string;
  /** 售后单号（可选） */
  afterSalesNoText?: string;
};

function pickFlow(seed: string): AfterSalesFlow {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 37 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % 2 === 0 ? 'merchant_agree' : 'merchant_reject';
}

function buildNodes(flow: AfterSalesFlow, type: Props['afterSalesType']): ProgressNode[] {
  if (flow === 'merchant_agree' && type === 'refund_only') {
    return [
      {
        time: '03-23 10:41',
        title: '退款成功',
        detail: '商家同意退款后已秒退，退款原路返回，预计 1-5 分钟内到账。',
        done: true,
        current: true
      },
      {
        time: '03-23 10:40',
        title: '商家已同意退款',
        detail: '商家已确认退款申请。',
        done: true
      },
      {
        time: '03-23 10:32',
        title: '售后申请已提交',
        detail: '您已上传凭证并提交退款申请。',
        done: true
      }
    ];
  }
  if (flow === 'merchant_agree' && type === 'return_refund') {
    return [
      {
        time: '03-23 10:45',
        title: '商家待收货',
        detail: '您已寄出退货商品，等待商家签收后原路退款。',
        done: false,
        current: true
      },
      {
        time: '03-23 10:40',
        title: '商家已同意退货退款',
        detail: '请在 7 天内寄回商品并上传物流单号。',
        done: true
      },
      {
        time: '03-23 10:32',
        title: '售后申请已提交',
        detail: '您已上传凭证并提交退货退款申请。',
        done: true
      }
    ];
  }
  if (flow === 'merchant_agree' && type === 'exchange') {
    return [
      {
        time: '03-23 10:58',
        title: '商家已发出换货商品',
        detail: '商家已寄出新货，待您签收。',
        done: false,
        current: true
      },
      {
        time: '03-23 10:52',
        title: '商家已签收退回商品',
        detail: '商家已确认收到您寄回的原商品，正在安排补发。',
        done: true
      },
      {
        time: '03-23 10:40',
        title: '商家已同意换货',
        detail: '请先寄回商品，商家签收后补发新货。',
        done: true
      },
      {
        time: '03-23 10:32',
        title: '售后申请已提交',
        detail: '您已上传凭证并提交换货申请。',
        done: true
      }
    ];
  }
  return [
    {
      time: '03-23 10:41',
      title: '平台介入审核中',
      detail: '商家拒绝退款后，您已申请平台介入，预计 24 小时内给出处理结果。',
      done: false,
      current: true
    },
    {
      time: '03-23 10:40',
      title: '已申请平台介入',
      detail: '您已提交补充材料，等待平台审核。',
      done: true
    },
    {
      time: '03-23 10:38',
      title: '商家拒绝退款',
      detail: '商家未同意本次退款申请，建议提交更多凭证。',
      done: true
    },
    {
      time: '03-23 10:32',
      title: '售后申请已提交',
      detail: '您已上传凭证并提交退款申请。',
      done: true
    }
  ];
}

function pickReason(seed: string): (typeof REFUND_REASON_OPTIONS)[number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return REFUND_REASON_OPTIONS[Math.abs(h) % REFUND_REASON_OPTIONS.length];
}

function buildEvidenceNote(productTitle: string, productSpec: string, reason: string): string {
  const shortTitle = productTitle.length > 16 ? `${productTitle.slice(0, 16)}…` : productTitle;
  const shortSpec = productSpec.length > 16 ? `${productSpec.slice(0, 16)}…` : productSpec;
  const seed = `${productTitle}|${productSpec}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) | 0;
  const tpl = Math.abs(h) % 3;
  if (tpl === 0) {
    return `补充说明：到货后第一时间拍照留证，实物「${shortTitle}」与页面描述差异明显（${reason}）；已上传开箱视频 1 段、细节图 3 张。商品保持原状未使用，仅拆封核对。`;
  }
  if (tpl === 1) {
    return `补充说明：这款「${shortTitle} / ${shortSpec}」体验和宣传不一致，实际观感与做工都低于预期；已提交正反面近照、细节局部图与订单页对比截图。`;
  }
  return `补充说明：收到后发现问题影响正常使用，和详情页描述存在出入（${reason}）。已上传实拍图、瑕疵特写及完整包装图，申请按原路退款。`;
}

function buildTrackingNo(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const n = String(Math.abs(h)).padStart(12, '0').slice(0, 12);
  return `SF${n}`;
}

export const PhoneInspectAfterSalesProgress: React.FC<Props> = ({
  onBack,
  onContactMerchant,
  shopName,
  productTitle,
  productSpec,
  refundAmount,
  afterSalesType,
  flow,
  returnTrackingNo,
  exchangeTrackingNo,
  nodes,
  refundReasonText,
  evidenceNoteText,
  afterSalesNoText
}) => {
  const renderNodes = React.useMemo(
    () => (nodes && nodes.length ? nodes : buildNodes(flow, afterSalesType)),
    [nodes, flow, afterSalesType]
  );
  const refundReason = React.useMemo(
    () => {
      const raw = String(refundReasonText || '').trim();
      if (raw && !/请生成/.test(raw)) return raw;
      return pickReason(`${shopName}|${productTitle}|${productSpec}|reason`);
    },
    [refundReasonText, shopName, productTitle, productSpec]
  );
  const evidenceNote = React.useMemo(
    () => {
      const raw = String(evidenceNoteText || '').trim();
      if (raw && !/请生成/.test(raw)) return raw;
      return buildEvidenceNote(productTitle, productSpec, refundReason);
    },
    [evidenceNoteText, productTitle, productSpec, refundReason]
  );
  const safeReturnTrackingNo = React.useMemo(
    () =>
      String(returnTrackingNo || '').trim() ||
      buildTrackingNo(`${shopName}|${productTitle}|${productSpec}|${afterSalesType}|return`),
    [returnTrackingNo, shopName, productTitle, productSpec, afterSalesType]
  );

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
      <div
        style={{
          flexShrink: 0,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #ececec'
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{ border: 'none', background: 'transparent', color: '#111827', fontSize: 18, cursor: 'pointer', padding: 0 }}
        >
          ‹
        </button>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>退款/售后进度</div>
        <span style={{ width: 18 }} />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 10px 16px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10, boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>退款进度</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: ORANGE }}>
              {flow === 'merchant_agree'
                ? afterSalesType === 'refund_only'
                  ? '已退款'
                  : afterSalesType === 'return_refund'
                    ? '商家待收货'
                    : '换货处理中'
                : '介入审核中'}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
            售后单号：{afterSalesNoText || '请生成售后单号后再查看'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>退款金额</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{refundAmount}</div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: '12px 12px 10px', marginBottom: 10, boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 62, height: 62, borderRadius: 8, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, opacity: 0.5, flexShrink: 0 }}>
              📦
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2 as any, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                {productTitle}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>{productSpec}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{shopName}</div>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: '12px 12px 10px', marginBottom: 10, boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 8 }}>退货原因（平台标准）</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>申请原因（已选）</div>
          <div style={{ fontSize: 14, color: '#111827', lineHeight: 1.6, fontWeight: 600 }}>{refundReason}</div>
          <div style={{ height: 1, backgroundColor: '#f1f5f9', margin: '10px 0' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 8 }}>补充说明</div>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{evidenceNote}</div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: '12px 12px 2px', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
          {(afterSalesType === 'return_refund' || afterSalesType === 'exchange') && flow === 'merchant_agree' ? (
            <div style={{ borderBottom: '1px solid #f1f5f9', marginBottom: 10, paddingBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
                {afterSalesType === 'return_refund' ? '退货物流' : '换货物流'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', backgroundColor: '#fff' }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>已寄出（商家待收货）</div>
                  <div style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>{safeReturnTrackingNo}</div>
                </div>
                {afterSalesType === 'exchange' ? (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', backgroundColor: '#fff' }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>商家寄出新货（待收货）</div>
                    <div style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>{exchangeTrackingNo || '待商家发货后生成'}</div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 10 }}>处理节点</div>
          {renderNodes.length ? (
            renderNodes.map((n, idx) => {
              const last = idx === renderNodes.length - 1;
              return (
                <div key={`${n.title}-${idx}`} style={{ position: 'relative', paddingLeft: 24, paddingBottom: last ? 8 : 14 }}>
                  {!last ? (
                    <div style={{ position: 'absolute', left: 6, top: 12, bottom: -2, borderLeft: '1px dashed #d1d5db' }} />
                  ) : null}
                  <div
                    style={{
                      position: 'absolute',
                      left: n.current ? 1 : 2,
                      top: 2,
                      width: n.current ? 11 : 9,
                      height: n.current ? 11 : 9,
                      borderRadius: '50%',
                      backgroundColor: n.current ? ORANGE : n.done ? '#f59e0b' : '#e5e7eb'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: n.current ? 700 : 600, color: n.current ? ORANGE : '#111827' }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>{n.time}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>{n.detail}</div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '18px 0 8px', textAlign: 'center', color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>
              暂无售后进度数据
              <div style={{ fontSize: 12, marginTop: 8, opacity: 0.85 }}>请先在查手机面板勾选“购物”并点击“一键生成”。</div>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          backgroundColor: '#fff',
          borderTop: '1px solid #ececec',
          padding: '10px 12px',
          paddingBottom: 'max(10px, env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10
        }}
      >
        <button
          type="button"
          onClick={onContactMerchant}
          style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: 999, padding: '8px 14px', fontSize: 13, color: '#374151', cursor: 'pointer' }}
        >
          联系商家
        </button>
        <button
          type="button"
          style={{ border: 'none', background: 'rgba(255,80,0,0.12)', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: ORANGE, cursor: 'default' }}
        >
          补充凭证
        </button>
      </div>
    </div>
  );
};

