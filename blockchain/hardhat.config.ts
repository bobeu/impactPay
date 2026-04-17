import { config as dotconfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "@nomiclabs/hardhat-web3";
import "@nomicfoundation/hardhat-viem";

dotconfig();

const config: HardhatUserConfig = {
  paths: {
    deploy: 'deploy',
    deployments: 'deployments',
    imports: 'imports'
  },
  networks: {
    celoSepolia: {
      url: "https://forno.celo-sepolia.celo-testnet.org",
      accounts: [`${process.env.P_KEY_0xD7c}`],
      chainId: 11142220,
    },
    celo: {
      chainId: 42220,
      accounts: [`${process.env.P_KEY_far}`],
      url: 'https://forno.celo.org',
    },
  },

    //   IERC20 public immutable stableToken;
    // /// @notice Address where listing and success fees are sent
    // address public treasury;
    // /// @notice Address authorized to approve milestone releases and relay funds
    // address public releaseApprover;
    // /// @notice Address used to verify off-chain fulfillment or user verification
    // address public backendFulfillmentSigner;

  namedAccounts: {
    deployer: {
      default: 0,
      1142220: `privatekey://${process.env.P_KEY_0xD7c}`,
      42220: `privatekey://${process.env.P_KEY_far}`
    },
    stabletoken:{
      default: 1,
      11142220: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b", 
      42220: '0x765de816845861e75a25fca122bb6898b8b1282a'
    },
    treasury:{
      default: 2,
      11142220: `privatekey://${process.env.P_KEY_0xa1f}`, 
      42220: `privatekey://${process.env.P_KEY_0xa1f}`
    },
    releaseApprover:{
      default: 2,
      11142220: `privatekey://${process.env.P_KEY_0xC0F}`, 
      42220: `privatekey://${process.env.P_KEY_0xC0F}`
    },
    backendFulfillmentSigner:{
      default: 2,
      11142220: `privatekey://${process.env.P_KEY_0xC0F}`, 
      42220: `privatekey://${process.env.P_KEY_0xC0F}`
    },
  },
  solidity: {
    version: "0.8.28",
    settings: {          // See the solidity docs for advice about optimization and evmVersion
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun"
      // evmVersion: "constantinople", // Using "constantinople" for broader compatibility, as "paris" may not be supported in all environments yet
      // evmVersion: "paris"
    }
  },
};

export default config;