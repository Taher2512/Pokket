import { SelfAppBuilder } from "@selfxyz/qrcode";

// Configuration for Pokket Identity Verification
const VERIFICATION_CONFIG = {
  // Contract will be deployed on Celo testnet
  endpoint: process.env.NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS || "",
  endpointType: "staging_celo" as const, // Using testnet
  userIdType: "hex" as const,
  version: 2 as const,
  appName: "Pokket Wallet",
  scope: "pokket-identity-verification", // Max 30 characters

  // Aadhar card verification configuration for Indian users
  disclosures: {
    // Age verification (18+)
    minimumAge: 18,

    // No geographic restrictions for Indian users
    excludedCountries: [],

    // OFAC compliance (disabled for testing)
    ofac: false,

    // Data disclosures for Aadhar card verification
    name: true, // Full name from Aadhar
    date_of_birth: true, // Date of birth
    nationality: true, // Indian nationality
    issuing_state: true, // State that issued Aadhar
    // Note: Aadhar card doesn't have expiry_date or passport_number
  },
};

export interface VerificationStatus {
  isVerified: boolean;
  verificationTimestamp?: number;
  metadata?: any;
  txHash?: string;
}

export class SelfVerificationService {
  private selfApp: any;

  constructor(userAddress: string) {
    if (!VERIFICATION_CONFIG.endpoint) {
      throw new Error("Verification contract address not configured");
    }

    this.selfApp = new SelfAppBuilder({
      ...VERIFICATION_CONFIG,
      userId: userAddress,
      userDefinedData: JSON.stringify({
        platform: "pokket",
        timestamp: Date.now(),
        version: "1.0",
      }),
    }).build();
  }

  /**
   * Get the verification QR code data for Self mobile app scanning
   */
  async getVerificationQR(): Promise<string> {
    try {
      return await this.selfApp.getQRCode();
    } catch (error) {
      console.error("Failed to generate verification QR:", error);
      throw new Error("Failed to generate verification QR code");
    }
  }

  /**
   * Check verification status from smart contract
   */
  async checkVerificationStatus(
    userAddress: string
  ): Promise<VerificationStatus> {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(
        `${API_BASE_URL}/verification/status/${userAddress}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to check verification status:", error);
      return { isVerified: false };
    }
  }

  /**
   * Poll for verification completion
   */
  async pollVerificationStatus(
    userAddress: string,
    onStatusUpdate: (status: VerificationStatus) => void,
    maxAttempts = 60, // 5 minutes with 5-second intervals
    intervalMs = 5000
  ): Promise<VerificationStatus> {
    return new Promise((resolve) => {
      let attempts = 0;

      const poll = async () => {
        attempts++;

        try {
          const status = await this.checkVerificationStatus(userAddress);
          onStatusUpdate(status);

          // If verified or max attempts reached, stop polling
          if (status.isVerified || attempts >= maxAttempts) {
            resolve(status);
            return;
          }

          // Continue polling
          setTimeout(poll, intervalMs);
        } catch (error) {
          console.error("Polling error:", error);
          if (attempts >= maxAttempts) {
            resolve({ isVerified: false });
          } else {
            setTimeout(poll, intervalMs);
          }
        }
      };

      poll();
    });
  }

  /**
   * Get verification configuration for debugging
   */
  getConfig() {
    return VERIFICATION_CONFIG;
  }
}

// Factory function to create verification service instances
export function createVerificationService(
  userAddress: string
): SelfVerificationService {
  return new SelfVerificationService(userAddress);
}

// Utility function to format verification timestamp
export function formatVerificationDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Utility to check if verification is recent (within 1 year)
export function isVerificationRecent(timestamp: number): boolean {
  const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
  return timestamp * 1000 > oneYearAgo;
}
