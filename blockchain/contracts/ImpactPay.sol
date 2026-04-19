// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ImpactPay Protocol
/// @notice A decentralized platform for managing bill payments, scholarships, and social impact goals.
/// @dev Implements Pausable, Ownable, and ReentrancyGuard for security. Uses SafeERC20 for token transfers.
contract ImpactPay is Pausable, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Types of goals available in the protocol
    enum GoalType {
        DEFAULT,
        BILL,
        SCHOLARSHIP
    }

    /// @notice Status of a goal through its lifecycle
    enum GoalStatus {
        OPEN,
        RAISED,
        FULFILLED,
        CANCELED
    }

    enum Level { LEVEL1, LEVEL2, LEVEL3 }

    /// @notice Milestones specifically for scholarship goals
    enum Milestone { NONE, TWENTY, ONE_FORTY, TWO_FORTY, COMPLETED }

    /// @notice Specific data for Bill-type goals
    struct BillGoal {
        bytes serviceType; // e.g., "electricity", "data", "subscription"
        address billService; // BitGifty or other bill service address
    }

    /// @notice Specific data for Scholarship-type goals
    struct ScholarshipGoal {
        uint256 refundedAmount;
        uint64 milestoneDeadline;
        Milestone milestone;
        bool disputed;
    }

    /// @notice Common data shared by all goal types
    struct CommonData {
        uint256 id;
        address creator;
        uint256 targetAmount;
        uint256 raisedAmount;
        uint256 withdrawnAmount;
        bytes description;
        GoalStatus status;
        GoalType goalType;
        uint8 flagsCount;
        bool lockedForReview;
    }

    /// @notice Composite struct for goal id and state variables information retrieval
    struct GetGoalIdAndState {
        uint[] goalIds;
        address treasury;
        address releaseApprover;
        address backendFulfillmentSigner;
        uint256 billListingFee;
        uint256 scholarshipListingFee;
        uint256 defaultListingFee;
        uint256 scholarshipFeeBP;
        uint256 billSuccessFeeBP;
        uint256 goalCounter;
        uint256 maxGoal;
        address[] billServices;
        Level level;
        bool restricted;
        uint reputation;
    }

    // struct Verification {
    //     bool lvl1;
    //     bool lvl2;
    //     bool lvl3;
    // }

    /// @notice Composite struct for goal information retrieval
    struct GetGoal {
        BillGoal bill;
        ScholarshipGoal scholarship;
        CommonData common;
        Funder[] funders;
    }

    /// @notice Details about a funder and their contribution
    struct Funder {
        uint256 amount;
        address id;
        bytes extraInfo;
        uint64 fundedAt;
    }

    /// @notice Internal storage representation of a Goal
    struct Goal {
        CommonData cData;
        BillGoal bill;
        ScholarshipGoal scholarship;
        Funder[] funders;
        mapping(address => bool) isFunder;
    }

    /// @notice The stable token used for all transactions (e.g., USDT/USDC)
    IERC20 public immutable stableToken;

    /// @notice Address where listing and success fees are sent
    address public treasury;

    /// @notice Address authorized to approve milestone releases and relay funds
    address public releaseApprover;

    /// @notice Address used to verify off-chain fulfillment or user levels
    address public backendFulfillmentSigner;

    /// @notice Fee in absolute token units to list a Bill goal
    uint256 public billListingFee;

    /// @notice Fee in absolute token units to list a Scholarship goal
    uint256 public scholarshipListingFee;
    
    /// @notice Fee in absolute token units to list a Default goal
    uint256 public defaultListingFee;

    /// @notice Fee in Basis Points for scholarship withdrawals
    uint256 public scholarshipFeeBP = 300;

    /// @notice Fee in Basis Points for bill fulfillment relays
    uint256 public billSuccessFeeBP = 300;

    /// @notice Denominator for Basis Points calculations
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Counter for generating unique goal IDs
    uint256 public goalCounter;

    /// @notice Maximum number of active goals allowed per user (0 for unlimited)
    uint256 public maxGoal;

    /// @notice List of registered bill service providers
    address[] public billServices;

    /// @notice Mapping from goal ID to Goal data
    mapping(uint256 => Goal) public goals;

    /// @notice Mapping from address to Goal IDs
    mapping(address => uint[]) public goalIDs;

    /// @notice Mapping from user address to their active goal count
    mapping(address => uint256) public activeGoals;

    /// @notice Mapping to check if an address has restricted access
    mapping(address => bool) public restrictions;

    /// @notice Tracks if a donor has already flagged a specific goal
    mapping(uint256 => mapping(address => bool)) public hasFlagged;

    /// @notice Tracks levels level of users
    mapping(address => Level) public levels;

    /// @notice Onchain reputation
    mapping(address => uint) public reputationScores;

    /// @notice Stores percentage release for each milestone
    mapping(Milestone => uint8) public milestonePercent;

    /// @notice Emitted when a new goal is created
    event GoalCreated(
        uint256 indexed goalId,
        address indexed creator,
        GoalType goalType,
        uint256 targetAmount,
        bytes description,
        string serviceType,
        address billService,
        string extraInfo
    );

    /// @notice Emitted when a goal receives funding
    event Funded(uint256 indexed goalId, address indexed donor, uint256 amount, uint256 totalRaised, GoalType goalType, string extraInfo);
    
    /// @notice Emitted when a bill goal is fulfilled by the service provider
    event BillGoalFulfilled(
        uint256 indexed goalId, 
        address indexed service, 
        address indexed creator,
        uint256 amount,
        bytes serviceType,
        uint256 reputation
    );

    /// @notice Emitted whenever a user's reputation score is updated
    event ReputationUpdated(address indexed user, int256 change, string reason);
    
    /// @notice Emitted when a scholarship milestone is withdrawn
    event ScholarshipWithdrawal(
        uint256 indexed goalId, 
        address indexed recipient, 
        address indexed creator, 
        uint256 amount, 
        uint256 reputation,
        uint8 milestoneIndex,
        uint8 goalType
    );

    /// @notice Emitted when a goal is flagged for review
    event GoalFlagged (
        uint256 indexed goalId, 
        address indexed donor, 
        uint8 flagsCount, 
        bool lockedForReview, 
        GoalType goalType,
        address indexed creator,
        int reputationSlash,
        string comment
    );

    /// @notice Emitted when a scholarship donor receives a refund
    event Refunded (
        uint256 indexed goalId, 
        address indexed donor, 
        uint256 amount,
        address indexed creator, 
        int reputationSlice,
        string comment
    );

    error NotReleaseApprover();
    error InvalidAmount();
    error GoalNotFound();
    error GoalLocked();
    error AlreadyFinalized();
    error DeadlineNotMet();
    error MaxGoalExceeded();
    error RefundNotAvailable();

    /// @notice Restricts access to owner or release approver
    modifier onlyReleaseApprover() {
        address sender = _msgSender();
        if (sender != owner() && sender != releaseApprover) revert NotReleaseApprover();
        _;
    }

    /// @notice Ensures the target address is not restricted
    /// @param target The address to check
    modifier notRestricted(address target) {
        require(!restrictions[target], "Restricted");
        _;
    }

    modifier isVerified(Level lvl, address user) {
        Level vf = levels[user];
        require(levels[user] == lvl, "Not verified");
        _;
    }   

    /// @notice Initializes the ImpactPay contract
    /// @param stableToken_ Address of the ERC20 token for payments
    /// @param treasury_ Address to receive protocol fees
    /// @param releaseApprover_ Address authorized for milestone approvals
    /// @param backendFulfillmentSigner_ Address for off-chain levels signatures
    constructor(
        address stableToken_,
        address treasury_,
        address releaseApprover_,
        address backendFulfillmentSigner_
    ) Ownable(_msgSender()) {
        stableToken = IERC20(stableToken_);
        treasury = treasury_;
        releaseApprover = releaseApprover_;
        backendFulfillmentSigner = backendFulfillmentSigner_;
        billListingFee = 1e16 wei;
        defaultListingFee = 1e15 wei;
        scholarshipListingFee = 1e17 wei;
        milestonePercent[Milestone.NONE] = 0;
        milestonePercent[Milestone.TWENTY] = 20;
        milestonePercent[Milestone.ONE_FORTY] = 40;
        milestonePercent[Milestone.TWO_FORTY] = 40;
        milestonePercent[Milestone.COMPLETED] = 0;
    }

    /// @dev Increments and returns the next goal ID
    function _createGoalId() internal returns(uint256 goalId) {
        goalCounter ++;
        goalId = goalCounter;
    }

    /// @notice Updates the default listing fee
    /// @param newListingFee The new fee amount
    function setDefaultListingFee(uint256 newListingFee) public onlyOwner returns(bool){
        defaultListingFee = newListingFee;
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

    /// @notice Adds a new registered bill service provider
    /// @param newBillService The address of the service provider
    function setBillService(address newBillService) public onlyOwner returns(bool){
        bool isIncluded = false;
        for (uint i = 0; i < billServices.length; i++) {
            if (billServices[i] == newBillService) isIncluded = true;
        }
        if(!isIncluded) billServices.push(newBillService);
        return true;
    }

    /// @dev Internal logic for goal creation
    function _createGoal(
        uint256 targetAmount, 
        bytes memory serviceType,
        bytes memory description,
        address billService,
        GoalType goalType,
        string memory extraInfo
    ) private whenNotPaused notRestricted(_msgSender()) returns(uint256 goalId) {
        address sender = _msgSender();
        if (targetAmount == 0) revert InvalidAmount();
        if (maxGoal > 0) {
            if (activeGoals[sender] >= maxGoal) revert MaxGoalExceeded();
        }
        activeGoals[sender]++;
        goalId = _createGoalId();
        goalIDs[sender].push(goalId);
        uint fee;
        if (goalType == GoalType.BILL) {
            fee = billListingFee;
            goals[goalId].bill = BillGoal(serviceType, billService);
        } else if(goalType == GoalType.SCHOLARSHIP) {
            fee = scholarshipListingFee;
            goals[goalId].scholarship = ScholarshipGoal(0, 0, Milestone.NONE, false);
        } else {
            fee = defaultListingFee;
        }

        goals[goalId].cData = CommonData(
            goalId,
            sender,
            targetAmount,
            0,
            0,
            description,
            GoalStatus.OPEN,
            goalType,
            0,
            false
        );

        if (fee > 0) stableToken.safeTransferFrom(sender, treasury, fee);
        emit GoalCreated(goalId, sender, goalType, targetAmount, description, string(serviceType), billService, extraInfo);
    }

    /// @notice Creates a new goal for bill payment
    /// @param targetAmount Amount intended to be raised
    /// @param description Public description of the goal
    /// @param serviceType Type of service (e.g. "electricity")
    /// @param extraInfo Additional metadata encoded as string
    /// @param billServiceIndex Index of the service provider in billServices array
    function createBillGoal(
        uint256 targetAmount,
        string calldata description,
        string calldata serviceType,
        string calldata extraInfo,
        uint8 billServiceIndex
    ) external isVerified(Level.LEVEL1, _msgSender()) returns(bool) {
        uint bsSize = billServices.length;
        address billService;
        if (bsSize > 0) {
            require(billServiceIndex < bsSize, "Invalid service index");
            billService = billServices[billServiceIndex];
        }
        _createGoal(
            targetAmount, 
            bytes(serviceType),
            bytes(description),
            billService == address(0)? _msgSender() : billService,
            GoalType.BILL,
            extraInfo
        );

        return true;
    }

    /// @notice Creates a new scholarship goal. Requires Level 3 levels.
    /// @param targetAmount Amount intended to be raised
    /// @param description Public description of the goal
    /// @param extraInfo Additional metadata encoded as string
    function createScholarshipGoal(
        uint256 targetAmount,
        string calldata description,
        string calldata extraInfo
    ) external isVerified(Level.LEVEL3, _msgSender()) returns(bool) {
        _createGoal(
            targetAmount, 
            hex"",
            bytes(description),
            address(0),
            GoalType.SCHOLARSHIP,
            extraInfo
        );

        return true;
    }

    /// @notice Creates a default social impact goal
    /// @param targetAmount Amount intended to be raised
    /// @param description Public description of the goal
    /// @param extraInfo Additional metadata encoded as string
    function createGoal(
        uint256 targetAmount,
        string calldata description,
        string calldata extraInfo
    ) external isVerified(Level.LEVEL2, _msgSender()) returns(bool) {
        _createGoal(
            targetAmount, 
            hex"",
            bytes(description),
            address(0),
            GoalType.DEFAULT,
            extraInfo
        );

        return true;
    }

    /// @dev Internal helper to verify goal existence and status
    function _verifyGoalId(uint256 goalId, GoalStatus status, string memory errorMessage) internal view returns(Goal storage goal) {
        goal = goals[goalId];
        uint256 id = goal.cData.id;
        if (id == 0 || id > goalCounter) revert GoalNotFound();
        require(goal.cData.status == status, errorMessage);
    }

    function _editReputation(bool add, uint256 amount, address target, bool isFunder) internal {
        uint256 mantissa = 10 ** IERC20Metadata(address(stableToken)).decimals();
        if (add) {
            reputationScores[target] += isFunder? amount > mantissa? (amount / mantissa) : 1 : 5;
        } else {
            uint rep = reputationScores[target];
            reputationScores[target] = isFunder? rep >= 50? rep - 50 : 0 : rep >= 5? rep - 5 : 0; 
        }
    }

    /// @notice Allows users to fund an open goal
    /// @param goalId ID of the goal to fund
    /// @param amount Amount of stable tokens to contribute
    /// @param extraInfo Optional metadata about the donation
    function fundGoal(
        uint256 goalId, 
        uint256 amount, 
        string memory extraInfo
    ) external whenNotPaused nonReentrant notRestricted(_msgSender()) returns(bool) {
        address sender = _msgSender();
        Goal storage goal = _verifyGoalId(goalId, GoalStatus.OPEN, "Not Open");
        if (amount == 0) revert InvalidAmount();
        
        CommonData storage _c = goal.cData;
        _c.raisedAmount += amount;
        goal.funders.push(Funder(amount, sender, abi.encode(bytes(extraInfo)), uint64(block.timestamp)));
        if(!goal.isFunder[sender]) goal.isFunder[sender] = true;
        if (_c.raisedAmount >= _c.targetAmount) {
            _c.status = GoalStatus.RAISED;
        }

        _editReputation(true, amount, sender, true);        
        stableToken.safeTransferFrom(sender, address(this), amount);
        emit Funded(goalId, sender, amount, _c.raisedAmount, _c.goalType, extraInfo);
        emit ReputationUpdated(sender, 100, "funding received");

        return true;
    }

    /// @notice Manually fulfill a goal or update its status
    /// @param goalId ID of the goal
    /// @param status New status to set
    function fulfillGoal(uint256 goalId, GoalStatus status) public whenNotPaused notRestricted(_msgSender()) returns(bool) {
        address sender = _msgSender();
        Goal storage goal = _verifyGoalId(goalId, GoalStatus.OPEN, "Not Open");
        address owner_ = owner();
        require(sender == owner_ || sender == goal.cData.creator, "Not allowed");
        if (sender != owner_){
            require(uint8(status) > uint8(goal.cData.status), "Backward move not allowed");
        }
        goal.cData.status = status;

        return true;
    }

    /// @notice Re-opens a goal that was previously closed or canceled
    /// @param goalId ID of the goal
    function reactivateGoal(uint256 goalId) public onlyOwner returns(bool) {
        Goal storage goal = goals[goalId];
        if (goal.cData.id == 0 || goal.cData.id > goalCounter) revert GoalNotFound();
        
        GoalStatus newStatus = GoalStatus.OPEN;
        require(goal.cData.status != newStatus, "Goal is open");
        goal.cData.status = newStatus;

        return true;
    }

    /// @notice Sets restriction status for an address
    /// @param target Address to restrict/unrestrict
    /// @param status True to restrict, false to unrestrict
    function setRestriction(address target, bool status) public onlyOwner returns(bool) {
        restrictions[target] = status;
        return true;
    }

    /// @notice Clears the lock status for several goals. Only callable by release approver or owner.
    /// @param goalIds Array of goal IDs to unlock
    function approveScholarshipRelease(uint256[] memory goalIds) external onlyReleaseApprover whenNotPaused notRestricted(_msgSender()) returns(bool) {
        for (uint256 i = 0; i < goalIds.length; i++) {
            uint256 goalId = goalIds[i];
            if(goalId > 0 && goalId <= goalCounter) {
                Goal storage goal = goals[goalId];
                goal.cData.lockedForReview = false;
            }
        }
        
        return true;
    }

    /// @notice Claims funds for a scholarship milestone
    /// @param goalId ID of the scholarship goal
    /// @param recipient Address to receive the funds (defaults to creator if zero)
    function claimScholarshipFunds(
        uint256 goalId, 
        address recipient
    ) 
        external 
        notRestricted(_msgSender())
        isVerified(Level.LEVEL3, _msgSender())
        whenNotPaused 
        nonReentrant 
        returns(bool) 
    {
        Goal storage goal = _verifyGoalId(goalId, GoalStatus.RAISED, "Not Funded");
        ScholarshipGoal storage sc = goal.scholarship;
        CommonData storage cd = goal.cData;
        bool isRecipientEmpty = recipient == address(0);

        require(!sc.disputed, "Disputed");
        require(cd.goalType == GoalType.SCHOLARSHIP, "Only Scholarship");
        if (!isRecipientEmpty){
            require(cd.creator == _msgSender(), "Invalid caller");
        }
        require (!cd.lockedForReview, "Locked for review");
        cd.lockedForReview = true;
        
        sc.milestone = Milestone(uint8(sc.milestone) + 1);
        uint256 payoutAmount;
        
        if (sc.milestone == Milestone.TWO_FORTY) {
            if (block.timestamp <= sc.milestoneDeadline) revert DeadlineNotMet();
            // Dust-free release: take everything remaining for this goal
            payoutAmount = cd.raisedAmount - cd.withdrawnAmount;
            cd.status = GoalStatus.FULFILLED;
            sc.milestone = Milestone.COMPLETED;
            activeGoals[cd.creator]--;
        } else {
            payoutAmount = (cd.raisedAmount * milestonePercent[sc.milestone]) / 100;
        }

        uint256 fee = (payoutAmount * scholarshipFeeBP) / BPS_DENOMINATOR;
        uint256 netPayout = payoutAmount - fee;
        cd.withdrawnAmount += payoutAmount;
        
        sc.milestoneDeadline = uint64(block.timestamp + 90 days);
        _editReputation(true, 0, _msgSender(), false);

        if (fee > 0) stableToken.safeTransfer(treasury, fee);
        if (netPayout > 0) stableToken.safeTransfer(isRecipientEmpty? cd.creator : recipient, netPayout);

        emit ScholarshipWithdrawal(
            goalId, 
            isRecipientEmpty? cd.creator : recipient,
            cd.creator, 
            netPayout, 
            100,
            uint8(sc.milestone),
            uint8(GoalType.SCHOLARSHIP)
        );
        emit ReputationUpdated(cd.creator, 100, "milestone_completed");

        return true;
    }

    /// @notice Relays funds from a raised bill goal to the service provider
    /// @param goalId ID of the bill goal
    /// @param amount Amount to relay
    function relayBillFundsToService(uint256 goalId, uint256 amount) external onlyReleaseApprover whenNotPaused nonReentrant {
        Goal storage _g = _verifyGoalId(goalId, GoalStatus.RAISED, "Not Funded");
        CommonData storage cd = _g.cData;
        if (cd.lockedForReview) revert GoalLocked();
        
        uint256 availableAmount = cd.raisedAmount - cd.withdrawnAmount;
        if (amount > availableAmount) revert InvalidAmount();

        uint256 fee = (amount * billSuccessFeeBP) / BPS_DENOMINATOR;
        uint256 relayAmount = amount - fee;
        
        cd.withdrawnAmount += amount;
        _editReputation(true, 0, cd.creator, false);
        require(cd.withdrawnAmount <= cd.raisedAmount, "Bal Anomally");
        if (cd.withdrawnAmount == cd.raisedAmount) {
            cd.status = GoalStatus.FULFILLED;
            activeGoals[cd.creator]--;
        }

        if (fee > 0) stableToken.safeTransfer(treasury, fee);
        if (relayAmount > 0) stableToken.safeTransfer(_g.bill.billService, relayAmount);
        emit BillGoalFulfilled(goalId, _g.bill.billService, cd.creator, relayAmount, _g.bill.serviceType, 100);
        emit ReputationUpdated(cd.creator, 100, "goal_completed");
    }

    /// @notice Allows a donor to flag a goal for review if suspicious
    /// @param goalId ID of the goal to flag
    function flagGoal(uint256 goalId) external whenNotPaused {
        Goal storage goal = goals[goalId];
        address sender = _msgSender();
        require (goal.cData.id > 0, "GoalNotFound");
        require (goal.isFunder[sender], "NotDonor");
        require (!hasFlagged[goalId][sender], "AlreadyFlagged");

        hasFlagged[goalId][sender] = true;
        _editReputation(false, 0, goal.cData.creator, false);
        uint rep = reputationScores[goal.cData.creator];
        reputationScores[goal.cData.creator] = rep >= 50? rep -= 50 : 0;
        
        goal.cData.flagsCount += 1;
        if (goal.cData.flagsCount >= 3) {
            if (goal.cData.goalType == GoalType.SCHOLARSHIP) {
                goal.scholarship.disputed = true;
            } else {
                goal.cData.lockedForReview = true;
            }
        }

        emit GoalFlagged(
            goalId, 
            sender, 
            goal.cData.flagsCount, 
            goal.cData.lockedForReview, 
            goal.cData.goalType,
            goal.cData.creator,
            -500,
            "goal_flagged"
        );
        emit ReputationUpdated(goal.cData.creator, -500, "goal_flagged");
    }

    /// @notice Allows donors to claim a proportional refund if scholarship milestones are not met
    /// @param goalId ID of the scholarship goal
    function refundScholarship(uint256 goalId) external notRestricted(_msgSender()) whenNotPaused nonReentrant {
        Goal storage goal = goals[goalId];
        address sender = _msgSender();
        if (goal.cData.id == 0) revert GoalNotFound();
        ScholarshipGoal storage sc = goal.scholarship;
        require (sc.milestone != Milestone.COMPLETED, "RefundNotAvailable");
        require (sc.milestoneDeadline > 0 && block.timestamp > sc.milestoneDeadline, "RefundNotAvailable");
        uint donations;
        for (uint i = 0; i < goal.funders.length; i++) {
            Funder memory fd = goal.funders[i];
            if (fd.id == sender) {
                donations += fd.amount;
                goal.funders[i].amount = 0;
            }
        }
        
        require (donations > 0, "NotDonor");
        CommonData storage cd = goal.cData;
        uint256 remainingPool = cd.raisedAmount - (cd.withdrawnAmount + sc.refundedAmount);
        require(remainingPool > 0, "Pool empty");
        uint256 donorShare = (donations * remainingPool) / cd.raisedAmount;
        if (donorShare == 0) revert RefundNotAvailable();
        _editReputation(false, 0, sender, true);

        sc.refundedAmount += donorShare;
        if (sc.refundedAmount >= (cd.raisedAmount * 80) / 100) {
            cd.status = GoalStatus.CANCELED;
        }
        stableToken.safeTransfer(sender, donorShare);
        emit Refunded(goalId, sender, donorShare, goal.cData.creator, -200, "proof_unmet");
        emit ReputationUpdated(goal.cData.creator, -200, "proof_unmet");
    }

    /// @notice Updates user levels status. Only callable by signer or owner.
    /// @param user Address of the user to verify
    function onVerificationSuccess(address user, Level lvl) external {
        address sender = _msgSender();
        require((backendFulfillmentSigner != address(0) && sender == backendFulfillmentSigner) || sender == owner());
        levels[user] = lvl;
    }

    /// @notice Sets a new release approver address
    /// @param newApprover The new address
    function setReleaseApprover(address newApprover) external onlyOwner {
        releaseApprover = newApprover;
    }

    /// @notice Sets a new backend fulfillment signer address
    /// @param newSigner The new address
    function setBackendFulfillmentSigner(address newSigner) external onlyOwner {
        backendFulfillmentSigner = newSigner;
    }

    /// @notice Sets the maximum goals per user
    /// @param max The maximum number
    function setMaxGoal(uint256 max) external onlyOwner {
        maxGoal = max;
    }

    /// @notice Pauses contract activity
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice Unpauses contract activity
    function unpause() public onlyOwner {
        _unpause();
    }

    /// @notice Retrieves comprehensive details about a goal
    /// @param goalId ID of the goal to pull
    /// @return data Goal
    function getGoal(uint256 goalId) external view returns (GetGoal memory data) {
        Goal storage goal = goals[goalId];
        data = GetGoal({
            bill: goal.bill,
            scholarship: goal.scholarship,
            common: goal.cData,
            funders: goal.funders
        });

        return data;
    }

    /// @notice Retrieves comprehensive details about a goal
    /// @param user Target user
    /// @return data Struct containing goal data and protocol settings
    function getGoalIdAndState(address user) external view returns (GetGoalIdAndState memory data) {    
        data = GetGoalIdAndState({
            goalIds: goalIDs[user],
            treasury: treasury,
            releaseApprover: releaseApprover,
            backendFulfillmentSigner: backendFulfillmentSigner,
            billListingFee: billListingFee,
            scholarshipListingFee: scholarshipListingFee,
            defaultListingFee: defaultListingFee,
            scholarshipFeeBP: scholarshipFeeBP,
            billSuccessFeeBP: billSuccessFeeBP,
            goalCounter:goalCounter,
            maxGoal: maxGoal,
            billServices: billServices,
            level: levels[user],
            restricted: restrictions[user],
            reputation: reputationScores[user]
        });

        return data;
    }
}