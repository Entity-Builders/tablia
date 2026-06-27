import { supabase } from '../lib/supabase';
import type {
  CampaignType,
  ConsentChannel,
  CustomerIdentityType,
  CustomerMemorySummary,
  LoyaltyProgramType,
  LoyaltyRewardStatus,
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function asOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  const text = asString(value);
  return allowed.includes(text as T) ? (text as T) : fallback;
}

function normalizeMemorySummary(value: unknown): CustomerMemorySummary | null {
  const raw = asRecord(value);
  if (!raw) return null;
  if (raw.ok === false) return null;

  const rawLoyalty = asRecord(raw.loyalty);
  const rawReward = asRecord(raw.reward);
  const rawCampaign = asRecord(raw.campaign);

  const loyalty = rawLoyalty
    ? {
        programId: asString(rawLoyalty.program_id),
        name: asString(rawLoyalty.name),
        type: asOneOf<LoyaltyProgramType>(
          rawLoyalty.type,
          ['stamps', 'points', 'visits'],
          'stamps',
        ),
        visitCount: asNumber(rawLoyalty.visit_count),
        visitsRequired: asNumber(rawLoyalty.visits_required),
        visitsUntilReward: asNumber(rawLoyalty.visits_until_reward),
        rewardLabel: asString(rawLoyalty.reward_label),
      }
    : undefined;

  const reward = rawReward
      ? {
        id: asString(rawReward.id),
        rewardLabel: asString(rawReward.reward_label),
        status: asOneOf<LoyaltyRewardStatus>(
          rawReward.status,
          ['earned', 'redeemed', 'expired'],
          'earned',
        ),
      }
    : undefined;

  const campaign = rawCampaign
      ? {
        id: asString(rawCampaign.id),
        type: asOneOf<CampaignType>(
          rawCampaign.type,
          ['flash_promo', 'announcement', 'event'],
          'flash_promo',
        ),
        title: asString(rawCampaign.title),
        body: asString(rawCampaign.body),
        ctaLabel: asString(rawCampaign.cta_label) || undefined,
        ctaUrl: asString(rawCampaign.cta_url) || undefined,
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
