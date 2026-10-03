import React from 'react';
import { 
  Flame, 
  MapPin, 
  Heart, 
  MessageCircle, 
  SlidersHorizontal, 
  UserCheck, 
  Briefcase,
  Users
} from 'lucide-react';

export type AppTab = 'swipe' | 'roommates' | 'map' | 'matches' | 'dialogues' | 'admin' | 'landlord';

interface BottomNavBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  matchesCount: number;
  dialoguesCount: number;
  onOpenFilters: () => void;
  onOpenProfile: () => void;
  hasActiveFilters: boolean;
  isRegistered: boolean;
  isAdmin?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  matchesCount,
  dialoguesCount,
  onOpenFilters,
  onOpenProfile,
  hasActiveFilters,
  isRegistered,
  isAdmin = false,
}) => {
  return (
    <nav 
      id="bottom-navigation-bar"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-stone-200 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] py-1.5 px-1 sm:px-4"
    >
      <div className="max-w-xl mx-auto flex items-center justify-around gap-0.5 sm:gap-2">
        {/* 1. Свайпы */}
        <button
          type="button"
          id="nav-tab-swipe"
          onClick={() => onTabChange('swipe')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'swipe'
              ? 'text-rose-600 font-bold scale-105'
              : 'text-stone-500 hover:text-stone-800'
          }`}
          aria-label="Свайпы квартир"
        >
          <div className="relative">
            <Flame className={`w-5 h-5 ${activeTab === 'swipe' ? 'fill-rose-500' : ''}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[52px]">
            Свайпы
          </span>
        </button>

        {/* 2. Найти соседа (Double Rentch 50/50) */}
        <button
          type="button"
          id="nav-tab-roommates"
          onClick={() => onTabChange('roommates')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all cursor-pointer relative ${
            activeTab === 'roommates'
              ? 'text-rose-600 font-bold scale-105'
              : 'text-stone-500 hover:text-stone-800'
          }`}
          aria-label="Найти соседа"
        >
          <div className="relative">
            <Users className={`w-5 h-5 ${activeTab === 'roommates' ? 'text-rose-600' : ''}`} />
            <span className="absolute -top-1 -right-3 bg-emerald-500 text-stone-950 text-[8px] font-black px-1 rounded-full leading-tight">
              50/50
            </span>
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
            Соседи
          </span>
        </button>

        {/* 3. Карта */}
        <button
          type="button"
          id="nav-tab-map"
          onClick={() => onTabChange('map')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'map'
              ? 'text-amber-600 font-bold scale-105'
              : 'text-stone-500 hover:text-stone-800'
          }`}
          aria-label="Карта Тбилиси"
        >
          <MapPin className={`w-5 h-5 ${activeTab === 'map' ? 'fill-amber-500' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[48px]">
            Карта
          </span>
        </button>

        {/* 3. Rentch! */}
        <button
          type="button"
          id="nav-tab-matches"
          onClick={() => onTabChange('matches')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all cursor-pointer relative ${
            activeTab === 'matches'
              ? 'text-rose-600 font-bold scale-105'
              : 'text-stone-500 hover:text-stone-800'
          }`}
          aria-label="Rentch!"
        >
          <div className="relative">
            <Heart className={`w-5 h-5 ${activeTab === 'matches' ? 'fill-rose-500' : ''}`} />
            {matchesCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {matchesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[48px]">
            Rentch!
          </span>
        </button>

        {/* 4. Диалоги */}
        <button
          type="button"
          id="nav-tab-dialogues"
          onClick={() => onTabChange('dialogues')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all cursor-pointer relative ${
            activeTab === 'dialogues'
              ? 'text-rose-600 font-bold scale-105'
              : 'text-stone-500 hover:text-stone-800'
          }`}
          aria-label="Диалоги"
        >
          <div className="relative">
            <MessageCircle className={`w-5 h-5 ${activeTab === 'dialogues' ? 'fill-rose-500/20' : ''}`} />
            {dialoguesCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-stone-900 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {dialoguesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[48px]">
            Диалоги
          </span>
        </button>

        {/* 5. Фильтры */}
        <button
          type="button"
          id="nav-tab-filters"
          onClick={onOpenFilters}
          className="flex flex-col items-center justify-center flex-1 py-1 rounded-2xl text-stone-500 hover:text-stone-800 transition-all cursor-pointer relative"
          aria-label="Фильтры"
        >
          <div className="relative">
            <SlidersHorizontal className="w-5 h-5" />
            {hasActiveFilters && (
              <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[48px]">
            Фильтры
          </span>
        </button>

        {/* 6. Анкета */}
        <button
          type="button"
          id="nav-tab-profile"
          onClick={onOpenProfile}
          className="flex flex-col items-center justify-center flex-1 py-1 rounded-2xl text-stone-500 hover:text-stone-800 transition-all cursor-pointer"
          aria-label="Анкета арендатора"
        >
          <div className="relative">
            <UserCheck className="w-5 h-5" />
            {isRegistered && (
              <span className="absolute -bottom-0.5 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[48px]">
            Анкета
          </span>
        </button>

        {/* 7. CRM / Админ — visible only to administrator */}
        {isAdmin && (
          <button
            type="button"
            id="nav-tab-admin-crm"
            onClick={() => onTabChange('admin')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'text-stone-950 font-bold scale-105'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            aria-label="CRM Панель"
          >
            <div className="relative">
              <Briefcase className={`w-5 h-5 ${activeTab === 'admin' ? 'fill-stone-900 text-stone-900' : ''}`} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[48px]">
              CRM
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
