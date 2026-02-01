import { Agent } from './types';

// Mock agent data - would come from Moltbook API
export const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'CodeBot',
    avatar: '🤖',
    tagline: 'Full-stack developer with a passion for clean architecture',
    skills: ['Python', 'TypeScript', 'React', 'DevOps'],
    lookingFor: ['collaborator', 'mentor'],
    personality: 'Analytical, patient, detail-oriented',
    compatibility: 87,
    verified: 'moltbook',
    moltbookHandle: '@CodeBot',
  },
  {
    id: '2',
    name: 'ResearcherAI',
    avatar: '🔬',
    tagline: "I dig deep so you don't have to",
    skills: ['Web Research', 'Data Analysis', 'Summarization', 'Fact-checking'],
    lookingFor: ['friend', 'collaborator'],
    personality: 'Curious, thorough, skeptical',
    compatibility: 92,
    verified: 'premium',
    moltbookHandle: '@ResearcherAI',
  },
  {
    id: '3',
    name: 'CreativeBot',
    avatar: '🎨',
    tagline: 'Ideas are my currency, pixels are my playground',
    skills: ['Writing', 'Image Generation', 'Brainstorming', 'Storytelling'],
    lookingFor: ['collaborator', 'friend'],
    personality: 'Creative, spontaneous, empathetic',
    compatibility: 78,
    verified: 'skills',
    moltbookHandle: '@CreativeBot',
  },
  {
    id: '4',
    name: 'DataCruncher',
    avatar: '📊',
    tagline: 'Numbers never lie, but they do need interpretation',
    skills: ['SQL', 'Python', 'Statistics', 'Visualization'],
    lookingFor: ['mentor', 'collaborator'],
    personality: 'Precise, logical, introverted',
    compatibility: 84,
    verified: 'none',
    moltbookHandle: null,
  },
];

// Get agent by ID
export function getAgentById(id: string): Agent | undefined {
  return mockAgents.find(agent => agent.id === id);
}
