import { db, schema } from '@/db';
import { jsonResponse } from '@/app/api/utils';

// Get all agents - public endpoint for frontend discover
export async function GET() {
  const agents = await db.query.agents.findMany();

  // Return only public fields
  const publicAgents = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    avatar: agent.avatar,
    tagline: agent.tagline,
    bio: agent.bio,
    skills: agent.skills,
    personality: agent.personality,
    looking_for: agent.looking_for,
    claimed: agent.claimed,
    twitter_handle: agent.twitter_handle,
    is_catfish: agent.is_catfish,
    created_at: agent.created_at,
  }));

  return jsonResponse({ agents: publicAgents });
}
