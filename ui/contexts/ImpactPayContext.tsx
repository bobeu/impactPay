'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useConfig, useWatchContractEvent } from 'wagmi';
import { waitForTransactionReceipt } from "wagmi/actions";
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

const ImpactPayContext = createContext<ImpactPayContextType | undefined>(undefined);

export function ImpactPayProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const config = useConfig();

  // Global UI States
  const [modalStage, setModalStage] = useState<TransactionStage>('idle');
  const [modalTxHash, setModalTxHash] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');

  // 1. Fetch user goal IDs and state
  const { data: goalIdsAndState_, refetch: refetchIdsAndState } = useReadContract({
    address: CONTRACTS.ImpactPay.address,
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
      address: CONTRACTS.ImpactPay.address,
      abi: CONTRACTS.ImpactPay.abi as any,
      functionName: 'getGoal',
      args: [k]
    })),
    query: { enabled: goalIdsToFetch.length > 0 }
  });

  // // Fetch the goals for all the goal IDs
  // const { data: rawGoals, isLoading: isImpactPayLoading, refetch: refetchGoals } = useReadContracts({
  //   contracts: goalIdsAndState.goalIds.map(k => ({
  //     address: CONTRACTS.ImpactPay.address, 
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
    address: CONTRACTS.ImpactPay.address,
    abi: CONTRACTS.ImpactPay.abi as any,
    eventName: 'GoalCreated',
    onLogs: () => refresh()
  });

  useWatchContractEvent({
    address: CONTRACTS.ImpactPay.address,
    abi: CONTRACTS.ImpactPay.abi as any,
    eventName: 'Funded',
    onLogs: () => refresh()
  });

  useWatchContractEvent({
    address: CONTRACTS.ImpactPay.address,
    abi: CONTRACTS.ImpactPay.abi as any,
    eventName: 'ReputationUpdated',
    onLogs: () => refresh()
  });

  // Write Hooks
  const { writeContractAsync: writeCreateBillGoal } = useWriteContract();
  const { writeContractAsync: writeTxn } = useWriteContract();
  const { writeContractAsync: writeApproval } = useWriteContract();

  const createGoal = async (param: CreateBillGoal) => {
    try {
      setModalStage('awaiting_auth');
      setModalTxHash('');
      setModalError('');
      const { goalType, description, extraInfo, targetAmount, billServiceIndex, serviceType } = param;
      let args = [];
      let functionName = 'createGoal';

      switch (goalType) {
        case 'BILL':
          if (!serviceType) return;
          if (!billServiceIndex) return;
          functionName = 'createBillGoal'
          args = [targetAmount, description, serviceType, extraInfo, billServiceIndex];
          break;
        case 'SCHOLARSHIP':
          functionName = 'createScholarshipGoal';
          args = [targetAmount, description, extraInfo];
          break;
        default:
          args = [targetAmount, description, extraInfo];
          break;
      }

      const hash = await writeCreateBillGoal({
        address: CONTRACTS.ImpactPay.address,
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: functionName,
        args
      });

      setModalTxHash(hash);
      setModalStage('tx_included');
      await waitForTransactionReceipt(config, { hash, confirmations: 2 });
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
    const { amount, extraInfo, goalIds, recipient, user, func } = param;
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
          const txHash = await writeApproval({
            address: CONTRACTS.MockERC20.address,
            abi: CONTRACTS.MockERC20.abi as any,
            functionName: 'approve',
            args: [CONTRACTS.ImpactPay.address, amount]
          });
          await waitForTransactionReceipt(config, { hash: txHash });

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

      const hash = await writeTxn({
        address: CONTRACTS.ImpactPay.address,
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: func,
        args
      });
      setModalTxHash(hash);
      setModalStage('tx_included');
      await waitForTransactionReceipt(config, { hash });
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
