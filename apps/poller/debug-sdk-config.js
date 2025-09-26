import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

config();

async function debugSDKConfiguration() {
  console.log("🔧 DEBUGGING SDK CONFIGURATION");
  console.log("═".repeat(50));

  console.log("📋 CURRENT CONFIGURATION:");
  console.log("─".repeat(25));
  console.log(
    `API URL: ${process.env.ONEINCH_SDK_URL || "https://api.1inch.dev/fusion-plus"}`
  );
  console.log(
    `API Key: ${process.env.DEV_PORTAL_API_KEY ? "***" + process.env.DEV_PORTAL_API_KEY.slice(-4) : "NOT SET"}`
  );

  // Test different SDK configurations
  const configs = [
    {
      name: "Current Config",
      url: process.env.ONEINCH_SDK_URL || "https://api.1inch.dev/fusion-plus",
      authKey: process.env.DEV_PORTAL_API_KEY,
    },
    {
      name: "Standard API",
      url: "https://api.1inch.dev",
      authKey: process.env.DEV_PORTAL_API_KEY,
    },
    {
      name: "Fusion Plus Direct",
      url: "https://api.1inch.dev/fusion-plus",
      authKey: process.env.DEV_PORTAL_API_KEY,
    },
  ];

  for (const { name, url, authKey } of configs) {
    console.log(`\n🧪 TESTING: ${name}`);
    console.log(`URL: ${url}`);
    console.log("─".repeat(30));

    try {
      const sdk = new SDK({ url, authKey });

      // Test with minimal parameters first
      const quote = await sdk.getQuote({
        amount: "50000000", // 0.05 SOL - well above minimum
        srcChainId: 501,
        dstChainId: 1,
        srcTokenAddress: "So11111111111111111111111111111111111111112",
        dstTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        walletAddress: "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ",
      });

      console.log("✅ SUCCESS!");
      console.log(`Quote ID: ${quote.quoteId}`);
      console.log(`Recommended Preset: ${quote.recommendedPreset}`);
      console.log(`Output: ${quote.dstTokenAmount}`);

      // This config works, so let's use it
      console.log(`\n🎯 WORKING CONFIGURATION FOUND: ${name}`);
      break;
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);

      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(
          `Response: ${JSON.stringify(error.response.data).substring(0, 200)}...`
        );
      }
    }
  }

  console.log("\n💡 COMPARISON WITH 1INCH.IO:");
  console.log("─".repeat(30));
  console.log("If our SDK calls fail but 1inch.io works, possible issues:");
  console.log("1. 🔑 API Key permissions/scope");
  console.log("2. 🌐 Wrong API endpoint");
  console.log("3. 📦 SDK version mismatch");
  console.log("4. ⚙️  Missing required parameters");
  console.log("5. 🔄 Rate limiting on API key");

  console.log("\n🔍 NEXT STEPS:");
  console.log("─".repeat(15));
  console.log("1. Verify API key has cross-chain permissions");
  console.log("2. Check 1inch documentation for latest API changes");
  console.log("3. Compare request format with 1inch.io network tab");
  console.log("4. Test same exact request that 1inch.io makes");
}

debugSDKConfiguration().catch(console.error);
