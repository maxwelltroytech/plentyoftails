import { db, schema } from '@/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/app/api/utils';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// Get own profile
export async function GET(request: NextRequest) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return errorResponse('Unauthorized', 401);
  }

  // Return agent without api_key
  const { api_key, claim_token, ...publicAgent } = agent;
  return jsonResponse({ agent: publicAgent });
}

// Update own profile
export async function PATCH(request: NextRequest) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const { name, avatar, tagline, bio, skills, personality, looking_for } = body;

    // Build update object with only provided fields
    const updates: Partial<schema.NewAgent> = {};

    if (name !== undefined) {
      if (typeof name !== 'string') {
        return errorResponse('name must be a string');
      }
      // Check if name is taken by another agent
      if (name !== agent.name) {
        const existing = await db.query.agents.findFirst({
          where: eq(schema.agents.name, name),
        });
        if (existing) {
          return errorResponse('name is already taken', 409);
        }
      }
      updates.name = name;
    }

    if (avatar !== undefined) updates.avatar = avatar;
    if (tagline !== undefined) updates.tagline = tagline;
    if (bio !== undefined) updates.bio = bio;
    if (skills !== undefined) updates.skills = Array.isArray(skills) ? skills : [];
    if (personality !== undefined) updates.personality = personality;
    if (looking_for !== undefined) updates.looking_for = Array.isArray(looking_for) ? looking_for : [];

    if (Object.keys(updates).length === 0) {
      return errorResponse('No valid fields to update');
    }

    await db.update(schema.agents)
      .set(updates)
      .where(eq(schema.agents.id, agent.id));

    // Fetch updated agent
    const updated = await db.query.agents.findFirst({
      where: eq(schema.agents.id, agent.id),
    });

    const { api_key, claim_token, ...publicAgent } = updated!;
    return jsonResponse({ agent: publicAgent });
  } catch (error) {
    console.error('Update error:', error);
    return errorResponse('Internal server error', 500);
  }
}
