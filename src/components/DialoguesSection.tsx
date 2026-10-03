import React, { useState } from 'react';
import { 
  MessageCircle, 
  Calendar, 
  Search, 
  CheckCircle2, 
  ChevronRight, 
  Bot, 
  Clock, 
  Sparkles,
  MapPin
} from 'lucide-react';
import { Apartment, ApartmentChat } from '../types';

interface DialoguesSectionProps {
  matchedApartments: Apartment[];
  allApartments?: Apartment[];
  chats: Record<string, ApartmentChat>;
  onOpenChat: (apartment: Apartment) => void;
  onExploreMore: () => void;
}

export const SUPPORT_CHAT_APARTMENT: Apartment = {
  id: 'rentch-admin-support',
  title: 'Чат с администратором Rentch',
  district: 'Ваке (Vake)',
  address: 'Персональный подбор квартир в Тбилиси',
  priceUsd: 0,
  rooms: 1,
  bedrooms: 1,
  areaSqm: 50,
  floor: 1,
  totalFloors: 1,
  furniture: 'full',
  petPolicy: 'allowed',
  minPeriod: 'month_to_year',
  maxResidents: 2,
  images: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80'],
  description: 'Прямой диалог с администратором и отделом аренды Rentch.',
  amenities: [],
  lat: 41.7151,
  lng: 44.7874,
  landlord: {
    id: 'admin-rentch',
    name: 'Администратор Rentch',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    phone: '+995 558 542 365',
    verified: true,
    responseTime: 'онлайн',
    rating: 5.0,
  },
};

export const DialoguesSection: React.FC<DialoguesSectionProps> = ({
  matchedApartments,
  allApartments = [],
  chats,
  onOpenChat,
  onExploreMore,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Dialogues strictly correspond to right-swiped (matched) apartments
  const dialogueApartments = React.useMemo(() => {
    return matchedApartments;
  }, [matchedApartments]);

  // Apartments that have an initialized chat or have been liked
  const activeDialogues = dialogueApartments.filter((apt) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      apt.title.toLowerCase().includes(query) ||
      apt.district.toLowerCase().includes(query) ||
      apt.address.toLowerCase().includes(query)
    );
  });

  if (dialogueApartments.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
          <MessageCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-stone-900">Нет активных диалогов</h3>
        <p className="text-sm text-stone-500 mt-2 max-w-xs mx-auto leading-relaxed">
          Чтобы начать диалог и забронировать осмотр квартиры, свайпайте понравившиеся варианты вправо в ленте!
        </p>
        <button
          type="button"
          onClick={onExploreMore}
          className="mt-6 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold py-3 px-6 rounded-2xl text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          Найти квартиру
        </button>
      </div>
    );
  }

  return (
    <div id="dialogues-section" className="w-full max-w-3xl min-w-0 mx-auto py-2 sm:py-4 px-1 sm:px-4 space-y-2.5 sm:space-y-4 pb-24 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 px-1 min-w-0">
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 flex-shrink-0" />
            <span className="truncate">Диалоги по аренде</span>
            <span className="text-xs bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded-full flex-shrink-0">
              {activeDialogues.length}
            </span>
          </h2>
          <p className="hidden sm:block text-xs text-stone-500 mt-0.5">
            Обсуждение условий и согласование времени осмотра квартир в Тбилиси
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64 min-w-0">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по диалогам..."
            className="w-full max-w-full bg-white border border-stone-200 rounded-xl sm:rounded-2xl pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Dialogues list */}
      <div className="w-full min-w-0 space-y-2 sm:space-y-3">
        {activeDialogues.map((apt) => {
          const chat = chats[apt.id];
          const messages = chat?.messages || [];
          const lastMsg = messages[messages.length - 1];
          const isViewingConfirmed = chat?.viewingConfirmed;

          return (
            <div
              key={apt.id}
              id={`dialogue-item-${apt.id}`}
              onClick={() => onOpenChat(apt)}
              className="w-full max-w-full min-w-0 overflow-hidden bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 border border-stone-200/90 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-2 sm:gap-3 group"
            >
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 overflow-hidden">
                {/* Image */}
                <div className="relative flex-shrink-0 flex items-center">
                  <img
                    src={apt.images[0]}
                    alt={apt.title}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border border-stone-100 group-hover:scale-105 transition-transform"
                  />
                  {chat?.roommate ? (
                    <img
                      src={chat.roommate.avatar}
                      alt={chat.roommate.name}
                      title={`Совместная аренда с ${chat.roommate.name}`}
                      className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-emerald-400 -ml-3 shadow-sm"
                    />
                  ) : (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center border sm:border-2 border-white shadow-xs">
                      <Bot className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 overflow-hidden">
                  {/* Top row: Title + Price + Time */}
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                      <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate min-w-0">
                        {chat?.roommate
                          ? `${chat.roommate.name} + Админ · ${apt.title}`
                          : apt.title}
                      </h4>
                      {apt.priceUsd > 0 && (
                        <span className="text-[11px] sm:text-xs text-rose-600 font-extrabold flex-shrink-0">
                          {apt.currency === 'EUR' || apt.city === 'belgrade'
                            ? `€${apt.priceUsd}`
                            : apt.currency === 'GEL'
                            ? `${apt.priceGel || Math.round(apt.priceUsd * 2.72)} ₾`
                            : `$${apt.priceUsd}`}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-stone-400 font-medium flex-shrink-0 ml-1">
                      {lastMsg ? lastMsg.timestamp : 'Недавно'}
                    </span>
                  </div>

                  {/* Message snippet */}
                  <p className="block w-full text-[11px] sm:text-xs text-stone-600 truncate mt-0.5 leading-snug">
                    {lastMsg ? (
                      <>
                        <span className="font-semibold text-stone-700">
                          {lastMsg.sender === 'user'
                            ? 'Вы: '
                            : lastMsg.sender === 'roommate'
                            ? `${lastMsg.senderName || chat?.roommate?.name || 'Сосед'}: `
                            : lastMsg.sender === 'bot'
                            ? '🤖 Бот: '
                            : 'Админ: '}
                        </span>
                        {lastMsg.text.replace(/\s+/g, ' ')}
                      </>
                    ) : (
                      'Робот готов забронировать осмотр...'
                    )}
                  </p>

                  {/* Status chip */}
                  <div className="mt-1 flex items-center gap-2 min-w-0 max-w-full">
                    {isViewingConfirmed ? (
                      <span className="inline-flex items-center gap-1 max-w-full overflow-hidden text-[10px] sm:text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-100">
                        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">
                          Осмотр: {chat.viewingSlot?.date} ({chat.viewingSlot?.time})
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 max-w-full overflow-hidden text-[10px] sm:text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-100">
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600 flex-shrink-0" />
                        <span className="truncate">Выбрать время осмотра</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Chevron */}
              <div className="flex items-center text-stone-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 pl-0.5">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
