"use client";

import React, { useState, useEffect } from "react";
import { SelfQRcodeWrapper, SelfAppBuilder } from "@selfxyz/qrcode";
import { getUniversalLink } from "@selfxyz/core";
import { createVerificationService } from "../lib/verification";

interface SelfVerificationQRProps {
  userAddress: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function SelfVerificationQR({
  userAddress,
  onSuccess,
  onError,
}: SelfVerificationQRProps) {
  const [selfApp, setSelfApp] = useState<any>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    initializeSelfApp();
  }, [userAddress]);

  const initializeSelfApp = async () => {
    try {
      setError("");

      // Check if contract address is configured
      const contractAddress =
        process.env.NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error("Verification contract address not configured");
      }

      // Create Self app configuration
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Pokket Wallet",
        scope:
          process.env.NEXT_PUBLIC_SELF_SCOPE || "pokket-identity-verification",
        endpoint: contractAddress,
        endpointType: "staging_celo", // Celo testnet
        userIdType: "hex",
        userId: userAddress,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png", // Self protocol logo
        userDefinedData: JSON.stringify({
          platform: "pokket",
          timestamp: Date.now(),
          version: "1.0",
        }),
        disclosures: {
          // Age verification (18+) for Aadhar card
          minimumAge: 18,

          // No geographic restrictions
          excludedCountries: [],

          // OFAC compliance (disabled for testnet)
          ofac: false,

          // Data disclosures for Aadhar card verification
          name: true, // Full name from Aadhar
          date_of_birth: true, // Date of birth
          nationality: true, // Indian nationality
          issuing_state: true, // State that issued Aadhar
          // Note: Aadhar doesn't have expiry_date or passport_number
        },
      }).build();

      setSelfApp(app);

      // Generate universal link for mobile users
      const link = getUniversalLink(app);
      setUniversalLink(link);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to initialize verification";
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleSuccess = () => {
    console.log("✅ Identity verification successful!");
    onSuccess?.();
  };

  const handleError = () => {
    const errorMessage = "Failed to verify identity";
    console.error("❌", errorMessage);
    onError?.(errorMessage);
  };

  const openSelfApp = () => {
    if (universalLink) {
      window.open(universalLink, "_blank");
    }
  };

  if (error) {
    return (
      <div className="text-center p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={initializeSelfApp}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!selfApp) {
    return (
      <div className="text-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm">Initializing verification...</p>
      </div>
    );
  }

  return (
    <div className="text-center w-full">
      {/* QR Code Component - ensuring proper size and centering */}
      <div className="flex justify-center items-center mb-6 p-4">
        <div className="bg-white p-2 rounded-lg shadow-sm border">
          <SelfQRcodeWrapper
            selfApp={selfApp}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      </div>

      {/* Mobile Universal Link Button */}
      <div className="mb-4">
        <button
          onClick={openSelfApp}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.749z" />
          </svg>
          <span>Open Self App on Mobile</span>
        </button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>📱 On mobile: Tap the button above to open Self app directly</p>
        <p>💻 On desktop: Scan the QR code with your phone's Self app</p>
      </div>
    </div>
  );
}
