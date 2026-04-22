"use client";

import { useMemo, useState, Fragment } from "react";
import { cn } from "@/lib/utils";
import { useImpactPay } from "@/contexts/ImpactPayContext";
import { formatEther, parseEther } from "viem";

export function SponsorDashboard() {
  const { goals, funderReputations, flagGoal, fundGoal } = useImpactPay();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const scholarshipGoals = useMemo(() => {
    return goals.filter(g => g.common.goalType === 2); // SCHOLARSHIP = 2
  }, [goals]);

  const donors = useMemo(() => {
     return Object.entries(funderReputations)
       .map(([id, score]) => ({ id, score: Number(formatEther(score)) }))
       .sort((a, b) => b.score - a.score)
       .slice(0, 3);
  }, [funderReputations]);

  const developers = useMemo(() => {
     const devs: Record<string, number> = {};
     goals.filter(k => k.bill.serviceType === 'subscription').forEach(g => {
        const creator = g.common.creator.toLowerCase();
        if (!devs[creator]) devs[creator] = 0;
        devs[creator] += Number(formatEther(g.common.raisedAmount));
     });
     return Object.entries(devs)
       .map(([id, score]) => ({ id, score }))
       .sort((a, b) => b.score - a.score)
       .slice(0, 3);
  }, [goals]);

  return (
    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold text-slate-800">Sponsor Hub</h2>
      
      <div className="overflow-hidden border border-slate-200 rounded-xl">
        <table className="w-full text-left text-[11px] bg-white">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 pl-3 font-medium">Goal ID</th>
              <th className="py-2.5 font-medium">Target (ETH)</th>
              <th className="py-2.5 font-medium">Raised (ETH)</th>
              <th className="py-2.5 pr-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scholarshipGoals.map((g) => {
              const id = g.common.id.toString();
              const isExpanded = expandedId === id;
              return (
                <Fragment key={id}>
                  <tr 
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                  >
                    <td className="py-3 pl-3 font-mono font-medium text-slate-700">#{id}</td>
                    <td className="py-3 text-slate-600">{Number(formatEther(g.common.targetAmount)).toFixed(4)}</td>
                    <td className="py-3 text-emerald-600 font-medium">{Number(formatEther(g.common.raisedAmount)).toFixed(4)}</td>
                    <td className="py-3 pr-3 text-right">
                      <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase", g.common.status === 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                        {g.common.status === 0 ? 'OPEN' : 'CLOSED'}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={4} className="p-4 border-t border-slate-100">
                        <div className="space-y-3">
                          <p className="text-xs text-slate-600 leading-relaxed font-mono">
                            <span className="font-bold text-slate-800">Description:</span><br/>
                            {g.common.description || "No description provided."}
                          </p>
                          <div className="space-y-2 mt-4">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <input 
                                  type="number"
                                  id={`fundAmount-${id}`}
                                  placeholder="Amount in ETH (e.g. 0.01)"
                                  min="0"
                                  step="0.0001"
                                  className="w-full h-10 border border-slate-200 rounded-md pl-3 pr-16 text-xs tabular-nums"
                                />
                                <button 
                                  className="absolute right-1 top-1 bottom-1 px-2 bg-slate-100 text-[10px] font-bold text-slate-600 rounded hover:bg-slate-200 transition-colors"
                                  onClick={() => {
                                    const amountLeft = Number(formatEther(g.common.targetAmount - g.common.raisedAmount)).toFixed(4);
                                    const inputNode = document.getElementById(`fundAmount-${id}`) as HTMLInputElement;
                                    if (inputNode) inputNode.value = amountLeft.toString();
                                  }}
                                >
                                  MAX
                                </button>
                              </div>
                            </div>

                            <input 
                              type="text"
                              id={`extraInfo-${id}`}
                              placeholder="Message or Extra Info (Optional)"
                              className="w-full h-10 border border-slate-200 rounded-md px-3 text-[11px]"
                            />
                            
                            <div className="flex flex-col flex-wrap sm:flex-row justify-between items-center gap-2 mt-2">
                              <span className="text-[10px] text-slate-500 font-medium">Remaining: {Number(formatEther(g.common.targetAmount - g.common.raisedAmount)).toFixed(4)} ETH</span>
                              
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => flagGoal(g.common.id)}
                                  className="px-4 py-1.5 rounded-full border border-red-200 text-red-600 text-[10px] font-semibold hover:bg-red-50 transition-colors"
                                >
                                  Flag
                                </button>
                                
                                <button 
                                  onClick={async () => {
                                    const amountNode = document.getElementById(`fundAmount-${id}`) as HTMLInputElement;
                                    let amountToFund = 0n;
                                    if (amountNode && amountNode.value) {
                                      try {
                                        amountToFund = parseEther(amountNode.value);
                                      } catch (e) {
                                        console.error("Invalid amount");
                                        return;
                                      }
                                    }
                                    if (amountToFund <= 0n) return;
                                    
                                    const extraInfoNode = document.getElementById(`extraInfo-${id}`) as HTMLInputElement;
                                    const extraInfo = extraInfoNode && extraInfoNode.value.trim() !== "" ? extraInfoNode.value : "Funded via SponsorDashboard";
                                    await fundGoal(g.common.id, amountToFund, extraInfo);
                                  }}
                                  className="px-4 py-1.5 rounded-full bg-slate-800 text-white text-[10px] font-semibold hover:bg-slate-700 shadow-sm transition-colors"
                                >
                                  Fund
                                </button>

                                <button 
                                  onClick={async () => {
                                    const amountLeft = g.common.targetAmount - g.common.raisedAmount;
                                    if (amountLeft <= 0n) return;
                                    const inputNode = document.getElementById(`extraInfo-${id}`) as HTMLInputElement;
                                    const extraInfo = inputNode && inputNode.value.trim() !== "" ? inputNode.value : "Funded 100% via SponsorDashboard";
                                    await fundGoal(g.common.id, amountLeft, extraInfo);
                                  }}
                                  className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-semibold hover:bg-emerald-600 shadow-sm transition-colors"
                                >
                                  Fund All
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {scholarshipGoals.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-xs text-slate-400">No scholarship goals found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Top Donors</p>
          <div className="space-y-1.5">
            {donors.length > 0 ? donors.map((d, i) => (
              <div key={d.id} className="flex justify-between items-center text-xs">
                <span className="font-mono text-slate-700">{d.id.slice(0, 6)}…{d.id.slice(-4)}</span>
                <span className="text-emerald-600 font-semibold">{d.score.toFixed(2)} Vol</span>
              </div>
            )) : <p className="text-xs text-slate-400">No donors yet.</p>}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Top Developers</p>
          <div className="space-y-1.5">
            {developers.length > 0 ? developers.map((d, i) => (
              <div key={d.id} className="flex justify-between items-center text-xs">
                <span className="font-mono text-slate-700">{d.id.slice(0, 6)}…{d.id.slice(-4)}</span>
                <span className="text-emerald-600 font-semibold">{d.score.toFixed(2)} Raise</span>
              </div>
            )) : <p className="text-xs text-slate-400">No developers yet.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

