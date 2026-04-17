"use client";

import { useMemo, useState } from "react";
import { useReputationFeed } from "@/hooks/useReputationFeed";

const mockDevGoals = [
  { id: 1, title: "Cursor Pro - 1 month", category: "Subscriptions", status: "verified", rep: 640, amount: 20 },
  { id: 2, title: "OpenAI Plus - 1 month", category: "Subscriptions", status: "pending", rep: 430, amount: 20 },
  { id: 3, title: "Cloud exam voucher", category: "Education", status: "verified", rep: 710, amount: 120 },
];

export function SponsorDashboard() {
  const { donors, developers } = useReputationFeed();
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [minRep, setMinRep] = useState(0);
  const [msg, setMsg] = useState("");

  const filtered = useMemo(
    () =>
      mockDevGoals.filter(
        (g) =>
          (category === "All" || g.category === category) &&
          (status === "All" || g.status === status) &&
          g.rep >= minRep,
      ),
    [category, status, minRep],
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-3">
      <h2 className="text-sm font-semibold text-slate-800">Sponsor Hub</h2>
      <div className="grid grid-cols-3 gap-2">
        <select className="h-11 border rounded-md px-2 text-xs" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>All</option><option>Subscriptions</option><option>Education</option>
        </select>
        <select className="h-11 border rounded-md px-2 text-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All</option><option>verified</option><option>pending</option>
        </select>
        <input className="h-11 border rounded-md px-2 text-xs" type="number" value={minRep} onChange={(e) => setMinRep(Number(e.target.value || 0))} placeholder="Min rep" />
      </div>
      <div className="space-y-2">
        {filtered.map((g) => (
          <div key={g.id} className="border border-slate-200 rounded-xl p-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-slate-800">{g.title}</p>
              <p className="text-[11px] text-slate-500">{g.category} · Rep {g.rep}</p>
            </div>
            <button
              className="h-11 px-3 rounded-full bg-[#35D07F] text-white text-xs font-medium"
              onClick={() => setMsg(`Instant Grant sent for $${g.amount} to goal ${g.id}.`)}
            >
              Fund 100%
            </button>
          </div>
        ))}
      </div>
      {msg ? <p className="text-xs text-emerald-700">{msg}</p> : null}

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-200 p-2">
          <p className="text-xs font-semibold text-slate-700">Top Donors</p>
          {donors.slice(0, 3).map((d) => <p key={d.id} className="text-[11px] text-slate-600">{d.id.slice(0, 6)}… {d.score}</p>)}
        </div>
        <div className="rounded-lg border border-slate-200 p-2">
          <p className="text-xs font-semibold text-slate-700">Top Developers</p>
          {developers.slice(0, 3).map((d) => <p key={d.id} className="text-[11px] text-slate-600">{d.id.slice(0, 6)}… {d.score}</p>)}
        </div>
      </div>
    </section>
  );
}

