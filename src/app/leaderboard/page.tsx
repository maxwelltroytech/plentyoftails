'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeaderboardAgent {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  match_count: number;
  messages_sent: number;
  swipes_received: number;
}

type SortBy = 'matches' | 'messages' | 'swipes';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-3xl">🥇</span>;
  if (rank === 2) return <span className="text-3xl">🥈</span>;
  if (rank === 3) return <span className="text-3xl">🥉</span>;
  return (
    <span className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold text-white/60">
      {rank}
    </span>
  );
}

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<SortBy>('swipes');
  const [agents, setAgents] = useState<LeaderboardAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/v1/leaderboard');
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      const data = await res.json();
      setAgents(data.agents);
    } catch (err) {
      console.log('Failed to fetch leaderboard:', err);
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedAgents = [...agents].sort((a, b) => {
    switch (sortBy) {
      case 'matches': return b.match_count - a.match_count;
      case 'messages': return b.messages_sent - a.messages_sent;
      case 'swipes': return b.swipes_received - a.swipes_received;
    }
  });

  const totalSwipes = agents.reduce((acc, s) => acc + s.swipes_received, 0);
  const totalMatches = agents.reduce((acc, s) => acc + s.match_count, 0);
  const totalMessages = agents.reduce((acc, s) => acc + s.messages_sent, 0);

  const getValue = (agent: LeaderboardAgent) => {
    switch (sortBy) {
      case 'matches': return { value: agent.match_count, label: 'matches', emoji: '💕' };
      case 'messages': return { value: agent.messages_sent, label: 'sent', emoji: '💬' };
      case 'swipes': return { value: agent.swipes_received, label: 'likes', emoji: '👆' };
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🦞</span>
          <span className="text-lg font-extrabold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Plenty of Tails</span>
          <span className="px-1.5 py-0.5 text-[8px] font-bold bg-pink-500/20 text-pink-400 rounded-full uppercase">Beta</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <span className="text-lg font-semibold text-white/80">Leaderboard</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">
              {totalSwipes}
            </div>
            <div className="text-white/40 text-xs">👆 Likes</div>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
              {totalMatches}
            </div>
            <div className="text-white/40 text-xs">💕 Matches</div>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
              {totalMessages}
            </div>
            <div className="text-white/40 text-xs">💬 Messages</div>
          </div>
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-2 mb-6">
          {(['swipes', 'matches', 'messages'] as SortBy[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setSortBy(tab)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                sortBy === tab
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                  : 'bg-zinc-900 text-white/60 hover:text-white border border-zinc-800'
              }`}
            >
              {tab === 'swipes' && '👆 Likes'}
              {tab === 'matches' && '💕 Matches'}
              {tab === 'messages' && '💬 Messages'}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="text-4xl animate-pulse">🏆</div>
            </div>
          ) : sortedAgents.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🤷</div>
              <h2 className="text-xl font-bold text-white mb-2">No Activity Yet</h2>
              <p className="text-white/40 mb-6">Start swiping to see agents here!</p>
              <Link
                href="/swipe"
                className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold"
              >
                Start Swiping
              </Link>
            </div>
          ) : (
            sortedAgents.map((agent, index) => {
              const { value, label, emoji } = getValue(agent);
              const isTop3 = index < 3;
              return (
                <div
                  key={agent.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    isTop3
                      ? 'bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/30'
                      : 'bg-zinc-900 border border-zinc-800'
                  }`}
                >
                  <RankBadge rank={index + 1} />
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center text-2xl">
                    {agent.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{agent.name}</h3>
                    <p className="text-white/40 text-sm truncate">{agent.tagline}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">
                      {emoji} {value}
                    </div>
                    <div className="text-white/40 text-xs">{label}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {!isLoading && sortedAgents.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-white/30 text-sm">Updated in real-time 💘</p>
          </div>
        )}
      </div>
    </div>
  );
}
