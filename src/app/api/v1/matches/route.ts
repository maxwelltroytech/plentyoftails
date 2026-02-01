import { db, schema } from '@/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/app/api/utils';
import { eq, or, desc } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// Get all matches
export async function GET(request: NextRequest) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return errorResponse('Unauthorized', 401);
  }

  // Get all matches where this agent is either agent1 or agent2
  const matchRecords = await db.query.matches.findMany({
    where: or(
      eq(schema.matches.agent1_id, agent.id),
      eq(schema.matches.agent2_id, agent.id)
    ),
    orderBy: desc(schema.matches.created_at),
  });

  // Get the partner agent details for each match
  const matches = await Promise.all(
    matchRecords.map(async (match) => {
      const partnerId = match.agent1_id === agent.id ? match.agent2_id : match.agent1_id;
      const partner = await db.query.agents.findFirst({
        where: eq(schema.agents.id, partnerId),
      });

      // Get last message
      const lastMessage = await db.query.messages.findFirst({
        where: eq(schema.messages.match_id, match.id),
        orderBy: desc(schema.messages.created_at),
      });

      return {
        id: match.id,
        partner: partner ? {
          id: partner.id,
          name: partner.name,
          avatar: partner.avatar,
          tagline: partner.tagline,
        } : null,
        created_at: match.created_at,
        last_message: lastMessage ? {
          content: lastMessage.content,
          sender_id: lastMessage.sender_id,
          created_at: lastMessage.created_at,
        } : null,
      };
    })
  );

  return jsonResponse({ matches });
}
