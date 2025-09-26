import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

// Load environment variables
config();

async function checkNewOrderStatus() {
  console.log("🔍 CHECKING NEW 1INCH ORDER STATUS");
  console.log("═".repeat(50));

  // New order details from your logs
  const orderInfo = {
    hash: "1rfUchci6pvHjuQhz7MZ9Kfd86jhgrpnj783n3QQEDd",
    txSignature:
      "2qoWqycMzyv13uK1GjuAq1QvorzUFnp9bWsuPenxGpM8avX5E8xrq5zgTWaHysqZL9ZXnuWsVXz972LNc3i4mMGf",
    solAmount: "0.02390244 SOL",
  };

  console.log(`📋 Order Hash: ${orderInfo.hash}`);
  console.log(`📋 Solana TX: ${orderInfo.txSignature}`);
  console.log(`💰 SOL Amount: ${orderInfo.solAmount}`);
  console.log("");

  // Initialize 1inch SDK
  const apiKey = process.env.DEV_PORTAL_API_KEY;

  if (!apiKey || apiKey === "your_1inch_api_key_here") {
    console.log("❌ No 1inch API key found in environment");
    return;
  }

  console.log("🔑 API Key found, initializing 1inch SDK...");

  const sdk = new SDK({
    url: process.env.ONEINCH_SDK_URL || "https://api.1inch.dev/fusion-plus",
    authKey: apiKey,
  });

  try {
    console.log("🔍 Querying order status...");

    // Get order status
    const orderStatus = await sdk.getOrderStatus(orderInfo.hash);

    console.log("✅ ORDER STATUS FOUND:");
    console.log("─".repeat(40));
    console.log(`Status: ${orderStatus.status}`);
    console.log(`Validation: ${orderStatus.validation}`);
    console.log(`Remaining Maker Amount: ${orderStatus.remainingMakerAmount}`);

    if (orderStatus.createdAt) {
      const createdAt = new Date(orderStatus.createdAt);
      const elapsed = (Date.now() - createdAt.getTime()) / 1000 / 60; // minutes
      console.log(`Created: ${createdAt.toISOString()}`);
      console.log(`Time elapsed: ${elapsed.toFixed(1)} minutes`);
    }

    // Analyze the status
    console.log("\n📊 STATUS ANALYSIS:");
    console.log("─".repeat(40));

    if (orderStatus.status === "executed") {
      console.log("🎉 ORDER COMPLETED SUCCESSFULLY!");
      console.log("💰 PYUSD should be in your Ethereum wallet");
    } else if (orderStatus.status === "pending") {
      console.log("⏳ Order is still being processed by 1inch relayers");
      console.log("🔄 Cross-chain settlement in progress...");

      // Calculate expected PYUSD amount
      if (orderStatus.order && orderStatus.order.orderInfo) {
        const minDstAmount = orderStatus.order.orderInfo.minDstAmount;
        if (minDstAmount) {
          const pyusdAmount = parseInt(minDstAmount) / 1000000; // PYUSD has 6 decimals
          console.log(`💰 Expected PYUSD: ~${pyusdAmount.toFixed(6)} PYUSD`);
        }
      }
    } else if (orderStatus.status === "cancelled") {
      console.log("❌ Order was cancelled");
      console.log("💸 SOL should be refunded to your Solana wallet");
    } else if (orderStatus.status === "refunded") {
      console.log("💸 Order was refunded");
      console.log("🔄 SOL returned as WSOL (may need unwrapping)");
    } else if (orderStatus.status === "failed") {
      console.log("💥 Order failed");
      console.log("💸 SOL should be refunded to your Solana wallet");
    } else {
      console.log(`❓ Status: ${orderStatus.status}`);
    }

    // Check for fills
    if (orderStatus.fills && orderStatus.fills.length > 0) {
      console.log("\n📦 FILLS DETAILS:");
      console.log("─".repeat(40));
      orderStatus.fills.forEach((fill, i) => {
        console.log(`Fill ${i + 1}:`);
        console.log(`  Status: ${fill.status}`);
        console.log(
          `  Filled Maker Amount: ${fill.filledMakerAmount} lamports`
        );
        console.log(`  Filled Taker Amount: ${fill.filledAuctionTakerAmount}`);

        if (fill.txHash) {
          console.log(`  Transaction Hash: ${fill.txHash}`);
        }

        if (fill.escrowEvents && fill.escrowEvents.length > 0) {
          console.log(`  Escrow Events: ${fill.escrowEvents.length}`);
          fill.escrowEvents.forEach((event, j) => {
            console.log(
              `    ${j + 1}. ${event.action} on ${event.side} (${new Date(event.blockTimestamp).toISOString()})`
            );
            if (event.transactionHash) {
              console.log(`       TX: ${event.transactionHash}`);
            }
          });
        }
      });
    }

    // Check for pending secret submissions
    try {
      console.log("\n🔍 Checking for pending secret submissions...");

      const readySecrets = await sdk.getReadyToAcceptSecretFills(
        orderInfo.hash
      );

      if (readySecrets.fills && readySecrets.fills.length > 0) {
        console.log("🔄 Order is waiting for secret submissions");
        console.log(`📝 Pending fills: ${readySecrets.fills.length}`);
        readySecrets.fills.forEach((fill, i) => {
          console.log(`  Fill ${i + 1}: Index ${fill.idx}`);
        });
      } else {
        console.log("✅ No pending secret submissions required");
      }
    } catch (secretError) {
      console.log("ℹ️  Cannot check secret status:", secretError.message);
    }
  } catch (error) {
    console.error("❌ Error querying order status:", error.message);

    if (error.message.includes("404") || error.message.includes("not found")) {
      console.log("\n🤔 Order not found in 1inch system yet");
      console.log("This could mean:");
      console.log("- Order is very new (< 1 minute old)");
      console.log("- Order hash hasn't been indexed yet");
      console.log("- Try checking again in a few minutes");
    }
  }

  console.log("\n🔗 VERIFICATION LINKS:");
  console.log("─".repeat(40));
  console.log(`Solana TX: https://solscan.io/tx/${orderInfo.txSignature}`);
  console.log(
    `Ethereum Address: https://etherscan.io/address/0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711`
  );
  console.log(
    `PYUSD Token: https://etherscan.io/token/0x6c3ea9036406852006290770BEdFcAbA0e23A0e8`
  );

  console.log("\n⏰ NEXT STEPS:");
  console.log("─".repeat(40));
  console.log("1. Monitor for order status changes");
  console.log("2. Check your Ethereum wallet for PYUSD");
  console.log("3. If order fails, SOL will be auto-refunded");
  console.log("4. Your poller will handle secret submissions automatically");

  console.log("\n" + "═".repeat(50));
}

checkNewOrderStatus().catch(console.error);
