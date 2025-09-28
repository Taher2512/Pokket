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

export interface SelfVerificationData {
  nullifierId: string;
  ethAddress: string;
  solAddress: string;
  name: string;
  nationality: string;
  age: number;
  issuingState: string;
  transactionHash: string;
  verifiedAt: Date;
  isVerified: boolean;
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
   * Store SELF verification data
   */
  async storeSelfVerification(data: SelfVerificationData) {
    try {
      console.log('💾 Storing SELF verification data in database:', data);
      
      // Create a new user entry for SELF-verified users
      // Store the wallet addresses so they can be used for real transactions
      const user = await prisma.user.create({
        data: {
          email: `${data.nullifierId.slice(0, 16)}@pokket-verified.id`,
          googleId: data.nullifierId, // Use nullifier as unique ID
          name: data.name,
          avatar: null,
          encryptedPrivateKey: "", // Will be set when needed
          publicAddress: data.ethAddress,
          encryptedPrivateKeySolana: "", // Will be set when needed  
          publicAddressSolana: data.solAddress,
          lastLoginAt: data.verifiedAt,
        },
      });
      
      console.log('✅ SELF user created in database:', user.id);
      
      return {
        success: true,
        userId: user.id,
        data: data
      };
    } catch (error) {
      console.error("Error storing SELF verification:", error);
      // If user already exists, update it
      try {
        const existingUser = await prisma.user.findUnique({
          where: { googleId: data.nullifierId }
        });
        
        if (existingUser) {
          const updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: data.name,
              publicAddress: data.ethAddress,
              publicAddressSolana: data.solAddress,
              lastLoginAt: data.verifiedAt,
            },
          });
          
          console.log('✅ SELF user updated in database:', updatedUser.id);
          return {
            success: true,
            userId: updatedUser.id,
            data: data
          };
        }
      } catch (updateError) {
        console.error("Error updating SELF verification:", updateError);
      }
      
      throw new Error("Failed to store SELF verification");
    }
  }

  /**
   * Get SELF verification by nullifier ID
   */
  async getSelfVerificationByNullifier(nullifierId: string): Promise<SelfVerificationData | null> {
    try {
      console.log('🔍 Looking up SELF verification for nullifier:', nullifierId);
      
      // Find user by nullifier ID (stored as googleId)
      const user = await prisma.user.findUnique({
        where: { googleId: nullifierId }
      });
      
      if (!user) {
        console.log('⚠️ No SELF user found for nullifier:', nullifierId);
        return null;
      }
      
      console.log('✅ Found SELF user:', { id: user.id, name: user.name, ethAddress: user.publicAddress });
      
      return {
        nullifierId: nullifierId,
        ethAddress: user.publicAddress,
        solAddress: user.publicAddressSolana || "",
        name: user.name || "SELF Verified User",
        nationality: "UNKNOWN",
        age: 0,
        issuingState: "UNKNOWN", 
        transactionHash: "",
        verifiedAt: user.lastLoginAt || new Date(),
        isVerified: true
      };
    } catch (error) {
      console.error("Error getting SELF verification:", error);
      throw new Error("Failed to get SELF verification");
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
