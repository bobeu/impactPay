/**
 * Production Environment Variable Validator
 * Ensures all critical keys are present before build/runtime.
 */
const REQUIRED_ENV_VARS = [
  "BITGIFTY_API_KEY",
  "CHIMONEY_API_KEY",
  "BACKEND_SIGNER_PRIVATE_KEY",
  "SUBGRAPH_QUERY_URL",
  "CELO_RPC_URL",
  "IMPACTPAY_CONTRACT_ADDRESS",
  "FULFILL_BILL_SHARED_SECRET",
  "SELF_PROTOCOL_ADDRESS",
  "SOCIALCONNECT_REGISTRY_ADDRESS",
  "NEXT_PUBLIC_SOCIALCONNECT_ISSUER_ADDRESS",
  "NEXT_PUBLIC_CELO_NETWORK", // 'mainnet' or 'sepolia'
];

function checkEnv() {
  console.log("🔍 Auditing environment variables for production readiness...");
  
  const missing = [];
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error("\n❌ CRITICAL ERROR: Missing required environment variables:");
    missing.forEach(v => console.error(`   - ${v}`));
    console.error("\nFailing build to prevent insecure deployment.\n");
    process.exit(1);
  }

  console.log("✅ All critical production keys verified.");
}

checkEnv();
