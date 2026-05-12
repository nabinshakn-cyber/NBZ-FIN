import React, { useState } from 'react';
import { Wallet, LogIn, ShieldCheck, Cpu, Globe, Lock, Mail, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onLoginSuccess?: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn();
      onLoginSuccess?.();
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
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Vault Protocol v5.1</span>
            </div>
            <div className="flex items-center gap-4">
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
                  <Cpu size={12} /> Live Financial Operating System <Globe size={12} />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
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
            </AnimatePresence>

            <div className="space-y-8">
              <div className="p-6 bg-gold/5 border border-gold/10 rounded-2xl space-y-3">
                <p className="text-[11px] text-gold font-bold uppercase tracking-[0.2em] text-center">
                  Live Authentication Required
                </p>
                <p className="text-[10px] text-zinc-400 font-medium leading-relaxed text-center px-4">
                  The NBZ Vault now operates on live infrastructure. Use your Google identity to access your private financial tranches.
                </p>
              </div>

              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white text-black h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-4 hover:bg-gold transition-all shadow-[0_15px_30px_rgba(0,0,0,0.3)] disabled:opacity-50 group"
              >
                {loading ? (
                  <span className="animate-pulse">Authorizing...</span>
                ) : (
                  <>
                    <Globe size={20} />
                    <span>Google Identity Tranche</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="px-12 py-8 bg-black/40 border-t border-white/5 flex items-center justify-between grayscale opacity-50 contrast-125">
            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">NRB-Protocol Firebase-Enabled</p>
            <div className="flex gap-4">
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
