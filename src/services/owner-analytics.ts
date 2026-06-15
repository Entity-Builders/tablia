import { analytics } from './analytics';

export type OwnerAnalyticsEvent =
  | 'owner_dashboard_viewed'
  | 'venue_created'
  | 'venue_create_failed'
  | 'menu_import_started'
  | 'menu_parse_started'
  | 'menu_parse_succeeded'
  | 'menu_parse_failed'
  | 'menu_review_confirmed'
  | 'menu_publish_failed'
  | 'landing_setup_completed'
  | 'landing_setup_skipped'
  | 'owner_analytics_viewed'
  | 'qr_modal_opened'
  | 'qr_link_copied'
  | 'landing_links_saved'
  | 'landing_links_save_failed'
  | 'chat_persona_saved'
  | 'chat_persona_save_failed'
  | 'engagement_config_saved'
  | 'engagement_config_save_failed';

type SafeOwnerAnalyticsProps = {
  category_count?: number;
  confidence_bucket?: string;
  error_kind?: string;
  file_size_bucket?: string;
  file_type?: string;
  had_contact_data?: boolean;
  has_campaign?: boolean;
  has_loyalty?: boolean;
  input_mode?: 'file' | 'text';
  item_count_bucket?: string;
  link_count?: number;
  menu_status?: string;
  persona_id?: string;
  slug?: string;
  source?: string;
  surface?: string;
  workflow?: string;
};

const SAFE_KEYS = new Set<keyof SafeOwnerAnalyticsProps>([
  'category_count',
  'confidence_bucket',
  'error_kind',
  'file_size_bucket',
  'file_type',
  'had_contact_data',
  'has_campaign',
  'has_loyalty',
  'input_mode',
  'item_count_bucket',
  'link_count',
  'menu_status',
  'persona_id',
  'slug',
  'source',
  'surface',
  'workflow',
]);

export function bucketFileSize(bytes?: number): string {
  if (!Number.isFinite(bytes) || !bytes || bytes <= 0) return 'unknown';
  const mb = bytes / (1024 * 1024);
  if (mb <= 1) return '0_1mb';
  if (mb <= 5) return '1_5mb';
  if (mb <= 10) return '5_10mb';
  return 'over_10mb';
}

export function bucketCount(count?: number): string {
  if (!Number.isFinite(count) || count == null || count < 0) return 'unknown';
  if (count === 0) return '0';
  if (count <= 5) return '1_5';
  if (count <= 20) return '6_20';
  if (count <= 50) return '21_50';
  return 'over_50';
}

export function bucketConfidence(value?: number): string {
  if (!Number.isFinite(value) || value == null) return 'unknown';
  if (value < 0.5) return 'low';
  if (value < 0.8) return 'medium';
  return 'high';
}

export function errorKind(error: unknown): string {
  if (!(error instanceof Error)) return 'unknown_error';
  const message = error.message.toLowerCase();
  if (message.includes('duplicate') || message.includes('already')) {
    return 'duplicate';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'network';
  }
  if (message.includes('auth') || message.includes('unauthorized')) {
    return 'auth';
  }
  if (message.includes('timeout')) return 'timeout';
  if (message.includes('parse')) return 'parse';
  return 'unexpected';
}

export function sanitizeOwnerAnalyticsProps(
  props: Record<string, unknown> = {},
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(props).filter(([key, value]) => {
      if (!SAFE_KEYS.has(key as keyof SafeOwnerAnalyticsProps)) return false;
      if (value === undefined) return false;
      if (
        value !== null &&
        typeof value !== 'string' &&
        typeof value !== 'number' &&
        typeof value !== 'boolean'
      ) {
        return false;
      }
      return true;
    }),
  );
}

export function trackOwnerEvent(
  event: OwnerAnalyticsEvent,
  props: SafeOwnerAnalyticsProps = {},
) {
  analytics.track(event, {
    surface: 'owner_dashboard',
    ...sanitizeOwnerAnalyticsProps(props),
  });
}

export function captureOwnerError(
  event: OwnerAnalyticsEvent,
  error: unknown,
  props: SafeOwnerAnalyticsProps = {},
) {
  const kind = errorKind(error);
  const safeProps = sanitizeOwnerAnalyticsProps({
    ...props,
    error_kind: props.error_kind ?? kind,
  });
  trackOwnerEvent(event, safeProps);
  analytics.captureError(new Error(kind), {
    surface: 'owner_dashboard',
    ...safeProps,
  });
}
