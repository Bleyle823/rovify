'use client';

import React, { useState } from 'react';
import type { DecodedMessage } from '@xmtp/browser-sdk';
import type { ContentTypes } from '@/contexts/XMTPContext';
import { MessageContent } from './MessageContent';
import { ReadStatus } from './ReadStatus';

export type MessageContentAlign = 'left' | 'right';

export interface MessageProps {
  message: DecodedMessage<ContentTypes>;
  align: MessageContentAlign;
  onReply?: (message: DecodedMessage<ContentTypes>) => void;
  onReaction?: (message: DecodedMessage<ContentTypes>, emoji: string) => void;
  isRead?: boolean;
}

export const Message: React.FC<MessageProps> = ({
  message,
  align,
  onReply,
  onReaction,
  isRead = false,
}) => {
  const [showActions, setShowActions] = useState(false);

  const handleReaction = (emoji: string) => {
    onReaction?.(message, emoji);
  };

  const handleReply = () => {
    onReply?.(message);
  };

  return (
    <div
      className="group relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            align === 'right'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-gray-900 border border-gray-200'
          }`}
        >
          <MessageContent
            contentType={message.contentType}
            content={message.content}
            align={align}
            conversationId={message.conversationId}
            fallback={message.fallback}
          />
        </div>
      </div>

      {/* Read status */}
      <ReadStatus message={message} isRead={isRead} align={align} />

      {/* Actions */}
      {showActions && (onReply || onReaction) && (
        <div className={`flex space-x-1 mt-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
          {onReply && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReply();
              }}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Reply"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
          )}

          {onReaction && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReaction('👍');
                }}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="React with 👍"
              >
                👍
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReaction('❤️');
                }}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="React with ❤️"
              >
                ❤️
              </button>

              <div className="relative group">
                <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>

                {/* More reactions dropdown */}
                <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => handleReaction('😀')}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    >
                      😀 Happy
                    </button>
                    <button
                      onClick={() => handleReaction('😢')}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    >
                      😢 Sad
                    </button>
                    <button
                      onClick={() => handleReaction('😮')}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    >
                      😮 Surprised
                    </button>
                    <button
                      onClick={() => handleReaction('😡')}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    >
                      😡 Angry
                    </button>
                    <button
                      onClick={() => handleReaction('🎉')}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    >
                      🎉 Celebrate
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
