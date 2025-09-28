// Load environment variables
import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { AuthService } from "./services/auth";
import { TokenService } from "./services/tokens";
import { dbService } from "./services/database";
import { swapApp } from "./routes/swap";
import { verificationRoutes } from "./routes/verification";
import { Contract, JsonRpcProvider } from "ethers";

// Type definition for authenticated user context
interface AuthContext {
  userId: string;
  email: string;
}

// Type definition for Hono context with user authentication
type AppContext = {
  Variables: {
    user: AuthContext;
  };
};

const app = new Hono<AppContext>();
const authService = new AuthService();
const tokenService = new TokenService();

// Middleware
app.use(
  "*",
  cors({
    origin: "*", // Allow all origins for deployment
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes
app.get("/auth/google", (c) => {
  try {
    const authUrl = authService.getAuthUrl();
    return c.json({ authUrl });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    return c.json({ error: "Failed to generate auth URL" }, 500);
  }
});

app.post("/auth/google/callback", async (c) => {
  try {
    const { code } = await c.req.json();

    if (!code) {
      return c.json({ error: "Authorization code is required" }, 400);
    }

    // Get user info from Google
    const googleUser = await authService.getGoogleUserInfo(code);

    // Check if user exists
    let user = await dbService.findUserByGoogleId(googleUser.id);

    if (!user) {
      // Create new user with both Ethereum and Solana keypairs
      const dualKeypair = authService.generateDualKeypair();

      user = await dbService.createUser({
        email: googleUser.email,
        googleId: googleUser.id,
        name: googleUser.name,
        avatar: googleUser.picture,
        encryptedPrivateKey: dualKeypair.ethereum.encryptedPrivateKey,
        publicAddress: dualKeypair.ethereum.address,
        encryptedPrivateKeySolana: dualKeypair.solana.encryptedPrivateKey,
        publicAddressSolana: dualKeypair.solana.publicKey,
      });
    } else {
      // Update last login
      await dbService.updateLastLogin(user.id);
    }

    // Generate JWT
    const token = authService.generateJWT(user.id, user.email);

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        publicAddress: user.publicAddress,
        publicAddressSolana: user.publicAddressSolana,
      },
    });
  } catch (error) {
    console.error("Error in Google callback:", error);
    return c.json({ error: "Authentication failed" }, 500);
  }
});

// Generate keypairs for identity verification flow
app.post("/auth/generate-keypairs", async (c) => {
  try {
    const { authMethod } = await c.req.json();

    if (authMethod !== 'identity_verification') {
      return c.json({ error: "Invalid authentication method" }, 400);
    }

    // Generate dual keypair (Ethereum + Solana)
    const dualKeypair = authService.generateDualKeypair();

    // For now, we'll store this temporarily or return it for the verification process
    // In a real app, you'd want to store this securely until verification is complete
    return c.json({
      success: true,
      publicAddress: dualKeypair.ethereum.address,
      publicAddressSolana: dualKeypair.solana.publicKey,
      // Store encrypted keys temporarily (you'd want to use a different mechanism in production)
      tempId: Date.now().toString(),
      message: "Keypairs generated successfully"
    });
  } catch (error) {
    console.error("Error generating keypairs:", error);
    return c.json({ error: "Failed to generate keypairs" }, 500);
  }
});

// Complete identity authentication after SELF verification
app.post("/auth/complete-identity-auth", async (c) => {
  try {
    const { publicAddress, verificationData, authMethod } = await c.req.json();

    if (authMethod !== 'identity_verification') {
      return c.json({ error: "Invalid authentication method" }, 400);
    }

    if (!publicAddress) {
      return c.json({ error: "Public address is required" }, 400);
    }

    // For demo purposes, create a temporary user
    // In production, you'd want to integrate with your user creation flow
    const tempUser = {
      id: Date.now().toString(),
      email: `user_${publicAddress.slice(-6)}@pokket.app`,
      name: `Verified User ${publicAddress.slice(-4)}`,
      avatar: null,
      publicAddress: publicAddress,
      publicAddressSolana: null, // Would be populated from the keypair generation
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    };

    // Generate JWT for the verified user
    const token = authService.generateJWT(tempUser.id, tempUser.email);

    return c.json({
      success: true,
      token,
      user: tempUser,
      message: "Identity authentication completed successfully"
    });
  } catch (error) {
    console.error("Error completing identity authentication:", error);
    return c.json({ error: "Failed to complete identity authentication" }, 500);
  }
});

