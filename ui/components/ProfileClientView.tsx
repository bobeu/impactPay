"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useImpactPay } from '@/contexts/ImpactPayContext';
import { GoalList } from '@/components/GoalList';
import { motion } from 'framer-motion';
import { PlusCircle, Verified, Fingerprint, ExternalLink, Share, User2 } from 'lucide-react';
import AddressWrapper from './AddressFormatter/AddressWrapper';
import { useAccount } from 'wagmi';
import { IdentityVerificationCard } from '@/components/IdentityVerificationCard';
import { PhoneLookupCard } from '@/components/PhoneLookupCard';
import { VirtualCardPortal } from '@/components/VirtualCardPortal';
import { DevSubscriptionCard } from '@/components/DevSubscriptionCard';

interface ProfileClientViewProps {
  address: string;
  ogImageUrl: string;
}

export default function ProfileClientView({ address, ogImageUrl }: ProfileClientViewProps) {
  const { userGoals } = useImpactPay();
  const { address: connectedAddress } = useAccount();
  const isOwner = connectedAddress?.toLowerCase() === address.toLowerCase();
  
  const activeGoals = userGoals ? userGoals.filter(g => g.common.status === 0 || g.common.status === 1) : [];
  const pastGoals = userGoals ? userGoals.filter(g => g.common.status === 2 || g.common.status === 3) : [];
  
  // const profileGoals = goals.filter(g => g.common.creator.toLowerCase() === address.toLowerCase());
  const shareText = encodeURIComponent(`Check out my verified impact on ImpactPay! 🌍💚\n${window.location.href}`);
  const xShareLink = `https://twitter.com/intent/tweet?text=${shareText}`;
  const verifyLink = `/verify/${address}`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-6 sm:py-12 px-4 pb-24">
      <div className="max-w-2xl w-full space-y-8">
        
        {/* Profile Card */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-[2.5rem] p-6 sm:p-10">
          {/* ── Compact profile header ── */}
          <header className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-inner">
                <User2 className="w-8 h-8 text-slate-400" />
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">On-chain Profile</p>
                <div className="flex items-center bg-slate-50 rounded-2xl px-3 py-1.5 border border-slate-100 shadow-sm">
                  <AddressWrapper
                    display={true}
                    account={address}
                    copyIconSize='5'
                    size={5}
                    overrideClassName='text-slate-600 font-mono text-[12px] font-bold'
                  />
                </div>
              </div>
            </div>

            {/* Action buttons — centered on mobile */}
            <div className="flex items-center gap-3 shrink-0">
              <a
                href={xShareLink}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on X"
                className="flex-1 sm:flex-none h-11 px-6 sm:px-0 sm:w-11 flex items-center justify-center rounded-2xl bg-[#001B3D] text-white hover:bg-[#002a5c] transition-all shadow-md active:scale-95"
              >
                <Share className="w-4 h-4" />
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider sm:hidden">Share Profile</span>
              </a>
              <Link
                to={verifyLink}
                title="Verify identity"
                className="flex-1 sm:flex-none h-11 px-6 sm:px-0 sm:w-11 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <Verified className="w-5 h-5 text-accent" />
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider sm:hidden text-slate-600">Verified</span>
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

          <div className="space-y-12">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Goals</h3>
                <div className="h-px flex-1 bg-slate-100 mx-4" />
                <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{activeGoals.length}/3</span>
              </div>

              {(activeGoals && activeGoals.length > 0) ? (
                <GoalList 
                  goals={activeGoals} 
                  emptyMessage="No active goals found for this address."
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
                      Start your impact journey by creating a goal for yourself or your community. Max 3 active.
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

            {pastGoals.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Past Goals</h3>
                  <div className="h-px flex-1 bg-slate-100 mx-4" />
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{pastGoals.length}</span>
                </div>
                <GoalList 
                  goals={pastGoals} 
                  emptyMessage="No past goals found."
                />
              </div>
            )}
          </div>
        </div>

        {/* SocialConnect Info Block */}
        <section className="bg-white p-6 rounded-[2.5rem] flex flex-col sm:flex-row gap-5 items-center sm:items-start shadow-sm">
          <div className="w-12 h-12 bg-[#001B3D]/8 rounded-2xl shrink-0 flex items-center justify-center">
            <Fingerprint className="w-6 h-6 text-[#001B3D]" />
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-base font-black text-slate-900">Make your reputation portable</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Link your X or Instagram handle via SocialConnect to display your reputation across Web3 dApps.
            </p>
            <div className="pt-3">
              <button className="bg-[#001B3D] text-white font-bold text-[11px] py-2.5 px-5 rounded-xl hover:bg-[#002a5c] transition-all uppercase tracking-widest shadow-sm">
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
                        <Link to="/create-goal" className="flex items-center justify-center w-full py-3 bg-[#001B3D] text-white font-bold rounded-2xl text-[11px] uppercase tracking-widest hover:bg-[#002a5c] transition-colors shadow-lg shadow-slate-300">
                            Create Goal
                        </Link>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4">
                <VirtualCardPortal address={connectedAddress} />
            </section>
            
            <DevSubscriptionCard />
          </>
        )}
      </div>
    </div>
  );
}
