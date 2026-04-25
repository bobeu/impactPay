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






<!-- 'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useAccount, useReadContract, useReadContracts, useConfig, useWatchContractEvent } from 'wagmi';
import {  simulateContract } from "wagmi/actions";
import { CONTRACTS } from '@/contracts';
import { toast } from 'sonner';
import {
  type CreateBillGoal,
  type GetGoal,
  type GetGoalIdAndState,
  type ImpactPayContextType,
  type TransactionStage,
  type Args,
  mockGetGoalIDAndState,
  mockGoals
} from "../lib/types";
import { Address } from 'viem';
import { useWeb3 } from './useWeb3';

const ImpactPayContext = createContext<ImpactPayContextType | undefined>(undefined);

export function ImpactPayProvider({ children }: { children: React.ReactNode }) {
  const { address, chain, isConnected } = useAccount();
  const { broadcastTransaction } = useWeb3();
  // const { data: walletClient } = useWalletClient();
  const config = useConfig();
  const chainId = chain?.id || 42220; // Default to Celo Mainnet

  // Global UI States
  const [modalStage, setModalStage] = useState<TransactionStage>('idle');
  const [modalTxHash, setModalTxHash] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');
  const [modalFee, setModalFee] = useState<bigint>(0n);

  // 1. Fetch user goal IDs and state
  const { data: goalIdsAndState_, refetch: refetchIdsAndState } = useReadContract({
    address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
    abi: CONTRACTS.ImpactPay.abi as any,
    functionName: 'getGoalIdAndState',
    args: [address as `0x${string}`],
    query: { enabled: !!address }
  });

  const { goalIdsAndState, goalIdsToFetch } = React.useMemo(() => {
    if (!goalIdsAndState_) return { goalIdsAndState: mockGetGoalIDAndState, goalIdsToFetch: [] };
    const goalIdsData = goalIdsAndState_ as GetGoalIdAndState;
    const fetchedIds: bigint[] = Array.from(Array(Number(goalIdsData.goalCounter || 0)).keys()).map(n => BigInt(n + 1));
    return {
      goalIdsAndState: goalIdsData,
      goalIdsToFetch: fetchedIds
    };
  }, [goalIdsAndState_]);

  // Fetch the goals for all the goal IDs
  const { data: rawGoals, isLoading: isImpactPayLoading, refetch: refetchGoals } = useReadContracts({
    contracts: goalIdsToFetch.map(k => ({
      address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
      abi: CONTRACTS.ImpactPay.abi as any,
      functionName: 'getGoal',
      args: [k]
    })),
    query: { enabled: goalIdsToFetch.length > 0 }
  });

  // // Fetch the goals for all the goal IDs
  // const { data: rawGoals, isLoading: isImpactPayLoading, refetch: refetchGoals } = useReadContracts({
  //   contracts: goalIdsAndState.goalIds.map(k => ({
  //     address: CONTRACTS.ImpactPay.address[chainId], 
  //     abi: CONTRACTS.ImpactPay.abi as any, 
  //     functionName: 'getGoal',
  //     args: [k]
  //   })),
  //   query: { enabled: !!goalIdsAndState }
  // });

  // Derived the goals
  const { userGoals, goals, stats, funderReputations } = useMemo(() => {
    if (!rawGoals) return { userGoals: [mockGoals], goals: [mockGoals], stats: { totalGoals: 0, totalRaised: 0n, totalFunders: 0, activeGoals: 0 }, funderReputations: {} };
    const goals = (rawGoals?.map((k: any) => {
      const getGoal_ = k?.result as GetGoal;
      return getGoal_;
    })).filter((g: GetGoal) => g && g.common);

    // Filter all goals for the current user
    const userGoals = goals.filter((k: GetGoal) => k.common.creator.toLowerCase() === address?.toLowerCase());

    // Aggregate funders and calculate reputations
    const reputations: Record<string, bigint> = {};
    goals.forEach((goal: GetGoal) => {
      goal.funders?.forEach((funder: any) => {
        const addr = funder.id.toLowerCase();
        reputations[addr] = (reputations[addr] || 0n) + funder.amount;
      });
    });

    // Stats
    const stats = {
      totalGoals: goals.length,
      totalRaised: goals.reduce((acc: bigint, g: GetGoal) => acc + g.common.raisedAmount, 0n),
      totalFunders: Object.keys(reputations).length,
      activeGoals: goals.filter((g: GetGoal) => g.common.status === 0).length, // OPEN = 0
    };

    return {
      goals,
      userGoals,
      stats,
      funderReputations: reputations
    }
  }, [rawGoals, address]);

  const refresh = useCallback(() => {
    refetchIdsAndState();
    refetchGoals();
  }, [refetchIdsAndState, refetchGoals]);

  // Watch for events to auto-refresh
  useWatchContractEvent({
    address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
    abi: CONTRACTS.ImpactPay.abi as any,
    eventName: 'GoalCreated',
    onLogs: () => refresh()
  });

  useWatchContractEvent({
    address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
    abi: CONTRACTS.ImpactPay.abi as any,
    eventName: 'Funded',
    onLogs: () => refresh()
  });

  useWatchContractEvent({
    address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
    abi: CONTRACTS.ImpactPay.abi as any,
    eventName: 'ReputationUpdated',
    onLogs: () => refresh()
  });


  const createGoal = async (param: CreateBillGoal) => {
    if (!isConnected) {
      toast.error("Wallet not connected");
      return;
    }
    try {
      setModalStage('awaiting_auth');
      setModalTxHash('');
      setModalError('');
      setModalFee(0n);
      const { goalType, description, extraInfo, targetAmount, billServiceIndex, serviceType } = param;
      let args = [];
      let functionName = 'createGoal';
      let listingFee = 0n;
      switch (goalType) {
        case 'BILL':
          if (!serviceType) return;
          if (billServiceIndex === undefined) return;
          functionName = 'createBillGoal';
          args = [targetAmount, description, serviceType, extraInfo, billServiceIndex];
          listingFee = goalIdsAndState.billListingFee;
          break;
        case 'SCHOLARSHIP':
          functionName = 'createScholarshipGoal';
          args = [targetAmount, description, extraInfo];
          listingFee = goalIdsAndState.scholarshipListingFee;
          break;
        default:
          args = [targetAmount, description, extraInfo];
          listingFee = goalIdsAndState.defaultListingFee;
          break;
      }

      setModalFee(listingFee);
      const feeCurrency = CONTRACTS.MockERC20.address[chainId as keyof typeof CONTRACTS.MockERC20.address] as Address;

      if (listingFee > 0n) {
        await broadcastTransaction({
          address: CONTRACTS.MockERC20.address[chainId as keyof typeof CONTRACTS.MockERC20.address],
          abi: CONTRACTS.MockERC20.abi as any,
          functionName: 'approve',
          args: [CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address], listingFee],
          feeCurrency
        });        
      }

      await simulateContract(config, {
        address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: functionName,
        args
      });

      const receipt = await broadcastTransaction({
        address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: functionName,
        args,
        feeCurrency
      } as any);

      setModalTxHash(receipt.transactionHash);
      setModalStage('tx_included');
      // await waitForTransactionReceipt(config, { hash, confirmations: 2 });
      setModalStage('verifying');
      setTimeout(() => {
        setModalStage('success');
        refresh();
        setTimeout(() => setModalStage('idle'), 3000);
      }, 1500);

    } catch (err: any) {
      setModalStage('error');
      setModalError(err.shortMessage || err.message);
      setTimeout(() => setModalStage('idle'), 3000);
    }
  };

  const runTransaction = async (param: Args) => {
    if (!isConnected) {
      toast.error("Wallet not connected");
      return;
    }
    const { amount, extraInfo, goalIds, recipient, user, func } = param;
    const feeCurrency = CONTRACTS.MockERC20.address[chainId as keyof typeof CONTRACTS.MockERC20.address] as Address;
    try {
      let args: any = [goalIds?.[0]];
      let errorMessage: string | null = null;
      if (func !== 'onVerificationSuccess') {
        if (!goalIds) errorMessage = "Goal Id not provided";
        if (goalIds?.length == 0) errorMessage = "Goal Id undefined";
      }

      switch (func) {
        case 'fundGoal':
          if (!amount) errorMessage = "Please provide amount";
          args = [goalIds?.[0], amount || 0n, extraInfo || ''];
          await broadcastTransaction({
            address: CONTRACTS.MockERC20.address[chainId as keyof typeof CONTRACTS.MockERC20.address],
            abi: CONTRACTS.MockERC20.abi as any,
            functionName: 'approve',
            args: [CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address], amount || 0n],
            feeCurrency
          } as any);

          break;

        case 'approveScholarshipRelease':
          args = [goalIds];
          break;

        case 'claimScholarshipFunds':
          if (!recipient) errorMessage = "Goal Recipient not provided";
          args.push(recipient);
          break;

        case 'relayBillFundsToService':
          if (!amount) errorMessage = "Amount not provided";
          args.push(amount);
          break;

        case 'onVerificationSuccess':
          if (!user) errorMessage = "User address not provided";
          args = [user];
          break;

        default:
          break;
      }

      if (errorMessage) {
        toast.error(errorMessage);
        return;
      }

      setModalStage('awaiting_auth');

      await simulateContract(config, {
        address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: func,
        args
      });

      const receipt = await broadcastTransaction({
        address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: func,
        args,
        feeCurrency
      } as any);
      setModalTxHash(receipt.transactionHash);
      setModalStage('tx_included');
      // await waitForTransactionReceipt(config, { hash });
      setModalStage('verifying');
      setTimeout(() => {
        setModalStage('success');
        refresh();
        // setShowShredder(true);
        setTimeout(() => setModalStage('idle'), 3000);
      }, 1500);
    } catch (err: any) {
      setModalStage('error');
      setModalError(err.shortMessage || err.message);
      setTimeout(() => setModalStage('idle'), 3000);
    }
  };

  return (
    <ImpactPayContext.Provider value={{
      isLoading: isImpactPayLoading,
      modal: {
        stage: modalStage,
        txHash: modalTxHash,
        error: modalError,
        fee: modalFee,
        setStage: setModalStage
      },
      refresh,
      createGoal,
      claimFund: async(goalId: bigint) => { await runTransaction({ goalIds: [goalId], func: 'claimFund' }) },
      fundGoal: async (goalId: bigint, amount: bigint, extraInfo: string) => { await runTransaction({ goalIds: [goalId], amount, extraInfo, func: 'fundGoal' }) },
      toggleFlagGoal: async (goalId: bigint) => { await runTransaction({ goalIds: [goalId], func: 'toggleFlagGoal' }) },
      reactivateGoal: async (goalId: bigint) => { await runTransaction({ goalIds: [goalId], func: 'reactivateGoal' }) },
      approveScholarshipRelease: async (goalIds: bigint[]) => { await runTransaction({ goalIds, func: 'approveScholarshipRelease' }) },
      claimScholarshipFunds: async (goalId: bigint, recipient: Address) => { await runTransaction({ goalIds: [goalId], recipient, func: 'claimScholarshipFunds' }) },
      relayBillFundsToService: async (goalId: bigint, amount: bigint) => { await runTransaction({ goalIds: [goalId], amount, func: 'relayBillFundsToService' }) },
      refundScholarship: async (goalId: bigint) => { await runTransaction({ goalIds: [goalId], func: 'refundScholarship' }) },
      onVerificationSuccess: async (user: Address) => { await runTransaction({ user, func: 'onVerificationSuccess' }) },
      goalIdsAndState,
      goals: goals || [] as GetGoal[],
      userGoals,
      stats,
      funderReputations
    }}>
      {children}
    </ImpactPayContext.Provider>
  );
}