// Verify identity token
app.get("/auth/verify-identity-token", async (c) => {
  try {
    const authorization = c.req.header("Authorization");

    if (!authorization) {
      return c.json({ error: "Authorization header is required" }, 401);
    }

    const token = authorization.replace("Bearer ", "");
    const decoded = authService.verifyJWT(token);

    // For demo purposes, return a mock user
    // In production, you'd fetch the actual user from database
    const user = {
      id: decoded.userId,
      email: decoded.email,
      name: `Verified User`,
      avatar: null,
      publicAddress: "0x" + Math.random().toString(16).slice(2, 42),
      publicAddressSolana: null,
      isVerified: true,
    };

    return c.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Error verifying identity token:", error);
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});

// Simplified identity verification endpoint for now
// This will be a basic implementation that generates keypairs and returns them
app.post("/auth/generate-keypairs", async (c) => {
  try {
    const { authMethod } = await c.req.json();
    
    if (authMethod !== 'identity_verification') {
      return c.json({ error: "Invalid authentication method" }, 400);
    }

    // Generate dual keypairs (Ethereum + Solana)
    const dualKeypair = authService.generateDualKeypair();
    
    return c.json({
      success: true,
      publicAddress: dualKeypair.ethereum.address,
      publicAddressSolana: dualKeypair.solana.publicKey,
      message: "Keypairs generated successfully. You can now proceed with identity verification.",
    });
  } catch (error) {
    console.error("Error generating keypairs:", error);
    return c.json({ error: "Failed to generate keypairs" }, 500);
  }
});

// Protected route middleware
const authMiddleware = async (c: any, next: any) => {
  try {
    const authorization = c.req.header("Authorization");

    if (!authorization) {
      return c.json({ error: "Authorization header is required" }, 401);
    }

    const token = authorization.replace("Bearer ", "");
    const decoded = authService.verifyJWT(token) as AuthContext;

    // Attach user info to context
    c.set("user", decoded);
    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json({ error: "Invalid token" }, 401);
  }
};

// Protected routes
app.get("/user/profile", authMiddleware, async (c) => {
  try {
    const userAuth = c.get("user");
    
    // Check if this is a SELF-verified user (email contains @pokket-verified.id)
    if (userAuth.email.includes('@pokket-verified.id')) {
      console.log('📋 Creating profile for SELF-verified user:', userAuth.userId);
      
      // Create a mock user profile for SELF-verified users
      return c.json({
        user: {
          id: userAuth.userId,
          email: userAuth.email,
          name: "SELF Verified User",
          avatar: undefined,
          publicAddress: "0x" + userAuth.userId.replace('0x', '').padEnd(40, '0'), // Create address from user ID
          publicAddressSolana: null,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          isVerified: true,
        },
      });
    }
    
    // Regular database user
    const user = await dbService.findUserById(userAuth.userId);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        publicAddress: user.publicAddress,
        publicAddressSolana: user.publicAddressSolana,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        // Verification status - default to false for now
        isVerified: false,
      },
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    return c.json({ error: "Failed to get user profile" }, 500);
  }
});

// Get user's wallet private keys (for frontend operations)
app.get("/user/wallet", authMiddleware, async (c) => {
  try {
    const userAuth = c.get("user");
    const user = await dbService.findUserById(userAuth.userId);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Decrypt Ethereum private key
    const ethereumPrivateKey = authService.decryptPrivateKey(
      user.encryptedPrivateKey
    );

    // Decrypt Solana private key if available
    let solanaPrivateKey = null;
    if (user.encryptedPrivateKeySolana) {
      try {
        const solanaPrivateKeyArray = authService.decryptSolanaPrivateKey(
          user.encryptedPrivateKeySolana
        );
        solanaPrivateKey = Array.from(solanaPrivateKeyArray);
      } catch (error) {
        console.error("Error decrypting Solana private key:", error);
      }
    }

    return c.json({
      ethereum: {
        address: user.publicAddress,
        privateKey: ethereumPrivateKey,
      },
      solana: user.publicAddressSolana
        ? {
            address: user.publicAddressSolana,
            privateKey: solanaPrivateKey, // Array format for Solana
          }
        : null,
    });
  } catch (error) {
    console.error("Error getting wallet info:", error);
    return c.json({ error: "Failed to get wallet info" }, 500);
  }
});

