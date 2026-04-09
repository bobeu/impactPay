"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { verifyPhoneWithOdis } from "@/lib/odisClient";
import { registerPhoneMapping } from "@/lib/socialconnect";
import { useUserProfile } from "@/contexts/UserProfileContext";

type Props = {
  address?: string | null;
};

export function IdentityVerificationCard({ address }: Props) {
  const { profile, setPhoneVerified, setSocialsLinked, setHumanVerified } = useUserProfile();
  const [phoneInput, setPhoneInput] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  const verifyPhone = async () => {
    if (!address) return;
    if (!window.ethereum?.isMiniPay) {
      setStatus("Open in MiniPay to run secure ODIS identity flow.");
      return;
    }
    if (!phoneInput.trim()) {
      setStatus("Enter a valid phone number first.");
      return;
    }
    setLoading(true);
    setStatus("");
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
      setStatus("Phone verified and mapped to your wallet.");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const linkSocials = () => {
    if (!xHandle.trim() || !instagramHandle.trim()) {
      setStatus("Add both X and Instagram handles.");
      return;
    }
    setSocialsLinked(xHandle.trim(), instagramHandle.trim());
    setStatus("Social profiles linked.");
  };

  const verifyHuman = () => {
    if (!address) return;
    if (!window.ethereum?.isMiniPay) {
      setStatus("Self verification is only enabled in MiniPay environment.");
      return;
    }
    fetch("/api/identity/self-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, proof: "self-proof-placeholder" }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setHumanVerified();
        setStatus("Human verification completed and anchored on-chain.");
        toast.success("Self verification anchored on-chain.");
      })
      .catch((e) => {
        setStatus((e as Error).message);
        toast.error((e as Error).message);
      });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Verify identity</h2>
        <span className="text-[11px] text-slate-500">Level {profile.verificationLevel}/3</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <span
          className={`rounded-full px-2 py-1 text-center border ${
            profile.phoneVerified
              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
              : "border-amber-300 bg-amber-50 text-amber-700"
          }`}
        >
          L1 Phone
        </span>
        <span
          className={`rounded-full px-2 py-1 text-center border ${
            profile.socialsLinked
              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
              : "border-amber-300 bg-amber-50 text-amber-700"
          }`}
        >
          L2 Socials
        </span>
        <span
          className={`rounded-full px-2 py-1 text-center border ${
            profile.humanVerified
              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
              : "border-amber-300 bg-amber-50 text-amber-700"
          }`}
        >
          L3 Human
        </span>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-600">1) Verify phone (SocialConnect)</label>
        <input
          className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm"
          placeholder="+234..."
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
        />
        <button
          type="button"
          disabled={!address || loading}
          onClick={verifyPhone}
          className="h-11 w-full rounded-full bg-[#35D07F] text-white text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify phone"}
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-600">2) Link socials</label>
        <input
          className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm"
          placeholder="X handle"
          value={xHandle}
          onChange={(e) => setXHandle(e.target.value)}
        />
        <input
          className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm"
          placeholder="Instagram handle"
          value={instagramHandle}
          onChange={(e) => setInstagramHandle(e.target.value)}
        />
        <button
          type="button"
          onClick={linkSocials}
          className="h-11 w-full rounded-full border border-slate-200 bg-white text-slate-700 text-sm font-medium"
        >
          Link socials
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-600">3) Human verification (Self)</label>
        <p className="text-[11px] text-slate-500">
          Self uses ZK proofs so your personal data is not stored in plaintext on-chain.
        </p>
        <button
          type="button"
          onClick={verifyHuman}
          className="h-11 w-full rounded-full bg-[#35D07F] text-white text-sm font-medium"
        >
          Complete Self verification
        </button>
      </div>

      {status ? <p className="text-xs text-slate-600">{status}</p> : null}
    </section>
  );
}

