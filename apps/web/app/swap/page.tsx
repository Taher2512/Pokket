"use client";

import React from "react";
import { SwapToPyusd } from "../../components/SwapToPyusd";
import ResponsiveNavbar from "../../components/ResponsiveNavbar";

export default function SwapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20">
      <ResponsiveNavbar />

      {/* Main Content */}
      <main className="pt-24 pb-20 md:pb-8 md:pt-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Swap to PYUSD
            </h1>

            {/* Volatility Warning */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 max-w-2xl mx-auto">
              <div className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    Important Notice
                  </h3>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    PYUSD is a stablecoin pegged to the US Dollar. While stable,
                    all cryptocurrency transactions carry inherent risks. Please
                    ensure you understand the implications before proceeding.
                  </p>
                </div>
              </div>
            </div>

            {/* Swap Component */}
            <div className="max-w-md mx-auto">
              <SwapToPyusd />
            </div>

            {/* Additional Info */}
            <div className="mt-12 max-w-2xl mx-auto text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                About PYUSD
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    USD Pegged
                  </h3>
                  <p className="text-gray-600 text-sm">
                    PYUSD is backed 1:1 with US Dollar reserves, providing
                    stability for your digital transactions.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Regulated
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Issued by PayPal under regulatory oversight, ensuring
                    compliance and transparency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
