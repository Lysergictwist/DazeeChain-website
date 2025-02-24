// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./DazeeCoin.sol";

contract ShelterDonations is ReentrancyGuard, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    DazeeCoin public dazeeCoin;
    IERC20 public usdtToken;
    
    uint256 public constant PLATFORM_FEE = 250; // 2.5% fee
    address public feeCollector;
    
    struct Donation {
        address donor;
        address shelter;
        uint256 amount;
        bool isDazeeCoin;
        uint256 timestamp;
    }
    
    struct ShelterStats {
        uint256 totalDazeeCoinReceived;
        uint256 totalUSDTReceived;
        uint256 donationCount;
        uint256 uniqueDonors;
    }
    
    mapping(address => ShelterStats) public shelterStats;
    mapping(address => mapping(address => bool)) public shelterDonors;
    mapping(address => Donation[]) public shelterDonations;
    
    event DonationReceived(
        address indexed donor,
        address indexed shelter,
        uint256 amount,
        bool isDazeeCoin,
        uint256 timestamp
    );
    
    event DonationDistributed(
        address indexed shelter,
        uint256 amount,
        bool isDazeeCoin,
        uint256 fee
    );
    
    constructor(address _dazeeCoin, address _usdt, address _feeCollector) {
        require(_dazeeCoin != address(0), "Invalid DazeeCoin address");
        require(_usdt != address(0), "Invalid USDT address");
        require(_feeCollector != address(0), "Invalid fee collector address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        dazeeCoin = DazeeCoin(_dazeeCoin);
        usdtToken = IERC20(_usdt);
        feeCollector = _feeCollector;
    }
    
    function donateDazeeCoin(address shelter, uint256 amount) 
        external 
        nonReentrant 
    {
        require(dazeeCoin.isShelterVerified(shelter), "Shelter not verified");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer DazeeCoins from donor to contract
        require(dazeeCoin.transferFrom(msg.sender, address(this), amount), 
            "Transfer failed");
        
        // Calculate and transfer fee
        uint256 fee = (amount * PLATFORM_FEE) / 10000;
        uint256 shelterAmount = amount - fee;
        
        // Transfer tokens to shelter and fee collector
        require(dazeeCoin.transfer(shelter, shelterAmount), 
            "Shelter transfer failed");
        require(dazeeCoin.transfer(feeCollector, fee), 
            "Fee transfer failed");
        
        // Update statistics
        updateDonationStats(shelter, amount, true);
        
        // Record donation
        Donation memory donation = Donation({
            donor: msg.sender,
            shelter: shelter,
            amount: amount,
            isDazeeCoin: true,
            timestamp: block.timestamp
        });
        
        shelterDonations[shelter].push(donation);
        
        emit DonationReceived(
            msg.sender, 
            shelter, 
            amount, 
            true, 
            block.timestamp
        );
        
        emit DonationDistributed(
            shelter, 
            shelterAmount, 
            true, 
            fee
        );
    }
    
    function donateUSDT(address shelter, uint256 amount) 
        external 
        nonReentrant 
    {
        require(dazeeCoin.isShelterVerified(shelter), "Shelter not verified");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer USDT from donor to contract
        require(usdtToken.transferFrom(msg.sender, address(this), amount), 
            "Transfer failed");
        
        // Calculate and transfer fee
        uint256 fee = (amount * PLATFORM_FEE) / 10000;
        uint256 shelterAmount = amount - fee;
        
        // Transfer tokens to shelter and fee collector
        require(usdtToken.transfer(shelter, shelterAmount), 
            "Shelter transfer failed");
        require(usdtToken.transfer(feeCollector, fee), 
            "Fee transfer failed");
        
        // Update statistics
        updateDonationStats(shelter, amount, false);
        
        // Record donation
        Donation memory donation = Donation({
            donor: msg.sender,
            shelter: shelter,
            amount: amount,
            isDazeeCoin: false,
            timestamp: block.timestamp
        });
        
        shelterDonations[shelter].push(donation);
        
        emit DonationReceived(
            msg.sender, 
            shelter, 
            amount, 
            false, 
            block.timestamp
        );
        
        emit DonationDistributed(
            shelter, 
            shelterAmount, 
            false, 
            fee
        );
    }
    
    function updateDonationStats(
        address shelter, 
        uint256 amount, 
        bool isDazeeCoin
    ) internal {
        ShelterStats storage stats = shelterStats[shelter];
        
        if (isDazeeCoin) {
            stats.totalDazeeCoinReceived += amount;
        } else {
            stats.totalUSDTReceived += amount;
        }
        
        stats.donationCount++;
        
        if (!shelterDonors[shelter][msg.sender]) {
            shelterDonors[shelter][msg.sender] = true;
            stats.uniqueDonors++;
        }
    }
    
    function getShelterDonations(address shelter) 
        external 
        view 
        returns (Donation[] memory) 
    {
        return shelterDonations[shelter];
    }
    
    function getShelterStats(address shelter) 
        external 
        view 
        returns (ShelterStats memory) 
    {
        return shelterStats[shelter];
    }
    
    function setFeeCollector(address _newCollector) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(_newCollector != address(0), "Invalid address");
        feeCollector = _newCollector;
    }
    
    // Emergency withdrawal in case tokens get stuck
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(to != address(0), "Invalid address");
        IERC20(token).transfer(to, amount);
    }
}
