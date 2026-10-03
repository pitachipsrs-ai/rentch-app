/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Heart, 
  X, 
  RotateCcw, 
  Info, 
  SlidersHorizontal, 
  Check, 
  Sparkles,
  Building2,
  Plus,
  MapPin,
  Users,
  LayoutGrid,
  Flame,
  BedDouble,
  Maximize2,
} from 'lucide-react';
import { 
  Apartment, 
  UserProfile, 
  QuestionnaireAnswers, 
  FilterState, 
  ApartmentChat, 
  ChatMessage, 
  NotificationItem,
  CrmLead,
  RentchCity,
  RoommateOffer
} from './types';
import { INITIAL_APARTMENTS } from './data/mockApartments';
import { INITIAL_CRM_LEADS } from './data/mockCrmLeads';
import { filterAndRecommendApartments } from './utils/filterAndRecommend';
import { CITIES_CONFIG, RENTCH_CITIES } from './utils/districtUtils';
import { TopBar } from './components/TopBar';
import { BottomNavBar, AppTab } from './components/BottomNavBar';
import { SwipeCard } from './components/SwipeCard';
import { RentchMatchModal } from './components/RentchMatchModal';
import { ChatModal } from './components/ChatModal';
import { QuestionnaireModal } from './components/QuestionnaireModal';
import { FilterDrawer } from './components/FilterDrawer';
import { TbilisiMap } from './components/TbilisiMap';
import { MatchesSection } from './components/MatchesSection';
import { RoommateFinderSection } from './components/RoommateFinderSection';
import { DialoguesSection, SUPPORT_CHAT_APARTMENT } from './components/DialoguesSection';
import { ApartmentDetailsModal } from './components/ApartmentDetailsModal';
import { AdminPanel } from './components/AdminPanel';
import { RealTimeNotificationToast } from './components/RealTimeNotificationToast';
import { AuthModal, LandlordAuthData } from './components/AuthModal';
import { LandlordRegistrationModal } from './components/LandlordRegistrationModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { triggerHaptic, isInsideTelegram, getTelegramUser } from './utils/telegram';
import { QuickFilterBar } from './components/QuickFilterBar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SplashScreen } from './components/SplashScreen';
import { getMyHomeOriginalUrl } from './utils/myhomeParser';
import { trackAnalyticsEvent } from './utils/analytics';
import { getAdminAuthHeaders, clearAdminSession } from './utils/adminAuth';

const FAKE_MOCK_IDS = new Set([
  'apt-catalog-1',
  'apt-catalog-2',
  'apt-catalog-3',
  'apt-1',
  'apt-2',
  'apt-3',
  'apt-4',
  'apt-5',
  'apt-6',
  'apt-7',
  'apt-8',
  'myhome-25919663',
  'myhome-25884912',
  'myhome-25934105',
  'myhome-25911456',
  'myhome-25870198',
  'myhome-25948210',
  'myhome-25891034',
  'myhome-25920345',
  'myhome-25865091',
]);

const isFakeApartment = (a: any): boolean => {
  if (!a || typeof a !== 'object') return true;
  if (!a.id || FAKE_MOCK_IDS.has(a.id)) return true;
  if (Array.isArray(a.images) && a.images.some((img: string) => typeof img === 'string' && img.includes('unsplash.com'))) {
    return true;
  }
  const title = (a.title || '').toLowerCase();
  const address = (a.address || '').toLowerCase();
  if (
    title.includes('аракишвили') ||
    address.includes('аракишвили') ||
    title.includes('казбеги') ||
    address.includes('казбеги') ||
    title.includes('мтацминд') ||
    address.includes('чонкадзе') ||
    title.includes('дизайнерский пентхаус') ||
    title.includes('видовая студия с террасой') ||
    title.includes('атмосферный пентхаус')
  ) {
    return true;
  }
  return false;
};

const CATALOG_VERSION = 'v11_clean_user_profile';

const FAKE_CACHED_NAMES = new Set([
  'Иван Смирнов',
  'Игорь Азаров',
  'Георгий (Собственник)',
  'Арендатор',
  'Клиент',
  'Клиент Rentch',
]);

const FAKE_CACHED_PHONES = new Set([
  '+995 599 000 000',
  '+995 599 00-00-00',
  '+995 599 12-34-56',
  '+995 599 82-41-10',
  '+995 555 40-20-10',
  '+995 555 12-34-56',
]);

