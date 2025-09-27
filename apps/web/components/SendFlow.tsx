"use client";

import React, { useState } from "react";
import QRPaymentFlow from "./QRPaymentFlow";
import UserSearchModal from "./UserSearchModal";
import SendToUserModal from "./SendToUserModal";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  publicAddress: string;
  publicAddressSolana?: string;
}

export default function SendFlow() {
  const [currentView, setCurrentView] = useState<"main" | "qr" | "search">("main");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
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
      <div>
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
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Money</h2>
            <p className="text-gray-600">
              Choose how you&apos;d like to send cryptocurrency
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Send to Contact */}
            <button
              onClick={() => setShowUserSearchModal(true)}
              className="group p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-orange-500 hover:bg-orange-50/50 transition-all duration-300"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 group-hover:bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
                  <svg
                    className="w-6 h-6 text-gray-600 group-hover:text-orange-600"
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Send to Contact
                </h3>
                <p className="text-sm text-gray-600">
                  Search by name or email to send money instantly
                </p>
              </div>
            </button>

            {/* Scan QR Code */}
            <button
              onClick={() => setCurrentView("qr")}
              className="group p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-orange-500 hover:bg-orange-50/50 transition-all duration-300"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 group-hover:bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
                  <svg
                    className="w-6 h-6 text-gray-600 group-hover:text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h5.01M4 20h5.01"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Scan QR Code
                </h3>
                <p className="text-sm text-gray-600">
                  Scan a payment QR code to send crypto instantly
                </p>
              </div>
            </button>
          </div>

          {/* Recent Activity Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-gray-700">Ethereum</span>
              </button>
              <button className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-gray-700">Base</span>
              </button>
              <button className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-gray-700">Solana</span>
              </button>
              <button className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">History</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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
    </>
  );
}