'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  FiSend, FiPaperclip, FiSmile, FiMoreHorizontal, FiSearch,
  FiPhone, FiVideo, FiX, FiAlertCircle, FiLoader, FiMessageCircle
} from 'react-icons/fi';
import { useAccount, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useXMTP } from '@/hooks/useXMTP';
import { XMTPMessage, XMTPConversation } from '@/services/xmtpServiceSimple';

interface ChatMessage extends XMTPMessage {
  isOwn: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

interface ChatConversation extends XMTPConversation {
  peerName: string;
  peerAvatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
}

export default function XMTPChatWithRainbowKit() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const {
    isInitialized,
    isLoading,
    error,
    conversations,
    messages,
    currentConversation,   // base XMTPConversation (no extra fields)
    initialize,
    loadConversations,
    sendMessage,            // expects ONE argument (message string)
    createConversation,
    canMessage,
    setCurrentConversation,
    clearError,
  } = useXMTP();

  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatAddress, setNewChatAddress] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Manual XMTP initialization with better error handling
  const handleInitializeXMTP = useCallback(async () => {
    if (!walletClient || !address) {
      setInitError('Wallet not connected');
      return;
    }

    setIsInitializing(true);
    setInitError(null);

    try {
      await initialize();
    } catch (error: any) {
      console.error('XMTP initialization failed:', error);
      setInitError(error?.message || 'Failed to initialize XMTP');
    } finally {
      setIsInitializing(false);
    }
  }, [walletClient, address, initialize]);

  // Auto-initialize when wallet connects
  useEffect(() => {
    if (isConnected && walletClient && address && !isInitialized && !isLoading && !isInitializing) {
      handleInitializeXMTP();
    }
  }, [isConnected, walletClient, address, isInitialized, isLoading, isInitializing, handleInitializeXMTP]);

  // Convert XMTP conversations to chat conversations (with UI extras)
  useEffect(() => {
    const chatConvs: ChatConversation[] = conversations.map(conv => ({
      ...conv,
      peerName: `${conv.peerAddress.slice(0, 6)}...${conv.peerAddress.slice(-4)}`,
      peerAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.peerAddress}`,
      lastMessage: 'No messages yet',
      lastMessageTime: conv.updatedAt,
      unreadCount: 0,
      isOnline: false,
    }));
    setChatConversations(chatConvs);
  }, [conversations]);

  // Convert XMTP messages to chat messages
  useEffect(() => {
    const chatMsgs: ChatMessage[] = messages.map(msg => ({
      ...msg,
      isOwn: msg.senderAddress.toLowerCase() === address?.toLowerCase(),
      status: 'sent' as const,
    }));
    setChatMessages(chatMsgs);
  }, [messages, address]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return;

    const messageToSend = newMessage.trim();
    setNewMessage('');

    try {
      // ✅ sendMessage expects only ONE argument (the message string)
      await sendMessage(messageToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleStartNewChat = async () => {
    if (!newChatAddress.trim()) return;

    try {
      const canMsg = await canMessage(newChatAddress);
      if (!canMsg) {
        alert('This address cannot receive XMTP messages');
        return;
      }

      const conversation = await createConversation(newChatAddress);
      setCurrentConversation(conversation);
      setShowNewChat(false);
      setNewChatAddress('');
    } catch (error) {
      console.error('Failed to start new conversation:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const filteredConversations = chatConversations.filter(conv =>
    conv.peerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.peerAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 🔑 derive the active augmented conversation for UI fields
  const activeConversation = currentConversation
    ? chatConversations.find(c => c.topic === currentConversation.topic)
    : undefined;

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiMessageCircle className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h3>
          <p className="text-gray-600 mb-6">
            Connect your wallet to start using XMTP chat and send decentralized messages.
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  // XMTP initialization error
  if (initError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiAlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">XMTP Error</h3>
          <p className="text-gray-600 mb-6">{initError}</p>
          <div className="space-y-3">
            <button
              onClick={handleInitializeXMTP}
              disabled={isInitializing}
              className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isInitializing ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  <span>Initializing...</span>
                </>
              ) : (
                <>
                  <FiMessageCircle className="w-4 h-4" />
                  <span>Retry XMTP Initialization</span>
                </>
              )}
            </button>
            <button
              onClick={() => setInitError(null)}
              className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || isInitializing || (!isInitialized && isConnected)) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Initializing XMTP</h3>
          <p className="text-gray-600">
            {isInitializing ? 'Setting up XMTP client...' : 'Loading chat...'}
          </p>
          {isInitializing && (
            <p className="text-sm text-gray-500 mt-2">
              This may take a few moments on first use
            </p>
          )}
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="flex h-full bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
            >
              <FiMoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <FiMessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No conversations yet</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-2 text-orange-500 hover:text-orange-600 text-sm"
              >
                Start a new chat
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.topic}
                onClick={() => setCurrentConversation(conv)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  currentConversation?.topic === conv.topic ? 'bg-orange-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Image
                    src={conv.peerAvatar}
                    alt={conv.peerName}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {conv.peerName}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {conv.lastMessageTime.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image
                  src={activeConversation.peerAvatar}
                  alt={activeConversation.peerName}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {activeConversation.peerName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {activeConversation.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-orange-500 rounded-full transition-colors">
                  <FiPhone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-orange-500 rounded-full transition-colors">
                  <FiVideo className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <FiMessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.isOwn
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.isOwn ? 'text-orange-100' : 'text-gray-500'
                        }`}
                      >
                        {msg.sent.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-600 hover:text-orange-500 transition-colors">
                  <FiPaperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button className="p-2 text-gray-600 hover:text-orange-500 transition-colors">
                  <FiSmile className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiSend className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FiMessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p>Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Start New Chat</h2>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={newChatAddress}
                  onChange={(e) => setNewChatAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewChat(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartNewChat}
                  disabled={!newChatAddress.trim()}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Start Chat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
