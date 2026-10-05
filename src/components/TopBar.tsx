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
  Zap,
} from 'lucide-react';
import { NotificationItem, RentalCategory, RentchCity, UserProfile } from '../types';
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
  hasActiveFilters?: boolean;
  rentalCategory: RentalCategory;
  onChangeRentalCategory: (cat: RentalCategory) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isAdmin,
  isLandlord = false,
  landlordName,
  userProfile,
  onOpenAuth,
  onOpenCrm,
  activeTab = 'swipe',
  onTabChange,
  onOpenFilters,
  hasActiveFilters = false,
  rentalCategory = 'long_term',
  onChangeRentalCategory,
}) => {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 py-2">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Filter Button (Like in Tinder) + Brand Logo */}
          <div className="flex items-center gap-2 min-w-0">
            {onOpenFilters && (
              <button
                type="button"
                id="tinder-filter-btn"
                onClick={onOpenFilters}
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-all cursor-pointer relative shadow-2xs active:scale-95 shrink-0"
                title="Настроить фильтры поиска"
                aria-label="Фильтры"
              >
                <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
                {hasActiveFilters && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => onTabChange?.('swipe')}
              title="На главную Rentch"
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
            >
              <RentchLogo size="sm" showText={true} />
            </button>
          </div>

          {/* Center: Tinder Top Category Tabs: 1. Долгосрочная аренда, 2. Посуточная аренда, 3. Double Rentch */}
          <div className="hidden sm:flex items-center bg-stone-100/90 p-1 rounded-full border border-stone-200/80 shadow-2xs">
            <button
              type="button"
              id="category-tab-long-term"
              onClick={() => {
                onTabChange?.('swipe');
                onChangeRentalCategory('long_term');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === 'swipe' && rentalCategory === 'long_term'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Долгосрочная аренда
            </button>

            <button
              type="button"
              id="category-tab-daily"
              onClick={() => {
                onTabChange?.('swipe');
                onChangeRentalCategory('daily');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === 'swipe' && rentalCategory === 'daily'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Посуточная аренда
            </button>

            <button
              type="button"
              id="category-tab-double-rentch"
              onClick={() => {
                onTabChange?.('roommates');
                onChangeRentalCategory('double_rentch');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'roommates' || rentalCategory === 'double_rentch'
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Double Rentch</span>
              <span className="text-[10px] bg-white/20 px-1 rounded-full">50/50</span>
            </button>
          </div>

          {/* Right Action Items: PWA + CRM + Auth (City selection removed as requested) */}
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

        {/* Mobile Sub-header: Tinder Segmented Tabs Row (Долгосрочная first) */}
        <div className="flex sm:hidden items-center justify-between bg-stone-100/90 p-1 rounded-full border border-stone-200/80 mt-2 shadow-2xs">
          <button
            type="button"
            id="mobile-category-tab-long-term"
            onClick={() => {
              onTabChange?.('swipe');
              onChangeRentalCategory('long_term');
            }}
            className={`flex-1 py-1.5 text-center rounded-full text-[11px] font-black transition-all cursor-pointer truncate ${
              activeTab === 'swipe' && rentalCategory === 'long_term'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Долгосрочная
          </button>

          <button
            type="button"
            id="mobile-category-tab-daily"
            onClick={() => {
              onTabChange?.('swipe');
              onChangeRentalCategory('daily');
            }}
            className={`flex-1 py-1.5 text-center rounded-full text-[11px] font-black transition-all cursor-pointer truncate ${
              activeTab === 'swipe' && rentalCategory === 'daily'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Посуточная аренда
          </button>

          <button
            type="button"
            id="mobile-category-tab-double-rentch"
            onClick={() => {
              onTabChange?.('roommates');
              onChangeRentalCategory('double_rentch');
            }}
            className={`flex-1 py-1.5 text-center rounded-full text-[11px] font-black transition-all cursor-pointer truncate ${
              activeTab === 'roommates' || rentalCategory === 'double_rentch'
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Double Rentch
          </button>
        </div>
      </div>
    </header>
  );
};
