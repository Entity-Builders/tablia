import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CustomerMemorySummary } from '../types';

const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: mockRpc,
  },
}));

import {
  captureCustomerIdentity,
  getCustomerMemoryMessage,
  getOrCreateDeviceKey,
  trackVenueVisit,
} from '../services/customer-memory-service';

describe('customer-memory-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('crea y reutiliza un device key local', () => {
    const first = getOrCreateDeviceKey();
    const second = getOrCreateDeviceKey();

    expect(first).toMatch(/^dev_/);
    expect(second).toBe(first);
  });

  it('registra una visita pública y normaliza el resumen', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        ok: true,
        device_key: 'dev_test',
        customer_profile_id: 'profile-1',
        venue_id: 'venue-1',
        visit_count: 3,
        is_first_visit: false,
        count_incremented: true,
        loyalty: {
          program_id: 'program-1',
          name: 'Club de visitas',
          type: 'stamps',
          visit_count: 3,
          visits_required: 5,
          visits_until_reward: 2,
          reward_label: 'un postre',
        },
        campaign: {
          id: 'campaign-1',
          type: 'flash_promo',
          title: 'Promo flash',
          body: '20% off en postres',
          cta_label: 'Hoy',
        },
      },
      error: null,
    });

    const summary = await trackVenueVisit({
      venueSlug: 'la-parrilla',
      source: 'landing',
    });

    expect(mockRpc).toHaveBeenCalledWith(
      'track_public_visit',
      expect.objectContaining({
        p_venue_slug: 'la-parrilla',
        p_source: 'landing',
      }),
    );
    expect(summary?.visitCount).toBe(3);
    expect(summary?.loyalty?.visitsUntilReward).toBe(2);
    expect(summary?.campaign?.title).toBe('Promo flash');
  });

  it('convierte un device anónimo en perfil identificado', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        ok: true,
        customer_profile_id: 'profile-1',
        identity_type: 'email',
        consent_channel: 'email',
      },
      error: null,
    });

    const result = await captureCustomerIdentity({
      venueSlug: 'la-parrilla',
      identityType: 'email',
      identityValue: 'cliente@example.com',
      marketingOptIn: true,
    });

    expect(mockRpc).toHaveBeenCalledWith(
      'capture_customer_identity',
      expect.objectContaining({
        p_identity_type: 'email',
        p_identity_value: 'cliente@example.com',
        p_marketing_opt_in: true,
      }),
    );
    expect(result).toEqual({
      customerProfileId: 'profile-1',
      identityType: 'email',
      consentChannel: 'email',
    });
  });

  it('prioriza mensaje de reward sobre campaña y progreso', () => {
    const summary: CustomerMemorySummary = {
      ok: true,
      deviceKey: 'dev_test',
      customerProfileId: 'profile-1',
      venueId: 'venue-1',
      visitCount: 5,
      isFirstVisit: false,
      countIncremented: true,
      loyalty: {
        programId: 'program-1',
        name: 'Club de visitas',
        type: 'stamps',
        visitCount: 5,
        visitsRequired: 5,
        visitsUntilReward: 0,
        rewardLabel: 'un postre',
      },
      campaign: {
        id: 'campaign-1',
        type: 'flash_promo',
        title: 'Promo flash',
        body: '20% off',
      },
      reward: {
        id: 'reward-1',
        rewardLabel: 'Tenés un postre listo',
        status: 'earned',
      },
    };

    expect(getCustomerMemoryMessage(summary)).toMatchObject({
      title: 'Beneficio listo',
      body: 'Tenés un postre listo',
    });
  });
});
