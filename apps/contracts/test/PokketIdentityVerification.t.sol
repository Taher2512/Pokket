// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {PokketIdentityVerification} from "../src/PokketIdentityVerification.sol";

/**
 * @title PokketIdentityVerificationTest
 * @notice Test suite for the Pokket Identity Verification contract
 */
contract PokketIdentityVerificationTest is Test {
    PokketIdentityVerification public verificationContract;

    // Test addresses
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public mockHub = address(0x4);

    // Test constants
    uint256 public constant TEST_SCOPE = 12345;
    bytes32 public constant TEST_CONFIG_ID = keccak256("test-config");

    function setUp() public {
        // Deploy contract as owner
        vm.prank(owner);
        verificationContract = new PokketIdentityVerification(mockHub, TEST_SCOPE, TEST_CONFIG_ID);
    }

    // ============ Basic Functionality Tests ============

    function test_InitialState() public {
        assertEq(verificationContract.owner(), owner);
        assertEq(verificationContract.verificationConfigId(), TEST_CONFIG_ID);
        assertEq(verificationContract.totalVerifiedUsers(), 0);
        assertFalse(verificationContract.isUserVerified(user1));
    }

    function test_GetConfigId() public {
        bytes32 configId = verificationContract.getConfigId(bytes32(uint256(1)), bytes32(uint256(uint160(user1))), "");
        assertEq(configId, TEST_CONFIG_ID);
    }

    function test_GetUserVerificationDetails() public {
        (bool isVerified, uint256 timestamp, bytes memory metadata) =
            verificationContract.getUserVerificationDetails(user1);

        assertFalse(isVerified);
        assertEq(timestamp, 0);
        assertEq(metadata.length, 0);
    }

    function test_GetContractStats() public {
        (uint256 totalUsers, bytes32 currentConfig, address contractOwner) = verificationContract.getContractStats();

        assertEq(totalUsers, 0);
        assertEq(currentConfig, TEST_CONFIG_ID);
        assertEq(contractOwner, owner);
    }

    function test_BatchCheckVerification() public {
        address[] memory users = new address[](2);
        users[0] = user1;
        users[1] = user2;

        bool[] memory results = verificationContract.batchCheckVerification(users);

        assertEq(results.length, 2);
        assertFalse(results[0]);
        assertFalse(results[1]);
    }

    // ============ Admin Function Tests ============

    function test_SetConfigId() public {
        bytes32 newConfigId = keccak256("new-config");

        vm.prank(owner);
        verificationContract.setConfigId(newConfigId);

        assertEq(verificationContract.verificationConfigId(), newConfigId);
    }

    function test_SetConfigId_OnlyOwner() public {
        bytes32 newConfigId = keccak256("new-config");

        vm.prank(user1);
        vm.expectRevert("Not authorized");
        verificationContract.setConfigId(newConfigId);
    }

    function test_SetScope() public {
        uint256 newScope = 54321;

        vm.prank(owner);
        verificationContract.setScope(newScope);

        // Note: We can't directly test _scope as it's internal in the parent contract
        // This test ensures the function call doesn't revert
    }

    function test_SetScope_OnlyOwner() public {
        uint256 newScope = 54321;

        vm.prank(user1);
        vm.expectRevert("Not authorized");
        verificationContract.setScope(newScope);
    }

    function test_TransferOwnership() public {
        vm.prank(owner);
        verificationContract.transferOwnership(user1);

        assertEq(verificationContract.owner(), user1);
    }

    function test_TransferOwnership_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert("Not authorized");
        verificationContract.transferOwnership(user2);
    }

    function test_TransferOwnership_InvalidAddress() public {
        vm.prank(owner);
        vm.expectRevert("Invalid new owner");
        verificationContract.transferOwnership(address(0));
    }

    // ============ Edge Cases ============

    function test_RevokeVerification_NotVerifiedUser() public {
        // This should not revert even if user is not verified
        vm.prank(owner);
        verificationContract.revokeVerification(user1);

        assertFalse(verificationContract.isUserVerified(user1));
        assertEq(verificationContract.totalVerifiedUsers(), 0);
    }

    function test_RevokeVerification_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert("Not authorized");
        verificationContract.revokeVerification(user2);
    }

    // ============ Integration Test Helpers ============

    /**
     * @dev This is a helper function to simulate verification success
     * In real usage, this would be called by the Self Protocol hub
     */
    function simulateVerificationSuccess(address userAddress) internal {
        // This is a simplified simulation - in reality, the hub would call onVerificationSuccess
        // which would then call customVerificationHook

        // For testing purposes, we can't easily simulate the full flow without the actual hub
        // These tests focus on the contract logic and admin functions
    }
}
