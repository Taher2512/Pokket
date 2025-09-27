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
   * Search users by name or email (for sending tokens)
   */
  async searchUsers(query: string, excludeUserId?: string) {
    try {
      const searchTerms = query.toLowerCase().trim();
      
      if (searchTerms.length < 2) {
        return [];
      }

      return await prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: searchTerms, mode: 'insensitive' } },
                { email: { contains: searchTerms, mode: 'insensitive' } },
              ],
            },
            excludeUserId ? { id: { not: excludeUserId } } : {},
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          publicAddress: true,
          publicAddressSolana: true,
        },
        take: 10, // Limit results to 10 users
        orderBy: [
          { lastLoginAt: 'desc' },
          { name: 'asc' },
        ],
      });
    } catch (error) {
      console.error("Error searching users in database:", error);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Get recent contacts for a user (users they've sent to before)
   * This is a placeholder - we'll implement with transaction history later
   */
  async getRecentContacts(userId: string) {
    try {
      // For now, return recent users (this will be enhanced with transaction history)
      return await prisma.user.findMany({
        where: {
          id: { not: userId },
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          publicAddress: true,
          publicAddressSolana: true,
        },
        take: 5,
        orderBy: { lastLoginAt: 'desc' },
      });
    } catch (error) {
      console.error("Error getting recent contacts from database:", error);
      return []; // Return empty array instead of throwing
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
