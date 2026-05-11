import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!(import.meta as any).env.VITE_SUPABASE_URL || !(import.meta as any).env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Settings menu.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Helpers mapped to requested tables
export const tables = {
  USERS: 'users',
  INCOME: 'income',
  EXPENSES: 'expenses',
  TRANSACTIONS: 'transactions',
  LOANS: 'loans',
  REPAYMENTS: 'repayments'
};
