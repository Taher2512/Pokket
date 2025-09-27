// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title SimplePokketIdentityVerification
 * @notice Simple identity verification contract without Self Protocol dependencies
 * @dev This is a standalone contract that can be upgraded to use Self Protocol later
 */
contract SimplePokketIdentityVerification {
    // ============ Storage ============

    /// @notice Mapping to track verified users
    mapping(address => bool) public verifiedUsers;

    /// @notice Mapping to store verification timestamps
    mapping(address => uint256) public verificationTimestamps;

    /// @notice Mapping to store user verification metadata (optional)
    mapping(address => bytes) public verificationMetadata;

    /// @notice The verification configuration ID for this contract
    bytes32 public verificationConfigId;

    /// @notice Contract owner for administrative functions
    address public owner;

    /// @notice Total number of verified users
    uint256 public totalVerifiedUsers;

    // ============ Events ============

    /// @notice Emitted when a user successfully completes verification
    event UserVerified(address indexed user, uint256 timestamp, bytes metadata);

    /// @notice Emitted when verification config is updated
    event ConfigUpdated(bytes32 newConfigId);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Constructor for the Simple Pokket Identity Verification contract
     * @param _verificationConfigId The initial configuration ID for verification requirements
     */
    constructor(bytes32 _verificationConfigId) {
        owner = msg.sender;
        verificationConfigId = _verificationConfigId;
    }

    // ============ Core Verification Logic ============

    /**
     * @notice Manually verify a user (owner only)
     * @param _user The address to verify
     * @param _metadata Optional metadata for the verification
     */
    function verifyUser(address _user, bytes memory _metadata) external onlyOwner {
        // Only verify if not already verified (prevent duplicate verifications)
        if (!verifiedUsers[_user]) {
            totalVerifiedUsers++;
        }

        // Mark user as verified
        verifiedUsers[_user] = true;
        verificationTimestamps[_user] = block.timestamp;

        // Store any additional metadata if provided
        if (_metadata.length > 0) {
            verificationMetadata[_user] = _metadata;
        }

        // Emit verification event
        emit UserVerified(_user, block.timestamp, _metadata);
    }

    // ============ View Functions ============

    /**
     * @notice Check if a user has completed identity verification
     * @param _user The address to check verification status for
     * @return bool True if the user is verified, false otherwise
     */
    function isUserVerified(address _user) external view returns (bool) {
        return verifiedUsers[_user];
    }

    /**
     * @notice Get verification details for a user
     * @param _user The address to get verification details for
     * @return isVerified Whether the user is verified
     * @return timestamp When the user was verified (0 if not verified)
     * @return metadata Any additional verification metadata
     */
    function getUserVerificationDetails(address _user)
        external
        view
        returns (bool isVerified, uint256 timestamp, bytes memory metadata)
    {
        return (verifiedUsers[_user], verificationTimestamps[_user], verificationMetadata[_user]);
    }

    /**
     * @notice Batch check verification status for multiple users
     * @param _users Array of addresses to check
     * @return results Array of verification statuses
     */
    function batchCheckVerification(address[] calldata _users) external view returns (bool[] memory results) {
        results = new bool[](_users.length);
        for (uint256 i = 0; i < _users.length; i++) {
            results[i] = verifiedUsers[_users[i]];
        }
        return results;
    }

    /**
     * @notice Get basic stats about the contract
     * @return totalUsers Total number of verified users
     * @return currentConfig Current verification configuration ID
     * @return contractOwner Address of the contract owner
     */
    function getContractStats()
        external
        view
        returns (uint256 totalUsers, bytes32 currentConfig, address contractOwner)
    {
        return (totalVerifiedUsers, verificationConfigId, owner);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update the verification configuration ID
     * @dev Only owner can update the config ID
     * @param _newConfigId The new configuration ID from Self tools
     */
    function setConfigId(bytes32 _newConfigId) external onlyOwner {
        verificationConfigId = _newConfigId;
        emit ConfigUpdated(_newConfigId);
    }

    /**
     * @notice Transfer ownership of the contract
     * @dev Only current owner can transfer ownership
     * @param _newOwner The address of the new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        owner = _newOwner;
    }

    /**
     * @notice Emergency function to revoke a user's verification status
     * @dev Only owner can revoke - use carefully and only in extreme cases
     * @param _user The address whose verification to revoke
     */
    function revokeVerification(address _user) external onlyOwner {
        if (verifiedUsers[_user]) {
            verifiedUsers[_user] = false;
            totalVerifiedUsers--;
            // Note: We don't delete timestamp/metadata for audit trail
        }
    }
}
