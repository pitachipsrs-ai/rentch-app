import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import {
  Heart,
  X,
  RotateCcw,
  Star,
  Send,
  Users,
  MapPin,
  ArrowUp,
  Plus,
  CheckCircle2,
  SlidersHorizontal,
  MessageCircle,
  Upload,
  BellRing,
  UserCheck,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { Apartment, RentchCity, RoommateOffer, UserProfile } from '../types';
import {
  CITIES_CONFIG,
  formatDistrictDisplay,
  getAccurateApartmentDistrict,
  getApartmentCity,
} from '../utils/districtUtils';
import { getTelegramUser } from '../utils/telegram';

interface RoommateFinderSectionProps {
  apartments: Apartment[];
  matchedApartments: Apartment[];
  activeCity: RentchCity;
  userProfile: UserProfile;
  focusedApartmentId?: string | null;
  onSelectFocusedApartment?: (apartmentId: string | null) => void;
  onSwitchToStandardSwipe: () => void;
  onOpenApartmentDetails: (apartment: Apartment) => void;
  onMatchWithRoommate: (apartment: Apartment, candidate: RoommateOffer) => void;
  onRoommateSwipedRight?: (
    apartment: Apartment,
    candidate: RoommateOffer,
    contactOverride?: { name: string; phone: string; telegramUsername?: string }
  ) => void;
  onPublishRoommateOffer?: (apartment: Apartment, offer: RoommateOffer) => void;
  onLikeApartmentIfNeeded: (apartment: Apartment) => void;
}

const DEFAULT_CANDIDATE_PROFILES: Array<{
  userName: string;
  userAge: number;
  userAvatar: string;
  secondAvatar: string;
  partnerName: string;
  partnerAge: number;
  occupation: string;
  bubbleText: string;
  interests: string[];
  moveInDate: string;
  telegram: string;
}> = [
  {
    userName: 'Тако',
    userAge: 23,
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85',
    secondAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85',
    partnerName: 'Нини',
    partnerAge: 24,
    occupation: 'UX/UI дизайнер · Удалёнка',
    bubbleText:
      'Мы за Настольные игры, Кофе, Уютные вечера и Чистоту. Тоже выбрала эту квартиру — давай снимем пополам!',
    interests: ['Настольные игры', 'Кофе', 'Удалёнка', 'Без вредных привычек'],
    moveInDate: 'Готова к просмотру завтра',
    telegram: '@tako_design',
  },
  {
    userName: 'Алексей',
    userAge: 26,
    userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=900&q=85',
    secondAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85',
    partnerName: 'Давид',
    partnerAge: 27,
    occupation: 'Frontend-разработчик',
    bubbleText:
      'Выбрал эту квартиру! Ищу адекватного соседа 50/50 — работаю удалённо, ценю тишину, чистоту и порядок.',
    interests: ['IT / Удалёнка', 'Спортзал', 'Кофе', 'Раздельный бюджет 50/50'],
    moveInDate: 'Готов заехать с 1 числа',
    telegram: '@alex_dev_rent',
  },
  {
    userName: 'Мария',
    userAge: 25,
    userAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85',
    secondAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=85',
    partnerName: 'Елена',
    partnerAge: 24,
    occupation: 'Маркетолог в международном проекте',
    bubbleText:
      'Мы за Кофе, Киновечера, Прогулки и Уважение личных границ. Квартира супер, давай делить аренду 50/50!',
    interests: ['Киновечера', 'Чистоплотность', 'Йога', 'Без вечеринок'],
    moveInDate: 'В ближайшие 3–5 дней',
    telegram: '@maria_roommate',
  },
  {
    userName: 'Лука',
    userAge: 28,
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85',
    secondAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&q=85',
    partnerName: 'Марко',
    partnerAge: 27,
    occupation: 'Архитектор · 3D визуализатор',
    bubbleText:
      'Понравилась именно эта квартира! Спокойный график, готов сразу поехать на совместный осмотр с администратором.',
    interests: ['Архитектура', 'Настольные игры', 'Кулинария', 'Пунктуальность'],
    moveInDate: 'Готов к осмотру сегодня',
    telegram: '@luka_arch',
  },
  {
    userName: 'София',
    userAge: 22,
    userAvatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=85',
    secondAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85',
    partnerName: 'Анна',
    partnerAge: 23,
    occupation: 'Фотограф и контент-креатор',
    bubbleText:
      'Мы за Эстетику, Утренний фильтр-кофе, Настолки и Дружелюбную атмосферу дома. Снимем эту квартиру вместе!',
    interests: ['Фотография', 'Кофе', 'Настольные игры', 'Уют'],
    moveInDate: 'На этой неделе',
    telegram: '@sofia_photo',
  },
];

const INTEREST_PRESETS = [
  'Настольные игры',
  'Кофе',
  'Удалёнка / IT',
  'Чистоплотность',
  'Без вечеринок',
  'Киновечера',
  'Спорт',
  'Уважение границ',
];

export const RoommateFinderSection: React.FC<RoommateFinderSectionProps> = ({
  apartments,
  matchedApartments,
  activeCity,
  userProfile,
  focusedApartmentId,
  onSelectFocusedApartment,
  onSwitchToStandardSwipe,
  onOpenApartmentDetails,
  onMatchWithRoommate,
  onRoommateSwipedRight,
  onPublishRoommateOffer,
  onLikeApartmentIfNeeded,
}) => {
  const cityInfo = CITIES_CONFIG[activeCity] || CITIES_CONFIG.tbilisi;

  const cityMatchedApartments = useMemo(
    () => matchedApartments.filter((a) => getApartmentCity(a) === activeCity),
    [matchedApartments, activeCity]
  );

  const [scopeFilter, setScopeFilter] = useState<'my_chosen' | 'all_city'>(() =>
    cityMatchedApartments.length > 0 || focusedApartmentId ? 'my_chosen' : 'all_city'
  );

  useEffect(() => {
    if (focusedApartmentId) {
      setScopeFilter('my_chosen');
    }
  }, [focusedApartmentId]);

  // Default split layout:
  // 'person_left_apt_right' = Left 50%: Фото человека, который выбрал эту квартиру | Right 50%: Фото самой квартиры!
  // 'two_roommates' = Left 50%: Человек 1 | Right 50%: Человек 2
  const [splitLayout, setSplitLayout] = useState<'person_left_apt_right' | 'two_roommates'>(
    'person_left_apt_right'
  );

  const [customOffers, setCustomOffers] = useState<RoommateOffer[]>(() => {
    try {
      const saved = localStorage.getItem('rentch_roommate_offers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    fetch('/api/roommates')
      .then((r) => (r.ok ? r.json() : null))
      .then((serverOffers: RoommateOffer[] | null) => {
        if (Array.isArray(serverOffers) && serverOffers.length > 0) {
          setCustomOffers((prev) => {
            const map = new Map<string, RoommateOffer>();
            serverOffers.forEach((o) => o && o.id && map.set(o.id, o));
            prev.forEach((o) => o && o.id && !map.has(o.id) && map.set(o.id, o));
            const merged = Array.from(map.values());
            try {
              localStorage.setItem('rentch_roommate_offers', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  const cityApartments = useMemo(() => {
    const inCity = apartments.filter((a) => getApartmentCity(a) === activeCity);
    const multiRoom = inCity.filter((a) => (a.rooms || 1) >= 2);
    return multiRoom.length > 0 ? multiRoom : inCity;
  }, [apartments, activeCity]);

  const targetApartments = useMemo(() => {
    if (focusedApartmentId) {
      const found = apartments.find((a) => a.id === focusedApartmentId);
      if (found) return [found];
    }
    if (scopeFilter === 'my_chosen' && cityMatchedApartments.length > 0) {
      return cityMatchedApartments;
    }
    const map = new Map<string, Apartment>();
    cityMatchedApartments.forEach((a) => map.set(a.id, a));
    cityApartments.slice(0, 25).forEach((a) => {
      if (!map.has(a.id)) map.set(a.id, a);
    });
    return Array.from(map.values());
  }, [focusedApartmentId, scopeFilter, cityMatchedApartments, cityApartments, apartments]);

  const deckItems = useMemo(() => {
    const items: Array<{ apartment: Apartment; offer: RoommateOffer }> = [];

    for (const offer of customOffers) {
      const apt = targetApartments.find((a) => a.id === offer.apartmentId);
      if (apt) {
        items.push({ apartment: apt, offer });
      }
    }

    targetApartments.forEach((apt, idx) => {
      const profileA = DEFAULT_CANDIDATE_PROFILES[idx % DEFAULT_CANDIDATE_PROFILES.length];
      items.push({
        apartment: apt,
        offer: {
          id: `rm-${apt.id}-a`,
          apartmentId: apt.id,
          city: activeCity,
          userName: profileA.userName,
          userAge: profileA.userAge,
          userAvatar: profileA.userAvatar,
          secondAvatar: profileA.secondAvatar,
          partnerName: profileA.partnerName,
          partnerAge: profileA.partnerAge,
          occupation: profileA.occupation,
          bubbleText: profileA.bubbleText,
          interests: profileA.interests,
          moveInDate: profileA.moveInDate,
          verified: true,
          createdAt: 'Сегодня',
          telegram: profileA.telegram,
        },
      });

      if (targetApartments.length <= 3) {
        const profileB = DEFAULT_CANDIDATE_PROFILES[(idx + 1) % DEFAULT_CANDIDATE_PROFILES.length];
        items.push({
          apartment: apt,
          offer: {
            id: `rm-${apt.id}-b`,
            apartmentId: apt.id,
            city: activeCity,
            userName: profileB.userName,
            userAge: profileB.userAge,
            userAvatar: profileB.userAvatar,
            secondAvatar: profileB.secondAvatar,
            partnerName: profileB.partnerName,
            partnerAge: profileB.partnerAge,
            occupation: profileB.occupation,
            bubbleText: profileB.bubbleText,
            interests: profileB.interests,
            moveInDate: profileB.moveInDate,
            verified: true,
            createdAt: 'Сегодня',
            telegram: profileB.telegram,
          },
        });
      }
    });

    return items;
  }, [targetApartments, customOffers, activeCity]);

  const [dismissedOfferIds, setDismissedOfferIds] = useState<string[]>([]);
  const [matchedOfferIds, setMatchedOfferIds] = useState<string[]>([]);
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  const [aptPhotoIdx, setAptPhotoIdx] = useState(0);
  const [celebrationMatch, setCelebrationMatch] = useState<{
    apartment: Apartment;
    offer: RoommateOffer;
  } | null>(null);
  const [rmContactName, setRmContactName] = useState(userProfile.name || '');
  const [rmContactPhone, setRmContactPhone] = useState(userProfile.phone || '');
  const [rmContactTelegram, setRmContactTelegram] = useState(userProfile.telegramUsername || '');
  const [rmContactError, setRmContactError] = useState('');

  useEffect(() => {
    if (userProfile.name) setRmContactName(userProfile.name);
    if (userProfile.phone) setRmContactPhone(userProfile.phone);
    if (userProfile.telegramUsername) setRmContactTelegram(userProfile.telegramUsername);
  }, [userProfile.name, userProfile.phone, userProfile.telegramUsername]);

  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);
  const [selectedAptIdForOffer, setSelectedAptIdForOffer] = useState<string>(
    focusedApartmentId || cityMatchedApartments[0]?.id || cityApartments[0]?.id || ''
  );
  const [myOfferName, setMyOfferName] = useState(userProfile.name || '');
  const [myOfferAge, setMyOfferAge] = useState('');
  const [myOfferOccupation, setMyOfferOccupation] = useState('');
  const [myOfferTelegram, setMyOfferTelegram] = useState(() => {
    const tgUser = getTelegramUser();
    if (tgUser?.username) return `@${tgUser.username}`;
    return userProfile.telegramUsername || '';
  });
  const [myOfferPhone, setMyOfferPhone] = useState(userProfile.phone || '');
  const [myOfferBubble, setMyOfferBubble] = useState('');
  const [myOfferInterests, setMyOfferInterests] = useState<string[]>([]);
  const [myOfferAvatar, setMyOfferAvatar] = useState(
    userProfile.questionnaire?.userPhoto ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85'
  );
  const [tgNotifyStatus, setTgNotifyStatus] = useState<{
    sent: boolean;
    deliveredViaBot: boolean;
    recipientName: string;
    recipientTelegram?: string | null;
    directTelegramUrl?: string;
  } | null>(null);

  const activeDeck = useMemo(
    () =>
      deckItems.filter(
        (item) =>
          !dismissedOfferIds.includes(item.offer.id) &&
          !matchedOfferIds.includes(item.offer.id)
      ),
    [deckItems, dismissedOfferIds, matchedOfferIds]
  );

  const currentItem = activeDeck[0] || null;

  // Motion drag values for Tinder swipe left / right
  const dragX = useMotionValue(0);
  const rotateCard = useTransform(dragX, [-200, 200], [-8, 8]);
  const likeOpacity = useTransform(dragX, [25, 110], [0, 1]);
  const nopeOpacity = useTransform(dragX, [-25, -110], [0, 1]);

  useEffect(() => {
    setAptPhotoIdx(0);
    dragX.set(0);
  }, [currentItem?.offer.id, dragX]);

  const formatHalfPrice = (apt: Apartment) => {
    const halfUsd = Math.round(apt.priceUsd / 2);
    if (apt.currency === 'EUR' || apt.city === 'belgrade') {
      return `€${halfUsd}`;
    }
    if (apt.currency === 'GEL') {
      const gel = apt.priceGel || Math.round(apt.priceUsd * 2.72);
      return `${Math.round(gel / 2)} ₾`;
    }
    return `$${halfUsd}`;
  };

  const formatFullPrice = (apt: Apartment) => {
    if (apt.currency === 'EUR' || apt.city === 'belgrade') {
      return `€${apt.priceUsd}`;
    }
    if (apt.currency === 'GEL') {
      const gel = apt.priceGel || Math.round(apt.priceUsd * 2.72);
      return `${gel} ₾`;
    }
    return `$${apt.priceUsd}`;
  };

  const handlePass = () => {
    if (!currentItem) return;
    setDismissedOfferIds((prev) => [...prev, currentItem.offer.id]);
    setHistoryIds((prev) => [...prev, currentItem.offer.id]);
  };

  const handleUndo = () => {
    if (historyIds.length === 0) return;
    const lastId = historyIds[historyIds.length - 1];
    setHistoryIds((prev) => prev.slice(0, -1));
    setDismissedOfferIds((prev) => prev.filter((id) => id !== lastId));
    setMatchedOfferIds((prev) => prev.filter((id) => id !== lastId));
  };

  const hasValidSavedContacts = Boolean(
    userProfile.name?.trim() &&
      userProfile.phone?.trim() &&
      userProfile.phone.trim() !== '+995 599 00-00-00'
  );

  const sendTelegramDoubleRentchAlert = (
    apt: Apartment,
    offer: RoommateOffer,
    applicant: { name: string; phone: string; telegramUsername?: string }
  ) => {
    const cleanRecipientTg = (offer.telegram || '').replace(/^@/, '').trim();
    const halfStr = formatHalfPrice(apt);
    const prefilledMsg = encodeURIComponent(
      `Привет, ${offer.userName}! 👋 Я отправил(а) тебе заявку Double Rentch! 50/50 в сервисе Rentch по квартире «${apt.title}» (${halfStr}/мес с человека). Мои контакты: ${applicant.name}, ${applicant.phone}. Давай снимем её вместе и сходим на совместный просмотр!`
    );
    const fallbackDirectUrl = cleanRecipientTg
      ? `https://t.me/${cleanRecipientTg}?text=${prefilledMsg}`
      : `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${prefilledMsg}`;

    setTgNotifyStatus({
      sent: true,
      deliveredViaBot: false,
      recipientName: offer.userName,
      recipientTelegram: offer.telegram || null,
      directTelegramUrl: fallbackDirectUrl,
    });

    fetch('/api/roommates/notify-double-rentch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offer,
        apartment: {
          id: apt.id,
          title: apt.title,
          district: apt.district,
          address: apt.address,
          priceUsd: apt.priceUsd,
          priceGel: apt.priceGel,
          currency: apt.currency,
          city: apt.city,
          sourceUrl: apt.sourceUrl,
        },
        applicant: {
          name: applicant.name,
          phone: applicant.phone,
          telegramUsername: applicant.telegramUsername,
          telegramChatId: userProfile.telegramChatId,
        },
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok) {
          setTgNotifyStatus({
            sent: true,
            deliveredViaBot: Boolean(data.deliveredViaBot),
            recipientName: data.recipientName || offer.userName,
            recipientTelegram: data.recipientTelegram || offer.telegram || null,
            directTelegramUrl: data.directTelegramUrl || fallbackDirectUrl,
          });
        }
      })
      .catch(() => {});
  };

  const handleLikeRoommate = () => {
    if (!currentItem) return;
    const { apartment, offer } = currentItem;
    setMatchedOfferIds((prev) => [...prev, offer.id]);
    setHistoryIds((prev) => [...prev, offer.id]);
    onLikeApartmentIfNeeded(apartment);
    setRmContactError('');
    setTgNotifyStatus(null);
    if (hasValidSavedContacts) {
      const contactData = {
        name: userProfile.name.trim(),
        phone: userProfile.phone.trim(),
        telegramUsername: userProfile.telegramUsername?.trim() || undefined,
      };
      onRoommateSwipedRight?.(apartment, offer, contactData);
      sendTelegramDoubleRentchAlert(apartment, offer, contactData);
    }
    setCelebrationMatch({ apartment, offer });
  };

  const handleConfirmRoommateMatchAction = (openChat: boolean) => {
    if (!celebrationMatch) return;
    const cleanName = rmContactName.trim();
    const cleanPhone = rmContactPhone.trim();
    const cleanTg = rmContactTelegram.trim();

    if (!cleanName || cleanName.length < 2) {
      setRmContactError('Пожалуйста, укажите ваше имя для отправки заявки в CRM');
      return;
    }
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 6) {
      setRmContactError('Пожалуйста, укажите ваш номер телефона (WhatsApp / Telegram)');
      return;
    }

    setRmContactError('');
    const target = celebrationMatch;
    const contactData = {
      name: cleanName,
      phone: cleanPhone,
      telegramUsername: cleanTg || undefined,
    };
    onRoommateSwipedRight?.(target.apartment, target.offer, contactData);
    if (!tgNotifyStatus?.sent) {
      sendTelegramDoubleRentchAlert(target.apartment, target.offer, contactData);
    }
    setCelebrationMatch(null);
    if (openChat) {
      onMatchWithRoommate(target.apartment, target.offer);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMyOfferAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetApt =
      apartments.find((a) => a.id === selectedAptIdForOffer) ||
      cityMatchedApartments[0] ||
      cityApartments[0];
    if (!targetApt) return;

    onLikeApartmentIfNeeded(targetApt);

    const tgUser = getTelegramUser();
    const cleanTgHandle = myOfferTelegram.trim()
      ? myOfferTelegram.trim().startsWith('@')
        ? myOfferTelegram.trim()
        : `@${myOfferTelegram.trim().replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '')}`
      : tgUser?.username
      ? `@${tgUser.username}`
      : userProfile.telegramUsername;

    const newOffer: RoommateOffer = {
      id: 'rm-user-' + Date.now(),
      apartmentId: targetApt.id,
      city: activeCity,
      userName: myOfferName.trim() || userProfile.name || 'Арендатор Rentch',
      userAge: Number(myOfferAge) || 25,
      userAvatar: myOfferAvatar,
      secondAvatar: targetApt.images[0],
      partnerName: 'Ищу соседа 50/50',
      partnerAge: Number(myOfferAge) || 25,
      occupation: myOfferOccupation.trim() || 'Удалённая работа',
      bubbleText:
        myOfferBubble.trim() ||
        'Выбрал(а) эту квартиру! Предлагаю снять её вдвоём 50/50 и вместе записаться на просмотр.',
      interests: myOfferInterests,
      moveInDate: 'Готов(а) к совместному просмотру',
      verified: true,
      createdAt: 'Только что',
      telegram: cleanTgHandle,
      telegramChatId: tgUser?.id ? String(tgUser.id) : userProfile.telegramChatId,
      phone: myOfferPhone.trim() || userProfile.phone,
      isUserCreated: true,
    };

    const updated = [newOffer, ...customOffers];
    setCustomOffers(updated);
    try {
      localStorage.setItem('rentch_roommate_offers', JSON.stringify(updated));
    } catch (err) {}

    fetch('/api/roommates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOffer),
    }).catch(() => {});

    if (tgUser?.id || cleanTgHandle) {
      fetch('/api/telegram/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: tgUser?.id ? String(tgUser.id) : userProfile.telegramChatId || '',
          username: cleanTgHandle,
          fullName: newOffer.userName,
          phone: newOffer.phone,
          offerId: newOffer.id,
        }),
      }).catch(() => {});
    }

    onPublishRoommateOffer?.(targetApt, newOffer);
    setIsCreateOfferOpen(false);
    onSelectFocusedApartment?.(targetApt.id);
    setScopeFilter('my_chosen');
  };

  const toggleInterest = (tag: string) => {
    setMyOfferInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div
      id="roommate-finder-section"
      className="w-full max-w-md mx-auto flex flex-col pb-24 select-none"
    >
      {/* Chosen Apartments Strip (if user has swiped right on apartments) */}
      <div className="w-full bg-stone-950 rounded-t-3xl px-3.5 pt-3 pb-2.5 border-x border-t border-stone-800">
        {cityMatchedApartments.length > 0 ? (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <button
              type="button"
              onClick={() => {
                onSelectFocusedApartment?.(null);
                setScopeFilter('my_chosen');
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer border ${
                !focusedApartmentId && scopeFilter === 'my_chosen'
                  ? 'bg-white text-stone-950 border-white'
                  : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700'
              }`}
            >
              Все выбранные ({cityMatchedApartments.length})
            </button>
            {cityMatchedApartments.map((apt) => {
              const isSelected = focusedApartmentId === apt.id;
              return (
                <button
                  key={apt.id}
                  type="button"
                  onClick={() => onSelectFocusedApartment?.(isSelected ? null : apt.id)}
                  className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer border max-w-[190px] ${
                    isSelected
                      ? 'bg-rose-500 text-white border-rose-400 shadow-xs'
                      : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <img
                    src={apt.images[0]}
                    alt=""
                    className="w-5 h-5 rounded-lg object-cover shrink-0"
                  />
                  <span className="truncate">
                    {formatHalfPrice(apt)}/чел ·{' '}
                    {formatDistrictDisplay(getAccurateApartmentDistrict(apt))}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 bg-stone-900/90 border border-stone-800 rounded-2xl px-3 py-2 text-[11px] text-stone-300">
            <span>
              Слева — <strong className="text-white">будущий сосед</strong>, справа —{' '}
              <strong className="text-white">квартира</strong>. Свайпайте вправо, если нравятся оба!
            </span>
            <button
              type="button"
              onClick={() => setIsCreateOfferOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shrink-0 cursor-pointer"
            >
              + Анкета
            </button>
          </div>
        )}
      </div>

      {/* Main Split-Screen Card Stage (Left = Сосед, Right = Квартира, Swipe Right to Match!) */}
      {currentItem ? (
        <div className="w-full bg-stone-950 rounded-b-3xl border-x border-b border-stone-800 px-2.5 pb-4 shadow-2xl overflow-hidden">
          {/* Top Story Pagination Dots */}
          <div className="flex items-center justify-center gap-1.5 py-2">
            {activeDeck.slice(0, 5).map((item, idx) => (
              <span
                key={item.offer.id}
                className={`h-1 rounded-full transition-all ${
                  idx === 0 ? 'w-5 bg-white' : 'w-2 bg-stone-700'
                }`}
              />
            ))}
          </div>

          {/* Draggable 50/50 Vertical Split Screen Container */}
          <motion.div
            key={currentItem.offer.id}
            id="double-date-split-card"
            style={{ x: dragX, rotate: rotateCard }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_e, info) => {
              if (info.offset.x > 95) {
                handleLikeRoommate();
              } else if (info.offset.x < -95) {
                handlePass();
              }
            }}
            className="relative w-full h-[495px] sm:h-[525px] rounded-3xl overflow-hidden bg-stone-900 border border-stone-800 shadow-inner cursor-grab active:cursor-grabbing"
          >
            {/* Swipe Right Stamp (СОВМЕСТНЫЙ RENTCH! 50/50) */}
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-16 left-5 z-30 border-4 border-emerald-400 text-emerald-400 bg-black/60 backdrop-blur-xs font-black text-lg px-3.5 py-1 rounded-xl -rotate-12 pointer-events-none uppercase tracking-wider"
            >
              Снять вместе 50/50 ❤️
            </motion.div>

            {/* Swipe Left Stamp (ПРОПУСК) */}
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-16 right-5 z-30 border-4 border-rose-500 text-rose-500 bg-black/60 backdrop-blur-xs font-black text-lg px-3.5 py-1 rounded-xl rotate-12 pointer-events-none uppercase tracking-wider"
            >
              Пропуск ✕
            </motion.div>

            {/* THE 50 / 50 VERTICAL SPLIT GRID: LEFT = PERSON (СОСЕД), RIGHT = APARTMENT (КВАРТИРА) */}
            <div className="grid grid-cols-2 w-full h-full relative">
              {/* LEFT HALF (50% WIDTH, FULL HEIGHT): СТОРОНА ЧЕЛОВЕКА (СОСЕДА) И ЕГО ПЛАШКА */}
              <div className="relative w-full h-full overflow-hidden border-r border-white/25 group">
                <img
                  src={currentItem.offer.userAvatar}
                  alt={currentItem.offer.userName}
                  draggable={false}
                  className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500 select-none"
                />

                {/* Top badges strictly on the person's side */}
                <div className="absolute top-3 inset-x-2.5 z-20 flex flex-col items-start gap-1.5 pointer-events-none">
                  <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/15 shadow-lg max-w-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[10px] font-bold truncate">
                      Сосед: {currentItem.offer.userName}, {currentItem.offer.userAge}
                    </span>
                  </div>
                  <div className="bg-emerald-500/90 backdrop-blur-xs text-stone-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm truncate max-w-full">
                    Тоже выбрал(а) эту кв.
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                {/* Bottom Person Info Card — strictly inside the left half (person's side only) */}
                <div className="absolute bottom-3 inset-x-2.5 z-20 flex flex-col items-start pointer-events-none">
                  <motion.div
                    key={currentItem.offer.id}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="w-full bg-white/95 backdrop-blur-md text-stone-950 rounded-2xl rounded-bl-sm p-2.5 shadow-xl mb-2 pointer-events-auto"
                  >
                    <p className="text-[11px] font-bold leading-snug text-stone-900 line-clamp-4">
                      {currentItem.offer.bubbleText}
                    </p>
                    <div className="flex flex-col gap-0.5 mt-1.5 pt-1.5 border-t border-stone-200/80 text-[9px] font-semibold text-stone-500">
                      <span className="truncate">{currentItem.offer.occupation}</span>
                      <span className="text-rose-600 font-bold truncate">
                        {currentItem.offer.moveInDate}
                      </span>
                    </div>
                  </motion.div>

                  <div className="flex items-center gap-1 min-w-0 max-w-full px-0.5">
                    <h3 className="text-sm sm:text-base font-black text-white tracking-tight truncate drop-shadow-md">
                      {currentItem.offer.userName}, {currentItem.offer.userAge}
                    </h3>
                    {currentItem.offer.verified && (
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-stone-950 shrink-0 shadow-md"
                        title="Проверенный арендатор Rentch"
                      >
                        <CheckCircle2 className="w-3 h-3 fill-stone-950 text-white" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT HALF (50% WIDTH, FULL HEIGHT): СТОРОНА КВАРТИРЫ */}
              <div
                onClick={() => {
                  const total = currentItem.apartment.images.length || 1;
                  setAptPhotoIdx((prev) => (prev + 1) % total);
                }}
                className="relative w-full h-full overflow-hidden cursor-pointer group"
                title="Нажмите, чтобы листать фото квартиры"
              >
                <img
                  src={
                    splitLayout === 'person_left_apt_right'
                      ? currentItem.apartment.images[aptPhotoIdx] ||
                        currentItem.apartment.images[0]
                      : currentItem.offer.secondAvatar || currentItem.apartment.images[0]
                  }
                  alt={currentItem.apartment.title}
                  draggable={false}
                  className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500 select-none"
                />

                {/* Top badges strictly on the apartment's side */}
                <div className="absolute top-3 inset-x-2.5 z-20 flex flex-col items-end gap-1.5 pointer-events-none">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenApartmentDetails(currentItem.apartment);
                    }}
                    className="pointer-events-auto flex items-center gap-1 bg-black/75 hover:bg-black/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/15 shadow-lg transition-all cursor-pointer max-w-full"
                  >
                    <span className="text-[10px] font-extrabold text-emerald-300 shrink-0">
                      50/50: {formatHalfPrice(currentItem.apartment)}
                    </span>
                    <span className="text-[10px] text-stone-300 truncate">
                      · {formatDistrictDisplay(getAccurateApartmentDistrict(currentItem.apartment))}
                    </span>
                  </button>
                  <div className="bg-rose-500/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm truncate max-w-full">
                    {currentItem.apartment.rooms} комн. · {currentItem.apartment.areaSqm} м² (фото{' '}
                    {(aptPhotoIdx % (currentItem.apartment.images.length || 1)) + 1}/
                    {currentItem.apartment.images.length || 1})
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent pointer-events-none" />

                {/* Bottom Apartment Info — strictly inside the right half (apartment's side only) */}
                <div className="absolute bottom-3 inset-x-2.5 z-20 flex items-end justify-between gap-1.5 pointer-events-auto">
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-black text-emerald-300 tracking-tight truncate drop-shadow-md">
                      {formatHalfPrice(currentItem.apartment)}/мес
                    </div>
                    <p className="text-[10px] text-stone-200 font-semibold truncate">
                      {currentItem.apartment.title}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenApartmentDetails(currentItem.apartment);
                    }}
                    title="Открыть полное описание квартиры"
                    className="w-8 h-8 rounded-full bg-stone-900/90 hover:bg-black text-white border border-white/20 flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer shrink-0"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Dark Info Banner Below Split Card (Matches "Попробуй Double Date" banner in screenshot) */}
          <div className="mt-3 bg-black border border-stone-800/90 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-stone-900 border border-stone-700 flex items-center justify-center text-emerald-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                  Свайп вправо — начать чат с соседом и админом
                </h4>
                <p className="text-[11px] text-stone-400 truncate mt-0.5">
                  По {formatHalfPrice(currentItem.apartment)} с каждого (вместо{' '}
                  {formatFullPrice(currentItem.apartment)}/мес)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateOfferOpen(true)}
              className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-white text-[11px] font-bold shrink-0 cursor-pointer transition-colors"
            >
              Моя анкета
            </button>
          </div>

          {/* Bottom 5 Circular Action Controls (Exact match to Tinder Double Date screenshot) */}
          <div className="flex items-center justify-between px-3 pt-4 pb-1">
            {/* 1. Undo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIds.length === 0}
              title="Вернуть предыдущую карточку"
              className="w-12 h-12 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-40 border border-stone-800 text-stone-300 flex items-center justify-center transition-all cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* 2. Pass / Swipe Left (X) */}
            <button
              type="button"
              id="roommate-pass-btn"
              onClick={handlePass}
              title="Пропустить (Свайп влево)"
              className="w-16 h-16 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-8 h-8 stroke-[2.5]" />
            </button>

            {/* 3. Star / Publish Your Co-Rent Offer */}
            <button
              type="button"
              onClick={() => {
                setSelectedAptIdForOffer(currentItem.apartment.id);
                setIsCreateOfferOpen(true);
              }}
              title="Предложить другим снять эту квартиру со мной"
              className="w-12 h-12 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-800 text-amber-400 flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
            >
              <Star className="w-5 h-5 fill-amber-400" />
            </button>

            {/* 4. Like / Swipe Right (Heart) */}
            <button
              type="button"
              id="roommate-like-btn"
              onClick={handleLikeRoommate}
              title="Нравится и квартира, и сосед! (Свайп вправо)"
              className="w-16 h-16 rounded-full bg-stone-900 hover:bg-stone-800 border border-rose-500/50 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/15 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Heart className="w-8 h-8 fill-rose-500 text-rose-500" />
            </button>

            {/* 5. Direct Paper-Plane Invite to Group Chat & Telegram Notification */}
            <button
              type="button"
              onClick={handleLikeRoommate}
              title="Отправить заявку соседу в Telegram и открыть диалог"
              className="w-12 h-12 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-200 flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty state when all roommate cards in deck have been viewed */
        <div className="w-full bg-stone-950 text-white rounded-b-3xl border-x border-b border-stone-800 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-stone-900 border border-stone-800 text-rose-500 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black">Вы просмотрели всех кандидатов</h3>
          <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
            Вы можете разместить свою анкету для выбранной квартиры (чтобы другие пользователи свайпнули вас вправо) или просмотреть карточки заново.
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOfferOpen(true)}
              className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold py-3 px-5 rounded-2xl text-xs sm:text-sm cursor-pointer"
            >
              + Опубликовать свою анкету для этой квартиры
            </button>
            <button
              type="button"
              onClick={() => {
                setDismissedOfferIds([]);
                setMatchedOfferIds([]);
                setHistoryIds([]);
              }}
              className="w-full bg-stone-900 hover:bg-stone-800 text-stone-200 font-semibold py-3 px-5 rounded-2xl text-xs border border-stone-800 cursor-pointer"
            >
              Смотреть карточки заново
            </button>
          </div>
        </div>
      )}

      {/* Celebratory "Double Rentch! 50/50" Modal when user swipes right on Roommate + Apartment */}
      <AnimatePresence>
        {celebrationMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-stone-950 text-white rounded-3xl border border-rose-500/40 p-5 sm:p-6 text-center shadow-2xl space-y-3.5 my-auto max-h-[94dvh] overflow-y-auto"
            >
              {hasValidSavedContacts && (
                <button
                  type="button"
                  onClick={() => handleConfirmRoommateMatchAction(false)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                <BellRing className="w-3.5 h-3.5" />
                <span>Double Rentch! 50/50</span>
              </div>

              <h3 className="text-3xl font-black italic bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                Double Rentch! 50/50
              </h3>

              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                Вы выбрали совместную аренду с{' '}
                <strong className="text-white">{celebrationMatch.offer.userName}</strong> по квартире{' '}
                <strong className="text-white">«{celebrationMatch.apartment.title}»</strong> (по{' '}
                <strong className="text-emerald-400">
                  {formatHalfPrice(celebrationMatch.apartment)}/мес
                </strong>{' '}
                с человека).
              </p>

              {/* Mini 50/50 Split Preview: Left = Person, Right = Apartment */}
              <div className="grid grid-cols-2 h-36 rounded-2xl overflow-hidden border border-stone-800 relative">
                <div className="relative h-full border-r border-white/20">
                  <img
                    src={celebrationMatch.offer.userAvatar}
                    alt={celebrationMatch.offer.userName}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {celebrationMatch.offer.userName}, {celebrationMatch.offer.userAge}
                  </span>
                </div>
                <div className="relative h-full">
                  <img
                    src={celebrationMatch.apartment.images[0]}
                    alt={celebrationMatch.apartment.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {formatHalfPrice(celebrationMatch.apartment)}/чел
                  </span>
                </div>
              </div>

              {!hasValidSavedContacts && (
                <div className="bg-stone-900 border border-rose-500/40 rounded-2xl p-3.5 text-left space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-300 uppercase flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-rose-400" />
                      <span>Ваши контакты для заявки *</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                      Обязательно
                    </span>
                  </div>

                  {rmContactError && (
                    <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{rmContactError}</span>
                    </div>
                  )}

                  <input
                    type="text"
                    required
                    value={rmContactName}
                    onChange={(e) => {
                      setRmContactName(e.target.value);
                      if (rmContactError) setRmContactError('');
                    }}
                    placeholder="Ваше имя и фамилия *"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={rmContactPhone}
                      onChange={(e) => {
                        setRmContactPhone(e.target.value);
                        if (rmContactError) setRmContactError('');
                      }}
                      placeholder="Номер телефона (WhatsApp / Telegram) *"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <input
                    type="text"
                    value={rmContactTelegram}
                    onChange={(e) => setRmContactTelegram(e.target.value)}
                    placeholder="Ник в Telegram (по желанию)"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div className="bg-sky-950/60 border border-sky-500/40 rounded-2xl p-3 text-left text-xs text-sky-100 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-sky-300 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-400" />
                    <span>
                      Оповещение в Telegram для {celebrationMatch.offer.userName}
                      {celebrationMatch.offer.telegram
                        ? ` (${celebrationMatch.offer.telegram})`
                        : ''}
                    </span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold shrink-0">
                    {tgNotifyStatus?.sent ? '✓ Отправлено' : 'Авто-отправка'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-300 leading-snug">
                  При подтверждении заявки пользователю{' '}
                  <strong className="text-white">{celebrationMatch.offer.userName}</strong>{' '}
                  автоматически уходит уведомление в Telegram-бот с вашими контактами и предложением снять{' '}
                  <strong className="text-white">«{celebrationMatch.apartment.title}»</strong> 50/50, а также создаётся групповой чат в Rentch.
                </p>
                {celebrationMatch.offer.telegram && (
                  <a
                    href={`https://t.me/${celebrationMatch.offer.telegram
                      .replace(/^@/, '')
                      .trim()}?text=${encodeURIComponent(
                      `Привет, ${celebrationMatch.offer.userName}! 👋 Я отправил(а) тебе заявку Double Rentch! 50/50 в сервисе Rentch по квартире «${celebrationMatch.apartment.title}» (${formatHalfPrice(
                        celebrationMatch.apartment
                      )}/мес с человека). Давай снимем её вместе!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5 text-sky-300" />
                    <span>
                      Написать {celebrationMatch.offer.userName} также напрямую в личный Telegram (
                      {celebrationMatch.offer.telegram})
                    </span>
                  </a>
                )}
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  id="open-group-roommate-chat-btn"
                  onClick={() => handleConfirmRoommateMatchAction(true)}
                  className="w-full bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold py-3.5 px-5 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Отправить заявку + оповещение в Telegram ({celebrationMatch.offer.userName})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmRoommateMatchAction(false)}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-stone-300 font-semibold py-2.5 px-4 rounded-2xl text-xs cursor-pointer"
                >
                  Сохранить заявку (отправить уведомление в Telegram) и смотреть дальше
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal to Create & Publish User's Own Co-Rent Offer */}
      <AnimatePresence>
        {isCreateOfferOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative w-full max-w-md bg-stone-950 text-white rounded-3xl border border-stone-800 p-5 sm:p-6 shadow-2xl my-auto"
            >
              <button
                type="button"
                onClick={() => setIsCreateOfferOpen(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Предложить снять вдвоём
                  </h3>
                  <p className="text-xs text-stone-400">
                    Когда кто-то свайпнет вас вправо, вам придёт уведомление и откроется общий чат
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateOfferSubmit} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Выберите квартиру для совместной аренды (50/50)
                  </label>
                  <select
                    value={selectedAptIdForOffer}
                    onChange={(e) => setSelectedAptIdForOffer(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {cityMatchedApartments.length > 0 && (
                      <optgroup label="Ваши выбранные квартиры (Rentch!)">
                        {cityMatchedApartments.map((apt) => (
                          <option key={apt.id} value={apt.id}>
                            ★ {apt.title} — по {formatHalfPrice(apt)}/чел. ({apt.district})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label={`Каталог ${cityInfo.nameRu}`}>
                      {cityApartments.slice(0, 30).map((apt) => (
                        <option key={apt.id} value={apt.id}>
                          {apt.title} — по {formatHalfPrice(apt)}/чел. ({apt.district})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Ваше имя
                    </label>
                    <input
                      type="text"
                      required
                      value={myOfferName}
                      onChange={(e) => setMyOfferName(e.target.value)}
                      placeholder="Например: Анна"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Возраст
                    </label>
                    <input
                      type="number"
                      min={18}
                      max={75}
                      required
                      value={myOfferAge}
                      onChange={(e) => setMyOfferAge(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-sky-300 mb-1">
                      Ваш Telegram (@username) для уведомлений *
                    </label>
                    <input
                      type="text"
                      required
                      value={myOfferTelegram}
                      onChange={(e) => setMyOfferTelegram(e.target.value)}
                      placeholder="@username"
                      className="w-full bg-stone-900 border border-sky-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Телефон (WhatsApp / Telegram)
                    </label>
                    <input
                      type="tel"
                      value={myOfferPhone}
                      onChange={(e) => setMyOfferPhone(e.target.value)}
                      placeholder="+995 555 00-00-00"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="bg-sky-950/50 border border-sky-500/30 rounded-2xl p-2.5 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-sky-200 leading-snug">
                    🔔 Чтобы бот <strong>@rentch_date_bot</strong> мгновенно присылал вам оповещения при заявке на вашу анкету:
                  </div>
                  <a
                    href={`https://t.me/rentch_date_bot?start=notify_${encodeURIComponent(
                      myOfferTelegram.replace(/^@/, '').trim() || 'roommate'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] shrink-0 flex items-center gap-1 transition"
                  >
                    <Send className="w-3 h-3" />
                    <span>Подключить</span>
                  </a>
                </div>

                <div className="flex items-center gap-3 bg-stone-900/90 border border-stone-800 rounded-2xl p-2.5">
                  <img
                    src={myOfferAvatar}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover border border-stone-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white">Ваше фото (слева на карточке)</p>
                    <p className="text-[10px] text-stone-400">Справа автоматически встанет фото квартиры</p>
                  </div>
                  <label className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-white cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Фото</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    Сообщение для будущего соседа (белый баббл)
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={myOfferBubble}
                    onChange={(e) => setMyOfferBubble(e.target.value)}
                    placeholder="Мы за Настольные игры, Кофе и Чистоту. Снимем эту квартиру вдвоём!"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1.5">
                    Интересы и привычки
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {INTEREST_PRESETS.map((tag) => {
                      const active = myOfferInterests.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleInterest(tag)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                            active
                              ? 'bg-white text-stone-950 border-white'
                              : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black py-3.5 px-5 rounded-2xl text-xs sm:text-sm shadow-lg transition-all cursor-pointer mt-2"
                >
                  Опубликовать предложение в «Соседи»
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
