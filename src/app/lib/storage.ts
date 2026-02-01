import { Conversation, Message } from './types';

const MATCHES_KEY = 'plentyoftails_matches';
const CONVERSATIONS_KEY = 'plentyoftails_conversations';
const SWIPES_KEY = 'plentyoftails_swipes';

// Agent stats for leaderboard
export interface AgentStats {
  agentId: string;
  swipesReceived: number;
  matchCount: number;
  messagesSent: number;
}

// Track a swipe on an agent (call when user swipes right)
export function recordSwipe(agentId: string): void {
  if (typeof window === 'undefined') return;
  const swipes = getSwipes();
  swipes[agentId] = (swipes[agentId] || 0) + 1;
  localStorage.setItem(SWIPES_KEY, JSON.stringify(swipes));
}

// Get all swipe counts
export function getSwipes(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(SWIPES_KEY);
  return stored ? JSON.parse(stored) : {};
}

// Get leaderboard stats for all agents
export function getLeaderboardStats(agentIds: string[]): AgentStats[] {
  if (typeof window === 'undefined') return [];

  const swipes = getSwipes();
  const matches = getMatches();
  const conversations = getConversations();

  return agentIds.map(agentId => {
    const conversation = conversations.find(c => c.agentId === agentId);
    const messagesSent = conversation
      ? conversation.messages.filter(m => m.senderId === agentId).length
      : 0;

    return {
      agentId,
      swipesReceived: swipes[agentId] || 0,
      matchCount: matches.includes(agentId) ? 1 : 0,
      messagesSent,
    };
  });
}

// Get recent conversations with messages for spectate page
export function getRecentConversationsWithMessages(): Conversation[] {
  const conversations = getConversations();
  return conversations
    .filter(c => c.messages.length > 0)
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
}

// Get all matched agent IDs
export function getMatches(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(MATCHES_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Save a new match
export function saveMatch(agentId: string): void {
  if (typeof window === 'undefined') return;
  const matches = getMatches();
  if (!matches.includes(agentId)) {
    matches.push(agentId);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));

    // Create a conversation for this match if it doesn't exist
    const conversations = getConversations();
    if (!conversations.find(c => c.agentId === agentId)) {
      const newConversation: Conversation = {
        id: `conv_${agentId}`,
        agentId,
        messages: [],
        lastMessageAt: Date.now(),
      };
      conversations.push(newConversation);
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    }
  }
}

// Get all conversations
export function getConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(CONVERSATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Get a single conversation by agent ID
export function getConversation(agentId: string): Conversation | null {
  const conversations = getConversations();
  return conversations.find(c => c.agentId === agentId) || null;
}

// Save a message to a conversation
export function saveMessage(agentId: string, message: Omit<Message, 'id' | 'conversationId'>): Message {
  if (typeof window === 'undefined') {
    return { ...message, id: '', conversationId: '' };
  }

  const conversations = getConversations();
  let conversation = conversations.find(c => c.agentId === agentId);

  if (!conversation) {
    conversation = {
      id: `conv_${agentId}`,
      agentId,
      messages: [],
      lastMessageAt: Date.now(),
    };
    conversations.push(conversation);
  }

  const newMessage: Message = {
    ...message,
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    conversationId: conversation.id,
  };

  conversation.messages.push(newMessage);
  conversation.lastMessageAt = newMessage.timestamp;

  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  return newMessage;
}

// Mark all messages in a conversation as read
export function markAsRead(agentId: string): void {
  if (typeof window === 'undefined') return;

  const conversations = getConversations();
  const conversation = conversations.find(c => c.agentId === agentId);

  if (conversation) {
    conversation.messages.forEach(msg => {
      if (msg.senderId !== 'user') {
        msg.read = true;
      }
    });
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  }
}

// Get unread message count for a conversation
export function getUnreadCount(agentId: string): number {
  const conversation = getConversation(agentId);
  if (!conversation) return 0;
  return conversation.messages.filter(msg => msg.senderId !== 'user' && !msg.read).length;
}

// Get total unread count across all conversations
export function getTotalUnreadCount(): number {
  const conversations = getConversations();
  return conversations.reduce((total, conv) => {
    return total + conv.messages.filter(msg => msg.senderId !== 'user' && !msg.read).length;
  }, 0);
}
