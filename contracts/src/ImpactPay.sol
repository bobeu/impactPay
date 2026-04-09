// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Pausable } from "../lib/openzeppelin/contracts/utils/Pausable.sol";
import { Ownable } from "../lib/openzeppelin/contracts/access/Ownable.sol";
// import { IERC20 } from "../lib/openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20, IERC20 } from "../lib/openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "../lib/openzeppelin/contracts/utils/ReentrancyGuard.sol";

// interface IERC20Like {
//     function transfer(address to, uint256 amount) external returns (bool);
//     function transferFrom(address from, address to, uint256 amount) external returns (bool);
// }

contract ImpactPay is Pausable, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Category {
        BILL,
        SCHOLARSHIP,
        OTHER
    }

    enum GoalStatus {
        OPEN,
        FUNDED,
        FULFILLED,
        CANCELED
    }

    struct Goal {
        uint256 id;
        address creator;
        uint256 targetAmount;
        uint256 raisedAmount;
        uint256 withdrawnAmount;
        uint256 refundedAmount;
        uint64 milestoneDeadline;
        bytes description;
        Category category;
        GoalStatus status;
        uint8 milestoneIndex;
        uint8 flagsCount;
        bool lockedForReview;
    }

    IERC20 public immutable stableToken;
    // address public owner;
    address public treasury;
    address public releaseApprover;
    address public backendFulfillmentSigner;
    // bool public paused;

    uint256 public immutable billListingFee;
    uint256 public immutable scholarshipListingFee;
    uint256 public constant SUCCESS_FEE_BPS = 300; // 3%
    uint256 public constant BPS_DENOMINATOR = 10000;

    uint256 public nextGoalId = 1;
    uint public maxGoal;

    mapping(uint256 => Goal) public goals;
    mapping(uint256 => uint8) public goalCount;
    mapping(uint256 => mapping(address => uint256)) public donationsByDonor;
    mapping(uint256 => mapping(address => bool)) public hasFlagged;
    mapping(uint256 => mapping(address => bool)) public donorRefunded;
    mapping(address => bool) public level3Verified;

    event GoalCreated(
        uint256 indexed goalId,
        address indexed creator,
        address indexed donor,
        Category category,
        uint256 targetAmount,
        string description
    );
    event Funded(uint256 indexed goalId, address indexed donor, uint256 amount, uint256 totalRaised);
    event Completed(uint256 indexed goalId, address indexed donor, uint256 amountReleased, uint8 milestoneIndex);
    event GoalFlagged(uint256 indexed goalId, address indexed donor, uint8 flagsCount, bool lockedForReview);
    event GoalFulfilled(uint256 indexed goalId);
    event Refunded(uint256 indexed goalId, address indexed donor, uint256 amount);
    event ReputationUpdated(address indexed account, int256 delta, string reason);
    event Paused(bool state);

    error NotOwner();
    error NotCreator();
    error NotReleaseApprover();
    error InvalidAmount();
    error GoalNotFound();
    error GoalNotOpen();
    error GoalNotFunded();
    error GoalLocked();
    error WrongListingFee();
    error ScholarshipOnly();
    error BillOnly();
    error Level3Required();
    error AlreadyFinalized();
    error NotDonor();
    error AlreadyFlagged();
    error TransferFailed();
    error NotVerified();
    error RefundNotAvailable();
    error AlreadyRefunded();
    error PausedError();
    error MaxGoalExceeded();

    modifier onlyReleaseApprover() {
        address sender = _msgSender();
        if (sender != owner() && sender != releaseApprover) revert NotReleaseApprover();
        _;
    }

    constructor(
        address stableToken_,
        address treasury_,
        address releaseApprover_,
        address backendFulfillmentSigner_,
        uint256 billListingFee_,
        uint256 scholarshipListingFee_
    ) Ownable(_msgSender()) {
        stableToken = IERC20Like(stableToken_);
        owner = _msgSender();
        treasury = treasury_;
        releaseApprover = releaseApprover_;
        backendFulfillmentSigner = backendFulfillmentSigner_;
        billListingFee = billListingFee_;
        scholarshipListingFee = scholarshipListingFee_;
    }

    function createGoal(
        uint256 targetAmount,
        Category category,
        string calldata description
    ) external whenNotPaused {
        address sender = _msgSender();
        if (targetAmount == 0) revert InvalidAmount();
        if (category == Category.SCHOLARSHIP && !level3Verified[sender]) revert Level3Required();
        if(maxGoal > 0){
            if(goalCount[sender] == maxGoal) revert MaxGoalExceeded();
        }
        goalCount[sender]++;
        uint256 listingFee = category == Category.Bill ? billListingFee : scholarshipListingFee;
        if(listingFee > 0) stableToken.safeTransferFrom(sender, treasury, listingFee);

        uint256 goalId = nextGoalId++;
        goals[goalId] = Goal({
            id: goalId,
            creator: sender,
            targetAmount: targetAmount,
            raisedAmount: 0,
            withdrawnAmount: 0,
            refundedAmount: 0,
            milestoneDeadline: 0,
            description: abi.encode(bytes(description)),
            category: category,
            status: GoalStatus.Open,
            milestoneIndex: 0,
            flagsCount: 0,
            lockedForReview: false
        });

        emit GoalCreated(goalId, _msgSender(), address(0), category, targetAmount, description);
    }

    function fundGoal(uint256 goalId, uint256 amount) external whenNotPaused nonReentrant {
        address sender = _msgSender();
        Goal storage goal = goals[goalId];
        if (goal.id == 0) revert GoalNotFound();
        if (goal.status != GoalStatus.Open) revert GoalNotOpen();
        if (amount == 0) revert InvalidAmount();

        stableToken.safeTransferFrom(sender, address(this), amount);

        goal.raisedAmount += amount;
        donationsByDonor[goalId][sender] += amount;

        if (goal.raisedAmount >= goal.targetAmount) {
            goal.status = GoalStatus.Funded;
        }

        emit Funded(goalId, sender, amount, goal.raisedAmount);
    }

    function claimFunds(uint256 goalId) external whenNotPaused nonReentrant {
        address sender = _msgSender();
        Goal storage goal = goals[goalId];
        if (goal.id == 0) revert GoalNotFound();
        if (goal.creator != sender) revert NotCreator();
        if (goal.lockedForReview) revert GoalLocked();
        if (goal.status != GoalStatus.Funded && goal.status != GoalStatus.Fulfilled) revert GoalNotFunded();

        if (goal.category == Category.Bill) {
            if (goal.withdrawnAmount > 0) revert AlreadyFinalized();
            uint256 fee = (goal.raisedAmount * SUCCESS_FEE_BPS) / BPS_DENOMINATOR;
            uint256 payoutAmount = goal.raisedAmount - fee;
            goal.withdrawnAmount = goal.raisedAmount;
            goal.status = GoalStatus.Fulfilled;
            if (!stableToken.transfer(treasury, fee)) revert TransferFailed();
            if (!stableToken.transfer(goal.creator, payoutAmount)) revert TransferFailed();
            emit Completed(goalId, sender, payoutAmount, 1);
            emit ReputationUpdated(goal.creator, 100, "goal_fulfilled");
            return;
        }

        // Scholarship: first claim = 20%
        if (goal.milestoneIndex != 0) revert AlreadyFinalized();
        uint256 firstTranche = (goal.raisedAmount * 20) / 100;
        goal.withdrawnAmount += firstTranche;
        goal.milestoneIndex = 1;
        goal.milestoneDeadline = uint64(block.timestamp + 90 days);
        if (!stableToken.transfer(goal.creator, firstTranche)) revert TransferFailed();
        emit Completed(goalId, sender, firstTranche, 1);
    }

    function approveRelease(uint256 goalId) external onlyReleaseApprover whenNotPaused nonReentrant {
        Goal storage goal = goals[goalId];
        if (goal.id == 0) revert GoalNotFound();
        if (goal.lockedForReview) revert GoalLocked();
        if (goal.category != Category.Scholarship) revert ScholarshipOnly();
        if (goal.status != GoalStatus.Funded && goal.status != GoalStatus.Fulfilled) revert GoalNotFunded();
        if (goal.milestoneIndex == 0) revert GoalNotFunded(); // first tranche not claimed yet
        if (goal.milestoneIndex >= 3) revert AlreadyFinalized();

        uint256 amountToRelease;
        if (goal.milestoneIndex == 1) {
            amountToRelease = (goal.raisedAmount * 40) / 100;
            goal.milestoneIndex = 2;
            goal.milestoneDeadline = uint64(block.timestamp + 90 days);
        } else {
            amountToRelease = goal.raisedAmount - goal.withdrawnAmount; // remaining 40%
            goal.milestoneIndex = 3;
            goal.status = GoalStatus.Fulfilled;
            goal.milestoneDeadline = 0;
        }

        goal.withdrawnAmount += amountToRelease;
        if (!stableToken.transfer(goal.creator, amountToRelease)) revert TransferFailed();
        emit Completed(goalId, _msgSender(), amountToRelease, goal.milestoneIndex);
        if (goal.milestoneIndex == 3) emit ReputationUpdated(goal.creator, 100, "goal_fulfilled");
    }

    function flagGoal(uint256 goalId) external whenNotPaused {
        Goal storage goal = goals[goalId];
        if (goal.id == 0) revert GoalNotFound();
        if (donationsByDonor[goalId][_msgSender()] == 0) revert NotDonor();
        if (hasFlagged[goalId][_msgSender()]) revert AlreadyFlagged();

        hasFlagged[goalId][_msgSender()] = true;
        goal.flagsCount += 1;
        if (goal.flagsCount > 3) {
            goal.lockedForReview = true;
        }
        emit GoalFlagged(goalId, _msgSender(), goal.flagsCount, goal.lockedForReview);
        emit ReputationUpdated(goal.creator, -500, "goal_flagged");
    }

    function markBillFulfilled(uint256 goalId) external whenNotPaused {
        if (_msgSender() != backendFulfillmentSigner && _msgSender() != owner) revert NotOwner();
        Goal storage goal = goals[goalId];
        if (goal.id == 0) revert GoalNotFound();
        if (goal.category != Category.Bill) revert BillOnly();
        goal.status = GoalStatus.Fulfilled;
        emit GoalFulfilled(goalId);
        emit ReputationUpdated(goal.creator, 100, "goal_fulfilled");
    }

    function refund(uint256 goalId) external whenNotPaused nonReentrant {
        Goal storage goal = goals[goalId];
        if (goal.id == 0) revert GoalNotFound();
        if (goal.category != Category.Scholarship) revert ScholarshipOnly();
        if (goal.milestoneIndex == 0) revert RefundNotAvailable();
        if (goal.milestoneIndex >= 2) revert RefundNotAvailable();
        if (goal.milestoneDeadline == 0 || block.timestamp <= goal.milestoneDeadline) revert RefundNotAvailable();
        if (donationsByDonor[goalId][_msgSender()] == 0) revert NotDonor();
        if (donorRefunded[goalId][_msgSender()]) revert AlreadyRefunded();

        uint256 remainingPool = goal.raisedAmount - goal.withdrawnAmount - goal.refundedAmount;
        uint256 donorShare = (donationsByDonor[goalId][_msgSender()] * remainingPool) / goal.raisedAmount;
        if (donorShare == 0) revert RefundNotAvailable();

        donorRefunded[goalId][_msgSender()] = true;
        goal.refundedAmount += donorShare;
        if (!stableToken.transfer(_msgSender(), donorShare)) revert TransferFailed();
        if (goal.refundedAmount >= (goal.raisedAmount * 80) / 100) {
            goal.status = GoalStatus.Cancelled;
        }
        emit Refunded(goalId, _msgSender(), donorShare);
        emit ReputationUpdated(goal.creator, -200, "proof_unmet");
    }

    function onVerificationSuccess(address user) external {
        if (_msgSender() != backendFulfillmentSigner && _msgSender() != owner) revert NotOwner();
        level3Verified[user] = true;
    }

    function setReleaseApprover(address newApprover) external onlyOwner {
        releaseApprover = newApprover;
    }

    function setBackendFulfillmentSigner(address newSigner) external onlyOwner {
        backendFulfillmentSigner = newSigner;
    }

    // function setPaused(bool state) external onlyOwner {
    //     paused = state;
    //     emit Paused(state);
    // }

    function pause() public onlyOwner {
        _pause();
    }
}

