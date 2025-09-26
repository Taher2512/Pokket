// Clear cooldowns and test one swap
console.log("🔄 CLEARING COOLDOWNS AND TESTING SWAP");
console.log("═══════════════════════════════════════════");

// Since we can't import the service directly, let's trigger it via the main process
import { execSync } from "child_process";

try {
  console.log("🧹 Starting service to clear cooldowns...");
  console.log("📝 We need to run one actual swap to see the hash formats");
  console.log(
    "⏰ This will timeout after 30 seconds to avoid infinite running"
  );

  const result = execSync(
    "cd /Applications/Blockchain/Ethereum/tiplink-temp-mono/apps/poller && timeout 30 bun run index.ts",
    {
      encoding: "utf8",
      stdio: "pipe",
    }
  );

  console.log("📋 Output:", result);
} catch (error) {
  console.log("🔍 Captured output (timeout expected):");
  console.log(error.stdout || error.stderr || "No output captured");
}

console.log("\n🎯 Look for these lines in the output:");
console.log('- "✅ Order announced with 1inch hash:"');
console.log('- "📏 1inch order hash length:"');
console.log('- "✅ Solana transaction signature:"');
console.log('- "🔗 HASH SUMMARY:"');
