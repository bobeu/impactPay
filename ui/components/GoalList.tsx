"use client";

import React, { useState } from "react";
import { GetGoal } from "../lib/types";
import { GoalCard } from "./GoalCard";
import { GoalDetailsModal } from "./GoalDetailsModal";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Layers } from "lucide-react";
import { hexToString } from "viem";

interface GoalListProps {
  goals: GetGoal[];
  title?: string;
  emptyMessage?: string;
  isFunderView?: boolean;
}

export function GoalList({ goals, title, emptyMessage = "No goals found", isFunderView }: GoalListProps) {
  const [selectedGoal, setSelectedGoal] = useState<GetGoal | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filteredGoals = goals.filter(g => {
    const matchesSearch = g.common.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || 
                         (filter === "bill" && g.common.goalType === 1) || 
                         (filter === "scholarship" && g.common.goalType === 2);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        {title && (
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h2>
          </div>
        )}
        
        {/* Search & Filter Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search goals..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-accent outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden p-1 gap-1">
            <button 
              onClick={() => setFilter("all")}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors ${filter === "all" ? "bg-accent text-white" : "text-slate-400 hover:bg-slate-50"}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter("bill")}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors ${filter === "bill" ? "bg-accent text-white" : "text-slate-400 hover:bg-slate-50"}`}
            >
              Bills
            </button>
            <button 
              onClick={() => setFilter("scholarship")}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors ${filter === "scholarship" ? "bg-accent text-white" : "text-slate-400 hover:bg-slate-50"}`}
            >
              Study
            </button>
          </div>
        </div>
      </div>

      {filteredGoals.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredGoals.map((goal) => (
              <motion.div
                key={goal.common.id.toString()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <GoalCard 
                  goal={goal} 
                  onClick={() => setSelectedGoal(goal)} 
                  isFunderView={isFunderView}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-12 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
          <p className="text-sm font-medium text-slate-400 italic">{emptyMessage}</p>
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
