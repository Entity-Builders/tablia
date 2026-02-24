/**
 * Service to query PostHog analytics data for the dashboard.
 * Requires a Personal API Key and Project ID.
 */

const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY || '';
const POSTHOG_PROJECT_ID = import.meta.env.VITE_POSTHOG_PROJECT_ID || '';
const POSTHOG_HOST =
  import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

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
 * Empty state object when there is no data or keys are missing.
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

async function queryHogQL(query: string) {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    throw new Error('PostHog API keys missing in environment variables.');
  }

  const res = await fetch(
    `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${POSTHOG_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          kind: 'HogQLQuery',
          query,
        },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`PostHog API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.results || [];
}

/**
 * Fetch all analytics data for a specific venue slug.
 */
export async function getVenueAnalytics(
  slug: string,
  venueName?: string,
): Promise<DashboardAnalytics> {
  // If keys aren't configured, always return empty analytics gracefully.
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    console.warn('[Analytics] PostHog API keys missing. Showing empty state.');
    return emptyAnalytics;
  }

  try {
    const safeVenueName = venueName ? venueName.replace(/'/g, "''") : slug;
    const [
      scansTodayRes,
      scansWeekRes,
      scansTotalRes,
      dailyScansRes,
      topCategoriesRes,
      topConversationsRes,
    ] = await Promise.all([
      queryHogQL(
        `SELECT count() FROM events WHERE event = 'menu_viewed' AND properties.slug = '${slug}' AND timestamp >= toStartOfDay(now())`,
      ),
      queryHogQL(
        `SELECT count() FROM events WHERE event = 'menu_viewed' AND properties.slug = '${slug}' AND timestamp >= now() - interval 7 day`,
      ),
      queryHogQL(
        `SELECT count() FROM events WHERE event = 'menu_viewed' AND properties.slug = '${slug}'`,
      ),
      queryHogQL(
        `SELECT formatDateTime(toStartOfDay(timestamp), '%a') as day_name, count() FROM events WHERE event = 'menu_viewed' AND properties.slug = '${slug}' AND timestamp >= now() - interval 7 day GROUP BY day_name`,
      ),
      queryHogQL(
        `SELECT properties.category_name, count() as views FROM events WHERE event = 'category_expanded' AND properties.slug = '${slug}' AND timestamp >= now() - interval 30 day GROUP BY properties.category_name ORDER BY views DESC LIMIT 5`,
      ),
      queryHogQL(
        `SELECT properties.message, count() as count FROM events WHERE event = 'chat_message_sent' AND (properties.slug = '${slug}' OR properties.venue_name = '${safeVenueName}') AND timestamp >= now() - interval 30 day GROUP BY properties.message ORDER BY count DESC LIMIT 5`,
      ),
    ]);

    // Format daily scans to ensure we have all days mapped even if 0.
    const dayMap: Record<string, number> = {};
    dailyScansRes.forEach((row: any) => {
      dayMap[row[0]] = row[1];
    });

    // We'll just generate the last 7 days ending today.
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      // HogQL formatDateTime('%a') returns English short days (Sun, Mon, Tue).
      // A more robust way to map them from DB results:
      const engDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const espDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const engName = engDays[d.getDay()];
      const val = dayMap[engName] || 0;

      last7Days.push({ day: espDays[d.getDay()], value: val });
    }

    return {
      stats: {
        scansToday: scansTodayRes[0]?.[0] || 0,
        scansWeek: scansWeekRes[0]?.[0] || 0,
        scansTotal: scansTotalRes[0]?.[0] || 0,
      },
      dailyScans: last7Days,
      topCategories: topCategoriesRes
        .filter((row: any) => row[0]) // Ignore null/empty category names
        .map((row: any) => ({
          name: row[0],
          views: row[1],
        })),
      topConversations: topConversationsRes
        .filter((row: any) => row[0])
        .map((row: any) => ({
          question: row[0],
          count: row[1],
        })),
    };
  } catch (error) {
    console.error('Error fetching PostHog queries:', error);
    // Graceful fallback to zero-data
    return emptyAnalytics;
  }
}
