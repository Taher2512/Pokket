// Load environment variables first
import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { Contract, JsonRpcProvider } from "ethers";

// Celo Alfajores testnet configuration
const CELO_ALFAJORES_RPC =
  process.env.CELO_ALFAJORES_RPC_URL ||
  "https://alfajores-forno.celo-testnet.org";
const VERIFICATION_CONTRACT_ADDRESS =
  process.env.VERIFICATION_CONTRACT_ADDRESS || "";

// PokketIdentityVerification contract ABI (minimal interface)
const VERIFICATION_ABI = [
  "function isUserVerified(address user) view returns (bool)",
  "function getUserVerificationDetails(address user) view returns (bool isVerified, uint256 timestamp, bytes metadata)",
  "function totalVerifiedUsers() view returns (uint256)",
  "function getContractStats() view returns (uint256 totalUsers, bytes32 currentConfig, address contractOwner)",
];

interface VerificationStatus {
  isVerified: boolean;
  verificationTimestamp?: number;
  metadata?: any;
  txHash?: string;
}

const app = new Hono();

// Enable CORS for frontend requests
app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Create provider for Celo Alfajores
const provider = new JsonRpcProvider(CELO_ALFAJORES_RPC);

// Initialize contract only if address is configured
function getVerificationContract() {
  if (!VERIFICATION_CONTRACT_ADDRESS) {
    throw new Error("Verification contract address not configured");
  }
  return new Contract(
    VERIFICATION_CONTRACT_ADDRESS,
    VERIFICATION_ABI,
    provider
  );
}

/**
 * GET /api/verification/status/:address
 * Check verification status for a specific address
 */
app.get("/status/:address", async (c) => {
  const address = c.req.param("address");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return c.json({ error: "Invalid Ethereum address" }, 400);
  }

  if (!VERIFICATION_CONTRACT_ADDRESS) {
    return c.json(
      {
        error: "Verification contract not configured",
        isVerified: false,
      },
      500
    );
  }

  try {
    const contract = getVerificationContract();
    // Query the smart contract for verification details
    const [isVerified, timestamp, metadata] =
      await contract.getUserVerificationDetails(address);

    const status: VerificationStatus = {
      isVerified,
      verificationTimestamp: timestamp > 0 ? Number(timestamp) : undefined,
      metadata: metadata && metadata.length > 0 ? metadata : undefined,
    };

    return c.json(status);
  } catch (error) {
    console.error("Error checking verification status:", error);

    // Return default unverified status on contract error
    return c.json(
      {
        isVerified: false,
        error: "Failed to check verification status",
      },
      500
    );
  }
});

/**
 * GET /api/verification/batch-status
 * Check verification status for multiple addresses
 */
app.post("/batch-status", async (c) => {
  const { addresses } = await c.req.json();

  if (!Array.isArray(addresses)) {
    return c.json({ error: "Addresses must be an array" }, 400);
  }

  if (addresses.length === 0 || addresses.length > 50) {
    return c.json({ error: "Must provide 1-50 addresses" }, 400);
  }

  // Validate all addresses
  for (const address of addresses) {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return c.json({ error: `Invalid address: ${address}` }, 400);
    }
  }

  if (!VERIFICATION_CONTRACT_ADDRESS) {
    return c.json(
      {
        error: "Verification contract not configured",
      },
      500
    );
  }

  try {
    const contract = getVerificationContract();
    // Use contract's batch check function for efficiency
    const results = await contract.batchCheckVerification(addresses);

    const statusMap: Record<string, VerificationStatus> = {};

    // For each address, get detailed info if verified
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      const isVerified = results[i];

      if (isVerified) {
        // Get full details for verified users
        const [, timestamp, metadata] =
          await contract.getUserVerificationDetails(address);
        statusMap[address] = {
          isVerified: true,
          verificationTimestamp: Number(timestamp),
          metadata: metadata && metadata.length > 0 ? metadata : undefined,
        };
      } else {
        statusMap[address] = { isVerified: false };
      }
    }

    return c.json({ results: statusMap });
  } catch (error) {
    console.error("Error in batch verification check:", error);

    // Return all as unverified on error
    const statusMap: Record<string, VerificationStatus> = {};
    addresses.forEach((address: string) => {
      statusMap[address] = { isVerified: false };
    });

    return c.json(
      {
        results: statusMap,
        error: "Failed to check verification status",
      },
      500
    );
  }
});

/**
 * GET /api/verification/stats
 * Get contract statistics
 */
app.get("/stats", async (c) => {
  if (!VERIFICATION_CONTRACT_ADDRESS) {
    return c.json(
      {
        error: "Verification contract not configured",
      },
      500
    );
  }

  try {
    const contract = getVerificationContract();
    const [totalUsers, currentConfig, contractOwner] =
      await contract.getContractStats();

    return c.json({
      totalVerifiedUsers: Number(totalUsers),
      contractConfig: currentConfig,
      contractOwner,
      contractAddress: VERIFICATION_CONTRACT_ADDRESS,
      network: "celo-alfajores",
    });
  } catch (error) {
    console.error("Error fetching verification stats:", error);
    return c.json({ error: "Failed to fetch verification stats" }, 500);
  }
});

/**
 * GET /api/verification/config
 * Get verification configuration
 */
app.get("/config", async (c) => {
  return c.json({
    contractAddress: VERIFICATION_CONTRACT_ADDRESS,
    network: "celo-alfajores",
    rpcUrl: CELO_ALFAJORES_RPC,
    enabled: !!VERIFICATION_CONTRACT_ADDRESS,
    supportedDocuments: ["aadhar_card", "passport"],
    minimumAge: 18,
    features: {
      batchVerification: true,
      verificationTimestamps: true,
      metadataStorage: true,
    },
  });
});

// Refresh endpoint will be added later with proper authentication

export { app as verificationRoutes };
