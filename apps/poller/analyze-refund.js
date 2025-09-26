import { Connection, PublicKey } from "@solana/web3.js";

async function analyzeRefundTransaction() {
  console.log("🔍 ANALYZING SOLANA REFUND TRANSACTION");
  console.log("═".repeat(50));

  const connection = new Connection(
    "https://api.mainnet-beta.solana.com",
    "confirmed"
  );
  const refundTxSignature =
    "3bgkP1CEX3ZDFiCudusFtD8HLsfuqCvCaNf14kPtMoFgJAPu2zxHF8z7tKT6n61toDeWYRNBG1jWMv63zDaMqe9c";
  const userAddress = "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ";

  console.log(`📋 Refund TX: ${refundTxSignature}`);
  console.log(`👤 User Address: ${userAddress}`);
  console.log("");

  try {
    // Get transaction details
    const tx = await connection.getTransaction(refundTxSignature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      console.log("❌ Transaction not found");
      return;
    }

    console.log("✅ REFUND TRANSACTION DETAILS:");
    console.log("─".repeat(40));
    console.log(
      `Block Time: ${new Date((tx.blockTime || 0) * 1000).toISOString()}`
    );
    console.log(`Slot: ${tx.slot}`);
    console.log(
      `Fee: ${tx.meta?.fee} lamports (${(tx.meta?.fee || 0) / 1e9} SOL)`
    );

    // Analyze balance changes
    if (tx.meta?.preBalances && tx.meta?.postBalances) {
      console.log("\n💰 BALANCE CHANGES:");
      console.log("─".repeat(40));

      const userPubkey = new PublicKey(userAddress);
      const accountKeys =
        tx.transaction.message.staticAccountKeys ||
        tx.transaction.message.accountKeys;

      for (let i = 0; i < accountKeys.length; i++) {
        const account = accountKeys[i];
        const preBalance = tx.meta.preBalances[i];
        const postBalance = tx.meta.postBalances[i];
        const change = postBalance - preBalance;

        if (account.equals(userPubkey)) {
          console.log(`👤 User Account (${account.toString()}):`);
          console.log(
            `   Pre:  ${preBalance / 1e9} SOL (${preBalance} lamports)`
          );
          console.log(
            `   Post: ${postBalance / 1e9} SOL (${postBalance} lamports)`
          );
          console.log(
            `   Change: ${change > 0 ? "+" : ""}${change / 1e9} SOL (${change} lamports)`
          );
        } else if (Math.abs(change) > 0) {
          console.log(`🏦 Account ${i} (${account.toString()}):`);
          console.log(`   Pre:  ${preBalance / 1e9} SOL`);
          console.log(`   Post: ${postBalance / 1e9} SOL`);
          console.log(`   Change: ${change > 0 ? "+" : ""}${change / 1e9} SOL`);
        }
      }
    }

    // Check instruction logs
    if (tx.meta?.logMessages) {
      console.log("\n📝 TRANSACTION LOGS:");
      console.log("─".repeat(40));
      tx.meta.logMessages.forEach((log, i) => {
        console.log(`${i + 1}: ${log}`);
      });
    }
  } catch (error) {
    console.error("❌ Error fetching transaction:", error);
  }

  // Also check the original transaction to compare
  console.log("\n🔍 CHECKING ORIGINAL TRANSACTION:");
  console.log("─".repeat(40));

  const originalTxSignature = "6bhaXK29pGitS6mc3XkT8CdqUD9nEz1jfCmp8aP6B5Qz";

  try {
    const originalTx = await connection.getTransaction(originalTxSignature, {
      maxSupportedTransactionVersion: 0,
    });

    if (
      originalTx &&
      originalTx.meta?.preBalances &&
      originalTx.meta?.postBalances
    ) {
      const userPubkey = new PublicKey(userAddress);
      const accountKeys =
        originalTx.transaction.message.staticAccountKeys ||
        originalTx.transaction.message.accountKeys;

      for (let i = 0; i < accountKeys.length; i++) {
        const account = accountKeys[i];
        if (account.equals(userPubkey)) {
          const preBalance = originalTx.meta.preBalances[i];
          const postBalance = originalTx.meta.postBalances[i];
          const change = postBalance - preBalance;

          console.log(`👤 Original TX - User Balance Change:`);
          console.log(`   Pre:  ${preBalance / 1e9} SOL`);
          console.log(`   Post: ${postBalance / 1e9} SOL`);
          console.log(`   Change: ${change > 0 ? "+" : ""}${change / 1e9} SOL`);
          break;
        }
      }
    }
  } catch (error) {
    console.error("❌ Error fetching original transaction:", error);
  }

  // Calculate expected vs actual
  console.log("\n📊 REFUND ANALYSIS:");
  console.log("─".repeat(40));
  console.log("Expected scenario:");
  console.log("- Original balance: ~0.029 SOL");
  console.log("- Amount swapped: 0.023927440 SOL");
  console.log("- Should have left: ~0.005 SOL");
  console.log("- After refund: should be ~0.029 SOL again");
  console.log("");
  console.log("Actual result:");
  console.log("- Current balance: 0.00593916 SOL");
  console.log("- Missing: ~0.023 SOL");

  console.log("\n🔗 VERIFICATION LINKS:");
  console.log(`Original TX: https://solscan.io/tx/${originalTxSignature}`);
  console.log(`Refund TX: https://solscan.io/tx/${refundTxSignature}`);
  console.log(`Account: https://solscan.io/account/${userAddress}`);
}

analyzeRefundTransaction().catch(console.error);
