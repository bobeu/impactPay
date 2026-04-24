"use client";

import { useImpactPay } from "@/contexts/ImpactPayContext";
import { useState } from "react";
import { parseUnits } from "viem";

export function DevSubscriptionCard() {
  const { createGoal } = useImpactPay();
  const [provider, setProvider] = useState<string>("Cursor");
  const [amount, setAmount] = useState<number>(20);
  const [status, setStatus] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [extraInfo, setExtraInfo] = useState<string>("");

  const disabled = provider === '' || amount === 0;

  const handleCreateSubGoal = async() => {
    if (description.split(' ').length > 500 || extraInfo.split(' ').length > 500) {
      setStatus("Description or extra info exceeds 500 words limit.");
      return;
    }
    
    await createGoal({
      description,
      extraInfo,
      goalType: 'DEFAULT',
      targetAmount: parseUnits(amount.toString(), 18),
      billServiceIndex: 0,
      serviceType: 'subscription'
    });
  }

  return (
    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm space-y-2">
      <h2 className="text-sm font-semibold text-slate-800">Developer Subscription Goal</h2>
      <div className="flex justify-between w-auto items-center">
        <select className="h-11 border border-slate-200 rounded-md px-3 text-sm" value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option>Cursor</option>
          <option>OpenAI</option>
          <option>GitHub</option>
          <option>Notion</option>
        </select>
        <input
          className="h-11 border border-slate-200 rounded-md px-3 text-sm"
          value={amount}
          type="number"
          min="1"
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Plan amount in USD"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">Description</label>
        <p className="text-[10px] text-slate-500">Please be elaborate but keep it short (max 500 words).</p>
        <textarea
          className="w-full border border-slate-200 rounded-md p-3 text-sm resize-none h-24"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Why do you need this subscription?"
        />
        <div className="text-right text-[10px] text-slate-400">
          {description.split(/\s+/).filter(Boolean).length}/500 words
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">Extra Information (Optional)</label>
        <p className="text-[10px] text-slate-500">Additional links or details (max 500 words).</p>
        <textarea
          className="w-full border border-slate-200 rounded-md p-3 text-sm resize-none h-20"
          value={extraInfo}
          onChange={(e) => setExtraInfo(e.target.value)}
          placeholder="Any extra context or links?"
        />
        <div className="text-right text-[10px] text-slate-400">
          {extraInfo.split(/\s+/).filter(Boolean).length}/500 words
        </div>
      </div>

      <button
        type="button"
        disabled={disabled}
        className="h-11 w-full rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium"
        onClick={async() => { 
          setStatus(`Subscription goal drafted: ${provider} ($${amount}).`);
          await handleCreateSubGoal();
        }
      }
      >
        Create Dev-Sub Goal
      </button>
      {status ? <p className="text-xs text-slate-600">{status}</p> : null}
    </section>
  );
}