export default function App() {
  // App State - real apartments database synchronized with central backend
  const [apartments, setApartments] = useState<Apartment[]>(() => {
    try {
      const storedVer = localStorage.getItem('rentch_catalog_ver');
      if (storedVer !== CATALOG_VERSION) {
        localStorage.removeItem('rentch_apartments');
        localStorage.setItem('rentch_catalog_ver', CATALOG_VERSION);
        return [];
      }

      const saved = localStorage.getItem('rentch_apartments');
      if (saved) {
        const parsed: Apartment[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter((a) => !isFakeApartment(a));
          return clean;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_APARTMENTS.filter((a) => !isFakeApartment(a));
  });

  // Fetch real apartments from server on startup and sync on focus / background
  const refreshApartmentsFromServer = useCallback(() => {
    fetch('/api/apartments')
      .then((res) => {
        if (!res.ok) throw new Error('Network response not ok');
        return res.json();
      })
      .catch(() =>
        fetch('/apartments.json').then((res) => {
          if (!res.ok) throw new Error('Static fallback not ok');
          return res.json();
        })
      )
      .then((serverApts: Apartment[]) => {
        if (Array.isArray(serverApts)) {
          const cleanServerApts = serverApts.filter((a) => !isFakeApartment(a));
          setApartments(cleanServerApts);
          try {
            localStorage.setItem('rentch_apartments', JSON.stringify(cleanServerApts));
          } catch (storageErr) {
            console.warn('LocalStorage quota reached (server DB is primary truth):', storageErr);
          }
        }
      })
      .catch((err) => {
        console.warn('Sync with server error:', err);
      });
  }, []);

  useEffect(() => {
    refreshApartmentsFromServer();

    // Re-fetch when user switches back to this tab
    const handleFocus = () => refreshApartmentsFromServer();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refreshApartmentsFromServer();
      }
    });

    // Background interval sync every 4 seconds
    const interval = setInterval(refreshApartmentsFromServer, 4000);

    // Cross-tab broadcast sync
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('rentch_catalog');
      bc.onmessage = () => {
        refreshApartmentsFromServer();
      };
    } catch (e) {
      // BroadcastChannel not supported in some older environments
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [refreshApartmentsFromServer]);

  useEffect(() => {
    try {
      localStorage.setItem('rentch_apartments', JSON.stringify(apartments));
    } catch (storageErr) {
      // Safely ignore quota exceeded errors; server API preserves all data
      console.warn('LocalStorage quota limit reached:', storageErr);
    }
  }, [apartments]);

  // Deep linking: check URL for ?apartment=... link shared by friends
  useEffect(() => {
    if (apartments.length === 0) return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sharedAptId = urlParams.get('apartment');
      if (sharedAptId) {
        const targetApt = apartments.find((a) => a.id === sharedAptId);
        if (targetApt) {
          setDetailsModalApartment(targetApt);
        }
      }
    } catch (err) {
      console.warn('URL search params parse error:', err);
    }
  }, [apartments]);

  // Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('rentch_admin_auth') === 'true';
  });
  const [isLandlordLoggedIn, setIsLandlordLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('rentch_landlord_auth') === 'true';
  });
  const [landlordProfile, setLandlordProfile] = useState<LandlordAuthData | null>(() => {
    try {
      const saved = localStorage.getItem('rentch_landlord_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (sessionStorage.getItem('rentch_admin_auth') === 'true') return 'admin';
    if (sessionStorage.getItem('rentch_landlord_auth') === 'true') return 'landlord';
    return 'swipe';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(() => {
    try {
      return new URLSearchParams(window.location.search).get('privacy') === '1';
    } catch {
      return false;
    }
  });
  const [webCatalogMode, setWebCatalogMode] = useState<'swipe' | 'grid'>('swipe');

  const handleDeleteUserData = async () => {
    try {
      await fetch('/api/user/delete-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: userProfile.phone,
          clientName: userProfile.name,
          visitorId: localStorage.getItem('rentch_visitor_id'),
        }),
      });
    } catch (e) {
      console.warn('Failed to delete data on server:', e);
    }
    localStorage.removeItem('rentch_user_profile');
    localStorage.removeItem('rentch_client_info');
    localStorage.removeItem('rentch_liked_apartments');
    localStorage.removeItem('rentch_chats');
    setUserProfile({
      id: 'user-main',
      name: '',
      phone: '',
      isRegistered: false,
      questionnaireCompleted: false,
      telegramNotificationsEnabled: false,
    });
    setChats({});
    setLikedIds([]);
    triggerHaptic('success');
  };
  // Open full-featured Web Application immediately instead of promotional landing/splash screen
  const [isSplashOpen, setIsSplashOpen] = useState<boolean>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('splash') === '1') {
        return true;
      }
    } catch (e) {}
    return false;
  });

  useEffect(() => {
    try {
      const tgUser = getTelegramUser();
      if (tgUser) {
        const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
        const tgHandle = tgUser.username ? `@${tgUser.username}` : undefined;
        setUserProfile((prev) => ({
          ...prev,
          name: prev.name || fullName,
          telegramUsername: prev.telegramUsername || tgHandle,
          telegramChatId: String(tgUser.id),
          telegramNotificationsEnabled: true,
        }));
        fetch('/api/telegram/register-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: String(tgUser.id),
            username: tgUser.username,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            fullName,
          }),
        }).catch(() => {});
      }
    } catch (e) {}
  }, []);

  // Track initial view in daily analytics
  useEffect(() => {
    trackAnalyticsEvent('catalog_view');
  }, []);

  // Swiping State
  const MAX_DAILY_RIGHT_SWIPES = 5;
  const getTodayDateKey = () => new Date().toISOString().slice(0, 10);

  const [dailyRightSwipes, setDailyRightSwipes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rentch_daily_right_swipes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.date === new Date().toISOString().slice(0, 10) && Array.isArray(parsed.apartmentIds)) {
          return parsed.apartmentIds;
        }
      }
    } catch (e) {
      console.warn('Error reading daily swipe limit:', e);
    }
    return [];
  });
  const [isDailyLimitModalOpen, setIsDailyLimitModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        'rentch_daily_right_swipes',
        JSON.stringify({
          date: getTodayDateKey(),
          apartmentIds: dailyRightSwipes,
        })
      );
    } catch (e) {}
  }, [dailyRightSwipes]);

  const [likedIds, setLikedIds] = useState<string[]>(() => {
    try {
      const savedLiked = localStorage.getItem('rentch_swipes_liked');
      if (savedLiked) {
        const parsedLiked = JSON.parse(savedLiked);
        if (Array.isArray(parsedLiked) && parsedLiked.length > 0) {
          return parsedLiked;
        }
      }
      const saved = localStorage.getItem('rentch_daily_right_swipes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.apartmentIds)) {
          return parsed.apartmentIds;
        }
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('rentch_swipes_liked', JSON.stringify(likedIds));
    } catch (e) {}
  }, [likedIds]);
  const [dislikedIds, setDislikedIds] = useState<string[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<{ id: string; action: 'like' | 'dislike' }[]>([]);

  // User Profile & Questionnaire
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('rentch_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const cleanName = FAKE_CACHED_NAMES.has((parsed.name || '').trim())
            ? ''
            : (parsed.name || '').trim();
          const cleanPhone = FAKE_CACHED_PHONES.has((parsed.phone || '').trim())
            ? ''
            : (parsed.phone || '').trim();
          return {
            ...parsed,
            name: cleanName,
            phone: cleanPhone,
            isRegistered: Boolean(cleanName && cleanPhone && parsed.isRegistered),
          };
        }
      }
    } catch (e) {}
    return {
      id: 'user-default',
      name: '',
      phone: '',
      email: '',
      isRegistered: false,
      questionnaireCompleted: false,
      telegramNotificationsEnabled: false,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('rentch_user_profile', JSON.stringify(userProfile));
    } catch (e) {}
  }, [userProfile]);

  // CRM Leads State (persistent storage, merged with restored real leads)
  const [crmLeads, setCrmLeads] = useState<CrmLead[]>(() => {
    try {
      const saved = localStorage.getItem('rentch_crm_leads');
      if (saved) {
        const parsed: any[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validSaved = parsed.filter(
            (l) =>
              l &&
              l.id &&
              typeof l.id === 'string' &&
              !/^lead-[0-9]+$/.test(l.id) &&
              !('rooms' in l) &&
              l.stage &&
              l.clientName
          );
          const map = new Map<string, CrmLead>();
          INITIAL_CRM_LEADS.forEach((l) => map.set(l.id, l));
          validSaved.forEach((l) => map.set(l.id, l));
          return Array.from(map.values());
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CRM_LEADS;
  });

  // Chats with landlords/robot/admin
  const [chats, setChats] = useState<Record<string, ApartmentChat>>(() => {
    try {
      const saved = localStorage.getItem('rentch_chats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const clean: Record<string, ApartmentChat> = {};
          for (const [k, v] of Object.entries(parsed)) {
            if (
              k &&
              !/^[0-9]+$/.test(k) &&
              v &&
              typeof v === 'object' &&
              !('rooms' in (v as any)) &&
              Array.isArray((v as any).messages)
            ) {
              clean[k] = v as ApartmentChat;
            }
          }
          return clean;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  const syncLeadsToServer = useCallback(
    (nextLeads: CrmLead[], options?: { isAdminUpdate?: boolean; replace?: boolean }) => {
      try {
        localStorage.setItem('rentch_crm_leads', JSON.stringify(nextLeads));
      } catch (e) {}
      fetch('/api/crm/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options?.isAdminUpdate ? getAdminAuthHeaders() : {}),
        },
        body: JSON.stringify({
          leads: nextLeads,
          isAdminUpdate: options?.isAdminUpdate ?? false,
          replace: options?.replace ?? false,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.leads)) {
            setCrmLeads(data.leads);
          }
          try {
            const bc = new BroadcastChannel('rentch_catalog');
            bc.postMessage({ action: 'crm_updated' });
            bc.close();
          } catch (e) {}
        })
        .catch(() => {});
    },
    []
  );

  const syncChatsToServer = useCallback((nextChats: Record<string, ApartmentChat>) => {
    try {
      localStorage.setItem('rentch_chats', JSON.stringify(nextChats));
    } catch (e) {}
    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chats: nextChats }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.leads)) {
          setCrmLeads(data.leads);
        }
        try {
          const bc = new BroadcastChannel('rentch_catalog');
          bc.postMessage({ action: 'chats_updated' });
          bc.close();
        } catch (e) {}
      })
      .catch(() => {});
  }, []);

  const refreshCrmAndChatsFromServer = useCallback(() => {
    fetch('/api/chats')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverChats: Record<string, ApartmentChat> | null) => {
        if (serverChats && typeof serverChats === 'object') {
          const swipedAptIds = Object.keys(serverChats).filter(
            (id) => id && id !== 'rentch-admin-support'
          );
          if (swipedAptIds.length > 0) {
            setLikedIds((prevLiked) => {
              const combined = Array.from(new Set([...prevLiked, ...swipedAptIds]));
              return combined.length === prevLiked.length ? prevLiked : combined;
            });
          }
          setChats((prev) => {
            const merged: Record<string, ApartmentChat> = { ...prev };
            for (const [aptId, srvChat] of Object.entries(serverChats)) {
              if (!srvChat) continue;
              const locChat = merged[aptId];
              if (!locChat) {
                merged[aptId] = srvChat;
              } else {
                const msgMap = new Map<string, ChatMessage>();
                (srvChat.messages || []).forEach((m) => m && m.id && msgMap.set(m.id, m));
                (locChat.messages || []).forEach((m) => m && m.id && msgMap.set(m.id, m));
                merged[aptId] = {
                  ...srvChat,
                  ...locChat,
                  messages: Array.from(msgMap.values()),
                  viewingConfirmed: Boolean(srvChat.viewingConfirmed || locChat.viewingConfirmed),
                  viewingSlot: locChat.viewingSlot || srvChat.viewingSlot,
                };
              }
            }
            try {
              localStorage.setItem('rentch_chats', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      })
      .catch(() => {});

    fetch('/api/crm/leads')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverLeads: CrmLead[] | null) => {
        if (Array.isArray(serverLeads)) {
          const leadAptIds = serverLeads
            .map((l) => l?.apartmentId)
            .filter((id): id is string => Boolean(id && id !== 'rentch-admin-support'));
          if (leadAptIds.length > 0) {
            setLikedIds((prevLiked) => {
              const combined = Array.from(new Set([...prevLiked, ...leadAptIds]));
              return combined.length === prevLiked.length ? prevLiked : combined;
            });
          }
          setCrmLeads((prev) => {
            const cleanServer = serverLeads.filter((l) => l && l.id && !/^lead-[0-9]+$/.test(l.id));
            if (cleanServer.length === 0 && prev.length === 0) return prev;
            const map = new Map<string, CrmLead>();
            cleanServer.forEach((l) => map.set(l.id, l));
            // Keep any unsynced local leads that are not yet on server
            prev.forEach((loc) => {
              if (
                loc &&
                loc.id &&
                !/^lead-[0-9]+$/.test(loc.id) &&
                !map.has(loc.id) &&
                !cleanServer.some((s) => s.apartmentId && s.apartmentId === loc.apartmentId)
              ) {
                map.set(loc.id, loc);
              }
            });
            const next = Array.from(map.values());
            try {
              localStorage.setItem('rentch_crm_leads', JSON.stringify(next));
            } catch (e) {}
            return next;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Initial sync + periodic polling for CRM leads and chats
  useEffect(() => {
    // Push any local chats/leads that exist in this browser's localStorage to server for safe merge
    try {
      const localChatsRaw = localStorage.getItem('rentch_chats');
      if (localChatsRaw) {
        const parsedChats = JSON.parse(localChatsRaw);
        if (parsedChats && typeof parsedChats === 'object' && Object.keys(parsedChats).length > 0) {
          fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chats: parsedChats }),
          }).catch(() => {});
        }
      }
      const localLeadsRaw = localStorage.getItem('rentch_crm_leads');
      if (localLeadsRaw) {
        const parsedLeads = JSON.parse(localLeadsRaw);
        if (Array.isArray(parsedLeads) && parsedLeads.length > 0) {
          fetch('/api/crm/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leads: parsedLeads, isAdminUpdate: false }),
          }).catch(() => {});
        }
      }
    } catch (e) {}

    refreshCrmAndChatsFromServer();

    const interval = setInterval(refreshCrmAndChatsFromServer, 3000);
    const handleFocus = () => refreshCrmAndChatsFromServer();
    window.addEventListener('focus', handleFocus);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('rentch_catalog');
      bc.onmessage = () => {
        refreshCrmAndChatsFromServer();
      };
    } catch (e) {}

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      if (bc) bc.close();
    };
  }, [refreshCrmAndChatsFromServer]);

  useEffect(() => {
    try {
      localStorage.setItem('rentch_crm_leads', JSON.stringify(crmLeads));
    } catch (e) {}
  }, [crmLeads]);

  useEffect(() => {
    try {
      localStorage.setItem('rentch_chats', JSON.stringify(chats));
    } catch (e) {}
  }, [chats]);

  // Filters
  const [filters, setFilters] = useState<FilterState>(() => {
    let initialCity: RentchCity = 'tbilisi';
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const cityParam =
        urlParams.get('city') ||
        urlParams.get('startapp') ||
        urlParams.get('tgWebAppStartParam') ||
        window.Telegram?.WebApp?.initDataUnsafe?.start_param;
      if (cityParam === 'tbilisi' || cityParam === 'yerevan' || cityParam === 'belgrade') {
        initialCity = cityParam;
      }
    } catch (e) {}
    return {
      city: initialCity,
      minPrice: 200,
      maxPrice: 2000,
      furniture: 'any',
      district: 'all',
      period: 'any',
      petFriendlyOnly: false,
    };
  });

  const activeCity: RentchCity = filters.city || 'tbilisi';
  const activeCityInfo = CITIES_CONFIG[activeCity];

  const handleSelectCity = useCallback((city: RentchCity, openCatalog = false) => {
    setFilters((prev) => ({
      ...prev,
      city,
      district: 'all',
    }));
    if (openCatalog) {
      setIsSplashOpen(false);
    }
  }, []);

  // Modals
  const [matchModalApartment, setMatchModalApartment] = useState<Apartment | null>(null);
  const [chatModalApartment, setChatModalApartment] = useState<Apartment | null>(null);
  const [detailsModalApartment, setDetailsModalApartment] = useState<Apartment | null>(null);
  const [focusedRoommateApartmentId, setFocusedRoommateApartmentId] = useState<string | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [isLandlordModalOpen, setIsLandlordModalOpen] = useState(false);
  const [pendingApartmentForViewing, setPendingApartmentForViewing] = useState<Apartment | null>(null);
  const [pendingViewingSlot, setPendingViewingSlot] = useState<{ date: string; time: string }>({
    date: 'Завтра',
    time: '18:00',
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-welcome',
      title: 'Добро пожаловать в Rentch!',
      message: 'Свайпайте вправо понравившиеся квартиры в Тбилиси, чтобы обсудить условия аренды и записаться на осмотр.',
      timestamp: 'только что',
      read: false,
      type: 'system',
    },
  ]);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  // Filter & recommend apartments
  const filteredApartments = useMemo(() => {
    return filterAndRecommendApartments(apartments, filters, userProfile.questionnaire);
  }, [apartments, filters, userProfile.questionnaire]);

  // Remaining cards in deck
  const remainingCards = useMemo(() => {
    return filteredApartments.filter(
      (apt) => !likedIds.includes(apt.id) && !dislikedIds.includes(apt.id)
    );
  }, [filteredApartments, likedIds, dislikedIds]);

  const currentCard = remainingCards[0] || null;
  const nextCard = remainingCards[1] || null;

  // Matched apartments list
  const matchedApartments = useMemo(() => {
    return apartments.filter((apt) => likedIds.includes(apt.id));
  }, [apartments, likedIds]);

  // Active dialogues count strictly matches right-swiped apartments
  const dialoguesCount = useMemo(() => {
    return matchedApartments.length;
  }, [matchedApartments]);

  // Initialize bot chat for an apartment
  const ensureChatInitialized = useCallback(
    (apt: Apartment) => {
      setChats((prev) => {
        if (prev[apt.id]) return prev;

        const cityFlag = apt.city === 'belgrade' ? '🇷🇸' : apt.city === 'yerevan' ? '🇦🇲' : '🇬🇪';
        const welcomeBotMsg: ChatMessage = {
          id: 'bot-welcome-' + apt.id,
          sender: 'bot',
          text: `Здравствуйте! Рады приветствовать вас в Rentch ${cityFlag}\nПоздравляем с взаимным Rentch! по квартире «${apt.title}».\nЯ виртуальный помощник. Мы готовы забронировать удобное время для очного или онлайн-просмотра квартиры.\n\nПожалуйста, нажмите на кнопку подтверждения просмотра или выберите подходящий слот, чтобы зафиксировать время встречи!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAction: true,
          actionType: 'confirm_viewing',
        };

        const nextChats = {
          ...prev,
          [apt.id]: {
            apartmentId: apt.id,
            messages: [welcomeBotMsg],
            lastActivity: 'только что',
            viewingConfirmed: false,
          },
        };
        syncChatsToServer(nextChats);
        return nextChats;
      });
    },
    [syncChatsToServer]
  );

  // Automatically record a right-swiped apartment + client contact details into CRM & server chats
  const recordRightSwipeLeadInCrm = useCallback(
    (
      apt: Apartment,
      contact: { name: string; phone: string; telegramUsername?: string }
    ) => {
      const cleanName = contact.name.trim();
      const cleanPhone = contact.phone.trim();
      const cleanTg = contact.telegramUsername?.trim() || undefined;

      if (!cleanName || !cleanPhone) return;

      try {
        localStorage.removeItem('rentch_pending_swipe_apt_id');
      } catch (e) {}

      // 1. Persist user profile so subsequent right swipes auto-record immediately
      setUserProfile((prev) => ({
        ...prev,
        name: cleanName,
        phone: cleanPhone,
        telegramUsername: cleanTg || prev.telegramUsername,
        isRegistered: true,
      }));

      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nowDate = new Date();
      const monthsRu = [
        'января',
        'февраля',
        'марта',
        'апреля',
        'мая',
        'июня',
        'июля',
        'августа',
        'сентября',
        'октября',
        'ноября',
        'декабря',
      ];
      const registeredAtFormatted = `${nowDate.getDate()} ${monthsRu[nowDate.getMonth()]} в ${timeNow}`;

      const cityFlag = apt.city === 'belgrade' ? '🇷🇸' : apt.city === 'yerevan' ? '🇦🇲' : '🇬🇪';
      const welcomeBotMsg: ChatMessage = {
        id: 'bot-welcome-' + apt.id,
        sender: 'bot',
        text: `Здравствуйте! Рады приветствовать вас в Rentch ${cityFlag}\nПоздравляем с взаимным Rentch! по квартире «${apt.title}».\nЯ виртуальный помощник. Мы готовы забронировать удобное время для очного или онлайн-просмотра квартиры.`,
        timestamp: timeNow,
        isAction: true,
        actionType: 'confirm_viewing',
      };

      const swipeLeadMsgId = `msg-swipe-lead-${apt.id}`;
      const swipeUserMsg: ChatMessage = {
        id: swipeLeadMsgId,
        sender: 'user',
        senderName: cleanName,
        text: `Здравствуйте! Меня заинтересовала квартира «${apt.title}» (свайп вправо ❤️).\nМои контактные данные: ${cleanName} (${cleanPhone})${cleanTg ? `, Telegram: ${cleanTg}` : ''}.`,
        timestamp: timeNow,
      };

      // 2. Update chat with client contact info & message
      setChats((prev) => {
        const existing = prev[apt.id];
        const existingMsgs = existing?.messages || [welcomeBotMsg];
        const filteredMsgs = existingMsgs.filter((m) => m.id !== swipeLeadMsgId);
        const nextMessages = [...filteredMsgs, swipeUserMsg];

        const nextChats: Record<string, ApartmentChat> = {
          ...prev,
          [apt.id]: {
            ...existing,
            apartmentId: apt.id,
            clientName: cleanName,
            clientPhone: cleanPhone,
            lastActivity: timeNow,
            viewingConfirmed: existing?.viewingConfirmed || false,
            viewingSlot: existing?.viewingSlot,
            messages: nextMessages,
          } as ApartmentChat,
        };
        syncChatsToServer(nextChats);
        return nextChats;
      });

      // 3. Create or update CRM lead in "Зарегистрировались в сервисе / Новые заявки"
      setCrmLeads((prev) => {
        const leadId = `crm-chat-${apt.id}`;
        const existingIdx = prev.findIndex((l) => l.apartmentId === apt.id || l.id === leadId);
        const aptSourceUrl = getMyHomeOriginalUrl(apt) || undefined;
        const existingLead = existingIdx >= 0 ? prev[existingIdx] : null;
        const existingLeadMsgs = existingLead?.messages || [welcomeBotMsg];
        const mergedLeadMsgs = [
          ...existingLeadMsgs.filter((m) => m.id !== swipeLeadMsgId),
          swipeUserMsg,
        ];

        const swipeLead: CrmLead = {
          id: existingLead?.id || leadId,
          clientName: cleanName,
          clientPhone: cleanPhone,
          clientTelegram: cleanTg || existingLead?.clientTelegram,
          stage: existingLead?.stage || 'registered',
          apartmentId: apt.id,
          apartmentTitle: apt.title,
          apartmentDistrict: apt.district,
          apartmentAddress: apt.address,
          apartmentPriceUsd: apt.priceUsd,
          apartmentImage: apt.images?.[0],
          apartmentSourceUrl: aptSourceUrl,
          viewingSlot: existingLead?.viewingSlot,
          registeredAt: existingLead?.registeredAt || registeredAtFormatted,
          questionnaireSummary: existingLead?.questionnaireSummary,
          notes:
            existingLead?.notes ||
            `Свайп вправо (Rentch! ❤️) — автоматическая заявка по объекту «${apt.title}» (${apt.address}, $${apt.priceUsd}/мес)`,
          messages: mergedLeadMsgs,
          unreadByAdmin: (existingLead?.unreadByAdmin || 0) + 1,
        };

        let nextLeads: CrmLead[];
        if (existingIdx >= 0) {
          nextLeads = [...prev];
          nextLeads[existingIdx] = swipeLead;
        } else {
          nextLeads = [swipeLead, ...prev];
        }

        // Also backfill any placeholder leads in this browser session with the user's real contact info
        nextLeads = nextLeads.map((l) => {
          if (
            l.clientName === 'Клиент Rentch' ||
            l.clientName === 'Клиент из чата' ||
            l.clientName === 'Новый арендатор' ||
            l.clientPhone === '+995 599 00-00-00'
          ) {
            return {
              ...l,
              clientName: cleanName,
              clientPhone: cleanPhone,
              clientTelegram: l.clientTelegram || cleanTg,
            };
          }
          return l;
        });

        syncLeadsToServer(nextLeads, { isAdminUpdate: false });
        return nextLeads;
      });
    },
    [syncChatsToServer, syncLeadsToServer]
  );

  // Re-open mandatory contact modal if user refreshed before submitting contacts for a right swipe
  useEffect(() => {
    try {
      const pendingAptId = localStorage.getItem('rentch_pending_swipe_apt_id');
      if (pendingAptId && apartments.length > 0 && !matchModalApartment) {
        const hasContacts = Boolean(
          userProfile.name?.trim() &&
            userProfile.phone?.trim() &&
            !FAKE_CACHED_NAMES.has(userProfile.name.trim()) &&
            !FAKE_CACHED_PHONES.has(userProfile.phone.trim())
        );
        const foundApt = apartments.find((a) => a.id === pendingAptId);
        if (foundApt && !hasContacts) {
          setMatchModalApartment(foundApt);
        } else if (foundApt && hasContacts) {
          recordRightSwipeLeadInCrm(foundApt, {
            name: userProfile.name,
            phone: userProfile.phone,
            telegramUsername: userProfile.telegramUsername,
          });
        }
      }
    } catch (e) {}
  }, [apartments, matchModalApartment, userProfile.name, userProfile.phone, userProfile.telegramUsername, recordRightSwipeLeadInCrm]);

  // Swiping actions (limited to MAX_DAILY_RIGHT_SWIPES = 5 right swipes per day)
  const handleSwipeRight = (apartment: Apartment) => {
    if (!apartment) return;

    if (!dailyRightSwipes.includes(apartment.id) && dailyRightSwipes.length >= MAX_DAILY_RIGHT_SWIPES) {
      triggerHaptic('warning');
      setIsDailyLimitModalOpen(true);
      return;
    }

    triggerHaptic('success');
    trackAnalyticsEvent('swipe_right', {
      apartmentId: apartment.id,
      apartmentTitle: apartment.title,
    });

    setDailyRightSwipes((prev) => (prev.includes(apartment.id) ? prev : [...prev, apartment.id]));
    setLikedIds((prev) => (prev.includes(apartment.id) ? prev : [...prev, apartment.id]));
    setSwipeHistory((prev) => [...prev, { id: apartment.id, action: 'like' }]);
    ensureChatInitialized(apartment);

    const hasValidContacts = Boolean(
      userProfile.name?.trim() &&
        userProfile.phone?.trim() &&
        !FAKE_CACHED_NAMES.has(userProfile.name.trim()) &&
        !FAKE_CACHED_PHONES.has(userProfile.phone.trim())
    );

    if (hasValidContacts) {
      // Immediately record into CRM with existing contact details
      recordRightSwipeLeadInCrm(apartment, {
        name: userProfile.name,
        phone: userProfile.phone,
        telegramUsername: userProfile.telegramUsername,
      });
    } else {
      // Mark pending swipe until user submits mandatory contact form in RentchMatchModal
      try {
        localStorage.setItem('rentch_pending_swipe_apt_id', apartment.id);
      } catch (e) {}
    }

    // Show celebratory "Rentch!" Match Modal (in mandatory contact mode if contacts not yet entered)
    setMatchModalApartment(apartment);
  };

  const handleSubmitSwipeContact = (
    apt: Apartment,
    contact: { name: string; phone: string; telegramUsername?: string },
    nextAction: 'chat' | 'continue' | 'roommate'
  ) => {
    recordRightSwipeLeadInCrm(apt, contact);

    if (nextAction === 'chat') {
      setMatchModalApartment(null);
      setChatModalApartment(apt);
    } else if (nextAction === 'roommate') {
      setMatchModalApartment(null);
      setFocusedRoommateApartmentId(apt.id);
      setActiveTab('roommates');
    } else {
      setMatchModalApartment(null);
    }
  };

  const handleSwipeLeft = (apartment: Apartment) => {
    if (!apartment) return;
    triggerHaptic('light');
    trackAnalyticsEvent('swipe_left', {
      apartmentId: apartment.id,
      apartmentTitle: apartment.title,
    });
    setDislikedIds((prev) => [...prev, apartment.id]);
    setSwipeHistory((prev) => [...prev, { id: apartment.id, action: 'dislike' }]);
  };

  const handleUndoSwipe = () => {
    if (swipeHistory.length === 0) return;
    triggerHaptic('medium');
    const last = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory((prev) => prev.slice(0, -1));

    if (last.action === 'like') {
      setLikedIds((prev) => prev.filter((id) => id !== last.id));
      setDailyRightSwipes((prev) => prev.filter((id) => id !== last.id));
    } else {
      setDislikedIds((prev) => prev.filter((id) => id !== last.id));
    }
  };

  const handleResetDeck = () => {
    setLikedIds([]);
    setDislikedIds([]);
    setSwipeHistory([]);
  };

  const handleOpenChat = (apt: Apartment) => {
    if (apt.id !== SUPPORT_CHAT_APARTMENT.id) {
      ensureChatInitialized(apt);
    }
    setMatchModalApartment(null);
    setChatModalApartment(apt);
  };

  const handleOpenRoommateFinder = (apt: Apartment) => {
    if (!likedIds.includes(apt.id)) {
      setLikedIds((prev) => [...prev, apt.id]);
      setDailyRightSwipes((prev) => (prev.includes(apt.id) ? prev : [...prev, apt.id]));
      ensureChatInitialized(apt);
    }
    setMatchModalApartment(null);
    setFocusedRoommateApartmentId(apt.id);
    setActiveTab('roommates');
  };

  const setupRoommateGroupDialogue = (
    apt: Apartment,
    candidate: RoommateOffer,
    openChatModal: boolean,
    incomingSwipeNotification = false
  ) => {
    if (!likedIds.includes(apt.id)) {
      setLikedIds((prev) => [...prev, apt.id]);
      setDailyRightSwipes((prev) => (prev.includes(apt.id) ? prev : [...prev, apt.id]));
    }
    const halfUsd = Math.round(apt.priceUsd / 2);
    const halfFormatted =
      apt.currency === 'EUR' || apt.city === 'belgrade'
        ? `€${halfUsd}`
        : apt.currency === 'GEL'
        ? `${Math.round((apt.priceGel || apt.priceUsd * 2.72) / 2)} ₾`
        : `$${halfUsd}`;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const roommateBotMsg: ChatMessage = {
      id: `bot-roommate-${apt.id}-${candidate.id}`,
      sender: 'bot',
      text: `👥 Совместная аренда 50/50 (Double Rentch)!\nСоздан общий диалог: Вы + ${candidate.userName} (${candidate.userAge} лет, ${candidate.occupation}) + Администратор Rentch по квартире «${apt.title}» (${halfFormatted}/мес с человека).\n\nДоговоритесь друг с другом и выберите удобное время совместного просмотра квартиры!`,
      timestamp: timeNow,
      isAction: true,
      actionType: 'confirm_viewing',
    };

    const roommateGreetingMsg: ChatMessage = {
      id: `rm-greet-${apt.id}-${candidate.id}`,
      sender: 'roommate',
      senderName: candidate.userName,
      senderAvatar: candidate.userAvatar,
      text: incomingSwipeNotification
        ? `Привет! Увидел(а) твою анкету по квартире «${apt.title}» и свайпнул(а) вправо! Готов(а) снимать её вдвоём 50/50 (по ${halfFormatted}/мес). Когда тебе удобно пойти на совместный просмотр с администратором?`
        : `Привет! Мне пришло уведомление, что ты тоже выбрал(а) «${apt.title}» и готов(а) снимать вместе 50/50! Квартира отличная, давай выберем день и время для совместного просмотра с администратором Rentch 🙌`,
      timestamp: timeNow,
    };

    const adminGroupMsg: ChatMessage = {
      id: `admin-rm-${apt.id}-${candidate.id}`,
      sender: 'landlord',
      senderName: 'Администратор Rentch',
      text: `Здравствуйте! Я администратор сервиса Rentch. Вижу ваш взаимный мэтч в разделе «Соседи» по квартире «${apt.title}» (${apt.address}). Готов организовать для вас совместный просмотр — напишите сюда удобное время или выберите слот выше!`,
      timestamp: timeNow,
    };

    setChats((prev) => {
      const existing = prev[apt.id];
      const existingMsgs = existing?.messages || [];
      const hasRoommateBot = existingMsgs.some((m) => m.id === roommateBotMsg.id);
      const nextMessages = hasRoommateBot
        ? existingMsgs
        : [...existingMsgs, roommateBotMsg, roommateGreetingMsg, adminGroupMsg];

      const nextChats: Record<string, ApartmentChat> = {
        ...prev,
        [apt.id]: {
          apartmentId: apt.id,
          messages: nextMessages,
          lastActivity: 'только что',
          viewingConfirmed: existing?.viewingConfirmed || false,
          viewingSlot: existing?.viewingSlot,
          roommate: {
            id: candidate.id,
            name: candidate.userName,
            age: candidate.userAge,
            avatar: candidate.userAvatar,
            occupation: candidate.occupation,
            telegram: candidate.telegram,
          },
        },
      };
      syncChatsToServer(nextChats);
      return nextChats;
    });

    // Sync joint 50/50 lead to Admin CRM so administrator sees both roommates
    setCrmLeads((prev) => {
      const leadId = `crm-chat-${apt.id}`;
      const matchIdx = prev.findIndex((l) => l.apartmentId === apt.id || l.id === leadId);
      const aptSourceUrl = getMyHomeOriginalUrl(apt) || undefined;
      const noteText = `👥 Совместная аренда 50/50 (Соседи): клиент + ${candidate.userName} (${candidate.userAge} лет, ${candidate.telegram || candidate.occupation}) по объекту «${apt.title}»`;

      let nextLeads: CrmLead[];
      if (matchIdx >= 0) {
        const ex = prev[matchIdx];
        const updated: CrmLead = {
          ...ex,
          notes: noteText,
          messages: [...(ex.messages || []), roommateGreetingMsg, adminGroupMsg],
          unreadByAdmin: (ex.unreadByAdmin || 0) + 1,
        };
        nextLeads = [...prev];
        nextLeads[matchIdx] = updated;
      } else {
        const newLead: CrmLead = {
          id: leadId,
          clientName: `${userProfile.name || 'Клиент'} + ${candidate.userName} (50/50)`,
          clientPhone: userProfile.phone || '+995 599 00-00-00',
          clientTelegram: userProfile.telegramUsername || candidate.telegram,
          stage: 'registered',
          apartmentId: apt.id,
          apartmentTitle: apt.title,
          apartmentDistrict: apt.district,
          apartmentAddress: apt.address,
          apartmentPriceUsd: apt.priceUsd,
          apartmentImage: apt.images?.[0],
          apartmentSourceUrl: aptSourceUrl,
          registeredAt: 'Только что',
          notes: noteText,
          messages: [roommateGreetingMsg, adminGroupMsg],
          unreadByAdmin: 1,
        };
        nextLeads = [newLead, ...prev];
      }
      syncLeadsToServer(nextLeads, { isAdminUpdate: false });
      return nextLeads;
    });

    // Push notification & toast
    const notif: NotificationItem = {
      id: 'notif-rm-' + Date.now(),
      title: incomingSwipeNotification
        ? `🔔 С вами готовы поселиться! (${candidate.userName}, ${candidate.userAge})`
        : `👥 Совместный Rentch 50/50 с ${candidate.userName}!`,
      message: incomingSwipeNotification
        ? `${candidate.userName} тоже выбрал(а) «${apt.title}» и свайпнул(а) вас вправо! Открыт общий чат с соседом и администратором.`
        : `Пользователю ${candidate.userName} отправлено уведомление. Открыт общий диалог (Вы + ${candidate.userName} + Администратор) для записи на совместный просмотр!`,
      timestamp: 'только что',
      apartmentId: apt.id,
      read: false,
      type: 'match',
    };
    setNotifications((prev) => [notif, ...prev]);
    setActiveToast(notif);

    if (openChatModal) {
      setChatModalApartment(apt);
    }
  };

  const handleMatchWithRoommate = (apt: Apartment, candidate: RoommateOffer) => {
    setupRoommateGroupDialogue(apt, candidate, true, false);
  };

  const handleRoommateSwipedRight = (
    apt: Apartment,
    candidate: RoommateOffer,
    contactOverride?: { name: string; phone: string; telegramUsername?: string }
  ) => {
    if (contactOverride?.name && contactOverride?.phone) {
      recordRightSwipeLeadInCrm(apt, contactOverride);
    }
    setupRoommateGroupDialogue(apt, candidate, false, false);
  };

  const handlePublishRoommateOffer = (apt: Apartment, _userOffer: RoommateOffer) => {
    // Simulate another tenant who also chose this apartment swiping right on the user's offer,
    // sending the user a real-time notification that someone is ready to move in together!
    setTimeout(() => {
      const incomingPartner: RoommateOffer = {
        id: 'rm-incoming-' + Date.now(),
        apartmentId: apt.id,
        city: activeCity,
        userName: 'Давид',
        userAge: 26,
        userAvatar:
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=900&q=85',
        occupation: 'Product Designer · Удалёнка',
        bubbleText:
          'Тоже выбрал эту квартиру! С радостью сниму её вдвоём 50/50 и пойду на совместный просмотр.',
        interests: ['Кофе', 'Чистоплотность', 'Удалёнка'],
        moveInDate: 'Готов к просмотру завтра',
        verified: true,
        createdAt: 'Только что',
        telegram: '@david_rentch',
      };
      setupRoommateGroupDialogue(apt, incomingPartner, false, true);
    }, 1800);
  };

  const handleSendMessage = (apartmentId: string, message: ChatMessage) => {
    setChats((prev) => {
      const existing = prev[apartmentId] || {
        apartmentId,
        messages: [],
        lastActivity: 'только что',
        viewingConfirmed: false,
      };
      const nextChats = {
        ...prev,
        [apartmentId]: {
          ...existing,
          messages: [...existing.messages, message],
          lastActivity: 'только что',
        },
      };
      syncChatsToServer(nextChats);
      return nextChats;
    });

    // If message is from user, sync with CRM lead so admin can see and reply
    if (message.sender === 'user') {
      const apt =
        apartments.find((a) => a.id === apartmentId) ||
        (apartmentId === SUPPORT_CHAT_APARTMENT.id ? SUPPORT_CHAT_APARTMENT : undefined);
      setCrmLeads((prev) => {
        let matchIdx = prev.findIndex((l) => l.apartmentId === apartmentId);
        if (matchIdx < 0) {
          matchIdx = prev.findIndex(
            (l) =>
              !l.apartmentId &&
              ((userProfile.phone && l.clientPhone === userProfile.phone) ||
                (userProfile.name && l.clientName === userProfile.name))
          );
        }

        let nextLeads: CrmLead[];
        if (matchIdx >= 0) {
          const existingLead = prev[matchIdx];
          const existingMsgs = existingLead.messages || [];
          const aptSourceUrl = apt ? getMyHomeOriginalUrl(apt) || undefined : getMyHomeOriginalUrl({ id: apartmentId }) || undefined;
          const updatedLead: CrmLead = {
            ...existingLead,
            clientName:
              userProfile.name &&
              (existingLead.clientName === 'Клиент из чата' || existingLead.clientName === 'Клиент Rentch')
                ? userProfile.name
                : existingLead.clientName,
            clientPhone:
              userProfile.phone && existingLead.clientPhone === '+995 599 00-00-00'
                ? userProfile.phone
                : existingLead.clientPhone,
            apartmentId: existingLead.apartmentId || (apt ? apt.id : apartmentId),
            apartmentTitle: existingLead.apartmentTitle || (apt ? apt.title : undefined),
            apartmentDistrict: existingLead.apartmentDistrict || (apt ? apt.district : undefined),
            apartmentAddress: existingLead.apartmentAddress || (apt ? apt.address : undefined),
            apartmentPriceUsd: existingLead.apartmentPriceUsd || (apt ? apt.priceUsd : undefined),
            apartmentImage: existingLead.apartmentImage || (apt ? apt.images?.[0] : undefined),
            apartmentSourceUrl: existingLead.apartmentSourceUrl || aptSourceUrl,
            messages: [...existingMsgs.filter((m) => m.id !== message.id), message],
            unreadByAdmin: (existingLead.unreadByAdmin || 0) + 1,
          };
          nextLeads = [...prev];
          nextLeads[matchIdx] = updatedLead;
        } else {
          const aptSourceUrl = apt ? getMyHomeOriginalUrl(apt) || undefined : getMyHomeOriginalUrl({ id: apartmentId }) || undefined;
          const newChatLead: CrmLead = {
            id: `crm-chat-${apartmentId}`,
            clientName: userProfile.name || 'Клиент из чата',
            clientPhone: userProfile.phone || '+995 599 00-00-00',
            clientTelegram: userProfile.telegramUsername,
            stage: chats[apartmentId]?.viewingConfirmed ? 'viewing_scheduled' : 'registered',
            apartmentId: apt?.id || apartmentId,
            apartmentTitle: apt?.title || 'Квартира в Тбилиси',
            apartmentDistrict: apt?.district,
            apartmentAddress: apt?.address,
            apartmentPriceUsd: apt?.priceUsd,
            apartmentImage: apt?.images?.[0],
            apartmentSourceUrl: aptSourceUrl,
            viewingSlot: chats[apartmentId]?.viewingSlot,
            registeredAt: 'Только что',
            notes: apt ? `Написал в чат по объекту «${apt.title}»` : 'Написал в чат поддержки',
            messages: [message],
            unreadByAdmin: 1,
          };
          nextLeads = [newChatLead, ...prev];
        }
        syncLeadsToServer(nextLeads, { isAdminUpdate: false });
        return nextLeads;
      });

      // If this chat is a 3-way roommate dialogue, let the matched roommate reply so they can coordinate viewing
      const activeRoommate = chats[apartmentId]?.roommate;
      if (activeRoommate) {
        const userRoommateRepliesCount = (chats[apartmentId]?.messages || []).filter(
          (m) => m.sender === 'roommate'
        ).length;
        if (userRoommateRepliesCount <= 2) {
          setTimeout(() => {
            const replyText =
              userRoommateRepliesCount === 1
                ? `Отлично! Мне подходит это время 👍 Администратор Rentch, запишите нас, пожалуйста, вдвоём на совместный просмотр квартиры!`
                : `Супер, договорились! Буду на связи перед просмотром 🙌`;
            const rmReply: ChatMessage = {
              id: 'rm-reply-' + Date.now(),
              sender: 'roommate',
              senderName: activeRoommate.name,
              senderAvatar: activeRoommate.avatar,
              text: replyText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setChats((prevChats) => {
              const ex = prevChats[apartmentId];
              if (!ex) return prevChats;
              const updatedChats = {
                ...prevChats,
                [apartmentId]: {
                  ...ex,
                  messages: [...ex.messages, rmReply],
                  lastActivity: 'только что',
                },
              };
              syncChatsToServer(updatedChats);
              return updatedChats;
            });
          }, 1200);
        }
      }
    }
  };

  // Administrator sends message to CRM lead
  const handleAdminSendMessage = (leadId: string, text: string) => {
    const targetLead = crmLeads.find((l) => l.id === leadId);
    if (!targetLead) return;

    const adminMsg: ChatMessage = {
      id: 'admin-msg-' + Date.now(),
      sender: 'landlord',
      senderName: 'Администратор Rentch',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 1. Update lead messages in CRM
    setCrmLeads((prev) => {
      const next = prev.map((l) => {
        if (l.id !== leadId) return l;
        return {
          ...l,
          messages: [...(l.messages || []), adminMsg],
          unreadByAdmin: 0,
        };
      });
      syncLeadsToServer(next, { isAdminUpdate: true });
      return next;
    });

    // 2. Sync to client's chat (either the lead's apartmentId or direct support chat)
    const targetChatId = targetLead.apartmentId || SUPPORT_CHAT_APARTMENT.id;
    setChats((prev) => {
      const existing = prev[targetChatId] || {
        apartmentId: targetChatId,
        messages: [],
        lastActivity: 'только что',
        viewingConfirmed: false,
      };
      const nextChats = {
        ...prev,
        [targetChatId]: {
          ...existing,
          messages: [...existing.messages, adminMsg],
          lastActivity: 'только что',
        },
      };
      syncChatsToServer(nextChats);
      return nextChats;
    });
  };

  const handleMarkLeadRead = (leadId: string) => {
    setCrmLeads((prev) => {
      const next = prev.map((l) => (l.id === leadId ? { ...l, unreadByAdmin: 0 } : l));
      syncLeadsToServer(next, { isAdminUpdate: true });
      return next;
    });
  };

  const handleAdminUpdateLeads = (updatedLeads: CrmLead[]) => {
    if (!isAdminLoggedIn && sessionStorage.getItem('rentch_admin_auth') !== 'true') return;
    // Check if a lead was deleted compared to current crmLeads
    const deletedLeads = crmLeads.filter((oldL) => !updatedLeads.some((newL) => newL.id === oldL.id));
    setCrmLeads(updatedLeads);
    if (deletedLeads.length > 0) {
      deletedLeads.forEach((dl) => {
        fetch(`/api/crm/leads/${encodeURIComponent(dl.id)}`, {
          method: 'DELETE',
          headers: getAdminAuthHeaders(),
        }).catch(() => {});
      });
    } else {
      syncLeadsToServer(updatedLeads, { isAdminUpdate: true, replace: true });
    }
  };

  const handleClearAllLeads = () => {
    if (!isAdminLoggedIn && sessionStorage.getItem('rentch_admin_auth') !== 'true') return;
    setCrmLeads([]);
    try {
      localStorage.setItem('rentch_crm_leads', '[]');
    } catch (e) {}
    fetch('/api/crm/leads', {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    }).catch(() => {});
  };

  const handleRequestRegistration = (apt: Apartment, date?: string, time?: string) => {
    setPendingApartmentForViewing(apt);
    if (date && time) {
      setPendingViewingSlot({ date, time });
    }
    setIsQuestionnaireOpen(true);
  };

  // Confirm viewing & synchronize with CRM (Column "Записались на осмотр")
  const handleConfirmViewing = (
    apartmentId: string,
    date: string,
    time: string,
    overrideProfile?: UserProfile
  ) => {
    const apt = apartments.find((a) => a.id === apartmentId);
    if (!apt) return;

    const activeProfile = overrideProfile || userProfile;

    // 1. User message
    const userMsg: ChatMessage = {
      id: 'msg-confirm-' + Date.now(),
      sender: 'user',
      senderName: activeProfile.name || 'Клиент',
      text: `Здравствуйте! Я подтверждаю бронирование осмотра квартиры на ${date} в ${time}.\nМои контактные данные: ${activeProfile.name || 'Клиент'} (${activeProfile.phone || '+995 599 00-00-00'}).`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 2. Bot message
    const botMsg: ChatMessage = {
      id: 'bot-confirmed-' + Date.now(),
      sender: 'bot',
      text: `✅ Отлично! Осмотр забронирован на ${date} в ${time}.\nЗаявка передана в отдел аренды. Ждём вас по адресу: ${apt.address}!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAction: true,
      actionType: 'viewing_scheduled',
    };

    setChats((prev) => {
      const existing = prev[apartmentId];
      const nextChats = {
        ...prev,
        [apartmentId]: {
          ...existing,
          apartmentId,
          lastActivity: 'только что',
          messages: [...(existing?.messages || []), userMsg, botMsg],
          viewingConfirmed: true,
          viewingSlot: { date, time },
        },
      };
      syncChatsToServer(nextChats);
      return nextChats;
    });

    // 3. Sync to CRM Kanban Column "Записались на осмотр"
    setCrmLeads((prev) => {
      let existingLeadIndex = prev.findIndex((l) => l.apartmentId === apt.id);
      if (existingLeadIndex < 0) {
        existingLeadIndex = prev.findIndex(
          (l) => !l.apartmentId && activeProfile.phone && l.clientPhone === activeProfile.phone
        );
      }

      const existingLead = existingLeadIndex >= 0 ? prev[existingLeadIndex] : null;
      const aptSourceUrl = getMyHomeOriginalUrl(apt) || undefined;
      const updatedLead: CrmLead = {
        id: existingLead?.id || `crm-chat-${apt.id}`,
        clientName: activeProfile.name || existingLead?.clientName || 'Новый арендатор',
        clientPhone: activeProfile.phone || existingLead?.clientPhone || '+995 599 00-00-00',
        clientTelegram: activeProfile.telegramUsername || existingLead?.clientTelegram,
        stage: 'viewing_scheduled',
        apartmentId: apt.id,
        apartmentTitle: apt.title,
        apartmentDistrict: apt.district,
        apartmentAddress: apt.address,
        apartmentPriceUsd: apt.priceUsd,
        apartmentImage: apt.images?.[0],
        apartmentSourceUrl: aptSourceUrl,
        viewingSlot: { date, time },
        registeredAt: 'Только что',
        questionnaireSummary: existingLead?.questionnaireSummary,
        notes: `Запись через приложение Rentch на осмотр объекта ${apt.title} (${date} в ${time})`,
        messages: [...(existingLead?.messages || []), userMsg, botMsg],
        unreadByAdmin: (existingLead?.unreadByAdmin || 0) + 1,
      };

      let nextLeads: CrmLead[];
      if (existingLeadIndex >= 0) {
        nextLeads = [...prev];
        nextLeads[existingLeadIndex] = updatedLead;
      } else {
        nextLeads = [updatedLead, ...prev];
      }
      syncLeadsToServer(nextLeads, { isAdminUpdate: false });
      return nextLeads;
    });

    // Notification
    const newNotif: NotificationItem = {
      id: 'notif-viewing-' + Date.now(),
      title: 'Осмотр забронирован!',
      message: `Осмотр квартиры «${apt.title}» зафиксирован на ${date} в ${time}.`,
      timestamp: 'только что',
      apartmentId: apt.id,
      read: false,
      type: 'viewing_confirmed',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast(newNotif);

    // Simulated friendly landlord follow up
    setTimeout(() => {
      const landlordGreeting: ChatMessage = {
        id: 'landlord-welcome-' + Date.now(),
        sender: 'landlord',
        senderName: 'Служба заботы Rentch',
        text: `Добрый день, ${activeProfile.name || 'Клиент'}! Осмотр на ${date} в ${time} подтверждён. Квартира на ${apt.address} готова к показу. До встречи!\n\nТелефон для связи: +995 558 542 365`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChats((prev) => {
        const chat = prev[apartmentId];
        if (!chat) return prev;
        const nextChats = {
          ...prev,
          [apartmentId]: {
            ...chat,
            messages: [...chat.messages, landlordGreeting],
          },
        };
        syncChatsToServer(nextChats);
        return nextChats;
      });
    }, 1500);
  };

  // Questionnaire completion & CRM sync (Column "Зарегистрировались в сервисе")
  const handleQuestionnaireComplete = (profile: UserProfile, answers: QuestionnaireAnswers) => {
    setUserProfile(profile);
    setIsQuestionnaireOpen(false);

    // If pending viewing, complete it directly (which creates/updates the viewing_scheduled lead)
    if (pendingApartmentForViewing) {
      handleConfirmViewing(
        pendingApartmentForViewing.id,
        pendingViewingSlot.date,
        pendingViewingSlot.time,
        profile
      );
      setPendingApartmentForViewing(null);
      return;
    }

    // Sync to CRM Kanban Column "Зарегистрировались в сервисе"
    const newCrmLead: CrmLead = {
      id: 'crm-registered-' + Date.now(),
      clientName: profile.name || 'Пользователь сервиса',
      clientPhone: profile.phone || '+995 599 00-00-00',
      clientTelegram: profile.telegramUsername,
      stage: 'registered',
      registeredAt: 'Только что',
      questionnaireSummary: {
        period: answers.period === 'month' ? 'на месяц' : answers.period === 'month_to_year' ? 'от 1 до 12 мес' : 'от года',
        peopleCount: answers.peopleCount,
        pets: answers.hasPets === 'none' ? 'Нет' : answers.hasPets === 'dog' ? 'Собака' : answers.hasPets === 'cat' ? 'Кошка' : 'Другие',
        district: answers.preferredDistrict === 'all' ? 'Все районы' : answers.preferredDistrict,
      },
      notes: 'Успешно прошёл регистрацию и заполнил анкету арендатора в приложении Rentch.',
    };

    setCrmLeads((prev) => {
      const next = [newCrmLead, ...prev];
      syncLeadsToServer(next, { isAdminUpdate: false });
      return next;
    });
  };

  // Authentication Handlers
  const handleLoginTenant = (profileData: Partial<UserProfile>) => {
    setIsAdminLoggedIn(false);
    setIsLandlordLoggedIn(false);
    sessionStorage.removeItem('rentch_admin_auth');
    sessionStorage.removeItem('rentch_landlord_auth');
    if (activeTab === 'landlord' || activeTab === 'admin') {
      setActiveTab('swipe');
    }

    setUserProfile((prev) => ({
      ...prev,
      ...profileData,
      isRegistered: true,
    }));

    // Ensure tenant is registered in CRM so administrator can message them
    setCrmLeads((prev) => {
      const phone = profileData.phone || '+995 599 00-00-00';
      const name = profileData.name || 'Арендатор';
      const exists = prev.some((l) => l.clientPhone === phone || l.clientName === name);
      if (exists) return prev;
      const newLead: CrmLead = {
        id: 'lead-reg-' + Date.now(),
        clientName: name,
        clientPhone: phone,
        clientTelegram: profileData.telegramUsername,
        stage: 'registered',
        registeredAt: 'Только что',
        notes: 'Авторизовался в сервисе Rentch как арендатор.',
        messages: [],
      };
      const next = [newLead, ...prev];
      syncLeadsToServer(next, { isAdminUpdate: false });
      return next;
    });
  };

  const handleLoginLandlord = (landlordData: LandlordAuthData) => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('rentch_admin_auth');
    setIsLandlordLoggedIn(true);
    sessionStorage.setItem('rentch_landlord_auth', 'true');
    setLandlordProfile(landlordData);
    setActiveTab('landlord');
    const newNotif: NotificationItem = {
      id: 'notif-landlord-login-' + Date.now(),
      title: 'Раздел арендодателя',
      message: `Добро пожаловать, ${landlordData.name}! В этом разделе вы можете разместить свою квартиру в сервисе Rentch.`,
      timestamp: 'только что',
      read: false,
      type: 'system',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast(newNotif);
  };

  const handleLoginAdmin = () => {
    setIsLandlordLoggedIn(false);
    sessionStorage.removeItem('rentch_landlord_auth');
    setIsAdminLoggedIn(true);
    sessionStorage.setItem('rentch_admin_auth', 'true');
    setIsSplashOpen(false);
    setActiveTab('admin');
    const newNotif: NotificationItem = {
      id: 'notif-admin-' + Date.now(),
      title: 'Режим Администратора',
      message: 'Вы успешно вошли как администратор. Доступна CRM и панель объектов.',
      timestamp: 'только что',
      read: false,
      type: 'new_listing',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast(newNotif);
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setIsLandlordLoggedIn(false);
    clearAdminSession();
    sessionStorage.removeItem('rentch_landlord_auth');
    localStorage.removeItem('rentch_user_profile');
    localStorage.removeItem('rentch_landlord_profile');
    setUserProfile({
      id: 'user-default',
      name: '',
      phone: '',
      email: '',
      telegramUsername: '',
      isRegistered: false,
      questionnaireCompleted: false,
      telegramNotificationsEnabled: false,
    });
    if (activeTab === 'admin' || activeTab === 'landlord') {
      setActiveTab('swipe');
    }
  };

  // Property addition handlers for Admin
  const handleAddApartment = (newApt: Apartment) => {
    setApartments((prev) => [newApt, ...prev.filter((a) => a.id !== newApt.id)]);
    // Ensure new apartment is ready for instant swiping
    setLikedIds((prev) => prev.filter((id) => id !== newApt.id));
    setDislikedIds((prev) => prev.filter((id) => id !== newApt.id));

    // Save to server so all users can see it immediately, and apply server auto-translation
    fetch('/api/apartments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApt),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.apartment) {
          setApartments((prev) => [data.apartment, ...prev.filter((a) => a.id !== data.apartment.id)]);
        }
      })
      .catch((err) => console.warn('Server save error:', err));

    // Expand price filter if new apartment is outside current filter range
    setFilters((prev) => ({
      ...prev,
      minPrice: Math.min(prev.minPrice, newApt.priceUsd),
      maxPrice: Math.max(prev.maxPrice, newApt.priceUsd),
    }));

    // Notify client in-app
    const priceText = newApt.currency === 'GEL'
      ? `${newApt.priceGel || Math.round(newApt.priceUsd * 2.72)} ₾/мес (~$${newApt.priceUsd})`
      : `$${newApt.priceUsd}/мес (~${newApt.priceGel || Math.round(newApt.priceUsd * 2.72)} ₾)`;

    const newNotif: NotificationItem = {
      id: 'notif-new-' + Date.now(),
      type: 'new_listing',
      title: 'Новый объект в Rentch!',
      message: `${newApt.title} в районе ${newApt.district} (${priceText}) добавлен и предложен клиентам!`,
      timestamp: 'только что',
      read: false,
      apartmentId: newApt.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast(newNotif);
  };

  const handleDeleteApartment = (id: string) => {
    setApartments((prev) => prev.filter((a) => a.id !== id));
    fetch(`/api/apartments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    }).catch((err) => console.warn('Server delete error:', err));
  };

  const handleUpdateApartment = (updatedApt: Apartment) => {
    setApartments((prev) => prev.map((a) => (a.id === updatedApt.id ? updatedApt : a)));
    fetch('/api/apartments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedApt),
    }).catch((err) => console.warn('Server update error:', err));
  };

  const handleAddApartmentFromLandlord = (newApt: Apartment) => {
    // 1. Add to state
    setApartments((prev) => [newApt, ...prev.filter((a) => a.id !== newApt.id)]);

    // 2. Persist to server API
    fetch('/api/apartments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApt),
    })
      .then((res) => res.json())
      .then(() => {
        try {
          const bc = new BroadcastChannel('rentch_catalog');
          bc.postMessage({ action: 'apartment_added', id: newApt.id });
          bc.close();
        } catch (e) {}
      })
      .catch((err) => console.warn('Server save error:', err));

    // 3. Register as CRM Lead for admin follow-up
    const newLead: CrmLead = {
      id: 'crm-landlord-' + Date.now(),
      clientName: newApt.landlord.name || 'Арендодатель',
      clientPhone: newApt.landlord.phone || '+995 558 00-00-00',
      stage: 'registered',
      apartmentId: newApt.id,
      apartmentTitle: newApt.title,
      apartmentDistrict: newApt.district,
      apartmentAddress: newApt.address,
      apartmentPriceUsd: newApt.priceUsd,
      apartmentImage: newApt.images?.[0],
      registeredAt: 'Только что',
      notes: `Новое объявление от собственника: ${newApt.address} ($${newApt.priceUsd}/мес).`,
    };
    setCrmLeads((prev) => {
      const next = [newLead, ...prev];
      syncLeadsToServer(next, { isAdminUpdate: false });
      return next;
    });

    // 4. Notification
    const notif: NotificationItem = {
      id: 'notif-landlord-' + Date.now(),
      title: 'Квартира опубликована!',
      message: `Ваша квартира «${newApt.title}» добавлена в каталог Rentch и доступна для свайпов.`,
      timestamp: 'только что',
      apartmentId: newApt.id,
      read: false,
      type: 'new_listing',
    };
    setNotifications((prev) => [notif, ...prev]);
    setActiveToast(notif);
  };

  const hasActiveFilters = 
    filters.minPrice > 200 || 
    filters.maxPrice < 2000 || 
    filters.furniture !== 'any' || 
    filters.district !== 'all' || 
    filters.period !== 'any' || 
    filters.petFriendlyOnly;

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-stone-50 flex flex-col selection:bg-rose-500 selection:text-white font-sans text-stone-900">
      <SplashScreen
        isOpen={isSplashOpen}
        onStart={() => setIsSplashOpen(false)}
        onSelectCity={(city) => handleSelectCity(city, true)}
        activeCity={activeCity}
        apartments={apartments}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        featuredApartment={apartments[0]}
      />
      <OfflineIndicator />
      {/* Top minimal header with official Rentch logo and Auth Button */}
      <TopBar
        notifications={notifications}
        onOpenNotifications={() => setActiveTab('dialogues')}
        isAdmin={isAdminLoggedIn}
        isLandlord={isLandlordLoggedIn}
        landlordName={landlordProfile?.name}
        userProfile={userProfile}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSplash={() => {
          setIsSplashOpen(true);
        }}
        onOpenCrm={() => {
          setIsSplashOpen(false);
          setActiveTab('admin');
        }}
        activeCity={activeCity}
        onChangeCity={(city) => handleSelectCity(city, false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        matchesCount={matchedApartments.length}
        dialoguesCount={dialoguesCount}
        onOpenFilters={() => setIsFilterDrawerOpen(true)}
        webCatalogMode={webCatalogMode}
        onChangeWebCatalogMode={setWebCatalogMode}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-6xl w-full min-w-0 mx-auto p-2.5 sm:p-6 flex flex-col overflow-x-hidden">
        {/* Real-time Toast notification */}
        <RealTimeNotificationToast
          notification={activeToast}
          onDismiss={() => setActiveToast(null)}
          onClick={(notif) => {
            setActiveToast(null);
            const apt = apartments.find((a) => a.id === notif.apartmentId);
            if (apt) {
              if (notif.type === 'match' || notif.type === 'viewing_confirmed') {
                handleOpenChat(apt);
              } else {
                setDetailsModalApartment(apt);
              }
            }
          }}
        />

        {/* 1. Tinder Swipe View + Full Web Catalog Grid Mode */}
        {activeTab === 'swipe' && (
          <div
            className={`flex-1 flex flex-col items-center justify-start min-w-0 mx-auto w-full pb-24 ${
              webCatalogMode === 'grid' ? 'max-w-6xl' : 'max-w-md justify-center'
            }`}
          >
            {/* Mode Switcher: Свайпы карточек vs Каталог плиткой (Web) */}
            <div className="w-full mb-2.5 px-0.5 flex items-center justify-between gap-2">
              <div className="inline-flex items-center bg-white p-1 rounded-2xl border border-stone-200/90 shadow-2xs">
                <button
                  type="button"
                  id="mode-switch-swipe-btn"
                  onClick={() => setWebCatalogMode('swipe')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    webCatalogMode === 'swipe'
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>Свайпы</span>
                </button>
                <button
                  type="button"
                  id="mode-switch-grid-btn"
                  onClick={() => setWebCatalogMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    webCatalogMode === 'grid'
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                  <span>Каталог плиткой ({filteredApartments.length})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('roommates')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-2xs transition cursor-pointer shrink-0"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Double Rentch 50/50</span>
              </button>
            </div>

            {webCatalogMode === 'grid' ? (
              <div className="w-full space-y-4">
                <div className="max-w-xl">
                  <QuickFilterBar
                    filters={filters}
                    onUpdateFilters={setFilters}
                    onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
                    matchingCount={filteredApartments.length}
                  />
                </div>

                {filteredApartments.length === 0 ? (
                  <div className="w-full rounded-3xl border-2 border-dashed border-stone-200 bg-white p-10 text-center space-y-3">
                    <h3 className="text-lg font-bold text-stone-900">
                      Нет подходящих квартир по текущему фильтру
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setFilters({
                          city: activeCity,
                          minPrice: 200,
                          maxPrice: 2000,
                          furniture: 'any',
                          district: 'all',
                          period: 'any',
                          petFriendlyOnly: false,
                        })
                      }
                      className="px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Сбросить фильтры
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredApartments.map((apt) => {
                      const isLiked = likedIds.includes(apt.id);
                      const priceSymbol =
                        apt.currency === 'EUR' || apt.city === 'belgrade' ? '€' : '$';
                      const halfPrice = Math.round(apt.priceUsd / 2);
                      return (
                        <div
                          key={apt.id}
                          className="bg-white rounded-3xl border border-stone-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                        >
                          <div>
                            <div
                              onClick={() => {
                                trackAnalyticsEvent('apartment_view', {
                                  apartmentId: apt.id,
                                  apartmentTitle: apt.title,
                                });
                                setDetailsModalApartment(apt);
                              }}
                              className="relative h-56 w-full bg-stone-900 overflow-hidden cursor-pointer"
                            >
                              <img
                                src={apt.images[0]}
                                alt={apt.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                <span className="px-2.5 py-1 rounded-xl bg-stone-950/80 backdrop-blur-xs text-white font-black text-xs border border-white/15">
                                  {priceSymbol}
                                  {apt.priceUsd}/мес
                                </span>
                                <span className="px-2 py-1 rounded-xl bg-emerald-500/90 text-stone-950 font-black text-[10px]">
                                  50/50: {priceSymbol}
                                  {halfPrice}
                                </span>
                              </div>
                              {isLiked && (
                                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-rose-500 text-white font-black text-[10px]">
                                  В моих Rentch! ❤️
                                </span>
                              )}
                              <div className="absolute bottom-3 inset-x-3 text-left text-white">
                                <div className="text-[11px] text-amber-300 font-semibold flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{apt.district}</span>
                                </div>
                                <h4 className="font-bold text-sm truncate mt-0.5">{apt.title}</h4>
                              </div>
                            </div>

                            <div className="p-3.5 space-y-2">
                              <div className="flex items-center justify-between text-xs text-stone-600">
                                <span className="inline-flex items-center gap-1 font-semibold">
                                  <BedDouble className="w-3.5 h-3.5 text-rose-500" />
                                  {apt.rooms} комн. ({apt.bedrooms} спальни)
                                </span>
                                <span className="inline-flex items-center gap-1 font-semibold">
                                  <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                                  {apt.areaSqm} м² · {apt.floor}/{apt.totalFloors} эт.
                                </span>
                              </div>
                              <p className="text-xs text-stone-500 truncate">{apt.address}</p>
                            </div>
                          </div>

                          <div className="px-3.5 pb-3.5 pt-1 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleSwipeRight(apt)}
                              className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition"
                            >
                              <Heart className="w-3.5 h-3.5 fill-white" />
                              <span>{isLiked ? 'Открыть Rentch!' : 'Rentch! (Заявка)'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRoommateFinder(apt)}
                              className="py-2.5 px-3 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                            >
                              <Users className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Сосед 50/50</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
            <>
            {/* Swipe Deck Container */}
            <div 
              id="swipe-deck-container"
              className="relative w-full max-w-full min-w-0 flex flex-col items-center"
            >
              {/* Quick Filter Buttons inside swipe-deck-container */}
              <div className="w-full mb-2.5 px-0.5 space-y-2">
                <QuickFilterBar
                  filters={filters}
                  onUpdateFilters={setFilters}
                  onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
                  matchingCount={filteredApartments.length}
                />

                {/* Daily Right Swipe Limit Indicator */}
                <div className="flex items-center justify-between px-3 py-1.5 rounded-2xl bg-white border border-stone-200/80 shadow-2xs text-xs">
                  <div className="flex items-center gap-1.5 text-stone-600 font-semibold">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span>Свайпов вправо сегодня:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-black px-2 py-0.5 rounded-lg text-[11px] ${
                        dailyRightSwipes.length >= MAX_DAILY_RIGHT_SWIPES
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {dailyRightSwipes.length} / {MAX_DAILY_RIGHT_SWIPES} квартир
                    </span>
                  </div>
                </div>
              </div>

              {/* Cards Stage Container */}
              <div 
                id="swipe-deck-stage"
                className="relative w-full h-[560px] sm:h-[600px]"
              >
              {remainingCards.length > 0 ? (
                <>
                  {/* Underneath Card */}
                  {nextCard && (
                    <div className="absolute inset-0 w-full h-full scale-[0.96] translate-y-2 opacity-60 pointer-events-none">
                      <SwipeCard
                        apartment={nextCard}
                        onSwipe={() => {}}
                        onInfoClick={() => {}}
                        isTopCard={false}
                      />
                    </div>
                  )}

                  {/* Active Top Card */}
                  {currentCard && (
                    <SwipeCard
                      key={currentCard.id}
                      apartment={currentCard}
                      onSwipe={(dir) => {
                        if (dir === 'right') handleSwipeRight(currentCard);
                        else handleSwipeLeft(currentCard);
                      }}
                      onInfoClick={(apt) => {
                        trackAnalyticsEvent('apartment_view', {
                          apartmentId: apt.id,
                          apartmentTitle: apt.title,
                        });
                        setDetailsModalApartment(apt);
                      }}
                      isTopCard={true}
                    />
                  )}
                </>
              ) : (
                /* Empty deck state */
                <div 
                  id="empty-deck-card"
                  className="w-full h-full rounded-3xl border-2 border-dashed border-stone-200 bg-white p-8 flex flex-col items-center justify-center text-center shadow-sm"
                >
                  {apartments.length === 0 ? (
                    <>
                      <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100 shadow-sm">
                        <Building2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-extrabold text-stone-900">База квартир обновляется</h3>
                      <p className="text-xs sm:text-sm text-stone-500 mt-2 max-w-xs leading-relaxed">
                        Новые объекты недвижимости скоро появятся в ленте.
                      </p>

                      {isAdminLoggedIn && (
                        <div className="flex flex-col gap-2.5 mt-6 w-full max-w-xs">
                          <button
                            type="button"
                            onClick={() => setActiveTab('admin')}
                            className="w-full bg-stone-900 hover:bg-black text-white font-bold py-3 px-5 rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Открыть панель CRM и загрузку объектов
                          </button>
                        </div>
                      )}
                    </>
                  ) : filteredApartments.length === 0 ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                        <SlidersHorizontal className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-stone-900">
                        {activeCityInfo.flag} Раздел «{activeCityInfo.nameRu}»
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-500 mt-2 max-w-xs leading-relaxed">
                        В разделе <strong className="text-stone-800 font-bold">{activeCityInfo.nameRu}</strong> пока нет подходящих под фильтр объектов. Вы можете сбросить фильтры или выбрать другой город:
                      </p>

                      <div className="flex flex-col gap-2.5 mt-4 w-full max-w-xs">
                        <button
                          type="button"
                          onClick={() => setIsSplashOpen(true)}
                          className="w-full bg-stone-900 hover:bg-black text-white font-bold py-3 px-5 rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 text-rose-400" />
                          <span>Выбрать другой город</span>
                        </button>

                        <button
                          type="button"
                          id="reset-all-filters-btn"
                          onClick={() => {
                            setFilters({
                              city: activeCity,
                              minPrice: 200,
                              maxPrice: 2000,
                              furniture: 'any',
                              district: 'all',
                              period: 'any',
                              petFriendlyOnly: false,
                            });
                          }}
                          className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-3 px-5 rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Сбросить фильтры ({activeCityInfo.nameRu})</span>
                        </button>

                        <button
                          type="button"
                          id="open-filters-from-filtered-btn"
                          onClick={() => setIsFilterDrawerOpen(true)}
                          className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold py-2.5 px-5 rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                          <span>Настроить фильтры</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('map')}
                          className="w-full text-stone-500 hover:text-stone-800 text-xs font-semibold py-1.5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Смотреть все {apartments.length} объектов на карте</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
                        <Check className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-stone-900">Вы просмотрели все варианты</h3>
                      <p className="text-xs sm:text-sm text-stone-500 mt-2 max-w-xs leading-relaxed">
                        Все <strong className="text-stone-800 font-bold">{filteredApartments.length} объектов</strong> из текущей подборки уже свайпнуты ({likedIds.length} в ваших Rentch!).
                      </p>

                      <div className="flex flex-col gap-2.5 mt-6 w-full max-w-xs">
                        <button
                          type="button"
                          id="reset-swipes-btn"
                          onClick={handleResetDeck}
                          className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-3 px-5 rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Свайпать заново (вернуть в ленту)</span>
                        </button>

                        {likedIds.length > 0 && (
                          <button
                            type="button"
                            id="go-to-matches-empty-deck-btn"
                            onClick={() => setActiveTab('matches')}
                            className="w-full bg-stone-900 hover:bg-black text-white font-bold py-2.5 px-5 rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                            <span>Открыть мои Rentch! ({likedIds.length})</span>
                          </button>
                        )}

                        <button
                          type="button"
                          id="open-filters-empty-btn"
                          onClick={() => setIsFilterDrawerOpen(true)}
                          className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold py-2.5 px-5 rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                          <span>Изменить фильтры поиска</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              </div>
            </div>

            {/* Bottom Swipe Controller Buttons */}
            {currentCard && (
              <div 
                id="swipe-controls-bar"
                className="flex items-center justify-center gap-4 mt-5 select-none"
              >
                {/* 1. Undo */}
                <button
                  type="button"
                  id="ctrl-undo-btn"
                  onClick={handleUndoSwipe}
                  disabled={swipeHistory.length === 0}
                  className="w-12 h-12 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:text-amber-500 text-stone-400 disabled:opacity-40 disabled:hover:border-stone-200 disabled:hover:text-stone-400 shadow-sm flex items-center justify-center transition-all cursor-pointer"
                  title="Отменить последний свайп"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                {/* 2. Dislike (Swipe Left) */}
                <button
                  type="button"
                  id="ctrl-dislike-btn"
                  onClick={() => handleSwipeLeft(currentCard)}
                  className="w-16 h-16 rounded-3xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-500 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                  title="Пропустить квартиру (Свайп влево)"
                >
                  <X className="w-8 h-8 stroke-[2.5]" />
                </button>

                {/* 3. Info / Details */}
                <button
                  type="button"
                  id="ctrl-info-btn"
                  onClick={() => setDetailsModalApartment(currentCard)}
                  className="w-12 h-12 rounded-2xl bg-white border border-stone-200 hover:border-sky-400 hover:text-sky-500 text-stone-500 shadow-sm flex items-center justify-center transition-all cursor-pointer"
                  title="Подробная информация о квартире"
                >
                  <Info className="w-5 h-5" />
                </button>

                {/* 4. Like / Rentch Match (Swipe Right) */}
                <button
                  type="button"
                  id="ctrl-like-btn"
                  onClick={() => handleSwipeRight(currentCard)}
                  className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-lg shadow-rose-500/25 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                  title="Нравится! Rentch! (Свайп вправо)"
                >
                  <Heart className="w-8 h-8 fill-white" />
                </button>
              </div>
            )}
            </>
            )}
          </div>
        )}

        {/* 1B. Double Rentch: Найти соседа (Tinder Double Date 50/50 Split View) */}
        {activeTab === 'roommates' && (
          <RoommateFinderSection
            apartments={apartments}
            matchedApartments={matchedApartments}
            activeCity={activeCity}
            userProfile={userProfile}
            focusedApartmentId={focusedRoommateApartmentId}
            onSelectFocusedApartment={setFocusedRoommateApartmentId}
            onSwitchToStandardSwipe={() => setActiveTab('swipe')}
            onOpenApartmentDetails={(apt) => setDetailsModalApartment(apt)}
            onMatchWithRoommate={handleMatchWithRoommate}
            onRoommateSwipedRight={handleRoommateSwipedRight}
            onPublishRoommateOffer={handlePublishRoommateOffer}
            onLikeApartmentIfNeeded={(apt) => {
              if (!likedIds.includes(apt.id)) {
                trackAnalyticsEvent('swipe_right', {
                  apartmentId: apt.id,
                  apartmentTitle: apt.title,
                });
                setLikedIds((prev) => [...prev, apt.id]);
                setDailyRightSwipes((prev) => (prev.includes(apt.id) ? prev : [...prev, apt.id]));
                ensureChatInitialized(apt);
              }
            }}
          />
        )}

        {/* 2. City Map View (Тбилиси / Ереван / Белград) */}
        {activeTab === 'map' && (
          <div className="flex-1 flex flex-col pb-20">
            <TbilisiMap
              apartments={filteredApartments}
              onSelectApartment={(apt) => {
                setActiveTab('swipe');
                setDetailsModalApartment(apt);
              }}
              onLikeApartment={(apt) => {
                setActiveTab('swipe');
                handleSwipeRight(apt);
              }}
              onOpenDetails={(apt) => {
                setActiveTab('swipe');
                setDetailsModalApartment(apt);
              }}
              onCloseMap={() => setActiveTab('swipe')}
              likedIds={likedIds}
              activeCity={activeCity}
              onChangeCity={(city) => handleSelectCity(city, false)}
            />
          </div>
        )}

        {/* 3. Separate Section: Мэтчи */}
        {activeTab === 'matches' && (
          <MatchesSection
            matchedApartments={matchedApartments}
            chats={chats}
            onOpenChat={(apt) => handleOpenChat(apt)}
            onOpenDetails={(apt) => setDetailsModalApartment(apt)}
            onFindRoommate={(apt) => handleOpenRoommateFinder(apt)}
            onExploreMore={() => setActiveTab('swipe')}
          />
        )}

        {/* 4. Separate Section: Диалоги */}
        {activeTab === 'dialogues' && (
          <DialoguesSection
            matchedApartments={matchedApartments}
            allApartments={apartments}
            chats={chats}
            onOpenChat={(apt) => handleOpenChat(apt)}
            onExploreMore={() => setActiveTab('swipe')}
          />
        )}

        {/* 5. Separate Section: Admin CRM & Property Upload Panel */}
        {activeTab === 'admin' && (
          <AdminPanel
            leads={crmLeads}
            onUpdateLeads={handleAdminUpdateLeads}
            apartments={apartments}
            onAddApartment={handleAddApartment}
            onDeleteApartment={handleDeleteApartment}
            onClearAllApartments={() => {
              setApartments([]);
              fetch('/api/apartments', {
                method: 'DELETE',
                headers: getAdminAuthHeaders(),
              }).catch(() => {});
            }}
            onClearAllLeads={handleClearAllLeads}
            onClose={() => setActiveTab('swipe')}
            onAuthSuccess={() => setIsAdminLoggedIn(true)}
            onLogout={handleLogout}
            onViewApartment={(apt) => setDetailsModalApartment(apt)}
            onSwitchToSwipe={() => setActiveTab('swipe')}
            onUpdateApartment={handleUpdateApartment}
            onRefreshCatalog={() => {
              refreshApartmentsFromServer();
              refreshCrmAndChatsFromServer();
            }}
            isAdmin={isAdminLoggedIn}
            chats={chats}
            onAdminSendMessage={handleAdminSendMessage}
            onMarkLeadRead={handleMarkLeadRead}
          />
        )}

        {/* 6. Separate Section: Landlord Portal (ONLY Apartment Placement) */}
        {activeTab === 'landlord' && (
          <div className="flex-1 pb-12">
            <LandlordRegistrationModal
              isOpen={true}
              inline={true}
              onClose={() => setActiveTab('swipe')}
              onAddApartment={handleAddApartmentFromLandlord}
              onLogout={handleLogout}
              landlordProfile={landlordProfile}
            />
          </div>
        )}
      </main>

      {/* Fixed Bottom Navigation Bar (hidden when in Landlord section so Landlord only has apartment placement) */}
      {!isLandlordLoggedIn && activeTab !== 'landlord' && (
        <BottomNavBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          matchesCount={matchedApartments.length}
          dialoguesCount={dialoguesCount}
          onOpenFilters={() => setIsFilterDrawerOpen(true)}
          onOpenProfile={() => setIsQuestionnaireOpen(true)}
          hasActiveFilters={hasActiveFilters}
          isRegistered={userProfile.isRegistered}
          isAdmin={isAdminLoggedIn}
        />
      )}

      {/* Modal 1: The "Rentch!" Celebration Match Modal */}
      <RentchMatchModal
        apartment={matchModalApartment}
        isOpen={!!matchModalApartment}
        userProfile={userProfile}
        onClose={() => setMatchModalApartment(null)}
        onOpenChat={(apt) => handleOpenChat(apt)}
        onFindRoommate={(apt) => handleOpenRoommateFinder(apt)}
        onSubmitSwipeContact={handleSubmitSwipeContact}
      />

      {/* Modal 2: Chat with Landlord & Bot */}
      <ChatModal
        apartment={chatModalApartment}
        isOpen={!!chatModalApartment}
        onClose={() => setChatModalApartment(null)}
        userProfile={userProfile}
        chats={chats}
        onSendMessage={handleSendMessage}
        onRequestRegistration={handleRequestRegistration}
        onConfirmViewing={(apartmentId, date, time) =>
          handleConfirmViewing(apartmentId, date, time)
        }
      />

      {/* Modal 3: Questionnaire & Registration */}
      <QuestionnaireModal
        isOpen={isQuestionnaireOpen}
        onClose={() => setIsQuestionnaireOpen(false)}
        onComplete={handleQuestionnaireComplete}
        pendingApartmentTitle={pendingApartmentForViewing?.title}
        initialAnswers={userProfile.questionnaire}
        userProfile={userProfile}
      />

      {/* Modal 4: Filters Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onApplyFilters={setFilters}
        onResetFilters={() =>
          setFilters({
            city: activeCity,
            minPrice: 200,
            maxPrice: 2000,
            furniture: 'any',
            district: 'all',
            period: 'any',
            petFriendlyOnly: false,
          })
        }
        matchingCount={filteredApartments.length}
      />

      {/* Modal 5: Apartment Details */}
      <ApartmentDetailsModal
        apartment={detailsModalApartment}
        isOpen={!!detailsModalApartment}
        onClose={() => setDetailsModalApartment(null)}
        onLike={(apt) => handleSwipeRight(apt)}
        onDislike={(apt) => handleSwipeLeft(apt)}
        isLiked={detailsModalApartment ? likedIds.includes(detailsModalApartment.id) : false}
        isAdmin={isAdminLoggedIn}
        onDelete={handleDeleteApartment}
      />

      {/* Modal 6: Authentication & Role Switcher */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isAdmin={isAdminLoggedIn}
        isLandlord={isLandlordLoggedIn}
        landlordProfile={landlordProfile}
        userProfile={userProfile}
        onLoginTenant={handleLoginTenant}
        onLoginLandlord={handleLoginLandlord}
        onLoginAdmin={handleLoginAdmin}
        onLogout={handleLogout}
        onOpenCrm={() => {
          setIsSplashOpen(false);
          setActiveTab('admin');
        }}
        onOpenLandlordPortal={() => {
          setIsSplashOpen(false);
          setActiveTab('landlord');
        }}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        onDeleteUserData={handleDeleteUserData}
      />

      {/* Modal 6.1: Privacy Policy & Google Play Data Deletion */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onDeleteData={handleDeleteUserData}
      />

      {/* Modal 7: Landlord Registration & Apartment Upload */}
      <LandlordRegistrationModal
        isOpen={isLandlordModalOpen}
        onClose={() => setIsLandlordModalOpen(false)}
        onAddApartment={handleAddApartmentFromLandlord}
        onLogout={handleLogout}
        landlordProfile={landlordProfile}
      />

      {/* Modal 8: Daily Right Swipe Limit Modal (max 5 right swipes per day) */}
      {isDailyLimitModalOpen && (
        <div
          id="daily-swipe-limit-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        >
          <div className="relative w-full max-w-md bg-stone-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-rose-500/30 text-center p-6 space-y-4">
            <button
              type="button"
              onClick={() => setIsDailyLimitModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center mx-auto shadow-lg">
              <Heart className="w-8 h-8 fill-white" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
                Дневной лимит: 5 из 5 квартир
              </span>
              <h3 className="text-2xl font-black tracking-tight">
                Вы выбрали 5 квартир на сегодня!
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm mt-2 leading-relaxed">
                Чтобы подбор жилья был точечным и удобным, в день доступно не более <strong>5 свайпов вправо</strong>. Вы уже можете перейти в диалог по выбранным квартирам и записаться на просмотр в удобное время!
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                id="daily-limit-open-dialogues-btn"
                onClick={() => {
                  setIsDailyLimitModalOpen(false);
                  setActiveTab('dialogues');
                }}
                className="w-full bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold py-3.5 px-5 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
              >
                <span>Перейти в диалоги для записи на просмотр</span>
              </button>

              <button
                type="button"
                id="daily-limit-open-matches-btn"
                onClick={() => {
                  setIsDailyLimitModalOpen(false);
                  setActiveTab('matches');
                }}
                className="w-full bg-stone-800 hover:bg-stone-700 text-white font-semibold py-3 px-4 rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Посмотреть мои выбранные квартиры ({likedIds.length})
              </button>

              <button
                type="button"
                onClick={() => setIsDailyLimitModalOpen(false)}
                className="w-full text-stone-400 hover:text-white font-medium py-2 text-xs transition-colors cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
