'use client';

import React from 'react';
import type { ContentTypeId } from '@xmtp/content-type-primitives';
import { ContentTypeReaction, type Reaction } from '@xmtp/content-type-reaction';
import { ContentTypeReply, type Reply } from '@xmtp/content-type-reply';
import { ContentTypeReadReceipt } from '@xmtp/content-type-read-receipt';
import { ContentTypeRemoteAttachment, type RemoteAttachment } from '@xmtp/content-type-remote-attachment';
import { ContentTypeTransactionReference, type TransactionReference } from '@xmtp/content-type-transaction-reference';
import { ContentTypeWalletSendCalls, type WalletSendCallsParams } from '@xmtp/content-type-wallet-send-calls';
import type { MessageContentAlign } from './Message';

export interface MessageContentProps {
  contentType: ContentTypeId;
  content: unknown;
  align: MessageContentAlign;
  conversationId: string;
  fallback?: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  contentType,
  content,
  align,
  conversationId,
  fallback,
}) => {
  // Reaction content
  if (contentType.sameAs(ContentTypeReaction)) {
    const reaction = content as Reaction;
    return (
      <div className="flex items-center space-x-2">
        <span className="text-lg">{reaction.content}</span>
        <span className="text-sm opacity-75">
          {reaction.action === 'added' ? 'reacted' : 'removed reaction'}
        </span>
      </div>
    );
  }

  // Reply content
  if (contentType.sameAs(ContentTypeReply)) {
    const reply = content as Reply;
    return (
      <div className="space-y-2">
        <div className="text-xs opacity-75">
          Replied to a message
        </div>
        <MessageContent
          contentType={reply.contentType}
          content={reply.content}
          align={align}
          conversationId={conversationId}
        />
      </div>
    );
  }

  // Read receipt
  if (contentType.sameAs(ContentTypeReadReceipt)) {
    return (
      <div className="text-sm opacity-75 italic">
        Read receipt received
      </div>
    );
  }

  // Remote attachment
  if (contentType.sameAs(ContentTypeRemoteAttachment)) {
    const attachment = content as RemoteAttachment;
    const isImage = attachment.filename?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i);

    return (
      <div className="max-w-xs border border-gray-300 rounded-lg p-3">
        {isImage ? (
          <img
            src={attachment.url}
            alt={attachment.filename || 'Attachment'}
            className="max-w-full max-h-48 object-cover rounded"
          />
        ) : (
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">{attachment.filename || 'File'}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">
            {/* File size info would need to be added to RemoteAttachment type */}
          </span>
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-xs text-blue-500 hover:text-blue-700"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>Open</span>
          </a>
        </div>
      </div>
    );
  }

  // Transaction reference
  if (contentType.sameAs(ContentTypeTransactionReference)) {
    const transaction = content as TransactionReference;

    if (transaction.metadata) {
      return (
        <div className="max-w-sm border border-gray-300 rounded-lg p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">💸 Transaction</span>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                Chain {transaction.networkId}
              </span>
            </div>

            {transaction.metadata.currency && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="text-sm font-medium">
                  {(transaction.metadata.amount / Math.pow(10, transaction.metadata.decimals)).toFixed(transaction.metadata.decimals)} {transaction.metadata.currency}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Hash:</span>
              <span className="text-xs font-mono">
                {transaction.reference.slice(0, 10)}...{transaction.reference.slice(-8)}
              </span>
            </div>

            <a
              href={`https://etherscan.io/tx/${transaction.reference}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-1 text-sm text-blue-500 hover:text-blue-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>View on Explorer</span>
            </a>
          </div>
        </div>
      );
    }

    return (
      <a
        href={`https://etherscan.io/tx/${transaction.reference}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-700"
      >
        View transaction on explorer
      </a>
    );
  }

  // Wallet send calls
  if (contentType.sameAs(ContentTypeWalletSendCalls)) {
    const walletCalls = content as WalletSendCallsParams;

    return (
      <div className="border border-gray-300 rounded-lg p-3">
        <div className="space-y-2">
          <div className="font-medium">🚀 Transaction Request</div>
          <div className="text-sm">Review the following transactions:</div>

          <div className="space-y-1">
            {walletCalls.calls.map((call, index) => (
              <div key={index} className="border border-gray-200 rounded p-2">
                <div className="text-sm">{call.metadata?.description || 'Transaction'}</div>
                {call.to && (
                  <div className="text-xs text-gray-600">To: {call.to}</div>
                )}
              </div>
            ))}
          </div>

          <button className="w-full px-3 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors">
            Execute Transaction
          </button>
        </div>
      </div>
    );
  }

  // Default text content
  if (typeof content === 'string') {
    return (
      <div className="text-sm whitespace-pre-wrap break-words">
        {content}
      </div>
    );
  }

  // Fallback content
  if (fallback) {
    return (
      <div className="text-sm opacity-75 italic">
        {fallback}
      </div>
    );
  }

  // Unknown content type
  return (
    <pre className="text-xs bg-gray-100 p-2 rounded whitespace-pre-wrap break-all">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
};
