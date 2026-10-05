import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  UserCheck, 
  Sparkles, 
  Phone, 
  Send,
  MapPin
} from 'lucide-react';
import { LeasePeriod, QuestionnaireAnswers, UserProfile, RentchCity } from '../types';
import { RENTCH_CITIES } from '../utils/districtUtils';

interface QuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: UserProfile, answers: QuestionnaireAnswers, city?: RentchCity) => void;
  pendingApartmentTitle?: string;
  initialAnswers?: Partial<QuestionnaireAnswers>;
  userProfile?: UserProfile;
  activeCity?: RentchCity;
}

const FAKE_NAMES = new Set(['Иван Смирнов', 'Игорь Азаров', 'Арендатор', 'Клиент', 'Клиент Rentch']);
const FAKE_PHONES = new Set([
  '+995 599 000 000',
  '+995 599 00-00-00',
  '+995 599 12-34-56',
  '+995 599 82-41-10',
]);

export const QuestionnaireModal: React.FC<QuestionnaireModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  pendingApartmentTitle,
  initialAnswers,
  userProfile,
  activeCity = 'tbilisi',
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedCity, setSelectedCity] = useState<RentchCity>(activeCity);
  
  // Streamlined fields: questions A & B only
  const [period, setPeriod] = useState<LeasePeriod>(initialAnswers?.period || 'month_to_year');
  const [peopleCount, setPeopleCount] = useState<number>(initialAnswers?.peopleCount || 1);

  // Clean registration fields without any fake masks
  const [fullName, setFullName] = useState<string>(() => {
    const savedName = userProfile?.name?.trim() || '';
    return FAKE_NAMES.has(savedName) ? '' : savedName;
  });
  const [phone, setPhone] = useState<string>(() => {
    const savedPhone = userProfile?.phone?.trim() || '';
    return FAKE_PHONES.has(savedPhone) ? '' : savedPhone;
  });
  const [telegram, setTelegram] = useState<string>(() => {
    const savedTg = userProfile?.telegramUsername?.trim() || '';
    return savedTg === '@rentch_user' || savedTg === 'rentch_guest' ? '' : savedTg;
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    const answers: QuestionnaireAnswers = {
      period,
      peopleCount,
      hasPets: 'none',
      preferredDistrict: 'all',
      photos: [],
    };

    const profile: UserProfile = {
      id: userProfile?.id || 'user-main',
      name: fullName.trim(),
      phone: phone.trim(),
      telegramUsername: telegram.trim() || undefined,
      isRegistered: true,
      questionnaireCompleted: true,
      questionnaire: answers,
      telegramNotificationsEnabled: true,
    };

    onComplete(profile, answers, selectedCity);
  };

  return (
    <AnimatePresence>
      <div 
        id="questionnaire-overlay"
        className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      >
        <motion.div
          id="questionnaire-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85dvh] overflow-hidden border border-stone-100"
        >
          {/* Top header - safe from notch cut-off */}
          <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 pt-5 pb-4 px-5 text-white relative shrink-0">
            {/* Mobile drag handle */}
            <div className="w-10 h-1 bg-white/40 rounded-full mx-auto mb-3 sm:hidden" />

            <button
              id="close-questionnaire-btn"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 text-rose-100 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Быстрый подбор Rentch</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              {step === 1 ? 'Параметры аренды' : 'Контактные данные'}
            </h2>
            <p className="text-xs text-rose-50/90 mt-1 line-clamp-2">
              {pendingApartmentTitle ? (
                <>Для бронирования просмотра объекта <strong className="text-white">«{pendingApartmentTitle}»</strong> ответьте на вопросы</>
              ) : (
                'Короткая анкета для идеального подбора квартиры'
              )}
            </p>

            {/* Stepper bar */}
            <div className="flex items-center gap-2 mt-3">
              <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
              <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
            </div>
            <div className="flex justify-between text-[11px] text-white/80 mt-1">
              <span>Шаг 1: Город и срок</span>
              <span>Шаг 2: Контакты</span>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-5">
            {step === 1 ? (
              <div className="space-y-5">
                {/* Question: City selection */}
                <div id="q-city-select" className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-stone-800">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span>В каком городе ищете жилье?</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {RENTCH_CITIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        id={`questionnaire-city-${c.id}`}
                        onClick={() => setSelectedCity(c.id)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          selectedCity === c.id
                            ? 'border-rose-500 bg-rose-50 text-rose-900 font-black shadow-xs ring-2 ring-rose-500/20'
                            : 'border-stone-200 hover:border-stone-300 bg-stone-50/50 text-stone-700'
                        }`}
                      >
                        <div className="text-xl">{c.flag}</div>
                        <div className="text-xs font-bold mt-1">{c.nameRu}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question A: Lease Period */}
                <div id="q-lease-period" className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-stone-800">
                    <Calendar className="w-4 h-4 text-rose-500" />
                    <span>а) На какой период хотите арендовать?</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'month', label: 'На месяц', desc: 'Краткосрочно' },
                      { value: 'month_to_year', label: '1 - 12 мес', desc: 'Средний срок' },
                      { value: 'year_plus', label: 'От 1 года', desc: 'Долгосрочно' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        id={`period-opt-${opt.value}`}
                        onClick={() => setPeriod(opt.value as LeasePeriod)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          period === opt.value
                            ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-xs ring-2 ring-rose-500/20'
                            : 'border-stone-200 hover:border-stone-300 bg-stone-50/50 text-stone-700'
                        }`}
                      >
                        <div className="text-xs font-bold">{opt.label}</div>
                        <div className="text-[10px] text-stone-500 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question B: People Count */}
                <div id="q-people-count" className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-stone-800">
                    <Users className="w-4 h-4 text-rose-500" />
                    <span>б) Сколько человек будет проживать?</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { count: 1, label: '1 чел.' },
                      { count: 2, label: '2 чел.' },
                      { count: 3, label: '3 чел.' },
                      { count: 4, label: '4+ чел.' },
                    ].map((item) => (
                      <button
                        key={item.count}
                        type="button"
                        id={`people-opt-${item.count}`}
                        onClick={() => setPeopleCount(item.count)}
                        className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                          peopleCount === item.count
                            ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-500/20'
                            : 'border-stone-200 hover:border-stone-300 bg-stone-50/50 text-stone-700'
                        }`}
                      >
                        <span className="text-xs font-semibold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Continue button */}
                <div className="pt-2">
                  <button
                    type="button"
                    id="next-step-btn"
                    onClick={() => setStep(2)}
                    className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <span>Далее к контактам</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                  <UserCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Быстрая регистрация:</span> Контакты нужны для подтверждения просмотра квартиры собственником и связи в Telegram.
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                    Ваше имя и фамилия *
                  </label>
                  <input
                    type="text"
                    required
                    id="reg-fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Введите ваше имя"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-500" />
                    <span>Номер телефона (WhatsApp / Telegram) *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    id="reg-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Введите ваш номер телефона"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-500" />
                    <span>Telegram (по желанию)</span>
                  </label>
                  <input
                    type="text"
                    id="reg-telegram"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="Ваш никнейм в Telegram"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="button"
                    id="back-step-btn"
                    onClick={() => setStep(1)}
                    className="px-4 py-3.5 rounded-2xl border border-stone-200 hover:border-stone-300 text-stone-700 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Назад
                  </button>
                  <button
                    type="submit"
                    id="complete-registration-btn"
                    className="flex-1 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold py-3.5 px-5 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Подтвердить</span>
                  </button>
                </div>

                <div className="pt-2 text-center text-[11px] text-stone-500">
                  <span>Нажимая «Подтвердить», вы соглашаетесь с </span>
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-600 font-bold hover:underline"
                  >
                    Политикой конфиденциальности (Google Play & GDPR)
                  </a>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
