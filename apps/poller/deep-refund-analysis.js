import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

config();

async function analyzeRefundPattern() {
  console.log("🔍 DEEP REFUND ANALYSIS");
  console.log("═".repeat(60));

  const sdk = new SDK({
    url: "https://api.1inch.dev",
    authKey: process.env.ONEINCH_API_KEY,
  });

  // Our failed orders
  const orders = [
    {
      hash: "3iLrRVJ8PC8EYsNENmxXjZBkZ75uYiyUGmrUux8dz5AG",
      type: "USDC",
      amount: "0.023832439",
    },
    {
      hash: "4XdANgozT4J8xQ7CRuTRrJGcWfhPmPWV7G6K2VT8pump",
      type: "PYUSD",
      amount: "0.024108963",
    },
    {
      hash: "Ak6BUjCW1kGxCgKPBK6oSJFAjvDNm6TgVsEfG8xnFuzx",
      type: "PYUSD",
      amount: "0.024020653",
    },
  ];

  console.log("📊 ANALYZING REFUNDED ORDERS:");
  console.log("─".repeat(40));

  for (const order of orders) {
    try {
      console.log(`\n🔍 ORDER: ${order.hash}`);
      console.log(`💰 Amount: ${order.amount} SOL`);
      console.log(`🎯 Target: ${order.type}`);

      const orderStatus = await sdk.getOrderStatus(order.hash);

      console.log(`📊 Status: ${orderStatus.status}`);
      console.log(`✅ Valid: ${orderStatus.validation}`);
      console.log(`📅 Created: ${orderStatus.createdAt}`);

      if (orderStatus.fills && orderStatus.fills.length > 0) {
        console.log(`📦 Fills (${orderStatus.fills.length}):`);
        orderStatus.fills.forEach((fill, i) => {
          console.log(`  ${i + 1}. Status: ${fill.status}`);
          console.log(`     TX: ${fill.txHash || "N/A"}`);
          if (fill.txHash) {
            console.log(
              `     🔗 Solscan: https://solscan.io/tx/${fill.txHash}`
            );
          }
        });
      }

      // Check if we can get more details
      try {
        const orderDetails = await sdk.getOrderHash(order.hash);
        console.log(`🔧 Order Details Available: Yes`);
      } catch (e) {
        console.log(`🔧 Order Details: ${e.message}`);
      }
    } catch (error) {
      console.log(`❌ Error analyzing ${order.hash}: ${error.message}`);
    }

    console.log("─".repeat(40));
  }

  console.log("\n🧐 PATTERN ANALYSIS:");
  console.log("─".repeat(20));

  // Let's check what a successful cross-chain order should look like
  console.log("💡 Common reasons for refunds:");
  console.log("1. 💰 Amount too small (not profitable for resolvers)");
  console.log("2. ⛽ Gas prices too high (order becomes uneconomical)");
  console.log("3. 🕐 Network congestion (resolvers can't execute profitably)");
  console.log("4. 🎯 Token pair issues (low liquidity on destination)");
  console.log("5. ⚙️ Configuration issues (wrong parameters)");

  console.log("\n🔍 INVESTIGATING CURRENT CONDITIONS:");

  // Check current gas price
  try {
    console.log("⛽ Checking current gas prices...");

    // Let's also check what the minimum profitable amount might be
    console.log("\n💰 AMOUNT ANALYSIS:");
    console.log("• Our amounts: ~0.024 SOL ($5-6)");
    console.log("• Typical gas costs: ~$5-10");
    console.log("• Resolver profit margin: ~2-5%");
    console.log("• Minimum viable: Likely $20-50+");

    console.log("\n🎯 HYPOTHESIS:");
    console.log("Orders too small to be profitable for resolvers!");
    console.log("Even with good gas prices, $5-6 orders don't cover:");
    console.log("- Solana transaction fees");
    console.log("- Ethereum gas costs");
    console.log("- Resolver profit margin");
    console.log("- Risk buffer");
  } catch (error) {
    console.log("❌ Error checking conditions:", error.message);
  }
}

analyzeRefundPattern().catch(console.error);
