"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, Award, Target, ExternalLink, UserCheck } from 'lucide-react';

export default function VerifyView() {
  const { handle: rawHandle } = useParams<{ handle: string }>();
  const [score, setScore] = useState(0);
  const [impactCategory, setImpactCategory] = useState('Newbie');
  const [loading, setLoading] = useState(true);

  const handle = rawHandle?.replace('@', '').toLowerCase();
  
  // In a real app we'd fetch this from the API or chain
  // For the SPA version, we'll try to fetch from the local API
  useEffect(() => {
    async function fetchReputation() {
      if (!handle) return;
      try {
        const res = await fetch(`/api/v1/reputation/${handle}`);
        if (res.ok) {
          const data = await res.json();
          setScore(data.score || 0);
          setImpactCategory(data.impactCategory || 'Newbie');
        }
      } catch (e) {
        console.error("Failed to fetch reputation", e);
      } finally {
        setLoading(false);
      }
    }
    fetchReputation();
  }, [handle]);

  if (!handle) return <div>No handle provided</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 flex flex-col items-center">
       <div className="max-w-2xl w-full space-y-8">
          {/* Header Block */}
          <div className="text-center space-y-2">
             <div className="inline-flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full mb-4 shadow-lg shadow-slate-900/10">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">ImpactPay Trust Protocol</span>
             </div>
             <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Public Trust Report</h1>
             <p className="text-slate-500 font-medium">Verified Social Impact & Reputation for Web3</p>
          </div>

          {/* Profile Card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50">
             <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between transition-opacity duration-500">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center">
                      <UserCheck className="w-8 h-8 text-accent" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold text-slate-900">@{handle}</h2>
                      <p className="text-xs font-mono text-slate-400 mt-1">Impact Verified ID</p>
                   </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verification Status</span>
                   <div className="bg-accent/10 border border-accent/20 px-3 py-1 rounded-full flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      <span className="text-xs font-bold text-accent">L3 Verified Human</span>
                   </div>
                </div>
             </div>

             <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Impact Reputation</span>
                      <div className="flex items-baseline gap-2 mt-1">
                         <span className="text-5xl font-black text-slate-900 tracking-tighter">{loading ? '...' : score}</span>
                         <span className="text-sm font-bold text-accent uppercase">{loading ? 'Loading' : impactCategory}</span>
                      </div>
                   </div>
                   <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${Math.min((score / 1000) * 100, 100)}%` }} />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   {[
                      { label: 'Odis Link', status: 'Verified', icon: ShieldCheck },
                      { label: 'Social Link', status: 'Verified', icon: ExternalLink },
                      { label: 'Proof-of-Ship', status: 'Active', icon: Target },
                      { label: 'Celo Citizen', status: 'Lvl 3', icon: Award },
                   ].map((item, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-2">
                         <item.icon className="w-4 h-4 text-slate-400" />
                         <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
                            <span className="text-xs font-bold text-slate-900">{item.status}</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="p-8 bg-slate-900 rounded-b-2xl">
                <div className="flex items-start gap-4">
                   <div className="p-3 bg-accent rounded-xl text-slate-900">
                      <ShieldCheck className="w-6 h-6" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-white font-bold text-sm uppercase tracking-wide">W3C Verifiable Credential</h3>
                      <p className="text-slate-300 text-xs leading-relaxed max-w-sm">
                         This report is cryptographically signed by ImpactPay Protocol.
                         The underlying biometric proof-of-humanhood is anchored on the Celo Blockchain.
                      </p>
                      <button className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all mt-4">
                         View Credential Data <ExternalLink className="w-3 h-3" />
                      </button>
                   </div>
                </div>
             </div>
          </div>

          <div className="text-center">
             <p className="text-xs text-slate-400 font-medium tracking-wide">
                ImpactPay Protocol © 2026 • Real-time Reputation Indexer v1.0.2
             </p>
          </div>
       </div>
    </div>
  );
}
