// import { createHash } from "node:crypto";
// import { NextRequest, NextResponse } from "next/server";

// import { phoneMappings, handleMappings } from "@/lib/socialconnect-store";

// function normalizePhone(phone: string) {
//     return phone.replace(/\s+/g, "");
// }

// function normalizeHandle(handle: string) {
//     return handle.trim().replace(/^@/, "").toLowerCase();
// }

// export async function POST(req: NextRequest) {
//     try {
//         const body = await req.json();
//         const phoneNumber = body.phoneNumber ? normalizePhone(body.phoneNumber) : null;
//         const handle = body.handle ? normalizeHandle(body.handle) : null;

//         if (!phoneNumber && !handle) {
//             return NextResponse.json({ error: "phoneNumber or handle is required" }, { status: 400 });
//         }

//         if (phoneNumber) {
//             const obfuscatedIdentifier = createHash("sha256")
//                 .update(`PHONE:${phoneNumber}`)
//                 .digest("hex");

//             const mapping = phoneMappings.get(obfuscatedIdentifier);
//             if (mapping) {
//                 return NextResponse.json({
//                     found: true,
//                     address: mapping.address,
//                     type: 'phone',
//                     obfuscatedIdentifier,
//                 });
//             }
//         }

//         if (handle) {
//             const handleId = createHash("sha256")
//                 .update(`HANDLE:${handle}`)
//                 .digest("hex");

//             const mapping = handleMappings.get(handleId);
//             if (mapping) {
//                 return NextResponse.json({
//                     found: true,
//                     address: mapping.address,
//                     type: 'handle',
//                     handle: mapping.handle,
//                     obfuscatedIdentifier: handleId,
//                 });
//             }
//         }

//         return NextResponse.json({ found: false, message: "No mapping found" });
//     } catch (error) {
//         return NextResponse.json(
//             { error: (error as Error).message || "Invalid request" },
//             { status: 500 },
//         );
//     }
// }







import { NextRequest, NextResponse } from "next/server";
import { newKit } from "@celo/contractkit";
import { OdisUtils } from "@celo/identity";
import type { AuthSigner } from "@celo/identity/lib/odis/query";

const MINIPAY_ISSUER = "0x7888612486844Bb9BE598668081c59A9f7367FBc";

function normalizePhone(phone: string) {
  let p = phone.replace(/\s+/g, "");
  if (!p.startsWith("+")) p = "+" + p;
  return p;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: "phoneNumber is required" }, { status: 400 });
    }

    const phoneE164 = normalizePhone(phoneNumber);
    const rpcUrl = process.env.CELO_RPC_URL || "https://forno.celo.org";
    const walletPrivateKey = process.env.BACKEND_SIGNER_PRIVATE_KEY;

    if (!walletPrivateKey) {
      return NextResponse.json({ error: "Backend signer not configured" }, { status: 500 });
    }

    const kit = newKit(rpcUrl);
    const pk = walletPrivateKey.startsWith("0x") ? walletPrivateKey : `0x${walletPrivateKey}`;
    kit.addAccount(pk);
    const locals = kit.connection.getLocalAccounts();
    kit.defaultAccount = locals[0];
    const quotaAccount = locals[0];

    const serviceContext = OdisUtils.Query.getServiceContext(
      OdisUtils.Query.OdisContextName.MAINNET,
      OdisUtils.Query.OdisAPI.PNP,
    );

    const authSigner: AuthSigner = {
      authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
      contractKit: kit as any,
    };

    // 1. Get Obfuscated Identifier from ODIS
    const { obfuscatedIdentifier } = await OdisUtils.Identifier.getObfuscatedIdentifier(
      phoneE164,
      OdisUtils.Identifier.IdentifierPrefix.PHONE_NUMBER,
      quotaAccount,
      authSigner,
      serviceContext,
    );

    // 2. Lookup on FederatedAttestations
    const federated = await kit.contracts.getFederatedAttestations();
    const { accounts } = await federated.lookupAttestations(obfuscatedIdentifier, [
      MINIPAY_ISSUER,
    ]);

    if (accounts && accounts.length > 0) {
      return NextResponse.json({
        found: true,
        address: accounts[0],
        type: 'phone',
        obfuscatedIdentifier,
      });
    }

    return NextResponse.json({ found: false, message: "No mapping found on Celo Mainnet" });
  } catch (error) {
    console.error("ODIS Lookup Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 },
    );
  }
}