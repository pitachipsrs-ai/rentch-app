// Telegram Mini App (TMA) Integration Helpers

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        enableClosingConfirmation?: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        isExpanded?: boolean;
        disableVerticalSwipes?: () => void;
        viewportHeight?: number;
        colorScheme?: 'light' | 'dark';
        themeParams?: Record<string, string>;
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          start_param?: string;
        };
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        BackButton?: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        openLink?: (url: string) => void;
        openTelegramLink?: (url: string) => void;
      };
    };
  }
}

export function initTelegramApp() {
  if (typeof window === 'undefined') {
    return;
  }

  // Ensure stale Service Workers and Workbox caches do not freeze updates in Telegram WebView
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.update().catch(() => {});
          if (window.Telegram?.WebApp?.initData) {
            registration.unregister().catch(() => {});
          }
        }
      });
    }
    if ('caches' in window && window.Telegram?.WebApp?.initData) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          if (key.includes('workbox') || key.includes('precache')) {
            caches.delete(key).catch(() => {});
          }
        }
      });
    }
  } catch (e) {
    // Ignore storage/SW errors in restricted WebViews
  }

  if (!window.Telegram?.WebApp) {
    return;
  }

  const tg = window.Telegram.WebApp;
  try {
    tg.ready();
    tg.expand();
    if (typeof tg.disableVerticalSwipes === 'function') {
      tg.disableVerticalSwipes();
    }
    if (typeof tg.enableClosingConfirmation === 'function') {
      tg.enableClosingConfirmation();
    }
    if (typeof tg.setHeaderColor === 'function') {
      tg.setHeaderColor('#f43f5e'); // match Rentch primary rose brand color
    }
  } catch (err) {
    console.debug('Telegram WebApp initialization error:', err);
  }
}

export function isInsideTelegram(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const tg = window.Telegram?.WebApp as any;
    if (tg?.initData && tg.initData.length > 0) return true;
    if (tg?.initDataUnsafe?.user || tg?.initDataUnsafe?.start_param) return true;
    if (tg?.platform && tg.platform !== 'unknown') return true;
    const win = window as any;
    if (win.TelegramWebviewProxy || win.TelegramWebview) return true;
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (
      hash.includes('tgWebAppData') ||
      hash.includes('tgWebAppVersion') ||
      hash.includes('tgWebAppPlatform') ||
      search.includes('tgWebApp') ||
      search.includes('tg=1') ||
      search.includes('startapp')
    ) {
      return true;
    }
    const ua = navigator.userAgent || '';
    if (/Telegram/i.test(ua)) return true;
    const ref = document.referrer || '';
    if (ref.includes('t.me') || ref.includes('telegram.org') || ref.includes('tg://')) return true;
  } catch (e) {
    // Ignore detection errors
  }
  return false;
}

export function getTelegramUser() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}

export function triggerHaptic(
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' = 'light'
) {
  if (typeof window === 'undefined') return;
  const haptic = window.Telegram?.WebApp?.HapticFeedback;
  if (!haptic) return;

  try {
    if (type === 'success' || type === 'warning' || type === 'error') {
      haptic.notificationOccurred(type);
    } else if (type === 'selection') {
      haptic.selectionChanged();
    } else {
      haptic.impactOccurred(type);
    }
  } catch (err) {
    // Graceful fallback
  }
}

export function initiatePhoneCall(phone: string = '+995558542365') {
  if (typeof window === 'undefined') return;
  triggerHaptic('medium');
  const cleanPhone = phone.replace(/[^0-9+]/g, '') || '+995558542365';
  const telUrl = `tel:${cleanPhone}`;

  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = telUrl;
      return;
    }
  } catch (e) {
    // Cross-origin top frame, fall through to location.href
  }

  try {
    window.location.href = telUrl;
  } catch (e) {
    // Fallback
  }
}

