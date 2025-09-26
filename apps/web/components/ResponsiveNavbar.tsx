"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useVerification } from "../contexts/VerificationContext";
import { usePathname } from "next/navigation";
import { VerificationButton } from "./VerificationButton";
import { NavbarVerifiedBadge } from "./VerifiedBadge";

interface ResponsiveNavbarProps {
  currentPage?: string;
}

export default function ResponsiveNavbar({
  currentPage,
}: ResponsiveNavbarProps) {
  const { user, logout } = useAuth();
  const { verificationStatus } = useVerification();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getActiveClass = (path: string) => {
    if (path === "/" && pathname === "/") {
      return "px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-xl";
    } else if (path !== "/" && pathname === path) {
      return "px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-xl";
    }
    return "px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200";
  };

  const getMobileActiveClass = (path: string) => {
    if (path === "/" && pathname === "/") {
      return "flex flex-col items-center justify-center py-2.5 px-3 text-orange-600 bg-orange-50 rounded-xl min-h-[56px] transition-all duration-200";
    } else if (path !== "/" && pathname === path) {
      return "flex flex-col items-center justify-center py-2.5 px-3 text-orange-600 bg-orange-50 rounded-xl min-h-[56px] transition-all duration-200";
    }
    return "flex flex-col items-center justify-center py-2.5 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl min-h-[56px] transition-all duration-200";
  };

  return (
    <>
      {/* Desktop Navbar */}
      <header className="hidden md:block fixed top-4 left-4 right-4 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-lg shadow-black/5">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <Link href="/" className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      Pokket
                    </span>
                  </Link>
                </div>

                {/* Navigation - Center */}
                <div className="flex items-center space-x-2 flex-1 justify-center mx-8">
                  <Link href="/" className={getActiveClass("/")}>
                    Dashboard
                  </Link>
                  <Link href="/send" className={getActiveClass("/send")}>
                    Send
                  </Link>
                  <Link href="/swap" className={getActiveClass("/swap")}>
                    Swap
                  </Link>
                </div>

                {/* User Profile - Right (Fixed Position) */}
                <div className="flex items-center space-x-4 flex-shrink-0">
                  {/* Verification Button */}
                  {user?.publicAddress && (
                    <VerificationButton userAddress={user.publicAddress} />
                  )}

                  <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50/50 rounded-xl">
                    {user?.avatar && (
                      <img
                        className="w-7 h-7 rounded-full"
                        src={user.avatar}
                        alt={user.name || "User avatar"}
                      />
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        {user?.name?.split(" ")[0] || "User"}
                      </span>
                      {/* Verified Badge */}
                      <NavbarVerifiedBadge
                        verificationStatus={verificationStatus}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 flex-shrink-0"
                    title="Logout"
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
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/60">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-sm transform rotate-45"></div>
              </div>
              <span className="text-lg font-bold text-gray-900">Pokket</span>
            </Link>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              {/* Mobile Verification Button */}
              {user?.publicAddress && (
                <div className="scale-90">
                  <VerificationButton userAddress={user.publicAddress} />
                </div>
              )}

              <div className="flex items-center space-x-2">
                {user?.avatar && (
                  <img
                    className="w-6 h-6 rounded-full"
                    src={user.avatar}
                    alt={user.name || "User avatar"}
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user?.name?.split(" ")[0] || "User"}
                </span>
                {/* Mobile Verified Badge */}
                <NavbarVerifiedBadge verificationStatus={verificationStatus} />
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Logout"
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/60 mobile-navbar-enter">
          <div className="safe-area-pb">
            <div className="px-4 py-3">
              <div className="grid grid-cols-3 gap-2">
                <Link
                  href="/"
                  className={getMobileActiveClass("/")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5 mb-1 flex-shrink-0"
                    fill={pathname === "/" ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6h-8V5z"
                    />
                  </svg>
                  <span className="text-xs font-medium leading-tight">
                    Dashboard
                  </span>
                </Link>

                <Link
                  href="/send"
                  className={getMobileActiveClass("/send")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5 mb-1 flex-shrink-0"
                    fill={pathname === "/send" ? "currentColor" : "none"}
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
                  <span className="text-xs font-medium leading-tight">
                    Send
                  </span>
                </Link>

                <Link
                  href="/swap"
                  className={getMobileActiveClass("/swap")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5 mb-1 flex-shrink-0"
                    fill={pathname === "/swap" ? "currentColor" : "none"}
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
                  <span className="text-xs font-medium leading-tight">
                    Swap
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
