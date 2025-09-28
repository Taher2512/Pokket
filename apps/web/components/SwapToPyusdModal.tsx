"use client";

import { useState, useEffect } from "react";
import { X, ArrowDown, Zap } from "lucide-react";

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

interface SwapQuote {
  srcAmount: string;
  dstAmount: string;
  estimatedGas: string;
  protocols: any[];
}

interface SwapToPyusdModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    balance: string;
    balanceFormatted: string;
    logoURI?: string;
  };
}

export function SwapToPyusdModal({
  isOpen,
  onClose,
  token,
}: SwapToPyusdModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(1);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");

  // Get auth token from localStorage
  const getAuthToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("authToken");
  };

  // Create authenticated request headers
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setQuote(null);
      setError("");
      setSuccess("");
      setTxHash("");
    }
  }, [isOpen]);

  const formatAmount = (amount: string, decimals: number): string => {
    const num = parseFloat(amount) / Math.pow(10, decimals);
    // For PYUSD (6 decimals), show appropriate precision
    if (decimals === 6) {
      return num.toFixed(2); // Show 2 decimal places for PYUSD
    }
    return num.toFixed(6);
  };

  const getQuote = async () => {
    if (!amount || !token) {
      setError("Please enter an amount");
      return;
    }

    setIsQuoting(true);
    setError("");
    setQuote(null);

    try {
      // Use the actual decimals from the token data
      const decimals = token.decimals;
      const amountInSmallestUnits = (
        parseFloat(amount) * Math.pow(10, decimals)
      ).toString();

      const response = await fetch("http://localhost:3001/swap/quote", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          srcToken: token.address,
          amount: amountInSmallestUnits,
          slippage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setQuote(data.quote);
      } else {
        throw new Error(data.error || "Failed to get quote");
      }
    } catch (err) {
      console.error("Quote error:", err);
      setError((err as Error).message);
    } finally {
      setIsQuoting(false);
    }
  };

  const executeSwap = async () => {
    if (!quote || !token || !amount) {
      setError("Please get a quote first");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    setTxHash("");

    try {
      // Use the actual decimals from the token data
      const decimals = token.decimals;
      const amountInSmallestUnits = (
        parseFloat(amount) * Math.pow(10, decimals)
      ).toString();

      const response = await fetch("http://localhost:3001/swap/execute", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          srcToken: token.address,
          amount: amountInSmallestUnits,
          slippage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Swap executed successfully!");
        setTxHash(data.txHash);
        setQuote(null);
        setAmount("");

        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(data.error || "Failed to execute swap");
      }
    } catch (err) {
      console.error("Swap error:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const setMaxAmount = () => {
    setAmount(token.balanceFormatted);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Swap to PYUSD
                </h3>
                <p className="text-sm text-gray-500">
                  Convert {token.symbol} to PYUSD
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-green-900">
                    {success}
                  </h4>
                  {txHash && (
                    <p className="text-xs text-green-700 mt-1">
                      Transaction Hash: {txHash.slice(0, 10)}...
                      {txHash.slice(-8)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm text-red-900">{error}</p>
              </div>
            </div>
          )}

          {/* From Token */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              From
            </label>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {token.logoURI ? (
                    <img
                      src={token.logoURI}
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {token.symbol.slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {token.symbol}
                    </p>
                    <p className="text-sm text-gray-500">{token.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Balance:</p>
                  <p className="font-medium text-gray-900">
                    {token.balanceFormatted}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Amount to Swap
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.000001"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 pr-16 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-lg font-medium"
              />
              <button
                type="button"
                onClick={setMaxAmount}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Slippage */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Slippage Tolerance
            </label>
            <div className="flex space-x-2">
              {[0.5, 1, 2, 3].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                    slippage === value
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>

          {/* Get Quote Button */}
          {!quote && (
            <button
              onClick={getQuote}
              disabled={isQuoting || !amount}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isQuoting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Getting Quote...</span>
                </div>
              ) : (
                "Get Quote"
              )}
            </button>
          )}

          {/* Quote Display */}
          {quote && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-600">
                    You pay:
                  </span>
                  <span className="font-bold text-gray-900 text-lg">
                    {amount} {token.symbol}
                  </span>
                </div>

                <div className="flex justify-center py-3">
                  <ArrowDown className="w-6 h-6 text-gray-400" />
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-600">
                    You receive:
                  </span>
                  <span className="font-bold text-green-600 text-lg">
                    {formatAmount(quote.dstAmount, 6)} PYUSD
                  </span>
                </div>

                <div className="border-t border-green-200 pt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Estimated gas:</span>
                  <span className="text-xs text-gray-700 font-medium">
                    {parseInt(quote.estimatedGas).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Execute Swap Button */}
              <button
                onClick={executeSwap}
                disabled={isLoading}
                className="w-full px-4 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing Swap...</span>
                  </div>
                ) : (
                  `Swap ${token.symbol} to PYUSD`
                )}
              </button>

              <button
                onClick={() => setQuote(null)}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                Get New Quote
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
