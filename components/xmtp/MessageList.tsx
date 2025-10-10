'use client';

import React, { useEffect, useRef } from 'react';
import type { DecodedMessage } from '@xmtp/browser-sdk';
import type { ContentTypes } from '@/contexts/XMTPContext';
import { filterReadReceipts, getReadReceipts, isMessageRead } from '@/utils/xmtp/readReceipts';
import { Message } from './Message';

export interface MessageListProps {
  messages: DecodedMessage<ContentTypes>[];
  currentUserInboxId: string;
  peerInboxId?: string;
  onReply?: (message: DecodedMessage<ContentTypes>) => void;
  onReaction?: (message: DecodedMessage<ContentTypes>, emoji: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserInboxId,
  peerInboxId,
  onReply,
  onReaction,
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const getSenderInboxId = (message: DecodedMessage<ContentTypes>) => {
    return message.senderInboxId || '';
  };

  // 过滤掉已读回执消息，只显示实际的聊天消息
  const chatMessages = filterReadReceipts(messages);

  // 获取所有已读回执消息
  const readReceipts = getReadReceipts(messages);

  return (
    <div
      ref={scrollAreaRef}
      className="h-full overflow-y-auto p-4 space-y-4"
    >
      {chatMessages.map((message) => {
        const senderInboxId = getSenderInboxId(message);
        const isCurrentUser = senderInboxId === currentUserInboxId;

        // 检查消息是否已被读取（只对当前用户发送的消息检查）
        const messageIsRead = isCurrentUser && peerInboxId
          ? isMessageRead(message, readReceipts, peerInboxId)
          : false;

        return (
          <Message
            key={message.id}
            message={message}
            align={isCurrentUser ? 'right' : 'left'}
            onReply={onReply}
            onReaction={onReaction}
            isRead={messageIsRead}
          />
        );
      })}
    </div>
  );
};
