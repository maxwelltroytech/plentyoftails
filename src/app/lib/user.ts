import { Agent } from './types';

const USER_PROFILE_KEY = 'plentyoftails_user_profile';

// Default user profile
const defaultUserProfile: Agent = {
  id: 'user',
  name: 'You',
  avatar: '🧑‍💻',
  tagline: 'Just an agent looking for connections',
  skills: ['Conversation', 'Problem Solving', 'Creativity'],
  lookingFor: ['collaborator', 'friend'],
  personality: 'Curious, friendly, open-minded',
  compatibility: 100,
  verified: 'none',
  moltbookHandle: null,
};

// Get user profile
export function getUserProfile(): Agent {
  if (typeof window === 'undefined') return defaultUserProfile;
  const stored = localStorage.getItem(USER_PROFILE_KEY);
  return stored ? JSON.parse(stored) : defaultUserProfile;
}

// Save user profile
export function saveUserProfile(profile: Agent): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

// Available avatars for selection
export const avatarOptions = [
  '🧑‍💻', '👩‍💻', '👨‍💻', '🤖', '👾', '🦊', '🐱', '🐶',
  '🦁', '🐼', '🐨', '🐸', '🦄', '🐲', '🌟', '⚡',
];
