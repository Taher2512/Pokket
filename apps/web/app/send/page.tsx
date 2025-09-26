"use client";

import React from "react";
import QRPaymentFlow from "../../components/QRPaymentFlow";
import ResponsiveNavbar from "../../components/ResponsiveNavbar";

export default function SendPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20">
      <ResponsiveNavbar />

      {/* Main Content */}
      <main className="pt-20 pb-20 md:pb-8 md:pt-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Send Payment
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Scan or upload a QR code to send payment to anyone
            </p>
          </div>

          <QRPaymentFlow />
        </div>
      </main>
    </div>
  );
}