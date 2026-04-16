"use client";

import { useMemo } from "react";
import { TrendingUp, Award, Target, Info } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  totalFundedUsd?: number;
  reputationScore?: number;
  className?: string;
};

export function ImpactDashboard({ totalFundedUsd = 0, reputationScore = 0, className }: Props) {
  const clampedReputation = useMemo(
    () => Math.max(0, Math.min(reputationScore, 1000)),
    [reputationScore],
  );
  const progress = clampedReputation / 1000;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col shadow-sm", className)}
    >
      <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Your Trust Impact</h2>
        </div>
        <div className="bg-white border border-slate-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <Award className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-bold text-primary">Level 3</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">Total Funded</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary">${totalFundedUsd.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-accent">USD</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">Trust Score</span>
            <span className="text-2xl font-bold text-primary">{Math.round(progress * 100)}/100</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-700">Reputation Progress</span>
              <Info className="w-3 h-3 text-slate-300" />
            </div>
            <span className="text-xs font-bold text-accent">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-accent"
            />
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-100 rounded-md">
          <Target className="w-4 h-4 text-slate-400 mt-0.5" />
          <p className="text-[10px] leading-relaxed text-slate-500 font-medium uppercase tracking-wide">
            Verified, essential goals increase your score faster. Funded goals are monitored by SocialConnect.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
