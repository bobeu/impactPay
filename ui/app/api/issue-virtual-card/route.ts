import { NextRequest, NextResponse } from "next/server";

import { storeCard } from "@/lib/virtual-card-store";

import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  const ip = (req as any).ip || req.headers.get("x-forwarded-for") || "127.0.0.1";
  const { success } = await checkRateLimit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { goalId, amount, ownerAddress, provider } = body as {
      goalId: number;
      amount: number;
      ownerAddress: string;
      provider: string;
      valueInUSD?: number;
      cardType?: string;
    };

    if (!goalId || !amount || !ownerAddress || !provider) {
      return NextResponse.json({ error: "goalId, amount, ownerAddress, provider required" }, { status: 400 });
    }

    const chimoneyKey = process.env.CHIMONEY_API_KEY;
    const chimoneyBase = process.env.CHIMONEY_BASE_URL || "https://api-v2.chimoney.io";
    if (!chimoneyKey) return NextResponse.json({ error: "CHIMONEY_API_KEY missing" }, { status: 500 });
    if (!chimoneyBase.startsWith("https://")) {
      return NextResponse.json({ error: "CHIMONEY_BASE_URL must use HTTPS" }, { status: 500 });
    }
    const {
      valueInUSD,
      cardType,
      reference,
      issueCardFor,
      redirectUrl,
      meta,
    } = body as {
      valueInUSD?: number;
      cardType?: string;
      reference?: string;
      issueCardFor?: string;
      redirectUrl?: string;
      meta?: Record<string, unknown>;
    };
    const finalCardType = cardType || process.env.CHIMONEY_CARD_TYPE;
    if (!valueInUSD || !finalCardType || !reference || !issueCardFor) {
      return NextResponse.json(
        { error: "Missing live Chimoney keys: valueInUSD, cardType, reference, issueCardFor" },
        { status: 400 },
      );
    }

    // NOTE: endpoint shape may differ by account type; this is a production wiring scaffold.
    const cardRes = await fetch(`${chimoneyBase}/v0.2/payouts/virtual-card`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": chimoneyKey,
      },
      body: JSON.stringify({
        valueInUSD,
        cardType: finalCardType,
        reference,
        issueCardFor,
        redirectUrl,
        metadata: { goalId, provider, ...(meta || {}) },
      }),
    });

    if (!cardRes.ok) {
      const txt = await cardRes.text();
      return NextResponse.json({ error: `Card issue failed: ${txt}` }, { status: 502 });
    }

    const cardData = await cardRes.json();
    storeCard(goalId, ownerAddress, cardData);
    return NextResponse.json({ success: true, goalId, status: "issued_pending_webhook" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

