"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  publicAddress: string;
  publicAddressSolana?: string;
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export default function UserSearchModal({
  isOpen,
  onClose,
  onSelectUser,
}: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [recentContacts, setRecentContacts] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch recent contacts on mount
  useEffect(() => {
    if (isOpen) {
      fetchRecentContacts();
      // Focus search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Search users when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers(searchQuery.trim());
      } else {
        setSearchResults([]);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchRecentContacts = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch("http://localhost:3001/users/recent", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentContacts(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching recent contacts:", error);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) return;

    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `http://localhost:3001/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setError("Failed to search users. Please try again.");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    onClose();
  };

  const renderUserItem = (user: User, isRecent = false) => {
    const displayName = user.name || user.email;
    const initials = displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <button
        key={user.id}
        onClick={() => handleSelectUser(user)}
        className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors duration-200 text-left"
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {/* {user.avatar ? (
            <Image
              src={user.avatar}
              alt={displayName}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {initials}
              </span>
            </div>
          )} */}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {user.name || "Anonymous User"}
            </h3>
            {isRecent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Recent
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate">{user.email}</p>
          <div className="flex items-center space-x-3 mt-1">
            {user.publicAddress && (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-gray-500">ETH</span>
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

        {/* Arrow */}
        <div className="flex-shrink-0">
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </button>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden max-h-[80vh] flex flex-col">
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
            <p className="text-sm text-gray-600">
              Search by name or email to send tokens
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email"
              className="block w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-2xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {isLoading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="px-6 py-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchQuery.trim().length >= 2 && (
            <div>
              {searchResults.length > 0 ? (
                <div>
                  <div className="px-6 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Search Results
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {searchResults.map((user) => renderUserItem(user))}
                  </div>
                </div>
              ) : !isLoading && (
                <div className="px-6 py-8 text-center">
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No users found
                  </h3>
                  <p className="text-sm text-gray-600">
                    Try searching with a different name or email
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recent Contacts */}
          {searchQuery.trim().length < 2 && recentContacts.length > 0 && (
            <div>
              <div className="px-6 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Recent Contacts
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {recentContacts.map((user) => renderUserItem(user, true))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {searchQuery.trim().length < 2 && recentContacts.length === 0 && (
            <div className="px-6 py-8 text-center">
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Find people to send money
              </h3>
              <p className="text-sm text-gray-600">
                Search by name or email to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}