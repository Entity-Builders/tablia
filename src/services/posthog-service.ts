/**
 * Service to fetch safe analytics aggregates for the dashboard.
 *
 * Browser bundles must not contain privileged PostHog personal/admin API keys.
 * When VITE_TABLIA_ANALYTICS_ENDPOINT is configured, that backend endpoint is
 * responsible for querying PostHog and returning aggregate dashboard data.
 * Without the endpoint, the dashboard gracefully shows an empty state.
 */

const ANALYTICS_ENDPOINT =
  import.meta.env.VITE_TABLIA_ANALYTICS_ENDPOINT || '';

export interface DashboardAnalytics {
  stats: {
    scansToday: number;
    scansWeek: number;
    scansTotal: number;
  };
  dailyScans: { day: string; value: number }[];
  topCategories: { name: string; views: number }[];
  topConversations: { question: string; count: number }[];
}

/**
 * Empty state object when there is no data or analytics endpoint is missing.
 */
export const emptyAnalytics: DashboardAnalytics = {
  stats: { scansToday: 0, scansWeek: 0, scansTotal: 0 },
  dailyScans: [
    { day: 'Lun', value: 0 },
    { day: 'Mar', value: 0 },
    { day: 'Mié', value: 0 },
    { day: 'Jue', value: 0 },
    { day: 'Vie', value: 0 },
    { day: 'Sáb', value: 0 },
    { day: 'Dom', value: 0 },
  ],
  topCategories: [],
  topConversations: [],
};

function readCachedAnalytics(
  cacheKey: string,
  onCached?: (data: DashboardAnalytics) => void,
) {
  if (!onCached) return;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return;

    const parsed = JSON.parse(cached);
    if (parsed && parsed.data) {
      onCached(parsed.data as DashboardAnalytics);
    }
  } catch (error) {
    console.warn('[Analytics] Cache read error:', error);
  }
}

function writeCachedAnalytics(cacheKey: string, data: DashboardAnalytics) {
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ timestamp: Date.now(), data }),
    );
  } catch (error) {
    console.warn('[Analytics] Cache write error:', error);
  }
}

function normalizeAnalyticsPayload(payload: unknown): DashboardAnalytics {
  const candidate =
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    (payload as { data?: unknown }).data
      ? (payload as { data: unknown }).data
      : payload;
  const value = candidate as Partial<DashboardAnalytics> | null | undefined;

  return {
    stats: {
      scansToday: value?.stats?.scansToday ?? 0,
      scansWeek: value?.stats?.scansWeek ?? 0,
      scansTotal: value?.stats?.scansTotal ?? 0,
    },
    dailyScans: Array.isArray(value?.dailyScans)
      ? value.dailyScans
      : emptyAnalytics.dailyScans,
    topCategories: Array.isArray(value?.topCategories)
      ? value.topCategories.filter((row) => row.name)
      : [],
    topConversations: Array.isArray(value?.topConversations)
      ? value.topConversations.filter((row) => row.question)
      : [],
  };
}

export async function getVenueAnalytics(
  slug: string,
  venueName?: string,
  onCached?: (data: DashboardAnalytics) => void,
): Promise<DashboardAnalytics> {
  const cacheKey = `tablia_analytics_${slug}`;
  readCachedAnalytics(cacheKey, onCached);

  // If no safe aggregate endpoint is configured, return empty analytics.
  if (!ANALYTICS_ENDPOINT) {
    console.warn(
      '[Analytics] Safe Tablia analytics endpoint missing. Showing empty state.',
    );
    return emptyAnalytics;
  }

  try {
    const url = new URL(ANALYTICS_ENDPOINT, window.location.origin);
    url.searchParams.set('slug', slug);
    if (venueName) url.searchParams.set('venueName', venueName);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.statusText}`);
    }

    const result = normalizeAnalyticsPayload(await response.json());
    writeCachedAnalytics(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error fetching Tablia analytics:', error);
    return emptyAnalytics;
  }
}
