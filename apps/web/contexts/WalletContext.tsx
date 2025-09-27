"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  WalletInfo, 
  WalletType, 
  connectWallet, 
  switchNetwork, 
  NETWORKS,
  getNetworkName 
} from "../lib/wallet";

interface WalletContextType {
  wallet: WalletInfo | null;
  isConnecting: boolean;
  error: string | null;
  connectToWallet: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
  switchToNetwork: (networkKey: keyof typeof NETWORKS) => Promise<void>;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === "undefined" || !window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
        if (accounts.length > 0) {
          // Auto-reconnect to previously connected wallet
          const { ethers } = await import("ethers");
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const network = await provider.getNetwork();
          
          setWallet({
            address: accounts[0]!,
            provider,
            signer,
            chainId: Number(network.chainId),
            isConnected: true,
          });
        }
      } catch (err) {
        console.log("Auto-connection failed:", err);
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWallet(null);
      } else if (wallet && accounts[0] !== wallet.address) {
        // Account changed, reconnect
        connectToWallet("metamask").catch(console.error);
      }
    };

    // Chain change handler (currently unused but available for future use)
    // const handleChainChanged = (chainId: string) => {
    //   if (wallet) {
    //     setWallet(prev => prev ? { ...prev, chainId: parseInt(chainId, 16) } : null);
    //   }
    // };

    // Check current accounts
    window.ethereum.request({ method: "eth_accounts" }).then((accounts: unknown) => {
      const accountsArray = accounts as string[];
      if (accountsArray.length > 0) {
        handleAccountsChanged(accountsArray);
      }
    }).catch(console.error);

    return () => {
      // Cleanup event listeners if needed
    };
  }, [wallet]);

  const connectToWallet = async (walletType: WalletType) => {
    setIsConnecting(true);
    setError(null);

    try {
      const walletInfo = await connectWallet(walletType);
      setWallet(walletInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(errorMessage);
      console.error("Wallet connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setWallet(null);
    setError(null);
  };

  const switchToNetwork = async (networkKey: keyof typeof NETWORKS) => {
    setError(null);

    try {
      await switchNetwork(networkKey);
      
      // Update wallet state with new network
      if (wallet) {
        const newChainId = NETWORKS[networkKey].id;
        setWallet(prev => prev ? { ...prev, chainId: newChainId } : null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to switch network";
      setError(errorMessage);
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: WalletContextType = {
    wallet,
    isConnecting,
    error,
    connectToWallet,
    disconnect,
    switchToNetwork,
    clearError,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

// Hook to get network info
export function useNetwork() {
  const { wallet } = useWallet();
  
  return {
    chainId: wallet?.chainId,
    networkName: wallet?.chainId ? getNetworkName(wallet.chainId) : null,
    isEthereum: wallet?.chainId === 1,
    isBase: wallet?.chainId === 8453,
  };
}