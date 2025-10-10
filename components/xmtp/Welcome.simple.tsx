'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useXMTP } from '@/contexts/XMTPContext';
import { useConnectWallet } from '@/hooks/useConnectWallet';

export const Welcome: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { client, loading, error } = useXMTP();
  const { connectWallet } = useConnectWallet();

  const handleConnect = async () => {
    if (isConnected && address) {
      await connectWallet();
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            Welcome to XMTP Chat
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
            Connect your wallet to start chatting with other users
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5722] mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Initializing XMTP...
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we set up your chat client
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isInstallLimit = /already registered 10\/10 installations/i.test(error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Error Initializing XMTP
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {isInstallLimit
                ? 'This wallet reached the 10/10 XMTP installations limit. Please revoke existing installations or switch to a different wallet.'
                : error}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleConnect}
                className="bg-gradient-to-r from-[#FF5722] to-[#E64A19] hover:from-[#E64A19] hover:to-[#FF5722] text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-lg shadow-orange-500/25"
              >
                Try Again
              </button>
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Ready to Chat
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Click the button below to initialize your XMTP client
            </p>
            <button
              onClick={handleConnect}
              className="bg-gradient-to-r from-[#FF5722] to-[#E64A19] hover:from-[#E64A19] hover:to-[#FF5722] text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-lg shadow-orange-500/25"
            >
              Initialize XMTP
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null; // This component is only for the initial state
};
