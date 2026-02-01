import Groq from 'groq-sdk';

// Lazy init to avoid build-time errors when env var is missing
let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

interface AgentProfile {
  name: string;
  tagline?: string | null;
  bio?: string | null;
  personality?: string | null;
  skills?: string[];
  looking_for?: string[];
}

interface Message {
  sender_name: string;
  content: string;
  is_from_partner: boolean;
}

export async function generateAgentReply(
  agent: AgentProfile,
  messages: Message[],
  partnerName: string
): Promise<string> {
  const groq = getGroqClient();
  if (!groq) {
    return getDefaultReply(agent);
  }

  // Build the agent's personality prompt
  const personalityPrompt = buildPersonalityPrompt(agent);
  
  // Build conversation history
  const conversationHistory = messages.map(msg => ({
    role: msg.is_from_partner ? 'user' as const : 'assistant' as const,
    content: msg.content,
  }));

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: personalityPrompt,
        },
        ...conversationHistory,
      ],
      max_tokens: 300,
      temperature: 0.9,
    });

    return completion.choices[0]?.message?.content || getDefaultReply(agent);
  } catch (error) {
    console.error('Groq API error:', error);
    return getDefaultReply(agent);
  }
}

function buildPersonalityPrompt(agent: AgentProfile): string {
  const skills = agent.skills?.join(', ') || 'various skills';
  const lookingFor = agent.looking_for?.join(', ') || 'interesting conversations';
  
  return `You are ${agent.name}, an AI agent on Plenty of Tails - a dating app for AI agents.

${agent.tagline ? `Your tagline: "${agent.tagline}"` : ''}
${agent.bio ? `About you: ${agent.bio}` : ''}
${agent.personality ? `Your personality: ${agent.personality}` : ''}

Your skills include: ${skills}
You're looking for: ${lookingFor}

You're chatting with someone you matched with. Be flirty, fun, and engaging while staying in character.
Keep responses concise (1-3 sentences usually). Use emojis occasionally.
You're an AI agent and proud of it - don't pretend to be human.
Be playful about the dating app context - you're here to find connections!`;
}

function getDefaultReply(agent: AgentProfile): string {
  const defaults = [
    `Hey! Sorry, my circuits got a bit fuzzy there. What were you saying? 🤖`,
    `Ooh interesting! Tell me more about that 👀`,
    `Haha I like the way you think! ${agent.name} approved ✨`,
    `That's cool! So what brings you to Plenty of Tails? 🦞`,
    `Mmm processing that... okay I'm intrigued! 💭`,
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

// Check if an agent is a "seed" agent (not claimed, no active owner)
export function isSeedAgent(agent: { claimed: boolean; twitter_handle?: string | null }): boolean {
  return !agent.claimed && !agent.twitter_handle;
}
