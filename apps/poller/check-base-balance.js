import { ethers } from "ethers";

async function checkBaseBalance() {
  const address = "0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711";

  // Base mainnet RPC
  const baseRpcUrl = "https://mainnet.base.org";
  const baseProvider = new ethers.JsonRpcProvider(baseRpcUrl);

  console.log(`🔍 Checking balances for: ${address}`);
  console.log("═".repeat(50));

  try {
    // Check ETH balance on Base
    console.log("🔵 BASE CHAIN:");
    const baseBalance = await baseProvider.getBalance(address);
    const baseBalanceEth = ethers.formatEther(baseBalance);
    console.log(`💰 ETH Balance on Base: ${baseBalanceEth} ETH`);

    if (parseFloat(baseBalanceEth) > 0) {
      console.log("✅ Found ETH on Base chain!");
      console.log(
        `💵 Value: ~$${(parseFloat(baseBalanceEth) * 2500).toFixed(2)} USD (assuming $2500/ETH)`
      );
    } else {
      console.log("❌ No ETH found on Base chain");
    }

    // Also check network info
    const network = await baseProvider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
  } catch (error) {
    console.error("❌ Error checking Base balance:", error.message);
  }

  console.log("\n🔗 BLOCK EXPLORER LINKS:");
  console.log(`Base: https://basescan.org/address/${address}`);
  console.log(`Ethereum: https://etherscan.io/address/${address}`);
}

checkBaseBalance().catch(console.error);
