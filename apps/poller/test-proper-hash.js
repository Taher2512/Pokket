// Quick script to trigger a single swap test with the fixed hash method
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Keypair,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
} from "@solana/spl-token";
import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import { add0x } from "@1inch/byte-utils";
import { parseUnits } from "viem";
import { utils, web3 } from "@coral-xyz/anchor";
import {
  SDK,
  SolanaAddress,
  HashLock,
  EvmAddress,
  SvmSrcEscrowFactory,
} from "@1inch/cross-chain-sdk";

config();

console.log("🧪 Testing Single Swap with FIXED Hash Method");
console.log("=" * 50);

function getSecret() {
  return add0x(randomBytes(32).toString("hex"));
}

async function testSingleSwap() {
  try {
    const sdk = new SDK({
      url: process.env.ONEINCH_SDK_URL || "https://api.1inch.dev/fusion-plus",
      authKey: process.env.DEV_PORTAL_API_KEY,
    });

    // Get current balance
    const connection = new Connection("https://api.mainnet-beta.solana.com");
    const userAddress = "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ";
    const balance = await connection.getBalance(new PublicKey(userAddress));
    const balanceSOL = balance / LAMPORTS_PER_SOL;

    console.log(`💰 Current balance: ${balanceSOL} SOL`);

    if (balanceSOL < 0.01) {
      console.log("❌ Insufficient balance for test");
      return;
    }

    // Calculate wrappable amount
    const totalLamports = Math.floor(balanceSOL * LAMPORTS_PER_SOL);
    const reserveForFeesAndRent = 8000000; // 0.008 SOL
    const lamportsToWrap = Math.max(0, totalLamports - reserveForFeesAndRent);
    const solToWrap = lamportsToWrap / LAMPORTS_PER_SOL;

    console.log(`📊 Will wrap ${solToWrap} SOL for swap`);

    // Get quote
    const srcToken = SolanaAddress.fromString(
      "So11111111111111111111111111111111111111112"
    );
    const dstToken = EvmAddress.fromString(
      "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8"
    );
    const amount = parseUnits(solToWrap.toString(), 9);

    const quote = await sdk.getQuote({
      amount: amount.toString(),
      srcChainId: 501,
      dstChainId: 1,
      srcTokenAddress: srcToken.toString(),
      dstTokenAddress: dstToken.toString(),
      enableEstimate: true,
      walletAddress: userAddress,
    });

    console.log("✅ Quote received");

    // Create order
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

    console.log("✅ Order created");

    // ANNOUNCE ORDER
    const txHash = await sdk.announceOrder(order, quote.quoteId, secretHashes);
    console.log("📋 announceOrder result:", txHash, `(${txHash.length} chars)`);

    // GET PROPER ORDER HASH
    const hashBuffer = order.getOrderHashBuffer();
    const properOrderHash = "0x" + hashBuffer.toString("hex");
    console.log(
      "📋 order.getOrderHashBuffer() as hex:",
      properOrderHash,
      `(${properOrderHash.length} chars)`
    );

    console.log("\n🔍 HASH COMPARISON:");
    console.log("🟣 Solana announceOrder result:", txHash);
    console.log("📋 Ethereum order hash:", properOrderHash);

    if (properOrderHash.length === 66 && properOrderHash.startsWith("0x")) {
      console.log(
        "🎉 PERFECT! We have the proper 66-character Ethereum order hash!"
      );
      console.log("✅ This should work for monitoring APIs!");

      // Test monitoring with the proper hash
      console.log("\n👀 Testing monitoring with proper hash...");

      try {
        const orderStatus = await sdk.getOrderStatus(properOrderHash);
        console.log(
          "✅ getOrderStatus with proper hash WORKED:",
          orderStatus.status
        );
      } catch (e) {
        console.log("❌ getOrderStatus with proper hash failed:", e.message);
      }

      try {
        const readySecrets =
          await sdk.getReadyToAcceptSecretFills(properOrderHash);
        console.log(
          "✅ getReadyToAcceptSecretFills with proper hash WORKED, found",
          readySecrets.fills.length,
          "fills"
        );
      } catch (e) {
        console.log(
          "❌ getReadyToAcceptSecretFills with proper hash failed:",
          e.message
        );
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testSingleSwap().catch(console.error);
