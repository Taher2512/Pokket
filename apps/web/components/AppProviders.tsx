"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { VerificationProvider } from "../contexts/VerificationContext";
import { WalletProvider } from "../contexts/WalletContext";
import { PhantomProvider } from "../contexts/PhantomContext";
import { PasswordAuth } from "./PasswordAuth";

interface AppProvidersProps {
  children: ReactNode;
}

interface VerifiedUserData {
  nullifierId: string;
  ethAddress: string;
  solAddress: string;
  name: string;
  nationality: string;
  age: number;
  issuingState: string;
  verifiedAt: number;
  isVerified: boolean;
}

function AuthenticationWrapper({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [shouldCheckAuth, setShouldCheckAuth] = useState<boolean>(true);

  // Check for existing SELF verification on mount
  useEffect(() => {
    if (shouldCheckAuth) {
      const nullifierId = localStorage.getItem('pokket_nullifier_id');
      const passwordHash = localStorage.getItem('pokket_password_hash');
      const authToken = localStorage.getItem('authToken');
      
      console.log('� Checking existing auth:', { nullifierId: !!nullifierId, passwordHash: !!passwordHash, authToken: !!authToken });
      
      if (nullifierId && passwordHash && authToken?.startsWith('verified-identity-session-')) {
        console.log('✅ Found existing SELF verification, skipping password auth');
        setIsAuthenticated(true);
      } else if (!nullifierId) {
        console.log('🔓 No SELF verification found, proceeding without auth');
        setIsAuthenticated(true);
      }
      setShouldCheckAuth(false);
    }
  }, [shouldCheckAuth]);

  const handleAuthSuccess = (userData: VerifiedUserData) => {
    console.log('🔐 User authenticated with verified identity:', userData);
    console.log('🚀 Setting authentication state to true...');
    setIsAuthenticated(true);
  };

  const handleAuthSkip = () => {
    console.log('🔓 No verified identity found, proceeding without authentication');
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <PasswordAuth 
        onAuthSuccess={handleAuthSuccess}
        onAuthSkip={handleAuthSkip}
      />
    );
  }

  return <>{children}</>;
}

function VerificationWrapper({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Pass user's Ethereum address to VerificationProvider if available
  const userAddress = user?.publicAddress || undefined;

  return (
    <VerificationProvider userAddress={userAddress}>
      {children}
    </VerificationProvider>
  );
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthenticationWrapper>
      <AuthProvider>
        <WalletProvider>
          <PhantomProvider>
            <VerificationWrapper>{children}</VerificationWrapper>
          </PhantomProvider>
        </WalletProvider>
      </AuthProvider>
    </AuthenticationWrapper>
  );
}
