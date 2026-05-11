import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { scanFinancialDocument } from '../services/geminiService';
import { Transaction } from '../types';

interface ScannerProps {
  onScanComplete: (transaction: Partial<Transaction>) => void;
  onClose: () => void;
}

export default function Scanner({ onScanComplete, onClose }: ScannerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setError(null);
    }
  };

  const startScan = async () => {
    if (!preview) return;
    setIsScanning(true);
    setError(null);

    try {
      const base64 = preview.split(',')[1];
      const result = await scanFinancialDocument(base64);
      if (result) {
        onScanComplete(result);
      } else {
        setError("AI could not extract data. Please try a clearer photo.");
      }
    } catch (err) {
      setError("Failed to connect to NBZ_SCAN_ENGINE.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg">NBZ Scan Engine</h2>
              <p className="text-xs text-zinc-500 font-medium">Automatic extraction & classification.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {!preview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-200 rounded-2xl h-80 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
            >
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:text-indigo-500 transition-all shadow-sm">
                <Upload size={32} />
              </div>
              <div className="text-center">
                <p className="font-bold text-zinc-700">Drop receipt or click to upload</p>
                <p className="text-xs text-zinc-400 mt-1">Supports JPG, PNG, Screenshots (Max 5MB)</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden h-80 bg-zinc-100 border border-zinc-200">
                <img src={preview} alt="Receipt Preview" className="w-full h-full object-contain" />
                {!isScanning && (
                  <button 
                    onClick={() => setPreview(null)}
                    className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur shadow-md rounded-full text-zinc-600 hover:text-rose-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
                {isScanning && (
                  <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="relative">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute top-0 left-0 right-0 border-t-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10"
                      />
                      <div className="bg-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                        <Loader2 size={18} className="animate-spin text-indigo-600" />
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-700">AI Extracting...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-800 font-medium">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={() => setPreview(null)}
                  disabled={isScanning}
                  className="flex-1 h-12 rounded-xl font-bold text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                >
                  Cancel
                </button>
                <button 
                  onClick={startScan}
                  disabled={isScanning}
                  className="flex-[2] btn-primary h-12 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  Run Extraction
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
