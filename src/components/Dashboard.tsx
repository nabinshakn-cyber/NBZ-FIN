import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Transaction, Currency, Domain, Account } from '../types';
import { TrendingUp, TrendingDown, DollarSign, BrainCircuit, Wallet, Briefcase, Activity, AlertTriangle, Lightbulb, Sparkles, Bell, CheckCircle, Clock, Building2, Coins, Globe, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { performMasterAuditWithAI } from '../services/geminiService';
import { fetchLiveRates, ExchangeRates, DEFAULT_AED_TO_INR } from '../services/currencyService';

interface DashboardProps {
  transactions: Transaction[];
  reminders: any[];
  accounts: Account[];
  onAskAI: () => void;
}

const COLORS = ['#D4AF37', '#FFD700', '#C5A028', '#B8860B', '#996515'];

export default function Dashboard({ transactions, reminders = [], accounts = [], onAskAI }: DashboardProps) {
  const [activeCurrency, setActiveCurrency] = React.useState<Currency>('AED');
  const [activeDomain, setActiveDomain] = React.useState<Domain | 'all'>('all');

  const aedBalance = accounts.filter(a => a.currency === 'AED').reduce((sum, a) => sum + a.balance, 0);
  const inrBalance = accounts.filter(a => a.currency === 'INR').reduce((sum, a) => sum + a.balance, 0);

  const currentBalance = activeCurrency === 'AED' ? aedBalance : inrBalance;

  const [behaviorAudit, setBehaviorAudit] = React.useState<any | null>(null);
  const [businessAudit, setBusinessAudit] = React.useState<any | null>(null);
  const [nriInsights, setNriInsights] = React.useState<any | null>(null);
  const [riskAssessment, setRiskAssessment] = React.useState<any | null>(null);
  const [isAuditing, setIsAuditing] = React.useState(false);
  const [auditError, setAuditError] = React.useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = React.useState(0);
  const [fxRates, setFxRates] = React.useState<ExchangeRates | null>(null);

  React.useEffect(() => {
    fetchLiveRates().then(rates => {
      if (rates) setFxRates(rates);
    });
  }, []);

  const currentRate = fxRates?.[activeCurrency === 'AED' ? 'INR' : 'AED'] || (activeCurrency === 'AED' ? DEFAULT_AED_TO_INR : 1/DEFAULT_AED_TO_INR);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const performAudit = async () => {
    if (isAuditing || cooldownSeconds > 0) return;
    setIsAuditing(true);
    setAuditError(null);
    try {
      const masterAudit = await performMasterAuditWithAI(transactions);
      if (masterAudit) {
        setBehaviorAudit(masterAudit.behavior);
        setBusinessAudit(masterAudit.business);
        setNriInsights(masterAudit.nri);
        setRiskAssessment(masterAudit.risk);
        // Success cooldown to prevent spam
        setCooldownSeconds(60);
      }
    } catch (error: any) {
      console.error("Audit failed:", error);
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        setAuditError("Intelligence quota exceeded. Protocol requires a 60s reset window.");
        setCooldownSeconds(60);
      } else {
        setAuditError("Strategic analysis temporarily unavailable.");
        setCooldownSeconds(10); // Short retry window for other errors
      }
    } finally {
      setIsAuditing(false);
    }
  };

  const filtered = transactions.filter(t => 
    t.currency === activeCurrency && (activeDomain === 'all' || t.domain === activeDomain)
  );

  const expenseTransactions = filtered.filter(t => t.type === 'expense' || t.type === 'lent' || t.type === 'transfer');
  const categoryData = Object.entries(
    expenseTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const monthlyData = React.useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7));
    }

    return months.map(m => {
      const monthTxs = transactions.filter(t => t.date.startsWith(m));
      
      const calcTotal = (type: string | string[]) => monthTxs
        .filter(t => Array.isArray(type) ? type.includes(t.type) : t.type === type)
        .reduce((sum, t) => {
          if (t.currency === activeCurrency) return sum + t.amount;
          const rate = activeCurrency === 'AED' ? 1/DEFAULT_AED_TO_INR : DEFAULT_AED_TO_INR; 
          return sum + (t.amount * rate);
        }, 0);

      const date = new Date(m + '-01');
      return {
        name: date.toLocaleString('default', { month: 'short' }),
        income: Math.round(calcTotal(['income', 'borrowed'])),
        expenses: Math.round(calcTotal(['expense', 'lent', 'transfer']))
      };
    });
  }, [transactions, activeCurrency, fxRates]);

  const trendData = React.useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7)); // YYYY-MM
    }

    return months.map(m => {
      const monthTxs = transactions.filter(t => t.date.startsWith(m) && (t.type === 'expense' || t.type === 'transfer'));
      const total = monthTxs.reduce((sum, t) => {
        // Use live conversion for trend consistency
        if (t.currency === activeCurrency) return sum + t.amount;
        
        let rate = DEFAULT_AED_TO_INR;
        if (fxRates) {
          if (t.currency === 'AED' && activeCurrency === 'INR') rate = fxRates['INR'];
          else if (t.currency === 'INR' && activeCurrency === 'AED') rate = 1 / fxRates['INR'];
        } else {
          // Static fallback
          rate = activeCurrency === 'AED' ? 1/DEFAULT_AED_TO_INR : DEFAULT_AED_TO_INR;
        }
        
        return sum + (t.amount * rate);
      }, 0);
      
      const date = new Date(m + '-01');
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        amount: Math.round(total)
      };
    });
  }, [transactions, activeCurrency]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-1000">
      {/* Premium Vault Header */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-gold/20 p-8 lg:p-12 gold-shadow">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-gold/5 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-12">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center text-gold">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-[10px] font-black text-gold uppercase tracking-[0.3em]">Capital Vault</h2>
                <p className="text-zinc-500 text-xs font-medium">Global Liquidity Real-time Snapshot</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 w-fit">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Live FX Protocol</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <p className="text-xs font-bold text-white">
                1 AED = <span className="text-gold">{(fxRates?.['INR'] || DEFAULT_AED_TO_INR).toFixed(2)} INR</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">UAE Liquidity</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-gold font-bold text-lg">DH</span>
                  <span className="text-5xl font-black tracking-tighter text-white">
                    {aedBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-2">
                  <ArrowUpRight size={14} />
                  <span>Verified Funds</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">India Reserves</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-gold font-bold text-lg">₹</span>
                  <span className="text-5xl font-black tracking-tighter text-white">
                    {inrBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-orange-400 font-bold mt-2">
                  <Globe size={14} />
                  <span>NRB Compliance Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-72 space-y-6">
            <div className="glass border-gold/10 rounded-3xl p-6 space-y-4">
              <button 
                onClick={performAudit}
                disabled={isAuditing || cooldownSeconds > 0}
                className="w-full btn-primary flex items-center justify-center gap-3 group disabled:opacity-50 disabled:grayscale"
              >
                {isAuditing ? (
                  <Activity size={18} className="animate-pulse" />
                ) : cooldownSeconds > 0 ? (
                  <Clock size={18} />
                ) : (
                  <BrainCircuit size={18} className="group-hover:rotate-12 transition-transform" />
                )}
                {isAuditing ? 'Auditing Vault...' : cooldownSeconds > 0 ? `Reset in ${cooldownSeconds}s` : 'Analyze Vault'}
              </button>
              
              {auditError && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <AlertTriangle size={12} />
                  {auditError}
                </div>
              )}
              
              <div className="flex border-t border-white/5 pt-4 gap-2">
                {(['AED', 'INR'] as Currency[]).map(c => (
                  <button
                    key={c}
                    onClick={() => setActiveCurrency(c)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeCurrency === c 
                      ? 'bg-gold text-black' 
                      : 'bg-white/5 text-zinc-500 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            
            <p className="text-[10px] text-zinc-500 italic text-center px-4">
              "AI Intelligence OS is monitoring your cross-border tranches for the optimal FX window."
            </p>
          </div>
        </div>
      </section>

      {/* Account Snapshots Horizontal Carousel/Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-black uppercase tracking-widest text-xs text-gold/60">Asset Distribution</h3>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{accounts.length} Active Nodes</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map(acc => (
            <motion.div 
              key={acc.id} 
              whileHover={{ y: -5 }}
              className="card group hover:border-gold/30 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${acc.location === 'UAE' ? 'bg-indigo-500/10 text-indigo-400' : acc.location === 'India' ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {acc.location === 'Cash' ? <Coins size={16} /> : <Building2 size={16} />}
                </div>
                <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                  <div className={`w-1 h-1 rounded-full ${acc.location === 'UAE' ? 'bg-indigo-400' : acc.location === 'India' ? 'bg-orange-400' : 'bg-emerald-400'}`} />
                  <span className="text-[9px] font-black uppercase text-zinc-400">{acc.location}</span>
                </div>
              </div>
              <h4 className="font-bold text-white mb-2 group-hover:text-gold transition-colors">{acc.bankName}</h4>
              <p className="text-2xl font-black tracking-tighter text-white">
                <span className="text-xs font-bold text-gold mr-1">{acc.currency === 'AED' ? 'DH' : '₹'}</span>
                {acc.balance.toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {nriInsights && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card border-l-4 border-l-gold bg-zinc-900 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold/10 text-gold rounded-2xl flex items-center justify-center border border-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-white tracking-tight">Intelligence Report</h3>
                  <p className="text-xs text-zinc-500 font-medium tracking-wide">Elite Wealth Optimization Suite</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-gold uppercase tracking-[0.2em] bg-gold/5 px-4 py-2 rounded-xl border border-gold/10">
                <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse mr-1" />
                Live Analysis
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Remittance Window</span>
                <p className="text-sm font-bold text-zinc-200 leading-relaxed">{nriInsights.remittance_advice}</p>
              </div>
              <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">FX Strategy</span>
                <p className="text-sm font-bold text-zinc-200 leading-relaxed">{nriInsights.currency_strategy}</p>
              </div>
              <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Investment Tranche</span>
                <p className="text-sm font-bold text-zinc-200 leading-relaxed">{nriInsights.investment_hint}</p>
              </div>
              <div className="space-y-2 p-4 rounded-2xl bg-gold/10 border border-gold/20">
                <span className="text-[9px] font-black text-gold uppercase tracking-widest">Strategic Warning</span>
                <p className="text-sm font-bold text-gold-light leading-relaxed">{nriInsights.risk_warning}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="card lg:col-span-3 min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-lg text-white uppercase tracking-tight flex items-center gap-3">
               Performance Matrix 
               <span className="text-[10px] font-bold text-zinc-500 py-1 px-3 bg-white/5 rounded-full border border-white/5 uppercase tracking-widest">{activeCurrency}</span>
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(212,175,55,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#151515',
                    borderRadius: '24px', 
                    border: '1px solid rgba(212,175,55,0.2)', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="income" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="expenses" fill="rgba(255,255,255,0.05)" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card lg:col-span-2 min-h-[400px] flex flex-col">
          <h3 className="font-black text-lg text-white uppercase tracking-tight mb-8">Sector Allocation</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#151515',
                    borderRadius: '24px', 
                    border: '1px solid rgba(212,175,55,0.2)', 
                    padding: '12px 16px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 justify-center">
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Section: Expense Trends */}
      <section className="card bg-zinc-900 border-white/5 overflow-hidden group">
        <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
          <div>
            <h3 className="font-black text-xl text-white tracking-tight uppercase italic flex items-center gap-3">
              Expense Velocity <Activity size={20} className="text-rose-500 animate-pulse" />
            </h3>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">6-Month Strategic Outflow Analysis</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
            <TrendingDown size={14} className="text-rose-400" />
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Trend Pattern Detected</span>
          </div>
        </div>
        
        <div className="p-8 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#151515',
                  borderRadius: '24px', 
                  border: '1px solid rgba(239, 68, 68, 0.2)', 
                  padding: '12px 16px'
                }}
                itemStyle={{ color: '#f43f5e', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#f43f5e" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorTrend)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="px-8 pb-8 flex items-center gap-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/40" />
            <span>Projected Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-1 bg-rose-500 rounded-full" />
            <span>Observed Reality</span>
          </div>
        </div>
      </section>
    </div>
  );
}
