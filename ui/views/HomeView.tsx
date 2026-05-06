"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useImpactPay } from '@/contexts/ImpactPayContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { LandingView } from '@/components/LandingView';
import { useNavigate } from 'react-router-dom';
import Image from 'next/image';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldCheck, Mail, MessageSquare, Smartphone, Loader2, ArrowRight } from 'lucide-react';

export default function HomeView() {
  const { isConnected, address } = useAccount();
  const { connect } = useConnect();
  const { stats } = useImpactPay();
  const { profile, signIn } = useUserProfile();
  const navigate = useNavigate();
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [signingIn, setSigningIn] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum?.isMiniPay) {
      setIsMiniPay(true);
      if (!isConnected) {
        connect({ connector: injected({ target: 'metaMask' }) });
      }
    }
  }, [isConnected, connect]);

  const handleAction = (route: string) => {
    if (!profile.isAuthenticated) {
      toast.error("Please sign in first");
      return;
    }
    navigate(route);
  };

  const handleSignIn = async (method: 'message' | 'social' | 'email') => {
    setSigningIn(method);
    try {
      await signIn(method);
      toast.success("Signed in successfully!");
    } catch (err: any) {
      toast.error(err.message || "Sign in failed");
    } finally {
      setSigningIn(null);
    }
  };

  // Protected section overhaul
  if (!isConnected || !address || !profile.isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-2xl shadow-slate-200 border border-slate-100 space-y-8 relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
          
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-slate-200 overflow-hidden relative group">
              <Image 
                src="/logo.png" 
                alt="ImpactPay Logo" 
                width={80} 
                height={80}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Welcome to ImpactPay
              </h1>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                Secure your on-chain reputation and start supporting verified impact goals on Celo.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {!isConnected ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <Shield className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900">Wallet Connection Required</p>
                    <p className="text-[10px] text-slate-400">Connect to access the protocol</p>
                  </div>
                </div>
                
                {isMiniPay ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 text-accent animate-spin" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] animate-pulse">
                      Connecting MiniPay...
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => connect({ connector: injected() })}
                    className="w-full bg-[#001B3D] text-white font-bold py-4 rounded-2xl hover:bg-[#002a5c] transition-all shadow-xl shadow-slate-300 flex items-center justify-center gap-2 group"
                  >
                    Connect Wallet <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-emerald-900">Wallet Connected</p>
                    <p className="text-[10px] text-emerald-600 truncate">{address.slice(0, 6)}...{address.slice(-4)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Verify Ownership</p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      disabled={!!signingIn}
                      onClick={() => handleSignIn('message')}
                      className="w-full bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 hover:border-accent hover:bg-slate-50 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                        {signingIn === 'message' ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : <MessageSquare className="w-5 h-5 text-slate-400 group-hover:text-accent" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Sign Message</p>
                        <p className="text-[10px] text-slate-400">Standard cryptographic proof</p>
                      </div>
                    </button>

                    {!isMiniPay && (
                      <button
                        disabled={!!signingIn}
                        onClick={() => handleSignIn('email')}
                        className="w-full bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 hover:border-accent hover:bg-slate-50 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                          {signingIn === 'email' ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : <Mail className="w-5 h-5 text-slate-400 group-hover:text-accent" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Email Sign-in</p>
                          <p className="text-[10px] text-slate-400">Secure access via Privy</p>
                        </div>
                      </button>
                    )}

                    <button
                      disabled={!!signingIn}
                      onClick={() => handleSignIn('social')}
                      className="w-full bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 hover:border-accent hover:bg-slate-50 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                        {signingIn === 'social' ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : <Smartphone className="w-5 h-5 text-slate-400 group-hover:text-accent" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Social Connect</p>
                        <p className="text-[10px] text-slate-400">Link your identity on Celo</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 text-center">
            <p className="text-[10px] text-slate-400 font-medium italic">
              * Protected by decentralized proof of ownership.
            </p>
          </div>
        </motion.div>
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
            className="w-full bg-slate-900 text-white text-sm font-bold py-3 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
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
