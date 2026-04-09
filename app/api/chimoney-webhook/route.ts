import { NextRequest, NextResponse } from "next/server";

import { updateCardWebhook } from "@/lib/virtual-card-store";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-chimoney-signature");
    if (!secret || secret !== process.env.CHIMONEY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
    }

    const body = await req.json();
    const goalId = Number(body?.metadata?.goalId ?? body?.goalId);
    const status = body?.status === "success" ? "issued" : "failed";

    if (goalId) updateCardWebhook(goalId, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

