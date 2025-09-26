#!/usr/bin/env bun

/**
 * Test script for cross-chain swap functionality
 * This script will test the swap process with a specific user from the database
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import axios from "axios";
import { config } from "dotenv";

// Load environment variables
config();

interface TestUser {
  id: string;
  email: string;
  publicAddressSolana: string;
  publicAddress: string;
}

class SwapTester {
  private connection: Connection;
  private backendUrl: string;

  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
      "confirmed"
    );
    this.backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

    console.log("🧪 Cross-Chain Swap Tester initialized");
    console.log(`📡 Connected to: ${this.connection.rpcEndpoint}`);
  }

  /**
   * Fetch a test user from the backend
   */
  private async getTestUser(): Promise<TestUser | null> {
    try {
      console.log("👤 Fetching test user from backend...");

      const response = await axios.get(
        `${this.backendUrl}/admin/users-with-solana`,
        {
          headers: {
            Authorization: `Bearer ${process.env.ADMIN_API_KEY || "admin-key"}`,
            "Content-Type": "application/json",
          },
        }
      );

      const users = response.data.users;

      if (users.length === 0) {
        console.log("❌ No users with Solana addresses found in database");
        return null;
      }

      // Get the first user for testing
      const testUser = users[0];

      console.log(`✅ Test user found: ${testUser.email}`);
      console.log(`📍 Solana address: ${testUser.publicAddressSolana}`);
      console.log(`📍 Ethereum address: ${testUser.publicAddress}`);

      return {
        id: testUser.id,
        email: testUser.email,
        publicAddressSolana: testUser.publicAddressSolana,
        publicAddress: testUser.publicAddress,
      };
    } catch (error) {
      console.error("❌ Error fetching test user:", error);
      return null;
    }
  }

  /**
   * Check SOL balance for the test user
   */
  private async checkBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;

      console.log(`💰 Current SOL balance: ${balanceSOL.toFixed(6)} SOL`);
      console.log(`📊 Balance in lamports: ${balance}`);

      return balanceSOL;
    } catch (error) {
      console.error(`❌ Error checking balance:`, error);
      return 0;
    }
  }

  /**
   * Display test information and instructions
   */
  private displayTestInfo(user: TestUser, balance: number): void {
    const minBalance = parseFloat(process.env.MIN_SOL_BALANCE || "0.009");

    console.log("\n" + "=".repeat(60));
    console.log("🧪 CROSS-CHAIN SWAP TEST SETUP");
    console.log("=".repeat(60));
    console.log(`👤 Test User: ${user.email}`);
    console.log(`📧 User ID: ${user.id}`);
    console.log(`🟣 Solana Address: ${user.publicAddressSolana}`);
    console.log(`🔵 Ethereum Address: ${user.publicAddress}`);
    console.log(`💰 Current Balance: ${balance.toFixed(6)} SOL`);
    console.log(`🎯 Threshold: ${minBalance} SOL`);
    console.log(
      `🔄 Status: ${balance > minBalance ? "✅ READY FOR SWAP" : "❌ NEEDS MORE SOL"}`
    );

    if (balance <= minBalance) {
      console.log("\n📝 TO TEST THE SWAP:");
      console.log(
        `1. Send at least ${minBalance + 0.001} SOL to: ${user.publicAddressSolana}`
      );
      console.log("2. Wait a few seconds for confirmation");
      console.log(
        "3. The poller will automatically detect and trigger the swap"
      );
      console.log("4. SOL will be converted to PYUSD on Ethereum");
      console.log(`5. PYUSD will arrive at: ${user.publicAddress}`);
    } else {
      console.log("\n🚀 SWAP CONDITIONS MET!");
      console.log(
        "The poller should automatically trigger a swap when running."
      );
    }

    console.log("\n🔗 Useful Links:");
    console.log(
      `• Solana Explorer: https://solscan.io/account/${user.publicAddressSolana}`
    );
    console.log(
      `• Ethereum Explorer: https://etherscan.io/address/${user.publicAddress}`
    );
    console.log("=".repeat(60));
  }

  /**
   * Monitor balance changes
   */
  private async monitorBalance(
    address: string,
    duration: number = 60
  ): Promise<void> {
    console.log(`\n👀 Monitoring balance changes for ${duration} seconds...`);
    console.log("Press Ctrl+C to stop monitoring\n");

    let lastBalance = await this.checkBalance(address);
    const startTime = Date.now();

    const monitor = setInterval(async () => {
      const currentBalance = await this.checkBalance(address);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      if (currentBalance !== lastBalance) {
        console.log(
          `🔄 Balance changed! ${lastBalance.toFixed(6)} → ${currentBalance.toFixed(6)} SOL`
        );

        const minBalance = parseFloat(process.env.MIN_SOL_BALANCE || "0.009");
        if (currentBalance > minBalance) {
          console.log(
            "🚨 SWAP THRESHOLD REACHED! The poller should trigger a swap."
          );
        }

        lastBalance = currentBalance;
      }

      if (elapsed >= duration) {
        clearInterval(monitor);
        console.log(`⏰ Monitoring completed after ${duration} seconds`);
      }
    }, 5000); // Check every 5 seconds

    // Handle Ctrl+C
    process.on("SIGINT", () => {
      clearInterval(monitor);
      console.log("\n🛑 Monitoring stopped by user");
      process.exit(0);
    });
  }

  /**
   * Run the test
   */
  public async runTest(): Promise<void> {
    try {
      console.log("🚀 Starting Cross-Chain Swap Test\n");

      // Get test user
      const testUser = await this.getTestUser();
      if (!testUser) {
        console.log("❌ Cannot run test without a valid user");
        return;
      }

      // Check current balance
      const balance = await this.checkBalance(testUser.publicAddressSolana);

      // Display test information
      this.displayTestInfo(testUser, balance);

      // Ask if user wants to monitor
      console.log(
        "\n❓ Would you like to monitor balance changes? (This will help you see when SOL is received)"
      );
      console.log("Run with --monitor flag to enable monitoring");

      if (process.argv.includes("--monitor")) {
        await this.monitorBalance(testUser.publicAddressSolana);
      }
    } catch (error) {
      console.error("💥 Test failed:", error);
    }
  }
}

// Run the test
async function main() {
  const tester = new SwapTester();
  await tester.runTest();
}

main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
