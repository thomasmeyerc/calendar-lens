import type { CalendarEvent } from '../types/calendar';
import { categorize } from './categories';

interface RawEvent {
  summary?: string;
  start?: Date;
  end?: Date;
  allDay?: boolean;
  description?: string;
  location?: string;
  categories?: string[];
  status?: string;
}

export function parseICS(icsContent: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = unfoldLines(icsContent);
  let currentEvent: RawEvent | null = null;
  let inEvent = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      continue;
    }

    if (trimmed === 'END:VEVENT') {
      if (currentEvent?.start && !isNaN(currentEvent.start.getTime())) {
        events.push(normalizeEvent(currentEvent));
      }
      inEvent = false;
      currentEvent = null;
      continue;
    }

    if (inEvent && currentEvent) {
      const { key, value } = parseLine(trimmed);
      switch (key) {
        case 'SUMMARY':
          currentEvent.summary = value;
          break;
        case 'DTSTART':
        case 'DTSTART;VALUE=DATE':
          currentEvent.start = parseICSDate(value);
          currentEvent.allDay = value.length <= 8;
          break;
        case 'DTEND':
        case 'DTEND;VALUE=DATE':
          currentEvent.end = parseICSDate(value);
          break;
        case 'DESCRIPTION':
          currentEvent.description = value;
          break;
        case 'LOCATION':
          currentEvent.location = value;
          break;
        case 'CATEGORIES':
          currentEvent.categories = value.split(',').map(c => c.trim());
          break;
        case 'STATUS':
          currentEvent.status = value;
          break;
      }

      // Handle DTSTART/DTEND with timezone parameter
      if (key.startsWith('DTSTART;') && !currentEvent.start) {
        currentEvent.start = parseICSDate(value);
        currentEvent.allDay = value.length <= 8;
      }
      if (key.startsWith('DTEND;') && !currentEvent.end) {
        currentEvent.end = parseICSDate(value);
      }
    }
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function unfoldLines(content: string): string[] {
  return content.replace(/\r\n /g, '').replace(/\r\n\t/g, '').split(/\r?\n/);
}

function parseLine(line: string): { key: string; value: string } {
  const colonIdx = line.indexOf(':');
  if (colonIdx === -1) return { key: line, value: '' };
  return {
    key: line.substring(0, colonIdx).toUpperCase(),
    value: line.substring(colonIdx + 1),
  };
}

function parseICSDate(dateStr: string): Date {
  const clean = dateStr.replace(/[^0-9TZ]/g, '');

  if (clean.length === 8) {
    const y = parseInt(clean.substring(0, 4));
    const m = parseInt(clean.substring(4, 6)) - 1;
    const d = parseInt(clean.substring(6, 8));
    return new Date(y, m, d);
  }

  const y = parseInt(clean.substring(0, 4));
  const m = parseInt(clean.substring(4, 6)) - 1;
  const d = parseInt(clean.substring(6, 8));
  const h = parseInt(clean.substring(9, 11)) || 0;
  const min = parseInt(clean.substring(11, 13)) || 0;
  const s = parseInt(clean.substring(13, 15)) || 0;

  if (clean.endsWith('Z')) {
    return new Date(Date.UTC(y, m, d, h, min, s));
  }
  return new Date(y, m, d, h, min, s);
}

function normalizeEvent(raw: RawEvent): CalendarEvent {
  const start = raw.start!;
  const end = raw.end ?? new Date(start.getTime() + 3600000);
  const durationMs = end.getTime() - start.getTime();
  const durationMin = Math.max(0, Math.round(durationMs / 60000));

  return {
    summary: raw.summary || '(No Title)',
    start,
    end,
    durationMin,
    allDay: raw.allDay ?? false,
    description: raw.description ?? '',
    location: raw.location ?? '',
    categories: raw.categories ?? [],
    status: raw.status ?? 'CONFIRMED',
    category: categorize(raw.summary ?? '', raw.description ?? '', raw.categories ?? []),
  };
}
