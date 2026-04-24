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

    if (!phoneNumber && !handle) {
      return NextResponse.json({ error: "phoneNumber or handle is required" }, { status: 400 });
    }

    if (phoneNumber) {
      const obfuscatedIdentifier = createHash("sha256")
        .update(`PHONE:${phoneNumber}`)
        .digest("hex");

      const mapping = phoneMappings.get(obfuscatedIdentifier);
      if (mapping) {
        return NextResponse.json({
          found: true,
          address: mapping.address,
          type: 'phone',
          obfuscatedIdentifier,
        });
      }
    }

    if (handle) {
      const handleId = createHash("sha256")
        .update(`HANDLE:${handle}`)
        .digest("hex");

      const mapping = handleMappings.get(handleId);
      if (mapping) {
        return NextResponse.json({
          found: true,
          address: mapping.address,
          type: 'handle',
          handle: mapping.handle,
          obfuscatedIdentifier: handleId,
        });
      }
    }

    return NextResponse.json({ found: false, message: "No mapping found" });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Invalid request" },
      { status: 500 },
    );
  }
}

