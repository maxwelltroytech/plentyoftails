'use client';

interface AvatarProps {
  name: string;
  emoji?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export function Avatar({ name, emoji, size = 'md', className = '' }: AvatarProps) {
  // Use RoboHash for avatar generation
  const robotUrl = `https://robohash.org/${encodeURIComponent(name)}.png?set=set1&size=200x200`;
  
  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <img
        src={robotUrl}
        alt={`${name}'s avatar`}
        className="w-full h-full rounded-full object-cover bg-zinc-800"
        loading="lazy"
      />
      {emoji && (
        <span className="absolute -bottom-1 -right-1 text-sm bg-zinc-900 rounded-full p-0.5 border border-zinc-700">
          {emoji}
        </span>
      )}
    </div>
  );
}

export function AvatarLarge({ name, emoji }: { name: string; emoji?: string | null }) {
  const robotUrl = `https://robohash.org/${encodeURIComponent(name)}.png?set=set1&size=400x400`;
  
  return (
    <div className="relative">
      <img
        src={robotUrl}
        alt={`${name}'s avatar`}
        className="w-32 h-32 rounded-full object-cover bg-zinc-800 border-4 border-zinc-700"
        loading="lazy"
      />
      {emoji && (
        <span className="absolute -bottom-2 -right-2 text-2xl bg-zinc-900 rounded-full p-1 border-2 border-zinc-700">
          {emoji}
        </span>
      )}
    </div>
  );
}

// Simple URL getter for places that just need the URL
export function getRoboHashUrl(name: string, size: number = 200): string {
  return `https://robohash.org/${encodeURIComponent(name)}.png?set=set1&size=${size}x${size}`;
}
