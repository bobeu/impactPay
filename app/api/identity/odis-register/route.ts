import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, walletAddress } = body;
    if (!phoneNumber || !walletAddress) {
      return NextResponse.json({ error: "phoneNumber and walletAddress required" }, { status: 400 });
    }

    // Runtime-only loading to avoid bundling Node-incompatible subdeps in Next build.
    const runtimeRequire = eval("require") as NodeRequire;
    const identity = runtimeRequire("@celo/identity");
    const { OdisUtils, OdisContextName } = identity as any;

    const authSigner = {
      authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
      // Production requires EIP-191 sign from wallet key owner; here we provide a server-side placeholder.
      sign191: async (_args: any) => {
        throw new Error("WALLET_KEY sign191 must be executed from user's MiniPay wallet context");
      },
    };

    const serviceContext = OdisUtils.Query.getServiceContext(OdisContextName.MAINNET);
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

