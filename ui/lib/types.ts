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
'toggleFlagGoal' |
'refundScholarship' |
'onVerificationSuccess' |
'claimFund' |
'cancelGoal' | 
'cancelGoalOnlyCreator'

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
    dataCreated: bigint;
    description: string; // bytes
    extraLink: string; // bytes
    status: GoalStatus;
    goalType: GoalType;
    flagsCount: number;
    lockedForReview: boolean;
}

export interface User {
    isVerified: boolean;
    score: bigint;
    lastVerifiedDate: bigint;
}

export interface Uint256s {
    reputation: bigint;
    onchainVerifiedCounter: bigint;
    billListingFee: bigint;
    scholarshipListingFee: bigint;
    defaultListingFee: bigint;
    scholarshipFeeBP: bigint;
    billSuccessFeeBP: bigint;
    goalCounter: bigint;
    maxGoal: bigint;
    verified: bigint;
    totalUsersScores: bigint;
    level3Indexer: bigint;
}

export interface Arrays {
    goalIds: readonly bigint[];
    billServices: readonly Address[];
    verifications: readonly User[];
}

export interface Addresses {
    treasury: Address;
    releaseApprover: Address;
    backendFulfillmentSigner: Address;
}

/// @notice Composite struct for goal id and state variables information retrieval
export interface GetGoalIdAndState {
    uints: Uint256s;
    arrays: Arrays;
    addresses: Addresses;
    qualifiedLevel: VerificationLevel;
    restricted: boolean;
    useVerifier: boolean;
}

// ImpactPay Wealth Redistribution Types
export enum Currency { NATIVE, STABLECOIN }
export enum Pattern { PHILANTROPIST, REDISTRIBUTE }

export interface Snapshot {
    time: bigint;
    totalScores: bigint;
}

export interface PayFunder {
    remainingPool: bigint;
    amount: bigint;
    dateCreated: bigint;
    claimed: bigint;
    id: Address;
    name: string;
    handle: string;
    message: string;
    currency: Currency;
    pattern: Pattern;
    requiredLevel: VerificationLevel;
    snapshot: Snapshot;
}

export interface ImpactPayStateData {
    counter: bigint;
    maxClaimPeriod: bigint;
    cooldown: bigint;
    treasury: Address;
    verifier: Address;
    stableToken: Address;
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
    hasFlagged: boolean;
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
    impactPayStateData: ImpactPayStateData;
    payFunders: PayFunder[];
    userClaims: Record<number, { amount: bigint; dateClaimed: bigint; isClaimed: boolean }>;
    isLoading: boolean;
    owner: Address;
    selectedVersion: number;
    setSelectedVersion: (version: number) => void;
    availableVersions: number;
    impactGoalAddress: Address;
    impactPayAddress: Address;
    mockERC20Address: Address;

    // Modal State (Global for easier orchestration)
    modal: {
        stage: TransactionStage;
        txHash: string;
        error: string;
        fee: bigint;
        setStage: (s: TransactionStage) => void;
    };
 
    // Actions
    createGoal: (params: CreateBillGoal) => Promise<void>;
    fundGoal: (goalId: bigint, amount: bigint, extraInfo: string) => Promise<void>;
    reactivateGoal: (goalId: bigint) => Promise<void>;
    cancelGoal: (goalId: bigint) => Promise<void>;
    approveScholarshipRelease: (goalIds: bigint[]) => Promise<void>;
    claimScholarshipFunds: (goalId: bigint, recipient: Address) => Promise<void>;
    relayBillFundsToService: (goalId: bigint, amount: bigint) => Promise<void>;
    toggleFlagGoal: (goalId: bigint) => Promise<void>;
    claimFund: (goalId: bigint) => Promise<void>;
    refundScholarship: (goalId: bigint) => Promise<void>;
    onVerificationSuccess: (user: Address) => Promise<void>;
    refresh: () => void;
}

export const mockGetGoalIDAndState : GetGoalIdAndState = {
    uints: {
        reputation: 0n,
        onchainVerifiedCounter: 0n,
        billListingFee: 0n,
        scholarshipListingFee: 0n,
        defaultListingFee: 0n,
        scholarshipFeeBP: 0n,
        billSuccessFeeBP: 0n,
        goalCounter: 0n,
        maxGoal: 0n,
        verified: 0n,
        totalUsersScores: 0n,
        level3Indexer: 0n
    },
    arrays: {
        goalIds: [0n],
        billServices: [zeroAddress],
        verifications: []
    },
    addresses: {
        treasury: zeroAddress,
        releaseApprover: zeroAddress,
        backendFulfillmentSigner: zeroAddress
    },
    qualifiedLevel: 0,
    restricted: false,
    useVerifier: false
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
        dataCreated: 0n,
        lockedForReview: false,
        withdrawnAmount: 0n,
        extraLink: ""
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
        id: zeroAddress,
        hasFlagged: false
    }]
}

export const mockImpactState : ImpactPayStateData = {
    cooldown: 0n,
    counter: 0n,
    maxClaimPeriod: 0n,
    stableToken: zeroAddress,
    treasury: zeroAddress,
    verifier: zeroAddress
}