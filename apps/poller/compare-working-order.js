import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

config();

async function compareWorkingOrder() {
  console.log("🔍 COMPARING WORKING ORDER CONFIGURATION");
  console.log("═".repeat(50));

  try {
    const sdk = new SDK({
      url: "https://api.1inch.dev/fusion-plus",
      authKey: process.env.DEV_PORTAL_API_KEY,
    });

    console.log("📊 Testing quote with different parameters...");

    // Test 1: Exactly like 1inch.io (small amount)
    console.log("\n🧪 TEST 1: Small amount like 1inch.io");
    console.log("─".repeat(30));

    const quote1 = await sdk.getQuote({
      amount: "10000000", // 0.01 SOL
      srcChainId: 501,
      dstChainId: 1,
      srcTokenAddress: "So11111111111111111111111111111111111111112",
      dstTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
      walletAddress: "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ",
      enableEstimate: true, // Try with estimate enabled
    });

    console.log(`✅ Quote 1 received`);
    console.log(`   Quote ID: ${quote1.quoteId || "NULL ⚠️"}`);
    console.log(`   Preset: ${quote1.recommendedPreset}`);
    console.log(`   Output: ${quote1.dstTokenAmount}`);

    // Test 2: Without enableEstimate
    console.log("\n🧪 TEST 2: Without enableEstimate");
    console.log("─".repeat(30));

    const quote2 = await sdk.getQuote({
      amount: "10000000", // 0.01 SOL
      srcChainId: 501,
      dstChainId: 1,
      srcTokenAddress: "So11111111111111111111111111111111111111112",
      dstTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      walletAddress: "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ",
      // enableEstimate: false (default)
    });

    console.log(`✅ Quote 2 received`);
    console.log(`   Quote ID: ${quote2.quoteId || "NULL ⚠️"}`);
    console.log(`   Preset: ${quote2.recommendedPreset}`);
    console.log(`   Output: ${quote2.dstTokenAmount}`);

    // Test 3: Different destination token (USDT)
    console.log("\n🧪 TEST 3: With USDT instead of USDC");
    console.log("─".repeat(30));

    const quote3 = await sdk.getQuote({
      amount: "10000000", // 0.01 SOL
      srcChainId: 501,
      dstChainId: 1,
      srcTokenAddress: "So11111111111111111111111111111111111111112",
      dstTokenAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
      walletAddress: "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ",
    });

    console.log(`✅ Quote 3 received`);
    console.log(`   Quote ID: ${quote3.quoteId || "NULL ⚠️"}`);
    console.log(`   Preset: ${quote3.recommendedPreset}`);
    console.log(`   Output: ${quote3.dstTokenAmount}`);

    // Analysis
    console.log("\n🔍 ANALYSIS:");
    console.log("─".repeat(15));

    const quotes = [
      { name: "USDC + enableEstimate", quote: quote1 },
      { name: "USDC (default)", quote: quote2 },
      { name: "USDT (default)", quote: quote3 },
    ];

    let bestQuote = null;

    quotes.forEach(({ name, quote }) => {
      const hasQuoteId = quote.quoteId !== null && quote.quoteId !== undefined;
      console.log(
        `${name}: Quote ID ${hasQuoteId ? "✅" : "❌"} | Preset: ${quote.recommendedPreset}`
      );

      if (hasQuoteId && !bestQuote) {
        bestQuote = quote;
        console.log(`   ⭐ BEST OPTION FOUND: ${name}`);
      }
    });

    if (bestQuote) {
      console.log("\n🎯 RECOMMENDATION:");
      console.log("─".repeat(20));
      console.log("Use the configuration that produces a valid Quote ID");
      console.log("NULL Quote ID might be causing order refunds");
    } else {
      console.log("\n⚠️  ALL QUOTES HAVE NULL ID:");
      console.log("─".repeat(25));
      console.log("This might be normal for the SDK");
      console.log("Issue could be in order creation, not quote");
    }

    console.log("\n💡 KEY FINDINGS:");
    console.log("─".repeat(17));
    console.log("1. Quotes work with 0.01 SOL (same as 1inch.io)");
    console.log("2. Need to check why orders get refunded");
    console.log("3. Compare order parameters vs 1inch.io");
    console.log("4. Issue likely in createSolanaOrder() or announceOrder()");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

compareWorkingOrder().catch(console.error);
