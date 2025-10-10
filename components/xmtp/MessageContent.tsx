'use client';

import React from 'react';
import type { ContentTypeId } from '@xmtp/content-type-primitives';
import { ContentTypeReaction } from '@xmtp/content-type-reaction';
import { ContentTypeReply } from '@xmtp/content-type-reply';
import { ContentTypeReadReceipt } from '@xmtp/content-type-read-receipt';
import { ContentTypeRemoteAttachment } from '@xmtp/content-type-remote-attachment';
import { ContentTypeTransactionReference } from '@xmtp/content-type-transaction-reference';
import { ContentTypeWalletSendCalls } from '@xmtp/content-type-wallet-send-calls';
import type { ContentTypes, MessageContentAlign } from '@/contexts/XMTPContext';

interface MessageContentProps {
  contentType: ContentTypeId;
  content: any;
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
  // Text message
  if (contentType.sameAs(ContentTypeReaction)) {
    return (
      <div className="text-sm">
        <span className="text-gray-500">Reacted with </span>
        <span className="text-lg">{content.content}</span>
      </div>
    );
  }

  // Reply message
  if (contentType.sameAs(ContentTypeReply)) {
    return (
      <div className="text-sm">
        <div className="text-gray-500 text-xs mb-1">Replying to:</div>
        <div className="bg-gray-100 rounded p-2 mb-2 text-xs text-gray-600">
          {typeof content.content === 'string' ? content.content.slice(0, 100) : 'Message'}
        </div>
        <div>{content.content}</div>
      </div>
    );
  }

  // Read receipt
  if (contentType.sameAs(ContentTypeReadReceipt)) {
    return (
      <div className="text-xs text-gray-500 italic">
        Message read
      </div>
    );
  }

  // Remote attachment
  if (contentType.sameAs(ContentTypeRemoteAttachment)) {
    return (
      <div className="text-sm">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span>{content.filename}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {(content.contentLength / 1024).toFixed(1)} KB
        </div>
      </div>
    );
  }

  // Transaction reference
  if (contentType.sameAs(ContentTypeTransactionReference)) {
    return (
      <div className="text-sm">
        <div className="bg-gray-100 rounded p-3">
          <div className="font-medium mb-2">Transaction Reference</div>
          <div className="space-y-1 text-xs">
            <div><span className="font-medium">Type:</span> {content.metadata.transactionType}</div>
            <div><span className="font-medium">Amount:</span> {content.metadata.amount / Math.pow(10, content.metadata.decimals)} {content.metadata.currency}</div>
            <div><span className="font-medium">From:</span> {content.metadata.fromAddress.slice(0, 6)}...{content.metadata.fromAddress.slice(-4)}</div>
            <div><span className="font-medium">To:</span> {content.metadata.toAddress.slice(0, 6)}...{content.metadata.toAddress.slice(-4)}</div>
            <div><span className="font-medium">Hash:</span> {content.reference.slice(0, 10)}...</div>
          </div>
        </div>
      </div>
    );
  }

  // Wallet send calls
  if (contentType.sameAs(ContentTypeWalletSendCalls)) {
    return (
      <div className="text-sm">
        <div className="bg-gray-100 rounded p-3">
          <div className="font-medium mb-2">Transaction Request</div>
          <div className="space-y-1 text-xs">
            <div><span className="font-medium">Chain:</span> {content.chainId}</div>
            <div><span className="font-medium">To:</span> {content.calls[0]?.to.slice(0, 6)}...{content.calls[0]?.to.slice(-4)}</div>
            <div><span className="font-medium">Description:</span> {content.calls[0]?.metadata.description}</div>
          </div>
        </div>
      </div>
    );
  }


  // Default text message
  if (typeof content === 'string') {
    return <div className="text-sm whitespace-pre-wrap">{content}</div>;
  }

  // Fallback
  return (
    <div className="text-sm text-gray-500 italic">
      {fallback || 'Unsupported message type'}
    </div>
  );
};
