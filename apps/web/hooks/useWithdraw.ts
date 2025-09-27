import { useState, useCallback, useEffect } from "react";
import {
  web3Service,
  DetectedWallet,
  TransactionResult,
} from "../services/web3Service";

export interface UseWithdrawState {
  // Wallet detection
  detectedWallets: DetectedWallet[];
  isDetecting: boolean;

  // Connection state
  connectedWallet: DetectedWallet | null;
  connectedAddress: string | null;
  chainId: number | null;
  networkName: string | null;

  // Transaction state
  isConnecting: boolean;
  isWithdrawing: boolean;
  withdrawResult: TransactionResult | null;

  // Balance state
  walletBalance: string | null;
  isLoadingBalance: boolean;

  // Error state
  error: string | null;
}

export interface UseWithdrawActions {
  detectWallets: () => Promise<void>;
  connectWallet: (wallet: DetectedWallet) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  getWalletBalance: (address?: string, tokenAddress?: string) => Promise<void>;
  estimateGas: (
    amount: string,
    recipientAddress: string,
    tokenAddress?: string
  ) => Promise<{
    gasLimit: string;
    gasPrice: string;
    totalCost: string;
  } | null>;
  executeWithdraw: (
    amount: string,
    recipientAddress: string,
    tokenAddress?: string
  ) => Promise<void>;
  clearError: () => void;
  clearWithdrawResult: () => void;
}

export interface UseWithdrawReturn
  extends UseWithdrawState,
    UseWithdrawActions {}

export const useWithdraw = (): UseWithdrawReturn => {
  const [state, setState] = useState<UseWithdrawState>({
    detectedWallets: [],
    isDetecting: false,
    connectedWallet: null,
    connectedAddress: null,
    chainId: null,
    networkName: null,
    isConnecting: false,
    isWithdrawing: false,
    withdrawResult: null,
    walletBalance: null,
    isLoadingBalance: false,
    error: null,
  });

  // Detect wallets
  const detectWallets = useCallback(async () => {
    setState((prev) => ({ ...prev, isDetecting: true, error: null }));

    try {
      // Add artificial delay for better UX
      const [wallets] = await Promise.all([
        web3Service.detectWallets(),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);

      setState((prev) => ({
        ...prev,
        detectedWallets: wallets,
        isDetecting: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        isDetecting: false,
      }));
    }
  }, []);

  // Connect to wallet
  const connectWallet = useCallback(async (wallet: DetectedWallet) => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      if (wallet.network === "ethereum" || wallet.network === "both") {
        const { address, chainId } = await web3Service.connectEthereumWallet(
          wallet.id
        );
        const networkName = web3Service.getNetworkName(chainId);

        setState((prev) => ({
          ...prev,
          connectedWallet: wallet,
          connectedAddress: address,
          chainId,
          networkName,
          isConnecting: false,
        }));
      } else if (wallet.network === "solana") {
        const { address } = await web3Service.connectSolanaWallet(wallet.id);

        setState((prev) => ({
          ...prev,
          connectedWallet: wallet,
          connectedAddress: address,
          chainId: null,
          networkName: "Solana",
          isConnecting: false,
        }));
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        isConnecting: false,
      }));
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      await web3Service.disconnect();
      setState((prev) => ({
        ...prev,
        connectedWallet: null,
        connectedAddress: null,
        chainId: null,
        networkName: null,
        walletBalance: null,
        error: null,
        withdrawResult: null,
      }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  }, []);

  // Get wallet balance
  const getWalletBalance = useCallback(
    async (address?: string, tokenAddress?: string) => {
      const targetAddress = address || state.connectedAddress;
      if (!targetAddress || !state.connectedWallet) return;

      setState((prev) => ({ ...prev, isLoadingBalance: true, error: null }));

      try {
        let balance: string;

        if (
          state.connectedWallet.network === "ethereum" ||
          state.connectedWallet.network === "both"
        ) {
          balance = await web3Service.getEthereumBalance(
            targetAddress,
            tokenAddress
          );
        } else if (state.connectedWallet.network === "solana") {
          balance = await web3Service.getSolanaBalance(targetAddress);
        } else {
          throw new Error("Unsupported network");
        }

        setState((prev) => ({
          ...prev,
          walletBalance: balance,
          isLoadingBalance: false,
        }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message,
          isLoadingBalance: false,
        }));
      }
    },
    [state.connectedAddress, state.connectedWallet]
  );

  // Estimate gas
  const estimateGas = useCallback(
    async (
      amount: string,
      recipientAddress: string,
      tokenAddress?: string
    ): Promise<{
      gasLimit: string;
      gasPrice: string;
      totalCost: string;
    } | null> => {
      if (!state.connectedWallet || !state.connectedAddress) {
        setState((prev) => ({ ...prev, error: "Wallet not connected" }));
        return null;
      }

      if (state.connectedWallet.network === "solana") {
        // Solana has fixed fees, return estimated fee
        return {
          gasLimit: "1",
          gasPrice: "0.000005",
          totalCost: "0.000005",
        };
      }

      try {
        const gasEstimate = await web3Service.estimateEthereumGas({
          amount,
          recipientAddress,
          tokenAddress,
          network: "ethereum",
        });
        return gasEstimate;
      } catch (error: any) {
        setState((prev) => ({ ...prev, error: error.message }));
        return null;
      }
    },
    [state.connectedWallet, state.connectedAddress]
  );

  // Execute withdrawal
  const executeWithdraw = useCallback(
    async (amount: string, recipientAddress: string, tokenAddress?: string) => {
      if (!state.connectedWallet || !state.connectedAddress) {
        setState((prev) => ({ ...prev, error: "Wallet not connected" }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isWithdrawing: true,
        error: null,
        withdrawResult: null,
      }));

      try {
        let result: TransactionResult;

        if (
          state.connectedWallet.network === "ethereum" ||
          state.connectedWallet.network === "both"
        ) {
          result = await web3Service.withdrawEthereum({
            amount,
            recipientAddress,
            tokenAddress,
            network: "ethereum",
          });
        } else if (state.connectedWallet.network === "solana") {
          result = await web3Service.withdrawSolana({
            amount,
            recipientAddress,
            network: "solana",
          });
        } else {
          throw new Error("Unsupported network");
        }

        setState((prev) => ({
          ...prev,
          withdrawResult: result,
          isWithdrawing: false,
        }));

        // Refresh balance after successful transaction
        if (result.success && state.connectedAddress) {
          setTimeout(() => {
            getWalletBalance(state.connectedAddress!, tokenAddress);
          }, 2000);
        }
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message,
          isWithdrawing: false,
        }));
      }
    },
    [state.connectedWallet, state.connectedAddress, getWalletBalance]
  );

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Clear withdraw result
  const clearWithdrawResult = useCallback(() => {
    setState((prev) => ({ ...prev, withdrawResult: null }));
  }, []);

  // Auto-detect wallets on mount
  useEffect(() => {
    detectWallets();
  }, [detectWallets]);

  return {
    ...state,
    detectWallets,
    connectWallet,
    disconnectWallet,
    getWalletBalance,
    estimateGas,
    executeWithdraw,
    clearError,
    clearWithdrawResult,
  };
};
