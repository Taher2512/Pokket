// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title PokketIdentityVerificationSimple
 * @notice Simple identity verification contract for Pokket Wallet
 * @dev This is a basic implementation that can be extended with SELF protocol later
 */
contract PokketIdentityVerificationSimple {
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

    // Mappings to store user verification data
    mapping(bytes32 => UserVerificationData) public verifiedUsers;
    mapping(address => bytes32) public userToNullifier;
    mapping(bytes32 => address) public nullifierToUser;

    // Contract owner (for testing purposes)
    address public owner;

    // Events
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

    // Modifier for owner-only functions (for testing)
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    /**
     * @notice Constructor
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Manually verify a user (for testing purposes)
     * @dev This function simulates the SELF protocol verification
     */
    function manualVerifyUser(
        bytes32 nullifierId,
        address ethAddress,
        address solAddress,
        string memory name,
        string memory nationality,
        uint256 age,
        string memory issuingState
    ) external onlyOwner {
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
     * @notice Link additional addresses to a verified user
     */
    function linkAddresses(
        bytes32 nullifierId,
        address newEthAddress,
        address newSolAddress
    ) external {
        require(verifiedUsers[nullifierId].isVerified, "User not verified");
        require(nullifierToUser[nullifierId] == msg.sender, "Not authorized");

        // Update addresses
        verifiedUsers[nullifierId].ethAddress = newEthAddress;
        verifiedUsers[nullifierId].solAddress = newSolAddress;
        
        // Update mappings
        userToNullifier[newEthAddress] = nullifierId;
        nullifierToUser[nullifierId] = newEthAddress;

        emit AddressesLinked(nullifierId, newEthAddress, newSolAddress);
    }

    /**
     * @notice Transfer ownership (for testing)
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}