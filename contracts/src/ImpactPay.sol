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
        uint256 refundedAmount;
        uint64 milestoneDeadline;
        string description;
        Category category;
        GoalStatus status;
        uint8 milestoneIndex;
        uint8 flagsCount;
        bool lockedForReview;
    }

    IERC20Like public immutable stableToken;
    address public owner;
    address public treasury;
    address public releaseApprover;
    address public backendFulfillmentSigner;
    bool public paused;

    uint256 public immutable billListingFee;
    uint256 public immutable scholarshipListingFee;
    uint256 public constant SUCCESS_FEE_BPS = 300; // 3%
    uint256 public constant BPS_DENOMINATOR = 10000;

    uint256 public nextGoalId = 1;

    mapping(uint256 => Goal) public goals;
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

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyReleaseApprover() {
        if (msg.sender != owner && msg.sender != releaseApprover) revert NotReleaseApprover();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert PausedError();
        _;
    }

    uint256 private _entered = 1;
    modifier nonReentrant() {
        require(_entered == 1, "REENTRANCY");
        _entered = 2;
        _;
        _entered = 1;
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
    ) external whenNotPaused {
        if (targetAmount == 0) revert InvalidAmount();
        if (category == Category.Scholarship && !level3Verified[msg.sender]) revert Level3Required();

        uint256 listingFee = category == Category.Bill ? billListingFee : scholarshipListingFee;
        if (!stableToken.transferFrom(msg.sender, treasury, listingFee)) revert TransferFailed();

        uint256 goalId = nextGoalId++;
        goals[goalId] = Goal({
            id: goalId,
            creator: msg.sender,
            targetAmount: targetAmount,
            raisedAmount: 0,
            withdrawnAmount: 0,
            refundedAmount: 0,
            milestoneDeadline: 0,
            description: description,
            category: category,
            status: GoalStatus.Open,
            milestoneIndex: 0,
            flagsCount: 0,
            lockedForReview: false
        });

        emit GoalCreated(goalId, msg.sender, address(0), category, targetAmount, description);
    }

    function fundGoal(uint256 goalId, uint256 amount) external whenNotPaused nonReentrant {
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

    function claimFunds(uint256 goalId) external whenNotPaused nonReentrant {
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
        emit Completed(goalId, msg.sender, firstTranche, 1);
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
        emit Completed(goalId, msg.sender, amountToRelease, goal.milestoneIndex);
        if (goal.milestoneIndex == 3) emit ReputationUpdated(goal.creator, 100, "goal_fulfilled");
    }

    function flagGoal(uint256 goalId) external whenNotPaused {
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
        emit ReputationUpdated(goal.creator, -500, "goal_flagged");
    }

    function markBillFulfilled(uint256 goalId) external whenNotPaused {
        if (msg.sender != backendFulfillmentSigner && msg.sender != owner) revert NotOwner();
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
        if (donationsByDonor[goalId][msg.sender] == 0) revert NotDonor();
        if (donorRefunded[goalId][msg.sender]) revert AlreadyRefunded();

        uint256 remainingPool = goal.raisedAmount - goal.withdrawnAmount - goal.refundedAmount;
        uint256 donorShare = (donationsByDonor[goalId][msg.sender] * remainingPool) / goal.raisedAmount;
        if (donorShare == 0) revert RefundNotAvailable();

        donorRefunded[goalId][msg.sender] = true;
        goal.refundedAmount += donorShare;
        if (!stableToken.transfer(msg.sender, donorShare)) revert TransferFailed();
        if (goal.refundedAmount >= (goal.raisedAmount * 80) / 100) {
            goal.status = GoalStatus.Cancelled;
        }
        emit Refunded(goalId, msg.sender, donorShare);
        emit ReputationUpdated(goal.creator, -200, "proof_unmet");
    }

    function onVerificationSuccess(address user) external {
        if (msg.sender != backendFulfillmentSigner && msg.sender != owner) revert NotOwner();
        level3Verified[user] = true;
    }

    function setReleaseApprover(address newApprover) external onlyOwner {
        releaseApprover = newApprover;
    }

    function setBackendFulfillmentSigner(address newSigner) external onlyOwner {
        backendFulfillmentSigner = newSigner;
    }

    function setPaused(bool state) external onlyOwner {
        paused = state;
        emit Paused(state);
    }
}

