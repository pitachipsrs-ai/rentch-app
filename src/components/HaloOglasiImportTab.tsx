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
} from 'lucide-react';
import { Apartment } from '../types';
import { DEFAULT_AGENT_PHONE } from '../utils/myhomeParser';
import { parseHaloOglasiBatch, DEFAULT_HALO_OGLASI_URL } from '../utils/haloOglasiParser';
import { RentchWatermarkOverlay } from './RentchWatermarkOverlay';

interface HaloOglasiImportTabProps {
  onAddApartment: (apartment: Apartment) => void;
  onRefreshCatalog?: () => void;
  onSuccessSwitchToCatalog?: () => void;
}

export const HaloOglasiImportTab: React.FC<HaloOglasiImportTabProps> = ({
  onAddApartment,
  onRefreshCatalog,
  onSuccessSwitchToCatalog,
}) => {
  const [importMode, setImportMode] = useState<'quick_seed' | 'by_url' | 'paste_html'>('quick_seed');

  // Deep parse configuration
  const [parseDepthLimit, setParseDepthLimit] = useState<number>(20);
  const [startPage, setStartPage] = useState<number>(1);
  const [pagesScannedCount, setPagesScannedCount] = useState<number | null>(null);

  // URL / ID state
  const [urlInput, setUrlInput] = useState(DEFAULT_HALO_OGLASI_URL);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Quick Seed state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessCount, setSeedSuccessCount] = useState<number | null>(null);
  const [seedTotalCount, setSeedTotalCount] = useState<number | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  // Paste HTML / JSON state
  const [pastedText, setPastedText] = useState('');
  const [parsedApartment, setParsedApartment] = useState<Apartment | null>(null);
  const [parsedBatch, setParsedBatch] = useState<Apartment[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // 1-Click Deep Parse of Belgrade Owner Apartments from HaloOglasi
  const handleQuickSeedBelgrade = async () => {
    setIsSeeding(true);
    setSeedSuccessCount(null);
    setPagesScannedCount(null);
    setSeedError(null);
    try {
      const res = await fetch('/api/apartments/seed-halooglasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: parseDepthLimit,
          startPage,
          url: DEFAULT_HALO_OGLASI_URL,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Не удалось загрузить объявления с HaloOglasi');
      }
      if (Array.isArray(data.apartments)) {
        setSeedSuccessCount(
          data.count || (data.newApartments ? data.newApartments.length : data.apartments.length)
        );
        setSeedTotalCount(data.total || data.apartments.length);
        if (typeof data.pagesScanned === 'number') {
          setPagesScannedCount(data.pagesScanned);
        }
        if (Array.isArray(data.newApartments) && data.newApartments.length > 0) {
          setParsedBatch(data.newApartments);
          setParsedApartment(data.newApartments[0]);
        }
        if (onRefreshCatalog) {
          onRefreshCatalog();
        } else {
          const items = data.newApartments || data.apartments;
          items.forEach((apt: Apartment) => onAddApartment(apt));
        }
      }
    } catch (err: any) {
      console.error('Failed to seed Belgrade apartments:', err);
      setSeedError(err?.message || 'Ошибка при обращении к серверу парсинга HaloOglasi');
    } finally {
      setIsSeeding(false);
    }
  };

  // Direct Live URL/ID Import from HaloOglasi
  const handleFetchByUrl = async () => {
    setUrlError(null);
    setIsSavedSuccess(false);
    setPagesScannedCount(null);
    const trimmed = urlInput.trim();

    if (!trimmed) {
      setUrlError('Введите ссылку на объявление или каталог HaloOglasi.com либо ID объявления');
      return;
    }

    try {
      setIsLoadingUrl(true);
      const res = await fetch('/api/import/halooglasi-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, limit: parseDepthLimit, startPage }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Не удалось получить данные с HaloOglasi');
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
      setUrlError(err.message || 'Ошибка загрузки страницы HaloOglasi.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Parse pasted HTML or JSON from HaloOglasi
  const handleParsePasted = () => {
    setParseError(null);
    setIsSavedSuccess(false);

    if (!pastedText.trim()) {
      setParseError('Вставьте исходный HTML-код страницы HaloOglasi или JSON в поле ниже.');
      return;
    }

    try {
      setIsProcessing(true);
      const batch = parseHaloOglasiBatch(pastedText, DEFAULT_AGENT_PHONE);
      if (batch.length === 0) {
        throw new Error('В переданном тексте не найдено объектов HaloOglasi.');
      }
      setParsedBatch(batch);
      setParsedApartment(batch[0]);
    } catch (err: any) {
      setParseError(err.message || 'Ошибка распознавания данных HaloOglasi.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save parsed items to Rentch database
  const handleSaveToRentch = async () => {
    const toSave =
      parsedBatch.length > 0 ? parsedBatch : parsedApartment ? [parsedApartment] : [];
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
      console.error('Error saving Belgrade batch:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-stone-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold mb-3 border border-sky-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>🇷🇸 Прямой парсинг Белграда с HaloOglasi.com (От собственников)</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Импорт квартир в Белграде (HaloOglasi.com)
          </h2>
          <p className="text-stone-300 text-sm mt-1 max-w-2xl">
            Автоматический парсинг объявлений от собственников (<code>oglasivac_nekretnine_id_l=387237</code>) по Белграду: извлекаются все фотографии высокого разрешения, цена в евро (€), площадь, этажность, точные GPS-координаты дома, а описание и удобства автоматически переводятся с сербского на русский язык.
          </p>

          {/* User's Agent Phone + Direct Link Banner */}
          <div className="mt-4 p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">
                  Контактный номер на всех карточках Белграда: {DEFAULT_AGENT_PHONE}
                </span>
                <span className="text-stone-300 text-[11px]">
                  Все загруженные квартиры автоматически попадают в раздел «🇷🇸 Белград» со свайпами и на карту Белграда.
                </span>
              </div>
            </div>

            <a
              href={DEFAULT_HALO_OGLASI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition text-xs shrink-0 cursor-pointer"
              title="Открыть каталог собственников в Белграде на HaloOglasi.com"
            >
              <span>Каталог HaloOglasi (Vlasnik)</span>
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
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Авто-парсинг каталога собственников (Белград)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setImportMode('by_url');
                setParseError(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                importMode === 'by_url'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🔗 По ссылке или ID HaloOglasi</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setImportMode('paste_html');
                setUrlError(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                importMode === 'paste_html'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>📋 Вставить код страницы / JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: QUICK SEED BELGRADE OWNERS */}
      {importMode === 'quick_seed' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 text-[11px] font-bold border border-sky-200">
                <span>Фильтр: Izdavanje stanova Beograd • Vlasnik (ID 387237)</span>
              </div>
              <h3 className="text-lg font-black text-stone-900">
                Парсинг свежих квартир от собственников в Белграде
              </h3>
              <p className="text-xs text-stone-500 max-w-2xl">
                Сервер обходит защиту Cloudflare, загружает список объявлений со страницы{' '}
                <code className="text-stone-700 font-mono">
                  halooglasi.com/nekretnine/izdavanje-stanova/beograd?oglasivac_nekretnine_id_l=387237
                </code>{' '}
                и заходит внутрь каждой карточки, чтобы забрать полную галерею фото и точные GPS-координаты на карте Белграда.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Сколько квартир спарсить за раз:
              </label>
              <div className="flex flex-wrap gap-2">
                {[20, 40, 60, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setParseDepthLimit(num)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      parseDepthLimit === num
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {num} квартир
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Начать со страницы каталога HaloOglasi:
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setStartPage(pg)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      startPage === pg
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleQuickSeedBelgrade}
              disabled={isSeeding}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm shadow-lg flex items-center gap-2.5 transition cursor-pointer"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Парсим квартиры Белграда с HaloOglasi...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>🇷🇸 Запустить парсинг Белграда ({parseDepthLimit} объектов, стр. {startPage})</span>
                </>
              )}
            </button>
          </div>

          {seedError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{seedError}</span>
            </div>
          )}

          {seedSuccessCount !== null && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-extrabold text-sm">
                    Успешно спарсено и добавлено {seedSuccessCount} квартир в Белграде!
                  </div>
                  <div className="text-emerald-700 text-[11px] mt-0.5">
                    Просканировано страниц: {pagesScannedCount ?? 1} • Всего объектов в базе Rentch: {seedTotalCount} шт. Переключите город на «🇷🇸 Белград» в верхней панели, чтобы смотреть карточки!
                  </div>
                </div>
              </div>
              {onSuccessSwitchToCatalog && (
                <button
                  type="button"
                  onClick={onSuccessSwitchToCatalog}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                >
                  Перейти в каталог ({seedTotalCount})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: IMPORT BY URL OR ID */}
      {importMode === 'by_url' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-black text-stone-900">
              Импорт по прямой ссылке на HaloOglasi.com или ID объявления
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Поддерживаются ссылки на конкретную квартиру (например,{' '}
              <code>https://www.halooglasi.com/nekretnine/izdavanje-stanova/.../5425647732304</code>), ID объявления или ссылка на любую выборку фильтра по Белграду.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://www.halooglasi.com/nekretnine/izdavanje-stanova/beograd?oglasivac_nekretnine_id_l=387237"
              className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="button"
              onClick={handleFetchByUrl}
              disabled={isLoadingUrl}
              className="px-6 py-3 rounded-2xl bg-stone-900 hover:bg-black disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isLoadingUrl ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Загружаем с HaloOglasi...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Спарсить по ссылке</span>
                </>
              )}
            </button>
          </div>

          {urlError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{urlError}</span>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: PASTE HTML / JSON */}
      {importMode === 'paste_html' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-black text-stone-900">
              Ручная вставка исходного кода страницы (View Source / Ctrl+U) с HaloOglasi
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Если вы открыли страницу HaloOglasi в своём браузере, нажмите <code>Ctrl+U</code> (просмотр кода страницы), скопируйте весь текст (<code>Ctrl+A</code> → <code>Ctrl+C</code>) и вставьте ниже: парсер автоматически извлечёт <code>QuidditaEnvironment.serverListData</code> или <code>CurrentClassified</code>.
            </p>
          </div>

          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={6}
            placeholder="Вставьте сюда HTML-код страницы HaloOglasi или JSON..."
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          {parseError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleParsePasted}
            disabled={isProcessing}
            className="px-6 py-3 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Распознать объекты Белграда</span>
          </button>
        </div>
      )}

      {/* PREVIEW OF PARSED BELGRADE APARTMENTS */}
      {parsedBatch.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">
                🇷🇸 Белград • Готово к публикации: {parsedBatch.length} шт.
              </span>
              <h3 className="text-lg font-black text-stone-900 mt-1.5">
                Распознанные квартиры с HaloOglasi.com
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setParsedBatch([]);
                  setParsedApartment(null);
                }}
                className="px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToRentch}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSavedSuccess
                    ? 'Сохранено в каталог Белграда!'
                    : `Опубликовать в Белград (${parsedBatch.length} шт.)`}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-1">
            {parsedBatch.map((apt) => (
              <div
                key={apt.id}
                className="border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 bg-stone-900">
                    <img
                      src={apt.images[0]}
                      alt={apt.title}
                      className="w-full h-full object-cover"
                    />
                    <RentchWatermarkOverlay size="sm" maskMyHome={false} opacity={0.55} />
                    <span className="absolute top-2 left-2 bg-stone-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      🇷🇸 {apt.district}
                    </span>
                    <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      {apt.images.length} фото
                    </span>
                    <div className="absolute bottom-2 left-2 bg-emerald-600 text-white text-xs font-black px-2.5 py-0.5 rounded-lg shadow">
                      €{apt.originalPrice || apt.priceUsd} / мес
                    </div>
                  </div>

                  <div className="p-3.5 space-y-1.5">
                    <h4 className="font-bold text-xs text-stone-900 line-clamp-1">{apt.title}</h4>
                    <p className="text-[11px] text-stone-500 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{apt.address}</span>
                    </p>
                    <div className="text-[11px] text-stone-600 font-medium">
                      {apt.rooms} комн. • {apt.areaSqm} м² • этаж {apt.floor}/{apt.totalFloors}
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-2 leading-snug">
                      {apt.description}
                    </p>
                  </div>
                </div>

                {apt.sourceUrl && (
                  <div className="px-3.5 py-2 border-t border-stone-200/80 bg-white flex items-center justify-between text-[10px]">
                    <span className="text-stone-400 font-mono">{apt.id}</span>
                    <a
                      href={apt.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-sky-600 hover:underline flex items-center gap-1"
                    >
                      <span>Оригинал HaloOglasi</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
