import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Client, type Signer } from '@xmtp/browser-sdk';

declare global {
  interface Window {
    XMTP?: any;
  }
}

interface XMTPContextValue {
  client: Client | null;
  loading: boolean;
  error: string | null;
  initializeClient: (signer: Signer) => Promise<void>;
  disconnect: () => void;
}

const XMTPContext = createContext<XMTPContextValue | undefined>(undefined);

export const useXMTP = () => {
  const context = useContext(XMTPContext);
  if (!context) {
    throw new Error('useXMTP must be used within an XMTPProvider');
  }
  return context;
};

interface XMTPProviderProps {
  children: ReactNode;
}

export const XMTPProvider: React.FC<XMTPProviderProps> = ({ children }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isXMTPAvailable, setIsXMTPAvailable] = useState(false);

  // Check if XMTP is available (WASM loaded)
  useEffect(() => {
    const checkXMTPAvailability = async () => {
      try {
        // Try to check if XMTP SDK is properly loaded
        if (typeof window !== 'undefined' && window.XMTP) {
          setIsXMTPAvailable(true);
        } else {
          // Fallback: try to import and check
          const { Client } = await import('@xmtp/browser-sdk');
          setIsXMTPAvailable(true);
        }
      } catch (err) {
        console.warn('XMTP not available:', err);
        setIsXMTPAvailable(false);
      }
    };

    checkXMTPAvailability();
  }, []);

  const initializeClient = useCallback(async (signer: Signer) => {
    if (!isXMTPAvailable) {
      setError('XMTP is not available. Please check your browser compatibility.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Initializing XMTP client...');

      const newClient = await Client.create(signer, {
        env: process.env.NEXT_PUBLIC_XMTP_ENV === 'production' ? 'production' : 'dev',
      });

      setClient(newClient);
      console.log('XMTP client initialized:', newClient);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize XMTP client';
      setError(errorMessage);
      console.error('Failed to initialize XMTP client:', err);
    } finally {
      setLoading(false);
    }
  }, [isXMTPAvailable]);

  const disconnect = useCallback(() => {
    setClient(null);
    setError(null);
  }, []);

  const value: XMTPContextValue = {
    client,
    loading,
    error,
    initializeClient,
    disconnect,
  };

  return (
    <XMTPContext.Provider value={value}>
      {children}
    </XMTPContext.Provider>
  );
};
