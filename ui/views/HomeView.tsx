"use client";

import React from 'react';
import { useAccount } from 'wagmi';
import { useImpactPay } from '@/contexts/ImpactPayContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { LandingView } from '@/components/LandingView';
import { useNavigate } from 'react-router-dom';
import Image from 'next/image';
import { toast } from 'sonner';

export default function HomeView() {
  const { isConnected, address } = useAccount();
  const { stats } = useImpactPay();
  const { profile, signIn } = useUserProfile();
  const navigate = useNavigate();

  const handleAction = (route: string) => {
    if (!profile.isAuthenticated) {
      toast.error("Please sign in first");
      return;
    }
    navigate(route);
  };

  console.log("Stats", stats);

  
  if (!isConnected || !address) {
    {/* Protected section */}
    return (
      <div className="flex flex-col items-center">
        <section className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100 space-y-6 text-center max-w-sm mx-auto">
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
    <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:items-start lg:pt-4">
      {/* Main landing content */}
      <div className="px-4 lg:px-0">
        <LandingView 
          stats={stats}
          onEnterAsFunder={() => handleAction('/funder')}
          onEnterAsHelpSeeker={() => handleAction(`/profile/${address}`)}
          onEnterAsWealthRedistribution={() => handleAction('/wealth')}
          isAuthenticated={profile.isAuthenticated}
          onSignIn={signIn}
        />
      </div>

      {/* Desktop right panel — quick actions */}
      <div className="hidden lg:flex flex-col gap-4 sticky top-24">
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Quick Actions</h3>
          <button
            onClick={() => handleAction('/create-goal')}
            className="w-full bg-[#001B3D] text-white text-sm font-bold py-3 rounded-2xl hover:bg-[#002a5c] transition-all flex items-center justify-center gap-2"
          >
            + Create a Goal
          </button>
          <button
            onClick={() => handleAction('/funder')}
            className="w-full bg-accent text-white text-sm font-bold py-3 rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
          >
            Browse & Fund Goals
          </button>
          <button
            onClick={() => handleAction('/wealth')}
            className="w-full border border-slate-200 text-slate-700 text-sm font-bold py-3 rounded-2xl hover:bg-slate-50 transition-all"
          >
            Wealth Redistribution
          </button>
        </div>

        {!profile.isAuthenticated && (
          <div className="bg-accent/10 border border-accent/20 rounded-[2rem] p-6 space-y-3">
            <h3 className="text-sm font-black text-slate-900">Sign In to Get Started</h3>
            <p className="text-xs text-slate-500">Authenticate to access all protocol features.</p>
            <button
              onClick={() => signIn('message')}
              className="w-full bg-white border border-slate-200 text-sm font-bold py-2.5 rounded-xl hover:border-emerald-500 transition-all"
            >
              Sign Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
