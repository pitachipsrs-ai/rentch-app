import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MapPin, 
  Heart, 
  XCircle, 
  Home, 
  Armchair, 
  Calendar, 
  Check, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  Train,
  ChevronLeft,
  ChevronRight,
  Share2,
  Phone,
  Globe,
  ExternalLink
} from 'lucide-react';
import { Apartment } from '../types';
import { stripPhoneAndContactMentions, DEFAULT_AGENT_PHONE } from '../utils/phoneSanitizer';
import { triggerHaptic, initiatePhoneCall } from '../utils/telegram';
import { getAccurateApartmentDistrict } from '../utils/districtUtils';
import { getMyHomeOriginalUrl, getMyHomeStatementId } from '../utils/myhomeParser';
import { normalizeApartmentImageUrl, handleImageError } from '../utils/imageUrl';
import { RentchWatermarkOverlay } from './RentchWatermarkOverlay';

interface ApartmentDetailsModalProps {
  apartment: Apartment | null;
  isOpen: boolean;
  onClose: () => void;
  onLike: (apartment: Apartment) => void;
  onDislike: (apartment: Apartment) => void;
  isLiked?: boolean;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}

export const ApartmentDetailsModal: React.FC<ApartmentDetailsModalProps> = ({
  apartment,
  isOpen,
  onClose,
  onLike,
  onDislike,
  isLiked,
  isAdmin,
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !apartment) return null;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection');

    const shareUrl = `${window.location.origin}${window.location.pathname}?apartment=${encodeURIComponent(apartment.id)}`;
    const shareTitle = `Rentch: ${apartment.title}`;
    const shareText = `Посмотри эту квартиру в Тбилиси (${apartment.district}): $${apartment.priceUsd}/мес!`;

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
      console.warn('Share error:', err);
    }
  };

  const gelPrice = apartment.priceGel || Math.round(apartment.priceUsd * 2.72);
  const accurateDistrict = getAccurateApartmentDistrict(apartment);

  const furnitureLabel = {
    full: 'Полностью меблирована (готова к заезду)',
    partial: 'Частично меблирована',
    none: 'Без мебели',
  }[apartment.furniture];

  const periodLabel = {
    month: 'Краткосрочно (от 1 месяца)',
    month_to_year: 'Средний срок (от 1 до 12 месяцев)',
    year_plus: 'Долгосрочная аренда (от 1 года)',
  }[apartment.minPeriod];

  return (
    <AnimatePresence>
      <div 
        id="apartment-details-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      >
        <motion.div
          id="apartment-details-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-stone-100 flex flex-col max-h-[90vh]"
        >
          {/* Photos Header */}
          <div className="relative w-full h-72 sm:h-80 bg-stone-900 flex-shrink-0">
            <img
              src={normalizeApartmentImageUrl(apartment.images[photoIndex], photoIndex)}
              alt={apartment.title}
              className="w-full h-full object-cover transition-opacity duration-200"
              onError={(e) => handleImageError(e, photoIndex)}
            />

            {/* Rentch Brand Verified Masking */}
            <RentchWatermarkOverlay size="lg" maskMyHome={true} opacity={0.5} showCenterWatermark={false} />

            {/* Top right actions: Share + Close */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                type="button"
                id="share-details-btn"
                onClick={handleShare}
                className={`h-9 px-3 rounded-full backdrop-blur-md text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-lg text-xs font-bold active:scale-95 ${
                  isCopied
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                    : 'bg-black/50 hover:bg-black/70 text-white'
                }`}
                title="Поделиться квартирой с друзьями"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-200 stroke-[3]" />
                    <span>Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-white" />
                    <span>Поделиться</span>
                  </>
                )}
              </button>

              <button
                id="close-details-btn"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                title="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {apartment.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setPhotoIndex((p) => (p - 1 + apartment.images.length) % apartment.images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs cursor-pointer z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoIndex((p) => (p + 1) % apartment.images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs cursor-pointer z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Photo indicators */}
            <div className="absolute bottom-3 inset-x-4 flex justify-center gap-1.5 z-10">
              {apartment.images.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === photoIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            <div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                  {accurateDistrict}
                </span>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-stone-900">
                    {apartment.currency === 'EUR' || apartment.city === 'belgrade'
                      ? `€${apartment.originalPrice || apartment.priceUsd}`
                      : apartment.currency === 'GEL'
                      ? `${gelPrice} ₾`
                      : `$${apartment.priceUsd}`}
                  </span>
                  <span className="text-xs text-stone-500 ml-1">
                    {apartment.currency === 'EUR' || apartment.city === 'belgrade'
                      ? `/ мес`
                      : apartment.currency === 'GEL'
                      ? `/ мес (~$${apartment.priceUsd})`
                      : `/ мес (~${gelPrice} ₾)`}
                  </span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-stone-900 mt-2">
                {stripPhoneAndContactMentions(apartment.title)}
              </h2>
              <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{apartment.address}</span>
                {apartment.metro && (
                  <span className="text-stone-700 ml-2 font-medium bg-stone-100 px-2 py-0.5 rounded">
                    {apartment.metro}
                  </span>
                )}
              </p>

              {!(isAdmin || (typeof window !== 'undefined' && sessionStorage.getItem('rentch_admin_auth') === 'true')) && (
                <div className="mt-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Объект проверен агентством Rentch</span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Прямая аренда без скрытых комиссий с официальным сопровождением договора.
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-2xs">
                    <Check className="w-3.5 h-3.5" />
                    <span>Верифицировано</span>
                  </div>
                </div>
              )}

              {(isAdmin || (typeof window !== 'undefined' && sessionStorage.getItem('rentch_admin_auth') === 'true')) && (() => {
                const myhomeUrl = getMyHomeOriginalUrl(apartment);
                const myhomeId = getMyHomeStatementId(apartment.id);
                if (!myhomeUrl) return null;
                const isHalo = myhomeUrl.includes('halooglasi.com') || String(apartment.id).startsWith('halo-');
                return (
                  <div className="mt-3 p-3 rounded-2xl bg-rose-50/80 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-rose-700 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                        <span>
                          {isHalo
                            ? `Оригинальная публикация в HaloOglasi.com (${apartment.id})`
                            : `Оригинальная публикация в MyHome ${myhomeId ? `(ID: ${myhomeId})` : ''}`}
                        </span>
                      </div>
                      <a
                        href={myhomeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-rose-600 hover:underline truncate block mt-0.5 font-medium"
                      >
                        {myhomeUrl}
                      </a>
                    </div>
                    <a
                      href={myhomeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors flex-shrink-0 shadow-2xs"
                    >
                      <span>{isHalo ? 'Открыть в HaloOglasi' : 'Открыть в MyHome'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })()}
            </div>

            {/* Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="text-stone-500 text-[11px]">Комнат / Спален</div>
                <div className="font-bold text-stone-800 mt-0.5">{apartment.rooms} комн. ({apartment.bedrooms} спальни)</div>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="text-stone-500 text-[11px]">Площадь</div>
                <div className="font-bold text-stone-800 mt-0.5">{apartment.areaSqm} м² (этаж {apartment.floor}/{apartment.totalFloors})</div>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="text-stone-500 text-[11px]">Мебель</div>
                <div className="font-bold text-stone-800 mt-0.5">
                  {apartment.furniture === 'full' ? 'С мебелью' : apartment.furniture === 'partial' ? 'Частично' : 'Без мебели'}
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="text-stone-500 text-[11px]">Срок аренды</div>
                <div className="font-bold text-stone-800 mt-0.5">
                  {apartment.minPeriod === 'month' ? 'От 1 месяца' : apartment.minPeriod === 'year_plus' ? 'От 1 года' : '1 - 12 мес'}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                Описание объекта
              </h4>
              <p className="text-sm text-stone-700 leading-relaxed bg-stone-50/50 p-3.5 rounded-2xl border border-stone-100 whitespace-pre-line">
                {stripPhoneAndContactMentions(apartment.description)}
              </p>
            </div>

            {/* Amenities */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Удобства и особенности
              </h4>
              <div className="flex flex-wrap gap-2">
                {apartment.amenities.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-800 text-xs font-medium"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Landlord & Agent profile block */}
            <div className="bg-stone-900 text-white rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={apartment.landlord.avatar}
                    alt={apartment.landlord.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-rose-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm">{apartment.landlord.name}</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xs text-stone-400">
                      Отвечает {apartment.landlord.responseTime}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-1 rounded-lg">
                    ★ {apartment.landlord.rating} рейтинг
                  </span>
                </div>
              </div>

              {/* Direct call & WhatsApp to user's phone */}
              <div className="pt-2.5 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-300">
                  <Phone className="w-3.5 h-3.5 text-rose-400" />
                  <span>+995 558 542365</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="tel:+995558542365"
                    target="_top"
                    rel="noopener noreferrer"
                    onClick={() => initiatePhoneCall('+995558542365')}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Позвонить</span>
                  </a>
                  <a
                    href={`https://wa.me/995558542365?text=${encodeURIComponent(`Здравствуйте! Интересует аренда квартиры: ${apartment.title} ($${apartment.priceUsd}/мес)`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Swiping Actions */}
          <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center gap-3">
            <button
              type="button"
              id="details-dislike-btn"
              onClick={() => {
                onDislike(apartment);
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-2xl border border-stone-200 hover:border-stone-300 bg-white text-stone-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-stone-400" />
              <span>Пропустить</span>
            </button>

            <button
              type="button"
              id="details-like-btn"
              onClick={() => {
                onLike(apartment);
                onClose();
              }}
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>{isLiked ? 'Открыть диалог Rentch' : 'Rentch! Нравится'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
