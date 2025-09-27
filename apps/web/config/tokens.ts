export interface TokenConfig {
  symbol: string;
  name: string;
  decimals: number;
  address?: string; // Contract address for ERC-20 tokens
  network: "ethereum" | "solana" | "both";
  isNative: boolean;
  icon: string;
  color: string;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  shortName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  blockExplorer: string;
  isTestnet: boolean;
}

// Token configurations
export const TOKEN_CONFIGS: { [key: string]: TokenConfig } = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    network: "ethereum",
    isNative: true,
    icon: "⟠",
    color: "from-blue-500 to-blue-600",
  },
  PYUSD: {
    symbol: "PYUSD",
    name: "PayPal USD",
    decimals: 6,
    address: "0x6c3EA9036406852006290770BEdFcAbA0e23A0e8", // Ethereum mainnet
    network: "ethereum",
    isNative: false,
    icon: "💰",
    color: "from-yellow-500 to-yellow-600",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    address: "0xA0b86a33E6417aA24CA5299007e7E2e6cFBBCA22", // Ethereum mainnet
    network: "both",
    isNative: false,
    icon: "🟢",
    color: "from-green-500 to-green-600",
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    network: "solana",
    isNative: true,
    icon: "◎",
    color: "from-purple-500 to-purple-600",
  },
};

// Network configurations
export const NETWORK_CONFIGS: { [key: number]: NetworkConfig } = {
  1: {
    chainId: 1,
    name: "Ethereum Mainnet",
    shortName: "Ethereum",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://etherscan.io",
    isTestnet: false,
  },
  5: {
    chainId: 5,
    name: "Goerli Testnet",
    shortName: "Goerli",
    nativeCurrency: {
      name: "Goerli Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: "https://goerli.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://goerli.etherscan.io",
    isTestnet: true,
  },
  11155111: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    shortName: "Sepolia",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://sepolia.etherscan.io",
    isTestnet: true,
  },
  137: {
    chainId: 137,
    name: "Polygon Mainnet",
    shortName: "Polygon",
    nativeCurrency: {
      name: "Polygon",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrl: "https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://polygonscan.com",
    isTestnet: false,
  },
  8453: {
    chainId: 8453,
    name: "Base Mainnet",
    shortName: "Base",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    isTestnet: false,
  },
};

// Helper functions
export const getTokenConfig = (symbol: string): TokenConfig | undefined => {
  return TOKEN_CONFIGS[symbol.toUpperCase()];
};

export const getNetworkConfig = (
  chainId: number
): NetworkConfig | undefined => {
  return NETWORK_CONFIGS[chainId];
};

export const getSupportedTokensForNetwork = (
  network: "ethereum" | "solana"
): TokenConfig[] => {
  return Object.values(TOKEN_CONFIGS).filter(
    (token) => token.network === network || token.network === "both"
  );
};

export const isTestnetChain = (chainId: number): boolean => {
  const network = getNetworkConfig(chainId);
  return network?.isTestnet || false;
};

export const getBlockExplorerUrl = (
  chainId: number,
  txHash: string
): string => {
  const network = getNetworkConfig(chainId);
  if (!network) return "#";

  return `${network.blockExplorer}/tx/${txHash}`;
};

export const getSolanaExplorerUrl = (
  signature: string,
  cluster: "mainnet-beta" | "devnet" = "mainnet-beta"
): string => {
  return `https://explorer.solana.com/tx/${signature}${cluster === "devnet" ? "?cluster=devnet" : ""}`;
};

// Gas and fee configurations
export const GAS_CONFIGS = {
  ethereum: {
    defaultGasLimit: "21000",
    erc20GasLimit: "65000",
    maxPriorityFeePerGas: "2000000000", // 2 gwei
    maxFeePerGas: "50000000000", // 50 gwei
  },
  polygon: {
    defaultGasLimit: "21000",
    erc20GasLimit: "65000",
    maxPriorityFeePerGas: "30000000000", // 30 gwei
    maxFeePerGas: "100000000000", // 100 gwei
  },
  base: {
    defaultGasLimit: "21000",
    erc20GasLimit: "65000",
    maxPriorityFeePerGas: "1000000", // 0.001 gwei
    maxFeePerGas: "1000000000", // 1 gwei
  },
  solana: {
    lamportsPerSignature: 5000, // Standard Solana transaction fee
    priorityFeeMultiplier: 1.2,
  },
};

export const getGasConfig = (chainId: number) => {
  switch (chainId) {
    case 1:
    case 5:
    case 11155111:
      return GAS_CONFIGS.ethereum;
    case 137:
    case 80001:
      return GAS_CONFIGS.polygon;
    case 8453:
    case 84531:
      return GAS_CONFIGS.base;
    default:
      return GAS_CONFIGS.ethereum;
  }
};
