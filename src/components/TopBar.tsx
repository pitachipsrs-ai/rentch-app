import React from 'react';
import { RentchLogo } from './RentchLogo';
import {
  Briefcase,
  Flame,
  Users,
  MapPin,
  Heart,
  MessageCircle,
  SlidersHorizontal,
  LayoutGrid,
} from 'lucide-react';
import { NotificationItem, RentchCity, UserProfile } from '../types';
import { AuthButton } from './AuthButton';
import { PWAInstallButton } from './PWAInstallButton';
import { RENTCH_CITIES } from '../utils/districtUtils';
import { AppTab } from './BottomNavBar';

interface TopBarProps {
  notifications: NotificationItem[];
  onOpenNotifications?: () => void;
  isAdmin: boolean;
  isLandlord?: boolean;
  landlordName?: string;
  userProfile: UserProfile;
  onOpenAuth: () => void;
  onOpenLandlordModal?: () => void;
  onOpenSplash?: () => void;
  onOpenCrm?: () => void;
  activeCity?: RentchCity;
  onChangeCity?: (city: RentchCity) => void;
  activeTab?: AppTab;
  onTabChange?: (tab: AppTab) => void;
  matchesCount?: number;
  dialoguesCount?: number;
  onOpenFilters?: () => void;
  webCatalogMode?: 'swipe' | 'grid';
  onChangeWebCatalogMode?: (mode: 'swipe' | 'grid') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isAdmin,
  isLandlord = false,
  landlordName,
  userProfile,
  onOpenAuth,
  onOpenCrm,
  activeCity = 'tbilisi',
  onChangeCity,
  activeTab = 'swipe',
  onTabChange,
  matchesCount = 0,
  dialoguesCount = 0,
  onOpenFilters,
  webCatalogMode = 'swipe',
  onChangeWebCatalogMode,
}) => {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-30 py-2 px-3 sm:px-5 shadow-2xs">
      <div className="max-w-6xl mx-auto flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Brand Logo + Direct 1-Click City Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                onTabChange?.('swipe');
              }}
              title="На главную (Свайпы и Каталог)"
              className="flex items-center gap-2 text-left cursor-pointer hover:opacity-90 transition-opacity shrink-0"
            >
              <RentchLogo size="sm" showText={true} />
            </button>

            {/* Direct City Switcher Pills (Тбилиси / Ереван / Белград) */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-full border border-stone-200/80 overflow-x-auto no-scrollbar">
              {RENTCH_CITIES.map((city) => {
                const isSelected = activeCity === city.id;
                return (
                  <button
                    key={city.id}
                    type="button"
                    id={`topbar-city-${city.id}`}
                    onClick={() => onChangeCity?.(city.id)}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-stone-900 text-white shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>{city.flag}</span>
                    <span className={isSelected ? 'inline' : 'hidden md:inline'}>
                      {city.nameRu}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Desktop Web Navigation Bar */}
          {onTabChange && !isLandlord && (
            <nav className="hidden lg:flex items-center gap-1 bg-stone-100/90 p-1 rounded-2xl border border-stone-200/70">
              <button
                type="button"
                onClick={() => {
                  onTabChange('swipe');
                  onChangeWebCatalogMode?.('swipe');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'swipe' && webCatalogMode === 'swipe'
                    ? 'bg-white text-rose-600 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Свайпы</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onTabChange('swipe');
                  onChangeWebCatalogMode?.('grid');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'swipe' && webCatalogMode === 'grid'
                    ? 'bg-white text-rose-600 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Каталог (Web)</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('roommates')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'roommates'
                    ? 'bg-white text-rose-600 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Double Rentch 50/50</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-white text-amber-600 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Карта</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('matches')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'matches'
                    ? 'bg-white text-rose-600 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Мои Rentch!</span>
                {matchesCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {matchesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onTabChange('dialogues')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'dialogues'
                    ? 'bg-white text-rose-600 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Диалоги</span>
                {dialoguesCount > 0 && (
                  <span className="bg-stone-900 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {dialoguesCount}
                  </span>
                )}
              </button>

              {onOpenFilters && (
                <button
                  type="button"
                  onClick={onOpenFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 transition-all cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Фильтры</span>
                </button>
              )}
            </nav>
          )}

          {/* Right action items: PWA Install + CRM + AuthButton */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PWAInstallButton variant="compact" />

            {isAdmin && onOpenCrm && (
              <button
                type="button"
                id="topbar-open-crm-btn"
                onClick={onOpenCrm}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black py-1.5 px-3 rounded-full shadow-xs transition-colors cursor-pointer"
                title="Открыть CRM-панель"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>CRM</span>
              </button>
            )}

            <AuthButton
              isAdmin={isAdmin}
              isLandlord={isLandlord}
              landlordName={landlordName}
              userProfile={userProfile}
              onClick={onOpenAuth}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
