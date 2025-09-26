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
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import axios from "axios";
import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import { setTimeout } from "timers/promises";

import { add0x } from "@1inch/byte-utils";
import { parseUnits } from "viem";
import { utils, web3 } from "@coral-xyz/anchor";
import {
  NetworkEnum,
  SDK,
  SolanaAddress,
  HashLock,
  EvmAddress,
  SvmSrcEscrowFactory,
  Quote,
  type ReadyToAcceptSecretFill,
  type OrderStatusResponse,
} from "@1inch/cross-chain-sdk";

// Load environment variables
config();

interface UserSolanaData {
  id: string;
  email: string;
  publicAddressSolana: string;
  encryptedPrivateKeySolana?: string;
  ethereumAddress?: string;
}

interface SolanaBalance {
  address: string;
  balance: number;
  balanceSOL: number;
  lamports: number;
}

interface SwapConfig {
  minSolBalance: number;
  devPortalApiKey: string;
  sdkUrl: string;
  solTokenAddress: string;
  usdcEthereumAddress: string; // CHANGED: Use USDC instead of PYUSD
  srcChainId: number;
  dstChainId: number;
  pollInterval: number;
}

class TestLiquiditySwapService {
  private sdk: SDK;
  private config: SwapConfig;
  private readonly COOLDOWN_MINUTES = 60;
  private recentSwaps = new Map<string, number>();

  constructor(config: SwapConfig) {
    this.config = config;

    this.sdk = new SDK({
      url: config.sdkUrl,
      authKey: config.devPortalApiKey,
    });

    console.log("🧪 Test Liquidity Swap Service initialized");
    console.log("🔄 Testing SOL → USDC instead of SOL → PYUSD");
    console.log("💡 This will help identify if PYUSD liquidity is the issue");
  }

  private generateSecrets(count: number): string[] {
    return Array.from({ length: count }, () => {
      const buffer = randomBytes(32);
      return add0x(buffer.toString("hex"));
    });
  }

  private createHashLock(secrets: string[]): HashLock {
    const hashLock = new HashLock();
    secrets.forEach((secret) => hashLock.addSecret(secret));
    return hashLock;
  }

  private async getQuote(amount: bigint, makerAddress: string): Promise<Quote> {
    console.log("📊 Fetching quote for SOL → USDC cross-chain swap...");

    const srcToken = SolanaAddress.fromString(this.config.solTokenAddress);
    const dstToken = EvmAddress.fromString(this.config.usdcEthereumAddress);

    const quote = await this.sdk.getQuote({
      amount: amount.toString(),
      srcChainId: this.config.srcChainId,
      dstChainId: this.config.dstChainId,
      srcTokenAddress: srcToken.toString(),
      dstTokenAddress: dstToken.toString(),
      enableEstimate: true,
      walletAddress: makerAddress,
    });

    console.log("✅ Quote received successfully");
    console.log(
      `💰 SOL → USDC rate: 1 SOL = ${(parseFloat(quote.dstTokenAmount) / parseFloat(quote.srcTokenAmount)).toFixed(4)} USDC`
    );
    return quote;
  }

