import React, { useState } from 'react';
import { ShieldAlert, Trash2, LogOut, User, Bell, ShieldCheck, Globe, Database, HardDrive, Smartphone, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { auth } from '../lib/firebase';

interface SettingsProps {
  onResetData: () => Promise<void>;
  onSeedData: () => Promise<void>;
}

export default function Settings({ onResetData, onSeedData }: SettingsProps) {
  const { user } = useFirebase();
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    await onResetData();
    setIsResetting(false);
    setShowConfirmReset(false);
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    await onSeedData();
    setIsSeeding(false);
  };

  return (
    <div className="space-y-10 pb-24">
      <header>
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic flex items-center gap-4">
          Control Center <ShieldCheck className="text-gold" size={32} />
        </h1>
        <p className="text-zinc-500 mt-1 max-w-sm">System configuration and cryptographic domain management.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-8">
          <div className="card bg-zinc-900 border-white/5 p-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full border-4 border-gold/20 p-1 mb-6">
              <img 
                src={user?.photoURL || 'https://ui-avatars.com/api/?name=' + (user?.displayName || 'User')} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{user?.displayName || 'Citizen Zero'}</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">{user?.email}</p>
            <div className="flex items-center gap-2 mt-6 px-4 py-2 bg-gold/10 rounded-full border border-gold/20">
              <ShieldCheck size={14} className="text-gold" />
              <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">Verified Protocol</span>
            </div>
          </div>

          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center justify-center gap-3 p-4 bg-zinc-900 border border-white/5 rounded-2xl text-rose-400 font-black uppercase tracking-widest text-xs hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={18} />
            Terminate Session
          </button>
        </div>

        {/* Global Settings */}
        <div className="md:col-span-2 space-y-8">
          <div className="card bg-zinc-900 border-white/5 p-0 overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-white/[0.01]">
              <h3 className="font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Globe size={20} className="text-gold" /> Regional Sovereignty
              </h3>
            </div>
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white tracking-tight">Main Tranche Zone</p>
                  <p className="text-xs text-zinc-500 mt-1 uppercase font-medium">Primary financial jurisdiction for reporting</p>
                </div>
                <select className="input-field bg-white/5 border-white/10 text-xs py-2 px-4">
                  <option>UAE (AED)</option>
                  <option>India (INR)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white tracking-tight">Intelligence Feed</p>
                  <p className="text-xs text-zinc-500 mt-1 uppercase font-medium">Frequency of AI status audits</p>
                </div>
                <select className="input-field bg-white/5 border-white/10 text-xs py-2 px-4">
                  <option>Real-time</option>
                  <option>EOD Summary</option>
                  <option>Weekly Report</option>
                </select>
              </div>

              <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white tracking-tight italic">Demo Prototypes</p>
                  <p className="text-xs text-zinc-500 mt-1 uppercase font-medium">Populate vault with pre-parsed intelligence</p>
                </div>
                <button 
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="px-6 py-2 bg-gold/10 border border-gold/20 text-gold rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold hover:text-black transition-all flex items-center gap-2 group disabled:opacity-50"
                >
                  <Database size={14} className={isSeeding ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'} />
                  {isSeeding ? 'Seeding...' : 'Seed Intelligence'}
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-zinc-900 border-white/5 p-0 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-white/[0.01]">
              <h3 className="font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Bell size={20} className="text-gold" /> Communication Protocol
              </h3>
            </div>
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white tracking-tight">Push Notifications</p>
                  <p className="text-xs text-zinc-500 mt-1 uppercase font-medium leading-relaxed max-w-[200px]">
                    Critical alerts for pending tranches and bill deadlines.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    if (Notification.permission !== 'granted') {
                      Notification.requestPermission();
                    } else {
                      alert("Notification access is already optimized.");
                    }
                  }}
                  className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold hover:text-black transition-all"
                >
                  {Notification.permission === 'granted' ? 'Protocol Active' : 'Request Access'}
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-zinc-900 border-white/5 p-0 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-white/[0.01]">
              <h3 className="font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Smartphone size={20} className="text-gold" /> Mobile Deployment
              </h3>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-gold/30 transition-all group cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/5 rounded-xl text-zinc-400 group-hover:text-white transition-colors">
                      <Smartphone size={24} />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protocol iOS</span>
                  </div>
                  <h4 className="font-bold text-white tracking-tight">Apple Intelligence</h4>
                  <p className="text-[10px] text-zinc-500 uppercase mt-2 leading-relaxed">
                    Open in Safari → Share Icon → <span className="text-gold">Add to Home Screen</span> to authorize full-screen biometric vault.
                  </p>
                </div>

                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-gold/30 transition-all group cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/5 rounded-xl text-zinc-400 group-hover:text-white transition-colors">
                      <Globe size={24} />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protocol Android</span>
                  </div>
                  <h4 className="font-bold text-white tracking-tight">Android Integration</h4>
                  <p className="text-[10px] text-zinc-500 uppercase mt-2 leading-relaxed">
                    Open in Chrome → 3 Dots Menu → <span className="text-gold">Install App</span> to initialize native-tier financial OS.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-zinc-900 border-white/5 p-0 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-white/[0.01]">
              <h3 className="font-black text-white uppercase tracking-tight flex items-center gap-3">
                <ShieldAlert size={20} className="text-rose-500" /> Administrative Protocols
              </h3>
            </div>
            <div className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <p className="font-black text-white tracking-tight uppercase">Purge Protocol</p>
                  <p className="text-xs text-zinc-500 mt-1 uppercase font-medium leading-relaxed max-w-sm">
                    Irreversibly delete all ledger entries, tranches, and biometric scan history. This action violates the trust protocol permanently.
                  </p>
                </div>
                <button 
                  onClick={() => setShowConfirmReset(true)}
                  className="px-6 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all whitespace-nowrap shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                >
                  <Trash2 size={16} className="inline mr-2" /> Reset All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmReset && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-md bg-zinc-900 border-rose-500/30 p-8 space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mx-auto border border-rose-500/20 animate-pulse">
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">Total Purge Imminent</h3>
                  <p className="text-xs text-zinc-500 mt-2 font-medium">Are you certain you wish to wipe the entire financial history from this sector? This cannot be undone.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowConfirmReset(false)}
                  className="p-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                >
                  Abort Mission
                </button>
                <button 
                  disabled={isResetting}
                  onClick={handleReset}
                  className="p-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-600 transition-all disabled:opacity-50"
                >
                  {isResetting ? 'Purging...' : <><Trash2 size={14} /> Commit Purge</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
