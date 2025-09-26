import { config } from "dotenv";

config();

async function analyzeLatestRefund() {
  console.log("🔍 ANALYZING LATEST REFUND TRANSACTION");
  console.log("═".repeat(60));

  const refundTxHash =
    "4cjU1SwabLRTDNKojs8iNbVfkTRHvVg1j8kBCpDUyhFY3AeewjsshDzsseVGY8vcAAon1LS8mM5RXT2FCy8iWgaP";

  console.log(`📋 Refund TX: ${refundTxHash}`);
  console.log(`🔗 Solscan: https://solscan.io/tx/${refundTxHash}`);
  console.log("");

  // Fetch transaction details
  const rpcUrl =
    process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      return;
    }

    if (!data.result) {
      console.log("❌ Transaction not found");
      return;
    }

    const tx = data.result;

    console.log("✅ TRANSACTION ANALYSIS:");
    console.log("─".repeat(30));
    console.log(`Slot: ${tx.slot}`);
    console.log(`Block Time: ${new Date(tx.blockTime * 1000).toISOString()}`);
    console.log(`Fee: ${tx.meta.fee} lamports`);
    console.log(`Status: ${tx.meta.err ? "FAILED" : "SUCCESS"}`);

    if (tx.meta.err) {
      console.log(`Error: ${JSON.stringify(tx.meta.err, null, 2)}`);
    }

    // Analyze logs for specific error patterns
    if (tx.meta.logMessages) {
      console.log("\n📝 LOG ANALYSIS:");
      console.log("─".repeat(20));

      const errorPatterns = [
        { pattern: /insufficient/i, meaning: "Insufficient funds/liquidity" },
        { pattern: /slippage/i, meaning: "Slippage tolerance exceeded" },
        { pattern: /expired/i, meaning: "Order expired" },
        { pattern: /invalid/i, meaning: "Invalid parameters" },
        { pattern: /failed/i, meaning: "Transaction failed" },
        { pattern: /timeout/i, meaning: "Operation timed out" },
        { pattern: /rejected/i, meaning: "Order rejected" },
        { pattern: /cancelled/i, meaning: "Order cancelled" },
      ];

      let errorFound = false;

      tx.meta.logMessages.forEach((log, i) => {
        // Check for error patterns
        for (const { pattern, meaning } of errorPatterns) {
          if (pattern.test(log)) {
            console.log(`🚨 ERROR FOUND (Line ${i + 1}): ${log}`);
            console.log(`   → ${meaning}`);
            errorFound = true;
          }
        }

        // Also show program-specific logs
        if (log.includes("Program log:") && log.includes("Error")) {
          console.log(`⚠️  Program Error (Line ${i + 1}): ${log}`);
          errorFound = true;
        }
      });

      if (!errorFound) {
        console.log("🤔 No obvious error patterns found in logs");
        console.log("💡 This suggests the refund was due to external factors");
      }
    }

    // Check balance changes
    if (tx.meta.preBalances && tx.meta.postBalances) {
      console.log("\n💰 BALANCE CHANGES:");
      console.log("─".repeat(25));
      let refundDetected = false;

      for (let i = 0; i < tx.meta.preBalances.length; i++) {
        const change = tx.meta.postBalances[i] - tx.meta.preBalances[i];
        if (Math.abs(change) > 1000000) {
          // Only show significant changes (>0.001 SOL)
          const changeSOL = change / 1e9;
          console.log(
            `Account ${i}: ${changeSOL > 0 ? "+" : ""}${changeSOL.toFixed(6)} SOL`
          );

          if (changeSOL > 0.01) {
            // Significant refund
            refundDetected = true;
            console.log(
              `   ↳ 🔄 REFUND DETECTED: ${changeSOL.toFixed(6)} SOL returned`
            );
          }
        }
      }

      if (refundDetected) {
        console.log("✅ Refund mechanism worked correctly");
      }
    }

    console.log("\n🔍 COMPARISON WITH 1INCH.IO:");
    console.log("─".repeat(35));
    console.log("Key differences that could cause refunds:");
    console.log("1. 🔧 API vs Website: Different order routing");
    console.log("2. ⚙️  SDK Configuration: Wrong parameters");
    console.log("3. 🎯 Destination address: Invalid receiver");
    console.log("4. ⏰ Timing: Order expiration too short");
    console.log("5. 🔒 Hash lock: Secret generation issues");
    console.log("6. 💱 Slippage: Tolerance too tight");

    console.log("\n💡 NEXT INVESTIGATION STEPS:");
    console.log("─".repeat(30));
    console.log("1. Compare our order parameters with 1inch.io");
    console.log("2. Check if receiver address is valid");
    console.log("3. Verify preset configuration");
    console.log("4. Test with different slippage settings");
    console.log("5. Check order expiration time");
  } catch (error) {
    console.log("❌ Error analyzing transaction:", error.message);
  }
}

analyzeLatestRefund().catch(console.error);