// Get user's addresses (for QR codes and display)
app.get("/user/addresses", authMiddleware, async (c) => {
  try {
    const userAuth = c.get("user");
    
    // Check if this is a SELF-verified user
    if (userAuth.email.includes('@pokket-verified.id')) {
      console.log('📱 Fetching REAL addresses for SELF-verified user:', userAuth.userId);
      
      // Get addresses from JWT token first, then fallback to database
      let ethAddress = (userAuth as any).ethAddress;
      let solAddress = (userAuth as any).solAddress;
      
      // If not in JWT, get from database
      if (!ethAddress || !solAddress) {
        const nullifierId = '0x' + userAuth.userId.replace('0x', '').padEnd(64, '0');
        try {
          const dbUser = await dbService.getSelfVerificationByNullifier(nullifierId);
          if (dbUser) {
            ethAddress = dbUser.ethAddress;
            solAddress = dbUser.solAddress;
            console.log('✅ Retrieved REAL addresses from database:', { ethAddress, solAddress });
          }
        } catch (dbError) {
          console.log('⚠️ Could not fetch from database:', dbError);
        }
      }
      
      return c.json({
        ethereum: {
          address: ethAddress || "0x" + userAuth.userId.replace('0x', '').padEnd(40, '0'),
          network: "mainnet", // ETH mainnet addresses for REAL transactions
          chainId: 1,
        },
        solana: solAddress ? {
          address: solAddress,
          network: "mainnet-beta", // SOL mainnet addresses for REAL transactions
        } : null,
      });
    }
    
    // Regular database user
    const user = await dbService.findUserById(userAuth.userId);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      ethereum: {
        address: user.publicAddress,
        network: "sepolia",
        chainId: 11155111,
      },
      solana: user.publicAddressSolana
        ? {
            address: user.publicAddressSolana,
            network: "devnet",
          }
        : null,
    });
  } catch (error) {
    console.error("Error getting addresses:", error);
    return c.json({ error: "Failed to get addresses" }, 500);
  }
});

// Get user's token portfolio
app.get("/user/portfolio", authMiddleware, async (c) => {
  try {
    const userAuth = c.get("user");
    
    // Check if this is a SELF-verified user
    if (userAuth.email.includes('@pokket-verified.id')) {
      console.log('💼 Creating mock portfolio for SELF-verified user:', userAuth.userId);
      
      // Create a mock portfolio for SELF-verified users
      const mockAddress = "0x" + userAuth.userId.replace('0x', '').padEnd(40, '0');
      
      try {
        const portfolio = await tokenService.getPortfolio(mockAddress);
        return c.json({ portfolio });
      } catch (error) {
        // If token service fails, return empty portfolio
        console.log('📋 Returning empty portfolio for SELF user');
        return c.json({
          portfolio: {
            totalValue: "0.00",
            totalValueUSD: 0,
            ethBalance: "0.000000",
            ethValueUSD: 0,
            tokens: [],
            address: mockAddress
          }
        });
      }
    }
    
    // Regular database user
    const user = await dbService.findUserById(userAuth.userId);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get portfolio data using the token service
    const portfolio = await tokenService.getPortfolio(user.publicAddress);

    return c.json({
      portfolio,
    });
  } catch (error) {
    console.error("Error getting portfolio:", error);
    return c.json({ error: "Failed to get portfolio data" }, 500);
  }
});

// Get user's ETH balance only
app.get("/user/eth-balance", authMiddleware, async (c) => {
  try {
    const userAuth = c.get("user");
    const user = await dbService.findUserById(userAuth.userId);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const ethBalance = await tokenService.getETHBalance(user.publicAddress);

    return c.json({
      address: user.publicAddress,
      ...ethBalance,
    });
  } catch (error) {
    console.error("Error getting ETH balance:", error);
    return c.json({ error: "Failed to get ETH balance" }, 500);
  }
});

// Get user's token balances only
app.get("/user/tokens", authMiddleware, async (c) => {
  try {
    const userAuth = c.get("user");
    const user = await dbService.findUserById(userAuth.userId);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const tokens = await tokenService.getTokenBalances(user.publicAddress);

    return c.json({
      address: user.publicAddress,
      tokens,
    });
  } catch (error) {
    console.error("Error getting token balances:", error);
    return c.json({ error: "Failed to get token balances" }, 500);
  }
});

