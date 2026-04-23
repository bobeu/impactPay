"use client";

import React, { useState, useMemo } from "react";
import { GetGoal, GoalStatus, GoalType } from "../lib/types";
import { GoalDetailsModal } from "./GoalDetailsModal";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Layers, TrendingUp, Users, CreditCard, GraduationCap, Infinity as InfinityIcon, ChevronRight } from "lucide-react";
import { formatEther, hexToString } from "viem";
import { cn } from "../lib/utils";

interface GoalListProps {
  goals: GetGoal[];
  title?: string;
  emptyMessage?: string;
  isFunderView?: boolean;
}

type StatusTab = "all" | "open" | "raised" | "fulfilled";

const STATUS_TABS: { key: StatusTab; label: string; statusValue?: GoalStatus }[] = [
  { key: "all",       label: "All" },
  { key: "open",      label: "Open",      statusValue: GoalStatus.OPEN },
  { key: "raised",    label: "Raised",    statusValue: GoalStatus.RAISED },
  { key: "fulfilled", label: "Fulfilled", statusValue: GoalStatus.FULFILLED },
];

const STATUS_META: Record<GoalStatus, { label: string; dot: string; text: string }> = {
  [GoalStatus.OPEN]:      { label: "Open",      dot: "bg-emerald-400", text: "text-emerald-700" },
  [GoalStatus.RAISED]:    { label: "Raised",    dot: "bg-blue-400",    text: "text-blue-700"    },
  [GoalStatus.FULFILLED]: { label: "Fulfilled", dot: "bg-purple-400",  text: "text-purple-700"  },
  [GoalStatus.CANCELED]:  { label: "Canceled",  dot: "bg-slate-300",   text: "text-slate-500"   },
};

