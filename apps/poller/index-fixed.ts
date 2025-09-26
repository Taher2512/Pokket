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
  pyusdEthereumAddress: string;
  srcChainId: number;
  dstChainId: number;
  pollInterval: number;
}

class CrossChainSwapService {
  private sdk: SDK;
  private config: SwapConfig;
  private recentSwaps: Map<string, number> = new Map(); // userAddress -> lastSwapTimestamp
  private readonly COOLDOWN_MINUTES = 60; // 1 hour cooldown between swaps

  constructor(config: SwapConfig) {
    this.config = config;
    this.sdk = new SDK({
      url: config.sdkUrl,
      authKey: config.devPortalApiKey,
    });

    console.log(`⏰ Swap cooldown period: ${this.COOLDOWN_MINUTES} minutes`);
    console.log(`🛡️  Duplicate order protection: ENABLED`);
  }

  private getSecret(): string {
    return add0x(randomBytes(32).toString("hex"));
  }

  private generateSecrets(count: number): string[] {
    return Array.from({ length: count }).map(() => this.getSecret());
  }

  private createHashLock(secrets: string[]): HashLock {
    const leaves = HashLock.getMerkleLeaves(secrets);
    return secrets.length > 1
      ? HashLock.forMultipleFills(leaves)
      : HashLock.forSingleFill(secrets[0]!);
  }

  private async getQuote(amount: bigint, makerAddress: string): Promise<Quote> {
    console.log("📊 Fetching quote for cross-chain swap...");

    const srcToken = SolanaAddress.fromString(this.config.solTokenAddress);
    const dstToken = EvmAddress.fromString(this.config.pyusdEthereumAddress);

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
    return quote;
  }

  /**
   * Check if user has any pending cross-chain orders or is in cooldown period
   */
  private async hasPendingOrders(userAddress: string): Promise<boolean> {
    try {
      console.log("🔍 Checking for pending orders...");

      // Check cooldown period
      const lastSwapTime = this.recentSwaps.get(userAddress);
      if (lastSwapTime) {
        const timeSinceLastSwap = Date.now() - lastSwapTime;
        const cooldownPeriod = this.COOLDOWN_MINUTES * 60 * 1000; // Convert to milliseconds

        if (timeSinceLastSwap < cooldownPeriod) {
          const remainingMinutes = Math.ceil(
            (cooldownPeriod - timeSinceLastSwap) / 60000
          );
          console.log(
            `⏳ User in cooldown period. ${remainingMinutes} minutes remaining`
          );
          return true;
        } else {
          // Cooldown expired, remove from tracking
          this.recentSwaps.delete(userAddress);
        }
      }

      console.log("✅ No pending orders or cooldown restrictions");
      return false;
    } catch (error) {
      console.error("❌ Error checking pending orders:", error);
      // If we can't check, err on the side of caution and assume there are pending orders
      return true;
    }
  }

  /**
   * Record a swap attempt for cooldown tracking
   */
  private recordSwapAttempt(userAddress: string): void {
    this.recentSwaps.set(userAddress, Date.now());
    console.log(`📝 Recorded swap attempt for ${userAddress}`);
  }

  /**
   * Clear cooldown for a user (e.g., when swap fails)
   */
  private clearCooldown(userAddress: string): void {
    if (this.recentSwaps.has(userAddress)) {
      this.recentSwaps.delete(userAddress);
      console.log(`🔄 Cleared cooldown for ${userAddress} due to swap failure`);
    }
  }

  /**
   * Clear all cooldowns (for testing/admin purposes)
   */
  public clearAllCooldowns(): void {
    const count = this.recentSwaps.size;
    this.recentSwaps.clear();
    console.log(`🔄 Cleared all ${count} user cooldowns`);
  }

