import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";

async function checkWrappedSolBalance() {
  console.log("🔍 CHECKING WRAPPED SOL (WSOL) BALANCE");
  console.log("═".repeat(50));

  const connection = new Connection(
    "https://api.mainnet-beta.solana.com",
    "confirmed"
  );
  const userAddress = "GJPWbnjeUR7yo61yMRLLGH7UPRTHZQEFPkFGbgn44eKQ";
  const wrappedSolMint = "So11111111111111111111111111111111111111112"; // WSOL mint address

  console.log(`👤 User Address: ${userAddress}`);
  console.log(`🪙 WSOL Mint: ${wrappedSolMint}`);
  console.log("");

  try {
    const userPubkey = new PublicKey(userAddress);
    const wsolMint = new PublicKey(wrappedSolMint);

    // Get the Associated Token Account address for WSOL
    const associatedTokenAccount = await getAssociatedTokenAddress(
      wsolMint,
      userPubkey
    );

    console.log(`🏦 WSOL Token Account: ${associatedTokenAccount.toString()}`);

    // Check if the ATA exists
    const accountInfo = await connection.getAccountInfo(associatedTokenAccount);

    if (!accountInfo) {
      console.log("❌ No Wrapped SOL token account found");
      console.log(
        "ℹ️  This means no WSOL tokens are held in associated token account"
      );
    } else {
      console.log("✅ Wrapped SOL token account exists!");

      // Get token balance
      const tokenBalance = await connection.getTokenAccountBalance(
        associatedTokenAccount
      );

      console.log("\n💰 WRAPPED SOL BALANCE:");
      console.log("─".repeat(40));
      console.log(`Amount: ${tokenBalance.value.amount} lamports`);
      console.log(`Decimals: ${tokenBalance.value.decimals}`);
      console.log(`UI Amount: ${tokenBalance.value.uiAmount} WSOL`);
      console.log(
        `UI Amount String: ${tokenBalance.value.uiAmountString} WSOL`
      );

      if (parseFloat(tokenBalance.value.uiAmountString || "0") > 0) {
        console.log("\n🎉 FOUND WRAPPED SOL!");
        console.log("This might be your missing SOL in wrapped form");
        console.log("You can unwrap it back to native SOL");
      } else {
        console.log("\n💤 No WSOL balance found");
      }
    }

    // Also check all token accounts for this user
    console.log("\n🔍 SCANNING ALL TOKEN ACCOUNTS:");
    console.log("─".repeat(40));

    const tokenAccounts = await connection.getTokenAccountsByOwner(userPubkey, {
      programId: TOKEN_PROGRAM_ID,
    });

    console.log(`Found ${tokenAccounts.value.length} token accounts:`);

    for (let i = 0; i < tokenAccounts.value.length; i++) {
      const tokenAccount = tokenAccounts.value[i];
      try {
        const balance = await connection.getTokenAccountBalance(
          tokenAccount.pubkey
        );
        const accountData = tokenAccount.account;

        // Parse the mint from account data (first 32 bytes after 4-byte discriminator)
        const mintBytes = accountData.data.slice(0, 32);
        const mint = new PublicKey(mintBytes).toString();

        console.log(`\n${i + 1}. Account: ${tokenAccount.pubkey.toString()}`);
        console.log(`   Mint: ${mint}`);
        console.log(`   Balance: ${balance.value.uiAmountString} tokens`);

        if (
          mint === wrappedSolMint &&
          parseFloat(balance.value.uiAmountString || "0") > 0
        ) {
          console.log(`   🎯 THIS IS WRAPPED SOL WITH BALANCE!`);
        }
      } catch (error) {
        console.log(`   ❌ Error reading account ${i + 1}: ${error}`);
      }
    }
  } catch (error) {
    console.error("❌ Error checking wrapped SOL:", error);
  }

  console.log("\n🔗 VERIFICATION LINKS:");
  console.log("─".repeat(40));
  console.log(`User Account: https://solscan.io/account/${userAddress}`);
  console.log(`WSOL Token: https://solscan.io/token/${wrappedSolMint}`);

  console.log("\n💡 NEXT STEPS IF WSOL FOUND:");
  console.log("─".repeat(40));
  console.log("1. Unwrap WSOL back to native SOL");
  console.log("2. Use Solana CLI: solana unwrap <amount>");
  console.log("3. Or use a wallet interface to unwrap");
}

checkWrappedSolBalance().catch(console.error);
