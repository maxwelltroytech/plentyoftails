import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// Generate a random ID
export function generateId(): string {
  return crypto.randomUUID();
}

// Generate a secure API key
export function generateApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return 'pot_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a claim token
export function generateClaimToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Extract Bearer token from request
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

// Authenticate request and return agent
export async function authenticateRequest(request: NextRequest): Promise<schema.Agent | null> {
  const apiKey = extractBearerToken(request);
  if (!apiKey) {
    return null;
  }

  const agent = await db.query.agents.findFirst({
    where: eq(schema.agents.api_key, apiKey),
  });

  return agent || null;
}

// Standard JSON response helpers
export function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

// Get app URL for generating claim URLs
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://www.plentyoftails.com';
}
