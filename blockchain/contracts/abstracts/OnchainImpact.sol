// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Verification } from "./Verification.sol";

/** 
    ERROR CODE:

    11 - Tx from this contract disallowed
*/

abstract contract OnchainImpact is Verification {
    event QualifiedLevelChange(Level oldLevel, Level newLevel);
    event ImpactRegistered(
        address indexed targetContract, 
        address indexed user, 
        uint8 score,
        bytes32[3] txHashes,
        uint onchainCounter
    );

    uint internal onchainVerifiedCounter;

    /// @notice Level that is qualified for onchain reward
    Level internal qualifiedLevel;

    mapping(bytes32 => bool) internal validated;

    mapping(address => mapping(bytes32 => bool)) internal entries;

    constructor(address backendFulfillmentSigner_) Verification(backendFulfillmentSigner_) {
        qualifiedLevel = Level.LEVEL3;
    }

    function setQualifiedLevel(Level _level) public onlyBackendManagerOrOwner returns(bool) {
        emit QualifiedLevelChange(qualifiedLevel, _level);
        qualifiedLevel = _level;

        return true;
    }

    function registerImpact(
        address user, 
        address targetContract,
        bytes32[3] memory txHashes, 
        uint8 score
    ) external onlyBackendManagerOrOwner returns(bool) {
        require(targetContract != address(this), "11");
        for(uint i = 0; i < txHashes.length; i++) {
            bytes32 txHash = txHashes[i];
            if (txHash.length > 0) {
                if (!validated[txHash] && !entries[user][txHash]) {
                    validated[txHash] = true;
                    entries[user][txHash] = true;
                    onchainVerifiedCounter++;
                    verification[user][qualifiedLevel].score += score;
                    totalUsersScores += score;
                }
            }
        }

        emit ImpactRegistered(targetContract, user, score, txHashes, onchainVerifiedCounter);
        return true;
    }

    function getTotalScores() external view returns(uint256){
        return totalUsersScores;
    }

    function getUserVerificationStatus(address user) external view returns(User[] memory, bool) {
       return (_getLevel(user), getRestriction(user));
    }
}