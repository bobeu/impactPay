"use client";

import React from 'react';
import { ImpactDashboard } from '@/components/ImpactDashboard';
import { IdentityVerificationCard } from '@/components/IdentityVerificationCard';
import { useAccount } from 'wagmi';
import { useImpactPay } from '@/contexts/ImpactPayContext';
import { useReputation } from '@/hooks/useReputation';
import { formatEther } from 'viem';
import { Award, TrendingUp } from 'lucide-react';

export default function ReputationView() {
  const { address } = useAccount();
  const { funderReputations } = useImpactPay();
  const { data: reputationData } = useReputation(address ?? undefined);

  // Use blockchain reputation if subgraph reputation fails or is not yet available
  const myReputation = funderReputations[address?.toLowerCase() || ''] || BigInt(reputationData?.score || 0);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest mx-auto">
            <Award className="w-3 h-3" /> Proof of Reputation
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Impact Score</h1>
          <p className="text-sm text-slate-500 font-medium">
            Your reputation is calculated based on goals funded and verified fulfillment.
          </p>
        </header>

        <section>
          <ImpactDashboard
            totalFundedUsd={Number(formatEther(myReputation)) * 10}
            reputationScore={Number(formatEther(myReputation))}
          />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <section className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Growth Stats</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Rank</p>
                  <p className="text-lg font-black text-slate-900">#42</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Multiplier</p>
                  <p className="text-lg font-black text-slate-900">1.2x</p>
                </div>
              </div>
           </section>

           {address && <IdentityVerificationCard address={address} />}
        </div>
      </div>
    </div>
  );
}
