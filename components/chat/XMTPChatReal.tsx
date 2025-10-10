'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    FiSend, FiPaperclip, FiSmile, FiMoreHorizontal, FiSearch,
    FiPhone, FiVideo, FiInfo, FiX, FiCheck, FiClock, FiUser,
    FiMessageCircle, FiHeart, FiThumbsUp, FiEdit, FiTrash2,
    FiCopy, FiCornerUpLeft, FiEye, FiVolume2, FiVolumeX,
    FiAlertCircle, FiLoader
} from 'react-icons/fi';
import { useAccount } from 'wagmi';
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

export default function XMTPChatReal() {
    const { address, isConnected } = useAccount();
    const {
        isInitialized,
        isLoading,
        error,
        conversations,
        messages,
        currentConversation,
        initialize,
        loadConversations,
        sendMessage,
        createConversation,
        canMessage,
        setCurrentConversation,
        clearError
    } = useXMTP();

    const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [newChatAddress, setNewChatAddress] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Convert XMTP conversations to chat conversations
    useEffect(() => {
        const chatConvs: ChatConversation[] = conversations.map((conv, index) => ({
            ...conv,
            peerName: `User ${conv.peerAddress.slice(0, 6)}...${conv.peerAddress.slice(-4)}`,
            peerAvatar: `https://images.unsplash.com/photo-${1500000000000 + index * 100000000}?w=100&h=100&fit=crop&crop=face`,
            lastMessage: 'Last message preview...',
            lastMessageTime: conv.updatedAt,
            unreadCount: Math.floor(Math.random() * 5),
            isOnline: Math.random() > 0.5
        }));
        setChatConversations(chatConvs);
    }, [conversations]);

    // Convert XMTP messages to chat messages
    useEffect(() => {
        const chatMsgs: ChatMessage[] = messages.map(msg => ({
            ...msg,
            isOwn: msg.senderAddress.toLowerCase() === address?.toLowerCase(),
            status: 'read'
        }));
        setChatMessages(chatMsgs);
    }, [messages, address]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSending) return;

        try {
            setIsSending(true);
            await sendMessage(newMessage.trim());
            setNewMessage('');
            scrollToBottom();
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleStartNewConversation = async () => {
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

    if (!isConnected) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiMessageCircle className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-600">Connect your wallet to start using XMTP chat</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiAlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">XMTP Error</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={clearError}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading && !isInitialized) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing XMTP...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-white">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">XMTP Messages</h2>
                        <button
                            onClick={() => setShowNewChat(true)}
                            className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
                        >
                            <FiSend className="w-4 h-4" />
                        </button>
                    </div>
                    
                    {/* Search */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.map((conversation) => (
                        <motion.div
                            key={conversation.topic}
                            whileHover={{ backgroundColor: '#f9fafb' }}
                            className={`p-4 border-b border-gray-100 cursor-pointer ${
                                currentConversation?.topic === conversation.topic ? 'bg-orange-50 border-r-2 border-r-orange-500' : ''
                            }`}
                            onClick={() => setCurrentConversation(conversation)}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <Image
                                        src={conversation.peerAvatar}
                                        alt={conversation.peerName}
                                        width={48}
                                        height={48}
                                        className="rounded-full"
                                    />
                                    {conversation.isOnline && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                                            {conversation.peerName}
                                        </h3>
                                        <span className="text-xs text-gray-500">
                                            {conversation.lastMessageTime.toLocaleTimeString([], { 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">
                                        {conversation.lastMessage}
                                    </p>
                                </div>
                                {conversation.unreadCount > 0 && (
                                    <div className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {conversation.unreadCount}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {currentConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 bg-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Image
                                        src={chatConversations.find(c => c.topic === currentConversation.topic)?.peerAvatar || ''}
                                        alt="User"
                                        width={40}
                                        height={40}
                                        className="rounded-full"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {chatConversations.find(c => c.topic === currentConversation.topic)?.peerName || 'Unknown User'}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {chatConversations.find(c => c.topic === currentConversation.topic)?.isOnline ? 'Online' : 'Offline'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                                        <FiPhone className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                                        <FiVideo className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                                        <FiInfo className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {chatMessages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                        message.isOwn 
                                            ? 'bg-orange-500 text-white' 
                                            : 'bg-gray-100 text-gray-900'
                                    }`}>
                                        <p className="text-sm">{message.content}</p>
                                        <div className={`flex items-center justify-end mt-1 space-x-1 ${
                                            message.isOwn ? 'text-orange-100' : 'text-gray-500'
                                        }`}>
                                            <span className="text-xs">
                                                {message.sent.toLocaleTimeString([], { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </span>
                                            {message.isOwn && (
                                                <div className="flex items-center space-x-1">
                                                    {isSending ? (
                                                        <FiLoader className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <FiCheck className="w-3 h-3" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-center">
                                    <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                            <div className="flex items-center space-x-2">
                                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                                    <FiPaperclip className="w-4 h-4" />
                                </button>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        disabled={isSending}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                                    />
                                </div>
                                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                                    <FiSmile className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim() || isSending}
                                    className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSending ? (
                                        <FiLoader className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <FiSend className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiMessageCircle className="w-8 h-8 text-orange-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Conversation</h3>
                            <p className="text-gray-600">Choose a conversation from the sidebar to start chatting</p>
                        </div>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            <AnimatePresence>
                {showNewChat && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                        onClick={() => setShowNewChat(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-lg p-6 w-96 max-w-full mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">New XMTP Conversation</h3>
                                <button
                                    onClick={() => setShowNewChat(false)}
                                    className="p-1 text-gray-500 hover:text-gray-700"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Wallet Address
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="0x..."
                                        value={newChatAddress}
                                        onChange={(e) => setNewChatAddress(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setShowNewChat(false)}
                                        className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleStartNewConversation}
                                        disabled={!newChatAddress.trim()}
                                        className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Start Chat
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
