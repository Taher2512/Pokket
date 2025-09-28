import { ethers } from 'ethers';
import { Keypair, PublicKey } from '@solana/web3.js';

export interface WalletKeyPairs {
  ethereum: {
    address: string;
    privateKey: string;
  };
  solana: {
    address: string;
    privateKey: string;
  };
}

/**
 * Generate new keypairs for both Ethereum and Solana
 */
export function generateWalletKeyPairs(): WalletKeyPairs {
  // Generate Ethereum wallet
  const ethWallet = ethers.Wallet.createRandom();
  
  // Generate Solana keypair
  const solKeypair = Keypair.generate();
  
  return {
    ethereum: {
      address: ethWallet.address,
      privateKey: ethWallet.privateKey,
    },
    solana: {
      address: solKeypair.publicKey.toBase58(),
      privateKey: Buffer.from(solKeypair.secretKey).toString('hex'),
    }
  };
}

/**
 * Generate keypairs from a seed phrase (for deterministic generation)
 */
export function generateWalletKeyPairsFromSeed(seedPhrase: string): WalletKeyPairs {
  // Generate Ethereum wallet from seed
  const ethWallet = ethers.Wallet.fromPhrase(seedPhrase);
  
  // Generate Solana keypair from seed (using a simple derivation)
  const seedBuffer = ethers.toUtf8Bytes(seedPhrase);
  const hash = ethers.keccak256(seedBuffer);
  const solKeypair = Keypair.fromSeed(ethers.getBytes(hash).slice(0, 32));
  
  return {
    ethereum: {
      address: ethWallet.address,
      privateKey: ethWallet.privateKey,
    },
    solana: {
      address: solKeypair.publicKey.toBase58(),
      privateKey: Buffer.from(solKeypair.secretKey).toString('hex'),
    }
  };
}

/**
 * Generate keypairs from a single private key (deterministic)
 */
export function generateWalletKeyPairsFromPrivateKey(ethPrivateKey: string): WalletKeyPairs {
  // Use the provided Ethereum private key
  const ethWallet = new ethers.Wallet(ethPrivateKey);
  
  // Derive Solana keypair from the Ethereum private key
  const seedFromEthKey = ethers.keccak256(ethPrivateKey);
  const solKeypair = Keypair.fromSeed(ethers.getBytes(seedFromEthKey).slice(0, 32));
  
  return {
    ethereum: {
      address: ethWallet.address,
      privateKey: ethWallet.privateKey,
    },
    solana: {
      address: solKeypair.publicKey.toBase58(),
      privateKey: Buffer.from(solKeypair.secretKey).toString('hex'),
    }
  };
}

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Validate Solana address format (base58 and length check)
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    // Solana addresses are base58 encoded and typically 32-44 characters
    if (address.length < 32 || address.length > 44) {
      return false;
    }
    
    // Try to create a PublicKey from the address
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}