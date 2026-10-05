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
  Train, 
  Share2, 
  Check,
  ChevronUp,
  ShieldCheck,
  Clock
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

  const isDaily = apartment.rentalType === 'daily';
  const pricePerNight = apartment.pricePerNight || Math.round(apartment.priceUsd / 30) || 45;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection');

    const shareUrl = `${window.location.origin}${window.location.pathname}?apartment=${encodeURIComponent(apartment.id)}`;
    const shareTitle = `Rentch: ${apartment.title}`;
    const priceText = isDaily ? `$${pricePerNight}/сут` : `$${apartment.priceUsd}/мес`;
    const shareText = `Посмотри этот объект в Rentch (${apartment.district}): ${priceText}!`;

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
        if (err.name === 'AbortError') return;
      }
    }

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
    triggerHaptic('selection');
    setCurrentImageIndex((prev) => (prev + 1) % apartment.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection');
    setCurrentImageIndex((prev) => (prev - 1 + apartment.images.length) % apartment.images.length);
  };

  const gelPrice = apartment.priceGel || Math.round(apartment.priceUsd * 2.72);

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
      className={`absolute inset-0 w-full h-full rounded-[32px] overflow-hidden bg-stone-900 shadow-2xl border border-stone-200 select-none ${
        isTopCard ? 'cursor-grab touch-pan-y z-10' : 'pointer-events-none'
      }`}
    >
      {/* Full-bleed Photo container (occupies entire card just like in Tinder screenshot) */}
      <div className="relative w-full h-full bg-stone-900 overflow-hidden">
        <img
          src={normalizeApartmentImageUrl(apartment.images[currentImageIndex], currentImageIndex)}
          alt={apartment.title}
          className="w-full h-full object-cover transition-opacity duration-200"
          onError={(e) => handleImageError(e, currentImageIndex)}
          loading="eager"
        />

        {/* Agency watermark masking */}
        {!isDaily && (
          <RentchWatermarkOverlay size="md" maskMyHome={true} opacity={0.4} showCenterWatermark={false} showVerifiedBadge={false} />
        )}

        {/* Cinematic gradient vignette for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/35 pointer-events-none" />

        {/* Swipe visual stamps */}
        {isTopCard && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-12 right-6 rotate-12 border-4 border-emerald-400 bg-emerald-500/30 backdrop-blur-xs text-emerald-400 font-black text-2xl sm:text-3xl px-4 py-1.5 rounded-2xl tracking-wider uppercase z-20 pointer-events-none shadow-xl"
            >
              {isDaily ? 'БРОНЬ! ♥' : 'RENTCH! ♥'}
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-12 left-6 -rotate-12 border-4 border-rose-500 bg-rose-500/30 backdrop-blur-xs text-rose-500 font-black text-2xl sm:text-3xl px-4 py-1.5 rounded-2xl tracking-wider uppercase z-20 pointer-events-none shadow-xl"
            >
              ПРОПУСК ✕
            </motion.div>
          </>
        )}

        {/* Image Story Progress Bars on top (Exactly like Tinder) */}
        <div className="absolute top-3 inset-x-3 flex gap-1.5 z-20 pointer-events-none">
          {apartment.images.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                idx === currentImageIndex ? 'bg-white shadow' : 'bg-white/35'
              }`}
            />
          ))}
        </div>

        {/* Left / Right click zones for photos */}
        <div 
          onClick={prevImage}
          className="absolute left-0 top-0 bottom-24 w-1/3 z-10 cursor-pointer"
          title="Предыдущее фото"
        />
        <div 
          onClick={nextImage}
          className="absolute right-0 top-0 bottom-24 w-1/3 z-10 cursor-pointer"
          title="Следующее фото"
        />

        {/* Badges row on top */}
        <div className="absolute top-6 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex flex-wrap gap-1.5">
            {isDaily ? (
              <span className="bg-emerald-500/95 backdrop-blur-md text-stone-950 font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-pulse" />
                <span>Посуточно</span>
              </span>
            ) : (
              <span className="bg-stone-900/80 backdrop-blur-md text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                Долгосрочно
              </span>
            )}

            <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              {displayDistrict}
            </span>
          </div>

          {/* Плашка "Rentch Проверено" по центру карточки */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none select-none">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-950/85 backdrop-blur-md border border-white/25 shadow-xl text-white">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-2.5 h-2.5 text-white stroke-[3]" />
              </div>
              <span className="text-[11px] font-black tracking-tight text-white flex items-center gap-1 whitespace-nowrap">
                <span>Rentch</span>
                <span className="text-emerald-400 font-bold">• Проверено</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="pointer-events-auto w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition cursor-pointer ml-auto"
            title="Поделиться"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-white" />}
          </button>
        </div>

        {/* Floating Copied Link Notification */}
        {isCopied && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-stone-900/95 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md border border-white/20 pointer-events-none whitespace-nowrap">
            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
            <span>Ссылка скопирована!</span>
          </div>
        )}

        {/* Bottom Profile Details (Matching Tinder Screenshot layout) */}
        <div className="absolute bottom-4 inset-x-4 text-white z-20">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              {/* Badges above name: e.g. "Недалеко" / "Свободно на даты" */}
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-white/25 backdrop-blur-md text-white text-[10px] font-bold">
                  {isDaily ? 'Свободно для бронирования' : 'Недалеко'}
                </span>
                {apartment.landlord?.rating && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/90 text-stone-950 text-[10px] font-black">
                    ★ {apartment.landlord.rating}
                  </span>
                )}
              </div>

              {/* Title & Price Header */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5 truncate">
                  <span>{stripPhoneAndContactMentions(apartment.title)}</span>
                  <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 inline fill-sky-400/20" />
                </h2>
              </div>

              {/* Price Tag */}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {isDaily ? (
                    `$${pricePerNight}`
                  ) : apartment.currency === 'EUR' || apartment.city === 'belgrade' ? (
                    `€${apartment.originalPrice || apartment.priceUsd}`
                  ) : (
                    `$${apartment.priceUsd}`
                  )}
                </span>
                <span className="text-xs text-stone-300 font-medium">
                  {isDaily ? '/ сутки' : `/ мес (~${gelPrice} ₾)`}
                </span>
                {isDaily && (
                  <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    Комиссия 15% включена в расчет
                  </span>
                )}
              </div>

              {/* Location pin with distance/address */}
              <p className="text-xs text-stone-200 flex items-center gap-1 line-clamp-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{apartment.address}</span>
              </p>

              {/* Quick specs chips */}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-stone-300 font-medium">
                <span>{apartment.rooms} комн. ({apartment.areaSqm} м²)</span>
                <span>•</span>
                <span>{apartment.floor}/{apartment.totalFloors} эт.</span>
                {isDaily && apartment.maxGuests && (
                  <>
                    <span>•</span>
                    <span>до {apartment.maxGuests} гостей</span>
                  </>
                )}
              </div>
            </div>

            {/* Iconic Tinder Arrow Up Button for info */}
            <button
              type="button"
              id={`tinder-arrow-up-${apartment.id}`}
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                onInfoClick(apartment);
              }}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 active:scale-90 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer shadow-xl shrink-0 border border-white/20"
              title="Открыть подробную информацию"
              aria-label="Подробнее"
            >
              <ChevronUp className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
