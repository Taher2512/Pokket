// Load environment variables first
import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { Contract, JsonRpcProvider, Wallet, AbiCoder } from "ethers";
import { DatabaseService } from "../services/database.js";
import { AuthService } from "../services/auth.js";

// Celo Alfajores testnet configuration
const CELO_ALFAJORES_RPC =
  process.env.CELO_ALFAJORES_RPC_URL ||
  "https://alfajores-forno.celo-testnet.org";
const VERIFICATION_CONTRACT_ADDRESS =
  process.env.VERIFICATION_CONTRACT_ADDRESS || "";

// PokketSelfVerification contract ABI (SELF-compatible contract)
const VERIFICATION_ABI = [
  "function isUserVerified(address user) view returns (bool)",
  "function getVerificationByAddress(address ethAddress) view returns (tuple(bytes32 nullifierId, address ethAddress, address solAddress, string name, string nationality, uint256 age, string issuingState, uint256 verifiedAt, bool isVerified))",
  "function getVerificationByNullifier(bytes32 nullifierId) view returns (tuple(bytes32 nullifierId, address ethAddress, address solAddress, string name, string nationality, uint256 age, string issuingState, uint256 verifiedAt, bool isVerified))",
  "function getNullifierByAddress(address ethAddress) view returns (bytes32)",
  "function getAddressByNullifier(bytes32 nullifierId) view returns (address)",
  "function onVerificationSuccess(tuple(bytes32 userIdentifier, bytes disclosedAttributes, uint256 timestamp, bytes32 configId) output, bytes userData) external",
  "function setVerificationConfigId(bytes32 configId) external",
  "function setSelfHubAddress(address hubAddress) external", 
  "function getSelfHubAddress() external view returns (address)",
  "function owner() view returns (address)",
];
// ...existing code...

// ...existing code...

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
    origin: "*", // Allow all origins for deployment
    credentials: true,
  })
);

// Create provider for Celo Alfajores
const provider = new JsonRpcProvider(CELO_ALFAJORES_RPC);

/**
 * Write verification to blockchain using user's private key
 * NOTE: Currently disabled due to database dependencies that need to be updated
 */
