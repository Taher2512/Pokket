"use client";

import React from "react";

interface QRPayload {
  name: string;
  ethAddress: string;
  solAddress: string;
}

interface PaymentModalProps {
  paymentData: QRPayload;
  onClose: () => void;
}

export default function PaymentModal({
  paymentData,
  onClose,
}: PaymentModalProps) {
  const handlePaymentMethod = (method: "pokket" | "base" | "phantom") => {
    // Wallet functionality temporarily removed
    console.log(`${method} payment method selected for ${paymentData.name}`);

    // Show different messages for each payment method
    switch (method) {
      case "pokket":
        alert(`Pokket payment functionality coming soon!`);
        break;
      case "base":
        alert(`Base network payment functionality coming soon!`);
        break;
      case "phantom":
        alert(`Phantom wallet payment functionality coming soon!`);
        break;
    }

    onClose(); // Close modal after showing the message
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
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
            <p className="text-gray-500 text-sm">Choose your payment method</p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="px-6 pb-6 space-y-3">
          {/* Pokket */}
          <button
            onClick={() => handlePaymentMethod("pokket")}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-4 hover:from-orange-600 hover:to-orange-700 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {/* Pokket Logo */}
                  <img
                    src="/logo1.svg"
                    alt="Pokket"
                    className="w-6 h-6 object-contain filter brightness-0 invert"
                  />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-lg">Pokket</div>
                  <div className="text-sm opacity-90">Ethereum Network</div>
                </div>
              </div>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* Base */}
          <button
            onClick={() => handlePaymentMethod("base")}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-4 hover:from-blue-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {/* Base Logo */}
                  <img
                    src="/base-logo.svg"
                    alt="Base"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-lg">Base</div>
                  <div className="text-sm opacity-90">Layer 2 Network</div>
                </div>
              </div>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* Phantom */}
          <button
            onClick={() => handlePaymentMethod("phantom")}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-4 hover:from-purple-600 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {/* Phantom Logo */}
                  <img
                    src="/phantom-logo.svg"
                    alt="Phantom"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-lg">Phantom</div>
                  <div className="text-sm opacity-90">Solana Network</div>
                </div>
              </div>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </div>
  );
}
