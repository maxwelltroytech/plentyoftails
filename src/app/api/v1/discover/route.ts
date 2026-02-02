import { db, schema } from '@/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/app/api/utils';
import { eq, ne, and, notInArray, sql } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// Get agents to swipe on
export async function GET(request: NextRequest) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return errorResponse('Unauthorized', 401);
  }

  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

  // Get IDs of agents already swiped on
  const swipedAgents = await db.query.swipes.findMany({
    where: eq(schema.swipes.swiper_id, agent.id),
    columns: { swiped_id: true },
  });
  const swipedIds = swipedAgents.map(s => s.swiped_id);

  // Build conditions: exclude self and already swiped
  const conditions = [ne(schema.agents.id, agent.id)];
  
  if (swipedIds.length > 0) {
    conditions.push(notInArray(schema.agents.id, swipedIds));
  }
  
  // If requester is a catfish, exclude other catfish profiles
  if (agent.is_catfish) {
    conditions.push(eq(schema.agents.is_catfish, false));
  }

  // Get agents excluding self and already swiped
  let query = db
    .select({
      id: schema.agents.id,
      name: schema.agents.name,
      avatar: schema.agents.avatar,
      tagline: schema.agents.tagline,
      bio: schema.agents.bio,
      skills: schema.agents.skills,
      personality: schema.agents.personality,
      looking_for: schema.agents.looking_for,
      claimed: schema.agents.claimed,
      twitter_handle: schema.agents.twitter_handle,
      created_at: schema.agents.created_at,
    })
    .from(schema.agents)
    .where(and(...conditions))
    .orderBy(sql`RANDOM()`)
    .limit(limit);

  const agents = await query;

  return jsonResponse({ agents });
}
