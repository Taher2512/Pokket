"use client";

import React, { useState } from "react";
import NetworkSelectionModal from "./NetworkSelectionModal";

interface QRPayload {
  name: string;
  ethAddress: string;
  solAddress: string;
  // Optional payment details
  amount?: string;
  tokenSymbol?: string;
  tokenAddress?: string;
  network?: "ethereum" | "base" | "solana";
  decimals?: number;
}

interface PaymentModalProps {
  paymentData: QRPayload;
  onClose: () => void;
}

export default function PaymentModal({
  paymentData,
  onClose,
}: PaymentModalProps) {
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const handleStartPayment = () => {
    setShowNetworkModal(true);
  };

  const handleCloseNetworkModal = () => {
    setShowNetworkModal(false);
    onClose();
  };

  // If network modal is open, show that instead
  if (showNetworkModal) {
    return (
      <NetworkSelectionModal
        paymentData={paymentData}
        onClose={handleCloseNetworkModal}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 z-10"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl font-bold text-white">
                {paymentData.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Pay {paymentData.name}
            </h2>
            <p className="text-gray-500 text-sm">
              {paymentData.amount && paymentData.tokenSymbol 
                ? `${paymentData.amount} ${paymentData.tokenSymbol}`
                : "Multi-chain payment support"}
            </p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="px-6 pb-4">
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ethereum Address:</span>
                <span className="font-mono text-xs text-gray-900 break-all">
                  {paymentData.ethAddress.slice(0, 6)}...{paymentData.ethAddress.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Solana Address:</span>
                <span className="font-mono text-xs text-gray-900 break-all">
                  {paymentData.solAddress.slice(0, 6)}...{paymentData.solAddress.slice(-4)}
                </span>
              </div>
              {paymentData.amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-gray-900">
                    {paymentData.amount} {paymentData.tokenSymbol || "Token"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handleStartPayment}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl py-4 px-6 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Choose Payment Method
          </button>
        </div>

        {/* Supported Networks */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500 text-center mb-3">Supported Networks</p>
          <div className="flex justify-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Ethereum</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Base</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Solana</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
