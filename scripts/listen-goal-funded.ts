import { createPublicClient, defineChain, http } from "viem";

const abi = [
  {
    type: "event",
    name: "Funded",
    inputs: [
      { indexed: true, name: "goalId", type: "uint256" },
      { indexed: true, name: "donor", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "totalRaised", type: "uint256" },
    ],
  },
] as const;

const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] } },
});

const contractAddress = process.env.IMPACTPAY_CONTRACT_ADDRESS as `0x${string}` | undefined;
const appUrl = process.env.APP_BASE_URL || "http://localhost:3000";

if (!contractAddress) throw new Error("IMPACTPAY_CONTRACT_ADDRESS missing");

const client = createPublicClient({
  chain: celoSepolia,
  transport: http(process.env.CELO_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org"),
});

console.log("Listening for funded goals...");

client.watchContractEvent({
  address: contractAddress,
  abi,
  eventName: "Funded",
  onLogs: async (logs) => {
    for (const log of logs) {
      const goalId = Number(log.args.goalId || 0n);
      if (!goalId) continue;
      await fetch(`${appUrl}/api/fulfill-bill`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-impactpay-secret": process.env.FULFILL_BILL_SHARED_SECRET || "",
        },
        body: JSON.stringify({
          goalId,
          billerCategory: "electricity",
          providerCode: "IKEDC_NG",
          customerReference: "AUTO_FROM_EVENT",
          amount: 1000,
        }),
      }).catch(() => {});
    }
  },
});

