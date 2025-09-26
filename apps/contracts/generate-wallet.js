const { ethers } = require("ethers");

// Generate a new random wallet
const wallet = ethers.Wallet.createRandom();

console.log("=== NEW CELO TESTNET WALLET ===");
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);
console.log("");
console.log("=== NEXT STEPS ===");
console.log("1. Add this private key to apps/contracts/.env:");
console.log(`   PRIVATE_KEY=${wallet.privateKey}`);
console.log("");
console.log("2. Get testnet CELO funds from:");
console.log("   https://faucet.celo.org/alfajores");
console.log("   - Enter the address above");
console.log("   - Complete the captcha");
console.log("   - Wait for funds to arrive (usually 1-2 minutes)");
console.log("");
console.log("3. Verify funds arrived:");
console.log(`   https://explorer.celo.org/alfajores/address/${wallet.address}`);
console.log("");
console.log(
  "⚠️  IMPORTANT: This is a test wallet only! Never use this private key for mainnet or real funds."
);
