import { ethers } from "ethers";

// Base to Ethereum bridge contract addresses
const BASE_BRIDGE_CONTRACTS = {
  // L2StandardBridge on Base - official bridge contract
  L2_STANDARD_BRIDGE: "0x4200000000000000000000000000000000000010",
  // ETH token address on Base (native ETH)
  ETH_ADDRESS: "0x0000000000000000000000000000000000000000",
};

// Bridge ABI - simplified for ETH bridging
const BRIDGE_ABI = [
  "function bridgeETH(uint32 _minGasLimit, bytes calldata _extraData) external payable",
  "function withdrawTo(address _l2Token, address _to, uint256 _amount, uint32 _minGasLimit, bytes calldata _extraData) external payable",
];

async function createBaseBridgeScript() {
  const address = "0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711";
  const baseRpcUrl = "https://mainnet.base.org";

  console.log("🌉 BASE → ETHEREUM BRIDGE SCRIPT");
  console.log("═".repeat(50));

  try {
    const provider = new ethers.JsonRpcProvider(baseRpcUrl);
    const balance = await provider.getBalance(address);
    const balanceEth = ethers.formatEther(balance);

    console.log(`💰 Current Balance on Base: ${balanceEth} ETH`);

    if (parseFloat(balanceEth) === 0) {
      console.log("❌ No ETH to bridge");
      return;
    }

    // Calculate bridge amount (leave some for gas)
    const gasReserve = ethers.parseEther("0.0002"); // Reserve 0.0002 ETH for gas
    const bridgeAmount = balance - gasReserve;
    const bridgeAmountEth = ethers.formatEther(bridgeAmount);

    if (bridgeAmount <= 0) {
      console.log(
        "❌ Insufficient ETH for bridging (need gas for transaction)"
      );
      return;
    }

    console.log(`🌉 Amount to bridge: ${bridgeAmountEth} ETH`);
    console.log(`⛽ Gas reserved: ${ethers.formatEther(gasReserve)} ETH`);

    console.log("\n📋 BRIDGE TRANSACTION DATA:");
    console.log("─".repeat(30));
    console.log(`To: ${BASE_BRIDGE_CONTRACTS.L2_STANDARD_BRIDGE}`);
    console.log(`Value: ${bridgeAmountEth} ETH`);
    console.log(`Method: bridgeETH`);
    console.log(`Gas Limit: 200000 (recommended)`);

    // Generate transaction data
    const iface = new ethers.Interface(BRIDGE_ABI);
    const minGasLimit = 200000; // Standard gas limit for L1 execution
    const extraData = "0x"; // Empty extra data

    const txData = iface.encodeFunctionData("bridgeETH", [
      minGasLimit,
      extraData,
    ]);

    console.log("\n🔧 TRANSACTION DATA:");
    console.log("─".repeat(20));
    console.log(`Data: ${txData}`);

    console.log("\n⚠️  IMPORTANT NOTES:");
    console.log("─".repeat(20));
    console.log("1. Bridge takes ~7 days to complete (Base → Ethereum)");
    console.log("2. You'll need to claim on Ethereum after the waiting period");
    console.log("3. Monitor progress at: https://bridge.base.org/");
    console.log("4. Keep this transaction hash for claiming later");

    console.log("\n💡 MANUAL STEPS:");
    console.log("─".repeat(15));
    console.log("1. Go to https://bridge.base.org/");
    console.log("2. Connect your wallet");
    console.log("3. Select 'From Base to Ethereum'");
    console.log(`4. Enter amount: ${bridgeAmountEth} ETH`);
    console.log("5. Confirm and wait for transaction");
    console.log("6. Wait 7 days, then claim on Ethereum");

    // Alternative: Use a faster bridge service
    console.log("\n🚀 FASTER ALTERNATIVES:");
    console.log("─".repeat(25));
    console.log("For faster bridging (minutes instead of days):");
    console.log("• Across Protocol: https://across.to/");
    console.log("• Hop Protocol: https://hop.exchange/");
    console.log("• Stargate: https://stargate.finance/");
    console.log("Note: These may have small fees but are much faster");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

createBaseBridgeScript().catch(console.error);
