import { useState, useEffect, useCallback, useRef } from 'react';
import { GOOGLE_CLIENT_ID, GOOGLE_CALENDAR_SCOPES, isConfigured } from '../services/config';

const TOKEN_KEY = 'calendarlens-google-token';
const TOKEN_TS_KEY = 'calendarlens-google-token-ts';
const TOKEN_EXPIRY_MS = 55 * 60 * 1000; // 55 minutes

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
          }) => TokenClient;
          revoke: (token: string, callback?: () => void) => void;
        };
      };
    };
  }
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

async function fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user info');
  return res.json() as Promise<GoogleUserInfo>;
}

function getSavedToken(): string | null {
  const savedToken = localStorage.getItem(TOKEN_KEY);
  const savedTs = localStorage.getItem(TOKEN_TS_KEY);
  if (savedToken && savedTs && (Date.now() - parseInt(savedTs, 10)) < TOKEN_EXPIRY_MS) {
    return savedToken;
  }
  // Clean up expired tokens
  if (savedToken) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TS_KEY);
  }
  return null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getSavedToken());
  const [loading, setLoading] = useState(true);
  const tokenClientRef = useRef<TokenClient | null>(null);
  const signInResolveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    if (accessToken) {
      fetchUserInfo(accessToken)
        .then(info => {
          setUser({ id: info.sub, email: info.email, name: info.name, avatar: info.picture ?? null });
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(TOKEN_TS_KEY);
          setAccessToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    loadGisScript().then(() => {
      if (!window.google) return;
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_CALENDAR_SCOPES + ' openid email profile',
        callback: async (response: TokenResponse) => {
          if (response.error) {
            signInResolveRef.current?.();
            signInResolveRef.current = null;
            return;
          }
          localStorage.setItem(TOKEN_KEY, response.access_token);
          localStorage.setItem(TOKEN_TS_KEY, Date.now().toString());
          setAccessToken(response.access_token);
          try {
            const info = await fetchUserInfo(response.access_token);
            setUser({ id: info.sub, email: info.email, name: info.name, avatar: info.picture ?? null });
          } catch {
            // Token is valid even if userinfo fails
          }
          signInResolveRef.current?.();
          signInResolveRef.current = null;
        },
      });
    });
  // Run only on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (!tokenClientRef.current) {
        resolve();
        return;
      }
      signInResolveRef.current = resolve;
      tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
    });
  }, []);

  const signOut = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && window.google) {
      window.google.accounts.oauth2.revoke(token);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TS_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  const isTokenExpired = useCallback((): boolean => {
    const ts = localStorage.getItem(TOKEN_TS_KEY);
    if (!ts) return true;
    return Date.now() - parseInt(ts, 10) > TOKEN_EXPIRY_MS;
  }, []);

  return {
    user,
    loading,
    accessToken,
    isAuthenticated: user !== null,
    isConfigured: isConfigured(),
    signIn,
    signOut,
    isTokenExpired,
  };
}
