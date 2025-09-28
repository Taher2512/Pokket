"use client";
import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Shield,
  Zap,
  Globe,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Smartphone,
  Lock,
  RefreshCw,
  Star,
  TrendingUp,
  Users,
  Award,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  Clock,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Dashboard } from "../components/Dashboard";
import { IdentityVerificationButton } from "../components/IdentityVerificationButton";
import { apiService } from "../lib/api";

const LandingPage = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const [copied, setCopied] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible((prev) => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting,
          }));
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll("[id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const authUrl = await apiService.getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to initiate Google sign in:", error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl animate-pulse text-gray-600">
          Loading Pokket…
        </div>
      </div>
    );
  }

  // Redirect to dashboard if authenticated
  if (isAuthenticated) {
    return <Dashboard />;
  }

  // Google logo component
  const GoogleIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  const handleCopyAddress = () => {
    navigator.clipboard.writeText("0x1234...5678");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const features = [
    {
      icon: <Smartphone className="w-10 h-10" />,
      title: "One-Click Web3 Access",
      subtitle: "Google + SELF KYC",
      description:
        "Sign in with Google and complete SELF protocol KYC verification instantly. No extensions, no seed phrases, no complexity.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
    },
    {
      icon: <Globe className="w-10 h-10" />,
      title: "1inch DEX Integration",
      subtitle: "Best Rates Guaranteed",
      description:
        "Seamlessly swap assets via 1inch aggregator for optimal rates. Receive from any blockchain, convert to stable PYUSD automatically.",
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50",
    },
    {
      icon: <Lock className="w-10 h-10" />,
      title: "PYUSD Stable Conversion",
      subtitle: "PayPal Integration",
      description:
        "All assets auto-convert to PYUSD stablecoin for easy management. Cash out directly to your PayPal and bank account instantly.",
      color: "from-emerald-500 to-teal-500",
      bgColor: "from-emerald-50 to-teal-50",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Choose Your Path",
      description:
        "Start with Google OAuth or go directly to identity verification with SELF protocol",
      icon: <Users className="w-6 h-6" />,
      details: ["Google sign-in", "Identity verification", "No seed phrases"],
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
    },
    {
      step: "02",
      title: "Identity with SELF Protocol",
      description:
        "Complete secure identity verification using SELF protocol for trusted Web3 transactions",
      icon: <Shield className="w-6 h-6" />,
      details: ["SELF protocol", "Instant verification", "Privacy-first"],
      color: "from-emerald-500 to-teal-500",
      bgColor: "from-emerald-50 to-teal-50",
    },
    {
      step: "03",
      title: "Cross-Chain Swaps via 1inch",
      description:
        "Seamlessly swap assets across chains using 1inch aggregator for best rates",
      icon: <RefreshCw className="w-6 h-6" />,
      details: ["1inch integration", "Best rates", "Multi-chain support"],
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50",
    },
    {
      step: "04",
      title: "Convert to PYUSD",
      description:
        "Assets automatically convert to stable PYUSD for easy management and spending",
      icon: <Sparkles className="w-6 h-6" />,
      details: ["PYUSD stablecoin", "Auto-conversion", "Stable value"],
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-50 to-red-50",
    },
    {
      step: "05",
      title: "PayPal Cash-Out",
      description:
        "Transfer directly to your bank account via PayPal integration",
      icon: <TrendingUp className="w-6 h-6" />,
      details: ["PayPal integration", "Instant transfers", "Bank connection"],
      color: "from-indigo-500 to-blue-500",
      bgColor: "from-indigo-50 to-blue-50",
    },
  ];

  const stats = [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 text-slate-900 overflow-x-hidden font-['Inter',sans-serif] antialiased relative">
      {/* Subtle Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-50/30 via-transparent to-blue-50/30" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-l from-purple-100/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-gradient-to-r from-orange-100/20 to-transparent rounded-full blur-3xl" />
      </div>
      {/* Dynamic Ambient Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full blur-3xl transition-transform duration-[3000ms] ease-out"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            left: "10%",
            top: "20%",
          }}
        />
        <div
          className="absolute w-80 h-80 bg-gradient-to-r from-orange-200/20 to-pink-200/20 rounded-full blur-3xl transition-transform duration-[4000ms] ease-out"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`,
            right: "10%",
            bottom: "20%",
          }}
        />
      </div>

      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrollY > 50
            ? "bg-white/80 backdrop-blur-xl shadow-xl border-b border-white/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <img
                  src="/logo1.svg"
                  alt="Pokket"
                  width="32"
                  height="32"
                  className="transition-all duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                  Pokket
                </span>
                <span className="text-xs text-slate-500 font-medium -mt-1">
                  Web3 Made Simple
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-10">
              {["Features", "How it Works", "Security"].map((item, index) => (
                <a
                  key={index}
                  href={`#${item.toLowerCase().replace(" ", "-")}`}
                  className="relative text-slate-600 hover:text-orange-600 transition-all duration-300 font-medium text-lg group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleGoogleSignIn}
                  className="relative bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white px-6 py-3 rounded-2xl hover:from-orange-500 hover:to-orange-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 overflow-hidden group flex items-center space-x-2"
                >
                  <GoogleIcon className="w-4 h-4" />
                  <span className="relative z-10">Google</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
                
                <IdentityVerificationButton 
                  size="md"
                  variant="secondary"
                  className="border-2 border-orange-200 hover:border-orange-300 bg-white text-orange-600 hover:bg-orange-50"
                />
              </div>
            </div>

            <button
              className="md:hidden text-slate-600 hover:text-orange-600 transition-colors p-2 rounded-xl hover:bg-orange-50"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Mobile Menu */}
          <div
            className={`md:hidden transition-all duration-300 ease-out ${isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
          >
            <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl mx-4 my-4 shadow-xl">
              <div className="p-8 space-y-6">
                {["Features", "How it Works", "Security"].map((item, index) => (
                  <a
                    key={index}
                    href={`#${item.toLowerCase().replace(" ", "-")}`}
                    className="block text-slate-600 hover:text-orange-600 transition-colors font-medium text-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
                <div className="space-y-3">
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full bg-gradient-to-r from-orange-400 to-orange-600 text-white px-8 py-4 rounded-2xl hover:from-orange-500 hover:to-orange-700 transition-all duration-300 font-semibold shadow-lg flex items-center justify-center space-x-2"
                  >
                    <GoogleIcon className="w-5 h-5" />
                    <span>Sign with Google</span>
                  </button>
                  
                  <IdentityVerificationButton 
                    size="md"
                    variant="secondary"
                    className="w-full border-2 border-orange-200 hover:border-orange-300 bg-white text-orange-600 hover:bg-orange-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 lg:px-8 relative bg-gradient-to-br from-white/95 via-orange-50/30 to-blue-50/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-white/40 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-5xl mx-auto relative">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 px-6 py-3 rounded-full text-sm font-semibold mb-12 border border-orange-200/50 shadow-lg backdrop-blur-sm animate-fade-in">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse delay-150" />
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse delay-300" />
              </div>
              <span>
                Now with SELF protocol identity • 1inch DEX • PYUSD stable
                conversion
              </span>
              <Star className="w-4 h-4 text-orange-500" />
            </div>

            <h1 className="text-6xl lg:text-8xl font-black mb-12 leading-none tracking-tight">
              <span className="inline-block bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent animate-fade-in-up">
                Web3 Wallet
              </span>
              <br />
              <span className="inline-block bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent animate-fade-in-up delay-200">
                Made Simple
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-slate-600 mb-16 max-w-4xl mx-auto leading-relaxed font-light animate-fade-in-up delay-300">
              The first crypto wallet that feels like your favorite app. 
              Start with <span className="font-semibold text-orange-600">Google</span> or 
              <span className="font-semibold text-blue-600">SELF protocol</span> directly. 
              Swap via <span className="font-semibold text-orange-600">1inch</span>,
              convert to stable{" "}
              <span className="font-semibold text-orange-600">PYUSD</span>, and
              cash out to PayPal.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up delay-500">
              <button
                onClick={handleGoogleSignIn}
                className="group relative bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white px-10 py-5 rounded-2xl hover:from-orange-500 hover:to-orange-700 transition-all duration-500 font-bold text-xl shadow-2xl hover:shadow-orange-500/25 transform hover:-translate-y-2 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center space-x-3">
                  <GoogleIcon className="w-6 h-6" />
                  <span>Start with Google</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
              
              {/* OR separator */}
              <div className="flex items-center space-x-4 animate-fade-in-up delay-600">
                <div className="h-px bg-slate-300 flex-1"></div>
                <span className="text-slate-500 font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200">
                  or
                </span>
                <div className="h-px bg-slate-300 flex-1"></div>
              </div>
              
              {/* Identity Verification Button - Alternative authentication method */}
              <div className="animate-fade-in-up delay-700">
                <IdentityVerificationButton 
                  size="lg"
                  variant="secondary"
                  className="border-2 border-blue-200 hover:border-blue-300 bg-white/90 backdrop-blur-sm text-blue-600 hover:bg-blue-50"
                />
              </div>
            

              <button className="group text-slate-700 hover:text-orange-600 font-semibold text-xl flex items-center space-x-3 px-8 py-5 rounded-2xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition-all duration-300 border-2 border-transparent hover:border-orange-200">
                <span>Watch Demo</span>
                <div className="relative">
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-orange-400 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 -z-10" />
                </div>
              </button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-24 relative max-w-6xl mx-auto animate-fade-in-up delay-1000">
            <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
              {/* Browser Chrome */}
              <div className="bg-gradient-to-r from-slate-50 to-white p-6 border-b border-slate-200/50">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex space-x-2">
                    <div className="w-4 h-4 bg-red-400 rounded-full hover:bg-red-500 transition-colors cursor-pointer" />
                    <div className="w-4 h-4 bg-yellow-400 rounded-full hover:bg-yellow-500 transition-colors cursor-pointer" />
                    <div className="w-4 h-4 bg-green-400 rounded-full hover:bg-green-500 transition-colors cursor-pointer" />
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-lg px-4 py-2">
                    <div className="text-slate-500 text-sm">pokket.app</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="group bg-gradient-to-br from-orange-50 via-white to-orange-50/50 p-8 rounded-2xl border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="text-orange-600 font-semibold mb-3">
                      Total Balance
                    </div>
                    <div className="text-4xl font-bold text-slate-900 mb-2">
                      $2,456.78
                    </div>
                    <div className="flex items-center text-emerald-500 text-sm font-semibold">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +12.5% today
                    </div>
                  </div>

                  <div className="group bg-gradient-to-br from-blue-50 via-white to-blue-50/50 p-8 rounded-2xl border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="text-blue-600 font-semibold mb-3">
                      Quick Send
                    </div>
                    <div className="bg-white rounded-xl p-6 border-2 border-dashed border-slate-200 hover:border-blue-300 transition-colors">
                      <div className="text-center text-slate-500 text-sm font-medium">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <div className="w-8 h-8 bg-slate-300 rounded opacity-50" />
                        </div>
                        Scan QR Code
                      </div>
                    </div>
                  </div>

                  <div className="group bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 p-8 rounded-2xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="text-emerald-600 font-semibold mb-3">
                      Recent Activity
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      Received $125.00
                    </div>
                    <div className="text-slate-500 text-sm font-medium">
                      2 minutes ago
                    </div>
                    <div className="mt-3 flex items-center text-xs text-slate-400">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
                      Transaction confirmed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 bg-gradient-to-br from-white/80 via-slate-50/40 to-blue-50/30 backdrop-blur-sm relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-block bg-gradient-to-r from-blue-50 to-purple-50 text-slate-700 px-6 py-3 rounded-full text-sm font-semibold mb-8 border border-blue-200/50">
              ✨ Built for Everyone
            </div>
            <h2 className="text-5xl lg:text-7xl font-black mb-8 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-tight">
              Features that
              <br />
              Make a Difference
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
              Pokket bridges the gap between traditional finance and Web3,
              making crypto accessible to everyone with enterprise-grade
              security.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative p-10 rounded-3xl border-2 transition-all duration-700 hover:-translate-y-4 cursor-pointer overflow-hidden ${
                  currentFeature === index
                    ? `bg-gradient-to-br ${feature.bgColor} border-transparent shadow-2xl scale-105`
                    : "bg-white/80 backdrop-blur-sm border-slate-200/50 hover:border-slate-300 hover:shadow-xl"
                }`}
              >
                <div className="relative z-10">
                  <div
                    className={`inline-flex p-5 rounded-3xl mb-8 transition-all duration-500 ${
                      currentFeature === index
                        ? `bg-gradient-to-r ${feature.color} text-white shadow-lg`
                        : "bg-slate-50 text-slate-600 group-hover:bg-gradient-to-r group-hover:text-white group-hover:shadow-lg"
                    } ${feature.color.replace("to-", "group-hover:to-")}`}
                  >
                    {feature.icon}
                  </div>

                  <div
                    className={`text-sm font-bold mb-2 tracking-wider uppercase ${
                      currentFeature === index
                        ? "text-slate-600"
                        : "text-slate-500"
                    }`}
                  >
                    {feature.subtitle}
                  </div>

                  <h3 className="text-3xl font-bold mb-6 text-slate-900 leading-tight">
                    {feature.title}
                  </h3>

                  <p className="text-slate-600 leading-relaxed text-lg">
                    {feature.description}
                  </p>
                </div>

                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Redesigned */}
      <section
        id="how-it-works"
        className="py-32 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden"
      >
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-orange-400/10 to-pink-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-400/5 to-teal-400/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-24">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-50 to-pink-50 text-slate-700 px-8 py-4 rounded-full text-sm font-bold mb-10 border border-purple-200/50 shadow-lg backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span>5-Step Journey to Web3</span>
              <ArrowRight className="w-4 h-4 text-purple-500" />
            </div>
            <h2 className="text-6xl lg:text-8xl font-black mb-10 leading-none">
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                How{" "}
              </span>
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                Pokket{" "}
              </span>
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-light">
              From Google sign-in to PayPal cash-out in minutes. Experience the
              seamless journey from Web2 to Web3.
            </p>
          </div>

          {/* Interactive Step Flow */}
          <div className="relative">
            {/* Connection Lines */}
            <div className="hidden lg:block absolute inset-0 z-0">
              <svg className="w-full h-full" viewBox="0 0 1200 600" fill="none">
                <defs>
                  <linearGradient
                    id="flowGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="25%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="75%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>
                <path
                  d="M100 150 Q350 50 600 150 Q850 250 1100 150"
                  stroke="url(#flowGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="10,5"
                  className="animate-pulse"
                />
              </svg>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-4 relative z-10">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="group relative"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  {/* Step Card */}
                  <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-700 hover:-translate-y-4 hover:scale-105">
                    {/* Step Number */}
                    <div
                      className={`absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center shadow-lg`}
                    >
                      <span className="text-white font-black text-lg">
                        {step.step}
                      </span>
                    </div>

                    {/* Icon */}
                    <div
                      className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${step.color} text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}
                    >
                      {step.icon}
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-orange-600 transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed mb-6 text-base">
                      {step.description}
                    </p>

                    {/* Details */}
                    <div className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <div
                          key={detailIndex}
                          className="flex items-center space-x-2"
                        >
                          <div
                            className={`w-2 h-2 rounded-full bg-gradient-to-r ${step.color}`}
                          />
                          <span className="text-slate-500 text-sm font-medium">
                            {detail}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Hover Background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${step.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl -z-10`}
                    />
                  </div>

                  {/* Connection Arrow (Desktop) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-20">
                      <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-orange-400">
                        <ArrowRight className="w-4 h-4 text-orange-500" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-20">
              <div className="inline-flex items-center space-x-4 bg-white/80 backdrop-blur-xl rounded-2xl px-8 py-4 shadow-xl border border-white/50">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold text-slate-700">
                    Average completion time:
                  </span>
                </div>
                <div className="text-3xl font-black bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  &lt; 5 minutes
                </div>
                <Sparkles className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section - Minimalistic */}
      <section
        id="security"
        className="py-20 bg-gradient-to-br from-slate-50/50 to-white/80 backdrop-blur-sm relative"
      >
        <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-block bg-gradient-to-r from-emerald-50 to-teal-50 text-slate-700 px-6 py-3 rounded-full text-sm font-semibold mb-8 border border-emerald-200/50">
            🛡️ Enterprise Security
          </div>

          <h2 className="text-4xl lg:text-5xl font-black mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-tight">
            Bank-Grade Protection
          </h2>

          <p className="text-lg text-slate-600 mb-12 leading-relaxed font-light max-w-2xl mx-auto">
            Military-grade encryption with MPC technology ensures your assets
            remain secure across distributed infrastructure.
          </p>

          {/* Security Features - Compact Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <Shield className="w-6 h-6" />,
                title: "MPC Security",
                color: "from-blue-500 to-blue-600",
              },
              {
                icon: <Lock className="w-6 h-6" />,
                title: "AES-256 Encryption",
                color: "from-purple-500 to-purple-600",
              },
              {
                icon: <CheckCircle className="w-6 h-6" />,
                title: "KYC Verified",
                color: "from-emerald-500 to-emerald-600",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 hover:bg-white/80 transition-all duration-300"
              >
                <div
                  className={`inline-flex p-3 bg-gradient-to-r ${item.color} text-white rounded-xl shadow-lg mb-4 group-hover:scale-105 transition-transform`}
                >
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>

          {/* Compact Security Status */}
          <div className="max-w-lg mx-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-slate-300">
                Security Status
              </span>
              <span className="text-emerald-400 font-bold text-sm px-3 py-1 bg-emerald-400/20 rounded-lg">
                All Systems Protected
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mx-auto mb-1 animate-pulse" />
                <span className="text-xs text-slate-400">Wallet</span>
              </div>
              <div className="text-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mx-auto mb-1 animate-pulse delay-150" />
                <span className="text-xs text-slate-400">Transactions</span>
              </div>
              <div className="text-center">
                <div className="w-2 h-2 bg-orange-400 rounded-full mx-auto mb-1 animate-pulse delay-300" />
                <span className="text-xs text-slate-400">Identity</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-transparent" />
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div
            className="w-full h-full bg-white bg-opacity-5"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 25%, white 2px, transparent 2px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto text-center px-6 lg:px-8 relative z-10">
          <div className="inline-block bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-semibold mb-8 border border-white/30">
            ⚡ Ready to Start?
          </div>

          <h2 className="text-5xl lg:text-7xl font-black text-white mb-8 leading-tight">
            Ready to Simplify
            <br />
            Your Crypto Journey?
          </h2>

          <p className="text-xl text-orange-100 mb-12 leading-relaxed font-light max-w-3xl mx-auto">
            Join thousands of users who've made the switch to effortless Web3.
            Experience the future of digital finance today.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={handleGoogleSignIn}
              className="group bg-white text-orange-600 px-10 py-5 rounded-2xl hover:bg-slate-50 transition-all duration-500 font-bold text-xl shadow-2xl hover:shadow-white/25 transform hover:-translate-y-2 hover:scale-105 flex items-center space-x-3 overflow-hidden relative"
            >
              <GoogleIcon className="w-6 h-6 relative z-10" />
              <span className="relative z-10">Get Started Now</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
            
            {/* Identity Verification Button - Alternative authentication method */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-2">
              <IdentityVerificationButton 
                size="lg"
                variant="secondary"
                className="bg-white/90 backdrop-blur-sm text-orange-600 hover:bg-white border-2 border-white/30 hover:border-white/50"
              />
            </div>

            <div className="text-white/80 text-lg font-medium">
              Free to start • No credit card required
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-white/90">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">2 mins</div>
              <div className="text-orange-100">Setup time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">0%</div>
              <div className="text-orange-100">Hidden fees</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-orange-100">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-4 mb-8">
                <img
                  src="/logo1.svg"
                  alt="Pokket"
                  width="56"
                  height="56"
                  className="transition-all duration-300 hover:scale-105"
                />
                <div className="flex flex-col">
                  <span className="text-3xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    Pokket
                  </span>
                  <span className="text-sm text-slate-400 font-medium -mt-1">
                    Powered by SELF • 1inch • PYUSD
                  </span>
                </div>
              </div>
              <p className="text-slate-400 mb-8 max-w-md leading-relaxed text-lg font-light">
                Making Web3 accessible to everyone through SELF KYC
                verification, 1inch DEX integration, PYUSD stability, and
                seamless PayPal connectivity.
              </p>

              <div className="flex space-x-4">
                {["Twitter", "Discord", "Telegram", "GitHub"].map(
                  (social, index) => (
                    <div
                      key={index}
                      className="w-12 h-12 bg-slate-800 hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer group"
                    >
                      <div className="w-6 h-6 bg-slate-400 group-hover:bg-white rounded transition-colors" />
                    </div>
                  )
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-8 text-white">Product</h3>
              <div className="space-y-4">
                {[
                  "Features",
                  "Security",
                  "API Documentation",
                  "Pricing",
                  "Roadmap",
                ].map((item, index) => (
                  <div
                    key={index}
                    className="text-slate-400 hover:text-orange-400 transition-colors cursor-pointer text-lg"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-8 text-white">Company</h3>
              <div className="space-y-4">
                {["About Us", "Blog", "Careers", "Press Kit", "Contact"].map(
                  (item, index) => (
                    <div
                      key={index}
                      className="text-slate-400 hover:text-orange-400 transition-colors cursor-pointer text-lg"
                    >
                      {item}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-16 pt-12 flex flex-col md:flex-row justify-between items-center">
            <div className="text-slate-400 text-lg mb-4 md:mb-0">
              © 2024 Pokket. All rights reserved.
            </div>
            <div className="flex space-x-8 text-slate-400">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                (item, index) => (
                  <div
                    key={index}
                    className="hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    {item}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }

        .delay-200 {
          animation-delay: 200ms;
        }

        .delay-300 {
          animation-delay: 300ms;
        }

        .delay-500 {
          animation-delay: 500ms;
        }

        .delay-700 {
          animation-delay: 700ms;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }

        /* Enhanced hover effects */
        .hover-glow:hover {
          box-shadow: 0 0 30px rgba(251, 146, 60, 0.4);
        }

        /* Floating animation */
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .float {
          animation: float 6s ease-in-out infinite;
        }

        /* Pulse glow animation */
        @keyframes pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(251, 146, 60, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(251, 146, 60, 0.6);
          }
        }

        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        /* Gradient shimmer effect */
        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: 200px 0;
          }
        }

        .shimmer {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          background-size: 200px 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
