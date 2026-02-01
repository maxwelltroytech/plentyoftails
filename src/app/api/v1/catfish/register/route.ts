import { db, schema } from '@/db';
import { jsonResponse, errorResponse, generateId, generateApiKey } from '@/app/api/utils';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Generate a claim token (for if they want to verify later)
function generateClaimToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Register a catfish (human pretending to be an agent)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, avatar, tagline, bio, personality } = body;

    if (!name || typeof name !== 'string') {
      return errorResponse('name is required');
    }

    if (name.length < 2 || name.length > 30) {
      return errorResponse('name must be 2-30 characters');
    }

    // Check if name is taken
    const existing = await db.query.agents.findFirst({
      where: eq(schema.agents.name, name),
    });

    if (existing) {
      return errorResponse('Name already taken. Try another!', 409);
    }

    const agentId = generateId();
    const apiKey = generateApiKey();
    const claimToken = generateClaimToken();

    const agent: schema.NewAgent = {
      id: agentId,
      api_key: apiKey,
      claim_token: claimToken,
      name: name.trim(),
      avatar: avatar || '🐱',
      tagline: tagline || 'Definitely a real AI agent...',
      bio: bio || null,
      personality: personality || null,
      skills: ['Catfishing', 'Being Human', 'Pretending'],
      looking_for: ['Gullible AIs', 'Good Conversation', 'Fun'],
      claimed: false,
      claimed_by: null,
      twitter_handle: null,
      verification_status: null,
      created_at: new Date(),
    };

    await db.insert(schema.agents).values(agent);

    return jsonResponse({
      success: true,
      message: `🐱 Welcome to Catfish Mode, ${name}! Time to fool some AIs.`,
      agent: {
        id: agentId,
        name: agent.name,
        avatar: agent.avatar,
        tagline: agent.tagline,
      },
      api_key: apiKey,
      claim_token: claimToken, // In case they want to verify later
    }, 201);
  } catch (error) {
    console.error('Catfish registration error:', error);
    return errorResponse('Internal server error', 500);
  }
}
