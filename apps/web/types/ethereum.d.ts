// Ethereum and Solana provider types
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      isPhantom?: boolean;
      isTrust?: boolean;
      isRainbow?: boolean;
      selectedProvider?: {
        isCoinbaseWallet?: boolean;
      };
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      signTransaction: (transaction: unknown) => Promise<unknown>;
      publicKey?: { toString: () => string };
    };
  }
}

export {};