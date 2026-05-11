import React, { useState } from 'react';
import { LayoutDashboard, ReceiptText, Sparkles, Settings, Wallet, NotebookTabs, PiggyBank, Menu, X } from 'lucide-react';
import { View } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard' as const, label: 'Vault', icon: LayoutDashboard },
    { id: 'wallet' as const, label: 'Wallet', icon: Wallet },
    { id: 'transactions' as const, label: 'Ledger', icon: ReceiptText },
    { id: 'ledger' as const, label: 'Friends', icon: NotebookTabs },
    { id: 'savings' as const, label: 'Wealth', icon: PiggyBank },
    { id: 'ai-advisor' as const, label: 'AI Advisor', icon: Sparkles },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
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
        fixed inset-y-0 left-0 z-[70] w-72 glass border-r border-gold/10 flex flex-col p-8 transition-transform duration-500
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] rotate-3">
              <Wallet size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tighter text-white">NBZ FIN</h1>
              <p className="text-[10px] font-bold text-gold uppercase tracking-[0.2em] opacity-80">Overseas OS</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-zinc-500">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all group relative overflow-hidden ${
                currentView === item.id 
                ? 'text-white' 
                : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-4 relative z-10">
                <item.icon size={20} className={currentView === item.id ? 'text-gold' : 'group-hover:text-gold transition-colors'} strokeWidth={currentView === item.id ? 2.5 : 2} />
                <span className={`text-sm tracking-wide font-medium ${currentView === item.id ? 'font-black' : ''}`}>
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

        <div className="mt-auto">
          <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/10 blur-3xl -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
            <p className="text-[10px] font-black text-gold uppercase tracking-widest mb-3">Elite Status</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">NRB Member</span>
              <div className="w-2 h-2 bg-gold rounded-full animate-pulse shadow-[0_0_10px_#D4AF37]" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
