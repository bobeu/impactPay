// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Like {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract ImpactPay {
    enum Category {
        Bill,
        Scholarship
    }

    enum GoalStatus {
        Open,
        Funded,
        Fulfilled,
        Cancelled
    }

    struct Goal {
        uint256 id;
        address creator;
        uint256 targetAmount;
        uint256 raisedAmount;
        uint256 withdrawnAmount;
        string description;
        Category category;
        GoalStatus status;
        uint8 milestoneIndex; // Scholarship: 0 => nothing released, 1 => 20%, 2 => 60%, 3 => 100%
        uint8 flagsCount;
        bool lockedForReview;
    }

    IERC20Like public immutable stableToken;
    address public owner;
    address public treasury;
    address public releaseApprover;
    address public backendFulfillmentSigner;

    uint256 public immutable billListingFee;
    uint256 public immutable scholarshipListingFee;
    uint256 public constant SUCCESS_FEE_BPS = 300; // 3%
    uint256 public constant BPS_DENOMINATOR = 10000;

    uint256 public nextGoalId = 1;

    mapping(uint256 => Goal) public goals;
    mapping(uint256 => mapping(address => uint256)) public donationsByDonor;
    mapping(uint256 => mapping(address => bool)) public hasFlagged;

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
    error AlreadyFinalized();
    error NotDonor();
    error AlreadyFlagged();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyReleaseApprover() {
        if (msg.sender != owner && msg.sender != releaseApprover) revert NotReleaseApprover();
        _;
    }

    constructor(
        address stableToken_,
        address treasury_,
        address releaseApprover_,
        address backendFulfillmentSigner_,
        uint256 billListingFee_,
        uint256 scholarshipListingFee_
    ) {
        stableToken = IERC20Like(stableToken_);
        owner = msg.sender;
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
    ) external {
        if (targetAmount == 0) revert InvalidAmount();

        uint256 listingFee = category == Category.Bill ? billListingFee : scholarshipListingFee;
        if (!stableToken.transferFrom(msg.sender, treasury, listingFee)) revert TransferFailed();

        uint256 goalId = nextGoalId++;
        goals[goalId] = Goal({
            id: goalId,
            creator: msg.sender,
            targetAmount: targetAmount,
            raisedAmount: 0,
            withdrawnAmount: 0,
            description: description,
            category: category,
            status: GoalStatus.Open,
            milestoneIndex: 0,
            flagsCount: 0,
            lockedForReview: false
        });

        emit GoalCreated(goalId, msg.sender, address(0), category, targetAmount, description);
    }

    function fundGoal(uint256 goalId, uint256 amount) external {
        Goal storage goal = goals[goalId];
        if (goal.id == 0) revert GoalNotFound();
        if (goal.status != GoalStatus.Open) revert GoalNotOpen();
        if (amount == 0) revert InvalidAmount();

        if (!stableToken.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();

        goal.raisedAmount += amount;
        donationsByDonor[goalId][msg.sender] += amount;

        if (goal.raisedAmount >= goal.targetAmount) {
            goal.status = GoalStatus.Funded;
        }

        emit Funded(goalId, msg.sender, amount, goal.raisedAmount);
    }

    function claimFunds(uint256 goalId) external {
        Goal storage goal = goals[goalId];
        if (goal.id == 0) revert GoalNotFound();
        if (goal.creator != msg.sender) revert NotCreator();
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
            emit Completed(goalId, msg.sender, payoutAmount, 1);
            return;
        }

        // Scholarship: first claim = 20%
        if (goal.milestoneIndex != 0) revert AlreadyFinalized();
        uint256 firstTranche = (goal.raisedAmount * 20) / 100;
        goal.withdrawnAmount += firstTranche;
        goal.milestoneIndex = 1;
        if (!stableToken.transfer(goal.creator, firstTranche)) revert TransferFailed();
        emit Completed(goalId, msg.sender, firstTranche, 1);
    }

    function approveRelease(uint256 goalId) external onlyReleaseApprover {
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
        } else {
            amountToRelease = goal.raisedAmount - goal.withdrawnAmount; // remaining 40%
            goal.milestoneIndex = 3;
            goal.status = GoalStatus.Fulfilled;
        }

        goal.withdrawnAmount += amountToRelease;
        if (!stableToken.transfer(goal.creator, amountToRelease)) revert TransferFailed();
        emit Completed(goalId, msg.sender, amountToRelease, goal.milestoneIndex);
    }

    function flagGoal(uint256 goalId) external {
        Goal storage goal = goals[goalId];
        if (goal.id == 0) revert GoalNotFound();
        if (donationsByDonor[goalId][msg.sender] == 0) revert NotDonor();
        if (hasFlagged[goalId][msg.sender]) revert AlreadyFlagged();

        hasFlagged[goalId][msg.sender] = true;
        goal.flagsCount += 1;
        if (goal.flagsCount > 3) {
            goal.lockedForReview = true;
        }
        emit GoalFlagged(goalId, msg.sender, goal.flagsCount, goal.lockedForReview);
    }

    function markBillFulfilled(uint256 goalId) external {
        if (msg.sender != backendFulfillmentSigner && msg.sender != owner) revert NotOwner();
        Goal storage goal = goals[goalId];
        if (goal.id == 0) revert GoalNotFound();
        if (goal.category != Category.Bill) revert BillOnly();
        goal.status = GoalStatus.Fulfilled;
        emit GoalFulfilled(goalId);
    }

    function setReleaseApprover(address newApprover) external onlyOwner {
        releaseApprover = newApprover;
    }

    function setBackendFulfillmentSigner(address newSigner) external onlyOwner {
        backendFulfillmentSigner = newSigner;
    }
}

