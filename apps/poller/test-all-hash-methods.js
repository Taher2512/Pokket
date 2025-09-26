// Test getOrderHashBuffer and other hash methods
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

console.log("🔍 Testing ALL hash methods on order object");

function getSecret() {
  return add0x(randomBytes(32).toString("hex"));
}

async function testAllHashMethods() {
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

    console.log("✅ Order created successfully");
    console.log("\n🔍 TESTING ALL HASH METHODS:");
    console.log("=" * 50);

    // Test getOrderHash()
    try {
      const hash1 = order.getOrderHash();
      console.log("📋 order.getOrderHash():", hash1, `(${hash1.length} chars)`);
    } catch (e) {
      console.log("❌ order.getOrderHash() failed:", e.message);
    }

    // Test getOrderHashBuffer()
    try {
      const hashBuffer = order.getOrderHashBuffer();
      console.log("📋 order.getOrderHashBuffer():", hashBuffer);
      console.log("📋 Buffer length:", hashBuffer.length, "bytes");

      // Convert buffer to hex
      const hashBufferHex = "0x" + hashBuffer.toString("hex");
      console.log(
        "📋 Buffer as hex:",
        hashBufferHex,
        `(${hashBufferHex.length} chars)`
      );

      if (hashBufferHex.length === 66) {
        console.log(
          "🎉 BINGO! getOrderHashBuffer() gives us 66-character hash!"
        );
        console.log("✅ This should be the proper Ethereum order hash!");
      }
    } catch (e) {
      console.log("❌ order.getOrderHashBuffer() failed:", e.message);
    }

    // Test other potential hash methods
    try {
      const account = order.getOrderAccount();
      console.log(
        "📋 order.getOrderAccount():",
        account,
        `(${account.toString().length} chars)`
      );
    } catch (e) {
      console.log("❌ order.getOrderAccount() failed:", e.message);
    }

    // Test if order has any hash properties
    console.log("\n🔍 ORDER PROPERTIES:");
    const orderProps = Object.keys(order);
    orderProps.forEach((prop) => {
      const value = order[prop];
      if (
        typeof value === "string" &&
        (value.length === 44 || value.length === 66)
      ) {
        console.log(`📋 order.${prop}:`, value, `(${value.length} chars)`);
      }
    });

    // Test JSON representation
    try {
      const orderJSON = order.toJSON();
      console.log("\n🔍 ORDER JSON KEYS:", Object.keys(orderJSON));

      // Look for hash-like properties in JSON
      Object.keys(orderJSON).forEach((key) => {
        const value = orderJSON[key];
        if (
          typeof value === "string" &&
          (value.length === 44 || value.length === 66)
        ) {
          console.log(`📋 orderJSON.${key}:`, value, `(${value.length} chars)`);
        }
      });
    } catch (e) {
      console.log("❌ order.toJSON() failed:", e.message);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testAllHashMethods().catch(console.error);
