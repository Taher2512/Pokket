import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

// Load environment variables
config();

async function analyzeMonitoringFailure() {
  console.log("🔍 ANALYZING MONITORING FAILURE");
  console.log("═".repeat(50));

  const orderHash = "GNiR4gY6CCf9sYeCp3BfDkJRPTCJojfMpmGTLodmdbhA";

  console.log(`📋 Order Hash: ${orderHash}`);
  console.log("");

  console.log("🕒 FAILURE TIMELINE:");
  console.log("─".repeat(40));
  console.log("16:51:20 - Order created");
  console.log("16:59:XX - Order refunded after 8.3 minutes");
  console.log("❌ Secret was NEVER submitted");

  console.log("\n🤔 WHAT WENT WRONG:");
  console.log("─".repeat(40));
  console.log("Despite the improvements, your monitoring loop is still");
  console.log("failing to submit secrets. Let's diagnose why:");

  const sdk = new SDK({
    url: process.env.ONEINCH_SDK_URL || "https://api.1inch.dev/fusion-plus",
    authKey: process.env.DEV_PORTAL_API_KEY,
  });

  try {
    console.log("\n🔍 CHECKING FINAL ORDER STATE:");
    console.log("─".repeat(40));

    const orderStatus = await sdk.getOrderStatus(orderHash);

    if (orderStatus.fills && orderStatus.fills.length > 0) {
      console.log("📦 Final fill details:");
      const fill = orderStatus.fills[0];

      if (fill.escrowEvents) {
        console.log("\n🏦 Escrow events timeline:");
        fill.escrowEvents.forEach((event, i) => {
          const time = new Date(event.blockTimestamp).toLocaleTimeString();
          console.log(`${i + 1}. ${time} - ${event.action} on ${event.side}`);
        });
      }
    }
  } catch (error) {
    console.log("Cannot get final order details:", error.message);
  }

  console.log("\n🐛 LIKELY CAUSES:");
  console.log("─".repeat(40));
  console.log("1. 🔄 Monitoring loop exited early due to error");
  console.log("2. 📡 API errors preventing secret submission");
  console.log("3. 🔑 Secret submission API call failing");
  console.log("4. ⏰ Race condition in timing");
  console.log("5. 🚫 Order status check failing repeatedly");

  console.log("\n💡 DEBUGGING STEPS:");
  console.log("─".repeat(40));
  console.log("Check your poller logs for:");
  console.log("• Did you see 'Submitted secret for index: 0'?");
  console.log("• Any errors in the monitoring loop?");
  console.log("• Did monitoring stop early?");
  console.log("• Were there continuous 'Polling for fills...' messages?");

  console.log("\n🔧 ENHANCED DEBUGGING:");
  console.log("─".repeat(40));
  console.log("I'll create a standalone secret submission test");
  console.log("to isolate the issue from the main monitoring loop.");

  console.log("\n🎯 NEXT ACTION:");
  console.log("─".repeat(40));
  console.log("Let's add even more logging to catch the exact failure point");
  console.log("and test secret submission in isolation.");

  console.log("\n" + "═".repeat(50));
}

analyzeMonitoringFailure().catch(console.error);
