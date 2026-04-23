"use client";

import React, { useState } from "react";
import { GetGoal, GoalStatus, GoalType, Milestone } from "../lib/types";
import { useImpactPay } from "../contexts/ImpactPayContext";
import { useAccount } from "wagmi";
import { formatEther, parseEther, hexToString } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Target, 
  Heart, 
  Clock, 
  Users, 
  ShieldCheck, 
  FileText, 
  Info,
  Calendar,
  Wallet,
  ArrowRight
} from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "sonner";

interface GoalDetailsModalProps {
  goal: GetGoal | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GoalDetailsModal({ goal, isOpen, onClose }: GoalDetailsModalProps) {
  const { fundGoal, reactivateGoal, toggleFlagGoal, refundScholarship, relayBillFundsToService, claimScholarshipFunds, claimFund } = useImpactPay();
  const { address } = useAccount();
  const [fundingAmount, setFundingAmount] = useState<string>("");
  const [extraInfo, setExtraInfo] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!goal) return null;

  const { common, bill, scholarship, funders } = goal;
  const isCreator = address?.toLowerCase() === common.creator.toLowerCase();
  
  const userFunder = funders.find(f => f.id.toLowerCase() === address?.toLowerCase());
  const hasFlagged = userFunder?.hasFlagged ?? false;
  
