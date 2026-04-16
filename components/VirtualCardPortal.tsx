"use client";

import { useState } from "react";
import { useUserProfile } from "@/contexts/UserProfileContext";

export function VirtualCardPortal({ address }: { address?: string | null }) {
  const { profile } = useUserProfile();
  const [goalId, setGoalId] = useState("1");
  const [result, setResult] = useState<string>("");

  const [loading, setLoading] = useState(false);
  
  const reveal = async () => {
    if (!address || loading) return;
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/card/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: Number(goalId), requester: address }),
      });
      const data = await res.json();
      if (!res.ok) setResult(data.error || "Unable to reveal card");
      else setResult(JSON.stringify(data.card.payload).slice(0, 180) + "...");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
      <h2 className="text-sm font-semibold text-slate-800">Virtual Card Portal</h2>
      {profile.verificationLevel < 3 ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
          Level 3 verification required before card details can be revealed.
        </p>
      ) : null}
      <input className="h-11 border rounded-md px-3 text-sm" value={goalId} onChange={(e) => setGoalId(e.target.value)} placeholder="Goal ID" />
      <button
        type="button"
        disabled={profile.verificationLevel < 3 || loading}
        onClick={reveal}
        className="h-11 w-full rounded-full border border-slate-200 bg-white text-slate-700 text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Processing..." : "Reveal card details"}
      </button>
      {result ? <pre className="text-[11px] text-slate-600 whitespace-pre-wrap break-all">{result}</pre> : null}
    </section>
  );
}

