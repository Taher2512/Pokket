"use client";

import React, { useState } from "react";
import ResponsiveNavbar from "../../components/ResponsiveNavbar";
import { useAuth } from "../../contexts/AuthContext";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
  });
  const [security, setSecurity] = useState({
    biometric: true,
    twoFactor: false,
  });

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      logout();
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
              Settings
            </h1>
            <p className="text-gray-600">
              Manage your account preferences and security settings
            </p>
          </div>

          {/* Settings Sections */}
          <div className="space-y-6">
            {/* Account Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Account Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {user?.avatar && (
                    <img
                      className="w-16 h-16 rounded-full"
                      src={user.avatar}
                      alt={user.name || "User avatar"}
                    />
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {user?.name || "User"}
                    </h3>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <p className="text-xs text-gray-400">
                      {user?.publicAddress &&
                        `${user.publicAddress.slice(0, 6)}...${user.publicAddress.slice(-4)}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Push Notifications
                    </h3>
                    <p className="text-xs text-gray-500">
                      Receive notifications about your transactions
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications({
                        ...notifications,
                        push: !notifications.push,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifications.push ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notifications.push ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Email Notifications
                    </h3>
                    <p className="text-xs text-gray-500">
                      Receive email updates about your account
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications({
                        ...notifications,
                        email: !notifications.email,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifications.email ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notifications.email ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      SMS Notifications
                    </h3>
                    <p className="text-xs text-gray-500">
                      Receive SMS alerts for important activities
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications({
                        ...notifications,
                        sms: !notifications.sms,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifications.sms ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notifications.sms ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Security & Privacy
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Biometric Authentication
                    </h3>
                    <p className="text-xs text-gray-500">
                      Use fingerprint or face recognition to secure your wallet
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSecurity({
                        ...security,
                        biometric: !security.biometric,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      security.biometric ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        security.biometric ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-xs text-gray-500">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSecurity({
                        ...security,
                        twoFactor: !security.twoFactor,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      security.twoFactor ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        security.twoFactor ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <button className="w-full mt-4 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
                  Change Password
                </button>
              </div>
            </div>

            {/* App Preferences */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                App Preferences
              </h2>
              <div className="space-y-4">
                <button className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-left">
                  <div className="flex items-center justify-between">
                    <span>Default Currency</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">USD</span>
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                <button className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-left">
                  <div className="flex items-center justify-between">
                    <span>Language</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">English</span>
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                <button className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-left">
                  <div className="flex items-center justify-between">
                    <span>Network</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Mainnet</span>
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Support & Legal
              </h2>
              <div className="space-y-2">
                <button className="w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                  Help Center
                </button>
                <button className="w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                  Contact Support
                </button>
                <button className="w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                  Terms of Service
                </button>
                <button className="w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                  Privacy Policy
                </button>
              </div>
            </div>

            {/* Logout */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
