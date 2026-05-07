// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test, console2} from "forge-std/Test.sol";
import {ImpactPay} from "../contracts/ImpactPay.sol";
import {ImpactGoal} from "../contracts/ImpactGoal.sol";
import {MockERC20} from "../contracts/MockERC20.sol";
import {IVerification} from "../contracts/abstracts/Verification.sol";

contract ImpactPayTest is Test {
    ImpactPay public impactPay;
    ImpactGoal public impactGoal;
    MockERC20 public token;

    address public owner = address(this);
    address public treasury = address(0x1);
    address public funder = address(0x2);
    address public claimant = address(0x3);
    address public backendSigner = address(0x4);

    uint256 public constant INITIAL_BALANCE = 1000e18;

    function setUp() public {
        token = new MockERC20();
        impactGoal = new ImpactGoal(
            address(token),
            treasury,
            owner, // release approver
            backendSigner
        );

        impactPay = new ImpactPay(
            address(token),
            owner,
            treasury,
            impactGoal
        );

        token.mint(funder, INITIAL_BALANCE);
        vm.prank(funder);
        token.approve(address(impactPay), type(uint256).max);
        
        impactGoal.toggleUseVerifier();
        vm.prank(backendSigner);
        impactGoal.onVerificationSuccess(claimant, IVerification.Level.LEVEL1);
    }

    function test_DistributeWealth_Stablecoin() public {
        vm.prank(funder);
        bool success = impactPay.distributeWealth(
            100e18,
            "John",
            "@john",
            "Message",
            ImpactPay.Pattern.PHILANTROPIST,
            IVerification.Level.LEVEL1
        );
        assertTrue(success);

        (,,, uint claimed, , , , , ImpactPay.Currency currency, , , ) = impactPay.funders(1);
        assertEq(claimed, 0);
        assertEq(uint8(currency), uint8(ImpactPay.Currency.STABLECOIN));
    }

    function test_DistributeWealth_Native() public {
        vm.deal(funder, 1 ether);
        vm.prank(funder);
        bool success = impactPay.distributeWealth{value: 1 ether}(
            1 ether,
            "John",
            "@john",
            "Message",
            ImpactPay.Pattern.PHILANTROPIST,
            IVerification.Level.LEVEL1
        );
        assertTrue(success);

        (,,, uint claimed, , , , , ImpactPay.Currency currency, , , ) = impactPay.funders(1);
        assertEq(claimed, 0);
        assertEq(uint8(currency), uint8(ImpactPay.Currency.NATIVE));
    }

    function test_ClaimGigs() public {
        vm.prank(funder);
        impactPay.distributeWealth(
            100e18,
            "John",
            "@john",
            "Message",
            ImpactPay.Pattern.PHILANTROPIST,
            IVerification.Level.LEVEL1
        );

        uint claimantBalanceBefore = token.balanceOf(claimant);
        
        vm.prank(claimant);
        bool success = impactPay.claimGigs(1);
        assertTrue(success);

        assertGt(token.balanceOf(claimant), claimantBalanceBefore);
    }
}