// Search users by name or email
app.get("/users/search", authMiddleware, async (c) => {
  try {
    const userAuth = c.get("user") as any;
    const query = c.req.query("q");

    if (!query) {
      console.log("Search request without query parameter");
      return c.json({ users: [], query: "", error: "Search query is required" });
    }

    if (query.length < 2) {
      console.log("Search query too short:", query);
      return c.json({ users: [], query, error: "Search query must be at least 2 characters" });
    }

    const users = await dbService.searchUsers(query, userAuth.userId);

    return c.json({
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        publicAddress: user.publicAddress,
        publicAddressSolana: user.publicAddressSolana,
      })),
      query,
    });
  } catch (error) {
    console.error("Error searching users:", error);
    return c.json({ users: [], query: "", error: "Search temporarily unavailable" });
  }
});

// Get recent contacts for the user
app.get("/users/recent", authMiddleware, async (c) => {
  try {
    const userAuth = c.get("user") as any;

    const recentContacts = await dbService.getRecentContacts(userAuth.userId);

    return c.json({
      users: recentContacts.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        publicAddress: user.publicAddress,
        publicAddressSolana: user.publicAddressSolana,
      })),
    });
  } catch (error) {
    console.error("Error getting recent contacts:", error);
    return c.json({ users: [], error: "Recent contacts temporarily unavailable" });
  }
});

// Debug endpoint to get detailed token info
app.get("/debug/user/address", authMiddleware, async (c) => {
  try {
    const userAuth = c.get("user");
    const user = await dbService.findUserById(userAuth.userId);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get ETH balance for debugging
    const ethBalance = await tokenService.getETHBalance(user.publicAddress);

    return c.json({
      address: user.publicAddress,
      ethBalance,
      message:
        "Use this address to check transactions on https://sepolia.etherscan.io",
    });
  } catch (error) {
    console.error("Error getting debug info:", error);
    return c.json({ error: "Failed to get debug info" }, 500);
  }
});

// Check balance for a specific token address
app.post("/user/check-token", authMiddleware, async (c) => {
  try {
    const userAuth = c.get("user");
    const user = await dbService.findUserById(userAuth.userId);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const { tokenAddress } = await c.req.json();

    if (!tokenAddress) {
      return c.json({ error: "Token address is required" }, 400);
    }

    const token = await tokenService.getCustomTokenBalance(
      tokenAddress,
      user.publicAddress
    );

    return c.json({
      address: user.publicAddress,
      tokenAddress,
      token,
    });
  } catch (error) {
    console.error("Error checking custom token:", error);
    return c.json({ error: "Failed to check token" }, 500);
  }
});

// Admin endpoint for poller service
app.get("/admin/users-with-solana", async (c) => {
  try {
    // Simple admin authentication
    const authHeader = c.req.header("Authorization");
    const adminKey = process.env.ADMIN_API_KEY || "admin-key";

    if (!authHeader || !authHeader.includes(adminKey)) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get all users with Solana addresses
    const users = await dbService.getAllUsersWithSolana();

    return c.json({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        publicAddress: user.publicAddress,
        publicAddressSolana: user.publicAddressSolana,
        encryptedPrivateKeySolana: user.encryptedPrivateKeySolana,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      })),
      count: users.length,
    });
  } catch (error) {
    console.error("Error getting users with Solana:", error);
    return c.json({ error: "Failed to get users" }, 500);
  }
});

// Mount swap routes
app.route("/swap", swapApp);

// Debug endpoint to check user verification by address
app.get("/debug/user/verification/:address", async (c) => {
  try {
    const address = c.req.param("address");

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return c.json({ error: "Invalid Ethereum address" }, 400);
    }

    // For now, return a mock response since verification system is not fully implemented
    return c.json({
      address,
      user: {
        publicAddress: address,
        isVerified: false,
        message: "Verification system not fully implemented yet"
      },
      message: "Debug endpoint - verification system in development",
    });
  } catch (error) {
    console.error("Error getting user verification:", error);
    return c.json({ error: "Failed to get user verification" }, 500);
  }
});

// Public endpoint to check receiver verification status for payments
app.get("/user/receiver-verification/:address", async (c) => {
  const address = c.req.param("address");

  try {
    if (!address || !/^0x[a-fA-F0-9]{40}$/i.test(address)) {
      return c.json({ error: "Invalid Ethereum address" }, 400);
    }

    // For now, return a mock response since verification system is not fully implemented
    return c.json({
      address,
      isVerified: false,
      message: "Verification system not fully implemented yet",
      receiverInfo: {
        name: "Unknown User", // Default name
      },
    });
  } catch (error) {
    console.error("Error getting receiver verification:", error);
    return c.json(
      {
        address,
        isVerified: false,
        error: "Failed to check verification status",
      },
      500
    );
  }
});

