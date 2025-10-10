'use client';

import React from "react";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import type { ContentTypes } from "@/contexts/XMTPContext";

export interface ReadStatusProps {
  message: DecodedMessage<ContentTypes>;
  isRead: boolean;
  align: "left" | "right";
}

export const ReadStatus: React.FC<ReadStatusProps> = ({
  message,
  isRead,
  align,
}) => {
  // Only show read status for sent messages (right aligned)
  if (align !== "right") {
    return null;
  }

  return (
    <div className="flex items-center justify-end space-x-2 text-xs text-gray-500">
      <span>
        {new Date(Number(message.sentAtNs / 1000000n)).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <div className="flex items-center space-x-1">
        {isRead ? (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        <span className={isRead ? "text-blue-500 font-medium" : "text-gray-500"}>
          {isRead ? "Read" : "Sent"}
        </span>
      </div>
    </div>
  );
};
