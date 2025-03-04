// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title DazeeGovernance
 * @dev Handles multi-sig requirements and shelter verification
 */
contract DazeeGovernance is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    uint256 public constant LARGE_TRANSFER_THRESHOLD = 10000 * 10**18; // 10,000 DZ
    uint256 public constant MIN_APPROVALS = 2; // Minimum approvals needed for large transfers
    
    struct ShelterVerification {
        string ein;
        string physicalAddress;
        string website;
        string[] socialMediaUrls;
        bool isVerified;
        uint256 verificationTimestamp;
        address[] approvers;
        mapping(address => bool) hasApproved;
    }
    
    struct PendingTransfer {
        address recipient;
        uint256 amount;
        uint256 timestamp;
        address[] approvers;
        mapping(address => bool) hasApproved;
    }
    
    mapping(address => ShelterVerification) public shelterVerifications;
    mapping(bytes32 => PendingTransfer) public pendingTransfers;
    
    event ShelterVerificationRequested(address shelter, string ein);
    event ShelterVerified(address shelter, uint256 timestamp);
    event VerificationApproved(address shelter, address approver);
    event TransferRequested(bytes32 transferId, address recipient, uint256 amount);
    event TransferApproved(bytes32 transferId, address approver);
    event TransferExecuted(bytes32 transferId, address recipient, uint256 amount);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }
    
    function requestShelterVerification(
        address shelter,
        string memory ein,
        string memory physicalAddress,
        string memory website,
        string[] memory socialMediaUrls
    ) external {
        require(!shelterVerifications[shelter].isVerified, "Shelter already verified");
        
        ShelterVerification storage verification = shelterVerifications[shelter];
        verification.ein = ein;
        verification.physicalAddress = physicalAddress;
        verification.website = website;
        verification.socialMediaUrls = socialMediaUrls;
        verification.verificationTimestamp = block.timestamp;
        
        emit ShelterVerificationRequested(shelter, ein);
    }
    
    function approveShelterVerification(address shelter) external onlyRole(VERIFIER_ROLE) {
        ShelterVerification storage verification = shelterVerifications[shelter];
        require(!verification.isVerified, "Already verified");
        require(!verification.hasApproved[msg.sender], "Already approved");
        
        verification.hasApproved[msg.sender] = true;
        verification.approvers.push(msg.sender);
        
        emit VerificationApproved(shelter, msg.sender);
        
        if (verification.approvers.length >= MIN_APPROVALS) {
            verification.isVerified = true;
            emit ShelterVerified(shelter, block.timestamp);
        }
    }
    
    function requestLargeTransfer(
        address recipient,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) returns (bytes32) {
        require(amount >= LARGE_TRANSFER_THRESHOLD, "Amount below threshold");
        
        bytes32 transferId = keccak256(abi.encodePacked(
            recipient,
            amount,
            block.timestamp
        ));
        
        PendingTransfer storage transfer = pendingTransfers[transferId];
        transfer.recipient = recipient;
        transfer.amount = amount;
        transfer.timestamp = block.timestamp;
        
        emit TransferRequested(transferId, recipient, amount);
        return transferId;
    }
    
    function approveTransfer(bytes32 transferId) external onlyRole(ADMIN_ROLE) {
        PendingTransfer storage transfer = pendingTransfers[transferId];
        require(transfer.timestamp != 0, "Transfer not found");
        require(!transfer.hasApproved[msg.sender], "Already approved");
        
        transfer.hasApproved[msg.sender] = true;
        transfer.approvers.push(msg.sender);
        
        emit TransferApproved(transferId, msg.sender);
    }
    
    function isTransferApproved(bytes32 transferId) public view returns (bool) {
        PendingTransfer storage transfer = pendingTransfers[transferId];
        return transfer.approvers.length >= MIN_APPROVALS;
    }
    
    function getTransferDetails(bytes32 transferId) external view returns (
        address recipient,
        uint256 amount,
        uint256 timestamp,
        uint256 approvalCount
    ) {
        PendingTransfer storage transfer = pendingTransfers[transferId];
        return (
            transfer.recipient,
            transfer.amount,
            transfer.timestamp,
            transfer.approvers.length
        );
    }
    
    function getShelterVerificationDetails(address shelter) external view returns (
        string memory ein,
        string memory physicalAddress,
        string memory website,
        string[] memory socialMediaUrls,
        bool isVerified,
        uint256 verificationTimestamp,
        uint256 approvalCount
    ) {
        ShelterVerification storage verification = shelterVerifications[shelter];
        return (
            verification.ein,
            verification.physicalAddress,
            verification.website,
            verification.socialMediaUrls,
            verification.isVerified,
            verification.verificationTimestamp,
            verification.approvers.length
        );
    }
}
