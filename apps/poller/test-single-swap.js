// Test a single swap to see hash formats
console.log("🧪 TESTING SINGLE SWAP - HASH FORMAT ANALYSIS");
console.log("═══════════════════════════════════════════════");

import { FusionSDK, NetworkEnum } from "@1inch/fusion-sdk";
import { web3, Keypair } from "@solana/web3.js";
import { utils } from "@1inch/fusion-sdk";

const config = {
  API_KEY: "7FDmZu6NJ50FD9SU8ZyaHgTnIqmELBbH",
  PRIVATE_KEY:
    "16aa8add3c0d2e74eba1d43d68fb01e825d3bf8c9f89ac8aa24b92063aa78b8b",
  RECEIVER_ADDRESS: "0x742d35Cc6334C0532925a3b485C3e5e3e2e5c5c5",
};

async function testSingleSwap() {
  console.log("🚀 Initializing SDK...");

  const sdk = new FusionSDK({
    url: "https://api.1inch.dev/fusion-plus",
    network: NetworkEnum.ETHEREUM,
    authKey: config.API_KEY,
  });

  try {
    console.log("💰 Creating quote for 0.01 SOL...");

    // Create a small test quote
    const quote = await sdk.getQuote({
      srcChain: NetworkEnum.SOLANA,
      dstChain: NetworkEnum.ETHEREUM,
      srcTokenAddress: "So11111111111111111111111111111111111111112", // SOL
      dstTokenAddress: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", // PYUSD
      amount: "10000000", // 0.01 SOL in lamports
      enableEstimate: true,
      walletAddress: "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ",
    });

    if (!quote.quoteId) {
      throw new Error("No quote ID received");
    }

    console.log("✅ Quote ID:", quote.quoteId);

    // Build order
    console.log("🏗️ Building order...");
    const preset = quote.getPreset(quote.recommendedPreset);
    console.log("🔑 Secrets needed:", preset.secretsCount);

    // Generate secrets and hashes
    const secrets = [];
    for (let i = 0; i < preset.secretsCount; i++) {
      secrets.push(utils.generateRandomBytes32());
    }

    const secretHashes = secrets.map((secret) =>
      utils.HashLock.hashSecret(utils.bytes.hexToBytes(secret))
    );

    const hashLock = new utils.HashLock({
      secrets: secretHashes,
      publicKey: utils.bytes.randomBytes(32),
    });

    const order = quote.createSolanaOrder({
      hashLock,
      receiver: utils.EvmAddress.fromString(config.RECEIVER_ADDRESS),
      preset: quote.recommendedPreset,
    });

    console.log("\n📡 ANNOUNCING ORDER TO 1INCH...");
    console.log("⏰ Time:", new Date().toISOString());

    const orderHash = await sdk.announceOrder(
      order,
      quote.quoteId,
      secretHashes
    );

    console.log("\n🎯 HASH ANALYSIS:");
    console.log("═══════════════════════════════════════");
    console.log("📋 1inch Order Hash:", orderHash);
    console.log("📏 Length:", orderHash.length, "characters");
    console.log(
      "🔍 Format valid?",
      orderHash.length === 66 && orderHash.startsWith("0x")
    );

    if (orderHash.length === 66 && orderHash.startsWith("0x")) {
      console.log("✅ PERFECT! This is the correct Ethereum order hash format");

      // Now test if we can use this hash with 1inch API
      console.log("\n🧪 TESTING API CALLS WITH THIS HASH...");

      try {
        const status = await sdk.getOrderStatus(orderHash);
        console.log("✅ getOrderStatus() works:", status.status);

        const secrets = await sdk.getSecretsByOrderHash(orderHash);
        console.log(
          "✅ getSecretsByOrderHash() works, got",
          secrets.length,
          "secrets"
        );

        console.log("\n🎉 SUCCESS! This hash format works with 1inch API");
      } catch (apiError) {
        console.log("❌ API test failed:", apiError.message);
      }
    } else {
      console.log("❌ WRONG FORMAT! This is not a valid Ethereum order hash");
    }

    console.log("\n💡 CONCLUSION:");
    if (orderHash.length === 66 && orderHash.startsWith("0x")) {
      console.log(
        "The announceOrder() call IS returning the correct hash format!"
      );
      console.log(
        "Our previous monitoring failures were likely due to other issues."
      );
    } else {
      console.log(
        "The announceOrder() call is NOT returning the correct hash format!"
      );
      console.log("This explains why our monitoring was failing.");
    }
  } catch (error) {
    console.log("\n💥 TEST FAILED:");
    console.log("Error:", error.message);
    console.log("Type:", error.constructor.name);

    if (error.response) {
      console.log("HTTP Status:", error.response.status);
      try {
        const text = await error.response.text();
        console.log("Response:", text);
      } catch (e) {
        console.log("Could not read response body");
      }
    }
  }

  console.log("\n🏁 Test completed at:", new Date().toISOString());
}

testSingleSwap().catch(console.error);
