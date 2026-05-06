"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { celo, celoSepolia } from "wagmi/chains";
import Layout from "@/components/Layout";
import { MiniPayAutoConnect } from "@/components/MiniPayAutoConnect";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { connectorsForWallets, RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import '@rainbow-me/rainbowkit/styles.css';
import { ImpactPayProvider } from "@/contexts/ImpactPayContext";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { useState, useEffect } from "react";
import { PrivyProvider } from "@privy-io/react-auth";

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [injectedWallet],
    },
  ],
  {
    appName: 'ImpactPay',
    projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? '57c6763cf4e4966b74168daa46a06d2b',
  }
);

const config = createConfig({
  chains: [celo, celoSepolia],
  connectors,
  transports: {
    [celo.id]: http(),
    [celoSepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.ethereum?.isMiniPay) {
      setIsMiniPay(true);
    }
  }, []);

  const Router = typeof window !== 'undefined' ? BrowserRouter : MemoryRouter;

  const content = (
    <ImpactPayProvider>
      <Router>
        <UserProfileProvider>
          <MiniPayAutoConnect />
          <Layout>{children}</Layout>
        </UserProfileProvider>
      </Router>
    </ImpactPayProvider>
  );

  if (!mounted) return null;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={
            lightTheme({
                accentColor: '#0f172a', // slate-900
                accentColorForeground: 'white',
                borderRadius: 'medium',
              })}
              initialChain={celo.id}
        >
          {!isMiniPay ? (
            <PrivyProvider
              appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cm4m2v7w002k212v2d3q3b3v3"}
              config={{
                appearance: {
                  theme: 'light',
                  accentColor: '#0f172a',
                  showWalletLoginFirst: true,
                },
              }}
            >
              {content}
            </PrivyProvider>
          ) : (
            content
          )}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
