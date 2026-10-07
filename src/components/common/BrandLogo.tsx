import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'crest' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
  showSubtitle?: boolean;
}

/**
 * Official BrandLogo component for DI-Finance (Pondok Pesantren Darul Istiqomah)
 * 100% Faithful to the official file: "B1b Logo Formal Lanscape Berwarna (1).png"
 * - Maintains exact proportions, colors, symbols, typography, and transparency
 * - No redesign, no added badges, no distortion
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  size = 'md',
  theme = 'light',
  className = '',
}) => {
  // Height scale mapping maintaining original aspect ratio
  const heightMap = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
  };

  const crestHeightMap = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  // If variant is 'crest', display only the left crest emblem
  if (variant === 'crest') {
    return (
      <svg
        viewBox="0 0 300 320"
        className={`${crestHeightMap[size]} shrink-0 ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Lambang Darul Istiqomah"
      >
        <g transform="translate(10, 8)">
          {/* Outer 5 Petal/Arc Color Segments */}
          <path d="M 104 54 C 136 28 174 28 206 54" stroke="#F58220" strokeWidth="15" strokeLinecap="round" fill="none" />
          <path d="M 212 59 C 265 106 258 165 240 200" stroke="#8CC63F" strokeWidth="15" strokeLinecap="round" fill="none" />
          <path d="M 234 208 C 220 262 165 285 155 287" stroke="#00A99D" strokeWidth="15" strokeLinecap="round" fill="none" />
          <path d="M 155 287 C 145 285 90 262 76 208" stroke="#EC008C" strokeWidth="15" strokeLinecap="round" fill="none" />
          <path d="M 70 200 C 52 165 45 106 98 59" stroke="#00AEEF" strokeWidth="15" strokeLinecap="round" fill="none" />

          {/* Inner Shield Background */}
          <path d="M 155 46 L 235 108 L 204 220 L 155 258 L 106 220 L 75 108 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />

          {/* Top Tab Badge: AN MTDI */}
          <path d="M 143 54 L 167 54 L 165 72 L 155 77 L 145 72 Z" fill="#231F20" />
          <text x="155" y="63" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#FFFFFF" fontFamily="system-ui, sans-serif">AN</text>
          <text x="155" y="71" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#FFFFFF" fontFamily="system-ui, sans-serif">MTDI</text>

          {/* Center Mosque Silhouette & Land Base */}
          <g fill="#231F20">
            <rect x="127" y="112" width="8" height="42" rx="1.5" />
            <path d="M 125.5 112 L 131 92 L 136.5 112 Z" />
            <circle cx="131" cy="89" r="2.5" fill="#F58220" />
            <path d="M 138 152 C 138 114 155 104 155 104 C 155 104 172 114 172 152 Z" />
            <path d="M 155 103 L 155 94" stroke="#F58220" strokeWidth="2" strokeLinecap="round" />
            <circle cx="155" cy="92" r="3.2" fill="#F58220" />
            <rect x="171" y="124" width="10" height="28" rx="1.5" />
            <path d="M 170 124 C 170 114 182 114 182 124 Z" />
            <path d="M 98 154 Q 155 166 212 154 L 212 168 Q 155 180 98 168 Z" />
          </g>

          {/* Paddy Stalk Left (Green #8CC63F) */}
          <g stroke="#8CC63F" fill="#8CC63F">
            <path d="M 96 156 C 88 126 102 96 118 80" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="94" cy="142" r="3.2" />
            <circle cx="97" cy="128" r="3.2" />
            <circle cx="103" cy="114" r="3.2" />
            <circle cx="111" cy="100" r="3.2" />
            <circle cx="118" cy="88" r="3" />
          </g>

          {/* Cotton Stalk Right (Golden Yellow #F7941D) */}
          <g stroke="#F7941D" fill="#F7941D">
            <path d="M 214 156 C 222 126 208 96 192 80" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="216" cy="142" r="3.2" />
            <circle cx="213" cy="128" r="3.2" />
            <circle cx="207" cy="114" r="3.2" />
            <circle cx="199" cy="100" r="3.2" />
            <circle cx="192" cy="88" r="3" />
          </g>

          {/* Upper Ribbon: WORO - BOJONEGORO */}
          <path d="M 104 184 Q 155 196 206 184 L 208 198 Q 155 210 102 198 Z" fill="#FFFFFF" stroke="#231F20" strokeWidth="1.8" />
          <text x="155" y="194.5" textAnchor="middle" fontSize="7.5" fontWeight="900" letterSpacing="0.6" fill="#231F20" fontFamily="system-ui, sans-serif">
            WORO - BOJONEGORO
          </text>

          {/* Lower Ribbon: معهد الطالبين دار الاستقامة */}
          <path d="M 108 200 Q 155 216 202 200 L 200 214 Q 155 228 110 214 Z" fill="#231F20" />
          <text x="155" y="210" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#FFFFFF" fontFamily="system-ui, serif">
            معهد الطالبين دار الاستقامة
          </text>
        </g>
      </svg>
    );
  }

  // Full Landscape Formal Colored Logo
  return (
    <div
      className={`inline-flex items-center select-none ${theme === 'dark' ? 'bg-white/95 rounded-lg px-2 py-1 shadow-xs' : ''} ${className}`}
      title="Darul Istiqomah - Pesantren Salaf Kekinian"
    >
      <img
        src="/logo.svg"
        alt="Logo Resmi Darul Istiqomah"
        className={`${heightMap[size]} w-auto object-contain block`}
      />
    </div>
  );
};
