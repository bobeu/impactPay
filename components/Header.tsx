"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Wallet, Menu, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Header() {
  const { address, isConnected } = useAccount();
  const { connectAsync, isPending } = useConnect();
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMiniPay(Boolean(window.ethereum?.isMiniPay));
    }
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-primary p-1.5 rounded-lg">
          <ShieldCheck className="w-5 h-5 text-accent" />
        </div>
        <span className="text-xl font-bold tracking-tight text-primary">
          ImpactPay
        </span>
      </div>

      <div className="flex items-center gap-3">
        {isConnected && address ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-primary">
              {shortenAddress(address)}
            </span>
          </div>
        ) : (
          <button
            onClick={() => connectAsync({ connector: injected() })}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-opacity-90 transition-all"
            disabled={isPending}
          >
            <Wallet className="w-3.5 h-3.5" />
            {isPending ? "..." : "Connect"}
          </button>
        )}
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 right-0 bg-white border-b border-slate-100 p-4 flex flex-col gap-2 shadow-xl"
          >
            <a href="/" className="px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Impact Dashboard</a>
            <a href="/leaderboard" className="px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Global Leaderboard</a>
            <a href="/docs" className="px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Public API Docs</a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
