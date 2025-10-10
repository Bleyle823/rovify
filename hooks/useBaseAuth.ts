'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  generateChallenge,
  connectBaseWallet,
  signMessageWithBase,
  switchToBaseChain,
  resolveBaseName,
  getNetworkInfo,
} from '@/services/baseAuth';

interface AuthResult {
  success: boolean;
  userData?: {
    id: string;
    walletAddress: string;
    baseName?: string | null;
  };
  walletAddress?: string;
  baseName?: string;
  error?: Error | unknown;
}

export const useBaseAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | undefined>(undefined);
  const [baseName, setBaseName] = useState<string | null>(null);

  const router = useRouter();
  const { loginWithWallet } = useAuth();

  const authenticateWithBase = useCallback(
    async (redirectTo = '/home'): Promise<AuthResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // Ensure user is on Base
        const networkInfo = await getNetworkInfo();
        if (!networkInfo.onBase) {
          const switchSuccess = await switchToBaseChain();
          if (!switchSuccess) throw new Error('Could not connect to Base network.');
        }

        // Connect wallet
        const address = await connectBaseWallet();
        if (!address) throw new Error('Failed to connect wallet');
        setWalletAddress(address);

        // Challenge + signature
        const challenge = generateChallenge();
        const message = `Sign this message to authenticate with Rovify: ${challenge}`;
        const signature = await signMessageWithBase(message, address);
        if (!signature) throw new Error('Signature required to authenticate');

        // Resolve Base name
        const nameResult = await resolveBaseName(address);
        setBaseName(nameResult);

        // Call backend for verification
        const response = await fetch('/api/auth/base', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, signature, message, baseName: nameResult }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Authentication failed');
        }

        const userData = await response.json();

        await loginWithWallet({
          id: userData.id,
          walletAddress: address,
          baseName: nameResult ?? undefined,
          authMethod: 'base',
          verified: true,
        });

        router.replace(redirectTo);

        return {
          success: true,
          userData,
          walletAddress: address,
          ...(nameResult ? { baseName: nameResult } : {}),
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        return {
          success: false,
          error: err,
          walletAddress,
          ...(baseName ? { baseName } : {}),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [loginWithWallet, router, walletAddress, baseName]
  );

  return {
    authenticateWithBase,
    isLoading,
    error,
    walletAddress,
    baseName: baseName ?? undefined,
  };
};
