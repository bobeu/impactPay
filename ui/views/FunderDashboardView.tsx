"use client";

import React from 'react';
import { ImpactDashboard } from '@/components/ImpactDashboard';
import { GoalList } from '@/components/GoalList';
import { IdentityVerificationCard } from '@/components/IdentityVerificationCard';
import { PhoneLookupCard } from '@/components/PhoneLookupCard';
import { CreateGoalCard } from '@/components/CreateGoalCard';
import { VirtualCardPortal } from '@/components/VirtualCardPortal';
import { SponsorDashboard } from '@/components/SponsorDashboard';
import { DevSubscriptionCard } from '@/components/DevSubscriptionCard';
import { useImpactPay } from '@/contexts/ImpactPayContext';
import { useAccount } from 'wagmi';
import { useReputation } from '@/hooks/useReputation';
import { formatEther } from 'viem';
import { Link } from 'react-router-dom';

export default function FunderDashboardView() {
  const { stats, goals, funderReputations } = useImpactPay();
  const { address } = useAccount();
  const { data: reputationData } = useReputation(address ?? undefined);
  
  const myReputation = funderReputations[address?.toLowerCase() || ''] || BigInt(reputationData?.score || 0);

  return (
    <div className="space-y-8 pb-24 px-4 py-8 max-w-2xl mx-auto">
        <header className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
            <Link to="/" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                ← Home
            </Link>
        </header>

        <ImpactDashboard
            totalFundedUsd={Number(formatEther(myReputation)) * 10}
            reputationScore={Number(formatEther(myReputation))}
            className="mb-4"
        />
        
        <section>
            <GoalList 
                goals={goals} 
                title="Active Opportunities"
                emptyMessage="No goals have been created yet. Be the first to create one!" 
            />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {address && <IdentityVerificationCard address={address} />}
            <div className="space-y-6">
                <PhoneLookupCard />
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-800">Quick Actions</h3>
                    <Link to="/create-goal" className="flex items-center justify-center w-full py-3 bg-accent text-white font-bold rounded-2xl text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-colors">
                        Create Goal
                    </Link>
                </div>
            </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {address && <VirtualCardPortal address={address} />}
            <SponsorDashboard />
        </section>
        
        <DevSubscriptionCard />
    </div>
  );
}
