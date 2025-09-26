"use client";

import { useState, useEffect } from "react";

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

export function SwapToPyusd() {
  const [tokens, setTokens] = useState<Record<string, Token>>({});
  const [selectedToken, setSelectedToken] = useState<string>("");
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

  // Load supported tokens on mount
  useEffect(() => {
    loadSupportedTokens();
  }, []);

  const loadSupportedTokens = async () => {
    try {
      const response = await fetch("http://localhost:3001/swap/tokens");
      const data = await response.json();

      if (data.success) {
        setTokens(data.tokens);
        // Default to ETH
        if (data.tokens.ETH) {
          setSelectedToken(data.tokens.ETH.address);
        }
      }
    } catch (err) {
      console.error("Failed to load tokens:", err);
      setError("Failed to load supported tokens");
    }
  };

  const getQuote = async () => {
    if (!selectedToken || !amount || parseFloat(amount) <= 0) {
      setError("Please select a token and enter a valid amount");
      return;
    }

    setIsQuoting(true);
    setError("");
    setQuote(null);

    try {
      const selectedTokenInfo = Object.values(tokens).find(
        (t) => t.address === selectedToken
      );
      if (!selectedTokenInfo) {
        throw new Error("Invalid token selected");
      }

      // Convert amount to smallest units based on decimals
      const amountInSmallestUnits = (
        parseFloat(amount) * Math.pow(10, selectedTokenInfo.decimals)
      ).toString();

      const response = await fetch("http://localhost:3001/swap/quote", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          srcToken: selectedToken,
          amount: amountInSmallestUnits,
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
    if (!quote || !selectedToken || !amount) {
      setError("Please get a quote first");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    setTxHash("");

    try {
      const selectedTokenInfo = Object.values(tokens).find(
        (t) => t.address === selectedToken
      );
      if (!selectedTokenInfo) {
        throw new Error("Invalid token selected");
      }

      const amountInSmallestUnits = (
        parseFloat(amount) * Math.pow(10, selectedTokenInfo.decimals)
      ).toString();

      const response = await fetch("http://localhost:3001/swap/execute", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          srcToken: selectedToken,
          amount: amountInSmallestUnits,
          slippage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Swap executed successfully!");
        setTxHash(data.swapTxHash);
        // Reset form
        setAmount("");
        setQuote(null);
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

  const formatAmount = (amountStr: string, decimals: number) => {
    const amount = parseFloat(amountStr) / Math.pow(10, decimals);
    return amount.toFixed(6);
  };

  return (
    <div className="w-full max-w-lg mx-auto card">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Convert to PYUSD
            </h2>
            <p className="text-sm text-gray-600">
              Swap your assets to PYUSD for seamless PayPal integration
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Token Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            From Token
          </label>
          <div className="relative">
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">Select token to swap</option>
              {Object.values(tokens).map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.000001"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-lg font-medium"
            />
            {selectedToken && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">
                {
                  Object.values(tokens).find((t) => t.address === selectedToken)
                    ?.symbol
                }
              </div>
            )}
          </div>
        </div>

        {/* Slippage */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Slippage Tolerance
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 5].map((value) => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  slippage === value
                    ? "bg-orange-100 text-orange-700 border-2 border-orange-200"
                    : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>

        {/* Quote Button */}
        <button
          onClick={getQuote}
          disabled={isQuoting || !selectedToken || !amount}
          className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:ring-2 focus:ring-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isQuoting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Getting Quote...
            </span>
          ) : (
            "Get Quote"
          )}
        </button>

        {/* Quote Display */}
        {quote && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-600">
                  You pay:
                </span>
                <span className="font-bold text-gray-900">
                  {amount}{" "}
                  {
                    Object.values(tokens).find(
                      (t) => t.address === selectedToken
                    )?.symbol
                  }
                </span>
              </div>

              <div className="flex justify-center py-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex justify-between items-center py-2">
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
          </div>
        )}

        {/* Execute Swap Button */}
        {quote && (
          <button
            onClick={executeSwap}
            disabled={isLoading}
            className="w-full px-4 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-sm"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Executing Swap...
              </span>
            ) : (
              "Execute Swap"
            )}
          </button>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-900 mb-1">
                  Swap Failed
                </p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-900 mb-1">
                  Swap Successful!
                </p>
                <p className="text-sm text-green-800 mb-2">{success}</p>
                {txHash && (
                  <a
                    href={`https://etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    <span>View on Etherscan</span>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-xl">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900 mb-2">
                Why PYUSD?
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li className="flex items-center space-x-2">
                  <svg
                    className="w-3 h-3 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Stable value (USD-pegged stablecoin)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg
                    className="w-3 h-3 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Seamless PayPal integration for easy off-ramping</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg
                    className="w-3 h-3 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Reduced volatility and price stability</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
