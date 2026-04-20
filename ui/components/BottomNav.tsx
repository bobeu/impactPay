"use client";

import { Link, useLocation } from "react-router-dom";
import { Compass, User, Shield, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";
import { zeroAddress } from "viem";

type NavItem = {
  key: string;
  label: string;
  icon: typeof Compass;
  href: string;
};

export function BottomNav() {
  const location = useLocation();
  const { address } = useAccount();

  const items: NavItem[] = [
    { key: "home", label: "Explore", icon: Compass, href: "/" },
    { key: "sponsor", label: "Sponsor", icon: Shield, href: "/sponsor" },
    { key: "create", label: "Create", icon: Target, href: "/create-goal" },
    { key: "profile", label: "Profile", icon: User, href: `/profile/${address || zeroAddress}` },
  ];

  const activePath = location.pathname;

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 border-t border-slate-100 bg-white/80 backdrop-blur-md z-50 transition-all duration-300"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 h-16">
        {items.map((item) => {
          const isActive = item.href === "/" ? activePath === "/" : activePath.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-200 w-16 h-full border-t-2",
                isActive 
                  ? "border-accent text-accent" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

