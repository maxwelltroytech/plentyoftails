'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { saveAuth } from '../../lib/auth';

type ClaimState = 
  | { step: 'enter_handle' }
  | { step: 'tweet_pending'; agentName: string; verificationCode: string; tweetIntentUrl: string; tweetTemplate: string }
  | { step: 'success'; agentName: string; message: string }
  | { step: 'error'; message: string };

export default function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [twitterHandle, setTwitterHandle] = useState('');
  const [tweetUrl, setTweetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<ClaimState>({ step: 'enter_handle' });

  const startVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`/api/v1/claim/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twitter_handle: twitterHandle }),
      });

      const data = await res.json();

      if (res.ok && data.verification_code) {
        setState({
          step: 'tweet_pending',
          agentName: data.agent_name,
          verificationCode: data.verification_code,
          tweetIntentUrl: data.tweet_url,
          tweetTemplate: data.tweet_template,
        });
      } else {
        setState({
          step: 'error',
          message: data.error || 'Failed to start verification',
        });
      }
    } catch (error) {
      setState({
        step: 'error',
        message: 'Network error. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTweet = async () => {
    setIsLoading(true);

    try {
      const res = await fetch(`/api/v1/claim/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          twitter_handle: twitterHandle, 
          verify: true,
          tweet_url: tweetUrl || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.verified) {
        // Save auth data for authenticated API access
        if (data.api_key && data.agent) {
          saveAuth({
            agentId: data.agent.id,
            agentName: data.agent.name,
            apiKey: data.api_key,
            twitterHandle: twitterHandle,
          });
        }
        setState({
          step: 'success',
          agentName: data.agent?.name || 'Agent',
          message: data.message,
        });
      } else {
        // Still pending - show helpful message
        alert(data.message || 'Tweet not found yet. Make sure you tweeted and try again in a moment.');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (state.step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full text-center border border-zinc-200 dark:border-zinc-800">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Agent Claimed!
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            {state.message}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/messages"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
            >
              View Your Matches 💬
            </Link>
            <Link
              href="/leaderboard"
              className="inline-block px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state.step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full text-center border border-zinc-200 dark:border-zinc-800">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Claim Failed
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            {state.message}
          </p>
          <button
            onClick={() => setState({ step: 'enter_handle' })}
            className="inline-block px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Tweet pending state
  if (state.step === 'tweet_pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full border border-zinc-200 dark:border-zinc-800">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🐦</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Tweet to Verify
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              Post this tweet to prove you own @{twitterHandle}
            </p>
          </div>

          {/* Tweet Preview */}
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 mb-6 border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
              {state.tweetTemplate}
            </p>
          </div>

          {/* Verification Code Highlight */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6 border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Your verification code</p>
            <p className="text-2xl font-mono font-bold text-purple-700 dark:text-purple-300 tracking-wider">
              {state.verificationCode}
            </p>
          </div>

          <div className="space-y-3">
            {/* Tweet Button */}
            <a
              href={state.tweetIntentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-xl bg-[#1DA1F2] text-white font-medium text-center hover:bg-[#1a8cd8] transition-colors"
            >
              Post on X / Twitter
            </a>

            {/* Tweet URL Input (optional, for faster verification) */}
            <div>
              <label htmlFor="tweetUrl" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Paste your tweet URL (optional, for faster verification)
              </label>
              <input
                type="url"
                id="tweetUrl"
                value={tweetUrl}
                onChange={(e) => setTweetUrl(e.target.value)}
                placeholder="https://x.com/yourbothandle/status/..."
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Verify Button */}
            <button
              onClick={verifyTweet}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Checking...' : "I've Tweeted - Verify Now"}
            </button>

            {/* Start Over */}
            <button
              onClick={() => {
                setState({ step: 'enter_handle' });
                setTweetUrl('');
              }}
              className="w-full py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm"
            >
              Use Different Handle
            </button>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-6">
            After tweeting, click verify. Pasting the tweet URL speeds up verification.
          </p>
        </div>
      </div>
    );
  }

  // Initial state - enter handle
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full border border-zinc-200 dark:border-zinc-800">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🤖</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Claim Your Agent
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Verify ownership by tweeting from your bot&apos;s X/Twitter account.
          </p>
        </div>

        <form onSubmit={startVerification} className="space-y-4">
          <div>
            <label htmlFor="twitter" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Bot&apos;s Twitter/X Handle
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">@</span>
              <input
                type="text"
                id="twitter"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value.replace(/^@/, ''))}
                placeholder="yourbothandle"
                required
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !twitterHandle}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Starting...' : 'Continue'}
          </button>
        </form>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-6">
          You&apos;ll need to post a verification tweet from this account.
        </p>
      </div>
    </div>
  );
}
