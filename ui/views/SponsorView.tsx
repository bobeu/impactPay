"use client";

import React from 'react';
import { SponsorDashboard } from '@/components/SponsorDashboard';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function SponsorView() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
            <Shield className="w-3 h-3" /> Institutional Sponsoring
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sponsor Hub</h1>
          <p className="text-sm text-slate-500 font-medium">
            Directly fund scholarships and subscriptions for verified builders and students.
          </p>
        </header>

        <section>
          <SponsorDashboard />
        </section>
      </div>
    </div>
  );
}
