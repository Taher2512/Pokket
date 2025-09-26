#!/usr/bin/env bun

import { Connection } from "@solana/web3.js";

async function checkTransactionLogs() {
  try {
    console.log("🔍 Checking transaction logs...\n");

    const connection = new Connection("https://api.mainnet-beta.solana.com");
    const txHash =
      "4b8eoiE4q8BpWd7B2tit124vrmiXVG2RwdnAmVABRXg9Kq8iE1rGaRr3Gj3hdyQMSiTCpssdwWY35W9zYpkaqgyh";

    console.log("Transaction:", txHash);
    console.log("Fetching transaction details...\n");

    // Get transaction with logs
    const tx = await connection.getTransaction(txHash, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    if (!tx) {
      console.log("❌ Transaction not found or not confirmed yet");
      console.log("This could mean:");
      console.log("1. Transaction is still being processed");
      console.log("2. Transaction hash is incorrect");
      console.log("3. Transaction failed and was dropped");
      return;
    }

    console.log("✅ Transaction found!");
    console.log("────────────────────────────────────────");
    console.log("Slot:", tx.slot);
    console.log("Block Time:", new Date(tx.blockTime * 1000).toISOString());
    console.log("Fee:", tx.meta?.fee, "lamports");
    console.log("Success:", tx.meta?.err === null ? "✅ SUCCESS" : "❌ FAILED");

    if (tx.meta?.err) {
      console.log("Error:", tx.meta.err);
    }

    console.log("\n📝 TRANSACTION LOGS:");
    console.log("────────────────────────────────────────");

    if (tx.meta?.logMessages && tx.meta.logMessages.length > 0) {
      tx.meta.logMessages.forEach((log, index) => {
        console.log(`${index + 1}: ${log}`);
      });
    } else {
      console.log("No logs found");
    }

    console.log("\n💰 BALANCE CHANGES:");
    console.log("────────────────────────────────────────");

    if (tx.meta?.preBalances && tx.meta?.postBalances) {
      tx.meta.preBalances.forEach((preBalance, index) => {
        const postBalance = tx.meta.postBalances[index];
        const change = postBalance - preBalance;

        // Handle different transaction message formats
        let accountKey = "Unknown Account";
        if (tx.transaction?.message?.accountKeys?.[index]) {
          accountKey = tx.transaction.message.accountKeys[index].toBase58();
        } else if (tx.transaction?.message?.staticAccountKeys?.[index]) {
          accountKey =
            tx.transaction.message.staticAccountKeys[index].toBase58();
        } else {
          accountKey = `Account ${index}`;
        }

        if (change !== 0) {
          console.log(
            `${accountKey}: ${change > 0 ? "+" : ""}${change / 1e9} SOL`
          );
        }
      });
    }

    console.log("\n🔍 ANALYSIS:");
    console.log("────────────────────────────────────────");

    if (tx.meta?.err === null) {
      console.log("✅ Transaction executed successfully");
      console.log("🔄 This suggests the swap is progressing normally");
      console.log('⏳ The order status shows "pending" which means:');
      console.log("   - Solana side executed successfully");
      console.log("   - Waiting for Ethereum side completion");
      console.log("   - Resolvers are processing the cross-chain transfer");
    } else {
      console.log("❌ Transaction failed on Solana");
      console.log("🚨 This indicates an issue with the initial swap setup");
    }
  } catch (error) {
    console.error("Error checking transaction:", error);
  }
}

checkTransactionLogs();
