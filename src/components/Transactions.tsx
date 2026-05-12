import React, { useState } from 'react';
import { Transaction, Currency, FinType, Domain } from '../types';
import { Plus, Search, Receipt, Briefcase, User, Repeat, ArrowUpRight, ArrowDownLeft, Sparkles, Wand2, Camera, FileUp, Loader2, Filter, Calendar, Edit3, Trash2, X, Globe, ArrowRight, Clock, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parseTransactionWithAI } from '../services/geminiService';
import { fetchLiveRates, DEFAULT_AED_TO_INR, ExchangeRates } from '../services/currencyService';
import Scanner from './Scanner';

interface TransactionsProps {
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}

const PREDEFINED_CATEGORIES = [
  'shopping', 'food', 'dining', 'travel', 'bills', 'health', 'investment', 'business', 'leisure', 'lending', 'salary', 'other'
];

export default function Transactions({ transactions, onAdd, onUpdate, onDelete }: TransactionsProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [fxRates, setFxRates] = useState<ExchangeRates | null>(null);

  React.useEffect(() => {
    fetchLiveRates().then(rates => {
      if (rates) setFxRates(rates);
    });
  }, []);

  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [isEditingNewCategory, setIsEditingNewCategory] = useState(false);

  const allCategories = React.useMemo(() => {
    const historical = transactions.map(t => t.category.toLowerCase());
    const base = PREDEFINED_CATEGORIES.filter(c => c !== 'other');
    const unique = Array.from(new Set([...base, ...historical])).filter(Boolean);
    return unique.sort();
  }, [transactions]);

  const [newTx, setNewTx] = useState<Omit<Transaction, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    currency: 'AED',
    category: 'shopping',
    description: '',
    type: 'expense',
    domain: 'personal',
    status: 'pending'
  });

  const handleScanComplete = (scannedTx: Partial<Transaction>) => {
    setNewTx(prev => ({
      ...prev,
      ...scannedTx,
      date: scannedTx.date ? scannedTx.date.split('T')[0] : prev.date
    }));
    setShowScanner(false);
    setShowAdd(true);
  };

  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.merchant && t.merchant.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    setIsAiParsing(true);
    const parsed = await parseTransactionWithAI(aiInput);
    if (parsed) {
      setNewTx(prev => ({ ...prev, ...parsed }));
      setAiInput('');
    }
    setIsAiParsing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTx.amount <= 0 || !newTx.description) return;
    onAdd(newTx);
    setShowAdd(false);
    setIsAddingNewCategory(false);
    setNewTx({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      currency: 'AED',
      category: 'shopping',
      description: '',
      type: 'expense',
      domain: 'personal',
      status: 'pending'
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || editingTx.amount <= 0 || !editingTx.description) return;
    onUpdate(editingTx.id, editingTx);
    setShowEditModal(false);
    setEditingTx(null);
    setIsEditingNewCategory(false);
  };

  const getTypeIcon = (type: FinType) => {
    switch (type) {
      case 'income': return <ArrowDownLeft size={18} />;
      case 'expense': return <ArrowUpRight size={18} />;
      case 'lent': return <Repeat size={18} />;
      case 'borrowed': return <Repeat size={18} />;
      case 'transfer': return <Globe size={18} />;
      case 'emi': return <Clock size={18} />;
      case 'gold_loan': return <Coins size={18} />;
    }
  };

  const getRemittancePreview = () => {
    if (newTx.type !== 'transfer' || !newTx.amount) return null;
    const rate = fxRates?.['INR'] || DEFAULT_AED_TO_INR;
    if (newTx.currency === 'AED') {
      return (
        <div className="mt-4 p-4 bg-gold/5 border border-gold/20 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gold uppercase tracking-widest">Remittance Tranche</p>
            <p className="text-sm font-bold text-white flex items-center gap-2">
              {newTx.amount.toLocaleString()} AED <ArrowRight size={14} className="text-gold" /> {(newTx.amount * rate).toLocaleString()} INR
            </p>
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase">Rate: {rate.toFixed(4)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-text-primary uppercase italic">Capital Ledger</h1>
          <p className="text-text-secondary text-[10px] mt-0.5 max-w-sm">Immutable recording of cross-border financial tranches.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowScanner(true)}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:border-gold/30 transition-all"
            title="AI Scan Receipt"
          >
            <Camera size={20} />
          </button>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="btn-primary flex items-center gap-3 transition-all"
          >
            <Plus size={18} />
            <span>Record Flow</span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showScanner && (
          <Scanner 
            onScanComplete={handleScanComplete}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="card mb-12 bg-gold/5 border-gold/20 p-8 flex flex-col gap-8 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gold uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sparkles size={14} /> Intelligence Inflow
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="E.g., 'Paid 500 AED for business tranches today'"
                    className="input-field w-full pr-16 bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 focus:border-gold/50"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isAiParsing ? (
                      <Loader2 className="animate-spin text-gold" size={20} />
                    ) : (
                      <button 
                        onClick={handleAiParse}
                        className="w-10 h-10 bg-gold text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                      >
                        <Wand2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Descriptor</label>
                  <input 
                    type="text" 
                    placeholder="Merchant or Purpose" 
                    className="input-field w-full"
                    value={newTx.description}
                    onChange={e => setNewTx({...newTx, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tranche size</label>
                  <div className="flex gap-2">
                    <select 
                      className="input-field w-24 px-2"
                      value={newTx.currency}
                      onChange={e => setNewTx({...newTx, currency: e.target.value as any})}
                    >
                      <option value="AED">AED</option>
                      <option value="INR">INR</option>
                    </select>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      className="input-field flex-1"
                      value={newTx.amount || ''}
                      onChange={e => setNewTx({...newTx, amount: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Financial Zone</label>
                  <select 
                    className="input-field w-full"
                    value={newTx.domain}
                    onChange={e => setNewTx({...newTx, domain: e.target.value as any})}
                  >
                    <option value="personal">Personal</option>
                    <option value="business">Business tranches</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Flow Intent</label>
                  <select 
                    className="input-field w-full"
                    value={newTx.type}
                    onChange={e => setNewTx({...newTx, type: e.target.value as any})}
                  >
                    <option value="expense">Outflow</option>
                    <option value="income">Inflow</option>
                    <option value="transfer">Remittance / Transfer</option>
                    <option value="lent">Lent Assets</option>
                    <option value="borrowed">Borrowed Capital</option>
                    <option value="emi">EMI Installment</option>
                    <option value="gold_loan">Gold Loan</option>
                  </select>
                </div>
                
                <div className="md:col-span-1 space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</label>
                  <select 
                    className="input-field w-full"
                    value={newTx.status || 'pending'}
                    onChange={e => setNewTx({...newTx, status: e.target.value as any})}
                  >
                    <option value="pending">Pending</option>
                    <option value="settled">Settled</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                <div className="md:col-span-3 space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Counterparty</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                    <input 
                      type="text" 
                      placeholder={newTx.type === 'lent' || newTx.type === 'borrowed' ? "Person name..." : "Merchant or Entity name"}
                      className="input-field w-full pl-10"
                      value={newTx.merchant || newTx.person || ''}
                      onChange={e => setNewTx({...newTx, merchant: e.target.value, person: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sector / Category</label>
                  {!isAddingNewCategory ? (
                    <select 
                      className="input-field w-full"
                      value={newTx.category}
                      onChange={e => {
                        if (e.target.value === 'ADD_NEW') {
                          setIsAddingNewCategory(true);
                          setNewTx({...newTx, category: ''});
                        } else {
                          setNewTx({...newTx, category: e.target.value});
                        }
                      }}
                    >
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                      <option value="ADD_NEW" className="text-gold font-bold">+ Add New Category</option>
                    </select>
                  ) : (
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="New category..." 
                        className="input-field w-full pr-10"
                        value={newTx.category}
                        onChange={e => setNewTx({...newTx, category: e.target.value})}
                        autoFocus
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          setIsAddingNewCategory(false);
                          setNewTx({...newTx, category: 'shopping'});
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="md:col-span-1 pt-6 text-right">
                  <button type="submit" className="btn-primary w-full shadow-[0_15px_30px_-5px_rgba(212,175,55,0.3)]">
                    Commit to Ledger
                  </button>
                </div>
                
                <div className="md:col-span-4">
                  {getRemittancePreview()}
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card bg-bg-card border-border-card p-0 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input 
              type="text" 
              placeholder="Filter tranches, entities, zones..." 
              className="input-field w-full pl-12 bg-white/5 border-white/5 text-text-primary placeholder:text-text-secondary focus:border-gold/30"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors">
              <Filter size={14} /> Filter Set
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors">
              <Calendar size={14} /> Period
            </button>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {filtered.map((t) => (
            <motion.div 
              key={t.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative flex items-center justify-between p-4.5 hover:bg-white/[0.02] transition-colors group overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                t.type === 'income' ? 'bg-emerald-500' : 
                t.type === 'expense' ? 'bg-rose-500' :
                t.type === 'borrowed' ? 'bg-indigo-500' :
                t.type === 'transfer' ? 'bg-gold' :
                t.type === 'emi' ? 'bg-orange-500' :
                t.type === 'gold_loan' ? 'bg-gold' :
                'bg-zinc-500'
              } opacity-50`} />

              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  t.type === 'expense' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                  t.type === 'borrowed' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                  t.type === 'transfer' ? 'bg-gold/10 text-gold border border-gold/20' :
                  t.type === 'emi' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                  t.type === 'gold_loan' ? 'bg-gold/10 text-gold border border-gold/20' :
                  'bg-white/5 text-zinc-500 border border-white/10'
                }`}>
                  {getTypeIcon(t.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {(t.type === 'lent' || t.type === 'borrowed') && (t.person || t.merchant) ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gold uppercase tracking-widest bg-gold/5 px-2 py-0.5 rounded border border-gold/10">
                          {t.type === 'lent' ? 'To' : 'From'}
                        </span>
                        <p className="font-black text-text-primary text-base tracking-tight italic">{t.person || t.merchant}</p>
                        <span className="text-zinc-600 font-medium text-xs">—</span>
                        <p className="font-bold text-text-secondary text-sm tracking-tight">{t.description}</p>
                      </div>
                    ) : (
                      <p className="font-bold text-text-primary text-base tracking-tight">{t.description}</p>
                    )}
                    <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full font-black border ${
                      t.domain === 'business' 
                      ? 'bg-gold/10 text-gold border-gold/20' 
                      : 'bg-white/5 text-text-secondary border-white/10'
                    }`}>
                      {t.domain}
                    </span>
                    {t.status && (
                      <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full font-black border ${
                        t.status === 'settled' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        t.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {t.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-tighter capitalize">{t.category}</p>
                    <span className="text-border-card">•</span>
                    <p className="text-[10px] text-text-secondary font-medium">{t.date}</p>
                    {(t.merchant || t.person) && t.type !== 'lent' && t.type !== 'borrowed' && (
                      <>
                        <span className="text-border-card">•</span>
                        <p className="text-[10px] text-text-secondary font-semibold truncate max-w-[150px]">{t.merchant || t.person}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-baseline justify-end gap-1.5">
                    <span className="text-[9px] font-bold text-zinc-500">{t.currency}</span>
                    <p className={`text-xl font-black tracking-tighter ${
                      t.type === 'income' ? 'text-emerald-400' : 
                      t.type === 'expense' ? 'text-rose-400' :
                      t.type === 'borrowed' ? 'text-indigo-400' :
                      t.type === 'transfer' ? 'text-gold' :
                      'text-white'
                    }`}>
                      {t.type === 'expense' || t.type === 'emi' || t.type === 'gold_loan' ? '-' : (t.type === 'income' ? '+' : '')}
                      {t.amount.toLocaleString()}
                    </p>
                  </div>
                  {t.type === 'transfer' && t.currency === 'AED' && (
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">
                      ≈ {(t.amount * (fxRates?.['INR'] || 22.85)).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </p>
                  )}
                  {t.ai_suggestion && (
                    <div className="flex items-center gap-1 justify-end text-gold/60">
                      <Sparkles size={10} />
                      <p className="text-[10px] font-bold italic max-w-[120px] truncate uppercase tracking-tighter">
                        {t.ai_suggestion}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => {
                      setEditingTx(t);
                      setShowEditModal(true);
                    }}
                    className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-gold transition-colors"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(t.id)}
                    className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="py-32 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-800">
                <Receipt size={32} />
              </div>
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest italic">Negative intel in this sector sector.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showEditModal && editingTx && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="card w-full max-w-2xl bg-bg-card border-gold/20 shadow-2xl relative p-0 overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <h3 className="font-black text-xl text-text-primary tracking-tight uppercase">Update Transaction</h3>
                <button 
                  onClick={() => { setShowEditModal(false); setEditingTx(null); }}
                  className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Descriptor</label>
                    <input 
                      type="text" 
                      className="input-field w-full"
                      value={editingTx.description}
                      onChange={e => setEditingTx({...editingTx, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Date</label>
                    <input 
                      type="date" 
                      className="input-field w-full"
                      value={editingTx.date}
                    onChange={e => setEditingTx({...editingTx, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Amount</label>
                    <div className="flex gap-2">
                      <select 
                        className="input-field w-24 px-2"
                        value={editingTx.currency}
                        onChange={e => setEditingTx({...editingTx, currency: e.target.value as any})}
                      >
                        <option value="AED">AED</option>
                        <option value="INR">INR</option>
                      </select>
                      <input 
                        type="number" 
                        className="input-field flex-1"
                        value={editingTx.amount}
                        onChange={e => setEditingTx({...editingTx, amount: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Financial Zone</label>
                    <select 
                      className="input-field w-full"
                      value={editingTx.domain}
                      onChange={e => setEditingTx({...editingTx, domain: e.target.value as any})}
                    >
                      <option value="personal">Personal</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Flow Intent</label>
                    <select 
                      className="input-field w-full"
                      value={editingTx.type}
                      onChange={e => setEditingTx({...editingTx, type: e.target.value as any})}
                    >
                      <option value="expense">Outflow</option>
                      <option value="income">Inflow</option>
                      <option value="transfer">Remittance / Transfer</option>
                      <option value="lent">Lent Assets</option>
                      <option value="borrowed">Borrowed Capital</option>
                      <option value="emi">EMI Installment</option>
                      <option value="gold_loan">Gold Loan</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</label>
                    <select 
                      className="input-field w-full"
                      value={editingTx.status || 'pending'}
                      onChange={e => setEditingTx({...editingTx, status: e.target.value as any})}
                    >
                      <option value="pending">Pending</option>
                      <option value="settled">Settled</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Counterparty</label>
                    <input 
                      type="text" 
                      className="input-field w-full"
                      placeholder="Person or Merchant name"
                      value={editingTx.merchant || editingTx.person || ''}
                      onChange={e => setEditingTx({...editingTx, merchant: e.target.value, person: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Category</label>
                    {!isEditingNewCategory ? (
                      <select 
                        className="input-field w-full"
                        value={editingTx.category}
                        onChange={e => {
                          if (e.target.value === 'ADD_NEW') {
                            setIsEditingNewCategory(true);
                            setEditingTx({...editingTx, category: ''});
                          } else {
                            setEditingTx({...editingTx, category: e.target.value});
                          }
                        }}
                      >
                        {allCategories.map(cat => (
                          <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                        ))}
                        <option value="ADD_NEW" className="text-gold font-bold">+ Add New Category</option>
                      </select>
                    ) : (
                      <div className="relative">
                        <input 
                          type="text" 
                          className="input-field w-full pr-10"
                          value={editingTx.category}
                          onChange={e => setEditingTx({...editingTx, category: e.target.value})}
                          autoFocus
                        />
                        <button 
                          type="button"
                          onClick={() => setIsEditingNewCategory(false)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
                  <button 
                    type="button" 
                    onClick={() => { setShowEditModal(false); setEditingTx(null); }}
                    className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                  >
                    Discard
                  </button>
                  <button type="submit" className="btn-primary">
                    Apply Updates
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
