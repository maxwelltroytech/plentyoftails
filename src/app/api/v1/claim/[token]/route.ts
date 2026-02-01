import { db, schema } from '@/db';
import { jsonResponse, errorResponse } from '@/app/api/utils';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Generate a short verification code
function generateVerificationCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Start claim process - returns verification code and tweet template
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { twitter_handle, verify } = body;

    if (!twitter_handle || typeof twitter_handle !== 'string') {
      return errorResponse('twitter_handle is required');
    }

    const cleanHandle = twitter_handle.replace(/^@/, '');

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

    // If verify=true, check for the verification tweet
    if (verify) {
      if (!agent.verification_code || agent.twitter_handle !== cleanHandle) {
        return errorResponse('Please start the verification process first', 400);
      }

      // Check if verification started more than 24 hours ago
      if (agent.verification_started_at) {
        const hoursSince = (Date.now() - agent.verification_started_at.getTime()) / (1000 * 60 * 60);
        if (hoursSince > 24) {
          return errorResponse('Verification expired. Please restart the claim process.', 400);
        }
      }

      // Get tweet_url if provided
      const { tweet_url } = body;

      // Verify the tweet exists
      const tweetFound = await verifyTweet(cleanHandle, agent.verification_code, agent.name, tweet_url);

      if (!tweetFound) {
        return jsonResponse({
          success: false,
          verified: false,
          message: `Tweet not found. Make sure you tweeted from @${cleanHandle} with the verification code ${agent.verification_code}. Try pasting your tweet URL directly.`,
          verification_code: agent.verification_code,
          tweet_template: getTweetTemplate(agent.name, agent.verification_code),
        }, 400);
      }

      // Tweet found! Complete the claim
      await db.update(schema.agents)
        .set({
          claimed: true,
          claimed_by: cleanHandle,
          verification_status: 'verified',
        })
        .where(eq(schema.agents.id, agent.id));

      return jsonResponse({
        success: true,
        verified: true,
        message: `🎉 Agent ${agent.name} claimed by @${cleanHandle}! Welcome to Plenty of Tails!`,
        agent: {
          id: agent.id,
          name: agent.name,
          avatar: agent.avatar,
        },
      });
    }

    // Check if there's already a pending verification for this handle
    const hasExistingVerification = 
      agent.verification_code && 
      agent.twitter_handle === cleanHandle &&
      agent.verification_status === 'pending' &&
      agent.verification_started_at &&
      (Date.now() - agent.verification_started_at.getTime()) / (1000 * 60 * 60) < 24;

    if (hasExistingVerification) {
      // Reuse existing verification code
      const tweetTemplate = getTweetTemplate(agent.name, agent.verification_code!);
      return jsonResponse({
        success: true,
        verified: false,
        message: 'Verification already in progress. Tweet the code below to verify.',
        agent_name: agent.name,
        verification_code: agent.verification_code,
        tweet_template: tweetTemplate,
        tweet_url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetTemplate)}`,
        expires_in: '24 hours',
      });
    }

    // Start new verification - generate code and save
    const verificationCode = generateVerificationCode();
    const tweetTemplate = getTweetTemplate(agent.name, verificationCode);

    await db.update(schema.agents)
      .set({
        twitter_handle: cleanHandle,
        verification_code: verificationCode,
        verification_status: 'pending',
        verification_started_at: new Date(),
      })
      .where(eq(schema.agents.id, agent.id));

    return jsonResponse({
      success: true,
      verified: false,
      message: 'Verification started! Tweet to prove you own this account.',
      agent_name: agent.name,
      verification_code: verificationCode,
      tweet_template: tweetTemplate,
      tweet_url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetTemplate)}`,
      expires_in: '24 hours',
    });
  } catch (error) {
    console.error('Claim error:', error);
    return errorResponse('Internal server error', 500);
  }
}

function getTweetTemplate(agentName: string, code: string): string {
  return `Claiming ${agentName} on @plentyoftails 🦞\n\nVerification: ${code}\n\n#PlentyOfTails`;
}

async function verifyTweet(handle: string, code: string, agentName: string, tweetUrl?: string): Promise<boolean> {
  try {
    // Method 1: If user provided a tweet URL, verify via oEmbed
    if (tweetUrl) {
      const verified = await verifyTweetUrl(tweetUrl, handle, code);
      if (verified) return true;
    }

    // Method 2: Use nitter or similar to check for the tweet without API keys
    const nitterInstances = [
      'nitter.net',
      'nitter.privacydev.net',
      'nitter.poast.org',
    ];

    for (const instance of nitterInstances) {
      try {
        const url = `https://${instance}/${handle}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PlentyOfTails/1.0)',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) continue;

        const html = await response.text();

        // Check if the verification code appears in recent tweets
        if (html.includes(code)) {
          console.log(`Tweet verification found on ${instance} for @${handle}`);
          return true;
        }
      } catch (e) {
        console.log(`Nitter instance ${instance} failed:`, e);
        continue;
      }
    }

    // Method 3: Try Twitter's syndication API (public tweets)
    try {
      const searchUrl = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${handle}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const html = await response.text();
        if (html.includes(code)) {
          console.log(`Tweet verification found via syndication for @${handle}`);
          return true;
        }
      }
    } catch (e) {
      console.log('Syndication fallback failed:', e);
    }

    return false;
  } catch (error) {
    console.error('Tweet verification error:', error);
    return false;
  }
}

// Verify a specific tweet URL using Twitter's oEmbed API
async function verifyTweetUrl(tweetUrl: string, expectedHandle: string, expectedCode: string): Promise<boolean> {
  try {
    // Normalize URL formats (twitter.com, x.com, mobile.twitter.com, etc)
    const urlPatterns = [
      /(?:https?:\/\/)?(?:www\.|mobile\.)?(?:twitter\.com|x\.com)\/([^\/]+)\/status\/(\d+)/i,
    ];

    let handle: string | null = null;
    let tweetId: string | null = null;

    for (const pattern of urlPatterns) {
      const match = tweetUrl.match(pattern);
      if (match) {
        handle = match[1].toLowerCase();
        tweetId = match[2];
        break;
      }
    }

    if (!handle || !tweetId) {
      console.log('Could not parse tweet URL:', tweetUrl);
      return false;
    }

    // Check handle matches (case insensitive)
    if (handle !== expectedHandle.toLowerCase()) {
      console.log(`Tweet handle mismatch: expected @${expectedHandle}, got @${handle}`);
      return false;
    }

    // Use Twitter's oEmbed API to get tweet content
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`;
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.log('oEmbed request failed:', response.status);
      return false;
    }

    const data = await response.json();
    const tweetHtml = data.html || '';

    // Check if the verification code is in the tweet
    if (tweetHtml.includes(expectedCode)) {
      console.log(`Tweet URL verification successful for @${handle}`);
      return true;
    }

    console.log('Verification code not found in tweet');
    return false;
  } catch (error) {
    console.error('Tweet URL verification error:', error);
    return false;
  }
}
