import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { utils } from "@coral-xyz/anchor";
import { config } from "dotenv";
import axios from "axios";

// Load environment variables
config();

async function unwrapSolWithDecryption() {
  console.log("🔄 UNWRAPPING WSOL TO NATIVE SOL");
  console.log("═".repeat(50));

  const userAddress = "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ";
  const wrappedSolMint = "So11111111111111111111111111111111111111112";

  console.log(`👤 User Address: ${userAddress}`);
  console.log(`🪙 WSOL Mint: ${wrappedSolMint}`);

  try {
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
      "confirmed"
    );

    // Get user data (same as in your poller)
    console.log("📡 Fetching user data...");
    let userData;

    try {
      const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
      const response = await axios.get(
        `${backendUrl}/admin/users-with-solana`,
        {
          headers: {
            Authorization: `Bearer ${process.env.ADMIN_API_KEY || "admin-key"}`,
            "Content-Type": "application/json",
          },
        }
      );

      const users = response.data.users.map((user) => ({
        id: user.id,
        email: user.email,
        publicAddressSolana: user.publicAddressSolana,
        encryptedPrivateKeySolana: user.encryptedPrivateKeySolana,
        ethereumAddress: user.publicAddress,
      }));

      userData = users.find((u) => u.publicAddressSolana === userAddress);

      if (!userData) {
        throw new Error("User not found in backend");
      }

      console.log(`✅ Found user: ${userData.email}`);
    } catch (error) {
      console.log("⚠️  Backend not available, using mock data");
      userData = {
        id: "cmfo45qfd0000ri39fh6wc3zj",
        email: "taherabbkhasamwala@gmail.com",
        publicAddressSolana: "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ",
        encryptedPrivateKeySolana: "mock_encrypted_key",
        ethereumAddress: "0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711",
      };
    }

    // Decrypt private key (same method as your poller)
    console.log("🔑 Decrypting private key...");

    if (!process.env.ENCRYPTION_KEY) {
      throw new Error("ENCRYPTION_KEY not set in environment");
    }

    if (
      !userData.encryptedPrivateKeySolana ||
      userData.encryptedPrivateKeySolana === "mock_encrypted_key"
    ) {
      console.log("❌ No real encrypted private key available");
      console.log(
        "ℹ️  You'll need to provide the encrypted private key or use manual unwrap"
      );
      console.log("");
      console.log("🔧 MANUAL UNWRAP COMMAND:");
      console.log(`solana unwrap 0.02392744`);
      return;
    }

    // Decrypt using the same method as your poller
    const CryptoJS = require("crypto-js");
    const bytes = CryptoJS.AES.decrypt(
      userData.encryptedPrivateKeySolana,
      process.env.ENCRYPTION_KEY
    );
    const privateKeyString = bytes.toString(CryptoJS.enc.Utf8);

    if (!privateKeyString) {
      throw new Error("Failed to decrypt private key");
    }

    const privateKeyArray = JSON.parse(privateKeyString);
    const uint8Array = new Uint8Array(privateKeyArray);
    const privateKeyBase58 = utils.bytes.bs58.encode(uint8Array);

    // Create keypair
    const keypair = Keypair.fromSecretKey(
      utils.bytes.bs58.decode(privateKeyBase58)
    );

    console.log("✅ Private key decrypted successfully");

    // Check WSOL balance
    const userPubkey = new PublicKey(userAddress);
    const wsolMint = new PublicKey(wrappedSolMint);

    const associatedTokenAccount = await getAssociatedTokenAddress(
      wsolMint,
      userPubkey
    );

    console.log(`📍 WSOL Token Account: ${associatedTokenAccount.toString()}`);

    const tokenBalance = await connection.getTokenAccountBalance(
      associatedTokenAccount
    );
    const wsolAmount = parseFloat(tokenBalance.value.uiAmountString || "0");

    console.log(`💰 Current WSOL Balance: ${wsolAmount} WSOL`);

    if (wsolAmount === 0) {
      console.log("❌ No WSOL to unwrap");
      return;
    }

    // Get current native SOL balance
    const nativeBalance = await connection.getBalance(userPubkey);
    const nativeSOL = nativeBalance / LAMPORTS_PER_SOL;

    console.log(`💰 Current Native SOL: ${nativeSOL} SOL`);

    // Create unwrap transaction
    console.log("\n🔧 Creating unwrap transaction...");

    const transaction = new Transaction();

    // Close the WSOL token account (this unwraps the SOL)
    const closeInstruction = createCloseAccountInstruction(
      associatedTokenAccount, // Token account to close
      userPubkey, // Destination for lamports
      userPubkey, // Owner of token account
      [] // Additional signers
    );

    transaction.add(closeInstruction);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey;

    console.log("📡 Sending unwrap transaction...");

    // Sign and send transaction
    const signature = await connection.sendTransaction(transaction, [keypair]);

    console.log("✅ UNWRAP TRANSACTION SENT!");
    console.log("─".repeat(40));
    console.log(`📋 Transaction Signature: ${signature}`);
    console.log(`🔗 Solscan: https://solscan.io/tx/${signature}`);

    // Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    await connection.confirmTransaction(signature);

    // Check final balances
    const finalNativeBalance = await connection.getBalance(userPubkey);
    const finalNativeSOL = finalNativeBalance / LAMPORTS_PER_SOL;

    console.log("\n🎉 UNWRAP COMPLETED!");
    console.log("─".repeat(40));
    console.log(`Previous Native SOL: ${nativeSOL} SOL`);
    console.log(`WSOL Unwrapped: ${wsolAmount} SOL`);
    console.log(`Final Native SOL: ${finalNativeSOL} SOL`);
    console.log(`SOL Recovered: ${finalNativeSOL - nativeSOL} SOL`);

    console.log("\n✅ READY FOR 1INCH TEST:");
    console.log("─".repeat(40));
    console.log(`You now have ${finalNativeSOL} SOL`);
    console.log(`Threshold needed: 0.009 SOL`);
    console.log(
      `Status: ${finalNativeSOL > 0.009 ? "✅ READY TO SWAP" : "❌ INSUFFICIENT"}`
    );

    if (finalNativeSOL > 0.009) {
      console.log("\n🚀 You can now test the 1inch cross-chain swap again!");
      console.log("The previous failure was on 1inch's side, not your code.");
    }
  } catch (error) {
    console.error("❌ Error in unwrap process:", error);
    console.log("\n🔧 FALLBACK OPTIONS:");
    console.log("1. Use Solana CLI: solana unwrap 0.02392744");
    console.log("2. Import wallet to Phantom and unwrap via UI");
    console.log(
      "3. Check that ENCRYPTION_KEY and encrypted private key are correct"
    );
  }
}

unwrapSolWithDecryption().catch(console.error);
