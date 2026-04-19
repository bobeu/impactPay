"use client";

import React from 'react';
import { CreateGoalCard } from '@/components/CreateGoalCard';
import { Target, Info } from 'lucide-react';

export default function CreateGoalView() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-accent text-[10px] font-bold uppercase tracking-widest">
            <Target className="w-3 h-3" /> New Impact Goal
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create a Goal</h1>
          <p className="text-sm text-slate-500 font-medium">
            Define what you need help with. ImpactPay ensures transparency and proof of fulfillment.
          </p>
        </header>

        <section className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
             <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-900">How it works</h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              Once you create a goal, it will appear on the global leaderboard. When someone funds it, you'll need to provide proof of fulfillment to unlock the high-tier reputation boost.
            </p>
          </div>
        </section>

        <section>
          <CreateGoalCard />
        </section>
      </div>
    </div>
  );
}
