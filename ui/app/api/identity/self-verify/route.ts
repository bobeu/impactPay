import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const impactPayAbi = [
  {
    type: "function",
    name: "onVerificationSuccess",
    stateMutability: "nonpayable",
    inputs: [{ name: "user", type: "address" }],
    outputs: [],
  },
] as const;

const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] } },
});

export async function POST(req: NextRequest) {
  try {
    const { address, proof } = await req.json();
    if (!address || !proof) return NextResponse.json({ error: "address and proof required" }, { status: 400 });

    // In production this is where Self SDK proof verification should be executed server-side.
    const privateKey = process.env.BACKEND_SIGNER_PRIVATE_KEY as `0x${string}` | undefined;
    const contractAddress = process.env.IMPACTPAY_CONTRACT_ADDRESS as `0x${string}` | undefined;
    if (!privateKey || !contractAddress) throw new Error("Signer or contract not configured");

    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
      account,
      chain: celoSepolia,
      transport: http(process.env.CELO_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org"),
    });

    const tx = await client.writeContract({
      address: contractAddress,
      abi: impactPayAbi,
      functionName: "onVerificationSuccess",
      args: [address],
    });

    return NextResponse.json({ success: true, tx });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

