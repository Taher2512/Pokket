"use client";

import React, { useState } from "react";
import ResponsiveNavbar from "../../components/ResponsiveNavbar";
import { useAuth } from "../../contexts/AuthContext";
import { useVerification } from "../../contexts/VerificationContext";
import { VerificationButton } from "../../components/VerificationButton";

export default function ProfilePage() {
  const { user } = useAuth();
  const { verificationStatus } = useVerification();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: "Crypto enthusiast and early adopter of Web3 technologies. Love exploring DeFi and building the future of finance.",
  });

  const handleSave = () => {
    // Here you would typically make an API call to update the profile
    console.log("Saving profile:", profileData);
    setIsEditing(false);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard!`);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20">
      <ResponsiveNavbar />

      {/* Main Content */}
      <main className="pt-20 pb-20 md:pb-8 md:pt-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Profile
            </h1>
            <p className="text-gray-600">
              Manage your personal information and digital identity
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6 mb-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="relative">
                  {user?.avatar ? (
                    <img
                      className="w-20 h-20 md:w-24 md:h-24 rounded-full"
                      src={user.avatar}
                      alt={user.name || "User avatar"}
                    />
                  ) : (
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl md:text-3xl font-bold text-white">
                        {profileData.name.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  <button className="absolute -bottom-1 -right-1 bg-white border border-gray-300 rounded-full p-1.5 hover:bg-gray-50 transition-colors">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Your email"
                    />
                    <textarea
                      value={profileData.bio}
                      onChange={(e) =>
                        setProfileData({ ...profileData, bio: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={3}
                      placeholder="Tell us about yourself"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h2 className="text-xl font-bold text-gray-900">
                        {profileData.name || "Anonymous User"}
                      </h2>
                      {verificationStatus.isVerified && (
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{profileData.email}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {profileData.bio}
                    </p>
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <div className="flex-shrink-0">
                {isEditing ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Verification Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Identity Verification
                  </h3>
                  <p className="text-xs text-gray-500">
                    {verificationStatus.isVerified
                      ? "Your identity has been verified"
                      : "Verify your identity to increase trust and security"}
                  </p>
                </div>
                {user?.publicAddress && (
                  <VerificationButton userAddress={user.publicAddress} />
                )}
              </div>
            </div>
          </div>

          {/* Wallet Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Wallet Information
            </h3>
            <div className="space-y-4">
              {user?.publicAddress && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Ethereum Address
                    </h4>
                    <p className="text-xs text-gray-500 font-mono">
                      {`${user.publicAddress.slice(0, 10)}...${user.publicAddress.slice(-8)}`}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(user.publicAddress, "Ethereum address")
                    }
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <h4 className="text-sm font-medium text-blue-900">
                      Security Score
                    </h4>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">85/100</p>
                  <p className="text-xs text-blue-700">Good security level</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <h4 className="text-sm font-medium text-green-900">
                      Transactions
                    </h4>
                  </div>
                  <p className="text-2xl font-bold text-green-900">47</p>
                  <p className="text-xs text-green-700">Total completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Profile updated
                  </p>
                  <p className="text-xs text-gray-500">
                    Updated profile information
                  </p>
                </div>
                <span className="text-xs text-gray-400">2 mins ago</span>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Security settings updated
                  </p>
                  <p className="text-xs text-gray-500">
                    Enabled two-factor authentication
                  </p>
                </div>
                <span className="text-xs text-gray-400">1 hour ago</span>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Token swap completed
                  </p>
                  <p className="text-xs text-gray-500">
                    Swapped 100 USDC to PYUSD
                  </p>
                </div>
                <span className="text-xs text-gray-400">3 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
