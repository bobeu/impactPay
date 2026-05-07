// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { BillService } from "./BillService.sol";

/// @title Reputation contract for the ImpactpPay Protocol
/// @notice A contract that tracks users onchain reputation

abstract contract Reputation is BillService {
    // /// @notice The stable token used for all transactions (e.g., USDT/USDC)
    IERC20 internal stableToken;

    /// @notice Onchain reputation
    mapping(address => uint) internal reputationScores;

    constructor(address stableToken_) {
        stableToken = IERC20(stableToken_);
    }

    function setStableToken(address newStableToken) public returns(bool) {
        _beforeCall();
        require(newStableToken != address(0), "2");
        stableToken = IERC20(newStableToken);

        return true;
    }

    function _editReputation(bool add, uint256 amount, address target, bool isFunder) internal {
        uint256 mantissa = 10 ** IERC20Metadata(address(stableToken)).decimals();
        if (add) {
            reputationScores[target] += isFunder? amount > mantissa? (amount / mantissa) : 1 : 5;
        } else {
            uint rep = reputationScores[target];
            reputationScores[target] = rep >= 5? rep - 5 : 0; 
        }
    }

    function getReputation(address target) public view returns(uint) {
        return reputationScores[target];
    }
}