#!/usr/bin/env bun

// Quick script to check the new order that's currently running
console.log("🔍 NEW ORDER DETAILS:");
console.log("──────────────────────────────");
console.log("Order Hash: 385CdcTkKBxR97wAPvhKqRrGFpmnryMcT58PWk2yJTqX");
console.log(
  "Solana TX: 5R8bxHqLu1uHx3xJrohSAzUwQwrnfHkQmWGeoD8jDQqqXgSMnWLAbVfBtopiZe9yhEtxvemRc1KjC6Wsmwm5EEqL"
);
console.log("Amount: 0.03881244 SOL → USDC");
console.log("Target: USDC (instead of PYUSD)");
console.log("");
console.log("🚀 KEY IMPROVEMENTS:");
console.log("──────────────────────────────");
console.log("• 3-second polling (was 5 seconds)");
console.log("• 2-second startup delay (was 5 seconds)");
console.log("• Enhanced logging with timing");
console.log("• Testing USDC instead of PYUSD");
console.log("");
console.log("⏳ This order should complete faster!");
console.log("📊 Monitor status with: bun check-latest-swap.js");
console.log("");
console.log("🎯 Expected outcome:");
console.log("1. Resolvers will find the order faster");
console.log("2. We will submit secrets faster");
console.log("3. Order should complete within 7 minutes");
console.log("4. No refund should occur");
