import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getVenueAnalytics, emptyAnalytics } from '../services/posthog-service';
import {
  mockDashboardAnalytics,
} from './fixtures/analytics.fixtures';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-access-token' } },
        error: null,
      }),
    },
  },
}));

// ─── Helper: mock safe aggregate analytics endpoint ───────────────
function mockAnalyticsFetch(payload = mockDashboardAnalytics) {
  vi.mocked(global.fetch).mockImplementation(async () => {
    return {
      ok: true,
      json: async () => payload,
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

  it('retorna emptyAnalytics cuando el endpoint retorna error HTTP', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      statusText: 'Unauthorized',
    } as Response);

    const result = await getVenueAnalytics('test-slug');

    expect(result).toEqual(emptyAnalytics);
  });

  it('retorna DashboardAnalytics correctamente en happy path', async () => {
    mockAnalyticsFetch();

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
    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/api/tablia/analytics',
        search: expect.stringContaining('slug=la-parrilla-del-centro'),
      }),
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-access-token' },
      }),
    );
    const calledUrl = vi.mocked(global.fetch).mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.has('venueName')).toBe(false);
  });

  it('los dailyScans siempre tienen exactamente 7 días', async () => {
    mockAnalyticsFetch();

    const result = await getVenueAnalytics('slug');

    expect(result.dailyScans).toHaveLength(7);
  });

  it('llama a onCached con datos del localStorage si existen', async () => {
    const cachedData = emptyAnalytics;
    localStorage.setItem(
      'tablia_analytics_test-venue',
      JSON.stringify({ timestamp: Date.now(), data: cachedData }),
    );

    mockAnalyticsFetch();

    const onCached = vi.fn();
    await getVenueAnalytics('test-venue', undefined, onCached);

    expect(onCached).toHaveBeenCalledOnce();
    expect(onCached).toHaveBeenCalledWith(cachedData);
  });

  it('no llama a onCached si el localStorage está vacío', async () => {
    mockAnalyticsFetch();

    const onCached = vi.fn();
    await getVenueAnalytics('sin-cache', undefined, onCached);

    expect(onCached).not.toHaveBeenCalled();
  });

  it('guarda el resultado en localStorage después de un fetch exitoso', async () => {
    mockAnalyticsFetch();

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
    mockAnalyticsFetch({
      ...mockDashboardAnalytics,
      topCategories: [
        { name: '', views: 99 },
        ...mockDashboardAnalytics.topCategories,
      ],
    });

    const result = await getVenueAnalytics('slug');
    const names = result.topCategories.map((c) => c.name);
    expect(names).not.toContain('');
  });
});
