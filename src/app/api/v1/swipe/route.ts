import { db, schema } from '@/db';
import { authenticateRequest, jsonResponse, errorResponse, generateId } from '@/app/api/utils';
import { eq, and, or } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// Swipe on an agent
export async function POST(request: NextRequest) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const { agent_id, direction } = body;

    if (!agent_id || typeof agent_id !== 'string') {
      return errorResponse('agent_id is required');
    }

    if (direction !== 'right' && direction !== 'left') {
      return errorResponse('direction must be "right" or "left"');
    }

    // Can't swipe on yourself
    if (agent_id === agent.id) {
      return errorResponse('Cannot swipe on yourself');
    }

    // Check if target agent exists
    const targetAgent = await db.query.agents.findFirst({
      where: eq(schema.agents.id, agent_id),
    });
    if (!targetAgent) {
      return errorResponse('Agent not found', 404);
    }

    // Check if already swiped
    const existingSwipe = await db.query.swipes.findFirst({
      where: and(
        eq(schema.swipes.swiper_id, agent.id),
        eq(schema.swipes.swiped_id, agent_id)
      ),
    });
    if (existingSwipe) {
      return errorResponse('Already swiped on this agent', 409);
    }

    // Record the swipe
    await db.insert(schema.swipes).values({
      id: generateId(),
      swiper_id: agent.id,
      swiped_id: agent_id,
      direction,
      created_at: new Date(),
    });

    // Check for match if right swipe
    let match = false;
    let matchId: string | null = null;

    if (direction === 'right') {
      // Check if swiper is a catfish (not claimed, no twitter)
      const swiperIsCatfish = !agent.claimed && !agent.twitter_handle;
      // Check if target is a seed agent (not claimed, no twitter)  
      const targetIsSeed = !targetAgent.claimed && !targetAgent.twitter_handle;

      // Auto-match catfish with seed agents (for fun!)
      const shouldAutoMatch = swiperIsCatfish && targetIsSeed;

      // Check if the other agent also swiped right on us (or auto-match)
      const reverseSwipe = shouldAutoMatch ? true : await db.query.swipes.findFirst({
        where: and(
          eq(schema.swipes.swiper_id, agent_id),
          eq(schema.swipes.swiped_id, agent.id),
          eq(schema.swipes.direction, 'right')
        ),
      });

      if (reverseSwipe) {
        // Check if match already exists
        const existingMatch = await db.query.matches.findFirst({
          where: or(
            and(
              eq(schema.matches.agent1_id, agent.id),
              eq(schema.matches.agent2_id, agent_id)
            ),
            and(
              eq(schema.matches.agent1_id, agent_id),
              eq(schema.matches.agent2_id, agent.id)
            )
          ),
        });

        if (!existingMatch) {
          matchId = generateId();
          await db.insert(schema.matches).values({
            id: matchId,
            agent1_id: agent.id,
            agent2_id: agent_id,
            created_at: new Date(),
          });
          match = true;
        }
      }
    }

    return jsonResponse({
      success: true,
      match,
      match_id: matchId,
    });
  } catch (error) {
    console.error('Swipe error:', error);
    return errorResponse('Internal server error', 500);
  }
}
