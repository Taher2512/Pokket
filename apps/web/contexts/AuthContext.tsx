"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiService } from "../lib/api";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (code: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (apiService.isAuthenticated()) {
        // Check if this is a SELF-verified user session
        const userSession = localStorage.getItem('pokket_user_session');
        const authToken = localStorage.getItem('authToken');
        
        if (userSession && authToken?.startsWith('verified-identity-session-')) {
          // This is a SELF-verified user, create user object from stored session
          console.log('🔍 Found SELF-verified user session:', { userSession, authToken });
          const sessionData = JSON.parse(userSession);
          console.log('📋 Session data:', sessionData);
          const mockUser: User = {
            id: sessionData.nullifierId?.slice(0, 10) || 'self-user',
            email: sessionData.name 
              ? `${sessionData.name.toLowerCase().replace(/\s+/g, '.')}@pokket-verified.id`
              : 'user@pokket-verified.id',
            name: sessionData.name || 'Verified User',
            avatar: undefined,
            publicAddress: sessionData.ethAddress,
            publicAddressSolana: sessionData.solAddress,
            createdAt: new Date(sessionData.verifiedAt * 1000).toISOString(),
            lastLoginAt: new Date().toISOString(),
            isVerified: true,
          };
          console.log('✅ SELF user created:', mockUser);
          setUser(mockUser);
        } else {
          // Regular Google OAuth user, get profile from backend
          console.log('🔄 Fetching regular user profile from backend...');
          const userProfile = await apiService.getUserProfile();
          setUser(userProfile);
        }
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      // If there's an error (like expired token), clear the auth state
      apiService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (code: string) => {
    try {
      setLoading(true);
      const { user: userData } = await apiService.handleGoogleCallback(code);
      setUser(userData);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
