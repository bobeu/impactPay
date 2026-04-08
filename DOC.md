# READ THIS DOCUMENT TO UNDERSTAND THE PROJECT. THIS DOCUMENT SHALL CONTAIN ALL OUR CONVERSATIONS INCLUDING YOUR SUMMARY AFTER COMPLETING EACH TASK. PASTE YOUR SUMMARY AT THE NEXT LINE OF THE LAST CONTENT. DO NOT OVERWRITE THE WHOLE CONTENT. INSTEAD, ADD YOUR RESPONSE AT THE NEXT LINE AFTER THE LAST LINE.

# DESCRIPTION
This project plan outlines the development of ImpactPay, a reputation-based social finance platform built for the MiniPay ecosystem on the Celo blockchain.

## Project Title: ImpactPay

Mission: To eliminate trust barriers in social giving by providing a verified, utility-focused crowdfunding platform for essential bills and career milestones.

------------------------------
## 1. Problem & Solution Overview

| Current Problem | ImpactPay Solution |
|---|---|
| Identity Fraud: Users creating fake personas to solicit donations. | Sybil Resistance: Self Protocol[](https://docs.self.xyz/) ZK-biometrics and Celo SocialConnect phone-to-wallet mapping ensure "one person, one account." |
| Misuse of Funds: Money intended for bills being used for other purposes. | Direct Utility Payout: Integration with BitGifty[](https://bitgifty.com/tnc) API to pay service providers (airtime, electricity) directly from the contract. |
| Donor Fatigue: High friction in making manual micro-donations. | Pre-paid Buffers: Donors commit a pool of funds that are automatically distributed via "Spare Change" round-ups. |
| Lack of Career Support: No structured way to fund long-term education. | Milestone Escrow: Scholarship goals are released in 20/40/40 stages based on verified progress. |

------------------------------
## 2. Technical Architecture
Core Infrastructure:

* Blockchain: Celo (Layer-2).
* Wallet Environment: MiniPay (Opera Mini Browser).
* Development Framework: Next.js (PWA) + Tailwind CSS + [viem/wagmi](https://docs.celo.org/build-on-celo/build-on-minipay/quickstart).

Integrations:

* Self Protocol: Uses ZK-proofs to verify user humanity via NFC passport/ID scans without storing private data.
* [Celo SocialConnect](https://github.com/celo-org/social-connect/blob/main/README.md): Maps phone numbers to wallet addresses to allow social discovery and verification.
* [BitGifty API](https://vbaas-docs.vfdtech.ng/docs/wallets-api/Products/bills-payment-api): Programmatic fulfillment of electricity, airtime, and data bills.
* Reputation Subgraph: Tracks donor "Impact Scores" and requester "Fulfillment Ratings" on-chain.

------------------------------
## 3. Operational & Revenue Model
Fee Structure:

   1. Tiered Listing Fee:
   * Essential Bills ($0.50 – $10): $0.05 fee.
      * Scholarship/Career Goals: $1.00 fee.
   2. Success Fee: 3% deducted from the final funded amount of all successful goals.
   3. Idle Yield: Funds held in milestone escrow generate interest via Celo-native lending protocols (e.g., Aave).

Rules & Governance:

* Goal Limits: Max 3 active goals per verified user.
* Community Flagging: Donors can flag suspicious goals; 3 valid flags freeze the goal for manual review.

------------------------------
## 4. Implementation Roadmap## Phase 1: Foundation

* Initialize the Celo Composer MiniPay template.
* Implement Auto-Connect logic (MiniPay requirement: no "Connect" button).
* Deploy Self Protocol and SocialConnect integration for user onboarding.

## Phase 2: Smart Contract & Escrow

* Develop the ImpactPay Core Contract:
* createGoal() with tiered fees.
   * payout() with 3% fee logic and BitGifty API event emission.
   * Milestone Escrow logic for Scholarship tags (20/40/40 release).
* Implement the Donor Commitment Buffer for automatic spare-change donations.

## Phase 3: Utility Integration & Frontend 

* Connect BitGifty API to handle automated bill payments upon successful funding.
* Build the Impact Dashboard:
* For Donors: View "Impact Reputation" and global bill goals.
   * For Requesters: Linked Instagram/X profiles and goal progress tracking.

## Phase 4: Launch & Testing 

* Test in MiniPay Developer Mode using ngrok.
* Submit for listing on the [MiniPay Mini App marketplace](https://docs.minipay.xyz/getting-started/submit-your-miniapp.html).

------------------------------
## 5. Actionable Payout Triggers (Scholarship Specific)
To prevent cheating, scholarship funds are not released immediately:

   1. Funded (20%): Initial release for immediate fees.
   2. Progress Proof (40%): Released after the user uploads a timestamped receipt or transcript.
   3. Final Completion (40%): Released upon final certification.
   4. Refusal Clause: If no proof is provided within 90 days, the remaining 80% is refunded to the donors' commitment buffers.


PROMPT1

# Project Scaffolding & MiniPay Auto-Connect

Act as a Senior Web3 Developer. Initialize a Next.js PWA project for Celo MiniPay.

1.Use the `@celo/celo-composer` template with wagmi and viem.

2. Crucial: Implement an 'Auto-Connect' logic in _app.tsx or a layout provider. Since this is for MiniPay, there must be NO 'Connect Wallet' button. The app must detect the provider and connect the user's wallet immediately upon page load.

3. Configure Tailwind CSS for a mobile-first UI (max-width 450px) and ensure the viewport is locked to prevent zooming.

4. Set up a basic PWA manifest and service worker to ensure the app is lightweight and works on slow networks.

---
**Agent summary — PROMPT1 (2026-04-08):** `npx @celo/celo-composer@latest create` failed to materialize the full template on this machine (dependency install failed; only partial files were created), so the official [Celo minipay-template](https://github.com/celo-org/minipay-template) `packages/react-app` stack was copied into `impactPay/` as the base (Next.js 15, wagmi, viem, Tailwind). RainbowKit was removed to drop the connect UI; `MiniPayAutoConnect` plus `WagmiProvider`/`injected({ target: "metaMask" })` in `providers/AppProvider.tsx` auto-connect on load when `window.ethereum` exists. There is no Connect Wallet button; the header shows a shortened address or “Connecting…”. Layout/footer use `max-w-[450px]`; `app/layout.tsx` exports `viewport` with `maximumScale: 1` and `userScalable: false`. PWA: `public/manifest.json`, minimal `public/sw.js`, and `ServiceWorkerRegister` (registers only in production). Chains: `celoAlfajores` and `celo` (this wagmi/viem stack has no `celoSepolia` export yet). Run `npm install` and `npm run dev` from `impactPay/`. `npm run build` completes successfully.


## Prompt 2: Identity Layer (Self & SocialConnect)

"Now, integrate the identity and Sybil-resistance layer for ImpactPay.

   1. Integrate Celo SocialConnect to map the user’s phone number to their wallet address.
   2. Implement a verification flow using the Self Protocol SDK.
   3. Create a 'User Profile' state that tracks three levels of verification:
   * Level 1: Phone verified (via SocialConnect).
      * Level 2: Socials linked (X/Instagram).
      * Level 3: Human verified (via Self ZK-biometrics).
   4. Logic gate: Restrict the 'Scholarship' goal tag to Level 3 users only. Provide a clear 'Verify Identity' UI for users to upgrade their level."

## Prompt 3: The ImpactPay Core Smart Contract

"Develop a Solidity smart contract named ImpactPay.sol for the Celo blockchain. The contract must include:

   1. Goal Creation: A function createGoal that takes targetAmount, category (Bill or Scholarship), and description.
   2. Tiered Fees: Implement a logic where creating a 'Bill' goal costs $0.05 and a 'Scholarship' costs $1.00 (in cUSD/USDT).
   3. Success Fee: A claimFunds function that automatically deducts a 3% platform fee and sends it to a treasury address.
   4. Milestone Escrow: For 'Scholarship' goals, implement a 3-part release (20%, 40%, 40%). The second and third releases must be triggered by an approveRelease function, which can only be called by the contract owner or a multi-sig after verification.
   5. Reputation Tracking: Emit events for GoalCreated, Funded, and Completed that include the donor's address to track their 'Impact Score'."


## Prompt 4: Professional UI/UX Design (PWA)

"Act as a Lead UI/UX Designer. Create a professional, clean, and high-trust 'Light Mode' theme for the ImpactPay PWA.

   1. Style Guidelines: Use a crisp white background (#FFFFFF) with a primary 'Celo Green' (#35D07F) for action buttons and 'Slate Gray' (#334155) for text. Strictly NO gradients. Use flat design with subtle 1px borders and soft shadows for cards.
   2. Layout:
   * A 'Featured Goals' carousel on the home screen.
      * A 'Impact Dashboard' for donors showing a progress bar of their 'Reputation' and 'Total Funded'.
      * A bottom navigation bar for 'Explore', 'My Goals', and 'Profile'.
   3. Feedback: Use 'Success Green' and 'Warning Amber' for status tags (e.g., 'Fully Funded', 'Verification Pending').
   4. Ensure all touch targets are at least 44px for easy mobile navigation."

## Prompt 5: BitGifty API & Backend Fulfillment

"Build a Next.js API route (/api/fulfill-bill) to integrate the BitGifty Bills Payment API.

   1. This route must be triggered when a 'Bill' goal is successfully funded on-chain.
   2. Securely handle the BitGifty API Key via environment variables.
   3. Implement logic to:
   * Fetch the biller category (Airtime, Data, Electricity) from the goal metadata.
      * Call the BitGifty POST /purchase endpoint.
      * On success, update the on-chain status of the goal to 'Fulfilled' using a backend signer.
   4. Add error handling to notify the user if the biller's service is down and provide a 'Retry' mechanism."

## Prompt 6: Subgraph Integration & Real-time Reputation

"Set up a The Graph Subgraph for ImpactPay.

   1. Write the subgraph.yaml and schema.graphql to index:
   * Goal entities (status, category, amount raised, creator).
      * Donor entities (total amount donated, number of goals supported).
   2. Implement a Reputation Calculation logic within the Subgraph mappings:
   * Donor Reputation = (Total USD donated * 10) + (Successful goals supported * 50).
      * Requester Reputation = (Completed goals * 100) - (Flagged goals * 500).
   3. Create a frontend hook useReputation() that fetches this data via GraphQL to display on user profiles."

## Prompt 7: Advanced Smart Contract & Unit Testing

"Refine the ImpactPay.sol contract and provide a comprehensive test suite using Foundry.

   1. Advanced Logic: Add a flagGoal function that allows donors to report a goal. If flags > 3, the funds are locked for admin review.
   2. Fee Distribution: Update claimFunds to transfer the $0.05/$1.00 listing fee immediately to the treasury and the 3% success fee upon goal completion.
   3. Tests: Write tests for:
   * Successful 'Scholarship' milestone releases.
      * Prevention of fund withdrawal if a goal is flagged.
      * Reversion of 'Creation' if the tiered fee is not paid in the exact amount."
   
## Prompt 8: SocialConnect & Phone Mapping Flow

"Implement the full Celo SocialConnect registration and lookup flow.

   1. Create a 'Verify Phone' screen that uses the ODIS (Oblivious Decentralized Identifier Service) to mask the user's phone number and map it to their wallet address.
   2. Implement a 'Search by Phone' feature so donors can find their friends' 'Bill Goals' just by typing their phone number.
   3. Ensure the UI clearly explains to the user that their phone number is used for trust but remains private via ZK-proofs."

------------------------------

## Final Execution Order 

   1. UI First (Prompt 4): Get the professional look and feel established.
   2. Logic & Identity (Prompts 2 & 8): Set up how users identify themselves.
   3. Smart Contract (Prompt 7): Deploy the core "brain" of the app.
   4. Integrations (Prompts 5 & 6): Connect the real-world bill payments and the reputation indexing.