const TYPE_META: Record<GoalType, { label: string; Icon: React.ElementType }> = {
  [GoalType.DEFAULT]:     { label: "Default",     Icon: InfinityIcon   },
  [GoalType.BILL]:        { label: "Bill",        Icon: CreditCard     },
  [GoalType.SCHOLARSHIP]: { label: "Scholarship", Icon: GraduationCap },
};

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function GoalList({ goals, title, emptyMessage = "No goals found.", isFunderView }: GoalListProps) {
  const [selectedGoal, setSelectedGoal] = useState<GetGoal | null>(null);
  const [searchTerm,   setSearchTerm]   = useState("");
  const [statusTab,    setStatusTab]    = useState<StatusTab>("all");

  const filteredGoals = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return goals.filter(g => {
      // ── status tab filter ──────────────────────────────────────
      if (statusTab !== "all") {
        const tab = STATUS_TABS.find(t => t.key === statusTab);
        if (tab?.statusValue !== undefined && g.common.status !== tab.statusValue) return false;
      }

      // ── search: description, creator addr, funder addrs, amount, type ──
      if (!q) return true;

      const desc    = hexToString(g.common.description as unknown as `0x${string}`).toLowerCase();
      const creator = g.common.creator.toLowerCase();
      const amtStr  = formatEther(g.common.raisedAmount);
      const target  = formatEther(g.common.targetAmount);
      const typeLbl = TYPE_META[g.common.goalType].label.toLowerCase();
      const hasFunderMatch = g.funders.some(f => f.id.toLowerCase().includes(q));

      return (
        desc.includes(q)    ||
        creator.includes(q) ||
        amtStr.includes(q)  ||
        target.includes(q)  ||
        typeLbl.includes(q) ||
        hasFunderMatch
      );
    });
  }, [goals, searchTerm, statusTab]);

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#001B3D]" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h2>
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by description, address, amount or type…"
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl text-[12px] focus:ring-2 focus:ring-[#001B3D]/20 focus:outline-none shadow-sm placeholder:text-slate-300"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status tabs */}
        <div className="flex bg-white rounded-xl shadow-sm p-1 gap-0.5 shrink-0">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={cn(
                "px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-colors tracking-wide",
                statusTab === tab.key
                  ? "bg-[#001B3D] text-white"
                  : "text-slate-400 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      {filteredGoals.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 text-[10px] uppercase tracking-widest">
                  <th className="py-3 pl-5 pr-3 font-semibold w-8">#</th>
                  <th className="py-3 pr-3 font-semibold">Type</th>
                  <th className="py-3 pr-3 font-semibold">Description</th>
                  <th className="py-3 pr-3 font-semibold">Creator</th>
                  <th className="py-3 pr-3 font-semibold text-right">Raised</th>
                  <th className="py-3 pr-3 font-semibold text-right">Target</th>
                  <th className="py-3 pr-3 font-semibold">Funders</th>
                  <th className="py-3 pr-5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {filteredGoals.map((goal, idx) => {
                    const { common, funders } = goal;
                    const { label: typeLabel, Icon: TypeIcon } = TYPE_META[common.goalType];
                    const { label: statusLabel, dot, text } = STATUS_META[common.status];
                    const progress = common.targetAmount > 0n
                      ? Number((common.raisedAmount * 100n) / common.targetAmount)
                      : 0;
                    const desc = hexToString(common.description as unknown as `0x${string}`);

                    return (
                      <motion.tr
                        key={common.id.toString()}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, delay: idx * 0.03 }}
                        onClick={() => setSelectedGoal(goal)}
                        className="cursor-pointer hover:bg-[#001B3D]/[0.03] transition-colors group"
                      >
                        <td className="py-3.5 pl-5 pr-3 text-slate-300 font-mono text-[10px]">
                          {common.id.toString()}
                        </td>
                        <td className="py-3.5 pr-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full">
                            <TypeIcon className="w-3 h-3" />
                            {typeLabel}
                          </span>
                        </td>
                        <td className="py-3.5 pr-3 text-slate-700 font-medium max-w-[180px]">
                          <span className="line-clamp-1" title={desc}>{desc || "—"}</span>
                        </td>
                        <td className="py-3.5 pr-3 font-mono text-slate-500 text-[11px]">
                          {shortAddr(common.creator)}
                        </td>
                        <td className="py-3.5 pr-3 text-right">
                          <div className="font-bold text-emerald-600">{Number(formatEther(common.raisedAmount)).toFixed(2)}</div>
                          {/* Mini progress bar */}
                          <div className="mt-1 ml-auto w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 pr-3 text-right font-semibold text-slate-500">
                          {Number(formatEther(common.targetAmount)).toFixed(2)}
                          <span className="ml-0.5 text-[9px] text-slate-300">USDm</span>
                        </td>
                        <td className="py-3.5 pr-3">
                          <div className="flex -space-x-1">
                            {funders.slice(0, 3).map((f, i) => (
                              <div key={i} className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[7px] font-bold text-slate-500">
                                {f.id.slice(2, 4).toUpperCase()}
                              </div>
                            ))}
                            {funders.length > 3 && (
                              <div className="w-5 h-5 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[7px] font-bold text-slate-400">
                                +{funders.length - 3}
                              </div>
                            )}
                            {funders.length === 0 && (
                              <span className="text-[10px] text-slate-300">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 pr-5">
                          <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold", text)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
                            {statusLabel}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile card-rows */}
          <div className="sm:hidden divide-y divide-slate-50">
            {filteredGoals.map((goal, idx) => {
              const { common, funders } = goal;
              const { label: typeLabel, Icon: TypeIcon } = TYPE_META[common.goalType];
              const { label: statusLabel, dot, text } = STATUS_META[common.status];
              const progress = common.targetAmount > 0n
                ? Number((common.raisedAmount * 100n) / common.targetAmount)
                : 0;
              const desc = hexToString(common.description as unknown as `0x${string}`);

              return (
                <motion.div
                  key={common.id.toString()}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: idx * 0.03 }}
                  onClick={() => setSelectedGoal(goal)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#001B3D]/[0.03] active:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Top row */}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-full">
                        <TypeIcon className="w-2.5 h-2.5" />{typeLabel}
                      </span>
                      <span className={cn("inline-flex items-center gap-1 text-[9px] font-bold", text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
                        {statusLabel}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[12px] font-semibold text-slate-700 truncate">{desc || "No description"}</p>

                    {/* Amounts + progress */}
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-emerald-600">
                        {Number(formatEther(common.raisedAmount)).toFixed(2)} USDm
                      </span>
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400">{Math.min(progress, 100)}%</span>
                    </div>

                    {/* Creator + funders */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <Users className="w-3 h-3" />
                      <span>{funders.length} donors</span>
                      <span className="text-slate-200">·</span>
                      <span className="font-mono">{shortAddr(common.creator)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 ml-3" />
                </motion.div>
              );
            })}
          </div>

          {/* Row count footer */}
          <div className="px-5 py-2.5 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-600">{filteredGoals.length}</span> of <span className="font-bold text-slate-600">{goals.length}</span> goals
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-[10px] font-bold text-[#001B3D] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="py-14 text-center bg-white rounded-2xl shadow-sm">
          <TrendingUp className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">{emptyMessage}</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-3 text-[11px] font-bold text-[#001B3D] hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      <GoalDetailsModal
        goal={selectedGoal}
        isOpen={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
      />
    </div>
  );
}
