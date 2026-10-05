import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { spawn, execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import JSZip from 'jszip';
import { parseMyHomeJson, parseMyHomeBatch, convertRawStatementToApartment, getMyHomeOriginalUrl, DEFAULT_AGENT_PHONE } from './src/utils/myhomeParser';
import {
  parseHaloOglasiBatch,
  convertHaloClassifiedToApartment,
  convertHaloListAdToApartment,
  DEFAULT_HALO_OGLASI_URL,
} from './src/utils/haloOglasiParser';
import { translateApartmentToRussian, translateApartmentFast } from './src/server/translator';
import { sanitizeApartmentPhones } from './src/utils/phoneSanitizer';
import { getAccurateApartmentDistrict, getAccurateApartmentCoordinates } from './src/utils/districtUtils';
import { SEED_MYHOME_APARTMENTS } from './src/data/seedMyHome';

const DATA_DIR = path.join(process.cwd(), 'data');
const APARTMENTS_FILE = path.join(DATA_DIR, 'apartments.json');
const CRM_LEADS_FILE = path.join(DATA_DIR, 'crm_leads.json');
const CRM_LEADS_BACKUP_FILE = path.join(DATA_DIR, 'crm_leads.backup.json');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');
const CHATS_BACKUP_FILE = path.join(DATA_DIR, 'chats.backup.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
const ROOMMATES_FILE = path.join(DATA_DIR, 'roommates.json');
const ADMIN_AUDIT_FILE = path.join(DATA_DIR, 'admin_audit.json');
const ADMIN_SESSIONS_FILE = path.join(DATA_DIR, 'admin_sessions.json');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'ai9292@mail.ru').trim().toLowerCase();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'redmay1968!').trim();

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(APARTMENTS_FILE)) {
  fs.writeFileSync(APARTMENTS_FILE, '[]', 'utf-8');
}
if (!fs.existsSync(CRM_LEADS_FILE)) {
  fs.writeFileSync(CRM_LEADS_FILE, '[]', 'utf-8');
}
if (!fs.existsSync(CHATS_FILE)) {
  fs.writeFileSync(CHATS_FILE, '{}', 'utf-8');
}
if (!fs.existsSync(ANALYTICS_FILE)) {
  fs.writeFileSync(ANALYTICS_FILE, '{}', 'utf-8');
}
if (!fs.existsSync(ROOMMATES_FILE)) {
  fs.writeFileSync(ROOMMATES_FILE, '[]', 'utf-8');
}
if (!fs.existsSync(ADMIN_AUDIT_FILE)) {
  const initialAudit = [
    {
      id: 'audit-init-1',
      timestamp: '28.09.2026, 20:25',
      isoTime: new Date().toISOString(),
      event: 'security_init',
      email: 'ai9292@mail.ru',
      ip: 'Система защиты Rentch',
      userAgent: 'Rentch Security Shield v2.0',
      deviceSummary: 'Серверная защита активирована',
      details:
        'Включён аудит входов в админ-панель, криптографические токены сессий, защита от подбора пароля (Brute-Force Lockout), защита от SSRF/XSS и резервное копирование лидов (восстановлен лид от Родиона).',
      status: 'info',
    },
  ];
  fs.writeFileSync(ADMIN_AUDIT_FILE, JSON.stringify(initialAudit, null, 2), 'utf-8');
}
if (!fs.existsSync(ADMIN_SESSIONS_FILE)) {
  fs.writeFileSync(ADMIN_SESSIONS_FILE, '{}', 'utf-8');
}

interface AdminAuditEntry {
  id: string;
  timestamp: string;
  isoTime: string;
  event: string;
  email?: string;
  ip: string;
  userAgent: string;
  deviceSummary: string;
  details: string;
  status: 'success' | 'warning' | 'danger' | 'info';
}

function summarizeUserAgent(ua: string): string {
  if (!ua) return 'Неизвестное устройство';
  const lower = ua.toLowerCase();
  let os = 'Desktop';
  if (lower.includes('iphone') || lower.includes('ipad')) os = 'iOS (iPhone/iPad)';
  else if (lower.includes('android')) os = 'Android';
  else if (lower.includes('mac os') || lower.includes('macintosh')) os = 'macOS';
  else if (lower.includes('windows')) os = 'Windows';
  else if (lower.includes('linux')) os = 'Linux';

  let browser = 'Браузер';
  if (lower.includes('telegram')) browser = 'Telegram WebApp';
  else if (lower.includes('edg/')) browser = 'Edge';
  else if (lower.includes('opr/') || lower.includes('opera')) browser = 'Opera';
  else if (lower.includes('chrome/') && !lower.includes('edg/')) browser = 'Chrome';
  else if (lower.includes('safari/') && !lower.includes('chrome/')) browser = 'Safari';
  else if (lower.includes('firefox/')) browser = 'Firefox';

  return `${browser} • ${os}`;
}

function getClientIp(req: any): string {
  const xff = req.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim();
  }
  return String(req.ip || req.socket?.remoteAddress || 'unknown');
}

