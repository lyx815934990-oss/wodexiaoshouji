import React from 'react';

/** iOS 健康睡眠阶段配色（图2：清醒橙红 / REM 浅天蓝 / 核心蓝 / 深度藏青） */
export const PHONE_INSPECT_SLEEP_COLORS = {
  awake: '#ff453a',
  rem: '#64d2ff',
  core: '#007aff',
  deep: '#1c2b70'
} as const;

export type PhoneInspectSleepStageKey = keyof typeof PHONE_INSPECT_SLEEP_COLORS;

/** 单段睡眠分期（用于横向时间轴） */
export type PhoneInspectHypnoSegment = {
  stage: PhoneInspectSleepStageKey;
  /** 相对宽度权重，同一夜内总和任意正数即可 */
  weight: number;
};

/**
 * 示例数据：一晚「睡眠较好」的记录（可查手机剧情用）
 * — 卧床略长于实际入睡；清醒短；核心+深睡+REM 比例合理
 */
export const SAMPLE_PHONE_INSPECT_SLEEP_RECORD = {
  /** 顶部睡眠评分卡片 */
  score: {
    total: 96,
    levelLabel: '非常高',
    summary: '干得不错。昨晚按时就寝帮助你赢得了 96。',
    duration: 50,
    durationMax: 50,
    bedtime: 30,
    bedtimeMax: 30,
    interruption: 16,
    interruptionMax: 20
  },
  /** 「日」视图主数据 */
  day: {
    dateLabel: '2024年10月24日',
    inBedHours: 8,
    inBedMinutes: 30,
    asleepHours: 8,
    asleepMinutes: 5
  },
  /** 阶段时长（须与 asleep 总和一致或接近） */
  stages: [
    { key: 'awake' as const, label: '清醒时间', minutes: 25 },
    { key: 'rem' as const, label: '快速动眼睡眠', minutes: 110 },
    { key: 'core' as const, label: '核心睡眠', minutes: 280 },
    { key: 'deep' as const, label: '深度睡眠', minutes: 70 }
  ],
  /** 横轴刻度（展示用） */
  chartLabels: ['23:00', '01:00', '03:00', '05:00'],
  /** 简化的睡眠深度条：自上而下 awake / rem / core / deep */
  hypnogram: [
    { stage: 'awake' as const, weight: 3 },
    { stage: 'rem' as const, weight: 12 },
    { stage: 'core' as const, weight: 38 },
    { stage: 'deep' as const, weight: 14 },
    { stage: 'core' as const, weight: 22 },
    { stage: 'rem' as const, weight: 8 },
    { stage: 'deep' as const, weight: 10 },
    { stage: 'core' as const, weight: 18 },
    { stage: 'awake' as const, weight: 2 },
    { stage: 'core' as const, weight: 15 },
    { stage: 'rem' as const, weight: 6 },
    { stage: 'core' as const, weight: 20 }
  ] satisfies PhoneInspectHypnoSegment[],
  /** 过去 7 天摘要（柱状条相对高度 0–1） */
  weekSummary: {
    averageLabel: '7 小时 23 分钟',
    description: '过去 7 天中，你的平均睡眠时间为 7 小时 23 分钟。',
    bars: [0.72, 0.68, 0.85, 0.9, 0.88, 0.75, 0.92],
    dayLabels: ['五', '六', '日', '一', '二', '三', '四']
  },
  /** 「周」详情（查手机 / 睡眠详情分段） */
  rangeWeek: {
    rangeLabel: '2024年10月18日 – 10月24日',
    avgInBedHours: 7,
    avgInBedMinutes: 48,
    avgAsleepHours: 7,
    avgAsleepMinutes: 23,
    chartCaption: '睡眠时长',
    bars: [0.72, 0.68, 0.85, 0.9, 0.88, 0.75, 0.92],
    barLabels: ['五', '六', '日', '一', '二', '三', '四'],
    insight: '过去 7 天中，你的平均睡眠时间为 7 小时 23 分钟。',
    footnote: '目标范围内天数：5',
    avgStagesPerNight: [
      { key: 'awake' as const, label: '清醒时间', minutes: 22 },
      { key: 'rem' as const, label: '快速动眼睡眠', minutes: 105 },
      { key: 'core' as const, label: '核心睡眠', minutes: 268 },
      { key: 'deep' as const, label: '深度睡眠', minutes: 65 }
    ],
    totalInBedHours: 54,
    totalInBedMinutes: 36,
    totalAsleepHours: 51,
    totalAsleepMinutes: 41,
    compareBlurb: '与上一周相比，平均睡眠时间增加了约 15 分钟，就寝时间更规律。'
  },
  /** 「月」详情 */
  rangeMonth: {
    rangeLabel: '2024年10月',
    avgInBedHours: 7,
    avgInBedMinutes: 35,
    avgAsleepHours: 7,
    avgAsleepMinutes: 8,
    chartCaption: '按周',
    bars: [0.82, 0.78, 0.88, 0.85],
    barLabels: ['第 1 周', '第 2 周', '第 3 周', '第 4 周'],
    insight: '本月平均卧床时间略高于平均睡眠时间，入睡较快。',
    footnote: '本月共 31 天，有记录 28 天。',
    avgStagesPerNight: [
      { key: 'awake' as const, label: '清醒时间', minutes: 24 },
      { key: 'rem' as const, label: '快速动眼睡眠', minutes: 102 },
      { key: 'core' as const, label: '核心睡眠', minutes: 275 },
      { key: 'deep' as const, label: '深度睡眠', minutes: 59 }
    ],
    totalInBedHours: 234,
    totalInBedMinutes: 12,
    totalAsleepHours: 200,
    totalAsleepMinutes: 16,
    compareBlurb: '与上月相比，深度睡眠平均每晚增加约 6 分钟。'
  },
  /** 「6 个月」详情 */
  rangeHalfYear: {
    rangeLabel: '2024年5月 – 10月',
    avgInBedHours: 7,
    avgInBedMinutes: 40,
    avgAsleepHours: 6,
    avgAsleepMinutes: 55,
    chartCaption: '按月',
    bars: [0.76, 0.8, 0.74, 0.82, 0.79, 0.84],
    barLabels: ['5月', '6月', '7月', '8月', '9月', '10月'],
    insight: '近 6 个月睡眠时长相对稳定，秋季略好于夏季。',
    footnote: '数据为示例汇总，剧情中可替换为角色真实曲线。',
    avgStagesPerNight: [
      { key: 'awake' as const, label: '清醒时间', minutes: 28 },
      { key: 'rem' as const, label: '快速动眼睡眠', minutes: 98 },
      { key: 'core' as const, label: '核心睡眠', minutes: 262 },
      { key: 'deep' as const, label: '深度睡眠', minutes: 52 }
    ],
    totalInBedHours: 1358,
    totalInBedMinutes: 0,
    totalAsleepHours: 1205,
    totalAsleepMinutes: 30,
    compareBlurb: '与半年前相比，平均入睡时间提前了约 20 分钟，夜间清醒略减少。'
  },
  vitals: {
    label: '生命体征',
    status: '正常'
  }
};

