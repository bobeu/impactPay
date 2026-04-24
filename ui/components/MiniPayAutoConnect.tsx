"use client";

import { useEffect, useRef } from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

/**
 * MiniPay exposes an injected EIP-1193 provider; connection must be implicit (no Connect button).
 * Also auto-connects other injected wallets on first load when available.
 */
export function MiniPayAutoConnect() {
  const { isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const tried = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || isConnected || tried.current) return;
    if (!window.ethereum) return;
    tried.current = true;
    connectAsync({
      connector: injected({ target: "metaMask" }),
    }).catch(() => {});
  }, [isConnected, connectAsync]);

  return null;
}
