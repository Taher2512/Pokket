"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { apiService } from "../lib/api";
import { AddressInfo, User } from "../types";
import { useVerificationStatus } from "../contexts/VerificationContext";
import { VerifiedBadge } from "./VerifiedBadge";

type NetworkType = "pokket" | "ethereum" | "solana";

interface AddressQRCodeProps {
  className?: string;
}

export default function AddressQRCode({ className = "" }: AddressQRCodeProps) {
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("pokket");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  // Get verification status for the current user
  const { verificationStatus } = useVerificationStatus(
    addressInfo?.ethereum.address || ""
  );

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const [addresses, userProfile] = await Promise.all([
        apiService.getUserAddresses(),
        apiService.getUserProfile(),
      ]);
      setAddressInfo(addresses);
      setUser(userProfile);
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setError("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentAddress = () => {
    if (!addressInfo) return "";

    if (selectedNetwork === "pokket") {
      return "Pokket Profile";
    } else if (selectedNetwork === "ethereum") {
      return addressInfo.ethereum.address;
    } else {
      return addressInfo.solana?.address || "";
    }
  };

  const getCurrentNetworkLabel = () => {
    if (!addressInfo) return "";

    if (selectedNetwork === "pokket") {
      return "Pokket Profile";
    } else if (selectedNetwork === "ethereum") {
      return `${addressInfo.ethereum.network.toUpperCase()} Network`;
    } else {
      return `${addressInfo.solana?.network.toUpperCase() || "DEVNET"} Network`;
    }
  };

  const getQRValue = () => {
    if (!addressInfo) return "";

    // If Pokket tab is selected, return JSON object
    if (selectedNetwork === "pokket" && user && addressInfo) {
      const pokketData = {
        name: user.name || "Anonymous User",
        ethAddress: addressInfo.ethereum.address,
        solAddress: addressInfo.solana?.address || null,
        verified: verificationStatus.isVerified,
        verificationTimestamp: verificationStatus.verificationTimestamp || null,
      };
      return JSON.stringify(pokketData);
    }

    const address = getCurrentAddress();
    if (!address) return "";

    // Format QR code value for wallets
    if (selectedNetwork === "ethereum") {
      return `ethereum:${address}`;
    } else {
      return address; // Solana addresses don't need prefix
    }
  };

  const downloadQRCode = async () => {
    if (!qrRef.current) return;

    try {
      const svg = qrRef.current.querySelector("svg");
      if (!svg) return;

      // Create canvas from SVG
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();

      img.onload = () => {
        canvas.width = 400;
        canvas.height = 400;

        // White background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR code
        ctx.drawImage(img, 50, 50, 300, 300);

        // Add address text
        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          getCurrentAddress().slice(0, 20) + "...",
          canvas.width / 2,
          380
        );

        // Download
        const link = document.createElement("a");
        link.download = `pokket-qr-${selectedNetwork}-${getCurrentAddress().slice(0, 6)}.png`;
        link.href = canvas.toDataURL();
        link.click();
      };

      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    } catch (error) {
      console.error("Error downloading QR code:", error);
      alert("Failed to download QR code");
    }
  };

  const shareQRCode = async () => {
    try {
      const address = getCurrentAddress();
      const network = getCurrentNetworkLabel();

      // Create PNG image for sharing
      const svgElement = qrRef.current?.querySelector("svg");
      if (!svgElement) {
        throw new Error("QR code not found");
      }

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Canvas context not available");

      canvas.width = 400;
      canvas.height = 400;

      // White background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Draw QR code centered
          const qrSize = 300;
          const x = (canvas.width - qrSize) / 2;
          const y = (canvas.width - qrSize) / 2;
          ctx.drawImage(img, x, y, qrSize, qrSize);
          resolve(void 0);
        };
        img.onerror = reject;
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/png");
      });

      const shareData = {
        title: "My Crypto Wallet Address",
        text: `Send crypto to my ${network} wallet address`,
        files: [
          new File([blob], `wallet-qr-${network}.png`, { type: "image/png" }),
        ],
      };

      // Try native sharing with image
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        // Fallback: download image and copy text
        const link = document.createElement("a");
        link.download = `wallet-qr-${network}.png`;
        link.href = canvas.toDataURL();
        link.click();

        // Also copy text to clipboard
        const textToCopy = `Send crypto to my ${network} wallet:\n${address}\n\nPowered by Pokket`;
        await navigator.clipboard.writeText(textToCopy);
        alert("QR code downloaded and wallet details copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing QR code:", error);

      // Ultimate fallback: copy address to clipboard
      try {
        const address = getCurrentAddress();
        const network = getCurrentNetworkLabel();
        const textToCopy = `Send crypto to my ${network} wallet:\n${address}\n\nPowered by Pokket`;
        await navigator.clipboard.writeText(textToCopy);
        alert("Wallet details copied to clipboard!");
      } catch (clipboardError) {
        alert("Unable to share. Please copy address manually.");
      }
    }
  };

  if (loading) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
          <div className="h-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !addressInfo) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="text-center text-red-600">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-600"
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
          <p className="text-gray-900 font-medium mb-2">
            Error loading QR code
          </p>
          <button
            onClick={fetchAddresses}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Receive Assets</h3>
        <p className="text-sm text-gray-600">
          Scan QR code or copy address to receive crypto
        </p>
      </div>

      {/* Network/Mode Selector */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        {/* Pokket Tab */}
        <button
          onClick={() => setSelectedNetwork("pokket")}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            selectedNetwork === "pokket"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          Pokket
        </button>

        {/* Ethereum Tab */}
        <button
          onClick={() => setSelectedNetwork("ethereum")}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            selectedNetwork === "ethereum"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
          </svg>
          Ethereum
        </button>

        {/* Solana Tab */}
        {addressInfo.solana && (
          <button
            onClick={() => setSelectedNetwork("solana")}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedNetwork === "solana"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12.066 7.726a4.5 4.4 0 0 1 6.168 6.166l-6.168-6.166Z" />
              <path
                fillRule="evenodd"
                d="M18.068 9.26c1.287.906 1.287 2.474 0 3.38l-8.568 6.034c-1.287.906-2.95.162-2.95-1.32V8.646c0-1.482 1.663-2.226 2.95-1.32L18.068 9.26Z"
              />
            </svg>
            Solana
          </button>
        )}
      </div>

      {/* QR Code */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-100 mb-6">
        <div className="flex justify-center" ref={qrRef}>
          <div className="bg-white p-4 rounded-xl">
            <QRCode
              value={getQRValue()}
              size={200}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox={`0 0 256 256`}
            />
          </div>
        </div>

        {/* QR Action Buttons */}
        <div className="flex space-x-3 mt-4">
          <button
            onClick={downloadQRCode}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200 text-sm font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <span>Download</span>
          </button>

          <button
            onClick={shareQRCode}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all duration-200 text-sm font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Network Info */}
      {selectedNetwork === "pokket" ? (
        <div className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-200">
          <div className="mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <svg
                className="w-5 h-5 text-orange-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="text-sm font-semibold text-orange-900">
                Pokket Profile QR
              </span>
              {verificationStatus.isVerified && (
                <VerifiedBadge
                  verificationStatus={verificationStatus}
                  size="sm"
                  showTooltip={true}
                />
              )}
            </div>
            <p className="text-xs text-orange-700 mb-3">
              This QR contains your complete Pokket profile for easy sharing
              {verificationStatus.isVerified && (
                <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Verified Identity
                </span>
              )}
            </p>
            <div className="font-mono text-xs bg-white p-3 rounded border border-orange-200">
              {`{
  "name": "${user?.name || "Anonymous User"}",
  "ethAddress": "${addressInfo?.ethereum.address || "..."}",
  "solAddress": "${addressInfo?.solana?.address || "null"}",
  "verified": ${verificationStatus.isVerified},
  "verificationTimestamp": ${verificationStatus.verificationTimestamp || "null"}
}`}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Network:</span>
            <span className="text-sm font-semibold text-gray-900">
              {getCurrentNetworkLabel()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Address:</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono text-gray-900">
                {getCurrentAddress().slice(0, 6)}...
                {getCurrentAddress().slice(-4)}
              </span>
              <button
                onClick={() =>
                  navigator.clipboard
                    .writeText(getCurrentAddress())
                    .then(() => alert("Address copied to clipboard!"))
                }
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Button */}
      <button
        onClick={() => {
          const valueToCopy =
            selectedNetwork === "pokket" ? getQRValue() : getCurrentAddress();
          const label =
            selectedNetwork === "pokket" ? "Pokket profile data" : "Address";
          navigator.clipboard
            .writeText(valueToCopy)
            .then(() => alert(`${label} copied to clipboard!`));
        }}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <span>
          {selectedNetwork === "pokket"
            ? "Copy Profile Data"
            : "Copy Full Address"}
        </span>
      </button>

      {/* Enhanced Info Section */}
      {selectedNetwork === "solana" && (
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-purple-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-purple-900 mb-1">
                Auto-conversion Enabled
              </p>
              <p className="text-xs text-purple-800">
                SOL payments will be automatically converted to ETH in your
                wallet for seamless cross-chain transfers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg
            className="w-4 h-4 text-blue-600 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-xs font-medium text-blue-900 mb-1">
              Security Notice
            </p>
            <p className="text-xs text-blue-800">
              Only send {selectedNetwork === "ethereum" ? "Ethereum" : "Solana"}{" "}
              assets to this address. Sending other tokens may result in
              permanent loss.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
