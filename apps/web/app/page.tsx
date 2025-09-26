"use client";

import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { Dashboard } from "../components/Dashboard";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-orange-300 rounded-full animate-spin mx-auto opacity-60 animation-delay-150"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 blur-3xl float"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 blur-3xl float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-orange-500/10 to-yellow-500/10 blur-3xl float"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-md transform rotate-45"></div>
            </div>
            <h1 className="text-2xl font-bold text-white">Pokket</h1>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#security"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Security
            </a>
            <a
              href="#about"
              className="text-gray-300 hover:text-white transition-colors"
            >
              About
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              <span className="text-white text-sm font-medium">
                Decentralized
              </span>
            </div>

            <h2 className="text-5xl lg:text-7xl font-bold text-white mb-6">
              Revolutionizing
              <br />
              <span className="text-gradient bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Web3 Finance
              </span>
            </h2>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
              Secure, scalable, and decentralized solutions for your digital
              assets—experience the future of financial freedom.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <GoogleSignInButton
                onError={(error) => {
                  console.error("Sign in error:", error);
                  alert(`Sign in failed: ${error}`);
                }}
              />
              <button className="flex items-center px-8 py-4 bg-transparent border border-white/30 text-white rounded-xl hover:bg-white/10 transition-all duration-300 group">
                <svg
                  className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Watch Demo
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div id="features" className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="group">
              <div className="card glass-dark p-8 h-full text-center group-hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
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
                      d="M4 7v10c0 2.21 3.31 4 7 4s7-1.79 7-4V7c0-2.21-3.31-4-7-4S4 4.79 4 7z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 7c0 2.21 3.31 4 7 4s7-1.79 7-4"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Scalability
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Adapt and grow, no matter the demand or scale requirements for
                  your digital assets.
                </p>
              </div>
            </div>

            <div className="group">
              <div className="card glass-dark p-8 h-full text-center group-hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Decentralization
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Web3 infrastructure that moves away from centralized control
                  to true digital freedom.
                </p>
              </div>
            </div>

            <div className="group">
              <div className="card glass-dark p-8 h-full text-center group-hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Connectivity
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Seamless cross-chain interactions enabling true
                  interoperability across blockchain networks.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="glass-dark card p-12 max-w-4xl mx-auto">
              <div className="mb-4">
                <span className="inline-flex items-center px-4 py-2 bg-orange-500/20 text-orange-300 rounded-full text-sm font-medium">
                  Revolutionary
                </span>
              </div>
              <h3 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Enhance Your Digital Workflow
                <br />
                With Seamless Web3 Integration
              </h3>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                Join a thriving community committed to safeguarding digital
                assets, empowering your financial journey with trust,
                innovation, and security.
              </p>
              <GoogleSignInButton
                onError={(error) => {
                  console.error("Sign in error:", error);
                  alert(`Sign in failed: ${error}`);
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
                </div>
                <span className="text-xl font-bold text-white">Pokket</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Revolutionizing Web3 finance with secure, scalable, and
                decentralized solutions.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Community
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Help</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Help Centre
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Forum
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Stay Updated</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="input-modern flex-1 mr-3 bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
                <button className="btn-primary">
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 Pokket. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
