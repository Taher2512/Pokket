"use client";

import React, { useState, useEffect } from "react";
import { Shield, Eye, EyeOff } from "lucide-react";

interface UserData {
  nullifierId: string;
  ethAddress: string;
  solAddress: string;
  name: string;
  nationality: string;
  age: number;
  issuingState: string;
  verifiedAt: number;
  isVerified: boolean;
}

interface PasswordAuthProps {
  onAuthSuccess: (userData: UserData) => void;
  onAuthSkip: () => void;
}

export function PasswordAuth({ onAuthSuccess, onAuthSkip }: PasswordAuthProps) {
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasVerifiedIdentity, setHasVerifiedIdentity] = useState<boolean>(false);

  useEffect(() => {
    // Check if user has a verified identity
    const nullifierId = localStorage.getItem('pokket_nullifier_id');
    const passwordHash = localStorage.getItem('pokket_password_hash');
    
    if (nullifierId && passwordHash) {
      setHasVerifiedIdentity(true);
    } else {
      // No verified identity, skip auth
      onAuthSkip();
    }
  }, [onAuthSkip]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Get stored password hash
      const storedPasswordHash = localStorage.getItem('pokket_password_hash');
      if (!storedPasswordHash) {
        throw new Error("No password found. Please verify your identity first.");
      }

      // Verify password (simple comparison for demo - use proper crypto in production)
      const enteredPasswordHash = btoa(password);
      if (enteredPasswordHash !== storedPasswordHash) {
        throw new Error("Incorrect password. Please try again.");
      }

      // Get nullifier ID
      const nullifierId = localStorage.getItem('pokket_nullifier_id');
      if (!nullifierId) {
        throw new Error("No verified identity found. Please verify your identity first.");
      }

      // Fetch user details from backend
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${API_BASE_URL}/verification/user/${nullifierId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to authenticate");
      }

      console.log('🎉 Authentication successful!', result.user);
      
      // Store user data for session
      localStorage.setItem('pokket_user_session', JSON.stringify({
        ...result.user,
        authenticatedAt: Date.now()
      }));

      // Get the generated wallet addresses from localStorage
      const storedKeypairs = localStorage.getItem('pokket_wallet_keypairs');
      let ethAddress = null;
      let solAddress = null;
      
      if (storedKeypairs) {
        try {
          const keypairs = JSON.parse(storedKeypairs);
          ethAddress = keypairs.ethereum?.address;
          solAddress = keypairs.solana?.address;
          console.log('🔑 Using generated wallet addresses:', { ethAddress, solAddress });
        } catch (error) {
          console.warn('⚠️ Could not parse stored keypairs:', error);
        }
      }

      // Generate a proper JWT token for SELF-verified user
      const jwtResponse = await fetch(`${API_BASE_URL}/auth/self-verified`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nullifierId: result.user.nullifierId,
          ethAddress,
          solAddress,
          name: result.user.name
        })
      });

      if (!jwtResponse.ok) {
        throw new Error('Failed to generate authentication token');
      }

      const jwtResult = await jwtResponse.json();
      
      if (!jwtResult.success) {
        throw new Error(jwtResult.error || 'Failed to generate authentication token');
      }

      console.log('🔑 Proper JWT token generated:', jwtResult.token.slice(0, 20) + '...');

      // Store the proper JWT token with both keys for compatibility
      localStorage.setItem('authToken', jwtResult.token);
      localStorage.setItem('auth_token', jwtResult.token);

      console.log('✅ Auth token set, triggering navigation...');
      
      // Call the success callback to trigger proper navigation
      onAuthSuccess(result.user);

    } catch (error) {
      console.error('❌ Authentication failed:', error);
      setError(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // For demo purposes, show instructions
    alert(
      "🔒 Password Recovery\n\n" +
      "Since we use zero-knowledge identity verification, we cannot recover your password.\n\n" +
      "To reset access:\n" +
      "1. Clear your browser data for this site\n" +
      "2. Complete identity verification again with SELF Protocol\n" +
      "3. Set a new password\n\n" +
      "Your verified identity will be linked to the same nullifier ID."
    );
  };

  if (!hasVerifiedIdentity) {
    return null; // Component will call onAuthSkip in useEffect
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
          <p className="text-gray-600">
            Enter your password to access your verified Pokket wallet
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!password || isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Authenticating...
              </div>
            ) : (
              "Access Wallet"
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Forgot your password?
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Your identity is protected by SELF Protocol&apos;s zero-knowledge verification
          </p>
        </div>
      </div>
    </div>
  );
}