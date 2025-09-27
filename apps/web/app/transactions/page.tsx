"use client";

import React, { useState } from "react";
import ResponsiveNavbar from "../../components/ResponsiveNavbar";
import { formatDistanceToNow } from "date-fns";

// Mock transaction data
const mockTransactions = [
  {
    id: "1",
    type: "sent",
    amount: "0.25",
    token: "ETH",
    to: "John Doe",
    address: "0x1234...5678",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    status: "completed",
    hash: "0xabcd...efgh",
  },
  {
    id: "2",
    type: "received",
    amount: "50.00",
    token: "PYUSD",
    from: "Alice Smith",
    address: "0x8765...4321",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: "completed",
    hash: "0xijkl...mnop",
  },
  {
    id: "3",
    type: "swap",
    amount: "100.00",
    fromToken: "USDC",
    toToken: "PYUSD",
    toAmount: "99.95",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    status: "completed",
    hash: "0xqrst...uvwx",
  },
  {
    id: "4",
    type: "sent",
    amount: "0.1",
    token: "ETH",
    to: "Bob Johnson",
    address: "0x9999...8888",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    status: "pending",
    hash: "0xyzab...cdef",
  },
  {
    id: "5",
    type: "received",
    amount: "25.50",
    token: "USDC",
    from: "Sarah Wilson",
    address: "0x7777...6666",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    status: "completed",
    hash: "0xghij...klmn",
  },
];

type TransactionType = "all" | "sent" | "received" | "swap";

export default function TransactionsPage() {
  const [filter, setFilter] = useState<TransactionType>("all");

  const filteredTransactions = mockTransactions.filter((tx) => {
    if (filter === "all") return true;
    return tx.type === filter;
  });

  const getTransactionIcon = (type: string, status: string) => {
    if (status === "pending") {
      return (
        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      );
    }

    switch (type) {
      case "sent":
        return (
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </div>
        );
      case "received":
        return (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
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
                d="M12 5v14m7-7l-7 7-7-7"
              />
            </svg>
          </div>
        );
      case "swap":
        return (
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-purple-600"
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
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Completed
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            Failed
          </span>
        );
      default:
        return null;
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
              Transaction History
            </h1>
            <p className="text-gray-600">
              Track all your payments, receipts, and swaps
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 mb-6">
            <div className="p-2">
              <div className="grid grid-cols-4 gap-1">
                {(["all", "sent", "received", "swap"] as TransactionType[]).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => setFilter(type)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        filter === type
                          ? "bg-orange-100 text-orange-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center space-x-4">
                  {getTransactionIcon(transaction.type, transaction.status)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 capitalize">
                          {transaction.type === "swap"
                            ? `${transaction.fromToken} → ${transaction.toToken}`
                            : `${transaction.type} ${transaction.token}`}
                        </h3>
                        {getStatusBadge(transaction.status)}
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-semibold ${
                            transaction.type === "received"
                              ? "text-green-600"
                              : transaction.type === "sent"
                                ? "text-red-600"
                                : "text-gray-900"
                          }`}
                        >
                          {transaction.type === "received" && "+"}
                          {transaction.type === "sent" && "-"}
                          {transaction.type === "swap"
                            ? `${transaction.amount} ${transaction.fromToken}`
                            : `${transaction.amount} ${transaction.token}`}
                        </div>
                        {transaction.type === "swap" &&
                          transaction.toAmount && (
                            <div className="text-xs text-gray-500">
                              +{transaction.toAmount} {transaction.toToken}
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        {transaction.type === "sent" && transaction.to && (
                          <span>To: {transaction.to}</span>
                        )}
                        {transaction.type === "received" &&
                          transaction.from && (
                            <span>From: {transaction.from}</span>
                          )}
                        {transaction.type === "swap" && (
                          <span>Swapped via DeFi</span>
                        )}
                      </div>
                      <div>
                        {formatDistanceToNow(transaction.timestamp)} ago
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No transactions found
              </h3>
              <p className="text-gray-500">
                No transactions match the selected filter.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
