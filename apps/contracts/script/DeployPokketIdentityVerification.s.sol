// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {PokketIdentityVerification} from "../src/PokketIdentityVerification.sol";

/**
 * @title DeployPokketIdentityVerification
 * @notice Deployment script for the Pokket Identity Verification contract
 */
contract DeployPokketIdentityVerification is Script {
    // ============ Constants ============

    /// @notice Self Identity Verification Hub V2 address on Celo Mainnet
    address constant CELO_MAINNET_HUB = 0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF;

    /// @notice Self Identity Verification Hub V2 address on Celo Testnet
    address constant CELO_TESTNET_HUB = 0x68c931C9a534D37aa78094877F46fE46a49F1A51;

    /// @notice Initial scope (will be updated after deployment)
    uint256 constant INITIAL_SCOPE = 1;

    /// @notice Placeholder config ID (replace with actual config from Self tools)
    bytes32 constant INITIAL_CONFIG_ID = 0x0000000000000000000000000000000000000000000000000000000000000000;

    // ============ Deployment Function ============

    function run() external {
        // Get the private key for deployment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Get the chain ID to determine which hub address to use
        uint256 chainId = block.chainid;
        address hubAddress;

        if (chainId == 42220) {
            // Celo Mainnet
            hubAddress = CELO_MAINNET_HUB;
            console.log("Deploying to Celo Mainnet");
        } else if (chainId == 44787 || chainId == 11142220) {
            // Celo Testnet (Alfajores or Sepolia)
            hubAddress = CELO_TESTNET_HUB;
            console.log("Deploying to Celo Testnet (Chain ID:", chainId, ")");
        } else {
            revert("Unsupported chain ID. Please deploy on Celo Mainnet (42220) or Testnet (44787/11142220)");
        }

        console.log("Using hub address:", hubAddress);
        console.log("Initial scope:", INITIAL_SCOPE);
        console.log("Initial config ID:", vm.toString(INITIAL_CONFIG_ID));

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract
        PokketIdentityVerification verificationContract =
            new PokketIdentityVerification(hubAddress, INITIAL_SCOPE, INITIAL_CONFIG_ID);

        // Stop broadcasting
        vm.stopBroadcast();

        // Log deployment info
        console.log("=== DEPLOYMENT SUCCESSFUL ===");
        console.log("Contract address:", address(verificationContract));
        console.log("Chain ID:", chainId);
        console.log("Hub address:", hubAddress);
        console.log("Deployer:", vm.addr(deployerPrivateKey));

        console.log("");
        console.log("=== NEXT STEPS ===");
        console.log("1. Use Self Configuration Tools to create your verification config:");
        console.log("   https://tools.self.xyz");
        console.log("");
        console.log("2. Calculate the correct scope using the deployed contract address:");
        console.log("   Contract address for scope calculation:", address(verificationContract));
        console.log("");
        console.log("3. Update the contract with the correct config ID and scope:");
        console.log("   - Call setConfigId() with your config from step 1");
        console.log("   - Call setScope() with the calculated scope from step 2");
        console.log("");
        console.log("4. Update your frontend with the contract address:");
        console.log("   POKKET_VERIFICATION_CONTRACT_ADDRESS=", address(verificationContract));
    }
}
