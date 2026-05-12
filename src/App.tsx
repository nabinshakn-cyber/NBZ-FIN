/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import AIChat from './components/AIChat';
import Ledger from './components/Ledger';
import Savings from './components/Savings';
import { View, Transaction, Account } from './types';
import { SupabaseProvider, useSupabase } from './contexts/SupabaseContext';
import { supabase, tables, isSupabaseConfigured } from './lib/supabase';
import WalletView from './components/Wallet';
import Settings from './components/Settings';
import Login from './components/Login';
import { getDocs, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { user, loading } = useSupabase();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [notifiedReminders, setNotifiedReminders] = useState<Set<string>>(new Set());
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Notification Monitor Effect
  useEffect(() => {
    if (!reminders.length || Notification.permission !== 'granted') return;

    const checkReminders = () => {
      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      reminders.forEach(reminder => {
        const dueDate = new Date(reminder.due_date);
        // If due soon and not already notified in this session
        if (dueDate <= oneDayFromNow && dueDate >= now && !notifiedReminders.has(reminder.id)) {
          new Notification('NBZ Vault Alert: Bill Due', {
            body: `${reminder.entity_name} tranche is due on ${reminder.due_date}. Access your vault to authorize payment.`,
            icon: '/favicon.ico'
          });
          setNotifiedReminders(prev => new Set(prev).add(reminder.id));
        }
      });
    };

    // Initial check and then periodic
    checkReminders();
    const interval = setInterval(checkReminders, 1000 * 60 * 60); // Every hour
    return () => clearInterval(interval);
  }, [reminders, notifiedReminders]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch Transactions
      const { data: txs } = await supabase
        .from(tables.TRANSACTIONS)
        .select('*')
        .order('date', { ascending: false });
      if (txs) setTransactions(txs as Transaction[]);

      // Fetch Accounts
      const { data: acs } = await supabase.from('accounts').select('*');
      if (acs) setAccounts(acs as Account[]);

      // Fetch Loans (Reminders)
      const { data: lns } = await supabase.from('loans').select('*').order('due_date', { ascending: true });
      if (lns) setReminders(lns);
    };

    fetchData();

    // Realtime Sync Subscription
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: tables.TRANSACTIONS }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTransactions(prev => [payload.new as Transaction, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTransactions(prev => prev.map(t => t.id === payload.new.id ? payload.new as Transaction : t));
        } else if (payload.eventType === 'DELETE') {
          setTransactions(prev => prev.filter(t => t.id === payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, (payload) => {
        if (payload.eventType === 'INSERT') setAccounts(prev => [...prev, payload.new as Account]);
        if (payload.eventType === 'UPDATE') setAccounts(prev => prev.map(a => a.id === payload.new.id ? payload.new as Account : a));
        if (payload.eventType === 'DELETE') setAccounts(prev => prev.filter(a => a.id === payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, (payload) => {
        if (payload.eventType === 'INSERT') setReminders(prev => [...prev, payload.new]);
        if (payload.eventType === 'UPDATE') setReminders(prev => prev.map(l => l.id === payload.new.id ? payload.new : l));
        if (payload.eventType === 'DELETE') setReminders(prev => prev.filter(l => l.id === payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAddTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from(tables.TRANSACTIONS)
        .insert([{ ...newTx, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Handle Loans/Reminders logic
      if (newTx.type === 'lent' || newTx.type === 'borrowed') {
        // We'll use the loans table for this now
        await supabase.from('loans').insert([{
          user_id: user.id,
          amount: newTx.amount,
          currency: newTx.currency,
          entity_name: newTx.person || 'Unknown',
          type: newTx.type,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }]);
      }
    } catch (error) {
      console.error("Supabase Tx Error:", error);
    }
  };

  const handleAddAccount = async (acc: Omit<Account, 'id'>) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('accounts').insert([{ ...acc, user_id: user.id }]);
      if (error) throw error;
    } catch (error) {
      console.error("Supabase Account Error:", error);
    }
  };

  const handleUpdateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const { error } = await supabase.from('accounts').update(updates).eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Update Account Error:", error);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Delete Account Error:", error);
    }
  };

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const { error } = await supabase.from(tables.TRANSACTIONS).update(updates).eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Update Tx Error:", error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from(tables.TRANSACTIONS).delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Delete Tx Error:", error);
    }
  };

  const handleResetAllData = async () => {
    if (!user) return;
    try {
      await supabase.from(tables.TRANSACTIONS).delete().eq('user_id', user.id);
      await supabase.from('accounts').delete().eq('user_id', user.id);
      setCurrentView('dashboard');
    } catch (error) {
      console.error("Reset Error:", error);
    }
  };

  const handleSeedDemoData = async () => {
    if (!user) return;
    try {
      const demoTransactions = [
        { description: 'Global Systems Salary', amount: 25000, currency: 'AED', type: 'income', category: 'salary', domain: 'personal', date: new Date().toISOString().split('T')[0], user_id: user.id },
        { description: 'Burj Khalifa Residence Rent', amount: 8000, currency: 'AED', type: 'expense', category: 'bills', domain: 'personal', date: new Date().toISOString().split('T')[0], user_id: user.id },
      ];
      await supabase.from(tables.TRANSACTIONS).insert(demoTransactions);
    } catch (error) {
      console.error("Seed Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-900 leading-relaxed font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold/10 border-t-gold rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold/40">Synchronizing Vault Protocol...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard transactions={transactions} reminders={reminders} accounts={accounts} onAskAI={() => setCurrentView('ai-advisor')} />;
      case 'wallet':
        return (
          <WalletView 
            accounts={accounts} 
            onAdd={handleAddAccount} 
            onUpdate={handleUpdateAccount} 
            onDelete={handleDeleteAccount} 
          />
        );
      case 'transactions':
        return (
          <Transactions 
            transactions={transactions} 
            onAdd={handleAddTransaction} 
            onUpdate={handleUpdateTransaction}
            onDelete={handleDeleteTransaction}
          />
        );
      case 'ledger':
        return <Ledger transactions={transactions} onAdd={handleAddTransaction} />;
      case 'savings':
        return <Savings />;
      case 'ai-advisor':
        return <AIChat transactions={transactions} />;
      case 'settings':
        return <Settings onResetData={handleResetAllData} onSeedData={handleSeedDemoData} />;
      default:
        return (
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center card max-w-md">
              <h2 className="text-2xl font-bold mb-2">Sector Restricted</h2>
              <p className="text-zinc-500">Settings and profile modules are coming in V2 of NBZ FIN AI OS.</p>
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="btn-primary mt-6 bg-indigo-600"
              >
                Return to Core Dashboard
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] selection:bg-gold/20 selection:text-gold">
      {!isSupabaseConfigured && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-zinc-900/80 text-gold px-4 py-2 text-center text-[10px] backdrop-blur-md border-b border-gold/10 flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20">
            <span className="flex h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            <p className="font-bold uppercase tracking-[0.2em] leading-none">
              Demo Mode Active
            </p>
          </div>
          <p className="text-zinc-400 font-medium">
            Local instance running without Supabase. Config in Settings to persist data.
          </p>
        </div>
      )}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="lg:ml-64 flex-1 p-6 lg:p-12 max-w-[1400px] mx-auto w-full transition-all duration-300">
        <div className="mt-16 lg:mt-0">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SupabaseProvider>
      <AppContent />
    </SupabaseProvider>
  );
}
