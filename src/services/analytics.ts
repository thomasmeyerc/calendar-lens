import type {
  CalendarEvent,
  AnalyticsReport,
  ReportSummary,
  CategoryBreakdown,
  DailyHours,
  WeeklyTrend,
  HeatmapData,
  DurationBucket,
  EventCategory,
} from '../types/calendar';
import { APP_CONFIG } from '../types/calendar';

export function generateReport(events: CalendarEvent[]): AnalyticsReport {
  // Filter out events with invalid dates
  const validEvents = events.filter(
    e => e && e.start instanceof Date && !isNaN(e.start.getTime()) &&
      (e.allDay || (e.end instanceof Date && !isNaN(e.end.getTime())))
  );
  const timedEvents = validEvents.filter(e => !e.allDay);

  return {
    summary: computeSummary(validEvents, timedEvents),
    categoryBreakdown: computeCategoryBreakdown(timedEvents),
    dailyHours: computeDailyHours(timedEvents),
    weeklyTrend: computeWeeklyTrend(timedEvents),
    heatmap: computeHeatmap(timedEvents),
    durationDistribution: computeDurationDistribution(timedEvents),
    recentEvents: getRecentEvents(validEvents, APP_CONFIG.maxEventsDisplay),
    dateRange: getDateRange(validEvents),
  };
}

function computeSummary(allEvents: CalendarEvent[], timedEvents: CalendarEvent[]): ReportSummary {
  const totalEvents = allEvents.length;
  const totalMinutes = timedEvents.reduce((sum, e) => sum + e.durationMin, 0);
  const totalHours = totalMinutes / 60;
  const avgDurationMin = timedEvents.length > 0
    ? Math.round(totalMinutes / timedEvents.length)
    : 0;

  const range = getDateRange(allEvents);
  const daySpan = Math.max(1, Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)));
  const weekSpan = Math.max(1, daySpan / 7);
  const weeklyMeetingHours = totalHours / weekSpan;
  const meetingLoad = Math.min(100, Math.round((weeklyMeetingHours / APP_CONFIG.workHoursPerWeek) * 100));

  return {
    totalEvents,
    totalHours: Math.round(totalHours * 10) / 10,
    avgDurationMin,
    meetingLoad,
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  meeting: 'Meetings',
  focus: 'Focus Time',
  social: 'Social',
  admin: 'Admin',
  other: 'Other',
};

function formatCategoryLabel(key: string): string {
  return CATEGORY_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

function computeCategoryBreakdown(events: CalendarEvent[]): CategoryBreakdown[] {
  const categories: Record<string, CategoryBreakdown> = {};
  for (const event of events) {
    const cat = event.category || 'other';
    if (!categories[cat]) {
      categories[cat] = { label: formatCategoryLabel(cat), minutes: 0, count: 0, hours: 0, key: cat as EventCategory };
    }
    categories[cat].minutes += event.durationMin;
    categories[cat].count += 1;
  }

  return Object.values(categories)
    .map(c => ({ ...c, hours: Math.round(c.minutes / 6) / 10 }))
    .sort((a, b) => b.minutes - a.minutes);
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function computeDailyHours(events: CalendarEvent[]): DailyHours[] {
  const days: Record<string, DailyHours> = {};
  for (const event of events) {
    const dayKey = formatDateKey(event.start);
    if (!days[dayKey]) {
      days[dayKey] = { date: dayKey, minutes: 0, label: formatDayLabel(event.start), hours: 0 };
    }
    days[dayKey].minutes += event.durationMin;
  }

  return Object.values(days)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({ ...d, hours: Math.round(d.minutes / 6) / 10 }));
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return formatDateKey(d);
}

function computeWeeklyTrend(events: CalendarEvent[]): WeeklyTrend[] {
  const weeks: Record<string, WeeklyTrend> = {};
  for (const event of events) {
    const weekKey = getWeekKey(event.start);
    if (!weeks[weekKey]) {
      weeks[weekKey] = { week: weekKey, minutes: 0, label: weekKey, hours: 0 };
    }
    weeks[weekKey].minutes += event.durationMin;
  }

  return Object.values(weeks)
    .sort((a, b) => a.week.localeCompare(b.week))
    .map(w => ({ ...w, hours: Math.round(w.minutes / 6) / 10 }));
}

function computeHeatmap(events: CalendarEvent[]): HeatmapData {
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);

  for (const event of events) {
    const dayIdx = (event.start.getDay() + 6) % 7; // Mon=0, Sun=6
    const hour = event.start.getHours();
    const endHour = Math.min(23, hour + Math.ceil(event.durationMin / 60));
    for (let h = hour; h <= endHour; h++) {
      grid[dayIdx]![h]!++;
    }
  }

  return {
    grid,
    maxValue: Math.max(1, ...grid.flat()),
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  };
}

function computeDurationDistribution(events: CalendarEvent[]): DurationBucket[] {
  const buckets: DurationBucket[] = [
    { label: '< 15m', min: 0, max: 15, count: 0 },
    { label: '15-30m', min: 15, max: 30, count: 0 },
    { label: '30-60m', min: 30, max: 60, count: 0 },
    { label: '1-2h', min: 60, max: 120, count: 0 },
    { label: '2-4h', min: 120, max: 240, count: 0 },
    { label: '4h+', min: 240, max: Infinity, count: 0 },
  ];

  for (const event of events) {
    for (const bucket of buckets) {
      if (event.durationMin >= bucket.min && event.durationMin < bucket.max) {
        bucket.count++;
        break;
      }
    }
  }

  return buckets;
}

function getRecentEvents(events: CalendarEvent[], n: number): CalendarEvent[] {
  return [...events]
    .sort((a, b) => b.start.getTime() - a.start.getTime())
    .slice(0, n);
}

function getDateRange(events: CalendarEvent[]): { start: Date; end: Date } {
  if (events.length === 0) return { start: new Date(), end: new Date() };
  const start = new Date(Math.min(...events.map(e => e.start.getTime())));
  // BUG FIX: use e.end instead of e.start for end bound
  const end = new Date(Math.max(...events.map(e => (e.end || e.start).getTime())));
  return { start, end };
}
