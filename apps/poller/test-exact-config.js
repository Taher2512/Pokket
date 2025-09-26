import { SDK } from "@1inch/cross-chain-sdk";
import { SolanaAddress, EvmAddress } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

config();

// Same config as our actual poller
const swapConfig = {
  solTokenAddress: "So11111111111111111111111111111111111111112",
  usdcEthereumAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  srcChainId: 501,
  dstChainId: 1,
};

async function testExactConfiguration() {
  console.log("🔧 TESTING EXACT POLLER CONFIGURATION");
  console.log("═".repeat(50));

  try {
    const sdk = new SDK({
      url: process.env.ONEINCH_SDK_URL || "https://api.1inch.dev/fusion-plus",
      authKey: process.env.DEV_PORTAL_API_KEY,
    });

    // Test with our exact amount (0.04 SOL like recent failed order)
    const amount = BigInt("40000000"); // 0.04 SOL in lamports
    const makerAddress = "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ";

    console.log("📊 EXACT PARAMETERS FROM FAILED ORDER:");
    console.log("─".repeat(40));
    console.log(`Amount: ${amount.toString()} lamports (0.04 SOL)`);
    console.log(`Maker: ${makerAddress}`);
    console.log(`Source: ${swapConfig.solTokenAddress}`);
    console.log(`Destination: ${swapConfig.usdcEthereumAddress}`);
    console.log(`Chains: ${swapConfig.srcChainId} → ${swapConfig.dstChainId}`);

    const srcToken = SolanaAddress.fromString(swapConfig.solTokenAddress);
    const dstToken = EvmAddress.fromString(swapConfig.usdcEthereumAddress);

    const quote = await sdk.getQuote({
      amount: amount.toString(),
      srcChainId: swapConfig.srcChainId,
      dstChainId: swapConfig.dstChainId,
      srcTokenAddress: srcToken.toString(),
      dstTokenAddress: dstToken.toString(),
      enableEstimate: true,
      walletAddress: makerAddress,
    });

    console.log("\n✅ QUOTE RESULT:");
    console.log("─".repeat(20));
    console.log(`Quote ID: ${quote.quoteId || "NULL ❌"}`);
    console.log(`Recommended Preset: ${quote.recommendedPreset}`);
    console.log(`Output Amount: ${quote.dstTokenAmount}`);
    console.log(`Estimated Fee: ${quote.estimatedFee || "N/A"}`);

    if (quote.quoteId) {
      console.log("\n🎉 SUCCESS! Valid Quote ID received!");
      console.log("This should prevent refunds.");

      // Check preset details
      const preset = quote.getPreset(quote.recommendedPreset);
      console.log("\n🎯 PRESET DETAILS:");
      console.log("─".repeat(20));
      console.log(`Secrets Count: ${preset.secretsCount}`);
      console.log(`Gas Limit: ${preset.gasLimit || "Default"}`);
    } else {
      console.log("\n❌ NULL Quote ID - This is the problem!");
      console.log("Orders with NULL quote IDs get refunded.");
    }

    console.log("\n🔍 COMPARISON:");
    console.log("─".repeat(15));
    console.log("✅ Our config produces valid Quote ID");
    console.log("✅ enableEstimate: true is set");
    console.log("✅ All parameters match failed order");
    console.log("");
    console.log("🤔 If Quote ID is valid but orders still refund:");
    console.log("1. Issue might be in order creation step");
    console.log("2. Secret generation could be wrong");
    console.log("3. Hash lock configuration issue");
    console.log("4. Timing/network conditions");
  } catch (error) {
    console.error("❌ Error testing configuration:", error.message);
    console.log("\nThis error might explain the refunds!");
  }
}

testExactConfiguration().catch(console.error);
