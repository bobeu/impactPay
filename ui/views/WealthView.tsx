"use client";

import React, { useState } from 'react';
import { useImpactPay } from '@/contexts/ImpactPayContext';
import { useAccount, useConfig } from 'wagmi';
import { simulateContract } from "wagmi/actions";
import { CONTRACTS } from '@/contracts';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ArrowRight, DollarSign, Gift, Loader2, User, MessageCircle, ShieldCheck, ChevronDown, CheckCircle2 } from 'lucide-react';
import { parseEther, formatEther } from 'viem';
import { Address } from 'viem';
import { useWeb3 } from '@/contexts/useWeb3';

const CustomSelect = ({ label, value, onChange, options, icon: Icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div className="space-y-1 relative">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 flex items-center justify-between cursor-pointer hover:border-emerald-500/50 transition-all"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-400" />}
          {selectedOption?.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden"
            >
              {options.map((opt: any) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-3 text-sm font-medium cursor-pointer transition-colors ${value === opt.value ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {opt.label}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function WealthView() {
  const { isConnected, address } = useAccount();
  const config = useConfig();
  const { broadcastTransaction } = useWeb3();
  const { payFunders, userClaims, refresh, impactPayAddress, mockERC20Address } = useImpactPay();
  const chainId = useAccount().chain?.id || 42220;

  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [message, setMessage] = useState('');
  const [currency, setCurrency] = useState<'NATIVE' | 'STABLECOIN'>('NATIVE');
  const [pattern, setPattern] = useState<'PHILANTROPIST' | 'REDISTRIBUTE'>('PHILANTROPIST');
  const [requiredLevel, setRequiredLevel] = useState<0 | 1 | 2 | 3>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Claim
  const [isClaiming, setIsClaiming] = useState(false);
  const [selectedFunder, setSelectedFunder] = useState<any>(null);

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return toast.error("Connect wallet");
    if (!amount || Number(amount) <= 0) return toast.error("Invalid amount");

    setIsSubmitting(true);
    try {
      const val = parseEther(amount);
      const isNative = currency === 'NATIVE';
      const args = [
        val,
        name || "Anonymous",
        handle || "",
        message || "",
        pattern === 'PHILANTROPIST' ? 0 : 1,
        requiredLevel
      ];

      const feeCurrency = mockERC20Address;

      if (!isNative) {
        await broadcastTransaction({
            address: mockERC20Address,
            abi: CONTRACTS.MockERC20.abi as any,
            functionName: 'approve',
            args: [impactPayAddress, val],
            feeCurrency
        }, chainId);
      }

      await simulateContract(config, {
        address: impactPayAddress,
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: 'distributeWealth',
        args,
        value: isNative ? val : 0n
      });

      await broadcastTransaction({
        address: impactPayAddress,
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: 'distributeWealth',
        args,
        value: isNative ? val : 0n,
        feeCurrency
      }, chainId);

      toast.success("Wealth Distributed!");
      setAmount('');
      setMessage('');
    } catch (error: any) {
      console.error(error);
      toast.error(error.shortMessage || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaim = async (fundId: bigint) => {
    if (!isConnected) return toast.error("Connect wallet");

    setIsClaiming(true);
    try {
      const feeCurrency = mockERC20Address;

      await simulateContract(config, {
        address: impactPayAddress,
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: 'claimGigs',
        args: [fundId]
      });

      await broadcastTransaction({
        address: impactPayAddress,
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: 'claimGigs',
        args: [fundId],
        feeCurrency
      }, chainId);

      toast.success("Claimed successfully!");
      refresh();
      setSelectedFunder(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.shortMessage || error.message);
    } finally {
      setIsClaiming(false);
    }
  };

  const decodeBytes = (bytes: any) => {
    if (!bytes || bytes === '0x') return '';
    try {
      return Buffer.from(bytes.slice(2), 'hex').toString();
    } catch (e) {
      return bytes;
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8 pb-24">
      {/* Wealth Redistribution */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 mb-2">
          <Globe className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Wealth Redistribution</h1>
        <p className="text-slate-500 font-medium">Create large scale impact or claim what you deserve.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Gift className="w-5 h-5 text-accent" /> Distribute Wealth
        </h2>
        <form onSubmit={handleDistribute} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              label="Currency"
              value={currency}
              onChange={setCurrency}
              options={[
                { value: 'NATIVE', label: 'Native (CELO)' },
                { value: 'STABLECOIN', label: 'Stablecoin (cUSD)' }
              ]}
              icon={DollarSign}
            />
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 100"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              label="Pattern"
              value={pattern}
              onChange={setPattern}
              options={[
                { value: 'PHILANTROPIST', label: 'Philanthropist' },
                { value: 'REDISTRIBUTE', label: 'Redistribute' }
              ]}
              icon={Globe}
            />
            <CustomSelect
              label="Required Level"
              value={requiredLevel}
              onChange={setRequiredLevel}
              options={[
                { value: 0, label: 'Level 1' },
                { value: 1, label: 'Level 2' },
                { value: 2, label: 'Level 3' }
              ]}
              icon={ShieldCheck}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave a message for the recipients..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[80px]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#001B3D] text-white font-bold text-sm py-4 rounded-2xl hover:bg-[#002a5c] transition-all shadow-xl shadow-slate-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Globe className="w-5 h-5" /> Distribute Wealth</>}
          </button>
        </form>
      </div>

      {/* Active Distributions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 px-2 flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-500" /> Live Distributions
        </h2>
        <div className="grid gap-4">
          {payFunders.map((funder, index) => {
            const hasClaimed = userClaims[index + 1]?.isClaimed;
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedFunder({ ...funder, id: index + 1 })}
                className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <User className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {decodeBytes(funder.name) || "Anonymous"}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      {funder.pattern === 0 ? "Philanthropist" : "Redistribute"} • {formatEther(funder.amount)} {funder.currency === 0 ? 'CELO' : 'cUSD'}
                    </p>
                  </div>
                </div>
                {hasClaimed ? (
                  <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Claimed
                  </div>
                ) : (
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                )}
              </motion.div>
            );
          })}
          {payFunders.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 space-y-4">
              <div className="relative w-40 h-40 mx-auto">
                <img src="/undraw_social-media-interactions.png" alt="No distributions" className="w-full h-full object-contain opacity-40" />
              </div>
              <p className="text-slate-400 font-medium text-sm">No active distributions yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Claim Modal */}
      <AnimatePresence>
        {selectedFunder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFunder(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="fixed z-[101] bottom-0 sm:bottom-auto left-0 sm:left-auto w-full sm:max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center">
                    <User className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{decodeBytes(selectedFunder.name)}</h3>
                    <p className="text-emerald-600 font-bold text-sm">@{decodeBytes(selectedFunder.handle) || "no-handle"}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-slate-400 mt-0.5" />
                    <p className="text-slate-600 text-sm italic">"{decodeBytes(selectedFunder.message) || "No message left."}"</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pool Balance</p>
                    <p className="text-lg font-black text-slate-900">{formatEther(selectedFunder.remainingPool)} <span className="text-[10px]">{selectedFunder.currency === 0 ? 'CELO' : 'cUSD'}</span></p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level Req.</p>
                    <p className="text-lg font-black text-slate-900">Level {Number(selectedFunder.requiredLevel) + 1}</p>
                  </div>
                </div>

                {userClaims[selectedFunder.id]?.isClaimed ? (
                  <div className="w-full bg-emerald-50 text-emerald-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 border border-emerald-100">
                    <CheckCircle2 className="w-5 h-5" /> You have claimed your share
                  </div>
                ) : (
                  <button
                    onClick={() => handleClaim(BigInt(selectedFunder.id))}
                    disabled={isClaiming}
                    className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isClaiming ? <Loader2 className="w-5 h-5 animate-spin" /> : <><DollarSign className="w-5 h-5" /> Claim My Portion</>}
                  </button>
                )}

                <button 
                  onClick={() => setSelectedFunder(null)}
                  className="w-full text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
