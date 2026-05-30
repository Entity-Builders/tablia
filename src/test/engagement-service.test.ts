import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  tableRows: {
    loyalty_programs: [] as any[],
    venue_campaigns: [] as any[],
  },
  lastInsert: {} as Record<string, any>,
  lastUpdate: {} as Record<string, any>,
}));

function makeChain(table: 'loyalty_programs' | 'venue_campaigns') {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() =>
      Promise.resolve({ data: mocks.tableRows[table], error: null }),
    ),
    insert: vi.fn((payload) => {
      mocks.lastInsert[table] = payload;
      mocks.tableRows[table] = [
        {
          id: `${table}-new`,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          ...payload,
        },
      ];
      return chain;
    }),
    update: vi.fn((payload) => {
      mocks.lastUpdate[table] = payload;
      mocks.tableRows[table] = [
        {
          id: `${table}-existing`,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          ...payload,
        },
      ];
      return chain;
    }),
    single: vi.fn(() =>
      Promise.resolve({ data: mocks.tableRows[table][0], error: null }),
    ),
  };
  return chain;
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mocks.mockFrom,
  },
}));

import {
  getVenueEngagementConfig,
  saveFlashCampaign,
  saveLoyaltyProgram,
} from '../services/engagement-service';

describe('engagement-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tableRows.loyalty_programs = [];
    mocks.tableRows.venue_campaigns = [];
    mocks.lastInsert = {};
    mocks.lastUpdate = {};
    mocks.mockFrom.mockImplementation((table: string) => makeChain(table as any));
  });

  it('carga el programa loyalty y la promo flash del venue', async () => {
    mocks.tableRows.loyalty_programs = [
      {
        id: 'program-1',
        venue_id: 'venue-1',
        name: 'Club',
        type: 'stamps',
        status: 'active',
        rules: { visits_required: 5, reward_label: 'postre' },
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];
    mocks.tableRows.venue_campaigns = [
      {
        id: 'campaign-1',
        venue_id: 'venue-1',
        name: 'Flash',
        type: 'flash_promo',
        channel: 'in_app',
        status: 'active',
        title: 'Promo flash',
        body: '20% off',
        segment: { audience: 'all_devices' },
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    const config = await getVenueEngagementConfig('venue-1');

    expect(config.loyaltyProgram?.rules.visits_required).toBe(5);
    expect(config.flashCampaign?.title).toBe('Promo flash');
    expect(mocks.mockFrom).toHaveBeenCalledWith('loyalty_programs');
    expect(mocks.mockFrom).toHaveBeenCalledWith('venue_campaigns');
  });

  it('crea un programa de visitas cuando no existe id', async () => {
    const program = await saveLoyaltyProgram('venue-1', {
      enabled: true,
      visitsRequired: 8,
      rewardLabel: 'un café',
    });

    expect(mocks.lastInsert.loyalty_programs).toMatchObject({
      venue_id: 'venue-1',
      status: 'active',
      rules: { visits_required: 8, reward_label: 'un café' },
    });
    expect(program.id).toBe('loyalty_programs-new');
  });

  it('pausa una promo flash existente', async () => {
    const campaign = await saveFlashCampaign('venue-1', {
      id: 'campaign-1',
      enabled: false,
      title: 'Noche de pastas',
      body: 'Promo hasta las 22',
      ctaLabel: 'Solo hoy',
    });

    expect(mocks.lastUpdate.venue_campaigns).toMatchObject({
      venue_id: 'venue-1',
      status: 'paused',
      title: 'Noche de pastas',
      body: 'Promo hasta las 22',
      cta_label: 'Solo hoy',
    });
    expect(campaign.status).toBe('paused');
  });
});
