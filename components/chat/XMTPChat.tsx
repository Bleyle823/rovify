'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    FiSend, FiPaperclip, FiSmile, FiMoreHorizontal, FiSearch,
    FiPhone, FiVideo, FiInfo, FiX, FiCheck, FiClock, FiUser,
    FiMessageCircle, FiHeart, FiThumbsUp, FiEdit, FiTrash2,
    FiCopy, FiCornerUpLeft, FiEye, FiVolume2, FiVolumeX
} from 'react-icons/fi';
import { useAccount } from 'wagmi';

// XMTP Types (will be imported from @xmtp/xmtp-js when installed)
interface XMTPMessage {
    id: string;
    content: string;
    senderAddress: string;
    sent: Date;
    contentType: string;
}

interface XMTPConversation {
    topic: string;
    peerAddress: string;
    createdAt: Date;
    updatedAt: Date;
}

interface XMTPClient {
    address: string;
    conversations: {
        list: () => Promise<XMTPConversation[]>;
        newConversation: (address: string) => Promise<XMTPConversation>;
    };
    messages: {
        list: (conversation: XMTPConversation) => Promise<XMTPMessage[]>;
        send: (conversation: XMTPConversation, content: string) => Promise<XMTPMessage>;
        stream: (conversation: XMTPConversation, callback: (message: XMTPMessage) => void) => void;
    };
    canMessage: (address: string) => Promise<boolean>;
}

// Mock XMTP implementation (replace with real XMTP when package is installed)
class MockXMTPClient implements XMTPClient {
    address: string;
    conversations: any;
    messages: any;

    constructor(address: string) {
        this.address = address;
        this.conversations = {
            list: async () => [
                {
                    topic: 'conv1',
                    peerAddress: '0x1234567890123456789012345678901234567890',
                    createdAt: new Date(Date.now() - 86400000),
                    updatedAt: new Date(Date.now() - 3600000)
                },
                {
                    topic: 'conv2',
                    peerAddress: '0x0987654321098765432109876543210987654321',
                    createdAt: new Date(Date.now() - 172800000),
                    updatedAt: new Date(Date.now() - 7200000)
                }
            ],
            newConversation: async (address: string) => ({
                topic: `conv_${Date.now()}`,
                peerAddress: address,
                createdAt: new Date(),
                updatedAt: new Date()
            })
        };
        this.messages = {
            list: async (conversation: XMTPConversation) => [
                {
                    id: '1',
                    content: 'Hey! How are you doing?',
                    senderAddress: conversation.peerAddress,
                    sent: new Date(Date.now() - 3600000),
                    contentType: 'text/plain'
                },
                {
                    id: '2',
                    content: 'I\'m doing great! Thanks for asking. How about you?',
                    senderAddress: this.address,
                    sent: new Date(Date.now() - 1800000),
                    contentType: 'text/plain'
                },
                {
                    id: '3',
                    content: 'Pretty good! Just working on some new projects. Are you going to the event this weekend?',
                    senderAddress: conversation.peerAddress,
                    sent: new Date(Date.now() - 900000),
                    contentType: 'text/plain'
                }
            ],
            send: async (conversation: XMTPConversation, content: string) => ({
                id: `msg_${Date.now()}`,
                content,
                senderAddress: this.address,
                sent: new Date(),
                contentType: 'text/plain'
            }),
            stream: (conversation: XMTPConversation, callback: (message: XMTPMessage) => void) => {
                // Mock streaming - in real implementation, this would listen for new messages
                console.log('Streaming messages for conversation:', conversation.topic);
            }
        };
    }

    static async create(signer: any): Promise<MockXMTPClient> {
        // In real implementation, this would create an actual XMTP client
        return new MockXMTPClient('0x' + Math.random().toString(16).substr(2, 40));
    }

    async canMessage(address: string): Promise<boolean> {
        // Mock implementation - in real XMTP, this checks if the address can receive messages
        return true;
    }
}

interface ChatMessage {
    id: string;
    content: string;
    senderAddress: string;
    sent: Date;
    isOwn: boolean;
    status: 'sending' | 'sent' | 'delivered' | 'read';
}

interface ChatConversation {
    id: string;
    peerAddress: string;
    peerName: string;
    peerAvatar: string;
    lastMessage: string;
    lastMessageTime: Date;
    unreadCount: number;
    isOnline: boolean;
}

