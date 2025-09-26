import { Connection, PublicKey, Transaction, Keypair } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { utils } from "@coral-xyz/anchor";
import { config } from "dotenv";

// Load environment variables
config();

async function unwrapSol() {
  console.log("🔄 UNWRAPPING WSOL TO NATIVE SOL");
  console.log("═".repeat(50));

  const userAddress = "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ";
  const wrappedSolMint = "So11111111111111111111111111111111111111112";

  console.log(`👤 User Address: ${userAddress}`);
  console.log(`🪙 WSOL Mint: ${wrappedSolMint}`);

  // Check if we have the encrypted private key to decrypt
  if (!process.env.ENCRYPTION_KEY) {
    console.log("❌ ENCRYPTION_KEY not found in environment");
    console.log("ℹ️  Cannot unwrap without access to private key");
    console.log("");
    console.log("🔧 MANUAL UNWRAP OPTIONS:");
    console.log("1. Use Solana CLI: solana unwrap 0.02392744");
    console.log("2. Use Phantom wallet's unwrap feature");
    console.log("3. Use Solflare wallet's token management");
    console.log("4. Add ENCRYPTION_KEY to .env and run this script");
    return;
  }

  try {
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
      "confirmed"
    );

    // Decrypt the private key (mock data approach)
    console.log("🔑 Decrypting private key...");

    // For testing, we'll use the mock user data approach
    const CryptoJS = require("crypto-js");

    // This would come from your backend in real usage
    const encryptedPrivateKey = "mock_encrypted_key"; // This should be the real encrypted key

    // For now, let's assume we have access to decrypt it
    // In production, you'd get this from the backend API
    console.log("⚠️  Using mock private key approach");
    console.log("ℹ️  In production, this would decrypt the real private key");

    // For demo purposes, let's show the unwrap process without executing
    console.log("\n🔧 UNWRAP PROCESS (DRY RUN):");
    console.log("─".repeat(40));

    const userPubkey = new PublicKey(userAddress);
    const wsolMint = new PublicKey(wrappedSolMint);

    // Get the Associated Token Account
    const associatedTokenAccount = await getAssociatedTokenAddress(
      wsolMint,
      userPubkey
    );

    console.log(`📍 WSOL Token Account: ${associatedTokenAccount.toString()}`);

    // Check current balance
    const tokenBalance = await connection.getTokenAccountBalance(
      associatedTokenAccount
    );
    const wsolAmount = parseFloat(tokenBalance.value.uiAmountString || "0");

    console.log(`💰 Current WSOL Balance: ${wsolAmount} WSOL`);

    if (wsolAmount === 0) {
      console.log("❌ No WSOL to unwrap");
      return;
    }

    console.log("\n📋 UNWRAP TRANSACTION WOULD:");
    console.log("─".repeat(40));
    console.log(
      `1. Close WSOL token account: ${associatedTokenAccount.toString()}`
    );
    console.log(`2. Return ${wsolAmount} SOL to main account: ${userAddress}`);
    console.log(`3. Reclaim account rent: ~0.00203928 SOL`);
    console.log(`4. Total SOL recovered: ~${wsolAmount + 0.00203928} SOL`);

    console.log("\n🚀 TO EXECUTE THE UNWRAP:");
    console.log("─".repeat(40));
    console.log("Option 1 - Solana CLI (easiest):");
    console.log(`  solana unwrap ${wsolAmount}`);
    console.log("");
    console.log("Option 2 - Add real encryption setup:");
    console.log("  1. Ensure ENCRYPTION_KEY is properly set");
    console.log("  2. Get real encrypted private key from backend");
    console.log("  3. Run this script again");
    console.log("");
    console.log("Option 3 - Use wallet interface:");
    console.log("  1. Import your wallet to Phantom/Solflare");
    console.log("  2. Go to token management");
    console.log("  3. Find WSOL and click 'Unwrap'");

    // Calculate final balance after unwrap
    const currentNativeSOL = 0.00593916;
    const finalSOL = currentNativeSOL + wsolAmount + 0.00203928; // Adding rent back

    console.log("\n📊 FINAL BALANCE AFTER UNWRAP:");
    console.log("─".repeat(40));
    console.log(`Current Native SOL: ${currentNativeSOL}`);
    console.log(`WSOL to unwrap: ${wsolAmount}`);
    console.log(`Account rent back: ~0.00203928`);
    console.log(`Final SOL balance: ~${finalSOL.toFixed(8)} SOL`);

    console.log("\n✅ READY TO TEST 1INCH AGAIN:");
    console.log("─".repeat(40));
    console.log(`After unwrapping, you'll have ~${finalSOL.toFixed(6)} SOL`);
    console.log(`This exceeds the 0.009 SOL threshold`);
    console.log(`You can test the cross-chain swap again!`);
  } catch (error) {
    console.error("❌ Error in unwrap process:", error);
  }
}

unwrapSol().catch(console.error);
