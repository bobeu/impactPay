import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { retryStore, type RetryPayload } from "@/lib/fulfillment-retry-store";

const impactPayAbi = [
  {
    type: "function",
    name: "markBillFulfilled",
    stateMutability: "nonpayable",
    inputs: [{ name: "goalId", type: "uint256" }],
    outputs: [],
  },
] as const;

const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] } },
});

function validatePayload(body: unknown): RetryPayload {
  const x = body as Partial<RetryPayload> & { retryToken?: string; operator_id?: string; value?: number };
  if (
    typeof x.goalId !== "number" ||
    !x.billerCategory ||
    !x.providerCode ||
    !x.customerReference ||
    typeof x.amount !== "number"
  ) {
    throw new Error("Invalid payload: goalId, billerCategory, providerCode, customerReference, amount required");
  }
  return {
    goalId: x.goalId,
    billerCategory: x.billerCategory,
    providerCode: x.operator_id ?? x.providerCode,
    customerReference: x.customerReference,
    amount: x.value ?? x.amount,
    feeCurrency: x.feeCurrency,
  };
}

async function callBitGifty(payload: RetryPayload) {
  const key = process.env.BITGIFTY_API_KEY;
  const baseUrl = process.env.BITGIFTY_BASE_URL || "https://vbaas.vfdtech.ng";
  if (!key) throw new Error("BITGIFTY_API_KEY is missing");
  if (!baseUrl.startsWith("https://")) throw new Error("BITGIFTY_BASE_URL must use HTTPS");

  const schema = payload as RetryPayload & {
    customerId?: string;
    division?: string;
    paymentItem?: string;
    productId?: string;
    billerId?: string;
    reference?: string;
    phoneNumber?: string;
  };
  const division = schema.division || process.env.BITGIFTY_DIVISION;
  const paymentItem = schema.paymentItem || process.env.BITGIFTY_PAYMENT_ITEM;
  const productId = schema.productId || process.env.BITGIFTY_PRODUCT_ID;
  const billerId = schema.billerId || process.env.BITGIFTY_BILLER_ID;
  if (!schema.customerId || !division || !paymentItem || !productId || !billerId || !schema.reference) {
    throw new Error("Missing live payload keys: customerId, division, paymentItem, productId, billerId, reference");
  }

  const response = await fetch(`${baseUrl}/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      AccessToken: key,
    },
    body: JSON.stringify({
      customerId: schema.customerId,
      amount: String(payload.amount),
      division,
      paymentItem,
      productId,
      billerId,
      reference: schema.reference,
      phoneNumber: schema.phoneNumber,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BitGifty service error: ${response.status} ${text}`);
  }
  return response.json();
}

async function markGoalFulfilledOnChain(goalId: number) {
  const privateKey = process.env.BACKEND_SIGNER_PRIVATE_KEY as `0x${string}` | undefined;
  const contractAddress = process.env.IMPACTPAY_CONTRACT_ADDRESS as `0x${string}` | undefined;
  if (!privateKey || !contractAddress) {
    throw new Error("BACKEND_SIGNER_PRIVATE_KEY or IMPACTPAY_CONTRACT_ADDRESS missing");
  }

  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    account,
    chain: celoSepolia,
    transport: http(process.env.CELO_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org"),
  });

  const txHash = await client.writeContract({
    address: contractAddress,
    abi: impactPayAbi,
    functionName: "markBillFulfilled",
    args: [BigInt(goalId)],
  });

  return txHash;
}

import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ip = (req as any).ip || req.headers.get("x-forwarded-for") || "127.0.0.1";
  
  try {
    // 1. Rate Limiting check
    const { success } = await checkRateLimit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const sharedSecret = req.headers.get("x-impactpay-secret");
    if (!sharedSecret || sharedSecret !== process.env.FULFILL_BILL_SHARED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const retryToken = body.retryToken as string | undefined;

    let payload: RetryPayload;
    if (retryToken) {
      const cached = retryStore.get(retryToken);
      if (!cached) {
        return NextResponse.json({ error: "Invalid retryToken" }, { status: 400 });
      }
      payload = cached;
    } else {
      payload = validatePayload(body);
    }

    const bitgifty = await callBitGifty(payload);
    const onChainTx = await markGoalFulfilledOnChain(payload.goalId);

    if (retryToken) retryStore.delete(retryToken);
    return NextResponse.json({
      success: true,
      bitgifty,
      onChainTx,
    });
  } catch (error) {
    let payloadForRetry: RetryPayload | null = null;
    try {
      payloadForRetry = validatePayload(body);
    } catch {
      payloadForRetry = null;
    }

    let retryToken: string | undefined;
    if (payloadForRetry) {
      retryToken = randomUUID();
      retryStore.set(retryToken, payloadForRetry);
    }

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Fulfillment failed",
        retryToken,
        retryHint: retryToken
          ? "Call POST /api/fulfill-bill with { retryToken } to retry."
          : "Send the full request payload again.",
      },
      { status: 502 },
    );
  }
}