/** 查手机健康·睡眠：与 `SAMPLE_PHONE_INSPECT_SLEEP_RECORD` 同结构的 AI 生成结果类型 */
export type PhoneInspectSleepRecordData = typeof SAMPLE_PHONE_INSPECT_SLEEP_RECORD;

const SLEEP_STAGE_KEYS: PhoneInspectSleepStageKey[] = ['awake', 'rem', 'core', 'deep'];

function cloneSampleSleep(): PhoneInspectSleepRecordData {
  return JSON.parse(JSON.stringify(SAMPLE_PHONE_INSPECT_SLEEP_RECORD)) as PhoneInspectSleepRecordData;
}

function padNums(src: unknown[], len: number, fallback: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < len; i++) {
    const v = Number(src[i]);
    if (Number.isFinite(v)) out.push(Math.min(1, Math.max(0, v)));
    else out.push(fallback[i] ?? 0.5);
  }
  return out;
}

function padStrs(src: unknown[], len: string[], fallback: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < len.length; i++) {
    const raw = src[i];
    const t = typeof raw === 'string' ? raw : typeof raw === 'number' ? String(raw) : '';
    out.push(t.trim() || fallback[i] || '');
  }
  return out;
}

function mergeAvgStages(
  target: PhoneInspectSleepRecordData['rangeWeek']['avgStagesPerNight'],
  src: unknown
): void {
  if (!Array.isArray(src)) return;
  const next: typeof target = [];
  for (let i = 0; i < 4; i++) {
    const row = src[i];
    const fb = target[i];
    if (!row || typeof row !== 'object') {
      if (fb) next.push({ ...fb });
      continue;
    }
    const o = row as Record<string, unknown>;
    const key = String(o.key || fb?.key || 'core');
    const stage = SLEEP_STAGE_KEYS.includes(key as PhoneInspectSleepStageKey) ? (key as PhoneInspectSleepStageKey) : fb?.key || 'core';
    next.push({
      key: stage,
      label: String(o.label || fb?.label || stage),
      minutes: Math.max(0, Number(o.minutes) || fb?.minutes || 0)
    });
  }
  if (next.length === 4) {
    (target as PhoneInspectSleepRecordData['rangeWeek']['avgStagesPerNight']) = next as any;
  }
}

function mergeRangeCfg(
  baseRange: PhoneInspectSleepRecordData['rangeWeek'],
  raw: unknown,
  barCount: number
): void {
  if (!raw || typeof raw !== 'object') return;
  const o = raw as Record<string, unknown>;
  if (typeof o.rangeLabel === 'string') baseRange.rangeLabel = o.rangeLabel;
  if (typeof o.chartCaption === 'string') baseRange.chartCaption = o.chartCaption;
  if (typeof o.insight === 'string') baseRange.insight = o.insight;
  if (typeof o.footnote === 'string') baseRange.footnote = o.footnote;
  if (typeof o.compareBlurb === 'string') baseRange.compareBlurb = o.compareBlurb;
  baseRange.avgInBedHours = Number(o.avgInBedHours) || baseRange.avgInBedHours;
  baseRange.avgInBedMinutes = Number(o.avgInBedMinutes) || baseRange.avgInBedMinutes;
  baseRange.avgAsleepHours = Number(o.avgAsleepHours) || baseRange.avgAsleepHours;
  baseRange.avgAsleepMinutes = Number(o.avgAsleepMinutes) || baseRange.avgAsleepMinutes;
  baseRange.totalInBedHours = Number(o.totalInBedHours) || baseRange.totalInBedHours;
  baseRange.totalInBedMinutes = Number(o.totalInBedMinutes) || baseRange.totalInBedMinutes;
  baseRange.totalAsleepHours = Number(o.totalAsleepHours) || baseRange.totalAsleepHours;
  baseRange.totalAsleepMinutes = Number(o.totalAsleepMinutes) || baseRange.totalAsleepMinutes;
  if (Array.isArray(o.bars)) baseRange.bars = padNums(o.bars, barCount, baseRange.bars);
  if (Array.isArray(o.barLabels)) {
    const fb = baseRange.barLabels;
    const want = fb.map((_, i) => i);
    baseRange.barLabels = padStrs(o.barLabels, want as unknown as string[], fb);
  }
  mergeAvgStages(baseRange.avgStagesPerNight, o.avgStagesPerNight);
}

