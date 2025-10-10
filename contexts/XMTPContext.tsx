'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Client, type Signer, type ExtractCodecContentTypes } from '@xmtp/browser-sdk';
import { ReactionCodec } from '@xmtp/content-type-reaction';
import { ReplyCodec } from '@xmtp/content-type-reply';
import { ReadReceiptCodec } from '@xmtp/content-type-read-receipt';
import { RemoteAttachmentCodec } from '@xmtp/content-type-remote-attachment';
import { TransactionReferenceCodec } from '@xmtp/content-type-transaction-reference';
import { WalletSendCallsCodec } from '@xmtp/content-type-wallet-send-calls';
import { ContentTypeReaction } from '@xmtp/content-type-reaction';
import { ContentTypeReply } from '@xmtp/content-type-reply';
import { ContentTypeReadReceipt } from '@xmtp/content-type-read-receipt';
import { ContentTypeRemoteAttachment } from '@xmtp/content-type-remote-attachment';
import { ContentTypeTransactionReference } from '@xmtp/content-type-transaction-reference';
import { ContentTypeWalletSendCalls } from '@xmtp/content-type-wallet-send-calls';
import { setupGlobalWasmResolver } from '@/utils/xmtp/wasmLoader';

interface XMTPContextValue {
  client: Client<ContentTypes> | null;
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
  const [client, setClient] = useState<Client<ContentTypes> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeClient = useCallback(async (signer: Signer) => {
    setLoading(true);
    setError(null);

    try {
      // Small delay to avoid race conditions with provider mount
      // Add a small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Setup global WASM URL resolver (main thread + workers)
      const restoreFetch = setupGlobalWasmResolver();
      
      try {
        // Proactively "warm up" IndexedDB stores used by xmtp_mls to avoid Database(NotFound)
        const warmUpIndexedDb = async () => {
          if (typeof indexedDB === 'undefined') return;
          const openDb = (name: string) => new Promise<void>((resolve) => {
            try {
              const req = indexedDB.open(name);
              req.onsuccess = () => resolve();
              req.onupgradeneeded = () => resolve();
              req.onerror = () => resolve();
            } catch {
              resolve();
            }
          });
          await Promise.all([
            openDb('xmtp'),
            openDb('xmtp-mls'),
            openDb('xmtp-client'),
          ]);
        };

        await warmUpIndexedDb();

        const createClient = () => Client.create(signer, {
          env: process.env.NEXT_PUBLIC_XMTP_ENV === 'production' ? 'production' : 'dev',
          codecs: [
            new ReactionCodec(),
            new ReplyCodec(),
            new ReadReceiptCodec(),
            new RemoteAttachmentCodec(),
            new TransactionReferenceCodec(),
            new WalletSendCallsCodec(),
          ],
        });

        let newClient: Client<ContentTypes> | null = null;
        let lastError: unknown = null;
        // Try up to 3 times with warm-up between attempts
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            newClient = await createClient();
            break;
          } catch (e: any) {
            lastError = e;
            const msg = String(e?.message || e);
            const isDbNotFound = msg.includes('Database(NotFound)') || msg.includes('Metadata(Connection');
            if (isDbNotFound && attempt < 3) {
              await warmUpIndexedDb();
              // small backoff
              await new Promise(r => setTimeout(r, attempt * 150));
              continue;
            }
            throw e;
          }
        }
        
        setClient(newClient);
      } finally {
        // Restore original fetch
        restoreFetch();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize XMTP client';
      setError(errorMessage);
      console.error('Failed to initialize XMTP client:', err);
      
      // If it's a WASM-related error, provide more specific guidance
      if (errorMessage.includes('wasm') || errorMessage.includes('WebAssembly') || errorMessage.includes('fetch')) {
        setError('Failed to load XMTP WebAssembly modules. Please refresh the page and try again.');
      }
      // If wallet reached install cap
      if (/already registered 10\/10 installations/i.test(errorMessage)) {
        setError('This wallet reached the 10/10 XMTP installations limit. Revoke old installations at https://xmtp.chat or use another wallet.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

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

// Content types definition
export type ContentTypes = ExtractCodecContentTypes<
  [
    ReactionCodec,
    ReplyCodec,
    ReadReceiptCodec,
    RemoteAttachmentCodec,
    TransactionReferenceCodec,
    WalletSendCallsCodec,
  ]
>;

export type MessageContentAlign = 'left' | 'right';

