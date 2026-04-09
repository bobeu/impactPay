"use client";

import { useMemo } from "react";

type Props = {
  totalFundedUsd?: number;
  reputationScore?: number;
};

export function ImpactDashboard({ totalFundedUsd = 0, reputationScore = 0 }: Props) {
  const clampedReputation = useMemo(
    () => Math.max(0, Math.min(reputationScore, 1000)),
    [reputationScore],
  );
  const progress = clampedReputation / 1000; // simple normalization 0–1000

  return (
    <section
      aria-labelledby=\"impact-dashboard-heading\"
      className=\"rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm space-y-3\"
    >
      <div className=\"flex items-center justify-between gap-2\">
        <div>
          <h2
            id=\"impact-dashboard-heading\"
            className=\"text-sm font-semibold tracking-tight text-slate-800\"
          >
            Your impact
          </h2>
          <p className=\"mt-0.5 text-[11px] text-slate-500\">
            Reputation grows as you fund more verified goals.
          </p>
        </div>
        <div className=\"text-right\">
          <p className=\"text-[11px] font-medium text-slate-500\">Total funded</p>
          <p className=\"text-base font-semibold text-slate-800\">
            ${totalFundedUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <div className=\"space-y-1.5\">
        <div className=\"flex items-center justify-between text-[11px] text-slate-500\">
          <span>Impact reputation</span>
          <span className=\"font-semibold text-slate-700\">
            {Math.round(progress * 100)} / 100
          </span>
        </div>
        <div className=\"h-2 w-full rounded-full bg-slate-100\">
          <div
            className=\"h-full rounded-full bg-[#35D07F]\"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className=\"flex items-center justify-between text-[11px] text-slate-500\">
        <span>Funding verified, essential goals increases your score faster.</span>
      </div>
    </section>
  );
}
