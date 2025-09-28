"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Wallet,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

interface UserBalance {
  pyusd: number; // USD value
  eth: number; // USD value
  ethAmount: number; // Actual ETH amount
  usdc: number; // USD value
  total: number; // Total USD value
}

interface WithdrawModalProps {
  type: "wallet" | "offramp";
  userBalance: UserBalance;
  onClose: () => void;
}

interface DetectedWallet {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  isInstalled: boolean;
  address?: string;
}

type Step =
  | "select"
  | "amount"
  | "confirm"
  | "processing"
  | "success"
  | "error";

export default function WithdrawModal({
  type,
  userBalance,
  onClose,
}: WithdrawModalProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedToken, setSelectedToken] = useState<"pyusd" | "eth">("pyusd");
  const [selectedWallet, setSelectedWallet] = useState<DetectedWallet | null>(
    null
  );
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [availableWallets, setAvailableWallets] = useState<DetectedWallet[]>(
    []
  );

  // Detect wallets on component mount
  useEffect(() => {
    const detectWallets = async () => {
      const wallets: DetectedWallet[] = [];

      // Debug logging
      console.log("Wallet detection starting...");
      console.log("window.ethereum:", (window as any).ethereum);
      console.log("window.solana:", (window as any).solana);

      if (typeof window !== "undefined" && window.ethereum) {
        const ethereum = (window as any).ethereum;
        console.log("Ethereum detected:", ethereum);
        console.log("isMetaMask:", ethereum.isMetaMask);
        console.log("isCoinbaseWallet:", ethereum.isCoinbaseWallet);
        console.log("providers:", ethereum.providers);

        // Check for MetaMask
        if (ethereum.isMetaMask) {
          try {
            const accounts = await ethereum.request({ method: "eth_accounts" });
            console.log("MetaMask accounts:", accounts);
            wallets.push({
              id: "metamask",
              name: "MetaMask",
              icon: "🦊",
              available: true,
              isInstalled: true,
              address: accounts[0] || undefined,
            });
          } catch (error) {
            console.log("MetaMask detection error:", error);
            wallets.push({
              id: "metamask",
              name: "MetaMask",
              icon: "🦊",
              available: true,
              isInstalled: true,
            });
          }
        }

        // Check for Coinbase Wallet (it also sets window.ethereum but with different properties)
        if (
          ethereum.isCoinbaseWallet ||
          ethereum.providers?.find((p: any) => p.isCoinbaseWallet)
        ) {
          try {
            const coinbaseProvider = ethereum.isCoinbaseWallet
              ? ethereum
              : ethereum.providers.find((p: any) => p.isCoinbaseWallet);

            const accounts = await coinbaseProvider.request({
              method: "eth_accounts",
            });
            console.log("Coinbase Wallet accounts:", accounts);
            wallets.push({
              id: "coinbase",
              name: "Coinbase Wallet",
              icon: "🔷",
              available: true,
              isInstalled: true,
              address: accounts[0] || undefined,
            });
          } catch (error) {
            console.log("Coinbase Wallet detection error:", error);
            wallets.push({
              id: "coinbase",
              name: "Coinbase Wallet",
              icon: "🔷",
              available: true,
              isInstalled: true,
            });
          }
        }

        // If we have ethereum but it's neither MetaMask nor Coinbase, check for other providers
        if (
          !ethereum.isMetaMask &&
          !ethereum.isCoinbaseWallet &&
          ethereum.providers
        ) {
          console.log("Checking providers array for wallets...");

          // Check if MetaMask exists in providers array
          const metamaskProvider = ethereum.providers.find(
            (p: any) => p.isMetaMask
          );
          if (metamaskProvider && !wallets.find((w) => w.id === "metamask")) {
            try {
              const accounts = await metamaskProvider.request({
                method: "eth_accounts",
              });
              console.log("MetaMask in providers accounts:", accounts);
              wallets.push({
                id: "metamask",
                name: "MetaMask",
                icon: "🦊",
                available: true,
                isInstalled: true,
                address: accounts[0] || undefined,
              });
            } catch (error) {
              console.log("MetaMask in providers error:", error);
              wallets.push({
                id: "metamask",
                name: "MetaMask",
                icon: "🦊",
                available: true,
                isInstalled: true,
              });
            }
          }

          // Check if Coinbase exists in providers array
          const coinbaseProvider = ethereum.providers.find(
            (p: any) => p.isCoinbaseWallet
          );
          if (coinbaseProvider && !wallets.find((w) => w.id === "coinbase")) {
            try {
              const accounts = await coinbaseProvider.request({
                method: "eth_accounts",
              });
              console.log("Coinbase in providers accounts:", accounts);
              wallets.push({
                id: "coinbase",
                name: "Coinbase Wallet",
                icon: "🔷",
                available: true,
                isInstalled: true,
                address: accounts[0] || undefined,
              });
            } catch (error) {
              console.log("Coinbase in providers error:", error);
              wallets.push({
                id: "coinbase",
                name: "Coinbase Wallet",
                icon: "🔷",
                available: true,
                isInstalled: true,
              });
            }
          }
        }
      }

      // Check for Phantom (Solana) - separate from Ethereum providers
      if (typeof window !== "undefined" && (window as any).solana?.isPhantom) {
        try {
          const phantom = (window as any).solana;
          console.log("Phantom detected:", phantom);
          wallets.push({
            id: "phantom",
            name: "Phantom",
            icon: "👻",
            available: selectedToken === "pyusd",
            isInstalled: true,
            address: phantom.publicKey?.toString() || undefined,
          });
        } catch (error) {
          console.log("Phantom detection error:", error);
          wallets.push({
            id: "phantom",
            name: "Phantom",
            icon: "👻",
            available: selectedToken === "pyusd",
            isInstalled: true,
          });
        }
      }

      // Add WalletConnect as always available
      wallets.push({
        id: "walletconnect",
        name: "WalletConnect",
        icon: "🔗",
        available: true,
        isInstalled: true,
      });

      // Add common wallets that might not be installed
      const commonWallets = [
        { id: "metamask", name: "MetaMask", icon: "🦊" },
        { id: "coinbase", name: "Coinbase Wallet", icon: "🔷" },
        { id: "phantom", name: "Phantom", icon: "👻" },
      ];

      commonWallets.forEach((wallet) => {
        if (!wallets.find((w) => w.id === wallet.id)) {
          wallets.push({
            ...wallet,
            available:
              wallet.id === "phantom" ? selectedToken === "pyusd" : true,
            isInstalled: false,
          });
        }
      });

      console.log("Final detected wallets:", wallets);
      setAvailableWallets(wallets);
    };

    detectWallets();
  }, [selectedToken]);

  const connectWallet = async (wallet: DetectedWallet) => {
    if (!wallet.isInstalled) {
      const urls: { [key: string]: string } = {
        metamask: "https://metamask.io/download/",
        coinbase: "https://wallet.coinbase.com/",
        phantom: "https://phantom.app/",
      };
      window.open(urls[wallet.id], "_blank");
      return;
    }

    try {
      setLoading(true);
      setError("");
      let connectedWallet = { ...wallet };

      if (wallet.id === "metamask") {
        const ethereum = (window as any).ethereum;
        if (ethereum.isMetaMask) {
          const accounts = await ethereum.request({
            method: "eth_requestAccounts",
          });
          connectedWallet.address = accounts[0];
          setSelectedWallet(connectedWallet);
          setStep("amount");
        } else if (ethereum.providers) {
          // Find MetaMask in providers array
          const metamaskProvider = ethereum.providers.find(
            (p: any) => p.isMetaMask
          );
          if (metamaskProvider) {
            const accounts = await metamaskProvider.request({
              method: "eth_requestAccounts",
            });
            connectedWallet.address = accounts[0];
            setSelectedWallet(connectedWallet);
            setStep("amount");
          }
        }
      } else if (wallet.id === "coinbase") {
        const ethereum = (window as any).ethereum;
        if (ethereum.isCoinbaseWallet) {
          const accounts = await ethereum.request({
            method: "eth_requestAccounts",
          });
          connectedWallet.address = accounts[0];
          setSelectedWallet(connectedWallet);
          setStep("amount");
        } else if (ethereum.providers) {
          // Find Coinbase Wallet in providers array
          const coinbaseProvider = ethereum.providers.find(
            (p: any) => p.isCoinbaseWallet
          );
          if (coinbaseProvider) {
            const accounts = await coinbaseProvider.request({
              method: "eth_requestAccounts",
            });
            connectedWallet.address = accounts[0];
            setSelectedWallet(connectedWallet);
            setStep("amount");
          }
        }
      } else if (wallet.id === "phantom") {
        const solana = (window as any).solana;
        if (solana?.isPhantom) {
          const response = await solana.connect();
          if (response.publicKey) {
            connectedWallet.address = response.publicKey.toString();
            setSelectedWallet(connectedWallet);
            setStep("amount");
          }
        }
      } else if (wallet.id === "walletconnect") {
        setError("WalletConnect coming soon");
      }
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      if (err.code === 4001) {
        setError("Connection rejected by user");
      } else if (err.code === -32002) {
        setError("Connection request already pending");
      } else {
        setError(err.message || "Failed to connect wallet");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (
      !selectedWallet ||
      !amount ||
      parseFloat(amount) <= 0 ||
      !selectedWallet.address
    )
      return;

    const tokenBalance =
      selectedToken === "pyusd" ? userBalance.pyusd : userBalance.eth;
    if (parseFloat(amount) > tokenBalance) {
      setError("Insufficient balance");
      return;
    }

    try {
      setStep("processing");
      setError("");

      // Real transaction logic
      if (
        selectedWallet.id === "metamask" ||
        selectedWallet.id === "coinbase"
      ) {
        const ethereum = (window as any).ethereum;
        const provider =
          selectedWallet.id === "metamask" && ethereum.isMetaMask
            ? ethereum
            : selectedWallet.id === "coinbase" && ethereum.isCoinbaseWallet
              ? ethereum
              : ethereum.providers?.find((p: any) =>
                  selectedWallet.id === "metamask"
                    ? p.isMetaMask
                    : p.isCoinbaseWallet
                );

        if (provider) {
          try {
            let txHash;

            // Check network first
            try {
              const chainId = await provider.request({
                method: "eth_chainId",
              });
              console.log("Connected to chain:", chainId);

              // Base mainnet is 0x2105 (8453), Base testnet is 0x14a33 (84531)
              // Ethereum mainnet is 0x1 (1)
              if (
                chainId !== "0x1" &&
                chainId !== "0x2105" &&
                chainId !== "0x14a33"
              ) {
                console.warn("Unsupported network:", chainId);
                // Continue anyway but log the warning
              }
            } catch (networkError) {
              console.warn("Could not determine network:", networkError);
              // Continue anyway
            }

            if (selectedToken === "eth") {
              // Send ETH to connected wallet
              const ethToSend = parseFloat(amount) / 2500; // Convert USD to ETH

              // Check if the amount is too small
              if (ethToSend < 0.000001) {
                throw new Error(
                  "Amount too small. Minimum withdrawal is $0.01 worth of ETH."
                );
              }

              const weiAmount = Math.floor(ethToSend * 1e18).toString(16); // Convert to wei in hex

              // First get the current account
              const accounts = await provider.request({
                method: "eth_accounts",
              });

              if (!accounts || accounts.length === 0) {
                throw new Error("No wallet account found");
              }

              const txParams = {
                from: accounts[0],
                to: selectedWallet.address,
                value: "0x" + weiAmount,
                // Let wallet estimate gas - Base network will handle fee estimation
              };

              console.log("Transaction params:", txParams);
              console.log(
                "ETH amount:",
                ethToSend,
                "Wei amount:",
                "0x" + weiAmount
              );

              txHash = await provider.request({
                method: "eth_sendTransaction",
                params: [txParams],
              });
            } else if (selectedToken === "pyusd") {
              // For PYUSD, we need to interact with the PYUSD contract
              // First get the current account
              const accounts = await provider.request({
                method: "eth_accounts",
              });

              if (!accounts || accounts.length === 0) {
                throw new Error("No wallet account found");
              }

              // PYUSD contract address on mainnet: 0x6c3ea9036406852006290770BEdFcAbA0e23A0e8
              const pyusdContract =
                "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";

              // Convert to proper PYUSD amount (6 decimals)
              const pyusdAmount = parseFloat(amount);
              if (pyusdAmount < 0.01) {
                throw new Error(
                  "Amount too small. Minimum withdrawal is $0.01 PYUSD."
                );
              }

              const amountInWei = Math.floor(pyusdAmount * 1e6).toString(16); // PYUSD has 6 decimals

              // ERC20 transfer function signature: transfer(address,uint256)
              const transferMethodId = "0xa9059cbb";
              const paddedAddress = selectedWallet.address
                .slice(2)
                .padStart(64, "0");
              const paddedAmount = amountInWei.padStart(64, "0");

              const data = transferMethodId + paddedAddress + paddedAmount;

              const txParams = {
                from: accounts[0],
                to: pyusdContract,
                data: data,
                // Let wallet estimate gas for ERC-20 transaction
              };

              txHash = await provider.request({
                method: "eth_sendTransaction",
                params: [txParams],
              });
            }

            if (txHash) {
              setTxHash(txHash);
              setStep("success");
            } else {
              throw new Error("Transaction failed");
            }
          } catch (txError: any) {
            console.error("Transaction error:", txError);

            let errorMessage = "Transaction failed";

            // Handle specific error cases
            if (
              txError.message.includes("network fee") ||
              txError.message.includes("gas")
            ) {
              errorMessage =
                "Unable to estimate network fee. Please ensure you have enough funds for gas and try again.";
            } else if (txError.message.includes("insufficient funds")) {
              errorMessage =
                "Insufficient funds in your wallet. Please check your balance.";
            } else if (txError.message.includes("user rejected")) {
              errorMessage = "Transaction was cancelled by user.";
            } else if (txError.message.includes("network")) {
              errorMessage =
                "Network error. Please check your connection and try again.";
            } else if (txError.code === 4001) {
              errorMessage = "Transaction was rejected by user.";
            } else if (txError.code === -32603) {
              errorMessage =
                "Internal error. Please try with a smaller amount or check your wallet network.";
            } else if (txError.message) {
              errorMessage = txError.message;
            }

            setError(errorMessage);
            setStep("error");
          }
        }
      } else if (selectedWallet.id === "phantom") {
        // Solana/Phantom transaction logic
        try {
          const solana = (window as any).solana;
          if (solana && solana.isPhantom) {
            // For now, show error as we need Solana Web3.js for real transactions
            setError(
              "Solana transactions coming soon. Please use ETH for now."
            );
            setStep("error");
          }
        } catch (solanaError: any) {
          setError(solanaError.message || "Phantom transaction failed");
          setStep("error");
        }
      }
    } catch (err: any) {
      console.error("Transaction error:", err);
      setError(err.message || "Transaction failed");
      setStep("error");
    }
  };

  const getMaxAmount = () => {
    // Return USD values for user input
    return selectedToken === "pyusd" ? userBalance.pyusd : userBalance.eth;
  };

  const getActualTokenAmount = () => {
    // Return actual token amounts for display
    if (selectedToken === "pyusd") {
      return userBalance.pyusd; // PYUSD is 1:1 with USD
    } else {
      return userBalance.ethAmount; // Actual ETH amount
    }
  };

  const formatBalance = (value: number, isActualAmount: boolean = false) => {
    if (selectedToken === "eth" && isActualAmount) {
      return value.toFixed(6); // Show more decimals for actual ETH amount
    }
    return value.toFixed(selectedToken === "eth" ? 2 : 2); // USD amounts with 2 decimals
  };

  const formatAddress = (address: string, short: boolean = true) => {
    if (!address) return "";
    return short
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  if (type === "offramp") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Coming Soon
            </h3>
            <p className="text-gray-600">
              PYUSD offramp functionality will be available soon. Stay tuned for
              updates!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {step !== "select" && (
              <button
                onClick={() => {
                  if (step === "amount") setStep("select");
                  else if (step === "confirm") setStep("amount");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {step === "select"
                ? "Select Wallet"
                : step === "amount"
                  ? "Enter Amount"
                  : step === "confirm"
                    ? "Confirm Withdrawal"
                    : step === "processing"
                      ? "Processing..."
                      : step === "success"
                        ? "Success!"
                        : "Error"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Select Wallet */}
          {step === "select" && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Choose a wallet to connect and withdraw your funds
              </div>

              {availableWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => connectWallet(wallet)}
                  disabled={loading}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{wallet.icon}</span>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">
                          {wallet.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {!wallet.isInstalled
                            ? "Not installed"
                            : !wallet.available
                              ? "Not compatible"
                              : wallet.address
                                ? `Connected: ${formatAddress(wallet.address)}`
                                : "Available"}
                        </div>
                      </div>
                    </div>
                    {!wallet.isInstalled && (
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                    )}
                  </div>
                </button>
              ))}

              {loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                  <span className="ml-2 text-gray-600">Connecting...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">{error}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Enter Amount */}
          {step === "amount" && (
            <div className="space-y-6">
              {/* Token Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Select Token
                </label>
                <div className="flex gap-2">
                  {(["pyusd", "eth"] as const).map((token) => {
                    const balanceUSD =
                      token === "pyusd" ? userBalance.pyusd : userBalance.eth;
                    const actualAmount =
                      token === "pyusd"
                        ? userBalance.pyusd
                        : userBalance.ethAmount;
                    const symbol = token === "pyusd" ? "PYUSD" : "ETH";

                    const isPyusd = token === "pyusd";
                    const isSelected = selectedToken === token;

                    return (
                      <button
                        key={token}
                        onClick={() => setSelectedToken(token)}
                        disabled={balanceUSD === 0}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all disabled:opacity-50 relative ${
                          isSelected
                            ? isPyusd
                              ? "border-orange-500 bg-gradient-to-r from-orange-50 to-yellow-50"
                              : "border-orange-500 bg-orange-50"
                            : isPyusd
                              ? "border-orange-200 bg-gradient-to-r from-orange-25 to-yellow-25 hover:border-orange-300"
                              : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {isPyusd && (
                          <div className="absolute -top-1 -right-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-medium rounded-full">
                              Stable
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col items-center gap-2">
                          <div
                            className={`text-sm font-semibold ${isPyusd ? "text-orange-800" : "text-gray-800"}`}
                          >
                            {symbol}
                          </div>
                          <div className="text-xs text-gray-600 text-center">
                            {token === "pyusd"
                              ? `${formatBalance(actualAmount)} available`
                              : `${formatBalance(actualAmount, true)} ${symbol} ($${formatBalance(balanceUSD)})`}
                          </div>
                          {isPyusd && (
                            <div className="text-xs text-orange-600 font-medium">
                              Default Currency
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">
                    Amount (USD)
                  </label>
                  <button
                    onClick={() => setAmount(getMaxAmount().toString())}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Max: ${formatBalance(getMaxAmount())}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-4 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none text-lg"
                    step="0.01"
                    max={getMaxAmount()}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    USD
                  </div>
                </div>
              </div>

              {/* Connected Wallet Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{selectedWallet?.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      Connected to {selectedWallet?.name}
                    </div>
                    {selectedWallet?.address ? (
                      <div className="text-sm text-gray-500 font-mono">
                        {formatAddress(selectedWallet.address, false)}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Funds will be sent to your wallet
                      </div>
                    )}
                  </div>
                  {selectedWallet?.address && (
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          selectedWallet.address || ""
                        )
                      }
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy address"
                    >
                      📋
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => setStep("confirm")}
                disabled={
                  !amount ||
                  parseFloat(amount) <= 0 ||
                  parseFloat(amount) > getMaxAmount()
                }
                className="w-full bg-orange-600 text-white py-4 rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">USD Amount</span>
                  <span className="font-medium">${amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">You'll Send</span>
                  <span className="font-medium">
                    {selectedToken === "pyusd"
                      ? `${amount} PYUSD`
                      : `${(parseFloat(amount) / 2500).toFixed(6)} ETH`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To Wallet</span>
                  <span className="font-medium">{selectedWallet?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Network Fee</span>
                  <span className="font-medium text-gray-500">
                    Estimated by wallet
                  </span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Amount to Withdraw</span>
                  <span>${parseFloat(amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <strong>Important:</strong> Your wallet will estimate the
                    network fee before confirming. This transaction cannot be
                    reversed.
                  </div>
                </div>
              </div>

              <button
                onClick={handleWithdraw}
                className="w-full bg-orange-600 text-white py-4 rounded-xl font-medium hover:bg-orange-700 transition-colors"
              >
                Confirm Withdrawal
              </button>
            </div>
          )}

          {/* Step 4: Processing */}
          {step === "processing" && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 animate-spin text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Processing Transaction
              </h3>
              <p className="text-gray-600">
                Please wait while your transaction is being processed...
              </p>
            </div>
          )}

          {/* Step 5: Success */}
          {step === "success" && (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Withdrawal Successful!
              </h3>
              <p className="text-gray-600 mb-6">
                ${amount} worth of {selectedToken.toUpperCase()}
                {selectedToken === "eth"
                  ? ` (${(parseFloat(amount) / 2500).toFixed(6)} ETH)`
                  : ` (${amount} PYUSD)`}{" "}
                has been sent to your {selectedWallet?.name} wallet.
              </p>
              {txHash && (
                <button
                  onClick={() =>
                    window.open(`https://etherscan.io/tx/${txHash}`, "_blank")
                  }
                  className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
                >
                  View on Explorer <ExternalLink size={16} />
                </button>
              )}
              <div className="mt-6">
                <button
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Error */}
          {step === "error" && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Transaction Failed
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={() => setStep("confirm")}
                  className="w-full bg-orange-600 text-white py-3 rounded-xl font-medium hover:bg-orange-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
