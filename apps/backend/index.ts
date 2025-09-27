// Load environment variables
import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { AuthService } from "./services/auth";
import { TokenService } from "./services/tokens";
import { dbService } from "./services/database";
import { swapApp } from "./routes/swap";
import { verificationRoutes } from "./routes/verification";

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
    origin: ["http://localhost:3000", "http://localhost:3001"],
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
        // Verification status and data
        isVerified: user.isVerified,
        verifiedName: user.verifiedName,
        verifiedNationality: user.verifiedNationality,
        verifiedAge: user.verifiedAge,
        verifiedDocumentType: user.verifiedDocumentType,
        verifiedAt: user.verifiedAt,
        verificationTxHash: user.verificationTxHash,
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

    const user = await dbService.getUserVerificationByAddress(address);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      address,
      user,
      message: "User verification data retrieved successfully",
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

    // Normalize address to match database format
    const normalizedAddress = address.toLowerCase();
    const user = await dbService.getUserVerificationByAddress(address);

    if (!user) {
      return c.json({
        address,
        isVerified: false,
        message: "Receiver not found in our system",
      });
    }

    return c.json({
      address,
      isVerified: user.isVerified || false,
      receiverInfo: user.isVerified
        ? {
            name: user.verifiedName || user.name,
            nationality: user.verifiedNationality,
            age: user.verifiedAge,
            documentType: user.verifiedDocumentType,
            verifiedAt: user.verifiedAt,
          }
        : {
            name: user.name, // Show basic name even if not verified
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
