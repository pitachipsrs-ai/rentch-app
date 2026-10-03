import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, MapPin, ArrowRight, BedDouble, Maximize2, Download, Building2 } from 'lucide-react';
import { RentchLogo } from './RentchLogo';
import { Apartment, RentchCity } from '../types';
import { RENTCH_CITIES, getApartmentCity } from '../utils/districtUtils';
import splashApartmentImg from '../assets/images/tbilisi_apartment_splash_1790502537895.jpg';

interface SplashScreenProps {
  isOpen: boolean;
  onStart: () => void;
  onSelectCity?: (city: RentchCity) => void;
  activeCity?: RentchCity;
  apartments?: Apartment[];
  onOpenAuth?: () => void;
  featuredApartment?: Apartment;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isOpen,
  onStart,
  onSelectCity,
  activeCity = 'tbilisi',
  apartments = [],
  onOpenAuth,
  featuredApartment,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(splashApartmentImg);

  const cityCounts = React.useMemo(() => {
    const counts: Record<RentchCity, number> = {
      tbilisi: 0,
      yerevan: 0,
      belgrade: 0,
    };
    for (const apt of apartments) {
      const c = getApartmentCity(apt);
      counts[c] = (counts[c] || 0) + 1;
    }
    return counts;
  }, [apartments]);

  const previewTitle =
    featuredApartment?.title || 'Дизайнерская квартира с террасой в Ваке';
  const previewDistrict = featuredApartment?.district || 'Ваке (Vake)';
  const previewPrice = featuredApartment?.priceUsd || 850;
  const previewRooms = featuredApartment?.rooms || 2;
  const previewArea = featuredApartment?.areaSqm || 68;

