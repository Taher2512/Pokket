"use client";

import React, { useState } from "react";
import { CheckCircle, Shield, X } from "lucide-react";
import { SelfVerificationQR } from "./SelfVerificationQR";
import { createVerificationService } from "../lib/verification";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress: string;
  onVerificationComplete: () => void;
}

export function VerificationModal({
  isOpen,
  onClose,
  userAddress,
  onVerificationComplete,
}: VerificationModalProps) {
  const [currentStep, setCurrentStep] = useState<
    "info" | "qr" | "waiting" | "success" | "error" | "password-setup"
  >("info");
  const [error, setError] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  if (!isOpen) return null;

  const handleStartVerification = () => {
    setCurrentStep("qr");
  };

  const handleVerificationSuccess = (selfProofData?: unknown) => {
    console.log("🎉 SELF Verification Success!");
    console.log("📋 SELF WebSocket Data Received:", JSON.stringify(selfProofData, null, 2));
    console.log("🔍 Checking if SELF sent actual verification data...");
    setCurrentStep("waiting");
    processSelfVerificationData(selfProofData);
  };

  const handleVerificationError = (error: string) => {
    setError(error);
    setCurrentStep("error");
  };

  const handlePasswordSetup = async () => {
    if (!password || password !== confirmPassword || password.length < 8) {
      return;
    }

    try {
      // Hash the password for storage (simple hash for demo - use proper crypto in production)
      const hashedPassword = btoa(password); // Base64 encoding (use proper hashing in production)
      
      // Store encrypted password hash in localStorage
      localStorage.setItem('pokket_password_hash', hashedPassword);
      
      console.log('🔒 Password setup complete, navigating to dashboard...');
      
      // Navigate to dashboard
      onVerificationComplete();
      onClose();
    } catch (error) {
      console.error('❌ Failed to setup password:', error);
      setError('Failed to setup password. Please try again.');
      setCurrentStep("error");
    }
  };

    const processSelfVerificationData = async (selfProofData: unknown) => {
    try {
      console.log("🔄 Processing SELF verification data:", selfProofData);
      
      // Import the verification processor
      const { SelfVerificationProcessor } = await import('../lib/self-verification-processor');
      
      // Get the private key from the environment
      const ownerPrivateKey = process.env.NEXT_PUBLIC_VERIFICATION_PRIVATE_KEY || '0x85358c7bccdbaa3a6021c4e626784673ad0ca607ece915929c4c02ed0cd1d50e';
      const processor = new SelfVerificationProcessor(ownerPrivateKey);
      
      // Process the SELF verification data - this should extract actual data from SELF
      const selfData = (selfProofData as Record<string, unknown>) || {};
      const result = await processor.processVerificationData(userAddress, selfData);
      
      if (result.success) {
        console.log("✅ SELF verification data processed successfully!");
        console.log("📋 Extracted verification details:", {
          nullifierId: result.nullifierId,
          name: result.name,
          nationality: result.nationality,
          age: result.age,
          issuingState: result.issuingState,
          txHash: result.transactionHash
        });
        
        // Store nullifier ID for password setup
        if (result.nullifierId) {
          localStorage.setItem('pokket_nullifier_id', result.nullifierId);
        }
        
        // Don't show user data - go straight to password setup
        setCurrentStep("password-setup");
      } else {
        throw new Error(result.error || "Failed to process SELF verification data");
      }
    } catch (error) {
      console.error("❌ Failed to process SELF verification:", error);
      setError(error instanceof Error ? error.message : "Failed to process SELF data");
      setCurrentStep("error");
    }
  };



  const handleManualVerification = async () => {
    try {
      setCurrentStep("waiting");
      
      // Import the verification processor
      const { MockSelfVerificationProcessor } = await import('../lib/self-verification-processor');
      
      // Use a test private key (you should get this from environment or generate one)
      const testPrivateKey = '0x85358c7bccdbaa3a6021c4e626784673ad0ca607ece915929c4c02ed0cd1d50e';
      const processor = new MockSelfVerificationProcessor(testPrivateKey);
      
      console.log('🧪 Starting mock SELF verification for:', userAddress);
      
      const result = await processor.mockVerification(userAddress);
      
      if (result.success) {
        console.log('🎉 VERIFICATION SUCCESS! Data stored:', {
          nullifierId: result.nullifierId,
          name: result.name,
          nationality: result.nationality,
          age: result.age,
          issuingState: result.issuingState,
          ethAddress: result.ethAddress,
          transactionHash: result.transactionHash
        });
        
        setCurrentStep("success");
        onVerificationComplete();
      } else {
        console.error('❌ Verification failed:', result.error);
        setError(result.error || "Verification failed");
        setCurrentStep("error");
      }
    } catch (error) {
      console.error('❌ Manual verification error:', error);
      setError("Failed to complete manual verification");
      setCurrentStep("error");
    }
  };

  const startVerificationPolling = async () => {
    try {
      const verificationService = createVerificationService(userAddress);

      const result = await verificationService.pollVerificationStatus(
        userAddress,
        (status) => {
          // Update UI during polling if needed
          console.log("Verification status update:", status);
        },
        60, // 5 minutes max
        5000 // Check every 5 seconds
      );
       console.log("Final verification result:", result);
      if (result.isVerified) {

        setCurrentStep("success");
      } else {
        setError("Verification timed out. Please try again.");
        setCurrentStep("error");
      }
    } catch (error) {
      console.error("Polling error:", error);
      setError("Failed to check verification status");
      setCurrentStep("error");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "info":
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Verify Your Identity</h3>
            <p className="text-gray-600 mb-6">
              Complete identity verification using your Aadhar card to get a
              verified badge and enhance trust in the Pokket ecosystem.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <h4 className="font-medium mb-2">What you&apos;ll need:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Self mobile app (available on iOS/Android)</li>
                <li>• Your Aadhar card with NFC enabled</li>
                <li>• A smartphone with NFC capability</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
              <h4 className="font-medium mb-2">Privacy Protection:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Zero-knowledge proofs protect your personal data</li>
                <li>• Only verification status is stored on-chain</li>
                <li>• Your Aadhar details remain private and secure</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartVerification}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Verification
              </button>
            </div>
          </div>
        );

      case "qr":
        return (
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Scan QR Code</h3>
            <p className="text-gray-600 mb-6">
              Open the Self mobile app and scan this QR code to start the
              verification process.
            </p>

            {/* Self Protocol QR Code - with proper spacing */}
            <div className="flex justify-center items-center mb-6 min-h-[280px]">
              <SelfVerificationQR
                userAddress={userAddress}
                onSuccess={handleVerificationSuccess}
                onError={handleVerificationError}
              />
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-left">
              <h4 className="font-medium mb-2">Steps:</h4>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Download and open the Self mobile app</li>
                <li>2. Scan this QR code with your phone</li>
                <li>
                  3. Follow the in-app instructions to scan your Aadhar card
                </li>
                <li>4. Wait for verification to complete</li>
              </ol>
            </div>

            {/* Since SELF verification completed, use this to finalize */}
            <div className="bg-green-50 p-4 rounded-lg mb-6 text-left">
              <h4 className="font-medium mb-2 text-green-800">
                ✅ SELF Verification Detected:
              </h4>
              <p className="text-sm text-green-600 mb-3">
                Since you&apos;ve completed verification in the SELF app, click below to 
                finalize your identity verification and link it to your wallet:
              </p>
              <button
                onClick={handleManualVerification}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete Verification & Link Wallet
              </button>
            </div>

            {/* Alternative: Manual Testing */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
              <h4 className="font-medium mb-2 text-blue-800">
                Alternative - Demo Mode:
              </h4>
              <p className="text-sm text-blue-600 mb-3">
                For testing purposes, you can also simulate the verification:
              </p>
              <button
                onClick={handleManualVerification}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Demo Verification (Test)
              </button>
            </div>

            <button
              onClick={() => setCurrentStep("info")}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </div>
        );

      case "waiting":
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
            <h3 className="text-xl font-semibold mb-4">
              Linking Verified Identity
            </h3>
            <p className="text-gray-600 mb-6">
              Your identity has been successfully verified with SELF protocol. 
              Now linking your wallet to the blockchain...
            </p>

            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">SELF Verification Complete</span>
              </div>
              <p className="text-sm text-green-700">
                Now writing verification to Celo blockchain and linking to your wallet...
              </p>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        );

      case "password-setup":
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Set Your Password</h3>
            <p className="text-gray-600 mb-6">
              Create a secure password to protect your verified identity. You&apos;ll need this password every time you access Pokket.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a secure password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  minLength={8}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  minLength={8}
                />
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-left">
              <h4 className="font-medium mb-2 text-yellow-800">⚠️ Important:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Use at least 8 characters with mix of letters, numbers, symbols</li>
                <li>• Store this password safely - we cannot recover it for you</li>
                <li>• You&apos;ll need this password every time you access Pokket</li>
              </ul>
            </div>

            <button
              onClick={handlePasswordSetup}
              disabled={!password || password !== confirmPassword || password.length < 8}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Set Password & Continue to Dashboard
            </button>
          </div>
        );

      case "success": {
        const verificationData = JSON.parse(localStorage.getItem('pokket_verification_data') || '{}');
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">
              Identity Verified Successfully! 🎉
            </h3>
            <p className="text-gray-600 mb-6">
              Your identity has been verified and linked to your wallet addresses.
            </p>

            {verificationData.name && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4 text-left">
                <h4 className="font-medium mb-2 text-blue-800">Verified Identity:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Name:</strong> {verificationData.name}</p>
                  <p><strong>Nationality:</strong> {verificationData.nationality}</p>
                  <p><strong>Age:</strong> {verificationData.age}</p>
                  <p><strong>State:</strong> {verificationData.issuingState}</p>
                </div>
              </div>
            )}

            <div className="bg-green-50 p-4 rounded-lg mb-6 text-left">
              <h4 className="font-medium mb-2 text-green-800">What happens next:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ Your wallet is now verified</li>
                <li>✅ Identity linked to ETH & SOL addresses</li>
                <li>✅ Verification stored on Celo blockchain</li>
                <li>✅ Ready to access verified features</li>
              </ul>
            </div>

            <button
              onClick={() => {
                console.log('🚀 Verification complete! Proceeding to dashboard...');
                onVerificationComplete();
                onClose();
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Continue to Dashboard →
            </button>
          </div>
        );
      }

      case "error": {
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Verification Failed</h3>
            <p className="text-gray-600 mb-4">
              We were unable to complete your identity verification.
            </p>

            {error && (
              <div className="bg-red-50 p-4 rounded-lg mb-6 text-left">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <h4 className="font-medium mb-2">Common issues:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Ensure your Aadhar card has NFC enabled</li>
                <li>• Check your phone&apos;s NFC is turned on</li>
                <li>• Try scanning your Aadhar card again</li>
                <li>• Ensure you have the latest Self mobile app</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => setCurrentStep("qr")}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        );
      }

      default: {
        return null;
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[95vh] overflow-y-auto mx-auto my-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Identity Verification</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}
