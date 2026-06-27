import {
  supabase,
  supabaseAnonKey,
  supabaseUrl,
} from '@eb-packages/logic/src/supabase';

export { supabase };

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
