# ImpactPay UI 
**MiniPay Optimized Micro-Philanthropy Frontend**

ImpactPay's frontend is a high-performance Next.js 15 application designed specifically for the **Celo MiniPay** ecosystem. It features a mobile-first, neo-brutalist "Fintech" design optimized for low-latency interactions and direct-to-provider fulfillment.

## 🏗 Project Structure

- `app/`: Next.js App Router (Pages, Layouts, and APIs).
  - `api/`: Backend fulfillment pipelines for BitGifty and Chimoney.
- `components/`: Modular React UI components.
- `contexts/`: React Contexts for Web3 state management.
- `lib/`: Shared utilities, API clients, and webhook handlers.
- `public/`: Static assets, including the updated branding and PWA manifest.
- `subgraph/`: Configuration and queries for The Graph indexing.

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/)
- [Next.js CLI](https://nextjs.org/docs/getting-started/installation)

### Installation
```bash
bun install
```

### Development
```bash
bun run dev
```

### Production Build
```bash
bun run build
```

## 📱 MiniPay Integration
The UI natively detects the MiniPay environment via `window.ethereum.isMiniPay`. 
- **Responsive Design**: Tailored for screens `< 360px`.
- **Identity**: Seamlessly integrates with SocialConnect (ODIS) and Self Protocol.
- **Transactions**: Optimized for the MiniPay wallet flow.

## 🔗 Fulfillment APIs
The backend (located in `app/api/`) handles secure relays to:
- **BitGifty**: Automated utility bill settlement.
- **Chimoney**: Instant virtual card issuance for developers.
- **Verification**: Verifiable Credential issuance for impact milestones.
