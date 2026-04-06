import type React from 'react';

export const VoiceTuningIcon: React.FC = () => {
  return (
    <svg viewBox="0 0 64 64" width="52" height="52">
      {/* 简约声波 + 调节滑块图标，黑白线条风格 */}
      <rect
        x="18"
        y="18"
        width="4"
        height="28"
        rx="2"
        fill="none"
        stroke="#111827"
        strokeWidth="2"
      />
      <rect
        x="30"
        y="14"
        width="4"
        height="36"
        rx="2"
        fill="none"
        stroke="#111827"
        strokeWidth="2"
      />
      <rect
        x="42"
        y="20"
        width="4"
        height="24"
        rx="2"
        fill="none"
        stroke="#111827"
        strokeWidth="2"
      />
      {/* 圆形调节滑块 */}
      <circle cx="20" cy="26" r="3" fill="#111827" />
      <circle cx="32" cy="40" r="3" fill="#111827" />
      <circle cx="44" cy="28" r="3" fill="#111827" />
    </svg>
  );
};


