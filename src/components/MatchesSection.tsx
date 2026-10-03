import React from 'react';
import { 
  Heart, 
  MapPin, 
  MessageCircle, 
  Sparkles, 
  Calendar, 
  ArrowRight,
  Home,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Apartment, ApartmentChat } from '../types';
import { stripPhoneAndContactMentions } from '../utils/phoneSanitizer';
import { formatDistrictDisplay, getAccurateApartmentDistrict } from '../utils/districtUtils';

interface MatchesSectionProps {
  matchedApartments: Apartment[];
  chats: Record<string, ApartmentChat>;
  onOpenChat: (apartment: Apartment) => void;
  onOpenDetails: (apartment: Apartment) => void;
  onFindRoommate?: (apartment: Apartment) => void;
  onExploreMore: () => void;
}

export const MatchesSection: React.FC<MatchesSectionProps> = ({
  matchedApartments,
  chats,
  onOpenChat,
  onOpenDetails,
  onFindRoommate,
  onExploreMore,
}) => {
  if (matchedApartments.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
          <Heart className="w-8 h-8 fill-rose-500/20 text-rose-500" />
        </div>
        <h3 className="text-xl font-bold text-stone-900">Пока нет Rentch!</h3>
        <p className="text-sm text-stone-500 mt-2 max-w-xs mx-auto leading-relaxed">
          Свайпайте понравившиеся квартиры вправо, чтобы добавить их в свои Rentch! и получить возможность обсудить условия аренды!
        </p>
        <button
          type="button"
          id="empty-matches-explore-btn"
          onClick={onExploreMore}
          className="mt-6 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold py-3 px-6 rounded-2xl text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          Перейти к свайпам
        </button>
      </div>
    );
  }

  return (
    <div id="matches-section" className="w-full max-w-4xl min-w-0 mx-auto py-4 px-2 sm:px-4 space-y-5 pb-24 overflow-hidden">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            <span>Ваши Rentch!</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Объекты, которые вы отметили как понравившиеся ({matchedApartments.length})
          </p>
        </div>
      </div>

      {/* Grid of matched apartments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matchedApartments.map((apt) => {
          const chat = chats[apt.id];
          const hasScheduledViewing = chat?.viewingConfirmed;

          return (
            <div
              key={apt.id}
              id={`match-card-${apt.id}`}
              className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div 
                className="relative h-44 cursor-pointer overflow-hidden"
                onClick={() => onOpenDetails(apt)}
              >
                <img
                  src={apt.images[0]}
                  alt={apt.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-transparent to-transparent" />

                <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                  {formatDistrictDisplay(getAccurateApartmentDistrict(apt))}
                </div>

                <div className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" />
                  <span>Rentch!</span>
                </div>

                <div className="absolute bottom-2.5 inset-x-3 text-white">
                  <div className="text-xl font-extrabold">
                    {apt.currency === 'EUR' || apt.city === 'belgrade'
                      ? `€${apt.priceUsd}`
                      : apt.currency === 'GEL'
                      ? `${apt.priceGel || Math.round(apt.priceUsd * 2.72)} ₾`
                      : `$${apt.priceUsd}`}{' '}
                    <span className="text-xs font-normal text-stone-300">/ мес</span>
                  </div>
                  <p className="text-xs text-stone-200 truncate mt-0.5">{stripPhoneAndContactMentions(apt.title)}</p>
                </div>
              </div>

              <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5 text-xs text-stone-600">
                  <div className="flex items-center gap-1 text-[11px] text-stone-500 truncate">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                    <span>{apt.address}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] pt-1">
                    <span className="bg-stone-100 px-2 py-0.5 rounded-md font-medium text-stone-700">
                      {apt.rooms} комн. • {apt.areaSqm} м²
                    </span>
                    <span className="bg-stone-100 px-2 py-0.5 rounded-md font-medium text-stone-700">
                      {apt.furniture === 'full' ? 'Мебель ✓' : 'Без мебели'}
                    </span>
                  </div>

                  {hasScheduledViewing ? (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl font-semibold border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Осмотр: {chat.viewingSlot?.date} в {chat.viewingSlot?.time}</span>
                    </div>
                  ) : null}
                </div>

                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenDetails(apt)}
                      className="flex-1 py-2 px-3 rounded-xl border border-stone-200 hover:border-stone-300 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Инфо
                    </button>

                    <button
                      type="button"
                      id={`open-chat-match-${apt.id}`}
                      onClick={() => onOpenChat(apt)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Диалог</span>
                    </button>
                  </div>

                  {onFindRoommate && (
                    <button
                      type="button"
                      id={`find-roommate-match-${apt.id}`}
                      onClick={() => onFindRoommate(apt)}
                      className="w-full py-2 px-3 rounded-xl bg-stone-950 hover:bg-stone-900 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Найти соседа · Снять вдвоём (50/50)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
