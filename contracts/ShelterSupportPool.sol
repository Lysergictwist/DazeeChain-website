// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title ShelterSupportPool
 * @dev Manages the collection and distribution of DZ tokens to verified shelters
 */
contract ShelterSupportPool is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // DazeeCoin token contract
    IERC20 public dazeeToken;

    // Transaction fee percentage (200 = 2%)
    uint256 public constant TRANSACTION_FEE = 200;
    uint256 public constant FEE_DENOMINATOR = 10000;

    // Minimum activity threshold for rewards (adoptions per month)
    uint256 public constant MIN_MONTHLY_ADOPTIONS = 1;

    // Weight factors for reward calculation
    uint256 public constant ADOPTION_WEIGHT = 50;    // 50% weight for adoptions
    uint256 public constant DURATION_WEIGHT = 30;    // 30% weight for duration
    uint256 public constant ENGAGEMENT_WEIGHT = 20;  // 20% weight for engagement

    // Shelter performance tracking
    struct ShelterMetrics {
        uint256 monthlyAdoptions;
        uint256 totalAdoptions;
        uint256 joinedTimestamp;
        uint256 lastActivityTimestamp;
        uint256 engagementScore;      // 0-100 score based on social media/website activity
        bool isActive;
        uint256 lastRewardTimestamp;
    }

    // Mapping of shelter address to their metrics
    mapping(address => ShelterMetrics) public shelterMetrics;
    
    // Array to track all active shelters
    address[] public activeShelters;

    // Events
    event FundsCollected(uint256 amount);
    event RewardsDistributed(uint256 totalAmount, uint256 shelterCount);
    event ShelterRewarded(address shelter, uint256 amount, uint256 score);
    event AdoptionRecorded(address shelter, uint256 newTotal);
    event EngagementUpdated(address shelter, uint256 newScore);

    constructor(address _dazeeToken) {
        dazeeToken = IERC20(_dazeeToken);
    }

    /**
     * @dev Called when a DZ transaction occurs to collect the fee
     */
    function collectTransactionFee(uint256 transactionAmount) external {
        uint256 fee = transactionAmount.mul(TRANSACTION_FEE).div(FEE_DENOMINATOR);
        require(dazeeToken.transferFrom(msg.sender, address(this), fee), "Fee transfer failed");
        emit FundsCollected(fee);
    }

    /**
     * @dev Records a successful adoption for a shelter
     */
    function recordAdoption(address shelter) external onlyOwner {
        require(shelterMetrics[shelter].isActive, "Shelter not active");
        
        shelterMetrics[shelter].monthlyAdoptions = shelterMetrics[shelter].monthlyAdoptions.add(1);
        shelterMetrics[shelter].totalAdoptions = shelterMetrics[shelter].totalAdoptions.add(1);
        shelterMetrics[shelter].lastActivityTimestamp = block.timestamp;
        
        emit AdoptionRecorded(shelter, shelterMetrics[shelter].totalAdoptions);
    }

    /**
     * @dev Updates a shelter's engagement score based on their social media/website activity
     */
    function updateEngagementScore(address shelter, uint256 newScore) external onlyOwner {
        require(newScore <= 100, "Score must be 0-100");
        shelterMetrics[shelter].engagementScore = newScore;
        shelterMetrics[shelter].lastActivityTimestamp = block.timestamp;
        emit EngagementUpdated(shelter, newScore);
    }

    /**
     * @dev Activates a new shelter in the support pool
     */
    function activateShelter(address shelter) external onlyOwner {
        require(!shelterMetrics[shelter].isActive, "Shelter already active");
        
        shelterMetrics[shelter] = ShelterMetrics({
            monthlyAdoptions: 0,
            totalAdoptions: 0,
            joinedTimestamp: block.timestamp,
            lastActivityTimestamp: block.timestamp,
            engagementScore: 0,
            isActive: true,
            lastRewardTimestamp: block.timestamp
        });
        
        activeShelters.push(shelter);
    }

    /**
     * @dev Deactivates a shelter due to inactivity
     */
    function deactivateShelter(address shelter) external onlyOwner {
        require(shelterMetrics[shelter].isActive, "Shelter not active");
        shelterMetrics[shelter].isActive = false;
        
        // Remove from active shelters array
        for (uint i = 0; i < activeShelters.length; i++) {
            if (activeShelters[i] == shelter) {
                activeShelters[i] = activeShelters[activeShelters.length - 1];
                activeShelters.pop();
                break;
            }
        }
    }

    /**
     * @dev Calculates a shelter's score based on their performance metrics
     */
    function calculateShelterScore(address shelter) public view returns (uint256) {
        ShelterMetrics memory metrics = shelterMetrics[shelter];
        if (!metrics.isActive || metrics.monthlyAdoptions < MIN_MONTHLY_ADOPTIONS) {
            return 0;
        }

        // Calculate adoption score (0-100)
        uint256 adoptionScore = metrics.monthlyAdoptions.mul(100).div(20); // Cap at 20 adoptions
        if (adoptionScore > 100) adoptionScore = 100;

        // Calculate duration score (0-100)
        uint256 monthsActive = (block.timestamp - metrics.joinedTimestamp) / 30 days;
        uint256 durationScore = monthsActive.mul(100).div(12); // Max score after 1 year
        if (durationScore > 100) durationScore = 100;

        // Combine scores using weights
        return adoptionScore.mul(ADOPTION_WEIGHT)
            .add(durationScore.mul(DURATION_WEIGHT))
            .add(metrics.engagementScore.mul(ENGAGEMENT_WEIGHT))
            .div(100);
    }

    /**
     * @dev Distributes monthly rewards to active shelters
     */
    function distributeMonthlyRewards() external onlyOwner nonReentrant {
        uint256 totalPool = dazeeToken.balanceOf(address(this));
        require(totalPool > 0, "No rewards to distribute");

        uint256 totalScore = 0;
        uint256[] memory scores = new uint256[](activeShelters.length);

        // Calculate total score
        for (uint i = 0; i < activeShelters.length; i++) {
            scores[i] = calculateShelterScore(activeShelters[i]);
            totalScore = totalScore.add(scores[i]);
        }

        require(totalScore > 0, "No eligible shelters");

        // Distribute rewards
        for (uint i = 0; i < activeShelters.length; i++) {
            if (scores[i] > 0) {
                uint256 reward = totalPool.mul(scores[i]).div(totalScore);
                require(dazeeToken.transfer(activeShelters[i], reward), "Reward transfer failed");
                
                // Reset monthly metrics
                shelterMetrics[activeShelters[i]].monthlyAdoptions = 0;
                shelterMetrics[activeShelters[i]].lastRewardTimestamp = block.timestamp;
                
                emit ShelterRewarded(activeShelters[i], reward, scores[i]);
            }
        }

        emit RewardsDistributed(totalPool, activeShelters.length);
    }

    /**
     * @dev Returns the number of active shelters
     */
    function getActiveShelterCount() external view returns (uint256) {
        return activeShelters.length;
    }

    /**
     * @dev Returns a shelter's current metrics
     */
    function getShelterMetrics(address shelter) external view returns (
        uint256 monthlyAdoptions,
        uint256 totalAdoptions,
        uint256 joinedTimestamp,
        uint256 lastActivityTimestamp,
        uint256 engagementScore,
        bool isActive,
        uint256 lastRewardTimestamp
    ) {
        ShelterMetrics memory metrics = shelterMetrics[shelter];
        return (
            metrics.monthlyAdoptions,
            metrics.totalAdoptions,
            metrics.joinedTimestamp,
            metrics.lastActivityTimestamp,
            metrics.engagementScore,
            metrics.isActive,
            metrics.lastRewardTimestamp
        );
    }
}
