export type AnalyticsEventType =
  | 'page_view'
  | 'landing_view'
  | 'catalog_view'
  | 'apartment_view'
  | 'swipe_right'
  | 'swipe_left'
  | 'telegram_click';

export interface TodayAnalyticsData {
  date: string;
  pageViews: number;
  landingViews: number;
  catalogViews: number;
  uniqueVisitors: number;
  apartmentViews: number;
  swipesRight: number;
  swipesLeft: number;
  telegramClicks: number;
  apartmentBreakdown: Record<
    string,
    { title: string; views: number; likes: number; passes: number }
  >;
}

export type DailyAnalyticsStats = TodayAnalyticsData;

export interface AnalyticsHistoryDay {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  apartmentViews: number;
  swipesRight: number;
  swipesLeft: number;
  telegramClicks: number;
}

export interface AnalyticsResponse {
  today: TodayAnalyticsData;
  history: AnalyticsHistoryDay[];
}

function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem('rentch_visitor_id');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).slice(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem('rentch_visitor_id', vid);
    }
    return vid;
  } catch {
    return 'v_anon';
  }
}

export function trackAnalyticsEvent(
  type: AnalyticsEventType,
  meta?: { apartmentId?: string; apartmentTitle?: string }
): void {
  try {
    const visitorId = getOrCreateVisitorId();
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        visitorId,
        apartmentId: meta?.apartmentId,
        apartmentTitle: meta?.apartmentTitle,
      }),
    }).catch(() => {});
  } catch {
    // ignore tracking errors
  }
}

export async function fetchAnalyticsStats(): Promise<AnalyticsResponse | null> {
  try {
    const res = await fetch('/api/analytics');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
