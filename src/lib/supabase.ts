import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars missing — running in demo mode');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'maison-auth',
        // Bypass navigator.locks to avoid orphaned lock warnings in React Strict Mode
        lock: async (_name, _acquireTimeout, fn) => fn(),
      },
    })
  : null;

export const isSupabaseConfigured = !!supabase;
