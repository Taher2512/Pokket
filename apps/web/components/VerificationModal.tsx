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
    "info" | "qr" | "waiting" | "success" | "error"
  >("info");
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  const handleStartVerification = () => {
    setCurrentStep("qr");
  };

  const handleVerificationSuccess = () => {
    setCurrentStep("waiting");
    // Start polling for verification completion
    startVerificationPolling();
  };

  const handleVerificationError = (error: string) => {
    setError(error);
    setCurrentStep("error");
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
              <h4 className="font-medium mb-2">What you'll need:</h4>
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
              Verification in Progress
            </h3>
            <p className="text-gray-600 mb-6">
              Please complete the verification process in the Self mobile app.
              This may take a few moments.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600">
                Waiting for verification completion...
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

      case "success":
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">
              Verification Successful!
            </h3>
            <p className="text-gray-600 mb-6">
              Your identity has been successfully verified. You will now see a
              verified badge next to your profile.
            </p>

            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-green-700">
                🎉 You are now a verified Pokket user! Your verification status
                will be visible to others when they scan your QR code.
              </p>
            </div>

            <button
              onClick={() => {
                onVerificationComplete();
                onClose();
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Continue
            </button>
          </div>
        );

      case "error":
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
                <li>• Check your phone's NFC is turned on</li>
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

      default:
        return null;
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
