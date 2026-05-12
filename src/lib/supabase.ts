import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://')));

export const isSupabaseConfigured = isConfigured;

// Helper to create a proxy that returns safe defaults instead of throwing
const createNotConfiguredProxy = (path: string = 'supabase'): any => {
  const proxy: any = new Proxy(() => {}, {
    get: (target, prop) => {
      if (prop === 'then') {
        const isAuth = path.includes('.auth.');
        let defaultData: any = isAuth ? { session: null, user: null } : [];

        // Dynamic mock data based on table name
        if (!isConfigured && path.includes('.from')) {
          if (path.includes('transactions')) {
            defaultData = [
              { id: '1', description: 'Sample: Salary Credit', amount: 5000, currency: 'USD', type: 'income', category: 'salary', domain: 'personal', date: new Date().toISOString() },
              { id: '2', description: 'Sample: Grocery Store', amount: 85.50, currency: 'USD', type: 'expense', category: 'food', domain: 'personal', date: new Date().toISOString() }
            ];
          } else if (path.includes('accounts')) {
            defaultData = [
              { id: '1', name: 'Demo Main Account', balance: 12450.75, currency: 'USD', type: 'checking', bankName: 'MainBank', location: 'UAE' },
              { id: '2', name: 'Demo Savings', balance: 5000.00, currency: 'USD', type: 'savings', bankName: 'MainBank', location: 'India' }
            ];
          }
        }

        return (onFulfilled: any) => 
          Promise.resolve({ data: defaultData, error: null, count: 0 }).then(onFulfilled);
      }
      
      if (typeof prop === 'symbol') return (target as any)[prop];
      
      const fullPath = `${path}.${String(prop)}`;
      return createNotConfiguredProxy(fullPath);
    },
    apply: (target, thisArg, args) => {
      const chainableMethods = ['from', 'select', 'order', 'eq', 'insert', 'update', 'delete', 'single', 'channel', 'on', 'subscribe'];
      if (chainableMethods.some(m => path.endsWith(`.${m}`))) {
        return proxy;
      }

      if (path.endsWith('.onAuthStateChange')) {
        return { data: { subscription: { unsubscribe: () => {} } } };
      }

      return proxy;
    }
  });

  return proxy;
};

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : createNotConfiguredProxy();

// Database Helpers mapped to requested tables
export const tables = {
  USERS: 'users',
  INCOME: 'income',
  EXPENSES: 'expenses',
  TRANSACTIONS: 'transactions',
  LOANS: 'loans',
  REPAYMENTS: 'repayments'
};
