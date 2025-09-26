"use client";

import React, { ReactNode } from "react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { VerificationProvider } from "../contexts/VerificationContext";

interface AppProvidersProps {
  children: ReactNode;
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
    <AuthProvider>
      <VerificationWrapper>{children}</VerificationWrapper>
    </AuthProvider>
  );
}
