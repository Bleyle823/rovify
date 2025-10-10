'use client';

import React, { useState } from "react";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import { MessageContent } from "./MessageContent";
import { ReadStatus } from "./ReadStatus";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { formatMessageDate } from "@/utils/xmtp/xmtpHelpers";

export type MessageContentAlign = "left" | "right";

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
      className="message-container"
      onMouseEnter={() => {
        setShowActions(true);
      }}
      onMouseLeave={() => {
        setShowActions(false);
      }}
    >
      <div className="space-y-1">
        <div
          className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}
        >
          <div className="flex flex-col items-end space-y-1">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{formatMessageDate(new Date(Number(message.sentAtNs / 1000000n)))}</span>
              <span className="font-mono text-xs">
                {message.senderInboxId?.slice(0, 8)}...
              </span>
            </div>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                align === "right"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-900"
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
        </div>

        {/* Read status indicator */}
        <ReadStatus message={message} isRead={isRead} align={align} />

        {/* Action buttons */}
        {showActions && (onReply || onReaction) && (
          <div
            className={`flex items-center space-x-2 ${
              align === "right" ? "justify-end" : "justify-start"
            }`}
          >
            {onReply && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReply();
                }}
                className="p-1 text-gray-500 hover:text-orange-500 rounded-full hover:bg-gray-100 transition-colors"
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
                    handleReaction("👍");
                  }}
                  className="p-1 text-gray-500 hover:text-orange-500 rounded-full hover:bg-gray-100 transition-colors"
                  title="React with 👍"
                >
                  👍
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReaction("❤️");
                  }}
                  className="p-1 text-gray-500 hover:text-orange-500 rounded-full hover:bg-gray-100 transition-colors"
                  title="React with ❤️"
                >
                  ❤️
                </button>

                <div className="relative inline-block">
                  <button
                    className="p-1 text-gray-500 hover:text-orange-500 rounded-full hover:bg-gray-100 transition-colors"
                    title="More reactions"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  {/* More reactions dropdown would go here */}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
