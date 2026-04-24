"use client";

import { GoalStr, GoalType } from "@/lib/types";
import Image from "next/image";

type FeaturedGoal = {
  id: string;
  title: string;
  category: string;
  progress: number; // 0-1
  raised: string;
  target: string;
  tag: "Fully Funded" | "Verification Pending" | "Open";
};

const mockFeaturedGoals: FeaturedGoal[] = [
  {
    id: "goal-1",
    title: "Keep the lights on this month",
    category: GoalStr[GoalType.BILL],
    progress: 0.78,
    raised: "$39",
    target: "$50",
    tag: "Verification Pending",
  },
  {
    id: "goal-2",
    title: "Year 2 nursing tuition",
    category: GoalStr[GoalType.SCHOLARSHIP],
    progress: 0.42,
    raised: "$420",
    target: "$1,000",
    tag: "Open",
  },
  {
    id: "goal-3",
    title: "Exam fees for final term",
    category: GoalStr[GoalType.SCHOLARSHIP],
    progress: 1,
    raised: "$120",
    target: "$120",
    tag: "Fully Funded",
  },
];

export function FeaturedGoalsCarousel() {
  return (
    <section aria-labelledby="featured-goals-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2
          id="featured-goals-heading"
          className="text-sm font-semibold tracking-tight text-slate-700"
        >
          Featured goals
        </h2>
        <span className="text-[11px] text-slate-500">High-trust, verified stories</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {mockFeaturedGoals.map((goal) => (
          <article
            key={goal.id}
            className="min-w-[260px] max-w-[280px] rounded-xl border border-slate-200 bg-white shadow-sm px-3 pt-3 pb-3 flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {goal.category}
                </p>
                <h3 className="mt-0.5 text-sm font-semibold text-slate-800 line-clamp-2">
                  {goal.title}
                </h3>
              </div>
              <span
                className={
                  "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-medium border " +
                  (goal.tag === "Fully Funded"
                    ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                    : goal.tag === "Verification Pending"
                    ? "border-amber-400 text-amber-700 bg-amber-50"
                    : "border-slate-200 text-slate-600 bg-slate-50")
                }
              >
                {goal.tag}
              </span>
            </div>

            <div className="mt-1 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {goal.raised} raised of {goal.target}
                </span>
                <span className="font-semibold text-slate-700">
                  {Math.round(goal.progress * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#35D07F]"
                  style={{ width: `${Math.min(goal.progress * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <div className="inline-flex items-center gap-1">
                <Image
                  src="/logo.png"
                  alt="ImpactPay"
                  width={14}
                  height={14}
                  className="rounded-sm"
                />
                <span>Impact verified</span>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm active:scale-[0.98]"
              >
                View details
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

