// Quick test to see if getOrderHash() gives us the proper format
import { config } from "dotenv";
import { parseUnits } from "viem";
import { randomBytes } from "node:crypto";
import { add0x } from "@1inch/byte-utils";
import {
  NetworkEnum,
  SDK,
  SolanaAddress,
  HashLock,
  EvmAddress,
} from "@1inch/cross-chain-sdk";

config();

console.log("🔍 Testing order.getOrderHash() method");

function getSecret() {
  return add0x(randomBytes(32).toString("hex"));
}

async function testOrderHash() {
  try {
    const sdk = new SDK({
      url: process.env.ONEINCH_SDK_URL || "https://api.1inch.dev/fusion-plus",
      authKey: process.env.DEV_PORTAL_API_KEY,
    });

    const srcToken = SolanaAddress.fromString(
      "So11111111111111111111111111111111111111112"
    );
    const dstToken = EvmAddress.fromString(
      "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8"
    );
    const amount = parseUnits("0.02", 9); // 0.02 SOL

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
    const secrets = [getSecret()]; // Single secret
    const secretHashes = secrets.map(HashLock.hashSecret);
    const hashLock = HashLock.forSingleFill(secrets[0]);

    const order = quote.createSolanaOrder({
      hashLock,
      receiver: EvmAddress.fromString(
        "0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711"
      ),
      preset: quote.recommendedPreset,
    });

    console.log("✅ Order created successfully");

    // Test the getOrderHash method
    const orderHash = order.getOrderHash();
    console.log("📋 order.getOrderHash():", orderHash);
    console.log("📏 Hash length:", orderHash.length, "characters");

    if (orderHash.length === 66 && orderHash.startsWith("0x")) {
      console.log("🎉 PERFECT! This is a proper 66-character Ethereum hash!");
      console.log("✅ This should work for monitoring APIs!");
    } else if (orderHash.length >= 43 && orderHash.length <= 44) {
      console.log("❌ Still getting Solana-style hash format");
    } else {
      console.log("❓ Unexpected hash format");
    }

    // Also test announceOrder to compare
    const announceResult = await sdk.announceOrder(
      order,
      quote.quoteId,
      secretHashes
    );
    console.log("\n📋 announceOrder result:", announceResult);
    console.log(
      "📏 Announce result length:",
      announceResult.length,
      "characters"
    );

    console.log("\n🔍 COMPARISON:");
    console.log(
      "📋 order.getOrderHash():",
      orderHash,
      `(${orderHash.length} chars)`
    );
    console.log(
      "📋 announceOrder result:",
      announceResult,
      `(${announceResult.length} chars)`
    );

    if (orderHash !== announceResult) {
      console.log(
        "✅ DIFFERENT! order.getOrderHash() returns a different hash than announceOrder()"
      );
      console.log("🎯 We should use order.getOrderHash() for monitoring APIs!");
    } else {
      console.log("❌ Same hash - both return Solana format");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testOrderHash().catch(console.error);
