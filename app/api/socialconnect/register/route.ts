import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { phoneMappings, handleMappings } from "@/lib/socialconnect-store";

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "");
}

function normalizeHandle(handle: string) {
  return handle.trim().replace(/^@/, "").toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phoneNumber = body.phoneNumber ? normalizePhone(body.phoneNumber) : null;
    const handle = body.handle ? normalizeHandle(body.handle) : null;
    const walletAddress = String(body.walletAddress ?? "");

    if ((!phoneNumber && !handle) || !walletAddress) {
      return NextResponse.json(
        { error: "phoneNumber or handle, and walletAddress are required" },
        { status: 400 },
      );
    }

    let obfuscatedIdentifier = "";
    if (phoneNumber) {
      obfuscatedIdentifier = createHash("sha256")
        .update(`PHONE:${phoneNumber}`)
        .digest("hex");

      phoneMappings.set(obfuscatedIdentifier, {
        obfuscatedIdentifier,
        phoneNumber,
        address: walletAddress.toLowerCase(),
        createdAt: Date.now(),
      });
    }

    if (handle) {
      const handleId = createHash("sha256")
        .update(`HANDLE:${handle}`)
        .digest("hex");

      handleMappings.set(handleId, {
        obfuscatedIdentifier: handleId,
        handle,
        address: walletAddress.toLowerCase(),
        createdAt: Date.now(),
      });
      // If we only have handle, use this id
      if (!obfuscatedIdentifier) obfuscatedIdentifier = handleId;
    }

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

