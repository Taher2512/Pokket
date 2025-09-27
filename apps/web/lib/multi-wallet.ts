import { ethers } from "ethers";

// Supported wallet types
export type WalletType = "metamask" | "coinbase" | "phantom" | "trust" | "rainbow";
export type NetworkType = "ethereum" | "base" | "solana";

export interface WalletOption {
  id: WalletType;
  name: string;
  description: string;
  icon: string;
  supportedNetworks: NetworkType[];
  isInstalled: boolean;
  installUrl: string;
  connectFunction: (network: NetworkType) => Promise<WalletConnection>;
}

export interface WalletConnection {
  address: string;
  provider: ethers.BrowserProvider | unknown;
  signer?: ethers.JsonRpcSigner;
  network: NetworkType;
  isConnected: boolean;
}

// Wallet detection functions
export const walletDetectors = {
  metamask: (): boolean => {
    return typeof window !== "undefined" && 
           typeof window.ethereum !== "undefined" && 
           !!window.ethereum.isMetaMask && 
           !window.ethereum.isPhantom; // Exclude Phantom masquerading as MetaMask
  },
  
  coinbase: (): boolean => {
    return typeof window !== "undefined" && 
           typeof window.ethereum !== "undefined" && 
           !!(window.ethereum.isCoinbaseWallet || window.ethereum.selectedProvider?.isCoinbaseWallet);
  },
  
  phantom: (): boolean => {
    return typeof window !== "undefined" && 
           typeof window.phantom !== "undefined" &&
           !!(window.phantom.ethereum?.isPhantom || window.phantom.solana?.isPhantom);
  },
  
  trust: (): boolean => {
    return typeof window !== "undefined" && 
           typeof window.ethereum !== "undefined" && 
           !!window.ethereum.isTrust;
  },
  
  rainbow: (): boolean => {
    return typeof window !== "undefined" && 
           typeof window.ethereum !== "undefined" && 
           !!window.ethereum.isRainbow;
  },
};

// Connect functions for each wallet
const walletConnectors = {
  metamask: async (network: NetworkType): Promise<WalletConnection> => {
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      throw new Error("MetaMask not found");
    }

    if (network === "solana") {
      throw new Error("MetaMask doesn't support Solana network");
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // Switch to correct network
    await switchEthereumNetwork(network);

    return {
      address,
      provider,
      signer,
      network,
      isConnected: true,
    };
  },

  coinbase: async (network: NetworkType): Promise<WalletConnection> => {
    if (!window.ethereum || !window.ethereum.isCoinbaseWallet) {
      throw new Error("Coinbase Wallet not found");
    }

    if (network === "solana") {
      throw new Error("Coinbase Wallet doesn't support Solana network");
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // Switch to correct network
    await switchEthereumNetwork(network);

    return {
      address,
      provider,
      signer,
      network,
      isConnected: true,
    };
  },

  phantom: async (network: NetworkType): Promise<WalletConnection> => {
    if (network === "solana") {
      if (!window.phantom?.solana) {
        throw new Error("Phantom Solana not found");
      }
      
      const response = await window.phantom.solana.connect();
      return {
        address: response.publicKey.toString(),
        provider: window.phantom.solana,
        network,
        isConnected: true,
      };
    } else {
      // Ethereum/Base
      if (!window.phantom?.ethereum) {
        throw new Error("Phantom Ethereum not found");
      }

      await window.phantom.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.phantom.ethereum as ethers.Eip1193Provider);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Switch to correct network
      await switchEthereumNetwork(network);

      return {
        address,
        provider,
        signer,
        network,
        isConnected: true,
      };
    }
  },

  trust: async (network: NetworkType): Promise<WalletConnection> => {
    if (network === "solana") {
      throw new Error("Trust Wallet doesn't support Solana network in browser");
    }

    if (!window.ethereum || !window.ethereum.isTrust) {
      throw new Error("Trust Wallet not found");
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    await switchEthereumNetwork(network);

    return {
      address,
      provider,
      signer,
      network,
      isConnected: true,
    };
  },

  rainbow: async (network: NetworkType): Promise<WalletConnection> => {
    if (network === "solana") {
      throw new Error("Rainbow Wallet doesn't support Solana network");
    }

    if (!window.ethereum || !window.ethereum.isRainbow) {
      throw new Error("Rainbow Wallet not found");
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    await switchEthereumNetwork(network);

    return {
      address,
      provider,
      signer,
      network,
      isConnected: true,
    };
  },
};

// Network switching for Ethereum-based networks
const switchEthereumNetwork = async (network: NetworkType) => {
  if (network === "solana" || !window.ethereum) return;

  const networkConfigs = {
    ethereum: {
      chainId: "0x1",
      chainName: "Ethereum Mainnet",
      nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://ethereum-rpc.publicnode.com"],
      blockExplorerUrls: ["https://etherscan.io"],
    },
    base: {
      chainId: "0x2105",
      chainName: "Base",
      nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://mainnet.base.org"],
      blockExplorerUrls: ["https://basescan.org"],
    },
  };

  const config = networkConfigs[network as keyof typeof networkConfigs];
  if (!config) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: config.chainId }],
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [config],
      });
    } else {
      throw error;
    }
  }
};