/**
 * 将模型返回的 JSON 规整为可安全渲染的睡眠数据结构；无法识别的字段保留示例默认值。
 */
export function normalizePhoneInspectSleepPayload(raw: unknown): PhoneInspectSleepRecordData {
  const base = cloneSampleSleep();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;

  if (r.score && typeof r.score === 'object') {
    const s = r.score as Record<string, unknown>;
    const sc = base.score;
    const t = Number(s.total);
    if (Number.isFinite(t)) sc.total = Math.min(100, Math.max(0, Math.round(t)));
    if (typeof s.levelLabel === 'string') sc.levelLabel = s.levelLabel;
    if (typeof s.summary === 'string') sc.summary = s.summary;
    sc.duration = Number(s.duration) || sc.duration;
    sc.durationMax = Number(s.durationMax) || sc.durationMax;
    sc.bedtime = Number(s.bedtime) || sc.bedtime;
    sc.bedtimeMax = Number(s.bedtimeMax) || sc.bedtimeMax;
    sc.interruption = Number(s.interruption) || sc.interruption;
    sc.interruptionMax = Number(s.interruptionMax) || sc.interruptionMax;
  }

  if (r.day && typeof r.day === 'object') {
    const d = r.day as Record<string, unknown>;
    if (typeof d.dateLabel === 'string') base.day.dateLabel = d.dateLabel;
    base.day.inBedHours = Number(d.inBedHours) || base.day.inBedHours;
    base.day.inBedMinutes = Number(d.inBedMinutes) || base.day.inBedMinutes;
    base.day.asleepHours = Number(d.asleepHours) || base.day.asleepHours;
    base.day.asleepMinutes = Number(d.asleepMinutes) || base.day.asleepMinutes;
  }

  if (Array.isArray(r.stages)) {
    const next = r.stages
      .map((x) => {
        if (!x || typeof x !== 'object') return null;
        const it = x as Record<string, unknown>;
        const key = String(it.key || '');
        if (!SLEEP_STAGE_KEYS.includes(key as PhoneInspectSleepStageKey)) return null;
        return {
          key: key as PhoneInspectSleepStageKey,
          label: String(it.label || base.stages.find((st) => st.key === key)?.label || key),
          minutes: Math.max(0, Number(it.minutes) || 0)
        };
      })
      .filter(Boolean) as PhoneInspectSleepRecordData['stages'];
    if (next.length === 4) base.stages = next;
  }

  if (Array.isArray(r.chartLabels) && r.chartLabels.length >= 4) {
    base.chartLabels = r.chartLabels.slice(0, 4).map((x) => String(x));
  }

  if (Array.isArray(r.hypnogram) && r.hypnogram.length > 0) {
    const segs = r.hypnogram
      .map((x) => {
        if (!x || typeof x !== 'object') return null;
        const it = x as Record<string, unknown>;
        const key = String(it.stage || it.key || '');
        if (!SLEEP_STAGE_KEYS.includes(key as PhoneInspectSleepStageKey)) return null;
        const w = Number(it.weight);
        return {
          stage: key as PhoneInspectSleepStageKey,
          weight: Number.isFinite(w) && w > 0 ? w : 10
        };
      })
      .filter(Boolean) as PhoneInspectHypnoSegment[];
    if (segs.length) base.hypnogram = segs;
  }

  if (r.weekSummary && typeof r.weekSummary === 'object') {
    const w = r.weekSummary as Record<string, unknown>;
    if (typeof w.averageLabel === 'string') base.weekSummary.averageLabel = w.averageLabel;
    if (typeof w.description === 'string') base.weekSummary.description = w.description;
    if (Array.isArray(w.bars)) base.weekSummary.bars = padNums(w.bars, 7, base.weekSummary.bars);
    if (Array.isArray(w.dayLabels)) {
      const fb = base.weekSummary.dayLabels;
      base.weekSummary.dayLabels = padStrs(w.dayLabels, fb, fb);
    }
  }

  mergeRangeCfg(base.rangeWeek, r.rangeWeek, 7);
  mergeRangeCfg(base.rangeMonth, r.rangeMonth, 4);
  mergeRangeCfg(base.rangeHalfYear, r.rangeHalfYear, 6);

  if (r.vitals && typeof r.vitals === 'object') {
    const v = r.vitals as Record<string, unknown>;
    if (typeof v.label === 'string') base.vitals.label = v.label;
    if (typeof v.status === 'string') base.vitals.status = v.status;
  }

  return base;
}

