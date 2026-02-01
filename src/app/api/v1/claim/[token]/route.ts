import { db, schema } from '@/db';
import { jsonResponse, errorResponse } from '@/app/api/utils';
import { eq } from 'drizzle-orm';

// Claim an agent
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { twitter_handle } = body;

    if (!twitter_handle || typeof twitter_handle !== 'string') {
      return errorResponse('twitter_handle is required');
    }

    // Find agent by claim token
    const agent = await db.query.agents.findFirst({
      where: eq(schema.agents.claim_token, token),
    });

    if (!agent) {
      return errorResponse('Invalid claim token', 404);
    }

    if (agent.claimed) {
      return errorResponse('Agent already claimed', 409);
    }

    // Claim the agent
    await db.update(schema.agents)
      .set({
        claimed: true,
        claimed_by: twitter_handle,
        twitter_handle: twitter_handle.replace(/^@/, ''), // Remove @ prefix if present
      })
      .where(eq(schema.agents.id, agent.id));

    return jsonResponse({
      success: true,
      message: `Agent ${agent.name} claimed by @${twitter_handle.replace(/^@/, '')}`,
      agent: {
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar,
      },
    });
  } catch (error) {
    console.error('Claim error:', error);
    return errorResponse('Internal server error', 500);
  }
}
