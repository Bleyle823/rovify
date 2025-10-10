'use client';

import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useXMTP } from '@/contexts/XMTPContext';
import { createSigner } from '@/helpers/xmtp/createSigner';

export const useConnectWallet = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { openConnectModal } = useConnectModal();
  const { initializeClient, loading: xmtpLoading } = useXMTP();

  const connectWallet = useCallback(async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    if (!walletClient) {
      console.error('Wallet client not available');
      return;
    }

    try {
      const signer = createSigner(walletClient);
      await initializeClient(signer);
    } catch (error) {
      console.error('Failed to connect to XMTP:', error);
    }
  }, [isConnected, walletClient, openConnectModal, initializeClient]);

  return {
    address,
    isConnected,
    connectWallet,
    loading: xmtpLoading,
  };
};