export function useImpactPay() {
  const context = useContext(ImpactPayContext);
  if (!context) throw new Error('useImpactPay must be used within HashFlowProvider');
  return context;
} -->



'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useAccount, useConfig, useWatchContractEvent } from 'wagmi';
import {  simulateContract } from "wagmi/actions";
import { CONTRACTS } from '@/contracts';
import { toast } from 'sonner';
import {
  type CreateBillGoal,
  type GetGoal,
  type GetGoalIdAndState,
  type ImpactPayContextType,
  type TransactionStage,
  type Args,
  mockGetGoalIDAndState,
  mockGoals
} from "../lib/types";
import { Address } from 'viem';
import { useWeb3 } from './useWeb3';

const ImpactPayContext = createContext<ImpactPayContextType | undefined>(undefined);

export function ImpactPayProvider({ children }: { children: React.ReactNode }) {
  const { address, chain, isConnected } = useAccount();
  const { broadcastTransaction, publicClient } = useWeb3();
  // const { data: walletClient } = useWalletClient();
  const config = useConfig();
  const chainId = chain?.id || 42220; // Default to Celo Mainnet

  // Global UI States
  const [modalStage, setModalStage] = useState<TransactionStage>('idle');
  const [modalTxHash, setModalTxHash] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');
  const [modalFee, setModalFee] = useState<bigint>(0n);

  // Data States
  const [goalIdsAndState_, setGoalIdsAndState] = useState<GetGoalIdAndState | null>(null);
  const [rawGoals, setRawGoals] = useState<any[] | null>(null);
  const [isImpactPayLoading, setIsImpactPayLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!address) {
       setGoalIdsAndState(null);
       setRawGoals(null);
       return;
    }
    try {
      setIsImpactPayLoading(true);
      const idsAndState = await publicClient.readContract({
        address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: 'getGoalIdAndState',
        args: [address as `0x${string}`],
      }) as GetGoalIdAndState;
      setGoalIdsAndState(idsAndState);
      console.log("idsAndState", idsAndState)

      const goalCounter = Number(idsAndState.goalCounter || 0);
      if (goalCounter > 0) {
        const goalIdsToFetch = Array.from(Array(goalCounter).keys()).map(n => BigInt(n + 1));
        const goals = await publicClient.multicall({
          contracts: goalIdsToFetch.map(k => ({
            address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
            abi: CONTRACTS.ImpactPay.abi as any,
            functionName: 'getGoal',
            args: [k]
          })),
          allowFailure: true
        });
        setRawGoals(goals as any[]);
      } else {
        setRawGoals([]);
      }
    } catch (error) {
      console.error("Error fetching ImpactPay data:", error);
    } finally {
      setIsImpactPayLoading(false);
    }
  }, [address, chainId, publicClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { goalIdsAndState } = React.useMemo(() => {
    if (!goalIdsAndState_) return { goalIdsAndState: mockGetGoalIDAndState };
    return {
      goalIdsAndState: goalIdsAndState_
    };
  }, [goalIdsAndState_]);

  // Derived the goals
  const { userGoals, goals, stats, funderReputations } = useMemo(() => {
    if (!rawGoals) return { userGoals: [mockGoals], goals: [mockGoals], stats: { totalGoals: 0, totalRaised: 0n, totalFunders: 0, activeGoals: 0 }, funderReputations: {} };
    const goals = (rawGoals?.map((k: any) => {
      const getGoal_ = k?.result as GetGoal;
      return getGoal_;
    })).filter((g: GetGoal) => g && g.common);

    // Filter all goals for the current user
    const userGoals = goals.filter((k: GetGoal) => k.common.creator.toLowerCase() === address?.toLowerCase());

    // Aggregate funders and calculate reputations
    const reputations: Record<string, bigint> = {};
    goals.forEach((goal: GetGoal) => {
      goal.funders?.forEach((funder: any) => {
        const addr = funder.id.toLowerCase();
        reputations[addr] = (reputations[addr] || 0n) + funder.amount;
      });
    });

    // Stats
    const stats = {
      totalGoals: goals.length,
      totalRaised: goals.reduce((acc: bigint, g: GetGoal) => acc + g.common.raisedAmount, 0n),
      totalFunders: Object.keys(reputations).length,
      activeGoals: goals.filter((g: GetGoal) => g.common.status === 0).length, // OPEN = 0
    };

    return {
      goals,
      userGoals,
      stats,
      funderReputations: reputations
    }
  }, [rawGoals, address]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Watch for events to auto-refresh
  useWatchContractEvent({
    address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
    abi: CONTRACTS.ImpactPay.abi as any,
    eventName: 'GoalCreated',
    onLogs: () => refresh()
  });

  useWatchContractEvent({
    address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
    abi: CONTRACTS.ImpactPay.abi as any,
    eventName: 'Funded',
    onLogs: () => refresh()
  });

  useWatchContractEvent({
    address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
    abi: CONTRACTS.ImpactPay.abi as any,
    eventName: 'ReputationUpdated',
    onLogs: () => refresh()
  });


  const createGoal = async (param: CreateBillGoal) => {
    if (!isConnected) {
      toast.error("Wallet not connected");
      return;
    }
    try {
      setModalStage('awaiting_auth');
      setModalTxHash('');
      setModalError('');
      setModalFee(0n);
      const { goalType, description, extraInfo, targetAmount, billServiceIndex, serviceType } = param;
      let args = [];
      let functionName = 'createGoal';
      let listingFee = 0n;
      switch (goalType) {
        case 'BILL':
          if (!serviceType) return;
          if (billServiceIndex === undefined) return;
          functionName = 'createBillGoal';
          args = [targetAmount, description, serviceType, extraInfo, billServiceIndex];
          listingFee = goalIdsAndState.billListingFee;
          break;
        case 'SCHOLARSHIP':
          functionName = 'createScholarshipGoal';
          args = [targetAmount, description, extraInfo];
          listingFee = goalIdsAndState.scholarshipListingFee;
          break;
        default:
          args = [targetAmount, description, extraInfo];
          listingFee = goalIdsAndState.defaultListingFee;
          break;
      }

      setModalFee(listingFee);
      const feeCurrency = CONTRACTS.MockERC20.address[chainId as keyof typeof CONTRACTS.MockERC20.address] as Address;

      if (listingFee > 0n) {
        await broadcastTransaction({
          address: CONTRACTS.MockERC20.address[chainId as keyof typeof CONTRACTS.MockERC20.address],
          abi: CONTRACTS.MockERC20.abi as any,
          functionName: 'approve',
          args: [CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address], listingFee],
          feeCurrency
        });        
      }

      await simulateContract(config, {
        address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: functionName,
        args
      });

      const receipt = await broadcastTransaction({
        address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: functionName,
        args,
        feeCurrency
      } as any);

      setModalTxHash(receipt.transactionHash);
      setModalStage('tx_included');
      // await waitForTransactionReceipt(config, { hash, confirmations: 2 });
      setModalStage('verifying');
      setTimeout(() => {
        setModalStage('success');
        refresh();
        setTimeout(() => setModalStage('idle'), 3000);
      }, 1500);

    } catch (err: any) {
      setModalStage('error');
      setModalError(err.shortMessage || err.message);
      setTimeout(() => setModalStage('idle'), 3000);
    }
  };

  const runTransaction = async (param: Args) => {
    if (!isConnected) {
      toast.error("Wallet not connected");
      return;
    }
    const { amount, extraInfo, goalIds, recipient, user, func } = param;
    const feeCurrency = CONTRACTS.MockERC20.address[chainId as keyof typeof CONTRACTS.MockERC20.address] as Address;
    try {
      let args: any = [goalIds?.[0]];
      let errorMessage: string | null = null;
      if (func !== 'onVerificationSuccess') {
        if (!goalIds) errorMessage = "Goal Id not provided";
        if (goalIds?.length == 0) errorMessage = "Goal Id undefined";
      }

      switch (func) {
        case 'fundGoal':
          if (!amount) errorMessage = "Please provide amount";
          args = [goalIds?.[0], amount || 0n, extraInfo || ''];
          await broadcastTransaction({
            address: CONTRACTS.MockERC20.address[chainId as keyof typeof CONTRACTS.MockERC20.address],
            abi: CONTRACTS.MockERC20.abi as any,
            functionName: 'approve',
            args: [CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address], amount || 0n],
            feeCurrency
          } as any);

          break;

        case 'approveScholarshipRelease':
          args = [goalIds];
          break;

        case 'claimScholarshipFunds':
          if (!recipient) errorMessage = "Goal Recipient not provided";
          args.push(recipient);
          break;

        case 'relayBillFundsToService':
          if (!amount) errorMessage = "Amount not provided";
          args.push(amount);
          break;

        case 'onVerificationSuccess':
          if (!user) errorMessage = "User address not provided";
          args = [user];
          break;

        default:
          break;
      }

      if (errorMessage) {
        toast.error(errorMessage);
        return;
      }

      setModalStage('awaiting_auth');

      await simulateContract(config, {
        address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: func,
        args
      });

      const receipt = await broadcastTransaction({
        address: CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address],
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: func,
        args,
        feeCurrency
      } as any);
      setModalTxHash(receipt.transactionHash);
      setModalStage('tx_included');
      // await waitForTransactionReceipt(config, { hash });
      setModalStage('verifying');
      setTimeout(() => {
        setModalStage('success');
        refresh();
        // setShowShredder(true);
        setTimeout(() => setModalStage('idle'), 3000);
      }, 1500);
    } catch (err: any) {
      setModalStage('error');
      setModalError(err.shortMessage || err.message);
      setTimeout(() => setModalStage('idle'), 3000);
    }
  };

  return (
    <ImpactPayContext.Provider value={{
      isLoading: isImpactPayLoading,
      modal: {
        stage: modalStage,
        txHash: modalTxHash,
        error: modalError,
        fee: modalFee,
        setStage: setModalStage
      },
      refresh,
      createGoal,
      claimFund: async(goalId: bigint) => { await runTransaction({ goalIds: [goalId], func: 'claimFund' }) },
      fundGoal: async (goalId: bigint, amount: bigint, extraInfo: string) => { await runTransaction({ goalIds: [goalId], amount, extraInfo, func: 'fundGoal' }) },
      toggleFlagGoal: async (goalId: bigint) => { await runTransaction({ goalIds: [goalId], func: 'toggleFlagGoal' }) },
      reactivateGoal: async (goalId: bigint) => { await runTransaction({ goalIds: [goalId], func: 'reactivateGoal' }) },
      approveScholarshipRelease: async (goalIds: bigint[]) => { await runTransaction({ goalIds, func: 'approveScholarshipRelease' }) },
      claimScholarshipFunds: async (goalId: bigint, recipient: Address) => { await runTransaction({ goalIds: [goalId], recipient, func: 'claimScholarshipFunds' }) },
      relayBillFundsToService: async (goalId: bigint, amount: bigint) => { await runTransaction({ goalIds: [goalId], amount, func: 'relayBillFundsToService' }) },
      refundScholarship: async (goalId: bigint) => { await runTransaction({ goalIds: [goalId], func: 'refundScholarship' }) },
      onVerificationSuccess: async (user: Address) => { await runTransaction({ user, func: 'onVerificationSuccess' }) },
      goalIdsAndState,
      goals: goals || [] as GetGoal[],
      userGoals,
      stats,
      funderReputations
    }}>
      {children}
    </ImpactPayContext.Provider>
  );
}

export function useImpactPay() {
  const context = useContext(ImpactPayContext);
  if (!context) throw new Error('useImpactPay must be used within HashFlowProvider');
  return context;
}






















