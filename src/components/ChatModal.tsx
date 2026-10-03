import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Sparkles,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Apartment, ChatMessage, UserProfile, ApartmentChat } from '../types';
import { initiatePhoneCall } from '../utils/telegram';

interface ChatModalProps {
  apartment: Apartment | null;
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  chats: Record<string, ApartmentChat>;
  onSendMessage: (apartmentId: string, message: ChatMessage) => void;
  onRequestRegistration: (apartment: Apartment, date?: string, time?: string) => void;
  onConfirmViewing: (apartmentId: string, date: string, time: string) => void;
}

function getUpcomingDateOptions(): string[] {
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const options: string[] = [];
  const now = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dayNum = d.getDate();
    const monthName = months[d.getMonth()];
    const weekDay = weekdays[d.getDay()];
    if (i === 0) {
      options.push(`Сегодня (${dayNum} ${monthName})`);
    } else if (i === 1) {
      options.push(`Завтра (${dayNum} ${monthName})`);
    } else if (i === 2) {
      options.push(`Послезавтра (${dayNum} ${monthName})`);
    } else {
      options.push(`${weekDay}, ${dayNum} ${monthName}`);
    }
  }
  return options;
}

const TIME_OPTIONS = [
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
];

export const ChatModal: React.FC<ChatModalProps> = ({
  apartment,
  isOpen,
  onClose,
  userProfile,
  chats,
  onSendMessage,
  onRequestRegistration,
  onConfirmViewing,
}) => {
  const dateOptions = React.useMemo(() => getUpcomingDateOptions(), []);
  const [inputText, setInputText] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => dateOptions[1] || 'Завтра');
  const [selectedTime, setSelectedTime] = useState('18:00');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = apartment ? chats[apartment.id] : null;
  const messages = currentChat?.messages || [];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  if (!isOpen || !apartment) return null;

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      senderName: userProfile.name || 'Клиент',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onSendMessage(apartment.id, newMsg);
    setInputText('');
  };

  const handleBookingClick = () => {
    if (!userProfile.isRegistered || !userProfile.questionnaireCompleted) {
      // Trigger questionnaire & registration flow preserving chosen date & time
      onRequestRegistration(apartment, selectedDate, selectedTime);
    } else {
      // Already registered, confirm viewing directly
      onConfirmViewing(apartment.id, selectedDate, selectedTime);
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="chat-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          id="chat-modal-window"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh] sm:h-[85vh] border border-stone-100"
        >
          {/* Header */}
          <div className="bg-stone-900 text-white p-3 sm:p-4 sm:px-6 flex items-center justify-between gap-2 border-b border-stone-800 min-w-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 overflow-hidden">
              <div className="relative flex-shrink-0 flex items-center">
                <img
                  src={apartment.images[0]}
                  alt={apartment.title}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border-2 border-rose-500 shadow-md"
                />
                {currentChat?.roommate ? (
                  <img
                    src={currentChat.roommate.avatar}
                    alt={currentChat.roommate.name}
                    title={`Сосед 50/50: ${currentChat.roommate.name}`}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-emerald-400 -ml-3 shadow-md"
                  />
                ) : (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-stone-900 flex items-center justify-center text-[9px] font-bold text-white">
                    ✓
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="font-bold text-xs sm:text-base text-white truncate min-w-0">
                    {currentChat?.roommate
                      ? `${currentChat.roommate.name} + Админ · ${apartment.title}`
                      : apartment.title}
                  </h3>
                  <span className="hidden sm:inline-block text-[10px] bg-rose-500/20 text-rose-300 font-semibold px-2 py-0.5 rounded-full border border-rose-500/30 flex-shrink-0">
                    {currentChat?.roommate ? 'Совместная аренда 50/50' : 'Rentch Аренда'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-stone-400 min-w-0">
                  <span className="truncate min-w-0">
                    {currentChat?.roommate
                      ? `Участники: Вы, ${currentChat.roommate.name} (${currentChat.roommate.age}) и Администратор Rentch`
                      : apartment.address}
                  </span>
                  {apartment.priceUsd > 0 && (
                    <span className="text-emerald-400 font-semibold flex-shrink-0">
                      {currentChat?.roommate
                        ? `50/50: $${Math.round(apartment.priceUsd / 2)}/чел`
                        : `$${apartment.priceUsd}/мес`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {currentChat?.roommate?.telegram && (
                <a
                  href={`https://t.me/${currentChat.roommate.telegram
                    .replace(/^@/, '')
                    .trim()}?text=${encodeURIComponent(
                    `Привет, ${currentChat.roommate.name}! 👋 Я отправил(а) тебе заявку Double Rentch! 50/50 по квартире «${apartment.title}» ($${Math.round(
                      apartment.priceUsd / 2
                    )}/мес с человека). Давай выберем время совместного просмотра!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 sm:px-3.5 py-2 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title={`Написать ${currentChat.roommate.name} в Telegram (${currentChat.roommate.telegram})`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Telegram соседа</span>
                </a>
              )}
              <a
                href="tel:+995558542365"
                target="_top"
                rel="noopener noreferrer"
                onClick={() => initiatePhoneCall('+995558542365')}
                className="px-2.5 sm:px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Позвонить: +995 558 542365"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Позвонить</span>
              </a>
              <button
                id="close-chat-btn"
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Viewing scheduling banner if not yet confirmed */}
          {!currentChat?.viewingConfirmed ? (
            <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-b border-rose-100 p-3.5 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <span>Предложение просмотра от Rentch Bot</span>
                      <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded font-semibold">
                        Шаг 1
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600">
                      Выберите время и нажмите «Подтвердить просмотр» (потребуется быстрая анкета)
                    </p>
                  </div>
                </div>

                {/* Date & Time Selectors */}
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    id="booking-date-select"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-stone-800 font-medium shadow-2xs focus:ring-2 focus:ring-rose-500 cursor-pointer"
                  >
                    {dateOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <select
                    id="booking-time-select"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="text-xs bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-stone-800 font-medium shadow-2xs focus:ring-2 focus:ring-rose-500 cursor-pointer"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <button
                    id="confirm-booking-header-btn"
                    onClick={handleBookingClick}
                    className="text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Записаться на просмотр</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border-b border-emerald-200 p-3 sm:px-6 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>
                  Просмотр забронирован на <strong className="font-bold">{currentChat.viewingSlot?.date} в {currentChat.viewingSlot?.time}</strong>
                </span>
              </div>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Бронь подтверждена
              </span>
            </div>
          )}

          {/* Messages list */}
          <div 
            id="chat-messages-container"
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-stone-50/50"
          >
            {messages.map((msg) => {
              if (msg.sender === 'bot') {
                return (
                  <div key={msg.id} className="flex items-start gap-3 max-w-lg">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="bg-white border border-rose-100 rounded-3xl rounded-tl-xs p-4 shadow-sm text-stone-800 text-xs sm:text-sm">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-rose-600 text-xs flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Rentch Assistant Bot
                        </span>
                        <span className="text-[10px] text-stone-400">{msg.timestamp}</span>
                      </div>
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                      {/* Action button & inline date/time picker inside bot message if viewing not yet confirmed */}
                      {!currentChat?.viewingConfirmed && (
                        <div className="mt-3 pt-3 border-t border-stone-100 space-y-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                                Удобный день:
                              </label>
                              <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-stone-900 font-semibold focus:ring-2 focus:ring-rose-500 cursor-pointer"
                              >
                                {dateOptions.map((d) => (
                                  <option key={d} value={d}>
                                    {d}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                                Удобное время:
                              </label>
                              <select
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-stone-900 font-semibold focus:ring-2 focus:ring-rose-500 cursor-pointer"
                              >
                                {TIME_OPTIONS.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <button
                            id="bot-confirm-viewing-action-btn"
                            onClick={handleBookingClick}
                            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>
                              Записаться на просмотр: {selectedDate} в {selectedTime}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              if (msg.sender === 'roommate') {
                return (
                  <div key={msg.id} className="flex items-start gap-3 max-w-lg">
                    <img
                      src={
                        msg.senderAvatar ||
                        currentChat?.roommate?.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={msg.senderName || 'Сосед'}
                      className="w-9 h-9 rounded-2xl object-cover border-2 border-emerald-400 flex-shrink-0 shadow-sm"
                    />
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl rounded-tl-xs p-4 shadow-2xs text-stone-800 text-xs sm:text-sm">
                      <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
                        <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {msg.senderName || currentChat?.roommate?.name || 'Сосед'} · Сосед 50/50
                        </span>
                        <span className="text-[10px] text-stone-400">{msg.timestamp}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-line text-stone-800">{msg.text}</p>
                    </div>
                  </div>
                );
              }

              if (msg.sender === 'landlord') {
                const hasPhone = msg.text.includes('+995 558 542 365') || msg.text.includes('558 542 365') || msg.text.includes('Телефон для связи');
                return (
                  <div key={msg.id} className="flex items-start gap-3 max-w-lg">
                    <div className="w-9 h-9 rounded-2xl bg-stone-800 text-amber-300 flex items-center justify-center flex-shrink-0 border border-stone-700 font-bold text-xs shadow-sm">
                      R
                    </div>
                    <div className="bg-white border border-stone-200 rounded-3xl rounded-tl-xs p-4 shadow-xs text-stone-800 text-xs sm:text-sm">
                      <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
                        <span className="font-bold text-stone-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          {msg.senderName || 'Администратор (Rentch)'}
                        </span>
                        <span className="text-[10px] text-stone-400">{msg.timestamp}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-line text-stone-800">{msg.text}</p>
                      
                      {hasPhone && (
                        <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap items-center gap-2">
                          <a
                            href="tel:+995558542365"
                            target="_top"
                            rel="noopener noreferrer"
                            onClick={() => initiatePhoneCall('+995558542365')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Позвонить: +995 558 542365</span>
                          </a>
                          <a
                            href="https://wa.me/995558542365"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-800 font-bold text-xs rounded-xl border border-green-200 transition-colors shadow-2xs"
                          >
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // User message
              return (
                <div key={msg.id} className="flex items-start justify-end gap-2.5">
                  <div className="bg-rose-500 text-white rounded-3xl rounded-tr-xs p-4 shadow-sm text-xs sm:text-sm max-w-lg">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <span className="text-[10px] text-rose-100">{msg.timestamp}</span>
                      <span className="font-semibold text-rose-100 text-xs">Вы</span>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  </div>
                  <div className="w-9 h-9 rounded-2xl bg-stone-900 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {userProfile.name ? userProfile.name.charAt(0) : 'Я'}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input box */}
          <form 
            onSubmit={handleSendCustomMessage}
            className="p-3 sm:p-4 bg-white border-t border-stone-200 flex items-center gap-2"
          >
            <input
              type="text"
              id="chat-message-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                currentChat?.roommate
                  ? `Напишите сообщение ${currentChat.roommate.name} и администратору...`
                  : 'Напишите сообщение администратору...'
              }
              className="flex-1 bg-stone-100 border border-stone-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="submit"
              id="send-chat-msg-btn"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white flex items-center justify-center transition-all cursor-pointer flex-shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