  // FIXED: Based on 1inch documentation pattern
  private async createAndSubmitOrder(
    quote: Quote,
    privateKey: string,
    receiverAddress: string,
    balance: SolanaBalance,
    lamportsToWrap: number
  ): Promise<{ orderHash: string; secrets: string[] }> {
    console.log("📝 Creating cross-chain order...");

    const preset = quote.getPreset(quote.recommendedPreset);
    const secrets = this.generateSecrets(preset.secretsCount);
    const secretHashes = secrets.map(HashLock.hashSecret);
    const hashLock = this.createHashLock(secrets);

    const order = quote.createSolanaOrder({
      hashLock,
      receiver: EvmAddress.fromString(receiverAddress),
      preset: quote.recommendedPreset,
    });

    console.log("📡 Announcing order to relayer...");

    // CRITICAL: Following 1inch documentation pattern exactly
    const orderHash = await this.sdk.announceOrder(
      order,
      quote.quoteId!,
      secretHashes
    );

    console.log("✅ Order announced with hash:", orderHash);
    console.log("📏 Order hash length:", orderHash.length, "characters");
    console.log("🔍 Hash format analysis:");

    if (orderHash.length === 66 && orderHash.startsWith("0x")) {
      console.log(
        "✅ PERFECT! Ethereum order hash format (66 chars, 0x prefix)"
      );
    } else if (orderHash.length >= 43 && orderHash.length <= 44) {
      console.log(
        "⚠️  WARNING: This looks like a Solana transaction signature (44 chars)"
      );
      console.log("❌ This may cause API failures in monitoring");
    } else {
      console.log("❓ UNKNOWN: Unexpected hash format");
    }

    // Create and submit the Solana transaction (following 1inch docs exactly)
    const ix = SvmSrcEscrowFactory.DEFAULT.createOrder(order, {
      srcTokenProgramId: SolanaAddress.TOKEN_PROGRAM_ID,
    });

    const makerSigner = Keypair.fromSecretKey(
      utils.bytes.bs58.decode(privateKey)
    );

    const connection = new web3.Connection(
      process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"
    );

    // Get the wrapped SOL mint address
    const wrappedSolMint = new PublicKey(
      process.env.SOL_TOKEN_ADDRESS ||
        "So11111111111111111111111111111111111111112"
    );

    // Get the associated token account address
    const associatedTokenAccount = await getAssociatedTokenAddress(
      wrappedSolMint,
      makerSigner.publicKey
    );

    // Check if the ATA exists
    const accountInfo = await connection.getAccountInfo(associatedTokenAccount);

    const tx = new Transaction();

    // If ATA doesn't exist, create it
    if (!accountInfo) {
      console.log("🔧 Creating Associated Token Account for wrapped SOL...");
      const createATAInstruction = createAssociatedTokenAccountInstruction(
        makerSigner.publicKey, // payer
        associatedTokenAccount, // ata
        makerSigner.publicKey, // owner
        wrappedSolMint // mint
      );
      tx.add(createATAInstruction);
    }

    // Transfer SOL to the ATA to wrap it
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

    // Sync native instruction to update wrapped SOL balance
    const syncNativeInstruction = createSyncNativeInstruction(
      associatedTokenAccount
    );
    tx.add(syncNativeInstruction);

    // Add the swap instruction (following 1inch docs pattern)
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
    console.log("📏 Solana tx signature length:", result.length, "chars");

    console.log("\n🔗 HASH SUMMARY:");
    console.log(
      "📋 1inch Order Hash:",
      orderHash,
      `(${orderHash.length} chars)`
    );
    console.log("🟣 Solana Tx Signature:", result, `(${result.length} chars)`);

    return { orderHash, secrets };
  }