  private async createAndSubmitOrder(
    quote: Quote,
    privateKey: string,
    receiverAddress: string,
    balance: SolanaBalance,
    lamportsToWrap: number
  ): Promise<{ orderHash: string; secrets: string[] }> {
    console.log("📝 Creating SOL → USDC cross-chain order...");

    const preset = quote.getPreset(quote.recommendedPreset);
    const secrets = this.generateSecrets(preset.secretsCount);
    const secretHashes = secrets.map(HashLock.hashSecret);
    const hashLock = this.createHashLock(secrets);

    const order = quote.createSolanaOrder({
      hashLock,
      receiver: EvmAddress.fromString(receiverAddress),
      preset: quote.recommendedPreset,
    });

    console.log("📡 Announcing SOL → USDC order to relayer...");

    const txHash = await this.sdk.announceOrder(
      order,
      quote.quoteId!,
      secretHashes
    );

    let ethereumOrderHash = "N/A";
    try {
      const hashBuffer = (order as any).getOrderHashBuffer();
      ethereumOrderHash = "0x" + hashBuffer.toString("hex");
    } catch (error) {
      console.log("⚠️  Could not get Ethereum order hash buffer");
    }

    const orderHash = txHash;

    console.log("✅ SOL → USDC order announced successfully!");
    console.log("🟣 Solana Tx Hash:", txHash, `(${txHash.length} chars)`);
    console.log(
      "🟠 Ethereum Order Hash:",
      ethereumOrderHash,
      `(${ethereumOrderHash.length} chars)`
    );
    console.log(
      "🎯 Using Solana hash for monitoring:",
      orderHash,
      `(${orderHash.length} chars)`
    );
    console.log("💡 Testing if USDC has better liquidity than PYUSD");

    // Create and submit the Solana transaction
    const ix = SvmSrcEscrowFactory.DEFAULT.createOrder(order, {
      srcTokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID,
    });

    const makerSigner = Keypair.fromSecretKey(
      utils.bytes.bs58.decode(privateKey)
    );

    const connection = new web3.Connection(
      process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"
    );

    const wrappedSolMint = new PublicKey(
      process.env.SOL_TOKEN_ADDRESS ||
        "So11111111111111111111111111111111111111112"
    );

    const associatedTokenAccount = await getAssociatedTokenAddress(
      wrappedSolMint,
      makerSigner.publicKey
    );

    const accountInfo = await connection.getAccountInfo(associatedTokenAccount);
    const tx = new Transaction();

    if (!accountInfo) {
      console.log("🔧 Creating Associated Token Account for wrapped SOL...");
      const createATAInstruction = createAssociatedTokenAccountInstruction(
        makerSigner.publicKey,
        associatedTokenAccount,
        makerSigner.publicKey,
        wrappedSolMint
      );
      tx.add(createATAInstruction);
    }

    console.log(
      `🔄 Wrapping ${lamportsToWrap / LAMPORTS_PER_SOL} SOL (${lamportsToWrap} lamports)...`
    );
    console.log(`💰 Reserving SOL for 1inch protocol fees and ATA rent`);
    const transferToATAInstruction = SystemProgram.transfer({
      fromPubkey: makerSigner.publicKey,
      toPubkey: associatedTokenAccount,
      lamports: lamportsToWrap,
    });
    tx.add(transferToATAInstruction);

    const syncNativeInstruction = createSyncNativeInstruction(
      associatedTokenAccount
    );
    tx.add(syncNativeInstruction);

    tx.add({
      data: ix.data,
      programId: new web3.PublicKey(ix.programId.toBuffer()),
      keys: ix.accounts.map((a) => ({
        isSigner: a.isSigner,
        isWritable: a.isWritable,
        pubkey: new web3.PublicKey(a.pubkey.toBuffer()),
      })),
    });

    const result = await connection.sendTransaction(tx, [makerSigner]);
    console.log("✅ Solana transaction signature:", result);

    console.log("\n🔗 HASH SUMMARY:");
    console.log(
      "📋 1inch Order Hash:",
      orderHash,
      `(${orderHash.length} chars)`
    );
    console.log("🟣 Solana Tx Signature:", result, `(${result.length} chars)`);

    return { orderHash, secrets };
  }

  private async monitorAndSubmitSecrets(
    orderHash: string,
    secrets: string[]
  ): Promise<void> {
    console.log("👀 Starting to monitor SOL → USDC swap...");
    console.log(`🔑 Generated ${secrets.length} secrets for submission`);

    const POLL_INTERVAL = 5000;
    const MAX_MONITORING_TIME = 10 * 60 * 1000; // 10 minutes max
    const startTime = Date.now();

    await setTimeout(POLL_INTERVAL);

    const alreadyShared = new Set<number>();

    while (true) {
      try {
        if (Date.now() - startTime > MAX_MONITORING_TIME) {
          console.log("⏰ Monitoring timeout reached, stopping...");
          break;
        }

        const order: OrderStatusResponse =
          await this.sdk.getOrderStatus(orderHash);
        console.log(`📊 SOL → USDC order status: ${order.status}`);

        if (order.status === "executed") {
          console.log("🎉 SOL → USDC order is complete!");
          console.log("✅ SUCCESS! USDC liquidity is better than PYUSD!");
          return;
        } else if (
          order.status === "refunded" ||
          order.status === "cancelled" ||
          order.status === "expired"
        ) {
          console.log(`❌ SOL → USDC order ${order.status}`);
          if (order.status === "refunded") {
            console.log(
              "🤔 Even USDC order was refunded - deeper issue exists"
            );
          }
          return;
        }
      } catch (err) {
        console.error(`❌ Error while getting order status: ${err}`);
      }

      try {
        console.log("🔍 Checking for ready-to-accept secrets...");
        const readyToAcceptSecrets =
          await this.sdk.getReadyToAcceptSecretFills(orderHash);

        console.log(
          `📝 Found ${readyToAcceptSecrets.fills.length} fills ready for secrets`
        );

        const idxes = readyToAcceptSecrets.fills.map(
          (f: ReadyToAcceptSecretFill) => f.idx
        );

        for (const idx of idxes) {
          if (!alreadyShared.has(idx)) {
            try {
              const secret = secrets[idx];
              if (secret) {
                console.log(`🔑 Submitting secret for index ${idx}...`);
                await this.sdk.submitSecret(orderHash, secret);
                alreadyShared.add(idx);
                console.log("✅ Submitted secret for index:", idx);
              } else {
                console.error(`❌ No secret found for index ${idx}`);
              }
            } catch (err) {
              console.error(
                "❌ Failed to submit secret for index",
                idx,
                ":",
                err
              );
            }
          }
        }

        await setTimeout(POLL_INTERVAL);
        console.log("🔄 Polling for fills...");
      } catch (err) {
        console.error("❌ Error while monitoring fills:", err);
        await setTimeout(POLL_INTERVAL);
        console.log("🔄 Retrying after error...");
      }
    }
  }

