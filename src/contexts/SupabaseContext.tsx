import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Mock user for demo mode
const MOCK_USER: User = {
  id: 'demo-user-id',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@nbz-vault.com',
  email_confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: { full_name: 'Demo User' },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_SESSION: Session = {
  access_token: 'mock-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh',
  user: MOCK_USER,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
};

interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemo: boolean;
}

const SupabaseContext = createContext<SupabaseContextType>({ 
  user: null, 
  session: null, 
  loading: true,
  isDemo: false
});

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Automatic Demo Mode
      setSession(MOCK_SESSION);
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    // Initial session get
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseContext.Provider value={{ user, session, loading, isDemo: !isSupabaseConfigured }}>
      {!loading && children}
    </SupabaseContext.Provider>
  );
};
