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
import { formatEther, zeroAddress } from 'viem';
import { Link } from 'react-router-dom';

export default function FunderDashboardView() {
  const { stats, goals, funderReputations } = useImpactPay();
  const { address } = useAccount();
  const { data: reputationData } = useReputation(address ?? zeroAddress);
  
  const myReputation = funderReputations[address?.toLowerCase() || ''] || BigInt(reputationData?.score || 0);

  return (
    <div className="space-y-8 pb-24 px-4 pt-4 pb-8 max-w-2xl mx-auto">
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
                goals={goals.filter(g => address && g.funders.some(f => f.id.toLowerCase() === address.toLowerCase()))} 
                title="Funded Goals"
                emptyMessage="You haven't funded any goals yet." 
                isFunderView={true}
            />
        </section>
    </div>
  );
}
