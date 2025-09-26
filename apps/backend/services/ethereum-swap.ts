// Backend service for 1inch classic swap API integration
// Handles ETH assets to PYUSD swaps on Ethereum mainnet

import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
} from "viem";
import type { Hex } from "viem";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

export interface SwapConfig {
  apiKey: string;
  rpcUrl: string;
  userPrivateKey: Hex;
  userAddress: string;
}

export interface SwapParams {
  srcToken: string; // Source token address (or ETH address)
  dstToken: string; // Destination token address (PYUSD)
  amount: string; // Amount in smallest units
  slippage: number; // Slippage percentage (1-50)
}

type AllowanceResponse = { allowance: string };
type TransactionPayload = { to: Hex; data: Hex; value: bigint };
type TxResponse = { tx: TransactionPayload };
type ApproveTransactionResponse = {
  to: Hex;
  data: Hex;
  value: bigint;
  gasPrice: string;
};
type QuoteResponse = {
  dstAmount: string;
  srcAmount: string;
  protocols: any[];
  gas: string;
};

export class EthereumSwapService {
  private config: SwapConfig;
  private baseUrl: string;
  private publicClient: any;
  private walletClient: any;
  private account: any;

  // Common token addresses on Ethereum mainnet
  public static readonly TOKENS = {
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // ETH placeholder
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    PYUSD: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  };

  constructor(config: SwapConfig) {
    this.config = config;
    this.baseUrl = `https://api.1inch.dev/swap/v6.1/${mainnet.id}`;

    this.publicClient = createPublicClient({
      chain: mainnet,
      transport: http(config.rpcUrl),
    });

    this.account = privateKeyToAccount(config.userPrivateKey);
    this.walletClient = createWalletClient({
      account: this.account,
      chain: mainnet,
      transport: http(config.rpcUrl),
    });
  }

  private buildQueryURL(path: string, params: Record<string, string>): string {
    const url = new URL(this.baseUrl + path);
    url.search = new URLSearchParams(params).toString();
    return url.toString();
  }

