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
import BillScanner from './components/BillScanner';
import { View, Transaction, Account } from './types';
import WalletView from './components/Wallet';
import Settings from './components/Settings';
import Login from './components/Login';
import { NotificationProvider, NotificationCenter, useNotifications } from './components/NotificationCenter';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { 
  subscribeToCollection, 
  createDocument, 
  updateDocument, 
  deleteDocument 
} from './lib/firestoreUtils';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addNotification } = useNotifications();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [notifiedReminders, setNotifiedReminders] = useState<Set<string>>(new Set());
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Notification Monitor Effect
  useEffect(() => {
    if (!reminders.length) return;

    const checkReminders = () => {
      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      reminders.forEach(reminder => {
        const dueDate = new Date(reminder.due_date);
        // If due soon and not already notified in this session
        if (dueDate <= oneDayFromNow && dueDate >= now && !notifiedReminders.has(reminder.id)) {
          addNotification({
            title: 'Bill Due Soon',
            message: `${reminder.title} repayment is due on ${reminder.due_date}.`,
            type: 'reminder'
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

    // Firebase Subscriptions
    const unsubTxs = subscribeToCollection('transactions', (data) => {
      setTransactions(data as Transaction[]);
    });

    const unsubAccounts = subscribeToCollection('accounts', (data) => {
      setAccounts(data as Account[]);
    });

    const unsubReminders = subscribeToCollection('reminders', (data) => {
      setReminders(data);
    });

    return () => {
      unsubTxs();
      unsubAccounts();
      unsubReminders();
    };
  }, [user]);

  const handleAddTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    if (!user) return;
    try {
      await createDocument('transactions', newTx);

      // Handle Loans/Reminders logic
      if (newTx.type === 'lent' || newTx.type === 'borrowed') {
        await createDocument('reminders', {
          amount: newTx.amount,
          currency: newTx.currency,
          title: newTx.person || 'Unknown',
          type: newTx.type === 'lent' ? 'bill' : 'repayment', // simplified for reminders model
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending'
        });
      }
    } catch (error) {
      console.error("Firebase Tx Error:", error);
    }
  };

  const handleAddAccount = async (acc: Omit<Account, 'id'>) => {
    if (!user) return;
    try {
      await createDocument('accounts', acc);
    } catch (error) {
      console.error("Firebase Account Error:", error);
    }
  };

  const handleUpdateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      await updateDocument('accounts', id, updates);
    } catch (error) {
      console.error("Update Account Error:", error);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await deleteDocument('accounts', id);
    } catch (error) {
      console.error("Delete Account Error:", error);
    }
  };

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      await updateDocument('transactions', id, updates);
    } catch (error) {
      console.error("Update Tx Error:", error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteDocument('transactions', id);
    } catch (error) {
      console.error("Delete Tx Error:", error);
    }
  };

  const handleResetAllData = async () => {
    // Note: Batch deletion is usually handled better in separate logic, 
    // but for simplicity we'll just inform we can't easily perform bulk delete from client in a single call without cloud functions or manual doc mapping
    alert("Resetting data in live mode requires per-document removal which is restricted for safety.");
  };

  const handleSeedData = async () => {
    if (!user) return;
    try {
      await createDocument('transactions', {
        description: 'Global Systems Salary', 
        amount: 25000, 
        currency: 'AED', 
        type: 'income', 
        category: 'salary', 
        domain: 'personal', 
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Seed Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-900 leading-relaxed font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold/10 border-t-gold rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold/40">Opening your wallet...</p>
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
        return <Dashboard transactions={transactions} reminders={reminders} accounts={accounts} onAskAI={() => setCurrentView('ai-advisor')} onNavigateToWallet={() => setCurrentView('wallet')} />;
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
        return <Ledger transactions={transactions} onAdd={handleAddTransaction} onUpdate={handleUpdateTransaction} />;
      case 'scanner':
        return <BillScanner onAddTransaction={handleAddTransaction} />;
      case 'savings':
        return <Savings />;
      case 'ai-advisor':
        return <AIChat transactions={transactions} />;
      case 'settings':
        return <Settings onResetData={handleResetAllData} onSeedData={handleSeedData} />;
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
    <div className="flex min-h-screen bg-bg-app text-text-primary overflow-x-hidden font-sans">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 lg:ml-56 min-h-screen relative">
        <div className="p-4 lg:p-6 w-full">
          <header className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all hover:bg-white/10"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-gold uppercase tracking-[0.2em]">{currentView} ACTIVE</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <NotificationCenter />
              <div className="w-7 h-7 rounded-lg bg-gold flex items-center justify-center text-black font-black text-[9px] shadow-lg shadow-gold/10">
                {user.email?.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
