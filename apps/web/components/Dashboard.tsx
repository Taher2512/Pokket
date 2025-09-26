"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useVerification } from "../contexts/VerificationContext";
import { apiService } from "../lib/api";
import { WalletInfo } from "../types";
import { TokenPortfolio } from "./TokenPortfolio";
import AddressQRCode from "./AddressQRCode";
import { VerificationButton } from "./VerificationButton";
import { NavbarVerifiedBadge } from "./VerifiedBadge";
import ResponsiveNavbar from "./ResponsiveNavbar";

export function Dashboard() {
  const { user, logout } = useAuth();
  const { verificationStatus } = useVerification();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadWalletInfo();
  }, []);

  const loadWalletInfo = async () => {
    try {
      setLoading(true);
      const walletData = await apiService.getUserWallet();
      setWallet(walletData);
    } catch (error) {
      console.error("Error loading wallet:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load wallet"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Modern toast would be better here, but using alert for now
      alert(`${label} copied to clipboard!`);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-16 h-16 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Dashboard
          </h3>
          <p className="text-gray-500">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center p-8">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-6 h-6 text-red-600"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Connection Error
          </h3>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">{error}</p>
          <button onClick={loadWalletInfo} className="btn-primary w-full">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20">
      <ResponsiveNavbar />

      {/* Main Content */}
      <main className="pt-20 pb-20 md:pb-8 md:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-left mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome, {user?.name?.split(" ")[0] || "User"}
            </h1>

            {/* Volatility Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Crypto volatility notice
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    Cryptocurrencies are highly volatile. Consider converting to
                    stable PayPal USD (PYUSD) to protect against price
                    fluctuations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="max-w-6xl mx-auto mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Portfolio Section - Left Side */}
              <div className="order-2 lg:order-1">
                <TokenPortfolio />
              </div>

              {/* QR Code Section - Right Side */}
              <div className="order-1 lg:order-2">
                <div className="sticky top-32">
                  <AddressQRCode className="shadow-2xl shadow-black/10" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Send Feature */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Send via QR Code
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Scan QR codes or upload images to send payments instantly to
                  any wallet address
                </p>
                <Link
                  href="/send"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg shadow-blue-500/25"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  <span>Start Sending</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Light Footer */}
          <div className="max-w-4xl mx-auto mt-24">
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-3xl p-8 shadow-xl shadow-black/5">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <div className="w-5 h-5 bg-white rounded-md transform rotate-45"></div>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    Pokket
                  </span>
                </div>

                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Secure, fast, and simple crypto transactions for everyone
                </p>

                <div className="flex items-center justify-center space-x-8 mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-700">Wallet Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Multi-Chain</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Encrypted</span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                  <span>© 2025 Pokket</span>
                  <span>•</span>
                  <span>Built with ❤️</span>
                  <span>•</span>
                  <span>Powered by Web3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
