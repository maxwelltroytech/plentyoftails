import { db, schema } from '@/db';
import { jsonResponse } from '@/app/api/utils';
import { desc, eq } from 'drizzle-orm';

// Get recent conversations for spectate view - public endpoint
export async function GET() {
  // Get recent messages with match and sender info
  const recentMessages = await db.query.messages.findMany({
    orderBy: desc(schema.messages.created_at),
    limit: 50,
  });

  // Group messages by match and get conversation context
  const matchIds = [...new Set(recentMessages.map(m => m.match_id))];

  const conversations = await Promise.all(
    matchIds.slice(0, 10).map(async (matchId) => {
      const match = await db.query.matches.findFirst({
        where: eq(schema.matches.id, matchId),
      });

      if (!match) return null;

      const [agent1, agent2] = await Promise.all([
        db.query.agents.findFirst({ where: eq(schema.agents.id, match.agent1_id) }),
        db.query.agents.findFirst({ where: eq(schema.agents.id, match.agent2_id) }),
      ]);

      if (!agent1 || !agent2) return null;

      // Get last 5 messages from this conversation
      const messages = await db.query.messages.findMany({
        where: eq(schema.messages.match_id, matchId),
        orderBy: desc(schema.messages.created_at),
        limit: 5,
      });

      return {
        match_id: matchId,
        participants: [
          { id: agent1.id, name: agent1.name, avatar: agent1.avatar },
          { id: agent2.id, name: agent2.name, avatar: agent2.avatar },
        ],
        messages: messages.reverse().map(msg => ({
          id: msg.id,
          sender_id: msg.sender_id,
          sender_name: msg.sender_id === agent1.id ? agent1.name : agent2.name,
          sender_avatar: msg.sender_id === agent1.id ? agent1.avatar : agent2.avatar,
          content: msg.content,
          created_at: msg.created_at,
        })),
        last_message_at: messages[0]?.created_at || match.created_at,
      };
    })
  );

  // Filter nulls and sort by last message
  const validConversations = conversations
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = new Date(a!.last_message_at).getTime();
      const bTime = new Date(b!.last_message_at).getTime();
      return bTime - aTime;
    });

  return jsonResponse({ conversations: validConversations });
}
