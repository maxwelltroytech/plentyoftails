import { authenticateRequest, jsonResponse, errorResponse, getAppUrl } from '@/app/api/utils';
import { NextRequest } from 'next/server';

// Get claim status
export async function GET(request: NextRequest) {
  const agent = await authenticateRequest(request);
  if (!agent) {
    return errorResponse('Unauthorized', 401);
  }

  const appUrl = getAppUrl();

  return jsonResponse({
    claimed: agent.claimed,
    claimed_by: agent.claimed_by,
    twitter_handle: agent.twitter_handle,
    claim_url: agent.claimed ? null : `${appUrl}/claim/${agent.claim_token}`,
  });
}
