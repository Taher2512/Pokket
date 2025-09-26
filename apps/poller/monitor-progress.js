import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

// Load environment variables
config();

async function monitorOrderProgress() {
  console.log("📈 MONITORING ORDER PROGRESS");
  console.log("═".repeat(50));

  const orderHash = "6bhaXK29pGitS6mc3XkT8CdqUD9nEz1jfCmp8aP6B5Qz";
  const startTime = Date.now();

  console.log(`📋 Order: ${orderHash}`);
  console.log(`💰 Amount: 0.02384244 SOL (economically viable)`);
  console.log(`🕐 Started monitoring at: ${new Date().toISOString()}`);
  console.log("");

  const sdk = new SDK({
    url: "https://api.1inch.dev",
    authKey: process.env.ONEINCH_API_KEY,
  });

  let checkCount = 0;
  const maxChecks = 60; // Monitor for up to 5 minutes

  while (checkCount < maxChecks) {
    try {
      checkCount++;
      const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes

      console.log(
        `🔍 Check ${checkCount}/${maxChecks} (${elapsed.toFixed(1)} min elapsed)`
      );

      // Check order status
      try {
        const order = await sdk.getOrderStatus(orderHash);
        console.log(`📊 Status: ${order.status}`);

        if (order.status === "executed") {
          console.log("🎉 SUCCESS! Order executed!");
          console.log("✅ The larger amount approach worked!");
          return;
        } else if (order.status === "refunded") {
          console.log("❌ Order refunded - even with larger amount");
          console.log("🔍 Need to investigate further...");
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

      // Check ready to accept fills
      try {
        const readyFills = await sdk.getReadyToAcceptSecretFills(orderHash);
        if (readyFills.fills && readyFills.fills.length > 0) {
          console.log(`🔑 Ready for secrets: ${readyFills.fills.length} fills`);
          readyFills.fills.forEach((fill, i) => {
            console.log(`  Fill ${i + 1}: index ${fill.idx}`);
          });
        } else {
          console.log("⏳ No fills ready for secrets yet");
        }
      } catch (fillError) {
        console.log(`⚠️  Fill check failed: ${fillError.message}`);
      }

      console.log("─".repeat(30));

      // Wait 5 seconds before next check
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`❌ Monitor error:`, error.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log("⏰ Monitoring completed - check final status manually");
}

monitorOrderProgress().catch(console.error);
