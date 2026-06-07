import '@testing-library/jest-dom';

// Mock import.meta.env for all tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_POSTHOG_HOST: 'https://us.i.posthog.com',
    VITE_POSTHOG_KEY: 'test-posthog-key',
    VITE_TABLIA_ANALYTICS_ENDPOINT: '/api/tablia/analytics',
    VITE_GEMINI_API_KEY: 'test-gemini-key',
    DEV: false,
    MODE: 'test',
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
