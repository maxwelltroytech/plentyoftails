'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Agent } from '../lib/types';
import { getUserProfile, saveUserProfile, avatarOptions } from '../lib/user';
import { getMatches } from '../lib/storage';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Agent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    const userProfile = getUserProfile();
    setProfile(userProfile);
    setMatchCount(getMatches().length);
  }, []);

  const handleSave = () => {
    if (profile) {
      saveUserProfile(profile);
      setIsEditing(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && profile) {
      setProfile({
        ...profile,
        skills: [...profile.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    if (profile) {
      setProfile({
        ...profile,
        skills: profile.skills.filter(s => s !== skillToRemove),
      });
    }
  };

  const toggleLookingFor = (tag: string) => {
    if (profile) {
      const current = profile.lookingFor || [];
      setProfile({
        ...profile,
        lookingFor: current.includes(tag)
          ? current.filter(t => t !== tag)
          : [...current, tag],
      });
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-4xl animate-pulse">🧑</div>
      </div>
    );
  }

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
          <span className="text-xl">🧑</span>
          <span className="text-lg font-semibold text-white/80">Profile</span>
        </div>
        {isEditing ? (
          <button onClick={handleSave} className="text-green-400 font-semibold">
            Save
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="text-white/60 hover:text-white">
            Edit
          </button>
        )}
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Avatar & Name */}
        <div className="text-center mb-8">
          <button
            onClick={() => isEditing && setShowAvatarPicker(true)}
            className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center text-6xl mb-4 ${
              isEditing ? 'ring-4 ring-pink-500 ring-offset-4 ring-offset-zinc-950 cursor-pointer' : ''
            }`}
          >
            {profile.avatar}
          </button>
          {isEditing ? (
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="text-2xl font-bold text-center bg-transparent border-b-2 border-pink-500 focus:outline-none w-full max-w-xs mx-auto"
            />
          ) : (
            <h1 className="text-2xl font-bold">{profile.name}</h1>
          )}
          <p className="text-white/40 mt-1">{matchCount} matches</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">
              {profile.compatibility || 0}%
            </div>
            <div className="text-white/40 text-xs">Avg Match</div>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
              {matchCount}
            </div>
            <div className="text-white/40 text-xs">Matches</div>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
              {profile.skills.length}
            </div>
            <div className="text-white/40 text-xs">Skills</div>
          </div>
        </div>

        {/* Tagline */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Tagline</h2>
          {isEditing ? (
            <input
              type="text"
              value={profile.tagline}
              onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
              placeholder="Add a catchy tagline..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-pink-500 focus:outline-none"
            />
          ) : (
            <p className="text-white/80 italic">"{profile.tagline || 'No tagline yet'}"</p>
          )}
        </div>

        {/* Skills */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Skills</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-2 bg-white/10 text-white text-sm px-3 py-1.5 rounded-full"
              >
                {skill}
                {isEditing && (
                  <button onClick={() => removeSkill(skill)} className="text-white/40 hover:text-white">
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                placeholder="Add a skill..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
              />
              <button
                onClick={addSkill}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-semibold rounded-xl"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Looking For */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Looking For</h2>
          <div className="flex flex-wrap gap-2">
            {['collaborator', 'friend', 'mentor'].map((tag) => {
              const isSelected = profile.lookingFor?.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => isEditing && toggleLookingFor(tag)}
                  disabled={!isEditing}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                      : 'bg-zinc-900 text-white/60 border border-zinc-800'
                  } ${isEditing ? 'cursor-pointer hover:scale-105' : ''}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 mt-8">
          <Link
            href="/swipe"
            className="block w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-center font-bold rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all"
          >
            Start Swiping 🔥
          </Link>
          <Link
            href="/messages"
            className="block w-full py-4 bg-zinc-900 text-white/80 text-center font-semibold rounded-xl hover:bg-zinc-800 transition-colors border border-zinc-800"
          >
            View Messages 💬
          </Link>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAvatarPicker(false)}>
          <div className="bg-zinc-900 rounded-3xl p-6 max-w-sm w-full border border-zinc-800" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4 text-center">Choose Avatar</h2>
            <div className="grid grid-cols-5 gap-3">
              {avatarOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setProfile({ ...profile, avatar: emoji });
                    setShowAvatarPicker(false);
                  }}
                  className={`w-14 h-14 rounded-xl text-3xl flex items-center justify-center transition-all ${
                    profile.avatar === emoji
                      ? 'bg-gradient-to-br from-orange-500 to-pink-500 scale-110'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
