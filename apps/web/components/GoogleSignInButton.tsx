"use client";

import React, { useState } from "react";
import { apiService } from "../lib/api";

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const authUrl = await apiService.getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to sign in";
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={disabled || loading}
      className="group relative w-full max-w-md mx-auto flex items-center justify-center px-10 py-5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white rounded-2xl hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 focus:outline-none focus:ring-4 focus:ring-orange-400/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 overflow-hidden font-bold text-lg tracking-wide"
    >
      {/* Metallic shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700 -translate-x-full"></div>

      {loading ? (
        <>
          <div className="relative w-6 h-6 mr-4">
            <div className="absolute inset-0 border-3 border-white/30 rounded-full"></div>
            <div className="absolute inset-0 border-3 border-t-white border-transparent rounded-full animate-spin"></div>
          </div>
          <span className="font-bold text-lg">INITIALIZING POKKET...</span>
        </>
      ) : (
        <>
          <div className="relative w-6 h-6 mr-4 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-full h-full drop-shadow-lg" viewBox="0 0 24 24">
              <path
                fill="white"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="white"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="white"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="white"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </div>
          <span className="font-black text-lg tracking-wider uppercase">
            Launch Pokket
          </span>

          {/* Pulse ring effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl opacity-30 group-hover:opacity-60 blur-sm transition-opacity duration-300"></div>
        </>
      )}
    </button>
  );
}
