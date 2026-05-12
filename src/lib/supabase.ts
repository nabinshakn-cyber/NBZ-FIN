import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))
);

const createNotConfiguredProxy = (path: string = 'supabase'): any => {
  return new Proxy({}, {
    get(_, prop) {
      if (typeof prop === 'string') {
        return createNotConfiguredProxy(`${path}.${prop}`);
      }
      return undefined;
    },
    apply() {
      throw new Error(
        `Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables. ` +
        `Current URL: ${supabaseUrl || 'undefined'}`
      );
    }
  });
};

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : createNotConfiguredProxy();

export const isSupabaseConfigured = isConfigured;
