import React from 'react';

interface RentchLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
}

export const RentchLogo: React.FC<RentchLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textColor = '#1C3746',
}) => {
  const sizeMap = {
    xs: { width: 28, height: 28, textClass: 'text-sm' },
    sm: { width: 36, height: 36, textClass: 'text-base' },
    md: { width: 46, height: 46, textClass: 'text-xl' },
    lg: { width: 68, height: 68, textClass: 'text-2xl' },
    xl: { width: 110, height: 110, textClass: 'text-4xl' },
  };

  const { width, height, textClass } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Defs for soft heart shadow & gradients matching uploaded logo */}
        <defs>
          <linearGradient id="roofRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF5C52" />
            <stop offset="100%" stopColor="#EA4335" />
          </linearGradient>
          <linearGradient id="heartRed" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF5E54" />
            <stop offset="100%" stopColor="#E6392D" />
          </linearGradient>
          <filter id="heartShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#D12C20" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Chimney on the right side */}
        <path
          d="M106 50V33H119V58L106 50Z"
          fill="#FF5C52"
        />
        <rect x="104" y="30" width="17" height="4" rx="2" fill="#FF5C52" />

        {/* Dark Teal/Navy House Frame & Roof Understructure */}
        <path
          d="M36 67L80 32L124 67V74L80 40L36 74V67Z"
          fill="#1C3746"
        />
        <path
          d="M44 65L80 37L116 65V90H44V65Z"
          fill="#1C3746"
        />

        {/* 4-Pane Attic Window */}
        <g fill="#FFFFFF">
          {/* Top-left pane (curved arch top) */}
          <path d="M73 48H78V54H73C73 51.5 73.5 49 73 48Z" />
          {/* Top-right pane */}
          <path d="M82 48H87C86.5 49 87 51.5 87 54H82V48Z" />
          {/* Bottom-left pane */}
          <rect x="73" y="56" width="5" height="5" />
          {/* Bottom-right pane */}
          <rect x="82" y="56" width="5" height="5" />
        </g>

        {/* Coral Red Main Roof Gable */}
        <path
          d="M26 62L80 18L134 62L128 69L80 29L32 69L26 62Z"
          fill="url(#roofRed)"
        />

        {/* Inner Heart (Nestled in the center of the house) */}
        <g filter="url(#heartShadow)">
          {/* Outer heart border / glow */}
          <path
            d="M80 126C78 124 50 106 42 88C35 72 44 58 59 58C68 58 75 63 80 69C85 63 92 58 101 58C116 58 125 72 118 88C110 106 82 124 80 126Z"
            fill="#D9382B"
          />
          {/* Main lush vibrant heart */}
          <path
            d="M80 122C78.2 120.2 52 103 45 86C38.5 71 47 61 60 61C68 61 75 66 80 72C85 66 92 61 100 61C113 61 121.5 71 115 86C108 103 81.8 120.2 80 122Z"
            fill="url(#heartRed)"
          />
          {/* Subtle inner highlight */}
          <path
            d="M60 65C52 65 46 72 50 82C53 89 65 100 78 111C75 105 70 94 66 88C61 79 56 68 60 65Z"
            fill="#FFFFFF"
            fillOpacity="0.18"
          />
        </g>
      </svg>

      {showText && (
        <span
          className={`font-black tracking-tight ${textClass}`}
          style={{
            color: textColor,
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '-0.03em',
          }}
        >
          Rentch
        </span>
      )}
    </div>
  );
};
