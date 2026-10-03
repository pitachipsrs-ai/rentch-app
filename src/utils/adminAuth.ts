export const ADMIN_TOKEN_STORAGE_KEY = 'rentch_admin_token';
export const ADMIN_AUTH_STORAGE_KEY = 'rentch_admin_auth';

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  isoTime: string;
  event:
    | 'login_success'
    | 'login_failed'
    | 'blocked_brute_force'
    | 'delete_lead'
    | 'clear_all_leads'
    | 'delete_apartment'
    | 'clear_all_apartments'
    | 'restore_backup'
    | 'security_init';
  email?: string;
  ip: string;
  userAgent: string;
  deviceSummary: string;
  details: string;
  status: 'success' | 'warning' | 'danger' | 'info';
}

export function getAdminToken(): string {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setAdminSession(token: string): void {
  try {
    sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'true');
  } catch {}
}

export function clearAdminSession(): void {
  try {
    const token = getAdminToken();
    if (token) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
      }).catch(() => {});
    }
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  } catch {}
}

export function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { 'x-admin-token': token } : {};
}

export async function loginAdminOnServer(
  email: string,
  password: string
): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: password.trim() }),
    });
    const data = await res.json();
    if (res.ok && data?.ok && data?.token) {
      setAdminSession(data.token);
      return { ok: true, token: data.token };
    }
    return {
      ok: false,
      error: data?.error || 'Неверный логин или пароль администратора',
    };
  } catch {
    return {
      ok: false,
      error: 'Ошибка соединения с сервером при проверке доступа',
    };
  }
}
