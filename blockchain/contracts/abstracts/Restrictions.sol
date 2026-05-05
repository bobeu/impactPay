// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/** 
    ERROR CODE:

    12 - Restricted
*/


/// @title Restriction contract for the ImpactPay protocol
/// @notice A decentralized philantropic platform for managing bill payments, scholarships, and social impact goals.
/// @dev Implements the ListingFee contract
abstract contract Restrictions is Pausable, Ownable {
    event RestrictionStatus(address indexed target, bool status);
   
    /// @notice Mapping to check if an address has restricted access
    mapping(address => bool) private restrictions;

    /// @notice Ensures the target address is not restricted
    /// @param target The address to check
    modifier notRestricted(address target) {
        if (target != owner()) require(!restrictions[target], "12");
        _;
    }

    constructor() Ownable(_msgSender()) {}

    /// @notice Sets restriction status for an address
    /// @param target Address to restrict/unrestrict
    function toggleRestriction(address target) public onlyOwner returns(bool) {
        bool status;
        restrictions[target] = !status;
        emit RestrictionStatus(target, !status);

        return true;
    }

    function getRestriction(address target) public view returns(bool) {
        return restrictions[target];
    }
}