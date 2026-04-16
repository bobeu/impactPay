"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { celo } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";
import Layout from "@/components/Layout";
import { MiniPayAutoConnect } from "@/components/MiniPayAutoConnect";
import { UserProfileProvider } from "@/contexts/UserProfileContext";

const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] } },
});

const config = createConfig({
  chains: [celoSepolia, celo],
  connectors: [
    injected({
      target: "metaMask",
    }),
  ],
  transports: {
    [celoSepolia.id]: http("https://forno.celo-sepolia.celo-testnet.org"),
    [celo.id]: http(),
  },
});

const queryClient = new QueryClient();

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <UserProfileProvider>
          <MiniPayAutoConnect />
          <Layout>{children}</Layout>
        </UserProfileProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
