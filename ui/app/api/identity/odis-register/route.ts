import { NextRequest, NextResponse } from "next/server";
import { newKit } from "@celo/contractkit";
import { OdisUtils } from "@celo/identity";
import type { AuthSigner } from "@celo/identity/lib/odis/query";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, walletAddress, signed191 } = body;
    if (!phoneNumber || !walletAddress || !signed191) {
      return NextResponse.json({ error: "phoneNumber, walletAddress and signed191 required" }, { status: 400 });
    }

    const rpcUrl = process.env.CELO_RPC_URL || "https://forno.celo.org";
    const walletPrivateKey = process.env.BACKEND_SIGNER_PRIVATE_KEY;
    
    if (!walletPrivateKey) {
      return NextResponse.json({ error: "Backend signer private key not configured" }, { status: 500 });
    }

    const kit = newKit(rpcUrl);
    const pk = walletPrivateKey.startsWith("0x")
      ? walletPrivateKey
      : `0x${walletPrivateKey}`;
    kit.addAccount(pk);
    const locals = kit.connection.getLocalAccounts();
    if (!locals.length) throw new Error("No local account");
    kit.defaultAccount = locals[0];
    const quotaAccount = locals[0];

    const serviceContext = OdisUtils.Query.getServiceContext(
      OdisUtils.Query.OdisContextName.MAINNET,
      OdisUtils.Query.OdisAPI.PNP,
    );

    const authSigner: AuthSigner = {
      authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
      contractKit: kit,
    };

    const { obfuscatedIdentifier } =
      await OdisUtils.Identifier.getObfuscatedIdentifier(
        phoneNumber,
        OdisUtils.Identifier.IdentifierPrefix.PHONE_NUMBER,
        quotaAccount,
        authSigner,
        serviceContext,
      );

    const { remainingQuota } = await OdisUtils.Quota.getPnpQuotaStatus(
      quotaAccount,
      authSigner,
      serviceContext
    );

    return NextResponse.json({
      success: true,
      serviceContext: "MAINNET",
      quota: remainingQuota,
      obfuscatedIdentifier,
      note: "ODIS verified",
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

