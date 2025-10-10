'use client';

import React from 'react';
import type { DecodedMessage } from '@xmtp/browser-sdk';
import type { ContentTypes, MessageContentAlign } from '@/contexts/XMTPContext';

interface ReadStatusProps {
  message: DecodedMessage<ContentTypes>;
  isRead: boolean;
  align: MessageContentAlign;
}

export const ReadStatus: React.FC<ReadStatusProps> = ({
  message,
  isRead,
  align,
}) => {
  // Only show read status for messages sent by current user
  if (align !== 'right') {
    return null;
  }

  return (
    <div className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'} mt-1`}>
      <div className="flex items-center space-x-1">
        {isRead ? (
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-gray-500">Read</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-gray-500">Sent</span>
          </div>
        )}
      </div>
    </div>
  );
};
