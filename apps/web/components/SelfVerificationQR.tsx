"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { SelfQRcodeWrapper, SelfAppBuilder } from "@selfxyz/qrcode";
import { getUniversalLink } from "@selfxyz/core";
import { createVerificationService } from "../lib/verification";
import { generateWalletKeyPairsFromPrivateKey } from "../lib/wallet-generator";

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
  const [selfApp, setSelfApp] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [universalLink, setUniversalLink] = useState("");
  const [error, setError] = useState<string>("");

  const initializeSelfApp = useCallback(async () => {
    try {
      setError("");

      // Validate userAddress format
      if (!userAddress || !userAddress.startsWith('0x') || userAddress.length !== 42) {
        throw new Error("Invalid Ethereum address format");
      }

      // Check if contract address is configured
      const contractAddress =
        process.env.NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error("Verification contract address not configured");
      }

      // Validate contract address format
      if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) {
        throw new Error("Invalid contract address format");
      }

      // Generate proper keypairs for both ETH and SOL
      console.log('🔑 Generating keypairs for ETH and SOL addresses...');
      
      // Get or generate a master private key for deterministic wallet generation
      let masterPrivateKey = localStorage.getItem('pokket_master_private_key');
      if (!masterPrivateKey) {
        // Create a new random private key and store it
        const { ethers } = await import('ethers');
        const wallet = ethers.Wallet.createRandom();
        masterPrivateKey = wallet.privateKey;
        localStorage.setItem('pokket_master_private_key', masterPrivateKey);
        console.log('🔑 Generated new master private key');
      }
      
      // Generate both ETH and SOL keypairs from the master key
      const walletKeyPairs = generateWalletKeyPairsFromPrivateKey(masterPrivateKey);
      
      console.log('🔑 Generated wallet addresses:', {
        ethereum: walletKeyPairs.ethereum.address,
        solana: walletKeyPairs.solana.address
      });
      
      // Store the keypairs for later use
      localStorage.setItem('pokket_wallet_keypairs', JSON.stringify(walletKeyPairs));

      // Create Self app configuration for Pokket
      const app = new SelfAppBuilder({
        version: 2,
        appName: "Pokket Wallet",
        scope: "pokket-identity-verification",
        endpoint: contractAddress,
        endpointType: "staging_celo", // Celo testnet
        userIdType: "hex", 
        userId: userAddress.toLowerCase(),
        logoBase64: "",
        userDefinedData: JSON.stringify({
          platform: "pokket",
          ethAddress: walletKeyPairs.ethereum.address.toLowerCase(),
          solAddress: walletKeyPairs.solana.address, // Proper Solana address
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


      console.log("🔧 SELF app configuration:", {
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Pokket Wallet",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "pokket-identity-verification",
        endpoint: contractAddress,
        endpointType: "staging_celo",
        userIdType: "hex",
        userId: userAddress.toLowerCase(),
      });

      setSelfApp(app);

      // Generate universal link for mobile users
      const link = getUniversalLink(app);
      console.log("🔧 Generated universal link:", link);
      setUniversalLink(link);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to initialize verification";
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [userAddress, onError]);

  useEffect(() => {
    if(userAddress) {
      console.log("🔧 Initializing Self app with userAddress:", userAddress);
      console.log("🔧 Contract address:", process.env.NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS);
      initializeSelfApp();
    }
  }, [userAddress, initializeSelfApp]);

  // Add polling state
  const [isPolling, setIsPolling] = useState(false);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const handleSuccess = useCallback(() => {
    console.log("✅ Identity verification successful!");
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    setIsPolling(false);
    onSuccess?.();
  }, [onSuccess]);

  const startVerificationPolling = useCallback(() => {
    if (isPolling) return; // Prevent multiple polling instances
    
    setIsPolling(true);
    console.log("🔄 Starting verification status polling...");
    
    pollingInterval.current = setInterval(async () => {
      try {
        const verificationService = createVerificationService(userAddress);
        const status = await verificationService.checkVerificationStatus(userAddress);
        
        console.log("📊 Polling verification status:", status);
        
        if (status.isVerified) {
          console.log("✅ Verification detected! Stopping polling...");
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
          }
          setIsPolling(false);
          handleSuccess();
        }
      } catch (error) {
        console.error("❌ Error polling verification status:", error);
      }
    }, 3000); // Poll every 3 seconds
  }, [userAddress, isPolling, handleSuccess]);

  // Start polling for verification status when QR is displayed
  useEffect(() => {
    if (selfApp && !isPolling) {
      startVerificationPolling();
    }
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [selfApp, userAddress, startVerificationPolling, isPolling]);

  const handleError = (error?: unknown) => {
    const errorMessage = error ? `Failed to verify identity: ${error}` : "Failed to verify identity";
    console.error("❌ SELF Verification Error:", error);
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    setIsPolling(false);
    onError?.(errorMessage);
  };

  const handleManualVerificationComplete = async () => {
    try {
      console.log("🔧 Manual verification completion for address:", userAddress);
      
      // Call the manual verification endpoint
      const verificationService = createVerificationService(userAddress);
      const result = await verificationService.triggerManualVerification(userAddress);
      
      if (result.success) {
        console.log("✅ Manual verification successful:", result.message);
        handleSuccess();
      } else {
        throw new Error(result.message || "Manual verification failed");
      }
    } catch (error) {
      console.error("❌ Manual verification failed:", error);
      handleError(error);
    }
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
      <div className="mb-4 space-y-3">
        <button
          onClick={openSelfApp}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.749z" />
          </svg>
          <span>Open Self App on Mobile</span>
        </button>

        {/* Manual Verification Complete Button */}
        <button
          onClick={handleManualVerificationComplete}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <span>Complete Verification & Link Wallet</span>
        </button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-2">
        <p>📱 On mobile: Tap the first button to open Self app directly</p>
        <p>💻 On desktop: Scan the QR code with your phone&apos;s Self app</p>
        <div className="mt-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400 text-yellow-700">
          <p><strong>Already verified in Self app?</strong></p>
          <p>If you completed verification but the web app didn&apos;t detect it, click &quot;Complete Verification & Link Wallet&quot; to manually link your wallet.</p>
        </div>
      </div>
    </div>
  );
}
