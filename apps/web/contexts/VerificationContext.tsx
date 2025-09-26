"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { VerificationStatus } from "../lib/verification";

interface VerificationContextType {
  verificationStatus: VerificationStatus;
  isLoading: boolean;
  checkVerificationStatus: () => Promise<void>;
  updateVerificationStatus: (status: VerificationStatus) => void;
  refreshVerificationStatus: () => Promise<void>;
}

const VerificationContext = createContext<VerificationContextType | undefined>(
  undefined
);

interface VerificationProviderProps {
  children: ReactNode;
  userAddress?: string;
}

export function VerificationProvider({
  children,
  userAddress,
}: VerificationProviderProps) {
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>({
      isVerified: false,
    });
  const [isLoading, setIsLoading] = useState(false);

  // Check verification status when userAddress changes
  useEffect(() => {
    if (userAddress) {
      checkVerificationStatus();
    } else {
      // Reset status when no user address
      setVerificationStatus({ isVerified: false });
    }
  }, [userAddress]);

  const checkVerificationStatus = async () => {
    if (!userAddress) return;

    setIsLoading(true);
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(
        `${API_BASE_URL}/verification/status/${userAddress}`,
        {
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );

      if (response.ok) {
        const status: VerificationStatus = await response.json();
        setVerificationStatus(status);
      } else {
        console.warn(
          "Failed to fetch verification status:",
          response.statusText
        );
        setVerificationStatus({ isVerified: false });
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setVerificationStatus({ isVerified: false });
    } finally {
      setIsLoading(false);
    }
  };

  const updateVerificationStatus = (status: VerificationStatus) => {
    setVerificationStatus(status);
  };

  const refreshVerificationStatus = async () => {
    await checkVerificationStatus();
  };

  const value: VerificationContextType = {
    verificationStatus,
    isLoading,
    checkVerificationStatus,
    updateVerificationStatus,
    refreshVerificationStatus,
  };

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerification(): VerificationContextType {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error(
      "useVerification must be used within a VerificationProvider"
    );
  }
  return context;
}

// Hook to get verification status for a specific address (useful for viewing other users)
export function useVerificationStatus(address: string): {
  verificationStatus: VerificationStatus;
  isLoading: boolean;
  error: string | null;
} {
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>({
      isVerified: false,
    });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!address) return;

      setIsLoading(true);
      setError(null);

      try {
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const response = await fetch(
          `${API_BASE_URL}/verification/status/${address}`
        );

        if (response.ok) {
          const status: VerificationStatus = await response.json();
          setVerificationStatus(status);
        } else {
          setError(
            `Failed to fetch verification status: ${response.statusText}`
          );
          setVerificationStatus({ isVerified: false });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setVerificationStatus({ isVerified: false });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [address]);

  return { verificationStatus, isLoading, error };
}
