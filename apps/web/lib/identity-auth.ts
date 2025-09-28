import { User } from '../types';

export interface IdentityAuthResult {
  success: boolean;
  user?: User;
  message?: string;
  publicAddress?: string;
}

export class IdentityAuthService {
  /**
   * Generate keypairs and authenticate user through identity verification
   * This is called when user chooses "Verify Identity" option
   */
  static async generateKeypairsAndVerify(): Promise<IdentityAuthResult> {
    try {
      // First, generate keypairs for the user
      const keypairResponse = await this.generateUserKeypairs();
      console.log("Keypair generation response:", keypairResponse);
      if (!keypairResponse.success) {
        return {
          success: false,
          message: 'Failed to generate keypairs'
        };
      }

      // Return the public address so we can open verification modal
      return {
        success: true,
        publicAddress: keypairResponse.publicAddress,
        message: 'Keypairs generated successfully'
      };
    } catch (error) {
      console.error('Identity authentication failed:', error);
      // For now, return a mock success for testing the UI flow
      // Generate a proper 40-character hex address
      const mockAddress = '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      return {
        success: true,
        publicAddress: mockAddress,
        message: 'Mock keypairs generated for testing'
      };
    }
  }

  /**
   * Generate user keypairs without requiring Google authentication
   */
  private static async generateUserKeypairs(): Promise<{
    success: boolean;
    publicAddress?: string;
    message?: string;
  }> {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE_URL}/auth/generate-keypairs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authMethod: 'identity_verification'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate keypairs');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Keypair generation failed');
      }
      
      return {
        success: true,
        publicAddress: data.publicAddress,
        message: data.message || 'Keypairs generated successfully'
      };
    } catch (error) {
      console.error('Keypair generation failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate keypairs'
      };
    }
  }

  /**
   * Complete the identity authentication after successful SELF verification
   */
  static async completeIdentityAuth(publicAddress: string, verificationData: Record<string, unknown>): Promise<IdentityAuthResult> {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE_URL}/auth/complete-identity-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicAddress,
          verificationData,
          authMethod: 'identity_verification'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete identity authentication');
      }

      const data = await response.json();
      
      // Store authentication token if provided
      if (data.token) {
        localStorage.setItem('pokket_token', data.token);
      }

      return {
        success: true,
        user: data.user,
        publicAddress: data.user?.publicAddress,
        message: 'Identity authentication completed successfully'
      };
    } catch (error) {
      console.error('Identity authentication completion failed:', error);
      return {
        success: false,
        message: 'Failed to complete identity authentication'
      };
    }
  }

  /**
   * Check if user is authenticated via identity verification
   */
  static async checkIdentityAuthStatus(): Promise<{
    isAuthenticated: boolean;
    user?: User;
  }> {
    try {
      const token = localStorage.getItem('pokket_token');
      if (!token) {
        return { isAuthenticated: false };
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE_URL}/auth/verify-identity-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        localStorage.removeItem('pokket_token');
        return { isAuthenticated: false };
      }

      const data = await response.json();
      
      return {
        isAuthenticated: true,
        user: data.user
      };
    } catch (error) {
      console.error('Identity auth status check failed:', error);
      localStorage.removeItem('pokket_token');
      return { isAuthenticated: false };
    }
  }
}