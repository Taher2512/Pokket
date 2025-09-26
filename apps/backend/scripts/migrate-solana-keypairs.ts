#!/usr/bin/env ts-node

/**
 * Migration script to generate Solana keypairs for existing users
 * Run this script once after deploying the Solana support feature
 */

import { AuthService } from "../services/auth";
import { DatabaseService } from "../services/database";

async function migrateSolanaKeypairs() {
  console.log("🚀 Starting Solana keypair migration...");

  const authService = new AuthService();
  const dbService = new DatabaseService();

  try {
    // Find all users without Solana keypairs
    const usersWithoutSolana = await dbService.findUsersWithoutSolanaKeypairs();

    console.log(
      `📊 Found ${usersWithoutSolana.length} users without Solana keypairs`
    );

    if (usersWithoutSolana.length === 0) {
      console.log("✅ All users already have Solana keypairs!");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each user
    for (const user of usersWithoutSolana) {
      try {
        console.log(`🔄 Processing user: ${user.email} (ID: ${user.id})`);

        // Generate Solana keypair if missing
        let encryptedPrivateKeySolana = user.encryptedPrivateKeySolana;
        let publicAddressSolana = user.publicAddressSolana;

        if (!encryptedPrivateKeySolana || !publicAddressSolana) {
          const solanaKeypair = authService.generateSolanaKeypair();
          encryptedPrivateKeySolana = solanaKeypair.encryptedPrivateKey;
          publicAddressSolana = solanaKeypair.publicKey;
        }

        // Update user with Solana keypair
        await dbService.updateUserWithSolanaKeypair(
          user.id,
          encryptedPrivateKeySolana,
          publicAddressSolana
        );

        console.log(
          `✅ Updated user ${user.email} with Solana address: ${publicAddressSolana}`
        );
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to update user ${user.email}:`, error);
        errorCount++;
      }
    }

    console.log("\n📈 Migration Summary:");
    console.log(`✅ Successfully updated: ${successCount} users`);
    console.log(`❌ Failed to update: ${errorCount} users`);
    console.log(`📊 Total processed: ${usersWithoutSolana.length} users`);

    if (errorCount === 0) {
      console.log("🎉 Migration completed successfully!");
    } else {
      console.log(
        "⚠️  Migration completed with some errors. Please check the logs above."
      );
    }
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  } finally {
    // Clean up database connection
    await dbService.disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateSolanaKeypairs()
    .then(() => {
      console.log("🏁 Migration script finished.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateSolanaKeypairs };
