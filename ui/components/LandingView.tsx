"use client";

import React from "react";
import { Stats } from "../lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Heart, 
  HandHelping, 
  Globe,
  ArrowRight,
  Verified,
  ShieldCheck,
  Zap,
  Info
} from "lucide-react";
import Image from "next/image";

interface LandingViewProps {
  stats: Stats;
  onEnterAsFunder: () => void;
  onEnterAsHelpSeeker: () => void;
  onEnterAsWealthRedistribution: () => void;
  isAuthenticated: boolean;
  onSignIn: (method: 'message' | 'social' | 'email') => void;
}

const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded whitespace-nowrap z-50 shadow-lg"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function LandingView({ stats, isAuthenticated, onSignIn, onEnterAsFunder, onEnterAsHelpSeeker, onEnterAsWealthRedistribution }: LandingViewProps) {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] lg:rounded-[3rem]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-20 -mb-20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 px-6 py-12 lg:px-12 lg:py-16 grid lg:grid-cols-2 items-center gap-10">
          <div className="space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm"
            >
              <Verified className="w-4 h-4 text-accent" /> Blockchain Verified Impact
            </motion.div>
            
            <div className="space-y-4">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl lg:text-6xl font-black text-white tracking-tighter leading-[1.1]"
              >
                Direct Help. <br />
                <span className="text-accent">Verified Stories.</span>
              </motion.h1>
              <p className="text-base lg:text-lg text-slate-400 font-medium max-w-md mx-auto lg:mx-0">
                The most transparent and verified way to support essential needs and professional goals on Celo.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2">
              <button 
                onClick={onEnterAsFunder}
                className="w-full sm:w-auto bg-accent text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-accent/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 group"
              >
                Browse Goals <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={onEnterAsHelpSeeker}
                className="w-full sm:w-auto bg-white/10 text-white font-bold py-4 px-8 rounded-2xl hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                I Need Help
              </button>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block relative"
          >
            <div className="relative w-full aspect-square max-w-[440px] mx-auto">
                <Image 
                  src="/undraw_online-community.png" 
                  alt="Community Illustration" 
                  fill
                  className="object-contain"
                />
            </div>
            {/* Floating stats badge */}
            <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 flex items-center gap-4 animate-bounce-slow">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Impact</p>
                    <p className="text-lg font-black text-slate-900">{stats.activeGoals} Active Goals</p>
                </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Entry Points Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Get Started</h3>
          <div className="h-px flex-1 bg-slate-100 mx-4 hidden sm:block" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EntryCard 
            title="Fund a Goal"
            description="Support verified bills and scholarships directly."
            icon={<Heart className="w-5 h-5" />}
            image="/undraw_handshake-deal.png"
            color="bg-slate-900"
            textColor="text-white"
            onClick={onEnterAsFunder}
          />
          <EntryCard 
            title="I Need Help"
            description="Create a verified goal for your community."
            icon={<HandHelping className="w-5 h-5" />}
            image="/undraw_air-support.png"
            color="bg-white"
            textColor="text-slate-900"
            borderColor="border-slate-200"
            onClick={onEnterAsHelpSeeker}
          />
          <EntryCard 
            title="Wealth Redistribution"
            description="Philanthropy and reputation-based claims."
            icon={<Globe className="w-5 h-5" />}
            image="/undraw_social-media-interactions.png"
            color="bg-gradient-to-br from-emerald-600 to-teal-500"
            textColor="text-white"
            onClick={onEnterAsWealthRedistribution}
          />
        </div>
      </section>

      {/* How it Works - Split Layout */}
      <section className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-center bg-white rounded-[2.5rem] p-8 lg:p-12 border border-slate-100 shadow-sm overflow-hidden">
        <div className="space-y-8">
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">How it Works</h3>
            <p className="text-slate-500 font-medium">Empowering direct impact through blockchain.</p>
          </div>

          <div className="space-y-6">
            <FeatureItem 
              icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
              bg="bg-emerald-50"
              title="Verified Identity"
              tooltip="Verification via MiniPay and Social protocols"
              description="Creators are verified using ZK-biometrics and social handles to ensure help reaches the right hands."
            />
            <FeatureItem 
              icon={<Zap className="w-5 h-5 text-blue-600" />}
              bg="bg-blue-50"
              title="Instant Fulfillment"
              tooltip="Direct-to-merchant payments via API"
              description="Bill payments go directly to service providers via BitGifty, preventing fund misappropriation."
            />
            <FeatureItem 
              icon={<Globe className="w-5 h-5 text-teal-600" />}
              bg="bg-teal-50"
              title="Wealth Redistribution"
              description="A circular economy where top earners distribute wealth to the community based on reputation."
            />
          </div>
        </div>

        <div className="relative aspect-video lg:aspect-square w-full max-w-lg mx-auto">
            <Image 
              src="/undraw_puzzle-solved.png" 
              alt="How it works illustration" 
              fill
              className="object-contain"
            />
        </div>
      </section>

      {!isAuthenticated && (
        <section className="relative overflow-hidden bg-accent/5 border border-accent/20 rounded-[2.5rem] p-8 lg:p-12 text-center space-y-8">
          <div className="space-y-2">
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Ready to join the community?</h3>
            <p className="text-slate-500 font-medium">Sign in to start creating or funding goals.</p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4 justify-center">
            <button 
              onClick={() => onSignIn('message')}
              className="px-8 py-4 bg-[#001B3D] text-white font-bold rounded-2xl hover:bg-[#002a5c] transition-all shadow-xl shadow-slate-300"
            >
              Sign Message
            </button>
            <button 
              onClick={() => onSignIn('social')}
              className="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:border-accent transition-all"
            >
              Social Login
            </button>
            <button 
              onClick={() => onSignIn('email')}
              className="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:border-accent transition-all"
            >
              Email Login
            </button>
          </div>
        </section>
      )}

      {/* Trust & Community */}
      <div className="py-8 flex flex-col items-center gap-4 opacity-70">
        <div className="flex -space-x-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 shadow-sm" />
          ))}
          <div className="w-10 h-10 rounded-full border-4 border-white bg-accent flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
            +1.2k
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trusted by the Celo Ecosystem</p>
        </div>
      </div>
    </div>
  );
}

function EntryCard({ title, description, icon, image, color, textColor, borderColor, onClick }: any) {
  return (
    <motion.button
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative flex flex-col overflow-hidden rounded-[2.5rem] p-8 text-left transition-all ${color} ${textColor} ${borderColor || 'border-transparent'} border shadow-xl shadow-slate-100 h-full`}
    >
      <div className="relative z-10 flex-1 space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-70">
          {icon} {title}
        </div>
        <h4 className="text-2xl font-black leading-tight tracking-tight">{title}</h4>
        <p className="text-sm opacity-60 font-medium">{description}</p>
      </div>
      
      <div className="relative z-10 mt-6 flex items-center justify-between">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/40 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>

      <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity">
        <Image src={image} alt="" fill className="object-contain translate-x-4 translate-y-4" />
      </div>
    </motion.button>
  );
}

function FeatureItem({ icon, bg, title, tooltip, description }: any) {
  return (
    <div className="flex gap-4 items-start">
      <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center shrink-0 shadow-sm`}>
        {icon}
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
          {title}
          {tooltip && (
            <Tooltip text={tooltip}>
              <Info className="w-3 h-3 text-slate-300 cursor-help" />
            </Tooltip>
          )}
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">{description}</p>
      </div>
    </div>
  );
}
