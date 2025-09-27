import { ethers } from "ethers";
import { PublicKey } from "@solana/web3.js";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  network?: "ethereum" | "solana";
  format?: string;
}

export const addressValidator = {
  // Validate Ethereum address
  validateEthereum(address: string): ValidationResult {
    if (!address || typeof address !== "string") {
      return { isValid: false, error: "Address is required" };
    }

    const trimmedAddress = address.trim();

    if (trimmedAddress.length === 0) {
      return { isValid: false, error: "Address cannot be empty" };
    }

    try {
      if (!ethers.isAddress(trimmedAddress)) {
        return { isValid: false, error: "Invalid Ethereum address format" };
      }

      // Check if it's a valid checksum address
      const checksumAddress = ethers.getAddress(trimmedAddress);

      return {
        isValid: true,
        network: "ethereum",
        format: checksumAddress,
      };
    } catch (error) {
      return { isValid: false, error: "Invalid Ethereum address" };
    }
  },

  // Validate Solana address
  validateSolana(address: string): ValidationResult {
    if (!address || typeof address !== "string") {
      return { isValid: false, error: "Address is required" };
    }

    const trimmedAddress = address.trim();

    if (trimmedAddress.length === 0) {
      return { isValid: false, error: "Address cannot be empty" };
    }

    try {
      const publicKey = new PublicKey(trimmedAddress);

      // Additional validation - Solana addresses should be 32 bytes (44 characters in base58)
      if (trimmedAddress.length < 32 || trimmedAddress.length > 44) {
        return { isValid: false, error: "Invalid Solana address length" };
      }

      return {
        isValid: true,
        network: "solana",
        format: publicKey.toString(),
      };
    } catch (error) {
      return { isValid: false, error: "Invalid Solana address format" };
    }
  },

  // Auto-detect and validate address
  validateAddress(address: string): ValidationResult {
    if (!address || typeof address !== "string") {
      return { isValid: false, error: "Address is required" };
    }

    const trimmedAddress = address.trim();

    // Try Ethereum first
    const ethResult = this.validateEthereum(trimmedAddress);
    if (ethResult.isValid) {
      return ethResult;
    }

    // Try Solana if Ethereum validation fails
    const solResult = this.validateSolana(trimmedAddress);
    if (solResult.isValid) {
      return solResult;
    }

    // If neither work, return generic error
    return {
      isValid: false,
      error:
        "Invalid address format. Please enter a valid Ethereum or Solana address.",
    };
  },
};

export const amountValidator = {
  validateAmount(
    amount: string,
    maxAmount: number,
    decimals: number = 18,
    minAmount: number = 0.000001
  ): ValidationResult {
    if (!amount || typeof amount !== "string") {
      return { isValid: false, error: "Amount is required" };
    }

    const trimmedAmount = amount.trim();

    if (trimmedAmount === "") {
      return { isValid: false, error: "Amount cannot be empty" };
    }

    // Check for valid number format
    if (!/^\d*\.?\d*$/.test(trimmedAmount)) {
      return { isValid: false, error: "Amount must be a valid number" };
    }

    const numAmount = parseFloat(trimmedAmount);

    // Check for NaN
    if (isNaN(numAmount)) {
      return { isValid: false, error: "Invalid amount format" };
    }

    // Check for negative amounts
    if (numAmount < 0) {
      return { isValid: false, error: "Amount must be positive" };
    }

    // Check for zero amount
    if (numAmount === 0) {
      return { isValid: false, error: "Amount must be greater than zero" };
    }

    // Check minimum amount
    if (numAmount < minAmount) {
      return {
        isValid: false,
        error: `Minimum amount is ${minAmount}`,
      };
    }

    // Check maximum amount (available balance)
    if (numAmount > maxAmount) {
      return {
        isValid: false,
        error: `Insufficient balance. Available: ${maxAmount.toFixed(6)}`,
      };
    }

    // Check decimal places
    const decimalPart = trimmedAmount.split(".")[1];
    if (decimalPart && decimalPart.length > decimals) {
      return {
        isValid: false,
        error: `Too many decimal places. Maximum ${decimals} allowed.`,
      };
    }

    return { isValid: true };
  },
};

export const transactionValidator = {
  validateWithdrawTransaction(
    amount: string,
    recipientAddress: string,
    maxBalance: number,
    network: "ethereum" | "solana"
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate amount
    const amountValidation = amountValidator.validateAmount(
      amount,
      maxBalance,
      network === "ethereum" ? 18 : 9
    );
    if (!amountValidation.isValid) {
      errors.push(amountValidation.error!);
    }

    // Validate address
    const addressValidation =
      network === "ethereum"
        ? addressValidator.validateEthereum(recipientAddress)
        : addressValidator.validateSolana(recipientAddress);

    if (!addressValidation.isValid) {
      errors.push(addressValidation.error!);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

// Utility functions for formatting
export const formatUtils = {
  formatAddress(
    address: string,
    startChars: number = 6,
    endChars: number = 4
  ): string {
    if (!address || address.length < startChars + endChars) {
      return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  },

  formatAmount(amount: string | number, decimals: number = 6): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "0";

    if (num < 0.000001) {
      return num.toExponential(2);
    }

    return num.toFixed(decimals);
  },

  formatUSD(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  },
};
