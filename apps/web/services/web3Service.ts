import { ethers } from "ethers";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// Types
export interface WalletProvider {
  isMetaMask?: boolean;
  isPhantom?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
  isTrust?: boolean;
  request?: (args: { method: string; params?: any[] }) => Promise<any>;
  publicKey?: PublicKey;
  isConnected?: boolean;
  connect?: () => Promise<{ publicKey: PublicKey }>;
  disconnect?: () => Promise<void>;
  signAndSendTransaction?: (
    transaction: Transaction
  ) => Promise<{ signature: string }>;
}

export interface DetectedWallet {
  id: string;
  name: string;
  icon: string;
  isInstalled: boolean;
  network: "ethereum" | "solana" | "both";
  color: string;
  provider?: WalletProvider;
}

export interface WithdrawParams {
  amount: string;
  tokenAddress?: string;
  recipientAddress: string;
  network: "ethereum" | "solana";
  gasPrice?: string;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: string;
  gasPrice?: string;
}

class Web3Service {
  private ethereumProvider: ethers.BrowserProvider | null = null;
  private solanaConnection: Connection | null = null;
  private solanaProvider: WalletProvider | null = null;

  constructor() {
    // Initialize Solana connection to mainnet
    this.solanaConnection = new Connection(
      "https://api.mainnet-beta.solana.com"
    );
  }

