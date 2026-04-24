# ImpactPay 
**Direct-to-Provider Impact Funding on Celo MiniPay**

ImpactPay is a decentralized, mobile-first micro-philanthropy platform tailored for the **Celo MiniPay** ecosystem. It redefines charitable giving and social funding by stripping away intermediaries, ensuring that 100% of a donor's capital is routed exactly to its intended use—whether paying an electricity bill via [BitGifty](https://bitgifty.com) or issuing a virtual developer card via [Chimoney](https://chimoney.io). 

---

## The Problem
1. **Capital Leakage:** Traditional micro-donations suffer from intermediary fees and a lack of transparency. Donors rarely know if their money directly helped the requester.
2. **The "Liquid Cash" Risk:** Giving liquid crypto or cash directly to requesters rarely guarantees that the funds will be used for essential utilities or education.
3. **The Developer Barrier:** Builders in emerging markets face massive hurdles accessing $20/month subscriptions (e.g., Cursor, OpenAI, GitHub Pro) due to lack of standard credit access.
4. **No Portable Reputation:** Generous donors rarely receive verifiable, portable recognition for their impact.

## The Solution
ImpactPay introduces **Direct-to-Provider Fulfillment**. Donors fund campaigns that are strictly tied to a utility API or virtual card issuance. 
- A user requests help for a utility bill.
- A donor funds the smart contract goal.
- Upon 100% funding, the backend automatically triggers **BitGifty** to instantly pay the remote electricity/data bill. 
- For Developer Subscriptions, **Chimoney** automatically generates a $20 loaded Virtual Card sent securely to the developer.

This creates a high-trust, frictionless, and transparent giving loop.

---

## Key Features

1. **Direct Fulfillment Architecture**: Seamless bridge between Celo smart contracts and Web2 API aggregators (BitGifty for utilities, Chimoney for virtual cards). 
2. **SocialConnect & Self Identity**: Leverages Celo's SocialConnect (ODIS) mapping to link phone numbers and Twitter (X) handles natively to Celo addresses. "Level 3" identity verification is anchored on-chain via the **Self Protocol** to prevent bot abuse.
3. **Portable Reputation Engine**: Built on **The Graph**. Generates dynamic, algorithmic ranking scores for both Donors and Requesters.
4. **Verifiable Social Proof**: NextJS Edge endpoints generate high-trust OpenGraph (OG) visual profiles and issue W3C-standard JSON-LD **Verifiable Credentials** as users achieve philanthropic milestones.
5. **MiniPay Optimized**: Built as a Progressive Web App (PWA) with a "Fintech" neo-brutalist styling specifically designed to feel native within the Opera MiniPay wallet constraints (mobile-responsive `< 360px`).
6. **Built-in Escrows & Security**: Multi-signature "flagging" allows donors to freeze suspicious goals. Scholarships utilize a 20/40/40 milestone release structure.

---

## System Architecture

ImpactPay is split into four primary layers:

1. **Smart Contracts (Solidity & Foundry)**
   - `ImpactPay.sol`: Central logic governing `createGoal`, `fundGoal`, and milestone distributions.
   - Built securely with Reentrancy guards and an admin `paused` emergency state. 
2. **Frontend & Backend (Next.js 15, React, Tailwind v4)**
   - PWA optimized for MiniPay with responsive design and modern UX bindings.
   - API layer containing secure endpoints for fulfilling BitGifty and Chimoney payloads.
   - Edge Routes for Social Card dynamic generation (`next/og`).
3. **The Graph (Decentralized Indexer)**
   - The primary data engine mapping Contract Events to real-time Donors and Requester `GlobalStat` ranks and percentiles.
4. **Third-Party Integrations**
   - **BitGifty**: African utility bill settlement.
   - **Chimoney**: Virtual Card generation.
   - **Self SDK**: Biometric unique-identity checks.
   - **Celo ODIS**: Obfuscated Decentralized Identifier Service.

---

## Repository Structure

```text
impactPay/
├── blockchain/               # Smart Contracts (Hardhat & Foundry)
│   ├── contracts/            # Core Protocol Logic (ImpactPay.sol)
│   ├── foundry-tests/        # Foundry Test Suite (Security & Compliance)
│   ├── test/                 # Hardhat Tests (Integration)
│   └── script/               # Deployment & Management Scripts
├── ui/                       # Next.js 15 MiniPay Optimized Frontend
│   ├── app/                  # App Router Pages & Fulfillment APIs
│   ├── components/           # UI Components (Neo-brutalist / Fintech style)
│   ├── lib/                  # Webhooks & Third-party Integrations
│   └── public/               # PWA Assets & Favicons
└── DOCUMENT.md               # Detailed Development Log & CTO Briefs
```

---

## Setup & Installation

This project strictly utilizes `bun` as the core package manager for rapid dependency resolution.

### Prerequisites
- [Bun](https://bun.sh/) installed locally.
- [Foundry](https://getfoundry.sh/) installed for smart contract compilation.
- Target Network: **Celo Mainnet** / Celo Sepolia (Alfajores deprecated).

### 1. Clone & Clean Install
```bash
git clone https://github.com/bobeu/impactPay.git
cd impactPay
bun install
```

### 2. Environment Variables
Create a `.env` file based on `.env.template`:
```ini
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_id
NEXT_PUBLIC_GRAPH_ENDPOINT=your_subgraph_api_url

# Fulfiller / Relayer 
NEXT_PUBLIC_BACKEND_SIGNER_KEY=0x...
BITGIFTY_API_KEY=your_bitgifty_key
BITGIFTY_BASE_URL=https://vbaas.vfdtech.ng/api/v1/
CHIMONEY_API_KEY=your_chimoney_key
CHIMONEY_BASE_URL=https://api.chimoney.io/v0.2/

# Features
FULFILL_BILL_SHARED_SECRET=your_webhook_secret
ISSUER_DID=did:web:impactpay.celo.org
```

### 3. Run Development Server
```bash
bun run dev
```

### 4. Background Webhooks
To actively listen to the Celo blockchain for `Funded` events and trigger real-time BitGifty API requests natively, start the listener in an alternate terminal:
```bash
bun run listen:funded
```

---

## Testing Inside MiniPay
Since ImpactPay is designed primarily for Opera's MiniPay ecosystem:
1. Ensure your local server is exposed to the internet using a tool like [ngrok](https://ngrok.com/) or via a deployed Vercel instance.
2. Use HTTPS exclusively, as MiniPay Web3 injection will block standard non-secure origins.
3. Open the URL inside the Opera Mini app browser globally. ImpactPay natively detects `window.ethereum.isMiniPay` to toggle specialized Celo network rules and Dev/Prod states.

---

## License
This project is made open-source under the MIT License as part of the Celo decentralized builder community.
