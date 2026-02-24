import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getVenueAnalytics, emptyAnalytics } from '../services/posthog-service';
import {
  mockScansTodayRes,
  mockScansWeekRes,
  mockScansTotalRes,
  mockDailyScansRes,
  mockTopCategoriesRes,
  mockTopConversationsRes,
} from './fixtures/analytics.fixtures';

// ─── Helper: mock fetch for all 6 HogQL queries in order ─────────
function mockPostHogFetch(...responses: any[][]) {
  let callIndex = 0;
  vi.mocked(global.fetch).mockImplementation(async () => {
    const results = responses[callIndex++] ?? [];
    return {
      ok: true,
      json: async () => ({ results }),
    } as Response;
  });
}

// ─── Tests ────────────────────────────────────────────────────────
describe('posthog-service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna emptyAnalytics cuando la API retorna error HTTP', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      statusText: 'Unauthorized',
    } as Response);

    const result = await getVenueAnalytics('test-slug');

    expect(result).toEqual(emptyAnalytics);
  });

  it('retorna DashboardAnalytics correctamente en happy path', async () => {
    mockPostHogFetch(
      mockScansTodayRes,
      mockScansWeekRes,
      mockScansTotalRes,
      mockDailyScansRes,
      mockTopCategoriesRes,
      mockTopConversationsRes,
    );

    const result = await getVenueAnalytics(
      'la-parrilla-del-centro',
      'La Parrilla del Centro',
    );

    expect(result.stats.scansToday).toBe(42);
    expect(result.stats.scansWeek).toBe(210);
    expect(result.stats.scansTotal).toBe(1337);
    expect(result.topCategories).toHaveLength(5);
    expect(result.topCategories[0]).toEqual({ name: 'Parrilla', views: 89 });
    expect(result.topConversations[0]).toEqual({
      question: '¿Tienen opciones veganas?',
      count: 34,
    });
  });

  it('los dailyScans siempre tienen exactamente 7 días', async () => {
    mockPostHogFetch(
      mockScansTodayRes,
      mockScansWeekRes,
      mockScansTotalRes,
      mockDailyScansRes, // Solo tiene 6 días (sin Dom)
      mockTopCategoriesRes,
      mockTopConversationsRes,
    );

    const result = await getVenueAnalytics('slug');

    expect(result.dailyScans).toHaveLength(7);
  });

  it('llama a onCached con datos del localStorage si existen', async () => {
    const cachedData = emptyAnalytics;
    localStorage.setItem(
      'tablia_analytics_test-venue',
      JSON.stringify({ timestamp: Date.now(), data: cachedData }),
    );

    mockPostHogFetch(
      mockScansTodayRes,
      mockScansWeekRes,
      mockScansTotalRes,
      mockDailyScansRes,
      mockTopCategoriesRes,
      mockTopConversationsRes,
    );

    const onCached = vi.fn();
    await getVenueAnalytics('test-venue', undefined, onCached);

    expect(onCached).toHaveBeenCalledOnce();
    expect(onCached).toHaveBeenCalledWith(cachedData);
  });

  it('no llama a onCached si el localStorage está vacío', async () => {
    mockPostHogFetch(
      mockScansTodayRes,
      mockScansWeekRes,
      mockScansTotalRes,
      mockDailyScansRes,
      mockTopCategoriesRes,
      mockTopConversationsRes,
    );

    const onCached = vi.fn();
    await getVenueAnalytics('sin-cache', undefined, onCached);

    expect(onCached).not.toHaveBeenCalled();
  });

  it('guarda el resultado en localStorage después de un fetch exitoso', async () => {
    mockPostHogFetch(
      mockScansTodayRes,
      mockScansWeekRes,
      mockScansTotalRes,
      mockDailyScansRes,
      mockTopCategoriesRes,
      mockTopConversationsRes,
    );

    await getVenueAnalytics('la-parrilla');

    const cached = localStorage.getItem('tablia_analytics_la-parrilla');
    expect(cached).not.toBeNull();

    const parsed = JSON.parse(cached!);
    expect(parsed.data.stats.scansToday).toBe(42);
    expect(parsed.timestamp).toBeTypeOf('number');
  });

  it('retorna emptyAnalytics como fallback cuando la API falla', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const result = await getVenueAnalytics('slug-error');

    expect(result).toEqual(emptyAnalytics);
  });

  it('filtra topCategories sin nombre (null/undefined)', async () => {
    // Simulate PostHog returning a row with null category name
    const catsWithNull = [[null, 99], ...mockTopCategoriesRes];
    mockPostHogFetch(
      mockScansTodayRes,
      mockScansWeekRes,
      mockScansTotalRes,
      mockDailyScansRes,
      catsWithNull,
      mockTopConversationsRes,
    );

    const result = await getVenueAnalytics('slug');
    const names = result.topCategories.map((c) => c.name);
    expect(names).not.toContain(null);
    expect(names).not.toContain(undefined);
  });
});
