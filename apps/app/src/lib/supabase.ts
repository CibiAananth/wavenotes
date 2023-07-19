import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.',
  );
}
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 'x-my-custom-header': 'rec' },
  },
};

class SupabaseSingleton {
  private static instance: SupabaseClient;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {} // private constructor to prevent direct construction calls

  public static getInstance(): SupabaseClient {
    if (!SupabaseSingleton.instance) {
      SupabaseSingleton.instance = createClient(
        supabaseUrl,
        supabaseAnonKey,
        options,
      );
    }
    return SupabaseSingleton.instance;
  }
}

export const supabase = SupabaseSingleton.getInstance();
