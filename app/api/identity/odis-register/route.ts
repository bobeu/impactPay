import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, walletAddress } = body;
    if (!phoneNumber || !walletAddress) {
      return NextResponse.json({ error: "phoneNumber and walletAddress required" }, { status: 400 });
    }

    // Production glue: dynamic import lets the app boot even if dependency is absent in local environments.
    const identity = await import("@celo/identity");
    const { OdisUtils } = identity as any;

    const authSigner = {
      authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
      // Production requires EIP-191 sign from wallet key owner; here we provide a server-side placeholder.
      sign191: async (_args: any) => {
        throw new Error("WALLET_KEY sign191 must be executed from user's MiniPay wallet context");
      },
    };

    const serviceContext = OdisUtils.Query.getServiceContext(OdisUtils.Query.OdisContextName.MAINNET);
    const quota = await OdisUtils.Quota.getPnpQuotaStatus(walletAddress, authSigner, serviceContext).catch(() => null);

    return NextResponse.json({
      success: true,
      serviceContext: "MAINNET",
      quota: quota?.remainingQuota ?? null,
      note: "Use client wallet signer in MiniPay to complete ODIS obfuscation and quota top-up flow.",
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

