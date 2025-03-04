// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AdoptionRewards
 * @dev Smart contract to handle DazeeCoin rewards for pet adoptions
 */
contract AdoptionRewards is Ownable, ReentrancyGuard {
    // DazeeCoin token contract
    IERC20 public dazeeCoin;
    
    // Standard reward amount (in DazeeCoin tokens)
    uint256 public standardRewardAmount = 100 * 10**18; // 100 DazeeCoin with 18 decimals
    
    // Registered shelters
    mapping(address => bool) public registeredShelters;
    
    // Processed adoption verifications to prevent double-claiming
    mapping(bytes32 => bool) public processedVerifications;
    
    // Adoption verification record
    struct AdoptionVerification {
        bytes32 verificationId;
        address adopter;
        string petName;
        string shelterName;
        address shelterAddress;
        uint256 timestamp;
        bool isVerified;
    }
    
    // Events
    event ShelterRegistered(address indexed shelterAddress, string shelterName);
    event ShelterRemoved(address indexed shelterAddress);
    event RewardDistributed(address indexed adopter, bytes32 verificationId, uint256 amount);
    event StandardRewardAmountUpdated(uint256 newAmount);
    
    // Modifiers
    modifier onlyRegisteredShelter() {
        require(registeredShelters[msg.sender], "Caller is not a registered shelter");
        _;
    }
    
    /**
     * @dev Constructor sets the DazeeCoin token address
     * @param _dazeeCoinAddress The address of the DazeeCoin ERC20 token
     */
    constructor(address _dazeeCoinAddress) {
        require(_dazeeCoinAddress != address(0), "Token address cannot be zero");
        dazeeCoin = IERC20(_dazeeCoinAddress);
    }
    
    /**
     * @dev Register a new shelter
     * @param _shelterAddress The address of the shelter to register
     * @param _shelterName The name of the shelter
     */
    function registerShelter(address _shelterAddress, string memory _shelterName) external onlyOwner {
        require(_shelterAddress != address(0), "Shelter address cannot be zero");
        require(!registeredShelters[_shelterAddress], "Shelter already registered");
        
        registeredShelters[_shelterAddress] = true;
        emit ShelterRegistered(_shelterAddress, _shelterName);
    }
    
    /**
     * @dev Remove a registered shelter
     * @param _shelterAddress The address of the shelter to remove
     */
    function removeShelter(address _shelterAddress) external onlyOwner {
        require(registeredShelters[_shelterAddress], "Shelter not registered");
        
        registeredShelters[_shelterAddress] = false;
        emit ShelterRemoved(_shelterAddress);
    }
    
    /**
     * @dev Update the standard reward amount
     * @param _newAmount The new standard reward amount
     */
    function updateStandardRewardAmount(uint256 _newAmount) external onlyOwner {
        standardRewardAmount = _newAmount;
        emit StandardRewardAmountUpdated(_newAmount);
    }
    
    /**
     * @dev Fast track verification from registered shelter
     * @param _adopter Address of the adopter
     * @param _petName Name of the adopted pet
     * @param _adoptionId Unique adoption identifier
     * @param _signature Cryptographic signature for verification
     */
    function verifyAdoptionFastTrack(
        address _adopter,
        string memory _petName,
        string memory _adoptionId,
        bytes memory _signature
    ) 
        external 
        onlyRegisteredShelter 
        nonReentrant 
    {
        // Create a unique verification ID
        bytes32 verificationId = keccak256(abi.encodePacked(_adoptionId, _adopter, msg.sender));
        
        // Ensure this adoption hasn't been processed before
        require(!processedVerifications[verificationId], "Adoption already verified");
        
        // Verify the signature (in production, this would validate the signature)
        // For simplicity, we're skipping actual signature verification in this example
        
        // Mark as processed
        processedVerifications[verificationId] = true;
        
        // Distribute reward
        require(dazeeCoin.balanceOf(address(this)) >= standardRewardAmount, "Insufficient reward tokens");
        require(dazeeCoin.transfer(_adopter, standardRewardAmount), "Token transfer failed");
        
        emit RewardDistributed(_adopter, verificationId, standardRewardAmount);
    }
    
    /**
     * @dev Manual verification by DazeeChain team
     * @param _adopter Address of the adopter
     * @param _petName Name of the adopted pet
     * @param _shelterName Name of the shelter
     * @param _verificationId Unique verification ID
     */
    function verifyAdoptionManual(
        address _adopter,
        string memory _petName,
        string memory _shelterName,
        bytes32 _verificationId
    ) 
        external 
        onlyOwner 
        nonReentrant 
    {
        // Ensure this verification hasn't been processed before
        require(!processedVerifications[_verificationId], "Verification already processed");
        
        // Mark as processed
        processedVerifications[_verificationId] = true;
        
        // Distribute reward
        require(dazeeCoin.balanceOf(address(this)) >= standardRewardAmount, "Insufficient reward tokens");
        require(dazeeCoin.transfer(_adopter, standardRewardAmount), "Token transfer failed");
        
        emit RewardDistributed(_adopter, _verificationId, standardRewardAmount);
    }
    
    /**
     * @dev Check if a verification has been processed
     * @param _verificationId The verification ID to check
     * @return bool True if processed, false otherwise
     */
    function isVerificationProcessed(bytes32 _verificationId) external view returns (bool) {
        return processedVerifications[_verificationId];
    }
    
    /**
     * @dev Withdraw tokens in case of emergency
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        require(_amount <= dazeeCoin.balanceOf(address(this)), "Insufficient balance");
        require(dazeeCoin.transfer(owner(), _amount), "Transfer failed");
    }
}
