import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// In a real production setup, you would use '@veramo/core' or similar libraries
// combined with a did:key or did:web environment var to properly sign JSON-LD credentials.
// For this scaffolding/Last-Mile structure, we produce the standardized W3C JSON-LD schema payload.

export async function POST(req: NextRequest) {
  try {
    const { address, milestoneName, achievedAt } = await req.json();

    if (!address || !milestoneName) {
      return NextResponse.json({ error: 'Missing address or milestoneName' }, { status: 400 });
    }

    // Typical issuer DID
    const issuerDID = process.env.ISSUER_DID || "did:web:impactpay.example.com";
    
    // Generate JSON-LD Credential format
    const credential = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://beta.verifiablecredential.dev/v1"
      ],
      "id": `urn:uuid:${crypto.randomUUID()}`,
      "type": ["VerifiableCredential", "ImpactPayMilestoneCredential"],
      "issuer": {
        "id": issuerDID,
        "name": "ImpactPay Celo Protocol"
      },
      "issuanceDate": new Date().toISOString(),
      "credentialSubject": {
        "id": `did:pkh:eip155:42220:${address.toLowerCase()}`, // Celo mainnet chain id format 
        "milestone": milestoneName,
        "achievedAt": achievedAt || new Date().toISOString(),
        "platform": "ImpactPay"
      },
      "proof": {
        "type": "Ed25519Signature2018",
        "created": new Date().toISOString(),
        "verificationMethod": `${issuerDID}#keys-1`,
        "proofPurpose": "assertionMethod",
        // This is a placeholder payload for the signature
        "jws": "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..placeholder_signature_replace_via_veramo_signer"
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Verifiable Credential generated',
      credential
    });
  } catch (error) {
    console.error("VC generation error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
