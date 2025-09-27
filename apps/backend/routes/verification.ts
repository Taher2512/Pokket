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

// SimplePokketIdentityVerification contract ABI (updated interface)
const VERIFICATION_ABI = [
  "function isUserVerified(address user) view returns (bool)",
  "function getUserVerificationDetails(address user) view returns (bool isVerified, uint256 timestamp, bytes metadata)",
  "function totalVerifiedUsers() view returns (uint256)",
  "function getContractStats() view returns (uint256 totalUsers, bytes32 currentConfig, address contractOwner)",
  "function setConfigId(bytes32 _newConfigId) external",
  "function verifyUser(address _user, bytes _metadata) external",
  "function batchCheckVerification(address[] _users) view returns (bool[])",
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
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Create provider for Celo Alfajores
const provider = new JsonRpcProvider(CELO_ALFAJORES_RPC);

/**
 * Write verification to blockchain using user's private key
 */
async function writeVerificationToBlockchain(userAddress: string) {
  try {
    if (!VERIFICATION_CONTRACT_ADDRESS) {
      throw new Error("Contract address not configured");
    }

    console.log(`🔗 Writing verification for ${userAddress} to blockchain...`);

    // Use imported services
    const dbService = new DatabaseService();
    const authService = new AuthService();

    // Find user by their Ethereum address
    const user = await dbService.findUserByAddress(userAddress);
    if (!user) {
      return {
        success: false,
        error: `User with address ${userAddress} not found in database`,
        suggestion:
          "Make sure the user is registered and logged in at least once",
      };
    }

    // Decrypt the user's private key
    const userPrivateKey = authService.decryptPrivateKey(
      user.encryptedPrivateKey
    );

    console.log(`👤 Found user: ${user.email}`);
    console.log(`🔑 Using user's private key for transaction`);

    // Create wallet using user's private key
    const wallet = new Wallet(userPrivateKey, provider);

    // Verify the wallet address matches (security check)
    if (wallet.address.toLowerCase() !== userAddress.toLowerCase()) {
      console.error(
        `Address mismatch: wallet=${wallet.address}, requested=${userAddress}`
      );
      return {
        success: false,
        error: "Private key does not match the provided address",
      };
    }

    // Check user's balance for gas fees
    const balance = await provider.getBalance(userAddress);
    console.log(`💰 User balance: ${balance.toString()} wei`);

    if (balance === 0n) {
      return {
        success: false,
        error: "User has no balance for gas fees",
        suggestion:
          "User needs testnet CELO for gas fees. Visit https://faucet.celo.org/alfajores",
      };
    }

    // Contract ABI for calling onVerificationSuccess
    const contractABI = [
      "function onVerificationSuccess(bytes calldata verificationOutput, bytes calldata userData) external",
      "function isUserVerified(address user) view returns (bool)",
    ];

    const contract = new Contract(
      VERIFICATION_CONTRACT_ADDRESS,
      contractABI,
      wallet
    );
    const readOnlyContract = new Contract(
      VERIFICATION_CONTRACT_ADDRESS,
      contractABI,
      provider
    );

    // Check if already verified
    const isAlreadyVerified =
      await readOnlyContract.isUserVerified!(userAddress);

    if (isAlreadyVerified) {
      console.log(`ℹ️ User ${userAddress} is already verified on blockchain`);
      return {
        success: true,
        txHash: "already-verified",
        message: "User already verified on blockchain",
        userEmail: user.email,
      };
    }

    // Create verification data structure that Self Protocol would send
    const abiCoder = AbiCoder.defaultAbiCoder();

    // Encode verification output (mimics Self Protocol's GenericDiscloseOutputV2)
    const verificationOutput = abiCoder.encode(
      ["uint256", "bool", "uint256"], // userIdentifier, verified, timestamp
      [BigInt(userAddress), true, BigInt(Math.floor(Date.now() / 1000))]
    );

    // Encode user data
    const userData = abiCoder.encode(
      ["string", "string", "uint256"],
      ["auto-blockchain-verification", user.email, BigInt(Date.now())]
    );

    console.log(`📝 Calling onVerificationSuccess for ${user.email}...`);

    // Call the verification function
    const tx = await contract.onVerificationSuccess!(
      verificationOutput,
      userData
    );
    console.log(`⏳ Transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt?.blockNumber}`);

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed?.toString(),
      userEmail: user.email,
      message: `Verification successfully written to blockchain! User ${user.email} paid gas fees.`,
    };
  } catch (error) {
    console.error("Error writing to blockchain:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error writing to blockchain",
    };
  }
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
    // Query the smart contract for verification details
    const [isVerified, timestamp, metadata] =
      await contract.getUserVerificationDetails?.(address);

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
    const results = await contract.batchCheckVerification?.(addresses);

    const statusMap: Record<string, VerificationStatus> = {};

    // For each address, get detailed info if verified
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      const isVerified = results[i];

      if (isVerified) {
        // Get full details for verified users
        const [, timestamp, metadata] =
          await contract.getUserVerificationDetails?.(address);
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
      await contract.getContractStats?.();

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

/**
 * POST /api/verification/callback
 * Handle Self Protocol verification callback and automatically write to blockchain
 */
app.post("/callback", async (c) => {
  try {
    const body = await c.req.json();
    console.log(
      "📥 Self Protocol callback received:",
      JSON.stringify(body, null, 2)
    );

    // Extract user address from Self Protocol callback
    let userAddress = body.userAddress || body.user || body.address;

    // If not directly provided, try to extract from verification output
    if (!userAddress && body.userIdentifier) {
      // Convert userIdentifier to address format
      userAddress = `0x${body.userIdentifier.toString(16).padStart(40, "0")}`;
    }

    if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      console.log(
        "❌ Invalid or missing user address in Self Protocol callback"
      );
      return c.json({ error: "Invalid user address in callback data" }, 400);
    }

    console.log(
      `🔗 Self Protocol callback - triggering manual verification for: ${userAddress}`
    );

    // Use the owner's private key to verify the user
    const ownerPrivateKey = process.env.VERIFICATION_PRIVATE_KEY;

    if (!ownerPrivateKey) {
      throw new Error("Owner private key not configured");
    }

    // Create wallet using owner's private key
    const ownerWallet = new Wallet(ownerPrivateKey, provider);

    // Contract ABI for manual verification
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
      console.log(`✅ User ${userAddress} already verified on blockchain`);

      // Still update database with new verification data if user exists
      try {
        const { DatabaseService } = await import("../services/database");
        const dbService = new DatabaseService();

        const user = await dbService.findUserByAddress(userAddress);
        if (user) {
          // Extract verification data from callback
          const verificationData = {
            userAddress,
            name:
              body.disclosedData?.name ||
              body.userData?.name ||
              body.name ||
              null,
            nationality:
              body.disclosedData?.nationality ||
              body.userData?.nationality ||
              body.nationality ||
              null,
            dateOfBirth:
              body.disclosedData?.dateOfBirth ||
              body.userData?.dateOfBirth ||
              body.dateOfBirth ||
              null,
            age:
              body.disclosedData?.age || body.userData?.age || body.age || null,
            documentType:
              body.disclosedData?.documentType ||
              body.userData?.documentType ||
              body.documentType ||
              null,
            userIdentifier: body.userIdentifier || null,
          };

          await dbService.updateUserVerification(userAddress, {
            name: verificationData.name,
            nationality: verificationData.nationality,
            dateOfBirth: verificationData.dateOfBirth,
            age: verificationData.age,
            documentType: verificationData.documentType,
            selfUserIdentifier: verificationData.userIdentifier,
          });

          console.log(
            `💾 Updated existing user verification data in database for ${userAddress}`
          );

          return c.json({
            success: true,
            message:
              "User already verified on blockchain, database updated with new data",
            userAddress,
            verificationData: {
              name: verificationData.name,
              nationality: verificationData.nationality,
              age: verificationData.age,
              documentType: verificationData.documentType,
            },
          });
        }
      } catch (dbError) {
        console.error(
          "⚠️ Failed to update existing user verification data:",
          dbError
        );
      }

      return c.json({
        success: true,
        message: "User already verified on blockchain",
        userAddress,
      });
    }

    // Extract user verification data from Self Protocol callback
    // Self Protocol sends verification data in different possible formats:
    const verificationData = {
      userAddress,
      // Personal identity data from Self Protocol
      name:
        body.disclosedData?.name || body.userData?.name || body.name || null,
      nationality:
        body.disclosedData?.nationality ||
        body.userData?.nationality ||
        body.nationality ||
        null,
      dateOfBirth:
        body.disclosedData?.dateOfBirth ||
        body.userData?.dateOfBirth ||
        body.dateOfBirth ||
        null,
      age: body.disclosedData?.age || body.userData?.age || body.age || null,
      documentType:
        body.disclosedData?.documentType ||
        body.userData?.documentType ||
        body.documentType ||
        null,
      documentNumber:
        body.disclosedData?.documentNumber ||
        body.userData?.documentNumber ||
        body.documentNumber ||
        null,

      // Self Protocol specific data
      userIdentifier: body.userIdentifier || null,
      verificationProof: body.verificationProof || body.proof || null,
      verificationOutput: body.verificationOutput || null,

      // Metadata
      verifiedAt: Date.now(),
      method: "self-protocol-callback",
      platform: "pokket",
      selfProtocolConfig: body.configId || null,
      rawCallbackData: body, // Store full callback for debugging
    };

    console.log(`👤 User verification data extracted:`, {
      name: verificationData.name,
      nationality: verificationData.nationality,
      age: verificationData.age,
      documentType: verificationData.documentType,
      userIdentifier: verificationData.userIdentifier,
    });

    // Store verification data in database
    try {
      const { DatabaseService } = await import("../services/database");
      const dbService = new DatabaseService();

      await dbService.updateUserVerification(userAddress, {
        name: verificationData.name,
        nationality: verificationData.nationality,
        dateOfBirth: verificationData.dateOfBirth,
        age: verificationData.age,
        documentType: verificationData.documentType,
        selfUserIdentifier: verificationData.userIdentifier,
        // Will add txHash after blockchain transaction
      });

      console.log(`💾 Verification data stored in database for ${userAddress}`);
    } catch (dbError) {
      console.error("⚠️ Failed to store verification data in DB:", dbError);
      // Continue with blockchain verification even if DB storage fails
    }

    // Create enhanced metadata for blockchain storage
    const metadataJson = JSON.stringify(verificationData);
    const metadata = new TextEncoder().encode(metadataJson);

    console.log(
      `📝 Calling verifyUser for ${userAddress} via Self Protocol callback...`
    );

    // Estimate gas and get current gas price for Celo network
    let gasEstimate = 200000n; // Default gas limit
    let gasPrice;

    try {
      const estimatedGas = await contract.verifyUser?.estimateGas(
        userAddress,
        metadata
      );
      gasPrice = await provider.getFeeData();

      if (estimatedGas) {
        gasEstimate = estimatedGas;
        console.log(`⛽ Gas estimate: ${gasEstimate.toString()}`);
      }

      console.log(`💰 Gas price: ${gasPrice.gasPrice?.toString()} wei`);

      // Add 20% buffer to gas estimate for safety
      const gasLimit = (gasEstimate * 120n) / 100n;
      console.log(
        `🔧 Using gas limit: ${gasLimit.toString()} (with 20% buffer)`
      );
    } catch (gasError) {
      console.error("⚠️ Gas estimation failed:", gasError);
      // Use default values if estimation fails
      gasPrice = { gasPrice: 1000000000n }; // 1 gwei default
    }

    // Call the verification function with optimized gas settings
    const tx = await contract.verifyUser?.(userAddress, metadata, {
      gasLimit: (gasEstimate * 120n) / 100n, // 20% buffer
      gasPrice: gasPrice?.gasPrice || 1000000000n, // Use estimated price or 1 gwei fallback
    });
    console.log(`⏳ Transaction sent: ${tx?.hash}`);

    // Wait for confirmation
    const receipt = await tx?.wait?.();
    console.log(
      `✅ Self Protocol verification confirmed in block ${receipt?.blockNumber}`
    );

    // Update database with transaction hash
    try {
      const { DatabaseService } = await import("../services/database");
      const dbService = new DatabaseService();

      await dbService.updateUserVerification(userAddress, {
        txHash: tx?.hash,
      });

      console.log(`🔗 Transaction hash ${tx?.hash} stored in database`);
    } catch (dbError) {
      console.error("⚠️ Failed to update txHash in DB:", dbError);
    }

    return c.json({
      success: true,
      txHash: tx?.hash,
      blockNumber: receipt?.blockNumber,
      message: "Self Protocol verification processed and written to blockchain",
      userAddress,
      verificationData: {
        name: verificationData.name,
        nationality: verificationData.nationality,
        age: verificationData.age,
        documentType: verificationData.documentType,
        verifiedAt: verificationData.verifiedAt,
      },
    });
  } catch (error) {
    console.error("Error processing Self Protocol callback:", error);
    return c.json(
      {
        error: "Failed to process verification callback",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
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

    // Use imported services to get owner's private key from database
    const dbService = new DatabaseService();
    const authService = new AuthService();

    // Find owner by their Ethereum address
    const owner = await dbService.findUserByAddress(ownerAddress);
    if (!owner) {
      return c.json(
        {
          error: `Owner with address ${ownerAddress} not found in database`,
          suggestion: "Make sure the owner is registered and has a wallet",
        },
        404
      );
    }

    // Decrypt the owner's private key
    const ownerPrivateKey = authService.decryptPrivateKey(
      owner.encryptedPrivateKey
    );

    if (!ownerPrivateKey) {
      return c.json(
        {
          error: "Owner private key not found or empty",
          suggestion:
            "Make sure the owner has a valid encrypted private key in database",
        },
        404
      );
    }

    console.log(`👤 Found contract owner: ${owner.email}`);

    // Create wallet using owner's private key
    const ownerWallet = new Wallet(ownerPrivateKey, provider);

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
      ownerEmail: owner.email,
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

    // Contract ABI for manual verification
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
        message: "User already verified",
        userAddress,
      });
    }

    // Create metadata as bytes
    const metadataJson = JSON.stringify({
      verifiedAt: Date.now(),
      method: "manual-admin-verification",
      platform: "pokket",
    });

    // Convert to bytes using ethers utils
    const metadata = new TextEncoder().encode(metadataJson);

    console.log(`📝 Calling verifyUser for ${userAddress}...`);

    // Estimate gas for manual verification
    let gasEstimate = 200000n;
    let gasPrice;

    try {
      const estimatedGas = await contract.verifyUser?.estimateGas(
        userAddress,
        metadata
      );
      gasPrice = await provider.getFeeData();

      if (estimatedGas) {
        gasEstimate = estimatedGas;
        console.log(
          `⛽ Manual verification gas estimate: ${gasEstimate.toString()}`
        );
      }

      console.log(`💰 Current gas price: ${gasPrice.gasPrice?.toString()} wei`);
    } catch (gasError) {
      console.error(
        "⚠️ Gas estimation failed for manual verification:",
        gasError
      );
      gasPrice = { gasPrice: 1000000000n };
    }

    // Call the verification function with optimized gas
    const tx = await contract.verifyUser?.(userAddress, metadata, {
      gasLimit: (gasEstimate * 120n) / 100n,
      gasPrice: gasPrice?.gasPrice || 1000000000n,
    });
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
