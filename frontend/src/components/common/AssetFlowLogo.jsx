import React from 'react';

const AssetFlowLogo = ({ size = 38, className = '' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`assetflow-logo ${className}`}
      fill="none"
      aria-label="AssetFlow Logo"
    >
      <defs>
        <linearGradient id="af-bg-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="55%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="af-cube-top" x1="14" y1="12" x2="34" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="af-cube-left" x1="14" y1="20" x2="24" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="af-cube-right" x1="24" y1="20" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="af-flow-gradient" x1="8" y1="18" x2="40" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
        <filter id="af-shadow" x="0" y="2" width="48" height="46" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#312e81" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Container Box with Soft Shadow & Rounded Corners */}
      <rect x="3" y="3" width="42" height="42" rx="11" fill="url(#af-bg-gradient)" filter="url(#af-shadow)" />

      {/* Subtle glass shine on top rim */}
      <rect x="4" y="4" width="40" height="18" rx="10" fill="white" fillOpacity="0.12" />

      {/* 3D Isometric Asset Cube */}
      {/* Top Surface */}
      <path d="M24 12L34 17.5L24 23L14 17.5L24 12Z" fill="url(#af-cube-top)" />
      {/* Left Surface */}
      <path d="M14 18.8L23 23.8V33.8L14 28.8V18.8Z" fill="url(#af-cube-left)" />
      {/* Right Surface */}
      <path d="M25 23.8L34 18.8V28.8L25 33.8V23.8Z" fill="url(#af-cube-right)" />

      {/* Asset Cube Center Seam */}
      <path d="M24 23V33.5" stroke="#4338ca" strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" />

      {/* Dynamic AssetFlow Orbit Stream */}
      <path
        d="M9 25.5C9 18.5 15.5 14 23.5 14C30 14 36.5 17.5 38 23C39.5 28.5 34.5 34 26 34C19 34 13.5 30.5 12 27"
        stroke="url(#af-flow-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.92"
      />

      {/* Glowing Flow Nodes */}
      <circle cx="38" cy="23" r="2.2" fill="#ffffff" />
      <circle cx="9" cy="25.5" r="1.8" fill="#38bdf8" />
      <circle cx="26" cy="34" r="1.5" fill="#a5f3fc" />
    </svg>
  );
};

export default AssetFlowLogo;
