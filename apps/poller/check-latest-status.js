import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

config();

async function checkLatestSwapStatus() {
  console.log("🔍 CHECKING LATEST SWAP STATUS");
  console.log("═".repeat(50));

  // Latest order from the test
  const orderHash = "391kQ6jQK7oxivxSLnu4sNKRCZqzyknWUL7JwEL1mtqY";

  const orderInfo = {
    hash: orderHash,
    txSignature:
      "5vscpAE7yyKz9WJwF91QVeFBQduejARFPXHVay2Dh2E8S61AU8c3fY9gGDfRRLTSi5L27HWhpk4uHnk9ejRBqf3P",
    solAmount: "0.03883244 SOL",
    targetToken: "USDC",
    valueUSD: "$8.95", // Much better than previous $5.52
  };

  console.log(`📋 Order Hash: ${orderInfo.hash}`);
  console.log(`📋 Solana TX: ${orderInfo.txSignature}`);
  console.log(`💰 SOL Amount: ${orderInfo.solAmount}`);
  console.log(`💵 Value: ${orderInfo.valueUSD} (vs previous $5.52)`);
  console.log(`🎯 Target Token: ${orderInfo.targetToken}`);
  console.log("");

  const sdk = new SDK({
    url: process.env.ONEINCH_SDK_URL || "https://api.1inch.dev/fusion-plus",
    authKey: process.env.DEV_PORTAL_API_KEY,
  });

  try {
    console.log("🔍 Checking order status...");
    const orderStatus = await sdk.getOrderStatus(orderInfo.hash);

    console.log("✅ ORDER STATUS:");
    console.log("─".repeat(20));
    console.log(`Status: ${orderStatus.status}`);
    console.log(`Validation: ${orderStatus.validation}`);
    console.log(`Remaining Maker Amount: ${orderStatus.remainingMakerAmount}`);

    if (orderStatus.createdAt) {
      const createdAt = new Date(orderStatus.createdAt);
      const elapsed = (Date.now() - createdAt.getTime()) / 1000 / 60;
      console.log(`Created: ${createdAt.toISOString()}`);
      console.log(`Time elapsed: ${elapsed.toFixed(1)} minutes`);
    }

    // Check for fills
    if (orderStatus.fills && orderStatus.fills.length > 0) {
      console.log("\n📦 FILLS:");
      orderStatus.fills.forEach((fill, i) => {
        console.log(`Fill ${i + 1}: ${fill.status}`);
        if (fill.txHash) {
          console.log(`  TX: ${fill.txHash}`);
        }
      });
    } else {
      console.log("\n📦 No fills yet");
    }

    if (orderStatus.status === "pending") {
      console.log("\n🎉 GREAT NEWS!");
      console.log("Order is still PENDING (not refunded)!");
      console.log(
        "This suggests the higher amount ($8.95 vs $5.52) is working!"
      );
      console.log("Continue monitoring - it may execute successfully.");
    } else if (orderStatus.status === "executed") {
      console.log("\n🎊 SUCCESS!");
      console.log("Order EXECUTED! The economic viability theory was correct!");
    } else if (orderStatus.status === "refunded") {
      console.log("\n😔 Still refunded...");
      console.log("May need even larger amounts or different timing.");
    }
  } catch (error) {
    console.log(`❌ Error checking status: ${error.message}`);
  }

  console.log("\n🔗 LINKS:");
  console.log(`Solana TX: https://solscan.io/tx/${orderInfo.txSignature}`);
}

checkLatestSwapStatus().catch(console.error);
