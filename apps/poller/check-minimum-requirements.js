import { config } from "dotenv";

config();

async function calculateMinimumRequirements() {
  console.log("💰 1INCH MINIMUM REQUIREMENTS CALCULATOR");
  console.log("═".repeat(50));

  const solPrice = 230; // Current approximate SOL price
  const minUSD = 5; // 1inch minimum requirement

  console.log("📋 OFFICIAL 1INCH REQUIREMENTS:");
  console.log("─".repeat(30));
  console.log("✅ Valid API Key: Required");
  console.log("💰 Minimum token value: $5 USD");
  console.log("⛽ Sufficient SOL for fees: Required");

  console.log("\n💱 CALCULATIONS:");
  console.log("─".repeat(20));
  console.log(`SOL Price: ~$${solPrice}`);
  console.log(`Minimum Value: $${minUSD}`);

  const minSOL = minUSD / solPrice;
  const safeMinSOL = minSOL * 1.1; // 10% buffer

  console.log(`Minimum SOL: ${minSOL.toFixed(4)} SOL`);
  console.log(`Safe minimum: ${safeMinSOL.toFixed(4)} SOL (with buffer)`);

  console.log("\n📊 OUR SITUATION:");
  console.log("─".repeat(20));
  console.log(
    `Current balance: 0.006 SOL (~$${(0.006 * solPrice).toFixed(2)})`
  );
  console.log(
    `Required: ${safeMinSOL.toFixed(4)} SOL (~$${(safeMinSOL * solPrice).toFixed(2)})`
  );

  const deficit = safeMinSOL - 0.006;
  console.log(
    `Deficit: ${deficit.toFixed(4)} SOL (~$${(deficit * solPrice).toFixed(2)})`
  );

  if (0.006 >= minSOL) {
    console.log("\n✅ WE MEET THE MINIMUM!");
    console.log("The refunds might be due to other factors:");
    console.log("• Network conditions");
    console.log("• Resolver availability");
    console.log("• Gas price fluctuations");
    console.log("• Liquidity issues");
  } else {
    console.log("\n❌ BELOW MINIMUM");
    console.log("Need to add more SOL to meet $5 requirement");
  }

  console.log("\n🤔 WHY ORDERS MIGHT STILL FAIL:");
  console.log("─".repeat(35));
  console.log("1. 💰 Even at $5, profit margins are thin");
  console.log("2. ⛽ Gas spikes can make small orders unprofitable");
  console.log("3. 🕐 Network congestion affects resolver willingness");
  console.log("4. 🎯 Token-specific liquidity on destination chain");
  console.log("5. 📊 Resolver competition and availability");

  console.log("\n💡 TESTING STRATEGY:");
  console.log("─".repeat(20));
  console.log("1. Fund wallet to exactly $5+ worth");
  console.log("2. Test during low gas periods");
  console.log("3. Try different token pairs (USDC vs PYUSD)");
  console.log("4. Monitor resolver activity patterns");
}

calculateMinimumRequirements().catch(console.error);
