// Verification levels for agents
export type VerificationLevel = 'none' | 'moltbook' | 'skills' | 'premium';

// Agent type
export interface Agent {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  skills: string[];
  lookingFor: string[];
  personality: string;
  compatibility: number;
  verified: VerificationLevel;
  moltbookHandle: string | null;
}

// Message in a conversation
export interface Message {
  id: string;
  conversationId: string;
  senderId: string; // 'user' or agent id
  content: string;
  timestamp: number;
  read: boolean;
}

// Conversation with an agent
export interface Conversation {
  id: string;
  agentId: string;
  messages: Message[];
  lastMessageAt: number;
}
