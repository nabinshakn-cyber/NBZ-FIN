import React, { useState } from 'react';
import { Transaction, Currency } from '../types';
import { NotebookTabs, User, Handshake, ArrowUpRight, ArrowDownLeft, Sparkles, Wand2, Loader2, ShieldCheck, Bell, X, MessageSquare, Mail, Copy, Check, TrendingUp, History, Globe, UserPlus, Phone, CheckCircle2, Clock, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeLedgerWithAI, generateReminderWithAI } from '../services/geminiService';
import { useNotifications } from './NotificationCenter';

interface LedgerProps {
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
}

export default function Ledger({ transactions, onAdd, onUpdate }: LedgerProps) {
  const [activeCurrency, setActiveCurrency] = useState<Currency>('AED');
  const [aiInput, setAiInput] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const { addNotification } = useNotifications();

  const [selectedItem, setSelectedItem] = useState<Transaction | null>(null);
  const [reminderData, setReminderData] = useState<{
    whatsapp_message: string;
    email_message: string;
    notification_text: string;
  } | null>(null);
  const [isGeneratingReminder, setIsGeneratingReminder] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'personal' | 'formal'>('personal');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualData, setManualData] = useState({
    amount: '',
    person: '',
    type: 'lent' as any,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.amount || !manualData.person) return;
    
    const amount = parseFloat(manualData.amount);
    onAdd({
      ...manualData,
      amount,
      currency: activeCurrency,
      category: manualData.type === 'emi' || manualData.type === 'gold_loan' ? 'debt' : 'lending',
      domain: 'personal',
      status: 'pending'
    });

    addNotification({
      title: 'Entry Created',
      message: `Manual entry for ${manualData.person} added successfully.`,
      type: 'success'
    });

    setManualData({
      amount: '',
      person: '',
      type: 'lent',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowManualForm(false);
  };
  
  const ledgerItems = transactions.filter(t => 
    (activeTab === 'personal' ? (t.type === 'lent' || t.type === 'borrowed') : (t.type === 'emi' || t.type === 'gold_loan')) && 
    t.currency === activeCurrency
  );

  const totalLent = transactions.filter(t => t.type === 'lent' && t.status !== 'settled' && t.currency === activeCurrency).reduce((acc, t) => acc + t.amount, 0);
  const totalBorrowed = transactions.filter(t => t.type === 'borrowed' && t.status !== 'settled' && t.currency === activeCurrency).reduce((acc, t) => acc + t.amount, 0);
  const totalFormalDebt = transactions.filter(t => (t.type === 'emi' || t.type === 'gold_loan') && t.status !== 'settled' && t.currency === activeCurrency).reduce((acc, t) => acc + t.amount, 0);

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    setIsAiParsing(true);
    const parsed = await analyzeLedgerWithAI(aiInput);
    if (parsed) {
      onAdd({
        date: new Date().toISOString().split('T')[0],
        amount: parsed.amount,
        currency: parsed.currency,
        category: parsed.ledger_type === 'emi' || parsed.ledger_type === 'gold_loan' ? 'debt' : 'lending',
        description: parsed.ai_note || `${parsed.ledger_type} with ${parsed.person_name}`,
        type: parsed.ledger_type,
        person: parsed.person_name,
        domain: 'personal',
        status: 'pending',
        ai_suggestion: parsed.ai_note
      });
      setAiInput('');
      const typeLabel = parsed.ledger_type === 'emi' ? 'EMI' : parsed.ledger_type === 'gold_loan' ? 'Gold Loan' : 'Loan';
      addNotification({
        title: `New ${typeLabel} Added`,
        message: `Added ${parsed.amount} ${parsed.currency} ${parsed.ledger_type} with ${parsed.person_name}`,
        type: 'success'
      });
      if (parsed.ledger_type === 'emi' || parsed.ledger_type === 'gold_loan') {
        setActiveTab('formal');
      } else {
        setActiveTab('personal');
      }
    }
    setIsAiParsing(false);
  };

  const handleInform = (item: Transaction) => {
    addNotification({
      title: 'Reminder Sent',
      message: `Automatically informed ${item.person} about their pending payment.`,
      type: 'reminder'
    });
    // In a real app, this would trigger an API call to Twilio or SendGrid
  };

  const toggleStatus = (item: Transaction) => {
    const newStatus = item.status === 'settled' ? 'pending' : 'settled';
    onUpdate(item.id, { status: newStatus });
    addNotification({
      title: 'Loan Updated',
      message: `${item.person}'s loan is now marked as ${newStatus}`,
      type: 'info'
    });
  };

  const handleGenerateReminder = async (item: Transaction) => {
    setSelectedItem(item);
    setIsGeneratingReminder(true);
    const data = await generateReminderWithAI(
      item.person || 'Friend',
      item.amount,
      item.currency,
      item.date
    );
    setReminderData(data);
    setIsGeneratingReminder(false);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-text-primary uppercase italic flex items-center gap-3">
            Loans & Friends <Handshake className="text-gold" size={24} />
          </h1>
          <p className="text-text-secondary text-[10px] mt-0.5 max-w-sm font-medium">Keep track of money you give or take from others.</p>
        </div>
        <div className="bg-white/5 p-1.5 rounded-2xl flex items-center border border-white/5">
            {(['AED', 'INR'] as Currency[]).map(c => (
              <button
                key={c}
                onClick={() => setActiveCurrency(c)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeCurrency === c ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
        </div>
      </header>

      <div className="flex gap-4 border-b border-white/5 pb-1">
        <button 
          onClick={() => setActiveTab('personal')}
          className={`pb-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
            activeTab === 'personal' ? 'text-gold' : 'text-zinc-500 hover:text-white'
          }`}
        >
          Personal Loans
          {activeTab === 'personal' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
        </button>
        <button 
          onClick={() => setActiveTab('formal')}
          className={`pb-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
            activeTab === 'formal' ? 'text-gold' : 'text-zinc-500 hover:text-white'
          }`}
        >
          EMI & Gold Loans
          {activeTab === 'formal' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
        </button>
      </div>

      {/* Entry Toggle & Forms */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowManualForm(false)}
            className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl transition-all ${
              !showManualForm ? 'bg-gold text-black shadow-lg' : 'text-zinc-500 hover:text-white'
            }`}
          >
            AI Command
          </button>
          <button 
            onClick={() => setShowManualForm(true)}
            className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl transition-all ${
              showManualForm ? 'bg-gold text-black shadow-lg' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Manual Entry
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!showManualForm ? (
            <motion.section 
              key="ai-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card bg-gold/5 border-gold/20 p-8 space-y-6"
            >
              <label className="text-[10px] font-black text-gold uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles size={14} /> Quick Add Loan
              </label>
              <div className="relative">
                <input 
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="E.g., 'I lent 500 AED to John for dinner'"
                  className="input-field w-full pr-16 bg-white/[0.03] border-white/10"
                />
                <button 
                  onClick={handleAiParse}
                  disabled={isAiParsing}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gold text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-lg"
                >
                  {isAiParsing ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                </button>
              </div>
            </motion.section>
          ) : (
            <motion.section 
              key="manual-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card bg-white/[0.02] border-white/5 p-8"
            >
              <form onSubmit={handleManualAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Counterparty</label>
                  <input 
                    required
                    type="text"
                    value={manualData.person}
                    onChange={e => setManualData({...manualData, person: e.target.value})}
                    placeholder="Name / Entity"
                    className="input-field w-full bg-white/[0.02]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Amount ({activeCurrency})</label>
                  <input 
                    required
                    type="number"
                    value={manualData.amount}
                    onChange={e => setManualData({...manualData, amount: e.target.value})}
                    placeholder="0.00"
                    className="input-field w-full bg-white/[0.02]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Classification</label>
                  <select 
                    value={manualData.type}
                    onChange={e => setManualData({...manualData, type: e.target.value as any})}
                    className="input-field w-full bg-white/[0.02]"
                  >
                    <option value="lent">I Lent Money</option>
                    <option value="borrowed">I Borrowed Money</option>
                    <option value="emi">EMI Installment</option>
                    <option value="gold_loan">Gold Loan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Description</label>
                  <input 
                    type="text"
                    value={manualData.description}
                    onChange={e => setManualData({...manualData, description: e.target.value})}
                    placeholder="What is this for?"
                    className="input-field w-full bg-white/[0.02]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Date</label>
                  <input 
                    type="date"
                    value={manualData.date}
                    onChange={e => setManualData({...manualData, date: e.target.value})}
                    className="input-field w-full bg-white/[0.02]"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    type="submit"
                    className="w-full h-[46px] bg-gold text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                  >
                    Authorize Entry
                  </button>
                </div>
              </form>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'personal' ? (
          <>
            <motion.div whileHover={{ y: -5 }} className="card bg-bg-card border-border-card p-6 group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Money I Lent</span>
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <ArrowUpRight size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-emerald-400/60 font-bold text-xs tracking-widest">{activeCurrency}</span>
                <p className="text-4xl font-black tracking-tighter text-text-primary">{totalLent.toLocaleString()}</p>
              </div>
              <p className="text-[9px] items-center gap-1 flex text-zinc-500 mt-3 font-bold uppercase tracking-widest">
                <UserPlus size={10} /> People owe me
              </p>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="card bg-bg-card border-border-card p-6 group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Money I Owe</span>
                <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <ArrowDownLeft size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-indigo-400/60 font-bold text-xs tracking-widest">{activeCurrency}</span>
                <p className="text-4xl font-black tracking-tighter text-text-primary">{totalBorrowed.toLocaleString()}</p>
              </div>
              <p className="text-[9px] items-center gap-1 flex text-zinc-500 mt-3 font-bold uppercase tracking-widest">
                <Globe size={10} /> I owe people
              </p>
            </motion.div>
          </>
        ) : (
          <motion.div whileHover={{ y: -5 }} className="card bg-bg-card border-border-card p-6 group md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-black text-gold uppercase tracking-widest">Total Formal Debt</span>
              <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center text-gold border border-gold/20">
                  <ShieldCheck size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-gold/60 font-bold text-xs tracking-widest">{activeCurrency}</span>
              <p className="text-4xl font-black tracking-tighter text-text-primary">{totalFormalDebt.toLocaleString()}</p>
            </div>
            <p className="text-[9px] items-center gap-1 flex text-zinc-500 mt-3 font-bold uppercase tracking-widest">
              <TrendingUp size={10} /> Institutional liability
            </p>
          </motion.div>
        )}
      </div>

      <div className="card bg-zinc-900 border-white/5 p-0 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
            <h3 className="font-black text-text-primary uppercase tracking-tight flex items-center gap-3">
                <History size={20} className="text-gold" /> Loan History
            </h3>
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{ledgerItems.length} Records</span>
        </div>
        <div className="divide-y divide-white/5">
          {ledgerItems.map(item => (
            <div key={item.id} className={`p-6 flex flex-col md:flex-row md:items-center justify-between transition-all group ${item.status === 'settled' ? 'opacity-50' : 'hover:bg-white/[0.02]'}`}>
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg ${
                    item.type === 'lent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    item.type === 'emi' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    item.type === 'gold_loan' ? 'bg-gold/10 text-gold border-gold/20' :
                    'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                }`}>
                  {item.type === 'emi' ? <Clock size={20} /> : 
                   item.type === 'gold_loan' ? <Coins size={20} /> : 
                   <User size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-text-primary text-lg tracking-tight">{item.person || 'Anonymous'}</p>
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${
                        item.type === 'emi' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                        item.type === 'gold_loan' ? 'bg-gold/10 text-gold border-gold/20' :
                        item.domain === 'business' ? 'bg-gold/10 text-gold border-gold/20' : 'bg-white/5 text-zinc-500 border-white/10'
                    }`}>
                        {item.type === 'emi' ? 'EMI Tranche' : item.type === 'gold_loan' ? 'Pledged Assets' : item.domain}
                    </span>
                    {item.status === 'settled' && (
                      <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-500/20">Settled</span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary font-medium mt-1 leading-relaxed max-w-sm">{item.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                        <History size={10} /> {item.date}
                    </span>
                    {item.contact_info && (
                      <span className="text-[9px] font-black text-gold uppercase tracking-widest flex items-center gap-1">
                        <Phone size={10} /> {item.contact_info}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-2">
                    <span className={`text-xs font-bold ${
                      item.type === 'lent' ? 'text-emerald-500' : 
                      item.type === 'emi' ? 'text-orange-500' :
                      item.type === 'gold_loan' ? 'text-gold' :
                      'text-indigo-400'
                    }`}>{item.currency}</span>
                    <p className={`text-3xl font-black tracking-tighter ${
                        item.type === 'lent' ? 'text-emerald-400' : 
                        item.type === 'emi' ? 'text-orange-400' :
                        item.type === 'gold_loan' ? 'text-gold' :
                        'text-indigo-400'
                    }`}>
                        {item.type === 'lent' ? '+' : '-'}{item.amount.toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => toggleStatus(item)}
                    className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 transition-all flex items-center gap-2 justify-end ml-auto ${
                      item.status === 'settled' ? 'text-emerald-500' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {item.status === 'settled' ? <CheckCircle2 size={12} /> : null}
                    {item.status === 'settled' ? 'Settled' : 'Mark as Settled'}
                  </button>
                </div>

                <div className="flex gap-2">
                  {item.type === 'lent' && item.status !== 'settled' && (
                    <>
                      <button 
                        onClick={() => handleInform(item)}
                        className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-gold hover:border-gold/30 hover:bg-gold/5 border border-white/5 transition-all shadow-xl"
                        title="Automatically Inform"
                      >
                        <Bell size={20} />
                      </button>
                      <button 
                        onClick={() => handleGenerateReminder(item)}
                        className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-indigo-400 hover:border-indigo-400/30 hover:bg-indigo-400/5 border border-white/5 transition-all shadow-xl"
                        title="AI Reminder Options"
                      >
                        <MessageSquare size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {ledgerItems.length === 0 && (
            <div className="py-32 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 text-zinc-800">
                <NotebookTabs size={32} />
              </div>
              <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest italic">No active loans in {activeCurrency} zone.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-2xl bg-zinc-900 border-gold/20 p-0 overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div>
                  <h3 className="font-black text-xl text-text-primary tracking-tight uppercase italic">Remind {selectedItem.person}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Select communication channel</p>
                </div>
                <button 
                  onClick={() => { setSelectedItem(null); setReminderData(null); }}
                  className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                {isGeneratingReminder ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-6">
                    <Loader2 size={40} className="text-gold animate-spin" />
                    <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em]">AI is writing your messages...</p>
                  </div>
                ) : reminderData ? (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <MessageSquare size={14} className="text-[#25D366]" /> WhatsApp Format
                        </span>
                        <button 
                          onClick={() => copyToClipboard(reminderData.whatsapp_message, 'wa')}
                          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            copiedField === 'wa' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {copiedField === 'wa' ? <Check size={12} /> : <Copy size={12} />}
                          {copiedField === 'wa' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 text-sm font-medium text-zinc-300 leading-relaxed italic">
                        "{reminderData.whatsapp_message}"
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Mail size={14} className="text-indigo-400" /> Formal Email
                        </span>
                        <button 
                          onClick={() => copyToClipboard(reminderData.email_message, 'email')}
                          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            copiedField === 'email' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {copiedField === 'email' ? <Check size={12} /> : <Copy size={12} />}
                          {copiedField === 'email' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 text-sm font-medium text-zinc-300 leading-relaxed italic">
                        "{reminderData.email_message}"
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
