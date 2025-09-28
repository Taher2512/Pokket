// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {PokketSelfVerification} from "../src/PokketSelfVerification.sol";

contract DeployPokketSelfVerification is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // SELF Protocol Hub V2 address on Celo Sepolia testnet
        // Using placeholder for now - can be updated later via setSelfHubAddress()
        address selfHubV2Address = 0x0000000000000000000000000000000000000001; // Placeholder address
        
        console.log("DEPLOYING WITH PLACEHOLDER HUB ADDRESS!");
        console.log("You can update it later using setSelfHubAddress() function");
        console.log("Placeholder hub address:", selfHubV2Address);
        
        console.log("Deploying PokketSelfVerification...");
        console.log("SELF Hub V2 Address:", selfHubV2Address);
        
        PokketSelfVerification verification = new PokketSelfVerification(
            selfHubV2Address
        );
        
        console.log("PokketSelfVerification deployed to:", address(verification));
        console.log("Owner:", verification.owner());
        console.log("SELF Hub Address:", verification.getSelfHubAddress());
        
        vm.stopBroadcast();
        
        // Log deployment information
        console.log("=== DEPLOYMENT SUCCESSFUL ===");
        console.log("Contract Address:", address(verification));
        console.log("Network: Celo Sepolia (Chain ID: 44787)");
        console.log("IMPORTANT: You need to:");
        console.log("1. Register verification config with SELF hub");
        console.log("2. Call setVerificationConfigId() with the returned config ID");
        console.log("3. Update frontend with this contract address");
    }
}