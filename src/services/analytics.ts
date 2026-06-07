/**
 * App-specific analytics instance for Tablia.
 * Uses the shared @eb-packages/analytics package.
 * Same Entity Builders PostHog project as the other online apps,
 * differentiated by `app: 'tablia'`.
 */
import { Analytics, PostHogProvider } from '@eb-packages/analytics';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || '';
const POSTHOG_HOST =
  import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

export const analytics = new Analytics(new PostHogProvider());

/**
 * Initialize analytics — call once at app startup (main.tsx).
 */
export function initAnalytics() {
  if (import.meta.env.DEV) {
    // console.info('[Analytics] Dev mode — tracking disabled.');
    // return;
  }

  analytics.init({
    apiKey: POSTHOG_KEY,
    apiHost: POSTHOG_HOST,
  });

  analytics.setGlobalProperties({
    app: 'tablia',
    project: 'tablia',
    environment: import.meta.env.MODE || 'production',
  });
}
