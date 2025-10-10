'use client';

import React, { useEffect, useState } from 'react';
import type { Conversation, DecodedMessage } from '@xmtp/browser-sdk';
import { ContentTypeReaction, type Reaction } from '@xmtp/content-type-reaction';
import { ContentTypeReadReceipt } from '@xmtp/content-type-read-receipt';
import { useXMTP } from '@/contexts/XMTPContext';
import type { ContentTypes } from '@/contexts/XMTPContext';
import { filterReadReceipts, sendReadReceipt } from '@/utils/xmtp/readReceipts';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';

interface ConversationViewProps {
  conversationId: string;
  onBack: () => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversationId,
  onBack,
}) => {
  const { client } = useXMTP();

  // Use ContentTypes consistently everywhere
  const [conversation, setConversation] = useState<Conversation<ContentTypes> | null>(null);
  const [messages, setMessages] = useState<DecodedMessage<ContentTypes>[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<DecodedMessage<ContentTypes> | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    if (!client || !conversationId) return;

    const loadConversation = async () => {
      try {
        setLoading(true);

        // Cast the conversation ONCE to your app's ContentTypes
        const conv = (await client.conversations.getConversationById(
          conversationId
        )) as unknown as Conversation<ContentTypes>;

        if (!conv) {
          alert('Conversation not found');
          return;
        }

        setConversation(conv);

        await conv.sync();

        // Cast messages to your ContentTypes (SDK returns unknown by default)
        const msgs = (await conv.messages()) as unknown as DecodedMessage<ContentTypes>[];
        setMessages(msgs);

        const stream = await conv.stream({
          onValue: (message: DecodedMessage<ContentTypes>) => {
            setMessages((prev) => {
              if (prev.some((m) => m.id === message.id)) return prev;

              if (message.contentType.sameAs(ContentTypeReadReceipt)) {
                if (message.senderInboxId !== client?.inboxId) {
                  console.log('Message read by peer');
                }
              } else if (message.senderInboxId !== client!.inboxId) {
                setHasUnreadMessages(true);
              }

              return [...prev, message];
            });
          },
        });

        return () => {
          stream.end();
        };
      } catch (error) {
        console.error('Failed to load conversation:', error);
        alert('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    void loadConversation();
  }, [client, conversationId]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && hasUnreadMessages && conversation && client?.inboxId) {
        const chatMessages = filterReadReceipts(messages as DecodedMessage<ContentTypes>[]);
        const hasNewMessagesFromPeer = chatMessages.some(
          (msg) => msg.senderInboxId !== client.inboxId
        );

        if (hasNewMessagesFromPeer) {
          await sendReadReceipt(conversation);
          setHasUnreadMessages(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (hasUnreadMessages && conversation && !document.hidden) {
      void handleVisibilityChange();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasUnreadMessages, conversation, messages, client?.inboxId]);

  const handleReply = (message: DecodedMessage<ContentTypes>) => {
    setReplyingTo(message);
  };

  const handleReaction = async (
    message: DecodedMessage<ContentTypes>,
    emoji: string
  ) => {
    if (!conversation) return;

    try {
      const reactionContent: Reaction = {
        reference: message.id,
        action: 'added',
        content: emoji,
        schema: 'unicode',
      };

      await conversation.send(reactionContent, ContentTypeReaction);
    } catch (error) {
      console.error('Failed to send reaction:', error);
    }
  };

  const handleRefresh = async () => {
    if (!conversation) return;

    try {
      await conversation.sync();
      const msgs = (await conversation.messages()) as unknown as DecodedMessage<ContentTypes>[];
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    }
  };

  const getConversationTitle = () => {
    if (!conversation) return 'Loading...';

    if ('name' in conversation && (conversation as any).name) {
      return (conversation as any).name as string;
    }

    if ('peerAddress' in conversation) {
      const addr = (conversation as any).peerAddress as string;
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }

    return 'Conversation';
  };

  const getPeerInboxId = (): string | undefined => {
    if (!conversation || !client?.inboxId) return undefined;

    const chatMessages = filterReadReceipts(messages as DecodedMessage<ContentTypes>[]);
    const peerMessage = chatMessages.find(
      (msg) => msg.senderInboxId !== client.inboxId
    );

    return peerMessage?.senderInboxId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">
              {getConversationTitle()}
            </h2>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUserInboxId={client?.inboxId || ''}
            peerInboxId={getPeerInboxId()}
            onReply={handleReply}
            onReaction={handleReaction}
          />
        )}
      </div>

      {/* Composer */}
      <MessageComposer
        conversation={conversation}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
};
