import React, { useState, useRef } from 'react';
import { Camera, Upload, Check, X, Loader2, Sparkles, AlertCircle, RefreshCcw } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Currency, FinType } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface BillScannerProps {
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
}

interface ExtractedData {
  entity: string;
  amount: number;
  currency: Currency;
  date: string;
  type: FinType;
  category: string;
  domain: 'personal' | 'business';
  description: string;
}

export default function BillScanner({ onAddTransaction }: BillScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        processImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64Image: string) => {
    setIsProcessing(true);
    setError(null);
    setExtractedData(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const imageParts = [{
        inlineData: {
          mimeType: "image/png",
          data: base64Image.split(',')[1],
        },
      }];

      const prompt = `Analyze this image (bill, receipt, or loan doc). Extract details into JSON.
      Required Fields:
      - entity: Merchant or person name
      - amount: Numeric value
      - currency: "AED" or "INR" 
      - date: YYYY-MM-DD
      - type: "expense", "lent", "borrowed", "emi", or "gold_loan"
      - category: Context-aware category (e.g., "Housing", "Jewellery", "Finance")
      - domain: "personal" or "business" based on content
      - description: Strategic summary`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [...imageParts, { text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              entity: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              currency: { type: Type.STRING, enum: ["AED", "INR"] },
              date: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["expense", "lent", "borrowed", "emi", "gold_loan"] },
              category: { type: Type.STRING },
              domain: { type: Type.STRING, enum: ["personal", "business"] },
              description: { type: Type.STRING },
            },
            required: ["entity", "amount", "currency", "date", "type", "category", "domain", "description"]
          }
        }
      });

      const resultText = response.text || "{}";
      // Handle potential markdown block if AI includes it despite json mime type
      const cleanJson = resultText.replace(/```json\n?|```/g, '').trim();
      const result = JSON.parse(cleanJson);
      
      if (!result.amount || !result.entity) {
        throw new Error("Missing critical data in scan");
      }
      
      setExtractedData(result);
    } catch (err) {
      console.error("AI Scan Error:", err);
      setError("AI failed to interpret the image. Ensure the text is clear and well-lit.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!extractedData) return;

    try {
      await onAddTransaction({
        ...extractedData,
        merchant: extractedData.entity,
        person: extractedData.entity,
        date: extractedData.date || new Date().toISOString().split('T')[0],
      });
      setImage(null);
      setExtractedData(null);
      alert("Successfully added to ledger!");
    } catch (err) {
      setError("Failed to save transaction.");
    }
  };

  const reset = () => {
    setImage(null);
    setExtractedData(null);
    setError(null);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <header className="text-center space-y-2">
        <div className="w-16 h-16 bg-gold/10 rounded-3xl flex items-center justify-center text-gold mx-auto mb-4 border border-gold/20 shadow-xl shadow-gold/5">
          <Camera size={32} />
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-text-primary uppercase italic">AI Bill Ingestion</h1>
        <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Instant OCR & Smart Categorization</p>
      </header>

      <div className="card p-0 overflow-hidden relative group">
        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="h-80 border-2 border-dashed border-white/5 hover:border-gold/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 bg-white/[0.01]"
          >
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-gold transition-colors">
              <Upload size={24} />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-text-primary group-hover:text-gold transition-colors">Upload or Take Photo</p>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Supports Bills, Receipts, Loan Docs</p>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="relative">
            <img src={image} alt="Bill Preview" className="w-full h-80 object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent flex flex-col justify-end p-8">
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center gap-4 py-8"
                  >
                    <div className="relative">
                      <Loader2 className="animate-spin text-gold" size={40} />
                      <Sparkles className="absolute -top-1 -right-1 text-gold animate-pulse" size={16} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-black text-white italic uppercase tracking-tight">AI Analyzing Assets...</h3>
                      <p className="text-[10px] text-gold font-bold uppercase tracking-widest mt-1">Extracting tranches & metadata</p>
                    </div>
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 py-8"
                  >
                    <AlertCircle className="text-rose-500" size={40} />
                    <div className="text-center">
                      <p className="text-sm font-bold text-rose-500">{error}</p>
                      <button 
                        onClick={reset}
                        className="mt-4 flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest px-4 py-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10"
                      >
                        <RefreshCcw size={12} /> Try Again
                      </button>
                    </div>
                  </motion.div>
                ) : extractedData ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                       <div>
                        <span className="text-[9px] font-black text-gold uppercase tracking-[0.2em] mb-1 block">Entity Detected</span>
                        <h3 className="text-2xl font-black text-white tracking-tighter italic">{extractedData.entity}</h3>
                       </div>
                       <div className="text-right">
                        <span className="text-[9px] font-black text-gold uppercase tracking-[0.2em] mb-1 block">Capital Tranche</span>
                        <p className="text-3xl font-black text-white tracking-tighter">
                          <span className="text-xs text-gold/40 mr-1">{extractedData.currency}</span>
                          {extractedData.amount.toLocaleString()}
                        </p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                      <div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Entry Type</span>
                        <p className="text-xs font-bold text-text-primary capitalize">{extractedData.type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Domain</span>
                        <p className="text-xs font-bold text-text-primary capitalize">{extractedData.domain}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Strategic Date</span>
                        <p className="text-xs font-bold text-text-primary">{extractedData.date}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Category</span>
                        <p className="text-xs font-bold text-text-primary">{extractedData.category}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Strategic Audit</span>
                        <p className="text-xs font-bold text-text-primary leading-relaxed">{extractedData.description}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={handleConfirm}
                        className="flex-1 bg-gold text-black py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-gold/20"
                      >
                        <Check size={16} /> Deploy to Ledger
                      </button>
                      <button 
                        onClick={reset}
                        className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 text-zinc-500 rounded-2xl hover:text-white hover:bg-white/10"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
        <Sparkles className="text-indigo-400 mt-0.5 shrink-0" size={16} />
        <p className="text-[10px] text-indigo-300 font-medium leading-relaxed italic">
          NBZ AI OS handles multimodal analysis of bank statements, gold loan certificates, and corridor remittance slips for instant reconciliation.
        </p>
      </div>
    </div>
  );
}
