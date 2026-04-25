"use client";

import React, { useState } from "react";
// import Image from "next/image";
import { GetGoal, GoalStatus, GoalType } from "../lib/types";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";
import { 
  Heart, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ArrowRight
} from "lucide-react";
import { formatEther, Hex, hexToString } from "viem";
import { useImpactPay } from "@/contexts/ImpactPayContext";
import { useAccount } from "wagmi";

interface GoalCardProps {
  goal: GetGoal;
  onClick?: () => void;
  isFunderView?: boolean;
}

export function GoalCard({ goal, onClick, isFunderView }: GoalCardProps) {
  // const { claimScholarshipFunds, claimFund, toggleFlagGoal, refundScholarship  } = useImpactPay();
  const { address } = useAccount();
  const { common, bill, funders } = goal;
  const [showFunders, setShowFunders] = useState(false);

  const isCreator = address?.toLowerCase() === common.creator.toLowerCase();
  
  const progress = Number(common.targetAmount) > 0 
    ? Number(common.raisedAmount) / Number(common.targetAmount) 
    : 0;

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.OPEN: return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case GoalStatus.RAISED: return "text-blue-600 bg-blue-50 border-blue-100";
      case GoalStatus.FULFILLED: return "text-purple-600 bg-purple-50 border-purple-100";
      case GoalStatus.CANCELED: return "text-slate-500 bg-slate-50 border-slate-100";
      default: return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

  const getStatusIcon = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.OPEN: return <Clock className="w-3 h-3" />;
      case GoalStatus.RAISED: return <CheckCircle2 className="w-3 h-3" />;
      case GoalStatus.FULFILLED: return <Heart className="w-3 h-3" />;
      case GoalStatus.CANCELED: return <XCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const getGoalTypeLabel = (gType: GoalType) => {
    switch (gType) {
      case GoalType.SCHOLARSHIP: return "Scholarship";
      default: 
        const res = hexToString(bill.serviceType as unknown as Hex);
        if (res === '') return 'General';
        else return res;
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group cursor-pointer bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-300 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="space-y-1">
        <div className="flex justify-between items-start items-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            {getGoalTypeLabel(common.goalType)}
          </span>

          <div className={cn(
            "px-2 py-1 rounded-full text-[9px] font-bold border flex items-center gap-1",
            getStatusColor(common.status)
            )}
          >
            {getStatusIcon(common.status)}
            {GoalStatus[common.status]}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-end text-[11px]">
          <div className="flex flex-col">
            <span className="text-slate-400 font-medium uppercase tracking-tighter">Raised</span>
            <span className="text-slate-900 font-bold">{formatEther(common.raisedAmount).toFixed(4)} USDm</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-slate-400 font-medium uppercase tracking-tighter">Target</span>
            <span className="text-slate-600 font-semibold">{formatEther(common.targetAmount).toFixed(4)} USDm</span>
          </div>
        </div>
        
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress * 100, 100)}%` }}
            className={cn(
              "h-full rounded-full transition-colors duration-500",
              progress >= 1 ? "bg-[#35D07F]" : "bg-accent"
            )}
          />
        </div>
        
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
          <span>{Math.round(progress * 100)}% funded</span>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{funders.length} donors</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
        <div className="flex -space-x-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowFunders(!showFunders); }}>
          {funders.slice(0, 3).map((f, i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 overflow-hidden">
              {f.id.slice(2, 4).toUpperCase()}
            </div>
          ))}
          {funders.length > 3 && (
            <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[8px] font-bold text-slate-400">
              +{funders.length - 3}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            onClick={(e) => { e.stopPropagation(); if(onClick) onClick(); }}
            className="flex items-center gap-1 text-[11px] font-bold text-accent hover:text-emerald-700 transition-all cursor-pointer"
          >
            View details <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>



      {showFunders && (
        <div className="pt-4 border-t border-slate-100 text-xs" onClick={(e) => e.stopPropagation()}>
          <h4 className="font-bold text-slate-700 mb-2">Funders</h4>
          {funders.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
              {funders.map((f, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-[10px]">
                  <span className="font-mono text-slate-600 truncate mr-2" title={f.id}>{f.id}</span>
                  <span className="font-bold text-accent whitespace-nowrap">{Number(formatEther(f.amount)).toFixed(4)} USDm</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-slate-400">No funders yet.</span>
          )}
        </div>
      )}

      {isFunderView && (
        <div className="pt-3 border-t border-slate-50 flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
            className="flex-1 py-1.5 px-3 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors flex justify-center items-center gap-1.5"
          >
            Fund Goal <Heart className="w-3 h-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
