"use client";

import React, { useState } from "react";
import Image from "next/image";
import NetworkSelectionModal from "./NetworkSelectionModal";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  publicAddress: string;
  publicAddressSolana?: string;
}

interface SendToUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function SendToUserModal({
  isOpen,
  onClose,
  user,
}: SendToUserModalProps) {
  const [amount, setAmount] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<"ethereum" | "base" | "solana" | null>(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [error, setError] = useState("");

  const displayName = user.name || user.email;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const networks = [
    {
      id: "ethereum" as const,
      name: "Ethereum",
      icon: "🔷",
      color: "from-blue-500 to-blue-600",
      available: !!user.publicAddress,
      address: user.publicAddress,
    },
    {
      id: "base" as const,
      name: "Base",  
      icon: "🔵",
      color: "from-blue-600 to-blue-700",
      available: !!user.publicAddress,
      address: user.publicAddress,
    },
    {
      id: "solana" as const,
      name: "Solana",
      icon: "🟣",
      color: "from-purple-500 to-purple-600", 
      available: !!user.publicAddressSolana,
      address: user.publicAddressSolana,
    },
  ];

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError("");
    }
  };

  const handleNetworkSelect = (networkId: "ethereum" | "base" | "solana") => {
    const network = networks.find(n => n.id === networkId);
    if (network?.available) {
      setSelectedNetwork(networkId);
      setError("");
    }
  };

  const handleProceed = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!selectedNetwork) {
      setError("Please select a network");
      return;
    }

    const network = networks.find(n => n.id === selectedNetwork);
    if (!network?.available || !network.address) {
      setError("Selected network is not available for this user");
      return;
    }

    setShowNetworkModal(true);
  };

  const handleCloseNetworkModal = () => {
    setShowNetworkModal(false);
    onClose(); // Close the main modal too
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-gray-100">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="pr-12">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Send Money</h2>
              <p className="text-sm text-gray-600">Enter amount and select network</p>
            </div>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              {/* {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={displayName}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {initials}
                  </span>
                </div>
              )} */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {user.name || "Anonymous User"}
                </h3>
                <p className="text-sm text-gray-600">{user.email}</p>
                <div className="flex items-center space-x-3 mt-1">
                  {user.publicAddress && (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-xs text-gray-500">ETH/Base</span>
                    </div>
                  )}
                  {user.publicAddressSolana && (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-xs text-gray-500">SOL</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="px-6 py-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="block w-full px-4 py-4 text-2xl font-semibold text-center border border-gray-300 rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <span className="text-lg text-gray-500">
                    {selectedNetwork === "solana" ? "SOL" : "ETH"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {["0.01", "0.1", "1.0"].map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => handleAmountChange(quickAmount)}
                  className="py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
                >
                  {quickAmount}
                </button>
              ))}
            </div>

            {/* Network Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Network
              </label>
              <div className="space-y-3">
                {networks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => handleNetworkSelect(network.id)}
                    disabled={!network.available}
                    className={`w-full flex items-center space-x-4 p-4 rounded-2xl border-2 transition-all duration-200 ${
                      selectedNetwork === network.id
                        ? "border-orange-500 bg-orange-50"
                        : network.available
                        ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="text-2xl">{network.icon}</div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">
                        {network.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {network.available
                          ? network.address
                            ? `${network.address.slice(0, 8)}...${network.address.slice(-6)}`
                            : "Available"
                          : "Not available"}
                      </div>
                    </div>
                    {selectedNetwork === network.id && (
                      <div className="text-orange-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProceed}
                disabled={!amount || !selectedNetwork || parseFloat(amount) <= 0}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send {amount && `${amount} ${selectedNetwork === "solana" ? "SOL" : "ETH"}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Network Selection Modal for actual sending */}
      {showNetworkModal && (
        <NetworkSelectionModal
          paymentData={{
            name: displayName,
            ethAddress: user.publicAddress,
            solAddress: user.publicAddressSolana || "",
            amount: amount,
            network: selectedNetwork!,
          }}
          onClose={handleCloseNetworkModal}
        />
      )}
    </>
  );
}