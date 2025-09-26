import { SDK } from "@1inch/cross-chain-sdk";
import { config } from "dotenv";

// Load environment variables
config();

async function checkOrderStatusWithSDK() {
  console.log("🔍 CHECKING 1INCH ORDER STATUS WITH SDK");
  console.log("═".repeat(50));
  
  const orderHash = "CG7uFZWJBPadZLmkmzbLjXcvTx9VgvoGLgJFBLcUk3yK";
  const solanaTransaction = "3EyJc5RowNyjv2yKWtwfmn65QcGMR3hTcirit6iva8QpeWfWaUYwDtj93CAfpmwedX9y5CvwMRvTnsePrW35fR7S";
  
  console.log(`📋 Order Hash: ${orderHash}`);
  console.log(`📋 Solana TX: ${solanaTransaction}`);
  console.log("");
  
  // Initialize 1inch SDK
  const apiKey = process.env.DEV_PORTAL_API_KEY;
  
  if (!apiKey || apiKey === "your_1inch_api_key_here") {
    console.log("❌ No 1inch API key found in environment");
    console.log("ℹ️  Please set DEV_PORTAL_API_KEY in your .env file");
    return;
  }
  
  console.log("🔑 API Key found, initializing 1inch SDK...");
  
  const sdk = new SDK({
    url: process.env.ONEINCH_SDK_URL || "https://api.1inch.dev/fusion-plus",
    authKey: apiKey,
  });
  
  try {
    console.log("🔍 Querying order status...");
    
    // Get order status
    const orderStatus = await sdk.getOrderStatus(orderHash);
    
    console.log("✅ ORDER STATUS FOUND:");
    console.log("─".repeat(40));
    console.log(JSON.stringify(orderStatus, null, 2));
    
    // Analyze the status
    console.log("\n📊 STATUS ANALYSIS:");
    console.log("─".repeat(40));
    
    if (orderStatus.status === "executed") {
      console.log("🎉 ORDER COMPLETED SUCCESSFULLY!");
      console.log("💰 PYUSD should be in your Ethereum wallet");
    } else if (orderStatus.status === "pending") {
      console.log("⏳ Order is still being processed by 1inch relayers");
      console.log("🔄 Cross-chain settlement in progress...");
    } else if (orderStatus.status === "cancelled") {
      console.log("❌ Order was cancelled");
      console.log("💸 SOL should be refunded to your Solana wallet");
    } else if (orderStatus.status === "failed") {
      console.log("💥 Order failed");
      console.log("💸 SOL should be refunded to your Solana wallet");
    } else {
      console.log(`❓ Unknown status: ${orderStatus.status}`);
    }
    
  } catch (error) {
    console.error("❌ Error querying order status:", error.message);
    
    if (error.message.includes("404") || error.message.includes("not found")) {
      console.log("\n🤔 Order not found in 1inch system");
      console.log("This could mean:");
      console.log("- Order hash is incorrect");
      console.log("- Order is too old and purged from system");
      console.log("- There's an issue with 1inch infrastructure");
    }
  }
  
  // Check for ready-to-accept secrets (in case order is still pending)
  try {
    console.log("\n🔍 Checking for pending secret submissions...");
    
    const readySecrets = await sdk.getReadyToAcceptSecretFills(orderHash);
    
    if (readySecrets.fills && readySecrets.fills.length > 0) {
      console.log("🔄 Order is waiting for secret submissions");
      console.log("📝 Pending fills:", readySecrets.fills.length);
    } else {
      console.log("✅ No pending secret submissions required");
    }
    
  } catch (secretError) {
    console.log("ℹ️  Cannot check secret status:", secretError.message);
  }
  
  // Time analysis
  const txTime = new Date('2025-09-22T14:04:20.000Z'); // Approximate time
  const hoursElapsed = Math.round((Date.now() - txTime.getTime()) / 1000 / 60 / 60 * 10) / 10;
  
  console.log("\n⏰ TIMING ANALYSIS:");
  console.log("─".repeat(40));
  console.log(`Time Elapsed: ${hoursElapsed} hours`);
  console.log(`Expected Duration: 30-60 minutes`);
  console.log(`Status: ${hoursElapsed > 2 ? '🚨 SEVERELY DELAYED' : hoursElapsed > 1 ? '⚠️  DELAYED' : '✅ NORMAL'}`);
  
  console.log("\n🔗 VERIFICATION LINKS:");
  console.log("─".repeat(40));
  console.log(`Solana TX: https://solscan.io/tx/${solanaTransaction}`);
  console.log(`Ethereum Address: https://etherscan.io/address/0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711`);
  console.log(`PYUSD Token: https://etherscan.io/token/0x6c3ea9036406852006290770BEdFcAbA0e23A0e8`);
  
  console.log("\n📞 SUPPORT CONTACTS:");
  console.log("─".repeat(40));
  console.log("1inch Discord: https://discord.gg/1inch");
  console.log("1inch Support: https://help.1inch.io/");
  console.log("1inch Status: https://status.1inch.io/");
  console.log(`Order Hash: ${orderHash}`);
  
  console.log("\n" + "═".repeat(50));
  
  if (hoursElapsed > 1.5) {
    console.log("🚨 IMMEDIATE ACTION REQUIRED:");
    console.log("Contact 1inch support with your order hash");
    console.log("Your funds are safe but the cross-chain bridge has failed");
  }
}

checkOrderStatusWithSDK().catch(console.error);