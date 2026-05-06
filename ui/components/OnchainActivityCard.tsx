"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ExternalLink, ShieldCheck, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function OnchainActivityCard() {
  const [targetContract, setTargetContract] = useState('');
  const [txHashes, setTxHashes] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddHash = () => {
    if (txHashes.length < 3) {
      setTxHashes([...txHashes, '']);
    }
  };

  const handleRemoveHash = (index: number) => {
    const newHashes = [...txHashes];
    newHashes.splice(index, 1);
    setTxHashes(newHashes);
  };

  const handleHashChange = (index: number, value: string) => {
    const newHashes = [...txHashes];
    newHashes[index] = value;
    setTxHashes(newHashes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetContract) return toast.error("Provide a target contract");
    if (txHashes.filter(h => h.length > 0).length === 0) return toast.error("Provide at least 1 transaction hash");

    setIsSubmitting(true);
    try {
      // Simulate backend API call that verifies and signs the payload
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Onchain activity submitted for verification!");
      setTargetContract('');
      setTxHashes(['']);
    } catch (error) {
      toast.error("Failed to submit activity");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
          <Activity className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900">Proof of Impact</h3>
          <p className="text-xs text-slate-500 font-medium">Register daily onchain activities</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Target Contract</label>
          <input
            type="text"
            required
            value={targetContract}
            onChange={(e) => setTargetContract(e.target.value)}
            placeholder="0x..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between pl-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction Hashes (Max 3)</label>
            {txHashes.length < 3 && (
              <button 
                type="button" 
                onClick={handleAddHash}
                className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1 hover:text-emerald-700"
              >
                <Plus className="w-3 h-3" /> Add Hash
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {txHashes.map((hash, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={hash}
                  onChange={(e) => handleHashChange(index, e.target.value)}
                  placeholder="0x..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
                {txHashes.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => handleRemoveHash(index)}
                    className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#001B3D] text-white font-bold text-sm py-4 rounded-2xl hover:bg-[#002a5c] transition-all shadow-xl shadow-slate-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> Verify Activity
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
