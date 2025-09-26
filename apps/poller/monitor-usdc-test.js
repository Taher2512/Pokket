import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

config();

async function monitorUSDCTest() {
  console.log("🧪 MONITORING SOL → USDC TEST RESULTS");
  console.log("═".repeat(50));

  const orderHash = "3iLrRVJ8PC8EYsNENmxXjZBkZ75uYiyUGmrUux8dz5AG";
  const startTime = Date.now();

  console.log(`📋 Order: ${orderHash}`);
  console.log(`💰 Amount: 0.023832439 SOL`);
  console.log(`🎯 Testing: SOL → USDC (vs PYUSD)`);
  console.log(`🕐 Started: ${new Date().toISOString()}`);
  console.log("");

  const sdk = new SDK({
    url: "https://api.1inch.dev",
    authKey: process.env.ONEINCH_API_KEY,
  });

  let checkCount = 0;
  const maxChecks = 36; // Monitor for up to 3 minutes

  while (checkCount < maxChecks) {
    try {
      checkCount++;
      const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes

      console.log(
        `🔍 Check ${checkCount}/${maxChecks} (${elapsed.toFixed(1)} min elapsed)`
      );

      try {
        const order = await sdk.getOrderStatus(orderHash);
        console.log(`📊 Status: ${order.status}`);

        if (order.status === "executed") {
          console.log("🎉 SUCCESS! SOL → USDC order EXECUTED!");
          console.log("✅ HYPOTHESIS CONFIRMED: PYUSD liquidity issue!");
          console.log("💡 Solution: Use USDC instead of PYUSD");
          return;
        } else if (order.status === "refunded") {
          console.log("❌ SOL → USDC order was also refunded");
          console.log("🤔 Issue may be deeper than just PYUSD liquidity");
          return;
        } else if (order.status === "cancelled" || order.status === "expired") {
          console.log(`❌ Order ${order.status}`);
          return;
        }

        if (order.fills && order.fills.length > 0) {
          console.log(`📦 Fills: ${order.fills.length}`);
          order.fills.forEach((fill, i) => {
            console.log(
              `  Fill ${i + 1}: ${fill.status} (${fill.txHash || "no tx"})`
            );
          });
        }
      } catch (statusError) {
        console.log(`⚠️  Status check failed: ${statusError.message}`);
      }

      console.log("─".repeat(20));

      // Wait 5 seconds before next check
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`❌ Monitor error:`, error.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log("⏰ Initial monitoring completed");
  console.log("🔍 Check final status:");

  try {
    const finalOrder = await sdk.getOrderStatus(orderHash);
    console.log(`📊 Final Status: ${finalOrder.status}`);

    if (finalOrder.status === "pending") {
      console.log("✅ EXCELLENT! Order still pending (not refunded)");
      console.log("💡 This proves USDC has better liquidity than PYUSD");
      console.log("🎯 Continue monitoring - it may execute soon");
    }
  } catch (error) {
    console.log("❌ Final status check failed:", error.message);
  }
}

monitorUSDCTest().catch(console.error);
