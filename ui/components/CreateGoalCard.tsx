"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { PlusCircle, CreditCard, Infinity, GraduationCap, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";

import { useUserProfile } from "@/contexts/UserProfileContext";
import { CreateBillGoal, GoalCategory, GoalTypeStr } from "@/lib/types";
import { useImpactPay } from "@/contexts/ImpactPayContext";
import { parseEther } from "viem";

export function CreateGoalCard() {
  // const { canCreateScholarship } = useUserProfile();
  const { createGoal } = useImpactPay();
  const navigate = useNavigate();
  const { address } = useAccount();
  const [goalTitle, setGoalTitle] = useState("");
  const [category, setCategory] = useState<GoalCategory>("Bill");
  const [amount, setAmount] = useState("50");
  const [message, setMessage] = useState("");
  const [showGateModal, setShowGateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!goalTitle.trim()) {
      setMessage("Add a short goal description.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("Preparing transaction...");
      
      const payload : CreateBillGoal = {
        targetAmount: parseEther(amount),
        description: goalTitle,
        extraInfo: "",
        goalType: category.toUpperCase() as GoalTypeStr,
        serviceType: category === "Bill" ? "General" : undefined,
        billServiceIndex: 0
      };
      
      await createGoal(payload);
      
      setGoalTitle("");
      setAmount("50");
      setMessage("Goal created successfully!");
      
      if (address) {
        navigate(`/profile/${address}`);
      }
    } catch (err: any) {
      setMessage(err.shortMessage || err.message || "Failed to create goal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col"
    >
      <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
        <div className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Create Impact Goal</h2>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Goal Description</label>
            <input
              className="h-12 w-full rounded-md border border-slate-200 px-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-slate-300"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="What do you need help with?"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Target Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input
                className="h-12 w-full rounded-md border border-slate-200 pl-8 pr-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-semibold"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {
                [
                  {
                    text: 'Default',
                    icon: <Infinity className="w-4 h-4" />,
                    className: cn("h-12 rounded-md text-[10px] font-semibold px-3 flex items-center justify-center gap-2 border transition-all",
                      category === "Default"
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    )
                  },
                  {
                    text: 'Bill',
                    icon: <CreditCard className="w-4 h-4" />,
                    className: cn("h-12 rounded-md text-[10px] font-semibold px-3 flex items-center justify-center gap-2 border transition-all",
                      category === "Bill"
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    )
                  },
                  {
                    text: 'Scholarship',
                    icon: <GraduationCap className="w-4 h-4" />,
                    className: cn("h-12 rounded-md text-[10px] font-semibold px-3 flex items-center justify-center gap-2 border transition-all relative overflow-hidden",
                      category === "Scholarship"
                        ? "border-accent bg-accent text-white"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    )
                  },
                ].map(({text, icon, className}) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => setCategory(text as GoalCategory)}
                    className={className}
                  >
                    { icon }
                    { text.toUpperCase() }
                  </button>
                ))
              }
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={isSubmitting}
          className="h-14 w-full rounded-[2.5rem] bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Processing..." : "Create Impact Goal"}
          {!isSubmitting && <CheckCircle2 className="w-4 h-4 text-accent" />}
        </button>

        <AnimatePresence>
          {message && (
            <motion.p 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="text-xs text-slate-500 font-medium text-center border-t border-slate-50 pt-3"
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showGateModal && (
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] px-4 pb-12 sm:pb-0">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-8 shadow-2xl space-y-6"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">Verification Required</h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Scholarship goals are gated to verified users. Complete biometric human verification to proceed.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  className="h-12 w-full rounded-md bg-primary text-white text-sm font-bold hover:bg-opacity-90 transition-all"
                  onClick={() => {
                    setShowGateModal(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Verify Now
                </button>
                <button 
                  className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600"
                  onClick={() => setShowGateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

