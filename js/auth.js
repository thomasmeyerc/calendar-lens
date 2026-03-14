/**
 * auth.js — Authentication Module (Supabase + Google OAuth)
 * Handles sign-in, sign-out, session management, and Google access tokens.
 * Persists Google provider_token in sessionStorage since Supabase only
 * returns it on the initial OAuth callback.
 */

const Auth = (function () {
    'use strict';

    const TOKEN_KEY = 'calendarlens-google-token';
    let supabase = null;
    let currentUser = null;
    let onAuthChange = null;

    function init(callback) {
        onAuthChange = callback;

        if (!AppConfig.isConfigured()) {
            console.warn('Supabase not configured. Running in offline mode.');
            if (onAuthChange) onAuthChange(null);
            return;
        }

        supabase = window.supabase.createClient(
            AppConfig.SUPABASE_URL,
            AppConfig.SUPABASE_ANON_KEY
        );

        // Listen for auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                // Capture provider_token on initial sign-in (only available once)
                if (session.provider_token) {
                    sessionStorage.setItem(TOKEN_KEY, session.provider_token);
                }

                currentUser = buildUser(session);
            } else {
                currentUser = null;
                sessionStorage.removeItem(TOKEN_KEY);
            }
            if (onAuthChange) onAuthChange(currentUser);
        });

        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                if (session.provider_token) {
                    sessionStorage.setItem(TOKEN_KEY, session.provider_token);
                }
                currentUser = buildUser(session);
            }
            if (onAuthChange) onAuthChange(currentUser);
        });
    }

    function buildUser(session) {
        return {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email,
            avatar: session.user.user_metadata?.avatar_url || null,
        };
    }

    async function signInWithGoogle() {
        if (!supabase) return;

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: AppConfig.GOOGLE_CALENDAR_SCOPES.join(' '),
                redirectTo: window.location.origin + window.location.pathname,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        if (error) console.error('Sign-in error:', error.message);
    }

    async function signOut() {
        if (!supabase) return;
        sessionStorage.removeItem(TOKEN_KEY);
        await supabase.auth.signOut();
        currentUser = null;
    }

    function getUser() {
        return currentUser;
    }

    /**
     * Get the Google access token — from sessionStorage (persisted on callback).
     */
    function getGoogleAccessToken() {
        return sessionStorage.getItem(TOKEN_KEY);
    }

    function isAuthenticated() {
        return currentUser !== null;
    }

    return { init, signInWithGoogle, signOut, getUser, getGoogleAccessToken, isAuthenticated };
})();
