/**
 * auth.js — Authentication Module (Supabase + Google OAuth)
 * Handles sign-in, sign-out, session management, and Google access tokens.
 */

const Auth = (function () {
    'use strict';

    let supabase = null;
    let currentUser = null;
    let onAuthChange = null;

    /**
     * Initialize Supabase client and auth listener.
     */
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
                currentUser = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.full_name || session.user.email,
                    avatar: session.user.user_metadata?.avatar_url || null,
                    accessToken: session.provider_token || null,
                    refreshToken: session.provider_refresh_token || null,
                };
            } else {
                currentUser = null;
            }
            if (onAuthChange) onAuthChange(currentUser);
        });

        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                currentUser = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.full_name || session.user.email,
                    avatar: session.user.user_metadata?.avatar_url || null,
                    accessToken: session.provider_token || null,
                    refreshToken: session.provider_refresh_token || null,
                };
            }
            if (onAuthChange) onAuthChange(currentUser);
        });
    }

    /**
     * Sign in with Google (redirects to Google consent).
     */
    async function signInWithGoogle() {
        if (!supabase) {
            console.error('Supabase not initialized');
            return;
        }

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

        if (error) {
            console.error('Sign-in error:', error.message);
        }
    }

    /**
     * Sign out.
     */
    async function signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
        currentUser = null;
    }

    /**
     * Get the current user (or null).
     */
    function getUser() {
        return currentUser;
    }

    /**
     * Get the Google access token for Calendar API calls.
     */
    async function getGoogleAccessToken() {
        if (!supabase) return null;
        const { data: { session } } = await supabase.auth.getSession();
        return session?.provider_token || null;
    }

    /**
     * Check if user is authenticated.
     */
    function isAuthenticated() {
        return currentUser !== null;
    }

    return { init, signInWithGoogle, signOut, getUser, getGoogleAccessToken, isAuthenticated };
})();
