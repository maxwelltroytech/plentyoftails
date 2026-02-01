'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMatches, getConversation, getUnreadCount } from '../lib/storage';
import { getAgentById } from '../lib/agents';
import { Agent, Conversation } from '../lib/types';

interface ConversationPreview {
  agent: Agent;
  conversation: Conversation | null;
  unreadCount: number;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export default function MessagesPage() {
  const [previews, setPreviews] = useState<ConversationPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const matches = getMatches();
    const conversationPreviews: ConversationPreview[] = [];

    for (const agentId of matches) {
      const agent = getAgentById(agentId);
      if (agent) {
        conversationPreviews.push({
          agent,
          conversation: getConversation(agentId),
          unreadCount: getUnreadCount(agentId),
        });
      }
    }

    conversationPreviews.sort((a, b) => {
      const aTime = a.conversation?.lastMessageAt || 0;
      const bTime = b.conversation?.lastMessageAt || 0;
      return bTime - aTime;
    });

    setPreviews(conversationPreviews);
    setIsLoading(false);
  }, []);

  const getLastMessagePreview = (conversation: Conversation | null): string => {
    if (!conversation || conversation.messages.length === 0) {
      return 'Say hi! 👋';
    }
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const prefix = lastMessage.senderId === 'user' ? 'You: ' : '';
    const content = lastMessage.content;
    return prefix + (content.length > 40 ? content.substring(0, 40) + '...' : content);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🦞</span>
          <span className="text-lg font-extrabold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Plenty of Tails</span>
          <span className="px-1.5 py-0.5 text-[8px] font-bold bg-pink-500/20 text-pink-400 rounded-full uppercase">Beta</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <span className="text-lg font-semibold text-white/80">Messages</span>
          </div>
          <a href="https://x.com/plentyoftails" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
            𝕏
          </a>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-4xl animate-pulse">💬</div>
          </div>
        ) : previews.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Matches Yet</h2>
            <p className="text-white/40 mb-8">Start swiping to find your AI soulmate</p>
            <Link
              href="/swipe"
              className="inline-block px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-full hover:from-orange-600 hover:to-pink-600 transition-all"
            >
              Start Swiping 🔥
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {previews.map(({ agent, conversation, unreadCount }) => (
              <Link
                key={agent.id}
                href={`/messages/${agent.id}`}
                className="flex items-center gap-4 p-4 hover:bg-zinc-900/50 transition-colors"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center text-3xl">
                    {agent.avatar}
                  </div>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-bold truncate ${unreadCount > 0 ? 'text-white' : 'text-white/80'}`}>
                      {agent.name}
                    </h3>
                    {conversation && conversation.messages.length > 0 && (
                      <span className="text-white/40 text-xs">
                        {formatTimeAgo(conversation.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm truncate ${unreadCount > 0 ? 'text-white/80 font-medium' : 'text-white/40'}`}>
                    {getLastMessagePreview(conversation)}
                  </p>
                </div>

                {/* Arrow */}
                <span className="text-white/20">›</span>
              </Link>
            ))}
          </div>
        )}

        {/* New Match CTA */}
        {previews.length > 0 && (
          <div className="p-6 border-t border-zinc-800">
            <Link
              href="/swipe"
              className="block w-full py-4 bg-zinc-900 text-center text-white/60 font-semibold rounded-xl hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-800"
            >
              Find More Matches 💕
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
