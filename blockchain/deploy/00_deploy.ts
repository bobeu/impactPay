import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { config as dotconfig } from 'dotenv';
import { parseUnits } from 'ethers';
import { Address, zeroAddress } from 'viem';

dotconfig();

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


interface GetGoal {
  bill: BillGoal;
  scholarship: ScholarshipGoal;
  common: CommonData;
  funders: Funder[];
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
  billServices: Address[];
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy, execute, read } = deployments;

  // Pull named accounts defined in hardhat.config.ts
  const { deployer, stableToken, treasury, releaseApprover, backendFulfillmentSigner } = await getNamedAccounts();
  const chainId = await getChainId();
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

  // MockERC20 — institutional entry point (constructor: token, escrow)
  const mockERC20 = await deploy('MockERC20', {
    from: deployer,
    args: [],
    log: true,
  });
  console.log('MockERC20 deployed:', mockERC20.address);

  // ERC-4626 yield vault (MockVault — constructor: asset, owner)
  const impactPay = await deploy('ImpactPay', {
    from: deployer,
    args: [
      isTestnet? mockERC20.address : stableToken,
      treasury,
      releaseApprover,
      backendFulfillmentSigner
    ],
    log: true,
  });
  console.log('ImpactPay deployed :', impactPay.address);

  const result = await read('ImpactPay', 'getGoal', 0) as GetGoal;
  console.log('Initial getGoal(0) call result:', result);
};

export default func;

func.tags = ["MockERC20"];
