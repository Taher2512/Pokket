#!/usr/bin/env node

/**
 * Pokket Identity Verification Setup & Test Script
 */

const API_BASE_URL = "http://localhost:3001";
const TEST_USER_ADDRESS = "0xb267fe4AE336Aff480Bf7B28809d6D7B2fD1300e"; // New deployer address

async function testVerificationSetup() {
  console.log("🧪 Testing Pokket Identity Verification Setup");
  console.log("=".repeat(60));
  console.log("");

  // 1. Check backend configuration
  console.log("1️⃣ Checking backend configuration...");
  try {
    const response = await fetch(`${API_BASE_URL}/verification/config`);
    const config = await response.json();

    console.log("✅ Backend Configuration:");
    console.log("   Contract Address:", config.contractAddress);
    console.log("   Network:", config.network);
    console.log("   Enabled:", config.enabled);
    console.log("");

    if (!config.contractAddress) {
      console.log("❌ CONTRACT_ADDRESS not configured in backend .env");
      return;
    }
  } catch (error) {
    console.error("❌ Backend not accessible:", error.message);
    return;
  }

  // 2. Check initial verification status
  console.log("2️⃣ Checking user verification status...");
  try {
    const response = await fetch(
      `${API_BASE_URL}/verification/status/${TEST_USER_ADDRESS}`
    );
    const status = await response.json();
    console.log(
      "   Initial Status:",
      status.isVerified ? "✅ Verified" : "❌ Not Verified"
    );
    console.log("");
  } catch (error) {
    console.error("❌ Failed to check status:", error.message);
  }

  // 3. Test manual verification
  console.log("3️⃣ Testing manual verification...");
  try {
    const response = await fetch(
      `${API_BASE_URL}/verification/simulate-callback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAddress: TEST_USER_ADDRESS,
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

    if (result.success) {
      console.log("✅ Manual verification successful!");
      console.log("   Transaction Hash:", result.txHash);
      console.log("   Block Number:", result.blockNumber);
    } else {
      console.log("❌ Manual verification failed:", result.error);

      if (result.error?.includes("private key")) {
        console.log("");
        console.log("🔧 SETUP REQUIRED:");
        console.log("   Add the contract owner's private key to backend/.env:");
        console.log(
          "   VERIFICATION_PRIVATE_KEY=your_contract_owner_private_key_here"
        );
      }
    }
    console.log("");
  } catch (error) {
    console.error("❌ Failed manual verification:", error.message);
  }

  // 4. Check final status
  console.log("4️⃣ Checking final verification status...");
  try {
    const response = await fetch(
      `${API_BASE_URL}/verification/status/${TEST_USER_ADDRESS}`
    );
    const status = await response.json();

    if (status.isVerified) {
      console.log("✅ SUCCESS! User is now verified");
      console.log(
        "   Verified at:",
        new Date(status.verificationTimestamp * 1000).toLocaleString()
      );
    } else {
      console.log("❌ User still not verified");
    }
  } catch (error) {
    console.error("❌ Failed final status check:", error.message);
  }

  console.log("");
  console.log("📋 Setup Checklist:");
  console.log("□ Backend running on http://localhost:3001");
  console.log("□ Frontend running on http://localhost:3000");
  console.log("□ VERIFICATION_CONTRACT_ADDRESS set in backend/.env");
  console.log(
    "□ VERIFICATION_PRIVATE_KEY set in backend/.env (contract owner)"
  );
  console.log("□ Contract deployed to Celo Alfajores testnet");
  console.log("");
  console.log("🎯 Next Steps:");
  console.log("1. If manual verification works → Your setup is complete!");
  console.log("2. Use 'Test Verification' button in frontend to test UI");
  console.log(
    "3. For real Self Protocol integration, ensure full contract deployment"
  );
}

// Run the test
testVerificationSetup().catch(console.error);