  const handleFund = async () => {
    if (!fundingAmount || isNaN(Number(fundingAmount))) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      setIsSubmitting(true);
      await fundGoal(common.id, parseEther(fundingAmount), extraInfo);
      setFundingAmount("");
      setExtraInfo("");
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMilestoneLabel = (m: Milestone) => Milestone[m] || "None";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                   {common.goalType === GoalType.BILL ? <FileText className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Goal Details</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{common.id.toString()}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Description Section */}
              <section className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Story</h3>
                <p className="text-slate-700 leading-relaxed font-medium break-words">
                  {hexToString(common.description as unknown as `0x${string}`)}
                </p>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                   <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                      <Clock className="w-3.5 h-3.5" />
                      Status: {GoalStatus[common.status]}
                   </div>
                   <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {common.flagsCount} Flags
                   </div>
                </div>
              </section>

              {/* Progress & Stats */}
              <section className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Raised</span>
                  <div className="text-xl font-bold text-slate-900">{formatEther(common.raisedAmount)} USDm</div>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Target</span>
                  <div className="text-xl font-bold text-slate-600">{formatEther(common.targetAmount)} USDm</div>
                </div>
                {common.goalType === GoalType.BILL && (
                  <div className="col-span-2 pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Service</span>
                    <p className="text-xs font-bold text-slate-700">{bill.serviceType || 'Not specified'}</p>
                  </div>
                )}
                {common.goalType === GoalType.SCHOLARSHIP && (
                   <>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Milestone</span>
                      <div className="text-xs font-bold text-slate-700">{getMilestoneLabel(scholarship.milestone)}</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Disputed</span>
                      <div className={cn("text-xs font-bold", scholarship.disputed ? "text-red-500" : "text-emerald-500")}>
                        {scholarship.disputed ? 'Yes' : 'No'}
                      </div>
                    </div>
                   </>
                )}
              </section>

              {/* Funders List */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Donors ({funders.length})</h3>
                  <Users className="w-4 h-4 text-slate-300" />
                </div>
                
                {funders.length > 0 ? (
                  <div className="space-y-3">
                    {funders.map((funder, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                             {funder.id.slice(2, 4).toUpperCase()}
                           </div>
                           <div>
                             <p className="text-[11px] font-bold text-slate-800">{funder.id.slice(0, 6)}...{funder.id.slice(-4)}</p>
                             <p className="text-[10px] text-slate-400 font-medium italic">"{funder.extraInfo || 'No message'}"</p>
                           </div>
                        </div>
                        <div className="text-[11px] font-bold text-emerald-600">
                          +{formatEther(funder.amount)} USDm
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                    <Heart className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Be the first to donate</p>
                  </div>
                )}
              </section>

              {/* Action Area */}
              {common.status === GoalStatus.OPEN && !isCreator && (
                <section className="space-y-3 bg-[#001B3D]/5 p-4 rounded-xl border border-[#001B3D]/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-[#001B3D]" />
                    <h3 className="text-[11px] font-bold text-[#001B3D] uppercase tracking-widest">Fund this Impact</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <input 
                        type="number" 
                        placeholder="Amount in USDm"
                        className="w-full px-3 py-2.5 pr-20 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[#001B3D] outline-none font-bold"
                        value={fundingAmount}
                        onChange={(e) => setFundingAmount(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const remaining = common.targetAmount - common.raisedAmount;
                          setFundingAmount(formatEther(remaining > 0n ? remaining : 0n));
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-100 text-[10px] font-bold text-slate-600 rounded hover:bg-slate-200 transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Add a support message (optional)"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[#001B3D] outline-none"
                      value={extraInfo}
                      onChange={(e) => setExtraInfo(e.target.value)}
                    />
                    <button 
                      onClick={handleFund}
                      disabled={isSubmitting}
                      className="w-full py-3 bg-[#001B3D] text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#002a5c] transition-colors shadow-lg shadow-slate-300 active:scale-[0.98]"
                    >
                      {isSubmitting ? 'Sending...' : 'Donate Now'}
                      {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </section>
              )}

              {/* Creator Actions */}
              {isCreator && (
                 <section className="p-4 bg-slate-900 rounded-xl space-y-3 shadow-lg">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Creator Tools</h4>
                    <div className="grid grid-cols-2 gap-2">
                       {common.status === GoalStatus.CANCELED && (
                          <button 
                            onClick={() => reactivateGoal(common.id)}
                            className="bg-white/10 text-white text-[11px] font-bold py-2.5 rounded-lg hover:bg-white/20 transition-colors"
                          >
                             Reactivate
                          </button>
                       )}
                       {common.status === GoalStatus.RAISED && common.goalType === GoalType.BILL && (
                          <button 
                            onClick={() => relayBillFundsToService(common.id, common.raisedAmount)}
                            className="bg-accent text-white text-[11px] font-bold py-2.5 rounded-lg hover:bg-emerald-600 transition-colors"
                          >
                             Relay Funds
                          </button>
                       )}
                    </div>
                    {common.raisedAmount > common.withdrawnAmount && (
                        <div className="pt-2 border-t border-slate-800">
                          <button 
                            onClick={async () => {
                              if (common.goalType === GoalType.BILL || common.goalType === GoalType.DEFAULT) {
                                await claimFund(common.id);
                              } else {
                                if (address) await claimScholarshipFunds(common.id, address);
                              }
                            }}
                            className="w-full py-2.5 bg-emerald-500 text-white font-bold text-[12px] rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <Wallet className="w-4 h-4" /> Claim Funds to Wallet
                          </button>
                        </div>
                    )}
                 </section>
              )}
              
              {!isCreator && common.status === GoalStatus.OPEN && (
                 <section className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                       <button 
                          onClick={() => toggleFlagGoal(common.id)}
                          disabled={hasFlagged}
                          className={cn("w-full py-2.5 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 rounded-xl transition-all border", 
                            hasFlagged 
                            ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed" 
                            : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100")}
                       >
                         <Info className="w-3.5 h-3.5" /> Flag Goal
                       </button>

                       <button 
                          onClick={() => toggleFlagGoal(common.id)}
                          disabled={!hasFlagged}
                          className={cn("w-full py-2.5 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 rounded-xl transition-all border", 
                            !hasFlagged 
                            ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed" 
                            : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200")}
                       >
                         <ShieldCheck className="w-3.5 h-3.5" /> Unflag
                       </button>
                    </div>

                    {common.goalType === GoalType.SCHOLARSHIP && (
                       <button 
                          onClick={() => refundScholarship(common.id)}
                          className="w-full py-2.5 bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-bold rounded-xl hover:bg-blue-100 transition-colors"
                       >
                         Refund Scholarship
                       </button>
                    )}
                 </section>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
