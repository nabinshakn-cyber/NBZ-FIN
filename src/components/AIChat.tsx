import React, { useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { chatWithAdvisor, getFinancialInsights } from '../services/geminiService';
import { Send, User, Bot, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface AIChatProps {
  transactions: Transaction[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChat({ transactions }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "Can I afford this purchase?",
    "How much should I save?",
    "Is my business profitable?",
    "Should I lend money?"
  ];

  useEffect(() => {
    async function init() {
      const insights = await getFinancialInsights(transactions);
      setMessages([{ role: 'assistant', content: `Hello! I am your **NBZ Financial Assistant**. I've analyzed your latest cross-border activities between UAE and India. Here's a quick summary:\n\n${insights}\n\nHow can I help you today?` }]);
      setInitialLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg = text;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const response = await chatWithAdvisor(userMsg, transactions);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">NBZ Assistant</h1>
        <p className="text-zinc-500 mt-1">Simple, practical advice for your personal & business life.</p>
      </header>

      <div className="flex-1 card flex flex-col p-0 overflow-hidden relative border-indigo-100 shadow-xl shadow-indigo-50/50">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/20"
        >
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  m.role === 'assistant' ? 'bg-indigo-600 text-white' : 'bg-white text-zinc-500 border border-zinc-100'
                }`}>
                  {m.role === 'assistant' ? <Sparkles size={16} /> : <User size={16} />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                  m.role === 'assistant' 
                  ? 'bg-white text-zinc-800 border border-indigo-50' 
                  : 'bg-zinc-900 text-white'
                }`}>
                  <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                    <Markdown>{m.content}</Markdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                <Loader2 size={16} className="animate-spin" />
              </div>
              <div className="bg-white border border-indigo-50 rounded-2xl p-4 flex items-center gap-2">
                <span className="text-sm text-indigo-400 font-bold tracking-tight">NBZ Assistant thinking...</span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 bg-white space-y-4">
          {!loading && messages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map(q => (
                <button 
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 border border-indigo-100 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); setInput(''); }} className="relative">
            <input
              type="text"
              placeholder="Ask me anything about your finances..."
              className="input-field w-full pr-12 h-14 shadow-sm border-indigo-50 focus:ring-indigo-500/10"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 shadow-lg shadow-indigo-100"
            >
              <Send size={18} />
            </button>
          </form>
        </div>

        {initialLoading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
            <div className="w-20 h-20 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center animate-pulse shadow-inner">
              <Sparkles size={40} className="text-indigo-400" />
            </div>
            <p className="text-indigo-900 font-bold text-sm tracking-widest uppercase animate-pulse">Initializing Fin-OS</p>
          </div>
        )}
      </div>
    </div>
  );
}
