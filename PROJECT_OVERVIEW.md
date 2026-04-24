# ImpactPay Technical Overview & Onboarding Guide

Welcome to **ImpactPay**, a decentralized, reputation-based micro-philanthropy platform designed specifically for the **Celo MiniPay** ecosystem. This document provides a high-level technical breakdown of the system architecture, how components interact, and how to get started as a developer.

---

## 1. High-Level Architecture

ImpactPay follows a "Decentralized Backend" pattern where the source of truth is the blockchain, but a specialized indexer (The Graph) and a high-performance REST API layer provide the speed needed for a modern mobile app.

### The "Big Four" Layers:
1.  **The Brain (Smart Contracts):** Handles money (escrow), logic (milestones), and permanence (events).
2.  **The Eye (The Graph):** Watches the "Brain" and organizes information into a searchable database.
3.  **The Glue (Backend/APIs):** Bridges the blockchain to real-world services like phone top-ups and virtual cards.
4.  **The Face (Frontend):** A mobile-optimized Progressive Web App (PWA) that feels native inside Opera MiniPay.

---

## 2. Component Interactions

### A. The "Donation to Fulfillment" Flow
1.  **Frontend:** User clicks "Fund Goal" on a campaign.
2.  **Smart Contract:** Receives $USDm$, emits a `Funded` event.
3.  **The Listener (Worker):** A background script detects the `Funded` event.
4.  **Backend API:** Triggered by the listener, it calls the **BitGifty API** (for utility bills) or **Chimoney API** (for virtual cards).
5.  **Smart Contract:** Once the provider confirms the payment, the backend calls `markBillFulfilled` to settle the goal on-chain.

### B. The Reputation Engine
1.  **Smart Contract:** Emits `ReputationUpdated` events on every significant action (funding, fulfilling, flagging).
2.  **Subgraph:** Aggregates these events to calculate a user's `globalRank` and `percentileRank`.
3.  **REST API (`/api/v1/stats`):** Fetches organized data from the Subgraph and serves it to the Frontend via high-performance JSON endpoints.

---

## 3. Section-by-Section Deep Dive

### Smart Contracts (`contracts/`)
*   **Framework:** Foundry (Solidity).
*   **Key Contract:** `ImpactPay.sol`.
*   **Core Concepts:**
    *   **Escrow:** A "holding tank" for funds until conditions are met.
    *   **Milestones:** Releasing funds in stages (e.g., 20/40/40) for education/scholarship goals.
    *   **Flagging:** A decentralized reporting system where 3 flags from unique donors freeze a goal.

### The Subgraph (`subgraph/`)
*   **Role:** Transforms a stream of blockchain events into an API that supports sorting, filtering, and aggregation.
*   **Key Files:** `schema.graphql` (defines data structure) and `mapping.ts` (contains assemblyscript logic to process events).

### Backend / API Routes (`app/api/`)
*   **Fulfillment:** `fulfill-bill/` (BitGifty) and `issue-virtual-card/` (Chimoney).
*   **Identity:** `identity/` handles **SocialConnect** (mapping phone numbers to wallets) and **Self Protocol** (ZK-biometric verification).
*   **OG Generation:** `og/` creates those professional looking cards you see on social media using `@vercel/og`.

### Frontend (`app/` & `components/`)
*   **Framework:** Next.js 15 + Tailwind CSS.
*   **PWA:** Uses Service Workers and a `manifest.json` to allow "Install to Home Screen" behavior in MiniPay.
*   **Connectivity:** Uses **Wagmi** and **Viem** for seamless interaction with the Celo blockchain.

---

## 4. Deployment Workflow

### 1. Smart Contracts
```bash
cd contracts
forge build
forge script scripts/Deploy.s.sol --rpc-url $CELO_RPC_URL --broadcast
```

### 2. Subgraph
1.  Host your schema on [The Graph Studio](https://thegraph.com/studio/).
2.  Generate code: `bunx @graphprotocol/graph-cli codegen`.
3.  Deploy: `graph deploy --studio impactpay-reputation`.

### 3. Frontend / Backend
1.  Standard Vercel or Next.js deployment.
2.  Ensure all Environment Variables from `.env.example` are set in your dashboard.

---

## 5. Technical Glossary (For Onboarding)

*   **MiniPay:** a wallet inside the Opera Mini browser for African/Emerging markets. It requires "Auto-Connect" (no connect button).
*   **SocialConnect / ODIS:** A Celo service that lets you find a wallet address using a phone number or social handle without exposing the private number.
*   **ZK-Biometrics (Self):** "Zero-Knowledge" proof of humanity. It verifies you are a real human using your face/passport without storing your image or private data.
*   **cUSD / USDm:** Stablecoins pegged to the US Dollar on the Celo network.
*   **Gas:** A tiny fee paid to the network to process any transaction. Celo gas fees are usually < $0.01.
*   **Relayer:** A backend server that pays gas on behalf of the user to make the experience feel "gasless" (used for verification callbacks).

---

<!-- ## 6. Getting Started as a New Developer
1.  **Clone** the repo and run `bun install`.
2.  **Copy** `.env.example` to `.env` and fill in your keys.
3.  **Start** the dev server: `bun run dev`.
4.  **Start** the event listener (for fulfillment testing): `bun run listen:funded`. -->
