import { config } from "dotenv";

config();

async function analyzeRefundTransaction() {
  console.log("🔍 ANALYZING REFUND TRANSACTION");
  console.log("═".repeat(50));

  const refundTxHash =
    "4pBaGiMXpFGUNpczYoTEjQ4rsqKEC6oxuCG2K8oMBh2YdNpg3NRqhnW9k6Uu9zkzS3N4rjunx5e88EYtnaPeFAyR";

  console.log(`📋 Transaction Hash: ${refundTxHash}`);
  console.log(`🔗 Solscan Link: https://solscan.io/tx/${refundTxHash}`);
  console.log("");

  // Try to get transaction details using Solana RPC
  const rpcUrl =
    process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

  console.log("🔍 FETCHING TRANSACTION DETAILS...");
  console.log("─".repeat(40));

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [
          refundTxHash,
          {
            encoding: "json",
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.log("❌ RPC Error:", data.error.message);
      console.log("\n💡 ALTERNATIVE INVESTIGATION:");
      console.log(
        "1. Check Solscan manually: https://solscan.io/tx/" + refundTxHash
      );
      console.log("2. Look for error messages in transaction logs");
      console.log("3. Check if transaction succeeded or failed");
      console.log("4. Examine program logs for specific error details");
      return;
    }

    if (!data.result) {
      console.log("❌ Transaction not found or still processing");
      return;
    }

    const tx = data.result;

    console.log("✅ TRANSACTION FOUND!");
    console.log("─".repeat(20));
    console.log(`Slot: ${tx.slot}`);
    console.log(`Block Time: ${new Date(tx.blockTime * 1000).toISOString()}`);
    console.log(`Fee: ${tx.meta.fee} lamports`);
    console.log(`Status: ${tx.meta.err ? "FAILED" : "SUCCESS"}`);

    if (tx.meta.err) {
      console.log(`Error: ${JSON.stringify(tx.meta.err, null, 2)}`);
    }

    // Check logs for error messages
    if (tx.meta.logMessages && tx.meta.logMessages.length > 0) {
      console.log("\n📝 TRANSACTION LOGS:");
      console.log("─".repeat(20));
      tx.meta.logMessages.forEach((log, i) => {
        console.log(`${i + 1}. ${log}`);
      });

      // Look for specific error patterns
      const errorLogs = tx.meta.logMessages.filter(
        (log) =>
          log.includes("Error") ||
          log.includes("failed") ||
          log.includes("insufficient") ||
          log.includes("slippage") ||
          log.includes("timeout")
      );

      if (errorLogs.length > 0) {
        console.log("\n🚨 ERROR LOGS FOUND:");
        console.log("─".repeat(20));
        errorLogs.forEach((errorLog, i) => {
          console.log(`${i + 1}. ${errorLog}`);
        });
      }
    }

    // Check account changes
    if (tx.meta.preBalances && tx.meta.postBalances) {
      console.log("\n💰 BALANCE CHANGES:");
      console.log("─".repeat(20));
      for (let i = 0; i < tx.meta.preBalances.length; i++) {
        const change = tx.meta.postBalances[i] - tx.meta.preBalances[i];
        if (change !== 0) {
          console.log(
            `Account ${i}: ${change > 0 ? "+" : ""}${change / 1e9} SOL`
          );
        }
      }
    }
  } catch (error) {
    console.log("❌ Error fetching transaction:", error.message);
  }

  console.log("\n💡 ANALYSIS CHECKLIST:");
  console.log("─".repeat(25));
  console.log("1. 🔍 Check Solscan for detailed view");
  console.log("2. 📝 Look for program error messages");
  console.log("3. 💰 Check if SOL was refunded");
  console.log("4. ⏰ Note the timing (when refund occurred)");
  console.log("5. 🔧 Identify specific failure reason");

  console.log("\n🎯 COMMON REFUND REASONS:");
  console.log("─".repeat(25));
  console.log("• Slippage tolerance exceeded");
  console.log("• Insufficient liquidity on destination");
  console.log("• Gas price spike making order unprofitable");
  console.log("• Network congestion timeout");
  console.log("• Resolver competition (order filled by another)");
  console.log("• Bridge/cross-chain issues");
}

analyzeRefundTransaction().catch(console.error);
