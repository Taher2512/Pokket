"use client";

import React, { useState } from "react";
import { getAvailableWallets, sendTokensWithWallet, WalletConnection, NetworkType } from "../lib/multi-wallet";

interface QRPayload {
  name: string;
  ethAddress: string;
  solAddress: string;
  amount?: string;
  tokenSymbol?: string;
  tokenAddress?: string;
  network?: "ethereum" | "base" | "solana";
  decimals?: number;
}

interface NetworkSelectionModalProps {
  paymentData: QRPayload;
  onClose: () => void;
}

export default function NetworkSelectionModal({
  paymentData,
  onClose,
}: NetworkSelectionModalProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [walletConnection, setWalletConnection] = useState<WalletConnection | null>(null);
  const [amount, setAmount] = useState(paymentData.amount || "0.01");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const networks: { id: NetworkType; name: string; icon: string; color: string }[] = [
    { id: "ethereum", name: "Ethereum", icon: "🔵", color: "from-blue-500 to-blue-600" },
    { id: "base", name: "Base", icon: "🟣", color: "from-indigo-500 to-indigo-600" },
    { id: "solana", name: "Solana", icon: "🟠", color: "from-orange-500 to-orange-600" },
  ];

  const handleNetworkSelect = (network: NetworkType) => {
    setSelectedNetwork(network);
    setError(null);
  };

  const handleWalletConnect = async (walletId: string) => {
    if (!selectedNetwork) return;

    setIsConnecting(true);
    setError(null);
    setSelectedWallet(walletId);

    try {
      const availableWallets = getAvailableWallets(selectedNetwork);
      const wallet = availableWallets.find(w => w.id === walletId);
      
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      if (!wallet.isInstalled) {
        // Open install URL
        window.open(wallet.installUrl, '_blank');
        throw new Error(`${wallet.name} is not installed. Please install it and try again.`);
      }

      const connection = await wallet.connectFunction(selectedNetwork);
      setWalletConnection(connection);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSendTransaction = async () => {
    if (!walletConnection || !selectedNetwork) return;

    setIsSending(true);
    setError(null);

    try {
      const recipient = selectedNetwork === "solana" ? paymentData.solAddress : paymentData.ethAddress;
      
      const txHash = await sendTokensWithWallet(walletConnection, {
        to: recipient,
        amount: amount,
        tokenAddress: paymentData.tokenAddress,
        decimals: paymentData.decimals || (selectedNetwork === "solana" ? 9 : 18),
      });

      setTxHash(txHash);
      
      // Auto close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Transaction failed";
      setError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const availableWallets = selectedNetwork ? getAvailableWallets(selectedNetwork) : [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <button
            onClick={onClose}
            disabled={isConnecting || isSending}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl font-bold text-white">
                {paymentData.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Pay {paymentData.name}</h2>
            <p className="text-gray-500 text-sm">
              {paymentData.amount && paymentData.tokenSymbol 
                ? `${paymentData.amount} ${paymentData.tokenSymbol}`
                : "Choose network and wallet"}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-800 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {txHash && (
          <div className="mx-6 mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-900 mb-1">Transaction Successful!</p>
                <p className="text-sm text-green-800 mb-2">Your payment has been sent successfully.</p>
                <p className="text-xs text-green-700 break-all">Transaction: {txHash}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-6 pb-6">
          {!selectedNetwork && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Network</h3>
              <div className="space-y-3">
                {networks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => handleNetworkSelect(network.id)}
                    className={`w-full group relative overflow-hidden bg-gradient-to-r ${network.color} text-white rounded-2xl p-4 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{network.icon}</div>
                        <div className="text-left">
                          <div className="font-semibold text-lg">{network.name}</div>
                          <div className="text-sm opacity-90">
                            {network.id === "solana" ? "Send SOL or SPL tokens" : "Send ETH or ERC-20 tokens"}
                          </div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {selectedNetwork && !walletConnection && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Wallet</h3>
                <button
                  onClick={() => setSelectedNetwork(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Change Network
                </button>
              </div>
              <div className="space-y-3">
                {availableWallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleWalletConnect(wallet.id)}
                    disabled={isConnecting}
                    className="w-full group relative overflow-hidden bg-white border-2 border-gray-200 rounded-2xl p-4 hover:border-blue-300 hover:bg-blue-50/50 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{wallet.icon}</div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900 text-lg">{wallet.name}</div>
                          <div className="text-sm text-gray-600">
                            {wallet.isInstalled ? wallet.description : "Not installed - Click to install"}
                          </div>
                        </div>
                      </div>
                      {isConnecting && selectedWallet === wallet.id ? (
                        <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {walletConnection && !txHash && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Send Payment</h3>
                <button
                  onClick={() => setWalletConnection(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Change Wallet
                </button>
              </div>

              {!paymentData.amount && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.01"
                    step="0.001"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Network:</span> {selectedNetwork}</p>
                  <p><span className="font-medium">Wallet:</span> {walletConnection.address.slice(0, 6)}...{walletConnection.address.slice(-4)}</p>
                  <p><span className="font-medium">Amount:</span> {amount} {paymentData.tokenSymbol || (selectedNetwork === "solana" ? "SOL" : "ETH")}</p>
                </div>
              </div>

              <button
                onClick={handleSendTransaction}
                disabled={isSending}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-4 hover:from-blue-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSending ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  `Send ${amount} ${paymentData.tokenSymbol || (selectedNetwork === "solana" ? "SOL" : "ETH")}`
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}