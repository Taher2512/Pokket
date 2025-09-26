import { SDK } from "@1inch/cross-chain-sdk";

async function investigateRefundReasons() {
  console.log("🔍 INVESTIGATING ORDER REFUND REASONS");
  console.log("═".repeat(60));

  const sdk = new SDK({
    url: "https://api.1inch.dev",
    authKey: process.env.ONEINCH_API_KEY,
  });

  // The order hash from your latest swap attempt
  const orderHash = "5KbnsigpwjR3Hh362C4RSY3pVsLJukgR1dm4R1gBAGX6";

  console.log(`📋 Investigating Order: ${orderHash}`);
  console.log("");

  try {
    // 1. Get detailed order status
    console.log("1️⃣ CHECKING ORDER STATUS:");
    console.log("─".repeat(40));

    const statusUrl = `https://api.1inch.dev/orderbook/v1.0/status/order/${orderHash}`;
    const statusResponse = await fetch(statusUrl, {
      headers: {
        Authorization: `Bearer ${process.env.ONEINCH_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log("Order Status Details:");
      console.log(JSON.stringify(status, null, 2));
    } else {
      console.log(
        `❌ Status API failed: ${statusResponse.status} ${statusResponse.statusText}`
      );
      const errorText = await statusResponse.text();
      console.log("Error details:", errorText);
    }

    // 2. Check ready to accept fills
    console.log("\n2️⃣ CHECKING READY TO ACCEPT FILLS:");
    console.log("─".repeat(40));

    try {
      const readyToAccept = await sdk.getReadyToAcceptSecretFills({
        orderHashes: [orderHash],
      });
      console.log("Ready to Accept Fills:");
      console.log(JSON.stringify(readyToAccept, null, 2));
    } catch (error) {
      console.log("❌ Ready to accept fills error:", error.message);
    }

    // 3. Get order details from the SDK
    console.log("\n3️⃣ CHECKING ORDER DETAILS:");
    console.log("─".repeat(40));

    try {
      const orderStatus = await sdk.getOrderStatus(orderHash);
      console.log("SDK Order Status:");
      console.log(JSON.stringify(orderStatus, null, 2));
    } catch (error) {
      console.log("❌ SDK Order status error:", error.message);
    }

    // 4. Check if there are any active orders for the user
    console.log("\n4️⃣ CHECKING ACTIVE ORDERS FOR USER:");
    console.log("─".repeat(40));

    try {
      // This might not work without additional parameters, but let's try
      const activeOrders = await sdk.getActiveOrders({
        page: 1,
        limit: 10,
      });
      console.log("Active Orders:");
      console.log(JSON.stringify(activeOrders, null, 2));
    } catch (error) {
      console.log("❌ Active orders error:", error.message);
    }

    // 5. Analysis of common refund reasons
    console.log("\n5️⃣ COMMON REFUND REASONS ANALYSIS:");
    console.log("─".repeat(40));
    console.log("Possible reasons for order refunds:");
    console.log("");
    console.log("🕐 TIMING ISSUES:");
    console.log("   - Order expired before execution");
    console.log("   - Network congestion delays");
    console.log("   - Slow relayer response");
    console.log("");
    console.log("💰 ECONOMIC FACTORS:");
    console.log("   - Insufficient liquidity on destination chain");
    console.log("   - Price slippage exceeded limits");
    console.log("   - Gas price volatility");
    console.log("   - MEV competition");
    console.log("");
    console.log("🔧 TECHNICAL ISSUES:");
    console.log("   - Resolver availability");
    console.log("   - Bridge capacity limits");
    console.log("   - Smart contract execution failure");
    console.log("   - Insufficient collateral");
    console.log("");
    console.log("📊 ORDER PARAMETERS:");
    console.log("   - Amount too small (might be unprofitable)");
    console.log("   - Order rate not competitive");
    console.log("   - Destination chain fees too high");

    // 6. Check current market conditions
    console.log("\n6️⃣ MARKET CONDITIONS CHECK:");
    console.log("─".repeat(40));

    try {
      // Get quote for same parameters to see current rates
      const quote = await sdk.getQuote({
        srcChainId: 900, // Solana
        dstChainId: 1, // Ethereum
        srcTokenAddress: "So11111111111111111111111111111111111111112", // SOL
        dstTokenAddress: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", // PYUSD
        amount: "4844160", // Same amount as your last order (in lamports)
        enableEstimate: true,
      });

      console.log("Current Quote for Same Parameters:");
      console.log(`Amount: ${quote.srcTokenAmount} SOL`);
      console.log(`Expected: ${quote.dstTokenAmount} PYUSD`);
      console.log(
        `Rate: 1 SOL = ${(parseFloat(quote.dstTokenAmount) / parseFloat(quote.srcTokenAmount)).toFixed(4)} PYUSD`
      );
      console.log(`Fee: ${quote.estimatedGas} gas units`);

      if (quote.recommendedPreset) {
        console.log(
          `Recommended Preset: ${quote.recommendedPreset.description}`
        );
        console.log(
          `Recommended Rate: ${quote.recommendedPreset.auctionEndAmount}`
        );
      }
    } catch (error) {
      console.log("❌ Quote check error:", error.message);
    }
  } catch (error) {
    console.error("❌ Investigation error:", error);
  }

  // 7. Recommendations
  console.log("\n7️⃣ RECOMMENDATIONS:");
  console.log("─".repeat(40));
  console.log("To improve order execution success:");
  console.log("");
  console.log("✅ AMOUNT OPTIMIZATION:");
  console.log("   - Try larger amounts (>0.01 SOL) for better profitability");
  console.log("   - Check minimum viable order size");
  console.log("");
  console.log("✅ TIMING ADJUSTMENTS:");
  console.log("   - Increase order duration/deadline");
  console.log("   - Submit during high liquidity periods");
  console.log("");
  console.log("✅ RATE IMPROVEMENTS:");
  console.log("   - Use more competitive rates");
  console.log("   - Add higher slippage tolerance");
  console.log("   - Consider auction dynamics");
  console.log("");
  console.log("✅ TECHNICAL OPTIMIZATION:");
  console.log("   - Ensure sufficient gas/priority fees");
  console.log("   - Check resolver availability");
  console.log("   - Monitor bridge capacity");
}

investigateRefundReasons().catch(console.error);