async function writeVerificationToBlockchain(userAddress: string) {
  return {
    success: false,
    error: "This endpoint is temporarily disabled - use /manual-verify instead",
    suggestion: "Use POST /verification/manual-verify for testing purposes"
  };
}

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
    // Query the smart contract for verification details using correct method
    const verificationData = await contract.getVerificationByAddress?.(address);

    const status: VerificationStatus = {
      isVerified: verificationData.isVerified || false,
      verificationTimestamp: verificationData.verifiedAt > 0 ? Number(verificationData.verifiedAt) : undefined,
      metadata: verificationData.isVerified ? {
        nullifierId: verificationData.nullifierId,
        name: verificationData.name,
        nationality: verificationData.nationality,
        age: Number(verificationData.age),
        issuingState: verificationData.issuingState,
        ethAddress: verificationData.ethAddress,
        solAddress: verificationData.solAddress
      } : undefined,
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
    const statusMap: Record<string, VerificationStatus> = {};

    // Check each address individually since we don't have a batch function
    for (const address of addresses) {
      try {
        const isVerified = await contract.isUserVerified?.(address);
        
        if (isVerified) {
          // Get full verification details
          const verificationData = await contract.getVerificationByAddress?.(address);
          statusMap[address] = {
            isVerified: true,
            verificationTimestamp: Number(verificationData.verifiedAt),
            metadata: {
              nullifierId: verificationData.nullifierId,
              name: verificationData.name,
              nationality: verificationData.nationality,
              age: Number(verificationData.age),
              issuingState: verificationData.issuingState,
              ethAddress: verificationData.ethAddress,
              solAddress: verificationData.solAddress
            },
          };
        } else {
          statusMap[address] = { isVerified: false };
        }
      } catch (addressError) {
        console.error(`Error checking address ${address}:`, addressError);
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
    const contractOwner = await contract.owner?.();

    return c.json({
      contractOwner,
      contractAddress: VERIFICATION_CONTRACT_ADDRESS,
      network: "celo-alfajores",
      message: "Contract stats available - owner information retrieved"
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

/**
 * POST /api/verification/simulate-callback
 * Simulate a Self Protocol callback for testing (since you're using SimplePokketIdentityVerification)
 */
app.post("/simulate-callback", async (c) => {
  try {
    const { userAddress, verificationData } = await c.req.json();

    if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return c.json({ error: "Invalid user address" }, 400);
    }

    console.log(`🧪 Simulating Self Protocol verification for: ${userAddress}`);

    // Use the owner's private key to verify the user
    const ownerPrivateKey = process.env.VERIFICATION_PRIVATE_KEY;

    if (!ownerPrivateKey) {
      return c.json(
        {
          error: "Owner private key not configured",
          suggestion: "Add VERIFICATION_PRIVATE_KEY to your .env file",
        },
        500
      );
    }

    // Create wallet using owner's private key
    const ownerWallet = new Wallet(ownerPrivateKey, provider);

    // Contract ABI for SimplePokketIdentityVerification
    const contractABI = [
      "function verifyUser(address _user, bytes _metadata) external",
      "function isUserVerified(address user) view returns (bool)",
    ];

    const contract = new Contract(
      VERIFICATION_CONTRACT_ADDRESS,
      contractABI,
      ownerWallet
    );

    // Check if already verified
    const isAlreadyVerified = await contract.isUserVerified?.(userAddress);

    if (isAlreadyVerified) {
      return c.json({
        success: true,
        message: "User already verified on blockchain",
        userAddress,
      });
    }

    console.log(`💾 Simulating verification data for ${userAddress}`);

    // Generate a mock nullifier ID for the simulation
    const nullifierId = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    console.log(`📝 Calling manualVerifyUser for ${userAddress}...`);

    // Call the verification function with provided or default data
    const tx = await contract.manualVerifyUser?.(
      nullifierId,
      userAddress,
      userAddress, // Using same address for SOL address in testing
      verificationData?.name || "Simulated User",
      verificationData?.nationality || "IN",
      verificationData?.age || 25,
      verificationData?.issuingState || "Maharashtra"
    );
    console.log(`⏳ Transaction sent: ${tx?.hash}`);

    // Wait for confirmation
    const receipt = await tx?.wait?.();
    console.log(`✅ Verification confirmed in block ${receipt?.blockNumber}`);

    console.log(`💾 Transaction hash: ${tx?.hash}`);

    return c.json({
      success: true,
      txHash: tx?.hash,
      blockNumber: receipt?.blockNumber,
      message: "Simulated verification completed successfully",
      userAddress,
    });
  } catch (error) {
    console.error("Error in simulated verification:", error);
    return c.json(
      {
        error: "Failed to process simulated verification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /api/verification/callback
 * Handle Self Protocol verification callback (currently not working with SimplePokketIdentityVerification)
 */
app.post("/callback", async (c) => {
  console.log(
    "⚠️ Self Protocol callback received, but SimplePokketIdentityVerification doesn't support direct callbacks"
  );
  console.log("Use /simulate-callback or /manual-verify instead for testing");

  return c.json(
    {
      error:
        "Self Protocol callbacks not supported with SimplePokketIdentityVerification contract",
      suggestion:
        "Use POST /verification/simulate-callback or /verification/manual-verify instead",
    },
    400
  );
});

/**
 * POST /api/verification/blockchain-verify
 * Manually write verification directly to blockchain using user's own private key
 */
app.post("/blockchain-verify", async (c) => {
  try {
    const { userAddress } = await c.req.json();

    if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return c.json({ error: "Invalid Ethereum address" }, 400);
    }

    console.log(
      `� MANUAL: Writing verification for ${userAddress} to blockchain...`
    );

    const result = await writeVerificationToBlockchain(userAddress);

    return c.json({
      success: result.success,
      message: result.success
        ? `Verification written to blockchain for ${userAddress}`
        : `Failed to write verification: ${result.error}`,
      result,
    });
  } catch (error) {
    console.error("Error in manual blockchain verification:", error);
    return c.json(
      {
        error: "Failed to write blockchain verification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /api/verification/set-config-id
 * Set the Self Protocol config ID in the smart contract (owner only)
 */
app.post("/set-config-id", async (c) => {
  try {
    const { configId, ownerAddress } = await c.req.json();

    if (
      !configId ||
      typeof configId !== "string" ||
      !configId.startsWith("0x") ||
      configId.length !== 66
    ) {
      return c.json(
        { error: "Invalid configId. Must be a 32-byte hex string." },
        400
      );
    }

    if (!ownerAddress || !/^0x[a-fA-F0-9]{40}$/.test(ownerAddress)) {
      return c.json({ error: "Invalid ownerAddress." }, 400);
    }

    if (!VERIFICATION_CONTRACT_ADDRESS) {
      return c.json({ error: "Contract address not configured" }, 500);
    }

    console.log(
      `🔧 Setting config ID ${configId} for contract ${VERIFICATION_CONTRACT_ADDRESS}`
    );

    // Use the private key from environment (this is the owner key)
    const ownerPrivateKey = process.env.VERIFICATION_PRIVATE_KEY;

    if (!ownerPrivateKey) {
      return c.json(
        {
          error: "Owner private key not configured",
          suggestion: "Set VERIFICATION_PRIVATE_KEY in .env file",
        },
        500
      );
    }

    // Create wallet using owner's private key
    const ownerWallet = new Wallet(ownerPrivateKey, provider);

    console.log(`👤 Using contract owner: ${ownerWallet.address}`);

    // Verify the wallet address matches (security check)
    if (ownerWallet.address.toLowerCase() !== ownerAddress.toLowerCase()) {
      console.error(
        `Address mismatch: wallet=${ownerWallet.address}, requested=${ownerAddress}`
      );
      return c.json(
        { error: "Private key does not match the provided owner address" },
        400
      );
    }

    const contract = new Contract(
      VERIFICATION_CONTRACT_ADDRESS,
      VERIFICATION_ABI,
      ownerWallet
    );
    const tx = await contract.setConfigId?.(configId);

    console.log(`⏳ Transaction sent: ${tx?.hash}`);

    const receipt = await tx?.wait?.();
    console.log(`✅ Config ID updated! Block: ${receipt?.blockNumber}`);

    return c.json({
      success: true,
      txHash: tx?.hash,
      blockNumber: receipt?.blockNumber,
      message: "Config ID updated successfully.",
      ownerAddress: ownerWallet.address,
    });
  } catch (error) {
    console.error("Error setting config ID:", error);
    return c.json(
      {
        error: "Failed to set config ID",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /api/verification/manual-verify
 * Manually verify a user using contract owner (for testing)
 */
app.post("/manual-verify", async (c) => {
  try {
    const { userAddress } = await c.req.json();

    if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return c.json({ error: "Invalid Ethereum address" }, 400);
    }

    if (!VERIFICATION_CONTRACT_ADDRESS) {
      return c.json({ error: "Contract address not configured" }, 500);
    }

    console.log(`🔧 Manually verifying user: ${userAddress}`);

    // Use the private key from environment (this is the owner key)
    const ownerPrivateKey = process.env.VERIFICATION_PRIVATE_KEY;

    if (!ownerPrivateKey) {
      return c.json(
        {
          error: "Owner private key not configured",
          suggestion: "Set VERIFICATION_PRIVATE_KEY in .env file",
        },
        500
      );
    }

    // Create wallet using owner's private key
    const ownerWallet = new Wallet(ownerPrivateKey, provider);

    console.log(`👤 Using contract owner: ${ownerWallet.address}`);

    const contract = new Contract(
      VERIFICATION_CONTRACT_ADDRESS,
      VERIFICATION_ABI,
      ownerWallet
    );

    // Check if already verified
    const isAlreadyVerified = await contract.isUserVerified?.(userAddress);

    if (isAlreadyVerified) {
      return c.json({
        success: true,
        message: "User already verified",
        userAddress,
      });
    }

    // Generate a mock nullifier ID for testing
    const nullifierId = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    console.log(`📝 Calling manualVerifyUser for ${userAddress}...`);

    // Estimate gas for manual verification (SELF callback simulation)
    let gasEstimate = 400000n; // Higher gas for more complex SELF callback
    let gasPrice;

    try {
      gasPrice = await provider.getFeeData();
      console.log(`💰 Current gas price: ${gasPrice.gasPrice?.toString()} wei`);
    } catch (gasError) {
      console.error(
        "⚠️ Gas estimation failed for manual verification:",
        gasError
      );
      gasPrice = { gasPrice: 1000000000n };
    }

    // Since this is the new SELF contract, we simulate the SELF callback
    // In reality, SELF protocol would call onVerificationSuccess automatically
    
    // Create mock SELF verification output structure
    const abiCoder = new AbiCoder();
    const mockSelfOutput = {
      userIdentifier: nullifierId,
      disclosedAttributes: abiCoder.encode(
        ["string", "string", "uint256", "string"],
        ["Test User", "IN", 25, "Maharashtra"]
      ),
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
      configId: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };
    
    // Create user data (ETH and SOL addresses)
    const userData = abiCoder.encode(
      ["address", "address"], 
      [userAddress, userAddress]
    );

    if (!contract.onVerificationSuccess) {
      throw new Error("Contract method onVerificationSuccess not found");
    }

    const tx = await contract.onVerificationSuccess(
      mockSelfOutput,
      userData,
      {
        gasLimit: (gasEstimate * 120n) / 100n,
        gasPrice: gasPrice?.gasPrice || 1000000000n,
      }
    );
    console.log(`⏳ Transaction sent: ${tx?.hash}`);

    // Wait for confirmation
    const receipt = await tx?.wait?.();
    console.log(`✅ Transaction confirmed in block ${receipt?.blockNumber}`);

    return c.json({
      success: true,
      txHash: tx?.hash,
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed?.toString(),
      message: `User ${userAddress} successfully verified on blockchain!`,
    });
  } catch (error) {
    console.error("Error in manual verification:", error);
    return c.json(
      {
        error: "Failed to manually verify user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /api/verification/user/:nullifierId
 * Get user verification details by nullifier ID
 */
app.get("/user/:nullifierId", async (c) => {
  try {
    const nullifierId = c.req.param("nullifierId");

    console.log(`🔍 Getting user details for nullifier: ${nullifierId}`);

    if (!nullifierId || !nullifierId.startsWith("0x")) {
      console.log(`❌ Invalid nullifier ID format: ${nullifierId}`);
      return c.json({ error: "Invalid nullifier ID format" }, 400);
    }

    if (!VERIFICATION_CONTRACT_ADDRESS) {
      console.log(`❌ Contract address not configured`);
      return c.json({ error: "Contract address not configured" }, 500);
    }

    const contract = new Contract(
      VERIFICATION_CONTRACT_ADDRESS,
      VERIFICATION_ABI,
      provider
    );

    try {
      // Get verification data by nullifier ID
      const verificationData = await contract.getVerificationByNullifier?.(nullifierId);
      console.log(`📋 Contract returned:`, {
        isVerified: verificationData?.isVerified,
        name: verificationData?.name,
        ethAddress: verificationData?.ethAddress
      });

      if (!verificationData || !verificationData.isVerified) {
        console.log(`⚠️ User not found or not verified for nullifier: ${nullifierId}`);
        // Return a mock user for SELF-verified users who haven't been stored in contract yet
        return c.json({
          success: true,
          user: {
            nullifierId: nullifierId,
            ethAddress: null,
            solAddress: null,
            name: "SELF Verified User",
            nationality: "UNKNOWN",
            age: 0,
            issuingState: "UNKNOWN",
            verifiedAt: Date.now(),
            isVerified: false, // Not stored in contract yet
          }
        });
      }

      return c.json({
        success: true,
        user: {
          nullifierId: verificationData.nullifierId,
          ethAddress: verificationData.ethAddress,
          solAddress: verificationData.solAddress,
          name: verificationData.name,
          nationality: verificationData.nationality,
          age: Number(verificationData.age),
          issuingState: verificationData.issuingState,
          verifiedAt: Number(verificationData.verifiedAt),
          isVerified: verificationData.isVerified,
        }
      });
    } catch (contractError) {
      console.error(`❌ Contract call failed for nullifier ${nullifierId}:`, contractError);
      // Return mock data for SELF-verified users when contract fails
      return c.json({
        success: true,
        user: {
          nullifierId: nullifierId,
          ethAddress: null,
          solAddress: null,
          name: "SELF Verified User",
          nationality: "UNKNOWN",
          age: 0,
          issuingState: "UNKNOWN",
          verifiedAt: Date.now(),
          isVerified: false,
        }
      });
    }

  } catch (error) {
    console.error("❌ Error getting user by nullifier ID:", error);
    return c.json(
      {
        error: "Failed to get user details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /api/verification/balance/:address
 * Check user's Celo balance for gas fees
 */
app.get("/balance/:address", async (c) => {
  try {
    const address = c.req.param("address");

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return c.json({ error: "Invalid Ethereum address" }, 400);
    }

    const balance = await provider.getBalance(address);
    const balanceInCelo = Number(balance) / 1e18;

    return c.json({
      address,
      balance: balance.toString(),
      balanceInCelo: balanceInCelo.toFixed(6),
      network: "celo-alfajores",
      hasGas: balance > 0n,
    });
  } catch (error) {
    console.error("Error checking balance:", error);
    return c.json(
      {
        error: "Failed to check balance",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Refresh endpoint will be added later with proper authentication

export { app as verificationRoutes };
