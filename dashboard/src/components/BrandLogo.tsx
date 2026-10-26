import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

/**
 * The Neev Initiative - Official Brand Logo Mark
 * Features:
 * 1. Stepped foundation base (Neev / Foundation)
 * 2. Open book pages sprouting upward (Literacy & Pedagogy)
 * 3. Ribbon-like stylized 'N' in vibrant Teal & Deep Cyan gradient
 * 4. Glowing warm-gold GeoAI pin/node crown at the top-right tip
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'w-9 h-9', size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <defs>
        {/* Foundation Stepped Gradient */}
        <linearGradient id="neevBaseGrad" x1="6" y1="42" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B1924" />
          <stop offset="50%" stopColor="#132D3F" />
          <stop offset="100%" stopColor="#0B1924" />
        </linearGradient>

        {/* Ribbon 'N' Vibrant Teal-Cyan Gradient */}
        <linearGradient id="neevRibbonGrad" x1="10" y1="36" x2="38" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="45%" stopColor="#14B8A6" />
          <stop offset="85%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>

        {/* Secondary Navy Stem Gradient */}
        <linearGradient id="neevStemGrad" x1="10" y1="38" x2="20" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06222D" />
          <stop offset="100%" stopColor="#0E4A5E" />
        </linearGradient>

        {/* Warm Gold GeoAI Node Glow */}
        <radialGradient id="neevGoldGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" stopOpacity="0.8" />
        </radialGradient>

        <filter id="neevNodeShadow" x="30" y="4" width="16" height="16" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#F59E0B" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* 1. Stepped Architectural Foundation Base (Neev) */}
      <path
        d="M6 43H42M10 39.5H38M14 36H34"
        stroke="url(#neevBaseGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="14" y="37" width="20" height="2" rx="1" fill="#14B8A6" fillOpacity="0.4" />

      {/* 2. Open Foundation Book Pages at the Base */}
      <path
        d="M14 34C18 31 22 32 24 34C26 32 30 31 34 34V35.5C30 32.5 26 33.5 24 35.5C22 33.5 18 32.5 14 35.5V34Z"
        fill="#14B8A6"
        fillOpacity="0.25"
      />
      <path
        d="M16 32C19.5 29.5 22.5 30.5 24 32C25.5 30.5 28.5 29.5 32 32"
        stroke="#5EEAD4"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* 3. Stylized Ribbon-Like 'N' */}
      {/* Left Vertical Pillar */}
      <path
        d="M13 34V16C13 14.5 14.5 13.5 16 14.2L20 16.5C21 17 21.5 18 21.5 19.2V34"
        fill="url(#neevStemGrad)"
      />
      
      {/* Diagonal Ribbon Ascending to Right */}
      <path
        d="M14 17L32 34C33.2 35.2 35 34.5 35 32.8V11C35 9.8 33.8 8.8 32.5 9.2L30.5 9.8"
        stroke="url(#neevRibbonGrad)"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right Vertical Ribbon Rise */}
      <path
        d="M33 33V12C33 10.5 34.2 9.5 35.5 9.5C36.8 9.5 38 10.5 38 12V32C38 33.8 36 34.8 34.5 33.6L33 32.5"
        fill="url(#neevRibbonGrad)"
      />

      {/* 4. Crowned Warm-Gold GeoAI Location Node with Pulsing Aura */}
      <g filter="url(#neevNodeShadow)">
        {/* Outer Ring */}
        <circle cx="37" cy="10" r="4.5" fill="#061014" stroke="#F59E0B" strokeWidth="1.5" />
        {/* Core Glowing Node */}
        <circle cx="37" cy="10" r="2.5" fill="url(#neevGoldGlow)" />
        {/* Inner Highlight Spark */}
        <circle cx="36" cy="9" r="0.8" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

export default BrandLogo;

