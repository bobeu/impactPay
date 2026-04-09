import { useState } from "react";
import {
    formatEther,
    createPublicClient,
    createWalletClient,
    custom,
    defineChain,
    http,
} from "viem";

const celoSepolia = defineChain({
    id: 11142220,
    name: "Celo Sepolia",
    nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
    rpcUrls: { default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] } },
});

const publicClient = createPublicClient({
    chain: celoSepolia,
    transport: http("https://forno.celo-sepolia.celo-testnet.org"),
});

function getInjectedProvider() {
    if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No injected wallet (open in MiniPay or a Web3 browser).");
    }
    return window.ethereum;
}

export const useWeb3 = () => {
    const getGasReadiness = async () => {
        const provider = getInjectedProvider();
        const walletClient = createWalletClient({
            transport: custom(provider),
            chain: celoSepolia,
        });
        const [account] = await walletClient.getAddresses();
        const balance = await publicClient.getBalance({ address: account });
        const gas = BigInt(21000);
        const gasPrice = await publicClient.getGasPrice();
        const estimatedCost = gas * gasPrice;
        return {
            hasEnough: balance > estimatedCost,
            estimatedGas: gas.toString(),
            estimatedCostCELO: formatEther(estimatedCost),
        };
    };

    const [address, setAddress] = useState<string | null>(null);

    const getUserAddress = async () => {
        if (typeof window === "undefined") return;
        const provider = window.ethereum;
        if (!provider) return;
        const walletClient = createWalletClient({
            transport: custom(provider),
            chain: celoSepolia,
        });

        const [addr] = await walletClient.getAddresses();
        setAddress(addr);
    };

    return {
        address,
        getUserAddress,
        getGasReadiness,
    };
};
