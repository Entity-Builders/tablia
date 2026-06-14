import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../pages/LoginPage';

const {
  mockAnalyticsTrack,
  mockGetSession,
  mockNavigate,
  mockOnAuthStateChange,
  mockSearchParams,
  mockSignInAnonymously,
  mockSignInWithOAuth,
  mockSignInWithOtp,
  mockSignOut,
  mockUseAuth,
  mockVerifyOtp,
} = vi.hoisted(() => ({
  mockAnalyticsTrack: vi.fn(),
  mockGetSession: vi.fn(),
  mockNavigate: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSearchParams: { value: new URLSearchParams() },
  mockSignInAnonymously: vi.fn(),
  mockSignInWithOAuth: vi.fn(),
  mockSignInWithOtp: vi.fn(),
  mockSignOut: vi.fn(),
  mockUseAuth: vi.fn(),
  mockVerifyOtp: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams.value],
}));

vi.mock('../contexts/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInAnonymously: mockSignInAnonymously,
      signInWithOAuth: mockSignInWithOAuth,
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
      signOut: mockSignOut,
    },
  },
}));

vi.mock('../services/analytics', () => ({
  analytics: {
    track: mockAnalyticsTrack,
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.value = new URLSearchParams();
    mockUseAuth.mockReturnValue({ user: null });
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockSignInWithOtp.mockResolvedValue({ error: null });
    mockSignInWithOAuth.mockResolvedValue({ error: null });
    mockSignInAnonymously.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockVerifyOtp.mockResolvedValue({ data: { session: null }, error: null });
    mockSignOut.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders shared auth methods for Tablia without guest access', async () => {
    render(<LoginPage />);

    expect(await screen.findByText('Codigo por email')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continuar con Google' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Seguir sin cuenta' }),
    ).not.toBeInTheDocument();
  });

  it('requests an email code with Tablia app metadata', async () => {
    render(<LoginPage />);
    const expectedRedirectTo = `${window.location.origin}/dashboard`;

    fireEvent.change(await screen.findByLabelText('Email de trabajo'), {
      target: { value: 'owner@restaurant.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar codigo' }));

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'owner@restaurant.test',
        options: {
          emailRedirectTo: expectedRedirectTo,
          data: { app_name: 'tablia' },
        },
      });
    });
    expect(mockAnalyticsTrack).toHaveBeenCalledWith(
      'auth_code_request_submitted',
      expect.objectContaining({ app: 'tablia', app_id: 'tablia' }),
    );
  });

  it('starts Google OAuth with the Tablia dashboard redirect', async () => {
    render(<LoginPage />);
    const expectedRedirectTo = `${window.location.origin}/dashboard`;

    fireEvent.click(
      await screen.findByRole('button', { name: 'Continuar con Google' }),
    );

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: expectedRedirectTo },
      });
    });
  });

  it('redirects authenticated owners to the dashboard', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'owner-1' } });

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
        replace: true,
      });
    });
  });
});
