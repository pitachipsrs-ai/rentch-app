import React from 'react';
import { ShieldCheck, Phone } from 'lucide-react';
import { DEFAULT_AGENT_PHONE } from '../utils/phoneSanitizer';

interface RentchWatermarkOverlayProps {
  /** Size variant: 'sm' (catalog preview), 'md' (swipe cards), 'lg' (full modal) */
  size?: 'sm' | 'md' | 'lg';
  /** Show bottom-right mask covering foreign agency watermark */
  maskMyHome?: boolean;
  /** Opacity of the center watermark (default 0.50) */
  opacity?: number;
  /** Whether to show the center watermark logo */
  showCenterWatermark?: boolean;
  /** Whether to show the verified Rentch badge in center of card (defaults to true) */
  showVerifiedBadge?: boolean;
}

export const RentchWatermarkOverlay: React.FC<RentchWatermarkOverlayProps> = ({
  size = 'md',
  maskMyHome = true,
  opacity = 0.5,
  showCenterWatermark = false,
  showVerifiedBadge = true,
}) => {
  const imgWidthClass =
    size === 'sm'
      ? 'w-16 sm:w-20'
      : size === 'lg'
      ? 'w-28 sm:w-36'
      : 'w-24 sm:w-28';

  return (
    <>
      {/* 1. Optional subtle brand mark in center */}
      {showCenterWatermark && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 p-2 overflow-hidden"
        >
          <img
            src="/rentch_640x360.jpg"
            alt="Rentch"
            className={`${imgWidthClass} h-auto object-contain rounded-lg shadow-md pointer-events-none select-none transition-all duration-200`}
            style={{ opacity }}
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* 2. PLASHKA "RENTCH ПРОВЕРЕНО" - CENTERED ON CARD */}
      {showVerifiedBadge && (
        <div className="absolute top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-950/85 backdrop-blur-md border border-white/25 shadow-xl text-white">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-2.5 h-2.5 text-white stroke-[3]" />
            </div>
            <span className="text-[11px] font-black tracking-tight text-white flex items-center gap-1">
              <span>Rentch</span>
              <span className="text-emerald-400 font-bold">• Проверено</span>
            </span>
          </div>
        </div>
      )}

      {/* 3. Subtle opaque mask in bottom-right corner to cover external agency watermarks */}
      {maskMyHome && (
        <div className="absolute bottom-2.5 right-2.5 z-10 pointer-events-none select-none">
          <div className="h-6 w-16 rounded-lg bg-black/75 backdrop-blur-md" />
        </div>
      )}
    </>
  );
};