// Get all available wallets for a specific network
export const getAvailableWallets = (network: NetworkType): WalletOption[] => {
  const allWallets: Omit<WalletOption, 'isInstalled' | 'connectFunction'>[] = [
    {
      id: "metamask",
      name: "MetaMask",
      description: "Connect using MetaMask",
      icon: "🦊",
      supportedNetworks: ["ethereum", "base"],
      installUrl: "https://metamask.io/download/",
    },
    {
      id: "coinbase",
      name: "Coinbase Wallet",
      description: "Connect using Coinbase Wallet",
      icon: "🔵",
      supportedNetworks: ["ethereum", "base"],
      installUrl: "https://www.coinbase.com/wallet",
    },
    {
      id: "phantom",
      name: "Phantom",
      description: "Connect using Phantom Wallet",
      icon: "👻",
      supportedNetworks: ["ethereum", "base", "solana"],
      installUrl: "https://phantom.app/download",
    },
    {
      id: "trust",
      name: "Trust Wallet",
      description: "Connect using Trust Wallet",
      icon: "🛡️",
      supportedNetworks: ["ethereum", "base"],
      installUrl: "https://trustwallet.com/download",
    },
    {
      id: "rainbow",
      name: "Rainbow",
      description: "Connect using Rainbow Wallet",
      icon: "🌈",
      supportedNetworks: ["ethereum", "base"],
      installUrl: "https://rainbow.me/download",
    },
  ];

  return allWallets
    .filter(wallet => wallet.supportedNetworks.includes(network))
    .map(wallet => ({
      ...wallet,
      isInstalled: walletDetectors[wallet.id]() || false,
      connectFunction: walletConnectors[wallet.id],
    }));
};

// Send tokens using connected wallet
export const sendTokensWithWallet = async (
  connection: WalletConnection,
  params: {
    to: string;
    amount: string;
    tokenAddress?: string;
    decimals?: number;
  }
): Promise<string> => {
  const { to, amount, tokenAddress, decimals = 18 } = params;

  if (connection.network === "solana") {
    // Handle Solana transactions via Phantom
    console.log("Processing Solana transaction:", { to, amount });
    
    try {
      // Use the dedicated Phantom function for Solana transactions
      const { sendTokensViaPhantom } = await import('./phantom');
      return await sendTokensViaPhantom({
        to,
        amount,
        tokenAddress,
        decimals,
        network: "solana"
      });
    } catch (error) {
      console.error("Solana transaction error:", error);
      throw new Error(`Solana transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    // Handle Ethereum/Base transactions
    if (!connection.signer) {
      throw new Error("No signer available for transaction");
    }

    let tx;
    if (!tokenAddress) {
      // Send native ETH
      tx = await connection.signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });
    } else {
      // Send ERC-20 token
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ["function transfer(address to, uint256 amount) returns (bool)"],
        connection.signer
      );
      
      const tokenAmount = ethers.parseUnits(amount, decimals);
      tx = await tokenContract.getFunction("transfer")(to, tokenAmount);
    }

    return tx.hash;
  }
};

export {};