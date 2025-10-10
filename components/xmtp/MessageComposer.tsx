'use client';

import React, { useRef, useState } from 'react';
import type { Conversation, DecodedMessage } from '@xmtp/browser-sdk';
import {
  ContentTypeReaction,
  type Reaction,
} from '@xmtp/content-type-reaction';
import { ContentTypeReply, type Reply } from '@xmtp/content-type-reply';
import { ContentTypeTransactionReference } from '@xmtp/content-type-transaction-reference';
import { ContentTypeWalletSendCalls } from '@xmtp/content-type-wallet-send-calls';
import type { ContentTypes } from '@/contexts/XMTPContext';

export interface MessageComposerProps {
  conversation: Conversation<ContentTypes>;
  replyingTo?: DecodedMessage<ContentTypes> | null;
  onCancelReply?: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  conversation,
  replyingTo,
  onCancelReply,
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      if (replyingTo) {
        // Send reply
        const replyContent: Reply = {
          reference: replyingTo.id,
          contentType: replyingTo.contentType,
          content: message.trim(),
        };
        await conversation.send(replyContent, ContentTypeReply);
        onCancelReply?.();
      } else {
        // Send regular text message
        await conversation.send(message.trim());
      }

      setMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const sendReaction = async (emoji: string) => {
    if (!replyingTo) return;

    try {
      const reactionContent: Reaction = {
        reference: replyingTo.id,
        action: 'added' as const,
        content: emoji,
        schema: 'unicode',
      };
      await conversation.send(reactionContent, ContentTypeReaction);
    } catch (error) {
      console.error('Failed to send reaction:', error);
    }
  };

  const sendTransactionReference = async () => {
    try {
      const transactionReference = {
        namespace: 'eip155',
        networkId: 1,
        reference: '0x1234567890abcdef1234567890abcdef12345678',
        metadata: {
          transactionType: 'transfer',
          currency: 'USDC',
          amount: Math.floor(1.0 * Math.pow(10, 6)),
          decimals: 6,
          fromAddress: '0x456...def',
          toAddress: '0x789...ghi',
        },
      };

      await conversation.send(
        transactionReference,
        ContentTypeTransactionReference,
      );
      setShowTestModal(false);
    } catch (error) {
      console.error('Failed to send transaction reference:', error);
    }
  };

  const sendWalletSendCalls = async () => {
    try {
      const walletSendCallsParams = {
        version: '1.0',
        chainId: '0x1' as `0x${string}`,
        from: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        calls: [
          {
            to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' as `0x${string}`,
            data: '0x' as `0x${string}`,
            value: '0x16345785D8A0000' as `0x${string}`, // 0.1 ETH in wei
            metadata: {
              description: 'Send 0.1 ETH',
              transactionType: 'transfer',
            },
          },
        ],
        capabilities: {},
      };

      await conversation.send(
        walletSendCallsParams,
        ContentTypeWalletSendCalls,
      );
      setShowTestModal(false);
    } catch (error) {
      console.error('Failed to send wallet send calls:', error);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-orange-600">Replying to:</span>
              <span className="text-sm text-gray-600 truncate max-w-xs">
                {typeof replyingTo.content === 'string'
                  ? replyingTo.content.slice(0, 50) +
                  (replyingTo.content.length > 50 ? '...' : '')
                  : 'Message'}
              </span>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4">
        <div className="flex items-end space-x-2">
          {/* Attachment button */}
          <button
            onClick={() => setShowAttachmentModal(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Attach file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Message input */}
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder={replyingTo ? 'Type your reply...' : 'Type a message...'}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={sending}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          {/* Test message types button */}
          <button
            onClick={() => setShowTestModal(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Test message types"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Test Message Types</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => sendReaction('👍')}
                className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200"
              >
                Send 👍 Reaction
              </button>
              <button
                onClick={() => sendReaction('❤️')}
                className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200"
              >
                Send ❤️ Reaction
              </button>
              <button
                onClick={sendTransactionReference}
                className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200"
              >
                Send Transaction Reference
              </button>
              <button
                onClick={sendWalletSendCalls}
                className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200"
              >
                Send Transaction Request
              </button>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Modal */}
      {showAttachmentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Attach File</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 mb-2">Drag files here or click to select</p>
              <p className="text-sm text-gray-500">Attach files up to 10MB</p>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAttachmentModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
