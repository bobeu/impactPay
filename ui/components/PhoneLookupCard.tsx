"use client";

import { useState } from "react";

import { lookupByPhone } from "@/lib/socialconnect";

export function PhoneLookupCard() {
  const [queryPhone, setQueryPhone] = useState("");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onLookup = async () => {
    if (!queryPhone.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const data = await lookupByPhone(queryPhone);
      if (data.found && data.address) {
        setResult(`Mapped wallet: ${data.address}`);
      } else {
        setResult("No wallet mapping found for this phone number.");
      }
    } catch (error) {
      setResult((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm space-y-2">
      <h2 className="text-sm font-semibold text-slate-800">Search by phone</h2>
      <p className="text-[11px] text-slate-500">
        Phone numbers are masked (ODIS-style obfuscation) before lookup.
      </p>
      <input
        className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm"
        placeholder="+234..."
        value={queryPhone}
        onChange={(e) => setQueryPhone(e.target.value)}
      />
      <button
        type="button"
        onClick={onLookup}
        disabled={loading}
        className="h-11 w-full rounded-full border border-slate-200 bg-white text-slate-700 text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Searching..." : "Find friend bills"}
      </button>
      {result && !result.includes("Mapped wallet") ? (
        <div className="mt-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col gap-2">
          <p className="text-xs text-blue-700 font-medium">{result}</p>
          <button 
            onClick={() => {
              const text = `Hey! I'm using ImpactPay to build my on-chain reputation. Join me and let's make an impact together!`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
            }}
            className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1 hover:text-blue-800 transition-colors"
          >
            Invite to ImpactPay 
            <span className="text-lg">→</span>
          </button>
        </div>
      ) : result ? (
        <p className="text-xs text-slate-600 mt-2 font-mono break-all bg-slate-50 p-2 rounded-lg border border-slate-100">{result}</p>
      ) : null}
    </section>
  );
}

