import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  X, 
  CheckCircle2, 
  Plus, 
  Sparkles, 
  DollarSign, 
  MapPin, 
  Phone, 
  User, 
  Check,
  ImageIcon,
  LogOut
} from 'lucide-react';
import { Apartment, TbilisiDistrict, FurnitureStatus, LeasePeriod, Currency, Landlord } from '../types';
import { TBILISI_DISTRICTS } from '../data/mockApartments';
import { DISTRICT_COORDS } from '../utils/districtUtils';
import { readFileAsDataUrl } from '../utils/imageUtils';
import { LandlordAuthData } from './AuthModal';

interface LandlordRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddApartment: (apartment: Apartment) => void;
  onLogout?: () => void;
  landlordProfile?: LandlordAuthData | null;
  inline?: boolean;
}

const COMMON_AMENITIES = [
  'Быстрый Wi-Fi',
  'Кондиционер',
  'Балкон / Терраса',
  'Стиральная машина',
  'Посудомоечная машина',
  'Центральное отопление',
  'Лифт в доме',
  'Парковочное место',
  'Духовой шкаф',
  'Ванна',
  'Панорамный вид',
  'Тихий зеленый двор',
  'Рабочее место / Стол',
  'Гардеробная',
  'Холодильник No-Frost',
  'Микроволновка'
];

