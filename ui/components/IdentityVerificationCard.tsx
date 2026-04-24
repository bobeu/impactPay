"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ShieldCheck, Phone, Share2, UserCheck2, Fingerprint, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { verifyPhoneWithOdis } from "@/lib/odisClient";
import { registerPhoneMapping } from "@/lib/socialconnect";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useImpactPay } from "@/contexts/ImpactPayContext";

type Props = {
  address?: string | null;
};

export function IdentityVerificationCard({ address }: Props) {
  const { profile, setPhoneVerified, setSocialsLinked, setHumanVerified } = useUserProfile();
  const { onVerificationSuccess } = useImpactPay();
  const [phoneInput, setPhoneInput] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  // const [status, setStatus] = useState<string>("");

  const verifyPhone = async () => {
    if (!address) return;
    if (!window.ethereum?.isMiniPay) {
      toast.error("Open in MiniPay to run secure ODIS identity flow.");
      return;
    }
    if (!phoneInput.trim()) {
      toast.error("Enter a valid phone number.");
      return;
    }
    setLoading("phone");
    try {
      const odisPromise = verifyPhoneWithOdis({
        phoneNumber: phoneInput,
        walletAddress: address,
      });
      await toast.promise(odisPromise, {
        loading: "Verifying phone with ODIS...",
        success: "ODIS verification complete",
        error: "ODIS verification failed",
      });
      await registerPhoneMapping({
        phoneNumber: phoneInput,
        walletAddress: address,
      });
      setPhoneVerified(phoneInput);
      toast.success("Phone verified and mapped securely.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const linkSocials = async () => {
    if (!handle.trim()) {
      toast.error("Please enter a social handle.");
      return;
    }
    if (!address) return;
    setLoading("social");
    try {
      const res = await fetch("/api/socialconnect/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, walletAddress: address }),
      });
      if (!res.ok) throw new Error("Failed to register handle");
      
      setSocialsLinked(handle.trim(), "");
      toast.success("Social handle linked successfully.");
    } catch (error) {
       toast.error((error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const verifyHuman = () => {
    if (!address) return;
    if (!window.ethereum?.isMiniPay) {
      toast.error("Self verification is only enabled in MiniPay environment.");
      return;
    }
    setLoading("human");
    fetch("/api/identity/self-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, proof: "self-proof-placeholder" }),
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (data.error) throw new Error(data.error);
        setHumanVerified();
        await onVerificationSuccess(address as `0x${string}`);
        toast.success("Human verification anchored on-chain.");
      })
      .catch((e) => {
        toast.error((e as Error).message);
      })
      .finally(() => setLoading(null));
  };

  const steps = [
    { id: 1, label: "Phone", field: profile.phoneVerified, icon: Phone, action: verifyPhone, value: phoneInput, setValue: setPhoneInput, placeholder: "+234...", type: "phone" },
    { id: 2, label: "Socials", field: profile.socialsLinked, icon: Share2, action: linkSocials, value: handle, setValue: setHandle, placeholder: "@username", type: "social" },
    { id: 3, label: "Human", field: profile.humanVerified, icon: Fingerprint, action: verifyHuman, type: "human" }
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col"
    >
      <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
        <div className="flex items-center gap-2">
          <UserCheck2 className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Reputation Verification</h2>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map(lvl => (
            <div key={lvl} className={cn(
              "w-2 h-2 rounded-full",
              profile.verificationLevel >= lvl ? "bg-accent" : "bg-slate-200"
            )} />
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {steps.map((step) => (
          <div key={step.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1.5 rounded-md",
                  step.field ? "bg-accent/10 text-accent" : "bg-slate-100 text-slate-400"
                )}>
                  <step.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">Level {step.id}: {step.label}</span>
              </div>
              {step.field && <CheckCircle2 className="w-4 h-4 text-accent" />}
            </div>

            {!step.field && (
              <div className="flex gap-2">
                {step.setValue && (
                  <input
                    className="flex-1 h-11 rounded-md border border-slate-200 px-4 text-sm text-slate-900 focus:border-accent outline-none transition-all"
                    placeholder={step.placeholder}
                    value={step.value}
                    onChange={(e) => step.setValue!(e.target.value)}
                  />
                )}
                <button
                  onClick={step.action}
                  disabled={!!loading || (step.id > 1 && !profile.phoneVerified)}
                  className={cn(
                    "h-11 px-4 rounded-md text-xs font-bold transition-all",
                    step.id > 1 && !profile.phoneVerified 
                      ? "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-opacity-90 active:scale-95"
                  )}
                >
                  {loading === step.type ? "..." : "Verify"}
                </button>
              </div>
            )}
            
            {step.id === 3 && !step.field && (
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                Self uses ZK proofs to anchor humanhood on-chain without storing PII.
              </p>
            )}
          </div>
        ))}

        {!profile.humanVerified && (
          <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-100 rounded-md">
            <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5" />
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide leading-normal">
              Linking socials and completing humanhood check increases your reputation score multiplier by 2x.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

