import { vi } from 'vitest';

/** Mock of the `analytics` object from src/services/analytics.ts */
export const mockAnalytics = {
  captureError: vi.fn(),
  init: vi.fn(),
  track: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  setGlobalProperties: vi.fn(),
};
