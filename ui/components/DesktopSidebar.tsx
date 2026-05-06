"use client";

import { Link, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { zeroAddress } from "viem";
import { formatEther } from "viem";
import { useEffect, useState } from "react";
import {
  Compass,
  User,
  Shield,
  Target,
  Globe,
  TrendingUp,
  Users,
  CheckCircle2,
  Heart,
  Zap,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useImpactPay } from "@/contexts/ImpactPayContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import Image from "next/image";
import AddressWrapper from "./AddressFormatter/AddressWrapper";

type NavItem = {
  key: string;
  label: string;
  icon: typeof Compass;
  href: string;
  description: string;
};

export function DesktopSidebar() {
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const { stats, selectedVersion, setSelectedVersion, availableVersions } = useImpactPay();
  const { profile } = useUserProfile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navAddress = mounted && address ? address : zeroAddress;

  const items: NavItem[] = [
    { key: "home",    label: "Explore",    icon: Compass, href: "/",                     description: "Browse all goals" },
    { key: "funder",  label: "Dashboard",  icon: TrendingUp, href: "/funder",            description: "Your funded goals" },
    { key: "create",  label: "Create Goal",icon: Target,  href: "/create-goal",           description: "Start a new goal" },
    { key: "sponsor", label: "Sponsor Hub",icon: Shield,  href: "/sponsor",              description: "Scholarship management" },
    { key: "wealth",  label: "Wealth",     icon: Globe,   href: "/wealth",               description: "Redistribute wealth" },
    { key: "profile", label: "Profile",    icon: User,    href: `/profile/${navAddress}`, description: "Your goals & history" },
  ];

  const activePath = location.pathname;

  return (
    <aside className="hidden lg:flex flex-col w-72 xl:w-80 fixed top-0 left-0 h-screen bg-slate-900 text-white z-40 overflow-y-auto">
      {/* Branding */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
          <Image src="/logo.png" alt="ImpactPay" width={40} height={40} className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight">ImpactPay</h1>
          <p className="text-[10px] text-white/50 font-medium uppercase tracking-widest">Protocol</p>
        </div>
        {availableVersions > 1 && (
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(Number(e.target.value))}
            className="ml-auto text-[10px] bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white/80 outline-none cursor-pointer"
          >
            {Array.from({ length: availableVersions }).map((_, i) => (
              <option key={i} value={i} className="bg-[#001B3D]">v{i + 1}.0</option>
            ))}
          </select>
        )}
      </div>

      {/* User Identity */}
      {isConnected && address && (
        <div className="mx-4 mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              {profile.phoneNumber ? (
                <p className="text-sm font-bold text-white truncate">{profile.phoneNumber}</p>
              ) : (
                <div className="text-sm font-bold text-white">
                  <AddressWrapper account={address} copyIconSize="6" display={true} size={6} />
                </div>
              )}
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] text-white/50 font-medium">Connected · Celo</span>
              </div>
            </div>
          </div>
          {/* Verification Level */}
          <div className="mt-3 flex items-center gap-2">
            {[1, 2, 3].map((lvl) => (
              <div key={lvl} className={cn(
                "flex-1 h-1 rounded-full transition-all",
                profile.verificationLevel >= lvl ? "bg-accent" : "bg-white/10"
              )} />
            ))}
            <span className="text-[10px] text-white/40 ml-1">Lvl {profile.verificationLevel}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-3">Navigation</p>
        {items.map((item) => {
          const isActive = item.href === "/" ? activePath === "/" : activePath.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-accent text-white shadow-lg shadow-accent/30"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-white/50 group-hover:text-white")} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight">{item.label}</p>
                <p className={cn("text-[10px] leading-tight truncate", isActive ? "text-white/70" : "text-white/30")}>{item.description}</p>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Live Stats */}
      <div className="mx-4 mb-4 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Protocol Stats</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-accent" />
              <span className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Raised</span>
            </div>
            <p className="text-sm font-black text-white">{Number(formatEther(stats?.totalRaised || 0n)).toFixed(1)}</p>
            <p className="text-[9px] text-white/30">USDm</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3 h-3 text-blue-400" />
              <span className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Funders</span>
            </div>
            <p className="text-sm font-black text-white">{stats?.totalFunders?.toString() || '0'}</p>
            <p className="text-[9px] text-white/30">Total</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Heart className="w-3 h-3 text-rose-400" />
              <span className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Active</span>
            </div>
            <p className="text-sm font-black text-white">{stats?.activeGoals?.toString() || '0'}</p>
            <p className="text-[9px] text-white/30">Goals</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Success</span>
            </div>
            <p className="text-sm font-black text-white">
              {stats?.totalGoals > 0 ? Math.round(((stats.totalGoals - stats.activeGoals) / stats.totalGoals) * 100) : 0}%
            </p>
            <p className="text-[9px] text-white/30">Rate</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-accent" />
          <span className="text-[10px] text-white/30 font-medium">Powered by Celo Blockchain</span>
        </div>
      </div>
    </aside>
  );
}
