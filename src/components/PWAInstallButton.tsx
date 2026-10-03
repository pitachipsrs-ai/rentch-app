import React, { useState } from 'react';
import { Download, Share, PlusSquare, Check, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as an installed PWA, hide or show installed badge
  if (isInstalled) {
    if (variant === 'banner') return null;
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold ${className}`}>
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span>PWA установлено</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        <div className={`bg-gradient-to-r from-rose-50 to-stone-50 border border-rose-200/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900">Установите Rentch как приложение (PWA)</h4>
              <p className="text-xs text-stone-600 mt-0.5">
                Быстрый доступ с домашнего экрана, офлайн-режим и мгновенные уведомления о квартирах
              </p>
            </div>
          </div>
          <button
            id="pwa-install-banner-btn"
            onClick={handleInstallClick}
            className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-rose-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>{isIOS ? 'Как установить на iPhone' : 'Установить приложение'}</span>
          </button>
        </div>
      ) : variant === 'full' ? (
        <button
          id="pwa-install-full-btn"
          onClick={handleInstallClick}
          className={`flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isIOS ? 'Установить на iPhone' : 'Установить приложение (PWA)'}</span>
        </button>
      ) : (
        <button
          id="pwa-install-compact-btn"
          onClick={handleInstallClick}
          title="Установить Rentch как приложение на экран смартфона или ПК"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-colors ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">PWA Приложение</span>
        </button>
      )}

      {/* iOS & Browser Fallback Guide Modal - strictly centered */}
      {showIOSGuide && (
        <div 
          onClick={() => setShowIOSGuide(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm sm:max-w-md my-auto rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-stone-200 text-stone-900 max-h-[88dvh] overflow-y-auto overscroll-contain"
          >
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-none">Установка Rentch PWA</h3>
                  <span className="text-[11px] text-stone-500">Приложение на экране смартфона</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-600 mt-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-100">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </div>
                <div>
                  <p className="font-semibold text-stone-800">
                    {isIOS ? 'Нажмите «Поделиться» в Safari' : 'Откройте меню браузера'}
                  </p>
                  <p className="text-stone-500 text-[11px] mt-0.5 flex items-center gap-1">
                    {isIOS ? (
                      <>
                        Иконка <Share className="w-3.5 h-3.5 inline text-blue-500" /> на нижней панели Safari
                      </>
                    ) : (
                      'Три точки ⋮ в верхнем углу Chrome / Яндекс'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-100">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </div>
                <div>
                  <p className="font-semibold text-stone-800">Выберите «На экран “Домой”»</p>
                  <p className="text-stone-500 text-[11px] mt-0.5 flex items-center gap-1">
                    Либо пункт <PlusSquare className="w-3.5 h-3.5 inline text-stone-700" /> «Установить приложение»
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </div>
                <div>
                  <p className="font-semibold text-emerald-900">Готово! Иконка появится на экране</p>
                  <p className="text-emerald-700 text-[11px] mt-0.5">
                    Rentch откроется в полноэкранном режиме как нативное приложение без адресной строки.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-2xl bg-stone-900 hover:bg-black py-3 text-xs font-bold text-white transition shadow-sm cursor-pointer"
            >
              Всё понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
};
