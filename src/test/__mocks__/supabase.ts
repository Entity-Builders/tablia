import { vi } from 'vitest';

// ─── Chainable Supabase Builder Mock ──────────────────────────────
// Each method returns `this` so you can chain .from().select().eq().single()
// The actual async resolution is controlled via `mockResolvedValueOnce` on the
// individual terminal methods (single, eq with no further chain, etc.)

const buildChain = (overrides: Record<string, any> = {}) => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    // Allow awaiting the chain directly (for count queries, delete all, etc.)
    then: undefined as any,
  };
  // Make the chain itself thenable so `await supabase.from(...)...delete()` works
  Object.assign(chain, overrides);
  return chain;
};

// The top-level mock that replaces `../lib/supabase`
export const mockSupabaseChain = buildChain();

// Reset all mock state between tests
export function resetSupabaseMock() {
  for (const key of Object.keys(mockSupabaseChain)) {
    if (typeof mockSupabaseChain[key]?.mockReset === 'function') {
      mockSupabaseChain[key].mockReset();
      // Re-apply default return-this behavior after reset
      if (
        ['select', 'insert', 'update', 'delete', 'eq', 'order'].includes(key)
      ) {
        mockSupabaseChain[key].mockReturnThis();
      }
      if (key === 'single') {
        mockSupabaseChain[key].mockResolvedValue({ data: null, error: null });
      }
    }
  }
}

export const mockSupabase = {
  from: vi.fn().mockReturnValue(mockSupabaseChain),
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: { access_token: 'test-access-token' } },
      error: null,
    }),
    getUser: vi
      .fn()
      .mockResolvedValue({
        data: { user: { id: 'user-uuid-001' } },
        error: null,
      }),
  },
};
