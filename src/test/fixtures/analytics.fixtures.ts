import type { DashboardAnalytics } from '../../services/posthog-service';

// ─── PostHog HogQL API raw responses ─────────────────────────────

/** count() for menu_viewed today → 42 */
export const mockScansTodayRes = [[42]];
/** count() for menu_viewed last 7 days → 210 */
export const mockScansWeekRes = [[210]];
/** count() all time → 1337 */
export const mockScansTotalRes = [[1337]];

/**
 * Daily scans for last 7 days — HogQL returns English short day names.
 * Covers Mon–Sat, Sun is missing (should map to 0).
 */
export const mockDailyScansRes = [
  ['Mon', 38],
  ['Tue', 22],
  ['Wed', 45],
  ['Thu', 31],
  ['Fri', 50],
  ['Sat', 24],
];

/** Top 5 categories expanded in the last 30 days */
export const mockTopCategoriesRes = [
  ['Parrilla', 89],
  ['Entradas', 67],
  ['Bebidas', 43],
  ['Postres', 21],
  ['Platos del día', 15],
];

/** Top 5 chat questions in the last 30 days */
export const mockTopConversationsRes = [
  ['¿Tienen opciones veganas?', 34],
  ['¿Cuál es el precio del bife?', 28],
  ['¿Tienen sin gluten?', 19],
  ['¿Qué me recomendás?', 17],
  ['¿Tienen delivery?', 12],
];

// ─── Assembled DashboardAnalytics ─────────────────────────────────
export const mockDashboardAnalytics: DashboardAnalytics = {
  stats: {
    scansToday: 42,
    scansWeek: 210,
    scansTotal: 1337,
  },
  dailyScans: [
    { day: 'Lun', value: 38 },
    { day: 'Mar', value: 22 },
    { day: 'Mié', value: 45 },
    { day: 'Jue', value: 31 },
    { day: 'Vie', value: 50 },
    { day: 'Sáb', value: 24 },
    { day: 'Dom', value: 0 },
  ],
  topCategories: [
    { name: 'Parrilla', views: 89 },
    { name: 'Entradas', views: 67 },
    { name: 'Bebidas', views: 43 },
    { name: 'Postres', views: 21 },
    { name: 'Platos del día', views: 15 },
  ],
  topConversations: [
    { question: '¿Tienen opciones veganas?', count: 34 },
    { question: '¿Cuál es el precio del bife?', count: 28 },
    { question: '¿Tienen sin gluten?', count: 19 },
    { question: '¿Qué me recomendás?', count: 17 },
    { question: '¿Tienen delivery?', count: 12 },
  ],
};
