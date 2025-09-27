import { ethers } from "ethers";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Phantom wallet provider types
declare global {
  interface Window {
    phantom?: {
      ethereum?: {
        isPhantom: boolean;
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        on: (event: string, handler: (...args: unknown[]) => void) => void;
        removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      };
      solana?: {
        isPhantom: boolean;
        connect: (opts?: { onlyIfTrusted: boolean }) => Promise<{ publicKey: { toString(): string } }>;
        disconnect: () => Promise<void>;
        signAndSendTransaction: (transaction: unknown) => Promise<{ signature: string }>;
        signTransaction: (transaction: unknown) => Promise<unknown>;
        signAllTransactions: (transactions: unknown[]) => Promise<unknown[]>;
        publicKey?: { toString(): string };
        isConnected: boolean;
        on: (event: string, handler: (...args: unknown[]) => void) => void;
        off: (event: string, handler: (...args: unknown[]) => void) => void;
      };
    };
  }
}

export interface PhantomWalletInfo {
  address: string;
  isConnected: boolean;
  network: "ethereum" | "base" | "solana";
}

export interface TokenTransferParams {
  to: string;
  amount: string;
  tokenAddress?: string;
  decimals?: number;
  network: "ethereum" | "base" | "solana";
}

// Check if Phantom wallet is installed
export const isPhantomInstalled = (): boolean => {
  if (typeof window === "undefined") return false;
  
  // Check for Phantom extension
  const hasPhantomEthereum = window.phantom?.ethereum?.isPhantom;
  const hasPhantomSolana = window.phantom?.solana?.isPhantom;
  
  console.log("Phantom detection:", { hasPhantomEthereum, hasPhantomSolana, phantom: window.phantom });
  
  return !!(hasPhantomEthereum || hasPhantomSolana);
};

