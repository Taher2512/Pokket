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

console.log("🔍 Investigating 1inch Order Object Structure");
console.log("=" * 50);

function getSecret() {
  return add0x(randomBytes(32).toString("hex"));
}

function generateSecrets(count) {
  return Array.from({ length: count }).map(() => getSecret());
}

function createHashLock(secrets) {
  const leaves = HashLock.getMerkleLeaves(secrets);
  return secrets.length > 1
    ? HashLock.forMultipleFills(leaves)
    : HashLock.forSingleFill(secrets[0]);
}

async function investigateOrderObject() {
  try {
    console.log("📡 Initializing 1inch SDK...");

    const sdk = new SDK({
      url: process.env.ONEINCH_SDK_URL || "https://api.1inch.dev/fusion-plus",
      authKey: process.env.DEV_PORTAL_API_KEY,
    });

    console.log("📊 Getting quote...");

    const srcToken = SolanaAddress.fromString(
      process.env.SOL_TOKEN_ADDRESS ||
        "So11111111111111111111111111111111111111112"
    );
    const dstToken = EvmAddress.fromString(
      process.env.PYUSD_ETHEREUM_ADDRESS ||
        "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8"
    );

    // Very small amount to avoid balance issues
    const amount = parseUnits("0.001", 9); // 0.001 SOL

    const quote = await sdk.getQuote({
      amount: amount.toString(),
      srcChainId: parseInt(process.env.SRC_CHAIN_ID || "501"),
      dstChainId: parseInt(process.env.DST_CHAIN_ID || "1"),
      srcTokenAddress: srcToken.toString(),
      dstTokenAddress: dstToken.toString(),
      enableEstimate: true,
      walletAddress: "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ", // Your address
    });

    console.log("✅ Quote received, creating order...");

    const preset = quote.getPreset(quote.recommendedPreset);
    const secrets = generateSecrets(preset.secretsCount);
    const secretHashes = secrets.map(HashLock.hashSecret);
    const hashLock = createHashLock(secrets);

    const order = quote.createSolanaOrder({
      hashLock,
      receiver: EvmAddress.fromString(
        "0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711"
      ),
      preset: quote.recommendedPreset,
    });

    console.log("\n🔍 ORDER OBJECT INVESTIGATION:");
    console.log("=" * 50);

    console.log("📋 Order object keys:", Object.keys(order));
    console.log(
      "📋 Order prototype methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(order))
    );

    // Try to access different potential hash properties/methods
    console.log("\n🔍 TESTING HASH ACCESS METHODS:");
    console.log("-" * 30);

    try {
      if (typeof order.getOrderHash === "function") {
        console.log("✅ order.getOrderHash is a function");
        try {
          const hash1 = order.getOrderHash();
          console.log(
            "📋 order.getOrderHash():",
            hash1,
            `(${hash1?.length || 0} chars)`
          );
        } catch (e) {
          console.log("❌ order.getOrderHash() failed:", e.message);

          // Try with different parameters
          try {
            const hash2 = order.getOrderHash(NetworkEnum.ETHEREUM);
            console.log(
              "📋 order.getOrderHash(NetworkEnum.ETHEREUM):",
              hash2,
              `(${hash2?.length || 0} chars)`
            );
          } catch (e2) {
            console.log(
              "❌ order.getOrderHash(NetworkEnum.ETHEREUM) failed:",
              e2.message
            );

            try {
              const hash3 = order.getOrderHash(NetworkEnum.SOLANA);
              console.log(
                "📋 order.getOrderHash(NetworkEnum.SOLANA):",
                hash3,
                `(${hash3?.length || 0} chars)`
              );
            } catch (e3) {
              console.log(
                "❌ order.getOrderHash(NetworkEnum.SOLANA) failed:",
                e3.message
              );
            }
          }
        }
      } else {
        console.log("❌ order.getOrderHash is not a function");
      }
    } catch (e) {
      console.log("❌ Error checking getOrderHash:", e.message);
    }

    // Check for hash properties
    if (order.hash) {
      console.log(
        "📋 order.hash property:",
        order.hash,
        `(${order.hash?.length || 0} chars)`
      );
    }

    if (order.orderHash) {
      console.log(
        "📋 order.orderHash property:",
        order.orderHash,
        `(${order.orderHash?.length || 0} chars)`
      );
    }

    if (order.id) {
      console.log(
        "📋 order.id property:",
        order.id,
        `(${order.id?.length || 0} chars)`
      );
    }

    // Now try announceOrder to see what it returns
    console.log("\n🔍 TESTING ANNOUNCE ORDER:");
    console.log("-" * 30);

    try {
      const announceResult = await sdk.announceOrder(
        order,
        quote.quoteId,
        secretHashes
      );
      console.log(
        "📋 announceOrder result:",
        announceResult,
        `(${announceResult?.length || 0} chars)`
      );

      // Now check if order object has new properties after announce
      console.log("\n🔍 ORDER OBJECT AFTER ANNOUNCE:");
      console.log("📋 Order object keys after announce:", Object.keys(order));

      if (order.hash) {
        console.log(
          "📋 order.hash after announce:",
          order.hash,
          `(${order.hash?.length || 0} chars)`
        );
      }

      if (order.orderHash) {
        console.log(
          "📋 order.orderHash after announce:",
          order.orderHash,
          `(${order.orderHash?.length || 0} chars)`
        );
      }

      if (order.id) {
        console.log(
          "📋 order.id after announce:",
          order.id,
          `(${order.id?.length || 0} chars)`
        );
      }

      // Try getOrderHash again after announce
      try {
        if (typeof order.getOrderHash === "function") {
          const hashAfter = order.getOrderHash();
          console.log(
            "📋 order.getOrderHash() after announce:",
            hashAfter,
            `(${hashAfter?.length || 0} chars)`
          );
        }
      } catch (e) {
        console.log("❌ getOrderHash after announce failed:", e.message);
      }
    } catch (e) {
      console.log("❌ announceOrder failed:", e.message);
    }

    console.log("\n✅ Investigation complete!");
  } catch (error) {
    console.error("❌ Investigation failed:", error);
  }
}

investigateOrderObject().catch(console.error);
