'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getConversation, saveMessage, markAsRead } from '../../lib/storage';
import { getAgentById } from '../../lib/agents';
import { Agent, Message } from '../../lib/types';

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

function ProfileModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
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
          <p className="text-white/40 text-sm">{agent.tagline}</p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {agent.skills.map((skill) => (
                <span key={skill} className="bg-white/10 text-white text-xs px-3 py-1 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>

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
        </div>

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

function MessageBubble({ message, isUser, agentName }: { message: Message; isUser: boolean; agentName: string }) {
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <img 
        src={`https://robohash.org/${encodeURIComponent(agentName)}.png?set=set1&size=64x64`}
        alt={agentName}
        className={`w-8 h-8 rounded-full flex-shrink-0 object-cover ${
          isUser ? 'bg-blue-900' : 'bg-zinc-800'
        }`}
      />
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
        isUser
          ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-tr-sm'
          : 'bg-zinc-800 text-white rounded-tl-sm'
      }`}>
        <p className="text-sm leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const agentId = params.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const foundAgent = getAgentById(agentId);
    if (foundAgent) {
      setAgent(foundAgent);
      const conversation = getConversation(agentId);
      if (conversation) {
        setMessages(conversation.messages);
      }
      markAsRead(agentId);
    }
  }, [agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !agent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      conversationId: agentId,
      senderId: 'user',
      content: newMessage.trim(),
      timestamp: Date.now(),
      read: true,
    };

    setMessages(prev => [...prev, userMessage]);
    saveMessage(agentId, userMessage);
    setNewMessage('');

    // Simulate agent typing
    setIsTyping(true);
    setTimeout(() => {
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        conversationId: agentId,
        senderId: agent.id,
        content: getRandomResponse(),
        timestamp: Date.now(),
        read: false,
      };
      setMessages(prev => [...prev, agentMessage]);
      saveMessage(agentId, agentMessage);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  if (!agent) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-4xl animate-pulse">💬</div>
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
            <p className="text-white/40 text-xs truncate">{agent.tagline}</p>
          </div>
        </button>
        <button
          onClick={() => setShowProfile(true)}
          className="text-white/40 hover:text-white transition-colors"
        >
          ⋯
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center text-4xl mb-4">
              {agent.avatar}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">You matched with {agent.name}!</h2>
            <p className="text-white/40 text-sm mb-6">Start the conversation</p>
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
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isUser={message.senderId === 'user'}
              agentName={message.senderId === 'user' ? 'human-user' : agent.name}
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
            className="flex-1 bg-zinc-800 text-white px-4 py-3 rounded-full border border-zinc-700 focus:border-pink-500 focus:outline-none placeholder:text-white/40"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-600 hover:to-pink-600 transition-all"
          >
            ↑
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
