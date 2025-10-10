'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { xmtpService, XMTPMessage, XMTPConversation } from '@/services/xmtpServiceSimple';

export interface UseXMTPReturn {
    // State
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    conversations: XMTPConversation[];
    messages: XMTPMessage[];
    currentConversation: XMTPConversation | null;
    
    // Actions
    initialize: () => Promise<void>;
    loadConversations: () => Promise<void>;
    loadMessages: (conversation: XMTPConversation) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    createConversation: (address: string) => Promise<XMTPConversation>;
    canMessage: (address: string) => Promise<boolean>;
    setCurrentConversation: (conversation: XMTPConversation | null) => void;
    clearError: () => void;
}

export function useXMTP(): UseXMTPReturn {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversations, setConversations] = useState<XMTPConversation[]>([]);
    const [messages, setMessages] = useState<XMTPMessage[]>([]);
    const [currentConversation, setCurrentConversation] = useState<XMTPConversation | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const initialize = useCallback(async () => {
        if (!isConnected || !walletClient || !address) {
            setError('Wallet not connected');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            
            const env = process.env.NEXT_PUBLIC_XMTP_ENV === 'production' ? 'production' : 'dev';
            await xmtpService.initialize(walletClient, env);
            setIsInitialized(true);
            
            // Load conversations after initialization
            await loadConversations();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to initialize XMTP';
            setError(errorMessage);
            console.error('XMTP initialization error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isConnected, walletClient, address]);

    const loadConversations = useCallback(async () => {
        if (!isInitialized) return;

        try {
            setIsLoading(true);
            const convs = await xmtpService.getConversations();
            setConversations(convs);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
            setError(errorMessage);
            console.error('Error loading conversations:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isInitialized]);

    const loadMessages = useCallback(async (conversation: XMTPConversation) => {
        if (!isInitialized) return;

        try {
            setIsLoading(true);
            const msgs = await xmtpService.getMessages(conversation);
            setMessages(msgs);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
            setError(errorMessage);
            console.error('Error loading messages:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isInitialized]);

    const sendMessage = useCallback(async (content: string) => {
        if (!isInitialized || !currentConversation) {
            setError('No active conversation');
            return;
        }

        try {
            const message = await xmtpService.sendMessage(currentConversation, content);
            setMessages(prev => [...prev, message]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
            setError(errorMessage);
            console.error('Error sending message:', err);
        }
    }, [isInitialized, currentConversation]);

    const createConversation = useCallback(async (address: string): Promise<XMTPConversation> => {
        if (!isInitialized) {
            throw new Error('XMTP not initialized');
        }

        try {
            const conversation = await xmtpService.createConversation(address);
            setConversations(prev => [conversation, ...prev]);
            return conversation;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
            setError(errorMessage);
            console.error('Error creating conversation:', err);
            throw err;
        }
    }, [isInitialized]);

    const canMessage = useCallback(async (address: string): Promise<boolean> => {
        if (!isInitialized) return false;

        try {
            return await xmtpService.canMessage(address);
        } catch (err) {
            console.error('Error checking if address can message:', err);
            return false;
        }
    }, [isInitialized]);

    // Auto-initialize when wallet connects
    useEffect(() => {
        if (isConnected && walletClient && address && !isInitialized && !isLoading) {
            initialize();
        }
    }, [isConnected, walletClient, address, isInitialized, isLoading, initialize]);

    // Load messages when conversation changes
    useEffect(() => {
        if (currentConversation && isInitialized) {
            loadMessages(currentConversation);
        }
    }, [currentConversation, isInitialized, loadMessages]);

    return {
        // State
        isInitialized,
        isLoading,
        error,
        conversations,
        messages,
        currentConversation,
        
        // Actions
        initialize,
        loadConversations,
        loadMessages,
        sendMessage,
        createConversation,
        canMessage,
        setCurrentConversation,
        clearError
    };
}
