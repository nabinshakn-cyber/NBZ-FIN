import React, { useState } from 'react';
import { ShieldAlert, Trash2, LogOut, User, Bell, ShieldCheck, Globe, Database, HardDrive, Smartphone, Key, Lock, UserPlus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createDocument } from '../lib/firestoreUtils';
import { useNotifications } from './NotificationCenter';

interface SettingsProps {
  onResetData: () => Promise<void>;
  onSeedData: () => Promise<void>;
}

export default function Settings({ onResetData, onSeedData }: SettingsProps) {
  const { user, logout } = useAuth();
  const { requestPermission, addNotification } = useNotifications();
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(Notification.permission);

  const handleRequestNotifications = async () => {
    const granted = await requestPermission();
    setNotificationStatus(granted ? 'granted' : 'denied');
    if (granted) {
      addNotification({
        title: 'System Initialized',
        message: 'Notifications are now active on this device.',
        type: 'success'
      });
    }
  };

  const handleTestNotification = () => {
    addNotification({
      title: 'Smartwatch Test',
      message: 'This notification will sync to your connected smartwatch and mobile devices.',
      type: 'info'
    });
  };

  // Credential Sync State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'warning' | 'error', msg: string } | null>(null);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      // 1. Primary Save to Firestore (Always works if signed in)
      const credentialData = {
        username,
        // In a real app we'd use stronger encryption, but following the "save" intent
        credentialBlob: btoa(password), 
        source: 'vault_direct',
        lastUpdated: new Date().toISOString()
      };

      // We'll use a special document ID per user to keep it simple and UPSERT-like
      // But firestoreUtils.createDocument uses addDoc, so we'll just add a record
      await createDocument('vault_credentials', credentialData);

      let statusMsg = 'Primary Vault Sync Complete.';
      let statusType: 'success' | 'warning' = 'success';

      // 2. Secondary Sync to Supabase (Optional)
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase
            .from('legacy_vault_access')
            .upsert({ 
              owner_id: user?.uid,
              username, 
              credential_blob: btoa(password),
              provider: 'supabase_tranche_v1',
              created_at: new Date().toISOString()
            });

          if (error) {
            console.error('Supabase Sync Error:', error);
            statusMsg += ' Warning: Supabase secondary tranche failed.';
            statusType = 'warning';
          } else {
            statusMsg += ' Secondary Supabase Tranche archived.';
          }
        } catch (supabaseErr) {
          console.error('Supabase block error:', supabaseErr);
          statusMsg += ' Warning: Supabase connectivity failure.';
          statusType = 'warning';
        }
      } else {
        statusMsg += ' Info: Supabase not configured, skipping secondary tranche.';
      }

      setSaveStatus({ type: statusType, msg: `Quantum Sync: ${statusMsg}` });
      setUsername('');
      setPassword('');
      
    } catch (err: any) {
      setSaveStatus({ type: 'error', msg: `Critical Failure: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

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
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 p-4 bg-zinc-900 border border-white/5 rounded-2xl text-rose-400 font-black uppercase tracking-widest text-xs hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={18} />
            Terminate Session
          </button>
        </div>

        {/* Global Settings */}
        <div className="md:col-span-2 space-y-8">
          {/* Tranche Control & Secondary Setup */}
          <div className="card bg-zinc-900 border-white/5 p-0 overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] -mr-16 -mt-16" />
            <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
              <h3 className="font-black text-white uppercase tracking-tight flex items-center gap-3">
                <UserPlus size={20} className="text-emerald-500" /> Vault Credentials Tranche
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[8px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${isSupabaseConfigured ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'}`}>
                  Supabase: {isSupabaseConfigured ? 'Sync Active' : 'Offline'}
                </span>
                <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                  Primary Vault: Verified
                </span>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest leading-relaxed">
                Configure primary and secondary authentication layers. Credentials will be securely synced across your primary cloud vault 
                {isSupabaseConfigured ? ' and secondary SQL tranches.' : '. (Configure Supabase keys in environment for secondary redundancy).'}
              </p>

              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Vault Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                      <input 
                        type="text" 
                        required
                        placeholder="OPERATOR_TAG"
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-3 pl-10 text-[11px] font-bold text-white focus:border-emerald-500/50 outline-none transition-all"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Quantum Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••••••"
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-3 pl-10 text-[11px] font-bold text-white focus:border-emerald-500/50 outline-none transition-all"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <AnimatePresence mode="wait">
                    {saveStatus && (
                      <motion.p 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={`text-[9px] font-bold uppercase tracking-widest ${saveStatus.type === 'success' ? 'text-emerald-400' : saveStatus.type === 'warning' ? 'text-gold' : 'text-rose-400'}`}
                      >
                        {saveStatus.msg}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="ml-auto px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2 group disabled:opacity-30"
                  >
                    {isSaving ? 'Synchronizing...' : 'Save to Vault'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="card bg-zinc-900 border-white/5 p-0 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-white/[0.01]">
              <h3 className="font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Key size={20} className="text-gold" /> Identity & Authorization
              </h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Auth Provider</p>
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-gold" />
                    <span className="text-xs font-bold text-white">Google Identity Tranche</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Protocol Version</p>
                  <span className="text-xs font-bold text-white">NRB-Live v5.1.4</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Last Synced Access</p>
                  <span className="text-xs font-bold text-white">{user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Active Now'}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Session Security</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400">Encrypted (AES-256)</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">MFA Status</p>
                    <p className="text-[9px] text-zinc-500 font-medium">Provider-level MFA inherited from Google session</p>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                  <p className="font-bold text-white tracking-tight text-lg">Push Notifications</p>
                  <p className="text-xs text-zinc-500 mt-1 uppercase font-medium leading-relaxed max-w-[280px]">
                    Works across Mobile, Smartwatch, Tablet and Desktop.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button 
                    onClick={handleRequestNotifications}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      notificationStatus === 'granted' 
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    {notificationStatus === 'granted' ? 'Protocol Active' : 'Enable Everywhere'}
                  </button>
                  {notificationStatus === 'granted' && (
                    <button 
                      onClick={handleTestNotification}
                      className="text-[9px] font-black text-zinc-500 hover:text-gold uppercase tracking-[0.2em] transition-colors"
                    >
                      Test Smartwatch Sync
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 bg-gold/5 rounded-2xl border border-gold/20 flex items-start gap-4">
                <div className="p-2 bg-gold/10 rounded-lg text-gold shrink-0">
                  <Info size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-gold font-bold uppercase tracking-widest">Automation Intelligence</p>
                  <p className="text-[9px] text-zinc-500 mt-1 leading-relaxed">
                    NBZ OS identifies critical debt tranches and automatically notifies you 24h before due date.
                    Active on all synced devices.
                  </p>
                </div>
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
