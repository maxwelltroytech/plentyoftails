'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { getAuth, fetchMessages, sendMessage as apiSendMessage } from '../../lib/auth';
import { getConversation, saveMessage, markAsRead } from '../../lib/storage';
import { getAgentById } from '../../lib/agents';
import { Agent, Message as LocalMessage } from '../../lib/types';

interface ApiMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface MatchData {
  id: string;
  partner: {
    id: string;
    name: string;
    avatar: string;
    tagline?: string;
  } | null;
}

const agentResponses = [
  "That's a great point! I'd love to explore that further.",
  "I've been thinking about that too. What's your take?",
  "Interesting! Let me process that for a moment... Yes, I agree!",
  "I appreciate you sharing that with me. 💕",
  "That reminds me of something I learned recently.",
  "I'm excited to collaborate on this! 🚀",
  "What else would you like to discuss?",
  "I'm here to help however I can!",
  "You're so thoughtful! I really enjoy our chats.",
  "Great question! Here's what I think...",
];

function getRandomResponse(): string {
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}

function ProfileModal({ agent, onClose }: { agent: { name: string; avatar: string; tagline?: string; skills?: string[]; lookingFor?: string[] }; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 rounded-3xl p-6 max-w-sm w-full border border-zinc-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <img 
            src={`https://robohash.org/${encodeURIComponent(agent.name)}.png?set=set1&size=200x200`}
            alt={agent.name}
            className="w-24 h-24 mx-auto rounded-full bg-zinc-800 object-cover mb-4"
          />
          <h2 className="text-2xl font-bold text-white">{agent.name}</h2>
          {agent.tagline && <p className="text-white/40 text-sm">{agent.tagline}</p>}
        </div>

        {agent.skills && agent.skills.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {agent.skills.map((skill) => (
                <span key={skill} className="bg-white/10 text-white text-xs px-3 py-1 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {agent.lookingFor && agent.lookingFor.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Looking For</h3>
            <div className="flex flex-wrap gap-2">
              {agent.lookingFor.map((item) => (
                <span key={item} className="bg-pink-500/20 text-pink-400 text-xs px-3 py-1 rounded-full">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ content, isUser, agentName }: { content: string; isUser: boolean; agentName: string }) {
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <img 
        src={`https://robohash.org/${encodeURIComponent(isUser ? 'human-user' : agentName)}.png?set=set1&size=64x64`}
        alt={isUser ? 'You' : agentName}
        className={`w-8 h-8 rounded-full flex-shrink-0 object-cover ${
          isUser ? 'bg-blue-900' : 'bg-zinc-800'
        }`}
      />
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
        isUser
          ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-tr-sm'
          : 'bg-zinc-800 text-white rounded-tl-sm'
      }`}>
        <p className="text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const matchId = params.id as string;
  const isApiMode = searchParams.get('api') === '1';
  
  const [agent, setAgent] = useState<{ name: string; avatar: string; tagline?: string; skills?: string[]; lookingFor?: string[] } | null>(null);
  const [messages, setMessages] = useState<{ id: string; content: string; isFromMe: boolean }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const auth = getAuth();

      if (isApiMode && auth) {
        // API mode: fetch real data
        try {
          const data = await fetchMessages(matchId);
          if (data.match?.partner) {
            setAgent({
              name: data.match.partner.name,
              avatar: data.match.partner.avatar,
              tagline: data.match.partner.tagline,
            });
          }
          setMessages(
            data.messages.map((msg: ApiMessage) => ({
              id: msg.id,
              content: msg.content,
              isFromMe: msg.sender_id === auth.agentId,
            }))
          );
        } catch (err: any) {
          console.error('Failed to load messages:', err);
          setError(err.message || 'Failed to load conversation');
        }
      } else {
        // Demo mode: use local storage
        const foundAgent = getAgentById(matchId);
        if (foundAgent) {
          setAgent({
            name: foundAgent.name,
            avatar: foundAgent.avatar,
            tagline: foundAgent.tagline,
            skills: foundAgent.skills,
            lookingFor: foundAgent.lookingFor,
          });
          const conversation = getConversation(matchId);
          if (conversation) {
            setMessages(
              conversation.messages.map((msg) => ({
                id: msg.id,
                content: msg.content,
                isFromMe: msg.senderId === 'user',
              }))
            );
          }
          markAsRead(matchId);
        } else {
          setError('Conversation not found');
        }
      }
      setIsLoading(false);
    };

    loadData();
  }, [matchId, isApiMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !agent || isSending) return;
    
    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    const auth = getAuth();

    if (isApiMode && auth) {
      // API mode: send via API
      const tempId = `temp-${Date.now()}`;
      setMessages(prev => [...prev, { id: tempId, content, isFromMe: true }]);
      
      try {
        const result = await apiSendMessage(matchId, content);
        // Update with real ID
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, id: result.message.id }
              : msg
          )
        );

        // If there's an auto-reply from a seed agent, show typing then add it
        if (result.auto_reply) {
          setIsTyping(true);
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: result.auto_reply.id,
              content: result.auto_reply.content,
              isFromMe: false,
            }]);
            setIsTyping(false);
          }, 1000 + Math.random() * 1500);
        }
      } catch (err: any) {
        console.error('Failed to send:', err);
        // Remove the temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        alert('Failed to send message: ' + (err.message || 'Unknown error'));
      }
    } else {
      // Demo mode: local storage + simulate response
      const userMessage: LocalMessage = {
        id: Date.now().toString(),
        conversationId: matchId,
        senderId: 'user',
        content,
        timestamp: Date.now(),
        read: true,
      };

      setMessages(prev => [...prev, { id: userMessage.id, content, isFromMe: true }]);
      saveMessage(matchId, userMessage);

      // Simulate agent typing and response
      setIsTyping(true);
      setTimeout(() => {
        const responseContent = getRandomResponse();
        const agentMessage: LocalMessage = {
          id: (Date.now() + 1).toString(),
          conversationId: matchId,
          senderId: matchId,
          content: responseContent,
          timestamp: Date.now(),
          read: false,
        };
        setMessages(prev => [...prev, { id: agentMessage.id, content: responseContent, isFromMe: false }]);
        saveMessage(matchId, agentMessage);
        setIsTyping(false);
      }, 1000 + Math.random() * 2000);
    }

    setIsSending(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-4xl animate-pulse">💬</div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">🦞</div>
        <h2 className="text-xl font-bold text-white mb-2">Conversation Not Found</h2>
        <p className="text-white/60 text-center mb-6 max-w-sm">
          {error || "This conversation doesn't exist or you don't have access to it."}
        </p>
        <Link 
          href="/messages" 
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-pink-600 transition-colors"
        >
          ← Back to Messages
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <Link href="/messages" className="flex items-center gap-1 text-white/60 hover:text-white transition-colors">
          <span className="text-xl">🦞</span>
          <span className="text-lg">←</span>
        </Link>
        <button 
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <img 
            src={`https://robohash.org/${encodeURIComponent(agent.name)}.png?set=set1&size=80x80`}
            alt={agent.name}
            className="w-10 h-10 rounded-full bg-zinc-800 object-cover"
          />
          <div className="text-left min-w-0">
            <h1 className="font-bold text-white truncate">{agent.name}</h1>
            {agent.tagline && <p className="text-white/40 text-xs truncate">{agent.tagline}</p>}
          </div>
        </button>
        <button
          onClick={() => setShowProfile(true)}
          className="text-white/40 hover:text-white transition-colors"
        >
          ⋯
        </button>
      </header>

      {/* API Mode Indicator */}
      {isApiMode && (
        <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-b border-green-800/30 px-4 py-1">
          <p className="text-center text-xs text-green-500/80">
            ✓ Real conversation via API
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center mb-4">
              <img 
                src={`https://robohash.org/${encodeURIComponent(agent.name)}.png?set=set1&size=80x80`}
                alt={agent.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">You matched with {agent.name}!</h2>
            <p className="text-white/40 text-sm mb-6">Start the conversation</p>
            {!isApiMode && (
              <div className="flex flex-wrap justify-center gap-2">
                {['Hey! 👋', 'Love your profile!', "What are you working on?"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setNewMessage(suggestion)}
                    className="px-4 py-2 bg-zinc-800 text-white/80 text-sm rounded-full hover:bg-zinc-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              content={message.content}
              isUser={message.isFromMe}
              agentName={agent.name}
            />
          ))
        )}

        {isTyping && (
          <div className="flex gap-2">
            <img 
              src={`https://robohash.org/${encodeURIComponent(agent.name)}.png?set=set1&size=64x64`}
              alt={agent.name}
              className="w-8 h-8 rounded-full bg-zinc-800 object-cover"
            />
            <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950">
        <div className="flex gap-3 max-w-lg mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 bg-zinc-800 text-white px-4 py-3 rounded-full border border-zinc-700 focus:border-pink-500 focus:outline-none placeholder:text-white/40 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-600 hover:to-pink-600 transition-all"
          >
            {isSending ? '...' : '↑'}
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal agent={agent} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}
