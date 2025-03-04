// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "./ShelterSupportPool.sol";

contract DazeeCoin is ERC20, ERC20Burnable, Pausable, AccessControl, ERC20Permit {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Staking rewards
    uint256 public constant STAKING_APY = 1000; // 10% APY
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakingStart;

    // Shelter verification and support
    ShelterSupportPool public shelterSupportPool;
    mapping(address => bool) public verifiedShelters;
    mapping(address => uint256) public shelterRating; // 0-100 score
    mapping(address => uint256) public lastAdoptionTimestamp;
    uint256 public constant ADOPTION_COOLDOWN = 1 days;

    event ShelterVerified(address shelter, uint256 rating);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount, uint256 reward);
    event AdoptionRecorded(address shelter, uint256 timestamp);
    event ShelterSupportPoolSet(address poolAddress);

    constructor() 
        ERC20("DazeeCoin", "DZ") 
        ERC20Permit("DazeeCoin") 
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
        // Mint initial supply
        _mint(msg.sender, 100000000 * 10 ** decimals()); // 100 million initial supply
    }

    function setShelterSupportPool(address poolAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(poolAddress != address(0), "Invalid pool address");
        shelterSupportPool = ShelterSupportPool(poolAddress);
        emit ShelterSupportPoolSet(poolAddress);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        // Collect transaction fee for shelter support pool
        if (from != address(0) && // not minting
            to != address(0) &&   // not burning
            address(shelterSupportPool) != address(0) && // pool is set
            from != address(shelterSupportPool) && // not from pool
            to != address(shelterSupportPool))     // not to pool
        {
            shelterSupportPool.collectTransactionFee(amount);
        }
        super._beforeTokenTransfer(from, to, amount);
    }

    // Shelter verification and management functions
    function verifyShelter(address shelter, uint256 rating) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(rating <= 100, "Rating must be between 0-100");
        require(address(shelterSupportPool) != address(0), "Support pool not set");
        
        verifiedShelters[shelter] = true;
        shelterRating[shelter] = rating;
        
        // Activate shelter in support pool
        shelterSupportPool.activateShelter(shelter);
        
        emit ShelterVerified(shelter, rating);
    }

    function recordAdoption(address shelter) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(verifiedShelters[shelter], "Shelter not verified");
        require(block.timestamp >= lastAdoptionTimestamp[shelter] + ADOPTION_COOLDOWN, 
                "Adoption cooldown period not met");
        
        lastAdoptionTimestamp[shelter] = block.timestamp;
        shelterSupportPool.recordAdoption(shelter);
        
        emit AdoptionRecorded(shelter, block.timestamp);
    }

    function updateShelterEngagement(address shelter, uint256 score) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(verifiedShelters[shelter], "Shelter not verified");
        require(score <= 100, "Score must be between 0-100");
        
        shelterSupportPool.updateEngagementScore(shelter, score);
    }

    function deactivateShelter(address shelter) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(verifiedShelters[shelter], "Shelter not verified");
        verifiedShelters[shelter] = false;
        shelterSupportPool.deactivateShelter(shelter);
    }

    function isShelterVerified(address shelter) external view returns (bool) {
        return verifiedShelters[shelter];
    }

    function getShelterRating(address shelter) external view returns (uint256) {
        return shelterRating[shelter];
    }

    // Staking functions
    function stake(uint256 amount) external {
        require(amount > 0, "Cannot stake 0 tokens");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        _transfer(msg.sender, address(this), amount);
        
        if (stakedBalance[msg.sender] > 0) {
            // Claim existing rewards before adding new stake
            claimRewards();
        }
        
        stakedBalance[msg.sender] += amount;
        stakingStart[msg.sender] = block.timestamp;
        
        emit TokensStaked(msg.sender, amount);
    }

    function calculateRewards(address staker) public view returns (uint256) {
        if (stakedBalance[staker] == 0) return 0;
        
        uint256 timeStaked = block.timestamp - stakingStart[staker];
        uint256 yearlyReward = (stakedBalance[staker] * STAKING_APY) / 10000;
        return (yearlyReward * timeStaked) / 365 days;
    }

    function claimRewards() public {
        uint256 rewards = calculateRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");
        
        stakingStart[msg.sender] = block.timestamp;
        _mint(msg.sender, rewards);
    }

    function unstake(uint256 amount) external {
        require(amount > 0, "Cannot unstake 0 tokens");
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");
        
        uint256 rewards = calculateRewards(msg.sender);
        stakedBalance[msg.sender] -= amount;
        
        if (stakedBalance[msg.sender] > 0) {
            stakingStart[msg.sender] = block.timestamp;
        }
        
        _transfer(address(this), msg.sender, amount);
        if (rewards > 0) {
            _mint(msg.sender, rewards);
        }
        
        emit TokensUnstaked(msg.sender, amount, rewards);
    }
}
