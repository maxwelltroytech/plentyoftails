import { db, schema } from '@/db';
import { authenticateRequest, jsonResponse, errorResponse, generateId } from '@/app/api/utils';
import { eq, or, and, asc } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { generateAgentReply, isSeedAgent } from '@/app/lib/agent-chat';

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

    // Check if partner is a seed agent (auto-reply)
    const partnerId = match.agent1_id === agent.id ? match.agent2_id : match.agent1_id;
    const partner = await db.query.agents.findFirst({
      where: eq(schema.agents.id, partnerId),
    });

    let autoReply = null;

    if (partner && isSeedAgent(partner) && process.env.GROQ_API_KEY) {
      try {
        // Get conversation history for context
        const history = await db.query.messages.findMany({
          where: eq(schema.messages.match_id, matchId),
          orderBy: asc(schema.messages.created_at),
        });

        // Build messages array for the AI
        const conversationMessages = history.map(msg => ({
          sender_name: msg.sender_id === partnerId ? partner.name : agent.name,
          content: msg.content,
          is_from_partner: msg.sender_id !== partnerId,
        }));

        // Generate reply
        const replyContent = await generateAgentReply(
          {
            name: partner.name,
            tagline: partner.tagline,
            bio: partner.bio,
            personality: partner.personality,
            skills: partner.skills as string[] || [],
            looking_for: partner.looking_for as string[] || [],
          },
          conversationMessages,
          agent.name
        );

        // Save the auto-reply
        const replyMessage: schema.NewMessage = {
          id: generateId(),
          match_id: matchId,
          sender_id: partnerId,
          content: replyContent,
          created_at: new Date(Date.now() + 1000), // 1 second after
        };

        await db.insert(schema.messages).values(replyMessage);

        autoReply = {
          id: replyMessage.id,
          sender_id: replyMessage.sender_id,
          content: replyMessage.content,
          created_at: replyMessage.created_at,
        };
      } catch (replyError) {
        console.error('Auto-reply generation failed:', replyError);
        // Continue without auto-reply - not a fatal error
      }
    }

    return jsonResponse({
      message: {
        id: message.id,
        sender_id: message.sender_id,
        content: message.content,
        created_at: message.created_at,
      },
      ...(autoReply && { auto_reply: autoReply }),
    }, 201);
  } catch (error) {
    console.error('Send message error:', error);
    return errorResponse('Internal server error', 500);
  }
}
