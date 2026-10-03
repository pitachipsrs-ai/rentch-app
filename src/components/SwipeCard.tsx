import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { 
  Heart, 
  X, 
  MapPin, 
  Info, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Maximize2, 
  Armchair, 
  Calendar, 
  CheckCircle2, 
  RotateCcw,
  Train,
  Share2,
  Check
} from 'lucide-react';
import { Apartment } from '../types';
import { stripPhoneAndContactMentions } from '../utils/phoneSanitizer';
import { triggerHaptic } from '../utils/telegram';
import { getAccurateApartmentDistrict, formatDistrictDisplay } from '../utils/districtUtils';
import { normalizeApartmentImageUrl, handleImageError } from '../utils/imageUrl';
import { RentchWatermarkOverlay } from './RentchWatermarkOverlay';

interface SwipeCardProps {
  apartment: Apartment;
  onSwipe: (direction: 'left' | 'right') => void;
  onInfoClick: (apartment: Apartment) => void;
  isTopCard: boolean;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  apartment,
  onSwipe,
  onInfoClick,
  isTopCard,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-13, 0, 13]);
  const likeOpacity = useTransform(x, [20, 110], [0, 1]);
  const nopeOpacity = useTransform(x, [-20, -110], [0, 1]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection');

    const shareUrl = `${window.location.origin}${window.location.pathname}?apartment=${encodeURIComponent(apartment.id)}`;
    const shareTitle = `Rentch: ${apartment.title}`;
    const shareText = `Посмотри эту квартиру в Тбилиси (${apartment.district}): $${apartment.priceUsd}/мес!`;

    // 1. Try standard Web Share API
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        triggerHaptic('success');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // User dismissed native share sheet
          return;
        }
      }
    }

    // 2. Clipboard API fallback
    try {
      const textToCopy = `${shareText}\n${shareUrl}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      triggerHaptic('success');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 110;
    const velocityThreshold = 450;
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      onSwipe('left');
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % apartment.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + apartment.images.length) % apartment.images.length);
  };

  const gelPrice = apartment.priceGel || Math.round(apartment.priceUsd * 2.72);

  const furnitureText = {
    full: 'С мебелью',
    partial: 'Частично',
    none: 'Без мебели',
  }[apartment.furniture];

  const periodText = {
    month: 'От 1 месяца',
    month_to_year: 'От 1 до 12 мес',
    year_plus: 'От 1 года',
  }[apartment.minPeriod];

  const accurateDistrict = getAccurateApartmentDistrict(apartment);
  const displayDistrict = formatDistrictDisplay(accurateDistrict);

  return (
    <motion.div
      id={`swipe-card-${apartment.id}`}
      style={isTopCard ? { x, rotate } : {}}
      drag={isTopCard ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 25 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28, mass: 0.8 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
      className={`absolute inset-0 w-full h-full rounded-3xl overflow-hidden bg-white shadow-2xl border border-stone-200 select-none ${
        isTopCard ? 'cursor-grab touch-pan-y z-10' : 'pointer-events-none'
      }`}
    >
      {/* Photo carousel container */}
      <div className="relative w-full h-[62%] bg-stone-900 overflow-hidden">
        <img
          src={normalizeApartmentImageUrl(apartment.images[currentImageIndex], currentImageIndex)}
          alt={apartment.title}
          className="w-full h-full object-cover transition-opacity duration-200"
          onError={(e) => handleImageError(e, currentImageIndex)}
          loading="eager"
        />

        {/* Masking Badge for verified Rentch agency */}
        <RentchWatermarkOverlay size="md" maskMyHome={true} opacity={0.5} showCenterWatermark={false} />

        {/* Gradient shadow for text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-900/30 pointer-events-none" />

        {/* Swipe visual stamps */}
        {isTopCard && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-8 right-8 rotate-12 border-4 border-emerald-400 bg-emerald-500/20 backdrop-blur-xs text-emerald-400 font-black text-2xl sm:text-3xl px-4 py-1.5 rounded-2xl tracking-wider uppercase z-20 pointer-events-none"
            >
              RENTCH! ♥
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-8 left-8 -rotate-12 border-4 border-rose-500 bg-rose-500/20 backdrop-blur-xs text-rose-500 font-black text-2xl sm:text-3xl px-4 py-1.5 rounded-2xl tracking-wider uppercase z-20 pointer-events-none"
            >
              ПРОПУСК ✕
            </motion.div>
          </>
        )}

        {/* Image pagination indicators */}
        <div className="absolute top-3 inset-x-3 flex gap-1.5 z-10">
          {apartment.images.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                idx === currentImageIndex ? 'bg-white shadow' : 'bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Left / Right click zones for photos */}
        {apartment.images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer z-10"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer z-10"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Badges on image */}
        <div className="absolute top-8 left-4 flex flex-wrap gap-1.5 z-10">
          {apartment.isNew && (
            <span className="bg-amber-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              NEW
            </span>
          )}
          <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">
            {displayDistrict}
          </span>
        </div>

        {/* Floating Copied Link Notification */}
        {isCopied && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-stone-900/95 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md border border-white/20 pointer-events-none whitespace-nowrap animate-bounce">
            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
            <span>Ссылка на квартиру скопирована!</span>
          </div>
        )}

        {/* Bottom overlay info on image */}
        <div className="absolute bottom-3 inset-x-4 text-white z-10">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight">
                  {apartment.currency === 'EUR' || apartment.city === 'belgrade'
                    ? `€${apartment.originalPrice || apartment.priceUsd}`
                    : apartment.currency === 'GEL'
                    ? `${gelPrice} ₾`
                    : `$${apartment.priceUsd}`}
                </span>
                <span className="text-xs text-stone-300 font-medium">
                  {apartment.currency === 'EUR' || apartment.city === 'belgrade'
                    ? `/ мес`
                    : apartment.currency === 'GEL'
                    ? `/ мес (~$${apartment.priceUsd})`
                    : `/ мес (~${gelPrice} ₾)`}
                </span>
              </div>
              <p className="text-xs text-stone-200 mt-0.5 flex items-center gap-1 line-clamp-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span>{apartment.address}</span>
              </p>
            </div>

            {/* Action buttons on card: Share + Info */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                id={`share-card-${apartment.id}-btn`}
                onClick={handleShare}
                className={`h-9 px-3 rounded-full backdrop-blur-md text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-lg text-xs font-bold active:scale-95 ${
                  isCopied
                    ? 'bg-emerald-600/90 text-white ring-2 ring-emerald-400'
                    : 'bg-white/20 hover:bg-white/35 text-white'
                }`}
                title="Поделиться ссылкой на квартиру с друзьями"
                aria-label="Поделиться"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-200 stroke-[3]" />
                    <span className="text-[11px] font-bold text-white">Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-white" />
                    <span className="text-[11px] font-bold">Поделиться</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id={`info-card-${apartment.id}-btn`}
                onClick={(e) => {
                  e.stopPropagation();
                  onInfoClick(apartment);
                }}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 active:scale-95 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
                title="Подробнее о квартире"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body details */}
      <div className="p-4 sm:p-5 h-[38%] flex flex-col justify-between bg-white">
        <div>
          <h3 className="font-bold text-stone-900 text-base leading-snug line-clamp-1">
            {stripPhoneAndContactMentions(apartment.title)}
          </h3>

          {/* Quick Specs Chips */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div className="bg-stone-100 rounded-xl p-2 flex items-center gap-2 text-stone-700">
              <Home className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <div>
                <div className="font-semibold">{apartment.rooms} комн.</div>
                <div className="text-[10px] text-stone-500">{apartment.areaSqm} м²</div>
              </div>
            </div>

            <div className="bg-stone-100 rounded-xl p-2 flex items-center gap-2 text-stone-700">
              <Armchair className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div>
                <div className="font-semibold truncate">{furnitureText}</div>
                <div className="text-[10px] text-stone-500">{apartment.floor}/{apartment.totalFloors} этаж</div>
              </div>
            </div>

            <div className="bg-stone-100 rounded-xl p-2 flex items-center gap-2 text-stone-700">
              <Calendar className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div>
                <div className="font-semibold truncate">{periodText}</div>
                <div className="text-[10px] text-stone-500">Срок аренды</div>
              </div>
            </div>
          </div>

          {apartment.metro && (
            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-stone-600 bg-rose-50/70 px-2.5 py-1 rounded-lg border border-rose-100/80">
              <Train className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <span className="font-medium text-stone-800">{apartment.metro}</span>
            </div>
          )}
        </div>

        {/* Quick Highlights bar */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5 font-medium text-stone-700">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Готова к заселению</span>
          </div>
          <span className="text-[11px] text-stone-400">
            Тбилиси • {displayDistrict}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
