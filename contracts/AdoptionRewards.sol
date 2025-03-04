// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title AdoptionRewards
 * @dev Manages adoption verification and reward distribution
 */
contract AdoptionRewards is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // DazeeCoin token contract
    IERC20 public dazeeToken;

    // Reward amount for successful adoptions (100 DZ)
    uint256 public constant ADOPTION_REWARD = 100 * 10**18;
    
    // Adoption code expiration time (30 days)
    uint256 public constant CODE_EXPIRATION = 30 days;

    struct AdoptionCode {
        address shelter;
        uint256 timestamp;
        bool isUsed;
        bool isConfirmed;
        address adopter;
    }

    // Mapping from adoption code hash to adoption details
    mapping(bytes32 => AdoptionCode) public adoptionCodes;
    
    // Mapping to track shelter's pending adoptions
    mapping(address => mapping(bytes32 => bool)) public shelterPendingAdoptions;
    
    // Mapping to track verified shelters (imported from DazeeCoin)
    mapping(address => bool) public verifiedShelters;

    // Events
    event AdoptionCodeGenerated(bytes32 indexed codeHash, address indexed shelter);
    event AdoptionCodeClaimed(bytes32 indexed codeHash, address indexed adopter);
    event AdoptionConfirmed(bytes32 indexed codeHash, address indexed shelter, address indexed adopter);
    event RewardDistributed(address indexed adopter, uint256 amount);

    constructor(address _dazeeToken) {
        dazeeToken = IERC20(_dazeeToken);
    }

    /**
     * @dev Generates a unique adoption code hash
     * @param shelter Address of the shelter
     * @param uniqueId Unique identifier for the adoption
     * @param timestamp Time when the code was generated
     */
    function generateAdoptionCodeHash(
        address shelter,
        string memory uniqueId,
        uint256 timestamp
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(shelter, uniqueId, timestamp));
    }

    /**
     * @dev Shelter generates a new adoption code
     * @param uniqueId Unique identifier for the adoption
     */
    function generateAdoptionCode(string memory uniqueId) external {
        require(verifiedShelters[msg.sender], "Shelter not verified");
        
        uint256 timestamp = block.timestamp;
        bytes32 codeHash = generateAdoptionCodeHash(msg.sender, uniqueId, timestamp);
        
        require(adoptionCodes[codeHash].timestamp == 0, "Code already exists");
        
        adoptionCodes[codeHash] = AdoptionCode({
            shelter: msg.sender,
            timestamp: timestamp,
            isUsed: false,
            isConfirmed: false,
            adopter: address(0)
        });
        
        emit AdoptionCodeGenerated(codeHash, msg.sender);
    }

    /**
     * @dev Adopter claims an adoption code
     * @param codeHash Hash of the adoption code
     */
    function claimAdoptionCode(bytes32 codeHash) external nonReentrant {
        AdoptionCode storage adoption = adoptionCodes[codeHash];
        
        require(adoption.timestamp != 0, "Invalid adoption code");
        require(!adoption.isUsed, "Code already used");
        require(block.timestamp <= adoption.timestamp + CODE_EXPIRATION, "Code expired");
        
        adoption.isUsed = true;
        adoption.adopter = msg.sender;
        shelterPendingAdoptions[adoption.shelter][codeHash] = true;
        
        emit AdoptionCodeClaimed(codeHash, msg.sender);
    }

    /**
     * @dev Shelter confirms adoption and triggers reward
     * @param codeHash Hash of the adoption code
     */
    function confirmAdoption(bytes32 codeHash) external nonReentrant {
        require(verifiedShelters[msg.sender], "Shelter not verified");
        
        AdoptionCode storage adoption = adoptionCodes[codeHash];
        require(adoption.shelter == msg.sender, "Not the issuing shelter");
        require(adoption.isUsed, "Code not claimed");
        require(!adoption.isConfirmed, "Already confirmed");
        require(shelterPendingAdoptions[msg.sender][codeHash], "No pending adoption");
        
        adoption.isConfirmed = true;
        shelterPendingAdoptions[msg.sender][codeHash] = false;
        
        // Distribute reward
        require(
            dazeeToken.transfer(adoption.adopter, ADOPTION_REWARD),
            "Reward transfer failed"
        );
        
        emit AdoptionConfirmed(codeHash, msg.sender, adoption.adopter);
        emit RewardDistributed(adoption.adopter, ADOPTION_REWARD);
    }

    /**
     * @dev Updates verified shelter status (only callable by owner)
     * @param shelter Address of the shelter
     * @param isVerified Verification status
     */
    function updateShelterStatus(address shelter, bool isVerified) external onlyOwner {
        verifiedShelters[shelter] = isVerified;
    }

    /**
     * @dev Checks if an adoption code is valid and unclaimed
     * @param codeHash Hash of the adoption code
     */
    function isCodeValid(bytes32 codeHash) external view returns (bool) {
        AdoptionCode memory adoption = adoptionCodes[codeHash];
        return adoption.timestamp != 0 &&
               !adoption.isUsed &&
               block.timestamp <= adoption.timestamp + CODE_EXPIRATION;
    }

    /**
     * @dev Gets adoption code details
     * @param codeHash Hash of the adoption code
     */
    function getAdoptionDetails(bytes32 codeHash) external view returns (
        address shelter,
        uint256 timestamp,
        bool isUsed,
        bool isConfirmed,
        address adopter
    ) {
        AdoptionCode memory adoption = adoptionCodes[codeHash];
        return (
            adoption.shelter,
            adoption.timestamp,
            adoption.isUsed,
            adoption.isConfirmed,
            adoption.adopter
        );
    }
}
