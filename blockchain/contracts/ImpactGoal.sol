// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Goals } from "./abstracts/Goals.sol";

/// @title ImpactGoal Contract
/// @notice A decentralized platform for managing bill payments, scholarships, and social impact goals.
/// @dev Implements Goals and ReentrancyGuard for security. Uses SafeERC20 for token transfers.

/** 
    ERROR CODE:

    15 - Only Owner
    16 - Invalid service index
    17 - Not Open
    18 - funding received
    19 - Not allowed
    20 - Backward move not allowed
    21 - Goal is Open
    22 - Not Funded
    23 - Disputed
    24 - Only Scholarship
    25 - Invalid caller
    26 - Locked to be reviewed
    27 - milestone_completed
    28 - Not authorized
    29 - Cannot cancel
    30 - Only Creator
    31 - Cancel not allowed
    32 - Goal is active
    33 - Raised is above target
    34 - Goal Not Found
    35 - Fulfilled or Canceled
    36 - Not Donor
    37 - Refund Not Available
    38 - No Donation
    39 - Pool is empty
    40 - Balance Error
*/
contract ImpactGoal is Goals, ReentrancyGuard {
    using SafeERC20 for IERC20;

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
    ) 
        Goals(stableToken_, treasury_, releaseApprover_, backendFulfillmentSigner_) 
    {
        useBillService = false;
        useVerifier = false;
    }

    receive() external payable {}

    function _beforeCall() internal view override {
        require(_msgSender() == owner(), "15");
    }

    /// @notice Creates a new goal for bill payment
    /// @param targetAmount Amount intended to be raised
    /// @param description Public description of the goal
    /// @param serviceType Type of service (e.g. "electricity")
    /// @param extraLink Additional metadata encoded as string
    /// @param billServiceIndex Index of the service provider in billServices array
    function createBillGoal(
        uint256 targetAmount,
        string calldata description,
        string calldata serviceType,
        string calldata extraLink,
        uint8 billServiceIndex
    ) external payable isVerified(Level.LEVEL1, _msgSender()) returns(bool) {
        address billService;
        if (billServices.length > 0) {
            require(billServiceIndex < billServices.length, "16");
            billService = billServices[billServiceIndex];
        }
        _createGoal(
            msg.value,
            targetAmount, 
            _encode(serviceType),
            _encode(description),
            billService == address(0)? _msgSender() : billService,
            GoalType.BILL,
            _encode(extraLink)
        );

        return true;
    }

    /// @notice Creates a new scholarship goal. Requires Level 3 levels.
    /// @param targetAmount Amount intended to be raised
    /// @param description Public description of the goal
    /// @param extraLink Additional metadata encoded as string
    function createScholarshipGoal(
        uint256 targetAmount,
        string calldata description,
        string calldata extraLink
    ) external payable isVerified(Level.LEVEL3, _msgSender()) returns(bool) {
        _createGoal(
            msg.value,
            targetAmount, 
            _encode(""),
            _encode(description),
            address(0),
            GoalType.SCHOLARSHIP,
            _encode(extraLink)
        );

        return true;
    }

    /// @notice Creates a default social impact goal
    /// @param targetAmount Amount intended to be raised
    /// @param description Public description of the goal
    /// @param extraLink Additional metadata encoded as string
    function createGoal(
        uint256 targetAmount,
        string calldata description,
        string calldata extraLink
    ) external payable isVerified(Level.LEVEL2, _msgSender()) returns(bool) {
        _createGoal(
            msg.value,
            targetAmount, 
            _encode(""),
            _encode(description),
            address(0),
            GoalType.DEFAULT,
            _encode(extraLink)
        );

        return true;
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
        Goal storage goal = _verifyGoalId(goalId, GoalStatus.OPEN, "17");
        if (amount == 0) revert InvalidAmount();
        
        CommonData storage _c = goal.cData;
        _c.raisedAmount += amount;
        uint index = goal.funders.length;
        goal.funders.push(Funder(amount, sender, _encode(extraInfo), uint64(block.timestamp), false));
        if(!goal.funderFlag[sender].isFunder) {
            goal.funderFlag[sender] = FunderFlag(index, true);
        }
        if (_c.raisedAmount >= _c.targetAmount) {
            _c.status = GoalStatus.RAISED;
        }

        _editReputation(true, amount, sender, true);        
        stableToken.safeTransferFrom(sender, address(this), amount);
        emit Funded(goalId, sender, amount, _c.raisedAmount, _c.goalType, extraInfo);
        emit ReputationUpdated(sender, 100, "18");

        return true;
    }

    /// @notice Manually fulfill a goal or update its status
    /// @param goalId ID of the goal
    /// @param status New status to set
    function fulfillGoal(uint256 goalId, GoalStatus status) public whenNotPaused notRestricted(_msgSender()) returns(bool) {
        address sender = _msgSender();
        Goal storage goal = _verifyGoalId(goalId, GoalStatus.OPEN, "17");
        address owner_ = owner();
        require(sender == owner_ || sender == goal.cData.creator, "19");
        if (sender != owner_){
            require(uint8(status) > uint8(goal.cData.status), "20");
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
        require(goal.cData.status != newStatus, "21");
        goal.cData.status = newStatus;

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
        Goal storage goal = _verifyGoalId(goalId, GoalStatus.RAISED, "22");
        ScholarshipGoal storage sc = goal.scholarship;
        CommonData storage cd = goal.cData;
        bool isRecipientEmpty = recipient == address(0);

        require(!sc.disputed, "23");
        require(cd.goalType == GoalType.SCHOLARSHIP, "24");
        if (!isRecipientEmpty){
            require(cd.creator == _msgSender(), "25");
        }
        require (!cd.lockedForReview, "26");
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
        emit ReputationUpdated(cd.creator, 100, "27");

        return true;
    }

    /// @notice Allows the creator or owner to claim funds for a non-scholarship goal
    /// @dev Can only be called if the goal is fully funded (status == RAISED). If it falls short, funds might be locked.
    /// @param goalId ID of the goal to claim from
    /// @return bool True if successful
    function claimFund(uint256 goalId) 
        external 
        notRestricted(_msgSender())
        isVerified(Level.LEVEL2, _msgSender()) 
        whenNotPaused 
        nonReentrant 
        returns(bool) 
    {
        Goal storage goal = goals[goalId];
        address creator = goal.cData.creator;
        require(msg.sender == creator || msg.sender == owner(), "28");
        
        bool useBillService_ = useBillService;
        CommonData memory cd = goal.cData;
        uint256 availableAmount = cd.raisedAmount - cd.withdrawnAmount;
        _relayFund(goalId, availableAmount, useBillService_);

        return true;
    }

    /// @notice Relays funds from a raised bill goal to the service provider
    /// @param goalId ID of the bill goal
    /// @param amount Amount to relay
    function relayBillFundsToService(uint256 goalId, uint256 amount) external onlyReleaseApprover whenNotPaused nonReentrant {
        _relayFund(goalId, amount, useBillService);
    }

    /// @notice Cancels a goal- A user can only cancel a goal with raised amount only if the goal is not fully funded within 60 days.
    /// This ensures that goals are not locked indefinitely because they're not fully funded. 
    /// @param goalId ID of the goal to cancel
    /// @return bool True if successfully canceled
    function cancelGoalOnlyCreator(uint256 goalId) external whenNotPaused nonReentrant returns(bool) {
        Goal storage _g = _verifyGoalId(goalId, GoalStatus.OPEN, "29");
        CommonData storage cd = _g.cData;
        address sender = _msgSender();
        require(cd.creator == sender, "30");
        
        uint256 withdrawable = cd.raisedAmount;
        if(cd.goalType == GoalType.SCHOLARSHIP) {
            require(cd.raisedAmount == 0, "31");
        } else {
            if (withdrawable > 0) {
                withdrawable = withdrawable / 2;
                require((block.timestamp - cd.dataCreated) > 60 days, "32");
                require(withdrawable < cd.targetAmount, "33");
                _editReputation(true, 0, cd.creator, false);
                cd.raisedAmount = 0;
                
                stableToken.safeTransfer(cd.creator, withdrawable);
                stableToken.safeTransfer(treasury, withdrawable);
            }
        }

        cd.status = GoalStatus.CANCELED;
        emit Canceled(goalId, sender, withdrawable);
        return true;
    }

    /// @notice Cancels a goal- Only owner can cancel a goal via this method, and only if the goal has been flagged at least 3 times. 
    /// @param goalId ID of the goal to cancel
    /// @return bool True if successfully canceled
    function cancelGoalOnlyOwner(uint256 goalId) external whenNotPaused onlyReleaseApprover nonReentrant returns(bool) {
        Goal storage _g = _verifyGoalId(goalId, GoalStatus.OPEN, "31");
        CommonData storage cd = _g.cData;
        ScholarshipGoal storage sc = _g.scholarship;
        require(cd.flagsCount >= 3, "30");
        cd.status = GoalStatus.CANCELED;
        
        uint256 fee;
        uint256 remainingPool = cd.raisedAmount - (cd.withdrawnAmount + sc.refundedAmount);
        for (uint i = 0; i < _g.funders.length; i++) {
            Funder memory fd = _g.funders[i];
            if (fd.amount > 0) {
                if (remainingPool > 0) {
                    uint256 donorShare = (fd.amount * remainingPool) / cd.raisedAmount;
                    if (donorShare > 0) {
                        _editReputation(false, 0, fd.id, true);
                        fee += (donorShare * 20) / 100; 
                        donorShare = (donorShare * 80) / 100;
                        _g.funders[i].amount = 0;
                        if (donorShare > 0) stableToken.safeTransfer(fd.id, donorShare);
                        emit Refunded(goalId, fd.id, donorShare, cd.creator, -200, "goal_canceled");
                    }
                }
            }
        }

        if (fee > 0) stableToken.safeTransfer(treasury, fee);
        emit Canceled(goalId, _msgSender(), remainingPool);

        return true;
    }

    /// @notice Allows a donor to flag a goal for review if suspicious
    /// @param goalId ID of the goal to flag
    function toggleFlagGoal(uint256 goalId) external whenNotPaused {
        Goal storage goal = goals[goalId];
        uint256 id = goal.cData.id;
        require (id > 0, "34");
        require(uint8(goal.cData.status) < uint8(GoalStatus.FULFILLED), "35");
        
        address sender = _msgSender();
        FunderFlag memory ff = goal.funderFlag[sender];
        require (ff.isFunder, "36");
        Funder memory fd = goal.funders[ff.index];
        bool status = false;
        if (!fd.hasFlagged) {
            status = true;
            goal.cData.flagsCount += 1;
            _editReputation(false, 0, goal.cData.creator, false);
        } else {
            
            goal.cData.flagsCount -= 1;
            _editReputation(true, 0, goal.cData.creator, false);
        }
        goal.funders[ff.index].hasFlagged = status;
        bool isScholarship = goal.cData.goalType == GoalType.SCHOLARSHIP;
        
        if (goal.cData.flagsCount >= 3) {
            if (isScholarship) {
                goal.scholarship.disputed = true;
            } else {
                goal.cData.lockedForReview = true;
            }
        }

        emit GoalFlagged(
            goalId, 
            sender, 
            goal.cData.flagsCount, 
            isScholarship? goal.scholarship.disputed : goal.cData.lockedForReview, 
            goal.cData.goalType,
            goal.cData.creator,
            5,
            !status? "goal_unflagged" : "goal_flagged"
        );
        emit ReputationUpdated(goal.cData.creator, 50, !status? "goal_unflagged" : "goal_flagged");
    }

    /// @notice Allows donors to claim a proportional refund if scholarship milestones are not met
    /// @param goalId ID of the scholarship goal
    function refundScholarship(uint256 goalId) external notRestricted(_msgSender()) whenNotPaused nonReentrant {
        Goal storage goal = goals[goalId];
        address sender = _msgSender();
        if (goal.cData.id == 0) revert GoalNotFound();
        ScholarshipGoal storage sc = goal.scholarship;
        require (sc.milestone != Milestone.COMPLETED, "27");
        require (sc.milestoneDeadline > 0 && block.timestamp > sc.milestoneDeadline, "37");
        uint donations;
        for (uint i = 0; i < goal.funders.length; i++) {
            Funder memory fd = goal.funders[i];
            if (fd.id == sender) {
                donations += fd.amount;
                goal.funders[i].amount = 0;
            }
        }
        
        require (donations > 0, "38");
        CommonData storage cd = goal.cData;
        uint256 remainingPool = cd.raisedAmount - (cd.withdrawnAmount + sc.refundedAmount);
        require(remainingPool > 0, "39");
        uint256 donorShare = (donations * remainingPool) / cd.raisedAmount;
        if (donorShare == 0) revert RefundNotAvailable();
        _editReputation(false, 0, sender, true);

        sc.refundedAmount += donorShare;
        require((sc.refundedAmount + cd.withdrawnAmount) <= cd.raisedAmount, "40");
        if ((sc.refundedAmount + cd.withdrawnAmount) == cd.raisedAmount) cd.status = GoalStatus.CANCELED;
        stableToken.safeTransfer(sender, donorShare);
        emit Refunded(goalId, sender, donorShare, goal.cData.creator, -200, "proof_unmet");
        emit ReputationUpdated(goal.cData.creator, 200, "refunded_proof_unmet");
    }
}