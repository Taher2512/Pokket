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
    // Here you would integrate with the actual payment methods
    switch (method) {
      case "pokket":
        console.log("Paying via Pokket to:", paymentData.ethAddress);
        alert(`Redirecting to Pokket wallet to pay ${paymentData.name}...`);
        break;
      case "base":
        console.log("Paying via Base to:", paymentData.ethAddress);
        alert(`Redirecting to Base network to pay ${paymentData.name}...`);
        break;
      case "phantom":
        console.log("Paying via Phantom to:", paymentData.solAddress);
        alert(`Redirecting to Phantom wallet to pay ${paymentData.name}...`);
        break;
    }

    onClose();
  };

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
                  {/* Pokket Logo - same as navbar */}
                  <div className="w-5 h-5 bg-white rounded-sm transform rotate-45"></div>
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
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C18.627 0 24 5.373 24 12C24 18.627 18.627 24 12 24C5.373 24 0 18.627 0 12C0 5.373 5.373 0 12 0ZM12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM12 6C15.314 6 18 8.686 18 12C18 15.314 15.314 18 12 18C8.686 18 6 15.314 6 12C6 8.686 8.686 6 12 6Z" />
                  </svg>
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
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5.2084 16.4C5.7776 16.4 6.2416 15.936 6.2416 15.3668V8.6332C6.2416 8.064 5.7776 7.6 5.2084 7.6C4.6392 7.6 4.1752 8.064 4.1752 8.6332V15.3668C4.1752 15.936 4.6392 16.4 5.2084 16.4ZM18.7916 16.4C19.3608 16.4 19.8248 15.936 19.8248 15.3668V8.6332C19.8248 8.064 19.3608 7.6 18.7916 7.6C18.2224 7.6 17.7584 8.064 17.7584 8.6332V15.3668C17.7584 15.936 18.2224 16.4 18.7916 16.4ZM12 22C17.5228 22 22 17.5228 22 12C22 6.4772 17.5228 2 12 2C6.4772 2 2 6.4772 2 12C2 17.5228 6.4772 22 12 22ZM12 20C7.5817 20 4 16.4183 4 12C4 7.5817 7.5817 4 12 4C16.4183 4 20 7.5817 20 12C20 16.4183 16.4183 20 12 20ZM8 12C8 13.1046 8.8954 14 10 14C11.1046 14 12 13.1046 12 12C12 10.8954 11.1046 10 10 10C8.8954 10 8 10.8954 8 12ZM12 12C12 13.1046 12.8954 14 14 14C15.1046 14 16 13.1046 16 12C16 10.8954 15.1046 10 14 10C12.8954 10 12 10.8954 12 12Z" />
                  </svg>
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
