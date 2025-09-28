"use client";

import React, { useState } from "react";
import { Shield, Loader } from "lucide-react";
import { VerificationModal } from "./VerificationModal";
import { IdentityAuthService } from "../lib/identity-auth";
interface IdentityVerificationButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
}

export function IdentityVerificationButton({ 
  className = "",
  size = 'md',
  variant = 'primary'
}: IdentityVerificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedAddress, setGeneratedAddress] = useState<string | null>(null);

  const handleIdentityVerification = async () => {
    setIsLoading(true);
    
    try {
      // First, generate keypairs for the user
      const result = await IdentityAuthService.generateKeypairsAndVerify();
      console.log("Keypair generation result-v1:", result);
      
      if (result.success && result.publicAddress) {
        // Validate the address format
        const address = result.publicAddress;
        if (address && address.startsWith('0x') && address.length === 42) {
          setGeneratedAddress(address);
          setIsModalOpen(true);
        } else {
          console.error('Invalid address format:', address);
          // TODO: Show error toast/notification
        }
      } else {
        console.error('Failed to generate keypairs:', result.message);
        // TODO: Show error toast/notification
      }
    } catch (error) {
      console.error('Identity verification initialization failed:', error);
      // TODO: Show error toast/notification
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = async () => {
    // After successful verification, the auth context will handle the state update
    // through the verification completion callback
    setIsModalOpen(false);
    setGeneratedAddress(null);
    
    // Optionally refresh the page to update the auth state
    window.location.reload();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setGeneratedAddress(null);
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-10 py-5 text-xl'
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl',
    secondary: 'bg-white text-blue-600 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
  };

  const baseClasses = `
    group relative font-semibold rounded-2xl 
    transition-all duration-300 
    transform hover:-translate-y-1 hover:scale-105
    flex items-center justify-center space-x-3
    disabled:opacity-50 disabled:cursor-not-allowed
    disabled:transform-none disabled:hover:scale-100
    overflow-hidden
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  return (
    <>
      <button
        onClick={handleIdentityVerification}
        disabled={isLoading}
        className={baseClasses}
      >
        {isLoading ? (
          <Loader className="w-5 h-5 animate-spin" />
        ) : (
          <Shield className="w-5 h-5" />
        )}
        <span className="relative z-10">
          {isLoading ? 'Starting...' : 'Start with SELF'}
        </span>
        
        {/* Gradient overlay effect */}
        {variant === 'primary' && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </button>

      {/* Verification Modal */}
      {isModalOpen && generatedAddress && (
        <VerificationModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          userAddress={generatedAddress}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </>
  );
}