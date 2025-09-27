"use client";

import React from "react";
import { useWallet } from "../contexts/WalletContext";
import { WalletType, isWalletInstalled } from "../lib/wallet";

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: () => void;
}

export default function WalletConnectionModal({
  isOpen,
  onClose,
  onConnect,
}: WalletConnectionModalProps) {
  const { connectToWallet, isConnecting, error, clearError } = useWallet();

  if (!isOpen) return null;

  const handleWalletConnect = async (walletType: WalletType) => {
    try {
      await connectToWallet(walletType);
      onConnect?.();
      onClose();
    } catch (err) {
      // Error is handled by the context
      console.error("Connection failed:", err);
    }
  };

  const walletOptions = [
    {
      type: "metamask" as WalletType,
      name: "MetaMask",
      description: "Connect using browser extension",
      icon: (
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
      ),
      installed: isWalletInstalled.metamask(),
      installUrl: "https://metamask.io/download/",
    },
    {
      type: "coinbase" as WalletType,
      name: "Coinbase Wallet",
      description: "Connect using Coinbase Wallet",
      icon: (
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 19.2c-3.969 0-7.2-3.231-7.2-7.2s3.231-7.2 7.2-7.2 7.2 3.231 7.2 7.2-3.231 7.2-7.2 7.2z"/>
          </svg>
        </div>
      ),
      installed: isWalletInstalled.coinbase(),
      installUrl: "https://www.coinbase.com/wallet",
    },
    {
      type: "walletconnect" as WalletType,
      name: "WalletConnect",
      description: "Connect with QR code",
      icon: (
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h5.01M4 20h5.01"/>
          </svg>
        </div>
      ),
      installed: true, // WalletConnect doesn't require installation
      installUrl: "",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
            disabled={isConnecting}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Wallet</h2>
            <p className="text-gray-500 text-sm">
              Choose your preferred wallet to continue
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-900">Connection Failed</p>
                <p className="text-sm text-red-800 mt-1">{error}</p>
                <button
                  onClick={clearError}
                  className="text-sm text-red-600 hover:text-red-500 mt-2 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Options */}
        <div className="px-6 py-6 space-y-3">
          {walletOptions.map((wallet) => (
            <div key={wallet.type}>
              {wallet.installed ? (
                <button
                  onClick={() => handleWalletConnect(wallet.type)}
                  disabled={isConnecting}
                  className="w-full group relative overflow-hidden bg-white border-2 border-gray-200 rounded-2xl p-4 hover:border-blue-300 hover:bg-blue-50/50 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-3">
                      {wallet.icon}
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 text-lg">
                          {wallet.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {wallet.description}
                        </div>
                      </div>
                    </div>
                    {isConnecting ? (
                      <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                    ) : (
                      <svg
                        className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ) : (
                <a
                  href={wallet.installUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full group relative overflow-hidden bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 hover:border-gray-300 transform hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-3">
                      {wallet.icon}
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 text-lg">
                          {wallet.name}
                        </div>
                        <div className="text-sm text-orange-600">
                          Not installed - Click to install
                        </div>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-medium text-blue-900 mb-1">Secure Connection</p>
                <p className="text-xs text-blue-800">
                  We never store your private keys. Your wallet remains in your control at all times.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}