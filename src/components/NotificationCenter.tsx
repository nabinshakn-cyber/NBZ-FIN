import React, { useState, useEffect, createContext, useContext } from 'react';
import { AppNotification } from '../types';
import { Bell, X, Check, Info, AlertTriangle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationContextType {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'date' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('nbz_notifications');
    if (saved) setNotifications(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('nbz_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const requestPermission = async () => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const addNotification = (n: Omit<AppNotification, 'id' | 'date' | 'read'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Browser Push Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotif.title, { body: newNotif.message });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => setNotifications([]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, clearAll, requestPermission }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const NotificationCenter: React.FC = () => {
  const { notifications, markAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="text-emerald-500" size={16} />;
      case 'alert': return <AlertTriangle className="text-orange-500" size={16} />;
      case 'reminder': return <MessageSquare className="text-indigo-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-500 hover:text-white transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-gold text-black text-[8px] font-black rounded-full flex items-center justify-center border-2 border-zinc-900">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 max-h-[480px] bg-bg-card border border-border-card rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-text-primary">Global Notifications</h3>
                <button onClick={clearAll} className="text-[9px] font-bold text-zinc-600 hover:text-white uppercase transition-colors">Clear All</button>
              </div>
              
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-zinc-600 italic text-xs">No active tranches.</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id)}
                      className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors relative ${!n.read ? 'bg-gold/[0.02]' : ''}`}
                    >
                      {!n.read && <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-gold rounded-full" />}
                      <div className="flex gap-3">
                        <div className="mt-1">{getIcon(n.type)}</div>
                        <div>
                          <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">{n.title}</p>
                          <p className="text-xs text-text-secondary mt-1 leading-relaxed">{n.message}</p>
                          <p className="text-[8px] font-medium text-zinc-600 mt-2">{new Date(n.date).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-white/5 text-center bg-white/[0.01]">
                <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">NBZ OS v1.0.4 Sentinel</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
