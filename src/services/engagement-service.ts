import { supabase } from '../lib/supabase';
import type {
  LoyaltyProgram,
  VenueCampaign,
  VenueEngagementConfig,
} from '../types';

interface SaveLoyaltyProgramInput {
  id?: string;
  enabled: boolean;
  visitsRequired: number;
  rewardLabel: string;
}

interface SaveFlashCampaignInput {
  id?: string;
  enabled: boolean;
  title: string;
  body: string;
  ctaLabel?: string;
}

function clampVisitsRequired(value: number): number {
  if (!Number.isFinite(value)) return 5;
  return Math.max(1, Math.min(Math.round(value), 30));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeLoyaltyProgram(value: unknown): LoyaltyProgram | undefined {
  const record = asRecord(value);
  if (!record) return undefined;

  const rules = asRecord(record.rules) ?? {};

  return {
    ...(record as unknown as LoyaltyProgram),
    rules: {
      ...rules,
      visits_required: clampVisitsRequired(Number(rules.visits_required ?? 5)),
      reward_label:
        typeof rules.reward_label === 'string'
          ? rules.reward_label
          : 'un beneficio',
    },
  } as LoyaltyProgram;
}

function normalizeCampaign(value: unknown): VenueCampaign | undefined {
  const record = asRecord(value);
  if (!record) return undefined;

  return {
    ...(record as unknown as VenueCampaign),
    segment: asRecord(record.segment) ?? {},
  } as VenueCampaign;
}

export async function getVenueEngagementConfig(
  venueId: string,
): Promise<VenueEngagementConfig> {
  const [loyaltyResult, campaignResult] = await Promise.all([
    supabase
      .from('loyalty_programs')
      .select('*')
      .eq('venue_id', venueId)
      .eq('type', 'stamps')
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('venue_campaigns')
      .select('*')
      .eq('venue_id', venueId)
      .eq('type', 'flash_promo')
      .eq('channel', 'in_app')
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  if (loyaltyResult.error) throw new Error(loyaltyResult.error.message);
  if (campaignResult.error) throw new Error(campaignResult.error.message);

  return {
    loyaltyProgram: normalizeLoyaltyProgram(loyaltyResult.data?.[0]),
    flashCampaign: normalizeCampaign(campaignResult.data?.[0]),
  };
}

export async function saveLoyaltyProgram(
  venueId: string,
  input: SaveLoyaltyProgramInput,
): Promise<LoyaltyProgram> {
  const visitsRequired = clampVisitsRequired(input.visitsRequired);
  const rewardLabel = input.rewardLabel.trim() || 'un beneficio';
  const payload = {
    venue_id: venueId,
    name: 'Club de visitas',
    type: 'stamps',
    status: input.enabled ? 'active' : 'paused',
    rules: {
      visits_required: visitsRequired,
      reward_label: rewardLabel,
    },
    starts_at: input.enabled ? new Date().toISOString() : null,
    ends_at: null,
    updated_at: new Date().toISOString(),
  };

  const query = input.id
    ? supabase
        .from('loyalty_programs')
        .update(payload)
        .eq('id', input.id)
        .select()
        .single()
    : supabase
        .from('loyalty_programs')
        .insert(payload)
        .select()
        .single();

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const program = normalizeLoyaltyProgram(data);
  if (!program) throw new Error('No se pudo guardar el programa');
  return program;
}

export async function saveFlashCampaign(
  venueId: string,
  input: SaveFlashCampaignInput,
): Promise<VenueCampaign> {
  const title = input.title.trim() || 'Promo flash';
  const body = input.body.trim() || 'Hay una promo disponible por tiempo limitado.';
  const ctaLabel = input.ctaLabel?.trim() || null;
  const payload = {
    venue_id: venueId,
    name: title,
    type: 'flash_promo',
    channel: 'in_app',
    status: input.enabled ? 'active' : 'paused',
    title,
    body,
    cta_label: ctaLabel,
    cta_url: null,
    segment: { audience: 'all_devices' },
    starts_at: input.enabled ? new Date().toISOString() : null,
    ends_at: null,
    updated_at: new Date().toISOString(),
  };

  const query = input.id
    ? supabase
        .from('venue_campaigns')
        .update(payload)
        .eq('id', input.id)
        .select()
        .single()
    : supabase
        .from('venue_campaigns')
        .insert(payload)
        .select()
        .single();

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const campaign = normalizeCampaign(data);
  if (!campaign) throw new Error('No se pudo guardar la promo');
  return campaign;
}
