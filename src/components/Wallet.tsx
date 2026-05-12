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
    if (!newAcc.bankName.trim()) return;
    onAdd(newAcc as any);
    setNewAcc({ bankName: '', balance: 0, currency: 'AED', type: 'bank', location: 'UAE' });
    setShowAdd(false);
  };

  const handleOpenAdd = (location: 'UAE' | 'India' | 'Cash' = 'UAE') => {
    const currency = location === 'India' ? 'INR' : 'AED';
    setNewAcc(prev => ({ ...prev, location, currency }));
    setShowAdd(true);
  };

  const uaeAccounts = accounts.filter(a => a.location === 'UAE');
  const indiaAccounts = accounts.filter(a => a.location === 'India');
  const cashAccounts = accounts.filter(a => a.location === 'Cash');

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-text-primary uppercase italic">My Banks</h1>
          <p className="text-text-secondary text-[10px] mt-0.5 max-w-md font-medium">Strategic asset management across UAE & India corridors.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-bg-card border border-border-card p-1 rounded-2xl">
            {(['native', 'AED', 'INR'] as DisplayCurrency[]).map((cur) => (
              <button
                key={cur}
                onClick={() => setDisplayCurrency(cur)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  displayCurrency === cur 
                    ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {cur === 'native' ? 'Auth Balance' : cur}
              </button>
            ))}
          </div>

          <button 
            onClick={() => handleOpenAdd()}
            className="btn-primary flex items-center gap-3 group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
            Add New Bank
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="card bg-bg-card border-gold/30 w-full max-w-2xl relative z-10 p-8 lg:p-12"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black tracking-tighter text-text-primary uppercase italic">Initialize Bank</h2>
                  <p className="text-text-secondary text-xs font-bold uppercase tracking-widest mt-1">Configure new liquidity node</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-white/5 rounded-full text-zinc-500">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gold tracking-widest">Bank / Institution</label>
                    <input 
                      type="text" 
                      placeholder="e.g. ADCB, SBI, Mbank"
                      className="input-field w-full"
                      value={newAcc.bankName}
                      onChange={e => setNewAcc({ ...newAcc, bankName: e.target.value })}
                      autoFocus
                      required
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
                    <label className="text-[10px] font-black uppercase text-gold tracking-widest">Initial Balance</label>
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
                      <option value="AED">AED (UAE Dirham)</option>
                      <option value="INR">INR (Indian Rupee)</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-gold tracking-widest">Zone / Location</label>
                    <select 
                      className="input-field w-full"
                      value={newAcc.location}
                      onChange={e => {
                        const loc = e.target.value as any;
                        const cur = loc === 'India' ? 'INR' : 'AED';
                        setNewAcc({ ...newAcc, location: loc, currency: cur });
                      }}
                    >
                      <option value="UAE">United Arab Emirates</option>
                      <option value="India">India (Offshore)</option>
                      <option value="Cash">Physical Assets / Cash</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-6 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-zinc-500 hover:bg-white/5 transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    disabled={!newAcc.bankName.trim()}
                    className="flex-[2] btn-primary disabled:opacity-50"
                  >
                    Commit Node
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGIONAL SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-bg-card border-border-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -mr-16 -mt-16 group-hover:bg-gold/10 transition-all duration-700" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-1.5 bg-gold/10 rounded-lg text-gold">
              <Globe size={16} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-[9px] text-text-secondary">UAE Aggregated Capital</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gold/40">AED</span>
            <span className="text-4xl font-black tracking-tighter text-text-primary">
              {uaeAccounts.reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="card bg-bg-card border-border-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -mr-16 -mt-16 group-hover:bg-gold/10 transition-all duration-700" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-1.5 bg-gold/10 rounded-lg text-gold">
              <Globe size={16} strokeWidth={2.5} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-[9px] text-text-secondary">India Aggregated Capital</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gold/40">INR</span>
            <span className="text-4xl font-black tracking-tighter text-text-primary">
              {indiaAccounts.reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* UAE SECTION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gold/10 pb-4 px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center text-gold">
                <Globe size={16} />
              </div>
              <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-text-primary">UAE Banks</h3>
            </div>
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
            {uaeAccounts.length === 0 && <EmptyState type="UAE" onClick={() => handleOpenAdd('UAE')} />}
          </div>
        </section>

        {/* INDIA SECTION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gold/10 pb-4 px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center text-gold">
                <Globe size={16} strokeWidth={2.5} />
              </div>
              <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-text-primary">India Banks</h3>
            </div>
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
            {indiaAccounts.length === 0 && <EmptyState type="India" onClick={() => handleOpenAdd('India')} />}
          </div>
        </section>

        {/* CASH SECTION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gold/10 pb-4 px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center text-gold">
                <Banknote size={16} />
              </div>
              <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-text-primary">Cash</h3>
            </div>
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
            {cashAccounts.length === 0 && <EmptyState type="Cash" onClick={() => handleOpenAdd('Cash')} />}
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
  const [location, setLocation] = useState(account.location);

  const displayAmt = displayCurrency === 'native' 
    ? account.balance 
    : convertCurrency(account.balance, account.currency, displayCurrency, fxRates);

  const displaySymbol = displayCurrency === 'native' 
    ? (account.currency === 'AED' ? 'DH' : '₹')
    : (displayCurrency === 'AED' ? 'DH' : '₹');

  const handleSave = () => {
    onUpdate(account.id, { balance, location });
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
      className="card group p-5 hover:border-gold/30 border-white/5 bg-white/[0.02]"
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-gold border border-gold/10">
            {getIcon()}
          </div>
          <div>
            <h4 className="font-bold text-sm text-text-primary group-hover:text-gold transition-colors">{account.bankName}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[8px] font-black uppercase tracking-widest text-text-secondary">{account.currency}</span>
              <span className="text-zinc-700 text-[8px]">•</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-text-secondary">{account.type}</span>
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

      <div className="mt-6">
        <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-0.5">Available Capital</label>
        {isEditing ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                className="flex-1 text-xl font-black tracking-tighter bg-white/5 border border-gold/20 rounded-lg px-2.5 py-1.5 outline-none text-white focus:ring-1 focus:ring-gold/30"
                value={balance}
                onChange={e => setBalance(Number(e.target.value))}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
              <select 
                className="bg-zinc-800 text-white text-[8px] font-black uppercase tracking-widest border border-white/10 rounded-lg px-1.5 py-1.5"
                value={location}
                onChange={e => setLocation(e.target.value as any)}
              >
                <option value="UAE">UAE</option>
                <option value="India">India</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSave}
                className="bg-gold text-black px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-transform active:scale-95 shadow-[0_0_10px_rgba(212,175,55,0.2)]"
              >
                Apply
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className={`font-bold text-xs tracking-widest ${displayCurrency !== 'native' ? 'text-zinc-500' : 'text-gold'}`}>
              {displaySymbol}
            </span>
            <p className={`text-2xl font-black tracking-tighter ${displayCurrency !== 'native' ? 'text-zinc-300' : 'text-white'}`}>
              {displayAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState({ type, onClick }: { type: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full border border-dashed border-white/10 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center group bg-white/[0.01] hover:bg-gold/5 hover:border-gold/30 transition-all"
    >
      <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center text-zinc-700 mb-6 group-hover:text-gold group-hover:scale-110 transition-all duration-500">
        <Plus size={32} />
      </div>
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] group-hover:text-zinc-300">No nodes in {type}. Click to add.</p>
    </button>
  );
}
