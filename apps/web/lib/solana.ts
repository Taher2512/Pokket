import { PublicKey, Connection, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";

// Solana network configuration
export const SOLANA_NETWORKS = {
  MAINNET: {
    name: "Solana Mainnet",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    explorerUrl: "https://solscan.io",
    chainId: "mainnet-beta",
  },
  DEVNET: {
    name: "Solana Devnet", 
    rpcUrl: "https://api.devnet.solana.com",
    explorerUrl: "https://solscan.io",
    chainId: "devnet",
  },
} as const;

// Solana wallet interface
export interface SolanaWalletInfo {
  publicKey: string;
  connected: boolean;
  provider: NonNullable<Window["solana"]>;
}

// Token transfer parameters for Solana
export interface SolanaTransferParams {
  to: string;
  amount: string;
  mintAddress?: string; // undefined for native SOL
  decimals?: number;
}

// Check if Phantom wallet is installed
export const isPhantomInstalled = (): boolean => {
  return !!(typeof window !== "undefined" && 
         typeof window.solana !== "undefined" && 
         window.solana.isPhantom);
};

// Connect to Phantom wallet
export const connectPhantomWallet = async (): Promise<SolanaWalletInfo> => {
  if (typeof window === "undefined") {
    throw new Error("Phantom wallet is only available in browser environment");
  }

  if (!isPhantomInstalled()) {
    throw new Error("Phantom wallet is not installed. Please install it from https://phantom.app/");
  }

  try {
    if (!window.solana) throw new Error("Phantom wallet not found");
    const response = await window.solana.connect();
    return {
      publicKey: response.publicKey.toString(),
      connected: true,
      provider: window.solana!,
    };
  } catch {
    throw new Error("Failed to connect to Phantom wallet");
  }
};

// Disconnect from Phantom wallet
export const disconnectPhantomWallet = async (): Promise<void> => {
  if (typeof window !== "undefined" && window.solana) {
    await window.solana.disconnect();
  }
};

// Send native SOL
export const sendSOL = async (
  walletInfo: SolanaWalletInfo,
  params: SolanaTransferParams,
  network: keyof typeof SOLANA_NETWORKS = "MAINNET"
): Promise<string> => {
  const { to, amount } = params;
  const connection = new Connection(SOLANA_NETWORKS[network].rpcUrl, "confirmed");
  
  const fromPubkey = new PublicKey(walletInfo.publicKey);
  const toPubkey = new PublicKey(to);
  const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    })
  );

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  // Sign and send transaction
  const signedTransaction = await walletInfo.provider.signTransaction(transaction) as Transaction;
  const signature = await connection.sendRawTransaction(signedTransaction.serialize());
  
  // Wait for confirmation
  await connection.confirmTransaction(signature, "confirmed");
  
  return signature;
};

// Send SPL Token
export const sendSPLToken = async (
  walletInfo: SolanaWalletInfo,
  params: SolanaTransferParams,
  network: keyof typeof SOLANA_NETWORKS = "MAINNET"
): Promise<string> => {
  const { to, amount, mintAddress, decimals = 9 } = params;
  
  if (!mintAddress) {
    // If no mint address, send native SOL
    return sendSOL(walletInfo, params, network);
  }

  const connection = new Connection(SOLANA_NETWORKS[network].rpcUrl, "confirmed");
  
  const fromPubkey = new PublicKey(walletInfo.publicKey);
  const toPubkey = new PublicKey(to);
  const mintPubkey = new PublicKey(mintAddress);
  
  // Calculate token amount with decimals
  const tokenAmount = Math.floor(parseFloat(amount) * Math.pow(10, decimals));

  // Get associated token accounts
  const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
  const toTokenAccount = await getAssociatedTokenAddress(mintPubkey, toPubkey);

  const transaction = new Transaction().add(
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPubkey,
      tokenAmount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  // Sign and send transaction
  const signedTransaction = await walletInfo.provider.signTransaction(transaction) as Transaction;
  const signature = await connection.sendRawTransaction(signedTransaction.serialize());
  
  // Wait for confirmation
  await connection.confirmTransaction(signature, "confirmed");
  
  return signature;
};

// Get SOL balance
export const getSOLBalance = async (
  publicKey: string,
  network: keyof typeof SOLANA_NETWORKS = "MAINNET"
): Promise<string> => {
  const connection = new Connection(SOLANA_NETWORKS[network].rpcUrl, "confirmed");
  const pubkey = new PublicKey(publicKey);
  
  const balance = await connection.getBalance(pubkey);
  return (balance / LAMPORTS_PER_SOL).toString();
};

// Get SPL token balance
export const getSPLTokenBalance = async (
  publicKey: string,
  mintAddress: string,
  network: keyof typeof SOLANA_NETWORKS = "MAINNET"
): Promise<string> => {
  const connection = new Connection(SOLANA_NETWORKS[network].rpcUrl, "confirmed");
  const pubkey = new PublicKey(publicKey);
  const mintPubkey = new PublicKey(mintAddress);
  
  const tokenAccount = await getAssociatedTokenAddress(mintPubkey, pubkey);
  
  try {
    const tokenBalance = await connection.getTokenAccountBalance(tokenAccount);
    return tokenBalance.value.uiAmountString || "0";
  } catch {
    // Token account doesn't exist
    return "0";
  }
};

// Get Solana block explorer URL
export const getSolanaExplorerUrl = (
  signature: string,
  network: keyof typeof SOLANA_NETWORKS = "MAINNET"
): string => {
  const baseUrl = SOLANA_NETWORKS[network].explorerUrl;
  const cluster = network === "DEVNET" ? "?cluster=devnet" : "";
  return `${baseUrl}/tx/${signature}${cluster}`;
};

// Common SPL tokens on Solana
export const SOLANA_TOKENS = {
  SOL: {
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    mintAddress: null, // Native SOL
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
  USDT: {
    symbol: "USDT", 
    name: "Tether USD",
    decimals: 6,
    mintAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  },
  RAY: {
    symbol: "RAY",
    name: "Raydium",
    decimals: 6,
    mintAddress: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  },
} as const;

// Estimate transaction fee for Solana
export const estimateSolanaFee = async (
  network: keyof typeof SOLANA_NETWORKS = "MAINNET"
): Promise<string> => {
  const connection = new Connection(SOLANA_NETWORKS[network].rpcUrl, "confirmed");
  
  // Create a dummy transaction to estimate fee
  const dummyTransaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey("11111111111111111111111111111112"), // System program
      toPubkey: new PublicKey("11111111111111111111111111111112"),
      lamports: 1,
    })
  );

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  dummyTransaction.recentBlockhash = blockhash;
  dummyTransaction.feePayer = new PublicKey("11111111111111111111111111111112");

  const fee = await connection.getFeeForMessage(dummyTransaction.compileMessage());
  return ((fee.value || 5000) / LAMPORTS_PER_SOL).toString(); // Default to 0.000005 SOL
};