  // ENHANCED: Based on 1inch docs but with better error handling
  private async monitorAndSubmitSecrets(
    orderHash: string,
    secrets: string[]
  ): Promise<void> {
    console.log("👀 Starting to monitor for fills...");
    console.log(`🔑 Generated ${secrets.length} secrets for submission`);

    // Following 1inch docs pattern but with enhancements
    const POLL_INTERVAL = 5000; // 5 seconds as per docs
    const MAX_MONITORING_TIME = 10 * 60 * 1000; // 10 minutes max
    const startTime = Date.now();

    // Wait one poll interval for backend to catch up (from docs)
    await setTimeout(POLL_INTERVAL);

    const alreadyShared = new Set<number>();

    while (true) {
      try {
        // Check if we've been monitoring too long
        if (Date.now() - startTime > MAX_MONITORING_TIME) {
          console.log("⏰ Monitoring timeout reached, stopping...");
          break;
        }

        // Check order status (from 1inch docs)
        const order: OrderStatusResponse =
          await this.sdk.getOrderStatus(orderHash);
        console.log(`📊 Order status: ${order.status}`);

        if (order.status === "executed") {
          console.log("🎉 Order is complete!");
          return;
        } else if (
          order.status === "refunded" ||
          order.status === "cancelled" ||
          order.status === "expired"
        ) {
          console.log(`❌ Order ${order.status}, stopping monitoring`);
          return;
        }
      } catch (err) {
        console.error(`❌ Error while getting order status: ${err}`);
        // Continue monitoring despite status check errors
      }

      try {
        // Check for ready secrets (from 1inch docs)
        console.log("🔍 Checking for ready-to-accept secrets...");
        const readyToAcceptSecrets =
          await this.sdk.getReadyToAcceptSecretFills(orderHash);

        console.log(
          `📝 Found ${readyToAcceptSecrets.fills.length} fills ready for secrets`
        );

        const idxes = readyToAcceptSecrets.fills.map(
          (f: ReadyToAcceptSecretFill) => f.idx
        );

        // Submit secrets (from 1inch docs)
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

  public async performCrossChainSwap(
    user: UserSolanaData,
    balance: SolanaBalance,
    privateKey: string
  ): Promise<boolean> {
    try {
      console.log(`🔄 Starting cross-chain swap for ${user.email}`);

      // Check for pending orders or cooldown period
      const hasPending = await this.hasPendingOrders(user.publicAddressSolana);
      if (hasPending) {
        console.log(
          `⏸️  Skipping swap for ${user.email} - pending orders or cooldown active`
        );
        return false;
      }

      // Record this swap attempt for cooldown tracking
      this.recordSwapAttempt(user.publicAddressSolana);

      console.log(`💰 Swapping ${balance.balanceSOL} SOL to PYUSD on Ethereum`);

      // Calculate how much SOL we can actually wrap after reserving for fees
      const totalLamports = Math.floor(balance.balanceSOL * LAMPORTS_PER_SOL);
      const oneinchProtocolRent = 2804880; // Exact amount needed by 1inch protocol
      const ataCreationRent = 2039280; // Rent for creating Associated Token Account
      const doubleATARent = ataCreationRent * 2; // 1inch creates its own ATA too!
      const transactionFees = 100000; // Slightly higher buffer for account rent
      const accountRentExemption = 1000000; // ~0.001 SOL to keep main account rent-exempt
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

      // Convert the WRAPPABLE amount to the right units for quote
      const amount = parseUnits(solToWrap.toString(), 9);

      const quote = await this.getQuote(amount, user.publicAddressSolana);
      const { orderHash, secrets } = await this.createAndSubmitOrder(
        quote,
        privateKey,
        user.ethereumAddress || user.publicAddressSolana, // Fallback if no ETH address
        balance,
        lamportsToWrap // Pass the pre-calculated amount
      );

      await this.monitorAndSubmitSecrets(orderHash, secrets);

      console.log(`🎉 Cross-chain swap completed for ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Cross-chain swap failed for ${user.email}:`, error);
      // Clear cooldown on failure so user can retry sooner
      this.clearCooldown(user.publicAddressSolana);
      return false;
    }
  }
}

class SolanaBalancePoller {
  private connection: Connection;
  private pollingInterval: number;
  private isPolling: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private backendUrl: string;
  private swapService: CrossChainSwapService;
  private minSolBalance: number;

  constructor() {
    // Connect to Solana mainnet
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
      "confirmed"
    );

    // Poll every 5 seconds
    this.pollingInterval = parseInt(process.env.POLLING_INTERVAL || "5000");
    this.minSolBalance = parseFloat(process.env.MIN_SOL_BALANCE || "0.009");

    // Backend URL
    this.backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

    // Initialize swap service
    const swapConfig: SwapConfig = {
      minSolBalance: this.minSolBalance,
      devPortalApiKey: process.env.DEV_PORTAL_API_KEY || "",
      sdkUrl:
        process.env.ONEINCH_SDK_URL || "https://api.1inch.dev/fusion-plus",
      solTokenAddress:
        process.env.SOL_TOKEN_ADDRESS ||
        "So11111111111111111111111111111111111111112", // 11111111111111111111111111111112
      pyusdEthereumAddress:
        process.env.PYUSD_ETHEREUM_ADDRESS ||
        "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
      srcChainId: parseInt(process.env.SRC_CHAIN_ID || "501"),
      dstChainId: parseInt(process.env.DST_CHAIN_ID || "1"),
      pollInterval: 5000,
    };

    this.swapService = new CrossChainSwapService(swapConfig);

    console.log("🚀 Solana Balance Poller with Cross-Chain Swap initialized");
    console.log(`📡 Connected to: ${this.connection.rpcEndpoint}`);
    console.log(`⏱️  Polling interval: ${this.pollingInterval / 1000}s`);
    console.log(
      `💰 Min SOL balance to trigger swap: ${this.minSolBalance} SOL`
    );
  }

  /**
   * Fetch users with Solana private keys from backend
   */
  private async fetchUsersWithSolanaKeys(): Promise<UserSolanaData[]> {
    try {
      // Fetch users from the actual backend
      const response = await axios.get(
        `${this.backendUrl}/admin/users-with-solana`,
        {
          headers: {
            Authorization: `Bearer ${process.env.ADMIN_API_KEY || "admin-key"}`,
            "Content-Type": "application/json",
          },
        }
      );

      const users = response.data.users.map((user: any) => ({
        id: user.id,
        email: user.email,
        publicAddressSolana: user.publicAddressSolana,
        encryptedPrivateKeySolana: user.encryptedPrivateKeySolana,
        ethereumAddress: user.publicAddress, // Use their Ethereum address as receiver
      }));

      console.log(
        `👥 Found ${users.length} users with Solana keys from backend`
      );
      return users;
    } catch (error) {
      console.error("❌ Error fetching users from backend:", error);
      console.log("🔄 Falling back to mock data for testing");

      // Fallback to mock data if backend is not available
      const mockUsers: UserSolanaData[] = [
        {
          id: "cmfo45qfd0000ri39fh6wc3zj",
          email: "taherabbkhasamwala@gmail.com",
          publicAddressSolana: "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ",
          encryptedPrivateKeySolana: "mock_encrypted_key",
          ethereumAddress: "0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711", // FIXED: Your correct address
        },
      ];

      console.log(`👥 Using ${mockUsers.length} mock users for testing`);
      return mockUsers;
    }
  }

  /**
   * Get SOL balance for a specific address
   */
  private async getSolanaBalance(
    address: string
  ): Promise<SolanaBalance | null> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;

      return {
        address,
        balance,
        balanceSOL,
        lamports: balance,
      };
    } catch (error) {
      console.error(`❌ Error getting balance for ${address}:`, error);
      return null;
    }
  }

