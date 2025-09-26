import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import crypto from "crypto";
import { Keypair } from "@solana/web3.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev";
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "fallback-encryption-key-for-dev";

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface EthereumKeypair {
  address: string;
  encryptedPrivateKey: string;
}

export interface SolanaKeypair {
  publicKey: string;
  encryptedPrivateKey: string;
}

export interface DualKeypair {
  ethereum: EthereumKeypair;
  solana: SolanaKeypair;
}

export class AuthService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generate authorization URL for Google OAuth
   */
  getAuthUrl(): string {
    const scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      include_granted_scopes: true,
    });
  }

  /**
   * Exchange authorization code for user info
   */
  async getGoogleUserInfo(code: string): Promise<GoogleUserInfo> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();

      if (!data.email || !data.id) {
        throw new Error("Failed to get user email or ID from Google");
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name || "",
        picture: data.picture || "",
      };
    } catch (error) {
      console.error("Error getting Google user info:", error);
      throw new Error("Failed to authenticate with Google");
    }
  }

  /**
   * Generate a new Ethereum keypair and encrypt the private key
   */
  generateEthereumKeypair(): EthereumKeypair {
    try {
      const wallet = ethers.Wallet.createRandom();
      const privateKey = wallet.privateKey;
      const address = wallet.address;

      // Encrypt the private key
      const encryptedPrivateKey = CryptoJS.AES.encrypt(
        privateKey,
        ENCRYPTION_KEY
      ).toString();

      return {
        address,
        encryptedPrivateKey,
      };
    } catch (error) {
      console.error("Error generating Ethereum keypair:", error);
      throw new Error("Failed to generate Ethereum keypair");
    }
  }

  /**
   * Generate a new Solana keypair and encrypt the private key
   */
  generateSolanaKeypair(): SolanaKeypair {
    try {
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toBase58();
      const privateKey = Array.from(keypair.secretKey);

      // Convert private key array to string for encryption
      const privateKeyString = JSON.stringify(privateKey);

      // Encrypt the private key
      const encryptedPrivateKey = CryptoJS.AES.encrypt(
        privateKeyString,
        ENCRYPTION_KEY
      ).toString();

      return {
        publicKey,
        encryptedPrivateKey,
      };
    } catch (error) {
      console.error("Error generating Solana keypair:", error);
      throw new Error("Failed to generate Solana keypair");
    }
  }

  /**
   * Generate both Ethereum and Solana keypairs
   */
  generateDualKeypair(): DualKeypair {
    try {
      const ethereum = this.generateEthereumKeypair();
      const solana = this.generateSolanaKeypair();

      return {
        ethereum,
        solana,
      };
    } catch (error) {
      console.error("Error generating dual keypair:", error);
      throw new Error("Failed to generate dual keypair");
    }
  }

  /**
   * Decrypt a private key
   */
  decryptPrivateKey(encryptedPrivateKey: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error("Error decrypting private key:", error);
      throw new Error("Failed to decrypt private key");
    }
  }

  /**
   * Decrypt a Solana private key and return as Uint8Array
   */
  decryptSolanaPrivateKey(encryptedPrivateKey: string): Uint8Array {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, ENCRYPTION_KEY);
      const privateKeyString = bytes.toString(CryptoJS.enc.Utf8);
      const privateKeyArray = JSON.parse(privateKeyString);
      return new Uint8Array(privateKeyArray);
    } catch (error) {
      console.error("Error decrypting Solana private key:", error);
      throw new Error("Failed to decrypt Solana private key");
    }
  }

  /**
   * Generate JWT token for user session
   */
  generateJWT(userId: string, email: string): string {
    try {
      return jwt.sign(
        {
          userId,
          email,
          iat: Math.floor(Date.now() / 1000),
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
    } catch (error) {
      console.error("Error generating JWT:", error);
      throw new Error("Failed to generate authentication token");
    }
  }

  /**
   * Verify JWT token
   */
  verifyJWT(token: string): { userId: string; email: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      console.error("Error verifying JWT:", error);
      throw new Error("Invalid authentication token");
    }
  }

  /**
   * Validate Ethereum address format
   */
  isValidEthereumAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }
}
