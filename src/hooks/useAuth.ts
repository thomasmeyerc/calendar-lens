import { useState, useEffect, useCallback } from 'react';
import { GOOGLE_CLIENT_ID, GOOGLE_CALENDAR_SCOPES, isConfigured, getConfigError } from '../services/config';

const TOKEN_KEY = 'calendarlens-google-token';
const TOKEN_TS_KEY = 'calendarlens-google-token-ts';
const TOKEN_EXPIRY_MS = 55 * 60 * 1000; // 55 minutes
const OAUTH_STATE_KEY = 'calendarlens-oauth-state';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const OAUTH_SCOPES = GOOGLE_CALENDAR_SCOPES + ' openid email profile';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
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
  if (savedToken) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TS_KEY);
  }
  return null;
}

function getRedirectUri(): string {
  return window.location.origin + window.location.pathname;
}

function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function parseHashParams(): Record<string, string> | null {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;

  const params: Record<string, string> = {};
  const pairs = hash.substring(1).split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }
  return Object.keys(params).length > 0 ? params : null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getSavedToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle OAuth redirect callback on mount
  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    // Check for OAuth redirect response in URL hash
    const hashParams = parseHashParams();
    if (hashParams?.access_token) {
      // Validate state parameter
      const savedState = sessionStorage.getItem(OAUTH_STATE_KEY);
      sessionStorage.removeItem(OAUTH_STATE_KEY);

      if (savedState && hashParams.state !== savedState) {
        console.error('[CalendarLens] OAuth state mismatch');
        setError('Sign-in failed: security validation error. Please try again.');
        setLoading(false);
        history.replaceState(null, '', window.location.pathname + window.location.search);
        return;
      }

      // Store token
      const token = hashParams.access_token;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_TS_KEY, Date.now().toString());
      setAccessToken(token);

      // Clean up the URL hash
      history.replaceState(null, '', window.location.pathname + window.location.search);

      // Fetch user info
      fetchUserInfo(token)
        .then(info => {
          setUser({ id: info.sub, email: info.email, name: info.name, avatar: info.picture ?? null });
        })
        .catch(() => {
          // Token is valid even if userinfo fails
        })
        .finally(() => setLoading(false));
      return;
    }

    if (hashParams?.error) {
      console.error('[CalendarLens] OAuth error:', hashParams.error, hashParams.error_description);
      setError(hashParams.error_description || hashParams.error || 'Sign-in failed.');
      history.replaceState(null, '', window.location.pathname + window.location.search);
      setLoading(false);
      return;
    }

    // No redirect response - check for existing saved token
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback((): Promise<{ success: boolean; error?: string }> => {
    if (!isConfigured()) {
      return Promise.resolve({ success: false, error: 'Google sign-in is not configured.' });
    }

    // Generate and save state for CSRF protection
    const state = generateState();
    sessionStorage.setItem(OAUTH_STATE_KEY, state);

    // Build OAuth2 authorization URL
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: getRedirectUri(),
      response_type: 'token',
      scope: OAUTH_SCOPES,
      state,
      prompt: 'consent',
      include_granted_scopes: 'true',
    });

    // Redirect to Google OAuth
    window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`;

    // This promise won't resolve since we're navigating away,
    // but return it to keep the interface consistent
    return new Promise(() => {});
  }, []);

  const signOut = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }).catch(() => {
        // Best-effort revocation
      });
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TS_KEY);
    setAccessToken(null);
    setUser(null);
    setError(null);
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
    error,
    isAuthenticated: user !== null,
    isConfigured: isConfigured(),
    configError: getConfigError(),
    signIn,
    signOut,
    setError,
    isTokenExpired,
  };
}
