"use client";

import { useState } from "react";

export function DevSubscriptionCard() {
  const [provider, setProvider] = useState("Cursor");
  const [amount, setAmount] = useState("20");
  const [status, setStatus] = useState("");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
      <h2 className="text-sm font-semibold text-slate-800">Developer Subscription Goal</h2>
      <select className="h-11 border rounded-md px-3 text-sm" value={provider} onChange={(e) => setProvider(e.target.value)}>
        <option>Cursor</option>
        <option>OpenAI</option>
        <option>GitHub</option>
        <option>Notion</option>
      </select>
      <input
        className="h-11 border rounded-md px-3 text-sm"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Plan amount in USD"
      />
      <button
        type="button"
        className="h-11 w-full rounded-full bg-[#35D07F] text-white text-sm font-medium"
        onClick={() => setStatus(`Subscription goal drafted: ${provider} ($${amount}).`)}
      >
        Create Dev-Sub Goal
      </button>
      {status ? <p className="text-xs text-slate-600">{status}</p> : null}
    </section>
  );
}