  private async call1inchAPI<T>(
    endpointPath: string,
    queryParams: Record<string, string>
  ): Promise<T> {
    const url = this.buildQueryURL(endpointPath, queryParams);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`1inch API returned status ${response.status}: ${body}`);
    }

    return (await response.json()) as T;
  }

  /**
   * Get a quote for the swap without executing it
   */
  async getQuote(swapParams: SwapParams): Promise<QuoteResponse> {
    console.log("📊 Getting swap quote...");

    const queryParams = {
      src: swapParams.srcToken,
      dst: swapParams.dstToken,
      amount: swapParams.amount,
      includeTokensInfo: "true",
      includeProtocols: "true",
      includeGas: "true",
    };

    const quote = await this.call1inchAPI<QuoteResponse>("/quote", queryParams);

    console.log(
      `📈 Quote: ${formatEther(BigInt(swapParams.amount))} → ${formatEther(BigInt(quote.dstAmount))} PYUSD`
    );

    return quote;
  }

  /**
   * Check current allowance for a token
   */
  async checkAllowance(tokenAddress: string): Promise<bigint> {
    // ETH doesn't need allowance
    if (tokenAddress === EthereumSwapService.TOKENS.ETH) {
      return BigInt(Number.MAX_SAFE_INTEGER);
    }

    console.log("🔍 Checking token allowance...");

    const allowanceRes = await this.call1inchAPI<AllowanceResponse>(
      "/approve/allowance",
      {
        tokenAddress,
        walletAddress: this.config.userAddress.toLowerCase(),
      }
    );

    const allowance = BigInt(allowanceRes.allowance);
    console.log(`✅ Current allowance: ${allowance.toString()}`);

    return allowance;
  }

  /**
   * Approve token spending if needed
   */
  async approveIfNeeded(
    tokenAddress: string,
    requiredAmount: bigint
  ): Promise<string | null> {
    // ETH doesn't need approval
    if (tokenAddress === EthereumSwapService.TOKENS.ETH) {
      return null;
    }

    const allowance = await this.checkAllowance(tokenAddress);

    if (allowance >= requiredAmount) {
      console.log("✅ Allowance is sufficient for the swap.");
      return null;
    }

    console.log("⚠️ Insufficient allowance. Creating approval transaction...");

    const approveTx = await this.call1inchAPI<ApproveTransactionResponse>(
      "/approve/transaction",
      {
        tokenAddress,
        amount: requiredAmount.toString(),
      }
    );

    console.log("📝 Approval transaction details:", approveTx);

    const txHash = await this.signAndSendTransaction({
      to: approveTx.to,
      data: approveTx.data,
      value: approveTx.value,
    });

    console.log(`✅ Approval transaction sent. Hash: ${txHash}`);
    return txHash;
  }

  /**
   * Execute the actual swap
   */
  async executeSwap(swapParams: SwapParams): Promise<string> {
    const swapQueryParams = {
      src: swapParams.srcToken,
      dst: swapParams.dstToken,
      amount: swapParams.amount,
      from: this.config.userAddress.toLowerCase(),
      slippage: swapParams.slippage.toString(),
      disableEstimate: "false",
      allowPartialFill: "false",
    };

    console.log("🔄 Fetching swap transaction...");
    const swapTx = await this.call1inchAPI<TxResponse>(
      "/swap",
      swapQueryParams
    );

    console.log("📝 Swap transaction:", swapTx.tx);

    const txHash = await this.signAndSendTransaction(swapTx.tx);
    console.log(`✅ Swap transaction sent. Hash: ${txHash}`);

    return txHash;
  }

  /**
   * Sign and send transaction
   */
  private async signAndSendTransaction(
    tx: TransactionPayload
  ): Promise<string> {
    const nonce = await this.publicClient.getTransactionCount({
      address: this.account.address,
      blockTag: "pending",
    });

    console.log(`📝 Nonce: ${nonce.toString()}`);

    try {
      return await this.walletClient.sendTransaction({
        account: this.account,
        to: tx.to,
        data: tx.data,
        value: BigInt(tx.value),
        chain: mainnet,
        nonce,
        kzg: undefined,
      });
    } catch (err) {
      console.error("❌ Transaction signing or broadcasting failed");
      console.error("Transaction data:", tx);
      console.error("Nonce:", nonce.toString());
      throw err;
    }
  }

  /**
   * Complete swap flow: approve if needed, then swap
   */
  async performCompleteSwap(swapParams: SwapParams): Promise<{
    approvalTxHash?: string;
    swapTxHash: string;
    quote: QuoteResponse;
  }> {
    try {
      // First get a quote
      const quote = await this.getQuote(swapParams);

      // Check and approve if needed
      const approvalTxHash = await this.approveIfNeeded(
        swapParams.srcToken,
        BigInt(swapParams.amount)
      );

      // If approval was needed, wait for confirmation
      if (approvalTxHash) {
        console.log("⏳ Waiting for approval transaction confirmation...");

        // Wait for transaction to be mined with proper confirmation
        try {
          const receipt = await this.publicClient.waitForTransactionReceipt({
            hash: approvalTxHash as `0x${string}`,
            timeout: 120_000, // 2 minutes timeout
          });

          if (receipt.status === "success") {
            console.log("✅ Approval transaction confirmed!");
          } else {
            throw new Error("Approval transaction failed");
          }
        } catch (waitError) {
          console.error(
            "❌ Failed to confirm approval transaction:",
            waitError
          );
          // Still try to proceed - maybe it succeeded but took too long
          console.log("⚠️ Proceeding anyway, approval might have succeeded...");
        }
      }

      // Execute the swap
      const swapTxHash = await this.executeSwap(swapParams);

      return {
        approvalTxHash: approvalTxHash || undefined,
        swapTxHash,
        quote,
      };
    } catch (err) {
      console.error("❌ Swap failed:", (err as Error).message);
      throw err;
    }
  }
}
