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
    if (!phoneNumber) {
      return NextResponse.json({ error: "phoneNumber is required" }, { status: 400 });
    }

    const obfuscatedIdentifier = createHash("sha256")
      .update(`PHONE:${phoneNumber}`)
      .digest("hex");

    const mapping = phoneMappings.get(obfuscatedIdentifier);
    if (!mapping) {
      return NextResponse.json({ found: false, message: "No mapping found" });
    }

    return NextResponse.json({
      found: true,
      address: mapping.address,
      obfuscatedIdentifier,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Invalid request" },
      { status: 500 },
    );
  }
}

