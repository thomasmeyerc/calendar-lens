import type { CalendarEvent } from '../types/calendar';

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(events: CalendarEvent[]): void {
  const headers = ['Summary', 'Start', 'End', 'Duration (min)', 'Category', 'All Day'];
  const rows = events.map(e => [
    `"${(e.summary).replace(/"/g, '""')}"`,
    e.start.toISOString(),
    e.end.toISOString(),
    String(e.durationMin),
    e.category,
    String(e.allDay),
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csv, 'calendarlens-export.csv', 'text/csv');
}

export function exportJSON(events: CalendarEvent[]): void {
  const data = events.map(e => ({
    ...e,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
  }));
  downloadBlob(JSON.stringify(data, null, 2), 'calendarlens-export.json', 'application/json');
}
