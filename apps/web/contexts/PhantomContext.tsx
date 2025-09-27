"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  PhantomWalletInfo,
  isPhantomInstalled,
  connectPhantomEthereum,
  connectPhantomSolana,
  sendTokensViaPhantom,
  switchPhantomNetwork,
  getPhantomNetwork,
  disconnectPhantom,
  TokenTransferParams
} from "../lib/phantom";

interface PhantomContextType {
  phantomWallet: PhantomWalletInfo | null;
  isConnecting: boolean;
  error: string | null;
  isPhantomAvailable: boolean;
  connectPhantom: (network: "ethereum" | "base" | "solana") => Promise<void>;
  switchNetwork: (network: "ethereum" | "base") => Promise<void>;
  sendTokens: (params: TokenTransferParams) => Promise<string>;
  disconnect: () => Promise<void>;
  clearError: () => void;
}

const PhantomContext = createContext<PhantomContextType | undefined>(undefined);

interface PhantomProviderProps {
  children: ReactNode;
}

export function PhantomProvider({ children }: PhantomProviderProps) {
  const [phantomWallet, setPhantomWallet] = useState<PhantomWalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPhantomAvailable] = useState(isPhantomInstalled());

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isPhantomAvailable) return;

      try {
        // Check Ethereum connection
        if (window.phantom?.ethereum) {
          const accounts = await window.phantom.ethereum.request({ method: "eth_accounts" }) as string[];
          if (accounts.length > 0) {
            const chainId = await getPhantomNetwork();
            const network = chainId === 8453 ? "base" : "ethereum";
            
            setPhantomWallet({
              address: accounts[0]!,
              isConnected: true,
              network,
            });
          }
        }

        // Check Solana connection
        if (window.phantom?.solana?.isConnected && window.phantom.solana.publicKey) {
          setPhantomWallet({
            address: window.phantom.solana.publicKey.toString(),
            isConnected: true,
            network: "solana",
          });
        }
      } catch (err) {
        console.log("Auto-connection check failed:", err);
      }
    };

    checkConnection();
  }, [isPhantomAvailable]);

  // Listen for account changes
  useEffect(() => {
    if (!isPhantomAvailable) return;

    const handleEthereumAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        setPhantomWallet(null);
      } else if (phantomWallet?.network !== "solana") {
        setPhantomWallet(prev => prev ? { ...prev, address: accounts[0]! } : null);
      }
    };

    const handleEthereumChainChanged = async (...args: unknown[]) => {
      const chainId = args[0] as string;
      if (phantomWallet?.network !== "solana") {
        const network = parseInt(chainId, 16) === 8453 ? "base" : "ethereum";
        setPhantomWallet(prev => prev ? { ...prev, network } : null);
      }
    };

    const handleSolanaConnect = () => {
      if (window.phantom?.solana?.publicKey) {
        setPhantomWallet({
          address: window.phantom.solana.publicKey.toString(),
          isConnected: true,
          network: "solana",
        });
      }
    };

    const handleSolanaDisconnect = () => {
      if (phantomWallet?.network === "solana") {
        setPhantomWallet(null);
      }
    };

    // Add event listeners
    if (window.phantom?.ethereum) {
      window.phantom.ethereum.on("accountsChanged", handleEthereumAccountsChanged);
      window.phantom.ethereum.on("chainChanged", handleEthereumChainChanged);
    }

    if (window.phantom?.solana) {
      window.phantom.solana.on("connect", handleSolanaConnect);
      window.phantom.solana.on("disconnect", handleSolanaDisconnect);
    }

    return () => {
      // Cleanup event listeners
      if (window.phantom?.ethereum) {
        window.phantom.ethereum.removeListener("accountsChanged", handleEthereumAccountsChanged);
        window.phantom.ethereum.removeListener("chainChanged", handleEthereumChainChanged);
      }

      if (window.phantom?.solana) {
        window.phantom.solana.off("connect", handleSolanaConnect);
        window.phantom.solana.off("disconnect", handleSolanaDisconnect);
      }
    };
  }, [isPhantomAvailable, phantomWallet]);

  const connectPhantom = async (network: "ethereum" | "base" | "solana") => {
    if (!isPhantomAvailable) {
      setError("Phantom wallet is not installed. Please install it from phantom.app");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      let walletInfo: PhantomWalletInfo;

      if (network === "solana") {
        walletInfo = await connectPhantomSolana();
      } else {
        walletInfo = await connectPhantomEthereum();
        // Switch to the correct network if needed
        if (network === "base") {
          await switchPhantomNetwork("base");
          walletInfo.network = "base";
        }
      }

      setPhantomWallet(walletInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to Phantom wallet";
      setError(errorMessage);
      console.error("Phantom connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const switchNetwork = async (network: "ethereum" | "base") => {
    if (!phantomWallet || phantomWallet.network === "solana") {
      setError("Cannot switch network for Solana or when not connected");
      return;
    }

    setError(null);

    try {
      await switchPhantomNetwork(network);
      setPhantomWallet(prev => prev ? { ...prev, network } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to switch network";
      setError(errorMessage);
      throw err;
    }
  };

  const sendTokens = async (params: TokenTransferParams): Promise<string> => {
    if (!phantomWallet) {
      throw new Error("Phantom wallet not connected");
    }

    setError(null);

    try {
      const txHash = await sendTokensViaPhantom(params);
      return txHash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Transaction failed";
      setError(errorMessage);
      throw err;
    }
  };

  const disconnect = async () => {
    if (phantomWallet) {
      try {
        await disconnectPhantom(phantomWallet.network);
      } catch (err) {
        console.error("Disconnect error:", err);
      }
      setPhantomWallet(null);
    }
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value: PhantomContextType = {
    phantomWallet,
    isConnecting,
    error,
    isPhantomAvailable,
    connectPhantom,
    switchNetwork,
    sendTokens,
    disconnect,
    clearError,
  };

  return (
    <PhantomContext.Provider value={value}>
      {children}
    </PhantomContext.Provider>
  );
}

export function usePhantom(): PhantomContextType {
  const context = useContext(PhantomContext);
  if (context === undefined) {
    throw new Error("usePhantom must be used within a PhantomProvider");
  }
  return context;
}

// Hook to get network info for Phantom
export function usePhantomNetwork() {
  const { phantomWallet } = usePhantom();
  
  return {
    network: phantomWallet?.network,
    isEthereum: phantomWallet?.network === "ethereum",
    isBase: phantomWallet?.network === "base",
    isSolana: phantomWallet?.network === "solana",
    address: phantomWallet?.address,
    isConnected: phantomWallet?.isConnected || false,
  };
}