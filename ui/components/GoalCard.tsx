"use client";

import React, { useState } from "react";
import Image from "next/image";
import { GetGoal, GoalStatus, GoalType } from "../lib/types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Target, 
  Users, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  ArrowRight
} from "lucide-react";
import { formatEther } from "viem";

interface GoalCardProps {
  goal: GetGoal;
  onClick?: () => void;
}

export function GoalCard({ goal, onClick }: GoalCardProps) {
  const { common, bill, scholarship, funders } = goal;
  
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

  const getGoalTypeLabel = (type: GoalType) => {
    switch (type) {
      case GoalType.BILL: return "Bill Assistance";
      case GoalType.SCHOLARSHIP: return "Scholarship";
      default: return "General Fund";
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group cursor-pointer bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {getGoalTypeLabel(common.goalType)}
          </span>
          <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-relaxed h-10">
            {common.description}
          </h3>
        </div>
        <div className={cn(
          "px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1",
          getStatusColor(common.status)
        )}>
          {getStatusIcon(common.status)}
          {GoalStatus[common.status]}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-end text-[11px]">
          <div className="flex flex-col">
            <span className="text-slate-400 font-medium uppercase tracking-tighter">Raised</span>
            <span className="text-slate-900 font-bold">{formatEther(common.raisedAmount)} CELO</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-slate-400 font-medium uppercase tracking-tighter">Target</span>
            <span className="text-slate-600 font-semibold">{formatEther(common.targetAmount)} CELO</span>
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
        <div className="flex -space-x-2">
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
        
        <div className="flex items-center gap-1 text-[11px] font-bold text-accent group-hover:gap-2 transition-all">
          View details <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </motion.div>
  );
}
