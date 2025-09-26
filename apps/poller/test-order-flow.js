#!/usr/bin/env bun

import { NetworkEnum, SDK, HashLock, EvmAddress } from "@1inch/cross-chain-sdk";
import { add0x } from "@1inch/byte-utils";
import { randomBytes } from "node:crypto";
import { config } from "dotenv";

config({ path: ".env" });

async function testOrderCreation() {
  try {
    console.log("Testing order creation with exact flow...\n");

    // Debug environment
    console.log(
      "API Key loaded:",
      process.env.DEV_PORTAL_API_KEY ? "YES" : "NO"
    );
    console.log("API Key length:", process.env.DEV_PORTAL_API_KEY?.length || 0);

    // Initialize SDK
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

    // Test parameters
    const srcChainId = NetworkEnum.SOLANA;
    const dstChainId = NetworkEnum.ETHEREUM;
    const srcTokenAddress = "So11111111111111111111111111111111111111112"; // Wrapped SOL
    const dstTokenAddress = "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8"; // PYUSD from .env
    const amount = "40000000"; // 0.04 SOL
    const walletAddress = "AxdSy4MG7wjzWFQh1SVZE7nLtyHqfQSZk2CKtJZTZGT1";
    const dstWalletAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

    console.log("1. Getting quote...");
    const quote = await sdk.getQuote({
      srcChainId,
      dstChainId,
      srcTokenAddress,
      dstTokenAddress,
      amount,
      enableEstimate: true,
      walletAddress,
      receiver: dstWalletAddress,
    });

    console.log("✅ Quote received, ID:", quote.quoteId);

    // Generate secrets and hash
    const secrets = [add0x(randomBytes(32).toString("hex"))];
    console.log("2. Generated secret:", secrets[0]);

    const secretHashes = secrets.map(HashLock.hashSecret);
    console.log("3. Generated secret hash:", secretHashes[0]);

    const hashLock = HashLock.forSingleFill(secrets[0]);
    console.log("4. Created HashLock, value:", hashLock.value);

    // Test order creation - this is where the error might occur
    console.log("5. Creating order...");

    const order = await sdk.createOrder(quote, {
      hashLock,
      secretHashes,
      secrets,
      receiver: EvmAddress.fromString(
        "0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711"
      ),
    });

    console.log("✅ Order created successfully:", order.hash);
  } catch (error) {
    console.error("Order creation test failed:", error);
    console.error("Stack trace:", error.stack);
  }
}

testOrderCreation();
