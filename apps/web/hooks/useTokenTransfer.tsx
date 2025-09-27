"use client";

import React, { useState } from "react";
import { useWallet, useNetwork } from "../contexts/WalletContext";
import { 
  sendToken, 
  estimateGas, 
  TokenTransferParams, 
  NETWORKS,
  getBlockExplorerUrl,
  COMMON_TOKENS 
} from "../lib/wallet";

export interface TransactionResult {
  hash: string;
  blockExplorerUrl: string;
  networkName: string;
}

export interface TokenSendParams extends TokenTransferParams {
  network: "ethereum" | "base";
}

interface TransactionState {
  status: "idle" | "estimating" | "confirming" | "mining" | "success" | "error";
  hash?: string;
  error?: string;
  gasEstimate?: {
    gasLimit: bigint;
    gasPrice: bigint;
    estimatedCost: string;
  };
}

export function useTokenTransfer() {
  const { wallet, switchToNetwork } = useWallet();
  const { chainId } = useNetwork();
  const [transactionState, setTransactionState] = useState<TransactionState>({
    status: "idle"
  });

  const sendTokens = async (params: TokenSendParams): Promise<TransactionResult> => {
    if (!wallet) {
      throw new Error("Wallet not connected");
    }

    const targetNetwork = params.network === "ethereum" ? "ETHEREUM" : "BASE";
    const targetChainId = NETWORKS[targetNetwork].id;

    try {
      // Step 1: Switch network if needed
      if (chainId !== targetChainId) {
        setTransactionState({ status: "estimating" });
        await switchToNetwork(targetNetwork);
        
        // Wait a bit for network switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Step 2: Estimate gas
      setTransactionState({ status: "estimating" });
      const gasEstimate = await estimateGas(wallet.signer, params);
      
      setTransactionState({ 
        status: "confirming", 
        gasEstimate 
      });

      // Step 3: Send transaction
      const tx = await sendToken(wallet.signer, params);
      
      setTransactionState({ 
        status: "mining", 
        hash: tx.hash,
        gasEstimate 
      });

      // Step 4: Wait for confirmation
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error("Transaction failed");
      }

      const result: TransactionResult = {
        hash: tx.hash,
        blockExplorerUrl: getBlockExplorerUrl(targetChainId, tx.hash),
        networkName: NETWORKS[targetNetwork].chainName,
      };

      setTransactionState({ 
        status: "success", 
        hash: tx.hash,
        gasEstimate 
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Transaction failed";
      
      setTransactionState({ 
        status: "error", 
        error: errorMessage 
      });
      
      throw error;
    }
  };

  const resetTransaction = () => {
    setTransactionState({ status: "idle" });
  };

  return {
    sendTokens,
    transactionState,
    resetTransaction,
    isLoading: ["estimating", "confirming", "mining"].includes(transactionState.status),
  };
}

// Component for displaying transaction status
interface TransactionStatusProps {
  transactionState: TransactionState;
  onClose?: () => void;
  onRetry?: () => void;
}

export function TransactionStatus({ 
  transactionState, 
  onClose, 
  onRetry 
}: TransactionStatusProps) {
  const { status, hash, error, gasEstimate } = transactionState;

  if (status === "idle") return null;

  const getStatusConfig = () => {
    switch (status) {
      case "estimating":
        return {
          title: "Estimating Gas",
          description: "Calculating transaction fees...",
          icon: "loading",
          color: "blue",
        };
      case "confirming":
        return {
          title: "Confirm Transaction",
          description: gasEstimate 
            ? `Estimated cost: ${gasEstimate.estimatedCost} ETH`
            : "Please confirm the transaction in your wallet",
          icon: "confirm",
          color: "blue",
        };
      case "mining":
        return {
          title: "Transaction Pending",
          description: "Your transaction is being processed...",
          icon: "loading",
          color: "yellow",
        };
      case "success":
        return {
          title: "Transaction Successful!",
          description: "Your payment has been sent successfully",
          icon: "success",
          color: "green",
        };
      case "error":
        return {
          title: "Transaction Failed",
          description: error || "An error occurred",
          icon: "error",
          color: "red",
        };
      default:
        return {
          title: "Processing",
          description: "Please wait...",
          icon: "loading",
          color: "blue",
        };
    }
  };

  const config = getStatusConfig();
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
    green: "bg-green-50 border-green-200 text-green-900",
    red: "bg-red-50 border-red-200 text-red-900",
  };

  const iconClasses = {
    blue: "text-blue-600",
    yellow: "text-yellow-600",
    green: "text-green-600",
    red: "text-red-600",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[config.color as keyof typeof colorClasses]}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {config.icon === "loading" && (
            <div className={`w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin ${iconClasses[config.color as keyof typeof iconClasses]}`} />
          )}
          {config.icon === "confirm" && (
            <svg className={`w-5 h-5 ${iconClasses[config.color as keyof typeof iconClasses]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )}
          {config.icon === "success" && (
            <svg className={`w-5 h-5 ${iconClasses[config.color as keyof typeof iconClasses]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {config.icon === "error" && (
            <svg className={`w-5 h-5 ${iconClasses[config.color as keyof typeof iconClasses]}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{config.title}</p>
          <p className="text-sm mt-1 opacity-90">{config.description}</p>
          
          {hash && (
            <div className="mt-3">
              <a
                href={getBlockExplorerUrl(1, hash)} // Default to Ethereum, should be dynamic
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline hover:no-underline"
              >
                View on block explorer →
              </a>
            </div>
          )}
          
          {status === "error" && onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          )}
          
          {(status === "success" || status === "error") && onClose && (
            <button
              onClick={onClose}
              className="mt-3 ml-4 text-sm underline hover:no-underline"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for getting token options based on network
export function useNetworkTokens(network: "ethereum" | "base") {
  const tokens = network === "ethereum" 
    ? [
        { symbol: "ETH", name: "Ethereum", address: "", decimals: 18 },
        { symbol: "USDC", name: "USD Coin", address: COMMON_TOKENS.ETHEREUM.USDC, decimals: 6 },
        { symbol: "USDT", name: "Tether USD", address: COMMON_TOKENS.ETHEREUM.USDT, decimals: 6 },
        { symbol: "WETH", name: "Wrapped Ethereum", address: COMMON_TOKENS.ETHEREUM.WETH, decimals: 18 },
      ]
    : [
        { symbol: "ETH", name: "Ethereum", address: "", decimals: 18 },
        { symbol: "USDC", name: "USD Coin", address: COMMON_TOKENS.BASE.USDC, decimals: 6 },
        { symbol: "WETH", name: "Wrapped Ethereum", address: COMMON_TOKENS.BASE.WETH, decimals: 18 },
      ];

  return tokens;
}