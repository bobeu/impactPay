import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { phoneMappings } from "@/lib/socialconnect-store";

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phoneNumber = normalizePhone(body.phoneNumber ?? "");
    const walletAddress = String(body.walletAddress ?? "");

    if (!phoneNumber || !walletAddress) {
      return NextResponse.json(
        { error: "phoneNumber and walletAddress are required" },
        { status: 400 },
      );
    }

    // Placeholder ODIS-style obfuscation for local dev.
    // Swap with @celo/identity OdisUtils.Identifier.getObfuscatedIdentifier in production.
    const obfuscatedIdentifier = createHash("sha256")
      .update(`PHONE:${phoneNumber}`)
      .digest("hex");

    phoneMappings.set(obfuscatedIdentifier, {
      obfuscatedIdentifier,
      phoneNumber,
      address: walletAddress.toLowerCase(),
      createdAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      obfuscatedIdentifier,
      address: walletAddress.toLowerCase(),
      provider: "mock-odis",
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Invalid request" },
      { status: 500 },
    );
  }
}

