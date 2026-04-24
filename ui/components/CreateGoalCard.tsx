"use client";

import { useState } from "react";
import { PlusCircle, CreditCard, Infinity, GraduationCap, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";

import { CreateBillGoal, GoalCategory, GoalTypeStr } from "@/lib/types";
import { useImpactPay } from "@/contexts/ImpactPayContext";
import { parseEther } from "viem";

// All valid serviceTypes for Bill goals.
// "scholarship" is intentionally excluded — selecting it auto-switches category.
const BILL_SERVICE_TYPES = [
  { value: "subscription",  label: "Subscription" },
  { value: "electricity",   label: "Electricity" },
  { value: "hospital",      label: "Hospital / Medical" },
  { value: "accommodation", label: "Accommodation" },
  { value: "schoolfees",    label: "School Fees" },
  { value: "examination",   label: "Examination" },
  { value: "careergrowth",  label: "Career Growth" },
  { value: "bootcamps",     label: "Bootcamps" },
];

// The "Scholarship" shortcut inside Bill serviceType selector
// (maps to switching the category entirely)
const SCHOLARSHIP_TRIGGER = "scholarship";

type FormState = {
  description: string;
  amount: string;
  extraInfo: string;
  serviceType: string;
  category: GoalCategory;
};

const INITIAL: FormState = {
  description: "",
  amount: "50",
  extraInfo: "",
  serviceType: BILL_SERVICE_TYPES[0].value,
  category: "Bill",
};

const EXTRA_INFO_WORD_LIMIT = 500;

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export function CreateGoalCard() {
  const { 
    createGoal, 
    goalIdsAndState: {
      billListingFee,
      scholarshipListingFee,
      defaultListingFee
    } 
  } = useImpactPay();
  const navigate = useNavigate();
  const { address } = useAccount();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const extraInfoWordCount = countWords(form.extraInfo);
  const isOverLimit = extraInfoWordCount > EXTRA_INFO_WORD_LIMIT;

  const setCategory = (cat: GoalCategory) =>
    setForm(f => ({ ...f, category: cat }));

  const setField = <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) => setForm(f => ({ ...f, [key]: value }));

  // When a service type is selected from the dropdown,
  // if "scholarship" is chosen switch category automatically.
  const handleServiceTypeChange = (value: string) => {
    if (value === SCHOLARSHIP_TRIGGER) {
      setCategory("Scholarship");
      // Reset serviceType back to first real option
      setField("serviceType")(BILL_SERVICE_TYPES[0].value);
    } else {
      setField("serviceType")(value);
    }
  };

  const validate = (): string | null => {
    if (!form.description.trim()) return "Please add a goal description.";
    const parsedAmount = Number(form.amount);
    if (!form.amount || isNaN(parsedAmount) || parsedAmount <= 0)
      return "Please enter a valid target amount greater than 0.";
    if (form.category === "Bill" && !form.serviceType)
      return "Please select a service type.";
    if (isOverLimit)
      return `Extra info exceeds ${EXTRA_INFO_WORD_LIMIT}-word limit (currently ${extraInfoWordCount} words).`;
    return null;
  };

  const submit = async () => {
    const error = validate();
    if (error) {
      setIsError(true);
      setMessage(error);
      return;
    }

    try {
      setIsSubmitting(true);
      setIsError(false);
      setMessage("Preparing transaction…");

      const payload: CreateBillGoal = {
        targetAmount: parseEther(form.amount),
        description: form.description,
        extraInfo: form.extraInfo,
        goalType: form.category.toUpperCase() as GoalTypeStr,
        // Only relevant for Bill; ignored for others
        serviceType: form.category === "Bill" ? form.serviceType : undefined,
        // Hard-coded to 0 until providers are registered on-chain
        billServiceIndex: form.category === "Bill" ? 0 : undefined,
      };

      await createGoal(payload);

      setForm(INITIAL);
      setIsError(false);
      setMessage("Goal created successfully! 🎉");

      if (address) {
        setTimeout(() => navigate(`/profile/${address}`), 1200);
      }
    } catch (err: any) {
      setIsError(true);
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
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-gradient-to-r from-[#001B3D]/5 to-transparent">
        <PlusCircle className="w-5 h-5 text-[#001B3D]" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">Create Impact Goal</h2>
      </div>

      <div className="p-6 space-y-5">
        {/* ── Fee Information ── */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between mb-2">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Listing Fee</p>
            <p className="text-[10px] font-medium text-slate-500">Payable in USDm</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-slate-600">
              ${Number(
                form.category === "Bill" ? (billListingFee ? Number(billListingFee) / 1e18 : 0) :
                form.category === "Scholarship" ? (scholarshipListingFee ? Number(scholarshipListingFee) / 1e18 : 0) :
                (defaultListingFee ? Number(defaultListingFee) / 1e18 : 0)
              ).toFixed(2)}
            </span>
            <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">USDm</span>
          </div>
        </div>

        {/* ── Category Selector ── */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Goal Category</label>
          <div className="grid grid-cols-3 gap-2">
            {(["Default", "Bill", "Scholarship"] as GoalCategory[]).map((cat) => {
              const Icon =
                cat === "Default" ? Infinity :
                cat === "Bill"    ? CreditCard :
                GraduationCap;
              const active = form.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "h-12 rounded-xl text-[10px] font-bold px-3 flex items-center justify-center gap-1.5 border transition-all",
                    active
                      ? "border-[#001B3D] bg-[#001B3D] text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Goal Description ── */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
            Goal Description
          </label>
          <input
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 focus:border-[#001B3D] focus:ring-2 focus:ring-[#001B3D]/20 outline-none transition-all placeholder:text-slate-300"
            value={form.description}
            onChange={(e) => setField("description")(e.target.value)}
            placeholder="What do you need help with?"
          />
        </div>

        {/* ── Target Amount ── */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
            Target Amount (USDm)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm select-none">$</span>
            <input
              type="number"
              min="0"
              step="any"
              className="h-12 w-full rounded-xl border border-slate-200 pl-8 pr-4 text-sm text-slate-900 focus:border-[#001B3D] focus:ring-2 focus:ring-[#001B3D]/20 outline-none transition-all font-semibold"
              value={form.amount}
              onChange={(e) => setField("amount")(e.target.value)}
              placeholder="50"
            />
          </div>
        </div>

        {/* ── Service Type (Bill only) ── */}
        <AnimatePresence>
          {form.category === "Bill" && (
            <motion.div
              key="serviceType"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1.5 overflow-hidden"
            >
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                Service Type
              </label>
              <div className="relative">
                <select
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 pr-10 text-sm font-medium text-slate-700 focus:border-[#001B3D] focus:ring-2 focus:ring-[#001B3D]/20 outline-none transition-all appearance-none bg-white"
                  value={form.serviceType}
                  onChange={(e) => handleServiceTypeChange(e.target.value)}
                >
                  {BILL_SERVICE_TYPES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                  {/* Scholarship shortcut — selecting this auto-switches category */}
                  <option value={SCHOLARSHIP_TRIGGER} className="text-accent font-bold">
                    Scholarship (switch category)
                  </option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <p className="text-[10px] text-slate-400 ml-1">
                Selecting "Scholarship" will switch the category automatically.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Extra Info (optional, 500-word limit) ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Additional Info
              <span className="normal-case text-slate-300 ml-1">(optional)</span>
            </label>
            <span className={cn(
              "text-[10px] font-bold tabular-nums",
              isOverLimit ? "text-red-500" : "text-slate-400"
            )}>
              {extraInfoWordCount} / {EXTRA_INFO_WORD_LIMIT} words
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={3200}
            className={cn(
              "w-full rounded-xl border px-4 py-3 text-sm text-slate-900 resize-none focus:ring-2 outline-none transition-all placeholder:text-slate-300",
              isOverLimit
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-slate-200 focus:border-[#001B3D] focus:ring-[#001B3D]/20"
            )}
            value={form.extraInfo}
            onChange={(e) => setField("extraInfo")(e.target.value)}
            placeholder="Any extra context, links, or details the funder should know…"
          />
        </div>


        {/* ── Submit Button ── */}
        <button
          type="button"
          onClick={submit}
          disabled={isSubmitting || isOverLimit}
          className="h-14 w-full rounded-[2.5rem] bg-[#001B3D] text-white text-sm font-bold hover:bg-[#002a5c] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Processing…" : "Create Impact Goal"}
          {!isSubmitting && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* ── Status Message ── */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn(
                "flex items-center gap-2 text-xs font-medium rounded-xl px-3 py-2.5 border-t border-slate-50",
                isError ? "text-red-600 bg-red-50 border border-red-100" : "text-emerald-700 bg-emerald-50 border border-emerald-100"
              )}
            >
              {isError
                ? <AlertCircle className="w-4 h-4 shrink-0" />
                : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
