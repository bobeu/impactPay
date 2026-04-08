"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected } from "wagmi/connectors";

import Layout from "@/components/Layout";
import { MiniPayAutoConnect } from "@/components/MiniPayAutoConnect";

const config = createConfig({
  chains: [celoAlfajores, celo],
  connectors: [
    injected({
      target: "metaMask",
    }),
  ],
  transports: {
    [celoAlfajores.id]: http(),
    [celo.id]: http(),
  },
});

const queryClient = new QueryClient();

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <MiniPayAutoConnect />
        <Layout>{children}</Layout>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
