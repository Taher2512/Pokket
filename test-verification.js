#!/usr/bin/env node

/**
 * Test script for Pokket Identity Verification
 * This script helps test the verification flow with your SimplePokketIdentityVerification contract
 */

const USER_ADDRESS = "0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711"; // Replace with your user's address
const API_BASE_URL = "http://localhost:3001";

async function testVerificationFlow() {
  console.log("🧪 Testing Pokket Identity Verification Flow");
  console.log("=".repeat(50));
  console.log("");

  // 1. Check initial verification status
  console.log("1️⃣ Checking initial verification status...");
  try {
    const response = await fetch(
      `${API_BASE_URL}/verification/status/${USER_ADDRESS}`
    );
    const status = await response.json();
    console.log("Initial status:", status);
    console.log("");
  } catch (error) {
    console.error("❌ Failed to check status:", error.message);
    return;
  }

  // 2. Simulate Self Protocol verification
  console.log("2️⃣ Simulating Self Protocol verification...");
  try {
    const response = await fetch(
      `${API_BASE_URL}/verification/simulate-callback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAddress: USER_ADDRESS,
          verificationData: {
            name: "Test User",
            nationality: "Indian",
            age: 25,
            documentType: "aadhar_card",
          },
        }),
      }
    );

    const result = await response.json();
    console.log("Simulation result:", result);
    console.log("");
  } catch (error) {
    console.error("❌ Failed to simulate verification:", error.message);
  }

  // 3. Check verification status after simulation
  console.log("3️⃣ Checking verification status after simulation...");
  try {
    const response = await fetch(
      `${API_BASE_URL}/verification/status/${USER_ADDRESS}`
    );
    const status = await response.json();
    console.log("Final status:", status);

    if (status.isVerified) {
      console.log("✅ Verification successful!");
    } else {
      console.log("❌ Verification failed");
    }
  } catch (error) {
    console.error("❌ Failed to check final status:", error.message);
  }

  console.log("");
  console.log("🔧 Troubleshooting:");
  console.log("- Make sure VERIFICATION_PRIVATE_KEY is set in backend/.env");
  console.log("- Ensure the contract owner has enough Celo for gas fees");
  console.log("- Check that VERIFICATION_CONTRACT_ADDRESS is correct");
  console.log("");
  console.log("📖 Next steps:");
  console.log("1. If simulation works, your contract is working correctly");
  console.log(
    "2. For real Self Protocol integration, you need the full PokketIdentityVerification contract"
  );
  console.log(
    "3. Or continue using manual verification with SimplePokketIdentityVerification"
  );
}

// Run the test
testVerificationFlow().catch(console.error);