  const handleDownloadPoster = async () => {
    const canvas = document.createElement('canvas');
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load the apartment image first so we can draw it inside the card
    const loadImage = (src: string): Promise<HTMLImageElement | null> =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });

    const aptImage = await loadImage(splashApartmentImg);

    // 1. Dark Stone Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0c0a09');
    bgGrad.addColorStop(0.5, '#1c1917');
    bgGrad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient Rose & Amber Glows
    const topGlow = ctx.createRadialGradient(width / 2, 460, 40, width / 2, 460, 560);
    topGlow.addColorStop(0, 'rgba(244, 63, 94, 0.32)');
    topGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.14)');
    topGlow.addColorStop(1, 'rgba(12, 10, 9, 0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, width, height);

    // 3. Brand Icon Box
    const boxSize = 210;
    const boxX = (width - boxSize) / 2;
    const boxY = 300;
    ctx.fillStyle = '#1c1917';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxSize, boxSize, 52);
    ctx.fill();
    ctx.stroke();

    // House Roof & Heart inside Icon Box
    const brandGrad = ctx.createLinearGradient(boxX, boxY, boxX + boxSize, boxY + boxSize);
    brandGrad.addColorStop(0, '#f43f5e');
    brandGrad.addColorStop(1, '#f59e0b');
    ctx.strokeStyle = brandGrad;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(width / 2 - 60, boxY + 95);
    ctx.lineTo(width / 2, boxY + 45);
    ctx.lineTo(width / 2 + 60, boxY + 95);
    ctx.stroke();

    // Heart inside House
    ctx.fillStyle = brandGrad;
    ctx.font = 'bold 86px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❤️', width / 2, boxY + 162);

    // 4. Main Title: Rentch!
    const textGrad = ctx.createLinearGradient(width / 2 - 260, 0, width / 2 + 260, 0);
    textGrad.addColorStop(0, '#fb7185');
    textGrad.addColorStop(0.5, '#f472b6');
    textGrad.addColorStop(1, '#fcd34d');
    ctx.fillStyle = textGrad;
    ctx.font = 'italic 900 148px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Rentch!', width / 2, 680);

    // 5. English Tagline: Find your real ̶e̶s̶t̶a̶t̶e̶ love.
    ctx.font = '800 64px system-ui, -apple-system, sans-serif';
    const part1 = 'Find your real ';
    const part2 = 'estate';
    const part3 = ' love.';
    const w1 = ctx.measureText(part1).width;
    const w2 = ctx.measureText(part2).width;
    const w3 = ctx.measureText(part3).width;
    const totalW = w1 + w2 + w3;
    const startX = (width - totalW) / 2;
    const taglineY = 815;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(part1, startX, taglineY);

    // "estate" with coral diagonal strikethrough
    ctx.fillStyle = '#a8a29e';
    ctx.fillText(part2, startX + w1, taglineY);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(startX + w1 - 6, taglineY - 16);
    ctx.lineTo(startX + w1 + w2 + 6, taglineY - 26);
    ctx.stroke();

    // "love."
    ctx.font = 'italic 900 66px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = textGrad;
    ctx.fillText(part3, startX + w1 + w2, taglineY);

    // 6. Russian Subtitle: Первый сайт знакомств с недвижимостью.
    ctx.textAlign = 'center';
    ctx.font = '600 40px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#d6d3d1';
    ctx.fillText('Первый сайт знакомств с недвижимостью.', width / 2, 905);

    // 7. Decorative Swipe Card Preview on Poster with Real Apartment Photo
    const cardW = 760;
    const cardH = 580;
    const cardX = (width - cardW) / 2;
    const cardY = 1010;

    // Back tilted cards for depth
    ctx.save();
    ctx.translate(width / 2, cardY + cardH / 2);
    ctx.rotate(-0.06);
    ctx.fillStyle = 'rgba(41, 37, 36, 0.7)';
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-cardW / 2 - 14, -cardH / 2 + 10, cardW, cardH, 48);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(width / 2, cardY + cardH / 2);
    ctx.rotate(0.045);
    ctx.fillStyle = 'rgba(68, 64, 60, 0.75)';
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-cardW / 2 + 12, -cardH / 2 + 6, cardW, cardH, 48);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Main Card Clipped Image
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 48);
    ctx.clip();

    if (aptImage) {
      // Cover fit calculation
      const imgRatio = aptImage.width / aptImage.height;
      const cardRatio = cardW / cardH;
      let drawW = cardW;
      let drawH = cardH;
      let drawX = cardX;
      let drawY = cardY;
      if (imgRatio > cardRatio) {
        drawW = cardH * imgRatio;
        drawX = cardX - (drawW - cardW) / 2;
      } else {
        drawH = cardW / imgRatio;
        drawY = cardY - (drawH - cardH) / 2;
      }
      ctx.drawImage(aptImage, drawX, drawY, drawW, drawH);
    } else {
      ctx.fillStyle = '#292524';
      ctx.fillRect(cardX, cardY, cardW, cardH);
    }

    // Dark gradient overlay at bottom & top for text legibility
    const cardGrad = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
    cardGrad.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
    cardGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.10)');
    cardGrad.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
    ctx.fillStyle = cardGrad;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.restore();

    // Card Border
    ctx.strokeStyle = 'rgba(255,255,255,0.24)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 48);
    ctx.stroke();

    // Price badge top-right inside card
    ctx.fillStyle = 'rgba(12, 10, 9, 0.82)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX + cardW - 235, cardY + 36, 195, 68, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 34px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`$${previewPrice}/мес`, cardX + cardW - 137, cardY + 81);

    // RENTCH! Stamp inside card
    ctx.save();
    ctx.translate(cardX + 165, cardY + 85);
    ctx.rotate(-0.18);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 6;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.24)';
    ctx.beginPath();
    ctx.roundRect(-125, -42, 250, 76, 20);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '900 34px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RENTCH! ❤️', 0, 8);
    ctx.restore();

    // Card Bottom Info
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fcd34d';
    ctx.font = '700 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(`📍 ${previewDistrict}`, cardX + 44, cardY + cardH - 132);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 34px system-ui, -apple-system, sans-serif';
    ctx.fillText(previewTitle.slice(0, 32), cardX + 44, cardY + cardH - 80);

    ctx.fillStyle = '#e7e5e4';
    ctx.font = '600 26px system-ui, -apple-system, sans-serif';
    ctx.fillText(`$${previewPrice} / мес  •  ${previewRooms} комн.  •  ${previewArea} м²`, cardX + 44, cardY + cardH - 36);

    // Trigger PNG download
    const link = document.createElement('a');
    link.download = 'rentch-splash-screen.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="rentch-splash-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-stone-950 text-white flex flex-col justify-between overflow-y-auto overflow-x-hidden select-none"
        >
          {/* Ambient background glow matching app's rose-amber-stone palette */}
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-rose-600/25 via-pink-500/15 to-amber-500/20 blur-3xl" />
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[480px] h-[420px] rounded-full bg-gradient-to-r from-amber-500/15 via-rose-500/20 to-stone-900/10 blur-3xl" />
            {/* Subtle architectural grid lines */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />
          </div>

          {/* Top Bar inside Splash */}
          <div className="relative z-10 w-full max-w-xl mx-auto px-5 pt-5 sm:pt-7 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RentchLogo size="sm" showText={true} textColor="#FFFFFF" />
              <span className="text-xs text-stone-400 font-medium">
                · Тбилиси · Ереван · Белград
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="splash-download-png-btn"
                onClick={handleDownloadPoster}
                className="text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 cursor-pointer"
                title="Скачать заставку в высоком разрешении (PNG)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Скачать PNG</span>
              </button>
            </div>
          </div>

          {/* Main Center Hero Content */}
          <div className="relative z-10 w-full max-w-xl mx-auto px-5 py-4 sm:py-6 flex flex-col items-center text-center my-auto">
            {/* Animated Brand House-Heart Logo */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="relative mb-3 sm:mb-4"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-stone-900 to-stone-900/90 border border-white/10 shadow-2xl flex items-center justify-center relative">
                <RentchLogo size="lg" showText={false} />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg border border-stone-950"
                >
                  <Heart className="w-3.5 h-3.5 text-white fill-white" />
                </motion.div>
              </div>
            </motion.div>

            {/* Primary Brand Title: Rentch! */}
            <motion.h1
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.08, type: 'spring', stiffness: 200 }}
              className="text-5xl sm:text-6xl font-black italic tracking-tighter bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent drop-shadow-sm leading-none"
            >
              Rentch!
            </motion.h1>

            {/* Slogan: Find your real ̶e̶s̶t̶a̶t̶e̶ love. */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.4 }}
              className="mt-3 sm:mt-4"
            >
              <p
                id="splash-english-tagline"
                aria-label="Find your real estate love."
                className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex flex-wrap items-center justify-center gap-x-2 gap-y-1"
              >
                <span>Find your real</span>
                <span className="relative inline-flex items-center px-1 text-stone-400 font-semibold">
                  <span className="line-through decoration-rose-500 decoration-[3px]">
                    ̶e̶s̶t̶a̶t̶e̶
                  </span>
                  {/* Animated diagonal coral strike accent */}
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.45, duration: 0.35, ease: 'easeOut' }}
                    style={{ originX: 0 }}
                    className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-rose-500 to-amber-400 rounded-full -rotate-6 shadow-sm"
                  />
                </span>
                <span className="italic font-black bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent inline-flex items-center gap-1">
                  love.
                </span>
              </p>

              {/* Russian Subtitle: Первый сайт знакомств с недвижимостью. */}
              <p
                id="splash-russian-subtitle"
                className="mt-2 text-sm sm:text-base font-medium text-stone-300 tracking-wide max-w-md mx-auto"
              >
                Первый сайт знакомств с недвижимостью.
              </p>
            </motion.div>

            {/* Interactive-Style Swipe Card Showcase (Reflecting the app's core UI) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 170, damping: 20 }}
              onClick={onStart}
              className="relative w-full max-w-[310px] sm:max-w-[340px] h-[235px] sm:h-[260px] mt-6 sm:mt-7 mb-4 cursor-pointer group"
            >
              {/* Back Card 2 (tilted left) */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden bg-stone-900 border border-white/15 -rotate-6 scale-[0.92] -translate-x-3.5 translate-y-2 shadow-xl">
                <img
                  src={splashApartmentImg}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-35 blur-[1px]"
                />
              </div>

              {/* Back Card 1 (tilted right) */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden bg-stone-800 border border-white/20 rotate-4 scale-[0.96] translate-x-3 translate-y-1 shadow-xl">
                <img
                  src={splashApartmentImg}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-50 blur-[0.5px]"
                />
              </div>

              {/* Front Active Swipe Card */}
              <motion.div
                whileHover={{ rotate: 1.5, scale: 1.02 }}
                className="relative w-full h-full rounded-3xl overflow-hidden border border-white/25 shadow-2xl bg-stone-900"
              >
                <img
                  src={imgSrc}
                  onError={() => setImgSrc(splashApartmentImg)}
                  alt={previewTitle}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/15" />

                {/* Signature RENTCH! Match Stamp */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 0, rotate: -14 }}
                  animate={{ scale: 1, opacity: 1, rotate: -12 }}
                  transition={{ delay: 0.55, type: 'spring', stiffness: 240 }}
                  className="absolute top-3.5 left-3.5 border-[2.5px] border-emerald-400 bg-emerald-500/25 backdrop-blur-xs text-emerald-300 font-black text-xs tracking-widest px-2.5 py-1 rounded-xl shadow-lg"
                >
                  RENTCH! ❤️
                </motion.div>

                {/* Price tag top-right */}
                <div className="absolute top-3.5 right-3.5 bg-stone-950/80 backdrop-blur-md border border-white/15 text-white font-black text-sm px-3 py-1 rounded-xl">
                  ${previewPrice}
                  <span className="text-[10px] font-normal text-stone-300"> /мес</span>
                </div>

                {/* Bottom Card Details + Mini Swipe Action Buttons */}
                <div className="absolute bottom-0 inset-x-0 p-4 flex items-end justify-between gap-3 text-left">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold mb-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{previewDistrict}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate">
                      {previewTitle}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-stone-300 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="w-3 h-3 text-rose-400" />
                        {previewRooms} комн.
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Maximize2 className="w-3 h-3 text-amber-400" />
                        {previewArea} м²
                      </span>
                    </div>
                  </div>

                  {/* Mini Pass / Like Discs */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-9 h-9 rounded-full bg-stone-900/90 border border-white/15 text-stone-300 flex items-center justify-center shadow-md">
                      <X className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
                      <Heart className="w-5 h-5 fill-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom Actions: City Selection Cards */}
          <div className="relative z-10 w-full max-w-md mx-auto px-5 pb-6 sm:pb-8 space-y-3">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Выберите город для просмотра квартир
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {RENTCH_CITIES.map((city) => {
                const count = cityCounts[city.id] || 0;
                const isCurrent = activeCity === city.id;
                const subtitle =
                  city.id === 'tbilisi'
                    ? 'Грузия · Актуальный каталог Тбилиси'
                    : city.id === 'belgrade'
                    ? 'Сербия · Актуальный каталог Белграда'
                    : 'Армения · Каталог Еревана';

                return (
                  <button
                    key={city.id}
                    type="button"
                    id={`splash-select-city-${city.id}`}
                    onClick={() => {
                      if (onSelectCity) {
                        onSelectCity(city.id);
                      } else {
                        onStart();
                      }
                    }}
                    className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                      isCurrent
                        ? 'bg-gradient-to-r from-rose-500/25 via-pink-500/20 to-amber-500/25 border-rose-400/70 shadow-lg shadow-rose-500/15 hover:border-rose-300'
                        : 'bg-stone-900/90 hover:bg-stone-800/90 border-white/15 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                        {city.flag}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base sm:text-lg font-black text-white tracking-tight">
                            {city.nameRu}
                          </span>
                          {count > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold">
                              <Building2 className="w-3 h-3" />
                              {count} кв.
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 truncate mt-0.5">
                          {subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>

            {onOpenAuth && (
              <button
                type="button"
                id="splash-auth-btn"
                onClick={() => {
                  onStart();
                  onOpenAuth();
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Войти как арендатор или разместить квартиру
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
