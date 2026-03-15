import { useMemo, useState, useCallback } from 'react';
import type { CalendarEvent, AnalyticsReport } from '../types/calendar';
import { generateReport } from '../services/analytics';

export function useAnalytics(events: CalendarEvent[]) {
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);

  const filteredEvents = useMemo(() => {
    if (!dateRange) return events;
    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    to.setHours(23, 59, 59, 999);
    return events.filter(e => e.start >= from && e.start <= to);
  }, [events, dateRange]);

  const report: AnalyticsReport | null = useMemo(() => {
    if (filteredEvents.length === 0) return null;
    return generateReport(filteredEvents);
  }, [filteredEvents]);

  const resetDateRange = useCallback(() => setDateRange(null), []);

  return { report, dateRange, setDateRange, resetDateRange, filteredEvents };
}
