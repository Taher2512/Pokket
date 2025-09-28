import { ethers } from 'ethers';

// Contract ABI for the verification functions we need
const VERIFICATION_CONTRACT_ABI = [
  "function getVerificationByAddress(address ethAddress) external view returns (tuple(bytes32 nullifierId, address ethAddress, address solAddress, string name, string nationality, uint256 age, string issuingState, uint256 verifiedAt, bool isVerified))",
  "function isUserVerified(address ethAddress) external view returns (bool)",
  "function getNullifierByAddress(address ethAddress) external view returns (bytes32)",
  "function getVerificationByNullifier(bytes32 nullifierId) external view returns (tuple(bytes32 nullifierId, address ethAddress, address solAddress, string name, string nationality, uint256 age, string issuingState, uint256 verifiedAt, bool isVerified))",
  "event UserVerified(bytes32 indexed nullifierId, address indexed ethAddress, address indexed solAddress, string name, string nationality, uint256 age, string issuingState, uint256 timestamp)",
  "event AddressesLinked(bytes32 indexed nullifierId, address indexed ethAddress, address indexed solAddress)"
];

export interface UserVerificationData {
  nullifierId: string;
  ethAddress: string;
  solAddress: string;
  name: string;
  nationality: string;
  age: number;
  issuingState: string;
  verifiedAt: number;
  isVerified: boolean;
}

export class SelfVerificationService {
  private contract!: ethers.Contract;
  private provider: ethers.Provider;

  constructor() {
    // Initialize provider for Celo Sepolia
    this.provider = new ethers.JsonRpcProvider('https://alfajores-forno.celo-testnet.org');
    
    const contractAddress = process.env.NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('Verification contract address not configured');
    }

    // Initialize contract with provider
    this.contract = new ethers.Contract(
      contractAddress,
      VERIFICATION_CONTRACT_ABI,
      this.provider
    ) as ethers.Contract;
  }

  /**
   * Check if a user is verified by their Ethereum address
   */
  async isUserVerified(ethAddress: string): Promise<boolean> {
    try {
      return await this.contract.isUserVerified(ethAddress);
    } catch (error) {
      console.error('Error checking verification status:', error);
      return false;
    }
  }

  /**
   * Get verification data by Ethereum address
   */
  async getVerificationByAddress(ethAddress: string): Promise<UserVerificationData | null> {
    try {
      const result = await this.contract.getVerificationByAddress(ethAddress);
      
      if (!result.isVerified) {
        return null;
      }

      return {
        nullifierId: result.nullifierId,
        ethAddress: result.ethAddress,
        solAddress: result.solAddress,
        name: result.name,
        nationality: result.nationality,
        age: Number(result.age),
        issuingState: result.issuingState,
        verifiedAt: Number(result.verifiedAt),
        isVerified: result.isVerified,
      };
    } catch (error) {
      console.error('Error getting verification data:', error);
      return null;
    }
  }

  /**
   * Get verification data by nullifier ID
   */
  async getVerificationByNullifier(nullifierId: string): Promise<UserVerificationData | null> {
    try {
      const result = await this.contract.getVerificationByNullifier(nullifierId);
      
      if (!result.isVerified) {
        return null;
      }

      return {
        nullifierId: result.nullifierId,
        ethAddress: result.ethAddress,
        solAddress: result.solAddress,
        name: result.name,
        nationality: result.nationality,
        age: Number(result.age),
        issuingState: result.issuingState,
        verifiedAt: Number(result.verifiedAt),
        isVerified: result.isVerified,
      };
    } catch (error) {
      console.error('Error getting verification data by nullifier:', error);
      return null;
    }
  }

  /**
   * Get nullifier ID by Ethereum address
   */
  async getNullifierByAddress(ethAddress: string): Promise<string | null> {
    try {
      const nullifierId = await this.contract.getNullifierByAddress(ethAddress);
      return nullifierId === '0x0000000000000000000000000000000000000000000000000000000000000000' ? null : nullifierId;
    } catch (error) {
      console.error('Error getting nullifier ID:', error);
      return null;
    }
  }

  /**
   * Listen for verification events
   */
  onUserVerified(callback: (data: {
    nullifierId: string;
    ethAddress: string;
    solAddress: string;
    name: string;
    nationality: string;
    age: number;
    issuingState: string;
    timestamp: number;
  }) => void) {
    this.contract.on('UserVerified', (nullifierId, ethAddress, solAddress, name, nationality, age, issuingState, timestamp) => {
      callback({
        nullifierId,
        ethAddress,
        solAddress,
        name,
        nationality,
        age: Number(age),
        issuingState,
        timestamp: Number(timestamp),
      });
    });
  }

  /**
   * Stop listening for events
   */
  removeAllListeners() {
    this.contract.removeAllListeners();
  }

  /**
   * Wait for verification completion by polling
   */
  async waitForVerification(
    ethAddress: string, 
    maxAttempts: number = 60, 
    intervalMs: number = 5000
  ): Promise<UserVerificationData | null> {
    for (let i = 0; i < maxAttempts; i++) {
      const verificationData = await this.getVerificationByAddress(ethAddress);
      
      if (verificationData && verificationData.isVerified) {
        console.log('✅ Verification completed successfully!');
        return verificationData;
      }

      console.log(`⏳ Waiting for verification... Attempt ${i + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    console.log('❌ Verification timeout');
    return null;
  }
}

// Singleton instance
let verificationServiceInstance: SelfVerificationService | null = null;

export function createSelfVerificationService(): SelfVerificationService {
  if (!verificationServiceInstance) {
    verificationServiceInstance = new SelfVerificationService();
  }
  return verificationServiceInstance;
}