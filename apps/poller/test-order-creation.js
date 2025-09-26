import { SDK, HashLock } from "@1inch/cross-chain-sdk";
import { SolanaAddress, EvmAddress } from "@1inch/cross-chain-sdk";
import { randomBytes } from "crypto";
import { config } from "dotenv";

config();

async function testOrderCreation() {
  console.log("🧪 TESTING ORDER CREATION PROCESS");
  console.log("═".repeat(50));

  try {
    const sdk = new SDK({
      url: process.env.ONEINCH_SDK_URL || "https://api.1inch.dev/fusion-plus",
      authKey: process.env.DEV_PORTAL_API_KEY,
    });

    // Get quote exactly like our poller
    const amount = BigInt("40000000"); // 0.04 SOL
    const srcToken = SolanaAddress.fromString(
      "So11111111111111111111111111111111111111112"
    );
    const dstToken = EvmAddress.fromString(
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    );
    const makerAddress = "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ";
    const receiverAddress = "0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711";

    console.log("1️⃣ Getting quote...");
    const quote = await sdk.getQuote({
      amount: amount.toString(),
      srcChainId: 501,
      dstChainId: 1,
      srcTokenAddress: srcToken.toString(),
      dstTokenAddress: dstToken.toString(),
      enableEstimate: true,
      walletAddress: makerAddress,
    });

    console.log(`✅ Quote received - ID: ${quote.quoteId}`);

    if (!quote.quoteId) {
      console.log("❌ CRITICAL: Quote ID is null/undefined!");
      console.log("This will cause announceOrder() to fail!");
      return;
    }

    console.log("\n2️⃣ Preparing order creation...");
    const preset = quote.getPreset(quote.recommendedPreset);
    console.log(`   Preset: ${quote.recommendedPreset}`);
    console.log(`   Secrets needed: ${preset.secretsCount}`);
    console.log(`   Gas limit: ${preset.gasLimit || "default"}`);

    // Generate secrets exactly like our code
    console.log("\n3️⃣ Generating secrets...");
    function generateSecrets(count) {
      return Array.from(
        { length: count },
        () => "0x" + randomBytes(32).toString("hex")
      );
    }

    const secrets = generateSecrets(preset.secretsCount);
    console.log(`   Generated ${secrets.length} secrets`);
    console.log(`   Secret 1: ${secrets[0].substring(0, 10)}...`);

    const secretHashes = secrets.map(HashLock.hashSecret);
    console.log(`   Hash 1: ${secretHashes[0].substring(0, 10)}...`);

    // Create hash lock exactly like our code
    function createHashLock(secrets) {
      return new HashLock({
        hashLock: secretHashes[0],
        maker: makerAddress,
      });
    }

    const hashLock = createHashLock(secrets);
    console.log(`   Hash lock created for maker: ${makerAddress}`);

    console.log("\n4️⃣ Creating Solana order...");

    // This is where the issue might be
    const order = quote.createSolanaOrder({
      hashLock,
      receiver: EvmAddress.fromString(receiverAddress),
      preset: quote.recommendedPreset,
    });

    console.log("✅ Solana order created successfully");
    console.log(`   Receiver: ${receiverAddress}`);
    console.log(`   Preset: ${quote.recommendedPreset}`);

    console.log("\n5️⃣ Testing announceOrder (DRY RUN)...");
    console.log("   ⚠️  Not actually announcing to avoid duplicate orders");
    console.log(
      `   Would call: sdk.announceOrder(order, "${quote.quoteId}", secretHashes)`
    );
    console.log(`   Quote ID valid: ${quote.quoteId ? "✅" : "❌"}`);
    console.log(`   Secret hashes: ${secretHashes.length} items`);

    // Check order hash
    try {
      const hashBuffer = order.getOrderHashBuffer();
      const ethereumOrderHash = "0x" + hashBuffer.toString("hex");
      console.log(`   Ethereum order hash: ${ethereumOrderHash}`);
    } catch (error) {
      console.log(`   ❌ Error getting order hash: ${error.message}`);
    }

    console.log("\n🔍 VALIDATION CHECKLIST:");
    console.log("─".repeat(25));
    console.log(`✅ Quote ID: ${quote.quoteId ? "Valid" : "Invalid"}`);
    console.log(`✅ Secrets: ${secrets.length} generated`);
    console.log(`✅ Hash lock: Created`);
    console.log(`✅ Order: Created`);
    console.log(`✅ Receiver: ${receiverAddress}`);

    console.log("\n💡 CONCLUSION:");
    console.log("─".repeat(15));
    console.log("Order creation process appears correct.");
    console.log("If orders still get refunded, the issue might be:");
    console.log("1. Network timing during announceOrder()");
    console.log("2. Receiver address validation on 1inch side");
    console.log("3. Gas estimation issues");
    console.log("4. Cross-chain bridge problems");
  } catch (error) {
    console.error("❌ Error in order creation:", error.message);
    console.log("\nThis error might explain the refunds!");

    if (error.stack) {
      console.log("\nStack trace:");
      console.log(error.stack.split("\n").slice(0, 5).join("\n"));
    }
  }
}

testOrderCreation().catch(console.error);
