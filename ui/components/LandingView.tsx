"use client";

import React from "react";
import { Stats } from "../lib/types";
import { motion } from "framer-motion";
import { 
  Heart, 
  HandHelping, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Globe,
  ArrowRight,
  Verified
} from "lucide-react";
import { formatEther } from "viem";

interface LandingViewProps {
  stats: Stats;
  onEnterAsFunder: () => void;
  onEnterAsHelpSeeker: () => void;
}

export function LandingView({ stats, onEnterAsFunder, onEnterAsHelpSeeker }: LandingViewProps) {
  return (
    <div className="space-y-10 py-4">
      {/* Hero Section */}
      <section className="relative text-center space-y-5 bg-gradient-to-b from-slate-900 to-slate-800 rounded-[2.5rem] px-6 py-10 shadow-2xl shadow-slate-300 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#10B981]/20 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm"
        >
          <Verified className="w-6 h-6" /> Blockchain Verified Impact
        </motion.div>
        <div className="space-y-3">
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl font-black text-white tracking-tighter"
          >
            ImpactPay
          </motion.h2>
          <h1 className="text-2xl font-bold text-slate-300 leading-tight">
            Direct Help. <span className="text-accent decoration-emerald-400/40 underline underline-offset-4">Verified Stories.</span>
          </h1>
        </div>
        <p className="text-sm text-slate-300 font-medium max-w-xs mx-auto">
          The most transparent and verified way to support essential needs and education on Celo.
        </p>
      </section>

      {/* Global Stats Grid */}
      <section className="grid grid-cols-2 gap-3">
        <StatCard 
          icon={<TrendingUp className="w-4 h-4 text-accent"/>}
          label="Total Raised"
          value={`${formatEther(stats.totalRaised)} USDm`}
          subValue="On-chain transparency"
        />
        <StatCard 
          icon={<Users className="w-4 h-4 text-blue-500"/>}
          label="Total Funders"
          value={stats.totalFunders.toString()}
          subValue="Growing community"
        />
        <StatCard 
          icon={<Heart className="w-4 h-4 text-rose-500"/>}
          label="Active Goals"
          value={stats.activeGoals.toString()}
          subValue="Waiting for support"
        />
        <StatCard 
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500"/>}
          label="Success Rate"
          value={`${stats.totalGoals > 0 ? Math.round(( (stats.totalGoals - stats.activeGoals) / stats.totalGoals) * 100) : 0}%`}
          subValue="Goals fulfilled"
        />
      </section>

      {/* Entry Points */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">How would you like to enter?</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onEnterAsFunder}
            className="group relative overflow-hidden bg-slate-900 p-6 rounded-[2rem] text-left shadow-xl shadow-slate-200 flex items-center justify-between"
          >
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                <Heart className="w-3 h-3 fill-emerald-400" /> Fund a goal
              </div>
              <h4 className="text-xl font-bold text-white">I want to give back</h4>
              <p className="text-xs text-slate-400">Browse verified bills and scholarships</p>
            </div>
            <div className="relative z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-accent transition-colors">
              <ArrowRight className="w-5 h-5" />
            </div>
            {/* Design elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -mr-10 -mt-10 blur-2xl" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onEnterAsHelpSeeker}
            className="group relative overflow-hidden bg-white border border-slate-200 p-6 rounded-[2rem] text-left shadow-sm flex items-center justify-between"
          >
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2 text-accent text-[10px] font-bold uppercase tracking-widest">
                <HandHelping className="w-3 h-3" /> Need Assistance
              </div>
              <h4 className="text-xl font-bold text-slate-900">I need help</h4>
              <p className="text-xs text-slate-500">Create a goal for your community</p>
            </div>
            <div className="relative z-10 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
              <ArrowRight className="w-5 h-5" />
            </div>
          </motion.button>
        </div>
      </section>

      {/* Trust Badge */}
      <div className="pt-4 flex flex-col items-center gap-3 opacity-60">
        <div className="flex -space-x-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
          ))}
          <div className="w-8 h-8 rounded-full border-2 border-white bg-accent flex items-center justify-center text-[10px] font-bold text-white">
            +1k
          </div>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trusted by the Celo Community</p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string, subValue: string }) {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
      </div>
      <div className="text-lg font-black text-slate-900">{value}</div>
      <div className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter mt-1">{subValue}</div>
    </motion.div>
  );
}
