import React, { useState } from 'react';
import { Transaction, Currency } from '../types';
import { NotebookTabs, User, Flame, ArrowUpRight, ArrowDownLeft, Handshake, AlertCircle, Sparkles, Wand2, Loader2, ShieldCheck, Bell, X, MessageSquare, Mail, Copy, Check, TrendingUp, History, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeLedgerWithAI, generateReminderWithAI } from '../services/geminiService';

interface LedgerProps {
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
}

export default function Ledger({ transactions, onAdd }: LedgerProps) {
  const [activeCurrency, setActiveCurrency] = useState<Currency>('AED');
  const [aiInput, setAiInput] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);

  const [selectedItem, setSelectedItem] = useState<Transaction | null>(null);
  const [reminderData, setReminderData] = useState<{
    whatsapp_message: string;
    email_message: string;
    notification_text: string;
  } | null>(null);
  const [isGeneratingReminder, setIsGeneratingReminder] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const ledgerItems = transactions.filter(t => 
    (t.type === 'lent' || t.type === 'borrowed') && t.currency === activeCurrency
  );

  const totalLent = ledgerItems.filter(t => t.type === 'lent').reduce((acc, t) => acc + t.amount, 0);
  const totalBorrowed = ledgerItems.filter(t => t.type === 'borrowed').reduce((acc, t) => acc + t.amount, 0);

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    setIsAiParsing(true);
    const parsed = await analyzeLedgerWithAI(aiInput);
    if (parsed) {
      onAdd({
        date: new Date().toISOString().split('T')[0],
        amount: parsed.amount,
        currency: parsed.currency,
        category: 'lending',
        description: `${parsed.ledger_type === 'lent' ? 'Lent to' : 'Borrowed from'} ${parsed.person_name}`,
        type: parsed.ledger_type,
        person: parsed.person_name,
        domain: 'personal',
        ai_suggestion: parsed.ai_note
      });
      setAiInput('');
    }
    setIsAiParsing(false);
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
    <div className="space-y-10 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic flex items-center gap-4">
            Trust Protocol <ShieldCheck className="text-gold" size={32} />
          </h1>
          <p className="text-zinc-500 mt-1 max-w-sm">Global counterparty risk and debt reconciliation OS.</p>
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

      {/* AI AI Intelligence Command Center */}
      <section className="card bg-gold/5 border-gold/20 p-8 space-y-6 shadow-[0_30px_60px_-12px_rgba(212,175,55,0.05)]">
        <label className="text-[10px] font-black text-gold uppercase tracking-[0.2em] flex items-center gap-2">
          <Sparkles size={14} /> Agreement Synthesizer
        </label>
        <div className="relative">
          <input 
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="E.g., 'I lent 5000 AED to Sameer for his new luxury fleet startup tranches'"
            className="input-field w-full pr-16 bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-700"
          />
          <button 
            onClick={handleAiParse}
            disabled={isAiParsing}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gold text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
          >
            {isAiParsing ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 font-bold italic px-2 uppercase tracking-tight">
          NBZ Intelligence OS automatically detects counterparties, tranches, and legal intent.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div whileHover={{ y: -5 }} className="card bg-zinc-900 border-gold/10 p-8 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active Receivables</span>
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-emerald-400/60 font-bold text-sm tracking-widest">{activeCurrency}</span>
            <p className="text-5xl font-black tracking-tighter text-white">{totalLent.toLocaleString()}</p>
          </div>
          <p className="text-[10px] items-center gap-1 flex text-zinc-500 mt-4 font-bold uppercase tracking-widest">
            <TrendingUp size={12} /> External Assets
          </p>
        </motion.div>
        
        <motion.div whileHover={{ y: -5 }} className="card bg-zinc-900 border-gold/10 p-8 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Global Payables</span>
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <ArrowDownLeft size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-indigo-400/60 font-bold text-sm tracking-widest">{activeCurrency}</span>
            <p className="text-5xl font-black tracking-tighter text-white">{totalBorrowed.toLocaleString()}</p>
          </div>
          <p className="text-[10px] items-center gap-1 flex text-zinc-500 mt-4 font-bold uppercase tracking-widest">
            <Globe size={12} /> Compliance Required
          </p>
        </motion.div>
      </div>

      <div className="card bg-zinc-900 border-white/5 p-0 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
            <h3 className="font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Handshake size={20} className="text-gold" /> Counterparty Nodes
            </h3>
            <div className="flex items-center gap-2">
                <History size={14} className="text-zinc-600" />
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{ledgerItems.length} Total</span>
            </div>
        </div>
        <div className="divide-y divide-white/5">
          {ledgerItems.map(item => (
            <div key={item.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/[0.02] transition-all group">
              <div className="flex items-center gap-6 mb-4 md:mb-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${
                    item.type === 'lent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                }`}>
                  <User size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-black text-white text-xl tracking-tight">{item.person || 'Anonymous Entity'}</p>
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${
                        item.domain === 'business' ? 'bg-gold/10 text-gold border-gold/20' : 'bg-white/5 text-zinc-500 border-white/10'
                    }`}>
                        {item.domain}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed max-w-md">{item.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                        <History size={10} /> {item.date}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 self-end md:self-center">
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-2">
                    <span className={`text-xs font-bold ${item.type === 'lent' ? 'text-emerald-500' : 'text-indigo-400'}`}>{item.currency}</span>
                    <p className={`text-3xl font-black tracking-tighter ${
                        item.type === 'lent' ? 'text-emerald-400' : 'text-indigo-400'
                    }`}>
                        {item.type === 'lent' ? '+' : '-'}{item.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end mt-1 text-zinc-600">
                      <AlertCircle size={12} className={item.type === 'lent' ? 'text-emerald-400/50' : 'text-indigo-400/50'} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Protocol Settlement: 14D</span>
                  </div>
                </div>
                {item.type === 'lent' && (
                  <button 
                    onClick={() => handleGenerateReminder(item)}
                    className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-gold hover:border-gold/30 hover:bg-gold/5 border border-white/5 transition-all group/btn shadow-xl"
                    title="Generate AI Reminder"
                  >
                    <Bell size={20} className="group-hover/btn:animate-swing" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {ledgerItems.length === 0 && (
            <div className="py-32 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 text-zinc-800">
                <NotebookTabs size={32} />
              </div>
              <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest italic">Negative tranches in {activeCurrency} zone.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="card w-full max-w-2xl bg-zinc-900 border-gold/20 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] relative p-0 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
              
              <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/10 text-gold rounded-2xl flex items-center justify-center border border-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-white tracking-tight uppercase">AI Nudge Engine</h3>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Tranche Reconciliation for {selectedItem.person}</p>
                  </div>
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
                    <div className="relative">
                      <div className="w-16 h-16 border-2 border-gold/10 border-t-gold rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Wand2 size={24} className="text-gold animate-pulse" />
                      </div>
                    </div>
                    <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Gemini tranches are processing luxury linguistics...</p>
                  </div>
                ) : reminderData ? (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <MessageSquare size={14} className="text-[#25D366]" /> Tactical WhatsApp
                        </span>
                        <button 
                          onClick={() => copyToClipboard(reminderData.whatsapp_message, 'wa')}
                          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            copiedField === 'wa' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {copiedField === 'wa' ? <Check size={12} /> : <Copy size={12} />}
                          {copiedField === 'wa' ? 'Secured' : 'Access Data'}
                        </button>
                      </div>
                      <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 text-sm font-medium text-zinc-300 leading-relaxed italic relative">
                        <div className="absolute top-0 right-0 p-3 opacity-5">
                          <MessageSquare size={40} />
                        </div>
                        "{reminderData.whatsapp_message}"
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Mail size={14} className="text-indigo-400" /> Formal Protocol (Email)
                        </span>
                        <button 
                          onClick={() => copyToClipboard(reminderData.email_message, 'email')}
                          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            copiedField === 'email' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {copiedField === 'email' ? <Check size={12} /> : <Copy size={12} />}
                          {copiedField === 'email' ? 'Secured' : 'Access Data'}
                        </button>
                      </div>
                      <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 text-sm font-medium text-zinc-300 leading-relaxed italic relative">
                        <div className="absolute top-0 right-0 p-3 opacity-5">
                          <Mail size={40} />
                        </div>
                        "{reminderData.email_message}"
                      </div>
                    </div>

                    <div className="p-6 bg-gold/5 rounded-2xl border border-gold/20 flex items-start gap-4">
                      <div className="w-8 h-8 bg-gold/20 rounded-lg flex items-center justify-center text-gold shrink-0">
                        <AlertCircle size={18} />
                      </div>
                      <p className="text-[10px] text-gold font-bold leading-relaxed uppercase tracking-tight">
                        <strong>AI Strategic Insight:</strong> Linguistic tranches are optimized for high-net-worth tranches. Soft landing, hard commitment for {selectedItem.currency} {selectedItem.amount}.
                      </p>
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
