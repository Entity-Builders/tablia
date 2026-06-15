import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bucketConfidence,
  bucketCount,
  bucketFileSize,
  captureOwnerError,
  sanitizeOwnerAnalyticsProps,
  trackOwnerEvent,
} from '../services/owner-analytics';

vi.mock('../services/analytics', () => ({
  analytics: {
    captureError: vi.fn(),
    track: vi.fn(),
  },
}));

describe('owner-analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps only safe owner analytics properties', () => {
    const sanitized = sanitizeOwnerAnalyticsProps({
      slug: 'la-parrilla',
      input_mode: 'file',
      file_size_bucket: '1_5mb',
      owner_email: 'owner@example.com',
      venue_name: 'La Parrilla del Centro',
      raw_menu_text: 'secret menu',
      parsed_json: { categories: [] },
      error_stack: 'stack',
    });

    expect(sanitized).toEqual({
      slug: 'la-parrilla',
      input_mode: 'file',
      file_size_bucket: '1_5mb',
    });
  });

  it('tracks owner events with the owner surface', async () => {
    const { analytics } = await import('../services/analytics');

    trackOwnerEvent('menu_parse_succeeded', {
      slug: 'la-parrilla',
      category_count: 4,
    });

    expect(analytics.track).toHaveBeenCalledWith('menu_parse_succeeded', {
      surface: 'owner_dashboard',
      slug: 'la-parrilla',
      category_count: 4,
    });
  });

  it('captures owner errors using only a coarse error kind', async () => {
    const { analytics } = await import('../services/analytics');

    captureOwnerError(
      'menu_parse_failed',
      new Error('Provider returned raw stack with owner@example.com'),
      { slug: 'la-parrilla', workflow: 'menu_import' },
    );

    expect(analytics.track).toHaveBeenCalledWith('menu_parse_failed', {
      surface: 'owner_dashboard',
      slug: 'la-parrilla',
      workflow: 'menu_import',
      error_kind: 'unexpected',
    });
    expect(analytics.captureError).toHaveBeenCalledWith(expect.any(Error), {
      surface: 'owner_dashboard',
      slug: 'la-parrilla',
      workflow: 'menu_import',
      error_kind: 'unexpected',
    });
    const capturedError = vi.mocked(analytics.captureError).mock.calls[0][0];
    expect(capturedError).toMatchObject({ message: 'unexpected' });
  });

  it('buckets coarse numeric values', () => {
    expect(bucketFileSize(750_000)).toBe('0_1mb');
    expect(bucketFileSize(2_000_000)).toBe('1_5mb');
    expect(bucketFileSize(7_000_000)).toBe('5_10mb');
    expect(bucketCount(0)).toBe('0');
    expect(bucketCount(12)).toBe('6_20');
    expect(bucketConfidence(0.9)).toBe('high');
  });
});
