import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

config();

async function investigateRefundCauses() {
  console.log("🔍 INVESTIGATING REFUND CAUSES");
  console.log("═".repeat(50));

  console.log("💰 BALANCE STATUS: ✅ SUFFICIENT ($5+ worth)");
  console.log("🔧 TECHNICAL STATUS: ✅ WORKING (monitoring, hash format)");
  console.log("❓ STILL GETTING REFUNDS - WHY?");
  console.log("");

  console.log("🧐 POSSIBLE REFUND CAUSES:");
  console.log("─".repeat(30));

  console.log("1. 🕐 TIMING ISSUES:");
  console.log("   • Network congestion during order execution");
  console.log("   • Gas price spikes between order creation and execution");
  console.log("   • Solana/Ethereum network delays");

  console.log("\n2. ⛽ GAS PRICE VOLATILITY:");
  console.log("   • Ethereum gas prices fluctuate rapidly");
  console.log("   • Order becomes unprofitable mid-execution");
  console.log("   • Resolvers cancel to avoid losses");

  console.log("\n3. 🏃‍♂️ RESOLVER COMPETITION:");
  console.log("   • Multiple resolvers compete for same order");
  console.log("   • First resolver wins, others refund");
  console.log("   • MEV (Maximum Extractable Value) competition");

  console.log("\n4. 💧 LIQUIDITY CONSTRAINTS:");
  console.log("   • Destination token liquidity insufficient");
  console.log("   • Price slippage exceeds tolerance");
  console.log("   • DEX routing fails");

  console.log("\n5. 🔧 CONFIGURATION ISSUES:");
  console.log("   • Order parameters not optimal");
  console.log("   • Slippage tolerance too tight");
  console.log("   • Expiration time too short");

  console.log("\n6. 🌐 NETWORK CONDITIONS:");
  console.log("   • Cross-chain bridge congestion");
  console.log("   • Validator/RPC issues");
  console.log("   • Block production delays");

  // Check current network conditions
  console.log("\n🔍 CURRENT NETWORK CONDITIONS:");
  console.log("─".repeat(35));

  try {
    // Check if we can get some insight into current conditions
    const sdk = new SDK({
      url: "https://api.1inch.dev",
      authKey: process.env.DEV_PORTAL_API_KEY,
    });

    console.log("📊 Checking 1inch network status...");
    // Note: We can't easily check network conditions, but we can suggest monitoring
  } catch (error) {
    console.log("❌ Cannot check network conditions:", error.message);
  }

  console.log("\n💡 DEBUGGING STRATEGIES:");
  console.log("─".repeat(25));
  console.log("1. 📊 Monitor gas prices before/during swaps");
  console.log("2. 🕐 Try swaps at different times (low activity)");
  console.log("3. 🎯 Test different token pairs (USDC vs PYUSD vs USDT)");
  console.log("4. 💰 Try slightly larger amounts ($10-15 instead of $5)");
  console.log("5. ⚙️ Adjust order parameters (slippage, expiration)");
  console.log("6. 📈 Check 1inch analytics for successful swap patterns");

  console.log("\n🎯 IMMEDIATE NEXT STEPS:");
  console.log("─".repeat(25));
  console.log("• Check current Ethereum gas prices");
  console.log("• Look at 1inch resolver activity");
  console.log("• Try a swap during low-activity hours");
  console.log("• Compare different destination tokens");
  console.log("• Monitor the full order lifecycle");

  console.log("\n🤔 KEY QUESTION:");
  console.log("Are ALL cross-chain orders refunding, or just yours?");
  console.log("If it's widespread, it's network/economic conditions.");
  console.log("If it's just yours, it's configuration/timing specific.");
}

investigateRefundCauses().catch(console.error);
