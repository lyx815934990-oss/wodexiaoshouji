import type React from 'react';

/** 桌面「账户」：与微信图标同 viewBox / 尺寸 / 线粗（2），图形略收小 */
export const UserAccountIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" width="52" height="52" aria-hidden="true" focusable="false">
    <circle cx="32" cy="24" r="9" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M20 50C20 41 25 33 32 33c7 0 12 8 12 17"
      fill="none"
      stroke="#111827"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
