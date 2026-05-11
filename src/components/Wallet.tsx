import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Plus, Building2, Banknote, CreditCard, Trash2, Edit3, Globe, Coins, Trash, User, ArrowRight, RefreshCcw } from 'lucide-react';
import { Account, Currency } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { fetchLiveRates, ExchangeRates, DEFAULT_AED_TO_INR, convertCurrency } from '../services/currencyService';

interface WalletProps {
  accounts: Account[];
  onAdd: (account: Omit<Account, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Account>) => void;
  onDelete: (id: string) => void;
}

type DisplayCurrency = 'native' | 'AED' | 'INR';

export default function Wallet({ accounts, onAdd, onUpdate, onDelete }: WalletProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('native');
  const [fxRates, setFxRates] = useState<ExchangeRates | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const loadRates = async () => {
      setIsSyncing(true);
      const rates = await fetchLiveRates();
      if (rates) setFxRates(rates);
      setIsSyncing(false);
    };
    loadRates();
  }, []);
  const [newAcc, setNewAcc] = useState<Omit<Account, 'id' | 'user_id'>>({
    bankName: '',
    balance: 0,
    currency: 'AED',
    type: 'bank',
    location: 'UAE'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcc.bankName) return;
    onAdd(newAcc as any);
    setNewAcc({ bankName: '', balance: 0, currency: 'AED', type: 'bank', location: 'UAE' });
    setShowAdd(false);
  };

  const uaeAccounts = accounts.filter(a => a.location === 'UAE');
  const indiaAccounts = accounts.filter(a => a.location === 'India');
  const cashAccounts = accounts.filter(a => a.location === 'Cash');

  return (
    <div className="space-y-12 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white">Financial Hub</h1>
          <p className="text-zinc-500 mt-1 max-w-md">Overseas liquidity management across tranches and physical assets.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-zinc-900 border border-white/5 p-1 rounded-2xl">
          {(['native', 'AED', 'INR'] as DisplayCurrency[]).map((cur) => (
            <button
              key={cur}
              onClick={() => setDisplayCurrency(cur)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                displayCurrency === cur 
                  ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {cur === 'native' ? 'Native Assets' : cur}
            </button>
          ))}
          <div className="w-px h-6 bg-white/5 mx-2" />
          <div className={`p-2 transition-colors ${isSyncing ? 'animate-spin text-gold' : 'text-zinc-600'}`}>
            <RefreshCcw size={14} />
          </div>
        </div>

        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="btn-primary flex items-center gap-3 group"
        >
          <div className="bg-black/20 p-1 rounded-lg group-hover:rotate-90 transition-transform">
            <Plus size={16} />
          </div>
          Add New Node
        </button>
      </header>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="card bg-gold/5 border-gold/20 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gold tracking-widest">Bank / Institution</label>
                <input 
                  type="text" 
                  placeholder="e.g. ADCB, Mbank"
                  className="input-field w-full"
                  value={newAcc.bankName}
                  onChange={e => setNewAcc({ ...newAcc, bankName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gold tracking-widest">Account Type</label>
                <select 
                  className="input-field w-full"
                  value={newAcc.type}
                  onChange={e => setNewAcc({ ...newAcc, type: e.target.value as any })}
                >
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash Wallet</option>
                  <option value="card">Credit Card</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gold tracking-widest">Available Capital</label>
                <input 
                  type="number" 
                  className="input-field w-full"
                  value={newAcc.balance}
                  onChange={e => setNewAcc({ ...newAcc, balance: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gold tracking-widest">Base Currency</label>
                <select 
                  className="input-field w-full"
                  value={newAcc.currency}
                  onChange={e => setNewAcc({ ...newAcc, currency: e.target.value as Currency })}
                >
                  <option value="AED">AED (UAE)</option>
                  <option value="INR">INR (India)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gold tracking-widest">Zone</label>
                <select 
                  className="input-field w-full"
                  value={newAcc.location}
                  onChange={e => setNewAcc({ ...newAcc, location: e.target.value as any })}
                >
                  <option value="UAE">UAE</option>
                  <option value="India">India</option>
                  <option value="Cash">Physical Cash</option>
                </select>
              </div>
              <div className="md:col-span-2 lg:col-span-5 flex justify-end gap-4 pt-6 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-6 py-2 rounded-xl font-bold text-zinc-500 hover:text-white transition-all uppercase text-[10px] tracking-widest"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                >
                  Deploy Node
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* UAE SECTION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gold/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center text-gold">
                <Globe size={16} />
              </div>
              <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-zinc-100">UAE Tranches</h3>
            </div>
            <span className="text-[9px] font-black text-gold/40">ZONE: AED</span>
          </div>
          <div className="space-y-4">
            {uaeAccounts.map(acc => (
              <AccountCard 
                key={acc.id} 
                account={acc} 
                onUpdate={onUpdate} 
                onDelete={onDelete}
                displayCurrency={displayCurrency}
                fxRates={fxRates}
              />
            ))}
            {uaeAccounts.length === 0 && <EmptyState type="UAE Banks" />}
          </div>
        </section>

        {/* INDIA SECTION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gold/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center text-gold">
                <Globe size={16} strokeWidth={2.5} />
              </div>
              <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-zinc-100">India Reserves</h3>
            </div>
            <span className="text-[9px] font-black text-gold/40">ZONE: INR</span>
          </div>
          <div className="space-y-4">
            {indiaAccounts.map(acc => (
              <AccountCard 
                key={acc.id} 
                account={acc} 
                onUpdate={onUpdate} 
                onDelete={onDelete}
                displayCurrency={displayCurrency}
                fxRates={fxRates}
              />
            ))}
            {indiaAccounts.length === 0 && <EmptyState type="Indian Banks" />}
          </div>
        </section>

        {/* CASH SECTION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gold/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center text-gold">
                <Banknote size={16} />
              </div>
              <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-zinc-100">Liquid Assets</h3>
            </div>
            <span className="text-[9px] font-black text-gold/40">PHYSICAL</span>
          </div>
          <div className="space-y-4">
            {cashAccounts.map(acc => (
              <AccountCard 
                key={acc.id} 
                account={acc} 
                onUpdate={onUpdate} 
                onDelete={onDelete}
                displayCurrency={displayCurrency}
                fxRates={fxRates}
              />
            ))}
            {cashAccounts.length === 0 && <EmptyState type="Cash Wallets" />}
          </div>
        </section>
      </div>
    </div>
  );
}

function AccountCard({ account, onUpdate, onDelete, displayCurrency, fxRates }: { 
  account: Account, 
  onUpdate: any, 
  onDelete: any,
  displayCurrency: DisplayCurrency,
  fxRates: ExchangeRates | null
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [balance, setBalance] = useState(account.balance);

  const displayAmt = displayCurrency === 'native' 
    ? account.balance 
    : convertCurrency(account.balance, account.currency, displayCurrency, fxRates);

  const displaySymbol = displayCurrency === 'native' 
    ? (account.currency === 'AED' ? 'DH' : '₹')
    : (displayCurrency === 'AED' ? 'DH' : '₹');

  const handleSave = () => {
    onUpdate(account.id, { balance });
    setIsEditing(false);
  };

  const getIcon = () => {
    switch (account.type) {
      case 'cash': return <Banknote size={20} />;
      case 'card': return <CreditCard size={20} />;
      case 'bank':
      default: return <Building2 size={20} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card group p-6 hover:border-gold/30"
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 text-gold border border-gold/10">
            {getIcon()}
          </div>
          <div>
            <h4 className="font-bold text-white group-hover:text-gold transition-colors">{account.bankName}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{account.currency}</span>
              <span className="text-zinc-700">•</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{account.type}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={() => setIsEditing(!isEditing)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-gold transition-colors">
            <Edit3 size={16} />
          </button>
          <button onClick={() => onDelete(account.id)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-rose-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Available Liquidity</label>
          {isEditing ? (
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                className="w-36 text-2xl font-black tracking-tighter bg-white/5 border border-gold/20 rounded-xl px-3 py-1 outline-none text-white shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                value={balance}
                onChange={e => setBalance(Number(e.target.value))}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
              <button 
                onClick={handleSave}
                className="bg-gold text-black px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-transform active:scale-95 shadow-[0_0_15px_rgba(212,175,55,0.3)]"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className={`font-bold text-sm tracking-widest ${displayCurrency !== 'native' ? 'text-zinc-500' : 'text-gold'}`}>
                {displaySymbol}
              </span>
              <p className={`text-3xl font-black tracking-tighter ${displayCurrency !== 'native' ? 'text-zinc-300' : 'text-white'}`}>
                {displayAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          )}
        </div>
        <motion.div 
          whileHover={{ x: 3 }}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-600 transition-colors group-hover:text-gold"
        >
          <ArrowRight size={14} />
        </motion.div>
      </div>
    </motion.div>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div className="border border-dashed border-white/5 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center group bg-white/[0.01]">
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-600 mb-4 group-hover:text-gold transition-colors">
        <Plus size={24} />
      </div>
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">No nodes in {type}</p>
    </div>
  );
}
