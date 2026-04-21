"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useImpactPay } from '@/contexts/ImpactPayContext';
import { GoalList } from '@/components/GoalList';
import { motion } from 'framer-motion';
import { PlusCircle, Wallet, ShieldCheck, Share2, ExternalLink } from 'lucide-react';
import AddressWrapper from './AddressFormatter/AddressWrapper';
import { useAccount } from 'wagmi';
import { IdentityVerificationCard } from '@/components/IdentityVerificationCard';
import { PhoneLookupCard } from '@/components/PhoneLookupCard';
import { VirtualCardPortal } from '@/components/VirtualCardPortal';
import { SponsorDashboard } from '@/components/SponsorDashboard';
import { DevSubscriptionCard } from '@/components/DevSubscriptionCard';

interface ProfileClientViewProps {
  address: string;
  ogImageUrl: string;
}

export default function ProfileClientView({ address, ogImageUrl }: ProfileClientViewProps) {
  const { userGoals } = useImpactPay();
  const { address: connectedAddress } = useAccount();
  const isOwner = connectedAddress?.toLowerCase() === address.toLowerCase();
  
  // const profileGoals = goals.filter(g => g.common.creator.toLowerCase() === address.toLowerCase());
  const shareText = encodeURIComponent(`Check out my verified impact on ImpactPay! 🌍💚\n${window.location.href}`);
  const xShareLink = `https://twitter.com/intent/tweet?text=${shareText}`;
  const verifyLink = `/verify/${address}`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-6 sm:py-12 px-4 pb-24">
      <div className="max-w-2xl w-full space-y-8">
        
        {/* Profile Card */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-[2.5rem] p-6 sm:p-10">
          <header className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Public Profile</h1>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full font-mono text-[11px] text-slate-500 border border-slate-200">
                <Wallet className="w-3.5 h-3.5" />
                <AddressWrapper 
                  display={true}
                  account={address}
                  copyIconSize='6'
                  size={6}
                  overrideClassName='text-slate-500 font-mono text-[11px]'
                />
              </div>
            </div>
            
            <div className="sm:w-auto space-y-4">
              <a
                href={xShareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-2.5 px-5 rounded-2xl hover:bg-slate-800 transition shadow-lg shadow-slate-200"
              >
                <Share2 className="w-4 h-4" /> Share
              </a>
              <Link to={verifyLink} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-2xl hover:border-slate-300 transition">
                <ShieldCheck className="w-4 h-4 text-accent" /> Verify
              </Link>
            </div>
          </header>

          <div className="mb-10 rounded-3xl overflow-hidden relative group shadow-inner bg-slate-50 border border-slate-100">
            <img 
              src={ogImageUrl} 
              alt="Social Card" 
              className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-700" 
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-3xl" />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Impact Goals Created</h3>
              <div className="h-px flex-1 bg-slate-100 mx-4" />
              <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{userGoals?.length || 0}</span>
            </div>

            {(userGoals && userGoals.length > 0) ? (
              <GoalList 
                goals={userGoals} 
                emptyMessage="No goals found for this address."
              />
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-16 flex flex-col items-center text-center space-y-6"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                  <PlusCircle className="w-10 h-10 text-slate-200" />
                </div>
                <div className="space-y-2 max-w-[240px]">
                  <h4 className="text-lg font-bold text-slate-800">No active goals yet</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Start your impact journey by creating a goal for yourself or your community.
                  </p>
                </div>
                <Link 
                  to="/create-goal" 
                  className="inline-flex items-center gap-2 bg-accent text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-colors uppercase tracking-widest text-[11px]"
                >
                  Create Your First Goal <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            )}
          </div>
        </div>

        {/* SocialConnect Info Block */}
        <section className="bg-white border border-accent/20 p-8 rounded-[2.5rem] flex flex-col sm:flex-row gap-6 items-center sm:items-start shadow-sm">
          <div className="w-14 h-14 bg-accent/10 text-accent rounded-full shrink-0 flex items-center justify-center shadow-inner">
             <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-xl font-black text-slate-900">Make your reputation portable</h3>
            <p className="text-sm text-slate-500 font-medium">
              Link your X or Instagram handle via SocialConnect to display your reputation across Web3 dApps.
            </p>
            <div className="pt-4">
              <button className="bg-slate-900 text-white font-bold text-xs py-3 px-6 rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest">
                Link with SocialConnect
              </button>
            </div>
          </div>
        </section>

        {isOwner && (
          <>
            <section className="grid grid-cols-1 gap-6">
                <IdentityVerificationCard address={connectedAddress} />
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

            <section className="grid grid-cols-1 gap-4">
                <VirtualCardPortal address={connectedAddress} />
                <SponsorDashboard />
            </section>
            
            <DevSubscriptionCard />
          </>
        )}
      </div>
    </div>
  );
}
