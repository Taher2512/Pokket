"use client";

import React, { useEffect, useState } from "react";
import { apiService } from "../lib/api";
import { PortfolioSummary, TokenInfo } from "../types";

interface TokenPortfolioProps {
  className?: string;
}

export function TokenPortfolio({ className = "" }: TokenPortfolioProps) {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      setError("");
      const portfolioData = await apiService.getUserPortfolio();
      setPortfolio(portfolioData);
    } catch (error) {
      console.error("Error loading portfolio:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load portfolio"
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshPortfolio = async () => {
    try {
      setRefreshing(true);
      setError("");
      const portfolioData = await apiService.getUserPortfolio();
      setPortfolio(portfolioData);
    } catch (error) {
      console.error("Error refreshing portfolio:", error);
      setError(
        error instanceof Error ? error.message : "Failed to refresh portfolio"
      );
    } finally {
      setRefreshing(false);
    }
  };

  const formatUSD = (value: number | undefined) => {
    if (value === undefined || value === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatBalance = (balanceFormatted: string) => {
    const num = parseFloat(balanceFormatted);
    if (isNaN(num) || num === 0) return "0";
    if (num < 0.000001) return "< 0.000001";

    // For very small numbers, show more precision
    if (num < 0.01) {
      return num.toFixed(6).replace(/\.?0+$/, "");
    }

    // For larger numbers, use locale formatting with appropriate precision
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: num < 1 ? 6 : 2,
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      alert(`${label} copied to clipboard!`);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (loading) {
    return (
      <div className={`card p-8 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
              <div
                className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-orange-300 rounded-full animate-spin mx-auto opacity-60"
                style={{ animationDelay: "150ms" }}
              ></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading Portfolio
            </h3>
            <p className="text-gray-600">Discovering your tokens...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card p-8 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Unable to Load Portfolio
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={loadPortfolio} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-6 ${className}`}>
      {/* Header with Refresh */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Token Portfolio</h2>
          <p className="text-sm text-gray-600">
            Your digital assets across all networks
          </p>
        </div>
        <button
          onClick={refreshPortfolio}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="text-sm font-medium">
            {refreshing ? "Updating..." : "Refresh"}
          </span>
        </button>
      </div>

      {/* Total Portfolio Value */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-800 mb-1">
              Total Portfolio Value
            </p>
            <p className="text-3xl font-bold text-orange-900">
              {formatUSD(portfolio?.totalValueUSD)}
            </p>
            {portfolio?.ethValueUSD && (
              <p className="text-sm text-orange-700 mt-2">
                ETH: {portfolio.ethBalanceFormatted} ETH (~
                {formatUSD(portfolio.ethValueUSD)})
              </p>
            )}
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Tokens List */}
      {!portfolio || portfolio.tokens.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Tokens Found
          </h3>
          <p className="text-gray-600 mb-4">
            Your wallet doesn't have any ERC-20 tokens yet.
          </p>
          <p className="text-sm text-gray-500">
            Send some tokens to your address and refresh to see them here.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Your Tokens ({portfolio.tokens.length})
            </h3>
            <div className="text-sm text-gray-600">
              Auto-discovered via smart contract analysis
            </div>
          </div>

          <div className="space-y-3">
            {portfolio.tokens.map((token) => (
              <div
                key={token.address}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  {/* Token Icon/Logo */}
                  <div className="relative">
                    {token.logoURI ? (
                      <img
                        src={token.logoURI}
                        alt={token.symbol}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          // Show fallback after image fails to load
                          const fallback = (e.target as HTMLImageElement)
                            .nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}
                    {/* Fallback icon - always rendered but hidden unless needed */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        token.logoURI ? "hidden" : "flex"
                      } ${
                        token.symbol === "ETH"
                          ? "bg-gradient-to-br from-gray-400 to-gray-600"
                          : "bg-gradient-to-br from-blue-400 to-blue-600"
                      }`}
                      style={token.logoURI ? { display: "none" } : {}}
                    >
                      {token.symbol === "ETH" ? (
                        // Special ETH diamond logo
                        <svg
                          className="w-6 h-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
                        </svg>
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {token.symbol.slice(0, 2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Token Info */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900">
                        {token.symbol}
                      </h4>
                      <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                        {token.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-600 font-mono">
                        {token.address.slice(0, 6)}...{token.address.slice(-4)}
                      </p>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            token.address,
                            `${token.symbol} address`
                          )
                        }
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                      >
                        <svg
                          className="w-3 h-3 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Token Balance & Value */}
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatBalance(token.balanceFormatted)} {token.symbol}
                  </p>
                  {token.priceUSD && token.valueUSD && (
                    <div className="text-sm text-gray-600 mt-1">
                      <div>{formatUSD(token.valueUSD)}</div>
                      <div className="text-xs text-gray-500">
                        @ {formatUSD(token.priceUSD)} per {token.symbol}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Discovery Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
            <svg
              className="w-3 h-3 text-white"
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
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              Automatic Token Discovery
            </h4>
            <p className="text-sm text-blue-800">
              Tokens are automatically discovered by scanning blockchain
              transactions. Send any ERC-20 token to your address and it will
              appear here after the next refresh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
