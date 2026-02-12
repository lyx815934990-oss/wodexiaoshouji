import type React from 'react';

export const StoryIcon: React.FC = () => {
  return (
    <svg viewBox="0 0 64 64" width="32" height="32">
      <rect
        x="16"
        y="14"
        width="32"
        height="36"
        rx="8"
        fill="none"
        stroke="#111827"
        strokeWidth="2.4"
      />
      <path
        d="M24 24H40"
        stroke="#111827"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M24 30H36"
        stroke="#111827"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M24 36H32"
        stroke="#111827"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="39.5" cy="35.5" r="3" fill="none" stroke="#111827" strokeWidth="1.8" />
      <path
        d="M37.8 39.2L35.5 41.5"
        stroke="#111827"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};


