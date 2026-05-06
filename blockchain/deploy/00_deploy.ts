import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction, DeployResult } from 'hardhat-deploy/types';
import { config as dotconfig } from 'dotenv';
import { parseUnits } from 'ethers';
import { Address, zeroAddress } from 'viem';

dotconfig();

enum Level { LEVEL1, LEVEL2, LEVEL3 }

interface BillGoal {
  serviceType: string; 
  billService: Address; 
}

interface Funder {
    amount: bigint;
    id: Address;
    extraInfo: string;
    fundedAt: bigint;
}

/// @notice Specific data for Scholarship-type goals
interface ScholarshipGoal {
  refundedAmount: bigint;
    milestoneDeadline: bigint;
    milestone: number;
    disputed: boolean;
}

/// @notice Common data shared by all goal types
interface CommonData {
  id: bigint;
  creator: Address;
  targetAmount: bigint;
  raisedAmount: bigint;
  withdrawnAmount: bigint;
  description: string;
  status: number;
  goalType: number;
  flagsCount: number;
  lockedForReview: boolean;
}

interface User {
  isVerified: boolean;
  score: bigint;
  lastVerifiedDate: bigint;
}

interface Arrays {
  goalIds: bigint[];
  billServices: Address[];
  verifications: User[];
}

interface Addresses {
  stableToken: Address;
  treasury: Address;
  releaseApprover: Address;
  backendFulfillmentSigner: Address;
}

interface Uint256s {
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

interface GetGoalIdAndState {
  uints: Uint256s
  arrays: Arrays;
  addresses: Addresses;
  qualifiedLevel: Level;
  restricted: boolean;
  useVerifier: boolean;
}

/// @notice Composite struct for goal information retrieval
interface GetGoal {
  bill: BillGoal;
  scholarship:  ScholarshipGoal;
  common:  CommonData;
  funders:  Funder[];
}

const STABLETOKEN : Record<string, string> = {
  '11142220': "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b", 
  '42220': "0x765de816845861e75a25fca122bb6898b8b1282a",
  '31337': "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b"
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy, execute, read } = deployments;

  // Pull named accounts defined in hardhat.config.ts
  const { deployer, treasury, releaseApprover, backendFulfillmentSigner } = await getNamedAccounts();
  const chainId = await getChainId();
  const stableToken = STABLETOKEN[chainId];
  const isTestnet = chainId === "11142220";

  console.log('======================================');
  console.log('  HashFlow - PRODUCTION GENESIS DEPLOY');
  console.log('======================================');
  console.log('Chain ID        :', chainId);
  console.log('Deployer        :', deployer);
  console.log('Stable token     :', stableToken);
  console.log('Treasury         :', treasury);
  console.log('Release Approver :', releaseApprover);
  console.log('Backend Fulfillment Signer :', backendFulfillmentSigner);
  console.log('--------------------------------------');

  // ===========================================================================
  // PHASE 1: DEPLOYMENT
  // ===========================================================================
  console.log('\n--- Phase 1: Deployment ---');

  let mockERC20: DeployResult = {
    address: zeroAddress,
    newlyDeployed: false,
    abi: []
  };

  // MockERC20 — institutional entry point (constructor: token, escrow)
   if(isTestnet || chainId === '31337'){
    mockERC20 = await deploy('MockERC20', {
      from: deployer,
      args: [],
      log: true,
    });
    console.log('MockERC20 deployed:', mockERC20.address);
  }

  // ERC-4626 yield vault (MockVault — constructor: asset, owner)
  const impactGoal = await deploy('ImpactGoal', {
    from: deployer,
    args: [
      isTestnet? mockERC20.address : stableToken,
      treasury,
      releaseApprover,
      backendFulfillmentSigner
    ],
    log: true,
  });
  console.log('ImpactGoal deployed :', impactGoal.address);

  const impactPay = await deploy('ImpactPay', {
    from: deployer,
    args: [
      isTestnet? mockERC20.address : stableToken,
      deployer,
      treasury,
      impactGoal.address
    ],
    log: true,
  });
  console.log('ImpactPay deployed :', impactPay.address);

  try {
    await execute("MockERC20", {from:deployer}, "mint", deployer, parseUnits("10000", 18));
    console.log("Mint successful");
  } catch (error) {
    console.log("Minting failed with: ", error?.message || error?.data?.message || error);
  }

  const goal = await read('ImpactGoal', 'getGoal', 0) as GetGoal;
  const goalIdsAndState = await read('ImpactGoal', 'getGoalIdAndState', zeroAddress) as GetGoalIdAndState;
  const balance = await read('MockERC20', 'balanceOf', deployer) as bigint;
  console.log('Initial getGoal(0) call goal:', goal);
  console.log('Initial goalIdsAndState call goal:', goalIdsAndState);
  console.log('Balance:', balance.toString());
};

export default func;

func.tags = ["MockERC20", "ImpactGoal", "ImpactPay"];
