// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test, console2} from "forge-std/Test.sol";
import {ImpactPay} from "../src/ImpactPay.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract ImpactPayTest is Test {
    ImpactPay public impactPay;
    MockERC20 public token;

    address public owner = address(this);
    address public treasury = address(0x1);
    address public approver = address(0x2);
    address public signer = address(0x3);
    address public creator = address(0x4);
    address public donor = address(0x5);
    address public billServiceProvider = address(0x6);

    uint256 public constant BILL_FEE = 10e18;
    uint256 public constant SCHOLARSHIP_FEE = 20e18;
    uint256 public constant INITIAL_BALANCE = 1000e18;

    function setUp() public {
        token = new MockERC20();
        impactPay = new ImpactPay(
            address(token),
            treasury,
            approver,
            signer,
            BILL_FEE,
            SCHOLARSHIP_FEE
        );

        token.mint(creator, INITIAL_BALANCE);
        token.mint(donor, INITIAL_BALANCE);

        vm.prank(creator);
        token.approve(address(impactPay), type(uint256).max);

        vm.prank(donor);
        token.approve(address(impactPay), type(uint256).max);
        
        // Register a bill service
        impactPay.setBillService(billServiceProvider);
    }

    // --- Goal Creation Tests ---

    function test_CreateGoal_Default() public {
        vm.prank(creator);
        bool success = impactPay.createGoal(100e18, "Default Goal", "Extra Info");
        assertTrue(success);
        
        ImpactPay.GetGoal memory goal = impactPay.getGoal(1);
        assertEq(goal.common.targetAmount, 100e18);
        assertEq(uint8(goal.common.goalType), uint8(ImpactPay.GoalType.DEFAULT));
    }

    function test_CreateBillGoal() public {
        uint256 balanceBefore = token.balanceOf(treasury);
        
        vm.prank(creator);
        bool success = impactPay.createBillGoal(
            50e18, 
            "Electricity Bill", 
            "electricity", 
            "ID: 123", 
            0 // index of billServiceProvider
        );
        assertTrue(success);
        assertEq(token.balanceOf(treasury), balanceBefore + BILL_FEE);
        
        ImpactPay.GetGoal memory goal = impactPay.getGoal(1);
        assertEq(uint8(goal.common.goalType), uint8(ImpactPay.GoalType.BILL));
        assertEq(goal.bill.billService, billServiceProvider);
    }

    function test_CreateScholarshipGoal_RevertIfNoLevel3() public {
        vm.prank(creator);
        vm.expectRevert(ImpactPay.Level3Required.selector);
        impactPay.createScholarshipGoal(100e18, "Scholarship", "Info");
    }

    function test_CreateScholarshipGoal_SuccessAfterLevel3() public {
        impactPay.onVerificationSuccess(creator);
        
        vm.prank(creator);
        bool success = impactPay.createScholarshipGoal(100e18, "Scholarship", "Info");
        assertTrue(success);
        
        ImpactPay.GetGoal memory goal = impactPay.getGoal(1);
        assertEq(uint8(goal.common.goalType), uint8(ImpactPay.GoalType.SCHOLARSHIP));
    }

    // --- Funding Tests ---

    function test_FundGoal() public {
        vm.prank(creator);
        impactPay.createGoal(100e18, "Goal", "Info");

        vm.prank(donor);
        bool success = impactPay.fundGoal(1, 50e18, "Donor Info");
        assertTrue(success);

        ImpactPay.GetGoal memory goal = impactPay.getGoal(1);
        assertEq(goal.common.raisedAmount, 50e18);
        assertEq(goal.funders.length, 1);
        assertEq(goal.funders[0].id, donor);
    }

    function test_FundGoal_StatusUpdatesToRaised() public {
        vm.prank(creator);
        impactPay.createGoal(100e18, "Goal", "Info");

        vm.prank(donor);
        impactPay.fundGoal(1, 100e18, "Donor Info");

        ImpactPay.GetGoal memory goal = impactPay.getGoal(1);
        assertEq(uint8(goal.common.status), uint8(ImpactPay.GoalStatus.RAISED));
    }

    // --- Scholarship Fulfillment Tests ---

    function test_ScholarshipMilestoneFlow() public {
        // Setup raised scholarship goal
        impactPay.onVerificationSuccess(creator);
        vm.prank(creator);
        impactPay.createScholarshipGoal(100e18, "Scholarship", "Info");
        vm.prank(donor);
        impactPay.fundGoal(1, 100e18, "");

        // First Milestone (20%)
        uint256 creatorBalanceBefore = token.balanceOf(creator);
        vm.prank(creator);
        impactPay.claimScholarshipFunds(1, address(0));

        uint256 expectedPayout = (100e18 * 20) / 100;
        uint256 fee = (expectedPayout * 300) / 10000;
        assertEq(token.balanceOf(creator), creatorBalanceBefore + expectedPayout - fee);
    }

    // --- Bill Relay Tests ---

    function test_RelayBillFunds() public {
        vm.prank(creator);
        impactPay.createBillGoal(50e18, "Bill", "Type", "", 0);
        vm.prank(donor);
        impactPay.fundGoal(1, 50e18, "");

        uint256 serviceBalanceBefore = token.balanceOf(billServiceProvider);
        
        vm.prank(approver);
        impactPay.relayBillFundsToService(1, 50e18);

        uint256 fee = (50e18 * 300) / 10000;
        assertEq(token.balanceOf(billServiceProvider), serviceBalanceBefore + 50e18 - fee);
        
        ImpactPay.GetGoal memory goal = impactPay.getGoal(1);
        assertEq(uint8(goal.common.status), uint8(ImpactPay.GoalStatus.FULFILLED));
    }

    // --- Flagging and Locking Tests ---

    function test_FlagGoal() public {
        vm.prank(creator);
        impactPay.createGoal(100e18, "Goal", "");
        vm.prank(donor);
        impactPay.fundGoal(1, 10e18, "");

        vm.prank(donor);
        impactPay.flagGoal(1);

        ImpactPay.GetGoal memory goal = impactPay.getGoal(1);
        assertEq(goal.common.flagsCount, 1);
    }

    // --- Admin Tests ---

    function test_Restriction() public {
        impactPay.restriction(donor, true);
        
        vm.prank(donor);
        vm.expectRevert("Restricted");
        impactPay.fundGoal(1, 10e18, "");
    }

    function test_Pause() public {
        impactPay.pause();
        
        vm.prank(creator);
        // Using custom error selector for Pausable
        vm.expectRevert(bytes4(keccak256("EnforcedPause()")));
        impactPay.createGoal(100e18, "Goal", "");
    }

    function test_MaxGoals() public {
        impactPay.setMaxGoal(1);
        
        vm.prank(creator);
        impactPay.createGoal(100e18, "Goal 1", "");
        
        vm.prank(creator);
        vm.expectRevert(ImpactPay.MaxGoalExceeded.selector);
        impactPay.createGoal(100e18, "Goal 2", "");
    }

    function test_ReactivateGoal() public {
        vm.prank(creator);
        impactPay.createGoal(100e18, "Goal", "");
        
        vm.prank(creator);
        impactPay.fulfillGoal(1, ImpactPay.GoalStatus.FULFILLED);
        
        ImpactPay.GetGoal memory goalBefore = impactPay.getGoal(1);
        assertEq(uint8(goalBefore.common.status), uint8(ImpactPay.GoalStatus.FULFILLED));
        
        impactPay.reactivateGoal(1);
        
        ImpactPay.GetGoal memory goalAfter = impactPay.getGoal(1);
        assertEq(uint8(goalAfter.common.status), uint8(ImpactPay.GoalStatus.OPEN));
    }

    function test_RefundScholarship() public {
        impactPay.onVerificationSuccess(creator);
        vm.prank(creator);
        impactPay.createScholarshipGoal(100e18, "Scholarship", "");
        
        vm.prank(donor);
        impactPay.fundGoal(1, 100e18, "");

        // First milestone withdrawal
        vm.prank(creator);
        impactPay.claimScholarshipFunds(1, address(0));
        
        vm.warp(block.timestamp + 91 days);
        
        uint256 donorBalanceBefore = token.balanceOf(donor);
        vm.prank(donor);
        impactPay.refundScholarship(1);
        
        assertGt(token.balanceOf(donor), donorBalanceBefore);
    }

    function test_ApproveScholarshipRelease() public {
        impactPay.onVerificationSuccess(creator);
        vm.prank(creator);
        impactPay.createScholarshipGoal(100e18, "Scholarship", "");
        
        vm.prank(donor);
        impactPay.fundGoal(1, 100e18, "");

        // Withdraw once - this locks the goal
        vm.prank(creator);
        impactPay.claimScholarshipFunds(1, address(0));
        
        ImpactPay.GetGoal memory goalLocked = impactPay.getGoal(1);
        assertTrue(goalLocked.common.lockedForReview);

        // Try to withdraw again - should fail because of lock
        vm.prank(creator);
        vm.expectRevert("Locked for review");
        impactPay.claimScholarshipFunds(1, address(0));

        // Approver unlocks
        uint256[] memory ids = new uint256[](1);
        ids[0] = 1;
        vm.prank(approver);
        impactPay.approveScholarshipRelease(ids);
        
        ImpactPay.GetGoal memory goalUnlocked = impactPay.getGoal(1);
        assertFalse(goalUnlocked.common.lockedForReview);
    }

    function test_FlagGoal_LockingAtThreshold() public {
        vm.prank(creator);
        impactPay.createGoal(100e18, "Goal", "");
        
        address donor2 = address(0x222);
        address donor3 = address(0x333);
        token.mint(donor2, 10e18);
        token.mint(donor3, 10e18);
        vm.prank(donor2); token.approve(address(impactPay), 10e18);
        vm.prank(donor3); token.approve(address(impactPay), 10e18);

        vm.prank(donor); impactPay.fundGoal(1, 1e18, "");
        vm.prank(donor2); impactPay.fundGoal(1, 1e18, "");
        vm.prank(donor3); impactPay.fundGoal(1, 1e18, "");

        vm.prank(donor); impactPay.flagGoal(1);
        vm.prank(donor2); impactPay.flagGoal(1);
        
        ImpactPay.GetGoal memory goalBefore = impactPay.getGoal(1);
        assertFalse(goalBefore.common.lockedForReview);

        vm.prank(donor3); impactPay.flagGoal(1);
        
        ImpactPay.GetGoal memory goalAfter = impactPay.getGoal(1);
        assertTrue(goalAfter.common.lockedForReview);
    }
}