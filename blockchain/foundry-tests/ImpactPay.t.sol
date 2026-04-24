// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test, console2} from "forge-std/Test.sol";
import {ImpactPay} from "../contracts/ImpactPay.sol";
import {MockERC20} from "../contracts/MockERC20.sol";

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

    uint256 public constant INITIAL_BALANCE = 1000e18;

    function setUp() public {
        token = new MockERC20();
        impactPay = new ImpactPay(
            address(token),
            treasury,
            approver,
            signer
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
        vm.prank(creator);
        bool success = impactPay.createBillGoal(
            50e18, 
            "Electricity Bill", 
            "electricity", 
            "ID: 123", 
            0 // index of billServiceProvider
        );
        assertTrue(success);
        
        ImpactPay.GetGoal memory goal = impactPay.getGoal(1);
        assertEq(uint8(goal.common.goalType), uint8(ImpactPay.GoalType.BILL));
        assertEq(goal.bill.billService, billServiceProvider);
    }

    function test_CreateScholarshipGoal_RevertIfNoLevel3() public {
        // Toggle verifier on to test verifications
        impactPay.toggleUseVerifier();
        
        vm.prank(creator);
        vm.expectRevert("Not verified");
        impactPay.createScholarshipGoal(100e18, "Scholarship", "Info");
    }

    function test_CreateScholarshipGoal_SuccessAfterLevel3() public {
        impactPay.toggleUseVerifier();
        impactPay.onVerificationSuccess(creator, ImpactPay.Level.LEVEL3);
        
        vm.prank(creator);
        bool success = impactPay.createScholarshipGoal(100e18, "Scholarship", "Info");
        assertTrue(success);
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

    // --- Scholarship Fulfillment Tests ---

    function test_ScholarshipMilestoneFlow() public {
        impactPay.onVerificationSuccess(creator, ImpactPay.Level.LEVEL3);
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
        
        // We need to enable useBillService to relay to the provider
        impactPay.toggleUseBillService();
        
        vm.prank(approver);
        impactPay.relayBillFundsToService(1, 50e18);

        uint256 fee = (50e18 * 300) / 10000;
        assertEq(token.balanceOf(billServiceProvider), serviceBalanceBefore + 50e18 - fee);
    }

    // --- Flagging and Locking Tests ---

    function test_FlagGoal() public {
        vm.prank(creator);
        impactPay.createGoal(100e18, "Goal", "");
        vm.prank(donor);
        impactPay.fundGoal(1, 10e18, "");

        vm.prank(donor);
        impactPay.toggleFlagGoal(1);

        ImpactPay.GetGoal memory goal = impactPay.getGoal(1);
        assertEq(goal.common.flagsCount, 1);
    }

    // --- Admin Tests ---

    function test_Restriction() public {
        impactPay.setRestriction(donor, true);
        
        vm.prank(donor);
        vm.expectRevert("Restricted");
        impactPay.fundGoal(1, 10e18, "");
    }

    function test_Pause() public {
        impactPay.pause();
        
        vm.prank(creator);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        impactPay.createGoal(100e18, "Goal", "");
    }

    function test_RefundScholarship() public {
        impactPay.onVerificationSuccess(creator, ImpactPay.Level.LEVEL3);
        vm.prank(creator);
        impactPay.createScholarshipGoal(100e18, "Scholarship", "");
        
        vm.prank(donor);
        impactPay.fundGoal(1, 100e18, "");

        vm.prank(creator);
        impactPay.claimScholarshipFunds(1, address(0));
        
        vm.warp(block.timestamp + 91 days);
        
        uint256 donorBalanceBefore = token.balanceOf(donor);
        vm.prank(donor);
        impactPay.refundScholarship(1);
        
        assertGt(token.balanceOf(donor), donorBalanceBefore);
    }
}