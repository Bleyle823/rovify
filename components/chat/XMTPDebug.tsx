'use client';

import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { FiMessageCircle, FiCheck, FiX, FiLoader, FiAlertCircle } from 'react-icons/fi';

export default function XMTPDebug() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState<{ success: boolean; error?: string } | null>(null);

  const testXMTPInit = async () => {
    if (!walletClient) {
      setInitResult({ success: false, error: 'No wallet client available' });
      return;
    }

    setIsInitializing(true);
    setInitResult(null);

    try {
      // Import XMTP dynamically to avoid SSR issues and grab types
      const { Client } = await import('@xmtp/browser-sdk');

      // --- XMTP signer adapter around wagmi/viem walletClient ---
      // We cast at the boundary to satisfy XMTP's discriminated union.
      const signer = {
        // Use the EOA branch; XMTP will treat this as a standard externally-owned account.
        type: 'EOA',

        // XMTP will call these. We delegate to viem walletClient.
        getAddress: async () => {
          const [addr] = await walletClient.getAddresses();
          return addr;
        },

        signMessage: async (message: string) => {
          const [account] = await walletClient.getAddresses();
          return walletClient.signMessage({ message, account });
        },

        getChainId: async () => {
          return walletClient.getChainId();
        },
      } as unknown as import('@xmtp/browser-sdk').Signer;
      // ----------------------------------------------------------

    //   const client = await Client.create(signer, {
    //     env: 'dev'
    //   });

    const client = await Client.create(signer);

      console.log('XMTP client created successfully:', client);
      setInitResult({ success: true });
    } catch (error: any) {
      console.error('XMTP initialization failed:', error);
      setInitResult({
        success: false,
        error: error?.message || 'Unknown error occurred',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center">
          <FiMessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600">Connect your wallet to test XMTP functionality</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold text-gray-900 mb-4">XMTP Debug Test</h2>

      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <FiCheck className="w-5 h-5 text-green-500" />
            ) : (
              <FiX className="w-5 h-5 text-red-500" />
            )}
            <span className="font-medium">
              {isConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
            </span>
          </div>
        </div>

        {/* Wallet Client Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {walletClient ? (
              <FiCheck className="w-5 h-5 text-green-500" />
            ) : (
              <FiX className="w-5 h-5 text-red-500" />
            )}
            <span className="font-medium">
              {walletClient ? 'Wallet Client Available' : 'Wallet Client Not Available'}
            </span>
          </div>
        </div>

        {/* Test Button */}
        <button
          onClick={testXMTPInit}
          disabled={!walletClient || isInitializing}
          className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isInitializing ? (
            <>
              <FiLoader className="w-4 h-4 animate-spin" />
              <span>Testing XMTP...</span>
            </>
          ) : (
            <>
              <FiMessageCircle className="w-4 h-4" />
              <span>Test XMTP Initialization</span>
            </>
          )}
        </button>

        {/* Result Display */}
        {initResult && (
          <div
            className={`p-4 rounded-lg ${
              initResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {initResult.success ? (
                <FiCheck className="w-5 h-5 text-green-500" />
              ) : (
                <FiAlertCircle className="w-5 h-5 text-red-500" />
              )}
              <h4
                className={`font-medium ${
                  initResult.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {initResult.success ? 'Success!' : 'Error'}
              </h4>
            </div>
            {initResult.error && (
              <p className="text-red-700 text-sm mt-2">{initResult.error}</p>
            )}
          </div>
        )}

        {/* Current Address */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Your Address:</strong> {address}
          </p>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Debug Instructions:</h4>
          <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
            <li>Make sure your wallet is connected</li>
            <li>Click &quot;Test XMTP Initialization&quot; to test the client creation</li>
            <li>Check the browser console for detailed logs</li>
            <li>If successful, XMTP should work in the chat</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
