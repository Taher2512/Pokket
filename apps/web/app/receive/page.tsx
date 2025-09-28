"use client";

import React from "react";
import AddressQRCode from "../../components/AddressQRCode";
import ResponsiveNavbar from "../../components/ResponsiveNavbar";

export default function ReceivePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20">
      <ResponsiveNavbar />

      {/* Main Content */}
      <main className="pt-20 pb-20 md:pb-8 md:pt-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Layout */}
          <div className="md:hidden">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Receive Payment
              </h1>
              <p className="text-gray-600">
                Share your QR code to receive payments
              </p>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:block text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Receive Payment
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Share your QR code or wallet address to receive payments
            </p>
          </div>

          {/* QR Code Component */}
          <div className="flex justify-center">
            <div className="w-full max-w-md md:max-w-lg">
              <AddressQRCode />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
