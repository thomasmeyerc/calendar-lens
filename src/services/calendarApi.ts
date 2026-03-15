import type { CalendarEvent, GoogleCalendar } from '../types/calendar';
import { APP_CONFIG } from '../types/calendar';
import { categorize } from './categories';

const API_BASE = 'https://www.googleapis.com/calendar/v3';

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') ?? '2', 10);
        await delay(retryAfter * 1000);
        continue;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: { message?: string } };
        const msg = body?.error?.message ?? `HTTP ${response.status}`;
        const err = new Error(msg) as Error & { status: number };
        err.status = response.status;
        throw err;
      }
      return response;
    } catch (err) {
      lastError = err as Error;
      if ((err as Error).message === 'UNAUTHORIZED') throw err;
      if (attempt < maxRetries) await delay(1000 * Math.pow(2, attempt));
    }
  }
  throw lastError!;
}

export async function fetchEvents(
  accessToken: string,
  options: { calendarId?: string; days?: number } = {},
): Promise<CalendarEvent[]> {
  const calendarId = options.calendarId ?? 'primary';
  const days = options.days ?? APP_CONFIG.defaultFetchDays;

  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - days);

  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(APP_CONFIG.maxApiResults),
    timeMin: past.toISOString(),
    timeMax: now.toISOString(),
  });

  const response = await fetchWithRetry(
    `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const data = await response.json() as { items?: GoogleCalendarEvent[] };
  return (data.items ?? []).map(convertEvent).filter((e): e is CalendarEvent => e !== null);
}

export async function listCalendars(accessToken: string): Promise<GoogleCalendar[]> {
  const response = await fetchWithRetry(
    `${API_BASE}/users/me/calendarList`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const data = await response.json() as { items?: GoogleCalendarListEntry[] };
  return (data.items ?? []).map(cal => ({
    id: cal.id,
    name: cal.summary,
    primary: cal.primary ?? false,
    color: cal.backgroundColor ?? '',
  }));
}

interface GoogleCalendarAttendee {
  email?: string;
  displayName?: string;
  self?: boolean;
  organizer?: boolean;
  responseStatus?: string;
}

interface GoogleCalendarEvent {
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  attendees?: GoogleCalendarAttendee[];
  organizer?: { email?: string; displayName?: string };
}

interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

function convertEvent(gcalEvent: GoogleCalendarEvent): CalendarEvent | null {
  const startStr = gcalEvent.start?.dateTime ?? gcalEvent.start?.date;
  const endStr = gcalEvent.end?.dateTime ?? gcalEvent.end?.date;

  if (!startStr) return null;

  const start = new Date(startStr);
  if (isNaN(start.getTime())) return null;

  const end = endStr ? new Date(endStr) : new Date(start.getTime() + 3600000);
  const allDay = !gcalEvent.start?.dateTime;
  const durationMin = allDay ? 0 : Math.round((end.getTime() - start.getTime()) / 60000);
  const summary = gcalEvent.summary ?? '(No Title)';

  const rawAttendees = gcalEvent.attendees ?? [];
  const attendees = rawAttendees.map(a => ({
    email: a.email ?? '',
    name: a.displayName ?? a.email ?? '',
    self: a.self ?? false,
    organizer: a.organizer ?? false,
    status: a.responseStatus ?? 'needsAction',
  }));
  const organizer = gcalEvent.organizer
    ? { email: gcalEvent.organizer.email ?? '', name: gcalEvent.organizer.displayName ?? gcalEvent.organizer.email ?? '' }
    : null;

  return {
    summary,
    start,
    end,
    durationMin,
    allDay,
    description: gcalEvent.description ?? '',
    location: gcalEvent.location ?? '',
    categories: [],
    status: gcalEvent.status ?? 'confirmed',
    category: categorize(summary),
    attendees,
    attendeeCount: attendees.length,
    organizer,
  };
}
