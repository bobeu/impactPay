'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useConfig, useSignTypedData, useWatchContractEvent } from 'wagmi';
import { waitForTransactionReceipt } from "wagmi/actions";
import { CONTRACTS } from '@/contracts';
import { formatUnits, parseUnits, Hex, type Address } from 'viem';
import { toast } from 'sonner';
import { GetGoal, GetGoalIdAndState, ImpactPayContextType, TransactionStage } from "../lib/types";
// import { JURISDICTIONS } from '@/components/dashboard/jurisdiction-selector';

const HashFlowContext = createContext<ImpactPayContextType | undefined>(undefined);

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
  const { data: rawGoals, refetch: refetchGoals } = useReadContracts({
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
  const { writeContractAsync: writeCreateScholarshipGoal } = useWriteContract();
  const { writeContractAsync: writeCreateOtherGoal } = useWriteContract();
  const { writeContractAsync: writeFundGoal } = useWriteContract();
  const { writeContractAsync: writeReactivateGoal } = useWriteContract();
  const { writeContractAsync: writeApproveScholarshipRelease} = useWriteContract();
  const { writeContractAsync: writeClaimScholarshipFunds} = useWriteContract();
  const { writeContractAsync: writeRelayBillFundsToService} = useWriteContract();
  const { writeContractAsync: writeRefundScholarship} = useWriteContract();
  const { writeContractAsync: writeFlagGoal} = useWriteContract();
  const { writeContractAsync: writeOnVerificationSuccess} = useWriteContract();

  const createEscrow = async ({ worker, amount, taxBP, taxRecipient }: { worker: string; amount: string; taxBP: number; taxRecipient: string }) => {
    try {
      setModalStage('awaiting_auth');
      setModalTxHash('');
      setModalError('');

      const amountValue = parseUnits(amount, decimals);
      let hash: Hex;

      // Try EIP-3009 first
      if (symbol.includes('USDC') || symbol === 'USDT') {
        try {
          const validAfter = 0n;
          const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600);
          const nonce = `0x${Date.now().toString(16).padStart(64, '0')}` as Hex;
          const resolvedChainId = chainId ?? 133;
          
          const officialUSDCAddress = getOfficialUSDCAddress();
          const isOfficial = CONTRACTS.MockERC20.address.toLowerCase() === officialUSDCAddress;
          const domain = {
            name: isOfficial ? 'USD Coin' : 'Mock USDC',
            version: isOfficial ? '2' : '1',
            chainId: resolvedChainId,
            verifyingContract: isOfficial ? officialUSDCAddress as Hex : CONTRACTS.MockERC20.address as Hex
          };

          const signature = await signTypedDataAsync({
            domain,
            types: {
              TransferWithAuthorization: [
                { name: 'from', type: 'address' },
                { name: 'to', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'validAfter', type: 'uint256' },
                { name: 'validBefore', type: 'uint256' },
                { name: 'nonce', type: 'bytes32' }
              ]
            },
            primaryType: 'TransferWithAuthorization',
            message: { from: address as Hex, to: CONTRACTS.HashFlowEscrow.address as Hex, value: amountValue, validAfter, validBefore, nonce }
          });

          const r = `0x${signature.slice(2, 66)}` as Hex;
          const s = `0x${signature.slice(66, 130)}` as Hex;
          let v = parseInt(signature.slice(130, 132), 16);
          if (v < 27) v += 27;

          hash = await writeEscrowAuth({
            address: CONTRACTS.HashFlowEscrow.address,
            abi: CONTRACTS.HashFlowEscrow.abi as any,
            functionName: 'createEscrowWithAuth',
            args: [worker as Hex, amountValue, taxBP, taxRecipient as Hex, validAfter, validBefore, nonce, v, r, s]
          });
        } catch (e) {
          console.warn("EIP-3009 failed, falling back to approve", e);
          // Fallback to standard
          await writeApprove({
            address: CONTRACTS.MockERC20.address,
            abi: CONTRACTS.MockERC20.abi as any,
            functionName: 'approve',
            args: [CONTRACTS.HashFlowEscrow.address, amountValue]
          });

          hash = await writeEscrow({
            address: CONTRACTS.HashFlowEscrow.address,
            abi: CONTRACTS.HashFlowEscrow.abi as any,
            functionName: 'createEscrow',
            args: [worker as Hex, taxRecipient as Hex, amountValue, taxBP]
          });
        }
      } else {
        await writeApprove({
          address: CONTRACTS.MockERC20.address,
          abi: CONTRACTS.MockERC20.abi as any,
          functionName: 'approve',
          args: [CONTRACTS.HashFlowEscrow.address, amountValue]
        });
        hash = await writeEscrow({
          address: CONTRACTS.HashFlowEscrow.address,
          abi: CONTRACTS.HashFlowEscrow.abi as any,
          functionName: 'createEscrow',
          args: [worker as Hex, taxRecipient as Hex, amountValue, taxBP]
        });
      }

      setModalTxHash(hash);
      setModalStage('payment_included');
      await waitForTransactionReceipt(config, { hash });
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

  const releaseMilestone = async (id: number) => {
    try {
      setModalStage('awaiting_auth');
      
      // 1. Capture max yield right before release
      // await syncSimulatedYield();

      const hash = await writeRelease({
        address: CONTRACTS.HashFlowEscrow.address,
        abi: CONTRACTS.HashFlowEscrow.abi as any,
        functionName: 'releaseMilestone',
        args: [BigInt(id)]
      });
      setModalTxHash(hash);
      setModalStage('payment_included');
      await waitForTransactionReceipt(config, { hash });
      setModalStage('verifying');
      setTimeout(() => {
        setModalStage('success');
        refresh();
        setShowShredder(true);
        setTimeout(() => setModalStage('idle'), 3000);
      }, 1500);
    } catch (err: any) {
      setModalStage('error');
      setModalError(err.shortMessage || err.message);
      setTimeout(() => setModalStage('idle'), 3000);
    }
  };

  const mockVerify = async (worker: string) => {
    try {
      const hash = await writeVerify({
        address: CONTRACTS.MockZKVerifier.address,
        abi: CONTRACTS.MockZKVerifier.abi as any,
        functionName: 'setVerificationStatus',
        args: [worker as Hex, true]
      });
      await waitForTransactionReceipt(config, { hash });
      refresh();
      toast.success("Worker identity verified on-chain");
    } catch (err: any) {
      toast.error(err.shortMessage || err.message);
    }
  };

  return (
    <HashFlowContext.Provider value={{
      milestones,
      stats,
      isVerified: false, // Placeholder, usually checked per worker address in component
      isLoading: isLoadingFlows,
      modal: {
        stage: modalStage,
        txHash: modalTxHash,
        error: modalError,
        setStage: setModalStage
      },
      createEscrow,
      releaseMilestone,
      mockVerify,
      refresh,
      // syncSimulatedYield,
      showShredder,
      setShowShredder,
      selectedFlowForShredder,
      setSelectedFlowForShredder
    }}>
      {children}
    </HashFlowContext.Provider>
  );
}

export function useHashFlow() {
  const context = useContext(HashFlowContext);
  if (!context) throw new Error('useHashFlow must be used within HashFlowProvider');
  return context;
}
