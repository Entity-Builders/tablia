import { supabase } from '../lib/supabase';
import type {
  ConsentChannel,
  CustomerIdentityType,
  CustomerMemorySummary,
} from '../types';
export {
  getCustomerMemoryMessage,
  type CustomerMemoryMessage,
} from './customer-memory-copy';

const DEVICE_KEY_STORAGE = 'tablia.device_key.v1';

interface TrackVenueVisitParams {
  venueSlug: string;
  source?: 'landing' | 'menu' | 'chat' | 'qr';
  metadata?: Record<string, unknown>;
}

interface CaptureCustomerIdentityParams {
  venueSlug?: string;
  identityType: CustomerIdentityType;
  identityValue: string;
  marketingOptIn?: boolean;
}

function getBrowserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function createDeviceKey(): string {
  if (globalThis.crypto?.randomUUID) {
    return `dev_${globalThis.crypto.randomUUID()}`;
  }

  return `dev_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function getOrCreateDeviceKey(): string {
  const storage = getBrowserStorage();
  const stored = storage?.getItem(DEVICE_KEY_STORAGE);
  if (stored) return stored;

  const deviceKey = createDeviceKey();
  storage?.setItem(DEVICE_KEY_STORAGE, deviceKey);
  return deviceKey;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeMemorySummary(value: unknown): CustomerMemorySummary | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, any>;
  if (raw.ok === false) return null;

  const loyalty = raw.loyalty && typeof raw.loyalty === 'object'
    ? {
        programId: asString(raw.loyalty.program_id),
        name: asString(raw.loyalty.name),
        type: raw.loyalty.type || 'stamps',
        visitCount: asNumber(raw.loyalty.visit_count),
        visitsRequired: asNumber(raw.loyalty.visits_required),
        visitsUntilReward: asNumber(raw.loyalty.visits_until_reward),
        rewardLabel: asString(raw.loyalty.reward_label),
      }
    : undefined;

  const reward = raw.reward && typeof raw.reward === 'object'
    ? {
        id: asString(raw.reward.id),
        rewardLabel: asString(raw.reward.reward_label),
        status: raw.reward.status || 'earned',
      }
    : undefined;

  const campaign = raw.campaign && typeof raw.campaign === 'object'
    ? {
        id: asString(raw.campaign.id),
        type: raw.campaign.type || 'flash_promo',
        title: asString(raw.campaign.title),
        body: asString(raw.campaign.body),
        ctaLabel: asString(raw.campaign.cta_label) || undefined,
        ctaUrl: asString(raw.campaign.cta_url) || undefined,
      }
    : undefined;

  return {
    ok: true,
    deviceKey: asString(raw.device_key),
    customerProfileId: asString(raw.customer_profile_id),
    venueId: asString(raw.venue_id),
    visitCount: asNumber(raw.visit_count),
    isFirstVisit: Boolean(raw.is_first_visit),
    countIncremented: Boolean(raw.count_incremented),
    loyalty,
    reward,
    campaign,
  };
}

export async function trackVenueVisit({
  venueSlug,
  source = 'landing',
  metadata = {},
}: TrackVenueVisitParams): Promise<CustomerMemorySummary | null> {
  const deviceKey = getOrCreateDeviceKey();
  const { data, error } = await supabase.rpc('track_public_visit', {
    p_device_key: deviceKey,
    p_venue_slug: venueSlug,
    p_source: source,
    p_metadata: metadata,
  });

  if (error) throw new Error(error.message);
  return normalizeMemorySummary(data);
}

export async function captureCustomerIdentity({
  venueSlug,
  identityType,
  identityValue,
  marketingOptIn = false,
}: CaptureCustomerIdentityParams): Promise<{
  customerProfileId: string;
  identityType: CustomerIdentityType;
  consentChannel?: ConsentChannel;
} | null> {
  const deviceKey = getOrCreateDeviceKey();
  const { data, error } = await supabase.rpc('capture_customer_identity', {
    p_device_key: deviceKey,
    p_identity_type: identityType,
    p_identity_value: identityValue,
    p_venue_slug: venueSlug ?? null,
    p_marketing_opt_in: marketingOptIn,
  });

  if (error) throw new Error(error.message);
  if (!data || typeof data !== 'object') return null;

  const raw = data as Record<string, unknown>;
  return {
    customerProfileId: asString(raw.customer_profile_id),
    identityType: (asString(raw.identity_type) || identityType) as CustomerIdentityType,
    consentChannel: asString(raw.consent_channel) as ConsentChannel | undefined,
  };
}
