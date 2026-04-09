"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { GoalCategory, useUserProfile } from "@/contexts/UserProfileContext";
import { useWeb3 } from "@/contexts/useWeb3";

export function CreateGoalCard() {
  const { canCreateScholarship } = useUserProfile();
  const { getGasReadiness } = useWeb3();
  const [goalTitle, setGoalTitle] = useState("");
  const [category, setCategory] = useState<GoalCategory>("Bill");
  const [amount, setAmount] = useState("50");
  const [message, setMessage] = useState("");
  const [showGateModal, setShowGateModal] = useState(false);

  const submit = () => {
    if (!goalTitle.trim()) {
      setMessage("Add a short goal description.");
      return;
    }
    if (category === "Scholarship" && !canCreateScholarship) {
      setMessage("Scholarship goals require Level 3 verification.");
      setShowGateModal(true);
      return;
    }
    toast.promise(
      getGasReadiness().then((g) => {
        if (!g.hasEnough) {
          throw new Error(`Insufficient CELO for gas. Est. ${g.estimatedCostCELO} CELO`);
        }
        setMessage(`Draft ${category} goal created for $${amount}. Est. gas ${g.estimatedGas}.`);
      }),
      {
        loading: "Estimating gas for goal creation...",
        success: "Gas check passed. Goal transaction ready.",
        error: (e) => String(e),
      },
    );
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm space-y-2">
      <h2 className="text-sm font-semibold text-slate-800">Create goal</h2>
      <input
        className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm"
        value={goalTitle}
        onChange={(e) => setGoalTitle(e.target.value)}
        placeholder="What do you need help with?"
      />
      <input
        className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Target amount (USD)"
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setCategory("Bill")}
          className={`h-11 rounded-full text-sm border ${
            category === "Bill"
              ? "border-[#35D07F] bg-[#35D07F] text-white"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          Bill
        </button>
        <button
          type="button"
          disabled={!canCreateScholarship}
          onClick={() => setCategory("Scholarship")}
          className={`h-11 rounded-full text-sm border ${
            category === "Scholarship"
              ? "border-[#35D07F] bg-[#35D07F] text-white"
              : "border-slate-200 bg-white text-slate-700"
          } disabled:opacity-50`}
        >
          Scholarship
        </button>
      </div>
      {!canCreateScholarship ? (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
          Scholarship is locked until Level 3 (Self human verification).
        </p>
      ) : null}
      <button
        type="button"
        onClick={submit}
        className="h-11 w-full rounded-full bg-[#35D07F] text-white text-sm font-medium"
      >
        Continue
      </button>
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
      {showGateModal ? (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white border border-slate-200 p-4 shadow-md space-y-2">
            <h3 className="text-sm font-semibold text-slate-800">Verification Required</h3>
            <p className="text-xs text-slate-600">
              Scholarship goals are gated to Level 3 users. Complete Self biometric verification first.
            </p>
            <button
              className="h-11 w-full rounded-full bg-[#35D07F] text-white text-sm font-medium"
              onClick={() => {
                setShowGateModal(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Go to Verify Identity
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

