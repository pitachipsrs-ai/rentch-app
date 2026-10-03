import React from 'react';
import { ShieldCheck, Phone } from 'lucide-react';
import { DEFAULT_AGENT_PHONE } from '../utils/phoneSanitizer';

interface RentchWatermarkOverlayProps {
  /** Size variant: 'sm' (catalog preview), 'md' (swipe cards), 'lg' (full modal) */
  size?: 'sm' | 'md' | 'lg';
  /** Show bottom-right mask covering MyHome watermark */
  maskMyHome?: boolean;
  /** Opacity of the center watermark (default 0.70) */
  opacity?: number;
  /** Whether to show the center watermark logo (defaults to false for clear photo view) */
  showCenterWatermark?: boolean;
}

export const RentchWatermarkOverlay: React.FC<RentchWatermarkOverlayProps> = ({
  size = 'md',
  maskMyHome = true,
  opacity = 0.5,
  showCenterWatermark = false,
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

      {/* 2. MASK FOR MYHOME WATERMARK (BOTTOM-RIGHT CORNER) */}
      {maskMyHome && (
        <div className="absolute bottom-2.5 right-2.5 z-20 pointer-events-none select-none">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-950/90 backdrop-blur-md border border-white/20 shadow-xl text-white">
            <div className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-2.5 h-2.5 text-white stroke-[3]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-black tracking-tight text-white flex items-center gap-1">
                <span>Rentch</span>
                <span className="text-emerald-400 font-bold">• Проверено</span>
              </span>
              <span className="text-[9px] text-stone-300 font-mono flex items-center gap-1 mt-0.5">
                <Phone className="w-2.5 h-2.5 text-emerald-400" />
                <span>{DEFAULT_AGENT_PHONE}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
