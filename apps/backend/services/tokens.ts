import { ethers } from "ethers";
import axios from "axios";

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  logoURI?: string;
  priceUSD?: number;
  valueUSD?: number;
}

export interface PortfolioSummary {
  totalValueUSD: number;
  tokens: TokenInfo[];
  ethBalance: string;
  ethBalanceFormatted: string;
  ethValueUSD?: number;
}

// Standard ERC-20 ABI for getting token info
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
];

// Popular ERC-20 tokens on Ethereum Mainnet
const POPULAR_TOKENS = [
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Mainnet (correct address)
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  },
  {
    address: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", // PYUSD on Ethereum Mainnet
    symbol: "PYUSD",
    name: "PayPal USD",
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6c3ea9036406852006290770BEdFcAbA0e23A0e8/logo.png",
  },
  {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH on Mainnet
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
  },
  {
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", // LINK on Mainnet
    symbol: "LINK",
    name: "ChainLink Token",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png",
  },
  {
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC on Mainnet
    symbol: "WBTC",
    name: "Wrapped BTC",
    decimals: 8,
    logoURI:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png",
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT on Mainnet
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  },
];

export class TokenService {
  private provider: ethers.Provider;

  constructor() {
    // Initialize with Ethereum mainnet RPC endpoint
    const rpcUrl =
      process.env.ETHEREUM_RPC_URL ||
      process.env.ETHEREUM_MAINNET_RPC_URL ||
      "https://ethereum-rpc.publicnode.com";
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    console.log(`🔗 TokenService initialized with mainnet RPC: ${rpcUrl}`);
  }

  /**
   * Get ETH balance for an address
   */
  async getETHBalance(
    address: string
  ): Promise<{ balance: string; balanceFormatted: string }> {
    try {
      const balance = await this.provider.getBalance(address);
      const balanceFormatted = ethers.formatEther(balance);

      return {
        balance: balance.toString(),
        balanceFormatted,
      };
    } catch (error) {
      console.error("Error getting ETH balance:", error);
      throw new Error("Failed to get ETH balance");
    }
  }

