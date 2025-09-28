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

      <main className="pt-20 pb-20 md:pb-8 md:pt-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Profile
            </h1>
            <p className="text-gray-600 md:text-lg">
              Manage your personal information and digital identity
            </p>
          </div>

          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center space-y-6 md:space-y-0 md:space-x-8 mb-8">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      {user?.avatar ? (
                        <img
                          className="w-24 h-24 md:w-32 md:h-32 rounded-full"
                          src={user.avatar}
                          alt={user.name || "User avatar"}
                        />
                      ) : (
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                          <span className="text-3xl md:text-4xl font-bold text-white">
                            {profileData.name.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                      <button className="absolute -bottom-2 -right-2 bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-50 transition-colors shadow-lg">
                        <svg
                          className="w-5 h-5 text-gray-600"
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

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Your email"
                        />
                        <textarea
                          value={profileData.bio}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              bio: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                          placeholder="Tell us about yourself"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                            {profileData.name || "Anonymous User"}
                          </h2>
                          {verificationStatus.isVerified && (
                            <svg
                              className="w-6 h-6 text-blue-500"
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
                        <p className="text-gray-600 mb-4 text-lg">
                          {profileData.email}
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                          {profileData.bio}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {isEditing ? (
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={handleSave}
                          className="px-6 py-3 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Identity Verification
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {verificationStatus.isVerified
                          ? "Your identity has been verified successfully"
                          : "Verify your identity to increase trust and security"}
                      </p>
                    </div>
                    {user?.publicAddress && (
                      <VerificationButton userAddress={user.publicAddress} />
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Wallet Information
                </h3>
                <div className="space-y-4">
                  {user?.publicAddress && (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Wallet Address
                        </h4>
                        <p className="text-sm text-gray-500 font-mono">
                          {user.publicAddress.slice(0, 10)}...
                          {user.publicAddress.slice(-8)}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(user.publicAddress, "Wallet address")
                        }
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
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
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6 mt-6 lg:mt-0">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <svg
                      className="w-5 h-5 text-gray-400"
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
                    <span className="text-sm font-medium">Change Password</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z"
                      />
                    </svg>
                    <span className="text-sm font-medium">
                      Export Private Key
                    </span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Download Data</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-32">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Account Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Account Created
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      Jan 2024
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Verification Status
                    </span>
                    <span
                      className={`text-sm font-medium ${verificationStatus.isVerified ? "text-green-600" : "text-orange-600"}`}
                    >
                      {verificationStatus.isVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Security Level
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                      High
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Login</span>
                    <span className="text-sm font-medium text-gray-900">
                      Today
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
