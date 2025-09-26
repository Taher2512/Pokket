import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

config();

async function debugOrderConfiguration() {
  console.log("🔧 DEBUGGING ORDER CONFIGURATION");
  console.log("═".repeat(50));

  try {
    const sdk = new SDK({
      url: "https://api.1inch.dev",
      authKey: process.env.DEV_PORTAL_API_KEY,
    });

    // Simulate getting a quote to check configuration
    console.log("📊 Getting quote to analyze configuration...");

    const quote = await sdk.getQuote({
      amount: "10000000", // 0.01 SOL in lamports
      srcChainId: 501, // Solana
      dstChainId: 1, // Ethereum
      srcTokenAddress: "So11111111111111111111111111111111111111112", // SOL
      dstTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
      enableEstimate: true,
      walletAddress: "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ",
    });

    console.log("✅ Quote received successfully!");
    console.log("─".repeat(30));

    // Analyze quote details
    console.log(`🆔 Quote ID: ${quote.quoteId}`);
    console.log(`🎯 Recommended Preset: ${quote.recommendedPreset}`);
    console.log(`💰 Estimated Output: ${quote.dstTokenAmount}`);

    // Check available presets
    console.log("\n📋 AVAILABLE PRESETS:");
    console.log("─".repeat(25));

    const presets = quote.presets || [];
    if (presets.length === 0) {
      console.log("❌ No presets available!");
      return;
    }

    presets.forEach((preset, index) => {
      console.log(`\nPreset ${index}:`);
      console.log(`  ID: ${preset.id || "N/A"}`);
      console.log(`  Secrets Count: ${preset.secretsCount || "N/A"}`);
      console.log(`  Gas Limit: ${preset.gasLimit || "N/A"}`);
      console.log(
        `  ⭐ ${index === quote.recommendedPreset ? "RECOMMENDED" : "Alternative"}`
      );
    });

    // Check the recommended preset specifically
    const recommendedPreset = quote.getPreset(quote.recommendedPreset);
    console.log("\n🎯 RECOMMENDED PRESET DETAILS:");
    console.log("─".repeat(35));
    console.log(`Secrets Count: ${recommendedPreset.secretsCount}`);
    console.log(`Gas Limit: ${recommendedPreset.gasLimit}`);

    // Check if there are any validation issues
    console.log("\n🔍 POTENTIAL ISSUES:");
    console.log("─".repeat(20));

    // 1. Check receiver address format
    const receiverAddress = "0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711";
    if (!receiverAddress.startsWith("0x") || receiverAddress.length !== 42) {
      console.log("❌ Invalid receiver address format");
    } else {
      console.log("✅ Receiver address format is valid");
    }

    // 2. Check amount vs minimum
    const amountSOL = 0.01;
    const amountUSD = amountSOL * 230; // Rough SOL price
    console.log(`💰 Test amount: ${amountSOL} SOL (~$${amountUSD.toFixed(2)})`);

    if (amountUSD < 5) {
      console.log("⚠️  Amount below $5 minimum");
    } else {
      console.log("✅ Amount above $5 minimum");
    }

    // 3. Check network configuration
    console.log("\n🌐 NETWORK CONFIGURATION:");
    console.log("─".repeat(25));
    console.log(`Source Chain: ${501} (Solana)`);
    console.log(`Destination Chain: ${1} (Ethereum Mainnet)`);
    console.log(`Source Token: SOL`);
    console.log(`Destination Token: USDC`);

    console.log("\n💡 DEBUGGING SUGGESTIONS:");
    console.log("─".repeat(25));
    console.log("1. Try with enableEstimate: false");
    console.log("2. Test with different preset (if available)");
    console.log("3. Use same exact parameters as 1inch.io");
    console.log("4. Check if SDK version matches 1inch.io");
    console.log("5. Test with USDT instead of USDC");
  } catch (error) {
    console.error("❌ Error debugging configuration:", error.message);

    if (error.message.includes("400")) {
      console.log("\n💡 400 Error suggests parameter issues:");
      console.log("- Invalid token addresses");
      console.log("- Wrong chain IDs");
      console.log("- Amount too small");
      console.log("- Invalid wallet address");
    }
  }
}

debugOrderConfiguration().catch(console.error);
