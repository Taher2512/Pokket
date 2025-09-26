// Temporary configuration for testing larger amounts
// This modifies the minimum balance to test economic viability hypothesis

import { config } from "dotenv";

config();

async function suggestOptimalTestAmount() {
  console.log("💡 OPTIMAL TEST AMOUNT CALCULATOR");
  console.log("═".repeat(50));

  const solPrice = 230; // Current SOL price

  console.log("📊 ECONOMIC ANALYSIS:");
  console.log("─".repeat(25));

  // Different test amounts
  const testAmounts = [
    { description: "Current minimum", usd: 5, sol: 5 / solPrice },
    { description: "Conservative test", usd: 15, sol: 15 / solPrice },
    { description: "Safe test", usd: 25, sol: 25 / solPrice },
    { description: "High confidence", usd: 50, sol: 50 / solPrice },
  ];

  testAmounts.forEach((test) => {
    console.log(
      `${test.description}: $${test.usd} (~${test.sol.toFixed(4)} SOL)`
    );

    // Rough profitability check
    const gasCost = 12; // USD
    const profit = test.usd - gasCost;
    const margin = (profit / test.usd) * 100;

    if (margin > 20) {
      console.log(`  ✅ Very likely to execute (${margin.toFixed(1)}% margin)`);
    } else if (margin > 10) {
      console.log(`  🟡 Likely to execute (${margin.toFixed(1)}% margin)`);
    } else if (margin > 0) {
      console.log(`  🟠 May execute (${margin.toFixed(1)}% margin)`);
    } else {
      console.log(`  ❌ Unlikely to execute (${margin.toFixed(1)}% loss)`);
    }
  });

  console.log("\n🎯 RECOMMENDATION:");
  console.log("─".repeat(20));
  console.log("Test with ~0.065 SOL (~$15) for better success chances");
  console.log(
    "This gives resolvers a reasonable profit margin after gas costs"
  );

  console.log("\n⚙️ TO TEST THIS:");
  console.log("─".repeat(15));
  console.log("1. Fund wallet with 0.07+ SOL");
  console.log("2. Update MIN_SOL_BALANCE to 0.065 in .env");
  console.log("3. Run a test swap");
  console.log("4. Monitor if order executes instead of refunding");

  console.log("\n💭 WHY $5 MINIMUM EXISTS:");
  console.log("─".repeat(30));
  console.log("• $5 is the technical minimum 1inch will accept");
  console.log("• But economic minimum for execution is higher");
  console.log("• Resolvers need profit after gas costs");
  console.log("• $15+ gives much better execution odds");
}

suggestOptimalTestAmount().catch(console.error);
