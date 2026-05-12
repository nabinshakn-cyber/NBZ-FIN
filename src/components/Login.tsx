import React, { useState } from 'react';
import { Wallet, LogIn, ShieldCheck, Cpu, Globe, Lock, Mail, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface LoginProps {
  onLoginSuccess?: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

export default function Login({ onLoginSuccess }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLoginSuccess?.();
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg("Check your email for the confirmation link.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccessMsg("Password reset link sent to your email.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#050505] p-6 overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-gold/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="card bg-zinc-900/40 border-white/5 backdrop-blur-3xl overflow-hidden shadow-[0_80px_150px_-30px_rgba(0,0,0,1)] rounded-[32px]">
          {/* Top Status Bar */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protocol Active</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">v5.1.0</span>
              <ShieldCheck size={14} className="text-zinc-500" />
            </div>
          </div>

          <div className="p-12 space-y-12">
            {/* Brand Header */}
            <div className="text-center space-y-6">
              <motion.div 
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 10, scale: 1 }}
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 4 }}
                className="w-20 h-20 bg-gradient-to-br from-gold via-gold/80 to-gold/40 rounded-[1.5rem] mx-auto flex items-center justify-center text-black shadow-[0_20px_60px_rgba(212,175,55,0.25)] relative"
              >
                <Wallet size={40} strokeWidth={2.5} />
              </motion.div>
              
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                  NBZ <span className="text-gold">Vault</span> OS
                </h1>
                <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">
                  <Cpu size={12} /> Global Intelligence <Globe size={12} />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!isSupabaseConfigured && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-gold/5 border border-gold/10 rounded-2xl space-y-3"
                >
                  <p className="text-[10px] text-gold font-black uppercase tracking-[0.2em] text-center">
                    Automatic Demo Mode Initialized
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium leading-relaxed text-center">
                    You are viewing a local preview. Data will not persist. To use the real cloud vault, configure Supabase credentials in the <b>Settings</b> menu.
                  </p>
                </motion.div>
              )}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[10px] text-rose-400 font-bold uppercase tracking-widest text-center"
                >
                  {error}
                </motion.div>
              )}
              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] text-emerald-400 font-bold uppercase tracking-widest text-center"
                >
                  {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Auth Form */}
            <div className="space-y-8">
              {mode !== 'forgot' && (
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 relative">
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-1 bg-gold rounded-xl shadow-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    style={{ 
                      left: mode === 'login' ? '4px' : '50%',
                      width: 'calc(50% - 4px)'
                    }}
                  />
                  <button 
                    onClick={() => setMode('login')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${mode === 'login' ? 'text-black' : 'text-zinc-500 hover:text-white'}`}
                  >
                    Authorize
                  </button>
                  <button 
                    onClick={() => setMode('signup')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${mode === 'signup' ? 'text-black' : 'text-zinc-500 hover:text-white'}`}
                  >
                    Initialize
                  </button>
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-6">
                {mode === 'forgot' && (
                  <button 
                    onClick={() => setMode('login')}
                    className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-gold transition-colors mb-4"
                  >
                    <ArrowLeft size={14} /> Back to Gate
                  </button>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Operator ID</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                      <input 
                        type="email" 
                        required
                        placeholder="EXECUTIVE@NBZ.VAULT"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 pl-12 text-white text-xs font-bold focus:border-gold/50 outline-none transition-all placeholder:text-zinc-700"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {mode !== 'forgot' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Access Key</label>
                        {mode === 'login' && (
                          <button 
                            type="button"
                            onClick={() => setMode('forgot')}
                            className="text-[9px] font-black text-gold/60 hover:text-gold uppercase tracking-widest transition-colors"
                          >
                            Recovery Protocol
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        <input 
                          type="password" 
                          required
                          placeholder="••••••••••••"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 pl-12 text-white text-xs font-bold focus:border-gold/50 outline-none transition-all placeholder:text-zinc-700"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-4 hover:bg-gold transition-all shadow-[0_15px_30px_rgba(0,0,0,0.3)] disabled:opacity-50 group"
                >
                  {loading ? (
                    <span className="animate-pulse">Initializing Tranche...</span>
                  ) : (
                    <>
                      {mode === 'login' ? <LogIn size={20} /> : mode === 'signup' ? <UserPlus size={20} /> : <KeyRound size={20} />}
                      <span>{mode === 'login' ? 'Bypass Security' : mode === 'signup' ? 'Initiate Account' : 'Send Recovery'}</span>
                    </>
                  )}
                </button>
              </form>

              {mode === 'login' && (
                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                    <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest"><span className="bg-zinc-900/40 px-4 text-zinc-600">Quantum Auth Protocol</span></div>
                  </div>
                  
                  <button 
                    onClick={handleGoogleLogin}
                    className="w-full bg-white/5 border border-white/10 text-white h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 hover:bg-white/10 transition-all hover:border-gold/30"
                  >
                    <Globe size={18} />
                    Google Identity Tranche
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="px-12 py-8 bg-black/40 border-t border-white/5 flex items-center justify-between grayscale opacity-50 contrast-125">
            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">NRB-Protocol Supabase-Powered</p>
            <div className="flex gap-4">
              <div className="w-1 h-1 rounded-full bg-gold" />
              <div className="w-1 h-1 rounded-full bg-gold" />
              <div className="w-1 h-1 rounded-full bg-gold" />
            </div>
            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">© 2026 NBZ GLOBAL</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
