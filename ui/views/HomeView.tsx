"use client";

import React from 'react';
import { useAccount } from 'wagmi';
import { useImpactPay } from '@/contexts/ImpactPayContext';
import { LandingView } from '@/components/LandingView';
import { useNavigate } from 'react-router-dom';
import Image from 'next/image';

export default function HomeView() {
  const { isConnected, address } = useAccount();
  const { stats } = useImpactPay();
  const navigate = useNavigate();

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col gap-5 px-4 py-12">
        <section className="rounded-[2.5rem] border border-slate-200 bg-white px-8 py-12 shadow-xl shadow-slate-100 space-y-6 text-center max-w-sm mx-auto">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-slate-100 overflow-hidden">
            <Image 
              src="/logo.png" 
              alt="ImpactPay Logo" 
              width={64} 
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Welcome to ImpactPay
            </h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Connect your wallet to start supporting verified goals on Celo.
            </p>
          </div>
          <div className="pt-4">
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                Waiting for MiniPay...
             </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="px-4">
      <LandingView 
        stats={stats}
        onEnterAsFunder={() => navigate('/funder')}
        onEnterAsHelpSeeker={() => navigate(`/profile/${address}`)}
      />
    </div>
  );
}