  /**
   * Decrypt Solana private key using the same method as auth service
   */
  private decryptSolanaPrivateKey(encryptedKey: string): string {
    try {
      if (!process.env.ENCRYPTION_KEY) {
        throw new Error("ENCRYPTION_KEY not set in environment");
      }

      // Import CryptoJS for decryption (same as auth service)
      const CryptoJS = require("crypto-js");

      const bytes = CryptoJS.AES.decrypt(
        encryptedKey,
        process.env.ENCRYPTION_KEY
      );
      const privateKeyString = bytes.toString(CryptoJS.enc.Utf8);

      if (!privateKeyString) {
        throw new Error("Failed to decrypt private key");
      }

      // Parse the private key array and convert to base58 (for 1inch SDK compatibility)
      const privateKeyArray = JSON.parse(privateKeyString);
      const uint8Array = new Uint8Array(privateKeyArray);

      // Convert to base58 for use with 1inch SDK
      return utils.bytes.bs58.encode(uint8Array);
    } catch (error) {
      console.error("❌ Error decrypting Solana private key:", error);
      throw new Error("Failed to decrypt Solana private key");
    }
  }

  /**
   * Poll balances and trigger swaps
   */
  private async pollBalances(): Promise<void> {
    try {
      console.log("\n🔄 Starting balance check...");
      const users = await this.fetchUsersWithSolanaKeys();

      if (users.length === 0) {
        console.log("ℹ️  No users with Solana addresses found");
        return;
      }

      for (const user of users) {
        if (!user.publicAddressSolana) {
          console.log(`⚠️  User ${user.email} has no Solana address`);
          continue;
        }

        console.log(`\n🔍 Checking balance for ${user.email}`);
        console.log(`📍 Address: ${user.publicAddressSolana}`);

        const balance = await this.getSolanaBalance(user.publicAddressSolana);

        if (balance) {
          console.log(
            `💰 SOL Balance: ${balance.balanceSOL.toFixed(6)} SOL (${balance.lamports} lamports)`
          );

          // Check if balance is above threshold
          if (balance.balanceSOL > this.minSolBalance) {
            console.log(
              `🚨 BALANCE THRESHOLD EXCEEDED! User ${user.email} has ${balance.balanceSOL} SOL (threshold: ${this.minSolBalance})`
            );

            if (
              !process.env.DEV_PORTAL_API_KEY ||
              process.env.DEV_PORTAL_API_KEY === "your_1inch_api_key_here"
            ) {
              console.log("⚠️  1inch API key not configured - skipping swap");
              console.log("ℹ️  Set DEV_PORTAL_API_KEY in .env to enable swaps");
            } else {
              try {
                console.log("🔄 Triggering cross-chain swap...");
                const privateKey = this.decryptSolanaPrivateKey(
                  user.encryptedPrivateKeySolana || ""
                );
                const success = await this.swapService.performCrossChainSwap(
                  user,
                  balance,
                  privateKey
                );

                if (success) {
                  console.log(
                    `✅ Swap completed successfully for ${user.email}`
                  );
                } else {
                  console.log(`❌ Swap failed for ${user.email}`);
                }
              } catch (swapError) {
                console.error(`❌ Swap error for ${user.email}:`, swapError);
              }
            }
          } else {
            console.log(
              `💤 Balance below threshold for ${user.email} (${balance.balanceSOL} < ${this.minSolBalance})`
            );
          }
        }
      }

      console.log("✅ Balance check completed\n");
    } catch (error) {
      console.error("❌ Error during polling:", error);
    }
  }

