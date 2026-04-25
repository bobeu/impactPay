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

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [injectedWallet],
    },
  ],
  {
    appName: 'ImpactPay',
    projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? '044601f65212332475a09bc14ceb3c34',
  }
);

const config = createConfig({
  chains: [celoSepolia, celo],
  connectors,
  transports: {
    // [celoSepolia.id]: http(process.env.NEXT_PUBLIC_CELOSEPOLIA_RPC_URL),
    [celoSepolia.id]: http(),
    [celo.id]: http(),
  },
});

const queryClient = new QueryClient();

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={
            lightTheme({
                accentColor: '#001B3D',
                accentColorForeground: 'white',
                borderRadius: 'medium',
              })}
              initialChain={celo.id}
        >
          <ImpactPayProvider>
            {typeof window !== 'undefined' ? (
              <BrowserRouter>
                <UserProfileProvider>
                  <MiniPayAutoConnect />
                  <Layout>{children}</Layout>
                </UserProfileProvider>
              </BrowserRouter>
            ) : (
              <MemoryRouter>
                <UserProfileProvider>
                  <MiniPayAutoConnect />
                  <Layout>{children}</Layout>
                </UserProfileProvider>
              </MemoryRouter>
            )}
          </ImpactPayProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
