import { useState } from "react";
import {
    formatEther,
    createPublicClient,
    createWalletClient,
    custom,
    http,
} from "viem";
import { celoSepolia, celo } from "viem/chains";

export type Address = `0x${string}`;

export interface BroadcastParam {
    abi: any;
    address: Address;
    functionName: string;
    args: any[];
    feeCurrency: Address;
}

function getPublicClient(chainId: number) {
    const publicClient = createPublicClient({
        chain: chainId === celoSepolia.id? celoSepolia : celo,
        transport: http(),
    });
    return publicClient;
}


function getInjectedProvider() {
    if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No injected wallet (open in MiniPay or a Web3 browser).");
    }
    return window.ethereum;
}

export const useWeb3 = () => {
    const getGasReadiness = async (chainId: number) => {
        const provider = getInjectedProvider();
        const walletClient = createWalletClient({
            transport: custom(provider),
            chain: celoSepolia,
        });

        const publicClient = getPublicClient(chainId);
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

     const broadcastTransaction = async (params: BroadcastParam, chainId: number) => {
        let walletClient = createWalletClient({
            transport: custom(window.ethereum),
            chain: chainId === celoSepolia.id? celoSepolia : celo,
        });

        let [address] = await walletClient.getAddresses();

        const tx = await walletClient.writeContract({
            ...params,
            account: address
        });
        
        const publicClient = getPublicClient(chainId);
        const receipt = await publicClient.waitForTransactionReceipt({
            hash: tx,
        });

        return receipt;
    };

    return {
        address,
        getUserAddress,
        getGasReadiness,
        broadcastTransaction
    };
};
