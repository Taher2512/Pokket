#!/usr/bin/env bun

import { NetworkEnum, SDK, HashLock, EvmAddress } from "@1inch/cross-chain-sdk";
import { add0x } from "@1inch/byte-utils";
import { randomBytes } from "node:crypto";
import { config } from "dotenv";

config({ path: ".env" });

async function testExactMainCodeFlow() {
  try {
    console.log("Testing exact main code flow...\n");

    // Debug environment
    console.log(
      "API Key loaded:",
      process.env.DEV_PORTAL_API_KEY ? "YES" : "NO"
    );

    // Initialize SDK exactly like main code
    const sdk = new SDK({
      url: "https://api.1inch.dev/fusion-plus",
      authKey:
        process.env.DEV_PORTAL_API_KEY || "uCkP6lRIErVI26zzH0TKCKuMQUi9auzV",
      blockchainProvider: {
        [NetworkEnum.ETHEREUM]: {
          rpcUrl: "https://rpc.ankr.com/eth",
        },
        [NetworkEnum.SOLANA]: {
          rpcUrl: "https://api.mainnet-beta.solana.com",
        },
      },
    });

    // Test parameters matching main code
    const srcChainId = NetworkEnum.SOLANA;
    const dstChainId = NetworkEnum.ETHEREUM;
    const srcTokenAddress = "So11111111111111111111111111111111111111112"; // Wrapped SOL
    const dstTokenAddress = "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8"; // PYUSD from .env
    const amount = "40000000"; // 0.04 SOL
    const walletAddress = "AxdSy4MG7wjzWFQh1SVZE7nLtyHqfQSZk2CKtJZTZGT1";
    const receiverAddress = "0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711"; // Your Ethereum address

    console.log("1. Getting quote...");
    const quote = await sdk.getQuote({
      srcChainId,
      dstChainId,
      srcTokenAddress,
      dstTokenAddress,
      amount,
      enableEstimate: true,
      walletAddress,
      receiver: receiverAddress,
    });

    console.log("✅ Quote received, ID:", quote.quoteId);
    console.log("Quote preset:", quote.recommendedPreset);

    // Generate secrets exactly like main code
    const secrets = [add0x(randomBytes(32).toString("hex"))];
    console.log("2. Generated secret:", secrets[0]);

    const secretHashes = secrets.map(HashLock.hashSecret);
    console.log("3. Generated secret hash:", secretHashes[0]);

    const hashLock = HashLock.forSingleFill(secrets[0]);
    console.log("4. Created HashLock, value:", hashLock.value);

    // IMPORTANT: Use quote.createSolanaOrder() like main code, not sdk.createOrder()
    console.log("5. Creating Solana order using quote.createSolanaOrder()...");

    const order = quote.createSolanaOrder({
      hashLock,
      receiver: EvmAddress.fromString(receiverAddress),
      preset: quote.recommendedPreset,
    });

    console.log("✅ Order created successfully");
    console.log("Order details:", {
      hasHash: !!order.hash,
      hasOrder: !!order.order,
      orderType: typeof order.order,
    });

    // Try to get the order hash if possible
    try {
      console.log("Order hash:", order.hash);
    } catch (e) {
      console.log("Order hash error:", e.message);
    }

    console.log(
      "\n🎉 SUCCESS: Order creation process completed without the toLowerCase error!"
    );
  } catch (error) {
    console.error("Order creation test failed:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

testExactMainCodeFlow();
