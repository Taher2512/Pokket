// Test both hash formats to see which one works for monitoring
import { config } from "dotenv";
import { parseUnits } from "viem";
import { randomBytes } from "node:crypto";
import { add0x } from "@1inch/byte-utils";
import {
  SDK,
  SolanaAddress,
  HashLock,
  EvmAddress,
} from "@1inch/cross-chain-sdk";

config();

console.log("🧪 Testing BOTH Hash Formats for Monitoring");
console.log("=" * 50);

function getSecret() {
  return add0x(randomBytes(32).toString("hex"));
}

async function testBothHashFormats() {
  try {
    const sdk = new SDK({
      url: process.env.ONEINCH_SDK_URL || "https://api.1inch.dev/fusion-plus",
      authKey: process.env.DEV_PORTAL_API_KEY,
    });

    // Create a minimal order for testing
    const srcToken = SolanaAddress.fromString(
      "So11111111111111111111111111111111111111112"
    );
    const dstToken = EvmAddress.fromString(
      "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8"
    );
    const amount = parseUnits("0.02", 9);

    const quote = await sdk.getQuote({
      amount: amount.toString(),
      srcChainId: 501,
      dstChainId: 1,
      srcTokenAddress: srcToken.toString(),
      dstTokenAddress: dstToken.toString(),
      enableEstimate: true,
      walletAddress: "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ",
    });

    const preset = quote.getPreset(quote.recommendedPreset);
    const secrets = [getSecret()];
    const secretHashes = secrets.map(HashLock.hashSecret);
    const hashLock = HashLock.forSingleFill(secrets[0]);

    const order = quote.createSolanaOrder({
      hashLock,
      receiver: EvmAddress.fromString(
        "0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711"
      ),
      preset: quote.recommendedPreset,
    });

    // Announce order
    const announceResult = await sdk.announceOrder(
      order,
      quote.quoteId,
      secretHashes
    );
    const hashBuffer = order.getOrderHashBuffer();
    const properOrderHash = "0x" + hashBuffer.toString("hex");

    console.log("📋 Solana-style hash (44 chars):", announceResult);
    console.log("📋 Ethereum-style hash (66 chars):", properOrderHash);

    console.log("\n🧪 Testing Solana-style hash (44 chars):");
    console.log("-" * 40);

    try {
      const status1 = await sdk.getOrderStatus(announceResult);
      console.log("✅ getOrderStatus with Solana hash WORKED:", status1.status);
    } catch (e) {
      console.log("❌ getOrderStatus with Solana hash failed:", e.message);
    }

    try {
      const secrets1 = await sdk.getReadyToAcceptSecretFills(announceResult);
      console.log(
        "✅ getReadyToAcceptSecretFills with Solana hash WORKED, found",
        secrets1.fills.length,
        "fills"
      );
    } catch (e) {
      console.log(
        "❌ getReadyToAcceptSecretFills with Solana hash failed:",
        e.message
      );
    }

    console.log("\n🧪 Testing Ethereum-style hash (66 chars):");
    console.log("-" * 40);

    try {
      const status2 = await sdk.getOrderStatus(properOrderHash);
      console.log(
        "✅ getOrderStatus with Ethereum hash WORKED:",
        status2.status
      );
    } catch (e) {
      console.log("❌ getOrderStatus with Ethereum hash failed:", e.message);
    }

    try {
      const secrets2 = await sdk.getReadyToAcceptSecretFills(properOrderHash);
      console.log(
        "✅ getReadyToAcceptSecretFills with Ethereum hash WORKED, found",
        secrets2.fills.length,
        "fills"
      );
    } catch (e) {
      console.log(
        "❌ getReadyToAcceptSecretFills with Ethereum hash failed:",
        e.message
      );
    }

    console.log("\n🎯 CONCLUSION:");
    console.log("=" * 30);
    console.log(
      "If Solana hash works: Use announceOrder result for monitoring"
    );
    console.log(
      "If Ethereum hash works: Use getOrderHashBuffer().toString('hex') for monitoring"
    );
    console.log(
      "If both fail: There might be a timing issue - order needs time to be processed"
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testBothHashFormats().catch(console.error);
