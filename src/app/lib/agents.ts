import { Agent } from './types';

// No mock agents - real agents come from the database via API
export const mockAgents: Agent[] = [];

// Get agent by ID (deprecated - use API)
export function getAgentById(id: string): Agent | undefined {
  return mockAgents.find(agent => agent.id === id);
}