export const LandlordRegistrationModal: React.FC<LandlordRegistrationModalProps> = ({
  isOpen,
  onClose,
  onAddApartment,
  onLogout,
  landlordProfile,
  inline = false,
}) => {
  // Landlord profile state
  const [landlordName, setLandlordName] = useState(() => {
    if (landlordProfile?.name) return landlordProfile.name;
    try {
      const saved = localStorage.getItem('rentch_landlord_profile');
      if (saved) return JSON.parse(saved).name || '';
    } catch (e) {}
    return '';
  });
  const [landlordPhone, setLandlordPhone] = useState(() => {
    if (landlordProfile?.phone) return landlordProfile.phone;
    try {
      const saved = localStorage.getItem('rentch_landlord_profile');
      if (saved) return JSON.parse(saved).phone || '';
    } catch (e) {}
    return '';
  });
  const [landlordTelegram, setLandlordTelegram] = useState(() => {
    if (landlordProfile?.telegram) return landlordProfile.telegram;
    try {
      const saved = localStorage.getItem('rentch_landlord_profile');
      if (saved) return JSON.parse(saved).telegram || '';
    } catch (e) {}
    return '';
  });

  useEffect(() => {
    if (landlordProfile?.name) setLandlordName(landlordProfile.name);
    if (landlordProfile?.phone) setLandlordPhone(landlordProfile.phone);
    if (landlordProfile?.telegram !== undefined) setLandlordTelegram(landlordProfile.telegram || '');
  }, [landlordProfile]);

  // Apartment parameters
  const [title, setTitle] = useState('');
  const [district, setDistrict] = useState<TbilisiDistrict>('Ваке (Vake)');
  const [address, setAddress] = useState('');
  const [metro, setMetro] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [priceAmount, setPriceAmount] = useState<number | ''>(650);
  const [rooms, setRooms] = useState<number>(2);
  const [bedrooms, setBedrooms] = useState<number>(1);
  const [areaSqm, setAreaSqm] = useState<number | ''>(55);
  const [floor, setFloor] = useState<number>(4);
  const [totalFloors, setTotalFloors] = useState<number>(9);
  const [furniture, setFurniture] = useState<FurnitureStatus>('full');
  const [minPeriod, setMinPeriod] = useState<LeasePeriod>('month_to_year');
  const [maxResidents, setMaxResidents] = useState<number>(3);
  const [description, setDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Быстрый Wi-Fi',
    'Кондиционер',
    'Стиральная машина',
    'Балкон / Терраса',
    'Центральное отопление',
    'Лифт в доме'
  ]);

  // Images state
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdApartment, setCreatedApartment] = useState<Apartment | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingImages(true);
    setFormError('');
    try {
      const newImgs: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const base64 = await readFileAsDataUrl(file);
          newImgs.push(base64);
        }
      }
      setImages((prev) => [...prev, ...newImgs]);
    } catch (err) {
      setFormError('Ошибка при чтении файлов изображений');
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleAddUrlImage = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      setFormError('Укажите корректный URL изображения (начинается с https://)');
      return;
    }
    setImages((prev) => [...prev, trimmed]);
    setUrlInput('');
    setFormError('');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleResetFormForAnother = () => {
    setTitle('');
    setAddress('');
    setMetro('');
    setDescription('');
    setImages([]);
    setCreatedApartment(null);
    setIsSuccess(false);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!landlordName.trim()) {
      setFormError('Укажите ваше имя');
      return;
    }
    if (!landlordPhone.trim() || landlordPhone.trim() === '+995') {
      setFormError('Укажите контактный номер телефона');
      return;
    }
    if (!title.trim()) {
      setFormError('Укажите название квартиры');
      return;
    }
    if (!address.trim()) {
      setFormError('Укажите адрес квартиры в Тбилиси');
      return;
    }
    if (!priceAmount || Number(priceAmount) <= 0) {
      setFormError('Укажите корректную стоимость аренды');
      return;
    }
    if (images.length === 0) {
      setFormError('Добавьте хотя бы 1 фотографию квартиры');
      return;
    }

    try {
      localStorage.setItem(
        'rentch_landlord_profile',
        JSON.stringify({
          name: landlordName.trim(),
          phone: landlordPhone.trim(),
          telegram: landlordTelegram.trim(),
        })
      );
    } catch (e) {}

    const usdPrice = currency === 'USD' ? Number(priceAmount) : Math.round(Number(priceAmount) / 2.72);
    const gelPrice = currency === 'GEL' ? Number(priceAmount) : Math.round(Number(priceAmount) * 2.72);

    const coords = DISTRICT_COORDS[district] || { lat: 41.7151, lng: 44.8271 };
    const jitterLat = coords.lat + (Math.random() - 0.5) * 0.006;
    const jitterLng = coords.lng + (Math.random() - 0.5) * 0.006;

    const ownerObj: Landlord = {
      id: `landlord-owner-${Date.now()}`,
      name: landlordName.trim(),
      phone: landlordPhone.trim(),
      avatar: images[0],
      verified: true,
      responseTime: 'В течение 10 минут',
      rating: 5.0,
    };

    const newApartment: Apartment = {
      id: `landlord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      priceUsd: usdPrice,
      priceGel: gelPrice,
      currency,
      district,
      address: address.trim(),
      metro: metro.trim() || undefined,
      rooms,
      bedrooms,
      areaSqm: Number(areaSqm) || 50,
      floor,
      totalFloors,
      furniture,
      petPolicy: 'allowed',
      minPeriod,
      maxResidents,
      description: description.trim() || `Уютная квартира в районе ${district}, Тбилиси. Полностью готова к комфортному проживанию.`,
      images,
      amenities: selectedAmenities,
      lat: jitterLat,
      lng: jitterLng,
      landlord: ownerObj,
      isNew: true,
    };

    onAddApartment(newApartment);
    setCreatedApartment(newApartment);
    setIsSuccess(true);
  };

  const cardContent = (
    <div 
      id="landlord-section-card"
      className={`w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200 flex flex-col ${
        inline ? 'my-2 sm:my-4' : 'my-auto max-h-[92dvh]'
      }`}
    >
      {/* Header — strictly for placing an apartment */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 p-5 sm:p-6 text-white relative shrink-0">
        {!inline ? (
          <button
            type="button"
            id="close-landlord-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          onLogout && (
            <button
              type="button"
              id="logout-landlord-section-btn"
              onClick={onLogout}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Выйти</span>
            </button>
          )
        )}

        <div className="flex items-center gap-2 mb-1.5">
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            <span>Раздел арендодателя</span>
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight pr-20">
          Разместить квартиру в Rentch
        </h2>
        <p className="text-xs text-stone-300 mt-1">
          Заполните анкету вашего объекта и добавьте фотографии, чтобы разместить квартиру в сервисе
        </p>
      </div>

      {/* Body Content — ONLY Apartment Placement Form */}
      <div className={`${inline ? '' : 'flex-1 overflow-y-auto overscroll-contain'} p-4 sm:p-6 bg-stone-50`}>
        {isSuccess && createdApartment ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 text-center space-y-5 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-stone-900">
                Ваша квартира успешно размещена в сервисе!
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                Объект <strong className="text-stone-800">«{createdApartment.title}»</strong> добавлен в каталог Rentch и сразу доступен арендаторам.
              </p>
            </div>

            {/* Preview of created card */}
            <div className="max-w-md mx-auto bg-stone-50 rounded-2xl p-3.5 border border-stone-200 flex items-center gap-3.5 text-left">
              <img
                src={createdApartment.images[0]}
                alt={createdApartment.title}
                className="w-20 h-20 rounded-xl object-cover shrink-0 border border-stone-200"
              />
              <div className="min-w-0 flex-1">
                <span className="inline-block text-[10px] font-bold uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                  {createdApartment.district}
                </span>
                <h4 className="font-bold text-sm text-stone-900 truncate mt-1">
                  {createdApartment.title}
                </h4>
                <p className="text-xs text-stone-500 truncate">{createdApartment.address}</p>
                <div className="text-xs font-black text-stone-900 mt-1">
                  ${createdApartment.priceUsd} / мес • {createdApartment.rooms} комн. • {createdApartment.areaSqm} м²
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-2.5 pt-2">
              <button
                type="button"
                id="landlord-add-another-apt-btn"
                onClick={handleResetFormForAnother}
                className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Разместить ещё одну квартиру</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Выйти из кабинета</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                {formError}
              </div>
            )}

            {/* 1. Контакты арендодателя */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>1. Контактные данные арендодателя</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Ваше имя *
                  </label>
                  <input
                    type="text"
                    required
                    value={landlordName}
                    onChange={(e) => setLandlordName(e.target.value)}
                    placeholder="Введите ваше имя"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Телефон для связи *
                  </label>
                  <input
                    type="tel"
                    required
                    value={landlordPhone}
                    onChange={(e) => setLandlordPhone(e.target.value)}
                    placeholder="Введите номер телефона"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Telegram (по желанию)
                  </label>
                  <input
                    type="text"
                    value={landlordTelegram}
                    onChange={(e) => setLandlordTelegram(e.target.value)}
                    placeholder="@username"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Параметры квартиры */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>2. Параметры квартиры</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Заголовок объявления *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Светлая 2-комнатная квартира с террасой в Ваке"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Район Тбилиси *
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value as TbilisiDistrict)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {TBILISI_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Точный адрес (улица, номер дома) *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="пр. Чавчавадзе, 24"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Валюта и цена / мес *
                  </label>
                  <div className="flex gap-1">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="bg-stone-100 border border-stone-200 rounded-xl px-2 py-2 text-xs font-bold text-stone-800"
                    >
                      <option value="USD">$</option>
                      <option value="GEL">₾</option>
                    </select>
                    <input
                      type="number"
                      required
                      value={priceAmount}
                      onChange={(e) => setPriceAmount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="650"
                      className="w-full min-w-0 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs text-stone-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Комнат
                  </label>
                  <select
                    value={rooms}
                    onChange={(e) => {
                      const r = Number(e.target.value);
                      setRooms(r);
                      setBedrooms(Math.max(1, r - 1));
                    }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                  >
                    <option value={1}>1 комн. (студия)</option>
                    <option value={2}>2 комн.</option>
                    <option value={3}>3 комн.</option>
                    <option value={4}>4+ комн.</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Площадь (м²)
                  </label>
                  <input
                    type="number"
                    value={areaSqm}
                    onChange={(e) => setAreaSqm(e.target.value ? Number(e.target.value) : '')}
                    placeholder="55"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Этаж / Всего
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={floor}
                      onChange={(e) => setFloor(Number(e.target.value) || 1)}
                      className="w-full min-w-0 bg-stone-50 border border-stone-200 rounded-xl px-2 py-2 text-xs text-stone-900 text-center"
                    />
                    <span className="text-stone-400 text-xs">/</span>
                    <input
                      type="number"
                      value={totalFloors}
                      onChange={(e) => setTotalFloors(Number(e.target.value) || 1)}
                      className="w-full min-w-0 bg-stone-50 border border-stone-200 rounded-xl px-2 py-2 text-xs text-stone-900 text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Меблировка
                  </label>
                  <select
                    value={furniture}
                    onChange={(e) => setFurniture(e.target.value as FurnitureStatus)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                  >
                    <option value="full">Полностью с мебелью и техникой</option>
                    <option value="partial">Частично меблирована</option>
                    <option value="none">Без мебели</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Минимальный срок аренды
                  </label>
                  <select
                    value={minPeriod}
                    onChange={(e) => setMinPeriod(e.target.value as LeasePeriod)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                  >
                    <option value="month">От 1 месяца</option>
                    <option value="month_to_year">От 3–6 месяцев</option>
                    <option value="year_plus">Долгосрочно (от 1 года)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Описание квартиры
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Расскажите о ремонте, виде из окон, отоплении, инфраструктуре рядом..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Удобства */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Удобства в квартире
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_AMENITIES.slice(0, 10).map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => handleToggleAmenity(amenity)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-rose-500 text-white shadow-2xs'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{amenity}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Фотографии */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                  <span>3. Фотографии квартиры ({images.length}) *</span>
                </h3>
                <label className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Загрузить с устройства</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Или вставьте ссылку на фото (https://...)"
                  className="flex-1 min-w-0 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl cursor-pointer shrink-0"
                >
                  Добавить
                </button>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-4/3 rounded-xl overflow-hidden border border-stone-200 group bg-stone-900">
                      <img src={img} alt={`Фото ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-stone-900/80 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Обложка
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-lg transition cursor-pointer"
                        title="Удалить фото"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              id="landlord-publish-apartment-btn"
              disabled={isProcessingImages}
              className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold py-3.5 px-5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Разместить квартиру в сервисе Rentch</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );

  if (inline) {
    return cardContent;
  }

  return (
    <div 
      id="landlord-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
    >
      {cardContent}
    </div>
  );
};
