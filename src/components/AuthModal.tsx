import React, { useState } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Phone, 
  Check, 
  Eye, 
  EyeOff, 
  Sparkles,
  LogOut,
  Building2,
  Briefcase
} from 'lucide-react';
import { UserProfile } from '../types';
import { loginAdminOnServer } from '../utils/adminAuth';

export type UserRole = 'tenant' | 'landlord';

export interface LandlordAuthData {
  name: string;
  phone: string;
  telegram?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  isLandlord?: boolean;
  landlordProfile?: LandlordAuthData | null;
  userProfile: UserProfile;
  onLoginTenant: (profileData: Partial<UserProfile>) => void;
  onLoginLandlord: (landlordData: LandlordAuthData) => void;
  onLoginAdmin: () => void;
  onLogout: () => void;
  onOpenCrm?: () => void;
  onOpenLandlordPortal?: () => void;
  onOpenPrivacy?: () => void;
  onDeleteUserData?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  isLandlord = false,
  landlordProfile,
  userProfile,
  onLoginTenant,
  onLoginLandlord,
  onLoginAdmin,
  onLogout,
  onOpenCrm,
  onOpenLandlordPortal,
  onOpenPrivacy,
  onDeleteUserData,
}) => {
  const [activeRole, setActiveRole] = useState<UserRole>(isLandlord ? 'landlord' : 'tenant');
  
  // Tenant (& Admin via Tenant panel) Form
  const [tenantName, setTenantName] = useState(userProfile.name || '');
  const [tenantPhone, setTenantPhone] = useState(userProfile.phone || '');
  const [tenantTelegram, setTenantTelegram] = useState(userProfile.telegramUsername || '');
  const [tenantPassword, setTenantPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState(false);

  // Landlord Form
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

  if (!isOpen) return null;

  const isEmailOrAdminInput = tenantName.trim().includes('@');

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const normalizedLogin = tenantName.trim().toLowerCase();
    const enteredPass = tenantPassword.trim() || tenantPhone.trim() || tenantTelegram.trim();

    // Administrator login verified strictly on the server
    if (normalizedLogin.includes('@') && tenantPassword.trim()) {
      const result = await loginAdminOnServer(normalizedLogin, enteredPass);
      if (result.ok) {
        setAdminSuccess(true);
        setTimeout(() => {
          setAdminSuccess(false);
          setTenantPassword('');
          onLoginAdmin();
          onClose();
        }, 300);
      } else {
        setAuthError(result.error || 'Неверный логин или пароль');
      }
      return;
    }

    if (!tenantName.trim()) {
      setAuthError('Пожалуйста, укажите ваше имя');
      return;
    }
    if (!tenantPhone.trim()) {
      setAuthError('Пожалуйста, укажите ваш номер телефона');
      return;
    }

    onLoginTenant({
      name: tenantName.trim(),
      phone: tenantPhone.trim(),
      telegramUsername: tenantTelegram.trim().replace(/^@/, '') || undefined,
      isRegistered: true,
    });
    onClose();
  };

  const handleLandlordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!landlordName.trim() || !landlordPhone.trim()) return;

    const finalTelegram = landlordTelegram.trim().replace(/^@/, '');

    const data: LandlordAuthData = {
      name: landlordName.trim(),
      phone: landlordPhone.trim(),
      telegram: finalTelegram || undefined,
    };

    try {
      localStorage.setItem('rentch_landlord_profile', JSON.stringify(data));
    } catch (err) {}

    onLoginLandlord(data);
    onClose();
  };

  return (
    <div 
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="auth-modal-content"
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Вход в Rentch</h2>
          </div>
          <p className="text-xs text-stone-300">
            Выберите вашу роль для доступа к сервису
          </p>

          {/* Role selector tabs: ONLY Арендатор & Арендодатель */}
          <div className="grid grid-cols-2 gap-2 mt-4 bg-stone-950/60 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              id="role-tab-tenant"
              onClick={() => {
                setActiveRole('tenant');
                setAuthError('');
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'tenant'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Арендатор</span>
            </button>

            <button
              type="button"
              id="role-tab-landlord"
              onClick={() => {
                setActiveRole('landlord');
                setAuthError('');
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'landlord'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Арендодатель</span>
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6">
          {/* Status banner if already authenticated */}
          {(isAdmin || isLandlord || userProfile.isRegistered) && (
            <div className="mb-4 p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-700 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">
                    Текущий вход:{' '}
                    <strong className="text-stone-900">
                      {isAdmin
                        ? 'Администратор CRM'
                        : isLandlord
                          ? `Арендодатель (${landlordProfile?.name || 'Собственник'})`
                          : userProfile.name || 'Арендатор'}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setAdminSuccess(false);
                  }}
                  className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Выйти</span>
                </button>
              </div>

              {isAdmin && onOpenCrm && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenCrm();
                    onClose();
                  }}
                  className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  <span>Открыть CRM-панель администратора</span>
                </button>
              )}

              {isLandlord && onOpenLandlordPortal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenLandlordPortal();
                    onClose();
                  }}
                  className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Перейти к размещению квартиры</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 1: Арендатор (также поддерживает вход Администратора по его логину и паролю) */}
          {activeRole === 'tenant' && (
            <form onSubmit={handleTenantSubmit} className="space-y-4">
              <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-3 text-xs text-rose-900 leading-relaxed">
                Вход для арендаторов позволяет сохранять Rentch!, бронировать просмотры квартир в Тбилиси и общаться с менеджерами.
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold">
                  {authError}
                </div>
              )}

              {adminSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Авторизация успешна! Переход в CRM...</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Ваше имя или Email *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={tenantName}
                    onChange={(e) => {
                      setTenantName(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Введите ваше имя или Email"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {!isEmailOrAdminInput && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Телефон (WhatsApp / Telegram) *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required={!isEmailOrAdminInput}
                        value={tenantPhone}
                        onChange={(e) => setTenantPhone(e.target.value)}
                        placeholder="Введите ваш номер телефона"
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Telegram Username (по желанию)
                    </label>
                    <div className="relative">
                      <span className="text-stone-400 font-bold text-xs absolute left-4 top-1/2 -translate-y-1/2">
                        @
                      </span>
                      <input
                        type="text"
                        value={tenantTelegram}
                        onChange={(e) => setTenantTelegram(e.target.value)}
                        placeholder="Ваш никнейм"
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {isEmailOrAdminInput ? 'Пароль' : 'Пароль (при входе по Email)'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={isEmailOrAdminInput}
                    value={tenantPassword}
                    onChange={(e) => {
                      setTenantPassword(e.target.value);
                      setAuthError('');
                    }}
                    placeholder={isEmailOrAdminInput ? 'Введите пароль...' : 'Необязательно для арендатора'}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  id="auth-submit-tenant-btn"
                  className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold py-3 px-4 rounded-2xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span>{isEmailOrAdminInput ? 'Войти' : 'Войти как арендатор'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Арендодатель */}
          {activeRole === 'landlord' && (
            <form onSubmit={handleLandlordSubmit} className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-950 leading-relaxed">
                Вход для собственников недвижимости. В вашем разделе вы сможете разместить свою квартиру в сервисе Rentch.
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Ваше имя (собственник / представитель)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={landlordName}
                    onChange={(e) => setLandlordName(e.target.value)}
                    placeholder="Введите ваше имя"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Контактный телефон (WhatsApp / Telegram) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={landlordPhone}
                    onChange={(e) => setLandlordPhone(e.target.value)}
                    placeholder="Введите ваш номер телефона"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Telegram Username (по желанию)
                </label>
                <div className="relative">
                  <span className="text-stone-400 font-bold text-xs absolute left-4 top-1/2 -translate-y-1/2">
                    @
                  </span>
                  <input
                    type="text"
                    value={landlordTelegram}
                    onChange={(e) => setLandlordTelegram(e.target.value)}
                    placeholder="username"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  id="auth-submit-landlord-btn"
                  className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold py-3 px-4 rounded-2xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Войти как арендодатель</span>
                </button>
              </div>
            </form>
          )}

          {/* Privacy Policy & Data Deletion (Google Play Compliance) */}
          <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPrivacy?.();
              }}
              className="hover:text-stone-900 underline font-medium cursor-pointer"
            >
              Политика конфиденциальности
            </button>

            {onDeleteUserData && (userProfile.isRegistered || userProfile.phone) && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Удалить ваш профиль, контакты и историю заявок?')) {
                    onDeleteUserData();
                    onClose();
                  }
                }}
                className="text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
              >
                Удалить мои данные
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
