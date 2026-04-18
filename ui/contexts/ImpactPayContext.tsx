'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useConfig, useSignTypedData, useWatchContractEvent } from 'wagmi';
import { waitForTransactionReceipt } from "wagmi/actions";
import { CONTRACTS } from '@/contracts';
import { toast } from 'sonner';
import type { 
  CreateBillGoal, 
  GetGoal, 
  GetGoalIdAndState, 
  ImpactPayContextType, 
  TransactionStage, 
  Args
} from "../lib/types";
import { Address } from 'viem';

const ImpactPayContext = createContext<ImpactPayContextType | undefined>(undefined);

export function HashFlowProvider({ children }: { children: React.ReactNode }) {
  const { address, chainId } = useAccount();
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

  const goalIdsAndState = React.useMemo(() => {
    if (!goalIdsAndState_) return { } as GetGoalIdAndState;
    return goalIdsAndState_ as GetGoalIdAndState;
  }, [ goalIdsAndState_ ]);

  // Fetch the goals for all the goal IDs
  const { data: rawGoals, isLoading: isImpactPayLoading, refetch: refetchGoals } = useReadContracts({
    contracts: goalIdsAndState.goalIds.map(k => ({
      address: CONTRACTS.ImpactPay.address, 
      abi: CONTRACTS.ImpactPay.abi as any, 
      functionName: 'getGoal',
      args: [k]
    })),
    query: { enabled: !!goalIdsAndState }
  });

  // Derived the goals
  const goals = useMemo(() => rawGoals?.map(k => k?.result as GetGoal), [rawGoals]);
  console.log("Goals", goals);
 
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
  const { writeContractAsync: writeFundGoal } = useWriteContract();
  const { writeContractAsync: writeTxn } = useWriteContract();
  const { writeContractAsync: writeApproveScholarshipRelease} = useWriteContract();
  const { writeContractAsync: writeClaimScholarshipFunds} = useWriteContract();
  const { writeContractAsync: writeRelayBillFundsToService} = useWriteContract();
  const { writeContractAsync: writeRefundScholarship} = useWriteContract();
  const { writeContractAsync: writeFlagGoal} = useWriteContract();
  const { writeContractAsync: writeOnVerificationSuccess} = useWriteContract();

  const createGoal = async (param: CreateBillGoal) => {
    try {
      setModalStage('awaiting_auth');
      setModalTxHash('');
      setModalError('');
      const { goalType, description, extraInfo, targetAmount, billServiceIndex, serviceType } = param;
      let args = [];

      switch (goalType) {
        case 'BILL':
          if (!serviceType) return; 
          if (!billServiceIndex) return; 
          args = [targetAmount, description, serviceType, extraInfo, billServiceIndex];
          break;
        default:
          args = [targetAmount, description, extraInfo];
          break;
      }

      const hash = await writeCreateBillGoal({
        address: CONTRACTS.ImpactPay.address,
        abi: CONTRACTS.ImpactPay.abi as any,
        functionName: 'createBill',
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
      let errorMessage : string | null = null;
      if (func !== 'onVerificationSuccess') {
        if (!goalIds) errorMessage = "Goal Id not provided";
        if (goalIds?.length == 0) errorMessage = "Goal Id undefined";
      } 

      switch (func) {
        case 'fundGoal':
          if (!amount) errorMessage = "Please provide amount";
          args = [goalIds?.[0], amount || 0n, extraInfo || ''];
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
      fundGoal: async(goalId: bigint, amount: bigint, extraInfo: string) => { await runTransaction({goalIds: [goalId], amount, extraInfo, func:'fundGoal'})},
      flagGoal: async(goalId: bigint) => { await runTransaction({goalIds: [goalId], func:'flagGoal'})},
      reactivateGoal: async(goalId: bigint) => { await runTransaction({goalIds: [goalId], func:'reactivateGoal'})},
      approveScholarshipRelease: async(goalIds: bigint[]) => { await runTransaction({goalIds, func: 'approveScholarshipRelease'})},
      claimScholarshipFunds: async(goalId: bigint, recipient: Address) => { await runTransaction({goalIds: [goalId], recipient, func: 'claimScholarshipFunds'})},
      relayBillFundsToService: async(goalId: bigint, amount: bigint) => { await runTransaction({goalIds: [goalId], amount, func: 'relayBillFundsToService'})},
      refundScholarship: async(goalId: bigint) => { await runTransaction({goalIds: [goalId], func: 'refundScholarship'})},
      onVerificationSuccess: async(user: Address) => { await runTransaction({user, func: 'onVerificationSuccess'})},
      goalIdsAndState,
      goals: goals || [{}] as GetGoal[]
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
