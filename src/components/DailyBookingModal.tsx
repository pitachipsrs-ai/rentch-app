import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Users, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Lock, 
  QrCode, 
  Smartphone, 
  ArrowRight,
  Sparkles,
  Key,
  Copy,
  Check,
  Building,
  Info
} from 'lucide-react';
import { Apartment, DailyBookingRecord, PaymentMethod, UserProfile } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface DailyBookingModalProps {
  apartment: Apartment;
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  onBookingSuccess: (booking: DailyBookingRecord) => void;
}

export const DailyBookingModal: React.FC<DailyBookingModalProps> = ({
  apartment,
  isOpen,
  onClose,
  userProfile,
  initialCheckIn,
  initialCheckOut,
  initialGuests = 1,
  onBookingSuccess,
}) => {
  // Format dates: default to tomorrow and 3 days later if not provided
  const getDefaultDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const checkout = new Date(tomorrow);
    checkout.setDate(tomorrow.getDate() + 3);

    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return {
      checkIn: initialCheckIn || fmt(tomorrow),
      checkOut: initialCheckOut || fmt(checkout),
    };
  };

  const defaultDates = useMemo(() => getDefaultDates(), [initialCheckIn, initialCheckOut]);

  const [checkInDate, setCheckInDate] = useState(defaultDates.checkIn);
  const [checkOutDate, setCheckOutDate] = useState(defaultDates.checkOut);
  const [guestsCount, setGuestsCount] = useState(initialGuests);

  // Guest details form
  const [guestName, setGuestName] = useState(userProfile.name || '');
  const [guestPhone, setGuestPhone] = useState(userProfile.phone || '+7 ');
  const [guestTelegram, setGuestTelegram] = useState(userProfile.telegramUsername || '');

  // Payment method: 'mir_card' | 'sbp_qr' | 'stripe_card'
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mir_card');

  // Card form fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState(userProfile.name ? userProfile.name.toUpperCase() : '');

  // Step state: 'details' -> '3ds' -> 'success'
  const [step, setStep] = useState<'details' | 'processing' | '3ds' | 'success'>('details');
  const [smsCode, setSmsCode] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<DailyBookingRecord | null>(null);
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Price calculations
  const pricePerNight = apartment.pricePerNight || Math.round(apartment.priceUsd / 30) || 45;

  const nightsCount = useMemo(() => {
    try {
      const inD = new Date(checkInDate);
      const outD = new Date(checkOutDate);
      const diffTime = outD.getTime() - inD.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  }, [checkInDate, checkOutDate]);

  // Subtotal, 15% commission, and total calculation
  const subtotal = pricePerNight * nightsCount;
  const SERVICE_FEE_PERCENT = 15;
  const serviceFeeAmount = Math.round((subtotal * SERVICE_FEE_PERCENT) / 100);
  const totalAmount = subtotal + serviceFeeAmount;

  // Approximate RUB exchange rate for Russian cards (~95 RUB per USD/EUR)
  const rubRate = 95;
  const totalAmountRub = totalAmount * rubRate;
  const serviceFeeAmountRub = serviceFeeAmount * rubRate;

  // Check if dates conflict with existing bookedRanges
  const isConflict = useMemo(() => {
    if (!Array.isArray(apartment.bookedRanges)) return false;
    return apartment.bookedRanges.some((r) => {
      return checkInDate < r.endDate && checkOutDate > r.startDate;
    });
  }, [apartment.bookedRanges, checkInDate, checkOutDate]);

  if (!isOpen) return null;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExpiry(raw);
  };

  const handlePay = () => {
    triggerHaptic('medium');
    setValidationError(null);
    if (!guestName.trim()) {
      setValidationError('Пожалуйста, укажите имя и фамилию гостя для заселения.');
      return;
    }
    if (!guestPhone.trim() || guestPhone.length < 6) {
      setValidationError('Пожалуйста, укажите контактный номер телефона.');
      return;
    }

    if (paymentMethod === 'sbp_qr') {
      // SBP instant confirmation
      setStep('processing');
      setTimeout(() => {
        finishBooking('paid');
      }, 1800);
      return;
    }

    // Cards (Russian or Stripe) require 3DS simulation
    setStep('processing');
    setTimeout(() => {
      setStep('3ds');
      setSmsCode('7749');
    }, 1200);
  };

  const handleConfirm3DS = () => {
    triggerHaptic('success');
    setStep('processing');
    setTimeout(() => {
      finishBooking('paid');
    }, 1200);
  };

  const finishBooking = (status: 'paid') => {
    const randomAccessCode = Math.floor(1000 + Math.random() * 9000) + '#';
    const bookingRecord: DailyBookingRecord = {
      id: `RN-${Date.now().toString().slice(-6)}`,
      apartmentId: apartment.id,
      apartmentTitle: apartment.title,
      apartmentDistrict: apartment.district,
      apartmentAddress: apartment.address,
      apartmentImage: apartment.images[0],
      checkInDate,
      checkOutDate,
      nightsCount,
      guestsCount,
      pricePerNight,
      subtotal,
      serviceFeePercent: SERVICE_FEE_PERCENT,
      serviceFeeAmount,
      totalAmount,
      totalAmountRub,
      currency: apartment.currency || 'USD',
      paymentMethod,
      paymentStatus: status,
      paymentId: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      guestTelegram: guestTelegram.trim() || undefined,
      createdAt: new Date().toISOString(),
      accessCode: randomAccessCode,
    };

    setConfirmedBooking(bookingRecord);
    setStep('success');
    triggerHaptic('success');
    onBookingSuccess(bookingRecord);
  };

  const handleCopyAccessCode = () => {
    if (confirmedBooking?.accessCode) {
      navigator.clipboard?.writeText(confirmedBooking.accessCode);
      setIsCopiedCode(true);
      triggerHaptic('selection');
      setTimeout(() => setIsCopiedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base leading-tight">
                {step === 'success' ? 'Бронирование подтверждено!' : 'Посуточная аренда в Rentch'}
              </h2>
              <p className="text-[11px] text-stone-300">
                {step === 'success' ? 'Ваучер заселения и электронный чек' : 'Гарантия заселения и безопасная оплата'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-daily-booking-btn"
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/30 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ml-2"
            title="Закрыть окно"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* STEP 1: Details and Payment Form */}
          {step === 'details' && (
            <>
              {/* Apartment Preview Card */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                <img
                  src={apartment.images[0]}
                  alt={apartment.title}
                  className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-xs"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{apartment.district}</span>
                  </div>
                  <h3 className="font-bold text-sm text-stone-900 truncate mt-0.5">
                    {apartment.title}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-base font-extrabold text-stone-900">
                      ${pricePerNight}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">/ сутки</span>
                    {apartment.landlord?.rating && (
                      <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                        ★ {apartment.landlord.rating}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Date & Guests Selection */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  <span>1. Даты проживания и гости</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Дата заезда
                    </label>
                    <input
                      type="date"
                      value={checkInDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Дата выезда
                    </label>
                    <input
                      type="date"
                      value={checkOutDate}
                      min={checkInDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Количество гостей
                    </label>
                    <select
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value={1}>1 гость</option>
                      <option value={2}>2 гостя</option>
                      <option value={3}>3 гостя</option>
                      <option value={4}>4 гостя</option>
                    </select>
                  </div>
                </div>

                {isConflict && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>На выбранные даты этот объект уже забронирован! Пожалуйста, выберите другие даты в календаре.</span>
                  </div>
                )}
              </div>

              {/* Guest Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-rose-500" />
                  <span>2. Данные основного гостя</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Имя и Фамилия
                    </label>
                    <input
                      type="text"
                      placeholder="Иван Иванов"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Номер телефона (WhatsApp / звонки)
                    </label>
                    <input
                      type="tel"
                      placeholder="+7 999 123-45-67"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Telegram @username (для кодов доступа)
                    </label>
                    <input
                      type="text"
                      placeholder="@ivan_rentch"
                      value={guestTelegram}
                      onChange={(e) => setGuestTelegram(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Transparent Price Calculation with 15% Commission */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-stone-700">
                  <span>${pricePerNight} × {nightsCount} ноч.</span>
                  <span className="font-semibold">${subtotal} ({subtotal * rubRate} ₽)</span>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-700">
                  <div className="flex items-center gap-1 text-stone-600">
                    <span>Сервисный сбор Rentch ({SERVICE_FEE_PERCENT}%)</span>
                    <span className="text-[10px] text-stone-400" title="Страховка брони и круглосуточная поддержка">ℹ️</span>
                  </div>
                  <span className="font-semibold text-rose-600">+${serviceFeeAmount} (+{serviceFeeAmountRub} ₽)</span>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-700">
                  <span>Уборка и сервисное обслуживание</span>
                  <span className="font-semibold text-emerald-600">Бесплатно</span>
                </div>

                <div className="pt-2 border-t border-stone-200 flex items-baseline justify-between">
                  <span className="font-extrabold text-sm text-stone-900">Итого к оплате:</span>
                  <div className="text-right">
                    <span className="font-black text-lg text-rose-600">${totalAmount}</span>
                    <span className="text-xs text-stone-500 font-medium block">
                      ~ {totalAmountRub.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-rose-500" />
                  <span>3. Способ оплаты</span>
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  {/* Option 1: Russian Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mir_card')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      paymentMethod === 'mir_card'
                        ? 'border-rose-500 bg-rose-50/50 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-stone-900">Карта РФ</span>
                      <span className="text-[10px] bg-rose-100 text-rose-700 font-black px-1.5 py-0.5 rounded">МИР</span>
                    </div>
                    <span className="text-[10px] text-stone-500 mt-2 block">Сбер, Т-Банк, МИР</span>
                  </button>

                  {/* Option 2: SBP QR */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('sbp_qr')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      paymentMethod === 'sbp_qr'
                        ? 'border-rose-500 bg-rose-50/50 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-stone-900">СБП</span>
                      <QrCode className="w-3.5 h-3.5 text-stone-700" />
                    </div>
                    <span className="text-[10px] text-stone-500 mt-2 block">QR-код или банк-клиент</span>
                  </button>

                  {/* Option 3: Stripe International */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe_card')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      paymentMethod === 'stripe_card'
                        ? 'border-rose-500 bg-rose-50/50 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-stone-900">Stripe</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 font-black px-1.5 py-0.5 rounded">Visa/MC</span>
                    </div>
                    <span className="text-[10px] text-stone-500 mt-2 block">Зарубежные карты</span>
                  </button>
                </div>

                {/* Sub-form based on payment method */}
                {paymentMethod === 'mir_card' && (
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-stone-600 font-semibold mb-1">
                      <span>Оплата картой российского банка</span>
                      <span className="text-[11px] text-stone-400">МИР / Visa / Mastercard РФ</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Номер карты (МИР, Сбербанк, Т-Банк)"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        maxLength={19}
                        className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="ММ / ГГ"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        maxLength={5}
                        className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <input
                        type="password"
                        placeholder="CVC / CVP"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.slice(0, 3))}
                        maxLength={3}
                        className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'sbp_qr' && (
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs">
                      {/* Stylized SBP QR Code */}
                      <div className="w-36 h-36 bg-gradient-to-br from-stone-900 to-stone-800 rounded-xl p-2 flex flex-col items-center justify-center text-white relative">
                        <QrCode className="w-24 h-24 text-white" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="bg-rose-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">СБП</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-stone-600 max-w-xs">
                      <p className="font-semibold text-stone-900">Оплата через Систему Быстрых Платежей</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Отсканируйте камерой телефона или нажмите кнопку ниже для перехода в банк
                      </p>
                    </div>
                    <div className="flex gap-2 w-full max-w-xs">
                      <button
                        type="button"
                        onClick={handlePay}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-xs transition"
                      >
                        Т-Банк
                      </button>
                      <button
                        type="button"
                        onClick={handlePay}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                      >
                        Сбербанк
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'stripe_card' && (
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-stone-600 font-semibold mb-1">
                      <span>Международная карта (Stripe Checkout)</span>
                      <span className="text-[11px] text-blue-600 font-bold">256-bit SSL</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Номер карты (Visa, Mastercard, Amex)"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        maxLength={19}
                        className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        maxLength={5}
                        className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="password"
                        placeholder="CVC"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.slice(0, 4))}
                        maxLength={4}
                        className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                  {validationError}
                </div>
              )}

              {/* Pay Button */}
              <button
                type="button"
                disabled={isConflict}
                onClick={handlePay}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-rose-500/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                <span>
                  Забронировать и оплатить ${totalAmount} ({totalAmountRub.toLocaleString('ru-RU')} ₽)
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Безопасная сделка: средства переводятся хозяину только после заселения</span>
              </div>
            </>
          )}

          {/* STEP 2: Processing state */}
          {step === 'processing' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
              <h3 className="font-extrabold text-stone-900 text-base">Обработка платежа...</h3>
              <p className="text-xs text-stone-500 max-w-xs">
                Связываемся с банком для подтверждения и бронирования дат. Пожалуйста, не закрывайте окно.
              </p>
            </div>
          )}

          {/* STEP 3: 3D-Secure SMS Confirmation Simulation */}
          {step === '3ds' && (
            <div className="py-6 space-y-5 max-w-sm mx-auto text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-base">3-D Secure Подтверждение</h3>
                <p className="text-xs text-stone-500 mt-1">
                  На ваш номер телефона отправлен код подтверждения платежа на сумму{' '}
                  <strong className="text-stone-800">{totalAmountRub.toLocaleString('ru-RU')} ₽ (${totalAmount})</strong>
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  maxLength={4}
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  placeholder="Код из SMS (например 7749)"
                  className="w-44 mx-auto text-center font-mono text-xl tracking-widest font-black px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={handleConfirm3DS}
                  className="w-full py-3 px-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-md transition cursor-pointer"
                >
                  Подтвердить оплату
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Successful Booking Voucher */}
          {step === 'success' && confirmedBooking && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950">
                    Оплата прошла успешно! Объект закреплен за вами
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Даты {confirmedBooking.checkInDate} — {confirmedBooking.checkOutDate} заблокированы в календаре.
                  </p>
                </div>
              </div>

              {/* Electronic Voucher Card */}
              <div className="rounded-3xl border border-stone-200 bg-stone-900 text-white p-5 space-y-4 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">
                      Электронный ваучер Rentch
                    </span>
                    <span className="text-sm font-black text-white">{confirmedBooking.id}</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                    100% Оплачено
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-base leading-snug">{confirmedBooking.apartmentTitle}</h3>
                  <p className="text-xs text-stone-300 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{confirmedBooking.apartmentAddress}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-white/5 p-3 rounded-2xl border border-white/10">
                  <div>
                    <span className="text-[10px] text-stone-400 block font-semibold">Заезд (Check-in)</span>
                    <span className="font-bold text-white text-xs">{confirmedBooking.checkInDate} с 14:00</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block font-semibold">Выезд (Check-out)</span>
                    <span className="font-bold text-white text-xs">{confirmedBooking.checkOutDate} до 12:00</span>
                  </div>
                </div>

                {/* Key Access Code */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-black">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-200 block font-semibold">Код от сейфа / домофона</span>
                      <span className="font-mono text-base font-black text-amber-400">{confirmedBooking.accessCode}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAccessCode}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {isCopiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedCode ? 'Скопирован' : 'Копировать'}</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-stone-400">
                  <span>Гость: {confirmedBooking.guestName}</span>
                  <span>{confirmedBooking.totalAmountRub.toLocaleString('ru-RU')} ₽ (${confirmedBooking.totalAmount})</span>
                </div>
              </div>

              {/* Host contact details */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={apartment.landlord?.avatar}
                    alt={apartment.landlord?.name}
                    className="w-10 h-10 rounded-full object-cover border border-stone-200"
                  />
                  <div>
                    <span className="text-[11px] text-stone-500 block">Хозяин апартаментов</span>
                    <span className="font-bold text-xs text-stone-900">{apartment.landlord?.name}</span>
                  </div>
                </div>
                <a
                  href={`tel:${apartment.landlord?.phone}`}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition"
                >
                  Позвонить
                </a>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-5 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-xs transition cursor-pointer"
              >
                Готово, вернуться к просмотру
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
