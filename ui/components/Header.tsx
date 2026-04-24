"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link } from "react-router-dom";
import Image from "next/image";
import AddressWrapper from "./AddressFormatter/AddressWrapper";

export default function Header() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hideConnectBtn, setHideConnectBtn] = useState(false);

  useEffect(() => {
    if (window.ethereum && window.ethereum.isMiniPay) {
      setHideConnectBtn(true);
      connect({ connector: injected({ target: "metaMask" }) });
    }
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link to="/" className="p-1">
          <Image 
            src="/logo.png" 
            alt="ImpactPay Logo" 
            width={32} 
            height={32} 
            className="rounded-lg shadow-sm"
          />
        </Link>
        <Link to="/" className="text-xl font-black tracking-tighter text-[#001B3D] hidden sm:block">
          ImpactPay
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {isConnected && address && hideConnectBtn ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-primary">
              <AddressWrapper  
                account={address}
                copyIconSize="6"
                display={true}
                size={6}
              />
            </span>
          </div>
        ) : (
          !hideConnectBtn && <ConnectButton 
            showBalance={{
              smallScreen: false,
              largeScreen: true,
            }}
            chainStatus={{
              smallScreen: 'none',
              largeScreen: 'full',
            }}
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
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
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Impact Dashboard</Link>
            <Link to="/reputation" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">My Reputation</Link>
            <Link to="/sponsor" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Sponsor Hub</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
