// Token and Portfolio interfaces for frontend
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

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  publicAddress: string;
  publicAddressSolana?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface WalletInfo {
  ethereum: {
    address: string;
    privateKey: string;
  };
  solana: {
    address: string;
    privateKey: number[] | null;
  } | null;
}

export interface AddressInfo {
  ethereum: {
    address: string;
    network: string;
    chainId: number;
  };
  solana: {
    address: string;
    network: string;
  } | null;
}

export interface AddressInfo {
  ethereum: {
    address: string;
    network: string;
    chainId: number;
  };
  solana: {
    address: string;
    network: string;
  } | null;
}
