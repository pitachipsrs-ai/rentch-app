import React, { useState } from 'react';
import { 
  Globe, 
  FileCode2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Image as ImageIcon, 
  MapPin, 
  Loader2,
  Trash2,
  ExternalLink,
  Phone,
  Zap,
  HelpCircle
} from 'lucide-react';
import { Apartment } from '../types';
import { parseMyHomeBatch, DEFAULT_AGENT_PHONE } from '../utils/myhomeParser';
import { RentchWatermarkOverlay } from './RentchWatermarkOverlay';

interface MyHomeImportTabProps {
  onAddApartment: (apartment: Apartment) => void;
  onRefreshCatalog?: () => void;
  onSuccessSwitchToCatalog?: () => void;
}

export const MyHomeImportTab: React.FC<MyHomeImportTabProps> = ({
  onAddApartment,
  onRefreshCatalog,
  onSuccessSwitchToCatalog,
}) => {
  const [importMode, setImportMode] = useState<'by_url' | 'quick_seed' | 'paste_json'>('quick_seed');
  
  // Deep parse configuration (up to 200 new apartments)
  const [parseDepthLimit, setParseDepthLimit] = useState<number>(200);
  const [startPage, setStartPage] = useState<number>(1);
  const [pagesScannedCount, setPagesScannedCount] = useState<number | null>(null);

  // URL / ID state
  const [urlInput, setUrlInput] = useState('https://www.myhome.ge/ru/nedvizhimost/arenda/kvartira/tbilisi/?deal_types=2&real_estate_types=1&cities=1&currency_id=1&page=1');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Quick Seed state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessCount, setSeedSuccessCount] = useState<number | null>(null);
  const [seedTotalCount, setSeedTotalCount] = useState<number | null>(null);

  // Paste JSON state
  const [pastedText, setPastedText] = useState('');
  const [parsedApartment, setParsedApartment] = useState<Apartment | null>(null);
  const [parsedBatch, setParsedBatch] = useState<Apartment[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Direct Live URL/ID Import (supports single apartment or deep catalog up to 200 new objects)
  const handleFetchByUrl = async () => {
    setUrlError(null);
    setIsSavedSuccess(false);
    setPagesScannedCount(null);
    const trimmed = urlInput.trim();

    if (!trimmed) {
      setUrlError('Введите ссылку на объявление MyHome, каталог или его номер (ID)');
      return;
    }

    try {
      setIsLoadingUrl(true);
      const res = await fetch('/api/import/myhome-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, limit: parseDepthLimit }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Не удалось получить данные с MyHome');
      }

      if (typeof data.pagesScanned === 'number') {
        setPagesScannedCount(data.pagesScanned);
      }

      if (data.apartments && Array.isArray(data.apartments)) {
        setParsedBatch(data.apartments);
        setParsedApartment(data.apartments[0]);
      } else if (data.apartment) {
        setParsedBatch([data.apartment]);
        setParsedApartment(data.apartment);
      }
    } catch (err: any) {
      setUrlError(err.message || 'Ошибка загрузки страницы.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Quick Seed Handler (Deep-parses up to 200 brand-new MyHome apartments with user's phone)
  const handleQuickSeed = async () => {
    setIsSeeding(true);
    setSeedSuccessCount(null);
    setPagesScannedCount(null);
    try {
      const res = await fetch('/api/apartments/seed-myhome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: parseDepthLimit, startPage }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.apartments)) {
        setSeedSuccessCount(data.count || (data.newApartments ? data.newApartments.length : data.apartments.length));
        setSeedTotalCount(data.total || data.apartments.length);
        if (typeof data.pagesScanned === 'number') {
          setPagesScannedCount(data.pagesScanned);
        }
        if (onRefreshCatalog) {
          onRefreshCatalog();
        } else {
          const items = data.newApartments || data.apartments;
          items.forEach((apt: Apartment) => onAddApartment(apt));
        }
        setTimeout(() => {
          if (onSuccessSwitchToCatalog) {
            onSuccessSwitchToCatalog();
          }
        }, 1800);
      }
    } catch (err) {
      console.error('Failed to seed apartments:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  // Handler for parsing pasted Word/JSON text
  const handleParsePasted = () => {
    setParseError(null);
    setIsSavedSuccess(false);

    if (!pastedText.trim()) {
      setParseError('Пожалуйста, вставьте текст с данными из Word или исходного кода в поле ниже.');
      return;
    }

    try {
      setIsProcessing(true);
      const batch = parseMyHomeBatch(pastedText, DEFAULT_AGENT_PHONE);
      setParsedBatch(batch);
      setParsedApartment(batch[0]);
    } catch (err: any) {
      setParseError(err.message || 'Ошибка распознавания данных. Проверьте правильность скопированного текста.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save parsed items to Rentch database
  const handleSaveToRentch = async () => {
    const toSave = parsedBatch.length > 0 ? parsedBatch : (parsedApartment ? [parsedApartment] : []);
    if (toSave.length === 0) return;

    setIsProcessing(true);
    try {
      await fetch('/api/apartments/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apartments: toSave }),
      });
      if (onRefreshCatalog) {
        onRefreshCatalog();
      } else {
        toSave.forEach((apt) => onAddApartment(apt));
      }
      setIsSavedSuccess(true);

      setTimeout(() => {
        if (onSuccessSwitchToCatalog) {
          onSuccessSwitchToCatalog();
        }
      }, 1400);
    } catch (err) {
      console.error('Error saving batch:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold mb-3 border border-rose-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Прямой импорт с MyHome.ge</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Загрузка настоящих квартир с MyHome</h2>
          <p className="text-stone-300 text-sm mt-1 max-w-xl">
            Вставьте ссылку на любую квартиру или каталог MyHome. Сервис напрямую скачивает настоящие фотографии, параметры, переводит описание на русский язык и привязывает ваш номер телефона.
          </p>

          {/* User's Agent Phone Banner */}
          <div className="mt-4 p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Ваш контактный номер на всех карточках: {DEFAULT_AGENT_PHONE}</span>
                <span className="text-stone-300 text-[11px]">Клиенты звонят и пишут в WhatsApp напрямую вам. Все сторонние телефоны удалены.</span>
              </div>
            </div>

            <a
              href="https://www.myhome.ge/ru/nedvizhimost/arenda/kvartira/tbilisi/?deal_types=2&real_estate_types=1&cities=1&currency_id=1&page=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition text-xs shrink-0 cursor-pointer"
              title="Открыть каталог аренды квартир в Тбилиси"
            >
              <span>Каталог MyHome.ge</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <button
              type="button"
              onClick={() => {
                setImportMode('quick_seed');
                setParseError(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                importMode === 'quick_seed'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Глубокий парсинг (до 200 новых объектов)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setImportMode('by_url');
                setUrlError(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                importMode === 'by_url'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>По ссылке или ID</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setImportMode('paste_json');
                setParseError(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                importMode === 'paste_json'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Вставить код страницы</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: By URL or ID */}
      {importMode === 'by_url' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-rose-500" />
                <span>Загрузка квартиры или каталога (до 200 объектов) по ссылке с MyHome</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Вставьте ссылку на страницу любого объявления (например, <code>...-25919663/</code>), каталог Тбилиси или номер (ID) объявления:
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-stone-600">Глубина каталога:</span>
              <select
                value={parseDepthLimit}
                onChange={(e) => setParseDepthLimit(Number(e.target.value))}
                className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900"
              >
                <option value={50}>до 50 новых</option>
                <option value={100}>до 100 новых</option>
                <option value={150}>до 150 новых</option>
                <option value={200}>до 200 новых</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              id="myhome-url-input"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setUrlError(null);
              }}
              placeholder="https://www.myhome.ge/ru/nedvizhimost/sdaetsia-2-komnatnaia-kvartira-v-saburtalo-25919663/ или 25919663"
              className="flex-1 text-xs px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition text-stone-800"
            />
            <button
              type="button"
              id="fetch-myhome-url-btn"
              disabled={isLoadingUrl || !urlInput.trim()}
              onClick={handleFetchByUrl}
              className="px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isLoadingUrl ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Парсинг до {parseDepthLimit} объектов...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Загрузить с MyHome</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Examples */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-500">
            <span className="font-semibold">Быстрые примеры для проверки:</span>
            <button
              type="button"
              onClick={() => {
                setUrlInput('https://www.myhome.ge/ru/nedvizhimost/arenda/kvartira/tbilisi/?deal_types=2&real_estate_types=1&cities=1&currency_id=1&page=1');
                setUrlError(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition cursor-pointer text-[11px] border border-rose-200"
            >
              Каталог Тбилиси (глубина до {parseDepthLimit} новых квартир)
            </button>
            <button
              type="button"
              onClick={() => {
                setUrlInput('https://www.myhome.ge/ru/nedvizhimost/sdaetsia-2-komnatnaia-kvartira-v-saburtalo-25919663/');
                setUrlError(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition cursor-pointer text-[11px]"
            >
              Квартира в Сабуртало (25919663)
            </button>
          </div>

          {urlError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Ошибка:</p>
                <p className="mt-0.5 leading-relaxed">{urlError}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Quick Seed (Deep Parsing up to 200 new objects) */}
      {importMode === 'quick_seed' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Глубокий многостраничный парсинг каталога MyHome.ge</span>
              </div>
              <h3 className="text-lg font-black text-stone-900">
                Парсинг новых квартир из MyHome глубиной до 200 новых объектов
              </h3>
              <p className="text-xs text-stone-500 max-w-2xl leading-relaxed">
                Сервис автоматически обходит страницы каталога MyHome (до 24 страниц за один проход), пропускает уже добавленные в базу квартиры и загружает до <b>{parseDepthLimit} новых реальных объектов</b> Тбилиси с оригинальными фотографиями, переводом на русский язык и вашим номером <b>{DEFAULT_AGENT_PHONE}</b>.
              </p>
            </div>

            <button
              type="button"
              id="quick-seed-myhome-btn"
              disabled={isSeeding}
              onClick={handleQuickSeed}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs sm:text-sm font-black transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Парсинг до {parseDepthLimit} новых объектов...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Запустить парсинг ({parseDepthLimit} новых квартир)</span>
                </>
              )}
            </button>
          </div>

          {/* Depth & Start Page Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                Глубина парсинга (количество новых объектов)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 150, 200].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setParseDepthLimit(num)}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer border ${
                      parseDepthLimit === num
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {num} шт.
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                Начать со страницы каталога MyHome
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={startPage}
                  onChange={(e) => setStartPage(Math.max(1, Number(e.target.value) || 1))}
                  className="w-28 bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900"
                />
                <span className="text-[11px] text-stone-500">
                  Сканирует до 24 страниц подряд (≈500+ объявлений) для отбора {parseDepthLimit} новых
                </span>
              </div>
            </div>
          </div>

          {seedSuccessCount !== null && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-black block text-sm">
                    Успешно спарсено и добавлено {seedSuccessCount} новых квартир с MyHome!
                  </span>
                  <span className="text-emerald-700 text-[11px]">
                    {pagesScannedCount ? `Просканировано страниц: ${pagesScannedCount} • ` : ''}
                    {seedTotalCount ? `Всего объектов в базе Rentch: ${seedTotalCount} • ` : ''}
                    Контакт на всех карточках: {DEFAULT_AGENT_PHONE}
                  </span>
                </div>
              </div>
              {onSuccessSwitchToCatalog && (
                <button
                  type="button"
                  onClick={onSuccessSwitchToCatalog}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition cursor-pointer text-xs shrink-0"
                >
                  Перейти в каталог →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Paste from Word/HTML */}
      {importMode === 'paste_json' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-rose-500" />
                <span>Вставьте исходный код страницы или текст JSON</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                На странице MyHome нажмите <b>Ctrl+U</b> (исходный код), выделите всё (Ctrl+A), скопируйте и вставьте сюда. Парсер автоматически извлечет все объявления и фото.
              </p>
            </div>
            {pastedText && (
              <button
                type="button"
                onClick={() => {
                  setPastedText('');
                  setParsedApartment(null);
                  setParseError(null);
                }}
                className="text-xs text-stone-400 hover:text-rose-600 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить поле</span>
              </button>
            )}
          </div>

          <div className="relative">
            <textarea
              id="myhome-pasted-json-input"
              rows={8}
              value={pastedText}
              onChange={(e) => {
                setPastedText(e.target.value);
                setParseError(null);
              }}
              placeholder={`Вставьте сюда скопированный код или JSON с MyHome...\nНапример: {"statement":{"id":25953149,"title":"2-комнатная квартира в Сабуртало","price_usd":650,"images":[...]}...}`}
              className="w-full font-mono text-xs p-4 rounded-2xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition resize-y text-stone-800"
            />
            {pastedText.length > 0 && (
              <div className="absolute bottom-3 right-3 text-[11px] text-stone-400 font-mono bg-white/80 px-2 py-0.5 rounded-md border border-stone-200">
                {pastedText.length.toLocaleString()} символов
              </div>
            )}
          </div>

          {parseError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Не удалось разобрать данные:</p>
                <p className="mt-0.5 leading-relaxed">{parseError}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              id="parse-myhome-pasted-btn"
              disabled={isProcessing || !pastedText.trim()}
              onClick={handleParsePasted}
              className="px-6 py-3 rounded-2xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                  <span>Обработка...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <span>Распознать квартиры и фото</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Preview Section if Parsed */}
      {parsedApartment && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {parsedBatch.length > 1
                    ? `Успешно загружено ${parsedBatch.length} реальных объявлений с MyHome!`
                    : 'Настоящая квартира успешно получена с MyHome'}
                </span>
              </div>
              <h3 className="text-xl font-black text-stone-900 mt-2">{parsedApartment.title}</h3>
              <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{parsedApartment.address}</span>
                <span className="text-stone-300">•</span>
                <span className="font-semibold text-stone-700">{parsedApartment.district}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-black text-stone-900">${parsedApartment.priceUsd}</div>
                <div className="text-xs text-stone-400 font-medium">≈ {parsedApartment.priceGel} ₾ / мес</div>
              </div>
            </div>
          </div>

          {/* Batch list summary if multiple */}
          {parsedBatch.length > 1 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span>Список квартир для публикации ({parsedBatch.length}):</span>
                <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Контакт: {DEFAULT_AGENT_PHONE}</span>
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {parsedBatch.map((apt, i) => (
                  <div key={apt.id || i} className="p-2 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between">
                    <span className="truncate max-w-[280px] font-semibold text-stone-800">{i + 1}. {apt.title}</span>
                    <span className="shrink-0 text-stone-600 font-bold ml-2">${apt.priceUsd}/мес • {apt.district}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Комнаты</span>
              <span className="text-sm font-black text-stone-800 mt-0.5 block">{parsedApartment.rooms} комн. ({parsedApartment.bedrooms} спальни)</span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Площадь</span>
              <span className="text-sm font-black text-stone-800 mt-0.5 block">{parsedApartment.areaSqm} м²</span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Этаж</span>
              <span className="text-sm font-black text-stone-800 mt-0.5 block">{parsedApartment.floor} из {parsedApartment.totalFloors}</span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Животные</span>
              <span className="text-sm font-black text-stone-800 mt-0.5 block">
                {parsedApartment.petPolicy !== 'no_pets' ? '🐾 Можно' : '❌ Без питомцев'}
              </span>
            </div>
          </div>

          {/* Real Photos Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                <span>Оригинальные фотографии из объявления ({parsedApartment.images.length})</span>
              </h4>
              <span className="text-xs text-stone-400">Первое фото — обложка в карточке</span>
            </div>

            {parsedApartment.images.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                Фотографии не найдены в объекте
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {parsedApartment.images.map((imgUrl, idx) => (
                  <div key={idx} className="relative aspect-4/3 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 group">
                    <img
                      src={imgUrl}
                      alt={`Фото ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {/* Centered Rentch Watermark + MyHome Masking */}
                    <RentchWatermarkOverlay size="sm" maskMyHome={true} opacity={0.65} />

                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md z-20">
                        ★ Обложка
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description & Amenities */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Описание объекта</h4>
            <p className="text-xs text-stone-600 bg-stone-50 p-4 rounded-2xl border border-stone-200 leading-relaxed whitespace-pre-line">
              {parsedApartment.description}
            </p>

            {parsedApartment.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {parsedApartment.amenities.map((amenity, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200"
                  >
                    ✓ {amenity}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setParsedApartment(null);
                setParsedBatch([]);
                setIsSavedSuccess(false);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl text-xs font-semibold text-stone-500 hover:text-stone-800 transition cursor-pointer"
            >
              Очистить
            </button>

            <button
              type="button"
              id="confirm-save-myhome-apt-btn"
              disabled={isSavedSuccess}
              onClick={handleSaveToRentch}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                isSavedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white'
              }`}
            >
              {isSavedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>
                    {parsedBatch.length > 1
                      ? `Все ${parsedBatch.length} квартир опубликованы в каталоге!`
                      : 'Квартира добавлена в каталог!'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {parsedBatch.length > 1
                      ? `Опубликовать в Rentch все ${parsedBatch.length} квартир (${DEFAULT_AGENT_PHONE})`
                      : `Опубликовать квартиру в Rentch (${DEFAULT_AGENT_PHONE})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
