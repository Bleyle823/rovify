'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hardhat, sepolia, mainnet, baseSepolia } from 'wagmi/chains';
import '@rainbow-me/rainbowkit/styles.css';

// Create a development-friendly configuration
const createDevConfig = () => {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  
  // For development, use a minimal configuration that doesn't require WalletConnect
  if (!projectId || projectId === 'demo-project-id' || process.env.NODE_ENV === 'development') {
    return createConfig({
      chains: [baseSepolia, hardhat, sepolia, mainnet],
      transports: {
        [hardhat.id]: http('http://127.0.0.1:8545'),
        [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
        [sepolia.id]: http(),
        [mainnet.id]: http(),
      },
      connectors: [
        injected({ shimDisconnect: true }),
        // Optionally enable WalletConnect/Coinbase if projectId is later added
        ...(projectId
          ? [
              walletConnect({ projectId }),
              coinbaseWallet({ appName: 'Rovify NFT Events' }),
            ]
          : []),
      ],
      ssr: true,
    });
  }
  
  // For production, use the full RainbowKit configuration
  return getDefaultConfig({
    appName: 'Rovify NFT Events',
    projectId: projectId,
    chains: [baseSepolia, hardhat, sepolia, mainnet],
    transports: {
      [hardhat.id]: http('http://127.0.0.1:8545'),
      [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
      [sepolia.id]: http(),
      [mainnet.id]: http(),
    },
    ssr: true,
  });
};

const config = createDevConfig();

// Create QueryClient with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  const isDevelopment = !projectId || projectId === 'demo-project-id' || process.env.NODE_ENV === 'development';

  // Always use RainbowKitProvider to support ConnectButton
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          initialChain={baseSepolia}
          showRecentTransactions={!isDevelopment}
          appInfo={{
            appName: 'Rovify NFT Events',
            disclaimer: ({ Text, Link }) => (
              <Text>
                By connecting your wallet, you agree to the{' '}
                <Link href="https://termsofservice.xyz">Terms of Service</Link> and{' '}
                <Link href="https://disclaimer.xyz">Disclaimer</Link>
              </Text>
            ),
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
