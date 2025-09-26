#!/usr/bin/env bun

import { SDK, HashLock } from "@1inch/cross-chain-sdk";
import { randomBytes } from "node:crypto";
import { add0x } from "@1inch/byte-utils";

async function testHashCreation() {
  try {
    console.log("Testing HashLock creation...\n");

    // Test secret generation
    const secrets = [];
    for (let i = 0; i < 5; i++) {
      secrets.push(add0x(randomBytes(32).toString("hex")));
    }
    console.log("✅ Generated secrets:", secrets.length);
    console.log("Sample secret:", secrets[0]);
    console.log("Secret type:", typeof secrets[0]);
    console.log("Secret length:", secrets[0]?.length);

    // Test hash creation
    const secretHashes = secrets.map(HashLock.hashSecret);
    console.log("\n✅ Generated secret hashes:", secretHashes.length);
    console.log("Sample hash:", secretHashes[0]);
    console.log("Hash type:", typeof secretHashes[0]);
    console.log("Hash length:", secretHashes[0]?.length);

    // Test single fill HashLock
    console.log("\n--- Testing Single Fill HashLock ---");
    const singleHashLock = HashLock.forSingleFill(secrets[0]);
    console.log(
      "Single HashLock methods:",
      Object.getOwnPropertyNames(singleHashLock)
    );
    console.log("Single HashLock keys:", Object.keys(singleHashLock));
    console.log("Single HashLock value:", singleHashLock.value);
    console.log("Single HashLock toString:", singleHashLock.toString());

    // Try to understand the structure
    console.log(
      "HashLock prototype methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(singleHashLock))
    );

    // Test multiple fill HashLock
    console.log("\n--- Testing Multiple Fill HashLock ---");
    const leaves = HashLock.getMerkleLeaves(secrets);
    console.log("Merkle leaves:", leaves.length);
    console.log("Sample leaf:", leaves[0]);

    const multiHashLock = HashLock.forMultipleFills(leaves);
    console.log("Multi HashLock:", multiHashLock);
    console.log("Multi HashLock value:", multiHashLock.value);
    console.log("Multi HashLock toString:", multiHashLock.toString());

    // Skip getOrderHashBuffer tests since method doesn't exist
    console.log("\n--- HashLock Investigation Complete ---");
    console.log("The error from earlier was likely from a different method.");
  } catch (error) {
    console.error("Hash creation test failed:", error);
  }
}

testHashCreation();
