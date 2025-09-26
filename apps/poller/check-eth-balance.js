import { ethers } from "ethers";

async function checkEthBalance() {
  const address = "0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711";
  const rpcUrl = "https://ethereum-rpc.publicnode.com";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  console.log(`🔍 Checking ETH balance for: ${address}`);
  const balance = await provider.getBalance(address);
  const balanceEth = ethers.formatEther(balance);
  console.log(`💰 ETH Balance: ${balanceEth} ETH`);
}

checkEthBalance().catch(console.error);
