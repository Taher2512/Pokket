"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  SolanaWalletInfo, 
  connectPhantomWallet, 
  disconnectPhantomWallet,
  isPhantomInstalled
} from "../lib/solana";

interface SolanaWalletContextType {
  wallet: SolanaWalletInfo | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
  isPhantomAvailable: boolean;
}

const SolanaWalletContext = createContext<SolanaWalletContextType | undefined>(undefined);

interface SolanaWalletProviderProps {
  children: ReactNode;
}

export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  const [wallet, setWallet] = useState<SolanaWalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPhantomAvailable, setIsPhantomAvailable] = useState(false);

  // Check if Phantom is available
  useEffect(() => {
    setIsPhantomAvailable(isPhantomInstalled());
  }, []);

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === "undefined" || !window.solana) return;

      try {
        // Check if already connected
        if (window.solana.publicKey) {
          setWallet({
            publicKey: window.solana.publicKey.toString(),
            connected: true,
            provider: window.solana,
          });
        }
      } catch (err) {
        console.log("Auto-connection failed:", err);
      }
    };

    checkConnection();
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const walletInfo = await connectPhantomWallet();
      setWallet(walletInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect Phantom wallet";
      setError(errorMessage);
      console.error("Phantom wallet connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await disconnectPhantomWallet();
      setWallet(null);
      setError(null);
    } catch (err) {
      console.error("Phantom wallet disconnect error:", err);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: SolanaWalletContextType = {
    wallet,
    isConnecting,
    error,
    connect,
    disconnect,
    clearError,
    isPhantomAvailable,
  };

  return (
    <SolanaWalletContext.Provider value={value}>
      {children}
    </SolanaWalletContext.Provider>
  );
}

export function useSolanaWallet(): SolanaWalletContextType {
  const context = useContext(SolanaWalletContext);
  if (context === undefined) {
    throw new Error("useSolanaWallet must be used within a SolanaWalletProvider");
  }
  return context;
}