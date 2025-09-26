// API routes for Ethereum asset swapping to PYUSD using Hono
import { Hono } from "hono";
import { EthereumSwapService } from "../services/ethereum-swap";
import { AuthService } from "../services/auth";
import { dbService } from "../services/database";
import type { Hex } from "viem";

const swapApp = new Hono();
const authService = new AuthService();

interface SwapQuoteRequest {
  srcToken: string;
  amount: string; // Amount in smallest units (wei for ETH, etc.)
}

interface SwapExecuteRequest {
  srcToken: string;
  amount: string;
  slippage: number; // 1-50
}

// Auth middleware for swap routes
const authMiddleware = async (c: any, next: any) => {
  try {
    const authorization = c.req.header("Authorization");

    if (!authorization) {
      return c.json({ error: "Authorization header is required" }, 401);
    }

    const token = authorization.replace("Bearer ", "");
    const decoded = authService.verifyJWT(token);

    // Attach user info to context
    c.set("user", decoded);
    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json({ error: "Invalid token" }, 401);
  }
};

/**
 * Get swap quote for ETH assets to PYUSD
 */
swapApp.post("/quote", async (c) => {
  try {
    const body = (await c.req.json()) as SwapQuoteRequest;
    const { srcToken, amount } = body;

    // Validate inputs
    if (!srcToken || !amount) {
      return c.json(
        {
          error: "Missing required fields: srcToken, amount",
        },
        400
      );
    }

    // For now, we'll use demo configuration
    // In production, you'd get the user's private key from secure storage
    const swapService = new EthereumSwapService({
      apiKey: process.env.DEV_PORTAL_API_KEY!,
      rpcUrl: process.env.ETHEREUM_RPC_URL || "https://rpc.ankr.com/eth",
      userPrivateKey:
        "0x0000000000000000000000000000000000000000000000000000000000000001" as Hex, // Demo key
      userAddress: "0x0000000000000000000000000000000000000000", // Demo address
    });

    const quote = await swapService.getQuote({
      srcToken,
      dstToken: EthereumSwapService.TOKENS.PYUSD,
      amount,
      slippage: 1, // Default 1% slippage for quotes
    });

    return c.json({
      success: true,
      quote: {
        srcAmount: quote.srcAmount,
        dstAmount: quote.dstAmount,
        estimatedGas: quote.gas,
        protocols: quote.protocols,
      },
    });
  } catch (error) {
    console.error("Swap quote error:", error);
    return c.json(
      {
        error: "Failed to get swap quote",
        details: (error as Error).message,
      },
      500
    );
  }
});

/**
 * Execute swap from ETH assets to PYUSD
 */
swapApp.post("/execute", authMiddleware, async (c) => {
  try {
    const body = (await c.req.json()) as SwapExecuteRequest;
    const { srcToken, amount, slippage } = body;

    // Validate inputs
    if (!srcToken || !amount || !slippage) {
      return c.json(
        {
          error: "Missing required fields: srcToken, amount, slippage",
        },
        400
      );
    }

    if (slippage < 1 || slippage > 50) {
      return c.json(
        {
          error: "Slippage must be between 1 and 50",
        },
        400
      );
    }

    // Get authenticated user
    const userAuth = (c as any).get("user") as any;
    const user = await dbService.findUserById(userAuth.userId);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Decrypt user's private key
    const userPrivateKey = authService.decryptPrivateKey(
      user.encryptedPrivateKey
    );

    const swapService = new EthereumSwapService({
      apiKey: process.env.DEV_PORTAL_API_KEY!,
      rpcUrl: process.env.ETHEREUM_RPC_URL || "https://rpc.ankr.com/eth",
      userPrivateKey: userPrivateKey as Hex,
      userAddress: user.publicAddress,
    });

    const result = await swapService.performCompleteSwap({
      srcToken,
      dstToken: EthereumSwapService.TOKENS.PYUSD,
      amount,
      slippage,
    });

    return c.json({
      success: true,
      approvalTxHash: result.approvalTxHash,
      swapTxHash: result.swapTxHash,
      quote: result.quote,
    });
  } catch (error) {
    console.error("Swap execution error:", error);
    return c.json(
      {
        error: "Failed to execute swap",
        details: (error as Error).message,
      },
      500
    );
  }
});

/**
 * Get supported tokens for swapping to PYUSD
 */
swapApp.get("/tokens", async (c) => {
  return c.json({
    success: true,
    tokens: {
      ETH: {
        address: EthereumSwapService.TOKENS.ETH,
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
      },
      WETH: {
        address: EthereumSwapService.TOKENS.WETH,
        symbol: "WETH",
        name: "Wrapped Ethereum",
        decimals: 18,
      },
      USDC: {
        address: EthereumSwapService.TOKENS.USDC,
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
      },
      USDT: {
        address: EthereumSwapService.TOKENS.USDT,
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
      },
      DAI: {
        address: EthereumSwapService.TOKENS.DAI,
        symbol: "DAI",
        name: "Dai Stablecoin",
        decimals: 18,
      },
    },
    destination: {
      PYUSD: {
        address: EthereumSwapService.TOKENS.PYUSD,
        symbol: "PYUSD",
        name: "PayPal USD",
        decimals: 6,
      },
    },
  });
});

/**
 * Check token allowance for a user
 */
swapApp.post("/allowance", async (c) => {
  try {
    const body = (await c.req.json()) as {
      tokenAddress: string;
      userAddress: string;
    };
    const { tokenAddress, userAddress } = body;

    if (!tokenAddress || !userAddress) {
      return c.json(
        {
          error: "Missing required fields: tokenAddress, userAddress",
        },
        400
      );
    }

    const swapService = new EthereumSwapService({
      apiKey: process.env.DEV_PORTAL_API_KEY!,
      rpcUrl: process.env.ETHEREUM_RPC_URL || "https://rpc.ankr.com/eth",
      userPrivateKey:
        "0x0000000000000000000000000000000000000000000000000000000000000001" as Hex,
      userAddress: userAddress,
    });

    const allowance = await swapService.checkAllowance(tokenAddress);

    return c.json({
      success: true,
      allowance: allowance.toString(),
      hasAllowance: allowance > 0n,
    });
  } catch (error) {
    console.error("Allowance check error:", error);
    return c.json(
      {
        error: "Failed to check allowance",
        details: (error as Error).message,
      },
      500
    );
  }
});

export { swapApp };
