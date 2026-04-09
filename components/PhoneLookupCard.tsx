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
      {result ? <p className="text-xs text-slate-600">{result}</p> : null}
    </section>
  );
}

