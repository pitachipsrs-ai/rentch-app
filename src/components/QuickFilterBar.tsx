import React from 'react';
import { 
  DollarSign, 
  MapPin, 
  Armchair, 
  SlidersHorizontal, 
  RotateCcw,
  Check,
  Sparkles
} from 'lucide-react';
import { FilterState } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface QuickFilterBarProps {
  filters: FilterState;
  onUpdateFilters: (newFilters: FilterState) => void;
  onOpenFilterDrawer: () => void;
  matchingCount?: number;
}

export const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  filters,
  onUpdateFilters,
  onOpenFilterDrawer,
  matchingCount,
}) => {
  const isUnder500 = filters.maxPrice <= 500;
  const isUnder800 = !isUnder500 && filters.maxPrice <= 800;
  const isPetFriendly = filters.petFriendlyOnly;
  const isCenter = filters.district === 'center';
  const activeCity = filters.city || 'tbilisi';
  const popularDistrictName =
    activeCity === 'yerevan'
      ? 'Арабкир (Arabkir)'
      : activeCity === 'belgrade'
      ? 'Нови Београд (Novi Beograd)'
      : 'Ортачала (Ortachala)';
  const popularDistrictShort =
    activeCity === 'yerevan'
      ? 'Арабкир'
      : activeCity === 'belgrade'
      ? 'Нови Београд'
      : 'Ортачала';
  const isOrtachala = filters.district === popularDistrictName;
  const isFurnished = filters.furniture === 'full';

  const hasAnyActiveFilter = 
    filters.maxPrice < 2000 || 
    filters.minPrice > 200 || 
    filters.petFriendlyOnly || 
    filters.district !== 'all' || 
    filters.furniture !== 'any' || 
    filters.period !== 'any';

  const handleToggleUnder500 = () => {
    triggerHaptic('selection');
    if (isUnder500) {
      onUpdateFilters({
        ...filters,
        minPrice: 200,
        maxPrice: 2000,
      });
    } else {
      onUpdateFilters({
        ...filters,
        minPrice: 200,
        maxPrice: 500,
      });
    }
  };

  const handleToggleUnder800 = () => {
    triggerHaptic('selection');
    if (isUnder800) {
      onUpdateFilters({
        ...filters,
        minPrice: 200,
        maxPrice: 2000,
      });
    } else {
      onUpdateFilters({
        ...filters,
        minPrice: 200,
        maxPrice: 800,
      });
    }
  };

  const handleTogglePets = () => {
    triggerHaptic('selection');
    onUpdateFilters({
      ...filters,
      petFriendlyOnly: !filters.petFriendlyOnly,
    });
  };

  const handleToggleCenter = () => {
    triggerHaptic('selection');
    onUpdateFilters({
      ...filters,
      district: filters.district === 'center' ? 'all' : 'center',
    });
  };

  const handleToggleOrtachala = () => {
    triggerHaptic('selection');
    onUpdateFilters({
      ...filters,
      district: filters.district === popularDistrictName ? 'all' : popularDistrictName,
    });
  };

  const handleToggleFurniture = () => {
    triggerHaptic('selection');
    onUpdateFilters({
      ...filters,
      furniture: filters.furniture === 'full' ? 'any' : 'full',
    });
  };

  const handleResetAll = () => {
    triggerHaptic('selection');
    onUpdateFilters({
      city: filters.city || 'tbilisi',
      minPrice: 200,
      maxPrice: 2000,
      furniture: 'any',
      district: 'all',
      period: 'any',
      petFriendlyOnly: false,
    });
  };

  return (
    <div 
      id="quick-filters-container"
      className="w-full max-w-full min-w-0 flex items-center justify-between gap-1.5 select-none overflow-hidden"
      role="toolbar"
      aria-label="Быстрые фильтры поиска"
    >
      {/* Scrollable list of quick filter chips */}
      <div 
        id="quick-filters-scroll"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-0.5 flex-1 min-w-0"
      >
        {/* 1. Reset / All Chip */}
        <button
          type="button"
          id="quick-filter-all"
          data-filter="all"
          onClick={handleResetAll}
          className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-xs cursor-pointer active:scale-95 ${
            !hasAnyActiveFilter
              ? 'bg-stone-900 text-white border-stone-900 shadow-stone-900/20'
              : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
          }`}
          title="Сбросить фильтры и показать все варианты"
        >
          {hasAnyActiveFilter ? (
            <RotateCcw className="w-3 h-3 text-stone-500" />
          ) : (
            <Sparkles className="w-3 h-3 text-amber-300" />
          )}
          <span>Все</span>
        </button>

        {/* 2. 'до 500$' Chip */}
        <button
          type="button"
          id="quick-filter-under-500"
          data-filter="under-500"
          onClick={handleToggleUnder500}
          className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-xs cursor-pointer active:scale-95 ${
            isUnder500
              ? 'bg-rose-500 text-white border-rose-500 shadow-rose-500/25 ring-2 ring-rose-500/20'
              : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
          }`}
          title={isUnder500 ? 'Снять фильтр до 500$' : 'Показать квартиры с ценой до 500$'}
        >
          <DollarSign className={`w-3.5 h-3.5 ${isUnder500 ? 'text-white' : 'text-emerald-600'}`} />
          <span>до 500$</span>
          {isUnder500 && <Check className="w-3 h-3 ml-0.5" />}
        </button>

        {/* 4. 'центр' Chip */}
        <button
          type="button"
          id="quick-filter-center"
          data-filter="center"
          onClick={handleToggleCenter}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-xs cursor-pointer active:scale-95 ${
            isCenter
              ? 'bg-rose-500 text-white border-rose-500 shadow-rose-500/25 ring-2 ring-rose-500/20'
              : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
          }`}
          title={isCenter ? 'Снять фильтр по центру' : 'Центральные районы (Ваке, Вера, Мтацминда, Сололаки, Чугурети)'}
        >
          <MapPin className={`w-3.5 h-3.5 ${isCenter ? 'text-white' : 'text-rose-500'}`} />
          <span>центр</span>
          {isCenter && <Check className="w-3 h-3 ml-0.5" />}
        </button>

        {/* 5. 'Ортачала' Chip */}
        <button
          type="button"
          id="quick-filter-ortachala"
          data-filter="ortachala"
          onClick={handleToggleOrtachala}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-xs cursor-pointer active:scale-95 ${
            isOrtachala
              ? 'bg-rose-500 text-white border-rose-500 shadow-rose-500/25 ring-2 ring-rose-500/20'
              : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
          }`}
          title={isOrtachala ? `Снять фильтр по ${popularDistrictShort}` : `Только квартиры в районе ${popularDistrictShort}`}
        >
          <MapPin className={`w-3.5 h-3.5 ${isOrtachala ? 'text-white' : 'text-amber-600'}`} />
          <span>{popularDistrictShort}</span>
          {isOrtachala && <Check className="w-3 h-3 ml-0.5" />}
        </button>

        {/* 5. 'до 800$' Chip */}
        <button
          type="button"
          id="quick-filter-under-800"
          data-filter="under-800"
          onClick={handleToggleUnder800}
          className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-xs cursor-pointer active:scale-95 ${
            isUnder800
              ? 'bg-rose-500 text-white border-rose-500 shadow-rose-500/25 ring-2 ring-rose-500/20'
              : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
          }`}
          title={isUnder800 ? 'Снять фильтр до 800$' : 'Показать квартиры с ценой до 800$'}
        >
          <DollarSign className={`w-3.5 h-3.5 ${isUnder800 ? 'text-white' : 'text-emerald-600'}`} />
          <span>до 800$</span>
          {isUnder800 && <Check className="w-3 h-3 ml-0.5" />}
        </button>

        {/* 6. 'с мебелью' Chip */}
        <button
          type="button"
          id="quick-filter-furniture"
          data-filter="furniture"
          onClick={handleToggleFurniture}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-xs cursor-pointer active:scale-95 ${
            isFurnished
              ? 'bg-rose-500 text-white border-rose-500 shadow-rose-500/25 ring-2 ring-rose-500/20'
              : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
          }`}
          title={isFurnished ? 'Снять фильтр по мебели' : 'Только квартиры с полной меблировкой'}
        >
          <Armchair className={`w-3.5 h-3.5 ${isFurnished ? 'text-white' : 'text-indigo-600'}`} />
          <span>с мебелью</span>
          {isFurnished && <Check className="w-3 h-3 ml-0.5" />}
        </button>
      </div>

      {/* Button to open main filter drawer */}
      <button
        type="button"
        id="quick-filter-open-drawer-btn"
        onClick={onOpenFilterDrawer}
        className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-xs cursor-pointer active:scale-95 ${
          hasAnyActiveFilter
            ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
            : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
        }`}
        title="Открыть все фильтры"
        aria-label="Открыть расширенные фильтры"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
        {typeof matchingCount === 'number' && (
          <span className="text-[11px] font-bold text-rose-600 bg-rose-100/80 px-1.5 py-0.2 rounded-full">
            {matchingCount}
          </span>
        )}
      </button>
    </div>
  );
};