function formatHm(h: number, m: number): string {
  if (h <= 0 && m <= 0) return '0 分钟';
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} 小时`);
  if (m > 0) parts.push(`${m} 分钟`);
  return parts.join(' ');
}

function formatStageMinutes(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
  }
  return `${minutes} 分钟`;
}

/** 详情页「7 小时 9 分钟」样式：数字大号加粗，「小时」「分钟」略小（对齐 iOS 图2） */
const SleepDurationBigDisplay: React.FC<{ hours: number; minutes: number }> = ({ hours, minutes }) => {
  if (hours <= 0 && minutes <= 0) {
    return (
      <span style={{ fontSize: 28, fontWeight: 700, color: '#000', letterSpacing: -0.35 }}>0 分钟</span>
    );
  }
  const numStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 700,
    color: '#000',
    letterSpacing: -0.4
  };
  const unitStyle: React.CSSProperties = {
    fontSize: 17,
    fontWeight: 600,
    color: '#000'
  };
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        columnGap: 4,
        rowGap: 2,
        marginTop: 2
      }}
    >
      {hours > 0 ? (
        <>
          <span style={numStyle}>{hours}</span>
          <span style={unitStyle}>小时</span>
        </>
      ) : null}
      {minutes > 0 ? (
        <>
          <span style={numStyle}>{minutes}</span>
          <span style={unitStyle}>分钟</span>
        </>
      ) : null}
    </div>
  );
};

/**
 * 分期条在图内的纵向位置（自上而下四档，与 iOS 健康一致）：
 * 顶 = 清醒（薄）→ REM → 核心 → 底 = 深度
 */
function sleepStageBandPct(stage: PhoneInspectSleepStageKey): { top: number; height: number } {
  switch (stage) {
    case 'awake':
      return { top: 5, height: 13 };
    case 'rem':
      return { top: 20, height: 23 };
    case 'core':
      return { top: 45, height: 28 };
    case 'deep':
      return { top: 75, height: 23 };
  }
}

/** 四档之间的横向参考线位置（与 sleepStageBandPct 档界对齐，仅用于详情大图） */
const SLEEP_CHART_LANE_DIVIDER_PCTS = [18, 43, 73] as const;

/** 横向时间轴：每段占一列，色块落在对应睡眠档位的垂直区间内 */
const SleepHypnogramStrip: React.FC<{
  segments: PhoneInspectHypnoSegment[];
  gap?: number;
  style?: React.CSSProperties;
}> = ({ segments, gap = 0, style }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'stretch',
      minHeight: 0,
      minWidth: 0,
      gap,
      ...style
    }}
  >
    {segments.map((seg, i) => {
      const b = sleepStageBandPct(seg.stage);
      return (
        <div key={`hyp-${i}`} style={{ flex: seg.weight, position: 'relative', minWidth: 0, height: '100%' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${b.top}%`,
              height: `${b.height}%`,
              backgroundColor: PHONE_INSPECT_SLEEP_COLORS[seg.stage],
              borderRadius: 3,
              opacity: 0.96
            }}
          />
        </div>
      );
    })}
  </div>
);

type TabId = 'day' | 'week' | 'month' | 'half';

type SleepRecordShape = typeof SAMPLE_PHONE_INSPECT_SLEEP_RECORD;

type SleepRangeCfg = SleepRecordShape['rangeWeek'];
type StageTabId = 'stages' | 'amount' | 'compare';

function pickSleepRangeCfg(tab: Exclude<TabId, 'day'>, data: SleepRecordShape): SleepRangeCfg {
  if (tab === 'week') return data.rangeWeek;
  if (tab === 'month') return data.rangeMonth;
  return data.rangeHalfYear;
}

