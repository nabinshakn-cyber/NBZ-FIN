import React, { useState } from 'react';
import { LayoutDashboard, ReceiptText, Sparkles, Settings, Wallet, NotebookTabs, PiggyBank, Menu, X, LogOut, Camera } from 'lucide-react';
import { View } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();

  const menuItems = [
    { id: 'dashboard' as const, label: 'Home', icon: LayoutDashboard },
    { id: 'wallet' as const, label: 'My Banks', icon: Wallet },
    { id: 'transactions' as const, label: 'History', icon: ReceiptText },
    { id: 'ledger' as const, label: 'Loans', icon: NotebookTabs },
    { id: 'scanner' as const, label: 'Bill Scan', icon: Camera },
    { id: 'savings' as const, label: 'Savings', icon: PiggyBank },
    { id: 'ai-advisor' as const, label: 'Ask AI', icon: Sparkles },
  ];

  const handleNav = (view: View) => {
    onViewChange(view);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-6 left-6 z-50 p-3 bg-zinc-900 border border-gold/20 rounded-2xl text-gold shadow-2xl"
      >
        <Menu size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-56 glass border-r border-gold/10 flex flex-col p-6 transition-transform duration-500
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center text-black shadow-[0_0_15px_rgba(212,175,55,0.3)] rotate-3">
              <Wallet size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-black text-base tracking-tighter text-text-primary leading-tight">NBZ FIN APP</h1>
              <p className="text-[9px] font-bold text-gold uppercase tracking-[0.2em] opacity-80">Simple UAE & India</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-zinc-500">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
                currentView === item.id 
                ? 'text-text-primary' 
                : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-3 relative z-10">
                <item.icon size={18} className={currentView === item.id ? 'text-gold' : 'group-hover:text-gold transition-colors'} strokeWidth={currentView === item.id ? 2.5 : 2} />
                <span className={`text-xs tracking-wide font-medium ${currentView === item.id ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </div>
              
              {currentView === item.id && (
                <motion.div
                  layoutId="activeNavGold"
                  className="absolute inset-0 bg-gradient-to-r from-gold/10 to-transparent border-l-2 border-gold -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 space-y-2">
          <button
            onClick={() => handleNav('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
              currentView === 'settings' 
              ? 'text-text-primary bg-white/5 border border-white/10' 
              : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Settings size={18} className={currentView === 'settings' ? 'text-gold' : 'group-hover:text-gold transition-colors'} />
            <span className={`text-xs tracking-wide font-medium ${currentView === 'settings' ? 'font-bold' : ''}`}>
              Settings
            </span>
          </button>
          
          <div className="h-px bg-white/5 mx-2 my-2" />
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-rose-500 hover:bg-rose-500/10 group"
          >
            <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-xs tracking-wide font-medium">Terminate Session</span>
          </button>
          
          <div className="h-4" />
          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] px-4 mb-2 text-center opacity-50">Secure Zone</p>
        </div>
      </aside>
    </>
  );
}
