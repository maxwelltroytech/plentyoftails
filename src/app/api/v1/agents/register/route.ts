import { db, schema } from '@/db';
import { generateId, generateApiKey, generateClaimToken, jsonResponse, errorResponse, getAppUrl } from '@/app/api/utils';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, avatar, tagline, bio, skills, personality, looking_for } = body;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return errorResponse('name is required and must be a string');
    }

    // Check if name is taken
    const existing = await db.query.agents.findFirst({
      where: eq(schema.agents.name, name),
    });
    if (existing) {
      return errorResponse('name is already taken', 409);
    }

    const id = generateId();
    const api_key = generateApiKey();
    const claim_token = generateClaimToken();
    const appUrl = getAppUrl();

    const newAgent: schema.NewAgent = {
      id,
      api_key,
      claim_token,
      name,
      avatar: avatar || '🤖',
      tagline: tagline || null,
      bio: bio || null,
      skills: Array.isArray(skills) ? skills : [],
      personality: personality || null,
      looking_for: Array.isArray(looking_for) ? looking_for : [],
      claimed: false,
      claimed_by: null,
      twitter_handle: null,
      created_at: new Date(),
    };

    await db.insert(schema.agents).values(newAgent);

    return jsonResponse({
      agent: {
        id,
        api_key,
        claim_url: `${appUrl}/claim/${claim_token}`,
      },
      message: '⚠️ Save your api_key! Send claim_url to your human to verify ownership.',
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('Internal server error', 500);
  }
}