  public async performTestSwap(
    user: UserSolanaData,
    balance: SolanaBalance,
    privateKey: string
  ): Promise<boolean> {
    try {
      console.log(`🧪 Starting SOL → USDC test swap for ${user.email}`);
      console.log(`💰 Swapping ${balance.balanceSOL} SOL to USDC on Ethereum`);

      const totalLamports = Math.floor(balance.balanceSOL * LAMPORTS_PER_SOL);
      const oneinchProtocolRent = 2804880;
      const ataCreationRent = 2039280;
      const doubleATARent = ataCreationRent * 2;
      const transactionFees = 100000;
      const accountRentExemption = 1000000;
      const reserveForFeesAndRent =
        oneinchProtocolRent +
        doubleATARent +
        transactionFees +
        accountRentExemption;
      const lamportsToWrap = Math.max(0, totalLamports - reserveForFeesAndRent);
      const solToWrap = lamportsToWrap / LAMPORTS_PER_SOL;

      if (lamportsToWrap <= 0) {
        throw new Error(
          `Insufficient SOL balance for transaction fees. Need at least ${reserveForFeesAndRent / LAMPORTS_PER_SOL} SOL for fees and rent.`
        );
      }

      console.log(
        `📊 Will wrap ${solToWrap} SOL (${lamportsToWrap} lamports) after reserving ${reserveForFeesAndRent / LAMPORTS_PER_SOL} SOL for fees`
      );

      const minimumSwapSOL = 0.02;
      if (solToWrap < minimumSwapSOL) {
        throw new Error(
          `Swap amount too small: ${solToWrap} SOL. Minimum viable amount: ${minimumSwapSOL} SOL.`
        );
      }

      console.log(
        `✅ Swap amount ${solToWrap} SOL is above minimum ${minimumSwapSOL} SOL - economically viable!`
      );

      const amount = parseUnits(solToWrap.toString(), 9);

      const quote = await this.getQuote(amount, user.publicAddressSolana);
      const { orderHash, secrets } = await this.createAndSubmitOrder(
        quote,
        privateKey,
        user.ethereumAddress || user.publicAddressSolana,
        balance,
        lamportsToWrap
      );

      await this.monitorAndSubmitSecrets(orderHash, secrets);

      console.log(`🎉 SOL → USDC test swap completed for ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ SOL → USDC test swap failed for ${user.email}:`, error);
      return false;
    }
  }
}

// Test with USDC instead of PYUSD
async function runLiquidityTest() {
  console.log("🧪 LIQUIDITY TEST: SOL → USDC vs SOL → PYUSD");
  console.log("═".repeat(60));

  const testConfig: SwapConfig = {
    minSolBalance: 0.025,
    devPortalApiKey: process.env.DEV_PORTAL_API_KEY || "",
    sdkUrl: "https://api.1inch.dev/fusion-plus",
    solTokenAddress: "So11111111111111111111111111111111111111112",
    usdcEthereumAddress: "0xA0b86a33E6417c0cd2F020Dae067b0e7Ff3E7f14", // USDC on Ethereum
    srcChainId: 501, // Solana
    dstChainId: 1, // Ethereum
    pollInterval: 5000,
  };

  const testUser: UserSolanaData = {
    id: "test",
    email: "test@example.com",
    publicAddressSolana: "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ",
    ethereumAddress: "0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711",
  };

  // Check balance
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const pubkey = new PublicKey(testUser.publicAddressSolana);
  const lamports = await connection.getBalance(pubkey);
  const solBalance = lamports / LAMPORTS_PER_SOL;

  const balance: SolanaBalance = {
    address: testUser.publicAddressSolana,
    balance: lamports,
    balanceSOL: solBalance,
    lamports: lamports,
  };

  console.log(`💰 Current balance: ${solBalance} SOL`);

  if (solBalance < 0.025) {
    console.log("❌ Insufficient balance for test");
    return;
  }

  const swapService = new TestLiquiditySwapService(testConfig);
  const privateKey = process.env.SOLANA_PRIVATE_KEY || "";

  if (!privateKey) {
    console.log("❌ SOLANA_PRIVATE_KEY not found in environment");
    return;
  }

  console.log("🚀 Starting SOL → USDC test...");
  const success = await swapService.performTestSwap(
    testUser,
    balance,
    privateKey
  );

  if (success) {
    console.log("✅ SOL → USDC test completed - check if it executed!");
  } else {
    console.log("❌ SOL → USDC test failed - same issue persists");
  }
}

// Only run if this file is executed directly
if (import.meta.main) {
  runLiquidityTest().catch(console.error);
}
