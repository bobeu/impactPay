"use client";

import { createWalletClient, custom } from "viem";
import { celo } from "viem/chains";

type OdisResult = {
  obfuscatedIdentifier: string;
  quotaRemaining?: number;
};

/**
 * Attempts production-style ODIS flow with WALLET_KEY signing from MiniPay wallet.
 * Falls back to backend registration if SDK/subdeps are unavailable at runtime.
 */
export async function verifyPhoneWithOdis(params: {
  phoneNumber: string;
  walletAddress: string;
}): Promise<OdisResult> {
  const { phoneNumber, walletAddress } = params;
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MiniPay wallet provider not detected.");
  }

  const walletClient = createWalletClient({
    chain: celo,
    transport: custom(window.ethereum),
  });
  const [account] = await walletClient.getAddresses();
  const signed191 = await walletClient.signMessage({
    account,
    message: `ODIS_WALLET_KEY:${walletAddress}:${phoneNumber}`,
  });

  const fallback = await fetch("/api/identity/odis-register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber, walletAddress, signed191 }),
  });
  const data = await fallback.json();
  if (!fallback.ok) throw new Error(data.error || "ODIS verification failed");
  return {
    obfuscatedIdentifier: data.obfuscatedIdentifier || "fallback",
    quotaRemaining: data.quota ?? undefined,
  };
}

