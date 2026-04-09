// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {ImpactPay} from "../src/ImpactPay.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract ImpactPayTest is Test {
    MockERC20 token;
    ImpactPay impactPay;

    address owner = address(0xA11CE);
    address treasury = address(0xBEEF);
    address approver = address(0xCAFE);
    address creator = address(0xC001);
    address donor1 = address(0xD001);
    address donor2 = address(0xD002);
    address donor3 = address(0xD003);
    address donor4 = address(0xD004);

    uint256 billListingFee = 50_000; // $0.05 (6 decimals)
    uint256 scholarshipListingFee = 1_000_000; // $1.00 (6 decimals)

    function setUp() public {
        vm.startPrank(owner);
        token = new MockERC20();
        impactPay = new ImpactPay(
            address(token),
            treasury,
            approver,
            owner,
            billListingFee,
            scholarshipListingFee
        );
        vm.stopPrank();

        _mintAndApprove(creator, 10_000_000);
        _mintAndApprove(donor1, 10_000_000);
        _mintAndApprove(donor2, 10_000_000);
        _mintAndApprove(donor3, 10_000_000);
        _mintAndApprove(donor4, 10_000_000);
    }

    function _mintAndApprove(address user, uint256 amount) internal {
        token.mint(user, amount);
        vm.prank(user);
        token.approve(address(impactPay), type(uint256).max);
    }

    function _createScholarshipGoal() internal returns (uint256) {
        vm.prank(creator);
        impactPay.createGoal(5_000_000, ImpactPay.Category.Scholarship, "Nursing scholarship");
        return 1;
    }

    function _createBillGoal() internal returns (uint256) {
        vm.prank(creator);
        impactPay.createGoal(2_000_000, ImpactPay.Category.Bill, "Electricity bill");
        return 1;
    }

    function testScholarshipMilestoneReleaseFlow() public {
        uint256 goalId = _createScholarshipGoal();

        vm.prank(donor1);
        impactPay.fundGoal(goalId, 3_000_000);
        vm.prank(donor2);
        impactPay.fundGoal(goalId, 2_000_000);

        uint256 beforeCreator = token.balanceOf(creator);

        vm.prank(creator);
        impactPay.claimFunds(goalId); // 20%
        assertEq(token.balanceOf(creator), beforeCreator + 1_000_000);

        vm.prank(approver);
        impactPay.approveRelease(goalId); // +40%
        assertEq(token.balanceOf(creator), beforeCreator + 3_000_000);

        vm.prank(owner);
        impactPay.approveRelease(goalId); // +40%
        assertEq(token.balanceOf(creator), beforeCreator + 5_000_000);
    }

    function testFlaggedGoalPreventsWithdrawal() public {
        uint256 goalId = _createScholarshipGoal();

        vm.prank(donor1);
        impactPay.fundGoal(goalId, 1_250_000);
        vm.prank(donor2);
        impactPay.fundGoal(goalId, 1_250_000);
        vm.prank(donor3);
        impactPay.fundGoal(goalId, 1_250_000);
        vm.prank(donor4);
        impactPay.fundGoal(goalId, 1_250_000);

        vm.prank(donor1);
        impactPay.flagGoal(goalId);
        vm.prank(donor2);
        impactPay.flagGoal(goalId);
        vm.prank(donor3);
        impactPay.flagGoal(goalId);
        vm.prank(donor4);
        impactPay.flagGoal(goalId);

        vm.prank(creator);
        vm.expectRevert(ImpactPay.GoalLocked.selector);
        impactPay.claimFunds(goalId);
    }

    function testCreationFailsWithoutExactListingFee() public {
        address notFundedCreator = address(0xF00D);
        vm.prank(notFundedCreator);
        token.approve(address(impactPay), type(uint256).max);

        vm.prank(notFundedCreator);
        vm.expectRevert(bytes("BALANCE"));
        impactPay.createGoal(5_000_000, ImpactPay.Category.Scholarship, "Should fail");
    }

    function testBillClaimDeductsSuccessFeeAndListingFeeSentImmediately() public {
        uint256 beforeTreasury = token.balanceOf(treasury);
        uint256 goalId = _createBillGoal();
        assertEq(token.balanceOf(treasury), beforeTreasury + billListingFee);

        vm.prank(donor1);
        impactPay.fundGoal(goalId, 2_000_000);

        uint256 creatorBefore = token.balanceOf(creator);
        uint256 treasuryBeforeClaim = token.balanceOf(treasury);

        vm.prank(creator);
        impactPay.claimFunds(goalId);

        // 3% success fee from 2_000_000 = 60_000
        assertEq(token.balanceOf(treasury), treasuryBeforeClaim + 60_000);
        assertEq(token.balanceOf(creator), creatorBefore + 1_940_000);
    }
}