  /**
   * Get token balance for a specific ERC-20 token
   */
  async getTokenBalance(
    tokenAddress: string,
    userAddress: string
  ): Promise<TokenInfo | null> {
    try {
      console.log(`🔍 Checking mainnet token: ${tokenAddress}`);

      const contract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.provider
      );

      // Get token info
      const [name, symbol, decimals, balance] = await Promise.all([
        contract.name() as Promise<string>,
        contract.symbol() as Promise<string>,
        contract.decimals() as Promise<number>,
        contract.balanceOf(userAddress) as Promise<bigint>,
      ]);

      console.log(
        `🔍 Token ${symbol} (${tokenAddress}): balance = ${balance.toString()}`
      );

      // Check if user has a balance (keep tokens with zero balance for debugging)
      // if (balance === 0n) {
      //   return null;
      // }

      const balanceFormatted = ethers.formatUnits(balance, decimals);

      // Find logo URI from popular tokens list
      const popularToken = POPULAR_TOKENS.find(
        (token) => token.address.toLowerCase() === tokenAddress.toLowerCase()
      );

      return {
        address: tokenAddress,
        symbol,
        name,
        decimals: Number(decimals),
        balance: balance.toString(),
        balanceFormatted,
        logoURI: popularToken?.logoURI,
      };
    } catch (error) {
      console.error(`Error getting token balance for ${tokenAddress}:`, error);
      return null;
    }
  }

  /**
   * Get all token balances for popular tokens
   */
  async getTokenBalances(userAddress: string): Promise<TokenInfo[]> {
    try {
      const tokens: TokenInfo[] = [];

      console.log(`🔍 Checking token balances for address: ${userAddress}`);

      // Check balances for popular tokens in parallel
      const balancePromises = POPULAR_TOKENS.map((token) =>
        this.getTokenBalance(token.address, userAddress)
      );

      const results = await Promise.allSettled(balancePromises);

      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) {
          console.log(
            `✅ Found token: ${result.value.symbol} - ${result.value.balanceFormatted}`
          );
          tokens.push(result.value);
        } else if (result.status === "fulfilled" && !result.value) {
          console.log(
            `❌ No balance for: ${POPULAR_TOKENS[index]?.symbol || "Unknown"}`
          );
        } else if (result.status === "rejected") {
          console.log(
            `⚠️ Error checking: ${POPULAR_TOKENS[index]?.symbol || "Unknown"}`,
            result.reason
          );
        }
      });

      console.log(`📊 Total tokens found: ${tokens.length}`);
      return tokens;
    } catch (error) {
      console.error("Error getting token balances:", error);
      throw new Error("Failed to get token balances");
    }
  }

  /**
   * Check balance for a specific token address (useful for custom tokens)
   */
  async getCustomTokenBalance(
    tokenAddress: string,
    userAddress: string
  ): Promise<TokenInfo | null> {
    return this.getTokenBalance(tokenAddress, userAddress);
  }

  /**
   * Get token prices from CoinGecko API
   */
  async getTokenPrices(
    tokenAddresses: string[]
  ): Promise<Record<string, number>> {
    try {
      // Map mainnet token addresses to their CoinGecko IDs
      const tokenToCoinGeckoId: Record<string, string> = {
        ethereum: "ethereum", // ETH
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "usd-coin", // USDC (Mainnet)
        "0x6c3ea9036406852006290770bedfcaba0e23a0e8": "paypal-usd", // PYUSD (Mainnet)
        "0x514910771af9ca656af840dff83e8264ecf986ca": "chainlink", // LINK (Mainnet)
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "ethereum", // WETH (maps to ETH)
        "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "wrapped-bitcoin", // WBTC (Mainnet)
        "0xdac17f958d2ee523a2206206994597c13d831ec7": "tether", // USDT (Mainnet)
      };

      // Get unique CoinGecko IDs
      const coinGeckoIds = new Set<string>();

      // Always include ETH
      coinGeckoIds.add("ethereum");

      // Add CoinGecko IDs for tokens that have mappings
      tokenAddresses.forEach((address) => {
        const coinGeckoId = tokenToCoinGeckoId[address.toLowerCase()];
        if (coinGeckoId) {
          coinGeckoIds.add(coinGeckoId);
          console.log(`📍 Token ${address} -> CoinGecko ID: ${coinGeckoId}`);
        } else {
          console.log(`❌ No CoinGecko mapping for token: ${address}`);
        }
      });

      // If no valid tokens, just return ETH price
      if (coinGeckoIds.size === 0) {
        coinGeckoIds.add("ethereum");
      }

      const ids = Array.from(coinGeckoIds).join(",");

      console.log(`🔍 Fetching prices for: ${ids}`);

      // Fetch prices from CoinGecko API
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
        {
          timeout: 10000, // 10 second timeout
          headers: {
            Accept: "application/json",
          },
        }
      );

      const priceData = response.data;
      console.log(`✅ CoinGecko response:`, priceData);

      // Map back to token addresses
      const prices: Record<string, number> = {};

      // Always set ETH price
      if (priceData.ethereum?.usd) {
        prices["ethereum"] = priceData.ethereum.usd;
      }

      // Map token addresses to their prices
      tokenAddresses.forEach((address) => {
        const coinGeckoId = tokenToCoinGeckoId[address.toLowerCase()];
        if (coinGeckoId && priceData[coinGeckoId]?.usd) {
          prices[address.toLowerCase()] = priceData[coinGeckoId].usd;
          console.log(
            `✅ Mapped ${address} (${coinGeckoId}) -> $${priceData[coinGeckoId].usd}`
          );
        }
      });

      // Add fallback prices for tokens without CoinGecko mapping
      tokenAddresses.forEach((address) => {
        if (!prices[address.toLowerCase()]) {
          prices[address.toLowerCase()] = 0; // Unknown tokens get $0
          console.log(`⚠️ No price found for ${address}, using $0`);
        }
      });

      console.log(`💰 Final price mapping:`, prices);
      return prices;
    } catch (error) {
      console.error("Error fetching prices from CoinGecko:", error);

      // Fallback to mock prices if CoinGecko fails
      console.log("🔄 Falling back to mock prices");
      const mockPrices: Record<string, number> = {
        ethereum: 2500, // ETH price
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 1.0, // USDC (Mainnet)
        "0x6c3ea9036406852006290770bedfcaba0e23a0e8": 1.0, // PYUSD (Mainnet)
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": 2500, // WETH (Mainnet)
        "0x514910771af9ca656af840dff83e8264ecf986ca": 15.2, // LINK (Mainnet)
        "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": 45000, // WBTC (Mainnet)
        "0xdac17f958d2ee523a2206206994597c13d831ec7": 1.0, // USDT (Mainnet)
      };

      return mockPrices;
    }
  }

  /**
   * Get complete portfolio for a user address
   */
  async getPortfolio(userAddress: string): Promise<PortfolioSummary> {
    try {
      // Get ETH balance
      const ethBalance = await this.getETHBalance(userAddress);

      // Get token balances
      const tokens = await this.getTokenBalances(userAddress);

      // Get all relevant token addresses for price fetching
      const tokenAddresses = tokens.map((token) => token.address);
      const prices = await this.getTokenPrices(tokenAddresses);

      // Calculate USD values
      let totalValueUSD = 0;

      // Add ETH value
      const ethPrice = prices["ethereum"] || 0;
      const ethValueUSD = parseFloat(ethBalance.balanceFormatted) * ethPrice;
      totalValueUSD += ethValueUSD;

      // Create ETH token entry to include in the tokens list
      const ethTokenInfo: TokenInfo = {
        address: "0x0000000000000000000000000000000000000000", // Use zero address for ETH
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
        balance: ethBalance.balance,
        balanceFormatted: ethBalance.balanceFormatted,
        logoURI:
          "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png", // Using WETH logo which is the same as ETH
        priceUSD: ethPrice,
        valueUSD: ethValueUSD,
      };

      // Add token values and update token info
      const tokensWithPrices = tokens.map((token) => {
        const price = prices[token.address.toLowerCase()] || 0;
        const valueUSD = parseFloat(token.balanceFormatted) * price;
        totalValueUSD += valueUSD;

        return {
          ...token,
          priceUSD: price,
          valueUSD,
        };
      });

      // Combine ETH with other tokens and sort by value (highest first)
      const allTokens = [ethTokenInfo, ...tokensWithPrices].sort(
        (a, b) => (b.valueUSD || 0) - (a.valueUSD || 0)
      );

      return {
        totalValueUSD,
        tokens: allTokens,
        ethBalance: ethBalance.balance,
        ethBalanceFormatted: ethBalance.balanceFormatted,
        ethValueUSD,
      };
    } catch (error) {
      console.error("Error getting portfolio:", error);
      throw new Error("Failed to get portfolio data");
    }
  }

  /**
   * Validate if an address is a valid Ethereum address
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }
}
