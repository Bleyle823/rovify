'use client';

import { useXMTP } from '@/contexts/XMTPContext';
import { Welcome } from './Welcome.simple';
import { useState } from 'react';
import { ConversationsList } from './ConversationsList';
import { ConversationView } from './ConversationView';

interface ChatLayoutProps {
  children?: React.ReactNode;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  const { client } = useXMTP();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  if (!client) {
    return <Welcome />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Conversations pane */}
      <div className="hidden md:block md:w-96 border-r border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="h-full">
          <ConversationsList onSelectConversation={(id) => setActiveConversationId(id)} />
        </div>
      </div>

      {/* Conversation view */}
      <div className="flex-1 min-w-0 bg-white dark:bg-gray-900">
        {activeConversationId ? (
          <ConversationView
            conversationId={activeConversationId}
            onBack={() => setActiveConversationId(null)}
          />
        ) : (
          <>
            {/* Mobile: show the conversations list full screen */}
            <div className="md:hidden h-full">
              <ConversationsList onSelectConversation={(id) => setActiveConversationId(id)} />
            </div>
            {/* Desktop: show a placeholder while no conversation is selected */}
            <div className="hidden md:flex h-full items-center justify-center p-6">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="text-lg font-semibold">Select a conversation to start chatting</p>
                <p className="text-sm mt-1">Or click the plus button to start a new chat</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