export default function XMTPChat() {
    const { address, isConnected } = useAccount();
    const [client, setClient] = useState<XMTPClient | null>(null);
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [newChatAddress, setNewChatAddress] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize XMTP client
    useEffect(() => {
        if (isConnected && address) {
            initializeXMTP();
        }
    }, [isConnected, address]);

    const initializeXMTP = async () => {
        try {
            setIsLoading(true);
            // In real implementation, you would use:
            // const xmtp = await Client.create(signer, { env: 'production' });
            const xmtp = await MockXMTPClient.create(null);
            setClient(xmtp);
            await loadConversations(xmtp);
        } catch (error) {
            console.error('Failed to initialize XMTP:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadConversations = async (xmtpClient: XMTPClient) => {
        try {
            const xmtpConversations = await xmtpClient.conversations.list();
            const chatConversations: ChatConversation[] = xmtpConversations.map((conv, index) => ({
                id: conv.topic,
                peerAddress: conv.peerAddress,
                peerName: `User ${conv.peerAddress.slice(0, 6)}...${conv.peerAddress.slice(-4)}`,
                peerAvatar: `https://images.unsplash.com/photo-${1500000000000 + index * 100000000}?w=100&h=100&fit=crop&crop=face`,
                lastMessage: 'Last message preview...',
                lastMessageTime: conv.updatedAt,
                unreadCount: Math.floor(Math.random() * 5),
                isOnline: Math.random() > 0.5
            }));
            setConversations(chatConversations);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    };

    const loadMessages = async (conversation: ChatConversation) => {
        if (!client) return;

        try {
            setIsLoading(true);
            const xmtpConversation = {
                topic: conversation.id,
                peerAddress: conversation.peerAddress,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const xmtpMessages = await client.messages.list(xmtpConversation);
            const chatMessages: ChatMessage[] = xmtpMessages.map(msg => ({
                id: msg.id,
                content: msg.content,
                senderAddress: msg.senderAddress,
                sent: msg.sent,
                isOwn: msg.senderAddress.toLowerCase() === address?.toLowerCase(),
                status: 'read'
            }));
            setMessages(chatMessages);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!client || !selectedConversation || !newMessage.trim()) return;

        try {
            const xmtpConversation = {
                topic: selectedConversation.id,
                peerAddress: selectedConversation.peerAddress,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            const sentMessage = await client.messages.send(xmtpConversation, newMessage.trim());
            const chatMessage: ChatMessage = {
                id: sentMessage.id,
                content: sentMessage.content,
                senderAddress: sentMessage.senderAddress,
                sent: sentMessage.sent,
                isOwn: true,
                status: 'sent'
            };
            
            setMessages(prev => [...prev, chatMessage]);
            setNewMessage('');
            scrollToBottom();
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const startNewConversation = async () => {
        if (!client || !newChatAddress.trim()) return;

        try {
            const canMessage = await client.canMessage(newChatAddress);
            if (!canMessage) {
                alert('This address cannot receive XMTP messages');
                return;
            }

            const xmtpConversation = await client.conversations.newConversation(newChatAddress);
            const newConversation: ChatConversation = {
                id: xmtpConversation.topic,
                peerAddress: xmtpConversation.peerAddress,
                peerName: `User ${xmtpConversation.peerAddress.slice(0, 6)}...${xmtpConversation.peerAddress.slice(-4)}`,
                peerAvatar: `https://images.unsplash.com/photo-${1500000000000 + Math.random() * 100000000}?w=100&h=100&fit=crop&crop=face`,
                lastMessage: 'New conversation started',
                lastMessageTime: new Date(),
                unreadCount: 0,
                isOnline: true
            };

            setConversations(prev => [newConversation, ...prev]);
            setSelectedConversation(newConversation);
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
    }, [messages]);

    const filteredConversations = conversations.filter(conv =>
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

    if (isLoading && !client) {
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
                        <h2 className="text-xl font-bold text-gray-900">Messages</h2>
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
                            key={conversation.id}
                            whileHover={{ backgroundColor: '#f9fafb' }}
                            className={`p-4 border-b border-gray-100 cursor-pointer ${
                                selectedConversation?.id === conversation.id ? 'bg-orange-50 border-r-2 border-r-orange-500' : ''
                            }`}
                            onClick={() => {
                                setSelectedConversation(conversation);
                                loadMessages(conversation);
                            }}
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
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 bg-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Image
                                        src={selectedConversation.peerAvatar}
                                        alt={selectedConversation.peerName}
                                        width={40}
                                        height={40}
                                        className="rounded-full"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {selectedConversation.peerName}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {selectedConversation.isOnline ? 'Online' : 'Offline'}
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
                            {messages.map((message) => (
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
                                                <FiCheck className="w-3 h-3" />
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
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                                    <FiSmile className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim()}
                                    className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <FiSend className="w-4 h-4" />
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
                                <h3 className="text-lg font-semibold text-gray-900">New Conversation</h3>
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
                                        onClick={startNewConversation}
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
