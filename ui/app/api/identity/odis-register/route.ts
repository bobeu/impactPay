import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, walletAddress, signed191 } = body;
    if (!phoneNumber || !walletAddress || !signed191) {
      return NextResponse.json({ error: "phoneNumber, walletAddress and signed191 required" }, { status: 400 });
    }
    const quota = 1;
    const obfuscatedIdentifier = createHash("sha256")
      .update(`PHONE:${phoneNumber}:${walletAddress}`)
      .digest("hex");

    return NextResponse.json({
      success: true,
      serviceContext: "MAINNET",
      quota,
      obfuscatedIdentifier,
      note: "WALLET_KEY signature received. Connect ODIS SDK server-side with this signed payload for final production rollout.",
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

