import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  MapPin,
  Heart,
  Sparkles,
  X,
  Bot,
  Users,
  UserCheck,
  Phone,
  Send,
  CheckCircle2,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import { Apartment, UserProfile } from '../types';

interface RentchMatchModalProps {
  apartment: Apartment | null;
  isOpen: boolean;
  userProfile: UserProfile;
  onClose: () => void;
  onOpenChat: (apartment: Apartment) => void;
  onFindRoommate?: (apartment: Apartment) => void;
  onSubmitSwipeContact: (
    apartment: Apartment,
    contact: { name: string; phone: string; telegramUsername?: string },
    nextAction: 'chat' | 'continue' | 'roommate'
  ) => void;
}

const FAKE_NAMES = new Set([
  'Иван Смирнов',
  'Игорь Азаров',
  'Арендатор',
  'Клиент',
  'Клиент Rentch',
  'Клиент из чата',
  'Новый арендатор',
]);

const FAKE_PHONES = new Set([
  '+995 599 000 000',
  '+995 599 00-00-00',
  '+995 599 12-34-56',
  '+995 599 82-41-10',
]);

export const RentchMatchModal: React.FC<RentchMatchModalProps> = ({
  apartment,
  isOpen,
  userProfile,
  onClose,
  onOpenChat,
  onFindRoommate,
  onSubmitSwipeContact,
}) => {
  const cleanSavedName =
    userProfile?.name?.trim() && !FAKE_NAMES.has(userProfile.name.trim())
      ? userProfile.name.trim()
      : '';
  const cleanSavedPhone =
    userProfile?.phone?.trim() && !FAKE_PHONES.has(userProfile.phone.trim())
      ? userProfile.phone.trim()
      : '';
  const cleanSavedTelegram =
    userProfile?.telegramUsername?.trim() &&
    userProfile.telegramUsername.trim() !== '@rentch_user' &&
    userProfile.telegramUsername.trim() !== 'rentch_guest'
      ? userProfile.telegramUsername.trim()
      : '';

  const hasSavedValidContacts = Boolean(cleanSavedName && cleanSavedPhone);

  const [fullName, setFullName] = useState<string>(cleanSavedName);
  const [phone, setPhone] = useState<string>(cleanSavedPhone);
  const [telegram, setTelegram] = useState<string>(cleanSavedTelegram);
  const [isEditingContacts, setIsEditingContacts] = useState<boolean>(!hasSavedValidContacts);
  const [errorText, setErrorText] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const nextName =
        userProfile?.name?.trim() && !FAKE_NAMES.has(userProfile.name.trim())
          ? userProfile.name.trim()
          : '';
      const nextPhone =
        userProfile?.phone?.trim() && !FAKE_PHONES.has(userProfile.phone.trim())
          ? userProfile.phone.trim()
          : '';
      const nextTg =
        userProfile?.telegramUsername?.trim() &&
        userProfile.telegramUsername.trim() !== '@rentch_user' &&
        userProfile.telegramUsername.trim() !== 'rentch_guest'
          ? userProfile.telegramUsername.trim()
          : '';

      setFullName(nextName);
      setPhone(nextPhone);
      setTelegram(nextTg);
      setIsEditingContacts(!(nextName && nextPhone));
      setErrorText('');

      // Fire celebratory confetti!
      const end = Date.now() + 1400;
      const colors = ['#f43f5e', '#fb7185', '#f59e0b', '#10b981', '#ffffff'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
          zIndex: 9999,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
          zIndex: 9999,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isOpen, apartment?.id, userProfile?.name, userProfile?.phone, userProfile?.telegramUsername]);

  if (!isOpen || !apartment) return null;

  const validateAndExecute = (nextAction: 'chat' | 'continue' | 'roommate') => {
    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedTg = telegram.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorText('Пожалуйста, введите ваше имя для оформления заявки в CRM');
      setIsEditingContacts(true);
      const nameEl = document.getElementById('swipe-contact-name');
      nameEl?.focus();
      return;
    }

    const digitsCount = trimmedPhone.replace(/\D/g, '').length;
    if (!trimmedPhone || digitsCount < 6) {
      setErrorText('Пожалуйста, введите корректный номер телефона (WhatsApp / Telegram)');
      setIsEditingContacts(true);
      const phoneEl = document.getElementById('swipe-contact-phone');
      phoneEl?.focus();
      return;
    }

    setErrorText('');
    onSubmitSwipeContact(
      apartment,
      {
        name: trimmedName,
        phone: trimmedPhone,
        telegramUsername: trimmedTg || undefined,
      },
      nextAction
    );
  };

  return (
    <AnimatePresence>
      <div
        id="rentch-match-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          id="rentch-match-card"
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="relative w-full max-w-md bg-stone-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-rose-500/35 text-center p-5 sm:p-6 my-auto max-h-[94dvh] overflow-y-auto"
        >
          {/* Close button is ONLY available if user has already provided valid contact details */}
          {hasSavedValidContacts && !isEditingContacts && (
            <button
              id="close-match-btn"
              type="button"
              onClick={() => validateAndExecute('continue')}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Celebratory badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[11px] font-bold uppercase tracking-widest mb-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
            <span>Взаимный Rentch!</span>
          </motion.div>

          {/* Brand "Rentch!" Title */}
          <motion.h1
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="text-4xl sm:text-5xl font-black italic tracking-tighter bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent drop-shadow-sm mb-1.5"
          >
            Rentch!
          </motion.h1>

          <p className="text-stone-300 text-xs sm:text-sm mb-4 max-w-xs mx-auto leading-relaxed">
            {isEditingContacts
              ? 'Чтобы закрепить эту квартиру за вами и передать заявку менеджеру, укажите ваши контактные данные:'
              : 'Заявка по выбранной квартире автоматически записана в CRM. Вы можете сразу выбрать время просмотра!'}
          </p>

          {/* Compact Apartment Summary Card */}
          <div className="bg-stone-800/90 rounded-2xl p-3 border border-stone-700/70 mb-4 text-left flex items-center gap-3">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-rose-500/60 shrink-0 bg-stone-800">
              <img
                src={apartment.images[0]}
                alt={apartment.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow text-white">
                <Heart className="w-3.5 h-3.5 fill-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-xs sm:text-sm text-white truncate">
                  {apartment.title}
                </h3>
                <span className="text-rose-400 font-extrabold text-xs sm:text-sm shrink-0">
                  {apartment.currency === 'EUR' || apartment.city === 'belgrade'
                    ? `€${apartment.priceUsd}/мес`
                    : apartment.currency === 'GEL'
                    ? `${apartment.priceGel || Math.round(apartment.priceUsd * 2.72)} ₾/мес`
                    : `$${apartment.priceUsd}/мес`}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-0.5">
                <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                <span className="truncate">{apartment.address}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="bg-stone-700/70 px-2 py-0.5 rounded text-[10px] font-medium text-stone-200">
                  {apartment.district}
                </span>
                <span className="bg-stone-700/70 px-2 py-0.5 rounded text-[10px] font-medium text-stone-200">
                  {apartment.rooms} комн. ({apartment.areaSqm} м²)
                </span>
              </div>
            </div>
          </div>

          {/* Mandatory Contact Details Form OR Confirmed CRM Status */}
          {isEditingContacts ? (
            <div className="bg-stone-800/95 border border-rose-500/40 rounded-2xl p-3.5 sm:p-4 mb-4 text-left space-y-3 shadow-inner">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300 uppercase tracking-wide">
                  <UserCheck className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Контактные данные для заявки *</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  Обязательно
                </span>
              </div>

              {errorText && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorText}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="swipe-contact-name"
                  className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1"
                >
                  Ваше имя и фамилия *
                </label>
                <input
                  id="swipe-contact-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errorText) setErrorText('');
                  }}
                  placeholder="Например: Антон Ситников"
                  className="w-full bg-stone-900 border border-stone-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>

              <div>
                <label
                  htmlFor="swipe-contact-phone"
                  className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1 flex items-center gap-1"
                >
                  <Phone className="w-3 h-3 text-rose-400" />
                  <span>Номер телефона (WhatsApp / Telegram) *</span>
                </label>
                <input
                  id="swipe-contact-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errorText) setErrorText('');
                  }}
                  placeholder="+995 5XX XXX XXX"
                  className="w-full bg-stone-900 border border-stone-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-stone-500 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>

              <div>
                <label
                  htmlFor="swipe-contact-telegram"
                  className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1 flex items-center gap-1"
                >
                  <Send className="w-3 h-3 text-sky-400" />
                  <span>Ник в Telegram (по желанию)</span>
                </label>
                <input
                  id="swipe-contact-telegram"
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full bg-stone-900 border border-stone-700 focus:border-rose-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3 mb-4 text-left flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-emerald-200 truncate">
                    Заявка записана в CRM: {fullName}
                  </div>
                  <div className="text-[11px] text-emerald-300/80 font-mono truncate">
                    {phone} {telegram ? `• ${telegram}` : ''}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingContacts(true)}
                className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Изменить</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              id="open-match-chat-btn"
              type="button"
              onClick={() => validateAndExecute('chat')}
              className="w-full bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold py-3.5 px-5 rounded-2xl shadow-lg hover:shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
            >
              <Bot className="w-5 h-5 text-amber-200 shrink-0" />
              <span>
                {isEditingContacts
                  ? 'Отправить заявку в CRM и выбрать время просмотра'
                  : 'Выбрать время просмотра квартиры'}
              </span>
            </button>

            {onFindRoommate && (
              <button
                type="button"
                id="find-roommate-match-btn"
                onClick={() => validateAndExecute('roommate')}
                className="w-full bg-stone-800 hover:bg-stone-700 border border-emerald-500/40 text-emerald-300 font-bold py-3 px-4 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Отправить заявку и найти соседа 50/50</span>
              </button>
            )}

            <button
              id="continue-swiping-btn"
              type="button"
              onClick={() => validateAndExecute('continue')}
              className="w-full bg-stone-800/80 hover:bg-stone-800 border border-stone-700 text-stone-200 hover:text-white font-semibold py-2.5 px-4 rounded-2xl text-xs transition-colors cursor-pointer"
            >
              {isEditingContacts
                ? 'Сохранить контакты в заявку и продолжить свайпать'
                : 'Продолжить свайпать квартиры'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
