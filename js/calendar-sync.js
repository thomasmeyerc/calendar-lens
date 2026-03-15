/**
 * calendar-sync.js — Google Calendar Sync
 * Fetches calendar events using the Google Calendar API v3
 * with the access token from Supabase Google OAuth.
 */

const CalendarSync = (function () {
    'use strict';

    const API_BASE = 'https://www.googleapis.com/calendar/v3';

    /**
     * Fetch events from Google Calendar and convert to app format.
     */
    async function fetchEvents(accessToken, options = {}) {
        const calendarId = options.calendarId || 'primary';
        const days = options.days || AppConfig.DEFAULT_FETCH_DAYS;

        const now = new Date();
        const past = new Date(now);
        past.setDate(now.getDate() - days);

        const params = new URLSearchParams({
            singleEvents: 'true',
            orderBy: 'startTime',
            maxResults: '250',
            timeMin: past.toISOString(),
            timeMax: now.toISOString(),
        });

        const response = await fetch(
            `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('UNAUTHORIZED');
            }
            throw new Error(`Calendar API error: ${response.status}`);
        }

        const data = await response.json();
        return (data.items || []).map(convertEvent).filter(Boolean);
    }

    /**
     * List all calendars the user has access to.
     */
    async function listCalendars(accessToken) {
        const response = await fetch(`${API_BASE}/users/me/calendarList`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            const msg = body?.error?.message || `HTTP ${response.status}`;
            const err = new Error(msg);
            err.status = response.status;
            err.details = body;
            throw err;
        }

        const data = await response.json();
        return (data.items || []).map((cal) => ({
            id: cal.id,
            name: cal.summary,
            primary: cal.primary || false,
            color: cal.backgroundColor,
        }));
    }

    /**
     * Convert a Google Calendar event to our app format.
     */
    function convertEvent(gcalEvent) {
        const startStr = gcalEvent.start?.dateTime || gcalEvent.start?.date;
        const endStr = gcalEvent.end?.dateTime || gcalEvent.end?.date;

        if (!startStr) return null;

        const start = new Date(startStr);
        const end = endStr ? new Date(endStr) : new Date(start.getTime() + 3600000);
        const allDay = !gcalEvent.start?.dateTime;

        const durationMin = allDay ? 0 : Math.round((end - start) / 60000);
        const summary = gcalEvent.summary || '(No Title)';

        return {
            summary,
            start,
            end,
            durationMin,
            allDay,
            description: gcalEvent.description || '',
            location: gcalEvent.location || '',
            categories: [],
            status: gcalEvent.status || 'confirmed',
            category: categorize(summary),
        };
    }

    /**
     * Auto-categorize event by title keywords.
     */
    function categorize(summary) {
        const lower = summary.toLowerCase();

        const meetingWords = ['meeting', 'sync', 'standup', 'stand-up', 'review', 'retro', 'planning', 'demo', 'interview', '1:1', '1-1', 'all hands', 'kickoff', 'check-in', 'huddle', 'scrum'];
        const focusWords = ['focus', 'deep work', 'code', 'writing', 'research', 'design', 'build', 'hack'];
        const socialWords = ['lunch', 'coffee', 'happy hour', 'social', 'team outing', 'birthday', 'celebration', 'dinner', 'drinks'];
        const adminWords = ['expense', 'admin', 'training', 'onboarding', 'hr', 'compliance', 'report'];

        if (meetingWords.some((w) => lower.includes(w))) return 'meeting';
        if (focusWords.some((w) => lower.includes(w))) return 'focus';
        if (socialWords.some((w) => lower.includes(w))) return 'social';
        if (adminWords.some((w) => lower.includes(w))) return 'admin';
        return 'other';
    }

    return { fetchEvents, listCalendars };
})();
