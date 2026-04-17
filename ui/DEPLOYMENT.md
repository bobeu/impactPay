# ImpactPay Deployment Guide

This guide details the steps to transition ImpactPay from development to Celo Mainnet.

## 1. Environment Configuration

Create a `.env.production` file with the following variables:

```bash
# General
NEXT_PUBLIC_CELO_NETWORK=mainnet
CELO_RPC_URL=https://forno.celo.org

# Authentication & Infrastructure
BITGIFTY_API_KEY=your_bitgifty_key
CHIMONEY_API_KEY=your_chimoney_key
SUBGRAPH_QUERY_URL=https://api.studio.thegraph.com/query/...

# Wallets & Secrets
BACKEND_SIGNER_PRIVATE_KEY=0x... # Used to mark bills as fulfilled
FULFILL_BILL_SHARED_SECRET=your_long_random_string

# Infrastructure Addresses
SELF_PROTOCOL_ADDRESS=0x...
SOCIALCONNECT_REGISTRY_ADDRESS=0x...

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

## 2. Infrastructure Deployment

### Redis (Rate Limiting)
1. Create a database at [Upstash](https://upstash.com/).
2. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to your environment.

### Monitoring (Sentry)
1. Initialize Sentry using `bunx sentry-wizard@latest -s -t nextjs`.
2. Ensure `SENTRY_AUTH_TOKEN` is in your CI/CD.

## 3. Smart Contract Deployment

Deploy to Celo Mainnet using Foundry:

```bash
cd contracts
forge script script/DeployMainnet.s.sol --rpc-url https://forno.celo.org --broadcast --verify
```

**Mainnet Config:**
- **Chain ID**: 42220
- **cUSD**: `0x765DE816845861e75A25fCA122bb6898B8B1282a`

## 4. Subgraph Deployment

1. **Auth**: `graph auth --product hosted-service <ACCESS_TOKEN>`
2. **Codegen**: `bun run codegen` (in `subgraph/` directory)
3. **Build**: `bun run build`
4. **Deploy**: `graph deploy --node https://api.thegraph.com/deploy/ <USER>/<SUBGRAPH_NAME>`

## 5. Next.js App Deployment (Vercel)

1. Connect your GitHub repository to Vercel.
2. Add all secrets from `.env.production` to **Environment Variables** in the Vercel dashboard.
3. Deploy! The build process will automatically run `bun run check-env` to verify your keys.

---
**Security Note**: Never commit your `.env.production` or `private keys` to version control.
