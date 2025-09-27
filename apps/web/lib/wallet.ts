import { ethers } from "ethers";

// Network configurations
export const NETWORKS = {
  ETHEREUM: {
    chainId: "0x1", // 1 in hex
    chainName: "Ethereum Mainnet",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://ethereum-rpc.publicnode.com"],
    blockExplorerUrls: ["https://etherscan.io"],
    id: 1,
  },
  BASE: {
    chainId: "0x2105", // 8453 in hex
    chainName: "Base",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"],
    id: 8453,
  },
} as const;

// Wallet types
export type WalletType = "metamask" | "coinbase" | "walletconnect";

export interface WalletInfo {
  address: string;
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
  chainId: number;
  isConnected: boolean;
}

export interface TokenTransferParams {
  to: string;
  amount: string;
  tokenAddress?: string; // undefined for native ETH
  decimals?: number;
}

// Check if wallet extension is installed
export const isWalletInstalled = {
  metamask: () => {
    return typeof window !== "undefined" && 
           typeof window.ethereum !== "undefined" && 
           window.ethereum.isMetaMask;
  },
  coinbase: () => {
    return typeof window !== "undefined" && 
           typeof window.ethereum !== "undefined" && 
           (window.ethereum.isCoinbaseWallet || window.ethereum.selectedProvider?.isCoinbaseWallet);
  },
};

// Get available wallet providers
export const getAvailableWallets = (): WalletType[] => {
  const wallets: WalletType[] = [];
  
  if (isWalletInstalled.metamask()) {
    wallets.push("metamask");
  }
  
  if (isWalletInstalled.coinbase()) {
    wallets.push("coinbase");
  }
  
  // WalletConnect is always available (doesn't require extension)
  wallets.push("walletconnect");
  
  return wallets;
};

// Connect to wallet
export const connectWallet = async (walletType: WalletType): Promise<WalletInfo> => {
  if (typeof window === "undefined") {
    throw new Error("Wallet connection is only available in browser environment");
  }

  let provider: ethers.BrowserProvider;

  switch (walletType) {
    case "metamask":
      if (!isWalletInstalled.metamask()) {
        throw new Error("MetaMask is not installed");
      }
      if (!window.ethereum) throw new Error("MetaMask provider not found");
      await window.ethereum.request({ method: "eth_requestAccounts" });
      provider = new ethers.BrowserProvider(window.ethereum);
      break;

    case "coinbase":
      if (!isWalletInstalled.coinbase()) {
        throw new Error("Coinbase Wallet is not installed");
      }
      if (!window.ethereum) throw new Error("Coinbase Wallet provider not found");
      await window.ethereum.request({ method: "eth_requestAccounts" });
      provider = new ethers.BrowserProvider(window.ethereum);
      break;

    case "walletconnect":
      // For now, we'll fallback to injected provider if available
      // In a full implementation, you'd integrate @walletconnect/web3-provider
      if (!window.ethereum) {
        throw new Error("No wallet detected. Please install MetaMask or Coinbase Wallet.");
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });
      provider = new ethers.BrowserProvider(window.ethereum);
      break;

    default:
      throw new Error("Unsupported wallet type");
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();

  return {
    address,
    provider,
    signer,
    chainId: Number(network.chainId),
    isConnected: true,
  };
};

// Switch network
export const switchNetwork = async (networkKey: keyof typeof NETWORKS): Promise<void> => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Wallet not available");
  }

  const network = NETWORKS[networkKey];

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: network.chainId }],
    });
  } catch (error: unknown) {
    // If the network doesn't exist, add it
    if (error && typeof error === 'object' && 'code' in error && error.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [network],
      });
    } else {
      throw error;
    }
  }
};

// Send native ETH
export const sendETH = async (
  signer: ethers.JsonRpcSigner,
  to: string,
  amount: string
): Promise<ethers.TransactionResponse> => {
  const tx = {
    to,
    value: ethers.parseEther(amount),
  };

  return await signer.sendTransaction(tx);
};

// Send ERC-20 token
export const sendToken = async (
  signer: ethers.JsonRpcSigner,
  params: TokenTransferParams
): Promise<ethers.TransactionResponse> => {
  const { to, amount, tokenAddress, decimals = 18 } = params;

  if (!tokenAddress) {
    // Send native ETH
    return sendETH(signer, to, amount);
  }

  // ERC-20 token transfer
  const tokenContract = new ethers.Contract(
    tokenAddress,
    [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
    ],
    signer
  );

  const tokenAmount = ethers.parseUnits(amount, decimals);
  const tx = await tokenContract.getFunction("transfer")(to, tokenAmount);
  return tx;
};

// Get token balance
export const getTokenBalance = async (
  provider: ethers.BrowserProvider,
  tokenAddress: string,
  userAddress: string
): Promise<string> => {
  if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
    // Native ETH balance
    const balance = await provider.getBalance(userAddress);
    return ethers.formatEther(balance);
  }

  // ERC-20 token balance
  const tokenContract = new ethers.Contract(
    tokenAddress,
    [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
    ],
    provider
  );

  const balance = await tokenContract.getFunction("balanceOf")(userAddress);
  const decimals = await tokenContract.getFunction("decimals")();
  return ethers.formatUnits(balance, decimals);
};

// Estimate gas for transaction
export const estimateGas = async (
  signer: ethers.JsonRpcSigner,
  params: TokenTransferParams
): Promise<{
  gasLimit: bigint;
  gasPrice: bigint;
  estimatedCost: string;
}> => {
  const { to, amount, tokenAddress, decimals = 18 } = params;

  let gasLimit: bigint;

  if (!tokenAddress) {
    // Native ETH transfer
    gasLimit = await signer.provider.estimateGas({
      to,
      value: ethers.parseEther(amount),
    });
  } else {
    // ERC-20 token transfer
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ["function transfer(address to, uint256 amount) returns (bool)"],
      signer
    );

    const tokenAmount = ethers.parseUnits(amount, decimals);
    gasLimit = await tokenContract.getFunction("transfer").estimateGas(to, tokenAmount);
  }

  const feeData = await signer.provider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei");

  const estimatedCost = ethers.formatEther(gasLimit * gasPrice);

  return {
    gasLimit,
    gasPrice,
    estimatedCost,
  };
};

// Get block explorer URL for transaction
export const getBlockExplorerUrl = (chainId: number, txHash: string): string => {
  switch (chainId) {
    case 1: // Ethereum
      return `https://etherscan.io/tx/${txHash}`;
    case 8453: // Base
      return `https://basescan.org/tx/${txHash}`;
    default:
      return `https://etherscan.io/tx/${txHash}`;
  }
};

// Get network name from chain ID
export const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return "Ethereum";
    case 8453:
      return "Base";
    default:
      return "Unknown Network";
  }
};

// Common token addresses
export const COMMON_TOKENS = {
  ETHEREUM: {
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  BASE: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    WETH: "0x4200000000000000000000000000000000000006",
  },
} as const;