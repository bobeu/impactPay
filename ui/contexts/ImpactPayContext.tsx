
'use client';

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
  mockGoals,
  mockImpactState,
  ImpactPayStateData,
  Funder,
  PayFunder
} from "../lib/types";
import { Address, zeroAddress } from 'viem';
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

  const [selectedVersion, setSelectedVersion] = useState<number>(() => {
    const addresses = CONTRACTS.ImpactGoal.address[chainId as keyof typeof CONTRACTS.ImpactGoal.address];
    return addresses ? addresses.length - 1 : 0;
  });

  const availableVersions = useMemo(() => {
    const addresses = CONTRACTS.ImpactGoal.address[chainId as keyof typeof CONTRACTS.ImpactGoal.address];
    return addresses ? addresses.length : 1;
  }, [chainId]);

  const impactGoalAddress = useMemo(() => {
    const addresses = CONTRACTS.ImpactGoal.address[chainId as keyof typeof CONTRACTS.ImpactGoal.address];
    if (!addresses || addresses.length === 0) return zeroAddress;
    const v = selectedVersion >= 0 && selectedVersion < addresses.length ? selectedVersion : addresses.length - 1;
    return addresses[v];
  }, [chainId, selectedVersion]);

  const impactPayAddress = useMemo(() => {
    const addresses = CONTRACTS.ImpactPay.address[chainId as keyof typeof CONTRACTS.ImpactPay.address];
    if (!addresses || addresses.length === 0) return zeroAddress;
    const v = selectedVersion >= 0 && selectedVersion < addresses.length ? selectedVersion : addresses.length - 1;
    return addresses[v];
  }, [chainId, selectedVersion]);

  const mockERC20Address = useMemo(() => {
    const addresses = CONTRACTS.MockERC20.address[chainId as keyof typeof CONTRACTS.MockERC20.address];
    if (!addresses || addresses.length === 0) return zeroAddress;
    const v = selectedVersion >= 0 && selectedVersion < addresses.length ? selectedVersion : addresses.length - 1;
    return addresses[v];
  }, [chainId, selectedVersion]);

  // 1. Fetch user goal IDs and state
  const { data: goalIdsAndState_, refetch: refetchIdsAndState } = useReadContract({
    address: impactGoalAddress,
    abi: CONTRACTS.ImpactGoal.abi as any,
    functionName: 'getGoalIdAndState',
    args: [address as `0x${string}`],
    query: { enabled: !!address }
  });

  // 1. Fetch user goal IDs and state
  const { data: impactPayState, refetch: refetchImpactState } = useReadContract({
    address: impactPayAddress,
    abi: CONTRACTS.ImpactPay.abi as any,
    functionName: 'getStateData',
    args: [],
    query: { enabled: !!isConnected }
  });

  const { data: owner, refetch: refetchOwner } = useReadContract({
    address: impactGoalAddress,
    abi: CONTRACTS.ImpactGoal.abi as any,
    functionName: 'owner',
    args: [],
    query: { enabled: !!isConnected }
  });

  const { goalIdsAndState, goalIdsToFetch } = React.useMemo(() => {
    if (!goalIdsAndState_) return { goalIdsAndState: mockGetGoalIDAndState, goalIdsToFetch: [] };
    const goalIdsData = goalIdsAndState_ as GetGoalIdAndState;
    const fetchedIds: bigint[] = Array.from(Array(Number(goalIdsData.uints.goalCounter || 0)).keys()).map(n => BigInt(n + 1));
    return {
      goalIdsAndState: goalIdsData,
      goalIdsToFetch: fetchedIds
    };
  }, [goalIdsAndState_]);

  const { impactPayStateData, counterIds } = React.useMemo(() => {
    if (!impactPayState) return {impactPayStateData: mockImpactState, counterIds: [0n]};
    const v = impactPayState as ImpactPayStateData;
    const counterIds: bigint[] = Array.from(Array(Number(v.counter || 0)).keys()).map(n => BigInt(n + 1));
    
    return { impactPayStateData: v, counterIds }
  }, [impactPayState]);

  
  // Fetch the goals for all the goal IDs
  const { data: rawGoals, isLoading: isImpactGoalLoading, refetch: refetchGoals } = useReadContracts({
    contracts: goalIdsToFetch.map(k => ({
      address: impactGoalAddress,
      abi: CONTRACTS.ImpactGoal.abi as any,
      functionName: 'getGoal',
      args: [k]
    })),
    query: { enabled: goalIdsToFetch.length > 0 }
  });

  // Fetch the Funders from the ImpactPay contract
  const { data: rawFunders, isLoading: isImpactPayLoading, refetch: refetchFunders } = useReadContracts({
    contracts: counterIds.map(k => ({
      address: impactPayAddress,
      abi: CONTRACTS.ImpactPay.abi as any,
      functionName: 'funders',
      args: [k]
    })),
    query: { enabled: counterIds.length > 0 }
  });

  // Fetch the User Claims from the ImpactPay contract
  const { data: rawUserClaims } = useReadContracts({
    contracts: counterIds.map(k => ({
      address: impactPayAddress,
      abi: CONTRACTS.ImpactPay.abi as any,
      functionName: 'claims',
      args: [address as Address, k]
    })),
    query: { enabled: counterIds.length > 0 && !!address }
  });

  // console.log("goalIdsToFetch", goalIdsToFetch);
  // console.log("rawGoals", rawGoals)

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

  const { payFunders, userClaims } = React.useMemo(() => {
    const payFunders = (rawFunders?.map((k: any) => k?.result as PayFunder) as PayFunder[] || []).filter(f => f && f.id !== zeroAddress);
    const userClaims: Record<number, { amount: bigint; dateClaimed: bigint; isClaimed: boolean }> = {};
    
    if (rawUserClaims) {
      rawUserClaims.forEach((res: any, index: number) => {
        if (res.result) {
          const claim = res.result as { amount: bigint; dateClaimed: bigint; isClaimed: boolean };
          userClaims[Number(counterIds[index])] = claim;
        }
      });
    }

    return { payFunders, userClaims };
  }, [rawFunders, rawUserClaims, counterIds]);

  // console.log("userGoals", userGoals)
  // console.log("stats", stats)
  // console.log("goals", goals)

  const refresh = useCallback(() => {
    refetchIdsAndState();
    refetchImpactState();
    refetchFunders();
    refetchGoals();
    refetchOwner();
  }, [refetchIdsAndState, refetchGoals, refetchOwner, refetchFunders, refetchImpactState]);

  // Watch for events to auto-refresh
  useWatchContractEvent({
    address: impactGoalAddress,
    abi: CONTRACTS.ImpactGoal.abi as any,
    eventName: 'GoalCreated',
    onLogs: () => refresh()
  });

  useWatchContractEvent({
    address: impactGoalAddress,
    abi: CONTRACTS.ImpactGoal.abi as any,
    eventName: 'Funded',
    onLogs: () => refresh()
  });

  useWatchContractEvent({
    address: impactGoalAddress,
    abi: CONTRACTS.ImpactGoal.abi as any,
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
          listingFee = goalIdsAndState?.uints.billListingFee || 0n;
          break;
        case 'SCHOLARSHIP':
          functionName = 'createScholarshipGoal';
          args = [targetAmount, description, extraInfo, param.schoolName || "", param.studentId || ""];
          listingFee = goalIdsAndState?.uints.scholarshipListingFee || 0n;
          break;
        case 'CAREER':
          functionName = 'createCareerGoal';
          args = [targetAmount, description, extraInfo];
          listingFee = goalIdsAndState?.uints.otherListingFee || 0n;
          break;
        case 'BUSINESS':
          functionName = 'createBusinessGoal';
          args = [targetAmount, description, extraInfo];
          listingFee = goalIdsAndState?.uints.otherListingFee || 0n;
          break;
        default:
          args = [targetAmount, description, extraInfo];
          listingFee = goalIdsAndState?.uints.otherListingFee || 0n;
          break;
      }

      setModalFee(listingFee);
      const feeCurrency = mockERC20Address;

      if (listingFee > 0n) {
        await broadcastTransaction({
          address: mockERC20Address, // Use active MockERC20 address
          abi: CONTRACTS.MockERC20.abi as any,
          functionName: 'approve',
          args: [impactGoalAddress, listingFee],
          feeCurrency
        }, chainId);        
      }

      await simulateContract(config, {
        address: impactGoalAddress,
        abi: CONTRACTS.ImpactGoal.abi as any,
        functionName: functionName,
        args
      });

      const receipt = await broadcastTransaction({
        address: impactGoalAddress,
        abi: CONTRACTS.ImpactGoal.abi as any,
        functionName: functionName,
        args,
        feeCurrency
      }, chainId);

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
      console.log("Errored", err);
      const errMsg = (err.shortMessage || err.message || "").toLowerCase();
      if (errMsg.includes("insufficient funds") || errMsg.includes("exceeds balance") || errMsg.includes("intrinsic gas")) {
        if (typeof window !== "undefined" && window.ethereum?.isMiniPay) {
          window.location.href = "https://minipay.opera.com/add_cash";
          setModalStage('idle');
          return;
        }
      }
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
    const feeCurrency = mockERC20Address;
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
            address: mockERC20Address,
            abi: CONTRACTS.MockERC20.abi as any,
            functionName: 'approve',
            args: [impactGoalAddress, amount],
            feeCurrency
          }, chainId);

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
        address: impactGoalAddress,
        abi: CONTRACTS.ImpactGoal.abi as any,
        functionName: func,
        args
      });

      const receipt = await broadcastTransaction({
        address: impactGoalAddress,
        abi: CONTRACTS.ImpactGoal.abi as any,
        functionName: func,
        args,
        feeCurrency
      }, chainId);
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
      const errMsg = (err.shortMessage || err.message || "").toLowerCase();
      if (errMsg.includes("insufficient funds") || errMsg.includes("exceeds balance") || errMsg.includes("intrinsic gas")) {
        if (typeof window !== "undefined" && window.ethereum?.isMiniPay) {
          window.location.href = "https://minipay.opera.com/add_cash";
          setModalStage('idle');
          return;
        }
      }
      setModalStage('error');
      setModalError(err.shortMessage || err.message);
      setTimeout(() => setModalStage('idle'), 3000);
    }
  };

  return (
    <ImpactPayContext.Provider value={{
      isLoading: isImpactGoalLoading,
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
      cancelGoal: async(goalId: bigint) => { await runTransaction({ goalIds: [goalId], func: 'cancelGoalOnlyCreator' }) },
      fundGoal: async (goalId: bigint, amount: bigint, extraInfo: string) => { await runTransaction({ goalIds: [goalId], amount, extraInfo, func: 'fundGoal' }) },
      toggleFlagGoal: async (goalId: bigint) => { await runTransaction({ goalIds: [goalId], func: 'toggleFlagGoal' }) },
      reactivateGoal: async (goalId: bigint) => { await runTransaction({ goalIds: [goalId], func: 'reactivateGoal' }) },
      approveScholarshipRelease: async (goalIds: bigint[]) => { await runTransaction({ goalIds, func: 'approveScholarshipRelease' }) },
      claimScholarshipFunds: async (goalId: bigint, recipient: Address) => { await runTransaction({ goalIds: [goalId], recipient, func: 'claimScholarshipFunds' }) },
      relayBillFundsToService: async (goalId: bigint, amount: bigint) => { await runTransaction({ goalIds: [goalId], amount, func: 'relayBillFundsToService' }) },
      refundScholarship: async (goalId: bigint) => { await runTransaction({ goalIds: [goalId], func: 'refundScholarship' }) },
      onVerificationSuccess: async (user: Address) => { await runTransaction({ user, func: 'onVerificationSuccess' }) },
      goalIdsAndState,
      owner,
      goals: goals || [] as GetGoal[],
      userGoals,
      stats,
      funderReputations,
      impactPayStateData,
      payFunders,
      userClaims,
      selectedVersion,
      setSelectedVersion,
      availableVersions,
      impactGoalAddress,
      impactPayAddress,
      mockERC20Address
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
