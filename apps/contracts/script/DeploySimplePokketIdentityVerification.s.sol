// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {SimplePokketIdentityVerification} from "../src/SimplePokketIdentityVerification.sol";

/**
 * @title DeploySimplePokketIdentityVerification
 * @notice Deployment script for the Simple Pokket Identity Verification contract
 */
contract DeploySimplePokketIdentityVerification is Script {
    // ============ Constants ============

    /// @notice Your Self Protocol config ID
    bytes32 constant CONFIG_ID = 0x766466f264a44af31cd388cd05801bcc5dfff4980ee97503579db8b3d0742a7e;

    // ============ Deployment Function ============

    function run() external {
        // Get the private key for deployment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Get the chain ID to determine network
        uint256 chainId = block.chainid;

        if (chainId == 42220) {
            console.log("Deploying to Celo Mainnet");
        } else if (chainId == 44787 || chainId == 11142220) {
            console.log("Deploying to Celo Testnet (Chain ID:", chainId, ")");
        } else {
            console.log("Deploying to chain ID:", chainId);
        }

        console.log("Using config ID:", vm.toString(CONFIG_ID));

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract
        SimplePokketIdentityVerification verificationContract = new SimplePokketIdentityVerification(CONFIG_ID);

        // Stop broadcasting
        vm.stopBroadcast();

        // Log deployment info
        console.log("=== DEPLOYMENT SUCCESSFUL ===");
        console.log("Contract address:", address(verificationContract));
        console.log("Chain ID:", chainId);
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Config ID:", vm.toString(CONFIG_ID));

        console.log("");
        console.log("=== CONTRACT FEATURES ===");
        console.log("- Manual user verification (owner only)");
        console.log("- Config ID management");
        console.log("- Batch verification checks");
        console.log("- Compatible with existing backend");

        console.log("");
        console.log("=== UPDATE YOUR ENVIRONMENT ===");
        console.log("Update backend .env:");
        console.log("VERIFICATION_CONTRACT_ADDRESS=", address(verificationContract));
        console.log("");
        console.log("Update frontend .env.local:");
        console.log("NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS=", address(verificationContract));
    }
}
