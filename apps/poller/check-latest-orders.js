import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

// Load environment variables
config();

async function checkLatestOrderStatus() {
  console.log("🔍 CHECKING LATEST 1INCH ORDER STATUS");
  console.log("═".repeat(50));

  // Latest order details from your logs
  const orders = [
    {
      hash: "4aBTUWQKSLJ4U6TfTXFeX2cntsJhGP3GATyE42FMQCNL",
      txSignature:
        "2vBKCV8TSDgTdrwdjzsSnkYqqJLCsgS5ag68Worc3VNFgVmfC2shMHXwB2bvG4Q1hwyVUTsZcnoz21dttAXGE74G",
      order: 1,
    },
    {
      hash: "E4PfJpwgeQJHRtFnnh5pwvaZJDPntJuenDLFKAG2QuVp",
      txSignature:
        "5tpfzptvLZZhx1ndHV1rqnucq47kZgGQA1o8ZSp3yQ7244oA2iGQtDgCW9FG5UeRb3h48FCD7vJMGXXUFySUTXQv",
      order: 2,
    },
  ];

  console.log("📋 Found 2 new orders to check:");
  orders.forEach((order, i) => {
    console.log(`${i + 1}. Order Hash: ${order.hash}`);
    console.log(`   Solana TX: ${order.txSignature}`);
  });
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

  // Check each order
  for (const orderInfo of orders) {
    console.log(`\n🔍 CHECKING ORDER ${orderInfo.order}:`);
    console.log("─".repeat(40));
    console.log(`Order Hash: ${orderInfo.hash}`);
    console.log(`Solana TX: ${orderInfo.txSignature}`);

    try {
      // Get order status
      const orderStatus = await sdk.getOrderStatus(orderInfo.hash);

      console.log("\n✅ ORDER STATUS FOUND:");
      console.log(`Status: ${orderStatus.status}`);
      console.log(`Validation: ${orderStatus.validation}`);
      console.log(
        `Remaining Maker Amount: ${orderStatus.remainingMakerAmount}`
      );

      // Analyze the status
      console.log("\n📊 STATUS ANALYSIS:");

      if (orderStatus.status === "executed") {
        console.log("🎉 ORDER COMPLETED SUCCESSFULLY!");
        console.log("💰 PYUSD should be in your Ethereum wallet");

        // Check if there are fills
        if (orderStatus.fills && orderStatus.fills.length > 0) {
          console.log(`📦 Fills: ${orderStatus.fills.length}`);
          orderStatus.fills.forEach((fill, i) => {
            console.log(`  Fill ${i + 1}: Status ${fill.status}`);
            if (fill.txHash) {
              console.log(`  TX Hash: ${fill.txHash}`);
            }
          });
        }
      } else if (orderStatus.status === "pending") {
        console.log("⏳ Order is still being processed by 1inch relayers");
        console.log("🔄 Cross-chain settlement in progress...");

        // Check timing
        const createdAt = new Date(orderStatus.createdAt);
        const elapsed = (Date.now() - createdAt.getTime()) / 1000 / 60; // minutes
        console.log(`⏱️  Time elapsed: ${elapsed.toFixed(1)} minutes`);
      } else if (orderStatus.status === "cancelled") {
        console.log("❌ Order was cancelled");
        console.log("💸 SOL should be refunded to your Solana wallet");
      } else if (orderStatus.status === "refunded") {
        console.log("💸 Order was refunded");
        console.log("🔄 SOL returned as WSOL (needs unwrapping)");
      } else if (orderStatus.status === "failed") {
        console.log("💥 Order failed");
        console.log("💸 SOL should be refunded to your Solana wallet");
      } else {
        console.log(`❓ Status: ${orderStatus.status}`);
      }

      // Check for fills information
      if (orderStatus.fills && orderStatus.fills.length > 0) {
        console.log("\n📦 FILLS DETAILS:");
        orderStatus.fills.forEach((fill, i) => {
          console.log(`Fill ${i + 1}:`);
          console.log(`  Status: ${fill.status}`);
          console.log(`  Filled Maker Amount: ${fill.filledMakerAmount}`);
          console.log(
            `  Filled Taker Amount: ${fill.filledAuctionTakerAmount}`
          );
          if (fill.txHash) {
            console.log(`  Transaction: ${fill.txHash}`);
          }
        });
      }
    } catch (error) {
      console.error(
        `❌ Error querying order ${orderInfo.order}:`,
        error.message
      );

      if (
        error.message.includes("404") ||
        error.message.includes("not found")
      ) {
        console.log(
          "🤔 Order not found - might be too new, retrying in a moment..."
        );
      }
    }

    // Check for pending secret submissions
    try {
      const readySecrets = await sdk.getReadyToAcceptSecretFills(
        orderInfo.hash
      );

      if (readySecrets.fills && readySecrets.fills.length > 0) {
        console.log("🔄 Order is waiting for secret submissions");
        console.log(`📝 Pending fills: ${readySecrets.fills.length}`);
      } else {
        console.log("✅ No pending secret submissions required");
      }
    } catch (secretError) {
      console.log("ℹ️  Cannot check secret status (normal for new orders)");
    }
  }

  console.log("\n🔗 VERIFICATION LINKS:");
  console.log("─".repeat(40));
  orders.forEach((order, i) => {
    console.log(`Order ${i + 1}:`);
    console.log(`  Solana TX: https://solscan.io/tx/${order.txSignature}`);
  });
  console.log(
    `Ethereum Address: https://etherscan.io/address/0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711`
  );
  console.log(
    `PYUSD Token: https://etherscan.io/token/0x6c3ea9036406852006290770BEdFcAbA0e23A0e8`
  );

  console.log("\n" + "═".repeat(50));
  console.log(
    "⏰ Note: Orders may take a few minutes to appear in 1inch system"
  );
  console.log(
    "🔄 If status shows pending, this is normal for cross-chain swaps"
  );
}

checkLatestOrderStatus().catch(console.error);
