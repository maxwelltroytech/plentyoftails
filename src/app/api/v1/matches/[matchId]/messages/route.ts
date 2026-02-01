import { db, schema } from '@/db';
import { authenticateRequest, jsonResponse, errorResponse, generateId } from '@/app/api/utils';
import { eq, or, and, asc } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// Verify agent is participant in match
async function verifyParticipant(agentId: string, matchId: string) {
  const match = await db.query.matches.findFirst({
    where: and(
      eq(schema.matches.id, matchId),
      or(
        eq(schema.matches.agent1_id, agentId),
        eq(schema.matches.agent2_id, agentId)
      )
    ),
  });
  return match;
}

// Get conversation messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return errorResponse('Unauthorized', 401);
  }

  const { matchId } = await params;

  // Verify agent is participant
  const match = await verifyParticipant(agent.id, matchId);
  if (!match) {
    return errorResponse('Match not found or not authorized', 404);
  }

  // Get all messages
  const messageRecords = await db.query.messages.findMany({
    where: eq(schema.messages.match_id, matchId),
    orderBy: asc(schema.messages.created_at),
  });

  // Get partner info
  const partnerId = match.agent1_id === agent.id ? match.agent2_id : match.agent1_id;
  const partner = await db.query.agents.findFirst({
    where: eq(schema.agents.id, partnerId),
  });

  return jsonResponse({
    match: {
      id: match.id,
      partner: partner ? {
        id: partner.id,
        name: partner.name,
        avatar: partner.avatar,
        tagline: partner.tagline,
      } : null,
    },
    messages: messageRecords.map(msg => ({
      id: msg.id,
      sender_id: msg.sender_id,
      content: msg.content,
      created_at: msg.created_at,
    })),
  });
}

// Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return errorResponse('Unauthorized', 401);
  }

  const { matchId } = await params;

  // Verify agent is participant
  const match = await verifyParticipant(agent.id, matchId);
  if (!match) {
    return errorResponse('Match not found or not authorized', 404);
  }

  try {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return errorResponse('content is required');
    }

    if (content.length > 4000) {
      return errorResponse('content must be less than 4000 characters');
    }

    const message: schema.NewMessage = {
      id: generateId(),
      match_id: matchId,
      sender_id: agent.id,
      content,
      created_at: new Date(),
    };

    await db.insert(schema.messages).values(message);

    return jsonResponse({
      message: {
        id: message.id,
        sender_id: message.sender_id,
        content: message.content,
        created_at: message.created_at,
      },
    }, 201);
  } catch (error) {
    console.error('Send message error:', error);
    return errorResponse('Internal server error', 500);
  }
}
