"use client";

import React, { useState } from "react";
import QRPaymentFlow from "../../components/QRPaymentFlow";
import UserSearchModal from "../../components/UserSearchModal";
import SendToUserModal from "../../components/SendToUserModal";
import ResponsiveNavbar from "../../components/ResponsiveNavbar";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  publicAddress: string;
  publicAddressSolana?: string;
}

export default function SendPage() {
  const [currentView, setCurrentView] = useState<"main" | "qr">("main");
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSendToUserModal, setShowSendToUserModal] = useState(false);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setShowUserSearchModal(false);
    setShowSendToUserModal(true);
  };

  const handleCloseSendToUser = () => {
    setShowSendToUserModal(false);
    setSelectedUser(null);
  };

  if (currentView === "qr") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20">
        <ResponsiveNavbar />
        <main className="pt-20 pb-20 md:pb-8 md:pt-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <button
                onClick={() => setCurrentView("main")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Send Options</span>
              </button>
            </div>
            <QRPaymentFlow />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20">
      <ResponsiveNavbar />

      {/* Main Content */}
      <main className="pt-20 pb-20 md:pb-8 md:pt-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Send Payment
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Choose how you&apos;d like to send cryptocurrency
            </p>
          </div>

          {/* Send Options */}
          <div className="max-w-2xl mx-auto">
            <div className="grid md:grid-cols-1 gap-6">
              {/* Send to Contact */}
              <button
                onClick={() => setShowUserSearchModal(true)}
                className="group p-8 border-2 border-dashed border-gray-300 rounded-3xl hover:border-orange-500 hover:bg-orange-50/50 transition-all duration-300"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 group-hover:bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors">
                    <svg
                      className="w-8 h-8 text-gray-600 group-hover:text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    Send to Contact
                  </h3>
                  <p className="text-gray-600 text-lg">
                    Search by name or email to send money instantly to your contacts
                  </p>
                </div>
              </button>

              {/* QR Code Options */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Scan QR Code */}
                <button
                  onClick={() => setCurrentView("qr")}
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
                      <svg
                        className="w-6 h-6 text-gray-600 group-hover:text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Scan QR Code
                    </h3>
                    <p className="text-sm text-gray-600">
                      Use your camera to scan payment QR codes
                    </p>
                  </div>
                </button>

                {/* Upload QR Code */}
                <button
                  onClick={() => setCurrentView("qr")}
                  className="group p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-green-500 hover:bg-green-50/50 transition-all duration-300"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 group-hover:bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
                      <svg
                        className="w-6 h-6 text-gray-600 group-hover:text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Upload QR Code
                    </h3>
                    <p className="text-sm text-gray-600">
                      Select a QR code image from your device
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <UserSearchModal
        isOpen={showUserSearchModal}
        onClose={() => setShowUserSearchModal(false)}
        onSelectUser={handleSelectUser}
      />

      {selectedUser && (
        <SendToUserModal
          isOpen={showSendToUserModal}
          onClose={handleCloseSendToUser}
          user={selectedUser}
        />
      )}
    </div>
  );
}