// Generate JWT for SELF-verified users
app.post("/auth/self-verified", async (c) => {
  try {
    const { nullifierId, ethAddress, solAddress, name } = await c.req.json();

    if (!nullifierId || !nullifierId.startsWith('0x')) {
      return c.json({ error: "Invalid nullifier ID" }, 400);
    }

    console.log('🔑 Generating JWT for SELF-verified user:', nullifierId);

    // Get the verification data from database 
    let verifiedUserData = null;
    try {
      verifiedUserData = await dbService.getSelfVerificationByNullifier(nullifierId);
      if (verifiedUserData) {
        console.log('📋 Retrieved verification data from database:', {
          name: verifiedUserData.name,
          ethAddress: verifiedUserData.ethAddress,
          solAddress: verifiedUserData.solAddress,
          isVerified: verifiedUserData.isVerified
        });
      } else {
        console.log('⚠️ No verification data found in database for nullifier:', nullifierId);
      }
    } catch (dbError) {
      console.log('⚠️ Could not fetch verification data from database:', dbError);
    }

    // Create user info for JWT - prefer database data, fallback to provided data
    const userId = nullifierId.slice(0, 16); // Use part of nullifier as user ID
    const email = `${userId}@pokket-verified.id`;
    const userName = verifiedUserData?.name || name || "SELF Verified User";
    const userEthAddress = verifiedUserData?.ethAddress || ethAddress;
    const userSolAddress = verifiedUserData?.solAddress || solAddress;
    
    console.log('🔑 Using addresses for JWT:', { userEthAddress, userSolAddress });

    // Generate proper JWT token with additional data in payload
    const authService = new AuthService();
    const token = authService.generateJWT(userId, email, {
      ethAddress: userEthAddress,
      solAddress: userSolAddress,
      name: userName,
      nullifierId: nullifierId
    });

    console.log('✅ JWT generated successfully for SELF user:', userName);

    return c.json({
      success: true,
      token,
      user: {
        id: userId,
        email,
        name: userName,
        isVerified: true,
        publicAddress: userEthAddress,
        solAddress: userSolAddress,
        nullifierId: nullifierId
      }
    });

  } catch (error) {
    console.error('❌ Error generating SELF JWT:', error);
    return c.json({ 
      success: false, 
      error: "Failed to generate authentication token" 
    }, 500);
  }
});

// Store SELF verification data
app.post("/verification/store", async (c) => {
  try {
    const {
      nullifierId,
      ethAddress,
      solAddress,
      name,
      nationality,
      age,
      issuingState,
      transactionHash
    } = await c.req.json();

    console.log('📥 Storing SELF verification with REAL mainnet addresses:', {
      nullifierId,
      ethAddress,
      solAddress,
      name,
      nationality,
      age,
      issuingState,
      transactionHash
    });

    // Store in database with REAL wallet addresses for transactions
    const result = await dbService.storeSelfVerification({
      nullifierId,
      ethAddress,
      solAddress, 
      name,
      nationality,
      age,
      issuingState,
      transactionHash,
      verifiedAt: new Date(),
      isVerified: true
    });

    console.log('✅ SELF verification stored with real addresses for transactions');

    return c.json({
      success: true,
      message: 'Verification data stored successfully',
      data: {
        nullifierId,
        ethAddress,
        name,
        nationality,
        age,
        issuingState,
        transactionHash
      }
    });

  } catch (error) {
    console.error('❌ Error storing verification data:', error);
    return c.json({ 
      success: false, 
      error: "Failed to store verification data" 
    }, 500);
  }
});

// Get verification data
app.get("/verification/data/:address", async (c) => {
  try {
    const address = c.req.param("address");
    
    console.log('📋 Getting verification data for address:', address);

    // TODO: Get from database
    // const verificationData = await dbService.getVerificationByAddress(address);
    
    // For now, return mock data
    return c.json({
      success: true,
      data: {
        nullifierId: "0x123...",
        ethAddress: address,
        name: "User Name",
        nationality: "IN",
        age: 25,
        issuingState: "Maharashtra",
        isVerified: true
      }
    });

  } catch (error) {
    console.error('❌ Error getting verification data:', error);
    return c.json({ 
      success: false, 
      error: "Failed to get verification data" 
    }, 500);
  }
});

// Mount verification routes
app.route("/verification", verificationRoutes);

// Error handling
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

// Start server
const port = process.env.PORT || 3001;

console.log(`🚀 Server starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
