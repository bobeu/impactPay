// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Restrictions } from "./Restrictions.sol";

interface IVerification {
    enum Level { LEVEL1, LEVEL2, LEVEL3 }
    event VerificationUpdated(bool newStatus);
    event VerificationStatus(address indexed target, bool newStatus);

    struct User {
        bool isVerified;
        uint score;
        uint lastVerifiedDate;
    }

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
        uint256 dataCreated;
        bytes description;
        bytes extraLink;
        GoalStatus status;
        GoalType goalType;
        uint8 flagsCount;
        bool lockedForReview;
    }

    struct Uint256s {
        uint reputation;
        uint onchainVerifiedCounter;
        uint256 billListingFee;
        uint256 scholarshipListingFee;
        uint256 defaultListingFee;
        uint256 scholarshipFeeBP;
        uint256 billSuccessFeeBP;
        uint256 goalCounter;
        uint256 maxGoal;
        uint verified;
        uint totalUsersScores;
        uint level3Indexer;
    }

    struct Arrays {
        uint[] goalIds;
        address[] billServices;
        User[] verifications;
    }

    struct Addresses {
        address treasury;
        address releaseApprover;
        address backendFulfillmentSigner;
    }

    /// @notice Composite struct for goal id and state variables information retrieval
    struct GetGoalIdAndState {
        Uint256s uints;
        Arrays arrays;
        Addresses addresses;
        Level qualifiedLevel;
        bool restricted;
        bool useVerifier;
    }

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
        bool hasFlagged;
    }

    struct FunderFlag {
        uint index;
        bool isFunder;
    }

    /// @notice Internal storage representation of a Goal
    struct Goal {
        CommonData cData;
        BillGoal bill;
        ScholarshipGoal scholarship;
        Funder[] funders;
        mapping(address => FunderFlag) funderFlag;
    }

    struct GetVerified {
        uint index;
        address[] verified;
    }

    /// @notice Emitted when a new goal is created
    event GoalCreated(
        uint256 indexed goalId,
        address indexed creator,
        GoalType goalType,
        uint256 targetAmount,
        bytes description,
        bytes serviceType,
        address billService,
        bytes extraInfo
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
    event ReputationUpdated(address indexed user, uint16 change, string reason);
    
    /// @notice Emitted whenever a goal is canceled
    event Canceled(uint256 indexed goalId, address indexed caller, uint256 amountInGoal);

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

    function onVerificationSuccess(address user, Level lvl) external returns(bool);
    function getTotalScores() external returns(uint256);
    function getUserVerificationStatus(
        address user
    ) 
        external 
        view 
        returns(
            User[] memory lvls, 
            bool isBlacklisted
        );
}

/// @title Level3Verification for the ImpactPay protocol
/// @notice A decentralized philantropic platform for managing bill payments, scholarships, and social impact goals.
/// @dev Implements Pausable, Ownable, and ReentrancyGuard for security. Uses SafeERC20 for token transfers.

/** 
    ERROR CODE:

    13 - Not verified
    14 - Not permitted
*/

abstract contract Verification is IVerification, Restrictions {
    uint internal verified;

    ///@notice Total scores of all verified users
    uint internal totalUsersScores;

    /// @notice This counter tracks the number of array of verified users. There can be a max of 255 verified users in one array
    /// of which a new array is created when the previous list is full;
    uint internal level3Indexer;

    /// @notice account with permission to fulfill certain operation such as updating the contract after verification 
    /// is successful
    address internal backendFulfillmentSigner;
  
    /// @notice Flag showing whether to use verifier or not;
    bool internal useVerifier;

    /// @notice Tracks verification status for different users'levels
    mapping(address => mapping(Level => User)) internal verification;

    /// @notice Mapping of index id to array of verified users
    mapping(uint => address[]) internal level3Verified;

    /// @notice Approved providers
    mapping(address => bool) internal providers;

    /// @notice mapping of user Last verified date
    // mapping(address => uint) public verifiedDate;

    modifier isVerified(Level lvl, address user) {
        if (user != owner()) {
            if (useVerifier){
                require(verification[user][lvl].isVerified, "13");
            }
        }
        _;
    }

    modifier onlyBackendManagerOrOwner {
        address sender = _msgSender();
        if (sender != owner()) {
            require(sender == backendFulfillmentSigner, "14");
        }
        _;
    }

    /// @notice Initializes the Verification contract
    constructor(address backendFulfillmentSigner_) {
        useVerifier = false;
        _setBackendFulfillmentSigner(backendFulfillmentSigner_);
    }

    function _getLevel(address target) internal view returns(User[] memory lvls) {
        lvls = new User[](3);
        for (uint8 i = 0; i < lvls.length; i++) {
            lvls[i] = verification[target][Level(i)];
        }
    }

    /// @notice Set the `useVerifier`
    function toggleUseVerifier() public onlyOwner returns(bool){
        bool status = useVerifier;
        useVerifier = !status;

        emit VerificationUpdated(useVerifier);
        return true;
    }

    function _getLevelScore(Level lvl) internal pure returns(uint16 score) {
        if (lvl == Level.LEVEL1) score = 100;
        else if (lvl == Level.LEVEL2) score = 200;
        else score = 300;
    }

    /// @notice Updates user verification status. Only callable by signer or owner.
    /// @param user Address of the user to verify
    /// @param lvl Target level
    function onVerificationSuccess(address user, Level lvl) external whenNotPaused onlyBackendManagerOrOwner returns(bool) {
        if (!verification[user][lvl].isVerified) {
            if (lvl == Level.LEVEL3) {
                uint index = level3Indexer;
                if (level3Verified[index].length == type(uint8).max) {
                    level3Indexer++;
                    index = level3Indexer;
                }
                level3Verified[index].push(user);

            }
            uint16 score = _getLevelScore(lvl);
            totalUsersScores += score;
            verification[user][lvl] = User(true, score, block.timestamp);
        }

        emit VerificationStatus(user, true);
        return true;
    }

    function getVerified(uint indexer) external view returns(address[] memory) {
        return level3Verified[indexer];
    }

    /// @notice We created this function as an alternative to subgraph. It could become expensive as the array grows. If so
    /// please use the `getVerified` function
    function getVerifiedDefault() external view returns(GetVerified[] memory _verified) {
        uint indexers = level3Indexer + 1;
        _verified = new GetVerified[](indexers);
        for (uint i = 0; i < indexers; i++){
            _verified[i] = GetVerified(i, level3Verified[i]);
        }

        return _verified;
    }

    /// @notice Sets a new backend fulfillment signer address - { internal function }
    /// @param newSigner The new address
    function _setBackendFulfillmentSigner(address newSigner) internal {
        backendFulfillmentSigner = newSigner;
    }

    /// @notice Sets a new backend fulfillment signer address
    /// @param newSigner The new address
    function setBackendFulfillmentSigner(address newSigner) external onlyOwner {
        _setBackendFulfillmentSigner(newSigner);
    }

    /// @notice Pauses contract activity
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice Unpauses contract activity
    function unpause() public onlyOwner {
        _unpause();
    }

}