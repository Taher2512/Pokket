"use client";

import React, { useState, useEffect } from "react";
import { Shield, ShieldCheck, Loader } from "lucide-react";
import { VerificationModal } from "./VerificationModal";
import { VerificationStatus } from "../lib/verification";

interface VerificationButtonProps {
  userAddress: string;
  onVerificationStatusChange?: (status: VerificationStatus) => void;
}

export function VerificationButton({
  userAddress,
  onVerificationStatusChange,
}: VerificationButtonProps) {
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>({
      isVerified: false,
    });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check verification status on component mount
  useEffect(() => {
    checkVerificationStatus();
  }, [userAddress]);

  const checkVerificationStatus = async () => {
    if (!userAddress) return;

    setIsLoading(true);
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(
        `${API_BASE_URL}/verification/status/${userAddress}`
      );
      if (response.ok) {
        const status: VerificationStatus = await response.json();
        setVerificationStatus(status);
        onVerificationStatusChange?.(status);
      }
    } catch (error) {
      console.error("Failed to check verification status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    // Refresh verification status after completion
    checkVerificationStatus();
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <button
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
        disabled
      >
        <Loader className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking...</span>
      </button>
    );
  }

  if (verificationStatus.isVerified) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
        <ShieldCheck className="w-4 h-4" />
        <span className="text-sm font-medium">Verified</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
      >
        <Shield className="w-4 h-4" />
        <span className="text-sm font-medium">Verify Identity</span>
      </button>

      <VerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userAddress={userAddress}
        onVerificationComplete={handleVerificationComplete}
      />
    </>
  );
}