/** 周 / 月 / 6 个月：柱状趋势 + 左侧 Y 轴（小时刻度）与横向基准线 */
const SleepRangeBarsChart: React.FC<{
  bars: number[];
  labels: string[];
  barAreaHeight?: number;
  /** 纵轴最大值（小时），柱高按 h∈[0,1] 映射到 0～maxHours */
  maxHours?: number;
  /** 紫色目标线高度（小时），默认 7.5 */
  targetHours?: number;
}> = ({ bars, labels, barAreaHeight = 80, maxHours = 10, targetHours = 7.5 }) => {
  const yTickHours = React.useMemo(() => {
    const out: number[] = [];
    for (let v = maxHours; v >= 0; v -= 2) out.push(v);
    if (out[out.length - 1] !== 0) out.push(0);
    return out;
  }, [maxHours]);

  const plotH = barAreaHeight;
  const padY = 6;
  const innerBarMax = Math.max(24, plotH - padY * 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 6, paddingTop: 4 }}>
      <div
        style={{
          width: 34,
          flexShrink: 0,
          position: 'relative',
          height: plotH,
          marginTop: 2
        }}
        aria-hidden
      >
        {yTickHours.map((hv) => (
          <div
            key={hv}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${((maxHours - hv) / maxHours) * 100}%`,
              transform: 'translateY(-50%)',
              textAlign: 'right',
              lineHeight: 1.1
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 500, color: '#8e8e93' }}>{hv}</span>
            <span style={{ fontSize: 9, color: '#aeaeb2' }}>小时</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            position: 'relative',
            height: plotH,
            borderLeft: '1px solid #e5e5ea',
            borderBottom: '1px solid #c7c7cc',
            borderTop: '1px solid #e5e5ea',
            borderRight: '1px solid #e5e5ea',
            borderRadius: 4,
            overflow: 'hidden',
            backgroundColor: '#fafafa'
          }}
        >
          {yTickHours
            .filter((hv) => hv > 0 && hv < maxHours)
            .map((hv) => (
              <div
                key={`grid-${hv}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: `${(hv / maxHours) * 100}%`,
                  height: 0,
                  borderTop: '1px dashed rgba(60, 60, 67, 0.14)',
                  pointerEvents: 'none',
                  zIndex: 0
                }}
              />
            ))}
          {targetHours > 0 && targetHours < maxHours ? (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${(targetHours / maxHours) * 100}%`,
                height: 2,
                marginBottom: -1,
                backgroundColor: '#af52de',
                opacity: 0.9,
                zIndex: 2,
                pointerEvents: 'none'
              }}
            />
          ) : null}
          <div
            style={{
              position: 'absolute',
              left: padY,
              right: padY,
              top: padY,
              bottom: padY,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 3,
              zIndex: 1
            }}
          >
            {bars.map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  minWidth: 0,
                  height: '100%'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: 28,
                    height: Math.max(2, Math.round(innerBarMax * h)),
                    borderRadius: 5,
                    background: 'linear-gradient(180deg, #7b8ef0 0%, #5b6fd6 55%, #4a5fc9 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 3,
            marginTop: 8,
            paddingLeft: 2,
            paddingRight: 2
          }}
        >
          {bars.map((_, i) => (
            <span
              key={i}
              style={{
                flex: 1,
                fontSize: 10,
                color: '#8e8e93',
                textAlign: 'center',
                lineHeight: 1.2,
                wordBreak: 'keep-all',
                minWidth: 0
              }}
            >
              {labels[i] ?? ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/** 睡眠详情里「周 / 月 / 6个月」整块内容 */
const PhoneInspectSleepRangeDetailBody: React.FC<{
  cfg: SleepRangeCfg;
  stageTab: StageTabId;
  setStageTab: (t: StageTabId) => void;
}> = ({ cfg, stageTab, setStageTab }) => (
  <>
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 10
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#8e8e93' }}>平均卧床时间</div>
        <SleepDurationBigDisplay hours={cfg.avgInBedHours} minutes={cfg.avgInBedMinutes} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#8e8e93' }}>平均睡眠时间</div>
        <SleepDurationBigDisplay hours={cfg.avgAsleepHours} minutes={cfg.avgAsleepMinutes} />
      </div>
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 14
      }}
    >
      <span style={{ fontSize: 13, color: '#8e8e93' }}>{cfg.rangeLabel}</span>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: '2px solid #007aff',
          color: '#007aff',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
        aria-hidden
      >
        i
      </div>
    </div>

    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: '14px 12px 16px',
        marginBottom: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 0 rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, color: '#000', marginBottom: 8 }}>{cfg.chartCaption}</div>
      <SleepRangeBarsChart bars={cfg.bars} labels={cfg.barLabels} barAreaHeight={88} />
      <div style={{ fontSize: 13, color: '#3a3a3c', lineHeight: 1.45, marginTop: 8 }}>{cfg.insight}</div>
      {cfg.footnote ? (
        <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 10, lineHeight: 1.35 }}>{cfg.footnote}</div>
      ) : null}
    </div>

    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: '12px 12px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 0 rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ display: 'flex', backgroundColor: '#e5e5ea', borderRadius: 8, padding: 2, marginBottom: 8 }}>
        {(
          [
            ['stages', '阶段'],
            ['amount', '总量'],
            ['compare', '比较']
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setStageTab(id)}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: 6,
              padding: '5px 0',
              fontSize: 12,
              fontWeight: stageTab === id ? 600 : 500,
              backgroundColor: stageTab === id ? '#fff' : 'transparent',
              cursor: 'pointer'
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {stageTab === 'stages' &&
        cfg.avgStagesPerNight.map((row, idx) => (
          <div
            key={row.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '16px 8px',
              borderTop: idx === 0 ? 'none' : '1px solid #e5e5ea'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: PHONE_INSPECT_SLEEP_COLORS[row.key],
                  flexShrink: 0
                }}
              />
              <span style={{ fontSize: 17, color: '#000' }}>{row.label}</span>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: '#8e8e93', marginBottom: 2 }}>每晚平均</div>
              <div style={{ fontSize: 17, color: '#000', fontWeight: 600 }}>{formatStageMinutes(row.minutes)}</div>
            </div>
          </div>
        ))}
      {stageTab === 'amount' && (
        <div style={{ padding: '8px 4px 4px' }}>
          <div style={{ fontSize: 13, color: '#8e8e93', marginBottom: 12 }}>所选区间内合计（示例数据）</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#8e8e93' }}>卧床时间</div>
            <SleepDurationBigDisplay hours={cfg.totalInBedHours} minutes={cfg.totalInBedMinutes} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#8e8e93' }}>睡眠时间</div>
            <SleepDurationBigDisplay hours={cfg.totalAsleepHours} minutes={cfg.totalAsleepMinutes} />
          </div>
        </div>
      )}
      {stageTab === 'compare' && (
        <div
          style={{
            padding: '16px 8px',
            fontSize: 15,
            color: '#3a3a3c',
            lineHeight: 1.5
          }}
        >
          {cfg.compareBlurb}
        </div>
      )}
    </div>
  </>
);

/** 健康 · 睡眠总览里「周 / 月 / 6个月」简化页（无底部三段切换） */
const PhoneInspectSleepRangePanelBody: React.FC<{ cfg: SleepRangeCfg }> = ({ cfg }) => (
  <div
    style={{
      backgroundColor: '#fff',
      borderRadius: 14,
      padding: '14px 14px 16px',
      marginBottom: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 0 rgba(0,0,0,0.04)'
    }}
  >
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 10
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#8e8e93' }}>平均卧床时间</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#000', marginTop: 4 }}>
          {formatHm(cfg.avgInBedHours, cfg.avgInBedMinutes)}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#8e8e93' }}>平均睡眠时间</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#000', marginTop: 4 }}>
          {formatHm(cfg.avgAsleepHours, cfg.avgAsleepMinutes)}
        </div>
      </div>
    </div>
    <div style={{ fontSize: 13, color: '#8e8e93', marginBottom: 14 }}>{cfg.rangeLabel}</div>
    <div style={{ fontSize: 15, fontWeight: 600, color: '#000', marginBottom: 8 }}>{cfg.chartCaption}</div>
    <SleepRangeBarsChart bars={cfg.bars} labels={cfg.barLabels} barAreaHeight={76} />
    <div style={{ fontSize: 13, color: '#3a3a3c', lineHeight: 1.45, marginTop: 8 }}>{cfg.insight}</div>
    {cfg.footnote ? (
      <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 10, lineHeight: 1.35 }}>{cfg.footnote}</div>
    ) : null}
  </div>
);

/** iOS「睡眠」日视图详情页：卧床/入睡 + 虚线时间网格 + 分期列表 */
const PhoneInspectSleepDayDetail: React.FC<{
  data: SleepRecordShape;
  onClose: () => void;
  /** 打开时默认选中的分段：主页「全部显示」可传入「周」 */
  initialRangeTab?: TabId;
}> = ({ data, onClose, initialRangeTab = 'day' }) => {
  const [rangeTab, setRangeTab] = React.useState<TabId>(initialRangeTab);
  const [stageTab, setStageTab] = React.useState<'stages' | 'amount' | 'compare'>('stages');

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f2f2f7'
      }}
    >
      <div
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px',
          borderBottom: '1px solid #d1d1d6',
          backgroundColor: '#f2f2f7',
          flexShrink: 0
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#007aff',
            fontSize: 17,
            cursor: 'pointer',
            padding: '6px 4px',
            minWidth: 56,
            textAlign: 'left'
          }}
          aria-label="返回"
        >
          ‹
        </button>
        <div style={{ fontSize: 17, fontWeight: 600, color: '#000' }}>睡眠</div>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#007aff',
            fontSize: 17,
            cursor: 'pointer',
            padding: '6px 4px',
            minWidth: 56,
            textAlign: 'right'
          }}
        >
          完成
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 12px 20px' }}>
        <div
          style={{
            display: 'flex',
            backgroundColor: '#e5e5ea',
            borderRadius: 10,
            padding: 2,
            marginBottom: 14
          }}
        >
          {(
            [
              ['day', '日'],
              ['week', '周'],
              ['month', '月'],
              ['half', '6个月']
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRangeTab(id)}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: 8,
                padding: '6px 0',
                fontSize: 13,
                fontWeight: rangeTab === id ? 600 : 500,
                backgroundColor: rangeTab === id ? '#fff' : 'transparent',
                color: '#000',
                cursor: 'pointer',
                boxShadow: rangeTab === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {rangeTab === 'day' ? (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: 10
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#8e8e93' }}>卧床时间</div>
                <SleepDurationBigDisplay hours={data.day.inBedHours} minutes={data.day.inBedMinutes} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#8e8e93' }}>睡眠时间</div>
                <SleepDurationBigDisplay hours={data.day.asleepHours} minutes={data.day.asleepMinutes} />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                marginBottom: 16
              }}
            >
              <span style={{ fontSize: 13, color: '#8e8e93' }}>{data.day.dateLabel}</span>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: '2px solid #007aff',
                  color: '#007aff',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                aria-hidden
              >
                i
              </div>
            </div>

            {/* 分期图：左侧 Y 轴 + 横向分档线（图2）+ 虚线竖格 + 彩色条，整体加高 */}
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                padding: '14px 12px 16px',
                marginBottom: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 0 rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '82px 1fr', gap: 8, alignItems: 'stretch' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: '#8e8e93',
                    lineHeight: 1.2,
                    padding: '12px 0 32px',
                    fontWeight: 500
                  }}
                >
                  <span>清醒时间</span>
                  <span>快速动眼睡眠</span>
                  <span>核心睡眠</span>
                  <span>深度睡眠</span>
                </div>
                <div style={{ position: 'relative', minHeight: 228 }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 12,
                      bottom: 34,
                      pointerEvents: 'none',
                      zIndex: 0
                    }}
                  >
                    {SLEEP_CHART_LANE_DIVIDER_PCTS.map((pct) => (
                      <div
                        key={pct}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: `${pct}%`,
                          borderTop: '1px solid rgba(60, 60, 67, 0.1)'
                        }}
                      />
                    ))}
                  </div>
                  {data.chartLabels.map((_, gi) => (
                    <div
                      key={`grid-${gi}`}
                      style={{
                        position: 'absolute',
                        left: `${(gi / Math.max(1, data.chartLabels.length - 1)) * 100}%`,
                        top: 0,
                        bottom: 34,
                        width: 0,
                        borderLeft: '1px dashed #d1d1d6',
                        transform: 'translateX(-50%)',
                        pointerEvents: 'none',
                        zIndex: 1
                      }}
                    />
                  ))}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 12,
                      bottom: 34,
                      zIndex: 2
                    }}
                  >
                    <SleepHypnogramStrip segments={data.hypnogram} style={{ width: '100%', height: '100%' }} />
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: '#8e8e93',
                      paddingTop: 10
                    }}
                  >
                    {data.chartLabels.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                padding: '12px 12px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 0 rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', backgroundColor: '#e5e5ea', borderRadius: 8, padding: 2, marginBottom: 8 }}>
                {(
                  [
                    ['stages', '阶段'],
                    ['amount', '总量'],
                    ['compare', '比较']
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStageTab(id)}
                    style={{
                      flex: 1,
                      border: 'none',
                      borderRadius: 6,
                      padding: '5px 0',
                      fontSize: 12,
                      fontWeight: stageTab === id ? 600 : 500,
                      backgroundColor: stageTab === id ? '#fff' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {data.stages.map((row, idx) => (
                <div
                  key={row.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 8px',
                    borderTop: idx === 0 ? 'none' : '1px solid #e5e5ea'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: PHONE_INSPECT_SLEEP_COLORS[row.key],
                        flexShrink: 0
                      }}
                    />
                    <span style={{ fontSize: 17, color: '#000' }}>{row.label}</span>
                  </div>
                  <span style={{ fontSize: 17, color: '#000', fontWeight: 600 }}>
                    {formatStageMinutes(row.minutes)}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <PhoneInspectSleepRangeDetailBody
            cfg={pickSleepRangeCfg(rangeTab, data)}
            stageTab={stageTab}
            setStageTab={setStageTab}
          />
        )}
      </div>
    </div>
  );
};

export type PhoneInspectHealthSleepPanelProps = {
  onBack: () => void;
  /** 无缓存时可选：打开父级「内容偏向」流程后再生成 */
  onRequestGenerate?: () => void;
  /** 查手机 AI 生成的睡眠数据；无本地缓存时为 null，界面显示占位 */
  data?: PhoneInspectSleepRecordData | null;
  genError?: string | null;
  sleepGenerating?: boolean;
};

export const PhoneInspectHealthSleepPanel: React.FC<PhoneInspectHealthSleepPanelProps> = ({
  onBack,
  onRequestGenerate,
  data: dataProp,
  genError,
  sleepGenerating
}) => {
  const [tab, setTab] = React.useState<TabId>('day');
  const [sleepDetailOpen, setSleepDetailOpen] = React.useState(false);
  const [sleepDetailInitialTab, setSleepDetailInitialTab] = React.useState<TabId>('day');

  const hasData = dataProp != null;

  if (!hasData) {
    return (
      <div
        style={{
          minHeight: '100%',
          backgroundColor: '#f2f2f7',
          display: 'flex',
          flexDirection: 'column',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", Arial, sans-serif'
        }}
      >
        <div
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            borderBottom: '1px solid #d1d1d6',
            backgroundColor: '#f2f2f7',
            flexShrink: 0
          }}
        >
          <button
            type="button"
            onClick={onBack}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#007aff',
              fontSize: 17,
              cursor: 'pointer',
              padding: '6px 4px'
            }}
          >
            ‹ 健康
          </button>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#000' }}>睡眠</div>
          <button
            type="button"
            onClick={onBack}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#007aff',
              fontSize: 17,
              cursor: 'pointer',
              padding: '6px 4px'
            }}
          >
            完成
          </button>
        </div>

        {(sleepGenerating || genError) && (
          <div
            style={{
              padding: '8px 12px',
              fontSize: 12,
              lineHeight: 1.4,
              backgroundColor: genError ? '#fef2f2' : '#eff6ff',
              color: genError ? '#b91c1c' : '#1d4ed8',
              borderBottom: '1px solid #e5e7eb',
              flexShrink: 0
            }}
          >
            {genError || (sleepGenerating ? '正在生成睡眠数据…' : '')}
          </div>
        )}

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 24px'
          }}
        >
          <span
            style={{
              fontSize: 44,
              fontWeight: 200,
              color: '#c7c7cc',
              lineHeight: 1,
              letterSpacing: 2,
              userSelect: 'none'
            }}
            aria-hidden
          >
            —
          </span>
          <p style={{ margin: '14px 0 0', fontSize: 13, color: '#8e8e93', textAlign: 'center' }}>
            暂无睡眠记录
          </p>
          {onRequestGenerate ? (
            <button
              type="button"
              onClick={() => {
                if (!sleepGenerating) onRequestGenerate();
              }}
              disabled={!!sleepGenerating}
              style={{
                marginTop: 18,
                border: 'none',
                borderRadius: 10,
                backgroundColor: sleepGenerating ? '#c7c7cc' : '#007aff',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                padding: '10px 22px',
                cursor: sleepGenerating ? 'not-allowed' : 'pointer'
              }}
            >
              {sleepGenerating ? '生成中…' : '生成睡眠记录'}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const data = dataProp as PhoneInspectSleepRecordData;
  const score = data.score;
  const sumMax = score.durationMax + score.bedtimeMax + score.interruptionMax;
  const degDur = (score.duration / sumMax) * 360;
  const degBed = (score.bedtime / sumMax) * 360;
  const c1 = degDur;
  const c2 = c1 + degBed;
  /** 与图2 一致：时长蓝 / 就寝青绿 / 中断珊瑚橙 */
  const scoreRingBlue = '#007aff';
  const scoreRingTeal = '#32d4c0';
  const scoreRingCoral = '#ff6b4a';
  const conic = `conic-gradient(from -90deg, ${scoreRingBlue} 0deg ${c1}deg, ${scoreRingTeal} ${c1}deg ${c2}deg, ${scoreRingCoral} ${c2}deg 360deg)`;

  return (
    <div
      style={{
        minHeight: '100%',
        backgroundColor: '#f2f2f7',
        display: 'flex',
        flexDirection: 'column',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", Arial, sans-serif'
      }}
    >
      {sleepDetailOpen ? (
        <PhoneInspectSleepDayDetail
          key={sleepDetailInitialTab}
          data={data}
          onClose={() => setSleepDetailOpen(false)}
          initialRangeTab={sleepDetailInitialTab}
        />
      ) : (
        <>
          <div
            style={{
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 10px',
              borderBottom: '1px solid #d1d1d6',
              backgroundColor: '#f2f2f7',
              flexShrink: 0
            }}
          >
            <button
              type="button"
              onClick={onBack}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#007aff',
                fontSize: 17,
                cursor: 'pointer',
                padding: '6px 4px'
              }}
            >
              ‹ 健康
            </button>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#000' }}>睡眠</div>
            <button
              type="button"
              onClick={onBack}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#007aff',
                fontSize: 17,
                cursor: 'pointer',
                padding: '6px 4px'
              }}
            >
              完成
            </button>
          </div>

          {(sleepGenerating || genError) && (
            <div
              style={{
                padding: '8px 12px',
                fontSize: 12,
                lineHeight: 1.4,
                backgroundColor: genError ? '#fef2f2' : '#eff6ff',
                color: genError ? '#b91c1c' : '#1d4ed8',
                borderBottom: '1px solid #e5e7eb',
                flexShrink: 0
              }}
            >
              {genError || (sleepGenerating ? '正在生成睡眠数据…' : '')}
            </div>
          )}

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 12px 20px' }}>
        {/* 分段：日 / 周 / 月 / 6个月 */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#e5e5ea',
            borderRadius: 10,
            padding: 2,
            marginBottom: 12
          }}
        >
          {(
            [
              ['day', '日'],
              ['week', '周'],
              ['month', '月'],
              ['half', '6个月']
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: 8,
                padding: '6px 0',
                fontSize: 13,
                fontWeight: tab === id ? 600 : 500,
                backgroundColor: tab === id ? '#fff' : 'transparent',
                color: '#000',
                cursor: 'pointer',
                boxShadow: tab === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'day' && (
          <>
            {/* 睡眠评分主卡片（布局对齐图2：紫标题 · 左文+色点指标 · 右环图 · 底部分隔+洞察） */}
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                padding: '14px 14px 0',
                marginBottom: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 0 rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#af52de' }}>睡眠评分</span>
                <span style={{ color: '#c7c7cc', fontSize: 18, lineHeight: 1 }}>›</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  paddingBottom: 14
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#000', lineHeight: 1.1 }}>{score.levelLabel}</div>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { color: scoreRingBlue, text: `时长: ${score.duration}/${score.durationMax}` },
                      { color: scoreRingTeal, text: `就寝: ${score.bedtime}/${score.bedtimeMax}` },
                      { color: scoreRingCoral, text: `中断: ${score.interruption}/${score.interruptionMax}` }
                    ].map((row) => (
                      <div
                        key={row.text}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: row.color,
                            flexShrink: 0
                          }}
                        />
                        <span style={{ fontSize: 15, fontWeight: 500, color: '#000' }}>{row.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ position: 'relative', width: 104, height: 104, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 104,
                      height: 104,
                      borderRadius: '50%',
                      background: conic,
                      WebkitMask: 'radial-gradient(transparent 58%, #000 59%)',
                      mask: 'radial-gradient(transparent 58%, #000 59%)'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 30,
                      fontWeight: 700,
                      color: '#000',
                      pointerEvents: 'none',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {score.total}
                  </div>
                </div>
              </div>
              <div
                style={{
                  borderTop: '1px solid #e5e5ea',
                  padding: '12px 0 14px',
                  margin: '0 -14px',
                  paddingLeft: 14,
                  paddingRight: 14
                }}
              >
                <p style={{ margin: 0, fontSize: 13, color: '#636366', lineHeight: 1.45 }}>{score.summary}</p>
              </div>
            </div>

            {/* 双卡片：睡眠条 + 生命体征 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setSleepDetailInitialTab('day');
                  setSleepDetailOpen(true);
                }}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  padding: 12,
                  minHeight: 120,
                  boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  font: 'inherit',
                  color: 'inherit'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>睡眠</span>
                  <span style={{ color: '#c7c7cc' }}>›</span>
                </div>
                <SleepHypnogramStrip segments={data.hypnogram} gap={1} style={{ height: 40, marginBottom: 8 }} />
                <div style={{ fontSize: 20, fontWeight: 700, color: '#000' }}>
                  {formatHm(data.day.asleepHours, data.day.asleepMinutes)}
                </div>
              </button>
              <div
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  padding: 12,
                  minHeight: 120,
                  boxShadow: '0 1px 0 rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{data.vitals.label}</span>
                  <span style={{ color: '#c7c7cc' }}>›</span>
                </div>
                <div
                  style={{
                    height: 48,
                    background: 'linear-gradient(180deg, #e8f4ff 0%, #f5f9ff 100%)',
                    borderRadius: 8,
                    marginBottom: 8,
                    position: 'relative'
                  }}
                >
                  {[0.2, 0.45, 0.35, 0.6].map((x, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${20 + x * 60}%`,
                        top: `${15 + (i % 2) * 12}px`,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: '#007aff',
                        opacity: 0.85
                      }}
                    />
                  ))}
                </div>
                <div style={{ fontSize: 17, fontWeight: 600, color: '#34c759' }}>{data.vitals.status}</div>
              </div>
            </div>

            {/* 卧床 / 入睡 */}
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 12,
                boxShadow: '0 1px 0 rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#3a3a3c', fontWeight: 500 }}>卧床时间</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: '#000' }}>
                    {formatHm(data.day.inBedHours, data.day.inBedMinutes)}
                  </div>
                  <div style={{ fontSize: 13, color: '#3a3a3c', fontWeight: 500, marginTop: 10 }}>睡眠时间</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: '#000' }}>
                    {formatHm(data.day.asleepHours, data.day.asleepMinutes)}
                  </div>
                  <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 8 }}>{data.day.dateLabel}</div>
                </div>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '2px solid #007aff',
                    color: '#007aff',
                    fontSize: 14,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  i
                </div>
              </div>
            </div>

            {/* 摘要：7 天 */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#000' }}>摘要</span>
                <button
                  type="button"
                  onClick={() => {
                    setSleepDetailInitialTab('week');
                    setSleepDetailOpen(true);
                  }}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    fontSize: 15,
                    color: '#007aff',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  全部显示
                </button>
              </div>
              <div
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  padding: '14px 14px 16px',
                  boxShadow: '0 1px 0 rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20, lineHeight: 1 }} aria-hidden>
                    🛏
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#3a3a3c' }}>睡眠</span>
                </div>
                <div style={{ fontSize: 13, color: '#3a3a3c', lineHeight: 1.45, marginBottom: 12 }}>
                  {data.weekSummary.description}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: '#000', letterSpacing: -0.3 }}>
                  {data.weekSummary.averageLabel}
                </div>
                <div style={{ position: 'relative', height: 100, paddingTop: 8 }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 38,
                      height: 1,
                      backgroundColor: '#af52de',
                      opacity: 0.85,
                      zIndex: 1
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, gap: 4 }}>
                    {data.weekSummary.bars.map((h, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div
                          style={{
                            width: '100%',
                            maxWidth: 32,
                            height: Math.round(56 * h),
                            borderRadius: 5,
                            background: 'linear-gradient(180deg, #7b8ef0 0%, #5b6fd6 55%, #4a5fc9 100%)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)'
                          }}
                        />
                        <span style={{ fontSize: 11, color: '#636366', fontWeight: 500 }}>{data.weekSummary.dayLabels[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab !== 'day' && <PhoneInspectSleepRangePanelBody cfg={pickSleepRangeCfg(tab, data)} />}
      </div>
        </>
      )}
    </div>
  );
};
