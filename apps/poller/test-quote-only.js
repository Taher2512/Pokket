// Simple test to check hash format from announceOrder
console.log("🧪 SIMPLE HASH FORMAT TEST");
console.log("═══════════════════════════════════");

import { FusionSDK, NetworkEnum } from "@1inch/fusion-sdk";

const sdk = new FusionSDK({
  url: "https://api.1inch.dev/fusion-plus",
  network: NetworkEnum.ETHEREUM,
  authKey: "7FDmZu6NJ50FD9SU8ZyaHgTnIqmELBbH",
});

async function testOrderHash() {
  try {
    console.log("💰 Creating quote...");

    const quote = await sdk.getQuote({
      srcChain: NetworkEnum.SOLANA,
      dstChain: NetworkEnum.ETHEREUM,
      srcTokenAddress: "So11111111111111111111111111111111111111112",
      dstTokenAddress: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
      amount: "10000000", // 0.01 SOL
      enableEstimate: true,
      walletAddress: "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ",
    });

    console.log("✅ Quote created with ID:", quote.quoteId);
    console.log("🔍 Now let's see what announceOrder() returns...");
    console.log("📝 This will show us the ACTUAL hash format");
  } catch (error) {
    console.log("❌ Quote failed:", error.message);
  }
}

// Just test quote creation first
testOrderHash().catch(console.error);
