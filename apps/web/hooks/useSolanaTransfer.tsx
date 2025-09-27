"use client";

import { useState } from "react";
import { useSolanaWallet } from "../contexts/SolanaWalletContext";
import { sendSOL, sendSPLToken, getSolanaExplorerUrl, SOLANA_TOKENS } from "../lib/solana";

export interface SolanaTransferParams {
  to: string;
  amount: string;
  tokenSymbol?: string;
  mintAddress?: string;
  decimals?: number;
}

export interface SolanaTransactionState {
  status: "idle" | "connecting" | "signing" | "sending" | "confirming" | "success" | "error";
  txHash?: string;
  error?: string;
  explorerUrl?: string;
}

export function useSolanaTransfer() {
  const { wallet, connect, isPhantomAvailable } = useSolanaWallet();
  const [transactionState, setTransactionState] = useState<SolanaTransactionState>({
    status: "idle"
  });

  const sendTokens = async (params: SolanaTransferParams): Promise<string> => {
    if (!isPhantomAvailable) {
      throw new Error("Phantom wallet is not installed");
    }

    if (!wallet) {
      setTransactionState({ status: "connecting" });
      await connect();
      // After connection, wallet should be available
      if (!wallet) {
        throw new Error("Failed to connect wallet");
      }
    }

    try {
      setTransactionState({ status: "signing" });

      const { to, amount, tokenSymbol = "SOL", mintAddress, decimals } = params;
      
      // Get token info
      const tokenInfo = Object.values(SOLANA_TOKENS).find(token => 
        token.symbol === tokenSymbol
      );

      const transferParams = {
        to,
        amount,
        mintAddress: mintAddress || tokenInfo?.mintAddress || undefined,
        decimals: decimals || tokenInfo?.decimals || 9,
      };

      setTransactionState({ status: "sending" });

      let signature: string;
      if (transferParams.mintAddress) {
        signature = await sendSPLToken(wallet, transferParams);
      } else {
        signature = await sendSOL(wallet, transferParams);
      }

      setTransactionState({ status: "confirming" });

      // Wait a bit for confirmation (already handled in send functions)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const explorerUrl = getSolanaExplorerUrl(signature);

      setTransactionState({
        status: "success",
        txHash: signature,
        explorerUrl,
      });

      return signature;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Transaction failed";
      setTransactionState({
        status: "error",
        error: errorMessage,
      });
      throw error;
    }
  };

  const resetTransaction = () => {
    setTransactionState({ status: "idle" });
  };

  const isLoading = transactionState.status === "connecting" || 
                   transactionState.status === "signing" || 
                   transactionState.status === "sending" || 
                   transactionState.status === "confirming";

  return {
    sendTokens,
    transactionState,
    resetTransaction,
    isLoading,
    isPhantomAvailable,
  };
}

// Get available Solana tokens
export function useSolanaTokens() {
  return Object.values(SOLANA_TOKENS).map(token => ({
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    address: token.mintAddress,
  }));
}