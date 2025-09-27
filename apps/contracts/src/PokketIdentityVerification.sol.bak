// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";

/**
 * @title PokketIdentityVerification
 * @notice Identity verification contract for Pokket users using Self Protocol
 * @dev Users can verify their identity on-chain, which will be displayed when others scan their QR codes
 */
contract PokketIdentityVerification is SelfVerificationRoot {
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
    event UserVerified(
        address indexed user, uint256 timestamp, ISelfVerificationRoot.GenericDiscloseOutputV2 output, bytes userData
    );

    /// @notice Emitted when verification config is updated
    event ConfigUpdated(bytes32 newConfigId);

    /// @notice Emitted when contract scope is updated - inherits from SelfVerificationRoot

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Constructor for the Pokket Identity Verification contract
     * @param _identityVerificationHubV2Address The address of the Identity Verification Hub V2
     * @param _scope The scope of the contract (will be updated after deployment)
     * @param _verificationConfigId The initial configuration ID for verification requirements
     */
    constructor(address _identityVerificationHubV2Address, uint256 _scope, bytes32 _verificationConfigId)
        SelfVerificationRoot(_identityVerificationHubV2Address, _scope)
    {
        owner = msg.sender;
        verificationConfigId = _verificationConfigId;
    }

    // ============ Core Verification Logic ============

    /**
     * @notice Implementation of customVerificationHook
     * @dev This function is called by onVerificationSuccess after hub address validation
     * @param _output The verification output from the hub containing user data
     * @param _userData Additional user data passed through verification process
     */
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory _output,
        bytes memory _userData
    ) internal override {
        // Extract user address from the verification output
        address userAddress = address(uint160(_output.userIdentifier));

        // Only verify if not already verified (prevent duplicate verifications)
        if (!verifiedUsers[userAddress]) {
            totalVerifiedUsers++;
        }

        // Mark user as verified
        verifiedUsers[userAddress] = true;
        verificationTimestamps[userAddress] = block.timestamp;

        // Store any additional metadata if provided
        if (_userData.length > 0) {
            verificationMetadata[userAddress] = _userData;
        }

        // Emit verification event
        emit UserVerified(userAddress, block.timestamp, _output, _userData);
    }

    /**
     * @notice Returns the configuration ID for verification requirements
     * @dev This determines what verification checks are performed (age, country, OFAC, etc.)
     * @param _destinationChainId The chain ID where verification is taking place
     * @param _userIdentifier The user's identifier
     * @param _userDefinedData Any additional user-defined data
     * @return bytes32 The configuration ID to use for this verification
     */
    function getConfigId(bytes32 _destinationChainId, bytes32 _userIdentifier, bytes memory _userDefinedData)
        public
        view
        override
        returns (bytes32)
    {
        // For now, return the same config for all users
        // In the future, this could be dynamic based on user context
        return verificationConfigId;
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
     * @notice Update the contract scope
     * @dev Only owner can update scope - needed after deployment to set correct scope
     * @param _newScope The new scope value calculated with actual contract address
     */
    function setScope(uint256 _newScope) external onlyOwner {
        _setScope(_newScope);
        emit ScopeUpdated(_newScope);
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

    // ============ Utility Functions ============

    /**
     * @notice Check multiple users' verification status at once
     * @param _users Array of addresses to check
     * @return results Array of booleans indicating verification status
     */
    function batchCheckVerification(address[] calldata _users) external view returns (bool[] memory results) {
        results = new bool[](_users.length);
        for (uint256 i = 0; i < _users.length; i++) {
            results[i] = verifiedUsers[_users[i]];
        }
    }
}