function readAdminAudit(): AdminAuditEntry[] {
  try {
    if (fs.existsSync(ADMIN_AUDIT_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ADMIN_AUDIT_FILE, 'utf-8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function appendAdminAudit(
  req: any,
  entry: {
    event: string;
    email?: string;
    details: string;
    status: 'success' | 'warning' | 'danger' | 'info';
  }
): void {
  try {
    const existing = readAdminAudit();
    const ua = String(req?.headers?.['user-agent'] || '');
    const now = new Date();
    const record: AdminAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      isoTime: now.toISOString(),
      event: entry.event,
      email: entry.email,
      ip: getClientIp(req),
      userAgent: ua,
      deviceSummary: summarizeUserAgent(ua),
      details: entry.details,
      status: entry.status,
    };
    const updated = [record, ...existing].slice(0, 250);
    fs.writeFileSync(ADMIN_AUDIT_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write admin audit log:', e);
  }
}

interface AdminSessionRecord {
  token: string;
  ip: string;
  deviceSummary: string;
  createdAt: number;
  expiresAt: number;
}

function readAdminSessions(): Record<string, AdminSessionRecord> {
  try {
    if (fs.existsSync(ADMIN_SESSIONS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ADMIN_SESSIONS_FILE, 'utf-8'));
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {}
  return {};
}

function writeAdminSessions(sessions: Record<string, AdminSessionRecord>): void {
  try {
    fs.writeFileSync(ADMIN_SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch (e) {}
}

function timingSafeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Brute-force rate limiter: max 5 failed attempts per 15 minutes per IP
const loginRateLimiter = new Map<string, { count: number; lockUntil: number }>();

function escapeHtml(unsafe: string): string {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isSafeExternalUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '[::1]' ||
      host.startsWith('169.254.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      host.endsWith('.internal') ||
      host.endsWith('.local')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

interface DailyAnalytics {
  date: string;
  pageViews: number;
  landingViews: number;
  catalogViews: number;
  uniqueVisitorIds: string[];
  apartmentViews: number;
  swipesRight: number;
  swipesLeft: number;
  telegramClicks: number;
  apartmentBreakdown: Record<
    string,
    { title: string; views: number; likes: number; passes: number }
  >;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readAllAnalytics(): Record<string, DailyAnalytics> {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.error('Error reading analytics file:', e);
  }
  return {};
}

function getTodayAnalytics(): DailyAnalytics {
  const all = readAllAnalytics();
  const today = getTodayKey();
  if (!all[today]) {
    all[today] = {
      date: today,
      pageViews: 0,
      landingViews: 0,
      catalogViews: 0,
      uniqueVisitorIds: [],
      apartmentViews: 0,
      swipesRight: 0,
      swipesLeft: 0,
      telegramClicks: 0,
      apartmentBreakdown: {},
    };
  }
  return all[today];
}

function saveTodayAnalytics(todayData: DailyAnalytics): void {
  try {
    const all = readAllAnalytics();
    all[todayData.date] = todayData;
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(all, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing analytics file:', e);
  }
}

function isValidCrmLead(l: any): boolean {
  if (!l || typeof l !== 'object') return false;
  if (!l.id || typeof l.id !== 'string' || /^lead-[0-9]+$/.test(l.id)) return false;
  if ('rooms' in l || 'areaSqm' in l || 'totalFloors' in l) return false;
  if (!l.stage || !l.clientName) return false;
  return true;
}

function isValidChatEntry(key: string, chat: any): boolean {
  if (!key || /^[0-9]+$/.test(key)) return false;
  if (!chat || typeof chat !== 'object') return false;
  if ('rooms' in chat || 'areaSqm' in chat || 'totalFloors' in chat) return false;
  if (!Array.isArray(chat.messages)) return false;
  return true;
}

function readCrmLeads(): any[] {
  try {
    if (fs.existsSync(CRM_LEADS_FILE)) {
      const data = fs.readFileSync(CRM_LEADS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter(isValidCrmLead);
      }
    }
  } catch (err) {
    console.error('Error reading CRM leads file:', err);
  }
  return [];
}

function writeCrmLeads(leads: any[]): void {
  try {
    const clean = Array.isArray(leads) ? leads.filter(isValidCrmLead) : [];
    // Save backup snapshot whenever non-empty leads are written
    if (clean.length > 0) {
      fs.writeFileSync(CRM_LEADS_BACKUP_FILE, JSON.stringify(clean, null, 2), 'utf-8');
    } else if (fs.existsSync(CRM_LEADS_FILE)) {
      const prevRaw = fs.readFileSync(CRM_LEADS_FILE, 'utf-8');
      try {
        const prevParsed = JSON.parse(prevRaw);
        if (Array.isArray(prevParsed) && prevParsed.length > 0) {
          fs.writeFileSync(CRM_LEADS_BACKUP_FILE, JSON.stringify(prevParsed, null, 2), 'utf-8');
        }
      } catch {}
    }
    fs.writeFileSync(CRM_LEADS_FILE, JSON.stringify(clean, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing CRM leads file:', err);
  }
}

function readChats(): Record<string, any> {
  try {
    if (fs.existsSync(CHATS_FILE)) {
      const data = fs.readFileSync(CHATS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const clean: Record<string, any> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (isValidChatEntry(k, v)) {
            clean[k] = v;
          }
        }
        return clean;
      }
    }
  } catch (err) {
    console.error('Error reading chats file:', err);
  }
  return {};
}

function writeChats(chats: Record<string, any>): void {
  try {
    const clean: Record<string, any> = {};
    if (chats && typeof chats === 'object' && !Array.isArray(chats)) {
      for (const [k, v] of Object.entries(chats)) {
        if (isValidChatEntry(k, v)) {
          clean[k] = v;
        }
      }
    }
    if (Object.keys(clean).length > 0) {
      fs.writeFileSync(CHATS_BACKUP_FILE, JSON.stringify(clean, null, 2), 'utf-8');
    }
    fs.writeFileSync(CHATS_FILE, JSON.stringify(clean, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing chats file:', err);
  }
}

function mergeMessages(existingMsgs: any[] = [], incomingMsgs: any[] = []): any[] {
  const map = new Map<string, any>();
  if (Array.isArray(existingMsgs)) {
    for (const m of existingMsgs) {
      if (m && m.id) map.set(m.id, m);
    }
  }
  if (Array.isArray(incomingMsgs)) {
    for (const m of incomingMsgs) {
      if (m && m.id) map.set(m.id, m);
    }
  }
  return Array.from(map.values());
}

function mergeChatsData(
  existingChats: Record<string, any>,
  incomingChats: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = { ...existingChats };
  if (!incomingChats || typeof incomingChats !== 'object' || Array.isArray(incomingChats)) return result;

  for (const [aptId, incChat] of Object.entries(incomingChats)) {
    if (!isValidChatEntry(aptId, incChat)) continue;
    const exChat = result[aptId];
    if (!exChat) {
      result[aptId] = incChat;
    } else {
      result[aptId] = {
        ...exChat,
        ...incChat,
        apartmentId: aptId,
        messages: mergeMessages(exChat.messages, incChat.messages),
        viewingConfirmed: Boolean(exChat.viewingConfirmed || incChat.viewingConfirmed),
        viewingSlot: incChat.viewingSlot || exChat.viewingSlot,
        lastActivity: incChat.lastActivity || exChat.lastActivity || 'только что',
      };
    }
  }
  return result;
}

const STAGE_PRIORITY: Record<string, number> = {
  registered: 1,
  viewing_scheduled: 2,
  viewing_done_thinking: 3,
  paid: 4,
};

function mergeLeadsData(
  existingLeads: any[],
  incomingLeads: any[],
  isAdminUpdate = false
): any[] {
  const cleanExisting = Array.isArray(existingLeads)
    ? existingLeads.filter(isValidCrmLead)
    : [];
  const cleanIncoming = Array.isArray(incomingLeads)
    ? incomingLeads.filter(isValidCrmLead)
    : [];

  // Never wipe out existing leads if a fresh client sends an empty array on startup
  if (cleanIncoming.length === 0 && !isAdminUpdate) {
    return cleanExisting;
  }

  const map = new Map<string, any>();
  for (const ex of cleanExisting) {
    map.set(ex.id, ex);
  }

  for (const inc of cleanIncoming) {
    // Check direct id match OR same apartmentId match
    let matchedKey: string | null = map.has(inc.id) ? inc.id : null;
    if (!matchedKey && inc.apartmentId) {
      for (const [k, v] of map.entries()) {
        if (v.apartmentId === inc.apartmentId) {
          matchedKey = k;
          break;
        }
      }
    }

    if (!matchedKey) {
      map.set(inc.id, inc);
    } else {
      const ex = map.get(matchedKey);
      const exPriority = STAGE_PRIORITY[ex.stage] || 1;
      const incPriority = STAGE_PRIORITY[inc.stage] || 1;
      const mergedStage = isAdminUpdate
        ? inc.stage || ex.stage
        : incPriority >= exPriority
        ? inc.stage
        : ex.stage;

      const mergedMessages = mergeMessages(ex.messages, inc.messages);
      const exUserCount = (ex.messages || []).filter((m: any) => m?.sender === 'user').length;
      const mergedUserCount = mergedMessages.filter((m: any) => m?.sender === 'user').length;
      const newUnread = isAdminUpdate
        ? inc.unreadByAdmin ?? 0
        : mergedUserCount > exUserCount
        ? (ex.unreadByAdmin || 0) + (mergedUserCount - exUserCount)
        : Math.max(ex.unreadByAdmin || 0, inc.unreadByAdmin || 0);

      map.set(matchedKey, {
        ...ex,
        ...inc,
        id: matchedKey,
        clientName:
          inc.clientName && inc.clientName !== 'Клиент из чата' && inc.clientName !== 'Новый арендатор'
            ? inc.clientName
            : ex.clientName || inc.clientName || 'Клиент Rentch',
        clientPhone:
          inc.clientPhone && inc.clientPhone !== '+995 599 00-00-00'
            ? inc.clientPhone
            : ex.clientPhone || inc.clientPhone || '+995 599 00-00-00',
        clientTelegram: inc.clientTelegram || ex.clientTelegram,
        stage: mergedStage,
        apartmentId: inc.apartmentId || ex.apartmentId,
        apartmentTitle: inc.apartmentTitle || ex.apartmentTitle,
        apartmentDistrict: inc.apartmentDistrict || ex.apartmentDistrict,
        apartmentAddress: inc.apartmentAddress || ex.apartmentAddress,
        apartmentPriceUsd: inc.apartmentPriceUsd || ex.apartmentPriceUsd,
        apartmentImage: inc.apartmentImage || ex.apartmentImage,
        apartmentSourceUrl: inc.apartmentSourceUrl || ex.apartmentSourceUrl,
        viewingSlot: inc.viewingSlot || ex.viewingSlot,
        questionnaireSummary: inc.questionnaireSummary || ex.questionnaireSummary,
        notes: inc.notes || ex.notes,
        messages: mergedMessages,
        unreadByAdmin: newUnread,
      });
    }
  }

  return Array.from(map.values());
}

function reconcileChatsIntoLeads(
  chats: Record<string, any>,
  leads: any[],
  apartments: any[]
): { leads: any[]; changed: boolean } {
  let changed = false;
  const updatedLeads = [...leads];

  for (const [aptId, chat] of Object.entries(chats || {})) {
    if (!chat || !Array.isArray(chat.messages)) continue;
    const userMsgs = chat.messages.filter((m: any) => m && m.sender === 'user');
    const hasWelcomeSwipe = chat.messages.some(
      (m: any) => m && m.sender === 'bot' && String(m.id || '').startsWith('bot-welcome-')
    );
    const hasActivity =
      userMsgs.length > 0 ||
      Boolean(chat.viewingConfirmed) ||
      Boolean(chat.roommate) ||
      Boolean(chat.swipedRight) ||
      hasWelcomeSwipe;
    if (!hasActivity) continue;

    // Extract client contact info if present in chat or confirmation message
    let extractedName = chat.clientName || '';
    let extractedPhone = chat.clientPhone || '';
    for (const m of userMsgs) {
      if (
        m.senderName &&
        m.senderName !== 'Клиент' &&
        m.senderName !== 'Вы' &&
        m.senderName !== 'Клиент Rentch'
      ) {
        extractedName = m.senderName;
      }
      if (typeof m.text === 'string') {
        const match = m.text.match(/Мои контактные данные:\s*([^\(\n\.]+?)(?:\s*\(([^\)\n]+)\)|\.)/i);
        if (match) {
          if (match[1]?.trim()) extractedName = match[1].trim();
          if (match[2]?.trim()) extractedPhone = match[2].trim();
        }
      }
    }

    const apt = apartments.find((a: any) => a.id === aptId);
    const aptSourceUrl = apt
      ? apt.sourceUrl || getMyHomeOriginalUrl(apt) || undefined
      : getMyHomeOriginalUrl({ id: aptId }) || undefined;

    const leadIdx = updatedLeads.findIndex((l) => l && l.apartmentId === aptId);

    if (leadIdx === -1) {
      const lastUserMsg = userMsgs[userMsgs.length - 1];
      const newLead = {
        id: `crm-chat-${aptId}`,
        clientName: extractedName || 'Клиент Rentch',
        clientPhone: extractedPhone || '+995 599 00-00-00',
        stage: chat.viewingConfirmed ? 'viewing_scheduled' : 'registered',
        apartmentId: aptId,
        apartmentTitle:
          apt?.title ||
          (aptId === 'rentch-admin-support' ? 'Чат с администратором Rentch' : 'Квартира в Тбилиси'),
        apartmentDistrict: apt?.district || 'Сабуртало (Saburtalo)',
        apartmentAddress: apt?.address || '',
        apartmentPriceUsd: apt?.priceUsd || 0,
        apartmentImage: apt?.images?.[0] || '',
        apartmentSourceUrl: aptSourceUrl,
        viewingSlot: chat.viewingSlot,
        registeredAt: lastUserMsg?.timestamp ? `Сегодня в ${lastUserMsg.timestamp}` : 'Только что',
        notes: chat.viewingConfirmed
          ? `Запись через приложение Rentch на осмотр объекта ${apt?.title || ''} (${chat.viewingSlot?.date || 'Завтра'} в ${chat.viewingSlot?.time || '18:00'})`
          : `Написал в чат по объекту «${apt?.title || aptId}»`,
        messages: chat.messages,
        unreadByAdmin: userMsgs.length || 1,
      };
      updatedLeads.unshift(newLead);
      changed = true;
    } else {
      const existing = updatedLeads[leadIdx];
      const mergedMsgs = mergeMessages(existing.messages, chat.messages);
      const needsStageUpgrade = chat.viewingConfirmed && existing.stage === 'registered';
      const needsViewingSlot = chat.viewingSlot && !existing.viewingSlot;
      const needsSourceUrl = aptSourceUrl && !existing.apartmentSourceUrl;
      const needsMsgsUpdate = mergedMsgs.length !== (existing.messages || []).length;

      if (needsStageUpgrade || needsViewingSlot || needsSourceUrl || needsMsgsUpdate) {
        const prevUserCount = (existing.messages || []).filter((m: any) => m?.sender === 'user').length;
        const nextUserCount = mergedMsgs.filter((m: any) => m?.sender === 'user').length;
        updatedLeads[leadIdx] = {
          ...existing,
          clientName:
            extractedName &&
            (existing.clientName === 'Клиент из чата' ||
              existing.clientName === 'Новый арендатор' ||
              existing.clientName === 'Клиент Rentch')
              ? extractedName
              : existing.clientName,
          clientPhone:
            extractedPhone && existing.clientPhone === '+995 599 00-00-00'
              ? extractedPhone
              : existing.clientPhone,
          stage: needsStageUpgrade ? 'viewing_scheduled' : existing.stage,
          viewingSlot: existing.viewingSlot || chat.viewingSlot,
          apartmentTitle: existing.apartmentTitle || apt?.title,
          apartmentDistrict: existing.apartmentDistrict || apt?.district,
          apartmentAddress: existing.apartmentAddress || apt?.address,
          apartmentPriceUsd: existing.apartmentPriceUsd || apt?.priceUsd,
          apartmentImage: existing.apartmentImage || apt?.images?.[0],
          apartmentSourceUrl: existing.apartmentSourceUrl || aptSourceUrl,
          messages: mergedMsgs,
          unreadByAdmin:
            nextUserCount > prevUserCount
              ? (existing.unreadByAdmin || 0) + (nextUserCount - prevUserCount)
              : existing.unreadByAdmin ?? 0,
        };
        changed = true;
      }
    }
  }

  return { leads: updatedLeads, changed };
}

function isFake(a: any): boolean {
  if (!a || !a.id) return true;
  if (a.rentalType === 'daily') return false;
  const fakeIds = new Set([
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
  if (fakeIds.has(a.id)) return true;
  if (Array.isArray(a.images) && a.images.some((img: string) => typeof img === 'string' && img.includes('unsplash.com'))) {
    return true;
  }
  return false;
}

function readApartments(): any[] {
  try {
    if (fs.existsSync(APARTMENTS_FILE)) {
      const data = fs.readFileSync(APARTMENTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((a: any) => !isFake(a))
          .map((a: any) => {
            const sanitized = sanitizeApartmentPhones(a);
            sanitized.district = getAccurateApartmentDistrict(sanitized);
            const coords = getAccurateApartmentCoordinates(sanitized);
            sanitized.lat = coords.lat;
            sanitized.lng = coords.lng;
            if (Array.isArray(sanitized.images)) {
              sanitized.images = sanitized.images.map((img: string) =>
                typeof img === 'string'
                  ? img.replace(/static-statements\.tnet\.ge/g, 'static-api-statements.tnet.ge')
                  : img
              );
            }
            if (!sanitized.sourceUrl) {
              const resolvedUrl = getMyHomeOriginalUrl(sanitized);
              if (resolvedUrl) sanitized.sourceUrl = resolvedUrl;
            }
            return sanitized;
          });
      }
    }
  } catch (err) {
    console.error('Error reading apartments file:', err);
  }
  return [];
}

function writeApartments(apartments: any[]): void {
  try {
    const sanitized = apartments.map((a: any) => sanitizeApartmentPhones(a));
    const jsonStr = JSON.stringify(sanitized, null, 2);
    fs.writeFileSync(APARTMENTS_FILE, jsonStr, 'utf-8');
    const publicFile = path.join(process.cwd(), 'public', 'apartments.json');
    fs.writeFileSync(publicFile, jsonStr, 'utf-8');
  } catch (err) {
    console.error('Error writing apartments file:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Trust reverse proxies (Cloud Run / Vercel / Cloudflare) so external IPs are never blocked
  app.set('trust proxy', true);

  // Increase payload limit for base64 images from uploaded PDFs and ZIPs
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  // Enable CORS & Telegram WebApp Framing Headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Origin, x-admin-token, x-admin-auth'
    );
    // Allow embedding inside Telegram Desktop, Telegram Web, iOS & Android WebViews
    res.removeHeader('X-Frame-Options');
    res.header(
      'Content-Security-Policy',
      "frame-ancestors * https://*.telegram.org https://web.telegram.org https://t.me tg:;"
    );
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (!req.path.startsWith('/assets/')) {
      res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', '0');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Google Search Console site verification handler (serves any google*.html)
  app.get('/google*.html', (req, res) => {
    const filename = req.path.replace(/^\//, '');
    res.type('text/html').send(`google-site-verification: ${filename}`);
  });

  // Self-cleaning Service Worker route so clients with stale cached SWs immediately recover
  app.get(['/sw.js', '/registerSW.js'], (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(`
      self.addEventListener('install', function() { self.skipWaiting(); });
      self.addEventListener('activate', function(event) {
        event.waitUntil(
          caches.keys().then(function(names) {
            return Promise.all(names.map(function(n) { return caches.delete(n); }));
          }).then(function() {
            return self.registration.unregister();
          })
        );
      });
    `);
  });

  // Serve clean PWA Web App Manifest dynamically
  app.get('/manifest.webmanifest', (_req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.json({
      id: '/',
      name: 'Rentch — Аренда квартир в Тбилиси',
      short_name: 'Rentch',
      description:
        'Сервис поиска аренды квартир в Тбилиси в формате свайпов и онлайн-бронирования осмотров.',
      theme_color: '#f43f5e',
      background_color: '#fafaf9',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        {
          src: '/pwa-maskable-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    });
  });

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Daily Rental Booking notification & persistence endpoint
  app.post('/api/bookings/notify', (req, res) => {
    try {
      const { booking } = req.body || {};
      if (!booking || !booking.apartmentId) {
        return res.status(400).json({ ok: false, error: 'Invalid booking data' });
      }

      // 1. Update apartment's bookedRanges in data/apartments.json
      const apts = readApartments();
      const targetApt = apts.find((a: any) => a.id === booking.apartmentId);
      if (targetApt) {
        targetApt.bookedRanges = targetApt.bookedRanges || [];
        targetApt.bookedRanges.push({
          id: booking.id,
          startDate: booking.checkInDate,
          endDate: booking.checkOutDate,
          guestName: booking.guestName,
          guestPhone: booking.guestPhone,
        });
        writeApartments(apts);
      }

      // 2. Also register in CRM Leads as paid
      const leads = readCrmLeads();
      const newLead: any = {
        id: `crm-booking-${booking.id}`,
        clientName: booking.guestName,
        clientPhone: booking.guestPhone,
        clientTelegram: booking.guestTelegram,
        stage: 'paid',
        apartmentId: booking.apartmentId,
        apartmentTitle: booking.apartmentTitle,
        apartmentDistrict: booking.apartmentDistrict,
        apartmentAddress: booking.apartmentAddress,
        apartmentImage: booking.apartmentImage,
        apartmentPriceUsd: booking.totalAmount,
        paidAmountUsd: booking.totalAmount,
        registeredAt: 'Только что',
        notes: `ПОСУТОЧНАЯ АРЕНДА (ОПЛАЧЕНО 100%): Бронь #${booking.id} (${booking.checkInDate} — ${booking.checkOutDate}). Оплачено ${booking.totalAmountRub} ₽ ($${booking.totalAmount}). Комиссия сервиса 15%: $${booking.serviceFeeAmount}. Метод: ${booking.paymentMethod}. Код: ${booking.accessCode}`,
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: 'bot',
            text: `✅ Бронь #${booking.id} оплачена! Гость: ${booking.guestName}, тел: ${booking.guestPhone}. Заезд: ${booking.checkInDate}, выезд: ${booking.checkOutDate}. Код ключей: ${booking.accessCode}`,
            timestamp: 'только что',
          },
        ],
      };
      writeCrmLeads([newLead, ...leads]);

      // 3. Send Telegram notification if token configured
      const cfg = readTelegramConfig();
      const botToken = cfg.botToken || process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        const text = `🛎 <b>НОВАЯ ПОСУТОЧНАЯ БРОНЬ В RENTCH!</b>\n\n` +
          `🏠 <b>Объект:</b> ${booking.apartmentTitle}\n` +
          `📍 <b>Адрес:</b> ${booking.apartmentAddress}\n` +
          `👤 <b>Гость:</b> ${booking.guestName} (${booking.guestPhone} ${booking.guestTelegram || ''})\n` +
          `📅 <b>Даты:</b> ${booking.checkInDate} — ${booking.checkOutDate} (${booking.nightsCount} ноч.)\n` +
          `👥 <b>Гостей:</b> ${booking.guestsCount}\n` +
          `💳 <b>Оплачено:</b> ${booking.totalAmountRub} ₽ ($${booking.totalAmount})\n` +
          `💰 <b>Комиссия Rentch 15%:</b> +$${booking.serviceFeeAmount}\n` +
          `🔑 <b>Код от ключей/домофона:</b> <code>${booking.accessCode}</code>\n` +
          `🔖 <b>Номер брони:</b> <code>#${booking.id}</code>`;

        const subscribers = readTelegramSubscribers();
        for (const sub of subscribers) {
          if (sub.chatId) {
            fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: sub.chatId,
                text,
                parse_mode: 'HTML',
              }),
            }).catch(() => {});
          }
        }
      }

      res.json({ ok: true, bookingId: booking.id });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || 'Booking save error' });
    }
  });

  // Get today's, all-time, and historical view/swipe analytics
  app.get('/api/analytics', (_req, res) => {
    const today = getTodayAnalytics();
    const all = readAllAnalytics();
    const allDays = Object.values(all).sort((a, b) => b.date.localeCompare(a.date));

    const allTimeUniqueSet = new Set<string>();
    let allTimePageViews = 0;
    let allTimeApartmentViews = 0;
    let allTimeSwipesRight = 0;
    let allTimeSwipesLeft = 0;
    const allTimeBreakdown: Record<
      string,
      { title: string; views: number; likes: number; passes: number }
    > = {};

    for (const d of allDays) {
      if (Array.isArray(d.uniqueVisitorIds)) {
        for (const vid of d.uniqueVisitorIds) {
          if (vid) allTimeUniqueSet.add(vid);
        }
      }
      allTimePageViews += d.pageViews || 0;
      allTimeApartmentViews += d.apartmentViews || 0;
      allTimeSwipesRight += d.swipesRight || 0;
      allTimeSwipesLeft += d.swipesLeft || 0;

      if (d.apartmentBreakdown && typeof d.apartmentBreakdown === 'object') {
        for (const [aptId, b] of Object.entries(d.apartmentBreakdown)) {
          if (!b) continue;
          if (!allTimeBreakdown[aptId]) {
            allTimeBreakdown[aptId] = {
              title: b.title || 'Квартира в Тбилиси',
              views: 0,
              likes: 0,
              passes: 0,
            };
          }
          allTimeBreakdown[aptId].views += b.views || 0;
          allTimeBreakdown[aptId].likes += b.likes || 0;
          allTimeBreakdown[aptId].passes += b.passes || 0;
        }
      }
    }

    res.json({
      today: {
        ...today,
        uniqueVisitors: Array.isArray(today.uniqueVisitorIds)
          ? today.uniqueVisitorIds.length
          : 0,
        apartmentBreakdown:
          Object.keys(today.apartmentBreakdown || {}).length > 0
            ? today.apartmentBreakdown
            : allTimeBreakdown,
      },
      allTime: {
        uniqueVisitors: allTimeUniqueSet.size,
        pageViews: allTimePageViews,
        apartmentViews: allTimeApartmentViews,
        swipesRight: allTimeSwipesRight,
        swipesLeft: allTimeSwipesLeft,
        daysTracked: allDays.length,
        firstDate: allDays.length > 0 ? allDays[allDays.length - 1].date : today.date,
        apartmentBreakdown: allTimeBreakdown,
      },
      history: allDays.map((d) => ({
        date: d.date,
        pageViews: d.pageViews || 0,
        uniqueVisitors: Array.isArray(d.uniqueVisitorIds) ? d.uniqueVisitorIds.length : 0,
        apartmentViews: d.apartmentViews || 0,
        swipesRight: d.swipesRight || 0,
        swipesLeft: d.swipesLeft || 0,
        telegramClicks: d.telegramClicks || 0,
      })),
    });
  });

  // Record an analytics event
  app.post('/api/analytics/event', (req, res) => {
    const { type, visitorId, apartmentId, apartmentTitle } = req.body || {};
    const today = getTodayAnalytics();

    if (visitorId && typeof visitorId === 'string') {
      if (!Array.isArray(today.uniqueVisitorIds)) today.uniqueVisitorIds = [];
      if (!today.uniqueVisitorIds.includes(visitorId)) {
        today.uniqueVisitorIds.push(visitorId);
      }
    }

    if (!today.apartmentBreakdown) today.apartmentBreakdown = {};
    if (apartmentId && typeof apartmentId === 'string') {
      if (!today.apartmentBreakdown[apartmentId]) {
        today.apartmentBreakdown[apartmentId] = {
          title: apartmentTitle || 'Квартира в Тбилиси',
          views: 0,
          likes: 0,
          passes: 0,
        };
      } else if (apartmentTitle) {
        today.apartmentBreakdown[apartmentId].title = apartmentTitle;
      }
    }

    switch (type) {
      case 'page_view':
        today.pageViews = (today.pageViews || 0) + 1;
        break;
      case 'landing_view':
        today.pageViews = (today.pageViews || 0) + 1;
        today.landingViews = (today.landingViews || 0) + 1;
        break;
      case 'catalog_view':
        today.pageViews = (today.pageViews || 0) + 1;
        today.catalogViews = (today.catalogViews || 0) + 1;
        break;
      case 'apartment_view':
        today.apartmentViews = (today.apartmentViews || 0) + 1;
        if (apartmentId && today.apartmentBreakdown[apartmentId]) {
          today.apartmentBreakdown[apartmentId].views += 1;
        }
        break;
      case 'swipe_right':
        today.swipesRight = (today.swipesRight || 0) + 1;
        today.apartmentViews = (today.apartmentViews || 0) + 1;
        if (apartmentId && today.apartmentBreakdown[apartmentId]) {
          today.apartmentBreakdown[apartmentId].views += 1;
          today.apartmentBreakdown[apartmentId].likes += 1;
        }
        break;
      case 'swipe_left':
        today.swipesLeft = (today.swipesLeft || 0) + 1;
        today.apartmentViews = (today.apartmentViews || 0) + 1;
        if (apartmentId && today.apartmentBreakdown[apartmentId]) {
          today.apartmentBreakdown[apartmentId].views += 1;
          today.apartmentBreakdown[apartmentId].passes += 1;
        }
        break;
      case 'telegram_click':
        today.telegramClicks = (today.telegramClicks || 0) + 1;
        break;
      default:
        break;
    }

    saveTodayAnalytics(today);
    res.json({
      ok: true,
      today: {
        ...today,
        uniqueVisitors: today.uniqueVisitorIds.length,
      },
    });
  });

  const TELEGRAM_CONFIG_FILE = path.join(DATA_DIR, 'telegram_config.json');
  const TELEGRAM_SUBSCRIBERS_FILE = path.join(DATA_DIR, 'telegram_subscribers.json');
  const DOUBLE_RENTCH_NOTIFICATIONS_FILE = path.join(
    DATA_DIR,
    'double_rentch_notifications.json'
  );
  let activeBotPollingToken = '';
  let lastTelegramUpdateId = 0;
  let activeDirectTunnelUrl = '';
  let tunnelProcess: ReturnType<typeof spawn> | null = null;

  interface TelegramConfigData {
    botToken?: string;
    webAppUrl?: string;
    buttonText?: string;
    botUsername?: string;
    directTunnelUrl?: string;
    customDomain?: string;
  }

  interface TelegramSubscriber {
    chatId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    phone?: string;
    offerIds?: string[];
    updatedAt: string;
  }

  interface DoubleRentchNotification {
    id: string;
    createdAt: string;
    offerId: string;
    recipientName: string;
    recipientTelegram?: string;
    recipientChatId?: string;
    recipientPhone?: string;
    applicantName: string;
    applicantPhone: string;
    applicantTelegram?: string;
    apartmentId: string;
    apartmentTitle: string;
    apartmentDistrict?: string;
    apartmentAddress?: string;
    halfPriceFormatted: string;
    fullPriceFormatted: string;
    deliveredViaTelegram: boolean;
    deliveredAt?: string;
    readInWeb?: boolean;
  }

  function readTelegramConfig(): TelegramConfigData {
    try {
      if (fs.existsSync(TELEGRAM_CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(TELEGRAM_CONFIG_FILE, 'utf-8')) || {};
      }
    } catch {}
    return {};
  }

  function writeTelegramConfig(cfg: TelegramConfigData) {
    try {
      fs.writeFileSync(TELEGRAM_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
    } catch {}
  }

  function readTelegramSubscribers(): TelegramSubscriber[] {
    try {
      if (fs.existsSync(TELEGRAM_SUBSCRIBERS_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(TELEGRAM_SUBSCRIBERS_FILE, 'utf-8'));
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  function writeTelegramSubscribers(subs: TelegramSubscriber[]) {
    try {
      fs.writeFileSync(TELEGRAM_SUBSCRIBERS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
    } catch {}
  }

  function readDoubleRentchNotifications(): DoubleRentchNotification[] {
    try {
      if (fs.existsSync(DOUBLE_RENTCH_NOTIFICATIONS_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(DOUBLE_RENTCH_NOTIFICATIONS_FILE, 'utf-8'));
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  function writeDoubleRentchNotifications(items: DoubleRentchNotification[]) {
    try {
      fs.writeFileSync(
        DOUBLE_RENTCH_NOTIFICATIONS_FILE,
        JSON.stringify(items.slice(0, 300), null, 2),
        'utf-8'
      );
    } catch {}
  }

  function normalizeTgHandle(handle?: string): string {
    if (!handle) return '';
    return String(handle)
      .trim()
      .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '')
      .replace(/^@/, '')
      .toLowerCase();
  }

  function normalizePhoneDigits(phone?: string): string {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '');
  }

  function upsertTelegramSubscriber(input: {
    chatId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    phone?: string;
    offerId?: string;
  }): TelegramSubscriber {
    const subs = readTelegramSubscribers();
    const cleanChatId = String(input.chatId).trim();
    const cleanUsername = normalizeTgHandle(input.username);
    const fullName =
      input.fullName?.trim() ||
      [input.firstName, input.lastName].filter(Boolean).join(' ').trim();

    let existing = subs.find(
      (s) =>
        s.chatId === cleanChatId ||
        (cleanUsername && normalizeTgHandle(s.username) === cleanUsername)
    );

    if (existing) {
      existing.chatId = cleanChatId || existing.chatId;
      if (cleanUsername) existing.username = cleanUsername;
      if (input.firstName) existing.firstName = input.firstName;
      if (input.lastName) existing.lastName = input.lastName;
      if (fullName) existing.fullName = fullName;
      if (input.phone) existing.phone = input.phone;
      if (input.offerId) {
        existing.offerIds = Array.from(new Set([...(existing.offerIds || []), input.offerId]));
      }
      existing.updatedAt = new Date().toISOString();
    } else {
      existing = {
        chatId: cleanChatId,
        username: cleanUsername || undefined,
        firstName: input.firstName,
        lastName: input.lastName,
        fullName: fullName || undefined,
        phone: input.phone,
        offerIds: input.offerId ? [input.offerId] : [],
        updatedAt: new Date().toISOString(),
      };
      subs.unshift(existing);
    }

    writeTelegramSubscribers(subs);

    // Also link chatId to any matching roommate offers in data/roommates.json
    try {
      if (fs.existsSync(ROOMMATES_FILE)) {
        const offers = JSON.parse(fs.readFileSync(ROOMMATES_FILE, 'utf-8'));
        if (Array.isArray(offers)) {
          let changed = false;
          for (const offer of offers) {
            if (!offer) continue;
            const offerTg = normalizeTgHandle(offer.telegram);
            const nameMatch =
              fullName &&
              offer.userName &&
              offer.userName.trim().toLowerCase() === fullName.toLowerCase();
            const idMatch = input.offerId && offer.id === input.offerId;
            const tgMatch = cleanUsername && offerTg && offerTg === cleanUsername;
            if (idMatch || tgMatch || nameMatch) {
              if (cleanChatId && offer.telegramChatId !== cleanChatId) {
                offer.telegramChatId = cleanChatId;
                changed = true;
              }
              if (cleanUsername && !offer.telegram) {
                offer.telegram = `@${cleanUsername}`;
                changed = true;
              }
            }
          }
          if (changed) {
            fs.writeFileSync(ROOMMATES_FILE, JSON.stringify(offers, null, 2), 'utf-8');
          }
        }
      }
    } catch {}

    return existing;
  }

  function findSubscriberChatIdsForOffer(offer: {
    id?: string;
    userName?: string;
    telegram?: string;
    telegramChatId?: string;
    phone?: string;
  }): string[] {
    const chatIds = new Set<string>();
    if (offer.telegramChatId && /^\d+$/.test(String(offer.telegramChatId).trim())) {
      chatIds.add(String(offer.telegramChatId).trim());
    }

    const subs = readTelegramSubscribers();
    const targetUsername = normalizeTgHandle(offer.telegram);
    const targetPhone = normalizePhoneDigits(offer.phone);
    const targetName = (offer.userName || '').trim().toLowerCase();

    for (const s of subs) {
      if (!s.chatId) continue;
      if (offer.id && Array.isArray(s.offerIds) && s.offerIds.includes(offer.id)) {
        chatIds.add(s.chatId);
      }
      if (targetUsername && normalizeTgHandle(s.username) === targetUsername) {
        chatIds.add(s.chatId);
      }
      if (targetPhone && targetPhone.length >= 6 && normalizePhoneDigits(s.phone) === targetPhone) {
        chatIds.add(s.chatId);
      }
      if (
        targetName &&
        ((s.fullName && s.fullName.trim().toLowerCase() === targetName) ||
          (s.firstName && s.firstName.trim().toLowerCase() === targetName))
      ) {
        chatIds.add(s.chatId);
      }
    }

    return Array.from(chatIds);
  }

  function buildDoubleRentchTelegramMessage(notif: DoubleRentchNotification): string {
    const applicantTgFormatted = notif.applicantTelegram
      ? `@${normalizeTgHandle(notif.applicantTelegram)}`
      : 'не указан';
    return (
      `🔔 *Новая заявка Double Rentch! (Соседи 50/50)*\n\n` +
      `Здравствуйте, *${notif.recipientName}*! На вашу анкету совместной аренды в сервисе *Rentch* поступила заявка:\n\n` +
      `👤 *Кандидат в соседи:* ${notif.applicantName}\n` +
      `📞 *Телефон (WhatsApp / Telegram):* \`${notif.applicantPhone}\`\n` +
      `✈️ *Telegram кандидата:* ${applicantTgFormatted}\n\n` +
      `🏠 *Квартира:* «${notif.apartmentTitle}»\n` +
      `📍 *Район / Адрес:* ${notif.apartmentDistrict || 'Тбилиси'}${
        notif.apartmentAddress ? `, ${notif.apartmentAddress}` : ''
      }\n` +
      `💰 *Стоимость 50/50:* *${notif.halfPriceFormatted}/мес* с человека (полная: ${notif.fullPriceFormatted}/мес)\n\n` +
      `💬 В приложении Rentch уже создан ваш общий диалог (*Вы + ${notif.applicantName} + Администратор Rentch*) для записи на совместный просмотр!`
    );
  }

  async function dispatchTelegramDoubleRentchNotification(
    notif: DoubleRentchNotification,
    targetChatIds: string[]
  ): Promise<boolean> {
    const cfg = readTelegramConfig();
    const token = (cfg.botToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();
    if (!token) return false;

    const appBaseUrl =
      cfg.customDomain ||
      activeDirectTunnelUrl ||
      cfg.directTunnelUrl ||
      cfg.webAppUrl ||
      'https://ais-pre-vfmvc5thvz3oa4jztgpvwc-295761084674.europe-west1.run.app';
    const cleanBaseUrl = appBaseUrl.replace(/\/+$/, '');
    const chatDeepLink = `${cleanBaseUrl}/?apartment=${encodeURIComponent(notif.apartmentId)}`;
    const cleanApplicantTg = normalizeTgHandle(notif.applicantTelegram);

    const inlineKeyboard: any[][] = [
      [
        {
          text: '💬 Открыть общий чат в Rentch',
          url: chatDeepLink,
        },
      ],
    ];
    if (cleanApplicantTg) {
      inlineKeyboard.push([
        {
          text: `✈️ Написать ${notif.applicantName} в Telegram`,
          url: `https://t.me/${cleanApplicantTg}`,
        },
      ]);
    }

    const messageText = buildDoubleRentchTelegramMessage(notif);
    let deliveredToRecipient = false;

    // 1. Send directly to target roommate's chatId(s)
    for (const chatId of targetChatIds) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: messageText,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: inlineKeyboard },
          }),
        });
        const data = await res.json();
        if (data?.ok) {
          deliveredToRecipient = true;
        }
      } catch {}
    }

    // 2. If recipient has @username and wasn't in numeric chatIds, also try sending to @username
    const recipientHandle = normalizeTgHandle(notif.recipientTelegram);
    if (!deliveredToRecipient && recipientHandle) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: `@${recipientHandle}`,
            text: messageText,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: inlineKeyboard },
          }),
        });
        const data = await res.json();
        if (data?.ok) {
          deliveredToRecipient = true;
        }
      } catch {}
    }

    // 3. Also send a copy to all active bot subscribers who haven't received it yet if they are admin/owner
    const allSubs = readTelegramSubscribers();
    for (const sub of allSubs.slice(0, 5)) {
      if (targetChatIds.includes(sub.chatId)) continue;
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: sub.chatId,
            text: messageText,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: inlineKeyboard },
          }),
        });
      } catch {}
    }

    return deliveredToRecipient;
  }

  // Automatically start a direct HTTPS Cloudflare Tunnel so Telegram Mini App bypasses Google AI Studio's frame-ancestors block
  function startDirectTelegramTunnel() {
    if (tunnelProcess) return;
    try {
      const binPath = '/tmp/cloudflared';
      if (!fs.existsSync(binPath)) {
        execSync(
          'curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared && chmod +x /tmp/cloudflared',
          { stdio: 'ignore', timeout: 20000 }
        );
      }
      if (!fs.existsSync(binPath)) return;

      const child = spawn(
        binPath,
        ['tunnel', '--url', 'http://localhost:3000', '--no-autoupdate', '--protocol', 'http2'],
        { stdio: ['ignore', 'pipe', 'pipe'] }
      );
      tunnelProcess = child;

      const handleOutput = (chunk: Buffer) => {
        const str = chunk.toString('utf-8');
        const match = str.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
        if (match && match[0]) {
          const detectedUrl = match[0].trim();
          if (detectedUrl !== activeDirectTunnelUrl) {
            activeDirectTunnelUrl = detectedUrl;
            console.log('[Telegram Direct Tunnel Ready]:', activeDirectTunnelUrl);
            const cfg = readTelegramConfig();
            writeTelegramConfig({
              ...cfg,
              directTunnelUrl: activeDirectTunnelUrl,
            });
            // Auto-sync Telegram Menu Button if botToken is already configured
            const token = (cfg.botToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();
            if (token) {
              fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  menu_button: {
                    type: 'web_app',
                    text: (cfg.buttonText || '🏠 Свайпать квартиры').trim(),
                    web_app: { url: cfg.customDomain || activeDirectTunnelUrl },
                  },
                }),
              }).catch(() => {});
            }
          }
        }
      };

      child.stdout?.on('data', handleOutput);
      child.stderr?.on('data', handleOutput);
      child.on('exit', () => {
        tunnelProcess = null;
        setTimeout(startDirectTelegramTunnel, 5000);
      });
    } catch (e) {
      console.error('Failed to start cloudflared tunnel:', e);
    }
  }

  startDirectTelegramTunnel();

  app.get('/api/telegram/tunnel-status', (_req, res) => {
    const cfg = readTelegramConfig();
    res.json({
      ok: true,
      directTunnelUrl: activeDirectTunnelUrl || cfg.directTunnelUrl || '',
      customDomain: cfg.customDomain || '',
      botUsername: cfg.botUsername || 'rentch_date_bot',
      buttonText: cfg.buttonText || '🏠 Свайпать квартиры',
      hasBotToken: Boolean(cfg.botToken || process.env.TELEGRAM_BOT_TOKEN),
      subscribersCount: readTelegramSubscribers().length,
    });
  });

  // Register a Telegram user (from Telegram Mini App initDataUnsafe.user or profile form)
  app.post('/api/telegram/register-user', (req, res) => {
    try {
      const { chatId, username, firstName, lastName, fullName, phone, offerId } = req.body || {};
      if (!chatId && !username) {
        return res.status(400).json({ ok: false, error: 'chatId or username required' });
      }
      const sub = upsertTelegramSubscriber({
        chatId: String(chatId || ''),
        username,
        firstName,
        lastName,
        fullName,
        phone,
        offerId,
      });
      res.json({ ok: true, subscriber: sub });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || 'Error registering Telegram user' });
    }
  });

  // Send Telegram notification to the roommate on whom a Double Rentch! 50/50 application was submitted
  app.post('/api/roommates/notify-double-rentch', async (req, res) => {
    try {
      const { offer, apartment, applicant } = req.body || {};
      if (!offer || !apartment || !applicant) {
        return res.status(400).json({ ok: false, error: 'Missing offer, apartment, or applicant' });
      }

      const halfUsd = Math.round((Number(apartment.priceUsd) || 0) / 2);
      const halfPriceFormatted =
        apartment.currency === 'EUR' || apartment.city === 'belgrade'
          ? `€${halfUsd}`
          : apartment.currency === 'GEL'
          ? `${Math.round(((Number(apartment.priceGel) || Number(apartment.priceUsd) * 2.72) || 0) / 2)} ₾`
          : `$${halfUsd}`;
      const fullPriceFormatted =
        apartment.currency === 'EUR' || apartment.city === 'belgrade'
          ? `€${apartment.priceUsd}`
          : `$${apartment.priceUsd}`;

      const targetChatIds = findSubscriberChatIdsForOffer(offer);

      const notif: DoubleRentchNotification = {
        id: 'dr-notif-' + Date.now(),
        createdAt: new Date().toISOString(),
        offerId: String(offer.id || ''),
        recipientName: String(offer.userName || 'Сосед 50/50'),
        recipientTelegram: offer.telegram || undefined,
        recipientChatId: targetChatIds[0] || offer.telegramChatId || undefined,
        recipientPhone: offer.phone || undefined,
        applicantName: String(applicant.name || 'Клиент Rentch'),
        applicantPhone: String(applicant.phone || ''),
        applicantTelegram: applicant.telegramUsername || undefined,
        apartmentId: String(apartment.id || ''),
        apartmentTitle: String(apartment.title || 'Квартира в Rentch'),
        apartmentDistrict: apartment.district || undefined,
        apartmentAddress: apartment.address || undefined,
        halfPriceFormatted,
        fullPriceFormatted,
        deliveredViaTelegram: false,
        readInWeb: false,
      };

      const deliveredViaBot = await dispatchTelegramDoubleRentchNotification(notif, targetChatIds);
      if (deliveredViaBot) {
        notif.deliveredViaTelegram = true;
        notif.deliveredAt = new Date().toISOString();
      }

      const existingNotifs = readDoubleRentchNotifications();
      writeDoubleRentchNotifications([notif, ...existingNotifs]);

      const cfg = readTelegramConfig();
      const botUsername = cfg.botUsername || 'rentch_date_bot';
      const cleanRecipientTg = normalizeTgHandle(offer.telegram);
      const prefilledText = encodeURIComponent(
        `Привет, ${notif.recipientName}! 👋 Я отправил(а) тебе заявку Double Rentch! 50/50 в сервисе Rentch по квартире «${notif.apartmentTitle}» (${notif.halfPriceFormatted}/мес с человека). Мои контакты: ${notif.applicantName}, ${notif.applicantPhone}. Давай снимем её вместе и сходим на совместный просмотр!`
      );
      const directTelegramUrl = cleanRecipientTg
        ? `https://t.me/${cleanRecipientTg}?text=${prefilledText}`
        : `https://t.me/share/url?url=${encodeURIComponent(
            cfg.customDomain || activeDirectTunnelUrl || cfg.directTunnelUrl || ''
          )}&text=${prefilledText}`;

      res.json({
        ok: true,
        deliveredViaBot,
        recipientName: notif.recipientName,
        recipientTelegram: cleanRecipientTg ? `@${cleanRecipientTg}` : null,
        directTelegramUrl,
        botSubscribeUrl: `https://t.me/${botUsername}?start=notify_${encodeURIComponent(
          notif.offerId || cleanRecipientTg || 'roommate'
        )}`,
        notification: notif,
      });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || 'Error sending Double Rentch notification' });
    }
  });

  // Get Double Rentch notifications (for web/in-app delivery to the person whose offer was swiped)
  app.get('/api/roommates/notifications', (_req, res) => {
    res.json({
      ok: true,
      notifications: readDoubleRentchNotifications(),
    });
  });

  // Configure and preserve user's custom landing domain for the full Web Version
  app.post('/api/domain/configure', (req, res) => {
    try {
      let rawDomain = String(req.body?.customDomain || '').trim();
      if (rawDomain && !rawDomain.startsWith('http://') && !rawDomain.startsWith('https://')) {
        rawDomain = 'https://' + rawDomain;
      }
      rawDomain = rawDomain.replace(/\/+$/, '');
      const cfg = readTelegramConfig();
      writeTelegramConfig({
        ...cfg,
        customDomain: rawDomain || undefined,
      });
      res.json({
        ok: true,
        customDomain: rawDomain,
        directTunnelUrl: activeDirectTunnelUrl || cfg.directTunnelUrl || '',
      });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || 'Failed to save custom domain' });
    }
  });

  // Privacy Policy route for Google Play and Store compliance
  app.get('/privacy', (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'privacy.html'));
  });

  // Generate a ready-to-upload index.html that replaces the user's landing page with the full Rentch Web App while keeping their landing domain
  app.get('/api/domain/web-loader.html', (req, res) => {
    const cfg = readTelegramConfig();
    const customDomain = String(req.query.domain || cfg.customDomain || 'ваш-домен').trim();
    const backendUrl =
      activeDirectTunnelUrl ||
      cfg.directTunnelUrl ||
      'https://ais-pre-vfmvc5thvz3oa4jztgpvwc-295761084674.europe-west1.run.app';

    const htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>Rentch — Свайп-платформа аренды квартир в Тбилиси, Ереване и Белграде</title>
  <meta name="description" content="Веб-приложение поиска квартир и соседей 50/50 (Double Rentch!) в формате свайпов, интерактивной карты и онлайн-записи на просмотр." />
  <meta name="theme-color" content="#f43f5e" />
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #fafaf9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #rentch-webapp-frame {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
    }
  </style>
</head>
<body>
  <!-- Полная Web-версия приложения Rentch на домене ${escapeHtml(customDomain)} -->
  <iframe
    id="rentch-webapp-frame"
    src="${escapeHtml(backendUrl)}/?web=1"
    allow="geolocation; clipboard-write; web-share"
    allowfullscreen
  ></iframe>
  <script>
    (function() {
      try {
        if (window.Telegram && window.Telegram.WebApp) {
          window.Telegram.WebApp.ready();
          window.Telegram.WebApp.expand();
        }
        var frame = document.getElementById('rentch-webapp-frame');
        var search = window.location.search || '';
        var hash = window.location.hash || '';
        if (frame && (search || hash)) {
          var base = "${escapeHtml(backendUrl)}/";
          var sep = search ? search + '&web=1' : '?web=1';
          frame.src = base + sep + hash;
        }
      } catch (e) {}
    })();
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="index.html"');
    res.send(htmlContent);
  });

  async function pollTelegramBotUpdates() {
    const cfg = readTelegramConfig();
    const token = (cfg.botToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();
    if (!token) return;
    activeBotPollingToken = token;
    const savedUrl = (cfg.customDomain || cfg.webAppUrl || '').trim();
    const isAiStudioProxy =
      !savedUrl || savedUrl.includes('ais-pre-') || savedUrl.includes('ais-dev-');
    const webAppUrl =
      isAiStudioProxy && (activeDirectTunnelUrl || cfg.directTunnelUrl)
        ? activeDirectTunnelUrl || cfg.directTunnelUrl!
        : savedUrl.replace('://ais-dev-', '://ais-pre-') ||
          activeDirectTunnelUrl ||
          'https://ais-pre-vfmvc5thvz3oa4jztgpvwc-295761084674.europe-west1.run.app';
    const buttonText = (cfg.buttonText || '🏠 Свайпать квартиры').trim();

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/getUpdates?offset=${lastTelegramUpdateId + 1}&timeout=0&allowed_updates=%5B%22message%22%5D`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.ok || !Array.isArray(data.result)) return;

      for (const update of data.result) {
        if (update.update_id > lastTelegramUpdateId) {
          lastTelegramUpdateId = update.update_id;
        }
        const msg = update.message;
        if (msg?.chat?.id) {
          const chatIdStr = String(msg.chat.id);
          const text = typeof msg.text === 'string' ? msg.text.trim() : '';
          const startArg = text.startsWith('/start ') ? text.slice(7).trim() : '';
          const linkedOfferId = startArg.startsWith('notify_')
            ? startArg.replace(/^notify_/, '').trim()
            : undefined;

          // Register this Telegram user so Double Rentch! 50/50 notifications can be pushed directly to them
          const sub = upsertTelegramSubscriber({
            chatId: chatIdStr,
            username: msg.from?.username,
            firstName: msg.from?.first_name,
            lastName: msg.from?.last_name,
            phone: msg.contact?.phone_number,
            offerId: linkedOfferId,
          });

          // Check if there are any pending Double Rentch! notifications for this user and deliver them immediately
          const allNotifs = readDoubleRentchNotifications();
          let notifsUpdated = false;
          for (const n of allNotifs) {
            if (n.deliveredViaTelegram) continue;
            const nHandle = normalizeTgHandle(n.recipientTelegram);
            const subHandle = normalizeTgHandle(sub.username);
            const isMatch =
              (linkedOfferId && n.offerId === linkedOfferId) ||
              (nHandle && subHandle && nHandle === subHandle) ||
              (sub.fullName &&
                n.recipientName.trim().toLowerCase() === sub.fullName.trim().toLowerCase());
            if (isMatch) {
              const sent = await dispatchTelegramDoubleRentchNotification(n, [chatIdStr]);
              if (sent) {
                n.deliveredViaTelegram = true;
                n.deliveredAt = new Date().toISOString();
                notifsUpdated = true;
              }
            }
          }
          if (notifsUpdated) {
            writeDoubleRentchNotifications(allNotifs);
          }

          if (linkedOfferId) {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: msg.chat.id,
                text: `🔔 Оповещения Double Rentch! (Соседи 50/50) успешно подключены!\n\nКак только кто-то отправит заявку на вашу анкету соседа, вам мгновенно придёт сюда уведомление с именем, телефоном и Telegram кандидата.`,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: buttonText,
                        web_app: { url: webAppUrl },
                      },
                    ],
                  ],
                },
              }),
            }).catch(() => {});
          } else if (text.startsWith('/start') || text.toLowerCase().includes('квартир')) {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: msg.chat.id,
                text: `Добро пожаловать в Rentch 🇬🇪 — сервис подбора проверенных квартир и соседей 50/50 (Double Rentch!) в Тбилиси, Ереване и Белграде!\n\n🔔 Вы также подписаны на мгновенные уведомления о заявках Double Rentch!\n👇 Нажмите кнопку ниже, чтобы открыть приложение:`,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: buttonText,
                        web_app: { url: webAppUrl },
                      },
                    ],
                    [
                      {
                        text: '🌐 Открыть Web-версию в браузере',
                        url: webAppUrl,
                      },
                    ],
                  ],
                },
              }),
            }).catch(() => {});
          }
        }
      }
    } catch {
      // Ignore transient polling errors
    }
  }

  setInterval(() => {
    pollTelegramBotUpdates().catch(() => {});
  }, 4000);

  // Configure Telegram Bot Menu Button (WebApp) in 1 click via Bot Token
  app.post('/api/telegram/setup-webapp', async (req, res) => {
    try {
      const savedCfg = readTelegramConfig();
      const token = String(req.body?.botToken || savedCfg.botToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();
      let webAppUrl = String(
        req.body?.webAppUrl ||
          activeDirectTunnelUrl ||
          savedCfg.directTunnelUrl ||
          savedCfg.webAppUrl ||
          'https://ais-pre-vfmvc5thvz3oa4jztgpvwc-295761084674.europe-west1.run.app'
      ).trim();
      // If user left ais-pre or ais-dev URL, automatically replace with direct tunnel URL so Telegram WebView never errors!
      if (
        (webAppUrl.includes('ais-pre-') || webAppUrl.includes('ais-dev-')) &&
        (activeDirectTunnelUrl || savedCfg.directTunnelUrl)
      ) {
        webAppUrl = activeDirectTunnelUrl || savedCfg.directTunnelUrl!;
      } else {
        webAppUrl = webAppUrl.replace('://ais-dev-', '://ais-pre-');
      }
      if (!webAppUrl.startsWith('https://')) {
        webAppUrl = 'https://' + webAppUrl.replace(/^http:\/\//i, '');
      }
      const buttonText = String(req.body?.buttonText || savedCfg.buttonText || '🏠 Свайпать квартиры').trim();

      if (!token) {
        return res.status(400).json({ error: 'Введите токен бота из @BotFather' });
      }

      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const meJson = await meRes.json();
      if (!meJson?.ok) {
        return res.status(400).json({
          error: meJson?.description || 'Неверный токен бота Telegram',
        });
      }

      // Remove any broken webhook so /start polling works cleanly
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`).catch(() => {});

      // Set Default Chat Menu Button for all users
      const menuRes = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_button: {
            type: 'web_app',
            text: buttonText,
            web_app: {
              url: webAppUrl,
            },
          },
        }),
      });
      const menuJson = await menuRes.json();
      if (!menuJson?.ok) {
        return res.status(400).json({
          error: menuJson?.description || 'Не удалось обновить кнопку меню в Telegram',
        });
      }

      const botUsername = meJson.result?.username || 'rentch_date_bot';
      writeTelegramConfig({
        botToken: token,
        webAppUrl,
        buttonText,
        botUsername,
        directTunnelUrl: activeDirectTunnelUrl || savedCfg.directTunnelUrl,
      });

      res.json({
        ok: true,
        botUsername,
        webAppUrl,
        buttonText,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Ошибка соединения с Telegram API' });
    }
  });

  // Get all CRM leads (automatically reconciled with active user chats)
  app.get('/api/crm/leads', (_req, res) => {
    const currentLeads = readCrmLeads();
    const currentChats = readChats();
    const currentApts = readApartments();
    const { leads: reconciled, changed } = reconcileChatsIntoLeads(
      currentChats,
      currentLeads,
      currentApts
    );
    if (changed) {
      writeCrmLeads(reconciled);
    }
    res.json(reconciled);
  });

  const isAuthorizedAdminReq = (req: any): boolean => {
    const token = String(req.headers['x-admin-token'] || '').trim();
    if (token) {
      const sessions = readAdminSessions();
      const session = sessions[token];
      if (session && session.expiresAt > Date.now()) {
        return true;
      }
    }
    const header = String(req.headers['x-admin-auth'] || '').trim();
    const expectedHeader = `${ADMIN_EMAIL}:${ADMIN_PASSWORD}`;
    return timingSafeMatch(header, expectedHeader);
  };

  // Server-side Admin Login with Brute-Force Protection & Security Audit Log
  app.post('/api/admin/login', (req, res) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const rate = loginRateLimiter.get(ip);

    if (rate && rate.lockUntil > now) {
      const waitMin = Math.ceil((rate.lockUntil - now) / 60000);
      appendAdminAudit(req, {
        event: 'blocked_brute_force',
        email: String(req.body?.email || ''),
        details: `Заблокирована попытка перебора пароля (превышен лимит 5 попыток). Блокировка IP ещё на ${waitMin} мин.`,
        status: 'danger',
      });
      return res.status(429).json({
        ok: false,
        error: `Слишком много неудачных попыток входа. Подождите ${waitMin} мин.`,
      });
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '').trim();

    const emailOk = timingSafeMatch(email, ADMIN_EMAIL);
    const passOk = timingSafeMatch(password, ADMIN_PASSWORD);

    if (!emailOk || !passOk) {
      const prevCount = rate ? rate.count : 0;
      const nextCount = prevCount + 1;
      const lockUntil = nextCount >= 5 ? now + 15 * 60 * 1000 : 0;
      loginRateLimiter.set(ip, { count: nextCount, lockUntil });

      appendAdminAudit(req, {
        event: 'login_failed',
        email: email || 'не указан',
        details: `Неудачная попытка входа в админ-панель (попытка ${nextCount} из 5).`,
        status: 'warning',
      });

      return res.status(401).json({
        ok: false,
        error: 'Неверный логин или пароль администратора',
      });
    }

    // Successful login: reset rate limit, issue 256-bit cryptographic session token
    loginRateLimiter.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    const sessions = readAdminSessions();
    // Prune expired sessions
    for (const [k, v] of Object.entries(sessions)) {
      if (!v || v.expiresAt < now) delete sessions[k];
    }
    const ua = String(req.headers['user-agent'] || '');
    sessions[token] = {
      token,
      ip,
      deviceSummary: summarizeUserAgent(ua),
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    writeAdminSessions(sessions);

    appendAdminAudit(req, {
      event: 'login_success',
      email: ADMIN_EMAIL,
      details: 'Успешный вход владельца (ai9292@mail.ru) в панель администратора.',
      status: 'success',
    });

    res.json({ ok: true, token });
  });

  app.post('/api/admin/logout', (req, res) => {
    const token = String(req.headers['x-admin-token'] || '').trim();
    if (token) {
      const sessions = readAdminSessions();
      if (sessions[token]) {
        delete sessions[token];
        writeAdminSessions(sessions);
      }
    }
    res.json({ ok: true });
  });

  // Get Admin Security Audit Log & Active Sessions
  app.get('/api/admin/audit', (req, res) => {
    if (!isAuthorizedAdminReq(req)) {
      return res.status(403).json({ error: 'Доступ разрешён только администратору' });
    }
    const audit = readAdminAudit();
    const sessions = readAdminSessions();
    const now = Date.now();
    const activeSessions = Object.values(sessions)
      .filter((s) => s && s.expiresAt > now)
      .map((s) => ({
        ip: s.ip,
        deviceSummary: s.deviceSummary,
        createdAt: new Date(s.createdAt).toLocaleString('ru-RU'),
      }));
    const hasBackup = fs.existsSync(CRM_LEADS_BACKUP_FILE);
    res.json({
      ok: true,
      audit,
      activeSessions,
      hasBackup,
    });
  });

  // Restore deleted CRM leads & right-swipes from automatic server backup
  app.post('/api/admin/restore-backup', (req, res) => {
    if (!isAuthorizedAdminReq(req)) {
      return res.status(403).json({ error: 'Доступ разрешён только администратору' });
    }
    let restoredLeads: any[] = [];
    if (fs.existsSync(CRM_LEADS_BACKUP_FILE)) {
      try {
        restoredLeads = JSON.parse(fs.readFileSync(CRM_LEADS_BACKUP_FILE, 'utf-8'));
      } catch {}
    }
    if (fs.existsSync(CHATS_BACKUP_FILE)) {
      try {
        const backupChats = JSON.parse(fs.readFileSync(CHATS_BACKUP_FILE, 'utf-8'));
        const mergedChats = mergeChatsData(readChats(), backupChats);
        writeChats(mergedChats);
      } catch {}
    }
    const currentLeads = readCrmLeads();
    const mergedLeads = mergeLeadsData(currentLeads, restoredLeads, false);
    const { leads: reconciled } = reconcileChatsIntoLeads(
      readChats(),
      mergedLeads,
      readApartments()
    );
    writeCrmLeads(reconciled);

    appendAdminAudit(req, {
      event: 'restore_backup',
      email: ADMIN_EMAIL,
      details: `Восстановлены лиды и свайпы вправо из резервной копии (всего лидов: ${reconciled.length}).`,
      status: 'info',
    });

    res.json({ ok: true, leads: reconciled, chats: readChats() });
  });

  // Save or sync CRM leads (merges safely so no client overwrites another client's leads)
  app.post('/api/crm/leads', (req, res) => {
    const { leads, isAdminUpdate, replace } = req.body;
    if (!Array.isArray(leads)) {
      return res.status(400).json({ error: 'leads array is required' });
    }
    const adminVerified = Boolean(isAdminUpdate) && isAuthorizedAdminReq(req);
    if (replace === true && adminVerified) {
      writeCrmLeads(leads);
      return res.json({ success: true, leads });
    }
    const existing = readCrmLeads();
    const merged = mergeLeadsData(existing, leads, adminVerified);
    const currentChats = readChats();
    const currentApts = readApartments();
    const { leads: reconciled } = reconcileChatsIntoLeads(currentChats, merged, currentApts);
    writeCrmLeads(reconciled);
    res.json({ success: true, leads: reconciled });
  });

  // Delete a specific CRM lead (strictly restricted to admin ai9292@mail.ru)
  app.delete('/api/crm/leads/:id', (req, res) => {
    if (!isAuthorizedAdminReq(req)) {
      appendAdminAudit(req, {
        event: 'login_failed',
        details: `Заблокирована несанкционированная попытка удаления лида ${req.params.id}.`,
        status: 'danger',
      });
      return res.status(403).json({ error: 'Доступ разрешён только администратору (ai9292@mail.ru)' });
    }
    const leadId = req.params.id;
    const existing = readCrmLeads();
    const target = existing.find((l: any) => l && l.id === leadId);
    const filtered = existing.filter((l: any) => l && l.id !== leadId);
    writeCrmLeads(filtered);

    appendAdminAudit(req, {
      event: 'delete_lead',
      email: ADMIN_EMAIL,
      details: `Администратор удалил лид «${target?.clientName || leadId}» (${target?.apartmentTitle || ''}).`,
      status: 'info',
    });

    // Also clear user messages/confirmation in chats for that apartment so it doesn't auto-recreate
    const aptId = target?.apartmentId || (leadId.startsWith('crm-chat-') ? leadId.replace('crm-chat-', '') : null);
    if (aptId) {
      const currentChats = readChats();
      if (currentChats[aptId]) {
        delete currentChats[aptId];
        writeChats(currentChats);
      }
    }

    res.json({ success: true, leads: filtered });
  });

  // Clear all CRM leads (strictly restricted to admin ai9292@mail.ru)
  app.delete('/api/crm/leads', (req, res) => {
    if (!isAuthorizedAdminReq(req)) {
      appendAdminAudit(req, {
        event: 'login_failed',
        details: 'Заблокирована несанкционированная попытка очистки всех лидов CRM.',
        status: 'danger',
      });
      return res.status(403).json({ error: 'Доступ разрешён только администратору (ai9292@mail.ru)' });
    }
    writeCrmLeads([]);
    writeChats({});
    appendAdminAudit(req, {
      event: 'clear_all_leads',
      email: ADMIN_EMAIL,
      details: 'Администратор очистил все лиды CRM.',
      status: 'warning',
    });
    res.json({ success: true, leads: [] });
  });

  // Get all chats
  app.get('/api/chats', (_req, res) => {
    res.json(readChats());
  });

  // Get all roommate co-renting offers
  app.get('/api/roommates', (_req, res) => {
    try {
      if (fs.existsSync(ROOMMATES_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(ROOMMATES_FILE, 'utf-8'));
        if (Array.isArray(parsed)) return res.json(parsed);
      }
    } catch (e) {}
    res.json([]);
  });

  // Create a roommate co-renting offer
  app.post('/api/roommates', (req, res) => {
    try {
      const offer = req.body;
      if (!offer || !offer.id || !offer.apartmentId) {
        return res.status(400).json({ error: 'Invalid roommate offer' });
      }
      let existing: any[] = [];
      if (fs.existsSync(ROOMMATES_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(ROOMMATES_FILE, 'utf-8'));
        if (Array.isArray(parsed)) existing = parsed;
      }
      const updated = [offer, ...existing.filter((o) => o && o.id !== offer.id)];
      fs.writeFileSync(ROOMMATES_FILE, JSON.stringify(updated, null, 2), 'utf-8');
      res.json({ ok: true, offers: updated });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Error saving roommate offer' });
    }
  });

  // Save or sync chats (merges messages and automatically reconciles user messages/bookings into CRM leads)
  app.post('/api/chats', (req, res) => {
    const { chats } = req.body;
    if (!chats || typeof chats !== 'object') {
      return res.status(400).json({ error: 'chats object is required' });
    }
    const existingChats = readChats();
    const mergedChats = mergeChatsData(existingChats, chats);
    writeChats(mergedChats);

    // Automatically ensure any chat with user messages or confirmed viewing appears in CRM leads
    const existingLeads = readCrmLeads();
    const currentApts = readApartments();
    const { leads: reconciledLeads, changed } = reconcileChatsIntoLeads(
      mergedChats,
      existingLeads,
      currentApts
    );
    if (changed) {
      writeCrmLeads(reconciledLeads);
    }

    res.json({ success: true, chats: mergedChats, leads: reconciledLeads });
  });

  // Google Play Compliance: User Data Deletion endpoint (Mandatory Policy)
  app.post('/api/user/delete-data', (req, res) => {
    const { phone, clientName, visitorId } = req.body || {};
    try {
      const currentLeads = readCrmLeads();
      const filteredLeads = currentLeads.filter((lead: any) => {
        if (phone && lead.clientPhone && lead.clientPhone.replace(/\D/g, '') === String(phone).replace(/\D/g, '')) {
          return false;
        }
        if (clientName && lead.clientName && lead.clientName.trim().toLowerCase() === String(clientName).trim().toLowerCase()) {
          return false;
        }
        return true;
      });
      writeCrmLeads(filteredLeads);

      appendAdminAudit(req, {
        event: 'user_data_deleted',
        email: 'system',
        details: `Пользователь запросил удаление персональных данных (${clientName || phone || visitorId || 'anonymous'}). Данные очищены в соответствии с Google Play User Data Policy.`,
        status: 'info',
      });

      res.json({ success: true, message: 'Все персональные данные и история успешно удалены.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Ошибка удаления данных: ' + err.message });
    }
  });

  // Get all published apartments
  app.get('/api/apartments', (_req, res) => {
    const apts = readApartments();
    res.json(apts);
  });

  // Add or update an apartment (supports single Apartment, batch array, or raw MyHome NEXT_DATA)
  app.post('/api/apartments', async (req, res) => {
    let payload = req.body;
    if (!payload) {
      return res.status(400).json({ error: 'Payload is required' });
    }

    // Auto-parse if sent as raw MyHome JSON from browser / bookmarklet / search page
    let batchToProcess: any[] = [];
    if (payload.rawNextData || payload.statement || (payload.props && payload.props.pageProps) || payload.queries) {
      try {
        const raw = payload.rawNextData ? payload.rawNextData : JSON.stringify(payload);
        batchToProcess = parseMyHomeBatch(raw, DEFAULT_AGENT_PHONE);
      } catch (parseErr: any) {
        return res.status(400).json({ error: 'Ошибка парсинга MyHome данных: ' + parseErr.message });
      }
    } else if (Array.isArray(payload)) {
      batchToProcess = payload;
    } else if (payload && payload.id) {
      batchToProcess = [payload];
    }

    if (!batchToProcess || batchToProcess.length === 0) {
      return res.status(400).json({ error: 'Не найдены корректные объекты квартир' });
    }

    const processedList: any[] = [];
    for (let apt of batchToProcess) {
      if (!apt || !apt.id) continue;
      // Auto translate title, address, description to Russian
      try {
        apt = await translateApartmentToRussian(apt);
      } catch (tErr) {
        console.warn('Auto-translate error:', tErr);
      }
      apt.district = getAccurateApartmentDistrict(apt);
      const coords = getAccurateApartmentCoordinates(apt);
      apt.lat = coords.lat;
      apt.lng = coords.lng;
      if (!apt.landlord) {
        apt.landlord = {
          id: `landlord-${apt.id}`,
          name: 'Собственник (Rentch)',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
          phone: DEFAULT_AGENT_PHONE,
          verified: true,
          responseTime: 'до 15 минут',
          rating: 4.9,
        };
      } else {
        apt.landlord.phone = DEFAULT_AGENT_PHONE;
      }
      processedList.push(apt);
    }

    const current = readApartments();
    const existingMap = new Map();
    current.forEach((a: any) => existingMap.set(a.id, a));
    processedList.forEach((a: any) => existingMap.set(a.id, a));

    const updated = [
      ...processedList,
      ...current.filter((c: any) => !processedList.some((p) => p.id === c.id)),
    ];
    writeApartments(updated);

    res.json({
      success: true,
      importedCount: processedList.length,
      totalCount: updated.length,
      apartment: processedList[0],
      apartments: processedList,
    });
  });

  // Bookmarklet Form-POST endpoint (bypasses browser CSP fetch restrictions on myhome.ge)
  app.post('/api/import/post-form', async (req, res) => {
    try {
      const raw = req.body.rawNextData;
      if (!raw) {
        return res.status(400).send('<h3>Ошибка: не переданы данные квартиры</h3>');
      }

      // Save raw dump for inspection
      try {
        fs.writeFileSync(path.join(DATA_DIR, 'last_myhome_raw.json'), typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2), 'utf-8');
      } catch (e) {
        console.error('Failed to save debug raw:', e);
      }

      const batch = parseMyHomeBatch(raw, DEFAULT_AGENT_PHONE);
      if (batch.length === 0) {
        return res.status(400).send('<h3>Объявления не найдены на переданной странице</h3><p><a href="/">Вернуться в Rentch</a></p>');
      }

      const processedList: any[] = [];
      for (let apt of batch) {
        // Automatically translate all texts (title, address, description, amenities) to Russian
        try {
          apt = await translateApartmentToRussian(apt);
        } catch (tErr) {
          console.warn('Auto-translate error on bookmarklet import:', tErr);
        }

        apt.district = getAccurateApartmentDistrict(apt);
        if (!apt.landlord) {
          apt.landlord = {
            id: `landlord-${apt.id}`,
            name: 'Собственник (Rentch)',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
            phone: DEFAULT_AGENT_PHONE,
            verified: true,
            responseTime: 'до 15 минут',
            rating: 4.9,
          };
        } else {
          apt.landlord.phone = DEFAULT_AGENT_PHONE;
        }

        processedList.push(apt);
      }

      const current = readApartments();
      const updated = [
        ...processedList,
        ...current.filter((c: any) => !processedList.some((p) => p.id === c.id)),
      ];
      writeApartments(updated);

      const firstApt = processedList[0];
      const isBatch = processedList.length > 1;

      // Return a clean confirmation page that redirects back to Rentch
      res.send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="utf-8">
          <title>${isBatch ? `Импортировано ${processedList.length} квартир` : 'Квартира добавлена'} в Rentch</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f5f5f4;
              color: #1c1917;
            }
            .card {
              background: white;
              padding: 36px 32px;
              border-radius: 28px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.08);
              max-width: 520px;
              text-align: center;
              border: 1px solid #e7e5e4;
            }
            .badge {
              display: inline-block;
              background: #dcfce7;
              color: #15803d;
              font-weight: 800;
              font-size: 13px;
              padding: 6px 16px;
              border-radius: 9999px;
              margin-bottom: 18px;
              letter-spacing: 0.03em;
            }
            h2 { margin: 0 0 10px; font-size: 22px; font-weight: 800; color: #1c1917; }
            .phone-badge {
              background: #fff1f2;
              border: 1px solid #fecdd3;
              color: #e11d48;
              padding: 10px 14px;
              border-radius: 16px;
              font-size: 13px;
              font-weight: 700;
              margin: 16px 0 20px;
              display: inline-block;
            }
            p { margin: 0 0 20px; font-size: 14px; color: #78716c; line-height: 1.5; }
            .btn {
              display: inline-block;
              background: linear-gradient(135deg, #f43f5e, #e11d48);
              color: white;
              text-decoration: none;
              font-weight: 700;
              font-size: 14px;
              padding: 14px 32px;
              border-radius: 18px;
              box-shadow: 0 6px 18px rgba(244,63,94,0.35);
              transition: transform 0.15s, box-shadow 0.15s;
            }
            .btn:hover { transform: scale(1.02); }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">✓ УСПЕШНО ОПУБЛИКОВАНО</div>
            <h2>${isBatch ? `Импортировано ${processedList.length} квартир со страницы каталога!` : escapeHtml(firstApt.title)}</h2>
            <div class="phone-badge">
              📞 Ваш контакт для связи: ${escapeHtml(DEFAULT_AGENT_PHONE)}
            </div>
            <p>
              ${isBatch 
                ? `Все ${processedList.length} карточек объектов сохранены в Rentch, описания очищены от сторонних номеров и переведены на русский язык.` 
                : `${escapeHtml(firstApt.address)} • $${Number(firstApt.priceUsd) || 0} / мес<br>Все ${firstApt.images.length} фото сохранены в Rentch.`
              }
            </p>
            <a href="/" class="btn">Открыть в Rentch</a>
            <script>
              try {
                var bc = new BroadcastChannel('rentch_catalog');
                bc.postMessage({ action: 'apartment_added', count: ${processedList.length} });
              } catch(e) {}
              setTimeout(function() {
                window.location.href = '/?tab=catalog&admin=1';
              }, 1600);
            </script>
          </div>
        </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Error importing post-form:', err);
      res.status(500).send(`<h3>Ошибка распознавания: ${escapeHtml(err.message)}</h3><p><a href="/">Вернуться</a></p>`);
    }
  });

  // Automated endpoint to sync/parse 500 daily rental apartments directly from MyHome.ge
  app.post('/api/apartments/parse-daily', async (_req, res) => {
    try {
      execSync('node scripts/parse_myhome_daily.mjs', { timeout: 120000 });
      const current = readApartments();
      const dailyCount = current.filter((a: any) => a.rentalType === 'daily').length;
      res.json({ ok: true, dailyCount, totalCount: current.length });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || 'Error syncing daily apartments' });
    }
  });

  // Batch sync apartments from client (e.g. from admin browser upload)
  app.post('/api/apartments/sync', (req, res) => {
    const incoming = req.body.apartments;
    if (!Array.isArray(incoming)) {
      return res.status(400).json({ error: 'Expected apartments array' });
    }

    const current = readApartments();
    const map = new Map();
    current.forEach((a: any) => {
      if (!isFake(a)) map.set(a.id, a);
    });
    incoming.forEach((a: any) => {
      if (a && a.id && !isFake(a)) {
        map.set(a.id, a);
      }
    });

    const merged = Array.from(map.values());
    writeApartments(merged);
    res.json({ success: true, count: merged.length, apartments: merged });
  });

  // Helper to fetch multiple pages from MyHome API up to targetLimit (up to 200 new objects)
  async function fetchMyHomeDeepNewApartments(
    targetLimit: number = 200,
    startPage: number = 1,
    existingIds: Set<string> = new Set()
  ): Promise<{ newApartments: any[]; pagesScanned: number }> {
    const clampedLimit = Math.min(Math.max(targetLimit, 1), 200);
    const newApartments: any[] = [];
    const fallbackExistingApartments: any[] = [];
    const seenIds = new Set<string>();
    const maxPagesToScan = 24; // up to ~24 pages (~480-600 listings scanned to find 200 new ones)
    const batchSize = 4; // fetch 4 pages in parallel per step
    let pagesScanned = 0;

    for (let offset = 0; offset < maxPagesToScan && newApartments.length < clampedLimit; offset += batchSize) {
      const pageNumbers = Array.from({ length: batchSize }, (_, i) => startPage + offset + i);
      const pageResults = await Promise.all(
        pageNumbers.map(async (pageNum) => {
          try {
            const upstream = await fetch(
              `https://api-statements.tnet.ge/v1/statements?deal_types=2&real_estate_types=1&cities=1&currency_id=1&locale=ru&page=${pageNum}`,
              {
                headers: {
                  'X-Website-Key': 'myhome',
                  'Accept-Language': 'ru-RU,ru;q=0.9',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                  'Referer': 'https://www.myhome.ge/',
                },
              }
            );
            if (!upstream.ok) return [];
            const apiData = await upstream.json();
            return apiData?.data?.data || apiData?.data?.statements || [];
          } catch (err) {
            console.warn(`Error fetching MyHome page ${pageNum}:`, err);
            return [];
          }
        })
      );

      let anyStatementsInChunk = false;
      for (const rawStatements of pageResults) {
        pagesScanned++;
        if (!Array.isArray(rawStatements) || rawStatements.length === 0) continue;
        anyStatementsInChunk = true;

        for (const raw of rawStatements) {
          if (newApartments.length >= clampedLimit) break;
          try {
            let apt = convertRawStatementToApartment(raw, DEFAULT_AGENT_PHONE);
            if (!apt || !apt.id || seenIds.has(apt.id)) continue;
            seenIds.add(apt.id);

            apt = translateApartmentFast(apt);
            apt.district = getAccurateApartmentDistrict(apt);
            const coords = getAccurateApartmentCoordinates(apt);
            apt.lat = coords.lat;
            apt.lng = coords.lng;
            apt = sanitizeApartmentPhones(apt);

            if (!existingIds.has(apt.id)) {
              newApartments.push(apt);
            } else {
              fallbackExistingApartments.push(apt);
            }
          } catch (convErr) {
            console.warn('Failed to convert statement:', convErr);
          }
        }
      }

      // Stop early if MyHome returned empty pages
      if (!anyStatementsInChunk) break;
    }

    const resultList =
      newApartments.length === 0 && fallbackExistingApartments.length > 0
        ? fallbackExistingApartments.slice(0, clampedLimit)
        : newApartments.slice(0, clampedLimit);

    // Enrich with exact building GPS coordinates from MyHome single statement API in parallel batches
    const gpsBatchSize = 25;
    for (let i = 0; i < resultList.length; i += gpsBatchSize) {
      const batch = resultList.slice(i, i + gpsBatchSize);
      await Promise.all(
        batch.map(async (apt: any) => {
          const m = String(apt.id).match(/^myhome-(\d+)$/);
          if (!m) return;
          try {
            const detailRes = await fetch(`https://api-statements.tnet.ge/v1/statements/${m[1]}?locale=ru`, {
              headers: { 'X-Website-Key': 'myhome', 'User-Agent': 'Mozilla/5.0' },
            });
            if (!detailRes.ok) return;
            const detailJson = await detailRes.json();
            const st = detailJson?.data?.statement;
            if (!st) return;
            const lat = Number(st.lat);
            const lng = Number(st.lng);
            if (!isNaN(lat) && !isNaN(lng) && lat > 41.6 && lat < 41.88 && lng > 44.65 && lng < 44.98) {
              apt.lat = lat;
              apt.lng = lng;
            }
            if (st.urban_name) {
              apt.district = getAccurateApartmentDistrict({
                ...apt,
                description: `${st.urban_name} ${apt.description || ''}`,
              });
            }
            const ruSlug = st.href_lang?.ru || st.dynamic_slug;
            if (ruSlug) {
              const cleanSlug = ruSlug.endsWith(`-${m[1]}`) ? ruSlug : `${ruSlug}-${m[1]}`;
              apt.sourceUrl = `https://www.myhome.ge/ru/nedvizhimost/${cleanSlug}/`;
            }
          } catch {
            // Keep street-resolved coordinates on network error
          }
        })
      );
    }

    return {
      newApartments: resultList,
      pagesScanned,
    };
  }

  // Seed / refresh real Tbilisi apartments live from MyHome with agent phone (up to 200 new objects)
  app.post('/api/apartments/seed-myhome', async (req, res) => {
    try {
      const requestedLimit = Math.min(Math.max(Number(req.body?.limit) || 200, 1), 200);
      const startPage = Math.max(Number(req.body?.startPage) || 1, 1);
      const current = readApartments();
      const existingIds = new Set(current.map((a: any) => a.id));

      console.log(`Fetching up to ${requestedLimit} new apartments from MyHome API (starting at page ${startPage})...`);
      const { newApartments, pagesScanned } = await fetchMyHomeDeepNewApartments(
        requestedLimit,
        startPage,
        existingIds
      );

      const listToSave =
        newApartments.length > 0
          ? newApartments
          : SEED_MYHOME_APARTMENTS.map((a) => sanitizeApartmentPhones(a));

      const map = new Map();
      // Put newly imported apartments first so they appear at the top of the deck
      listToSave.forEach((a: any) => {
        map.set(a.id, a);
      });
      current.forEach((a: any) => {
        if (!isFake(a) && !map.has(a.id)) {
          map.set(a.id, sanitizeApartmentPhones(a));
        }
      });

      const updated = Array.from(map.values());
      writeApartments(updated);
      console.log(`Parsed ${listToSave.length} new apartments across ${pagesScanned} pages. Total in DB: ${updated.length}.`);
      res.json({
        success: true,
        count: listToSave.length,
        pagesScanned,
        total: updated.length,
        apartments: updated,
        newApartments: listToSave,
      });
    } catch (err: any) {
      console.error('Error in seed-myhome:', err);
      res.status(500).json({ error: 'Failed to seed apartments: ' + err.message });
    }
  });

  // Delete an apartment by ID (strictly restricted to admin)
  app.delete('/api/apartments/:id', (req, res) => {
    if (!isAuthorizedAdminReq(req)) {
      appendAdminAudit(req, {
        event: 'login_failed',
        details: `Заблокирована несанкционированная попытка удаления квартиры ${req.params.id}.`,
        status: 'danger',
      });
      return res.status(403).json({ error: 'Доступ разрешён только администратору' });
    }
    const { id } = req.params;
    const current = readApartments();
    const target = current.find((a: any) => a.id === id);
    const updated = current.filter((a: any) => a.id !== id);
    writeApartments(updated);
    appendAdminAudit(req, {
      event: 'delete_apartment',
      email: ADMIN_EMAIL,
      details: `Администратор удалил объект «${target?.title || id}».`,
      status: 'info',
    });
    res.json({ success: true, count: updated.length });
  });

  // Clear all apartments from database (strictly restricted to admin)
  app.delete('/api/apartments', (req, res) => {
    if (!isAuthorizedAdminReq(req)) {
      appendAdminAudit(req, {
        event: 'login_failed',
        details: 'Заблокирована несанкционированная попытка удаления всего каталога квартир.',
        status: 'danger',
      });
      return res.status(403).json({ error: 'Доступ разрешён только администратору' });
    }
    writeApartments([]);
    appendAdminAudit(req, {
      event: 'clear_all_apartments',
      email: ADMIN_EMAIL,
      details: 'Администратор очистил весь каталог квартир.',
      status: 'warning',
    });
    res.json({ success: true, count: 0 });
  });

  // Translate all existing apartments in the catalog to Russian
  app.post('/api/apartments/translate-all', async (_req, res) => {
    const current = readApartments();
    const updated: any[] = [];
    let translatedCount = 0;

    for (const apt of current) {
      try {
        const translated = await translateApartmentToRussian(apt);
        updated.push(translated);
        if (translated.title !== apt.title || translated.address !== apt.address || translated.description !== apt.description) {
          translatedCount++;
        }
      } catch (err) {
        console.warn(`Translation error for ${apt.id}:`, err);
        updated.push(apt);
      }
    }

    writeApartments(updated);
    res.json({ success: true, total: updated.length, translatedCount, apartments: updated });
  });

  // Fetch real apartment or catalog directly from official MyHome.ge API by URL or Statement ID
  app.post('/api/import/myhome-url', async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Параметр url или ID обязателен' });
    }

    const trimmed = url.trim();

    // Check if user passed a specific listing URL with statement ID
    // e.g. https://www.myhome.ge/ru/nedvizhimost/sdaetsia-2-komnatnaia-kvartira-v-saburtalo-25919663/
    // or https://www.myhome.ge/ru/statement/25919663
    // or just 25919663
    const idMatch = trimmed.match(/(?:statements?\/|statementId=|id=|-)(\d{7,9})(?:\/|\?|$)|^\s*(\d{7,9})\s*$/i);
    const singleId = idMatch ? (idMatch[1] || idMatch[2]) : null;

    try {
      if (singleId) {
        // Fetch single listing details directly from MyHome API
        console.log(`Fetching MyHome listing ID ${singleId} via official API...`);
        const upstream = await fetch(`https://api-statements.tnet.ge/v1/statements/${singleId}?locale=ru`, {
          headers: {
            'X-Website-Key': 'myhome',
            'Accept-Language': 'ru-RU,ru;q=0.9',
          },
        });

        if (!upstream.ok) {
          return res.status(upstream.status).json({
            error: `MyHome API вернул статус ${upstream.status} для объявления ${singleId}`,
          });
        }

        const data = await upstream.json();
        const rawStatement = data?.data?.statement;
        if (!rawStatement) {
          return res.status(404).json({ error: `Объявление с номером ${singleId} не найдено на MyHome` });
        }

        let apt = convertRawStatementToApartment(rawStatement, DEFAULT_AGENT_PHONE);
        try {
          apt = await translateApartmentToRussian(apt);
        } catch (tErr) {
          console.warn('Translate error on single import:', tErr);
        }
        apt.district = getAccurateApartmentDistrict(apt);
        const coords = getAccurateApartmentCoordinates(apt);
        apt.lat = coords.lat;
        apt.lng = coords.lng;
        apt = sanitizeApartmentPhones(apt);

        return res.json({
          success: true,
          count: 1,
          apartment: apt,
          apartments: [apt],
        });
      }

      // Otherwise, treat as a search catalog URL (fetch up to limit of new listings across pages)
      const requestedLimit = Math.min(Math.max(Number(req.body?.limit) || 200, 1), 200);
      let startPage = 1;
      const pageMatch = trimmed.match(/page=(\d+)/);
      if (pageMatch) startPage = parseInt(pageMatch[1], 10) || 1;

      const current = readApartments();
      const existingIds = new Set(current.map((a: any) => a.id));

      console.log(`Fetching up to ${requestedLimit} new MyHome catalog apartments starting from page ${startPage}...`);
      const { newApartments, pagesScanned } = await fetchMyHomeDeepNewApartments(
        requestedLimit,
        startPage,
        existingIds
      );

      if (newApartments.length === 0) {
        return res.status(404).json({ error: 'На страницах каталога не найдено новых активных объявлений' });
      }

      return res.json({
        success: true,
        count: newApartments.length,
        pagesScanned,
        apartment: newApartments[0],
        apartments: newApartments,
      });
    } catch (err: any) {
      console.error('Error fetching MyHome by URL/API:', err);
      res.status(500).json({ error: err.message || 'Ошибка загрузки с MyHome' });
    }
  });

  // Helper: Fetch HaloOglasi HTML bypassing Cloudflare via r.jina.ai reader
  async function fetchHaloOglasiHtml(targetUrl: string): Promise<string> {
    const cleanTarget = targetUrl.startsWith('http')
      ? targetUrl
      : `https://www.halooglasi.com${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;

    // Primary: r.jina.ai with X-Return-Format: html (bypasses Cloudflare challenge)
    try {
      const jinaRes = await fetch(`https://r.jina.ai/${cleanTarget}`, {
        headers: {
          'X-Return-Format': 'html',
        },
      });
      if (jinaRes.ok) {
        const html = await jinaRes.text();
        if (
          html &&
          (html.includes('QuidditaEnvironment') || html.includes('product-item'))
        ) {
          return html;
        }
      }
    } catch (err) {
      console.warn('Jina HTML proxy error for HaloOglasi:', err);
    }

    // Fallback: direct fetch
    const directRes = await fetch(cleanTarget, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept-Language': 'sr-RS,sr;q=0.9,en;q=0.8',
      },
    });
    if (!directRes.ok) {
      throw new Error(`HaloOglasi вернул статус ${directRes.status}`);
    }
    return await directRes.text();
  }

  // Helper: Deep-parse Belgrade apartments from HaloOglasi catalog + enrich with detail pages
  async function fetchHaloOglasiDeepApartments(
    catalogUrl: string = DEFAULT_HALO_OGLASI_URL,
    targetLimit: number = 20,
    startPage: number = 1,
    existingIds: Set<string> = new Set()
  ): Promise<{ newApartments: any[]; pagesScanned: number }> {
    const clampedLimit = Math.min(Math.max(targetLimit, 1), 120);
    const collectedCandidates: any[] = [];
    const seenAdIds = new Set<string>();
    const maxPages = Math.min(Math.ceil(clampedLimit / 18) + 2, 10);
    let pagesScanned = 0;

    for (let offset = 0; offset < maxPages && collectedCandidates.length < clampedLimit; offset++) {
      const pageNum = startPage + offset;
      let pageUrl = catalogUrl;
      if (pageUrl.includes('page=')) {
        pageUrl = pageUrl.replace(/page=\d+/i, `page=${pageNum}`);
      } else if (pageNum > 1) {
        pageUrl += (pageUrl.includes('?') ? '&' : '?') + `page=${pageNum}`;
      }

      try {
        const html = await fetchHaloOglasiHtml(pageUrl);
        pagesScanned++;
        const parsedFromPage = parseHaloOglasiBatch(html, DEFAULT_AGENT_PHONE);
        if (parsedFromPage.length === 0) break;

        for (const apt of parsedFromPage) {
          if (collectedCandidates.length >= clampedLimit) break;
          if (!apt || !apt.id || seenAdIds.has(apt.id)) continue;
          seenAdIds.add(apt.id);
          collectedCandidates.push(apt);
        }
      } catch (err) {
        console.warn(`Error fetching HaloOglasi catalog page ${pageNum}:`, err);
        break;
      }
    }

    // Enrich candidates with full photo galleries, GPS coordinates, and full descriptions from detail pages in parallel batches
    const enriched: any[] = [];
    const maxDetailEnrich = Math.min(collectedCandidates.length, 12);
    const detailBatchSize = 4;

    for (let i = 0; i < maxDetailEnrich; i += detailBatchSize) {
      const chunk = collectedCandidates.slice(i, i + detailBatchSize);
      const chunkResults = await Promise.all(
        chunk.map(async (candidate) => {
          if (!candidate.sourceUrl) return candidate;
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 4500);
            const jinaRes = await fetch(`https://r.jina.ai/${candidate.sourceUrl}`, {
              headers: {
                'X-Return-Format': 'html',
              },
              signal: controller.signal,
            });
            clearTimeout(timer);
            if (jinaRes.ok) {
              const detailHtml = await jinaRes.text();
              const detailParsed = parseHaloOglasiBatch(detailHtml, DEFAULT_AGENT_PHONE);
              if (detailParsed.length > 0 && detailParsed[0].images.length > 0) {
                return detailParsed[0];
              }
            }
          } catch {
            // Keep catalog-parsed apartment on detail timeout
          }
          return candidate;
        })
      );
      enriched.push(...chunkResults);
    }

    // Append remaining candidates beyond maxDetailEnrich immediately
    if (collectedCandidates.length > maxDetailEnrich) {
      enriched.push(...collectedCandidates.slice(maxDetailEnrich));
    }

    const newOnly = enriched.filter((a) => !existingIds.has(a.id));
    return {
      newApartments: newOnly.length > 0 ? newOnly : enriched,
      pagesScanned,
    };
  }

  // 1-Click Seed Belgrade Apartments from HaloOglasi (Owners filter: oglasivac_nekretnine_id_l=387237)
  app.post('/api/apartments/seed-halooglasi', async (req, res) => {
    try {
      const requestedLimit = Math.min(Math.max(Number(req.body?.limit) || 20, 1), 120);
      const startPage = Math.max(Number(req.body?.startPage) || 1, 1);
      const customUrl = String(req.body?.url || DEFAULT_HALO_OGLASI_URL).trim();

      const current = readApartments();
      const existingIds = new Set(current.map((a: any) => a.id));

      console.log(
        `Fetching up to ${requestedLimit} Belgrade apartments from HaloOglasi (starting at page ${startPage})...`
      );
      const { newApartments, pagesScanned } = await fetchHaloOglasiDeepApartments(
        customUrl,
        requestedLimit,
        startPage,
        existingIds
      );

      if (newApartments.length === 0) {
        return res.status(404).json({
          error: 'Не удалось получить объявления с HaloOglasi.com. Попробуйте ещё раз.',
        });
      }

      const map = new Map();
      newApartments.forEach((a: any) => {
        map.set(a.id, sanitizeApartmentPhones(a));
      });
      current.forEach((a: any) => {
        if (!isFake(a) && !map.has(a.id)) {
          map.set(a.id, sanitizeApartmentPhones(a));
        }
      });

      const updated = Array.from(map.values());
      writeApartments(updated);

      res.json({
        success: true,
        count: newApartments.length,
        pagesScanned,
        total: updated.length,
        apartments: updated,
        newApartments,
      });
    } catch (err: any) {
      console.error('Error in seed-halooglasi:', err);
      res.status(500).json({ error: 'Ошибка парсинга HaloOglasi: ' + err.message });
    }
  });

  // Import Belgrade Apartment(s) from HaloOglasi by URL or ID
  app.post('/api/import/halooglasi-url', async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Параметр url или ID обязателен' });
    }

    const trimmed = url.trim();
    const requestedLimit = Math.min(Math.max(Number(req.body?.limit) || 20, 1), 120);
    const startPage = Math.max(Number(req.body?.startPage) || 1, 1);

    try {
      // Check if it's a single apartment detail URL (contains a 10-15 digit listing ID in path)
      const isSingleAd = /\/(\d{10,15})(?:\?|$|\/)/.test(trimmed);

      if (isSingleAd) {
        const html = await fetchHaloOglasiHtml(trimmed);
        const batch = parseHaloOglasiBatch(html, DEFAULT_AGENT_PHONE);
        if (batch.length === 0) {
          return res.status(404).json({ error: 'Не удалось распознать объявление HaloOglasi по ссылке' });
        }
        return res.json({
          success: true,
          count: 1,
          pagesScanned: 1,
          apartment: batch[0],
          apartments: [batch[0]],
        });
      }

      // Otherwise treat as catalog search URL
      const current = readApartments();
      const existingIds = new Set(current.map((a: any) => a.id));
      const { newApartments, pagesScanned } = await fetchHaloOglasiDeepApartments(
        trimmed,
        requestedLimit,
        startPage,
        existingIds
      );

      if (newApartments.length === 0) {
        return res.status(404).json({ error: 'На странице каталога HaloOglasi не найдено активных объявлений' });
      }

      return res.json({
        success: true,
        count: newApartments.length,
        pagesScanned,
        apartment: newApartments[0],
        apartments: newApartments,
      });
    } catch (err: any) {
      console.error('Error importing from HaloOglasi URL:', err);
      res.status(500).json({ error: err.message || 'Ошибка загрузки с HaloOglasi' });
    }
  });

  // Download a single photo with attachment headers (protected against SSRF)
  app.get('/api/download-photo', async (req, res) => {
    const photoUrl = req.query.url as string;
    const name = (req.query.name as string) || 'apartment-photo';

    if (!photoUrl || !isSafeExternalUrl(photoUrl)) {
      return res.status(400).send('Invalid or disallowed photo URL');
    }

    try {
      const upstream = await fetch(photoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });
      if (!upstream.ok) {
        return res.status(upstream.status).send('Failed to fetch image');
      }

      const contentType = upstream.headers.get('content-type') || 'image/jpeg';
      let extension = 'jpg';
      if (contentType.includes('webp')) extension = 'webp';
      else if (contentType.includes('png')) extension = 'png';

      const filename = `${name.replace(/[^a-zA-Z0-9_\u0400-\u04FF-]/g, '_')}.${extension}`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      
      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.send(buffer);
    } catch (err: any) {
      console.error('Error proxying photo download:', err);
      res.status(500).send('Error downloading image: ' + err.message);
    }
  });

  // Download all photos as a ZIP archive
  app.post('/api/download-zip', async (req, res) => {
    const { title, images } = req.body;
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    try {
      const zip = new JSZip();
      const folderName = (title || 'apartment-photos')
        .replace(/[^a-zA-Z0-9_\u0400-\u04FF-]/g, '_')
        .slice(0, 50);

      const folder = zip.folder(folderName) || zip;

      // Download all images in parallel (up to 30 images, protected against SSRF)
      const downloadPromises = images.slice(0, 30).map(async (imgUrl: string, idx: number) => {
        try {
          if (!imgUrl || !isSafeExternalUrl(imgUrl)) return;
          const resp = await fetch(imgUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            }
          });
          if (!resp.ok) return;

          const contentType = resp.headers.get('content-type') || '';
          let ext = 'jpg';
          if (contentType.includes('webp') || imgUrl.endsWith('.webp')) ext = 'webp';
          else if (contentType.includes('png') || imgUrl.endsWith('.png')) ext = 'png';

          const arrayBuffer = await resp.arrayBuffer();
          const fileName = `photo_${String(idx + 1).padStart(2, '0')}.${ext}`;
          folder.file(fileName, Buffer.from(arrayBuffer));
        } catch (downloadErr) {
          console.error(`Failed to download image ${idx}:`, downloadErr);
        }
      });

      await Promise.all(downloadPromises);

      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const zipFilename = `${folderName}.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipFilename)}"`);
      res.send(zipBuffer);
    } catch (err: any) {
      console.error('Error generating zip:', err);
      res.status(500).json({ error: 'Failed to generate zip: ' + err.message });
    }
  });

  // Google Search Console site verification route
  app.get('/googlea365e33b25cefe4a.html', (_req, res) => {
    res.type('text/html').send('google-site-verification: googlea365e33b25cefe4a.html');
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Never serve index.html for missing /assets/* files so client can detect chunk updates
    app.get('/assets/*', (_req, res) => {
      res.status(404).end();
    });
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rentch server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
