import { prismaClient } from "db/client";

const prisma = prismaClient;

export interface CreateUserData {
  email: string;
  googleId: string;
  name?: string;
  avatar?: string;
  encryptedPrivateKey: string;
  publicAddress: string;
  encryptedPrivateKeySolana?: string;
  publicAddressSolana?: string;
}

export interface CreateTiplinkData {
  creatorId: string;
  tokenAddress: string;
  amount: string;
  url: string;
  message?: string;
  expiresAt?: Date;
}

export class DatabaseService {
  /**
   * Find user by email
   */
  async findUserByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Find user by Google ID
   */
  async findUserByGoogleId(googleId: string) {
    try {
      return await prisma.user.findUnique({
        where: { googleId },
      });
    } catch (error) {
      console.error("Error finding user by Google ID:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string) {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Find user by Ethereum address
   */
  async findUserByAddress(address: string) {
    try {
      // Try both original case and lowercase since addresses may be stored differently
      let user = await prisma.user.findUnique({
        where: { publicAddress: address },
      });

      if (!user) {
        user = await prisma.user.findUnique({
          where: { publicAddress: address.toLowerCase() },
        });
      }

      return user;
    } catch (error) {
      console.error("Error finding user by address:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData) {
    try {
      return await prisma.user.create({
        data: {
          email: userData.email,
          googleId: userData.googleId,
          name: userData.name,
          avatar: userData.avatar,
          encryptedPrivateKey: userData.encryptedPrivateKey,
          publicAddress: userData.publicAddress,
          encryptedPrivateKeySolana: userData.encryptedPrivateKeySolana,
          publicAddressSolana: userData.publicAddressSolana,
          lastLoginAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }

  /**
   * Update user's last login time
   */
  async updateLastLogin(userId: string) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      console.error("Error updating last login:", error);
      throw new Error("Failed to update user");
    }
  }

  /**
   * Update user with Solana keypair
   */
  async updateUserWithSolanaKeypair(
    userId: string,
    encryptedPrivateKeySolana: string,
    publicAddressSolana: string
  ) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: {
          encryptedPrivateKeySolana,
          publicAddressSolana,
        },
      });
    } catch (error) {
      console.error("Error updating user with Solana keypair:", error);
      throw new Error("Failed to update user with Solana keypair");
    }
  }

  /**
   * Find users without Solana keypairs
   */
  async findUsersWithoutSolanaKeypairs() {
    try {
      return await prisma.user.findMany({
        where: {
          OR: [
            { encryptedPrivateKeySolana: null },
            { publicAddressSolana: null },
          ],
        },
        select: {
          id: true,
          email: true,
          encryptedPrivateKeySolana: true,
          publicAddressSolana: true,
        },
      });
    } catch (error) {
      console.error("Error finding users without Solana keypairs:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Get all users with Solana addresses (for admin/poller use)
   */
  async getAllUsersWithSolana() {
    try {
      return await prisma.user.findMany({
        where: {
          AND: [
            { encryptedPrivateKeySolana: { not: null } },
            { publicAddressSolana: { not: null } },
          ],
        },
        select: {
          id: true,
          email: true,
          publicAddress: true,
          publicAddressSolana: true,
          encryptedPrivateKeySolana: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });
    } catch (error) {
      console.error("Error getting users with Solana addresses:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Update user verification status and data from Self Protocol
   */
  async updateUserVerification(
    userAddress: string,
    verificationData: {
      name?: string;
      nationality?: string;
      dateOfBirth?: string;
      age?: number;
      documentType?: string;
      txHash?: string;
      selfUserIdentifier?: string;
    }
  ) {
    try {
      return await prisma.user.updateMany({
        where: { publicAddress: userAddress },
        data: {
          isVerified: true,
          verifiedName: verificationData.name,
          verifiedNationality: verificationData.nationality,
          verifiedDateOfBirth: verificationData.dateOfBirth,
          verifiedAge: verificationData.age,
          verifiedDocumentType: verificationData.documentType,
          verificationTxHash: verificationData.txHash,
          verifiedAt: new Date(),
          selfUserIdentifier: verificationData.selfUserIdentifier,
        },
      });
    } catch (error) {
      console.error("Error updating user verification:", error);
      throw new Error("Failed to update user verification");
    }
  }

  /**
   * Get user verification details by address
   */
  async getUserVerificationByAddress(address: string) {
    try {
      return await prisma.user.findFirst({
        where: { publicAddress: address },
        select: {
          id: true,
          email: true,
          name: true,
          publicAddress: true,
          isVerified: true,
          verifiedName: true,
          verifiedNationality: true,
          verifiedDateOfBirth: true,
          verifiedAge: true,
          verifiedDocumentType: true,
          verificationTxHash: true,
          verifiedAt: true,
          selfUserIdentifier: true,
        },
      });
    } catch (error) {
      console.error("Error getting user verification by address:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

export const dbService = new DatabaseService();
