// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./DazeeGovernance.sol";

contract DazeeRewards is Ownable, ReentrancyGuard {
    IERC20 public dazeeToken;
    DazeeGovernance public governance;
    
    // Reward pool configuration
    uint256 public constant REFERRER_REWARD_PERCENT = 500;  // 5% of reward pool
    uint256 public constant SHELTER_REWARD_PERCENT = 2500;  // 25% of monthly allocation
    uint256 public constant ADOPTER_REWARD = 100 * 10**18; // 100 DZ fixed
    uint256 public constant MAX_REFERRALS = 5;             // Max referrals per address
    
    // Monthly reward pool
    uint256 public monthlyRewardPool;
    uint256 public lastPoolRefreshTime;
    
    // Shelter monthly allocation system
    struct ShelterAllocation {
        uint256 monthlyAmount;
        uint256 lastClaimTime;
        bool isApproved;
        uint256 adoptionCount;
        uint256 engagementScore;
    }
    
    // Referral tracking
    struct ReferralInfo {
        uint256 count;
        uint256 pendingRewards;
        mapping(address => bool) referredShelters;
    }
    
    // Mappings
    mapping(address => ShelterAllocation) public shelterAllocations;
    mapping(address => ReferralInfo) public referralInfo;
    mapping(address => mapping(bytes32 => bool)) public processedAdoptions;
    
    // Events
    event RewardPoolRefreshed(uint256 amount, uint256 timestamp);
    event ShelterApproved(address indexed shelter, uint256 monthlyAllocation);
    event ShelterAllocationClaimed(address indexed shelter, uint256 amount);
    event ReferrerRewarded(address indexed referrer, address indexed shelter, uint256 amount);
    event AdopterRewarded(address indexed adopter, bytes32 indexed adoptionId, uint256 amount);
    event ShelterEngagementUpdated(address indexed shelter, uint256 score);
    
    constructor(address _dazeeToken, address _governance) {
        dazeeToken = IERC20(_dazeeToken);
        governance = DazeeGovernance(_governance);
        lastPoolRefreshTime = block.timestamp;
    }
    
    function refreshRewardPool() public {
        require(block.timestamp >= lastPoolRefreshTime + 30 days, "Too early to refresh");
        monthlyRewardPool = dazeeToken.balanceOf(address(this)) / 12; // 1/12 of total balance
        lastPoolRefreshTime = block.timestamp;
        emit RewardPoolRefreshed(monthlyRewardPool, block.timestamp);
    }
    
    function approveShelter(address shelter, uint256 monthlyAmount) external onlyOwner {
        require(governance.shelterVerifications(shelter).isVerified, "Shelter not verified");
        require(!shelterAllocations[shelter].isApproved, "Shelter already approved");
        
        // For large allocations, require multi-sig approval
        if (monthlyAmount >= governance.LARGE_TRANSFER_THRESHOLD()) {
            bytes32 transferId = governance.requestLargeTransfer(shelter, monthlyAmount);
            require(governance.isTransferApproved(transferId), "Large transfer not approved");
        }
        
        shelterAllocations[shelter] = ShelterAllocation({
            monthlyAmount: monthlyAmount,
            lastClaimTime: block.timestamp,
            isApproved: true,
            adoptionCount: 0,
            engagementScore: 0
        });
        
        emit ShelterApproved(shelter, monthlyAmount);
    }
    
    function claimMonthlyAllocation() external nonReentrant {
        ShelterAllocation storage allocation = shelterAllocations[msg.sender];
        require(allocation.isApproved, "Shelter not approved");
        require(block.timestamp >= allocation.lastClaimTime + 30 days, "Too early to claim");
        
        // Calculate reward based on adoption count and engagement
        uint256 baseAmount = allocation.monthlyAmount;
        uint256 performanceBonus = (baseAmount * allocation.engagementScore) / 100;
        uint256 totalReward = baseAmount + performanceBonus;
        
        // Reset monthly metrics
        allocation.lastClaimTime = block.timestamp;
        allocation.adoptionCount = 0;
        
        require(dazeeToken.transfer(msg.sender, totalReward), "Transfer failed");
        emit ShelterAllocationClaimed(msg.sender, totalReward);
    }
    
    function processReferral(address referrer, address shelter) external onlyOwner {
        require(governance.shelterVerifications(shelter).isVerified, "Shelter not verified");
        ReferralInfo storage info = referralInfo[referrer];
        require(info.count < MAX_REFERRALS, "Max referrals reached");
        require(!info.referredShelters[shelter], "Already referred this shelter");
        
        info.referredShelters[shelter] = true;
        info.count++;
        
        // Calculate referrer reward (5% of current reward pool)
        uint256 reward = (monthlyRewardPool * REFERRER_REWARD_PERCENT) / 10000;
        info.pendingRewards += reward;
        
        require(dazeeToken.transfer(referrer, reward), "Reward transfer failed");
        emit ReferrerRewarded(referrer, shelter, reward);
    }
    
    function processAdoption(address adopter, bytes32 adoptionId) external nonReentrant {
        require(shelterAllocations[msg.sender].isApproved, "Only approved shelters");
        require(!processedAdoptions[adopter][adoptionId], "Adoption already processed");
        
        ShelterAllocation storage allocation = shelterAllocations[msg.sender];
        allocation.adoptionCount++;
        processedAdoptions[adopter][adoptionId] = true;
        
        require(dazeeToken.transfer(adopter, ADOPTER_REWARD), "Reward transfer failed");
        emit AdopterRewarded(adopter, adoptionId, ADOPTER_REWARD);
    }
    
    function updateShelterEngagement(address shelter, uint256 score) external onlyOwner {
        require(score <= 100, "Score must be 0-100");
        require(shelterAllocations[shelter].isApproved, "Shelter not approved");
        
        shelterAllocations[shelter].engagementScore = score;
        emit ShelterEngagementUpdated(shelter, score);
    }
    
    // View functions
    function getShelterMetrics(address shelter) external view returns (
        uint256 monthlyAmount,
        uint256 adoptionCount,
        uint256 engagementScore,
        uint256 lastClaim,
        bool isApproved
    ) {
        ShelterAllocation storage allocation = shelterAllocations[shelter];
        return (
            allocation.monthlyAmount,
            allocation.adoptionCount,
            allocation.engagementScore,
            allocation.lastClaimTime,
            allocation.isApproved
        );
    }
    
    function getReferralMetrics(address referrer) external view returns (
        uint256 count,
        uint256 pendingRewards
    ) {
        ReferralInfo storage info = referralInfo[referrer];
        return (info.count, info.pendingRewards);
    }
    
    // Emergency functions
    function recoverTokens() external onlyOwner {
        uint256 balance = dazeeToken.balanceOf(address(this));
        require(dazeeToken.transfer(owner(), balance), "Recovery failed");
    }
}
