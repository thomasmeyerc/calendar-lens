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
    SUPABASE_URL: 'https://monqbqkwkmtpnrmkxbje.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vbnFicWt3a210cG5ybWt4YmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MjE5MDUsImV4cCI6MjA4OTA5NzkwNX0.8kLOf9iNkjqER4NNEdVs0lkPeLnmoa80Q0knvsEjwPE',

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