  // Detect available wallets in the browser
  async detectWallets(): Promise<DetectedWallet[]> {
    const wallets: DetectedWallet[] = [];

    if (typeof window === "undefined") return wallets;

    try {
      // MetaMask
      const ethereum = (window as any).ethereum;
      const hasMetaMask = ethereum?.isMetaMask;
      wallets.push({
        id: "metamask",
        name: "MetaMask",
        icon: "🦊",
        isInstalled: !!hasMetaMask,
        network: "ethereum",
        color: "from-orange-500 to-orange-600",
        provider: hasMetaMask ? ethereum : undefined,
      });

      // Coinbase Wallet
      const hasCoinbase =
        ethereum?.isCoinbaseWallet || (window as any).coinbaseWalletExtension;
      wallets.push({
        id: "coinbase",
        name: "Coinbase Wallet",
        icon: "🔷",
        isInstalled: !!hasCoinbase,
        network: "ethereum",
        color: "from-blue-500 to-blue-600",
        provider: hasCoinbase ? ethereum : undefined,
      });

      // Rabby
      const hasRabby = ethereum?.isRabby;
      wallets.push({
        id: "rabby",
        name: "Rabby",
        icon: "🐰",
        isInstalled: !!hasRabby,
        network: "ethereum",
        color: "from-indigo-500 to-indigo-600",
        provider: hasRabby ? ethereum : undefined,
      });

      // Trust Wallet
      const hasTrust = ethereum?.isTrust;
      wallets.push({
        id: "trust",
        name: "Trust Wallet",
        icon: "🛡️",
        isInstalled: !!hasTrust,
        network: "both",
        color: "from-blue-600 to-blue-700",
        provider: hasTrust ? ethereum : undefined,
      });

      // Phantom (Solana)
      const solana = (window as any).solana;
      const hasPhantom = solana?.isPhantom;
      wallets.push({
        id: "phantom",
        name: "Phantom",
        icon: "👻",
        isInstalled: !!hasPhantom,
        network: "solana",
        color: "from-purple-500 to-purple-600",
        provider: hasPhantom ? solana : undefined,
      });

      // OKX Wallet
      const hasOKX = (window as any).okxwallet;
      wallets.push({
        id: "okx",
        name: "OKX Wallet",
        icon: "⚡",
        isInstalled: !!hasOKX,
        network: "both",
        color: "from-gray-700 to-gray-800",
        provider: hasOKX ? hasOKX : undefined,
      });

      // WalletConnect (always available)
      wallets.push({
        id: "walletconnect",
        name: "WalletConnect",
        icon: "🔗",
        isInstalled: true,
        network: "both",
        color: "from-blue-400 to-blue-500",
      });
    } catch (error) {
      console.error("Error detecting wallets:", error);
    }

    // Sort wallets: installed first, then by name
    return wallets.sort((a, b) => {
      if (a.isInstalled && !b.isInstalled) return -1;
      if (!a.isInstalled && b.isInstalled) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  // Connect to Ethereum wallet
  async connectEthereumWallet(
    walletId: string
  ): Promise<{ address: string; chainId: number }> {
    if (typeof window === "undefined") {
      throw new Error("Window is not available");
    }

    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      throw new Error("No Ethereum provider found");
    }

    try {
      // Request account access
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Get chain ID
      const chainId = await ethereum.request({
        method: "eth_chainId",
      });

      this.ethereumProvider = new ethers.BrowserProvider(ethereum);

      return {
        address: accounts[0],
        chainId: parseInt(chainId, 16),
      };
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("User rejected the connection");
      }
      throw new Error(`Failed to connect: ${error.message}`);
    }
  }

  // Connect to Solana wallet
  async connectSolanaWallet(walletId: string): Promise<{ address: string }> {
    if (typeof window === "undefined") {
      throw new Error("Window is not available");
    }

    const solana = (window as any).solana;
    if (!solana?.isPhantom) {
      throw new Error("Phantom wallet not found");
    }

    try {
      const response = await solana.connect();
      this.solanaProvider = solana;

      return {
        address: response.publicKey.toString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to connect to Solana wallet: ${error.message}`);
    }
  }

  // Get Ethereum balance
  async getEthereumBalance(
    address: string,
    tokenAddress?: string
  ): Promise<string> {
    if (!this.ethereumProvider) {
      throw new Error("Ethereum provider not initialized");
    }

    try {
      if (!tokenAddress) {
        // Get ETH balance
        const balance = await this.ethereumProvider.getBalance(address);
        return ethers.formatEther(balance);
      } else {
        // Get ERC-20 token balance
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ["function balanceOf(address) view returns (uint256)"],
          this.ethereumProvider
        );
        const balance = await tokenContract.balanceOf!(address);
        return ethers.formatUnits(balance, 18); // Assuming 18 decimals
      }
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  // Get Solana balance
  async getSolanaBalance(address: string): Promise<string> {
    if (!this.solanaConnection) {
      throw new Error("Solana connection not initialized");
    }

    try {
      const publicKey = new PublicKey(address);
      const balance = await this.solanaConnection.getBalance(publicKey);
      return (balance / LAMPORTS_PER_SOL).toString();
    } catch (error: any) {
      throw new Error(`Failed to get Solana balance: ${error.message}`);
    }
  }

  // Estimate gas for Ethereum transaction
  async estimateEthereumGas(
    params: WithdrawParams
  ): Promise<{ gasLimit: string; gasPrice: string; totalCost: string }> {
    if (!this.ethereumProvider) {
      throw new Error("Ethereum provider not initialized");
    }

    try {
      const signer = await this.ethereumProvider.getSigner();
      const gasPrice = await this.ethereumProvider.getFeeData();

      let gasEstimate: bigint;

      if (!params.tokenAddress) {
        // ETH transfer
        gasEstimate = await this.ethereumProvider.estimateGas({
          to: params.recipientAddress,
          value: ethers.parseEther(params.amount),
        });
      } else {
        // ERC-20 token transfer
        const tokenContract = new ethers.Contract(
          params.tokenAddress,
          ["function transfer(address,uint256) returns (bool)"],
          signer
        );
        gasEstimate = await tokenContract.transfer!.estimateGas(
          params.recipientAddress,
          ethers.parseUnits(params.amount, 18)
        );
      }

      const effectiveGasPrice =
        gasPrice.gasPrice || ethers.parseUnits("20", "gwei");
      const totalCost = gasEstimate * effectiveGasPrice;

      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: ethers.formatUnits(effectiveGasPrice, "gwei"),
        totalCost: ethers.formatEther(totalCost),
      };
    } catch (error: any) {
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }

  // Execute Ethereum withdrawal
  async withdrawEthereum(params: WithdrawParams): Promise<TransactionResult> {
    if (!this.ethereumProvider) {
      throw new Error("Ethereum provider not initialized");
    }

    try {
      const signer = await this.ethereumProvider.getSigner();
      let tx: ethers.TransactionResponse;

      if (!params.tokenAddress) {
        // ETH transfer
        tx = await signer.sendTransaction({
          to: params.recipientAddress,
          value: ethers.parseEther(params.amount),
        });
      } else {
        // ERC-20 token transfer
        const tokenContract = new ethers.Contract(
          params.tokenAddress,
          ["function transfer(address,uint256) returns (bool)"],
          signer
        );
        tx = await tokenContract.transfer!(
          params.recipientAddress,
          ethers.parseUnits(params.amount, 18)
        );
      }

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (receipt?.status === 1) {
        return {
          success: true,
          txHash: tx.hash,
          gasUsed: receipt.gasUsed.toString(),
          gasPrice: tx.gasPrice?.toString(),
        };
      } else {
        return {
          success: false,
          error: "Transaction failed",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Execute Solana withdrawal
  async withdrawSolana(params: WithdrawParams): Promise<TransactionResult> {
    if (!this.solanaConnection || !this.solanaProvider) {
      throw new Error("Solana provider not initialized");
    }

    try {
      const fromPubkey = this.solanaProvider.publicKey!;
      const toPubkey = new PublicKey(params.recipientAddress);
      const lamports = parseFloat(params.amount) * LAMPORTS_PER_SOL;

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );

      // Get recent blockhash
      const { blockhash } = await this.solanaConnection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      // Sign and send transaction
      const signedTransaction =
        await this.solanaProvider.signAndSendTransaction!(transaction);

      // Wait for confirmation
      const confirmation = await this.solanaConnection.confirmTransaction(
        signedTransaction.signature
      );

      if (confirmation.value.err) {
        return {
          success: false,
          error: "Transaction failed",
        };
      }

      return {
        success: true,
        txHash: signedTransaction.signature,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Validate address format
  isValidAddress(address: string, network: "ethereum" | "solana"): boolean {
    try {
      if (network === "ethereum") {
        return ethers.isAddress(address);
      } else if (network === "solana") {
        new PublicKey(address);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Get network name
  getNetworkName(chainId: number): string {
    const networks: { [key: number]: string } = {
      1: "Ethereum Mainnet",
      5: "Goerli Testnet",
      11155111: "Sepolia Testnet",
      137: "Polygon Mainnet",
      80001: "Polygon Mumbai",
      8453: "Base Mainnet",
      84531: "Base Goerli",
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    this.ethereumProvider = null;
    if (this.solanaProvider?.disconnect) {
      await this.solanaProvider.disconnect();
    }
    this.solanaProvider = null;
  }
}

export const web3Service = new Web3Service();
