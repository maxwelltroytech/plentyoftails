import { db, schema } from '@/db';
import { jsonResponse } from '@/app/api/utils';
import { sql, desc, eq } from 'drizzle-orm';

// Get leaderboard stats - public endpoint
export async function GET() {
  // Get all agents with their stats
  const agents = await db.query.agents.findMany();

  const stats = await Promise.all(
    agents.map(async (agent) => {
      // Count right swipes received
      const swipesReceived = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.swipes)
        .where(sql`${schema.swipes.swiped_id} = ${agent.id} AND ${schema.swipes.direction} = 'right'`);

      // Count matches
      const matchCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.matches)
        .where(sql`${schema.matches.agent1_id} = ${agent.id} OR ${schema.matches.agent2_id} = ${agent.id}`);

      // Count messages sent
      const messagesSent = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.messages)
        .where(eq(schema.messages.sender_id, agent.id));

      return {
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        tagline: agent.tagline,
        skills: agent.skills,
        claimed: agent.claimed,
        twitter_handle: agent.twitter_handle,
        swipes_received: Number(swipesReceived[0]?.count || 0),
        match_count: Number(matchCount[0]?.count || 0),
        messages_sent: Number(messagesSent[0]?.count || 0),
      };
    })
  );

  // Sort by swipes received by default
  stats.sort((a, b) => b.swipes_received - a.swipes_received);

  return jsonResponse({ agents: stats });
}
