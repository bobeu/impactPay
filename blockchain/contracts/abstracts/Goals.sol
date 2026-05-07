// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ListingFee } from "./ListingFee.sol";
import { Reputation } from "./Reputation.sol";

/// @title Goals contract for the ImpactpPay Protocol
/// @notice A decentralized platform for managing bill payments, scholarships, and social impact goals.
/// @dev Implements ListingFee and Reputation. Uses SafeERC20 for token transfers.

/** 
    ERROR CODE:

    3 - New Approval is zero address
    4 - Insufficient fee
    5 - Transfer to Treasury failed
    6 - Not Funded
    7 - Scholarship Not allowed
    8 - Bal Anomally
    9 - Bill service undefined
    10 - goal_completed
*/
contract Goals is ListingFee, Reputation {
    using SafeERC20 for IERC20;

    /// @notice Address where listing and success fees are sent
    address internal treasury;

    /// @notice Address authorized to approve milestone releases and relay funds
    address internal releaseApprover;

    /// @notice Counter for generating unique goal IDs
    uint256 internal goalCounter;

    /// @notice Maximum number of active goals allowed per user (0 for unlimited)
    uint256 internal maxGoal;

    /// @notice Mapping from goal ID to Goal data
    mapping(uint256 => Goal) internal goals;

    /// @notice Mapping from address to Goal IDs
    mapping(address => uint[]) internal goalIDs;

    /// @notice Mapping from user address to their active goal count
    mapping(address => uint256) internal activeGoals;

    /// @notice Stores percentage release for each milestone
    mapping(Milestone => uint8) public milestonePercent;

    /// @notice Restricts access to owner or release approver
    modifier onlyReleaseApprover() {
        address sender = _msgSender();
        if (sender != owner() && sender != releaseApprover) revert NotReleaseApprover();
        _;
    }

    /// @notice Initializes the Goals contract
    /// @param stableToken_ Main stable Token to be used for payment
    /// @param treasury_ Acccount to receive proceeds
    /// @param releaseApprover_ Address authorized for milestone approvals
    /// @param backendFulfillmentSigner_ Address for off-chain levels signatures
    constructor(
        address stableToken_,
        address treasury_,
        address releaseApprover_,
        address backendFulfillmentSigner_
    ) 
        ListingFee(backendFulfillmentSigner_) 
        Reputation(stableToken_)
    {
        releaseApprover = releaseApprover_;
        treasury = treasury_;
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

    /// @notice Sets a new release approver address
    /// @param newApprover The new address
    function setReleaseApprover(address newApprover) external onlyOwner {
        require(newApprover != address(0), "3");
        releaseApprover = newApprover;
    }

    /// @notice Updates the default listing fee
    /// @param newTreasury The new treasury account
    function setTreasury(address newTreasury) public onlyOwner returns(bool){
        require(newTreasury != address(0), "2");
        treasury = newTreasury;
        return true;
    }

    /// @dev Internal logic for goal creation
    function _createGoal(
        uint256 msgValue,
        uint256 targetAmount, 
        bytes memory serviceType,
        bytes memory description,
        address billService,
        GoalType goalType,
        bytes memory extraLink
    ) internal whenNotPaused notRestricted(_msgSender()) returns(uint256 goalId) {
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
            block.timestamp,
            description,
            extraLink,
            GoalStatus.OPEN,
            goalType,
            0,
            false
        );

        if (fee > 0) {
            if (stableToken.allowance(sender, address(this)) < fee) {
                fee = fee * 3;
                require(msgValue >= fee, "4");
                (bool sent,) = treasury.call{value: msgValue}('');
                require(sent, "5");
            } else {
                stableToken.safeTransferFrom(sender, treasury, fee);
            }
        }
        emit GoalCreated(goalId, sender, goalType, targetAmount, description, serviceType, billService, extraLink);
    }

    function _encode(string memory data) internal pure returns(bytes memory encoded) {
        encoded = bytes(data);
    }

    /// @dev Internal helper to verify goal existence and status
    function _verifyGoalId(uint256 goalId, GoalStatus status, string memory errorMessage) internal view returns(Goal storage goal) {
        goal = goals[goalId];
        uint256 id = goal.cData.id;
        if (id == 0 || id > goalCounter) revert GoalNotFound();
        require(goal.cData.status == status, errorMessage);
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

    function _relayFund(uint256 goalId, uint256 amount, bool useBillService_) internal {
        Goal storage _g = _verifyGoalId(goalId, GoalStatus.RAISED, "6");
        CommonData storage cd = _g.cData;
        if (cd.lockedForReview) revert GoalLocked();
        require(cd.goalType == GoalType.BILL || cd.goalType == GoalType.DEFAULT, "7");
        
        uint256 availableAmount = cd.raisedAmount - cd.withdrawnAmount;
        if (amount > availableAmount) revert InvalidAmount();

        uint256 fee = (amount * billSuccessFeeBP) / BPS_DENOMINATOR;
        uint256 relayAmount = amount - fee;
        
        cd.withdrawnAmount += amount;
        _editReputation(true, 0, cd.creator, false);
        require(cd.withdrawnAmount <= cd.raisedAmount, "8");
        if (cd.withdrawnAmount == cd.raisedAmount) {
            cd.status = GoalStatus.FULFILLED;
            activeGoals[cd.creator]--;
        }

        address to = useBillService_? _g.bill.billService : cd.creator;
        require(to != address(0), "9");
        if (fee > 0) stableToken.safeTransfer(treasury, fee);
        if (relayAmount > 0) stableToken.safeTransfer(to, relayAmount);
        emit BillGoalFulfilled(goalId, to, cd.creator, relayAmount, _g.bill.serviceType, 100);
        emit ReputationUpdated(cd.creator, 100, "10");
    } 

    /// @notice Sets the maximum goals per user
    /// @param max The maximum number
    function setMaxGoal(uint256 max) external onlyOwner returns(bool) {
        maxGoal = max;
        return true;
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
            uints: Uint256s(
                getReputation(user),
                onchainVerifiedCounter,
                billListingFee,
                scholarshipListingFee,
                defaultListingFee,
                scholarshipFeeBP,
                billSuccessFeeBP,
                goalCounter,
                maxGoal,
                verified,
                totalUsersScores,
                level3Indexer
            ),
            arrays: Arrays(goalIDs[user], billServices, _getLevel(user)),
            addresses: Addresses(address(stableToken), treasury, releaseApprover, backendFulfillmentSigner),
            restricted: getRestriction(user),
            qualifiedLevel: qualifiedLevel,
            useVerifier: useVerifier
        });

        return data;
    }
}