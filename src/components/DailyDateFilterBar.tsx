import React, { useState } from 'react';
import { Calendar, Users, X, Check, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

interface DailyDateFilterBarProps {
  checkInDate?: string;
  checkOutDate?: string;
  guestsCount?: number;
  availableCount: number;
  onUpdateDates: (dates: { checkIn?: string; checkOut?: string; guests?: number }) => void;
}

export const DailyDateFilterBar: React.FC<DailyDateFilterBarProps> = ({
  checkInDate,
  checkOutDate,
  guestsCount = 1,
  availableCount,
  onUpdateDates,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Local state for picker modal
  const [localCheckIn, setLocalCheckIn] = useState(
    checkInDate || new Date().toISOString().slice(0, 10)
  );
  const [localCheckOut, setLocalCheckOut] = useState(() => {
    if (checkOutDate) return checkOutDate;
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [localGuests, setLocalGuests] = useState(guestsCount);

  const formatDateRu = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    } catch {
      return isoStr;
    }
  };

  const getNightsText = (inD: string, outD: string) => {
    try {
      const diff = new Date(outD).getTime() - new Date(inD).getTime();
      const nights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      if (nights === 1) return '1 ночь';
      if (nights >= 2 && nights <= 4) return `${nights} ночи`;
      return `${nights} ночей`;
    } catch {
      return '';
    }
  };

  const hasDatesSelected = Boolean(checkInDate && checkOutDate);

  const handleApply = () => {
    triggerHaptic('success');
    onUpdateDates({
      checkIn: localCheckIn,
      checkOut: localCheckOut,
      guests: localGuests,
    });
    setIsModalOpen(false);
  };

  const handleClear = () => {
    triggerHaptic('selection');
    onUpdateDates({
      checkIn: undefined,
      checkOut: undefined,
      guests: 1,
    });
    setIsModalOpen(false);
  };

  const handleSetQuickWeekend = () => {
    triggerHaptic('selection');
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday, 5 is Friday
    const daysUntilFriday = (5 - day + 7) % 7 || 7;
    const friday = new Date(today);
    friday.setDate(today.getDate() + daysUntilFriday);
    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);

    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setLocalCheckIn(fmt(friday));
    setLocalCheckOut(fmt(sunday));
  };

  return (
    <>
      {/* Clickable Date Bar Indicator */}
      <div className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-white border border-stone-200/90 shadow-2xs text-xs mb-2">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsModalOpen(true);
          }}
          className="flex-1 flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition"
        >
          <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            {hasDatesSelected ? (
              <>
                <div className="font-extrabold text-stone-900 truncate">
                  {formatDateRu(checkInDate!)} — {formatDateRu(checkOutDate!)} ({getNightsText(checkInDate!, checkOutDate!)})
                </div>
                <div className="text-[10px] text-stone-500 flex items-center gap-1">
                  <span>{guestsCount} {guestsCount === 1 ? 'гость' : 'гостя'}</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-bold">{availableCount} свободно</span>
                </div>
              </>
            ) : (
              <>
                <div className="font-bold text-stone-800">
                  Выберите даты поездки
                </div>
                <div className="text-[10px] text-stone-500">
                  Показать только свободные апартаменты
                </div>
              </>
            )}
          </div>
        </button>

        {hasDatesSelected ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
            title="Сбросить даты"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsModalOpen(true);
            }}
            className="px-2.5 py-1 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-[11px] cursor-pointer"
          >
            Выбрать
          </button>
        )}
      </div>

      {/* Date Picker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div 
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-500" />
                <h3 className="font-extrabold text-stone-900 text-sm">Даты и гости для посуточной аренды</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={handleSetQuickWeekend}
                className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 text-[11px] font-bold shrink-0 border border-rose-100 cursor-pointer hover:bg-rose-100"
              >
                На выходные (Пт—Вс)
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Дата заезда (Check-in)
                </label>
                <input
                  type="date"
                  value={localCheckIn}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setLocalCheckIn(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Дата выезда (Check-out)
                </label>
                <input
                  type="date"
                  value={localCheckOut}
                  min={localCheckIn}
                  onChange={(e) => setLocalCheckOut(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Количество гостей
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setLocalGuests(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        localGuests === num
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {num} {num === 1 ? 'гость' : 'гостя'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
              >
                Сбросить
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Показать свободные объекты</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
