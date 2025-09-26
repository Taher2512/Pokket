import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

// Load environment variables
config();

async function debugSecretSubmission() {
  console.log("🔍 DEBUGGING SECRET SUBMISSION FAILURE");
  console.log("═".repeat(50));

  const orderHash = "1rfUchci6pvHjuQhz7MZ9Kfd86jhgrpnj783n3QQEDd";

  console.log(`📋 Order Hash: ${orderHash}`);
  console.log("");

  console.log("🕒 TIMELINE ANALYSIS:");
  console.log("─".repeat(40));
  console.log("16:36:32 - ✅ Solana escrow created");
  console.log("16:36:47 - ✅ Ethereum escrow created");
  console.log("16:43:59 - ❌ Ethereum escrow cancelled (7m 12s timeout)");
  console.log("16:44:33 - ❌ Solana escrow cancelled");
  console.log("");
  console.log("⏰ Secret submission window: ~7 minutes");
  console.log("❌ Your poller FAILED to submit secret in time");

  console.log("\n🤔 POSSIBLE CAUSES:");
  console.log("─".repeat(40));
  console.log("1. 🔄 Poller monitoring loop not detecting ready secrets");
  console.log("2. 📡 Network issues preventing secret submission");
  console.log("3. 🐛 Bug in monitorAndSubmitSecrets function");
  console.log("4. ⚡ Polling interval too slow (5 seconds)");
  console.log("5. 🔑 Secret generation or submission error");

  const sdk = new SDK({
    url: process.env.ONEINCH_SDK_URL || "https://api.1inch.dev/fusion-plus",
    authKey: process.env.DEV_PORTAL_API_KEY,
  });

  // Check what would have been needed
  try {
    console.log("\n🔍 CHECKING WHAT WAS NEEDED:");
    console.log("─".repeat(40));

    const readySecrets = await sdk.getReadyToAcceptSecretFills(orderHash);
    console.log(
      "Ready secrets response:",
      JSON.stringify(readySecrets, null, 2)
    );
  } catch (error) {
    console.log(
      "Cannot check ready secrets for refunded order:",
      error.message
    );
  }

  console.log("\n🔧 DEBUGGING YOUR POLLER:");
  console.log("─".repeat(40));
  console.log("Issues to check in your monitoring loop:");
  console.log("");
  console.log("1. 📊 monitorAndSubmitSecrets function:");
  console.log("   • Is it actually running?");
  console.log("   • Does it log 'Polling for fills...'?");
  console.log("   • Are there any errors?");
  console.log("");
  console.log("2. 🔄 Polling logic:");
  console.log("   • 5-second interval might be too slow");
  console.log("   • Need faster polling (1-2 seconds)");
  console.log("   • Check for immediate polling after order creation");
  console.log("");
  console.log("3. 🔑 Secret submission:");
  console.log("   • Verify secrets array is properly stored");
  console.log("   • Check submitSecret API call");
  console.log("   • Ensure proper error handling");

  console.log("\n💡 IMMEDIATE FIXES NEEDED:");
  console.log("─".repeat(40));
  console.log("1. ⚡ Reduce polling interval to 1-2 seconds");
  console.log("2. 📝 Add more detailed logging in monitoring loop");
  console.log("3. 🔍 Check if monitorAndSubmitSecrets is running at all");
  console.log("4. 🛠️  Test secret submission in isolation");

  console.log("\n🎯 ROOT CAUSE:");
  console.log("─".repeat(40));
  console.log("Your poller is creating orders successfully, but the");
  console.log("monitorAndSubmitSecrets function is not working properly.");
  console.log("The 7-minute timeout suggests 1inch gave up waiting for");
  console.log("your secret submission.");

  console.log("\n" + "═".repeat(50));
  console.log("🚨 NEXT STEP: Debug the monitoring loop!");
}

debugSecretSubmission().catch(console.error);
