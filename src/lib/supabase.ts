import {
  supabase,
  supabaseAnonKey,
  supabaseUrl,
} from '@entity-builders/logic/src/supabase';

export { supabase };

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
