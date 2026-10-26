'use client';

import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function SamullasaLogo({ size = 38, className = '', showText = false }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Precision Vector Emblem */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105 duration-200"
        aria-label="SAMULLĀSA Celebration Studio Emblem"
      >
        <defs>
          {/* Imperial Plum Radial Gradient */}
          <radialGradient id="plumGlow" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#8A2393" />
            <stop offset="70%" stopColor="#4A124F" />
            <stop offset="100%" stopColor="#250829" />
          </radialGradient>

          {/* Festive Amber Gold Gradient */}
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Luminous Outer Halo */}
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#F59E0B" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer Rounded Jewel Shield */}
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="12"
          fill="url(#plumGlow)"
          stroke="url(#goldGradient)"
          strokeWidth="1.5"
          filter="url(#goldGlow)"
        />

        {/* Festive Golden Halo Rings / Petals */}
        <circle cx="24" cy="24" r="17" stroke="url(#goldGradient)" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.6" />
        
        {/* Geometric Celebration Diya / Lotus Base Petals */}
        <path
          d="M12 28 C16 34, 32 34, 36 28 C34 32, 28 35, 24 35 C20 35, 14 32, 12 28 Z"
          fill="url(#goldGradient)"
          opacity="0.85"
        />

        {/* Sacred Devanagari 'स' (Sa - for Samullāsa / Joyful Celebration) Vectorized */}
        <g fill="none" stroke="url(#goldGradient)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          {/* Top Shirorekha (Horizontal Bar) */}
          <line x1="15" y1="14" x2="33" y2="14" />
          
          {/* Vertical Backbone of 'स' */}
          <line x1="28" y1="14" x2="28" y2="31" />
          
          {/* Left Upper Curve of 'स' */}
          <path d="M21 14 C17 14, 16 19, 19 21.5 C21 23, 21 24, 18 29" />
          
          {/* Central Connecting Bridge */}
          <line x1="19" y1="21.5" x2="28" y2="21.5" strokeWidth="2.2" />
        </g>

        {/* Radiant Crown Sparkle */}
        <circle cx="28" cy="11" r="1.5" fill="#FDE68A" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-extrabold text-base tracking-wider text-[var(--foreground)] font-serif">
            SAMULLĀSA
          </span>
          <span className="text-[10px] font-semibold text-[var(--accent)] tracking-widest uppercase mt-0.5">
            Celebration Studio
          </span>
        </div>
      )}
    </div>
  );
}

export function SamullasaEmblem({ size = 32, className = '' }: { size?: number; className?: string }) {
  return <SamullasaLogo size={size} className={className} showText={false} />;
}
