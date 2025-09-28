"use client";

import React, { useState } from "react";
import ResponsiveNavbar from "../../components/ResponsiveNavbar";
import WithdrawModal from "../../components/WithdrawModal";
import { useUserBalance } from "../../hooks/useUserBalance";
import { Wallet, ExternalLink, Loader2, ArrowUpRight } from "lucide-react";

export default function WithdrawPage() {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawType, setWithdrawType] = useState<"wallet" | "offramp" | null>(
    null
  );

  const { balance, loading, error } = useUserBalance();

  const handleWithdrawOption = (type: "wallet" | "offramp") => {
    setWithdrawType(type);
    setShowWithdrawModal(true);
  };

  const closeModal = () => {
    setShowWithdrawModal(false);
    setWithdrawType(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveNavbar />
        <main className="pt-20 pb-20 md:pb-8 md:pt-28">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <ResponsiveNavbar />
        <main className="pt-20 pb-20 md:pb-8 md:pt-28">
          <div className="max-w-md mx-auto px-4 text-center py-20">
            <p className="text-red-600">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ResponsiveNavbar />

      <main className="pt-20 pb-20 md:pb-8 md:pt-28">
        <div className="max-w-md mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Withdraw</h1>
            <p className="text-gray-600">
              Transfer funds to external wallets or convert to cash
            </p>
          </div>

          {/* Total Balance */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-center">
            <p className="text-sm text-gray-600 mb-1">Total Portfolio</p>
            <p className="text-3xl font-bold text-gray-900">
              ${balance.total.toFixed(2)}
            </p>
          </div>

          {/* Token Balances */}
          <div className="space-y-3 mb-8">
            {/* PYUSD - Always first and highlighted */}
            <div className="relative flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 via-orange-100 to-yellow-50 border-2 border-orange-200 rounded-xl shadow-sm">
              {/* Default Stable Currency Badge */}
              <div className="absolute -top-2 -right-2">
                <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-medium rounded-full shadow-sm">
                  Default Stable Currency
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">PY</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">PYUSD</p>
                    <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Stable
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">PayPal USD</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 text-lg">
                  {balance.pyusd.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  ${balance.pyusd.toFixed(2)}
                </p>
              </div>
            </div>

            {/* ETH - Secondary position */}
            {balance.eth > 0 && (
              <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-sm">Ξ</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">ETH</p>
                    <p className="text-sm text-gray-500">Ethereum</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {balance.ethAmount.toFixed(6)} ETH
                  </p>
                  <p className="text-sm text-gray-500">
                    ${balance.eth.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {balance.total === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">No funds available</p>
                <p className="text-sm text-gray-500">
                  Add funds to your account to start withdrawing
                </p>
              </div>
            )}
          </div>

          {/* Withdraw Options */}
          {balance.total > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Withdrawal Options
              </h2>

              {/* Withdraw to Wallet */}
              <button
                onClick={() => handleWithdrawOption("wallet")}
                className="w-full p-6 bg-white border border-gray-200 rounded-2xl hover:border-orange-300 hover:bg-orange-50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <Wallet className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Withdraw to Wallet
                      </h3>
                      <p className="text-sm text-gray-600">
                        Send funds directly to your external wallet
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
              </button>

              {/* Offramp to Cash */}
              <button
                onClick={() => handleWithdrawOption("offramp")}
                className="w-full p-6 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 transition-all group relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Offramp to Cash
                      </h3>
                      <p className="text-sm text-gray-600">
                        Convert PYUSD to your bank account
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-gray-500 transition-colors" />
                </div>

                {/* Coming Soon Badge */}
                <div className="absolute top-2 right-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                  Soon
                </div>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Withdraw Modal */}
      {showWithdrawModal && withdrawType && (
        <WithdrawModal
          type={withdrawType}
          userBalance={balance}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
