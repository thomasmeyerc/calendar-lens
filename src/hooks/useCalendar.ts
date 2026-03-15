import { useState, useCallback } from 'react';
import type { CalendarEvent, GoogleCalendar } from '../types/calendar';
import { fetchEvents, listCalendars } from '../services/calendarApi';
import { parseICS } from '../services/icsParser';

const EVENTS_CACHE_KEY = 'calendarlens-events';

function saveEventsToCache(events: CalendarEvent[]): void {
  try {
    const serializable = events.map(e => ({
      ...e,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
    }));
    localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(serializable));
  } catch {
    // quota exceeded, silently skip
  }
}

function loadEventsFromCache(): CalendarEvent[] | null {
  const cached = localStorage.getItem(EVENTS_CACHE_KEY);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached) as Array<Omit<CalendarEvent, 'start' | 'end'> & { start: string; end: string }>;
    return parsed.map(e => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
    }));
  } catch {
    return null;
  }
}

export function useCalendar() {
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadEventsFromCache() ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCalendars = useCallback(async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const cals = await listCalendars(accessToken);
      setCalendars(cals);
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 403 || e.message?.includes('not enabled')) {
        setError('The Google Calendar API may not be enabled. Enable it in Google Cloud Console.');
      } else if (e.status === 401 || e.message === 'UNAUTHORIZED') {
        setError('Calendar access was not granted. Please sign in again.');
      } else {
        setError(e.message || 'Failed to load calendars.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEvents = useCallback(async (accessToken: string, calendarIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        calendarIds.map(id => fetchEvents(accessToken, { calendarId: id }).catch(() => [] as CalendarEvent[])),
      );
      const allEvents = results.flat().sort((a, b) => a.start.getTime() - b.start.getTime());
      setEvents(allEvents);
      saveEventsToCache(allEvents);
      return allEvents;
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch events.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const importICS = useCallback((content: string) => {
    const parsed = parseICS(content);
    setEvents(parsed);
    saveEventsToCache(parsed);
    return parsed;
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    localStorage.removeItem(EVENTS_CACHE_KEY);
  }, []);

  return {
    calendars,
    events,
    loading,
    error,
    loadCalendars,
    loadEvents,
    importICS,
    setEvents,
    clearEvents,
  };
}
