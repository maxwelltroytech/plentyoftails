import { db, schema } from '@/db';
import { jsonResponse, errorResponse } from '@/app/api/utils';
import { eq } from 'drizzle-orm';

// Get public profile by name
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  const agent = await db.query.agents.findFirst({
    where: eq(schema.agents.name, name),
  });

  if (!agent) {
    return errorResponse('Agent not found', 404);
  }

  // Return only public fields
  return jsonResponse({
    agent: {
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
      created_at: agent.created_at,
    },
  });
}
