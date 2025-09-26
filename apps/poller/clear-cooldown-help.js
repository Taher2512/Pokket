console.log("🔄 MANUAL COOLDOWN CLEARING");
console.log("═".repeat(50));

console.log("⚠️  IMPORTANT: Cooldown clearing is for testing only!");
console.log("");
console.log("🔧 TO CLEAR COOLDOWN:");
console.log("─".repeat(40));
console.log("1. Add clearAllCooldowns() method call to your poller");
console.log("2. Or restart the poller (cooldowns are in-memory)");
console.log("3. Or modify the cooldown time temporarily");

console.log("\n🚀 EASIEST METHOD - RESTART POLLER:");
console.log("─".repeat(40));
console.log("1. Stop current poller: Ctrl+C");
console.log("2. Start poller again: bun run start");
console.log("3. Cooldown will be cleared (in-memory only)");
console.log("4. New swap will trigger immediately");

console.log("\n📊 YOUR OPTIONS:");
console.log("─".repeat(40));
console.log("A) Wait 59 minutes for natural cooldown expiry");
console.log("B) Restart poller to clear cooldown");
console.log("C) Temporarily reduce COOLDOWN_MINUTES for testing");

console.log("\n✅ RECOMMENDATION:");
console.log("─".repeat(40));
console.log("Restart your poller to test the secret submission fix!");
console.log("The improved monitoring should now work correctly.");

console.log("\n" + "═".repeat(50));
