// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

// For now, let's create interfaces that match SELF's expected callback pattern
// This allows us to receive SELF verification data without importing their contracts

interface ISelfHub {
    function setVerificationConfigV2(bytes32 config) external returns (bytes32 configId);
}

// Struct that matches SELF's GenericDiscloseOutputV2 structure
struct GenericDiscloseOutputV2 {
    bytes32 userIdentifier; // nullifier from SELF
    bytes disclosedAttributes; // actual verification data (name, age, etc.)
    uint256 timestamp;
    bytes32 configId;
}

/**
 * @title PokketSelfVerification  
 * @notice Pokket identity verification contract that can receive SELF protocol callbacks
 * @dev This contract implements SELF's expected callback interface to receive actual verification data
 */
contract PokketSelfVerification {
    // Struct to store user verification data
    struct UserVerificationData {
        bytes32 nullifierId;
        address ethAddress;
        address solAddress;
        string name;
        string nationality;
        uint256 age;
        string issuingState;
        uint256 verifiedAt;
        bool isVerified;
    }

    // Storage for SELF integration
    bytes32 public verificationConfigId;
    address public selfHubAddress;
    
    // Mappings to store user verification data
    mapping(bytes32 => UserVerificationData) public verifiedUsers;
    mapping(address => bytes32) public userToNullifier;
    mapping(bytes32 => address) public nullifierToUser;

    // Contract owner
    address public owner;

    // Events
    event VerificationCompleted(
        GenericDiscloseOutputV2 output,
        bytes userData
    );
    
    event UserVerified(
        bytes32 indexed nullifierId,
        address indexed ethAddress,
        address indexed solAddress,
        string name,
        string nationality,
        uint256 age,
        string issuingState,
        uint256 timestamp
    );

    event AddressesLinked(
        bytes32 indexed nullifierId,
        address indexed ethAddress,
        address indexed solAddress
    );

    // Modifier for owner-only functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    /**
     * @notice Constructor for Pokket SELF verification contract
     * @param _selfHubAddress The address of the SELF Identity Verification Hub V2 on Celo Sepolia
     */
    constructor(address _selfHubAddress) {
        owner = msg.sender;
        selfHubAddress = _selfHubAddress;
        // verificationConfigId will be set by SELF when config is registered
    }
    
    /**
     * @notice SELF protocol callback - called when SELF verification succeeds
     * @dev This function receives the actual verification data from SELF protocol
     * @param output The verification output containing disclosed attributes (name, age, nationality, etc.)
     * @param userData The user-defined data passed through verification (contains wallet addresses)
     */
    function onVerificationSuccess(
        GenericDiscloseOutputV2 memory output,
        bytes memory userData
    ) external {
        // Only SELF hub can call this function
        require(msg.sender == selfHubAddress, "Only SELF hub can call this");
        
        // Process the verification
        _processVerification(output, userData);
    }
    
    /**
     * @notice Internal function to process SELF verification data
     */
    function _processVerification(
        GenericDiscloseOutputV2 memory output,
        bytes memory userData
    ) internal {
        // Emit event for debugging
        emit VerificationCompleted(output, userData);
        
        // Parse user data to get wallet addresses
        (address ethAddress, address solAddress) = abi.decode(userData, (address, address));
        
        // Extract verification data from SELF output
        bytes32 nullifierId = output.userIdentifier; // This is the actual nullifier from SELF
        
        // Extract disclosed attributes (these come from the actual document verification)
        string memory name = ""; // Will be populated from output.disclosedAttributes
        string memory nationality = "";
        uint256 age = 0;
        string memory issuingState = "";
        
        // TODO: Parse output.disclosedAttributes to extract actual verification data
        // The structure depends on what SELF discloses for your verification config
        
        // Create verification data
        UserVerificationData memory verificationData = UserVerificationData({
            nullifierId: nullifierId,
            ethAddress: ethAddress,
            solAddress: solAddress,
            name: name,
            nationality: nationality,
            age: age,
            issuingState: issuingState,
            verifiedAt: block.timestamp,
            isVerified: true
        });

        // Store mappings
        verifiedUsers[nullifierId] = verificationData;
        userToNullifier[ethAddress] = nullifierId;
        nullifierToUser[nullifierId] = ethAddress;

        // Emit events
        emit UserVerified(
            nullifierId,
            ethAddress,
            solAddress,
            name,
            nationality,
            age,
            issuingState,
            block.timestamp
        );

        emit AddressesLinked(nullifierId, ethAddress, solAddress);
    }

    /**
     * @notice Return the verification config ID for SELF hub
     * @dev This must return the same config ID that was registered with SELF
     */
    function getConfigId(
        bytes32 /* destinationChainId */,
        bytes32 /* userIdentifier */,
        bytes memory /* userDefinedData */
    ) public view returns (bytes32) {
        return verificationConfigId;
    }
    
    /**
     * @notice Set the verification config ID (called by owner after registering with SELF)
     */
    function setVerificationConfigId(bytes32 _configId) external onlyOwner {
        verificationConfigId = _configId;
    }

    /**
     * @notice Get verification data by nullifier ID
     */
    function getVerificationByNullifier(bytes32 nullifierId) 
        external 
        view 
        returns (UserVerificationData memory) 
    {
        return verifiedUsers[nullifierId];
    }

    /**
     * @notice Get verification data by Ethereum address
     */
    function getVerificationByAddress(address ethAddress) 
        external 
        view 
        returns (UserVerificationData memory) 
    {
        bytes32 nullifierId = userToNullifier[ethAddress];
        return verifiedUsers[nullifierId];
    }

    /**
     * @notice Check if a user is verified by address
     */
    function isUserVerified(address ethAddress) external view returns (bool) {
        bytes32 nullifierId = userToNullifier[ethAddress];
        return verifiedUsers[nullifierId].isVerified;
    }

    /**
     * @notice Get nullifier ID by Ethereum address
     */
    function getNullifierByAddress(address ethAddress) external view returns (bytes32) {
        return userToNullifier[ethAddress];
    }

    /**
     * @notice Get Ethereum address by nullifier ID
     */
    function getAddressByNullifier(bytes32 nullifierId) external view returns (address) {
        return nullifierToUser[nullifierId];
    }

    /**
     * @notice Transfer ownership (for testing)
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    /**
     * @notice Get the current SELF hub address
     */
    function getSelfHubAddress() external view returns (address) {
        return selfHubAddress;
    }
    
    /**
     * @notice Update SELF hub address (owner only)
     */
    function setSelfHubAddress(address _selfHubAddress) external onlyOwner {
        selfHubAddress = _selfHubAddress;
    }
}