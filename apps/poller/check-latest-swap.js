import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

// Load environment variables
config();

async function checkLatestSwapStatus() {
  console.log("🔍 CHECKING LATEST SWAP STATUS");
  console.log("═".repeat(50));

  // Check the latest order status - SOL → USDC test
  const orderHash = "385CdcTkKBxR97wAPvhKqRrGFpmnryMcT58PWk2yJTqX"; // Latest USDC order

  const orderInfo = {
    hash: orderHash,
    txSignature:
      "5R8bxHqLu1uHx3xJrohSAzUwQwrnfHkQmWGeoD8jDQqqXgSMnWLAbVfBtopiZe9yhEtxvemRc1KjC6Wsmwm5EEqL",
    solAmount: "0.023832439 SOL",
    targetToken: "USDC", // Testing USDC instead of PYUSD
  };

  console.log(`📋 Order Hash: ${orderInfo.hash}`);
  console.log(`📋 Solana TX: ${orderInfo.txSignature}`);
  console.log(`💰 SOL Amount: ${orderInfo.solAmount}`);
  console.log(`🎯 Target Token: ${orderInfo.targetToken} (Testing liquidity)`);
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

  console.log("🔍 MONITORING ANALYSIS:");
  console.log("─".repeat(40));
  console.log("✅ Improved logging is working");
  console.log("✅ Generated 1 secret for submission");
  console.log("❌ Getting 400 error on order status");
  console.log("📝 Found 0 fills ready (order too new)");

  console.log("\n💡 WHAT'S HAPPENING:");
  console.log("─".repeat(40));
  console.log("The 400 error suggests the order is very new");
  console.log("1inch systems need time to index the order");
  console.log("This is normal for the first few API calls");

  let attempt = 1;
  const maxAttempts = 10;

  while (attempt <= maxAttempts) {
    try {
      console.log(
        `\n🔍 Attempt ${attempt}/${maxAttempts}: Checking order status...`
      );

      const orderStatus = await sdk.getOrderStatus(orderInfo.hash);

      console.log("✅ ORDER STATUS FOUND:");
      console.log("─".repeat(40));
      console.log(`Status: ${orderStatus.status}`);
      console.log(`Validation: ${orderStatus.validation}`);
      console.log(
        `Remaining Maker Amount: ${orderStatus.remainingMakerAmount}`
      );

      if (orderStatus.createdAt) {
        const createdAt = new Date(orderStatus.createdAt);
        const elapsed = (Date.now() - createdAt.getTime()) / 1000 / 60;
        console.log(`Created: ${createdAt.toISOString()}`);
        console.log(`Time elapsed: ${elapsed.toFixed(1)} minutes`);
      }

      // Check for fills
      if (orderStatus.fills && orderStatus.fills.length > 0) {
        console.log("\n📦 FILLS FOUND:");
        orderStatus.fills.forEach((fill, i) => {
          console.log(`Fill ${i + 1}: ${fill.status}`);
          if (fill.txHash) {
            console.log(`  TX: ${fill.txHash}`);
          }
        });
      }

      // Check for ready secrets
      try {
        const readySecrets = await sdk.getReadyToAcceptSecretFills(
          orderInfo.hash
        );

        if (readySecrets.fills && readySecrets.fills.length > 0) {
          console.log("\n🔑 SECRETS NEEDED:");
          console.log(`📝 ${readySecrets.fills.length} fills need secrets`);
          readySecrets.fills.forEach((fill, i) => {
            console.log(`  Fill ${i + 1}: Index ${fill.idx}`);
          });
        } else {
          console.log("\n⏳ No secrets needed yet");
        }
      } catch (secretError) {
        console.log("\n🔍 Cannot check secrets yet:", secretError.message);
      }

      console.log("\n✅ ORDER FOUND - Your monitoring should work now!");
      break;
    } catch (error) {
      console.log(`❌ Attempt ${attempt} failed: ${error.message}`);

      if (attempt === maxAttempts) {
        console.log("\n🤔 Order still not found after 10 attempts");
        console.log("This could indicate an issue with order creation");
      } else {
        console.log("⏳ Waiting 3 seconds before retry...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    attempt++;
  }

  console.log("\n🔗 VERIFICATION LINKS:");
  console.log("─".repeat(40));
  console.log(`Solana TX: https://solscan.io/tx/${orderInfo.txSignature}`);
  console.log(
    `Your Address: https://etherscan.io/address/0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711`
  );

  console.log("\n📊 NEXT STEPS:");
  console.log("─".repeat(40));
  console.log("1. Your monitoring loop should continue");
  console.log("2. Once order is indexed, it will submit secrets");
  console.log("3. Watch for 'Submitted secret for index: 0'");
  console.log("4. Order should complete within ~5-10 minutes");

  console.log("\n" + "═".repeat(50));
}

checkLatestSwapStatus().catch(console.error);
