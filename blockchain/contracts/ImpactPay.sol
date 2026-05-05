// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IVerification } from "./abstracts/Verification.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

/// @title ImpactPay Protocol
/// @notice A decentralized platform for philantropic activities. Daily login increases users' reputation, increase daily activities
/// @dev Implements ReentrancyGuard for security. Uses SafeERC20 for token transfers.
contract ImpactPay is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Thrown when a user attempting to interact is blacklisted by the verifier
    error UserBlacklisted();

    /// @notice Emitted when a user successfully claims their share of a fund
    /// @param sender The address of the user who claimed
    /// @param share The amount of tokens the user claimed
    /// @param fundId The ID of the fund that was claimed from
    event Claimed(address indexed sender, uint256 share, uint fundId);
   
    /// @notice Emitted when a user successfully claims their share of a fund
    /// @param to The address of the user who claimed
    /// @param withdrawable The balance left in the pool at fundId
    /// @param fundId The ID of the fund that was claimed from
    event PoolRebalanced(address indexed to, uint256 withdrawable, uint fundId);
    
    /// @notice Emitted when a new fund is created
    /// @param funder The address of the user who created the fund
    /// @param data The detailed struct of the fund
    /// @param fundId The newly assigned ID of the fund
    event Funded (address indexed funder, Funder data, uint256 fundId);
    
    /// @notice Emitted when a funder approves certain beneficiaries to withdraw
    /// @param fundId The ID of the fund
    /// @param beneficiaries An array of approved beneficiary addresses
    /// @param amounts An array of corresponding approved amounts
    event Approval(uint256 fundId, address[] beneficiaries, uint256[] amounts);
    
    /// @notice Emitted when the required verification level for a fund is changed
    /// @param oldLevel The previous verification level
    /// @param newLevel The newly required verification level
    /// @param caller The address of the user who initiated the change
    event LevelChanged(IVerification.Level oldLevel, IVerification.Level newLevel, address indexed caller);

    /// @notice Snapshot of the verification state at the time a fund is created
    /// @param time The block timestamp when the snapshot was taken
    /// @param totalScores The sum of all users' verification scores globally at this time
    struct Snapshot {
        uint time;
        uint totalScores;
    }

    /// @notice Represents a philanthropic fund created by a user
    /// @param remainingPool The amount of funds still available for claiming
    /// @param amount The original total amount of funds deposited
    /// @param dateCreated The block timestamp when the fund was created
    /// @param claimed The number of individual claims made against this fund
    /// @param id The address of the fund creator
    /// @param name The name of the fund creator
    /// @param handle The social handle of the fund creator
    /// @param message A custom message attached to the fund
    /// @param currency Indicates whether the fund uses NATIVE or STABLECOIN currency
    /// @param pattern The specific distribution pattern (e.g. PHILANTROPIST or REDISTRIBUTE)
    /// @param requiredLevel The minimum verification level users must hold to claim from this fund
    /// @param snapshot The global score snapshot taken when this fund was created
    struct Funder {
        uint remainingPool;
        uint amount;
        uint dateCreated;
        uint claimed;
        address id;
        bytes name;
        bytes handle;
        bytes message;
        Currency currency;
        Pattern pattern;
        IVerification.Level requiredLevel;
        Snapshot snapshot;
    }

    struct GetStateData {
        uint256 counter;
        uint maxClaimPeriod;
        uint cooldown;
        address treasury;
        IVerification verifier;
        IERC20 stableToken;
    }

    /// @notice Represents an individual user's claim against a specific fund
    /// @param amount The amount the user has successfully claimed
    /// @param dateClaimed The timestamp when the claim was processed
    /// @param isClaimed A boolean indicating if the user has already claimed to prevent double-claiming
    struct Claim {
        uint256 amount;
        uint256 dateClaimed;
        bool isClaimed;
    }

    /// @notice Currencies supported by the platform
    enum Currency { NATIVE, STABLECOIN }

    /// @notice Distribution patterns that define how funds are allocated
    enum Pattern { PHILANTROPIST, REDISTRIBUTE }

    /// @notice A globally incrementing counter representing the latest fund ID
    uint256 internal counter;

    /// @notice Maximum period or deadline after which users cannot claim funds from the date of funded
    uint internal maxClaimPeriod;

    /// @notice Period until when claim becomes active
    uint internal cooldown;

    /// @notice Address to receive fee or any forfeited funds
    address internal treasury;

    /// @notice The verification contract used to resolve user reputation and scores
    IVerification internal verifier;
    
    /// @notice The stable token used for all transactions (e.g., USDT/USDC)
    IERC20 internal stableToken;

    /// @notice Mapping of fund IDs to their respective Funder details
    mapping(uint256 => Funder) public funders;

    /// @notice Mapping of users to counters to claims.
    mapping(address => mapping(uint256 => Claim)) public claims;

    /// @notice Ensures that the caller is either the fund creator or the contract owner
    /// @param fundId The ID of the fund to validate permissions against
    modifier onlyFunderOrOwner(uint256 fundId) {
        if (_msgSender() != owner()) require(_msgSender() == funders[fundId].id, "Only Funder");
        _;
    }

    /// @notice Validates that a given fund ID exists within the current counter range
    /// @param fundId The ID of the fund to validate
    modifier validateId(uint256 fundId) {
        require(fundId > 0 && fundId <= counter, "Invalid fund Id");
        _;
    }
    
    /// @notice Initializes the contract with its core dependencies
    /// @param stableToken_ The address of the stablecoin used for STABLECOIN pattern funds
    /// @param initialOwner The address of the initial contract owner
    /// @param treasury_ The address of the initial treasury
    /// @param verifier_ The address of the verification contract for user scores
    constructor(
        address stableToken_, 
        address initialOwner,
        address treasury_,
        IVerification verifier_
    ) Ownable(initialOwner) {
        require(stableToken_ != address(0), "Stb Inv");
        require(treasury_ != address(0), "Tsy Inv");
        require(initialOwner != address(0), "InOw Inv");
        stableToken = IERC20(stableToken_);
        verifier = verifier_;
        treasury = treasury_;
        maxClaimPeriod = 90 days;
    }

    /// @notice Fallback function to allow the contract to receive native currency
    receive() external payable {
        funders[0].amount += msg.value;
        funders[0].id = msg.sender;
        emit Funded(msg.sender, funders[0], 0);
    }

    /// @notice Creates a new philanthropic fund for distribution. At this point, a snapshot of the total scores of all users is captured.
    /// @dev Users can fund with native currency (`msg.value > 0`) or stablecoin (`msg.value == 0`).
    /// @param amount Amount to fund or distribute
    /// @param name The name of the fund creator
    /// @param handle The social handle of the fund creator
    /// @param message A custom message attached to the fund
    /// @param pattern The specific distribution pattern (e.g. PHILANTROPIST or REDISTRIBUTE)
    /// @param requiredLevel The minimum verification level users must hold to claim from this fund
    /// @return A boolean indicating successful execution
    function distributeWealth(
        uint256 amount,
        string memory name,
        string memory handle,
        string memory message,
        Pattern pattern,
        IVerification.Level requiredLevel
    ) external payable returns(bool) {
        address sender = _msgSender();
        Currency currency = Currency.NATIVE;
        require(amount > 0, "Zero fund");
        if (msg.value < amount) {
            currency = Currency.STABLECOIN;
            stableToken.safeTransferFrom(sender, address(this), amount);
        }
        counter++;
        uint fundId = counter;
        funders[fundId] = Funder(
            amount,
            amount,
            block.timestamp,
            0,
            sender,
            bytes(name),
            bytes(handle),
            bytes(message),
            currency,
            pattern,
            requiredLevel,
            Snapshot(block.timestamp, verifier.getTotalScores())
        );

        emit Funded(sender, funders[fundId], fundId);
        return true;
    }

    /// @notice Allows the fund creator or the contract owner to change the minimum required level for a fund
    /// @param fundId The ID of the fund to update
    /// @param newLevel The newly required verification level
    /// @return A boolean indicating successful execution
    function changeRequiredLevel(
        uint256 fundId, 
        IVerification.Level newLevel
    ) 
        public 
        validateId(fundId) 
        onlyFunderOrOwner(fundId) returns(bool) 
    {
        emit LevelChanged(funders[fundId].requiredLevel, newLevel, _msgSender());
        funders[fundId].requiredLevel = newLevel;

        return true;
    }

    /// @notice Allows a verified user to claim their proportional share of a fund based on their score
    /// @dev The user's share is calculated dynamically based on their score at the time the fund was created relative to the global total score snapshot.
    /// @param fundId The ID of the fund the user is claiming from
    /// @return A boolean indicating successful execution
    function claimGigs(uint fundId) external validateId(fundId) nonReentrant returns(bool) {
        address sender = _msgSender();
        Funder storage fd = funders[fundId];
        Claim storage claim = claims[sender][fundId];
        if (cooldown > 0) require(block.timestamp > (fd.dateCreated + cooldown), "Cdw in force");
        if (maxClaimPeriod > 0) require(block.timestamp < (fd.dateCreated + maxClaimPeriod), "Claim expired");
        require(fd.remainingPool > 0, "Fund fully claimed");
        require(!claim.isClaimed, "User already claimed");
        claim.isClaimed = true;

        uint totalUserScores;
        if (address(verifier) != address(0)) {
            (IVerification.User[] memory lvls, bool isBlacklisted) = verifier.getUserVerificationStatus(sender);
            if (isBlacklisted) revert UserBlacklisted();
            for (uint8 i = 0; i < lvls.length; i++) {
                if (fd.requiredLevel == IVerification.Level(i)) {
                    require(lvls[i].isVerified, "Verification Invalid");
                }
                if (lvls[i].lastVerifiedDate <= fd.snapshot.time) {
                    totalUserScores += lvls[i].score;
                }
            }
        }

        require(totalUserScores > 0, "No score");
        require(fd.snapshot.totalScores > 0, "Zero total scores");
        uint256 share = (totalUserScores * fd.amount) / fd.snapshot.totalScores;
        if (share > fd.remainingPool) {
            share = fd.remainingPool;
        }
        claim.amount = share;
        claim.dateClaimed = block.timestamp;
        fd.remainingPool -= share;
        fd.claimed++;
        _sendValue(fd.currency, sender, share);

        emit Claimed(sender, share, fundId);
        return true;

    } 

    function rebalancePool(uint fundId) public validateId(fundId) nonReentrant returns(bool) {
        Funder storage fd = funders[fundId];
        uint withdrawable = fd.remainingPool;
        require(withdrawable > 0, "Pool exhausted");
        if (maxClaimPeriod > 0) {
            require(block.timestamp > (fd.dateCreated + maxClaimPeriod + cooldown), "Window active");
        } else {
            require(block.timestamp > (fd.dateCreated + 90 days), "Window active_");
        }
        fd.remainingPool = 0;

        address to = treasury == address(0)? owner() : treasury;
        _sendValue(fd.currency, to, fd.remainingPool);
        emit PoolRebalanced(to, withdrawable, fundId);
        
        return true;

    }

    function rebalanceDefaultPool() public nonReentrant returns(bool) {
        Funder storage fd = funders[0];
        uint withdrawable = fd.amount;
        require(withdrawable > 0, "Pool exhausted");
        fd.amount = 0;

        address to = treasury == address(0)? owner() : treasury;
        _sendValue(fd.currency, to, fd.remainingPool);
        emit PoolRebalanced(to, withdrawable, 0);
        
        return true;

    }

    function _sendValue(Currency currency, address to, uint256 amount) internal {
        if(currency == Currency.STABLECOIN) {
            stableToken.safeTransfer(to, amount);
        } else {
            require(address(this).balance >= amount, "Ins. bal");
            Address.sendValue(payable(to), amount);
        }
    }

    /// @notice Allows the contract owner to update the stable token address used for STABLECOIN distributions
    /// @param newStableToken The address of the new ERC20 token
    /// @return A boolean indicating successful execution
    function setStableToken(address newStableToken) public onlyOwner returns(bool) {
        require(newStableToken != address(0), "Invalid address");
        stableToken = IERC20(newStableToken);

        return true;
    }

    /// @notice Allows the contract owner to update the maxClaimPeriod
    /// @param newClaimPeriod The new period until when claim becomes inactive
    /// @return A boolean indicating successful execution
    function setMaxClaimPeriod(uint newClaimPeriod) public onlyOwner returns(bool) {
        maxClaimPeriod = newClaimPeriod;

        return true;
    }

    /// @notice Allows the contract owner to update the treasury address
    /// @param newTreasury The new treasury address
    /// @return A boolean indicating successful execution
    function setMaxClaimPeriod(address newTreasury) public onlyOwner returns(bool) {
        treasury = newTreasury;

        return true;
    }

    /// @notice Allows the contract owner to update the cooldown time
    /// @param newCooldown The new period until when claim becomes active
    /// @return A boolean indicating successful execution
    function setCooldown(uint newCooldown) public onlyOwner returns(bool) {
        cooldown = newCooldown;

        return true;
    }

    function getStateData() external view returns(GetStateData memory) {
        return GetStateData(
            counter,
            maxClaimPeriod,
            cooldown,
            treasury,
            verifier,
            stableToken
        );
    }
   
}