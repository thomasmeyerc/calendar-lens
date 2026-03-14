/**
 * config.js — Application Configuration
 *
 * To set up:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Enable Google Auth provider in Authentication > Providers
 * 3. Add your Google OAuth Client ID & Secret
 * 4. Add calendar scope: https://www.googleapis.com/auth/calendar.readonly
 * 5. Fill in the values below
 */

const AppConfig = {
    // Supabase project credentials
    SUPABASE_URL: '', // e.g., 'https://xxxxx.supabase.co'
    SUPABASE_ANON_KEY: '', // e.g., 'eyJhbGciOi...'

    // Google Calendar API
    GOOGLE_CALENDAR_SCOPES: [
        'https://www.googleapis.com/auth/calendar.readonly'
    ],

    // App settings
    MAX_EVENTS_DISPLAY: 25,
    DEFAULT_FETCH_DAYS: 60,

    /**
     * Check if the app is properly configured.
     */
    isConfigured() {
        return this.SUPABASE_URL !== '' && this.SUPABASE_ANON_KEY !== '';
    }
};
