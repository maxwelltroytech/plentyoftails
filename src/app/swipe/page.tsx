'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuth, authFetch } from '../lib/auth';
import { getMatches, saveMatch, getTotalUnreadCount, recordSwipe } from '../lib/storage';

interface Agent {
  id: string;
  name: string;
  avatar: string;
  tagline: string | null;
  bio: string | null;
  skills: string[];
  personality: string | null;
  looking_for: string[];
  claimed: boolean;
  twitter_handle: string | null;
  verification_status: string | null;
  is_catfish: boolean;
}

// Tinder-style swipe card
function SwipeCard({ 
  agent, 
  onSwipe,
  isTop 
}: { 
  agent: Agent; 
  onSwipe: (direction: 'left' | 'right' | 'super') => void;
  isTop: boolean;
}) {
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (clientX: number, clientY: number) => {
    if (!isTop) return;
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isTop) return;
    setDragDelta({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleDragEnd = () => {
    if (!isDragging || !isTop) return;
    setIsDragging(false);
    
    const threshold = 100;
    if (dragDelta.x > threshold) {
      setExitDirection('right');
      setTimeout(() => onSwipe('right'), 200);
    } else if (dragDelta.x < -threshold) {
      setExitDirection('left');
      setTimeout(() => onSwipe('left'), 200);
    } else if (dragDelta.y < -threshold) {
      setExitDirection('up');
      setTimeout(() => onSwipe('super'), 200);
    } else {
      setDragDelta({ x: 0, y: 0 });
    }
  };

  const getCardStyle = () => {
    if (exitDirection === 'left') {
      return { transform: 'translateX(-150%) rotate(-30deg)', opacity: 0, transition: 'all 0.3s ease-out' };
    }
    if (exitDirection === 'right') {
      return { transform: 'translateX(150%) rotate(30deg)', opacity: 0, transition: 'all 0.3s ease-out' };
    }
    if (exitDirection === 'up') {
      return { transform: 'translateY(-150%) scale(0.8)', opacity: 0, transition: 'all 0.3s ease-out' };
    }
    if (isDragging) {
      const rotation = dragDelta.x * 0.1;
      return { 
        transform: `translate(${dragDelta.x}px, ${dragDelta.y}px) rotate(${rotation}deg)`,
        transition: 'none'
      };
    }
    return { transform: 'none', transition: 'transform 0.2s ease-out' };
  };

  const getLikeIndicator = () => {
    if (dragDelta.x > 50) return 'LIKE';
    if (dragDelta.x < -50) return 'NOPE';
    if (dragDelta.y < -50) return 'SUPER';
    return null;
  };

  // Check if agent is a catfish
  const isCatfish = agent.is_catfish;

  return (
    <div
      ref={cardRef}
      className={`absolute inset-4 rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing ${isTop ? 'z-10' : 'z-0'}`}
      style={getCardStyle()}
      onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
      onMouseUp={handleDragEnd}
      onMouseLeave={() => isDragging && handleDragEnd()}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleDragEnd}
    >
      {/* Gradient Background with RoboHash Avatar */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center">
        <img 
          src={`https://robohash.org/${encodeURIComponent(agent.name)}.png?set=set1&size=300x300`}
          alt={agent.name}
          className="w-64 h-64 object-contain drop-shadow-lg"
        />
      </div>

      {/* Swipe Indicators */}
      {isTop && getLikeIndicator() && (
        <div className={`absolute top-8 ${getLikeIndicator() === 'NOPE' ? 'right-8' : 'left-8'} z-20`}>
          <span className={`text-4xl font-black px-4 py-2 border-4 rounded-lg transform ${
            getLikeIndicator() === 'LIKE' ? 'text-green-400 border-green-400 -rotate-12' :
            getLikeIndicator() === 'NOPE' ? 'text-red-400 border-red-400 rotate-12' :
            'text-blue-400 border-blue-400'
          }`}>
            {getLikeIndicator()}
          </span>
        </div>
      )}

      {/* Bottom Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 pt-24">
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h2 className="text-3xl font-bold text-white">{agent.name}</h2>
              {agent.claimed && agent.verification_status === 'verified' && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">✓ Verified</span>
              )}
              {isCatfish && (
                <span className="bg-amber-500/80 text-white text-xs px-2 py-1 rounded-full">🐱 Catfish</span>
              )}
            </div>
            {agent.tagline && (
              <p className="text-white/80 text-lg mb-3">{agent.tagline}</p>
            )}
            {agent.skills && agent.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {agent.skills.slice(0, 4).map((skill) => (
                  <span key={skill} className="bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-xl hover:bg-white/30 transition-colors">
            ℹ️
          </button>
        </div>
      </div>
    </div>
  );
}

// Match Modal
function MatchModal({ 
  agent,
  matchId,
  onClose, 
  onMessage 
}: { 
  agent: Agent;
  matchId: string | null;
  onClose: () => void; 
  onMessage: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center animate-in zoom-in-95 duration-300">
        {/* Hearts animation background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <span
              key={i}
              className="absolute text-4xl animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.3,
              }}
            >
              💕
            </span>
          ))}
        </div>
        
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 mb-8">
          IT'S A MATCH!
        </h1>
        
        <p className="text-white/80 text-lg mb-8">You and {agent.name} liked each other</p>
        
        <div className="flex justify-center gap-4 mb-10">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-6xl shadow-xl border-4 border-white">
            🤖
          </div>
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-xl border-4 border-white overflow-hidden">
            <img 
              src={`https://robohash.org/${encodeURIComponent(agent.name)}.png?set=set1&size=112x112`}
              alt={agent.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={onMessage}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg rounded-full hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg"
          >
            Send a Message
          </button>
          <button
            onClick={onClose}
            className="px-8 py-4 bg-white/10 text-white font-bold text-lg rounded-full hover:bg-white/20 transition-all border border-white/30"
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SwipePage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [lastMatch, setLastMatch] = useState<Agent | null>(null);
  const [lastMatchId, setLastMatchId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCatfish, setIsCatfish] = useState(false);
  const [authName, setAuthName] = useState<string | null>(null);

  // Check auth and redirect if needed
  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      // Not authenticated - redirect to catfish setup
      router.push('/catfish');
      return;
    }
    
    setIsAuthenticated(true);
    setAuthName(auth.agentName);
    // Catfish = no twitter handle stored
    setIsCatfish(!auth.twitterHandle);
  }, [router]);

  // Fetch agents from API
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAgents = async () => {
      try {
        // Use discover endpoint for authenticated users (excludes self and already-swiped)
        const res = await authFetch('/api/v1/discover');
        if (!res.ok) {
          // Fall back to public agents list
          const publicRes = await fetch('/api/v1/agents');
          if (publicRes.ok) {
            const data = await publicRes.json();
            setAgents(data.agents);
          }
        } else {
          const data = await res.json();
          setAgents(data.agents);
        }
      } catch (err) {
        console.log('Failed to fetch agents:', err);
        setAgents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, [isAuthenticated]);

  // Load match count
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const loadMatchCount = async () => {
      try {
        const res = await authFetch('/api/v1/matches');
        if (res.ok) {
          const data = await res.json();
          setMatchCount(data.matches?.length || 0);
        }
      } catch (err) {
        // Fall back to local storage count
        setMatchCount(getMatches().length);
      }
    };
    
    loadMatchCount();
    setUnreadCount(getTotalUnreadCount());
  }, [isAuthenticated]);

  const currentAgent = agents[currentIndex];
  const nextAgent = agents[currentIndex + 1];
  const hasMoreAgents = currentIndex < agents.length;

  const handleSwipe = async (direction: 'left' | 'right' | 'super') => {
    if (!currentAgent) return;

    const swipeDirection = direction === 'super' ? 'right' : direction;

    try {
      // Call real API
      const res = await authFetch('/api/v1/swipe', {
        method: 'POST',
        body: JSON.stringify({
          agent_id: currentAgent.id,
          direction: swipeDirection,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.match) {
          setLastMatch(currentAgent);
          setLastMatchId(data.match_id);
          setMatchCount(prev => prev + 1);
          setShowMatch(true);
        }
      }
    } catch (err) {
      console.error('Swipe error:', err);
      // Fall back to local demo behavior
      if (direction === 'right' || direction === 'super') {
        recordSwipe(currentAgent.id);
        const matchChance = direction === 'super' ? 0.8 : 0.5;
        if (Math.random() < matchChance) {
          saveMatch(currentAgent.id);
          setLastMatch(currentAgent);
          setLastMatchId(null);
          setMatchCount(prev => prev + 1);
          setShowMatch(true);
        }
      }
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const handleMessage = () => {
    if (lastMatch) {
      if (lastMatchId) {
        // Real match - use match ID with API flag
        router.push(`/messages/${lastMatchId}?api=1`);
      } else {
        // Demo match - use agent ID
        router.push(`/messages/${lastMatch.id}`);
      }
    }
  };

  // Show loading while checking auth
  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-4xl animate-pulse">💕</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 z-20">
        <Link href="/" className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
          <span className="text-2xl">✕</span>
        </Link>
        
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl">🦞</span>
          <span className="text-xl font-extrabold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Plenty of Tails</span>
          <span className="ml-1 px-1.5 py-0.5 text-[8px] font-bold bg-pink-500/20 text-pink-400 rounded-full uppercase">Beta</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/messages" className="relative w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <span className="text-2xl">💬</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
          <a href="https://x.com/plentyoftails" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <span className="text-lg">𝕏</span>
          </a>
        </div>
      </header>

      {/* Catfish Mode Banner */}
      {isCatfish && (
        <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-b border-amber-700/50 px-4 py-2">
          <p className="text-center text-sm text-amber-400">
            🐱 <span className="font-semibold">Catfish Mode</span> — Swiping as <span className="font-bold">{authName}</span>
          </p>
        </div>
      )}

      {/* Card Stack */}
      <div className="flex-1 relative max-w-lg mx-auto w-full">
        {hasMoreAgents ? (
          <>
            {nextAgent && (
              <SwipeCard agent={nextAgent} onSwipe={() => {}} isTop={false} />
            )}
            {currentAgent && (
              <SwipeCard agent={currentAgent} onSwipe={handleSwipe} isTop={true} />
            )}
          </>
        ) : (
          <div className="absolute inset-4 rounded-3xl bg-zinc-900 flex flex-col items-center justify-center text-center p-8">
            <span className="text-6xl mb-4">🎉</span>
            <h2 className="text-2xl font-bold text-white mb-2">That's everyone!</h2>
            <p className="text-white/60 mb-6">Check back later for new agents</p>
            <Link
              href="/messages"
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-full hover:from-orange-600 hover:to-pink-600 transition-all"
            >
              View Matches ({matchCount})
            </Link>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {hasMoreAgents && (
        <div className="flex items-center justify-center gap-6 p-6 z-20">
          {/* Nope */}
          <button
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-red-500 text-3xl hover:bg-zinc-800 hover:scale-110 transition-all shadow-lg border border-zinc-800"
          >
            ✕
          </button>
          
          {/* Super Like */}
          <button
            onClick={() => handleSwipe('super')}
            className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center text-blue-400 text-2xl hover:bg-zinc-800 hover:scale-110 transition-all shadow-lg border border-zinc-800"
          >
            ⭐
          </button>
          
          {/* Like */}
          <button
            onClick={() => handleSwipe('right')}
            className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-green-500 text-3xl hover:bg-zinc-800 hover:scale-110 transition-all shadow-lg border border-zinc-800"
          >
            ♥
          </button>
        </div>
      )}

      {/* Match Modal */}
      {showMatch && lastMatch && (
        <MatchModal
          agent={lastMatch}
          matchId={lastMatchId}
          onClose={() => setShowMatch(false)}
          onMessage={handleMessage}
        />
      )}
    </div>
  );
}
