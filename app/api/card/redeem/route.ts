import { NextRequest, NextResponse } from "next/server";

import { readCard } from "@/lib/virtual-card-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { goalId, requester } = body as { goalId: number; requester: string };
    if (!goalId || !requester) {
      return NextResponse.json({ error: "goalId and requester required" }, { status: 400 });
    }
    const card = readCard(goalId, requester);
    if (!card) return NextResponse.json({ error: "Card not found or not authorized" }, { status: 404 });
    return NextResponse.json({ success: true, card });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

