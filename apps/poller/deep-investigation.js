console.log("🔍 DEEP INVESTIGATION: WHY LARGER ORDERS STILL GET REFUNDED");
console.log("═".repeat(70));
console.log("");

console.log("📊 CRITICAL DISCOVERY:");
console.log("─".repeat(30));
console.log("Even our 0.024 SOL order got refunded after 8.4 minutes");
console.log("This suggests the issue is MORE than just economic viability");
console.log("");

console.log("⏰ TIMING ANALYSIS:");
console.log("─".repeat(25));
console.log("Order created: 2025-09-22T18:09:45.247Z");
console.log("Refund TX:     2025-09-22T18:09:47.000Z");
console.log("Difference:    ~2 seconds (immediate refund!)");
console.log("");
console.log("❌ This is NOT a timeout - it's an immediate rejection");
console.log("");

console.log("🔍 POSSIBLE ROOT CAUSES:");
console.log("─".repeat(35));
console.log("");

console.log("1️⃣ LIQUIDITY ISSUES:");
console.log("   • No resolvers available for SOL→PYUSD");
console.log("   • Low liquidity on Ethereum for PYUSD");
console.log("   • Bridge capacity constraints");
console.log("");

console.log("2️⃣ MARKET CONDITIONS:");
console.log("   • High Ethereum gas prices making ALL orders unprofitable");
console.log("   • Current ETH gas: Check https://etherscan.io/gastracker");
console.log("   • If gas > 50 gwei, even 0.024 SOL might be unprofitable");
console.log("");

console.log("3️⃣ CONFIGURATION ISSUES:");
console.log("   • Wrong chain IDs or token addresses");
console.log("   • Incorrect preset parameters");
console.log("   • Rate/slippage too restrictive");
console.log("");

console.log("4️⃣ RESOLVER AVAILABILITY:");
console.log("   • No active resolvers for this route");
console.log("   • 1inch resolver network issues");
console.log("   • SOL→PYUSD route temporarily unavailable");
console.log("");

console.log("5️⃣ ORDER PARAMETERS:");
console.log("   • Rate too high (asking for too much PYUSD)");
console.log("   • Deadline too short");
console.log("   • Auction parameters not competitive");
console.log("");

console.log("🎯 NEXT DEBUGGING STEPS:");
console.log("─".repeat(35));
console.log("");

console.log("1. Check current ETH gas prices");
console.log("2. Try different token pairs (SOL→USDC instead)");
console.log("3. Try different amounts (0.05 SOL, 0.1 SOL)");
console.log("4. Check 1inch resolver status");
console.log("5. Verify all chain IDs and addresses");
console.log("6. Test during different market hours");
console.log("");

console.log("💡 IMMEDIATE TESTS TO TRY:");
console.log("─".repeat(40));
console.log("");

console.log("✅ Test 1: Different Token Pair");
console.log("   Try SOL → USDC instead of SOL → PYUSD");
console.log("   USDC has much higher liquidity");
console.log("");

console.log("✅ Test 2: Much Larger Amount");
console.log("   Try 0.05 SOL or 0.1 SOL");
console.log("   Higher amounts = higher resolver interest");
console.log("");

console.log("✅ Test 3: Check Market Hours");
console.log("   Try during US/EU active hours");
console.log("   More resolver activity during trading hours");
console.log("");

console.log("✅ Test 4: Verify Configuration");
console.log("   Double-check all addresses and chain IDs");
console.log("   Ensure we're using the right PYUSD address");
console.log("");

console.log("🚨 KEY INSIGHT:");
console.log("─".repeat(20));
console.log("The immediate refund (2 seconds) suggests:");
console.log("• Route unavailable or misconfigured");
console.log("• No resolvers active for SOL→PYUSD");
console.log("• Gas prices too high for ANY amount");
console.log("• Fundamental configuration issue");
console.log("");

console.log("🔧 RECOMMENDED ACTION:");
console.log("─".repeat(30));
console.log("1. Check current ETH gas prices");
console.log("2. Switch to SOL→USDC for testing");
console.log("3. Verify all token addresses");
console.log("4. Try during peak market hours");
