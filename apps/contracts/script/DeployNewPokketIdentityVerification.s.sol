// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {SimplePokketIdentityVerification} from "../src/SimplePokketIdentityVerification.sol";

/**
 * @title DeployNewPokketIdentityVerification
 * @notice Deployment script that creates a new wallet and deploys the verification contract
 */
contract DeployNewPokketIdentityVerification is Script {
    // ============ Constants ============

    /// @notice Your Self Protocol config ID
    bytes32 constant CONFIG_ID = 0x766466f264a44af31cd388cd05801bcc5dfff4980ee97503579db8b3d0742a7e;

    // ============ Deployment Function ============

    function run() external {
        // Create a new private key for this deployment
        uint256 deployerPrivateKey = 0x1234567890123456789012345678901234567890123456789012345678901234;

        // In production, use: uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        // But for testing, we'll use a deterministic key so we can track it

        // Get the chain ID to determine network
        uint256 chainId = block.chainid;

        if (chainId == 42220) {
            console.log("Deploying to Celo Mainnet");
        } else if (chainId == 44787 || chainId == 11142220) {
            console.log("Deploying to Celo Testnet (Chain ID:", chainId, ")");
        } else {
            console.log("Deploying to chain ID:", chainId);
        }

        address deployerAddress = vm.addr(deployerPrivateKey);
        console.log("Deployer address:", deployerAddress);
        console.log("Using config ID:", vm.toString(CONFIG_ID));

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract
        SimplePokketIdentityVerification verificationContract = new SimplePokketIdentityVerification(CONFIG_ID);

        // Stop broadcasting
        vm.stopBroadcast();

        // Log deployment info
        console.log("");
        console.log("=== DEPLOYMENT SUCCESSFUL ===");
        console.log("Contract address:", address(verificationContract));
        console.log("Chain ID:", chainId);
        console.log("Deployer address:", deployerAddress);
        console.log("Deployer private key:", vm.toString(deployerPrivateKey));
        console.log("Config ID:", vm.toString(CONFIG_ID));

        console.log("");
        console.log("=== UPDATE YOUR ENVIRONMENT FILES ===");
        console.log("Update backend .env:");
        console.log("VERIFICATION_CONTRACT_ADDRESS=", address(verificationContract));
        console.log("VERIFICATION_PRIVATE_KEY=", vm.toString(deployerPrivateKey));
        console.log("");
        console.log("Update frontend .env:");
        console.log("NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS=", address(verificationContract));

        console.log("");
        console.log("=== FUND THE DEPLOYER ACCOUNT ===");
        console.log("Send some Celo testnet tokens to:", deployerAddress);
        console.log("Faucet: https://faucet.celo.org/alfajores");

        console.log("");
        console.log("=== CONTRACT FEATURES ===");
        console.log("- Manual user verification (owner only)");
        console.log("- Config ID management");
        console.log("- Batch verification checks");
        console.log("- Compatible with existing backend");
    }
}
