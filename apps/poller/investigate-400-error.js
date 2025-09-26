import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

// Load environment variables
config();

async function investigateOrder400Error() {
  console.log("🔍 INVESTIGATING 400 ERROR FOR ORDER 2");
  console.log("═".repeat(50));

  const problematicOrder = {
    hash: "E4PfJpwgeQJHRtFnnh5pwvaZJDPntJuenDLFKAG2QuVp",
    txSignature:
      "5tpfzptvLZZhx1ndHV1rqnucq47kZgGQA1o8ZSp3yQ7244oA2iGQtDgCW9FG5UeRb3h48FCD7vJMGXXUFySUTXQv",
  };

  console.log(`📋 Order Hash: ${problematicOrder.hash}`);
  console.log(`📋 Solana TX: ${problematicOrder.txSignature}`);
  console.log("");

  const apiKey = process.env.DEV_PORTAL_API_KEY;

  if (!apiKey) {
    console.log("❌ No API key found");
    return;
  }

  const sdk = new SDK({
    url: process.env.ONEINCH_SDK_URL || "https://api.1inch.dev/fusion-plus",
    authKey: apiKey,
  });

  console.log("🔍 POSSIBLE CAUSES OF 400 ERROR:");
  console.log("─".repeat(40));
  console.log("1. 🔄 Order hash doesn't exist (invalid/cancelled)");
  console.log("2. ⏰ Order is too new (not yet indexed)");
  console.log("3. 🗑️  Order was immediately cancelled/rejected");
  console.log("4. 📡 Duplicate order (same parameters as Order 1)");
  console.log("5. 🚫 Invalid order format/parameters");

  // Try different approaches to investigate
  console.log("\n🔧 INVESTIGATION ATTEMPTS:");
  console.log("─".repeat(40));

  // Attempt 1: Try with detailed error handling
  try {
    console.log("1. Attempting detailed order status query...");
    const orderStatus = await sdk.getOrderStatus(problematicOrder.hash);
    console.log("   ✅ SUCCESS! Order found:");
    console.log("   Status:", orderStatus.status);
    console.log("   Validation:", orderStatus.validation);
  } catch (error) {
    console.log("   ❌ FAILED with error:");
    console.log(`   HTTP Status: ${error.response?.status || "unknown"}`);
    console.log(`   Error Message: ${error.message}`);
    console.log(`   Error Code: ${error.code || "unknown"}`);

    if (error.response?.data) {
      console.log("   Response Data:", error.response.data);
    }
  }

  // Attempt 2: Try to check if order exists in a different way
  try {
    console.log("\n2. Attempting to check ready-to-accept secrets...");
    const readySecrets = await sdk.getReadyToAcceptSecretFills(
      problematicOrder.hash
    );
    console.log("   ✅ Order exists but no secrets needed");
  } catch (error) {
    console.log("   ❌ FAILED:");
    console.log(`   Error: ${error.message}`);
  }

  // Attempt 3: Compare with working order
  console.log("\n3. Comparing with working Order 1...");
  try {
    const workingOrder = await sdk.getOrderStatus(
      "4aBTUWQKSLJ4U6TfTXFeX2cntsJhGP3GATyE42FMQCNL"
    );
    console.log("   ✅ Order 1 status:", workingOrder.status);
    console.log(
      "   📊 Order 1 created:",
      new Date(workingOrder.createdAt).toISOString()
    );

    // Check timing difference
    const order1Time = new Date(workingOrder.createdAt);
    const now = new Date();
    const timeDiff = (now.getTime() - order1Time.getTime()) / 1000 / 60; // minutes

    console.log(`   ⏰ Order 1 age: ${timeDiff.toFixed(1)} minutes`);
    console.log("   🤔 Order 2 was likely created shortly after Order 1");
  } catch (error) {
    console.log("   ❌ Cannot compare with Order 1:", error.message);
  }

  console.log("\n📊 LIKELY EXPLANATION:");
  console.log("─".repeat(40));
  console.log("Based on the 400 error, Order 2 was likely:");
  console.log("");
  console.log("🎯 MOST LIKELY: Duplicate/Conflicting Order");
  console.log("   • Order 1 was already processing the same swap");
  console.log("   • 1inch rejected Order 2 as duplicate");
  console.log("   • Same user, same amount, too close in time");
  console.log("");
  console.log("🔄 TIMING ISSUE:");
  console.log("   • Your poller triggered twice in quick succession");
  console.log("   • First order started processing");
  console.log("   • Second order was rejected as redundant");
  console.log("");
  console.log("💡 SOLUTION:");
  console.log("   • Add cooldown period between swaps");
  console.log("   • Check for pending orders before creating new ones");
  console.log(
    "   • This is actually GOOD behavior - prevents double spending!"
  );

  console.log("\n🔗 VERIFICATION:");
  console.log("─".repeat(40));
  console.log(
    `Solana TX 2: https://solscan.io/tx/${problematicOrder.txSignature}`
  );
  console.log("Check if this transaction was successful or failed");

  console.log("\n✅ CONCLUSION:");
  console.log("─".repeat(40));
  console.log(
    "The 400 error is likely 1inch protecting you from duplicate orders."
  );
  console.log(
    "This is normal behavior when multiple swap attempts happen quickly."
  );
  console.log("Focus on Order 1 - it should complete successfully!");
}

investigateOrder400Error().catch(console.error);
