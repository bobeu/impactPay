import { Address, zeroAddress } from "viem";

export enum GoalType {
    DEFAULT,
    BILL,
    SCHOLARSHIP
}

export type GoalTypeStr = 'DEFAULT' | 'BILL' | 'SCHOLARSHIP';
export enum GoalStr { 'Default', 'Bill', 'Scholarship'}
export type GoalCategory = "Bill" | "Scholarship" | "Default";
export type VerificationLevel = 0 | 1 | 2 | 3;
export type OtherFuncType = 
'fundGoal' | 
'reactivateGoal' | 
'approveScholarshipRelease' | 
'claimScholarshipFunds' | 
'relayBillFundsToService' |
'flagGoal' |
'refundScholarship' |
'onVerificationSuccess' |
'claimFund'

export enum GoalStatus {
    OPEN,
    RAISED,
    FULFILLED,
    CANCELED
}

export enum Milestone { 
    NONE, 
    TWENTY, 
    ONE_FORTY, 
    TWO_FORTY, 
    COMPLETED 
}

export type BillGoal = {
    serviceType: string; // Comes as bytes e.g., "electricity", "data", "subscription"
    billService: Address; // BitGifty or other bill service address
}

/// @notice Specific data for Scholarship-type goals
export type ScholarshipGoal = {
    refundedAmount: bigint;
    milestoneDeadline: bigint;
    milestone: Milestone;
    disputed: boolean;
}

/// @notice Common data shared by all goal types
export type CommonData = {
    id: bigint;
    creator: Address;
    targetAmount: bigint;
    raisedAmount: bigint;
    withdrawnAmount: bigint;
    description: string; // bytes
    status: GoalStatus;
    goalType: GoalType;
    flagsCount: number;
    lockedForReview: boolean;
}

export interface Verification {
    lvl1: boolean;
    lvl2: boolean;
    lvl3: boolean;
}

/// @notice Composite struct for goal id and state variables information retrieval
export interface GetGoalIdAndState {
    goalIds: readonly bigint[];
    treasury: Address;
    releaseApprover: Address;
    backendFulfillmentSigner: Address;
    billListingFee: bigint;
    scholarshipListingFee: bigint;
    defaultListingFee: bigint;
    scholarshipFeeBP: bigint;
    billSuccessFeeBP: bigint;
    goalCounter: bigint;
    maxGoal: bigint;
    billServices: readonly Address[];
    verifications: Verification;
    restricted: boolean;
    reputation: bigint;
}

/// @notice Composite struct for goal information retrieval
export type GetGoal = {
    bill: BillGoal;
    scholarship: ScholarshipGoal;
    common: CommonData;
    funders: readonly Funder[];
}

/// @notice Details about a funder and their contribution
export type Funder = {
    amount: bigint;
    id: Address;
    extraInfo: string; //  bytes;
    fundedAt: bigint;
}

export type TransactionStage = 'idle' | 'awaiting_auth' | 'tx_included' | 'verifying' | 'success' | 'error';

export interface CreateGoal { 
    targetAmount: bigint;
    description: string;
    extraInfo: string;
    goalType: GoalTypeStr;
}

export interface CreateBillGoal extends CreateGoal { 
    serviceType?: string;
    billServiceIndex?: number;
}

export interface Args {
    goalIds?: bigint[];
    recipient?: Address;
    amount?: bigint;
    user?: Address;
    extraInfo?: string;
    func: OtherFuncType;
}

export interface Stats {
  totalGoals: number;
  totalRaised: bigint;
  totalFunders: number;
  activeGoals: number;
}

export interface ImpactPayContextType {
  goals: GetGoal[];
  userGoals: GetGoal[] | undefined;
  goalIdsAndState: GetGoalIdAndState;
  stats: Stats;
  funderReputations: Record<string, bigint>;
  isLoading: boolean;

  // Modal State (Global for easier orchestration)
  modal: {
    stage: TransactionStage;
    txHash: string;
    error: string;
    setStage: (s: TransactionStage) => void;
  };
 
  // Actions
  createGoal: (params: CreateBillGoal) => Promise<void>;
  fundGoal: (goalId: bigint, amount: bigint, extraInfo: string) => Promise<void>;
  reactivateGoal: (goalId: bigint) => Promise<void>;
  approveScholarshipRelease: (goalIds: bigint[]) => Promise<void>;
  claimScholarshipFunds: (goalId: bigint, recipient: Address) => Promise<void>;
  relayBillFundsToService: (goalId: bigint, amount: bigint) => Promise<void>;
  flagGoal: (goalId: bigint) => Promise<void>;
  claimFund: (goalId: bigint) => Promise<void>;
  refundScholarship: (goalId: bigint) => Promise<void>;
  onVerificationSuccess: (user: Address) => Promise<void>;
  refresh: () => void;
}


export const mockGetGoalIDAndState : GetGoalIdAndState = {
    backendFulfillmentSigner: zeroAddress,
    billListingFee: 0n,
    billServices: zeroAddress,
    billSuccessFeeBP: 0n,
    defaultListingFee: 0n,
    goalCounter: 0n,
    goalIds: [0n],
    verifications: {
        lvl1: false,
        lvl2: false,
        lvl3: false
    },
    maxGoal: 0n,
    releaseApprover: zeroAddress,
    reputation: 0n,
    restricted: false,
    scholarshipFeeBP: 0n,
    scholarshipListingFee: 0n,
    treasury: zeroAddress
}

export const mockGoals : GetGoal = {
    bill: {
        billService: zeroAddress,
        serviceType: ""
    },
    common: {
        creator: zeroAddress,
        description: "",
        flagsCount: 0,
        goalType: GoalType.DEFAULT,
        id: 0n,
        raisedAmount: 0n,
        status: GoalStatus.OPEN,
        targetAmount: 0n,
        lockedForReview: false,
        withdrawnAmount: 0n
    },
    scholarship: {
        refundedAmount: 0n,
        milestoneDeadline: 0n,
        milestone: Milestone.NONE,
        disputed: false
    },
    funders: [{
        amount: 0n,
        extraInfo: "",
        fundedAt: 0n,
        id: zeroAddress
    }]
}