'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Utils, type Conversation } from '@xmtp/browser-sdk';
import { useXMTP } from '@/contexts/XMTPContext';
import { isValidEthereumAddress } from '@/helpers/xmtp/strings';
import type { Conversation as XMTPConversation } from '@xmtp/browser-sdk';
// Local alias since simple context doesn't export ContentTypes
type ContentTypes = unknown;

interface ConversationsListProps {
  onSelectConversation: (conversationId: string) => void;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  onSelectConversation,
}) => {
  const { client } = useXMTP();
  const [conversations, setConversations] = useState<Conversation<ContentTypes>[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChatAddress, setNewChatAddress] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [titlesById, setTitlesById] = useState<Record<string, string>>({});

  // Helper function to add conversation without duplicates
  const addConversation = useCallback((newConversation: Conversation<ContentTypes>) => {
    setConversations((prev) => {
      // Check if conversation already exists to avoid duplicates
      const exists = prev.some(conv => conv.id === newConversation.id);
      if (exists) {
        return prev;
      }
      return [newConversation, ...prev];
    });
  }, []);

  useEffect(() => {
    if (!client) return;

    const loadConversations = async () => {
      try {
        setLoading(true);
        await client.conversations.sync();
        const convos = await client.conversations.list();
        setConversations(convos);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();

    // Set up conversation stream
    const setupStream = async () => {
      try {
        await client.conversations.stream({
          onValue: (conversation) => {
            addConversation(conversation);
          },
        });
      } catch (error) {
        console.error('Failed to setup conversation stream:', error);
      }
    };

    setupStream();

    // Cleanup function
    return () => {
      // The stream will be automatically cleaned up when the client is destroyed
      // or when the component unmounts
    };
  }, [client, addConversation]);

  const createNewChat = async () => {
    if (!client || !newChatAddress.trim()) return;

    setCreating(true);
    try {
      const address = newChatAddress.trim();
      let conversation: Conversation<ContentTypes>;

      // Check if it's an Ethereum address or inbox ID
      if (isValidEthereumAddress(address)) {
        // First, try to get the inbox ID for this address
        const utils = new Utils();
        try {
          const inboxId = await utils.getInboxIdForIdentifier(
            {
              identifier: address.toLowerCase(),
              identifierKind: 'Ethereum',
            },
            'dev', // 使用 dev 环境进行测试
          );

          if (!inboxId) {
            throw new Error('Address not registered on XMTP');
          }

          // Create conversation using inbox ID
          conversation = await client.conversations.newDm(inboxId);
        } finally {
          utils.close();
        }
      } else {
        // Assume it's an inbox ID
        conversation = await client.conversations.newDm(address);
      }

      addConversation(conversation);
      // Remember a friendly title for this conversation using the wallet address entered
      setTitlesById((prev) => ({
        ...prev,
        [conversation.id]: formatAddress(address),
      }));
      setNewChatAddress('');
      setShowNewChatModal(false);
      onSelectConversation(conversation.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to create conversation. Please check the address.',
      );
    } finally {
      setCreating(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getConversationTitle = (conversation: Conversation<ContentTypes>) => {
    // If we created this conversation locally, prefer the wallet address the user entered
    const custom = titlesById[(conversation as any).id as string];
    if (custom) return custom;

    // For groups, use the group name or "Group Chat"
    if ('name' in conversation && conversation.name) {
      return conversation.name;
    }

    // For DMs, use the peer address
    if ('peerAddress' in conversation) {
      return formatAddress(conversation.peerAddress as string);
    }

    // Fallback to a short id label to avoid "Unknown"
    const cid = (conversation as any).id as string | undefined;
    if (cid) return `${cid.slice(0, 6)}…${cid.slice(-4)}`;
    return 'Conversation';
  };

  const isGroup = (conversation: Conversation<ContentTypes>) => {
    return 'members' in conversation;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/80 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Conversations</h3>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <p>No conversations yet. Start a new chat!</p>
          </div>
        ) : (
          <div className="space-y-0.5 p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-md cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300">
                    {isGroup(conversation) ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {getConversationTitle(conversation) as string}
                      </p>
                      {isGroup(conversation) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200">
                          Group
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Click to open conversation</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Start New Chat</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={newChatAddress}
                onChange={(e) => setNewChatAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-[#FF5722] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter the Ethereum address of the person you want to chat with
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={createNewChat}
                disabled={!newChatAddress.trim() || creating}
                className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#FF5722] to-[#E64A19] hover:from-[#E64A19] hover:to-[#FF5722] shadow-lg shadow-orange-500/25"
              >
                {creating ? 'Creating...' : 'Start Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