// Connect to Phantom wallet for Ethereum/Base
export const connectPhantomEthereum = async (): Promise<PhantomWalletInfo> => {
  if (!window.phantom?.ethereum) {
    throw new Error("Phantom Ethereum provider not found");
  }

  try {
    const accounts = await window.phantom.ethereum.request({
      method: "eth_requestAccounts",
    }) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }

    return {
      address: accounts[0]!,
      isConnected: true,
      network: "ethereum", // Default to Ethereum, user can switch in Phantom
    };
  } catch (error) {
    throw new Error(`Failed to connect to Phantom: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Connect to Phantom wallet for Solana
export const connectPhantomSolana = async (): Promise<PhantomWalletInfo> => {
  if (!window.phantom?.solana) {
    throw new Error("Phantom Solana provider not found");
  }

  try {
    const response = await window.phantom.solana.connect();
    
    return {
      address: response.publicKey.toString(),
      isConnected: true,
      network: "solana",
    };
  } catch (error) {
    throw new Error(`Failed to connect to Phantom Solana: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Send tokens through Phantom wallet
export const sendTokensViaPhantom = async (params: TokenTransferParams): Promise<string> => {
  const { to, amount, tokenAddress, decimals = 18, network } = params;

  if (network === "solana") {
    return sendSolanaTokensViaPhantom({ to, amount, tokenAddress, decimals, network });
  } else {
    return sendEthereumTokensViaPhantom({ to, amount, tokenAddress, decimals, network });
  }
};

// Send Ethereum/Base tokens via Phantom
const sendEthereumTokensViaPhantom = async (params: TokenTransferParams): Promise<string> => {
  if (!window.phantom?.ethereum) {
    throw new Error("Phantom Ethereum provider not found");
  }

  const { to, amount, tokenAddress, decimals = 18 } = params;
  
  try {
    const provider = new ethers.BrowserProvider(window.phantom.ethereum as ethers.Eip1193Provider);
    const signer = await provider.getSigner();

    let tx;
    if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
      // Send native ETH
      tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });
    } else {
      // Send ERC-20 token
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function transfer(address to, uint256 amount) returns (bool)",
          "function decimals() view returns (uint8)",
        ],
        signer
      );

      const tokenAmount = ethers.parseUnits(amount, decimals);
      tx = await tokenContract.getFunction("transfer")(to, tokenAmount);
    }

    return tx.hash;
  } catch (error) {
    throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Send Solana tokens via Phantom
const sendSolanaTokensViaPhantom = async (params: TokenTransferParams): Promise<string> => {
  if (!window.phantom?.solana) {
    throw new Error("Phantom Solana provider not found");
  }

  const { to, amount } = params;

  try {
    // Connect to Solana if not already connected
    if (!window.phantom.solana.isConnected) {
      await window.phantom.solana.connect();
    }

    if (!window.phantom.solana.publicKey) {
      throw new Error("Phantom wallet not connected properly");
    }

    console.log("Initiating Solana transfer via Phantom:", { to, amount });

    try {
      // Use reliable public Solana mainnet RPC endpoint
      const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=71ac2476-6792-470c-8bf1-85fc9e701bc3', 'confirmed');

      console.log("Getting Solana mainnet connection...");

      // Create the transaction components
      const fromPubkey = new PublicKey(window.phantom.solana.publicKey.toString());
      const toPubkey = new PublicKey(to);
      const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

      console.log("Creating transaction...", { 
        from: fromPubkey.toString(), 
        to: toPubkey.toString(), 
        lamports,
        solAmount: amount 
      });

      // Get recent blockhash from mainnet
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      console.log("Got blockhash from mainnet:", blockhash);

      // Create transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      });

      // Create transaction using constructor with blockhash
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: fromPubkey,
      });
      transaction.add(transferInstruction);

      console.log("Transaction created with blockhash, requesting signature from Phantom...");

      // Sign and send transaction through Phantom
      const signedTransaction = await window.phantom.solana.signAndSendTransaction(transaction);
      
      console.log("Transaction signed and sent:", signedTransaction.signature);
      
      return signedTransaction.signature;
      
    } catch (connectionError) {
      console.error("Solana mainnet transaction error:", connectionError);
      
      // Alternative approach: Try other public RPC endpoints
      console.log("Trying alternative RPC endpoints...");
      
      const publicEndpoints = [
        'https://rpc.ankr.com/solana',
        'https://solana-api.projectserum.com',
        'https://api.mainnet-beta.solana.com'
      ];
      
      for (const endpoint of publicEndpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const fallbackConnection = new Connection(endpoint, 'confirmed');
          
          // Test the connection first
          await fallbackConnection.getSlot();
          
          const { blockhash: fallbackBlockhash } = await fallbackConnection.getLatestBlockhash('confirmed');
          console.log(`Got blockhash from ${endpoint}:`, fallbackBlockhash);
          
          const fromPubkey = new PublicKey(window.phantom.solana.publicKey.toString());
          const toPubkey = new PublicKey(to);
          const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

          const transferInstruction = SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports,
          });

          const transaction = new Transaction({
            recentBlockhash: fallbackBlockhash,
            feePayer: fromPubkey,
          }).add(transferInstruction);
          
          const signedTransaction = await window.phantom.solana.signAndSendTransaction(transaction);
          console.log("Fallback transaction sent:", signedTransaction.signature);
          
          return signedTransaction.signature;
        } catch (endpointError) {
          console.warn(`Endpoint ${endpoint} failed:`, endpointError);
          continue;
        }
      }
      
      // If all endpoints fail, try letting Phantom handle everything
      console.log("All RPC endpoints failed, letting Phantom handle transaction completely...");
      
      try {
        const fromPubkey = new PublicKey(window.phantom.solana.publicKey.toString());
        const toPubkey = new PublicKey(to);
        const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

        // Create minimal transaction without blockhash - let Phantom add it
        const transferInstruction = SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        });

        const transaction = new Transaction().add(transferInstruction);
        
        // Phantom should automatically add blockhash and handle fees
        const signedTransaction = await window.phantom.solana.signAndSendTransaction(transaction);
        console.log("Phantom-handled transaction sent:", signedTransaction.signature);
        
        return signedTransaction.signature;
      } catch (phantomError) {
        console.error("All Solana transaction methods failed:", phantomError);
        
        // Final fallback: Show user manual instructions
        const message = `Unable to process Solana transaction automatically. Please manually send:\n\nAmount: ${amount} SOL\nTo: ${to}\n\nError: ${phantomError instanceof Error ? phantomError.message : 'Unknown error'}`;
        alert(message);
        throw new Error("Automatic Solana transaction failed. Please send manually.");
      }
    }
  } catch (error) {
    console.error("Solana transaction error:", error);
    throw new Error(`Solana transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Switch network in Phantom (for Ethereum/Base)
export const switchPhantomNetwork = async (network: "ethereum" | "base"): Promise<void> => {
  if (!window.phantom?.ethereum) {
    throw new Error("Phantom Ethereum provider not found");
  }

  const networkConfig = network === "ethereum" 
    ? {
        chainId: "0x1", // Ethereum mainnet
        chainName: "Ethereum Mainnet",
        nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://ethereum-rpc.publicnode.com"],
        blockExplorerUrls: ["https://etherscan.io"],
      }
    : {
        chainId: "0x2105", // Base mainnet
        chainName: "Base",
        nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://mainnet.base.org"],
        blockExplorerUrls: ["https://basescan.org"],
      };

  try {
    // Try to switch to the network
    await window.phantom.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: networkConfig.chainId }],
    });
  } catch (error: unknown) {
    // If the network doesn't exist, add it
    if (error && typeof error === 'object' && 'code' in error && error.code === 4902) {
      await window.phantom.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [networkConfig],
      });
    } else {
      throw error;
    }
  }
};

// Get current network from Phantom
export const getPhantomNetwork = async (): Promise<number> => {
  if (!window.phantom?.ethereum) {
    throw new Error("Phantom Ethereum provider not found");
  }

  const chainId = await window.phantom.ethereum.request({
    method: "eth_chainId",
  }) as string;

  return parseInt(chainId, 16);
};

// Disconnect from Phantom
export const disconnectPhantom = async (network: "ethereum" | "base" | "solana"): Promise<void> => {
  if (network === "solana" && window.phantom?.solana) {
    await window.phantom.solana.disconnect();
  }
  // For Ethereum/Base, we don't need to explicitly disconnect as it's handled by the wallet
};

export {};