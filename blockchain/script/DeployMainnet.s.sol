// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Script } from "forge-std/Script.sol";
import { ImpactPay } from "../contracts/ImpactPay.sol";

/**
 * @title DeployMainnet
 * @notice Production deployment script for Celo Mainnet.
 */
contract DeployMainnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        // Celo Mainnet Config
        address cUSD = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address approver = vm.envAddress("RELEASE_APPROVER_ADDRESS");
        address backendSigner = vm.envAddress("BACKEND_SIGNER_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);

        new ImpactPay(
            cUSD,
            treasury,
            approver,
            backendSigner
        );

        vm.stopBroadcast();
    }
}
