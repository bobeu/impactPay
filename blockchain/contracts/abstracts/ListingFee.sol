// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { OnchainImpact } from "./OnchainImpact.sol";

/// @title Listing fees for the ImpactPay protocol
/// @notice A decentralized philantropic platform for managing bill payments, scholarships, and social impact goals.
/// @dev Implements the OnchainImpact contract
abstract contract ListingFee is OnchainImpact {
    /// @notice Fee in absolute token units to list a Bill goal
    uint256 internal billListingFee;

    /// @notice Fee in absolute token units to list a Scholarship goal
    uint256 internal scholarshipListingFee;
    
    /// @notice Fee in absolute token units to list an Other goal
    uint256 internal otherListingFee;

    /// @notice Fee in Basis Points for scholarship withdrawals
    uint256 internal scholarshipFeeBP = 300;

    /// @notice Fee in Basis Points for bill fulfillment relays
    uint256 internal billSuccessFeeBP = 300;

    /// @notice Denominator for Basis Points calculations
    uint256 public constant BPS_DENOMINATOR = 10000;

    constructor(address backendFulfillmentSigner_) OnchainImpact(backendFulfillmentSigner_) {
        billListingFee = 1e16 wei;
        otherListingFee = 1e15 wei;
        scholarshipListingFee = 1e17 wei;
    }

    /// @notice Updates the other listing fee
    /// @param newListingFee The new fee amount
    function setOtherListingFee(uint256 newListingFee) public onlyOwner returns(bool){
        otherListingFee = newListingFee;
        return true;
    }

    
    /// @notice Updates the bill listing fee
    /// @param newListingFee The new fee amount
    function setBillListingFee(uint256 newListingFee) public onlyOwner returns(bool){
        billListingFee = newListingFee;
        return true;
    }

    /// @notice Updates the scholarship listing fee
    /// @param newListingFee The new fee amount
    function setScolarshipListingFee(uint256 newListingFee) public onlyOwner returns(bool){
        scholarshipListingFee = newListingFee;
        return true;
    }

    /// @notice Updates the scholarship listing fee
    /// @param newBP The new basis point
    function setScholarshipFeeBP(uint16 newBP) public onlyOwner returns(bool){
        scholarshipFeeBP = newBP;
        return true;
    }

    /// @notice Updates the scholarship listing fee
    /// @param newBP The new basis point
    function setBillSuccessFeeBP(uint16 newBP) public onlyOwner returns(bool){
        billSuccessFeeBP = newBP;
        return true;
    }
}