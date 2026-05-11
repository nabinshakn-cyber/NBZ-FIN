import React, { useState } from 'react';
import { PiggyBank, Target, Calendar, Wallet, Sparkles, Loader2, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateSavingsPlanWithAI } from '../services/geminiService';
import { Currency } from '../types';

interface SavingsProps {
  goals: any[];
  onAddGoal: (goal: any) => Promise<void>;
}

export default function Savings({ goals, onAddGoal }: SavingsProps) {
  const [goalName, setGoalName] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [income, setIncome] = useState('');
  const [currency, setCurrency] = useState<Currency>('AED');
  
  const [isPlanning, setIsPlanning] = useState(false);
  const [plan, setPlan] = useState<any | null>(null);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !deadline || !income) return;

    setIsPlanning(true);
    const data = await generateSavingsPlanWithAI(
      Number(amount),
      deadline,
      Number(income),
      currency
    );
    setPlan(data);
    setIsPlanning(false);

    // Persist goal
    await onAddGoal({
      name: goalName,
      target_amount: Number(amount),
      currency,
      deadline,
      status: 'active'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          Savings Strategist <PiggyBank className="text-emerald-600" size={28} />
        </h1>
        <p className="text-zinc-500 mt-1">Deploy AI to engineer a realistic path to your financial milestones.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <form onSubmit={handleGeneratePlan} className="card space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Goal Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Dubai Apartment Deposit"
                  className="input-field w-full"
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Target Amount</label>
                  <input 
                    type="number" 
                    placeholder="50000"
                    className="input-field w-full"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Currency</label>
                  <select 
                    className="input-field w-full"
                    value={currency}
                    onChange={e => setCurrency(e.target.value as Currency)}
                  >
                    <option value="AED">AED</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Deadline</label>
                <input 
                  type="date" 
                  className="input-field w-full"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Monthly Income</label>
                <input 
                  type="number" 
                  placeholder="20000"
                  className="input-field w-full"
                  value={income}
                  onChange={e => setIncome(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isPlanning || !amount || !deadline}
              className="btn-primary w-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 h-12 shadow-lg shadow-emerald-50"
            >
              {isPlanning ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              <span>Generate Savings Blueprint</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!plan && !isPlanning ? (
                <div className="card h-full border-dashed border-2 border-zinc-200 flex flex-col items-center justify-center text-center p-12 overflow-y-auto">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300 mb-4">
                    <Target size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-400">Goals in Orbit</h3>
                  <div className="mt-4 w-full space-y-3">
                    {goals.map(g => (
                      <div key={g.id} className="p-4 bg-white border border-zinc-100 rounded-xl text-left flex justify-between items-center group">
                        <div>
                          <p className="font-bold text-zinc-800">{g.name}</p>
                          <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{g.currency} {Number(g.target_amount).toLocaleString()} • {g.deadline}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                    ))}
                    {goals.length === 0 && (
                      <p className="text-xs text-zinc-400 mt-2 max-w-xs mx-auto">
                        Define your goal to receive a professional AI savings strategy.
                      </p>
                    )}
                  </div>
                </div>
            ) : isPlanning ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card h-full flex flex-col items-center justify-center p-12 space-y-4"
              >
                <div className="relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 border-4 border-emerald-50 border-t-emerald-500 rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-emerald-500">
                    <Sparkles size={24} />
                  </div>
                </div>
                <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs animate-pulse">Gemini Calculating Trajectories...</p>
              </motion.div>
            ) : (
              <motion.div 
                key="plan"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="card bg-emerald-900 border-none text-white relative overflow-hidden">
                  <div className="absolute -right-8 -bottom-8 opacity-10">
                    <TrendingUp size={160} />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">Required Monthly Contribution</h4>
                    <div className="text-5xl font-black mb-4">
                      {currency} {plan.monthly_saving_required?.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        plan.feasibility === 'high' ? 'bg-emerald-500/20 text-emerald-300' :
                        plan.feasibility === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-rose-500/20 text-rose-300'
                      }`}>
                        Feasibility: {plan.feasibility}
                      </div>
                      <span className="text-xs text-emerald-300/60 font-medium">calculated based on current income dynamics</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card bg-white border-2 border-emerald-50">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                       <Wallet size={14} className="text-emerald-500" /> Smart Adjustments
                    </h4>
                    <p className="text-sm text-zinc-600 leading-relaxed italic">
                      "{plan.adjustment_advice}"
                    </p>
                  </div>
                  <div className="card bg-white border-2 border-emerald-50">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                       <CheckCircle2 size={14} className="text-emerald-500" /> Growth Strategy
                    </h4>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {plan.goal_strategy}
                    </p>
                  </div>
                </div>

                <div className="card bg-amber-50 border-amber-100 flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shrink-0 shadow-sm border border-amber-100">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-900">NBZ Risk Assessment</p>
                    <p className="text-xs text-amber-800/80 leading-relaxed mt-1">
                      This plan assumes a stable income. If your business overheads increase, we recommend shifting to a "Safety-First" liquidation strategy for at least 2 billing cycles.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