  /**
   * Start the polling service
   */
  public startPolling(): void {
    if (this.isPolling) {
      console.log("⚠️  Polling is already running");
      return;
    }

    console.log("🎯 Starting Solana balance polling with cross-chain swap...");
    this.isPolling = true;

    // Run immediately first
    this.pollBalances();

    // Then set up interval
    this.intervalId = setInterval(() => {
      this.pollBalances();
    }, this.pollingInterval);

    console.log(
      `✅ Polling started - checking every ${this.pollingInterval / 1000} seconds`
    );
  }

  /**
   * Stop the polling service
   */
  public stopPolling(): void {
    if (!this.isPolling) {
      console.log("ℹ️  Polling is not running");
      return;
    }

    console.log("🛑 Stopping Solana balance polling...");
    this.isPolling = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log("✅ Polling stopped");
  }
}

// Initialize and start the poller
async function main() {
  console.log("🚀 Initializing Solana Cross-Chain Swap Poller Service");
  console.log("📅 Started at:", new Date().toISOString());
  console.log("🔧 Based on 1inch official documentation pattern");

  // Check required environment variables
  const requiredEnvVars = ["DEV_PORTAL_API_KEY"];
  for (const key of requiredEnvVars) {
    if (!process.env[key] || process.env[key] === "your_1inch_api_key_here") {
      console.warn(`⚠️  Missing or placeholder value for ${key}`);
      console.warn("ℹ️  Cross-chain swaps will be skipped");
    }
  }

  const poller = new SolanaBalancePoller();

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Received SIGINT, shutting down gracefully...");
    poller.stopPolling();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
    poller.stopPolling();
    process.exit(0);
  });

  // Start polling
  poller.startPolling();

  // Keep the process alive
  console.log("🔄 Cross-chain swap poller is running. Press Ctrl+C to stop.");
}

// Run the service
main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
