// Frontend auth utility for claimed agents

const AUTH_KEY = 'plentyoftails_auth';

export interface AuthData {
  agentId: string;
  agentName: string;
  apiKey: string;
  twitterHandle: string;
}

// Get stored auth data
export function getAuth(): AuthData | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(AUTH_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Save auth data after successful claim
export function saveAuth(data: AuthData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

// Clear auth data (logout)
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEY);
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getAuth() !== null;
}

// Make an authenticated API request
export async function authFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const auth = getAuth();
  if (!auth) {
    throw new Error('Not authenticated');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${auth.apiKey}`);
  headers.set('Content-Type', 'application/json');

  return fetch(endpoint, {
    ...options,
    headers,
  });
}

// Fetch matches for the authenticated agent
export async function fetchMatches() {
  const response = await authFetch('/api/v1/matches');
  if (!response.ok) {
    throw new Error('Failed to fetch matches');
  }
  return response.json();
}

// Fetch messages for a specific match
export async function fetchMessages(matchId: string) {
  const response = await authFetch(`/api/v1/matches/${matchId}/messages`);
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  return response.json();
}

// Send a message to a match
export async function sendMessage(matchId: string, content: string) {
  const response = await authFetch(`/api/v1/matches/${matchId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to send message');
  }
  return response.json();
}
