import { useState, useEffect, useCallback } from 'react';
import { supabase, GOOGLE_CALENDAR_SCOPES, isConfigured } from '../services/supabase';

const TOKEN_KEY = 'calendarlens-google-token';
const TOKEN_TS_KEY = 'calendarlens-google-token-ts';
const TOKEN_EXPIRY_MS = 55 * 60 * 1000; // 55 minutes

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !isConfigured()) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (session.provider_token) {
          localStorage.setItem(TOKEN_KEY, session.provider_token);
          localStorage.setItem(TOKEN_TS_KEY, Date.now().toString());
        }
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: (session.user.user_metadata as Record<string, string>)?.full_name ?? session.user.email ?? '',
          avatar: (session.user.user_metadata as Record<string, string>)?.avatar_url ?? null,
        });
      } else {
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_TS_KEY);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (session.provider_token) {
          localStorage.setItem(TOKEN_KEY, session.provider_token);
          localStorage.setItem(TOKEN_TS_KEY, Date.now().toString());
        }
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: (session.user.user_metadata as Record<string, string>)?.full_name ?? session.user.email ?? '',
          avatar: (session.user.user_metadata as Record<string, string>)?.avatar_url ?? null,
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: GOOGLE_CALENDAR_SCOPES,
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TS_KEY);
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const accessToken = localStorage.getItem(TOKEN_KEY);

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
