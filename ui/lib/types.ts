import { Address } from "viem";

export enum GoalType {
    DEFAULT,
    BILL,
    SCHOLARSHIP
}

export type GoalTypeStr = 'DEFAULT' | 'BILL' | 'SCHOLARSHIP';
export type OtherFuncType = 
'fundGoal' | 
'reactivateGoal' | 
'approveScholarshipRelease' | 
'claimScholarshipFunds' | 
'relayBillFundsToService' |
'flagGoal' |
'refundScholarship' |
'onVerificationSuccess'

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
    level3Verified: boolean;
    restricted: boolean;
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
    billServiceIndex?: string;
}

export interface Args {
    goalIds?: bigint[];
    recipient?: Address;
    amount?: bigint;
    user?: Address;
    extraInfo?: string;
    func: OtherFuncType;
}

export interface ImpactPayContextType {
  goals: GetGoal[];
  goalIdsAndState: GetGoalIdAndState;
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
  refundScholarship: (goalId: bigint) => Promise<void>;
  onVerificationSuccess: (user: Address) => Promise<void>;
  refresh: () => void;
}
